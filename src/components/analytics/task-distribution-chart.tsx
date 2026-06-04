'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, formatLabel } from './chart-colors';

interface TaskStatusData {
  status: string;
  count: number;
}

interface TaskPriorityData {
  priority: string;
  count: number;
}

function renderStatusLabel(props: PieLabelRenderProps) {
  const status = String((props as PieLabelRenderProps & { status?: string }).status ?? '');
  const count = Number(props.value ?? 0);
  return `${formatLabel(status)}: ${count}`;
}

function renderPriorityLabel(props: PieLabelRenderProps) {
  const priority = String((props as PieLabelRenderProps & { priority?: string }).priority ?? '');
  const count = Number(props.value ?? 0);
  return `${formatLabel(priority)}: ${count}`;
}

export function TaskStatusChart({ data }: { data: TaskStatusData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tasks by Status</CardTitle>
        <CardDescription>Distribution of tasks across statuses</CardDescription>
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
                nameKey="status"
                label={renderStatusLabel}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={TASK_STATUS_COLORS[entry.status] || '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [String(value), 'Tasks']}
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

export function TaskPriorityChart({ data }: { data: TaskPriorityData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tasks by Priority</CardTitle>
        <CardDescription>Distribution of tasks across priorities</CardDescription>
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
                nameKey="priority"
                label={renderPriorityLabel}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.priority}
                    fill={TASK_PRIORITY_COLORS[entry.priority] || '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [String(value), 'Tasks']}
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
