'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Mail,
  MousePointerClick,
  Eye,
  User,
  Briefcase,
  FileText,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusInfo, getEventInfo } from '@/components/emails/email-constants';

interface EmailEvent {
  id: string;
  type: string;
  metadata: string | null;
  occurredAt: string;
}

interface EmailDetail {
  id: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  openCount: number;
  clickCount: number;
  createdAt: string;
  sender: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  contact: { id: string; firstName: string; lastName: string; email: string | null } | null;
  deal: { id: string; title: string } | null;
  template: { id: string; name: string } | null;
  events: EmailEvent[];
}

export default function EmailDetailPage() {
  const params = useParams();
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmail = async () => {
      const res = await fetch(`/api/emails/${params.id}`);
      const json = await res.json();
      if (json.success) setEmail(json.data);
      setLoading(false);
    };
    fetchEmail();
  }, [params.id]);

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Email not found.</p>
        <Link href="/emails">
          <Button variant="outline" className="mt-4">
            Back to Emails
          </Button>
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(email.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/emails">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{email.subject}</h1>
            <p className="text-muted-foreground text-sm">To: {email.toEmail}</p>
          </div>
        </div>
        <Badge variant="outline" className={statusInfo.color}>
          {statusInfo.label}
        </Badge>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Status</CardTitle>
            <Mail className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{statusInfo.label}</div>
            <p className="text-muted-foreground text-xs">Sent: {formatDate(email.sentAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Opens</CardTitle>
            <Eye className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{email.openCount}</div>
            <p className="text-muted-foreground text-xs">
              First: {formatDate(email.openedAt)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Clicks</CardTitle>
            <MousePointerClick className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{email.clickCount}</div>
            <p className="text-muted-foreground text-xs">
              First: {formatDate(email.clickedAt)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Created</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{formatDate(email.createdAt)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Email body */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 grid gap-1 text-sm">
                <div>
                  <strong>From:</strong> {email.fromEmail}
                </div>
                <div>
                  <strong>To:</strong> {email.toEmail}
                </div>
                <div>
                  <strong>Subject:</strong> {email.subject}
                </div>
              </div>
              <div
                className="prose max-w-none rounded border p-4"
                dangerouslySetInnerHTML={{ __html: email.body }}
              />
            </CardContent>
          </Card>

          {/* Tracking events timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Tracking Events</CardTitle>
            </CardHeader>
            <CardContent>
              {email.events.length === 0 ? (
                <p className="text-muted-foreground text-sm">No tracking events yet.</p>
              ) : (
                <div className="space-y-3">
                  {email.events.map((event) => {
                    const info = getEventInfo(event.type);
                    return (
                      <div key={event.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                        <span className="text-lg">{info.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{info.label}</div>
                          <div className="text-muted-foreground text-xs">
                            {formatDate(event.occurredAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Associations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {email.sender && (
                <div className="flex items-center gap-2">
                  <User className="text-muted-foreground h-4 w-4" />
                  <div>
                    <div className="text-muted-foreground text-xs">Sent by</div>
                    <div>
                      {email.sender.firstName} {email.sender.lastName}
                    </div>
                  </div>
                </div>
              )}
              {email.contact && (
                <div className="flex items-center gap-2">
                  <User className="text-muted-foreground h-4 w-4" />
                  <div>
                    <div className="text-muted-foreground text-xs">Contact</div>
                    <Link href={`/contacts/${email.contact.id}`} className="text-blue-600 hover:underline">
                      {email.contact.firstName} {email.contact.lastName}
                    </Link>
                  </div>
                </div>
              )}
              {email.deal && (
                <div className="flex items-center gap-2">
                  <Briefcase className="text-muted-foreground h-4 w-4" />
                  <div>
                    <div className="text-muted-foreground text-xs">Deal</div>
                    <Link href={`/deals/${email.deal.id}`} className="text-blue-600 hover:underline">
                      {email.deal.title}
                    </Link>
                  </div>
                </div>
              )}
              {email.template && (
                <div className="flex items-center gap-2">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  <div>
                    <div className="text-muted-foreground text-xs">Template</div>
                    <div>{email.template.name}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
