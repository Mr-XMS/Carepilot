'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { X, User, Users, FileText, Calendar, Clock, AlertTriangle, Ban, XCircle } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CancelShiftModal } from './cancel-shift-modal';
import { useShiftDetails, useCancelShift, useMarkNoShow } from '@/hooks/use-shifts';
import type { ShiftStatus } from '@/types/shift';

interface ShiftDrawerProps {
  shiftId: string | null;
  onClose: () => void;
}

const statusLabels: Record<ShiftStatus, { label: string; className: string }> = {
  SCHEDULED: { label: 'Scheduled', className: 'bg-accent-50 text-accent-700 border-accent-200' },
  IN_PROGRESS: { label: 'In progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  COMPLETED: { label: 'Completed', className: 'bg-ink-50 text-ink-700 border-ink-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  NO_SHOW: { label: 'No-show', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function ShiftDrawer({ shiftId, onClose }: ShiftDrawerProps) {
  const open = !!shiftId;
  const { data: shift, isLoading, error } = useShiftDetails(shiftId);
  const cancelShift = useCancelShift();
  const markNoShow = useMarkNoShow();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const handleCancelConfirm = async (reason: string) => {
    if (!shift) return;
    try {
      await cancelShift.mutateAsync({ id: shift.id, reason });
      setCancelModalOpen(false);
      onClose();
    } catch {
      /* toast handled in hook */
    }
  };

  const handleNoShow = async () => {
    if (!shift) return;
    if (!window.confirm('Mark this shift as no-show?')) return;
    try {
      await markNoShow.mutateAsync(shift.id);
      onClose();
    } catch {
      /* toast handled in hook */
    }
  };

  return (
    <>
      <Sheet open={open} onClose={onClose} side="right" ariaLabel="Shift details">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-base font-semibold text-ink-900">Shift details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <p className="py-8 text-center text-sm text-rose-600">
              Failed to load shift details.
            </p>
          )}

          {shift && (
            <div className="space-y-5">
              {/* Status badge */}
              <div>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    statusLabels[shift.status as ShiftStatus]?.className || ''
                  }`}
                >
                  {statusLabels[shift.status as ShiftStatus]?.label || shift.status}
                </span>
              </div>

              {/* Date + time */}
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date">
                {format(new Date(shift.scheduledStart), 'EEEE, d MMMM yyyy')}
              </DetailRow>
              <DetailRow icon={<Clock className="h-4 w-4" />} label="Time">
                {format(new Date(shift.scheduledStart), 'h:mm a')} –{' '}
                {format(new Date(shift.scheduledEnd), 'h:mm a')}
                {shift.breakMinutes > 0 && (
                  <span className="ml-1 text-ink-500">({shift.breakMinutes} min break)</span>
                )}
              </DetailRow>

              {/* Worker */}
              <DetailRow icon={<User className="h-4 w-4" />} label="Support worker">
                {shift.user.firstName} {shift.user.lastName}
              </DetailRow>

              {/* Participant */}
              <DetailRow icon={<Users className="h-4 w-4" />} label="Participant">
                {shift.participant.firstName} {shift.participant.lastName}
              </DetailRow>

              {/* Service agreement item */}
              <DetailRow icon={<FileText className="h-4 w-4" />} label="Service item">
                {shift.serviceAgreementItem.supportItemName}
              </DetailRow>

              {/* Shift type */}
              {shift.shiftType !== 'STANDARD' && (
                <DetailRow icon={<AlertTriangle className="h-4 w-4" />} label="Shift type">
                  {shift.shiftType.replace('_', ' ').toLowerCase()}
                </DetailRow>
              )}

              {/* Notes */}
              {shift.notes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-900">{shift.notes}</p>
                </div>
              )}

              {/* Cancellation details */}
              {shift.status === 'CANCELLED' && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-rose-800">
                    <Ban className="h-4 w-4" />
                    Cancelled
                  </div>
                  {shift.cancellationReason && (
                    <p className="text-sm text-rose-700">
                      <span className="font-medium">Reason:</span> {shift.cancellationReason}
                    </p>
                  )}
                  {shift.cancelledByUser && (
                    <p className="text-xs text-rose-600">
                      By {shift.cancelledByUser.firstName} {shift.cancelledByUser.lastName}
                      {shift.cancelledAt && (
                        <> on {format(new Date(shift.cancelledAt), 'd MMM yyyy, h:mm a')}</>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* No-show details */}
              {shift.status === 'NO_SHOW' && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-rose-800">
                    <XCircle className="h-4 w-4" />
                    No-show
                  </div>
                  {shift.noShowMarkedByUser && (
                    <p className="text-xs text-rose-600">
                      Marked by {shift.noShowMarkedByUser.firstName} {shift.noShowMarkedByUser.lastName}
                      {shift.noShowMarkedAt && (
                        <> on {format(new Date(shift.noShowMarkedAt), 'd MMM yyyy, h:mm a')}</>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {shift && shift.status === 'SCHEDULED' && (
          <div className="flex items-center justify-between gap-2 border-t border-ink-100 px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNoShow}
              loading={markNoShow.isPending}
            >
              Mark no-show
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
            >
              Cancel shift
            </Button>
          </div>
        )}
      </Sheet>

      <CancelShiftModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        loading={cancelShift.isPending}
      />
    </>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-ink-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
        <p className="mt-0.5 text-sm text-ink-900">{children}</p>
      </div>
    </div>
  );
}
