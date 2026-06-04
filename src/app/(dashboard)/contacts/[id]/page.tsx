'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  MessageSquare,
  Send,
  Activity,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ContactSourceBadge } from '@/components/contacts/contact-source-badge';
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog';
import { DeleteContactDialog } from '@/components/contacts/delete-contact-dialog';
import { ACTIVITY_TYPES, getActivityTypeLabel } from '@/components/contacts/contact-constants';

interface NoteUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

interface ContactNote {
  id: string;
  content: string;
  createdAt: string;
  user: NoteUser;
}

interface ContactActivity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  user: NoteUser;
}

interface ContactDeal {
  id: string;
  title: string;
  stage: string;
  value: string | number | null;
}

interface ContactCompany {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
}

interface ContactDetail {
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
  owner: NoteUser | null;
  createdBy: NoteUser | null;
  company: ContactCompany | null;
  notes: ContactNote[];
  activities: ContactActivity[];
  deals: ContactDeal[];
  tags: { tag: { id: string; name: string; color: string } }[];
}

const activityTypeColors: Record<string, string> = {
  CALL: 'bg-blue-100 text-blue-700',
  EMAIL: 'bg-green-100 text-green-700',
  MEETING: 'bg-purple-100 text-purple-700',
  NOTE: 'bg-yellow-100 text-yellow-700',
  TASK: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = React.useState<ContactDetail | null>(null);
  const [companies, setCompanies] = React.useState<{ id: string; name: string }[]>([]);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [newNote, setNewNote] = React.useState('');
  const [addingNote, setAddingNote] = React.useState(false);
  const [activityOpen, setActivityOpen] = React.useState(false);
  const [activityForm, setActivityForm] = React.useState({ type: 'CALL', title: '', description: '' });
  const [addingActivity, setAddingActivity] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'timeline' | 'notes' | 'activities'>('timeline');
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
    startTransition(async () => {
      try {
        const res = await fetch(`/api/contacts/${contactId}`, {
          signal: abortController.signal,
        });
        const json = await res.json();
        if (json.success && !abortController.signal.aborted) {
          setContact(json.data);
        }
      } catch {
        // Aborted or network error
      }
    });
    return () => abortController.abort();
  }, [contactId, fetchKey]);

  const loading = isPending && !contact;

  async function handleEdit(data: { firstName: string; lastName: string; email: string; phone: string; title: string; source: string; address: string; description: string; companyId: string }) {
    const res = await fetch(`/api/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      setContact(json.data);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/contacts');
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/notes`, {
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

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityForm.title.trim()) return;
    setAddingActivity(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm),
      });
      if (res.ok) {
        setActivityForm({ type: 'CALL', title: '', description: '' });
        setActivityOpen(false);
        setFetchKey((k) => k + 1);
      }
    } finally {
      setAddingActivity(false);
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

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Contact not found</p>
        <Button asChild variant="outline">
          <Link href="/contacts">Back to Contacts</Link>
        </Button>
      </div>
    );
  }

  const timelineItems = [
    ...contact.notes.map((n) => ({
      id: n.id,
      type: 'note' as const,
      title: 'Note added',
      content: n.content,
      user: n.user,
      createdAt: n.createdAt,
    })),
    ...contact.activities.map((a) => ({
      id: a.id,
      type: 'activity' as const,
      title: a.title,
      content: a.description,
      activityType: a.type,
      user: a.user,
      createdAt: a.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/contacts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {contact.firstName} {contact.lastName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {contact.title && <span>{contact.title}</span>}
              {contact.title && contact.company && <span>&middot;</span>}
              {contact.company && <span>{contact.company.name}</span>}
            </div>
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
          {/* Contact info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{contact.email ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{contact.phone ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Designation:</span>
                  <span className="font-medium">{contact.title ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{contact.company?.name ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Source:</span>
                  <ContactSourceBadge source={contact.source} />
                </div>
                {(contact.address || contact.city || contact.state || contact.country) && (
                  <div className="flex items-start gap-2 text-sm sm:col-span-2">
                    <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium">
                      {[contact.address, contact.city, contact.state, contact.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
              {contact.description && (
                <div className="mt-4">
                  <p className="text-muted-foreground mb-1 text-sm font-medium">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{contact.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(['timeline', 'notes', 'activities'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'timeline' ? 'Timeline' : tab === 'notes' ? `Notes (${contact.notes.length})` : `Activities (${contact.activities.length})`}
              </button>
            ))}
          </div>

          {/* Timeline tab */}
          {activeTab === 'timeline' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timelineItems.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No timeline events yet.
                  </p>
                ) : (
                  <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
                    {timelineItems.map((item) => (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-background bg-muted" />
                        <div className="rounded-lg border p-3">
                          <div className="mb-1 flex items-center gap-2">
                            {'activityType' in item && item.activityType && (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${activityTypeColors[item.activityType] ?? activityTypeColors.OTHER}`}>
                                {getActivityTypeLabel(item.activityType)}
                              </span>
                            )}
                            {item.type === 'note' && (
                              <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-700 px-2 py-0.5 text-[10px] font-medium">
                                Note
                              </span>
                            )}
                            <span className="text-sm font-medium">{item.title}</span>
                            <span className="text-muted-foreground text-xs ml-auto">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {item.content && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {item.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            by {item.user.firstName} {item.user.lastName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes tab */}
          {activeTab === 'notes' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes ({contact.notes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {contact.notes.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No notes yet. Add the first note above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contact.notes.map((note) => (
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
          )}

          {/* Activities tab */}
          {activeTab === 'activities' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activities ({contact.activities.length})
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setActivityOpen(!activityOpen)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Log Activity
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activityOpen && (
                  <form onSubmit={handleAddActivity} className="rounded-lg border p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Select
                        value={activityForm.type}
                        onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                      >
                        {ACTIVITY_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                      <Input
                        value={activityForm.title}
                        onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                        placeholder="Activity title"
                        required
                      />
                    </div>
                    <Textarea
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                      placeholder="Description (optional)"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setActivityOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={addingActivity || !activityForm.title.trim()}>
                        {addingActivity ? 'Saving...' : 'Log Activity'}
                      </Button>
                    </div>
                  </form>
                )}

                {contact.activities.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No activities yet. Log your first activity above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contact.activities.map((activity) => (
                      <div key={activity.id} className="rounded-lg border p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${activityTypeColors[activity.type] ?? activityTypeColors.OTHER}`}>
                            {getActivityTypeLabel(activity.type)}
                          </span>
                          <span className="text-sm font-medium">{activity.title}</span>
                          <span className="text-muted-foreground text-xs ml-auto">
                            {new Date(activity.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          by {activity.user.firstName} {activity.user.lastName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
              {contact.owner ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {contact.owner.imageUrl && (
                      <AvatarImage src={contact.owner.imageUrl} alt="" />
                    )}
                    <AvatarFallback className="text-xs">
                      {(contact.owner.firstName?.[0] ?? '') +
                        (contact.owner.lastName?.[0] ?? '')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {contact.owner.firstName} {contact.owner.lastName}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No owner assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Deals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4" />
                Deals ({contact.deals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contact.deals.length === 0 ? (
                <p className="text-muted-foreground text-sm">No deals linked</p>
              ) : (
                <div className="space-y-2">
                  {contact.deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span className="font-medium">{deal.title}</span>
                      <span className="text-muted-foreground text-xs">{deal.stage}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {contact.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map(({ tag }) => (
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
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(contact.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(contact.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <ContactFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        initialData={{
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          title: contact.title ?? '',
          source: contact.source,
          address: [contact.address, contact.city, contact.state, contact.country].filter(Boolean).join(', '),
          description: contact.description ?? '',
          companyId: contact.companyId ?? '',
        }}
        mode="edit"
        companies={companies}
      />
      <DeleteContactDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        contactName={`${contact.firstName} ${contact.lastName}`}
      />
    </div>
  );
}
