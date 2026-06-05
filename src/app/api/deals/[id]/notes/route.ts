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
    requirePermission(ctx, 'read', 'note');
    const { id } = await context.params;

    const deal = await prisma.deal.findUnique({ where: { id }, select: { id: true } });
    if (!deal) throw new NotFoundError('Deal');

    const notes = await prisma.note.findMany({
      where: { dealId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info('Deal notes listed', { dealId: id, count: notes.length });

    return successResponse({ notes });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'create', 'note');
    const { id } = await context.params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new ValidationError('Note content is required');
    }

    const deal = await prisma.deal.findUnique({ where: { id }, select: { id: true } });
    if (!deal) throw new NotFoundError('Deal');

    const note = await prisma.note.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        dealId: id,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    logger.info('Deal note created', { dealId: id, noteId: note.id });

    return successResponse(note, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
