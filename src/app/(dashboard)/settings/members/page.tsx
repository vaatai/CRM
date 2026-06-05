'use client';

import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getRoleColor } from '@/components/rbac/rbac-constants';

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
}

interface Member {
  id: string;
  userId: string;
  roleId: string | null;
  joinedAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string | null;
    systemRole: string;
  };
  role: Role | null;
}

export default function MembersSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [refresh, setRefresh] = useState(0);

  const triggerRefresh = () => setRefresh((r) => r + 1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
        const [membersRes, rolesRes] = await Promise.all([
          fetch(`/api/members${searchParam}`, { signal: controller.signal }),
          fetch('/api/roles', { signal: controller.signal }),
        ]);
        const membersData = await membersRes.json();
        const rolesData = await rolesRes.json();

        if (membersData.success) setMembers(membersData.data.members);
        if (rolesData.success) setRoles(rolesData.data.roles);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [search, refresh]);

  const handleRoleChange = async (memberId: string, roleId: string | null) => {
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
    });
    if (res.ok) {
      triggerRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Members</h1>
        <p className="text-muted-foreground text-sm">
          Manage team members and their role assignments
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search members..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No members found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Member</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Role</th>
                <th className="p-3 text-left font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b last:border-b-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium">
                        {(member.user.firstName?.[0] || '') +
                          (member.user.lastName?.[0] || '') ||
                          member.user.email[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        {member.user.systemRole === 'SUPER_ADMIN' && (
                          <span className="text-[10px] text-yellow-600">System Admin</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-muted-foreground p-3">{member.user.email}</td>
                  <td className="p-3">
                    <select
                      value={member.roleId || ''}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value || null)
                      }
                      className="rounded-md border bg-transparent px-2 py-1 text-xs"
                    >
                      <option value="">No Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {member.role && (
                      <span
                        className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getRoleColor(member.role.name)}`}
                      >
                        {member.role.name}
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground p-3 text-xs">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
