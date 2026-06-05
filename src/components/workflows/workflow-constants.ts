export const TRIGGER_OPTIONS = [
  { value: 'LEAD_ASSIGNED', label: 'Lead Assigned', description: 'When a lead is assigned to a user', icon: '👤' },
  { value: 'LEAD_STATUS_CHANGED', label: 'Lead Status Changed', description: 'When a lead status changes', icon: '📊' },
  { value: 'DEAL_WON', label: 'Deal Won', description: 'When a deal is marked as won', icon: '🏆' },
  { value: 'TASK_OVERDUE', label: 'Task Overdue', description: 'When a task passes its due date', icon: '⏰' },
] as const;

export const ACTION_OPTIONS = [
  { value: 'SEND_EMAIL', label: 'Send Email', description: 'Send an email notification', icon: '📧', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'CREATE_TASK', label: 'Create Task', description: 'Create a follow-up task', icon: '✅', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'SEND_NOTIFICATION', label: 'Send Notification', description: 'Send an in-app notification', icon: '🔔', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'WEBHOOK', label: 'Webhook', description: 'Send data to an external URL', icon: '🔗', color: 'bg-purple-100 text-purple-700 border-purple-200' },
] as const;

export const LEAD_STATUSES = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'CONVERTED',
];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const TASK_TYPES = ['CALL', 'MEETING', 'EMAIL', 'FOLLOW_UP'];

export const EXECUTION_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  SKIPPED: 'bg-yellow-100 text-yellow-700',
};
