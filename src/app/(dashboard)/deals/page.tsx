'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, GripVertical, DollarSign, Calendar, Percent, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DealFormDialog, type DealFormData } from '@/components/deals/deal-form-dialog';
import {
  DEAL_STAGES,
  getDealStageColumnColor,
  formatCompactCurrency,
} from '@/components/deals/deal-constants';

interface DealOwner {
  id: string;
  firstName: string;
  lastName: string;
}

interface DealContact {
  id: string;
  firstName: string;
  lastName: string;
}

interface DealCompany {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: string | number | null;
  currency: string;
  probability: number | null;
  expectedCloseDate: string | null;
  description: string | null;
  contactId: string | null;
  companyId: string | null;
  createdAt: string;
  owner: DealOwner | null;
  contact: DealContact | null;
  company: DealCompany | null;
  _count: { notes: number; activities: number; tasks: number };
}

interface SelectOption {
  id: string;
  name: string;
}

export default function DealsPage() {
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [contacts, setContacts] = React.useState<SelectOption[]>([]);
  const [companies, setCompanies] = React.useState<SelectOption[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createStage, setCreateStage] = React.useState('PROSPECTING');
  const [searchInput, setSearchInput] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [fetchKey, setFetchKey] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();
  const [draggedDealId, setDraggedDealId] = React.useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/companies').then((r) => r.json()),
      fetch('/api/contacts?limit=100').then((r) => r.json()),
    ]).then(([companiesJson, contactsJson]) => {
      if (companiesJson.success) {
        setCompanies(
          (companiesJson.data.companies ?? companiesJson.data ?? []).map(
            (c: { id: string; name: string }) => ({ id: c.id, name: c.name })
          )
        );
      }
      if (contactsJson.success) {
        setContacts(
          (contactsJson.data.contacts ?? []).map(
            (c: { id: string; firstName: string; lastName: string }) => ({
              id: c.id,
              name: `${c.firstName} ${c.lastName}`,
            })
          )
        );
      }
    });
  }, []);

  React.useEffect(() => {
    const abortController = new AbortController();

    const params = new URLSearchParams();
    params.set('limit', '200');
    if (searchQuery) params.set('search', searchQuery);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/deals?${params.toString()}`, {
          signal: abortController.signal,
        });
        const json = await res.json();
        if (json.success && !abortController.signal.aborted) {
          setDeals(json.data.deals);
        }
      } catch {
        // Aborted or network error
      }
    });

    return () => abortController.abort();
  }, [searchQuery, fetchKey]);

  const loading = isPending && deals.length === 0;

  const debounceTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }

  async function handleCreate(data: DealFormData) {
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setFetchKey((k) => k + 1);
    }
  }

  async function handleDragEnd(dealId: string, newStage: string) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );

    const res = await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });

    if (!res.ok) {
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: deal.stage } : d))
      );
    }
  }

  function getStageDeals(stage: string) {
    return deals.filter((d) => d.stage === stage);
  }

  function getStageTotal(stage: string) {
    return getStageDeals(stage).reduce((sum, d) => {
      const val = typeof d.value === 'string' ? parseFloat(d.value) : d.value;
      return sum + (val ?? 0);
    }, 0);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground text-sm">
            Drag and drop deals between stages to update their progress.
          </p>
        </div>
        <Button onClick={() => { setCreateStage('PROSPECTING'); setCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search deals..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {loading ? (
          DEAL_STAGES.map((stage) => (
            <div key={stage.value} className="flex-shrink-0 w-72">
              <Skeleton className="h-10 mb-3 rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
              </div>
            </div>
          ))
        ) : (
          DEAL_STAGES.map((stage) => {
            const stageDeals = getStageDeals(stage.value);
            const stageTotal = getStageTotal(stage.value);

            return (
              <div
                key={stage.value}
                className="flex-shrink-0 w-72"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage.value);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStage(null);
                  if (draggedDealId) {
                    handleDragEnd(draggedDealId, stage.value);
                    setDraggedDealId(null);
                  }
                }}
              >
                {/* Column Header */}
                <div
                  className={`rounded-lg border border-t-4 ${getDealStageColumnColor(stage.value)} bg-muted/30 p-3 mb-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{stage.label}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {stageDeals.length}
                      </span>
                    </div>
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => { setCreateStage(stage.value); setCreateOpen(true); }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {stageTotal > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCompactCurrency(stageTotal)}
                    </p>
                  )}
                </div>

                {/* Drop Zone */}
                <div
                  className={`min-h-[200px] space-y-3 rounded-lg p-1 transition-colors ${
                    dragOverStage === stage.value ? 'bg-primary/5 ring-2 ring-primary/20' : ''
                  }`}
                >
                  {stageDeals.map((deal) => (
                    <Card
                      key={deal.id}
                      draggable
                      onDragStart={() => setDraggedDealId(deal.id)}
                      onDragEnd={() => { setDraggedDealId(null); setDragOverStage(null); }}
                      className={`p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                        draggedDealId === deal.id ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/deals/${deal.id}`}
                            className="font-medium text-sm text-primary hover:underline line-clamp-2"
                          >
                            {deal.title}
                          </Link>

                          {deal.company && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {deal.company.name}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                            {deal.value != null && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                <DollarSign className="h-3 w-3" />
                                {formatCompactCurrency(deal.value, deal.currency)}
                              </span>
                            )}

                            {deal.probability != null && deal.probability > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Percent className="h-3 w-3" />
                                {deal.probability}%
                              </span>
                            )}

                            {deal.expectedCloseDate && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>

                          {deal.contact && (
                            <p className="text-xs text-muted-foreground mt-1.5 truncate">
                              {deal.contact.firstName} {deal.contact.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border border-dashed rounded-lg">
                      Drop deals here
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Deal Dialog */}
      <DealFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        initialData={{ stage: createStage }}
        mode="create"
        contacts={contacts}
        companies={companies}
      />
    </div>
  );
}
