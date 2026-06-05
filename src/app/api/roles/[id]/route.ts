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

    const role = await prisma.role.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        permissions: { include: { permission: true } },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role');
    }

    return successResponse(role);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'manage', 'role');
    const { id } = await context.params;

    const existing = await prisma.role.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!existing) {
      throw new NotFoundError('Role');
    }

    if (existing.isSystem) {
      throw new ForbiddenError('System roles cannot be modified');
    }

    const body = await request.json();
    const { name, description, permissionIds } = body;

    const data: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new ValidationError('Role name cannot be empty');
      }
      const duplicate = await prisma.role.findFirst({
        where: {
          name: name.trim(),
          organizationId: ctx.organizationId,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new ValidationError('A role with this name already exists');
      }
      data.name = name.trim();
    }

    if (description !== undefined) data.description = description?.trim() || null;

    // Update permissions if provided (atomic transaction)
    if (Array.isArray(permissionIds)) {
      await prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((pid: string) => ({ roleId: id, permissionId: pid })),
          });
        }
      });
    }

    const role = await prisma.role.update({
      where: { id },
      data,
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { members: true } },
      },
    });

    logger.info('Role updated', { roleId: role.id });

    return successResponse(role);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'manage', 'role');
    const { id } = await context.params;

    const existing = await prisma.role.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: { _count: { select: { members: true } } },
    });

    if (!existing) {
      throw new NotFoundError('Role');
    }

    if (existing.isSystem) {
      throw new ForbiddenError('System roles cannot be deleted');
    }

    if (existing._count.members > 0) {
      throw new ValidationError(
        `Cannot delete role "${existing.name}" — it is assigned to ${existing._count.members} member(s). Reassign them first.`
      );
    }

    await prisma.role.delete({ where: { id } });

    logger.info('Role deleted', { roleId: id, name: existing.name });

    return successResponse({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
