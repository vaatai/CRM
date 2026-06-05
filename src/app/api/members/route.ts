import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getAuthContext } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const roleId = searchParams.get('roleId') || '';

    const where: Record<string, unknown> = { organizationId: ctx.organizationId };

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (roleId) {
      where.roleId = roleId;
    }

    const members = await prisma.organizationMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            systemRole: true,
          },
        },
        role: {
          select: { id: true, name: true, isSystem: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    logger.info('Members listed', { count: members.length });

    return successResponse({ members });
  } catch (error) {
    return errorResponse(error);
  }
}
