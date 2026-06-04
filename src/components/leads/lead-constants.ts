export const LEAD_STATUSES = [
  { value: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'bg-green-100 text-green-800' },
  { value: 'UNQUALIFIED', label: 'Unqualified', color: 'bg-gray-100 text-gray-800' },
  { value: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-100 text-purple-800' },
  { value: 'WON', label: 'Won', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'LOST', label: 'Lost', color: 'bg-red-100 text-red-800' },
  { value: 'CONVERTED', label: 'Converted', color: 'bg-indigo-100 text-indigo-800' },
] as const;

export const LEAD_SOURCES = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'ADVERTISEMENT', label: 'Advertisement' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function getStatusConfig(status: string) {
  return LEAD_STATUSES.find((s) => s.value === status) ?? LEAD_STATUSES[0];
}

export function getSourceLabel(source: string) {
  return LEAD_SOURCES.find((s) => s.value === source)?.label ?? source;
}

export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}
