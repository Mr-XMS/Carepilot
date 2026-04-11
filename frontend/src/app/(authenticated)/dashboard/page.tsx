'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useOutstandingSummary } from '@/hooks/use-invoices';
import { Users, Calendar, Receipt, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: outstandingSummary } = useOutstandingSummary();
  const greeting = getGreeting();

  const outstandingValue = outstandingSummary
    ? `$${outstandingSummary.totalOutstanding.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '—';
  const outstandingHint = outstandingSummary
    ? `${outstandingSummary.invoiceCount} invoice${outstandingSummary.invoiceCount === 1 ? '' : 's'} outstanding`
    : 'Total receivables';

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="mb-10">
        <div className="text-xs text-ink-400 font-mono uppercase tracking-wider mb-2">
          {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <h1 className="text-3xl font-medium text-ink-900">
          {greeting}, {user?.firstName}.
        </h1>
        <p className="text-sm text-ink-500 mt-1.5">
          Here&apos;s what&apos;s happening across your organisation today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <KpiCard
          label="Active participants"
          value="—"
          hint="Awaiting first sync"
          icon={Users}
          href="/participants"
        />
        <KpiCard
          label="Shifts this week"
          value="—"
          hint="Scheduled + in progress"
          icon={Calendar}
          href="/roster"
        />
        <KpiCard
          label="Outstanding invoices"
          value={outstandingValue}
          hint={outstandingHint}
          icon={Receipt}
          href="/invoices"
        />
        <KpiCard
          label="Open incidents"
          value="—"
          hint="Requires attention"
          icon={AlertTriangle}
          href="/incidents"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionHeader title="Get started" subtitle="Three quick steps to be operational" />
          <div className="space-y-2">
            <OnboardingStep
              number={1}
              title="Add your first participant"
              description="Import from a spreadsheet or add manually"
              action={{ label: 'Add participant', href: '/participants/new' }}
            />
            <OnboardingStep
              number={2}
              title="Create an NDIS plan and service agreement"
              description="Set up budgets and link to support items"
              action={{ label: 'Create agreement', href: '/service-agreements/new' }}
            />
            <OnboardingStep
              number={3}
              title="Build your first roster"
              description="Schedule support workers and detect conflicts"
              action={{ label: 'Open roster', href: '/roster' }}
            />
          </div>
        </div>

        <div>
          <SectionHeader title="Quick links" />
          <div className="space-y-2">
            <QuickLink href="/participants" label="View all participants" />
            <QuickLink href="/roster" label="This week's roster" />
            <QuickLink href="/invoices" label="Generate invoices" />
            <QuickLink href="/incidents" label="Incident register" />
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link
      href={href as any}
      className="block bg-white border border-ink-100 rounded-md p-4 hover:border-ink-200 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className="size-4 text-ink-400" />
        <ArrowRight className="size-3.5 text-ink-300 group-hover:text-ink-500 transition-colors" />
      </div>
      <div className="text-2xl font-medium text-ink-900 mb-0.5">{value}</div>
      <div className="text-xs text-ink-600">{label}</div>
      <div className="text-[11px] text-ink-400 mt-1.5">{hint}</div>
    </Link>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-medium text-ink-900">{title}</h2>
      {subtitle && <p className="text-xs text-ink-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function OnboardingStep({
  number,
  title,
  description,
  action,
}: {
  number: number;
  title: string;
  description: string;
  action: { label: string; href: string };
}) {
  return (
    <div className="bg-white border border-ink-100 rounded-md p-4 flex items-start gap-4">
      <div className="size-7 rounded-full bg-ink-50 text-ink-500 text-xs font-medium flex items-center justify-center shrink-0 font-mono">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-900">{title}</div>
        <div className="text-xs text-ink-500 mt-0.5">{description}</div>
      </div>
      <Link href={action.href as any}>
        <Button variant="secondary" size="sm">
          {action.label}
        </Button>
      </Link>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href as any}
      className="flex items-center justify-between px-3 py-2 bg-white border border-ink-100 rounded-md text-xs text-ink-600 hover:border-ink-200 hover:text-ink-900 transition-colors group"
    >
      <span>{label}</span>
      <ArrowRight className="size-3 text-ink-300 group-hover:text-ink-500 transition-colors" />
    </Link>
  );
}
