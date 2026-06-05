import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    const { id } = await context.params;

    const member = await prisma.organizationMember.findFirst({
      where: { id, organizationId: ctx.organizationId },
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
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Member');
    }

    return successResponse(member);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'manage', 'user');
    const { id } = await context.params;

    const member = await prisma.organizationMember.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: { role: true },
    });

    if (!member) {
      throw new NotFoundError('Member');
    }

    // Prevent demoting the last Owner
    if (member.role?.name === 'Owner') {
      const ownerRole = await prisma.role.findFirst({
        where: { name: 'Owner', organizationId: ctx.organizationId },
      });
      if (ownerRole) {
        const ownerCount = await prisma.organizationMember.count({
          where: { roleId: ownerRole.id, organizationId: ctx.organizationId },
        });
        if (ownerCount <= 1) {
          throw new ForbiddenError('Cannot change the role of the last Owner');
        }
      }
    }

    const body = await request.json();
    const { roleId } = body;

    if (roleId === undefined) {
      throw new ValidationError('roleId is required');
    }

    // Verify role belongs to same org
    if (roleId !== null) {
      const role = await prisma.role.findFirst({
        where: { id: roleId, organizationId: ctx.organizationId },
      });
      if (!role) {
        throw new ValidationError('Invalid role');
      }
    }

    const updated = await prisma.organizationMember.update({
      where: { id },
      data: { roleId },
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
        role: { select: { id: true, name: true, isSystem: true } },
      },
    });

    logger.info('Member role updated', {
      memberId: id,
      newRoleId: roleId,
      userId: updated.user.id,
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
