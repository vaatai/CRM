'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS, formatLabel } from './chart-colors';

interface LeadSourceData {
  source: string;
  count: number;
}

function renderLabel(props: PieLabelRenderProps) {
  const source = String((props as PieLabelRenderProps & { source?: string }).source ?? '');
  const count = Number(props.value ?? 0);
  return `${formatLabel(source)}: ${count}`;
}

export function LeadSourceChart({ data }: { data: LeadSourceData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leads by Source</CardTitle>
        <CardDescription>Where your leads come from</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="count"
                nameKey="source"
                label={renderLabel}
              >
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [String(value), 'Leads']}
                labelFormatter={(label) => formatLabel(String(label))}
              />
              <Legend formatter={(value) => formatLabel(String(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
