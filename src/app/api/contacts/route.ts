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
    const source = searchParams.get('source') || '';
    const companyId = searchParams.get('companyId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'contact');

    const where: Record<string, unknown> = { organizationId: ctx.organizationId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (source) {
      where.source = source;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          company: { select: { id: true, name: true } },
          _count: { select: { notes: true, activities: true, deals: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    logger.info('Contacts listed', { page, limit, total });

    return successResponse({
      contacts,
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
    const { firstName, lastName, email, phone, title, source, address, city, state, country, description, companyId } = body;

    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      throw new ValidationError('First name is required');
    }
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
      throw new ValidationError('Last name is required');
    }

    const ctx = await getAuthContext();
    requirePermission(ctx, 'create', 'contact');

    const contact = await prisma.contact.create({
      data: {
        organizationId: ctx.organizationId,
        createdById: ctx.userId,
        ownerId: ctx.userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        title: title?.trim() || null,
        source: source || 'OTHER',
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || null,
        description: description?.trim() || null,
        companyId: companyId || null,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        company: { select: { id: true, name: true } },
      },
    });

    logger.info('Contact created', { contactId: contact.id });

    return successResponse(contact, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
