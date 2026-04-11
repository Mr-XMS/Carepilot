import { api } from '../api';
import type { ShiftNote, CreateShiftNoteInput } from '@/types/shift-note';

export const shiftNotesApi = {
  list: async (shiftId: string): Promise<ShiftNote[]> => {
    const { data } = await api.get<ShiftNote[]>(`/shifts/${shiftId}/notes`);
    return data;
  },

  create: async (shiftId: string, input: CreateShiftNoteInput): Promise<ShiftNote> => {
    const { data } = await api.post<ShiftNote>(`/shifts/${shiftId}/notes`, input);
    return data;
  },

  update: async (shiftId: string, noteId: string, content: string): Promise<ShiftNote> => {
    const { data } = await api.patch<ShiftNote>(`/shifts/${shiftId}/notes/${noteId}`, { content });
    return data;
  },

  remove: async (shiftId: string, noteId: string): Promise<void> => {
    await api.delete(`/shifts/${shiftId}/notes/${noteId}`);
  },
};
