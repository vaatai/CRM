'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DEAL_STAGE_COLORS, formatLabel, formatCurrency } from './chart-colors';

interface DealFunnelData {
  stage: string;
  count: number;
}

interface DealStageValueData {
  stage: string;
  value: number;
}

export function DealFunnelChart({ data }: { data: DealFunnelData[] }) {
  const ordered = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  const sorted = [...data].sort((a, b) => ordered.indexOf(a.stage) - ordered.indexOf(b.stage));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deal Funnel</CardTitle>
        <CardDescription>Deals by stage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="stage"
                tickFormatter={formatLabel}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [String(value), 'Deals']}
                labelFormatter={(label) => formatLabel(String(label))}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {sorted.map((entry) => (
                  <Cell key={entry.stage} fill={DEAL_STAGE_COLORS[entry.stage] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function DealValueChart({ data }: { data: DealStageValueData[] }) {
  const ordered = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  const sorted = [...data].sort((a, b) => ordered.indexOf(a.stage) - ordered.indexOf(b.stage));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deal Value by Stage</CardTitle>
        <CardDescription>Total deal value per stage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="stage"
                tickFormatter={formatLabel}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']}
                labelFormatter={(label) => formatLabel(String(label))}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {sorted.map((entry) => (
                  <Cell key={entry.stage} fill={DEAL_STAGE_COLORS[entry.stage] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
