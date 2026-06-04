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

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // ── Summary widgets ────────────────────────────────────────────────
    const [
      totalLeads,
      qualifiedLeads,
      openDeals,
      closedWonDeals,
      closedLostDeals,
      tasksDueToday,
      totalContacts,
      totalCompanies,
      totalTasks,
    ] = await Promise.all([
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.lead.count({ where: { organizationId: orgId, status: { in: ['QUALIFIED', 'PROPOSAL', 'WON'] } } }),
      prisma.deal.count({ where: { organizationId: orgId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } }),
      prisma.deal.count({ where: { organizationId: orgId, stage: 'CLOSED_WON' } }),
      prisma.deal.count({ where: { organizationId: orgId, stage: 'CLOSED_LOST' } }),
      prisma.task.count({
        where: {
          organizationId: orgId,
          dueDate: { gte: todayStart, lt: todayEnd },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      prisma.contact.count({ where: { organizationId: orgId } }),
      prisma.company.count({ where: { organizationId: orgId } }),
      prisma.task.count({ where: { organizationId: orgId } }),
    ]);

    // ── Revenue aggregation ────────────────────────────────────────────
    const wonDeals = await prisma.deal.findMany({
      where: { organizationId: orgId, stage: 'CLOSED_WON' },
      select: { value: true },
    });
    const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);

    const allDeals = await prisma.deal.findMany({
      where: { organizationId: orgId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      select: { value: true },
    });
    const pipelineValue = allDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);

    // ── Lead status distribution (pipeline chart) ──────────────────────
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { _all: true },
    });
    const leadPipeline = leadsByStatus.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));

    // ── Deal stage distribution (funnel chart) ─────────────────────────
    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      where: { organizationId: orgId },
      _count: { _all: true },
    });
    const dealFunnel = dealsByStage.map((g) => ({
      stage: g.stage,
      count: g._count._all,
    }));

    // ── Deal stage value aggregation ───────────────────────────────────
    const dealsForStageValue = await prisma.deal.findMany({
      where: { organizationId: orgId },
      select: { stage: true, value: true },
    });
    const dealStageValueMap: Record<string, number> = {};
    for (const d of dealsForStageValue) {
      const val = d.value ? Number(d.value) : 0;
      dealStageValueMap[d.stage] = (dealStageValueMap[d.stage] || 0) + val;
    }
    const dealStageValues = Object.entries(dealStageValueMap).map(([stage, value]) => ({
      stage,
      value,
    }));

    // ── Monthly data (last 6 months) ───────────────────────────────────
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [leadsRaw, dealsRaw, contactsRaw] = await Promise.all([
      prisma.lead.findMany({
        where: { organizationId: orgId, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, status: true },
      }),
      prisma.deal.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { createdAt: { gte: sixMonthsAgo } },
            { closedAt: { gte: sixMonthsAgo } },
          ],
        },
        select: { createdAt: true, stage: true, value: true, closedAt: true },
      }),
      prisma.contact.findMany({
        where: { organizationId: orgId, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
    ]);

    const monthlyData: {
      month: string;
      leads: number;
      contacts: number;
      dealsCreated: number;
      dealsClosed: number;
      revenue: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const inRange = (d: Date) => d >= monthDate && d < monthEnd;

      const monthLeads = leadsRaw.filter((l) => inRange(l.createdAt)).length;
      const monthContacts = contactsRaw.filter((c) => inRange(c.createdAt)).length;
      const monthDealsCreated = dealsRaw.filter((d) => inRange(d.createdAt)).length;

      const monthClosedWon = dealsRaw.filter(
        (d) => d.stage === 'CLOSED_WON' && d.closedAt && inRange(d.closedAt)
      );
      const monthRevenue = monthClosedWon.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);

      monthlyData.push({
        month: monthLabel,
        leads: monthLeads,
        contacts: monthContacts,
        dealsCreated: monthDealsCreated,
        dealsClosed: monthClosedWon.length,
        revenue: monthRevenue,
      });
    }

    // ── Conversion rates ───────────────────────────────────────────────
    const totalLeadsForConv = totalLeads || 1;
    const wonLeadsCount = await prisma.lead.count({ where: { organizationId: orgId, status: 'WON' } });
    const convertedLeadsCount = await prisma.lead.count({ where: { organizationId: orgId, status: 'CONVERTED' } });

    const leadToQualifiedRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeadsForConv) * 100) : 0;
    const leadToWonRate = totalLeads > 0 ? Math.round((wonLeadsCount / totalLeadsForConv) * 100) : 0;
    const leadToConvertedRate = totalLeads > 0 ? Math.round((convertedLeadsCount / totalLeadsForConv) * 100) : 0;

    const totalDealsAll = await prisma.deal.count({ where: { organizationId: orgId } });
    const dealWinRate = totalDealsAll > 0 ? Math.round((closedWonDeals / totalDealsAll) * 100) : 0;

    const conversionRates = {
      leadToQualified: leadToQualifiedRate,
      leadToWon: leadToWonRate,
      leadToConverted: leadToConvertedRate,
      dealWinRate,
    };

    // ── Task distribution ──────────────────────────────────────────────
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { _all: true },
    });
    const taskDistribution = tasksByStatus.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));

    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: { organizationId: orgId },
      _count: { _all: true },
    });
    const taskPriorityDistribution = tasksByPriority.map((g) => ({
      priority: g.priority,
      count: g._count._all,
    }));

    // ── Lead source distribution ───────────────────────────────────────
    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId: orgId },
      _count: { _all: true },
    });
    const leadSourceDistribution = leadsBySource.map((g) => ({
      source: g.source,
      count: g._count._all,
    }));

    logger.info('Analytics data fetched', { orgId });

    return successResponse({
      widgets: {
        totalLeads,
        qualifiedLeads,
        openDeals,
        closedWonDeals,
        closedLostDeals,
        tasksDueToday,
        totalContacts,
        totalCompanies,
        totalTasks,
        totalRevenue,
        pipelineValue,
      },
      leadPipeline,
      dealFunnel,
      dealStageValues,
      monthlyData,
      conversionRates,
      taskDistribution,
      taskPriorityDistribution,
      leadSourceDistribution,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
