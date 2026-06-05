'use client';

import { useState, useEffect } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

interface ComposeFormData {
  toEmail: string;
  subject: string;
  htmlBody: string;
  contactId: string;
  dealId: string;
  templateId: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
}

interface Deal {
  id: string;
  title: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ComposeFormData) => void;
  prefilledTo?: string;
  prefilledContactId?: string;
}

function ComposeInner({
  onOpenChange,
  onSubmit,
  prefilledTo,
  prefilledContactId,
}: Omit<ComposeEmailDialogProps, 'open'>) {
  const [form, setForm] = useState<ComposeFormData>({
    toEmail: prefilledTo || '',
    subject: '',
    htmlBody: '',
    contactId: prefilledContactId || '',
    dealId: '',
    templateId: '',
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/contacts?limit=100').then((r) => r.json()),
      fetch('/api/deals?limit=100').then((r) => r.json()),
      fetch('/api/email-templates?activeOnly=true&limit=100').then((r) => r.json()),
    ]).then(([cRes, dRes, tRes]) => {
      if (cRes.success) setContacts(cRes.data.contacts);
      if (dRes.success) setDeals(dRes.data.deals);
      if (tRes.success) setTemplates(tRes.data.templates);
    });
  }, []);

  const handleContactChange = (contactId: string) => {
    setForm((prev) => ({ ...prev, contactId }));
    const contact = contacts.find((c) => c.id === contactId);
    if (contact?.email && !form.toEmail) {
      setForm((prev) => ({ ...prev, contactId, toEmail: contact.email || '' }));
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setForm((prev) => ({ ...prev, templateId }));
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setForm((prev) => ({
        ...prev,
        templateId,
        subject: template.subject,
        htmlBody: template.body,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Compose Email</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="template">Template</Label>
            <Select
              id="template"
              value={form.templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="">None</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="contact">Contact</Label>
            <Select
              id="contact"
              value={form.contactId}
              onChange={(e) => handleContactChange(e.target.value)}
            >
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="toEmail">To *</Label>
            <Input
              id="toEmail"
              type="email"
              value={form.toEmail}
              onChange={(e) => setForm({ ...form, toEmail: e.target.value })}
              required
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <Label htmlFor="deal">Deal</Label>
            <Select
              id="deal"
              value={form.dealId}
              onChange={(e) => setForm({ ...form, dealId: e.target.value })}
            >
              <option value="">None</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="htmlBody">Body *</Label>
          <Textarea
            id="htmlBody"
            value={form.htmlBody}
            onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
            rows={10}
            required
            placeholder="Write your email content here... (HTML supported)"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function ComposeEmailDialog({ open, onOpenChange, onSubmit, prefilledTo, prefilledContactId }: ComposeEmailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ComposeInner
        key={open ? 'open' : 'closed'}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        prefilledTo={prefilledTo}
        prefilledContactId={prefilledContactId}
      />
    </Dialog>
  );
}
