import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
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

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    const deal = await prisma.deal.findUnique({ where: { id }, select: { id: true } });
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
    const { id } = await context.params;
    const body = await request.json();
    const { type, title, description } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('Activity title is required');
    }

    const deal = await prisma.deal.findUnique({ where: { id }, select: { id: true } });
    if (!deal) throw new NotFoundError('Deal');

    const orgId = await getOrgId();
    const userId = await getDefaultUserId();

    const activity = await prisma.activity.create({
      data: {
        organizationId: orgId,
        userId,
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
