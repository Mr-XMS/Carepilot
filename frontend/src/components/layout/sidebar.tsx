'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Receipt,
  AlertTriangle,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/types/auth';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/participants', label: 'Participants', icon: Users },
  { href: '/roster', label: 'Roster', icon: Calendar },
  {
    href: '/roster/exceptions',
    label: 'Exceptions',
    icon: ShieldAlert,
    roles: ['OWNER', 'ADMIN', 'COORDINATOR'],
  },
  {
    href: '/service-agreements',
    label: 'Agreements',
    icon: FileText,
    roles: ['OWNER', 'ADMIN', 'COORDINATOR'],
  },
  {
    href: '/invoices',
    label: 'Invoices',
    icon: Receipt,
    roles: ['OWNER', 'ADMIN', 'BILLING'],
  },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: ['OWNER', 'ADMIN'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <aside className="w-56 shrink-0 border-r border-ink-100 bg-ink-50/30 flex flex-col">
      <div className="px-5 py-5 border-b border-ink-100">
        <Link href="/dashboard" className="font-mono text-sm tracking-tight text-ink-900">
          Nutrix
        </Link>
        {user && (
          <div className="mt-1 text-xs text-ink-400 truncate" title={user.organisationName}>
            {user.organisationName}
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-3 border-t border-ink-100 text-xs text-ink-400 font-mono">
        v0.1.0
      </div>
    </aside>
  );
}
