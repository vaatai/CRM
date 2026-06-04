export const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001+', label: '1001+ employees' },
] as const;

export const DEAL_STAGES = [
  { value: 'PROSPECTING', label: 'Prospecting', color: 'bg-gray-100 text-gray-800' },
  { value: 'QUALIFICATION', label: 'Qualification', color: 'bg-blue-100 text-blue-800' },
  { value: 'PROPOSAL', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  { value: 'CLOSED_WON', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
  { value: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
] as const;

export function getDealStageLabel(stage: string) {
  return DEAL_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export function getDealStageColor(stage: string) {
  return DEAL_STAGES.find((s) => s.value === stage)?.color ?? 'bg-gray-100 text-gray-800';
}

export function formatCurrency(value: number | string | null | undefined, currency = 'USD') {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
}
