'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, ShieldAlert, Search, CheckCircle, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ResolveIncidentModal } from '@/components/incidents/resolve-incident-modal';
import {
  useIncident,
  useStartInvestigation,
  useCloseIncident,
} from '@/hooks/use-incidents';
import type { IncidentStatus, IncidentSeverity, IncidentCategory } from '@/types/incident';

const statusConfig: Record<IncidentStatus, { label: string; variant: 'danger' | 'warning' | 'success' | 'default' }> = {
  OPEN: { label: 'Open', variant: 'danger' },
  INVESTIGATING: { label: 'Investigating', variant: 'warning' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'default' },
};

const severityConfig: Record<IncidentSeverity, { label: string; variant: 'default' | 'warning' | 'danger' }> = {
  LOW: { label: 'Low', variant: 'default' },
  MEDIUM: { label: 'Medium', variant: 'default' },
  HIGH: { label: 'High', variant: 'warning' },
  CRITICAL: { label: 'Critical', variant: 'danger' },
};

const categoryLabels: Record<IncidentCategory, string> = {
  ABUSE: 'Abuse',
  NEGLECT: 'Neglect',
  INJURY: 'Injury',
  DEATH: 'Death',
  RESTRICTIVE_PRACTICE: 'Restrictive practice',
  MEDICATION: 'Medication error',
  OTHER: 'Other',
};

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: incident, isLoading, error } = useIncident(id);
  const startInvestigation = useStartInvestigation();
  const closeIncident = useCloseIncident();
  const [resolveOpen, setResolveOpen] = useState(false);

  const handleStartInvestigation = async () => {
    if (!window.confirm('Start investigation on this incident?')) return;
    try {
      await startInvestigation.mutateAsync(id);
    } catch { /* toast in hook */ }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this incident? This is final.')) return;
    try {
      await closeIncident.mutateAsync(id);
    } catch { /* toast in hook */ }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="p-6">
        <p className="text-sm text-rose-600">Failed to load incident.</p>
      </div>
    );
  }

  const status = incident.status as IncidentStatus;
  const severity = incident.severity as IncidentSeverity;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push('/incidents')}
          className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-700 mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to incidents
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-ink-900">Incident details</h1>
            <Badge variant={statusConfig[status]?.variant || 'default'}>
              {statusConfig[status]?.label || status}
            </Badge>
            <Badge variant={severityConfig[severity]?.variant || 'default'}>
              {severityConfig[severity]?.label || severity}
            </Badge>
            {incident.isReportable && (
              <Badge variant="danger">
                <ShieldAlert className="h-3 w-3" />
                Reportable
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {status === 'OPEN' && (
              <Button
                size="sm"
                onClick={handleStartInvestigation}
                loading={startInvestigation.isPending}
              >
                <Search className="h-3.5 w-3.5 mr-1" />
                Start investigation
              </Button>
            )}
            {status === 'INVESTIGATING' && (
              <Button size="sm" onClick={() => setResolveOpen(true)}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Resolve
              </Button>
            )}
            {status === 'RESOLVED' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClose}
                loading={closeIncident.isPending}
              >
                <Lock className="h-3.5 w-3.5 mr-1" />
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <Card className="p-5">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InfoField label="Incident date">
            {format(new Date(incident.incidentDate), 'EEEE, d MMMM yyyy')}
          </InfoField>
          <InfoField label="Category">
            {categoryLabels[incident.category] || incident.category}
          </InfoField>
          <InfoField label="Participant">
            {incident.participant
              ? `${incident.participant.firstName} ${incident.participant.lastName}`
              : 'Not linked'}
          </InfoField>
          <InfoField label="Reported by">
            {incident.reportedBy.firstName} {incident.reportedBy.lastName}
          </InfoField>
          <InfoField label="Reported on">
            {format(new Date(incident.createdAt), 'd MMM yyyy, h:mm a')}
          </InfoField>
          {incident.resolvedAt && (
            <InfoField label="Resolved on">
              {format(new Date(incident.resolvedAt), 'd MMM yyyy, h:mm a')}
            </InfoField>
          )}
        </div>
      </Card>

      {/* Description */}
      <Card className="p-5">
        <h2 className="text-sm font-medium text-ink-900 mb-2">Description</h2>
        <p className="text-sm text-ink-700 whitespace-pre-wrap">{incident.description}</p>
      </Card>

      {/* Immediate actions */}
      {incident.immediateActions && (
        <Card className="p-5">
          <h2 className="text-sm font-medium text-ink-900 mb-2">Immediate actions taken</h2>
          <p className="text-sm text-ink-700 whitespace-pre-wrap">{incident.immediateActions}</p>
        </Card>
      )}

      {/* Outcome notes */}
      {incident.outcomeNotes && (
        <Card className="p-5 border-emerald-200 bg-emerald-50/30">
          <h2 className="text-sm font-medium text-emerald-900 mb-2">Resolution outcome</h2>
          <p className="text-sm text-emerald-800 whitespace-pre-wrap">{incident.outcomeNotes}</p>
        </Card>
      )}

      <ResolveIncidentModal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        incidentId={id}
      />
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
