'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  MessageSquare,
  Send,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LeadStatusBadge } from '@/components/leads/lead-status-badge';
import { LeadFormDialog } from '@/components/leads/lead-form-dialog';
import { DeleteLeadDialog } from '@/components/leads/delete-lead-dialog';
import {
  LEAD_STATUSES,
  getSourceLabel,
  formatCurrency,
} from '@/components/leads/lead-constants';

interface NoteUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

interface LeadNote {
  id: string;
  content: string;
  createdAt: string;
  user: NoteUser;
}

interface LeadDetail {
  id: string;
  title: string;
  status: string;
  source: string;
  value: string | number | null;
  description: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: NoteUser | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
  notes: LeadNote[];
  tags: { tag: { id: string; name: string; color: string } }[];
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = React.useState<LeadDetail | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [newNote, setNewNote] = React.useState('');
  const [addingNote, setAddingNote] = React.useState(false);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const abortController = new AbortController();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/leads/${leadId}`, {
          signal: abortController.signal,
        });
        const json = await res.json();
        if (json.success && !abortController.signal.aborted) {
          setLead(json.data);
        }
      } catch {
        // Aborted or network error
      }
    });
    return () => abortController.abort();
  }, [leadId, fetchKey]);

  const loading = isPending && !lead;

  async function handleStatusChange(newStatus: string) {
    if (!lead || newStatus === lead.status) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const json = await res.json();
        setLead(json.data);
      }
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleEdit(data: { title: string; status: string; source: string; value: string; description: string }) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      setLead(json.data);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/leads');
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        setNewNote('');
        setFetchKey((k) => k + 1);
      }
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Lead not found</p>
        <Button asChild variant="outline">
          <Link href="/leads">Back to Leads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{lead.title}</h1>
            <p className="text-muted-foreground text-sm">
              Created {new Date(lead.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Lead info */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status selector */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <Select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full sm:w-44"
                  disabled={updatingStatus}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-medium">{formatCurrency(lead.value)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Source:</span>
                  <span className="font-medium">{getSourceLabel(lead.source)}</span>
                </div>
              </div>

              {lead.description && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm font-medium">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{lead.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notes ({lead.notes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add note */}
              <div className="flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Notes list */}
              {lead.notes.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No notes yet. Add the first note above.
                </p>
              ) : (
                <div className="space-y-3">
                  {lead.notes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {note.user.imageUrl && (
                            <AvatarImage src={note.user.imageUrl} alt="" />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {(note.user.firstName?.[0] ?? '') +
                              (note.user.lastName?.[0] ?? '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {note.user.firstName} {note.user.lastName}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.owner ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {lead.owner.imageUrl && (
                      <AvatarImage src={lead.owner.imageUrl} alt="" />
                    )}
                    <AvatarFallback className="text-xs">
                      {(lead.owner.firstName?.[0] ?? '') +
                        (lead.owner.lastName?.[0] ?? '')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {lead.owner.firstName} {lead.owner.lastName}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No owner assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.contact ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {lead.contact.firstName} {lead.contact.lastName}
                  </p>
                  {lead.contact.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {lead.contact.email}
                    </div>
                  )}
                  {lead.contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {lead.contact.phone}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No contact linked</p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {lead.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
              </div>
              {lead.convertedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Converted</span>
                  <span>{new Date(lead.convertedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        initialData={{
          title: lead.title,
          status: lead.status,
          source: lead.source,
          value: lead.value?.toString() ?? '',
          description: lead.description ?? '',
        }}
        mode="edit"
      />
      <DeleteLeadDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        leadTitle={lead.title}
      />
    </div>
  );
}
