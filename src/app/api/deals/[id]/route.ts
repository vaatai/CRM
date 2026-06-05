import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';
import { triggerDealWon } from '@/lib/workflow-engine';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'deal');
    const { id } = await context.params;

    const deal = await prisma.deal.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        notes: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: { include: { tag: true } },
        _count: { select: { notes: true, activities: true, tasks: true } },
      },
    });

    if (!deal) {
      throw new NotFoundError('Deal');
    }

    logger.info('Deal fetched', { dealId: deal.id });

    return successResponse(deal);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'update', 'deal');
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.deal.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!existing) {
      throw new NotFoundError('Deal');
    }

    const { title, stage, value, currency, probability, expectedCloseDate, description, contactId, companyId } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        throw new ValidationError('Deal title cannot be empty');
      }
      data.title = title.trim();
    }
    if (stage !== undefined) data.stage = stage;
    if (value !== undefined) data.value = value !== '' && value !== null ? parseFloat(value) : null;
    if (currency !== undefined) data.currency = currency;
    if (probability !== undefined) data.probability = probability != null ? parseInt(probability) : null;
    if (expectedCloseDate !== undefined) data.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    if (description !== undefined) data.description = description?.trim() || null;
    if (contactId !== undefined) data.contactId = contactId || null;
    if (companyId !== undefined) data.companyId = companyId || null;

    if (stage === 'CLOSED_WON' || stage === 'CLOSED_LOST') {
      if (!existing.closedAt) {
        data.closedAt = new Date();
      }
    } else if (stage !== undefined && existing.closedAt) {
      data.closedAt = null;
    }

    const deal = await prisma.deal.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        notes: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: { include: { tag: true } },
        _count: { select: { notes: true, activities: true, tasks: true } },
      },
    });

    logger.info('Deal updated', { dealId: deal.id });

    // Fire workflow trigger on deal won
    if (stage === 'CLOSED_WON' && existing.stage !== 'CLOSED_WON') {
      const contactName = deal.contact
        ? `${deal.contact.firstName} ${deal.contact.lastName}`.trim()
        : undefined;
      triggerDealWon(ctx.organizationId, ctx.userId, {
        dealId: deal.id,
        dealTitle: deal.title,
        value: Number(deal.value) || 0,
        contactName,
      });
    }

    return successResponse(deal);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'delete', 'deal');
    const { id } = await context.params;

    const existing = await prisma.deal.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!existing) {
      throw new NotFoundError('Deal');
    }

    await prisma.deal.delete({ where: { id } });

    logger.info('Deal deleted', { dealId: id });

    return successResponse({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
