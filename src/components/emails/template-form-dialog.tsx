'use client';

import { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TemplateFormData {
  name: string;
  subject: string;
  body: string;
  description: string;
}

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TemplateFormData) => void;
  initialData?: { name?: string; subject?: string; body?: string; description?: string | null };
  mode: 'create' | 'edit';
}

function TemplateFormInner({
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: Omit<TemplateFormDialogProps, 'open'>) {
  const [form, setForm] = useState<TemplateFormData>(() =>
    initialData
      ? {
          name: initialData.name || '',
          subject: initialData.subject || '',
          body: initialData.body || '',
          description: initialData.description || '',
        }
      : { name: '', subject: '', body: '', description: '' }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{mode === 'create' ? 'Create Template' : 'Edit Template'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="subject">Subject Line *</Label>
          <Input
            id="subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of when to use this template"
          />
        </div>
        <div>
          <Label htmlFor="body">Email Body (HTML) *</Label>
          <Textarea
            id="body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={10}
            required
            placeholder="<p>Hi {{name}},</p><p>Your email content here...</p>"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Supports HTML. Use {'{{name}}'}, {'{{company}}'} as placeholders.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function TemplateFormDialog({ open, onOpenChange, onSubmit, initialData, mode }: TemplateFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TemplateFormInner
        key={open ? 'open' : 'closed'}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialData={initialData}
        mode={mode}
      />
    </Dialog>
  );
}
