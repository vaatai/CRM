import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'task');
    const { id } = await context.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        deal: { select: { id: true, title: true, stage: true, value: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    logger.info('Task retrieved', { taskId: task.id });

    return successResponse(task);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'update', 'task');
    const { id } = await context.params;
    const body = await request.json();
    const { title, description, status, priority, type, dueDate, assigneeId, dealId, contactId } = body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Task');
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      throw new ValidationError('Task title cannot be empty');
    }

    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (type !== undefined) data.type = type || null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (dealId !== undefined) data.dealId = dealId || null;
    if (contactId !== undefined) data.contactId = contactId || null;

    // Auto-manage completedAt on status transitions
    if (status === 'COMPLETED' && !existing.completedAt) {
      data.completedAt = new Date();
    } else if (status !== undefined && status !== 'COMPLETED' && existing.completedAt) {
      data.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        deal: { select: { id: true, title: true, stage: true, value: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: { include: { tag: true } },
      },
    });

    logger.info('Task updated', { taskId: task.id });

    return successResponse(task);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'delete', 'task');
    const { id } = await context.params;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Task');
    }

    await prisma.task.delete({ where: { id } });

    logger.info('Task deleted', { taskId: id });

    return successResponse({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
