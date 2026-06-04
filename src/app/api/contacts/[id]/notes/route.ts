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

    const notes = await prisma.note.findMany({
      where: { contactId: id },
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

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      throw new NotFoundError('Contact');
    }

    let noteUserId = userId;
    if (!noteUserId) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) throw new ValidationError('No users found');
      noteUserId = firstUser.id;
    }

    const note = await prisma.note.create({
      data: {
        organizationId: contact.organizationId,
        userId: noteUserId,
        contactId: id,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      },
    });

    logger.info('Note added to contact', { contactId: id, noteId: note.id });

    return successResponse(note, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
