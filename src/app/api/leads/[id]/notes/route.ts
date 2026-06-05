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

    const lead = await prisma.lead.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!lead) {
      throw new NotFoundError('Lead');
    }

    const notes = await prisma.note.findMany({
      where: { leadId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(notes);
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

    const lead = await prisma.lead.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!lead) {
      throw new NotFoundError('Lead');
    }

    const note = await prisma.note.create({
      data: {
        organizationId: lead.organizationId,
        userId: ctx.userId,
        leadId: id,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      },
    });

    logger.info('Note added to lead', { leadId: id, noteId: note.id });

    return successResponse(note, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
