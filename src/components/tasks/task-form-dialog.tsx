'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_TYPES } from './task-constants';

export interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  dueDate: string;
  assigneeId: string;
  dealId: string;
  contactId: string;
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

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
  mode: 'create' | 'edit';
  users?: User[];
  deals?: Deal[];
  contacts?: Contact[];
}

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  users = [],
  deals = [],
  contacts = [],
}: TaskFormDialogProps) {
  const getInitialForm = (): TaskFormData =>
    initialData
      ? {
          title: initialData.title || '',
          description: initialData.description || '',
          status: initialData.status || 'TODO',
          priority: initialData.priority || 'MEDIUM',
          type: initialData.type || '',
          dueDate: initialData.dueDate || '',
          assigneeId: initialData.assigneeId || '',
          dealId: initialData.dealId || '',
          contactId: initialData.contactId || '',
        }
      : {
          title: '',
          description: '',
          status: 'TODO',
          priority: 'MEDIUM',
          type: '',
          dueDate: '',
          assigneeId: '',
          dealId: '',
          contactId: '',
        };

  const [form, setForm] = useState<TaskFormData>(getInitialForm);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(getInitialForm());
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Task' : 'Edit Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type || '_none'} onValueChange={(v) => setForm({ ...form, type: v === '_none' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select value={form.assigneeId || '_none'} onValueChange={(v) => setForm({ ...form, assigneeId: v === '_none' ? '' : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Related Deal</Label>
              <Select value={form.dealId || '_none'} onValueChange={(v) => setForm({ ...form, dealId: v === '_none' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Related Contact</Label>
              <Select value={form.contactId || '_none'} onValueChange={(v) => setForm({ ...form, contactId: v === '_none' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === 'create' ? 'Create Task' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
