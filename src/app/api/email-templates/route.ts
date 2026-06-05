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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'email');

    const where: Record<string, unknown> = { organizationId: ctx.organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { emails: true } } },
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    logger.info('Email templates listed', { page, limit, total });

    return successResponse({
      templates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, body: templateBody, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Template name is required');
    }
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      throw new ValidationError('Template subject is required');
    }
    if (!templateBody || typeof templateBody !== 'string' || templateBody.trim().length === 0) {
      throw new ValidationError('Template body is required');
    }

    const ctx = await getAuthContext();
    requirePermission(ctx, 'create', 'email');

    const template = await prisma.emailTemplate.create({
      data: {
        organizationId: ctx.organizationId,
        name: name.trim(),
        subject: subject.trim(),
        body: templateBody.trim(),
        description: description?.trim() || null,
      },
    });

    logger.info('Email template created', { templateId: template.id });

    return successResponse(template, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
