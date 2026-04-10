'use client';

import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Ban, XCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useExceptions } from '@/hooks/use-shifts';
import { useSupportWorkers } from '@/hooks/use-users';
import { useParticipants } from '@/hooks/use-participants';
import { ShiftDrawer } from '@/components/roster/shift-drawer';
import type { ExceptionShift, ShiftStatus } from '@/types/shift';

function toDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export default function ExceptionsPage() {
  const [startDate, setStartDate] = useState(() => toDateStr(subDays(new Date(), 30)));
  const [endDate, setEndDate] = useState(() => toDateStr(new Date()));
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CANCELLED' | 'NO_SHOW'>('ALL');
  const [workerFilter, setWorkerFilter] = useState<string>('ALL');
  const [participantFilter, setParticipantFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const { data: workers } = useSupportWorkers();
  const { data: participantsData } = useParticipants({ limit: 200, status: 'ACTIVE' });
  const participants = participantsData?.data;

  const queryParams = {
    startDate,
    endDate,
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(workerFilter !== 'ALL' && { userId: workerFilter }),
    ...(participantFilter !== 'ALL' && { participantId: participantFilter }),
    page,
  };

  const { data, isLoading, error } = useExceptions(queryParams);
  const shifts = data?.data ?? [];
  const meta = data?.meta;

  const handleResetFilters = () => {
    setStartDate(toDateStr(subDays(new Date(), 30)));
    setEndDate(toDateStr(new Date()));
    setStatusFilter('ALL');
    setWorkerFilter('ALL');
    setParticipantFilter('ALL');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-900">Exceptions</h1>
        <p className="text-sm text-ink-500">Cancelled and no-show shifts</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="ALL">All exceptions</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No-show</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Worker</label>
            <select
              value={workerFilter}
              onChange={(e) => { setWorkerFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="ALL">All workers</option>
              {workers?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.firstName} {w.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Participant</label>
            <select
              value={participantFilter}
              onChange={(e) => { setParticipantFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="ALL">All participants</option>
              {participants?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            Reset
          </Button>
        </div>
      </Card>

      {/* Results */}
      <Card>
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <p className="py-8 text-center text-sm text-rose-600">
            Failed to load exceptions.
          </p>
        )}

        {!isLoading && !error && shifts.length === 0 && (
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5" />}
            title="No exceptions found"
            description="No cancelled or no-show shifts match your filters."
          />
        )}

        {!isLoading && shifts.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left">
                    <th className="px-4 py-3 font-medium text-ink-600">Status</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Date</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Time</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Worker</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Participant</th>
                    <th className="px-4 py-3 font-medium text-ink-600">Reason / Actioned by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {shifts.map((shift) => (
                    <ExceptionRow
                      key={shift.id}
                      shift={shift}
                      onClick={() => setSelectedShiftId(shift.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
                <p className="text-xs text-ink-500">
                  Page {meta.page} of {meta.totalPages} ({meta.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <ShiftDrawer shiftId={selectedShiftId} onClose={() => setSelectedShiftId(null)} />
    </div>
  );
}

function ExceptionRow({
  shift,
  onClick,
}: {
  shift: ExceptionShift;
  onClick: () => void;
}) {
  const isCancelled = shift.status === 'CANCELLED';

  const actionedBy = isCancelled
    ? shift.cancelledByUser
    : shift.noShowMarkedByUser;

  const actionedAt = isCancelled
    ? shift.cancelledAt
    : shift.noShowMarkedAt;

  return (
    <tr
      className="cursor-pointer hover:bg-ink-50 transition-colors"
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <Badge variant="danger">
          {isCancelled ? (
            <>
              <Ban className="h-3 w-3" />
              Cancelled
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              No-show
            </>
          )}
        </Badge>
      </td>
      <td className="px-4 py-3 text-ink-900">
        {format(new Date(shift.scheduledStart), 'EEE, d MMM yyyy')}
      </td>
      <td className="px-4 py-3 text-ink-700">
        {format(new Date(shift.scheduledStart), 'h:mm a')} –{' '}
        {format(new Date(shift.scheduledEnd), 'h:mm a')}
      </td>
      <td className="px-4 py-3 text-ink-900">
        {shift.user.firstName} {shift.user.lastName}
      </td>
      <td className="px-4 py-3 text-ink-900">
        {shift.participant.firstName} {shift.participant.lastName}
      </td>
      <td className="px-4 py-3">
        {isCancelled && shift.cancellationReason && (
          <p className="text-ink-700 truncate max-w-[200px]" title={shift.cancellationReason}>
            {shift.cancellationReason}
          </p>
        )}
        {actionedBy && (
          <p className="text-xs text-ink-500">
            {actionedBy.firstName} {actionedBy.lastName}
            {actionedAt && <>, {format(new Date(actionedAt), 'd MMM h:mm a')}</>}
          </p>
        )}
      </td>
    </tr>
  );
}
