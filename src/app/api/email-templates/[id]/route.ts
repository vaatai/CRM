import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getAuthContext, requirePermission } from '@/lib/rbac';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'email');
    const { id } = await context.params;

    const template = await prisma.emailTemplate.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: { _count: { select: { emails: true } } },
    });

    if (!template) throw new NotFoundError('Email template');

    return successResponse(template);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'update', 'email');
    const { id } = await context.params;
    const body = await request.json();
    const { name, subject, body: templateBody, description, isActive } = body;

    const existing = await prisma.emailTemplate.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });

    if (!existing) throw new NotFoundError('Email template');

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(subject !== undefined && { subject: subject.trim() }),
        ...(templateBody !== undefined && { body: templateBody.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    logger.info('Email template updated', { templateId: template.id });

    return successResponse(template);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'delete', 'email');
    const { id } = await context.params;

    const existing = await prisma.emailTemplate.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });

    if (!existing) throw new NotFoundError('Email template');

    await prisma.emailTemplate.delete({ where: { id } });

    logger.info('Email template deleted', { templateId: id });

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
