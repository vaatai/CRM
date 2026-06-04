export const DEAL_STAGES = [
  { value: 'PROSPECTING', label: 'Lead', color: 'bg-slate-100 text-slate-800 border-slate-300', columnColor: 'border-t-slate-500' },
  { value: 'QUALIFICATION', label: 'Qualified', color: 'bg-blue-100 text-blue-800 border-blue-300', columnColor: 'border-t-blue-500' },
  { value: 'PROPOSAL', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', columnColor: 'border-t-yellow-500' },
  { value: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-100 text-orange-800 border-orange-300', columnColor: 'border-t-orange-500' },
  { value: 'CLOSED_WON', label: 'Won', color: 'bg-green-100 text-green-800 border-green-300', columnColor: 'border-t-green-500' },
  { value: 'CLOSED_LOST', label: 'Lost', color: 'bg-red-100 text-red-800 border-red-300', columnColor: 'border-t-red-500' },
] as const;

export const ACTIVITY_TYPES = [
  { value: 'CALL', label: 'Call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'NOTE', label: 'Note' },
  { value: 'TASK', label: 'Task' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function getDealStageLabel(stage: string) {
  return DEAL_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export function getDealStageColor(stage: string) {
  return DEAL_STAGES.find((s) => s.value === stage)?.color ?? 'bg-gray-100 text-gray-800';
}

export function getDealStageColumnColor(stage: string) {
  return DEAL_STAGES.find((s) => s.value === stage)?.columnColor ?? 'border-t-gray-500';
}

export function getActivityTypeLabel(type: string) {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function formatCurrency(value: number | string | null | undefined, currency = 'USD') {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
}

export function formatCompactCurrency(value: number | string | null | undefined, currency = 'USD') {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: 'compact' }).format(num);
}
