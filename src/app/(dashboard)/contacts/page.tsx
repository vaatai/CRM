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
  Mail,
  Phone,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactSourceBadge } from '@/components/contacts/contact-source-badge';
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog';
import { DeleteContactDialog } from '@/components/contacts/delete-contact-dialog';
import { CONTACT_SOURCES } from '@/components/contacts/contact-constants';

interface ContactOwner {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

interface ContactCompany {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  source: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
  companyId: string | null;
  createdAt: string;
  updatedAt: string;
  owner: ContactOwner | null;
  company: ContactCompany | null;
  _count: { notes: number; activities: number; deals: number };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [companies, setCompanies] = React.useState<ContactCompany[]>([]);
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchInput, setSearchInput] = React.useState(searchParams.get('search') || '');
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('search') || '');
  const [sourceFilter, setSourceFilter] = React.useState(searchParams.get('source') || '');
  const [sortBy, setSortBy] = React.useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = React.useState(searchParams.get('sortOrder') || 'desc');
  const [page, setPage] = React.useState(parseInt(searchParams.get('page') || '1'));

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editContact, setEditContact] = React.useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = React.useState<Contact | null>(null);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

  const [fetchKey, setFetchKey] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    fetch('/api/companies')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setCompanies(json.data.companies ?? json.data ?? []);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const abortController = new AbortController();

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '10');
    if (searchQuery) params.set('search', searchQuery);
    if (sourceFilter) params.set('source', sourceFilter);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/contacts?${params.toString()}`, {
          signal: abortController.signal,
        });
        const json = await res.json();
        if (json.success && !abortController.signal.aborted) {
          setContacts(json.data.contacts);
          setPagination(json.data.pagination);
        }
      } catch {
        // Aborted or network error
      }
    });

    return () => abortController.abort();
  }, [page, searchQuery, sourceFilter, sortBy, sortOrder, fetchKey]);

  const loading = isPending;

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sourceFilter) params.set('source', sourceFilter);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(`/contacts${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchQuery, sourceFilter, sortBy, sortOrder, page, router]);

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

  async function handleCreate(data: { firstName: string; lastName: string; email: string; phone: string; title: string; source: string; address: string; city: string; state: string; country: string; description: string; companyId: string }) {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setFetchKey((k) => k + 1);
    }
  }

  async function handleEdit(data: { firstName: string; lastName: string; email: string; phone: string; title: string; source: string; address: string; city: string; state: string; country: string; description: string; companyId: string }) {
    if (!editContact) return;
    const res = await fetch(`/api/contacts/${editContact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditContact(null);
      setFetchKey((k) => k + 1);
    }
  }

  async function handleDelete() {
    if (!deleteContact) return;
    const res = await fetch(`/api/contacts/${deleteContact.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteContact(null);
      if (contacts.length === 1 && page > 1) {
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
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground text-sm">
            Manage your contacts and track interactions.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search contacts..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          >
            <option value="">All Sources</option>
            {CONTACT_SOURCES.map((s) => (
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
                    onClick={() => toggleSort('firstName')}
                  >
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort('email')}
                  >
                    Email
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Phone</th>
                <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Company</th>
                <th className="hidden px-4 py-3 text-left font-medium xl:table-cell">Designation</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
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
                    <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-4 w-36" /></td>
                    <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="hidden px-4 py-3 sm:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="hidden px-4 py-3 xl:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="hidden px-4 py-3 sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    {searchQuery || sourceFilter
                      ? 'No contacts match your filters.'
                      : 'No contacts yet. Add your first contact to get started.'}
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {contact.email ? (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {contact.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {contact.phone ? (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {contact.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell text-muted-foreground">
                      {contact.company?.name ?? '-'}
                    </td>
                    <td className="hidden px-4 py-3 xl:table-cell text-muted-foreground">
                      {contact.title ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <ContactSourceBadge source={contact.source} />
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell text-muted-foreground">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setActiveMenu(activeMenu === contact.id ? null : contact.id)
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {activeMenu === contact.id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border bg-popover shadow-md">
                            <Link
                              href={`/contacts/${contact.id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => setActiveMenu(null)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => {
                                setEditContact(contact);
                                setActiveMenu(null);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                              onClick={() => {
                                setDeleteContact(contact);
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
              {pagination.total} contacts
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
      <ContactFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        mode="create"
        companies={companies}
      />
      {editContact && (
        <ContactFormDialog
          open={!!editContact}
          onOpenChange={(open) => !open && setEditContact(null)}
          onSubmit={handleEdit}
          initialData={{
            firstName: editContact.firstName,
            lastName: editContact.lastName,
            email: editContact.email ?? '',
            phone: editContact.phone ?? '',
            title: editContact.title ?? '',
            source: editContact.source,
            address: editContact.address ?? '',
            city: editContact.city ?? '',
            state: editContact.state ?? '',
            country: editContact.country ?? '',
            description: editContact.description ?? '',
            companyId: editContact.companyId ?? '',
          }}
          mode="edit"
          companies={companies}
        />
      )}
      {deleteContact && (
        <DeleteContactDialog
          open={!!deleteContact}
          onOpenChange={(open) => !open && setDeleteContact(null)}
          onConfirm={handleDelete}
          contactName={`${deleteContact.firstName} ${deleteContact.lastName}`}
        />
      )}
    </div>
  );
}
