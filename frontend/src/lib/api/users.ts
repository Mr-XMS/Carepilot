import { api } from '../api';
import type { User, UserRole } from '@/types/user';

export const usersApi = {
  getAll: async (params?: { role?: UserRole; search?: string }): Promise<User[]> => {
    const { data } = await api.get<User[]>('/users', { params });
    return data;
  },

  getOne: async (id: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },
};
