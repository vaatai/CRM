'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, MoreHorizontal, Eye, Trash2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ComposeEmailDialog } from '@/components/emails/compose-email-dialog';
import { getStatusInfo } from '@/components/emails/email-constants';

interface EmailRecord {
  id: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  status: string;
  sentAt: string | null;
  openCount: number;
  clickCount: number;
  createdAt: string;
  sender: { id: string; firstName: string | null; lastName: string | null } | null;
  contact: { id: string; firstName: string; lastName: string; email: string | null } | null;
  deal: { id: string; title: string } | null;
  template: { id: string; name: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

  const [refresh, setRefresh] = useState(0);
  const triggerRefresh = () => setRefresh((r) => r + 1);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      try {
        const res = await fetch(`/api/emails?${params}`, { signal: controller.signal });
        const json = await res.json();
        if (json.success) {
          setEmails(json.data.emails);
          setPagination(json.data.pagination);
        }
      } catch { /* aborted */ }
      setLoading(false);
    };
    load();
    return () => controller.abort();
  }, [page, search, statusFilter, refresh]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSend = async (data: {
    toEmail: string;
    subject: string;
    htmlBody: string;
    contactId: string;
    dealId: string;
    templateId: string;
  }) => {
    const res = await fetch('/api/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) triggerRefresh();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/emails/${id}`, { method: 'DELETE' });
    if (res.ok) triggerRefresh();
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emails</h1>
          <p className="text-muted-foreground">Email history and communications</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Compose
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            className="pl-10"
            placeholder="Search emails..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="QUEUED">Queued</option>
          <option value="SENT">Sent</option>
          <option value="DELIVERED">Delivered</option>
          <option value="OPENED">Opened</option>
          <option value="CLICKED">Clicked</option>
          <option value="BOUNCED">Bounced</option>
          <option value="FAILED">Failed</option>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : emails.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 py-12 text-center">
          <Mail className="h-12 w-12 opacity-40" />
          <p>No emails found.</p>
          <Button onClick={() => setComposeOpen(true)} variant="outline">
            Send your first email
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50 text-left text-sm font-medium">
                <th className="px-4 py-3">To</th>
                <th className="hidden px-4 py-3 md:table-cell">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 lg:table-cell">Opens</th>
                <th className="hidden px-4 py-3 lg:table-cell">Clicks</th>
                <th className="hidden px-4 py-3 sm:table-cell">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => {
                const statusInfo = getStatusInfo(email.status);
                return (
                  <tr key={email.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">{email.toEmail}</div>
                        {email.contact && (
                          <div className="text-muted-foreground text-xs">
                            {email.contact.firstName} {email.contact.lastName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="hidden max-w-[300px] truncate px-4 py-3 text-sm md:table-cell">
                      {email.subject}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-sm lg:table-cell">{email.openCount}</td>
                    <td className="hidden px-4 py-3 text-sm lg:table-cell">{email.clickCount}</td>
                    <td className="hidden px-4 py-3 text-sm sm:table-cell">
                      {formatDate(email.sentAt || email.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDropdownOpenId(dropdownOpenId === email.id ? null : email.id)
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {dropdownOpenId === email.id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border bg-white py-1 shadow-lg">
                            <Link
                              href={`/emails/${email.id}`}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                              onClick={() => setDropdownOpenId(null)}
                            >
                              <Eye className="h-4 w-4" /> View
                            </Link>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => {
                                handleDelete(email.id);
                                setDropdownOpenId(null);
                              }}
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ComposeEmailDialog open={composeOpen} onOpenChange={setComposeOpen} onSubmit={handleSend} />
    </div>
  );
}
