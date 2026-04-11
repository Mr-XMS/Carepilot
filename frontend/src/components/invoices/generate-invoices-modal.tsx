'use client';

import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { X } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useGenerateInvoices } from '@/hooks/use-invoices';

interface GenerateInvoicesModalProps {
  open: boolean;
  onClose: () => void;
}

export function GenerateInvoicesModal({ open, onClose }: GenerateInvoicesModalProps) {
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 14), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [paymentTerms, setPaymentTerms] = useState(14);

  const generate = useGenerateInvoices();

  const handleClose = () => {
    generate.reset();
    onClose();
  };

  const handleGenerate = async () => {
    await generate.mutateAsync({
      startDate,
      endDate,
      paymentTermsDays: paymentTerms,
    });
  };

  const result = generate.data;

  return (
    <Sheet open={open} onClose={handleClose} side="center" ariaLabel="Generate invoices">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">Generate invoices</h2>
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
        {!result ? (
          <>
            <p className="text-sm text-ink-600">
              Generate invoices from completed shifts in a date range. One invoice per participant.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">
                Payment terms (days)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(Number(e.target.value))}
                className="w-24 rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            {result.invoicesCreated > 0 ? (
              <>
                <div className="text-3xl font-semibold text-ink-900 mb-1">
                  {result.invoicesCreated}
                </div>
                <p className="text-sm text-ink-600">
                  invoice{result.invoicesCreated === 1 ? '' : 's'} generated from{' '}
                  {result.shiftsBilled} shift{result.shiftsBilled === 1 ? '' : 's'}
                </p>
                <p className="text-lg font-medium text-ink-900 mt-2">
                  ${result.totalValue?.toFixed(2)}
                </p>
                <p className="text-xs text-ink-500 mt-1">total value</p>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-600">{result.message}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
        {!result ? (
          <>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleGenerate} loading={generate.isPending}>
              Generate
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={handleClose}>
            Done
          </Button>
        )}
      </div>
    </Sheet>
  );
}
