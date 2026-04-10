'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const PRESET_REASONS = [
  'Participant requested cancellation',
  'Worker unavailable',
  'Scheduling error',
  'Service no longer required',
] as const;

interface CancelShiftModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export function CancelShiftModal({ open, onClose, onConfirm, loading }: CancelShiftModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleClose = () => {
    setSelected(null);
    setCustomReason('');
    setShowCustom(false);
    onClose();
  };

  const handleConfirm = () => {
    const reason = showCustom ? customReason.trim() : selected;
    if (!reason) return;
    onConfirm(reason);
  };

  const isValid = showCustom ? customReason.trim().length > 0 : selected !== null;

  return (
    <Sheet open={open} onClose={handleClose} side="center" ariaLabel="Cancel shift">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">Cancel shift</h2>
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
          Select a reason for cancelling this shift. This will be recorded for compliance.
        </p>

        <div className="space-y-2">
          {PRESET_REASONS.map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                !showCustom && selected === reason
                  ? 'border-accent-500 bg-accent-50 text-accent-900'
                  : 'border-ink-200 text-ink-700 hover:border-ink-300'
              }`}
            >
              <input
                type="radio"
                name="cancel-reason"
                checked={!showCustom && selected === reason}
                onChange={() => {
                  setSelected(reason);
                  setShowCustom(false);
                }}
                className="accent-accent-600"
              />
              {reason}
            </label>
          ))}

          <label
            className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
              showCustom
                ? 'border-accent-500 bg-accent-50 text-accent-900'
                : 'border-ink-200 text-ink-700 hover:border-ink-300'
            }`}
          >
            <input
              type="radio"
              name="cancel-reason"
              checked={showCustom}
              onChange={() => setShowCustom(true)}
              className="accent-accent-600"
            />
            Other
          </label>

          {showCustom && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter reason..."
              rows={2}
              maxLength={500}
              autoFocus
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={handleClose}>
          Back
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleConfirm}
          disabled={!isValid}
          loading={loading}
        >
          Cancel shift
        </Button>
      </div>
    </Sheet>
  );
}
