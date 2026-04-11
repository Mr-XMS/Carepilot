import { api } from '../api';
import type {
  Incident,
  IncidentsListResponse,
  CreateIncidentInput,
  UpdateIncidentInput,
  ResolveIncidentInput,
  QueryIncidentsParams,
  RegisterReport,
  OverdueReportable,
} from '@/types/incident';

export const incidentsApi = {
  list: async (params: QueryIncidentsParams = {}): Promise<IncidentsListResponse> => {
    const { data } = await api.get<IncidentsListResponse>('/incidents', { params });
    return data;
  },

  getOne: async (id: string): Promise<Incident> => {
    const { data } = await api.get<Incident>(`/incidents/${id}`);
    return data;
  },

  create: async (input: CreateIncidentInput): Promise<Incident> => {
    const { data } = await api.post<Incident>('/incidents', input);
    return data;
  },

  update: async (id: string, input: UpdateIncidentInput): Promise<Incident> => {
    const { data } = await api.patch<Incident>(`/incidents/${id}`, input);
    return data;
  },

  startInvestigation: async (id: string): Promise<Incident> => {
    const { data } = await api.post<Incident>(`/incidents/${id}/start-investigation`);
    return data;
  },

  resolve: async (id: string, input: ResolveIncidentInput): Promise<Incident> => {
    const { data } = await api.post<Incident>(`/incidents/${id}/resolve`, input);
    return data;
  },

  close: async (id: string): Promise<Incident> => {
    const { data } = await api.post<Incident>(`/incidents/${id}/close`);
    return data;
  },

  getRegisterReport: async (): Promise<RegisterReport> => {
    const { data } = await api.get<RegisterReport>('/incidents/register-report');
    return data;
  },

  getOverdueReportables: async (): Promise<OverdueReportable[]> => {
    const { data } = await api.get<OverdueReportable[]>('/incidents/overdue-reportables');
    return data;
  },
};
