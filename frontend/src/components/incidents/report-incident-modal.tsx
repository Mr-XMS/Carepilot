'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCreateIncident } from '@/hooks/use-incidents';
import { useParticipants } from '@/hooks/use-participants';
import type { IncidentCategory, IncidentSeverity } from '@/types/incident';

const CATEGORIES: { value: IncidentCategory; label: string }[] = [
  { value: 'INJURY', label: 'Injury' },
  { value: 'MEDICATION', label: 'Medication error' },
  { value: 'ABUSE', label: 'Abuse' },
  { value: 'NEGLECT', label: 'Neglect' },
  { value: 'DEATH', label: 'Death' },
  { value: 'RESTRICTIVE_PRACTICE', label: 'Restrictive practice' },
  { value: 'OTHER', label: 'Other' },
];

const SEVERITIES: { value: IncidentSeverity; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

interface ReportIncidentModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReportIncidentModal({ open, onClose }: ReportIncidentModalProps) {
  const [participantId, setParticipantId] = useState('');
  const [incidentDate, setIncidentDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState<IncidentCategory>('INJURY');
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [immediateActions, setImmediateActions] = useState('');

  const create = useCreateIncident();
  const { data: participantsData } = useParticipants({ limit: 200, status: 'ACTIVE' });
  const participants = participantsData?.data;

  const handleClose = () => {
    setParticipantId('');
    setIncidentDate(format(new Date(), 'yyyy-MM-dd'));
    setCategory('INJURY');
    setSeverity('MEDIUM');
    setDescription('');
    setImmediateActions('');
    onClose();
  };

  const handleSubmit = async () => {
    try {
      await create.mutateAsync({
        ...(participantId && { participantId }),
        incidentDate,
        category,
        severity,
        description,
        ...(immediateActions && { immediateActions }),
      });
      handleClose();
    } catch {
      /* toast in hook */
    }
  };

  const isValid = description.length >= 20;

  return (
    <Sheet open={open} onClose={handleClose} side="center" widthClass="w-full max-w-xl" ariaLabel="Report incident">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">Report incident</h2>
        <button
          type="button"
          onClick={handleClose}
          className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 max-h-[70vh]">
        {/* Participant */}
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">
            Participant <span className="text-ink-400">(optional)</span>
          </label>
          <select
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          >
            <option value="">No participant linked</option>
            {participants?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Incident date</label>
          <input
            type="date"
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
            className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              {SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened (min 20 characters)..."
            rows={4}
            maxLength={5000}
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          <p className="text-xs text-ink-400 mt-1">{description.length}/5000</p>
        </div>

        {/* Immediate actions */}
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">
            Immediate actions taken <span className="text-ink-400">(optional)</span>
          </label>
          <textarea
            value={immediateActions}
            onChange={(e) => setImmediateActions(e.target.value)}
            placeholder="What was done immediately after the incident?"
            rows={2}
            maxLength={5000}
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} loading={create.isPending} disabled={!isValid}>
          Report incident
        </Button>
      </div>
    </Sheet>
  );
}
