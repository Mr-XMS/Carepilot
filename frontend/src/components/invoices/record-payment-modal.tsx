'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useRecordPayment } from '@/hooks/use-invoices';

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  outstandingAmount: number;
}

export function RecordPaymentModal({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
  outstandingAmount,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState(() => outstandingAmount);
  const [paymentDate, setPaymentDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [reference, setReference] = useState('');

  const recordPayment = useRecordPayment();

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    try {
      await recordPayment.mutateAsync({
        id: invoiceId,
        amount,
        paymentDate,
        ...(reference && { reference }),
      });
      onClose();
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Sheet open={open} onClose={handleClose} side="center" ariaLabel="Record payment">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">Record payment</h2>
        <button
          type="button"
          onClick={handleClose}
          className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-ink-600">
          Recording payment for <span className="font-medium">{invoiceNumber}</span>.
          Outstanding: <span className="font-medium">${outstandingAmount.toFixed(2)}</span>
        </p>

        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Amount ($)</label>
          <input
            type="number"
            min={0.01}
            max={outstandingAmount}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Payment date</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">
            Reference <span className="text-ink-400">(optional)</span>
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. EFT — Plan Partners Pty Ltd"
            className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          loading={recordPayment.isPending}
          disabled={amount <= 0 || amount > outstandingAmount}
        >
          Record payment
        </Button>
      </div>
    </Sheet>
  );
}
