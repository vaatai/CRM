import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const DEMO_ORG_ID_QUERY = `SELECT id FROM "Organization" LIMIT 1`;

async function getOrgId(): Promise<string> {
  const result = await prisma.$queryRawUnsafe<{ id: string }[]>(DEMO_ORG_ID_QUERY);
  if (!result[0]) throw new ValidationError('No organization found');
  return result[0].id;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const orgId = await getOrgId();

    const email = await prisma.email.findFirst({
      where: { id, organizationId: orgId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        deal: { select: { id: true, title: true } },
        template: { select: { id: true, name: true } },
        events: { orderBy: { occurredAt: 'desc' } },
      },
    });

    if (!email) throw new NotFoundError('Email');

    logger.info('Email detail fetched', { emailId: id });

    return successResponse(email);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const orgId = await getOrgId();

    const existing = await prisma.email.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) throw new NotFoundError('Email');

    await prisma.email.delete({ where: { id } });

    logger.info('Email deleted', { emailId: id });

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
