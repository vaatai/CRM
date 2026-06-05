import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
import type { WorkflowActionType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'lead');
    const { id } = await context.params;

    const workflow = await prisma.workflow.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        steps: { orderBy: { sortOrder: 'asc' } },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          include: {
            stepLogs: {
              include: { step: { select: { actionType: true, sortOrder: true } } },
            },
          },
        },
        _count: { select: { executions: true } },
      },
    });

    if (!workflow) {
      throw new NotFoundError('Workflow');
    }

    return successResponse(workflow);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'update', 'lead');
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.workflow.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!existing) {
      throw new NotFoundError('Workflow');
    }

    const { name, description, trigger, triggerConfig, isActive, steps } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new ValidationError('Workflow name cannot be empty');
      }
      data.name = name.trim();
    }
    if (description !== undefined) data.description = description?.trim() || null;
    if (trigger !== undefined) data.trigger = trigger;
    if (triggerConfig !== undefined) {
      data.triggerConfig = triggerConfig ? JSON.stringify(triggerConfig) : null;
    }
    if (isActive !== undefined) data.isActive = isActive;

    // Update steps if provided (replace all)
    if (Array.isArray(steps)) {
      await prisma.$transaction(async (tx) => {
        await tx.workflowStep.deleteMany({ where: { workflowId: id } });
        if (steps.length > 0) {
          await tx.workflowStep.createMany({
            data: steps.map(
              (step: { actionType: string; config: Record<string, unknown> }, idx: number) => ({
                workflowId: id,
                actionType: step.actionType as WorkflowActionType,
                config: JSON.stringify(step.config),
                sortOrder: idx,
              })
            ),
          });
        }
      });
    }

    const workflow = await prisma.workflow.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        steps: { orderBy: { sortOrder: 'asc' } },
      },
    });

    logger.info('Workflow updated', { workflowId: workflow.id });

    return successResponse(workflow);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'delete', 'lead');
    const { id } = await context.params;

    const existing = await prisma.workflow.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!existing) {
      throw new NotFoundError('Workflow');
    }

    await prisma.workflow.delete({ where: { id } });

    logger.info('Workflow deleted', { workflowId: id });

    return successResponse({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
