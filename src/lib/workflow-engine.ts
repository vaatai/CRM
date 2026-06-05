import { WorkflowTrigger, WorkflowActionType } from '@prisma/client';

import { prisma } from './prisma';
import { resend, FROM_EMAIL } from './resend';
import { logger } from './logger';

// ─── Trigger types ──────────────────────────────────────────────────────────

export interface TriggerPayload {
  trigger: WorkflowTrigger;
  organizationId: string;
  userId: string;
  data: Record<string, unknown>;
}

// ─── Action configs (JSON stored in WorkflowStep.config) ────────────────────

export interface SendEmailConfig {
  to: string;
  subject: string;
  body: string;
}

export interface CreateTaskConfig {
  title: string;
  description?: string;
  priority?: string;
  type?: string;
  dueInDays?: number;
  assigneeId?: string;
}

export interface SendNotificationConfig {
  title: string;
  message: string;
  userIds?: string[];
}

export interface WebhookConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
}

// ─── Template variable substitution ─────────────────────────────────────────

function interpolate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const parts = path.split('.');
    let current: unknown = vars;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return `{{${path}}}`;
      }
    }
    return String(current ?? '');
  });
}

// ─── Action executors ───────────────────────────────────────────────────────

async function executeSendEmail(
  config: SendEmailConfig,
  vars: Record<string, unknown>
): Promise<string> {
  const to = interpolate(config.to, vars);
  const subject = interpolate(config.subject, vars);
  const body = interpolate(config.body, vars);

  if (resend) {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: body,
    });
    return JSON.stringify(result);
  }

  logger.info('Email action (demo mode)', { to, subject });
  return JSON.stringify({ demo: true, to, subject });
}

async function executeCreateTask(
  config: CreateTaskConfig,
  vars: Record<string, unknown>,
  organizationId: string,
  userId: string
): Promise<string> {
  const title = interpolate(config.title, vars);
  const description = config.description ? interpolate(config.description, vars) : null;

  const dueDate = config.dueInDays
    ? new Date(Date.now() + config.dueInDays * 86400000)
    : null;

  const task = await prisma.task.create({
    data: {
      organizationId,
      createdById: userId,
      assigneeId: config.assigneeId || userId,
      title,
      description,
      priority: (config.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
      type: (config.type as 'CALL' | 'MEETING' | 'EMAIL' | 'FOLLOW_UP') || 'FOLLOW_UP',
      dueDate,
    },
  });

  return JSON.stringify({ taskId: task.id, title: task.title });
}

async function executeSendNotification(
  config: SendNotificationConfig,
  vars: Record<string, unknown>,
  organizationId: string,
  userId: string
): Promise<string> {
  const title = interpolate(config.title, vars);
  const message = interpolate(config.message, vars);
  const targetUserIds = config.userIds?.length ? config.userIds : [userId];

  const notifications = await prisma.notification.createMany({
    data: targetUserIds.map((uid) => ({
      organizationId,
      userId: uid,
      title,
      message,
      type: 'workflow',
    })),
  });

  return JSON.stringify({ count: notifications.count });
}

async function executeWebhook(
  config: WebhookConfig,
  vars: Record<string, unknown>
): Promise<string> {
  const url = interpolate(config.url, vars);
  const method = config.method || 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(config.headers || {}),
    },
    body: method !== 'GET' ? JSON.stringify(vars) : undefined,
  });

  return JSON.stringify({
    status: response.status,
    statusText: response.statusText,
  });
}

// ─── Main engine: fire trigger → find matching workflows → execute steps ────

export async function fireTrigger(payload: TriggerPayload): Promise<void> {
  const { trigger, organizationId, userId, data } = payload;

  const workflows = await prisma.workflow.findMany({
    where: {
      organizationId,
      trigger,
      isActive: true,
    },
    include: {
      steps: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (workflows.length === 0) return;

  logger.info('Workflow trigger fired', {
    trigger,
    organizationId,
    matchedWorkflows: workflows.length,
  });

  for (const workflow of workflows) {
    // Check trigger config conditions
    if (workflow.triggerConfig) {
      try {
        const triggerConfig = JSON.parse(workflow.triggerConfig) as Record<string, unknown>;
        if (!matchesTriggerConfig(trigger, triggerConfig, data)) {
          continue;
        }
      } catch {
        logger.warn('Invalid trigger config', { workflowId: workflow.id });
      }
    }

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: 'RUNNING',
        triggerData: JSON.stringify(data),
      },
    });

    let allSucceeded = true;

    for (const step of workflow.steps) {
      const stepLog = await prisma.workflowStepLog.create({
        data: {
          executionId: execution.id,
          stepId: step.id,
          status: 'RUNNING',
        },
      });

      try {
        const config = JSON.parse(step.config) as Record<string, unknown>;
        let output: string;

        switch (step.actionType) {
          case 'SEND_EMAIL':
            output = await executeSendEmail(config as unknown as SendEmailConfig, data);
            break;
          case 'CREATE_TASK':
            output = await executeCreateTask(
              config as unknown as CreateTaskConfig,
              data,
              organizationId,
              userId
            );
            break;
          case 'SEND_NOTIFICATION':
            output = await executeSendNotification(
              config as unknown as SendNotificationConfig,
              data,
              organizationId,
              userId
            );
            break;
          case 'WEBHOOK':
            output = await executeWebhook(config as unknown as WebhookConfig, data);
            break;
          default:
            output = JSON.stringify({ error: 'Unknown action type' });
        }

        await prisma.workflowStepLog.update({
          where: { id: stepLog.id },
          data: { status: 'COMPLETED', output, completedAt: new Date() },
        });
      } catch (err) {
        allSucceeded = false;
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error('Workflow step failed', {
          executionId: execution.id,
          stepId: step.id,
          error: errorMessage,
        });

        await prisma.workflowStepLog.update({
          where: { id: stepLog.id },
          data: { status: 'FAILED', error: errorMessage, completedAt: new Date() },
        });
      }
    }

    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: allSucceeded ? 'COMPLETED' : 'FAILED',
        completedAt: new Date(),
        error: allSucceeded ? null : 'One or more steps failed',
      },
    });

    logger.info('Workflow execution completed', {
      workflowId: workflow.id,
      executionId: execution.id,
      status: allSucceeded ? 'COMPLETED' : 'FAILED',
    });
  }
}

// ─── Trigger config matching ────────────────────────────────────────────────

function matchesTriggerConfig(
  trigger: WorkflowTrigger,
  config: Record<string, unknown>,
  data: Record<string, unknown>
): boolean {
  switch (trigger) {
    case 'LEAD_STATUS_CHANGED': {
      const { fromStatus, toStatus } = config;
      if (fromStatus && data.previousStatus !== fromStatus) return false;
      if (toStatus && data.newStatus !== toStatus) return false;
      return true;
    }
    case 'LEAD_ASSIGNED': {
      return true;
    }
    case 'DEAL_WON': {
      const { minValue } = config;
      if (minValue && typeof data.value === 'number' && data.value < Number(minValue)) return false;
      return true;
    }
    case 'TASK_OVERDUE': {
      return true;
    }
    default:
      return true;
  }
}

// ─── Trigger helpers for route integration ──────────────────────────────────

export function triggerLeadAssigned(
  organizationId: string,
  userId: string,
  data: { leadId: string; leadTitle: string; assigneeId: string; assigneeName: string }
) {
  fireTrigger({
    trigger: 'LEAD_ASSIGNED',
    organizationId,
    userId,
    data,
  }).catch((err) => logger.error('Failed to fire LEAD_ASSIGNED trigger', { error: String(err) }));
}

export function triggerLeadStatusChanged(
  organizationId: string,
  userId: string,
  data: {
    leadId: string;
    leadTitle: string;
    previousStatus: string;
    newStatus: string;
  }
) {
  fireTrigger({
    trigger: 'LEAD_STATUS_CHANGED',
    organizationId,
    userId,
    data,
  }).catch((err) =>
    logger.error('Failed to fire LEAD_STATUS_CHANGED trigger', { error: String(err) })
  );
}

export function triggerDealWon(
  organizationId: string,
  userId: string,
  data: { dealId: string; dealTitle: string; value: number; contactName?: string }
) {
  fireTrigger({
    trigger: 'DEAL_WON',
    organizationId,
    userId,
    data,
  }).catch((err) => logger.error('Failed to fire DEAL_WON trigger', { error: String(err) }));
}

export function triggerTaskOverdue(
  organizationId: string,
  userId: string,
  data: { taskId: string; taskTitle: string; dueDate: string; assigneeName: string }
) {
  fireTrigger({
    trigger: 'TASK_OVERDUE',
    organizationId,
    userId,
    data,
  }).catch((err) =>
    logger.error('Failed to fire TASK_OVERDUE trigger', { error: String(err) })
  );
}

// ─── Exported constants for UI ──────────────────────────────────────────────

export const TRIGGER_LABELS: Record<WorkflowTrigger, string> = {
  LEAD_ASSIGNED: 'Lead Assigned',
  LEAD_STATUS_CHANGED: 'Lead Status Changed',
  DEAL_WON: 'Deal Won',
  TASK_OVERDUE: 'Task Overdue',
};

export const ACTION_TYPE_LABELS: Record<WorkflowActionType, string> = {
  SEND_EMAIL: 'Send Email',
  CREATE_TASK: 'Create Task',
  SEND_NOTIFICATION: 'Send Notification',
  WEBHOOK: 'Webhook',
};
