import { currentUser } from '@clerk/nextjs/server';

import { successResponse, errorResponse } from '@/lib/api-response';
import { UnauthorizedError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    // Fetch RBAC context
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true },
    });

    let rbac: {
      organizationId: string | null;
      roleId: string | null;
      roleName: string | null;
      permissions: string[];
    } = { organizationId: null, roleId: null, roleName: null, permissions: [] };

    if (dbUser) {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: dbUser.id },
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      });

      if (membership) {
        rbac = {
          organizationId: membership.organizationId,
          roleId: membership.role?.id ?? null,
          roleName: membership.role?.name ?? null,
          permissions: membership.role
            ? membership.role.permissions.map(
                (rp) => `${rp.permission.action}:${rp.permission.resource}`
              )
            : [],
        };
      }
    }

    logger.info('User profile fetched', { userId: user.id });

    return successResponse({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      rbac,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
