'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, User, ChevronLeft, ChevronRight, Target, Users, Building2, Kanban, CheckSquare, Shield, Settings, Mail, FileText, Workflow } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebar';
import { Button } from '@/components/ui/button';

const iconMap = {
  LayoutDashboard,
  BarChart3,
  User,
  Target,
  Users,
  Building2,
  Kanban,
  CheckSquare,
  Shield,
  Settings,
  Mail,
  FileText,
  Workflow,
} as const;

interface SidebarLink {
  title: string;
  href: string;
  icon: keyof typeof iconMap;
}

const mainNav: SidebarLink[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'BarChart3' },
  { title: 'Leads', href: '/leads', icon: 'Target' },
  { title: 'Contacts', href: '/contacts', icon: 'Users' },
  { title: 'Companies', href: '/companies', icon: 'Building2' },
  { title: 'Deals', href: '/deals', icon: 'Kanban' },
  { title: 'Tasks', href: '/tasks', icon: 'CheckSquare' },
  { title: 'Emails', href: '/emails', icon: 'Mail' },
  { title: 'Templates', href: '/email-templates', icon: 'FileText' },
  { title: 'Automations', href: '/automations', icon: 'Workflow' },
];

const settingsNav: SidebarLink[] = [
  { title: 'Settings', href: '/settings', icon: 'Settings' },
  { title: 'Roles', href: '/settings/roles', icon: 'Shield' },
  { title: 'Members', href: '/settings/members', icon: 'Users' },
  { title: 'Profile', href: '/profile', icon: 'User' },
];

function NavLink({ item, collapsed }: { item: SidebarLink; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = iconMap[item.icon];

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  );
}

export function Sidebar() {
  const { isOpen, toggle } = useSidebarStore();

  return (
    <aside
      className={cn(
        'bg-card flex h-full flex-col border-r transition-all duration-300',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {isOpen && (
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="text-primary h-5 w-5" />
            <span>CRM SaaS</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className={cn('ml-auto h-8 w-8', !isOpen && 'mx-auto')}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        <div className="space-y-1">
          {!isOpen ? null : (
            <p className="text-muted-foreground px-3 text-xs font-semibold tracking-wider uppercase">
              Main
            </p>
          )}
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={!isOpen} />
          ))}
        </div>

        <div className="mt-6 space-y-1">
          {!isOpen ? null : (
            <p className="text-muted-foreground px-3 text-xs font-semibold tracking-wider uppercase">
              Settings
            </p>
          )}
          {settingsNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={!isOpen} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
