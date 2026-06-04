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

export async function GET() {
  try {
    const orgId = await getOrgId();

    const companies = await prisma.company.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, website: true, industry: true },
      orderBy: { name: 'asc' },
    });

    logger.info('Companies listed', { total: companies.length });

    return successResponse({ companies });
  } catch (error) {
    return errorResponse(error);
  }
}
