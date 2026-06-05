'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowFormDialog } from '@/components/workflows/workflow-form-dialog';
import { DeleteWorkflowDialog } from '@/components/workflows/delete-workflow-dialog';
import { TRIGGER_OPTIONS, ACTION_OPTIONS, EXECUTION_STATUS_COLORS } from '@/components/workflows/workflow-constants';

interface StepLog {
  id: string;
  stepId: string;
  status: string;
  output: string | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  step: { actionType: string; sortOrder: number };
}

interface Execution {
  id: string;
  status: string;
  triggerData: string | null;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  stepLogs: StepLog[];
}

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
  executions: Execution[];
  _count: { executions: number };
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fetchKey, setFetchKey] = useState(0);

  const fetchWorkflow = useCallback(async () => {
    try {
      const res = await fetch(`/api/workflows/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setWorkflow(data.data);
    } catch {
      // silently fail
    }
  }, [id]);

  const fetchExecutions = useCallback(async () => {
    try {
      const res = await fetch(`/api/workflows/${id}/executions?page=${page}&limit=10`);
      if (!res.ok) return;
      const data = await res.json();
      setExecutions(data.data?.executions || []);
      setTotalPages(data.data?.pagination?.totalPages || 1);
    } catch {
      // silently fail
    }
  }, [id, page]);

  useEffect(() => {
    startTransition(() => { fetchWorkflow(); });
  }, [fetchWorkflow, fetchKey]);

  useEffect(() => {
    startTransition(() => { fetchExecutions(); });
  }, [fetchExecutions]);

  const handleDelete = async () => {
    await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
    router.push('/automations');
  };

  const toggleActive = async () => {
    if (!workflow) return;
    await fetch(`/api/workflows/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !workflow.isActive }),
    });
    setFetchKey((k) => k + 1);
  };

  if (isPending && !workflow) {
    return <div className="text-center py-12 text-gray-500">Loading workflow...</div>;
  }

  if (!workflow) {
    return <div className="text-center py-12 text-gray-500">Workflow not found</div>;
  }

  const triggerMeta = TRIGGER_OPTIONS.find((t) => t.value === workflow.trigger);
  const successRate = workflow._count.executions > 0
    ? Math.round((executions.filter((e) => e.status === 'COMPLETED').length / Math.max(executions.length, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{workflow.name}</h1>
            <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
              {workflow.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {workflow.description && (
            <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Created {new Date(workflow.createdAt).toLocaleDateString()} by{' '}
            {workflow.createdBy.firstName} {workflow.createdBy.lastName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleActive}>
            {workflow.isActive ? 'Disable' : 'Enable'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Executions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{workflow._count.executions}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Success Rate</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{successRate}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Trigger</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5">
              <span>{triggerMeta?.icon}</span>
              <span className="font-medium">{triggerMeta?.label}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Actions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{workflow.steps.length}</p></CardContent>
        </Card>
      </div>

      {/* Visual workflow pipeline */}
      <Card>
        <CardHeader><CardTitle>Workflow Pipeline</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {/* Trigger node */}
            <div className="flex-shrink-0 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl text-center min-w-[160px]">
              <span className="text-2xl">{triggerMeta?.icon}</span>
              <p className="text-sm font-semibold text-indigo-700 mt-1">{triggerMeta?.label}</p>
              <p className="text-xs text-indigo-500">Trigger</p>
              {workflow.triggerConfig && (
                <p className="text-xs text-indigo-400 mt-1">
                  {(() => {
                    try {
                      const config = JSON.parse(workflow.triggerConfig);
                      return Object.entries(config).map(([k, v]) => `${k}: ${v}`).join(', ');
                    } catch { return ''; }
                  })()}
                </p>
              )}
            </div>

            {/* Step nodes */}
            {workflow.steps.map((step, idx) => {
              const actionMeta = ACTION_OPTIONS.find((a) => a.value === step.actionType);
              let configSummary = '';
              try {
                const config = JSON.parse(step.config);
                if (step.actionType === 'SEND_EMAIL') configSummary = `To: ${config.to || '...'}`;
                else if (step.actionType === 'CREATE_TASK') configSummary = config.title || '...';
                else if (step.actionType === 'SEND_NOTIFICATION') configSummary = config.title || '...';
                else if (step.actionType === 'WEBHOOK') configSummary = config.url || '...';
              } catch { /* skip */ }

              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div className="text-gray-300 text-2xl flex-shrink-0">→</div>
                  <div className={`flex-shrink-0 p-4 rounded-xl text-center min-w-[160px] border-2 ${actionMeta?.color || 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-xs font-mono opacity-50 mb-1">Step {idx + 1}</div>
                    <span className="text-2xl">{actionMeta?.icon}</span>
                    <p className="text-sm font-semibold mt-1">{actionMeta?.label}</p>
                    {configSummary && (
                      <p className="text-xs opacity-60 mt-1 truncate max-w-[140px]">{configSummary}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No executions yet</p>
          ) : (
            <div className="space-y-3">
              {executions.map((exec) => (
                <div key={exec.id} className="border rounded-lg">
                  <button
                    onClick={() => setExpandedExecution(expandedExecution === exec.id ? null : exec.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={EXECUTION_STATUS_COLORS[exec.status] || ''}>
                        {exec.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(exec.startedAt).toLocaleString()}
                      </span>
                      {exec.completedAt && (
                        <span className="text-xs text-gray-400">
                          ({Math.round((new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000)}s)
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400">{expandedExecution === exec.id ? '▲' : '▼'}</span>
                  </button>

                  {expandedExecution === exec.id && (
                    <div className="border-t px-4 py-3 bg-gray-50 space-y-2">
                      {exec.triggerData && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Trigger Data:</p>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(JSON.parse(exec.triggerData), null, 2)}
                          </pre>
                        </div>
                      )}
                      {exec.error && (
                        <p className="text-xs text-red-600">Error: {exec.error}</p>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Step Logs:</p>
                        <div className="space-y-1">
                          {exec.stepLogs.map((log) => {
                            const actionMeta = ACTION_OPTIONS.find((a) => a.value === log.step.actionType);
                            return (
                              <div key={log.id} className="flex items-center gap-2 text-xs">
                                <Badge className={`${EXECUTION_STATUS_COLORS[log.status] || ''} text-[10px]`}>
                                  {log.status}
                                </Badge>
                                <span>{actionMeta?.icon} {actionMeta?.label}</span>
                                {log.error && <span className="text-red-500">— {log.error}</span>}
                                {log.completedAt && (
                                  <span className="text-gray-400">
                                    ({Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <WorkflowFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={() => { setFormOpen(false); setFetchKey((k) => k + 1); }}
        initialData={{
          id: workflow.id,
          name: workflow.name,
          description: workflow.description || undefined,
          trigger: workflow.trigger,
          triggerConfig: workflow.triggerConfig,
          steps: workflow.steps,
        }}
      />

      <DeleteWorkflowDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        workflowName={workflow.name}
      />
    </div>
  );
}
