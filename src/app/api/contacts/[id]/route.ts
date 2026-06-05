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
    requirePermission(ctx, 'read', 'contact');
    const { id } = await context.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        company: { select: { id: true, name: true, website: true, industry: true } },
        notes: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        deals: {
          select: { id: true, title: true, stage: true, value: true },
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!contact) {
      throw new NotFoundError('Contact');
    }

    logger.info('Contact fetched', { contactId: contact.id });

    return successResponse(contact);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'update', 'contact');
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Contact');
    }

    const { firstName, lastName, email, phone, title, source, address, city, state, country, description, companyId } = body;

    const data: Record<string, unknown> = {};
    if (firstName !== undefined) {
      if (typeof firstName !== 'string' || firstName.trim().length === 0) {
        throw new ValidationError('First name cannot be empty');
      }
      data.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      if (typeof lastName !== 'string' || lastName.trim().length === 0) {
        throw new ValidationError('Last name cannot be empty');
      }
      data.lastName = lastName.trim();
    }
    if (email !== undefined) data.email = email?.trim() || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (title !== undefined) data.title = title?.trim() || null;
    if (source !== undefined) data.source = source;
    if (address !== undefined) data.address = address?.trim() || null;
    if (city !== undefined) data.city = city?.trim() || null;
    if (state !== undefined) data.state = state?.trim() || null;
    if (country !== undefined) data.country = country?.trim() || null;
    if (description !== undefined) data.description = description?.trim() || null;
    if (companyId !== undefined) data.companyId = companyId || null;

    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        company: { select: { id: true, name: true, website: true, industry: true } },
        notes: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        deals: {
          select: { id: true, title: true, stage: true, value: true },
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    logger.info('Contact updated', { contactId: contact.id });

    return successResponse(contact);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'delete', 'contact');
    const { id } = await context.params;

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Contact');
    }

    await prisma.contact.delete({ where: { id } });

    logger.info('Contact deleted', { contactId: id });

    return successResponse({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
