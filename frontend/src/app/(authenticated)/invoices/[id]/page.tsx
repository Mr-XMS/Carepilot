'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Send, Ban, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { RecordPaymentModal } from '@/components/invoices/record-payment-modal';
import { useInvoice, useSendInvoice, useVoidInvoice } from '@/hooks/use-invoices';
import { invoicesApi } from '@/lib/api/invoices';
import { toast } from 'sonner';
import type { InvoiceStatus, BillingTarget } from '@/types/invoice';

const statusBadge: Record<InvoiceStatus, { label: string; variant: 'muted' | 'info' | 'success' | 'warning' | 'danger' | 'default' }> = {
  DRAFT: { label: 'Draft', variant: 'muted' },
  SENT: { label: 'Sent', variant: 'info' },
  PAID: { label: 'Paid', variant: 'success' },
  PARTIALLY_PAID: { label: 'Partially paid', variant: 'warning' },
  OVERDUE: { label: 'Overdue', variant: 'danger' },
  VOID: { label: 'Void', variant: 'default' },
};

const billingLabels: Record<BillingTarget, string> = {
  NDIA: 'NDIA managed',
  PLAN_MANAGER: 'Plan managed',
  SELF_MANAGED: 'Self-managed',
};

function money(val: string | number) {
  return `$${Number(val).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: invoice, isLoading, error } = useInvoice(id);
  const sendInvoice = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const handleSend = async () => {
    if (!window.confirm('Mark this invoice as sent?')) return;
    try {
      await sendInvoice.mutateAsync(id);
    } catch { /* toast in hook */ }
  };

  const handleVoid = async () => {
    if (!window.confirm('Void this invoice? This cannot be undone.')) return;
    try {
      await voidInvoice.mutateAsync(id);
    } catch { /* toast in hook */ }
  };

  const handleExportProda = async () => {
    try {
      const result = await invoicesApi.exportProdaCsv([id]);
      const blob = new Blob([result.content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`PRODA CSV exported (${result.lineCount} lines)`);
    } catch {
      toast.error('Failed to export PRODA CSV');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <p className="text-sm text-rose-600">Failed to load invoice.</p>
      </div>
    );
  }

  const outstanding = Number(invoice.total) - Number(invoice.paidAmount);
  const status = invoice.status as InvoiceStatus;
  const billing = invoice.billingTarget as BillingTarget;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push('/invoices')}
          className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-700 mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to invoices
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-ink-900 font-mono">
              {invoice.invoiceNumber}
            </h1>
            <Badge variant={statusBadge[status]?.variant || 'default'}>
              {statusBadge[status]?.label || status}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {status === 'DRAFT' && (
              <>
                <Button variant="ghost" size="sm" onClick={handleVoid}>
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Void
                </Button>
                <Button size="sm" onClick={handleSend} loading={sendInvoice.isPending}>
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Send
                </Button>
              </>
            )}
            {(status === 'SENT' || status === 'PARTIALLY_PAID') && (
              <>
                {status === 'SENT' && (
                  <Button variant="ghost" size="sm" onClick={handleVoid} loading={voidInvoice.isPending}>
                    <Ban className="h-3.5 w-3.5 mr-1" />
                    Void
                  </Button>
                )}
                {status === 'SENT' && billing === 'NDIA' && (
                  <Button variant="secondary" size="sm" onClick={handleExportProda}>
                    <Download className="h-3.5 w-3.5 mr-1" />
                    PRODA CSV
                  </Button>
                )}
                <Button size="sm" onClick={() => setPaymentOpen(true)}>
                  Record payment
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Invoice info */}
      <Card className="p-5">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InfoField label="Participant">
            {invoice.participant.firstName} {invoice.participant.lastName}
          </InfoField>
          <InfoField label="NDIS number">{invoice.participant.ndisNumber}</InfoField>
          <InfoField label="Invoice date">
            {format(new Date(invoice.invoiceDate), 'd MMMM yyyy')}
          </InfoField>
          <InfoField label="Due date">
            {format(new Date(invoice.dueDate), 'd MMMM yyyy')}
          </InfoField>
          <InfoField label="Billing target">{billingLabels[billing] || billing}</InfoField>
          <InfoField label="Billing email">
            {invoice.billingEmail || <span className="text-ink-400">Not set</span>}
          </InfoField>
          {invoice.sentAt && (
            <InfoField label="Sent">
              {format(new Date(invoice.sentAt), 'd MMM yyyy, h:mm a')}
            </InfoField>
          )}
          {invoice.paidAt && (
            <InfoField label="Paid">
              {format(new Date(invoice.paidAt), 'd MMM yyyy, h:mm a')}
            </InfoField>
          )}
        </div>
      </Card>

      {/* Line items */}
      <Card>
        <div className="px-5 py-3 border-b border-ink-100">
          <h2 className="text-sm font-medium text-ink-900">
            Line items ({invoice.lineItems?.length ?? 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left">
                <th className="px-4 py-2.5 font-medium text-ink-600 text-xs">Support item</th>
                <th className="px-4 py-2.5 font-medium text-ink-600 text-xs">Description</th>
                <th className="px-4 py-2.5 font-medium text-ink-600 text-xs">Date</th>
                <th className="px-4 py-2.5 font-medium text-ink-600 text-xs text-right">Qty</th>
                <th className="px-4 py-2.5 font-medium text-ink-600 text-xs text-right">Unit price</th>
                <th className="px-4 py-2.5 font-medium text-ink-600 text-xs text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {invoice.lineItems?.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-700">
                    {item.supportItemNumber}
                  </td>
                  <td className="px-4 py-2.5 text-ink-900">{item.description}</td>
                  <td className="px-4 py-2.5 text-ink-700">
                    {format(new Date(item.serviceDate), 'd MMM yyyy')}
                  </td>
                  <td className="px-4 py-2.5 text-ink-900 text-right">
                    {Number(item.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-ink-700 text-right">
                    {money(item.unitPrice)}
                  </td>
                  <td className="px-4 py-2.5 text-ink-900 text-right font-medium">
                    {money(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-ink-100 px-5 py-4">
          <div className="flex flex-col items-end gap-1.5">
            <TotalRow label="Subtotal" value={money(invoice.subtotal)} />
            <TotalRow label="GST" value={money(invoice.gst)} />
            <TotalRow label="Total" value={money(invoice.total)} bold />
            <TotalRow label="Paid" value={money(invoice.paidAmount)} />
            <TotalRow
              label="Outstanding"
              value={money(outstanding)}
              bold
              danger={outstanding > 0}
            />
          </div>
        </div>
      </Card>

      {paymentOpen && (
        <RecordPaymentModal
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          invoiceId={id}
          invoiceNumber={invoice.invoiceNumber}
          outstandingAmount={outstanding}
        />
      )}
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

function TotalRow({
  label,
  value,
  bold,
  danger,
}: {
  label: string;
  value: string;
  bold?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-8">
      <span className={`text-sm ${bold ? 'font-medium text-ink-900' : 'text-ink-600'}`}>
        {label}
      </span>
      <span
        className={`text-sm text-right min-w-[100px] ${
          bold ? 'font-semibold' : ''
        } ${danger ? 'text-rose-600' : 'text-ink-900'}`}
      >
        {value}
      </span>
    </div>
  );
}
