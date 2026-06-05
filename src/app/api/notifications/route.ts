import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getAuthContext } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const where: Record<string, unknown> = {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
    };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          isRead: false,
        },
      }),
    ]);

    return successResponse({ notifications, total, unreadCount });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: {
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          isRead: false,
        },
        data: { isRead: true },
      });
      logger.info('All notifications marked read', { userId: ctx.userId });
    } else if (Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          organizationId: ctx.organizationId,
          userId: ctx.userId,
        },
        data: { isRead: true },
      });
      logger.info('Notifications marked read', { count: notificationIds.length });
    }

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
