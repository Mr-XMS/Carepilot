'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useServiceAgreements } from '@/hooks/use-service-agreements';
import { useParticipants } from '@/hooks/use-participants';
import type { AgreementStatus } from '@/types/service-agreement';

const statusBadge: Record<AgreementStatus, { label: string; variant: 'info' | 'success' | 'default' | 'danger' }> = {
  DRAFT: { label: 'Draft', variant: 'info' },
  ACTIVE: { label: 'Active', variant: 'success' },
  EXPIRED: { label: 'Expired', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
};

function money(val: string | number) {
  return `$${Number(val).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ServiceAgreementsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [participantFilter, setParticipantFilter] = useState<string>('');

  const params = {
    ...(statusFilter && { status: statusFilter as AgreementStatus }),
    ...(participantFilter && { participantId: participantFilter }),
  };

  const { data: agreements, isLoading, error } = useServiceAgreements(params);
  const { data: participantsData } = useParticipants({ limit: 100, status: 'ACTIVE' });
  const participants = participantsData?.data;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-ink-900">Service agreements</h1>
        <p className="text-sm text-ink-500">NDIS service agreements and budget tracking</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Participant</label>
            <select
              value={participantFilter}
              onChange={(e) => setParticipantFilter(e.target.value)}
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
          {(statusFilter || participantFilter) && (
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(''); setParticipantFilter(''); }}>
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
          <p className="py-8 text-center text-sm text-rose-600">Failed to load agreements.</p>
        )}

        {!isLoading && !error && agreements?.length === 0 && (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No service agreements"
            description="Service agreements will appear here once created."
          />
        )}

        {!isLoading && agreements && agreements.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left">
                  <th className="px-4 py-3 font-medium text-ink-600">Participant</th>
                  <th className="px-4 py-3 font-medium text-ink-600">Period</th>
                  <th className="px-4 py-3 font-medium text-ink-600">Items</th>
                  <th className="px-4 py-3 font-medium text-ink-600 text-right">Budget</th>
                  <th className="px-4 py-3 font-medium text-ink-600 text-right">Delivered</th>
                  <th className="px-4 py-3 font-medium text-ink-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {agreements.map((ag) => {
                  const totalBudget = ag.lineItems.reduce(
                    (sum, li) => sum + Number(li.allocatedBudget), 0,
                  );
                  const totalDelivered = ag.lineItems.reduce(
                    (sum, li) => sum + Number(li.deliveredBudget), 0,
                  );

                  return (
                    <tr
                      key={ag.id}
                      className="cursor-pointer hover:bg-ink-50 transition-colors"
                      onClick={() => router.push(`/service-agreements/${ag.id}`)}
                    >
                      <td className="px-4 py-3 text-ink-900">
                        {ag.participant.firstName} {ag.participant.lastName}
                        <div className="text-xs text-ink-500">{ag.participant.ndisNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {format(new Date(ag.startDate), 'd MMM yyyy')} –{' '}
                        {format(new Date(ag.endDate), 'd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {ag.lineItems.length}
                      </td>
                      <td className="px-4 py-3 text-ink-900 text-right font-medium">
                        {money(totalBudget)}
                      </td>
                      <td className="px-4 py-3 text-ink-700 text-right">
                        {money(totalDelivered)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadge[ag.status]?.variant || 'default'}>
                          {statusBadge[ag.status]?.label || ag.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
