'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyFormDialog, type CompanyFormData } from '@/components/companies/company-form-dialog';
import { DeleteCompanyDialog } from '@/components/companies/delete-company-dialog';
import {
  getDealStageLabel,
  getDealStageColor,
  formatCurrency,
} from '@/components/companies/company-constants';

interface CompanyContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  source: string;
}

interface CompanyDeal {
  id: string;
  title: string;
  stage: string;
  value: string | number | null;
  currency: string;
  probability: number | null;
  expectedCloseDate: string | null;
  closedAt: string | null;
  createdAt: string;
}

interface CompanyTag {
  tag: { id: string; name: string; color: string | null };
}

interface CompanyDetail {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: CompanyContact[];
  deals: CompanyDeal[];
  tags: CompanyTag[];
  _count: { contacts: number; deals: number };
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = React.useState<CompanyDetail | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();
  const [activeTab, setActiveTab] = React.useState<'contacts' | 'deals'>('contacts');

  React.useEffect(() => {
    const abortController = new AbortController();

    startTransition(async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}`, {
          signal: abortController.signal,
        });
        const json = await res.json();
        if (json.success && !abortController.signal.aborted) {
          setCompany(json.data);
        }
      } catch {
        // Aborted or network error
      }
    });

    return () => abortController.abort();
  }, [companyId, fetchKey]);

  const loading = isPending && !company;

  async function handleEdit(data: CompanyFormData) {
    const res = await fetch(`/api/companies/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setFetchKey((k) => k + 1);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/companies/${companyId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/companies');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Company not found</p>
        <Button asChild variant="outline">
          <Link href="/companies">Back to Companies</Link>
        </Button>
      </div>
    );
  }

  const totalRevenue = company.deals.reduce((sum, deal) => {
    const val = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    return sum + (val ?? 0);
  }, 0);

  const wonRevenue = company.deals
    .filter((d) => d.stage === 'CLOSED_WON')
    .reduce((sum, deal) => {
      const val = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
      return sum + (val ?? 0);
    }, 0);

  const openDeals = company.deals.filter(
    (d) => d.stage !== 'CLOSED_WON' && d.stage !== 'CLOSED_LOST'
  ).length;

  const address = [company.address, company.city, company.state, company.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {company.industry && <span>{company.industry}</span>}
              {company.industry && company.size && <span>&middot;</span>}
              {company.size && <span>{company.size}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Pipeline</p>
              <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Won Revenue</p>
              <p className="text-lg font-bold">{formatCurrency(wonRevenue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contacts</p>
              <p className="text-lg font-bold">{company._count.contacts}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Briefcase className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open Deals</p>
              <p className="text-lg font-bold">{openDeals}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <Card>
            <div className="border-b">
              <div className="flex">
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'contacts'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('contacts')}
                >
                  <Users className="mr-2 h-4 w-4 inline" />
                  Contacts ({company.contacts.length})
                </button>
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'deals'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('deals')}
                >
                  <Briefcase className="mr-2 h-4 w-4 inline" />
                  Deals ({company.deals.length})
                </button>
              </div>
            </div>

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="p-4">
                {company.contacts.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No contacts linked to this company yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-2 text-left font-medium">Name</th>
                          <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Email</th>
                          <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Phone</th>
                          <th className="hidden px-3 py-2 text-left font-medium lg:table-cell">Title</th>
                        </tr>
                      </thead>
                      <tbody>
                        {company.contacts.map((contact) => (
                          <tr key={contact.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="px-3 py-2">
                              <Link
                                href={`/contacts/${contact.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {contact.firstName} {contact.lastName}
                              </Link>
                            </td>
                            <td className="hidden px-3 py-2 sm:table-cell text-muted-foreground">
                              {contact.email ?? '-'}
                            </td>
                            <td className="hidden px-3 py-2 md:table-cell text-muted-foreground">
                              {contact.phone ?? '-'}
                            </td>
                            <td className="hidden px-3 py-2 lg:table-cell text-muted-foreground">
                              {contact.title ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Deals Tab */}
            {activeTab === 'deals' && (
              <div className="p-4">
                {company.deals.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No deals linked to this company yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-2 text-left font-medium">Deal</th>
                          <th className="px-3 py-2 text-left font-medium">Stage</th>
                          <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Value</th>
                          <th className="hidden px-3 py-2 text-center font-medium md:table-cell">Probability</th>
                          <th className="hidden px-3 py-2 text-left font-medium lg:table-cell">Close Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {company.deals.map((deal) => (
                          <tr key={deal.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="px-3 py-2 font-medium">{deal.title}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getDealStageColor(deal.stage)}`}
                              >
                                {getDealStageLabel(deal.stage)}
                              </span>
                            </td>
                            <td className="hidden px-3 py-2 text-right sm:table-cell">
                              {formatCurrency(deal.value, deal.currency)}
                            </td>
                            <td className="hidden px-3 py-2 text-center md:table-cell">
                              {deal.probability != null ? `${deal.probability}%` : '-'}
                            </td>
                            <td className="hidden px-3 py-2 lg:table-cell text-muted-foreground">
                              {deal.expectedCloseDate
                                ? new Date(deal.expectedCloseDate).toLocaleDateString()
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Profile
            </h3>

            {company.description && (
              <p className="text-sm text-muted-foreground">{company.description}</p>
            )}

            <div className="space-y-3 text-sm">
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              {company.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${company.email}`} className="text-primary hover:underline truncate">
                    {company.email}
                  </a>
                </div>
              )}

              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{company.phone}</span>
                </div>
              )}

              {address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{address}</span>
                </div>
              )}

              {company.industry && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{company.industry}</span>
                </div>
              )}

              {company.size && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{company.size}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Tags */}
          {company.tags.length > 0 && (
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold text-sm">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {company.tags.map((t) => (
                  <span
                    key={t.tag.id}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground"
                  >
                    {t.tag.name}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Dates */}
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(company.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(company.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <CompanyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        initialData={{
          name: company.name,
          website: company.website ?? '',
          industry: company.industry ?? '',
          size: company.size ?? '',
          phone: company.phone ?? '',
          email: company.email ?? '',
          address: company.address ?? '',
          city: company.city ?? '',
          state: company.state ?? '',
          country: company.country ?? '',
          description: company.description ?? '',
        }}
        mode="edit"
      />
      <DeleteCompanyDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        companyName={company.name}
      />
    </div>
  );
}
