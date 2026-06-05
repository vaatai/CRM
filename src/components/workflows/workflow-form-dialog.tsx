'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TRIGGER_OPTIONS, ACTION_OPTIONS, LEAD_STATUSES, TASK_PRIORITIES, TASK_TYPES } from './workflow-constants';

interface StepData {
  actionType: string;
  config: Record<string, unknown>;
}

interface WorkflowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    trigger: string;
    triggerConfig?: string | null;
    steps: { actionType: string; config: string }[];
  };
}

export function WorkflowFormDialog({ open, onOpenChange, onSubmit, initialData }: WorkflowFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
        </DialogHeader>
        {open && (
          <WorkflowFormContent
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function WorkflowFormContent({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: WorkflowFormDialogProps['initialData'];
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [trigger, setTrigger] = useState(initialData?.trigger || '');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(() => {
    if (initialData?.triggerConfig) {
      try { return JSON.parse(initialData.triggerConfig); } catch { return {}; }
    }
    return {};
  });
  const [steps, setSteps] = useState<StepData[]>(() => {
    if (initialData?.steps?.length) {
      return initialData.steps.map((s) => ({
        actionType: s.actionType,
        config: typeof s.config === 'string' ? JSON.parse(s.config) : s.config,
      }));
    }
    return [];
  });
  const [saving, setSaving] = useState(false);

  const addStep = (actionType: string) => {
    const defaults: Record<string, Record<string, unknown>> = {
      SEND_EMAIL: { to: '', subject: '', body: '' },
      CREATE_TASK: { title: '', description: '', priority: 'MEDIUM', type: 'FOLLOW_UP', dueInDays: 1 },
      SEND_NOTIFICATION: { title: '', message: '' },
      WEBHOOK: { url: '', method: 'POST' },
    };
    setSteps([...steps, { actionType, config: defaults[actionType] || {} }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStepConfig = (index: number, key: string, value: unknown) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], config: { ...updated[index].config, [key]: value } };
    setSteps(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name,
        description: description || null,
        trigger,
        triggerConfig: Object.keys(triggerConfig).length > 0 ? triggerConfig : null,
        steps: steps.map((s) => ({ actionType: s.actionType, config: s.config })),
      };

      const url = initialData?.id ? `/api/workflows/${initialData.id}` : '/api/workflows';
      const method = initialData?.id ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to save workflow');

      onSubmit();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Notify on lead assignment" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this workflow do?" rows={2} />
        </div>
      </div>

      {/* Trigger */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Trigger</Label>
        <div className="grid grid-cols-2 gap-3">
          {TRIGGER_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setTrigger(t.value); setTriggerConfig({}); }}
              className={`p-3 rounded-lg border text-left transition-all ${
                trigger === t.value
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{t.icon}</span>
                <span className="font-medium text-sm">{t.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t.description}</p>
            </button>
          ))}
        </div>

        {/* Trigger config */}
        {trigger === 'LEAD_STATUS_CHANGED' && (
          <div className="flex gap-3 mt-2">
            <div className="flex-1">
              <Label className="text-xs">From Status (optional)</Label>
              <SelectRoot value={(triggerConfig.fromStatus as string) || ''} onValueChange={(v: string) => setTriggerConfig({ ...triggerConfig, fromStatus: v || undefined })}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </SelectRoot>
            </div>
            <div className="flex-1">
              <Label className="text-xs">To Status (optional)</Label>
              <SelectRoot value={(triggerConfig.toStatus as string) || ''} onValueChange={(v: string) => setTriggerConfig({ ...triggerConfig, toStatus: v || undefined })}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </SelectRoot>
            </div>
          </div>
        )}
        {trigger === 'DEAL_WON' && (
          <div className="mt-2">
            <Label className="text-xs">Minimum Deal Value (optional)</Label>
            <Input
              type="number"
              value={(triggerConfig.minValue as string) || ''}
              onChange={(e) => setTriggerConfig({ ...triggerConfig, minValue: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g. 10000"
            />
          </div>
        )}
      </div>

      {/* Steps (Actions) */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Actions</Label>

        {steps.map((step, idx) => {
          const actionMeta = ACTION_OPTIONS.find((a) => a.value === step.actionType);
          return (
            <div key={idx} className={`p-4 rounded-lg border ${actionMeta?.color || 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-white/60 px-2 py-0.5 rounded">{idx + 1}</span>
                  <span className="text-sm">{actionMeta?.icon}</span>
                  <span className="font-medium text-sm">{actionMeta?.label}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeStep(idx)} className="text-red-500 hover:text-red-700 h-7 px-2">
                  Remove
                </Button>
              </div>

              {step.actionType === 'SEND_EMAIL' && (
                <div className="space-y-2">
                  <div><Label className="text-xs">To</Label><Input value={(step.config.to as string) || ''} onChange={(e) => updateStepConfig(idx, 'to', e.target.value)} placeholder="{{contactEmail}} or email@example.com" /></div>
                  <div><Label className="text-xs">Subject</Label><Input value={(step.config.subject as string) || ''} onChange={(e) => updateStepConfig(idx, 'subject', e.target.value)} placeholder="e.g. New lead assigned: {{leadTitle}}" /></div>
                  <div><Label className="text-xs">Body (HTML)</Label><Textarea value={(step.config.body as string) || ''} onChange={(e) => updateStepConfig(idx, 'body', e.target.value)} placeholder="Email body with {{variables}}" rows={3} /></div>
                </div>
              )}

              {step.actionType === 'CREATE_TASK' && (
                <div className="space-y-2">
                  <div><Label className="text-xs">Task Title</Label><Input value={(step.config.title as string) || ''} onChange={(e) => updateStepConfig(idx, 'title', e.target.value)} placeholder="e.g. Follow up on {{leadTitle}}" /></div>
                  <div><Label className="text-xs">Description</Label><Textarea value={(step.config.description as string) || ''} onChange={(e) => updateStepConfig(idx, 'description', e.target.value)} rows={2} /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Priority</Label>
                      <SelectRoot value={(step.config.priority as string) || 'MEDIUM'} onValueChange={(v: string) => updateStepConfig(idx, 'priority', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </SelectRoot>
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <SelectRoot value={(step.config.type as string) || 'FOLLOW_UP'} onValueChange={(v: string) => updateStepConfig(idx, 'type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </SelectRoot>
                    </div>
                    <div>
                      <Label className="text-xs">Due in (days)</Label>
                      <Input type="number" value={(step.config.dueInDays as number) || 1} onChange={(e) => updateStepConfig(idx, 'dueInDays', parseInt(e.target.value) || 1)} min={1} />
                    </div>
                  </div>
                </div>
              )}

              {step.actionType === 'SEND_NOTIFICATION' && (
                <div className="space-y-2">
                  <div><Label className="text-xs">Title</Label><Input value={(step.config.title as string) || ''} onChange={(e) => updateStepConfig(idx, 'title', e.target.value)} placeholder="e.g. Lead {{leadTitle}} assigned to you" /></div>
                  <div><Label className="text-xs">Message</Label><Textarea value={(step.config.message as string) || ''} onChange={(e) => updateStepConfig(idx, 'message', e.target.value)} placeholder="Notification body with {{variables}}" rows={2} /></div>
                </div>
              )}

              {step.actionType === 'WEBHOOK' && (
                <div className="space-y-2">
                  <div><Label className="text-xs">URL</Label><Input value={(step.config.url as string) || ''} onChange={(e) => updateStepConfig(idx, 'url', e.target.value)} placeholder="https://api.example.com/webhook" /></div>
                  <div>
                    <Label className="text-xs">Method</Label>
                    <SelectRoot value={(step.config.method as string) || 'POST'} onValueChange={(v: string) => updateStepConfig(idx, 'method', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                      </SelectContent>
                    </SelectRoot>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {ACTION_OPTIONS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => addStep(a.value)}
              className="p-3 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-left transition-all"
            >
              <div className="flex items-center gap-2">
                <span>{a.icon}</span>
                <span className="text-sm font-medium text-gray-600">Add {a.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !name || !trigger || steps.length === 0}>
          {saving ? 'Saving...' : initialData?.id ? 'Update Workflow' : 'Create Workflow'}
        </Button>
      </div>
    </div>
  );
}
