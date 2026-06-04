import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      throw new NotFoundError('Contact');
    }

    const activities = await prisma.activity.findMany({
      where: { contactId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(activities);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { type, title, description, userId } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('Activity title is required');
    }
    if (!type) {
      throw new ValidationError('Activity type is required');
    }

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      throw new NotFoundError('Contact');
    }

    let activityUserId = userId;
    if (!activityUserId) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) throw new ValidationError('No users found');
      activityUserId = firstUser.id;
    }

    const activity = await prisma.activity.create({
      data: {
        organizationId: contact.organizationId,
        userId: activityUserId,
        contactId: id,
        type,
        title: title.trim(),
        description: description?.trim() || null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      },
    });

    logger.info('Activity added to contact', { contactId: id, activityId: activity.id });

    return successResponse(activity, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
