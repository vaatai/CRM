import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const DEMO_ORG_ID_QUERY = `SELECT id FROM "Organization" LIMIT 1`;

async function getOrgId(): Promise<string> {
  const result = await prisma.$queryRawUnsafe<{ id: string }[]>(DEMO_ORG_ID_QUERY);
  if (!result[0]) throw new ValidationError('No organization found');
  return result[0].id;
}

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new ValidationError('No users found');
  return user.id;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const search = searchParams.get('search') || '';
    const stage = searchParams.get('stage') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const orgId = await getOrgId();

    const where: Record<string, unknown> = { organizationId: orgId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (stage) {
      where.stage = stage;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'value', 'stage'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          company: { select: { id: true, name: true } },
          _count: { select: { notes: true, activities: true, tasks: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    logger.info('Deals listed', { page, limit, total });

    return successResponse({
      deals,
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
    const { title, stage, value, currency, probability, expectedCloseDate, description, contactId, companyId } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('Deal title is required');
    }

    const orgId = await getOrgId();
    const userId = await getDefaultUserId();

    const deal = await prisma.deal.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        ownerId: userId,
        title: title.trim(),
        stage: stage || 'PROSPECTING',
        value: value ? parseFloat(value) : null,
        currency: currency || 'USD',
        probability: probability != null ? parseInt(probability) : 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        description: description?.trim() || null,
        contactId: contactId || null,
        companyId: companyId || null,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { notes: true, activities: true, tasks: true } },
      },
    });

    logger.info('Deal created', { dealId: deal.id });

    return successResponse(deal, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
