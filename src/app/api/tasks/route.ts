import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const DEMO_ORG_ID_QUERY = `SELECT id FROM "Organization" LIMIT 1`;

async function getOrgId(): Promise<string> {
  const result = await prisma.$queryRawUnsafe<{ id: string }[]>(DEMO_ORG_ID_QUERY);
  if (!result[0]) throw new ValidationError('No organization found');
  return result[0].id;
}

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new ValidationError('No users found');
  return user.id;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const type = searchParams.get('type') || '';
    const assigneeId = searchParams.get('assigneeId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const orgId = await getOrgId();

    const where: Record<string, unknown> = { organizationId: orgId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (type) {
      where.type = type;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'dueDate', 'priority', 'status', 'type'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, title: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    logger.info('Tasks listed', { page, limit, total });

    return successResponse({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, priority, type, dueDate, assigneeId, dealId, contactId } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('Task title is required');
    }

    const orgId = await getOrgId();
    const userId = await getDefaultUserId();

    const resolvedStatus = status || 'TODO';

    const task = await prisma.task.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        assigneeId: assigneeId || userId,
        title: title.trim(),
        description: description?.trim() || null,
        status: resolvedStatus,
        priority: priority || 'MEDIUM',
        type: type || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        completedAt: resolvedStatus === 'COMPLETED' ? new Date() : null,
        dealId: dealId || null,
        contactId: contactId || null,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        tags: { include: { tag: true } },
      },
    });

    logger.info('Task created', { taskId: task.id });

    return successResponse(task, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
