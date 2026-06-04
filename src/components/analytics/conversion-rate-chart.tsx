'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from './chart-colors';

interface ConversionRates {
  leadToQualified: number;
  leadToWon: number;
  leadToConverted: number;
  dealWinRate: number;
}

export function ConversionRateChart({ data }: { data: ConversionRates }) {
  const chartData = [
    { name: 'Lead → Qualified', rate: data.leadToQualified },
    { name: 'Lead → Won', rate: data.leadToWon },
    { name: 'Lead → Converted', rate: data.leadToConverted },
    { name: 'Deal Win Rate', rate: data.dealWinRate },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conversion Rates</CardTitle>
        <CardDescription>Key pipeline conversion percentages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={120}
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Rate']} />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={24}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
