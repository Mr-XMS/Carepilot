import { api } from '../api';
import type { User, UserRole, CreateUserInput, UpdateUserInput } from '@/types/user';

export const usersApi = {
  getAll: async (params?: {
    role?: UserRole;
    search?: string;
    activeOnly?: string;
  }): Promise<User[]> => {
    const { data } = await api.get<User[]>('/users', { params });
    return data;
  },

  getOne: async (id: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  create: async (input: CreateUserInput): Promise<User> => {
    const { data } = await api.post<User>('/users', input);
    return data;
  },

  update: async (id: string, input: UpdateUserInput): Promise<User> => {
    const { data } = await api.patch<User>(`/users/${id}`, input);
    return data;
  },

  deactivate: async (id: string): Promise<User> => {
    const { data } = await api.post<User>(`/users/${id}/deactivate`);
    return data;
  },
};
