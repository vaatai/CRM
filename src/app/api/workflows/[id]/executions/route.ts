import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError } from '@/lib/errors';
import { getAuthContext, requirePermission } from '@/lib/rbac';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const ctx = await getAuthContext();
    requirePermission(ctx, 'read', 'lead');
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const workflow = await prisma.workflow.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!workflow) {
      throw new NotFoundError('Workflow');
    }

    const [executions, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where: { workflowId: id },
        include: {
          stepLogs: {
            include: { step: { select: { actionType: true, sortOrder: true } } },
            orderBy: { startedAt: 'asc' },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workflowExecution.count({ where: { workflowId: id } }),
    ]);

    return successResponse({
      executions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
