import { api } from '../api';
import type { CalendarShift, CreateShiftInput } from '@/types/shift';

export const shiftsApi = {
  getCalendar: async (params: {
    startDate: string;
    endDate: string;
    userId?: string;
  }): Promise<CalendarShift[]> => {
    const { data } = await api.get<CalendarShift[]>('/shifts/calendar', { params });
    return data;
  },

  getOne: async (id: string): Promise<CalendarShift> => {
    const { data } = await api.get<CalendarShift>(`/shifts/${id}`);
    return data;
  },

  create: async (input: CreateShiftInput): Promise<CalendarShift> => {
    const { data } = await api.post<CalendarShift>('/shifts', input);
    return data;
  },

  cancel: async (id: string): Promise<CalendarShift> => {
    const { data } = await api.post<CalendarShift>(`/shifts/${id}/cancel`);
    return data;
  },

  markNoShow: async (id: string): Promise<CalendarShift> => {
    const { data } = await api.post<CalendarShift>(`/shifts/${id}/no-show`);
    return data;
  },
};
