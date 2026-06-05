export const RESOURCE_LABELS: Record<string, string> = {
  lead: 'Leads',
  contact: 'Contacts',
  company: 'Companies',
  deal: 'Deals',
  task: 'Tasks',
  note: 'Notes',
  activity: 'Activities',
  analytics: 'Reports',
  user: 'Users',
  role: 'Roles',
  email: 'Email',
};

export const ACTION_LABELS: Record<string, string> = {
  create: 'Create',
  read: 'View',
  update: 'Edit',
  delete: 'Delete',
  manage: 'Manage',
};

export const ROLE_COLORS: Record<string, string> = {
  Owner: 'bg-purple-100 text-purple-800',
  Admin: 'bg-blue-100 text-blue-800',
  Manager: 'bg-green-100 text-green-800',
  'Sales Agent': 'bg-orange-100 text-orange-800',
};

export function getRoleColor(roleName: string): string {
  return ROLE_COLORS[roleName] || 'bg-gray-100 text-gray-800';
}
