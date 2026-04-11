'use client';

import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, Ban, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  useServiceAgreement,
  useActivateAgreement,
  useCancelAgreement,
  useRemoveLineItem,
} from '@/hooks/use-service-agreements';
import type { AgreementStatus, FundingCategory } from '@/types/service-agreement';

const statusConfig: Record<AgreementStatus, { label: string; variant: 'info' | 'success' | 'default' | 'danger' }> = {
  DRAFT: { label: 'Draft', variant: 'info' },
  ACTIVE: { label: 'Active', variant: 'success' },
  EXPIRED: { label: 'Expired', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
};

const categoryLabels: Record<FundingCategory, string> = {
  CORE: 'Core',
  CAPACITY_BUILDING: 'Capacity building',
  CAPITAL: 'Capital',
};

function money(val: string | number) {
  return `$${Number(val).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(delivered: string | number, allocated: string | number) {
  const a = Number(allocated);
  if (a === 0) return '0%';
  return `${Math.round((Number(delivered) / a) * 100)}%`;
}

export default function ServiceAgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: agreement, isLoading, error } = useServiceAgreement(id);
  const activate = useActivateAgreement();
  const cancel = useCancelAgreement();
  const removeLine = useRemoveLineItem();

  const handleActivate = async () => {
    if (!window.confirm('Activate this agreement? It will be marked as signed.')) return;
    try { await activate.mutateAsync(id); } catch { /* toast */ }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this agreement?')) return;
    try { await cancel.mutateAsync(id); } catch { /* toast */ }
  };

  const handleRemoveLine = async (itemId: string) => {
    if (!window.confirm('Remove this line item?')) return;
    try { await removeLine.mutateAsync({ agreementId: id, itemId }); } catch { /* toast */ }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="p-6">
        <p className="text-sm text-rose-600">Failed to load agreement.</p>
      </div>
    );
  }

  const status = agreement.status as AgreementStatus;
  const totalBudget = agreement.lineItems.reduce((s, li) => s + Number(li.allocatedBudget), 0);
  const totalDelivered = agreement.lineItems.reduce((s, li) => s + Number(li.deliveredBudget), 0);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push('/service-agreements')}
          className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-700 mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to agreements
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-ink-900">
              {agreement.participant.firstName} {agreement.participant.lastName}
            </h1>
            <Badge variant={statusConfig[status]?.variant || 'default'}>
              {statusConfig[status]?.label || status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {status === 'DRAFT' && (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleActivate} loading={activate.isPending}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Activate
                </Button>
              </>
            )}
            {status === 'ACTIVE' && (
              <Button variant="ghost" size="sm" onClick={handleCancel} loading={cancel.isPending}>
                <Ban className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <Card className="p-5">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InfoField label="Participant">
            {agreement.participant.firstName} {agreement.participant.lastName}
          </InfoField>
          <InfoField label="NDIS number">{agreement.participant.ndisNumber}</InfoField>
          <InfoField label="Period">
            {format(new Date(agreement.startDate), 'd MMM yyyy')} –{' '}
            {format(new Date(agreement.endDate), 'd MMM yyyy')}
          </InfoField>
          <InfoField label="Status">{statusConfig[status]?.label || status}</InfoField>
          {agreement.signedAt && (
            <InfoField label="Signed">
              {format(new Date(agreement.signedAt), 'd MMM yyyy, h:mm a')}
            </InfoField>
          )}
        </div>
      </Card>

      {/* Budget summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-ink-100 rounded-md p-4">
          <div className="text-xl font-semibold text-ink-900">{money(totalBudget)}</div>
          <div className="text-xs text-ink-500 mt-0.5">Total budget</div>
        </div>
        <div className="bg-white border border-ink-100 rounded-md p-4">
          <div className="text-xl font-semibold text-ink-900">{money(totalDelivered)}</div>
          <div className="text-xs text-ink-500 mt-0.5">Delivered</div>
        </div>
        <div className="bg-white border border-ink-100 rounded-md p-4">
          <div className="text-xl font-semibold text-ink-900">{money(totalBudget - totalDelivered)}</div>
          <div className="text-xs text-ink-500 mt-0.5">Remaining</div>
        </div>
      </div>

      {/* Line items */}
      <Card>
        <div className="px-5 py-3 border-b border-ink-100">
          <h2 className="text-sm font-medium text-ink-900">
            Support items ({agreement.lineItems.length})
          </h2>
        </div>

        {agreement.lineItems.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-500">
            No support items yet. Add items to this agreement.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left">
                  <th className="px-4 py-2.5 font-medium text-ink-600 text-xs">Item #</th>
                  <th className="px-4 py-2.5 font-medium text-ink-600 text-xs">Name</th>
                  <th className="px-4 py-2.5 font-medium text-ink-600 text-xs">Category</th>
                  <th className="px-4 py-2.5 font-medium text-ink-600 text-xs text-right">Rate</th>
                  <th className="px-4 py-2.5 font-medium text-ink-600 text-xs text-right">Qty</th>
                  <th className="px-4 py-2.5 font-medium text-ink-600 text-xs text-right">Budget</th>
                  <th className="px-4 py-2.5 font-medium text-ink-600 text-xs text-right">Used</th>
                  <th className="px-4 py-2.5 font-medium text-ink-600 text-xs text-right">%</th>
                  {status === 'DRAFT' && <th className="px-4 py-2.5 w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {agreement.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink-700">
                      {item.supportItemNumber}
                    </td>
                    <td className="px-4 py-2.5 text-ink-900">{item.supportItemName}</td>
                    <td className="px-4 py-2.5 text-ink-600 text-xs">
                      {categoryLabels[item.category] || item.category}
                    </td>
                    <td className="px-4 py-2.5 text-ink-700 text-right">{money(item.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-ink-700 text-right">
                      {Number(item.allocatedQty).toFixed(1)}
                    </td>
                    <td className="px-4 py-2.5 text-ink-900 text-right font-medium">
                      {money(item.allocatedBudget)}
                    </td>
                    <td className="px-4 py-2.5 text-ink-700 text-right">
                      {money(item.deliveredBudget)}
                    </td>
                    <td className="px-4 py-2.5 text-ink-600 text-right text-xs">
                      {pct(item.deliveredBudget, item.allocatedBudget)}
                    </td>
                    {status === 'DRAFT' && (
                      <td className="px-4 py-2.5">
                        {Number(item.deliveredQty) === 0 && (
                          <button
                            onClick={() => handleRemoveLine(item.id)}
                            className="text-ink-300 hover:text-rose-500 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-ink-100 px-5 py-3">
          <div className="flex justify-end gap-8 text-sm">
            <span className="text-ink-600">Total budget</span>
            <span className="font-semibold text-ink-900 min-w-[100px] text-right">
              {money(totalBudget)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm text-ink-900">{children}</p>
    </div>
  );
}
