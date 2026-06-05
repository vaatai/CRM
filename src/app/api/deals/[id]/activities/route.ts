import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'activity');
    const { id } = await context.params;

    const deal = await prisma.deal.findFirst({ where: { id, organizationId: ctx.organizationId }, select: { id: true } });
    if (!deal) throw new NotFoundError('Deal');

    const activities = await prisma.activity.findMany({
      where: { dealId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info('Deal activities listed', { dealId: id, count: activities.length });

    return successResponse({ activities });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'create', 'activity');
    const { id } = await context.params;
    const body = await request.json();
    const { type, title, description } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('Activity title is required');
    }

    const deal = await prisma.deal.findFirst({ where: { id, organizationId: ctx.organizationId }, select: { id: true } });
    if (!deal) throw new NotFoundError('Deal');

    const activity = await prisma.activity.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        dealId: id,
        type: type || 'OTHER',
        title: title.trim(),
        description: description?.trim() || null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    logger.info('Deal activity created', { dealId: id, activityId: activity.id });

    return successResponse(activity, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
