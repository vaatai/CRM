'use client';

import { useEffect, useState, useTransition, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Clock,
  Users,
  Handshake,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskFormDialog, TaskFormData } from '@/components/tasks/task-form-dialog';
import { DeleteTaskDialog } from '@/components/tasks/delete-task-dialog';
import {
  TASK_STATUSES,
  getTaskStatusColor,
  getTaskStatusLabel,
  getTaskPriorityColor,
  getTaskPriorityLabel,
  getTaskTypeLabel,
  getTaskTypeIcon,
} from '@/components/tasks/task-constants';

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  createdBy: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  deal: { id: string; title: string; stage: string; value: string | null } | null;
  contact: { id: string; firstName: string; lastName: string; email: string | null } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface Deal {
  id: string;
  title: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  const [users, setUsers] = useState<User[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    startTransition(() => {
      fetch(`/api/tasks/${id}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setTask(json.data);
        })
        .catch(() => {});
    });
    return () => controller.abort();
  }, [id, fetchKey]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch('/api/contacts?limit=100', { signal: controller.signal }).then((r) => r.json()),
      fetch('/api/deals?limit=100', { signal: controller.signal }).then((r) => r.json()),
    ]).then(([contactsRes, dealsRes]) => {
      if (contactsRes.success) setContacts(contactsRes.data.contacts);
      if (dealsRes.success) setDeals(dealsRes.data.deals);
      const userMap = new Map<string, User>();
      if (contactsRes.success) {
        for (const c of contactsRes.data.contacts) {
          if (c.owner) userMap.set(c.owner.id, c.owner);
          if (c.createdBy) userMap.set(c.createdBy.id, c.createdBy);
        }
      }
      if (dealsRes.success) {
        for (const d of dealsRes.data.deals) {
          if (d.owner) userMap.set(d.owner.id, d.owner);
        }
      }
      setUsers(Array.from(userMap.values()));
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  const handleEdit = async (data: TaskFormData) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditOpen(false);
      setFetchKey((k) => k + 1);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/tasks');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setFetchKey((k) => k + 1);
    }
  };

  if (isPending && !task) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">Task not found</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tasks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              {task.type && <span>{getTaskTypeIcon(task.type)} {getTaskTypeLabel(task.type)}</span>}
              {task.contact && (
                <span>
                  · <Link href={`/contacts/${task.contact.id}`} className="hover:underline">{task.contact.firstName} {task.contact.lastName}</Link>
                </span>
              )}
              {task.deal && (
                <span>
                  · <Link href={`/deals/${task.deal.id}`} className="hover:underline">{task.deal.title}</Link>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status selector */}
      <div className="flex flex-wrap gap-2">
        {TASK_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => handleStatusChange(s.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              task.status === s.value
                ? `${s.color} ring-2 ring-offset-1`
                : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Priority</span>
                </div>
                <Badge variant="outline" className={`mt-2 ${getTaskPriorityColor(task.priority)}`}>
                  {getTaskPriorityLabel(task.priority)}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Status</span>
                </div>
                <Badge variant="outline" className={`mt-2 ${getTaskStatusColor(task.status)}`}>
                  {getTaskStatusLabel(task.status)}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Due Date</span>
                </div>
                <p className={`mt-2 text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
                <p className="mt-2 text-sm font-medium">
                  {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Type-specific info */}
          {task.type && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTaskTypeIcon(task.type)}</span>
                  <div>
                    <p className="font-medium">{getTaskTypeLabel(task.type)}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.type === 'CALL' && 'Scheduled phone call'}
                      {task.type === 'MEETING' && 'Scheduled meeting'}
                      {task.type === 'EMAIL' && 'Email to send'}
                      {task.type === 'FOLLOW_UP' && 'Follow up action required'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned to</p>
                  <p className="text-sm font-medium">
                    {task.assignee ? `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim() : 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-sm font-medium">
                    {task.createdBy ? `${task.createdBy.firstName || ''} ${task.createdBy.lastName || ''}`.trim() : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Associations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Associations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.contact && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <Link href={`/contacts/${task.contact.id}`} className="text-sm font-medium text-primary hover:underline">
                      {task.contact.firstName} {task.contact.lastName}
                    </Link>
                  </div>
                </div>
              )}
              {task.deal && (
                <div className="flex items-center gap-2">
                  <Handshake className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deal</p>
                    <Link href={`/deals/${task.deal.id}`} className="text-sm font-medium text-primary hover:underline">
                      {task.deal.title}
                    </Link>
                  </div>
                </div>
              )}
              {!task.contact && !task.deal && (
                <p className="text-sm text-muted-foreground">No associations</p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {task.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((ta) => (
                    <Badge key={ta.tag.id} variant="outline">
                      {ta.tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
              </div>
              {task.dueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due</span>
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {task.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="text-green-600">{new Date(task.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <TaskFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        mode="edit"
        initialData={{
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          type: task.type || '',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          assigneeId: task.assignee?.id || '',
          dealId: task.deal?.id || '',
          contactId: task.contact?.id || '',
        }}
        users={users}
        deals={deals}
        contacts={contacts}
      />

      <DeleteTaskDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        taskTitle={task.title}
      />
    </div>
  );
}
