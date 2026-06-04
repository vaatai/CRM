'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from './chart-colors';

interface MonthlyData {
  month: string;
  leads: number;
  contacts: number;
  dealsCreated: number;
  dealsClosed: number;
  revenue: number;
}

export function RevenueTrendChart({ data }: { data: MonthlyData[] }) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">Revenue Trend</CardTitle>
        <CardDescription>Monthly revenue from closed-won deals (last 6 months)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#revenueGradient)"
                strokeWidth={2}
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
