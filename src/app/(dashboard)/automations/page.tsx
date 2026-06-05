'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowFormDialog } from '@/components/workflows/workflow-form-dialog';
import { DeleteWorkflowDialog } from '@/components/workflows/delete-workflow-dialog';
import { TRIGGER_OPTIONS, ACTION_OPTIONS } from '@/components/workflows/workflow-constants';

interface WorkflowStep {
  id: string;
  actionType: string;
  config: string;
  sortOrder: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  triggerConfig: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: { id: string; firstName: string | null; lastName: string | null };
  steps: WorkflowStep[];
  _count: { executions: number };
}

interface WorkflowExecution {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Workflow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<Record<string, WorkflowExecution[]>>({});
  const [isPending, startTransition] = useTransition();
  const [fetchKey, setFetchKey] = useState(0);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows?limit=50');
      if (!res.ok) return;
      const data = await res.json();
      setWorkflows(data.data?.workflows || []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    startTransition(() => { fetchWorkflows(); });
  }, [fetchWorkflows, fetchKey]);

  const fetchExecutions = async (workflowId: string) => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/executions?limit=5`);
      if (!res.ok) return;
      const data = await res.json();
      setRecentExecutions((prev) => ({ ...prev, [workflowId]: data.data?.executions || [] }));
    } catch {
      // silently fail
    }
  };

  const toggleActive = async (workflow: Workflow) => {
    try {
      await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !workflow.isActive }),
      });
      setFetchKey((k) => k + 1);
    } catch {
      // silently fail
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/workflows/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setFetchKey((k) => k + 1);
    } catch {
      // silently fail
    }
  };

  const handleEdit = (workflow: Workflow) => {
    setEditData(workflow);
    setFormOpen(true);
  };

  const activeCount = workflows.filter((w) => w.isActive).length;
  const totalExecutions = workflows.reduce((sum, w) => sum + w._count.executions, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-sm text-gray-500 mt-1">
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} &middot; {activeCount} active &middot; {totalExecutions} total executions
          </p>
        </div>
        <Button onClick={() => { setEditData(null); setFormOpen(true); }}>
          Create Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Workflows</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{workflows.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Active</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{activeCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Executions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalExecutions}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Triggers</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{new Set(workflows.map((w) => w.trigger)).size}</p></CardContent>
        </Card>
      </div>

      {/* Workflow list */}
      {isPending && workflows.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No workflows created yet</p>
            <Button onClick={() => { setEditData(null); setFormOpen(true); }}>Create your first workflow</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => {
            const triggerMeta = TRIGGER_OPTIONS.find((t) => t.value === workflow.trigger);
            const executions = recentExecutions[workflow.id];

            return (
              <Card key={workflow.id} className={`transition-all ${!workflow.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/automations/${workflow.id}`} className="text-lg font-semibold hover:text-blue-600 transition-colors">
                          {workflow.name}
                        </Link>
                        <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {workflow.description && (
                        <p className="text-sm text-gray-500 mb-3">{workflow.description}</p>
                      )}

                      {/* Visual pipeline: Trigger → Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-200">
                          <span>{triggerMeta?.icon}</span>
                          <span>{triggerMeta?.label || workflow.trigger}</span>
                        </div>
                        {workflow.steps.map((step, idx) => {
                          const actionMeta = ACTION_OPTIONS.find((a) => a.value === step.actionType);
                          return (
                            <div key={step.id} className="flex items-center gap-2">
                              <span className="text-gray-300">→</span>
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${actionMeta?.color || 'bg-gray-100 text-gray-600'}`}>
                                <span className="font-mono text-[10px] opacity-60">{idx + 1}</span>
                                <span>{actionMeta?.icon}</span>
                                <span>{actionMeta?.label || step.actionType}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Recent executions */}
                      {!executions && workflow._count.executions > 0 && (
                        <button
                          onClick={() => fetchExecutions(workflow.id)}
                          className="text-xs text-blue-500 hover:text-blue-700 mt-2"
                        >
                          Show recent executions ({workflow._count.executions})
                        </button>
                      )}
                      {executions && executions.length > 0 && (
                        <div className="flex items-center gap-1 mt-3">
                          <span className="text-xs text-gray-400 mr-1">Recent:</span>
                          {executions.map((exec) => (
                            <span
                              key={exec.id}
                              className={`inline-block w-2 h-2 rounded-full ${
                                exec.status === 'COMPLETED' ? 'bg-green-500' :
                                exec.status === 'FAILED' ? 'bg-red-500' :
                                exec.status === 'RUNNING' ? 'bg-blue-500' : 'bg-gray-400'
                              }`}
                              title={`${exec.status} — ${new Date(exec.startedAt).toLocaleString()}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(workflow)}
                      >
                        {workflow.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(workflow)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setDeleteTarget(workflow)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <WorkflowFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={() => { setFormOpen(false); setFetchKey((k) => k + 1); }}
        initialData={editData ? {
          id: editData.id,
          name: editData.name,
          description: editData.description || undefined,
          trigger: editData.trigger,
          triggerConfig: editData.triggerConfig,
          steps: editData.steps,
        } : undefined}
      />

      <DeleteWorkflowDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        workflowName={deleteTarget?.name || ''}
      />
    </div>
  );
}
