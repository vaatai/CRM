import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { triggerTaskOverdue } from '@/lib/workflow-engine';

export async function POST() {
  try {
    const now = new Date();

    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        organization: { select: { id: true } },
      },
    });

    let triggered = 0;
    for (const task of overdueTasks) {
      const userId = task.assigneeId || task.createdById;
      const assigneeName = task.assignee
        ? `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim()
        : 'Unassigned';

      triggerTaskOverdue(task.organizationId, userId, {
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.dueDate?.toISOString() || '',
        assigneeName,
      });
      triggered++;
    }

    logger.info('Overdue task check completed', { overdueTasks: overdueTasks.length, triggered });

    return successResponse({ checked: overdueTasks.length, triggered });
  } catch (error) {
    return errorResponse(error);
  }
}
