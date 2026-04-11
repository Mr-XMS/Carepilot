import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api/users';
import type { UserRole, CreateUserInput, UpdateUserInput } from '@/types/user';

export const userKeys = {
  all: ['users'] as const,
  list: (params?: { role?: UserRole; activeOnly?: string }) =>
    [...userKeys.all, 'list', params] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

export function useUsers(role?: UserRole) {
  return useQuery({
    queryKey: userKeys.list({ role }),
    queryFn: () => usersApi.getAll({ role }),
    staleTime: 5 * 60_000,
  });
}

export function useAllUsers(params?: { activeOnly?: string }) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.getAll(params),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: () => usersApi.getOne(id!),
    enabled: !!id,
  });
}

export function useSupportWorkers() {
  return useUsers('SUPPORT_WORKER');
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Staff member added');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to add staff member');
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateUserInput & { id: string }) =>
      usersApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Staff member updated');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to update staff member');
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Staff member deactivated');
    },
    onError: () => toast.error('Failed to deactivate staff member'),
  });
}
