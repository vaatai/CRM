'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, MoreHorizontal, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TemplateFormDialog } from '@/components/emails/template-form-dialog';
import { DeleteTemplateDialog } from '@/components/emails/delete-template-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { emails: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

  const [refresh, setRefresh] = useState(0);
  const triggerRefresh = () => setRefresh((r) => r + 1);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      try {
        const res = await fetch(`/api/email-templates?${params}`, { signal: controller.signal });
        const json = await res.json();
        if (json.success) {
          setTemplates(json.data.templates);
          setPagination(json.data.pagination);
        }
      } catch { /* aborted */ }
      setLoading(false);
    };
    load();
    return () => controller.abort();
  }, [page, search, refresh]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreate = async (data: { name: string; subject: string; body: string; description: string }) => {
    const res = await fetch('/api/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) triggerRefresh();
  };

  const handleEdit = async (data: { name: string; subject: string; body: string; description: string }) => {
    if (!selectedTemplate) return;
    const res = await fetch(`/api/email-templates/${selectedTemplate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) triggerRefresh();
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    const res = await fetch(`/api/email-templates/${selectedTemplate.id}`, { method: 'DELETE' });
    if (res.ok) triggerRefresh();
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    await fetch(`/api/email-templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    triggerRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">Manage reusable email templates</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            className="pl-10"
            placeholder="Search templates..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          <p>No templates found.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50 text-left text-sm font-medium">
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 md:table-cell">Subject</th>
                <th className="hidden px-4 py-3 lg:table-cell">Emails Sent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{template.name}</div>
                      {template.description && (
                        <div className="text-muted-foreground text-xs">{template.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm md:table-cell">{template.subject}</td>
                  <td className="hidden px-4 py-3 text-sm lg:table-cell">{template._count.emails}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className="cursor-pointer"
                      variant={template.isActive ? 'default' : 'secondary'}
                      onClick={() => handleToggleActive(template)}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDropdownOpenId(dropdownOpenId === template.id ? null : template.id)
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {dropdownOpenId === template.id && (
                        <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border bg-white py-1 shadow-lg">
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setPreviewOpen(true);
                              setDropdownOpenId(null);
                            }}
                          >
                            <Eye className="h-4 w-4" /> Preview
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setEditOpen(true);
                              setDropdownOpenId(null);
                            }}
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setDeleteOpen(true);
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
              ))}
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

      {/* Dialogs */}
      <TemplateFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        mode="create"
      />

      {selectedTemplate && (
        <>
          <TemplateFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            onSubmit={handleEdit}
            initialData={selectedTemplate}
            mode="edit"
          />
          <DeleteTemplateDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onConfirm={handleDelete}
            templateName={selectedTemplate.name}
          />
        </>
      )}

      {/* Preview dialog */}
      {selectedTemplate && previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selectedTemplate.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>
            <div className="mb-2 text-sm">
              <strong>Subject:</strong> {selectedTemplate.subject}
            </div>
            <div
              className="prose max-w-none rounded border p-4"
              dangerouslySetInnerHTML={{ __html: selectedTemplate.body }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
