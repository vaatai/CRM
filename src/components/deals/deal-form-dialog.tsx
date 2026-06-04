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
import { DEAL_STAGES } from './deal-constants';

export interface DealFormData {
  title: string;
  stage: string;
  value: string;
  currency: string;
  probability: string;
  expectedCloseDate: string;
  description: string;
  contactId: string;
  companyId: string;
}

interface SelectOption {
  id: string;
  name: string;
}

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DealFormData) => Promise<void>;
  initialData?: Partial<DealFormData>;
  mode: 'create' | 'edit';
  contacts?: SelectOption[];
  companies?: SelectOption[];
}

function DealFormInner({
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  contacts = [],
  companies = [],
}: Omit<DealFormDialogProps, 'open'>) {
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState<DealFormData>({
    title: initialData?.title ?? '',
    stage: initialData?.stage ?? 'PROSPECTING',
    value: initialData?.value ?? '',
    currency: initialData?.currency ?? 'USD',
    probability: initialData?.probability ?? '0',
    expectedCloseDate: initialData?.expectedCloseDate ?? '',
    description: initialData?.description ?? '',
    contactId: initialData?.contactId ?? '',
    companyId: initialData?.companyId ?? '',
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
        <DialogTitle>{mode === 'create' ? 'Create Deal' : 'Edit Deal'}</DialogTitle>
      </DialogHeader>
      <DialogContent className="space-y-4 max-h-[60vh] overflow-y-auto">
        <div className="space-y-2">
          <Label htmlFor="title">Deal Title *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Enterprise License Agreement"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select
              id="stage"
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
            >
              {DEAL_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="probability">Probability (%)</Label>
            <Input
              id="probability"
              type="number"
              min="0"
              max="100"
              value={form.probability}
              onChange={(e) => setForm({ ...form, probability: e.target.value })}
              placeholder="50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="value">Deal Value</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="50000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactId">Contact</Label>
            <Select
              id="contactId"
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            >
              <option value="">No contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyId">Company</Label>
            <Select
              id="companyId"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Deal details..."
            rows={3}
          />
        </div>
      </DialogContent>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !form.title.trim()}>
          {loading ? 'Saving...' : mode === 'create' ? 'Create Deal' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DealFormDialog({ open, onOpenChange, onSubmit, initialData, mode, contacts, companies }: DealFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DealFormInner
        key={open ? 'open' : 'closed'}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialData={initialData}
        mode={mode}
        contacts={contacts}
        companies={companies}
      />
    </Dialog>
  );
}
