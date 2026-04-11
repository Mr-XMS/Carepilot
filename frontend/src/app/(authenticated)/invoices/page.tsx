'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Receipt, DollarSign, AlertTriangle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { GenerateInvoicesModal } from '@/components/invoices/generate-invoices-modal';
import { useInvoices, useOutstandingSummary } from '@/hooks/use-invoices';
import { useParticipants } from '@/hooks/use-participants';
import type { InvoiceStatus, BillingTarget } from '@/types/invoice';

const PAGE_SIZE = 25;

const statusBadge: Record<InvoiceStatus, { label: string; variant: 'muted' | 'info' | 'success' | 'warning' | 'danger' | 'default' }> = {
  DRAFT: { label: 'Draft', variant: 'muted' },
  SENT: { label: 'Sent', variant: 'info' },
  PAID: { label: 'Paid', variant: 'success' },
  PARTIALLY_PAID: { label: 'Partial', variant: 'warning' },
  OVERDUE: { label: 'Overdue', variant: 'danger' },
  VOID: { label: 'Void', variant: 'default' },
};

const billingTargetLabels: Record<BillingTarget, string> = {
  NDIA: 'NDIA',
  PLAN_MANAGER: 'Plan manager',
  SELF_MANAGED: 'Self-managed',
};

function money(val: string | number) {
  return `$${Number(val).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [billingFilter, setBillingFilter] = useState<string>('');
  const [participantFilter, setParticipantFilter] = useState<string>('');
  const [generateOpen, setGenerateOpen] = useState(false);

  const { data: participantsData } = useParticipants({ limit: 200, status: 'ACTIVE' });
  const participants = participantsData?.data;

  const params = {
    ...(statusFilter && { status: statusFilter as InvoiceStatus }),
    ...(billingFilter && { billingTarget: billingFilter as BillingTarget }),
    ...(participantFilter && { participantId: participantFilter }),
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, error } = useInvoices(params);
  const { data: summary } = useOutstandingSummary();
  const invoices = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-900">Invoices</h1>
          <p className="text-sm text-ink-500">Manage billing and track payments</p>
        </div>
        <Button size="sm" onClick={() => setGenerateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Generate invoices
        </Button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Total outstanding"
            value={money(summary.totalOutstanding)}
          />
          <SummaryCard
            icon={<Receipt className="h-4 w-4" />}
            label="Outstanding invoices"
            value={String(summary.invoiceCount)}
          />
          <SummaryCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Overdue (90+ days)"
            value={money(summary.ageingBuckets.over90)}
            danger={summary.ageingBuckets.over90 > 0}
          />
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="VOID">Void</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Billing target</label>
            <select
              value={billingFilter}
              onChange={(e) => { setBillingFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="">All targets</option>
              <option value="NDIA">NDIA</option>
              <option value="PLAN_MANAGER">Plan manager</option>
              <option value="SELF_MANAGED">Self-managed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Participant</label>
            <select
              value={participantFilter}
              onChange={(e) => { setParticipantFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="">All participants</option>
              {participants?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>
          {(statusFilter || billingFilter || participantFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStatusFilter(''); setBillingFilter(''); setParticipantFilter(''); setPage(1); }}
            >
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <p className="py-8 text-center text-sm text-rose-600">Failed to load invoices.</p>
        )}

        {!isLoading && !error && invoices.length === 0 && (
          <EmptyState
            icon={<Receipt className="h-5 w-5" />}
            title="No invoices yet"
            description="Generate invoices from completed shifts to get started."
            action={
              <Button size="sm" onClick={() => setGenerateOpen(true)}>
                Generate invoices
              </Button>
            }
          />
        )}

        {!isLoading && invoices.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left">
                    <th className="px-4 py-3 font-medium text-ink-600">Invoice #</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Participant</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Date</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Due</th>
                    <th className="px-4 py-3 font-medium text-ink-600 text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-ink-600 text-right">Paid</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Status</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="cursor-pointer hover:bg-ink-50 transition-colors"
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-ink-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-ink-900">
                        {inv.participant.firstName} {inv.participant.lastName}
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {format(new Date(inv.invoiceDate), 'd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {format(new Date(inv.dueDate), 'd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-ink-900 text-right font-medium">
                        {money(inv.total)}
                      </td>
                      <td className="px-4 py-3 text-ink-700 text-right">
                        {money(inv.paidAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadge[inv.status as InvoiceStatus]?.variant || 'default'}>
                          {statusBadge[inv.status as InvoiceStatus]?.label || inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-600 text-xs">
                        {billingTargetLabels[inv.billingTarget as BillingTarget] || inv.billingTarget}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary + Pagination */}
            {meta && (
              <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
                <div className="text-xs text-ink-500 space-x-4">
                  <span>Page {meta.page} of {meta.totalPages} ({meta.total} invoices)</span>
                  <span className="font-medium">Outstanding: {money(meta.sumOutstanding)}</span>
                </div>
                {meta.totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= meta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      <GenerateInvoicesModal open={generateOpen} onClose={() => setGenerateOpen(false)} />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-white border border-ink-100 rounded-md p-4">
      <div className="flex items-center gap-2 text-ink-400 mb-2">{icon}</div>
      <div className={`text-xl font-semibold ${danger ? 'text-rose-600' : 'text-ink-900'}`}>
        {value}
      </div>
      <div className="text-xs text-ink-500 mt-0.5">{label}</div>
    </div>
  );
}
