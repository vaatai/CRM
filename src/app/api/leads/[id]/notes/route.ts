import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    const lead = await prisma.lead.findUnique({ where: { id } });
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
    const { id } = await context.params;
    const body = await request.json();
    const { content, userId } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new ValidationError('Note content is required');
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundError('Lead');
    }

    // Use provided userId or fallback to first user for demo
    let noteUserId = userId;
    if (!noteUserId) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) throw new ValidationError('No users found');
      noteUserId = firstUser.id;
    }

    const note = await prisma.note.create({
      data: {
        organizationId: lead.organizationId,
        userId: noteUserId,
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
