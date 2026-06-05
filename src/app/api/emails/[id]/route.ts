import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'email');
    const { id } = await context.params;

    const email = await prisma.email.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        deal: { select: { id: true, title: true } },
        template: { select: { id: true, name: true } },
        events: { orderBy: { occurredAt: 'desc' } },
      },
    });

    if (!email) throw new NotFoundError('Email');

    logger.info('Email detail fetched', { emailId: id });

    return successResponse(email);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'delete', 'email');
    const { id } = await context.params;

    const existing = await prisma.email.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });

    if (!existing) throw new NotFoundError('Email');

    await prisma.email.delete({ where: { id } });

    logger.info('Email deleted', { emailId: id });

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
