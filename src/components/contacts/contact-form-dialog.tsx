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
import { CONTACT_SOURCES } from './contact-constants';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  source: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  companyId: string;
}

interface Company {
  id: string;
  name: string;
}

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
  initialData?: Partial<ContactFormData>;
  mode: 'create' | 'edit';
  companies?: Company[];
}

function ContactFormInner({
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  companies = [],
}: Omit<ContactFormDialogProps, 'open'>) {
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState<ContactFormData>({
    firstName: initialData?.firstName ?? '',
    lastName: initialData?.lastName ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    title: initialData?.title ?? '',
    source: initialData?.source ?? 'OTHER',
    address: initialData?.address ?? '',
    city: initialData?.city ?? '',
    state: initialData?.state ?? '',
    country: initialData?.country ?? '',
    description: initialData?.description ?? '',
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
        <DialogTitle>{mode === 'create' ? 'Add Contact' : 'Edit Contact'}</DialogTitle>
      </DialogHeader>
      <DialogContent className="space-y-4 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="First name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Last name"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1-555-0000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Designation</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VP of Engineering"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select
              id="source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              {CONTACT_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyId">Company</Label>
          <Select
            id="companyId"
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          >
            <option value="">No Company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="San Francisco"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="CA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="US"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Additional notes about this contact..."
            rows={3}
          />
        </div>
      </DialogContent>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !form.firstName.trim() || !form.lastName.trim()}>
          {loading ? 'Saving...' : mode === 'create' ? 'Add Contact' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ContactFormDialog({ open, onOpenChange, onSubmit, initialData, mode, companies }: ContactFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ContactFormInner
        key={open ? 'open' : 'closed'}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialData={initialData}
        mode={mode}
        companies={companies}
      />
    </Dialog>
  );
}
