export const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
] as const;

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: '#94a3b8',
  CONTACTED: '#3b82f6',
  QUALIFIED: '#10b981',
  UNQUALIFIED: '#f87171',
  PROPOSAL: '#f59e0b',
  WON: '#22c55e',
  LOST: '#ef4444',
  CONVERTED: '#8b5cf6',
};

export const DEAL_STAGE_COLORS: Record<string, string> = {
  PROSPECTING: '#94a3b8',
  QUALIFICATION: '#3b82f6',
  PROPOSAL: '#f59e0b',
  NEGOTIATION: '#f97316',
  CLOSED_WON: '#22c55e',
  CLOSED_LOST: '#ef4444',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

export function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
