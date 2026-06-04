'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyData {
  month: string;
  leads: number;
  contacts: number;
  dealsCreated: number;
  dealsClosed: number;
  revenue: number;
}

export function MonthlyActivityChart({ data }: { data: MonthlyData[] }) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">Monthly Activity Report</CardTitle>
        <CardDescription>Leads, contacts, and deals created per month (last 6 months)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Leads"
              />
              <Line
                type="monotone"
                dataKey="contacts"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Contacts"
              />
              <Line
                type="monotone"
                dataKey="dealsCreated"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Deals Created"
              />
              <Line
                type="monotone"
                dataKey="dealsClosed"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Deals Closed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
