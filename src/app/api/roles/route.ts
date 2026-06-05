import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';

export async function GET() {
  try {
    const ctx = await getAuthContext();

    const roles = await prisma.role.findMany({
      where: { organizationId: ctx.organizationId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { members: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    logger.info('Roles listed', { count: roles.length });

    return successResponse({ roles });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'manage', 'role');

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Role name is required');
    }

    const existing = await prisma.role.findUnique({
      where: { name_organizationId: { name: name.trim(), organizationId: ctx.organizationId } },
    });
    if (existing) {
      throw new ValidationError('A role with this name already exists');
    }

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        organizationId: ctx.organizationId,
        isSystem: false,
        permissions: {
          create: Array.isArray(permissionIds)
            ? permissionIds.map((pid: string) => ({ permissionId: pid }))
            : [],
        },
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { members: true } },
      },
    });

    logger.info('Role created', { roleId: role.id, name: role.name });

    return successResponse(role, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
