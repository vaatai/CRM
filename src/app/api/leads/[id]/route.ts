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
    requirePermission(ctx, 'read', 'lead');
    const { id } = await context.params;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        notes: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    logger.info('Lead fetched', { leadId: lead.id });

    return successResponse(lead);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'update', 'lead');
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.lead.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!existing) {
      throw new NotFoundError('Lead');
    }

    const { title, status, source, value, description, contactId, ownerId } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        throw new ValidationError('Title cannot be empty');
      }
      data.title = title.trim();
    }
    if (status !== undefined) data.status = status;
    if (source !== undefined) data.source = source;
    if (value !== undefined) data.value = value ? parseFloat(value) : null;
    if (description !== undefined) data.description = description?.trim() || null;
    if (contactId !== undefined) data.contactId = contactId || null;
    if (ownerId !== undefined) data.ownerId = ownerId || null;

    const lead = await prisma.lead.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        notes: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    logger.info('Lead updated', { leadId: lead.id });

    return successResponse(lead);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'delete', 'lead');
    const { id } = await context.params;

    const existing = await prisma.lead.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!existing) {
      throw new NotFoundError('Lead');
    }

    await prisma.lead.delete({ where: { id } });

    logger.info('Lead deleted', { leadId: id });

    return successResponse({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
