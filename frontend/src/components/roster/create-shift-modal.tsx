'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addHours, parse } from 'date-fns';
import { X } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useParticipants } from '@/hooks/use-participants';
import { useSupportWorkers } from '@/hooks/use-users';
import { useParticipantAgreements } from '@/hooks/use-service-agreements';
import { useCreateShift } from '@/hooks/use-shifts';
import type { ShiftType } from '@/types/shift';

const schema = z
  .object({
    participantId: z.string().uuid({ message: 'Select a participant' }),
    userId: z.string().uuid({ message: 'Select a support worker' }),
    serviceAgreementItemId: z.string().uuid({ message: 'Select an agreement item' }),
    date: z.string().min(1, 'Date is required'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    shiftType: z.enum(['STANDARD', 'SLEEPOVER', 'ACTIVE_NIGHT']),
    breakMinutes: z.coerce.number().int().min(0).max(480),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (v) => {
      const [sh, sm] = v.startTime.split(':').map(Number);
      const [eh, em] = v.endTime.split(':').map(Number);
      return eh * 60 + em > sh * 60 + sm;
    },
    { message: 'End time must be after start time', path: ['endTime'] },
  );

type FormValues = z.infer<typeof schema>;

interface CreateShiftModalProps {
  open: boolean;
  initialDate: Date | null;
  initialHour: number | null;
  onClose: () => void;
}

export function CreateShiftModal({
  open,
  initialDate,
  initialHour,
  onClose,
}: CreateShiftModalProps) {
  const participants = useParticipants({ limit: 200, status: 'ACTIVE' });
  const workers = useSupportWorkers();
  const createShift = useCreateShift();

  const defaultDate = initialDate ? format(initialDate, 'yyyy-MM-dd') : '';
  const defaultStart = initialHour != null ? `${String(initialHour).padStart(2, '0')}:00` : '09:00';
  const defaultEnd =
    initialHour != null ? `${String(Math.min(initialHour + 1, 23)).padStart(2, '0')}:00` : '10:00';

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      participantId: '',
      userId: '',
      serviceAgreementItemId: '',
      date: defaultDate,
      startTime: defaultStart,
      endTime: defaultEnd,
      shiftType: 'STANDARD',
      breakMinutes: 0,
      notes: '',
    },
  });

  // Reset the form whenever the modal opens with new initial values
  useEffect(() => {
    if (open) {
      reset({
        participantId: '',
        userId: '',
        serviceAgreementItemId: '',
        date: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
        startTime:
          initialHour != null ? `${String(initialHour).padStart(2, '0')}:00` : '09:00',
        endTime:
          initialHour != null
            ? `${String(Math.min(initialHour + 1, 23)).padStart(2, '0')}:00`
            : '10:00',
        shiftType: 'STANDARD',
        breakMinutes: 0,
        notes: '',
      });
    }
  }, [open, initialDate, initialHour, reset]);

  const selectedParticipantId = watch('participantId');
  const agreements = useParticipantAgreements(selectedParticipantId || undefined);

  // When the participant changes, clear the previously-selected agreement item
  useEffect(() => {
    setValue('serviceAgreementItemId', '');
  }, [selectedParticipantId, setValue]);

  // Flatten line items across all active agreements for this participant
  const agreementItems = useMemo(() => {
    if (!agreements.data) return [];
    return agreements.data.flatMap((a) =>
      a.lineItems.map((li) => ({
        id: li.id,
        label: `${li.supportItemName} ($${Number(li.unitPrice).toFixed(2)}/hr)`,
      })),
    );
  }, [agreements.data]);

  const onSubmit = async (values: FormValues) => {
    // Combine date + time into ISO strings (browser local time)
    const start = parse(`${values.date} ${values.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const end = parse(`${values.date} ${values.endTime}`, 'yyyy-MM-dd HH:mm', new Date());

    try {
      await createShift.mutateAsync({
        participantId: values.participantId,
        userId: values.userId,
        serviceAgreementItemId: values.serviceAgreementItemId,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        shiftType: values.shiftType as ShiftType,
        breakMinutes: values.breakMinutes,
        notes: values.notes || undefined,
      });
      onClose();
    } catch {
      // Toast handled inside the hook; modal stays open so user can adjust
    }
  };

  return (
    <Sheet open={open} onClose={onClose} side="center" ariaLabel="Create shift">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">New shift</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-4">
          {/* Participant */}
          <div>
            <Label htmlFor="participantId">Participant</Label>
            <select
              id="participantId"
              {...register('participantId')}
              className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="">Select a participant…</option>
              {participants.data?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.ndisNumber})
                </option>
              ))}
            </select>
            {errors.participantId && (
              <p className="mt-1 text-xs text-rose-600">{errors.participantId.message}</p>
            )}
          </div>

          {/* Support Worker */}
          <div>
            <Label htmlFor="userId">Support worker</Label>
            <select
              id="userId"
              {...register('userId')}
              className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="">Select a worker…</option>
              {workers.data?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.firstName} {w.lastName}
                </option>
              ))}
            </select>
            {errors.userId && (
              <p className="mt-1 text-xs text-rose-600">{errors.userId.message}</p>
            )}
          </div>

          {/* Service Agreement Item */}
          <div>
            <Label htmlFor="serviceAgreementItemId">Service agreement item</Label>
            <select
              id="serviceAgreementItemId"
              disabled={!selectedParticipantId || agreements.isLoading}
              {...register('serviceAgreementItemId')}
              className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:bg-ink-50 disabled:text-ink-400"
            >
              <option value="">
                {!selectedParticipantId
                  ? 'Choose a participant first'
                  : agreements.isLoading
                  ? 'Loading agreements…'
                  : agreementItems.length === 0
                  ? 'No active agreement items for this participant'
                  : 'Select an item…'}
              </option>
              {agreementItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            {errors.serviceAgreementItemId && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.serviceAgreementItemId.message}
              </p>
            )}
          </div>

          {/* Date + Times */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register('date')} className="mt-1" />
              {errors.date && (
                <p className="mt-1 text-xs text-rose-600">{errors.date.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="startTime">Start</Label>
              <Input id="startTime" type="time" {...register('startTime')} className="mt-1" />
              {errors.startTime && (
                <p className="mt-1 text-xs text-rose-600">{errors.startTime.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endTime">End</Label>
              <Input id="endTime" type="time" {...register('endTime')} className="mt-1" />
              {errors.endTime && (
                <p className="mt-1 text-xs text-rose-600">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Shift type + break */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="shiftType">Shift type</Label>
              <select
                id="shiftType"
                {...register('shiftType')}
                className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                <option value="STANDARD">Standard</option>
                <option value="SLEEPOVER">Sleepover</option>
                <option value="ACTIVE_NIGHT">Active night</option>
              </select>
            </div>
            <div>
              <Label htmlFor="breakMinutes">Unpaid break (mins)</Label>
              <Input
                id="breakMinutes"
                type="number"
                min={0}
                max={480}
                step={5}
                {...register('breakMinutes')}
                className="mt-1"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              placeholder="Optional notes for this shift…"
              className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
        </div>
      </form>

      <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting || createShift.isPending}>
          Create shift
        </Button>
      </div>
    </Sheet>
  );
}
