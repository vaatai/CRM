import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const contactId = searchParams.get('contactId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'email');

    const where: Record<string, unknown> = { organizationId: ctx.organizationId };

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { toEmail: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    const allowedSortFields = ['createdAt', 'sentAt', 'subject', 'status', 'toEmail'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          deal: { select: { id: true, title: true } },
          template: { select: { id: true, name: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.email.count({ where }),
    ]);

    logger.info('Emails listed', { page, limit, total });

    return successResponse({
      emails,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
