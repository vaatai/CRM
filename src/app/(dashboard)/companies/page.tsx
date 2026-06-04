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
  Globe,
  Users,
  Briefcase,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyFormDialog, type CompanyFormData } from '@/components/companies/company-form-dialog';
import { DeleteCompanyDialog } from '@/components/companies/delete-company-dialog';

interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { contacts: number; deals: number };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CompaniesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchInput, setSearchInput] = React.useState(searchParams.get('search') || '');
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = React.useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = React.useState(searchParams.get('sortOrder') || 'desc');
  const [page, setPage] = React.useState(parseInt(searchParams.get('page') || '1'));

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editCompany, setEditCompany] = React.useState<Company | null>(null);
  const [deleteCompany, setDeleteCompany] = React.useState<Company | null>(null);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

  const [fetchKey, setFetchKey] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const abortController = new AbortController();

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '10');
    if (searchQuery) params.set('search', searchQuery);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/companies?${params.toString()}`, {
          signal: abortController.signal,
        });
        const json = await res.json();
        if (json.success && !abortController.signal.aborted) {
          setCompanies(json.data.companies);
          setPagination(json.data.pagination);
        }
      } catch {
        // Aborted or network error
      }
    });

    return () => abortController.abort();
  }, [page, searchQuery, sortBy, sortOrder, fetchKey]);

  const loading = isPending;

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(`/companies${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchQuery, sortBy, sortOrder, page, router]);

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

  async function handleCreate(data: CompanyFormData) {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setFetchKey((k) => k + 1);
    }
  }

  async function handleEdit(data: CompanyFormData) {
    if (!editCompany) return;
    const res = await fetch(`/api/companies/${editCompany.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditCompany(null);
      setFetchKey((k) => k + 1);
    }
  }

  async function handleDelete() {
    if (!deleteCompany) return;
    const res = await fetch(`/api/companies/${deleteCompany.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteCompany(null);
      if (companies.length === 1 && page > 1) {
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
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground text-sm">
            Manage your companies and track their contacts and deals.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Company
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search companies..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
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
                    onClick={() => toggleSort('name')}
                  >
                    Company
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Industry</th>
                <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Website</th>
                <th className="px-4 py-3 text-center font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Contacts
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Deals
                  </span>
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
                    <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="hidden px-4 py-3 sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {searchQuery
                      ? 'No companies match your search.'
                      : 'No companies yet. Create your first company to get started.'}
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/companies/${company.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {company.name}
                      </Link>
                      {company.size && (
                        <p className="text-xs text-muted-foreground">{company.size}</p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell text-muted-foreground">
                      {company.industry ?? '-'}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {company.website ? (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Globe className="h-3.5 w-3.5" />
                          {company.website.replace(/^https?:\/\//, '')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{company._count.contacts}</td>
                    <td className="px-4 py-3 text-center">{company._count.deals}</td>
                    <td className="hidden px-4 py-3 sm:table-cell text-muted-foreground">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setActiveMenu(activeMenu === company.id ? null : company.id)
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {activeMenu === company.id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border bg-popover shadow-md">
                            <Link
                              href={`/companies/${company.id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => setActiveMenu(null)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => {
                                setEditCompany(company);
                                setActiveMenu(null);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                              onClick={() => {
                                setDeleteCompany(company);
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
              {pagination.total} companies
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
      <CompanyFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        mode="create"
      />
      {editCompany && (
        <CompanyFormDialog
          open={!!editCompany}
          onOpenChange={(open) => !open && setEditCompany(null)}
          onSubmit={handleEdit}
          initialData={{
            name: editCompany.name,
            website: editCompany.website ?? '',
            industry: editCompany.industry ?? '',
            size: editCompany.size ?? '',
            phone: editCompany.phone ?? '',
            email: editCompany.email ?? '',
            address: editCompany.address ?? '',
            city: editCompany.city ?? '',
            state: editCompany.state ?? '',
            country: editCompany.country ?? '',
            description: editCompany.description ?? '',
          }}
          mode="edit"
        />
      )}
      {deleteCompany && (
        <DeleteCompanyDialog
          open={!!deleteCompany}
          onOpenChange={(open) => !open && setDeleteCompany(null)}
          onConfirm={handleDelete}
          companyName={deleteCompany.name}
        />
      )}
    </div>
  );
}
