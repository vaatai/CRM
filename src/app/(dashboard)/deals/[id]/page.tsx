'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  Percent,
  Building2,
  User,
  Clock,
  Send,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  CheckSquare,
  MoreHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DealFormDialog, type DealFormData } from '@/components/deals/deal-form-dialog';
import { DeleteDealDialog } from '@/components/deals/delete-deal-dialog';
import {
  DEAL_STAGES,
  ACTIVITY_TYPES,
  getDealStageLabel,
  getDealStageColor,
  getActivityTypeLabel,
  formatCurrency,
} from '@/components/deals/deal-constants';

interface DealUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface DealContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

interface DealCompany {
  id: string;
  name: string;
}

interface DealNote {
  id: string;
  content: string;
  createdAt: string;
  user: DealUser;
}

interface DealActivity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  user: DealUser;
}

interface DealTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
}

interface DealTag {
  tag: { id: string; name: string; color: string | null };
}

interface DealDetail {
  id: string;
  title: string;
  stage: string;
  value: string | number | null;
  currency: string;
  probability: number | null;
  expectedCloseDate: string | null;
  closedAt: string | null;
  description: string | null;
  contactId: string | null;
  companyId: string | null;
  createdAt: string;
  updatedAt: string;
  owner: DealUser | null;
  createdBy: DealUser | null;
  contact: DealContact | null;
  company: DealCompany | null;
  notes: DealNote[];
  activities: DealActivity[];
  tasks: DealTask[];
  tags: DealTag[];
  _count: { notes: number; activities: number; tasks: number };
}

interface SelectOption {
  id: string;
  name: string;
}

const activityIcons: Record<string, React.ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: User,
  NOTE: MessageSquare,
  TASK: CheckSquare,
  OTHER: MoreHorizontal,
};

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const [deal, setDeal] = React.useState<DealDetail | null>(null);
  const [contacts, setContacts] = React.useState<SelectOption[]>([]);
  const [companies, setCompanies] = React.useState<SelectOption[]>([]);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();
  const [activeTab, setActiveTab] = React.useState<'timeline' | 'notes' | 'activities'>('timeline');

  const [newNote, setNewNote] = React.useState('');
  const [addingNote, setAddingNote] = React.useState(false);

  const [activityOpen, setActivityOpen] = React.useState(false);
  const [activityForm, setActivityForm] = React.useState({ type: 'CALL', title: '', description: '' });
  const [addingActivity, setAddingActivity] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/companies').then((r) => r.json()),
      fetch('/api/contacts?limit=100').then((r) => r.json()),
    ]).then(([companiesJson, contactsJson]) => {
      if (companiesJson.success) {
        setCompanies(
          (companiesJson.data.companies ?? companiesJson.data ?? []).map(
            (c: { id: string; name: string }) => ({ id: c.id, name: c.name })
          )
        );
      }
      if (contactsJson.success) {
        setContacts(
          (contactsJson.data.contacts ?? []).map(
            (c: { id: string; firstName: string; lastName: string }) => ({
              id: c.id,
              name: `${c.firstName} ${c.lastName}`,
            })
          )
        );
      }
    });
  }, []);

  React.useEffect(() => {
    const abortController = new AbortController();

    startTransition(async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}`, {
          signal: abortController.signal,
        });
        const json = await res.json();
        if (json.success && !abortController.signal.aborted) {
          setDeal(json.data);
        }
      } catch {
        // Aborted or network error
      }
    });

    return () => abortController.abort();
  }, [dealId, fetchKey]);

  const loading = isPending && !deal;

  async function handleEdit(data: DealFormData) {
    const res = await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setFetchKey((k) => k + 1);
    }
  }

  async function handleStageChange(newStage: string) {
    const res = await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    if (res.ok) {
      setFetchKey((k) => k + 1);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/deals/${dealId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/deals');
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/notes`, {
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
      const res = await fetch(`/api/deals/${dealId}/activities`, {
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

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Deal not found</p>
        <Button asChild variant="outline">
          <Link href="/deals">Back to Pipeline</Link>
        </Button>
      </div>
    );
  }

  const timelineItems = [
    ...deal.notes.map((n) => ({
      id: n.id,
      type: 'note' as const,
      title: 'Note added',
      content: n.content,
      user: n.user,
      createdAt: n.createdAt,
    })),
    ...deal.activities.map((a) => ({
      id: a.id,
      type: 'activity' as const,
      title: a.title,
      content: a.description,
      activityType: a.type,
      user: a.user,
      createdAt: a.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const dealValue = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/deals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{deal.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {deal.company && <span>{deal.company.name}</span>}
              {deal.company && deal.contact && <span>&middot;</span>}
              {deal.contact && (
                <span>
                  {deal.contact.firstName} {deal.contact.lastName}
                </span>
              )}
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

      {/* Stage Selector */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {DEAL_STAGES.map((stage) => (
          <button
            key={stage.value}
            onClick={() => handleStageChange(stage.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
              deal.stage === stage.value
                ? `${stage.color} ring-2 ring-offset-1`
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Info Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Value</span>
              </div>
              <p className="text-lg font-bold mt-1">{formatCurrency(dealValue, deal.currency)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Probability</span>
              </div>
              <p className="text-lg font-bold mt-1">{deal.probability ?? 0}%</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-muted-foreground">Close Date</span>
              </div>
              <p className="text-lg font-bold mt-1">
                {deal.expectedCloseDate
                  ? new Date(deal.expectedCloseDate).toLocaleDateString()
                  : 'Not set'}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-muted-foreground">Weighted</span>
              </div>
              <p className="text-lg font-bold mt-1">
                {formatCurrency((dealValue ?? 0) * ((deal.probability ?? 0) / 100), deal.currency)}
              </p>
            </Card>
          </div>

          {/* Description */}
          {deal.description && (
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.description}</p>
            </Card>
          )}

          {/* Tabs: Timeline / Notes / Activities */}
          <Card>
            <div className="border-b">
              <div className="flex">
                {(['timeline', 'notes', 'activities'] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                      activeTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab} ({tab === 'timeline' ? timelineItems.length : tab === 'notes' ? deal.notes.length : deal.activities.length})
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {timelineItems.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No timeline items yet. Add a note or activity to get started.
                    </p>
                  ) : (
                    timelineItems.map((item) => {
                      const ActivityIcon = item.type === 'activity'
                        ? activityIcons[(item as { activityType?: string }).activityType ?? 'OTHER'] ?? MoreHorizontal
                        : MessageSquare;
                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            item.type === 'note' ? 'bg-blue-100' : 'bg-purple-100'
                          }`}>
                            <ActivityIcon className={`h-4 w-4 ${
                              item.type === 'note' ? 'text-blue-700' : 'text-purple-700'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{item.title}</span>
                              {item.type === 'activity' && (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                  {getActivityTypeLabel((item as { activityType?: string }).activityType ?? '')}
                                </span>
                              )}
                            </div>
                            {item.content && (
                              <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">
                                {item.content}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{item.user.firstName} {item.user.lastName}</span>
                              <span>&middot;</span>
                              <span>{new Date(item.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
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

                  {deal.notes.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No notes yet.
                    </p>
                  ) : (
                    deal.notes.map((note) => (
                      <div key={note.id} className="rounded-lg border p-3">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{note.user.firstName} {note.user.lastName}</span>
                          <span>&middot;</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Activities Tab */}
              {activeTab === 'activities' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Activities</h4>
                    <Button size="sm" variant="outline" onClick={() => setActivityOpen(!activityOpen)}>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Log Activity
                    </Button>
                  </div>

                  {activityOpen && (
                    <form onSubmit={handleAddActivity} className="rounded-lg border p-4 space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="actType" className="text-xs">Type</Label>
                          <Select
                            id="actType"
                            value={activityForm.type}
                            onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                          >
                            {ACTIVITY_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="actTitle" className="text-xs">Title *</Label>
                          <Input
                            id="actTitle"
                            value={activityForm.title}
                            onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                            placeholder="Activity title"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="actDesc" className="text-xs">Description</Label>
                        <Textarea
                          id="actDesc"
                          value={activityForm.description}
                          onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                          placeholder="Details..."
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setActivityOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={addingActivity || !activityForm.title.trim()}>
                          {addingActivity ? 'Adding...' : 'Add Activity'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {deal.activities.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No activities logged yet.
                    </p>
                  ) : (
                    deal.activities.map((activity) => {
                      const Icon = activityIcons[activity.type] ?? MoreHorizontal;
                      return (
                        <div key={activity.id} className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{activity.title}</span>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                {getActivityTypeLabel(activity.type)}
                              </span>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {activity.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{activity.user.firstName} {activity.user.lastName}</span>
                              <span>&middot;</span>
                              <span>{new Date(activity.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stage */}
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">Stage</h3>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getDealStageColor(deal.stage)}`}>
              {getDealStageLabel(deal.stage)}
            </span>
            {deal.closedAt && (
              <p className="text-xs text-muted-foreground">
                Closed on {new Date(deal.closedAt).toLocaleDateString()}
              </p>
            )}
          </Card>

          {/* Associations */}
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">Associations</h3>
            <div className="space-y-2 text-sm">
              {deal.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Link href={`/companies/${deal.company.id}`} className="text-primary hover:underline">
                    {deal.company.name}
                  </Link>
                </div>
              )}
              {deal.contact && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Link href={`/contacts/${deal.contact.id}`} className="text-primary hover:underline">
                    {deal.contact.firstName} {deal.contact.lastName}
                  </Link>
                </div>
              )}
              {deal.owner && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Owner: {deal.owner.firstName} {deal.owner.lastName}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Tasks */}
          {deal.tasks.length > 0 && (
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks ({deal.tasks.length})
              </h3>
              <div className="space-y-2">
                {deal.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${
                      task.status === 'COMPLETED' ? 'bg-green-500' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tags */}
          {deal.tags.length > 0 && (
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold text-sm">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {deal.tags.map((t) => (
                  <span
                    key={t.tag.id}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground"
                  >
                    {t.tag.name}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Dates */}
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Dates
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(deal.updatedAt).toLocaleDateString()}</span>
              </div>
              {deal.createdBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created by</span>
                  <span>{deal.createdBy.firstName} {deal.createdBy.lastName}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <DealFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        initialData={{
          title: deal.title,
          stage: deal.stage,
          value: dealValue != null ? String(dealValue) : '',
          currency: deal.currency,
          probability: deal.probability != null ? String(deal.probability) : '0',
          expectedCloseDate: deal.expectedCloseDate
            ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
            : '',
          description: deal.description ?? '',
          contactId: deal.contactId ?? '',
          companyId: deal.companyId ?? '',
        }}
        mode="edit"
        contacts={contacts}
        companies={companies}
      />
      <DeleteDealDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        dealTitle={deal.title}
      />
    </div>
  );
}
