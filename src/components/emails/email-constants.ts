export const EMAIL_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  { value: 'QUEUED', label: 'Queued', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'SENT', label: 'Sent', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'OPENED', label: 'Opened', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'CLICKED', label: 'Clicked', color: 'bg-violet-100 text-violet-800 border-violet-300' },
  { value: 'BOUNCED', label: 'Bounced', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'FAILED', label: 'Failed', color: 'bg-red-100 text-red-800 border-red-300' },
] as const;

export const EMAIL_EVENT_TYPES = [
  { value: 'SENT', label: 'Sent', icon: '📤' },
  { value: 'DELIVERED', label: 'Delivered', icon: '📬' },
  { value: 'OPENED', label: 'Opened', icon: '👁️' },
  { value: 'CLICKED', label: 'Clicked', icon: '🔗' },
  { value: 'BOUNCED', label: 'Bounced', icon: '↩️' },
  { value: 'COMPLAINED', label: 'Complained', icon: '⚠️' },
  { value: 'FAILED', label: 'Failed', icon: '❌' },
] as const;

export function getStatusInfo(status: string) {
  return EMAIL_STATUSES.find((s) => s.value === status) || EMAIL_STATUSES[0];
}

export function getEventInfo(type: string) {
  return EMAIL_EVENT_TYPES.find((e) => e.value === type) || EMAIL_EVENT_TYPES[0];
}
