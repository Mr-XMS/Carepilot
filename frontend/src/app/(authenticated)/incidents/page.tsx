'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AlertTriangle, Plus, ShieldAlert, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ReportIncidentModal } from '@/components/incidents/report-incident-modal';
import { useIncidents, useRegisterReport } from '@/hooks/use-incidents';
import type { IncidentStatus, IncidentCategory, IncidentSeverity } from '@/types/incident';

const PAGE_SIZE = 25;

const statusBadge: Record<IncidentStatus, { label: string; variant: 'danger' | 'warning' | 'success' | 'default' }> = {
  OPEN: { label: 'Open', variant: 'danger' },
  INVESTIGATING: { label: 'Investigating', variant: 'warning' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'default' },
};

const severityBadge: Record<IncidentSeverity, { label: string; variant: 'default' | 'warning' | 'danger' }> = {
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
  MEDICATION: 'Medication',
  OTHER: 'Other',
};

export default function IncidentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [reportOpen, setReportOpen] = useState(false);

  const params = {
    ...(statusFilter && { status: statusFilter as IncidentStatus }),
    ...(categoryFilter && { category: categoryFilter as IncidentCategory }),
    ...(severityFilter && { severity: severityFilter as IncidentSeverity }),
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, error } = useIncidents(params);
  const { data: report } = useRegisterReport();
  const incidents = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-900">Incident register</h1>
          <p className="text-sm text-ink-500">Report and track incidents for NDIS compliance</p>
        </div>
        <Button size="sm" onClick={() => setReportOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Report incident
        </Button>
      </div>

      {/* Summary cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <SummaryCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Total incidents"
            value={String(report.total)}
          />
          <SummaryCard
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Open"
            value={String(report.byStatus.OPEN || 0)}
            danger={(report.byStatus.OPEN || 0) > 0}
          />
          <SummaryCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Reportable"
            value={String(report.reportableCount)}
            danger={report.reportableCount > 0}
          />
          <SummaryCard
            icon={<Clock className="h-4 w-4" />}
            label="Overdue"
            value={String(report.overdueCount)}
            danger={report.overdueCount > 0}
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
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="">All categories</option>
              {Object.entries(categoryLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="">All severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          {(statusFilter || categoryFilter || severityFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStatusFilter(''); setCategoryFilter(''); setSeverityFilter(''); setPage(1); }}
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
          <p className="py-8 text-center text-sm text-rose-600">Failed to load incidents.</p>
        )}

        {!isLoading && !error && incidents.length === 0 && (
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5" />}
            title="No incidents"
            description="No incidents match your filters."
          />
        )}

        {!isLoading && incidents.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left">
                    <th className="px-4 py-3 font-medium text-ink-600">Date</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Category</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Severity</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Participant</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Reported by</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Status</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Reportable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {incidents.map((inc) => (
                    <tr
                      key={inc.id}
                      className="cursor-pointer hover:bg-ink-50 transition-colors"
                      onClick={() => router.push(`/incidents/${inc.id}`)}
                    >
                      <td className="px-4 py-3 text-ink-900">
                        {format(new Date(inc.incidentDate), 'd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {categoryLabels[inc.category] || inc.category}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={severityBadge[inc.severity]?.variant || 'default'}>
                          {severityBadge[inc.severity]?.label || inc.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-900">
                        {inc.participant
                          ? `${inc.participant.firstName} ${inc.participant.lastName}`
                          : <span className="text-ink-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {inc.reportedBy.firstName} {inc.reportedBy.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadge[inc.status]?.variant || 'default'}>
                          {statusBadge[inc.status]?.label || inc.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {inc.isReportable && (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-medium">
                            <ShieldAlert className="h-3 w-3" />
                            Yes
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
                <p className="text-xs text-ink-500">
                  Page {meta.page} of {meta.totalPages} ({meta.total} incidents)
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <ReportIncidentModal open={reportOpen} onClose={() => setReportOpen(false)} />
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
