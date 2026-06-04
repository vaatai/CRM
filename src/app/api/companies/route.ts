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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const orgId = await getOrgId();

    const where: Record<string, unknown> = { organizationId: orgId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (industry) {
      where.industry = industry;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'name'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          _count: { select: { contacts: true, deals: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    logger.info('Companies listed', { page, limit, total });

    return successResponse({
      companies,
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
    const { name, website, industry, size, address, city, state, country, phone, email, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Company name is required');
    }

    const orgId = await getOrgId();
    await getDefaultUserId();

    const company = await prisma.company.create({
      data: {
        organizationId: orgId,
        name: name.trim(),
        website: website?.trim() || null,
        industry: industry?.trim() || null,
        size: size?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        description: description?.trim() || null,
      },
      include: {
        _count: { select: { contacts: true, deals: true } },
      },
    });

    logger.info('Company created', { companyId: company.id });

    return successResponse(company, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
