'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadStatusBadge } from '@/components/leads/lead-status-badge';
import { LeadFormDialog } from '@/components/leads/lead-form-dialog';
import { DeleteLeadDialog } from '@/components/leads/delete-lead-dialog';
import { LEAD_STATUSES, LEAD_SOURCES, getSourceLabel, formatCurrency } from '@/components/leads/lead-constants';

interface LeadOwner {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

interface LeadContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

interface Lead {
  id: string;
  title: string;
  status: string;
  source: string;
  value: string | number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  owner: LeadOwner | null;
  contact: LeadContact | null;
  _count: { notes: number; tags: number };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchInput, setSearchInput] = React.useState(searchParams.get('search') || '');
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get('status') || '');
  const [sourceFilter, setSourceFilter] = React.useState(searchParams.get('source') || '');
  const [sortBy, setSortBy] = React.useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = React.useState(searchParams.get('sortOrder') || 'desc');
  const [page, setPage] = React.useState(parseInt(searchParams.get('page') || '1'));

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editLead, setEditLead] = React.useState<Lead | null>(null);
  const [deleteLead, setDeleteLead] = React.useState<Lead | null>(null);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

  const [fetchKey, setFetchKey] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const abortController = new AbortController();

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '10');
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter) params.set('status', statusFilter);
    if (sourceFilter) params.set('source', sourceFilter);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/leads?${params.toString()}`, {
          signal: abortController.signal,
        });
        const json = await res.json();
        if (json.success && !abortController.signal.aborted) {
          setLeads(json.data.leads);
          setPagination(json.data.pagination);
        }
      } catch {
        // Aborted or network error
      }
    });

    return () => abortController.abort();
  }, [page, searchQuery, statusFilter, sourceFilter, sortBy, sortOrder, fetchKey]);

  const loading = isPending;

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter) params.set('status', statusFilter);
    if (sourceFilter) params.set('source', sourceFilter);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(`/leads${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchQuery, statusFilter, sourceFilter, sortBy, sortOrder, page, router]);

  const debounceTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(1);
    }, 300);
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  }

  async function handleCreate(data: { title: string; status: string; source: string; value: string; description: string }) {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setFetchKey((k) => k + 1);
    }
  }

  async function handleEdit(data: { title: string; status: string; source: string; value: string; description: string }) {
    if (!editLead) return;
    const res = await fetch(`/api/leads/${editLead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditLead(null);
      setFetchKey((k) => k + 1);
    }
  }

  async function handleDelete() {
    if (!deleteLead) return;
    const res = await fetch(`/api/leads/${deleteLead.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteLead(null);
      if (leads.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setFetchKey((k) => k + 1);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm">
            Manage your sales leads and track their progress.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search leads..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          >
            <option value="">All Sources</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort('title')}
                  >
                    Title
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort('status')}
                  >
                    Status
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Source</th>
                <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Contact</th>
                <th className="px-4 py-3 text-left font-medium">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort('value')}
                  >
                    Value
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort('createdAt')}
                  >
                    Created
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="hidden px-4 py-3 sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {searchQuery || statusFilter || sourceFilter
                      ? 'No leads match your filters.'
                      : 'No leads yet. Create your first lead to get started.'}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {lead.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell text-muted-foreground">
                      {getSourceLabel(lead.source)}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell text-muted-foreground">
                      {lead.contact
                        ? `${lead.contact.firstName} ${lead.contact.lastName}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(lead.value)}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setActiveMenu(activeMenu === lead.id ? null : lead.id)
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {activeMenu === lead.id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border bg-popover shadow-md">
                            <Link
                              href={`/leads/${lead.id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => setActiveMenu(null)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => {
                                setEditLead(lead);
                                setActiveMenu(null);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                              onClick={() => {
                                setDeleteLead(lead);
                                setActiveMenu(null);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-muted-foreground text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} leads
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <LeadFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        mode="create"
      />
      {editLead && (
        <LeadFormDialog
          open={!!editLead}
          onOpenChange={(open) => !open && setEditLead(null)}
          onSubmit={handleEdit}
          initialData={{
            title: editLead.title,
            status: editLead.status,
            source: editLead.source,
            value: editLead.value?.toString() ?? '',
            description: editLead.description ?? '',
          }}
          mode="edit"
        />
      )}
      {deleteLead && (
        <DeleteLeadDialog
          open={!!deleteLead}
          onOpenChange={(open) => !open && setDeleteLead(null)}
          onConfirm={handleDelete}
          leadTitle={deleteLead.title}
        />
      )}
    </div>
  );
}
