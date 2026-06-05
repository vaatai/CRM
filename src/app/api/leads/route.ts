import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'lead');

    const where: Record<string, unknown> = { organizationId: ctx.organizationId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
        { contact: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'value', 'status'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { notes: true, tags: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    logger.info('Leads listed', { page, limit, total });

    return successResponse({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, status, source, value, description, contactId, ownerId } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('Title is required');
    }

    const ctx = await getAuthContext();
    requirePermission(ctx, 'create', 'lead');

    const lead = await prisma.lead.create({
      data: {
        organizationId: ctx.organizationId,
        title: title.trim(),
        status: status || 'NEW',
        source: source || 'OTHER',
        value: value ? parseFloat(value) : null,
        description: description?.trim() || null,
        contactId: contactId || null,
        ownerId: ownerId || null,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    logger.info('Lead created', { leadId: lead.id });

    return successResponse(lead, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
