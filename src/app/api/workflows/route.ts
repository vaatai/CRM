import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import type { WorkflowActionType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'lead');
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const trigger = searchParams.get('trigger');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = { organizationId: ctx.organizationId };
    if (trigger) where.trigger = trigger;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          steps: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { executions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workflow.count({ where }),
    ]);

    return successResponse({
      workflows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'create', 'lead');
    const body = await request.json();
    const { name, description, trigger, triggerConfig, steps } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Workflow name is required');
    }
    if (!trigger) {
      throw new ValidationError('Trigger type is required');
    }
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new ValidationError('At least one action step is required');
    }

    const workflow = await prisma.workflow.create({
      data: {
        organizationId: ctx.organizationId,
        createdById: ctx.userId,
        name: name.trim(),
        description: description?.trim() || null,
        trigger,
        triggerConfig: triggerConfig ? JSON.stringify(triggerConfig) : null,
        steps: {
          create: steps.map(
            (step: { actionType: string; config: Record<string, unknown> }, idx: number) => ({
              actionType: step.actionType as WorkflowActionType,
              config: JSON.stringify(step.config),
              sortOrder: idx,
            })
          ),
        },
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        steps: { orderBy: { sortOrder: 'asc' } },
      },
    });

    logger.info('Workflow created', { workflowId: workflow.id, name: workflow.name });

    return successResponse(workflow, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
