'use client';

import Link from 'next/link';
import { Shield, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const settingsCards = [
  {
    title: 'Roles & Permissions',
    description: 'Define roles and manage permission sets for your team',
    href: '/settings/roles',
    icon: Shield,
  },
  {
    title: 'Team Members',
    description: 'Manage members and assign roles',
    href: '/settings/members',
    icon: Users,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your organization settings and access controls
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <card.icon className="text-primary h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
