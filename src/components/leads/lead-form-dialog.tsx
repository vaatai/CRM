'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { LEAD_STATUSES, LEAD_SOURCES } from './lead-constants';

interface LeadFormData {
  title: string;
  status: string;
  source: string;
  value: string;
  description: string;
}

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
  initialData?: Partial<LeadFormData>;
  mode: 'create' | 'edit';
}

function LeadFormInner({
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: Omit<LeadFormDialogProps, 'open'>) {
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState<LeadFormData>({
    title: initialData?.title ?? '',
    status: initialData?.status ?? 'NEW',
    source: initialData?.source ?? 'OTHER',
    value: initialData?.value ?? '',
    description: initialData?.description ?? '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{mode === 'create' ? 'Create Lead' : 'Edit Lead'}</DialogTitle>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Lead title"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select
              id="source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Value (USD)</Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            min="0"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Lead description..."
            rows={3}
          />
        </div>
      </DialogContent>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !form.title.trim()}>
          {loading ? 'Saving...' : mode === 'create' ? 'Create Lead' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function LeadFormDialog({ open, onOpenChange, onSubmit, initialData, mode }: LeadFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Key resets form state when dialog opens with new data */}
      <LeadFormInner
        key={open ? 'open' : 'closed'}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialData={initialData}
        mode={mode}
      />
    </Dialog>
  );
}
