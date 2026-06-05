'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Pencil, Trash2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRoleColor, RESOURCE_LABELS } from '@/components/rbac/rbac-constants';
import { RoleFormDialog } from '@/components/rbac/role-form-dialog';
import { DeleteRoleDialog } from '@/components/rbac/delete-role-dialog';

interface Permission {
  id: string;
  action: string;
  resource: string;
}

interface RolePermission {
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  permissions: RolePermission[];
  _count: { members: number };
}

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const triggerRefresh = () => setRefresh((r) => r + 1);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/roles', { signal: controller.signal });
        const data = await res.json();
        if (data.success) {
          setRoles(data.data.roles);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [refresh]);

  const handleCreate = async (formData: {
    name: string;
    description: string;
    permissionIds: string[];
  }) => {
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to create role');
    }
    triggerRefresh();
  };

  const handleEdit = async (formData: {
    name: string;
    description: string;
    permissionIds: string[];
  }) => {
    if (!editRole) return;
    const res = await fetch(`/api/roles/${editRole.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to update role');
    }
    triggerRefresh();
  };

  const handleDelete = async () => {
    if (!deleteRole) return;
    const res = await fetch(`/api/roles/${deleteRole.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to delete role');
    }
    triggerRefresh();
  };

  // Group permissions by resource for the expanded view
  const groupPermissions = (perms: RolePermission[]) => {
    const grouped: Record<string, string[]> = {};
    for (const rp of perms) {
      const { resource, action } = rp.permission;
      if (!grouped[resource]) grouped[resource] = [];
      grouped[resource].push(action);
    }
    return grouped;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm">
            Manage roles and their permission sets for your organization
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No roles configured yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => {
            const isExpanded = expandedRole === role.id;
            const permGroups = groupPermissions(role.permissions);

            return (
              <Card key={role.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex cursor-pointer items-center gap-3"
                      onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                    >
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleColor(role.name)}`}
                      >
                        {role.name}
                      </span>
                      {role.isSystem && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                          SYSTEM
                        </span>
                      )}
                      {role.isDefault && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-500">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        {role._count.members} member{role._count.members !== 1 ? 's' : ''}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {role.permissions.length} permissions
                      </span>
                      {!role.isSystem && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditRole(role)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => setDeleteRole(role)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {role.description && (
                    <p className="text-muted-foreground text-xs">{role.description}</p>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <CardTitle className="mb-2 text-xs font-medium">Permission Matrix</CardTitle>
                    <div className="rounded-md border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-1.5 text-left font-medium">Resource</th>
                            <th className="p-1.5 text-center font-medium">View</th>
                            <th className="p-1.5 text-center font-medium">Create</th>
                            <th className="p-1.5 text-center font-medium">Edit</th>
                            <th className="p-1.5 text-center font-medium">Delete</th>
                            <th className="p-1.5 text-center font-medium">Manage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(RESOURCE_LABELS).map((resource) => (
                            <tr key={resource} className="border-b last:border-b-0">
                              <td className="p-1.5 font-medium">
                                {RESOURCE_LABELS[resource]}
                              </td>
                              {['read', 'create', 'update', 'delete', 'manage'].map((action) => (
                                <td key={action} className="p-1.5 text-center">
                                  {permGroups[resource]?.includes(action) ? (
                                    <span className="text-green-600">&#10003;</span>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <RoleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        mode="create"
      />

      <RoleFormDialog
        open={!!editRole}
        onOpenChange={(open) => !open && setEditRole(null)}
        onSubmit={handleEdit}
        initialData={
          editRole
            ? {
                name: editRole.name,
                description: editRole.description,
                permissionIds: editRole.permissions.map((rp) => rp.permission.id),
              }
            : undefined
        }
        mode="edit"
      />

      <DeleteRoleDialog
        open={!!deleteRole}
        onOpenChange={(open) => !open && setDeleteRole(null)}
        onConfirm={handleDelete}
        roleName={deleteRole?.name || ''}
      />
    </div>
  );
}
