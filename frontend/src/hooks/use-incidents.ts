import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { incidentsApi } from '@/lib/api/incidents';
import type {
  CreateIncidentInput,
  ResolveIncidentInput,
  QueryIncidentsParams,
} from '@/types/incident';

export const incidentKeys = {
  all: ['incidents'] as const,
  list: (params: QueryIncidentsParams) => [...incidentKeys.all, 'list', params] as const,
  detail: (id: string) => [...incidentKeys.all, 'detail', id] as const,
  register: () => [...incidentKeys.all, 'register-report'] as const,
  overdue: () => [...incidentKeys.all, 'overdue'] as const,
};

export function useIncidents(params: QueryIncidentsParams = {}) {
  return useQuery({
    queryKey: incidentKeys.list(params),
    queryFn: () => incidentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: incidentKeys.detail(id ?? ''),
    queryFn: () => incidentsApi.getOne(id!),
    enabled: !!id,
  });
}

export function useRegisterReport() {
  return useQuery({
    queryKey: incidentKeys.register(),
    queryFn: () => incidentsApi.getRegisterReport(),
    staleTime: 60_000,
  });
}

export function useOverdueReportables() {
  return useQuery({
    queryKey: incidentKeys.overdue(),
    queryFn: () => incidentsApi.getOverdueReportables(),
    staleTime: 60_000,
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIncidentInput) => incidentsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: incidentKeys.all });
      toast.success('Incident reported');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to report incident');
    },
  });
}

export function useStartInvestigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => incidentsApi.startInvestigation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: incidentKeys.all });
      toast.success('Investigation started');
    },
    onError: () => toast.error('Failed to start investigation'),
  });
}

export function useResolveIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ResolveIncidentInput & { id: string }) =>
      incidentsApi.resolve(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: incidentKeys.all });
      toast.success('Incident resolved');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to resolve incident');
    },
  });
}

export function useCloseIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => incidentsApi.close(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: incidentKeys.all });
      toast.success('Incident closed');
    },
    onError: () => toast.error('Failed to close incident'),
  });
}
