'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LEAD_STATUS_COLORS, formatLabel } from './chart-colors';

interface LeadPipelineData {
  status: string;
  count: number;
}

export function LeadPipelineChart({ data }: { data: LeadPipelineData[] }) {
  const ordered = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'CONVERTED'];
  const sorted = [...data].sort((a, b) => ordered.indexOf(a.status) - ordered.indexOf(b.status));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lead Pipeline</CardTitle>
        <CardDescription>Leads by status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="status"
                tickFormatter={formatLabel}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [String(value), 'Leads']}
                labelFormatter={(label) => formatLabel(String(label))}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {sorted.map((entry) => (
                  <Cell key={entry.status} fill={LEAD_STATUS_COLORS[entry.status] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
