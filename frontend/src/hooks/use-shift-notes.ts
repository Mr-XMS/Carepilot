import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shiftNotesApi } from '@/lib/api/shift-notes';
import type { CreateShiftNoteInput } from '@/types/shift-note';

export const shiftNoteKeys = {
  all: ['shift-notes'] as const,
  list: (shiftId: string) => [...shiftNoteKeys.all, shiftId] as const,
};

export function useShiftNotes(shiftId: string | null) {
  return useQuery({
    queryKey: shiftNoteKeys.list(shiftId ?? ''),
    queryFn: () => shiftNotesApi.list(shiftId!),
    enabled: !!shiftId,
  });
}

export function useCreateShiftNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, ...input }: CreateShiftNoteInput & { shiftId: string }) =>
      shiftNotesApi.create(shiftId, input),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: shiftNoteKeys.list(variables.shiftId) });
      toast.success('Note added');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to add note');
    },
  });
}

export function useDeleteShiftNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, noteId }: { shiftId: string; noteId: string }) =>
      shiftNotesApi.remove(shiftId, noteId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: shiftNoteKeys.list(variables.shiftId) });
      toast.success('Note deleted');
    },
    onError: () => toast.error('Failed to delete note'),
  });
}
