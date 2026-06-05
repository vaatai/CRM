'use client';

import { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RESOURCE_LABELS, ACTION_LABELS } from './rbac-constants';

interface Permission {
  id: string;
  action: string;
  resource: string;
  description: string | null;
}

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string; permissionIds: string[] }) => Promise<void>;
  initialData?: {
    name?: string;
    description?: string | null;
    permissionIds?: string[];
  };
  mode: 'create' | 'edit';
}

function RoleFormContent({
  onSubmit,
  onCancel,
  initialData,
  mode,
}: {
  onSubmit: RoleFormDialogProps['onSubmit'];
  onCancel: () => void;
  initialData?: RoleFormDialogProps['initialData'];
  mode: 'create' | 'edit';
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(initialData?.permissionIds || [])
  );
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/permissions', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPermissions(data.data.permissions);
          setGrouped(data.data.grouped);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const togglePermission = useCallback((id: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleResource = useCallback(
    (resource: string) => {
      const resourcePerms = grouped[resource] || [];
      const allSelected = resourcePerms.every((p) => selectedPermissions.has(p.id));
      setSelectedPermissions((prev) => {
        const next = new Set(prev);
        for (const p of resourcePerms) {
          if (allSelected) next.delete(p.id);
          else next.add(p.id);
        }
        return next;
      });
    },
    [grouped, selectedPermissions]
  );

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        name,
        description,
        permissionIds: Array.from(selectedPermissions),
      });
    } finally {
      setSaving(false);
    }
  };

  const resourceOrder = Object.keys(RESOURCE_LABELS);
  const sortedResources = Object.keys(grouped).sort(
    (a, b) => resourceOrder.indexOf(a) - resourceOrder.indexOf(b)
  );

  return (
    <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="role-name">Name</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sales Manager"
          />
        </div>

        <div>
          <Label htmlFor="role-desc">Description</Label>
          <Textarea
            id="role-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this role can do..."
            rows={2}
          />
        </div>

        <div>
          <Label>Permissions</Label>
          <p className="text-muted-foreground mb-3 text-xs">
            {selectedPermissions.size} of {permissions.length} permissions selected
          </p>

          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Resource</th>
                  {['read', 'create', 'update', 'delete', 'manage'].map((action) => (
                    <th key={action} className="p-2 text-center font-medium">
                      {ACTION_LABELS[action] || action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedResources.map((resource) => {
                  const perms = grouped[resource] || [];
                  const allSelected = perms.every((p) => selectedPermissions.has(p.id));
                  const someSelected = perms.some((p) => selectedPermissions.has(p.id));

                  return (
                    <tr key={resource} className="border-b last:border-b-0">
                      <td className="p-2">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={() => toggleResource(resource)}
                            className="h-3.5 w-3.5 rounded"
                          />
                          <span className="font-medium">
                            {RESOURCE_LABELS[resource] || resource}
                          </span>
                        </label>
                      </td>
                      {['read', 'create', 'update', 'delete', 'manage'].map((action) => {
                        const perm = perms.find((p) => p.action === action);
                        if (!perm) return <td key={action} className="p-2 text-center">—</td>;
                        return (
                          <td key={action} className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="h-3.5 w-3.5 rounded"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </>
  );
}

export function RoleFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: RoleFormDialogProps) {
  const handleSubmit = async (data: {
    name: string;
    description: string;
    permissionIds: string[];
  }) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Role' : 'Edit Role'}</DialogTitle>
        </DialogHeader>
        {open && (
          <RoleFormContent
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            initialData={initialData}
            mode={mode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
