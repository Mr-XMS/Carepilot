import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shiftsApi } from '@/lib/api/shifts';
import type { CreateShiftInput, CancelShiftInput } from '@/types/shift';

export const shiftKeys = {
  all: ['shifts'] as const,
  calendar: (start: string, end: string, userId?: string) =>
    [...shiftKeys.all, 'calendar', { start, end, userId }] as const,
  detail: (id: string) => [...shiftKeys.all, 'detail', id] as const,
  exceptions: (params: Record<string, unknown>) =>
    [...shiftKeys.all, 'exceptions', params] as const,
};

export function useCalendarShifts(startDate: string, endDate: string, userId?: string) {
  return useQuery({
    queryKey: shiftKeys.calendar(startDate, endDate, userId),
    queryFn: () => shiftsApi.getCalendar({ startDate, endDate, userId }),
    staleTime: 30_000,
  });
}

export function useShiftDetails(id: string | null) {
  return useQuery({
    queryKey: shiftKeys.detail(id ?? ''),
    queryFn: () => shiftsApi.getOne(id!),
    enabled: !!id,
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShiftInput) => shiftsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all });
      toast.success('Shift created');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      if (Array.isArray(msg?.conflicts)) {
        toast.error('Shift conflicts with existing scheduled shifts');
      } else {
        toast.error(typeof msg === 'string' ? msg : 'Failed to create shift');
      }
    },
  });
}

export function useCancelShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      shiftsApi.cancel(id, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all });
      toast.success('Shift cancelled');
    },
    onError: () => toast.error('Failed to cancel shift'),
  });
}

export function useMarkNoShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shiftsApi.markNoShow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all });
      toast.success('Marked as no-show');
    },
    onError: () => toast.error('Failed to mark as no-show'),
  });
}

export function useExceptions(params: {
  startDate?: string;
  endDate?: string;
  status?: string;
  participantId?: string;
  userId?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: shiftKeys.exceptions(params),
    queryFn: () => shiftsApi.getExceptions(params),
    placeholderData: keepPreviousData,
  });
}
