'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Participant,
  ParticipantWithRelations,
  ParticipantListResponse,
  CreateParticipantInput,
  UpdateParticipantInput,
  ParticipantStatus,
} from '@/types/participant';

interface ParticipantsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ParticipantStatus;
}

const participantKeys = {
  all: ['participants'] as const,
  lists: () => [...participantKeys.all, 'list'] as const,
  list: (params: ParticipantsQueryParams) => [...participantKeys.lists(), params] as const,
  details: () => [...participantKeys.all, 'detail'] as const,
  detail: (id: string) => [...participantKeys.details(), id] as const,
};

export function useParticipants(params: ParticipantsQueryParams = {}) {
  return useQuery({
    queryKey: participantKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<ParticipantListResponse>('/participants', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useParticipant(id: string | undefined) {
  return useQuery({
    queryKey: participantKeys.detail(id || ''),
    queryFn: async () => {
      const { data } = await api.get<ParticipantWithRelations>(`/participants/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateParticipantInput) => {
      const { data } = await api.post<Participant>('/participants', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.lists() });
    },
  });
}

export function useUpdateParticipant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateParticipantInput) => {
      const { data } = await api.patch<Participant>(`/participants/${id}`, input);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: participantKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: participantKeys.lists() });
    },
  });
}

export function useDeleteParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/participants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.lists() });
    },
  });
}
