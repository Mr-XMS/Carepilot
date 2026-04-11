'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useResolveIncident } from '@/hooks/use-incidents';

interface ResolveIncidentModalProps {
  open: boolean;
  onClose: () => void;
  incidentId: string;
}

export function ResolveIncidentModal({ open, onClose, incidentId }: ResolveIncidentModalProps) {
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const resolve = useResolveIncident();

  const handleClose = () => {
    setOutcomeNotes('');
    onClose();
  };

  const handleSubmit = async () => {
    try {
      await resolve.mutateAsync({ id: incidentId, outcomeNotes });
      handleClose();
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Sheet open={open} onClose={handleClose} side="center" ariaLabel="Resolve incident">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">Resolve incident</h2>
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
          Provide outcome notes describing how this incident was resolved.
        </p>

        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">
            Outcome notes <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={outcomeNotes}
            onChange={(e) => setOutcomeNotes(e.target.value)}
            placeholder="Describe the investigation findings and resolution (min 20 characters)..."
            rows={5}
            maxLength={5000}
            autoFocus
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          <p className="text-xs text-ink-400 mt-1">{outcomeNotes.length}/5000</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          loading={resolve.isPending}
          disabled={outcomeNotes.length < 20}
        >
          Mark resolved
        </Button>
      </div>
    </Sheet>
  );
}
