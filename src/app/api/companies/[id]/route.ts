import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            title: true,
            source: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        deals: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
            currency: true,
            probability: true,
            expectedCloseDate: true,
            closedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: { tag: true },
        },
        _count: { select: { contacts: true, deals: true } },
      },
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    logger.info('Company fetched', { companyId: company.id });

    return successResponse(company);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Company');
    }

    const { name, website, industry, size, address, city, state, country, phone, email, description } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new ValidationError('Company name cannot be empty');
      }
      data.name = name.trim();
    }
    if (website !== undefined) data.website = website?.trim() || null;
    if (industry !== undefined) data.industry = industry?.trim() || null;
    if (size !== undefined) data.size = size?.trim() || null;
    if (address !== undefined) data.address = address?.trim() || null;
    if (city !== undefined) data.city = city?.trim() || null;
    if (state !== undefined) data.state = state?.trim() || null;
    if (country !== undefined) data.country = country?.trim() || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (email !== undefined) data.email = email?.trim() || null;
    if (description !== undefined) data.description = description?.trim() || null;

    const company = await prisma.company.update({
      where: { id },
      data,
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            title: true,
            source: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        deals: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
            currency: true,
            probability: true,
            expectedCloseDate: true,
            closedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: { tag: true },
        },
        _count: { select: { contacts: true, deals: true } },
      },
    });

    logger.info('Company updated', { companyId: company.id });

    return successResponse(company);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Company');
    }

    await prisma.company.delete({ where: { id } });

    logger.info('Company deleted', { companyId: id });

    return successResponse({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
