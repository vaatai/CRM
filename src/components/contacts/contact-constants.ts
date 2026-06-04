export const CONTACT_SOURCES = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'ADVERTISEMENT', label: 'Advertisement' },
  { value: 'EVENT', label: 'Event' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const ACTIVITY_TYPES = [
  { value: 'CALL', label: 'Call', icon: 'Phone' },
  { value: 'EMAIL', label: 'Email', icon: 'Mail' },
  { value: 'MEETING', label: 'Meeting', icon: 'Users' },
  { value: 'NOTE', label: 'Note', icon: 'FileText' },
  { value: 'TASK', label: 'Task', icon: 'CheckSquare' },
  { value: 'OTHER', label: 'Other', icon: 'MoreHorizontal' },
] as const;

export function getSourceLabel(source: string) {
  return CONTACT_SOURCES.find((s) => s.value === source)?.label ?? source;
}

export function getActivityTypeLabel(type: string) {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label ?? type;
}
