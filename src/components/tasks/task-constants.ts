export const TASK_STATUSES = [
  { value: 'TODO', label: 'To Do', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
] as const;

export const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-300' },
] as const;

export const TASK_TYPES = [
  { value: 'CALL', label: 'Call', icon: '📞' },
  { value: 'MEETING', label: 'Meeting', icon: '🤝' },
  { value: 'EMAIL', label: 'Email', icon: '✉️' },
  { value: 'FOLLOW_UP', label: 'Follow Up', icon: '🔄' },
] as const;

export function getTaskStatusLabel(status: string): string {
  return TASK_STATUSES.find((s) => s.value === status)?.label || status;
}

export function getTaskStatusColor(status: string): string {
  return TASK_STATUSES.find((s) => s.value === status)?.color || 'bg-gray-100 text-gray-800 border-gray-300';
}

export function getTaskPriorityLabel(priority: string): string {
  return TASK_PRIORITIES.find((p) => p.value === priority)?.label || priority;
}

export function getTaskPriorityColor(priority: string): string {
  return TASK_PRIORITIES.find((p) => p.value === priority)?.color || 'bg-gray-100 text-gray-800 border-gray-300';
}

export function getTaskTypeLabel(type: string | null | undefined): string {
  if (!type) return '-';
  return TASK_TYPES.find((t) => t.value === type)?.label || type;
}

export function getTaskTypeIcon(type: string | null | undefined): string {
  if (!type) return '';
  return TASK_TYPES.find((t) => t.value === type)?.icon || '';
}
