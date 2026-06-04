'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Target,
  UserCheck,
  Handshake,
  Trophy,
  DollarSign,
  CalendarClock,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Briefcase,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadPipelineChart } from '@/components/analytics/lead-pipeline-chart';
import { DealFunnelChart, DealValueChart } from '@/components/analytics/deal-funnel-chart';
import { RevenueTrendChart } from '@/components/analytics/revenue-trend-chart';
import { MonthlyActivityChart } from '@/components/analytics/monthly-activity-chart';
import { ConversionRateChart } from '@/components/analytics/conversion-rate-chart';
import { TaskStatusChart, TaskPriorityChart } from '@/components/analytics/task-distribution-chart';
import { LeadSourceChart } from '@/components/analytics/lead-source-chart';
import { formatCurrency } from '@/components/analytics/chart-colors';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  widgets: {
    totalLeads: number;
    qualifiedLeads: number;
    openDeals: number;
    closedWonDeals: number;
    closedLostDeals: number;
    tasksDueToday: number;
    totalContacts: number;
    totalCompanies: number;
    totalTasks: number;
    totalRevenue: number;
    pipelineValue: number;
  };
  leadPipeline: { status: string; count: number }[];
  dealFunnel: { stage: string; count: number }[];
  dealStageValues: { stage: string; value: number }[];
  monthlyData: {
    month: string;
    leads: number;
    contacts: number;
    dealsCreated: number;
    dealsClosed: number;
    revenue: number;
  }[];
  conversionRates: {
    leadToQualified: number;
    leadToWon: number;
    leadToConverted: number;
    dealWinRate: number;
  };
  taskDistribution: { status: string; count: number }[];
  taskPriorityDistribution: { priority: string; count: number }[];
  leadSourceDistribution: { source: string; count: number }[];
}

interface StatWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function StatWidget({ title, value, subtitle, icon, trend }: StatWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function WidgetSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-1 h-7 w-16" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();

    startTransition(() => {
      fetch('/api/analytics', { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setData(json.data);
          }
        })
        .catch(() => {});
    });

    return () => controller.abort();
  }, []);

  const loading = isPending || !data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Overview of your CRM performance</p>
      </div>

      {/* ── Stat widgets ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <WidgetSkeleton key={i} />)
        ) : (
          <>
            <StatWidget
              title="Total Leads"
              value={data.widgets.totalLeads}
              subtitle={`${data.widgets.qualifiedLeads} qualified`}
              icon={<Target className="h-5 w-5" />}
            />
            <StatWidget
              title="Qualified Leads"
              value={data.widgets.qualifiedLeads}
              subtitle={`${data.conversionRates.leadToQualified}% conversion`}
              icon={<UserCheck className="h-5 w-5" />}
              trend={data.conversionRates.leadToQualified > 50 ? 'up' : 'neutral'}
            />
            <StatWidget
              title="Open Deals"
              value={data.widgets.openDeals}
              subtitle={formatCurrency(data.widgets.pipelineValue) + ' pipeline'}
              icon={<Handshake className="h-5 w-5" />}
            />
            <StatWidget
              title="Closed Deals"
              value={data.widgets.closedWonDeals}
              subtitle={`${data.widgets.closedLostDeals} lost`}
              icon={<Trophy className="h-5 w-5" />}
              trend={data.widgets.closedWonDeals > data.widgets.closedLostDeals ? 'up' : 'down'}
            />
            <StatWidget
              title="Revenue"
              value={formatCurrency(data.widgets.totalRevenue)}
              subtitle={`${data.conversionRates.dealWinRate}% win rate`}
              icon={<DollarSign className="h-5 w-5" />}
              trend={data.conversionRates.dealWinRate > 50 ? 'up' : 'neutral'}
            />
            <StatWidget
              title="Tasks Due Today"
              value={data.widgets.tasksDueToday}
              subtitle={`${data.widgets.totalTasks} total tasks`}
              icon={<CalendarClock className="h-5 w-5" />}
              trend={data.widgets.tasksDueToday > 5 ? 'down' : 'neutral'}
            />
          </>
        )}
      </div>

      {/* ── Secondary stats row ───────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <WidgetSkeleton key={i} />)
        ) : (
          <>
            <StatWidget
              title="Total Contacts"
              value={data.widgets.totalContacts}
              icon={<Users className="h-5 w-5" />}
            />
            <StatWidget
              title="Total Companies"
              value={data.widgets.totalCompanies}
              icon={<Building2 className="h-5 w-5" />}
            />
            <StatWidget
              title="Pipeline Value"
              value={formatCurrency(data.widgets.pipelineValue)}
              subtitle={`${data.widgets.openDeals} open deals`}
              icon={<Briefcase className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {/* ── Revenue trend (full width) ────────────────────────────────── */}
      {loading ? (
        <ChartSkeleton className="col-span-full" />
      ) : (
        <RevenueTrendChart data={data.monthlyData} />
      )}

      {/* ── Monthly activity report (full width) ──────────────────────── */}
      {loading ? (
        <ChartSkeleton className="col-span-full" />
      ) : (
        <MonthlyActivityChart data={data.monthlyData} />
      )}

      {/* ── Lead & Deal charts ────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <LeadPipelineChart data={data.leadPipeline} />
            <DealFunnelChart data={data.dealFunnel} />
          </>
        )}
      </div>

      {/* ── Deal value + Conversion rates ─────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <DealValueChart data={data.dealStageValues} />
            <ConversionRateChart data={data.conversionRates} />
          </>
        )}
      </div>

      {/* ── Task & Lead source charts ─────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <TaskStatusChart data={data.taskDistribution} />
            <TaskPriorityChart data={data.taskPriorityDistribution} />
            <LeadSourceChart data={data.leadSourceDistribution} />
          </>
        )}
      </div>
    </div>
  );
}
