import { auth } from '@clerk/nextjs/server';

import { prisma } from './prisma';
import { ForbiddenError, UnauthorizedError } from './errors';
import { logger } from './logger';

// ─── Permission constants ────────────────────────────────────────────────────

export const RESOURCES = [
  'lead',
  'contact',
  'company',
  'deal',
  'task',
  'note',
  'activity',
  'analytics',
  'user',
  'role',
  'email',
] as const;

export const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export type PermissionKey = `${Action}:${Resource}`;

// ─── Predefined system roles ─────────────────────────────────────────────────

export const SYSTEM_ROLES = {
  OWNER: {
    name: 'Owner',
    description: 'Full access to all resources including user and role management',
    isDefault: false,
  },
  ADMIN: {
    name: 'Admin',
    description: 'Full access to all CRM resources and user management',
    isDefault: false,
  },
  MANAGER: {
    name: 'Manager',
    description: 'Can manage leads, contacts, deals, and view reports',
    isDefault: false,
  },
  SALES_AGENT: {
    name: 'Sales Agent',
    description: 'Can view and edit leads, contacts, deals; limited delete access',
    isDefault: true,
  },
} as const;

// Permission sets per role
export const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  Owner: [
    // All permissions
    ...RESOURCES.flatMap((r) =>
      ACTIONS.filter((a) => {
        if (a === 'manage' && !['user', 'role', 'email'].includes(r)) return false;
        if (a !== 'manage' && ['user', 'role'].includes(r)) return false;
        return true;
      }).map((a) => `${a}:${r}` as PermissionKey)
    ),
  ],
  Admin: [
    // All CRM CRUD + manage users, but not manage roles
    ...['lead', 'contact', 'company', 'deal', 'task', 'note', 'activity', 'email'].flatMap((r) =>
      (['create', 'read', 'update', 'delete'] as const).map((a) => `${a}:${r}` as PermissionKey)
    ),
    'read:analytics' as PermissionKey,
    'manage:user' as PermissionKey,
    'manage:email' as PermissionKey,
  ],
  Manager: [
    // CRUD on core CRM resources (no delete on contacts/companies)
    ...['lead', 'deal', 'task', 'note', 'activity'].flatMap((r) =>
      (['create', 'read', 'update', 'delete'] as const).map((a) => `${a}:${r}` as PermissionKey)
    ),
    ...['contact', 'company'].flatMap((r) =>
      (['create', 'read', 'update'] as const).map((a) => `${a}:${r}` as PermissionKey)
    ),
    'read:analytics' as PermissionKey,
    'read:email' as PermissionKey,
    'create:email' as PermissionKey,
  ],
  'Sales Agent': [
    // Read all, create/update leads & deals, no delete, no manage
    ...['lead', 'contact', 'company', 'deal', 'task', 'note', 'activity'].map(
      (r) => `read:${r}` as PermissionKey
    ),
    ...['lead', 'deal', 'task', 'note', 'activity'].flatMap((r) =>
      (['create', 'update'] as const).map((a) => `${a}:${r}` as PermissionKey)
    ),
    'read:analytics' as PermissionKey,
    'read:email' as PermissionKey,
  ],
};

// ─── Auth context ────────────────────────────────────────────────────────────

export interface AuthContext {
  userId: string;
  organizationId: string;
  memberId: string;
  roleId: string | null;
  roleName: string | null;
  permissions: PermissionKey[];
}

/**
 * Get the current user's auth context including organization membership and permissions.
 * Throws UnauthorizedError if not authenticated or not a member of any organization.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new UnauthorizedError('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    throw new UnauthorizedError('User not found in database');
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  if (!membership) {
    throw new UnauthorizedError('Not a member of any organization');
  }

  const permissions: PermissionKey[] = membership.role
    ? membership.role.permissions.map(
        (rp) => `${rp.permission.action}:${rp.permission.resource}` as PermissionKey
      )
    : [];

  return {
    userId: user.id,
    organizationId: membership.organizationId,
    memberId: membership.id,
    roleId: membership.role?.id ?? null,
    roleName: membership.role?.name ?? null,
    permissions,
  };
}

/**
 * Check if the auth context has a specific permission.
 */
export function hasPermission(ctx: AuthContext, action: Action, resource: Resource): boolean {
  const key: PermissionKey = `${action}:${resource}`;
  return ctx.permissions.includes(key);
}

/**
 * Require a specific permission. Throws ForbiddenError if not granted.
 */
export function requirePermission(ctx: AuthContext, action: Action, resource: Resource): void {
  if (!hasPermission(ctx, action, resource)) {
    logger.warn('Permission denied', {
      userId: ctx.userId,
      role: ctx.roleName,
      required: `${action}:${resource}`,
    });
    throw new ForbiddenError(
      `You do not have permission to ${action} ${resource}. Required role: contact your administrator.`
    );
  }
}

/**
 * Require any one of several permissions (OR logic).
 */
export function requireAnyPermission(
  ctx: AuthContext,
  checks: { action: Action; resource: Resource }[]
): void {
  const hasAny = checks.some((c) => hasPermission(ctx, c.action, c.resource));
  if (!hasAny) {
    const required = checks.map((c) => `${c.action}:${c.resource}`).join(' or ');
    throw new ForbiddenError(`Insufficient permissions. Required: ${required}`);
  }
}
