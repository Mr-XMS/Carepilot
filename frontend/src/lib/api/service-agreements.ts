import { api } from '../api';
import type {
  ServiceAgreementSummary,
  AgreementStatus,
  AddLineItemInput,
  ServiceAgreementItem,
} from '@/types/service-agreement';

export const serviceAgreementsApi = {
  list: async (params?: {
    participantId?: string;
    status?: AgreementStatus;
  }): Promise<ServiceAgreementSummary[]> => {
    const { data } = await api.get<ServiceAgreementSummary[]>('/service-agreements', {
      params,
    });
    return data;
  },

  getOne: async (id: string): Promise<ServiceAgreementSummary> => {
    const { data } = await api.get<ServiceAgreementSummary>(`/service-agreements/${id}`);
    return data;
  },

  activate: async (id: string): Promise<ServiceAgreementSummary> => {
    const { data } = await api.post<ServiceAgreementSummary>(
      `/service-agreements/${id}/activate`,
    );
    return data;
  },

  cancel: async (id: string): Promise<ServiceAgreementSummary> => {
    const { data } = await api.post<ServiceAgreementSummary>(
      `/service-agreements/${id}/cancel`,
    );
    return data;
  },

  addLineItem: async (id: string, input: AddLineItemInput): Promise<ServiceAgreementItem> => {
    const { data } = await api.post<ServiceAgreementItem>(
      `/service-agreements/${id}/line-items`,
      input,
    );
    return data;
  },

  removeLineItem: async (id: string, itemId: string): Promise<void> => {
    await api.delete(`/service-agreements/${id}/line-items/${itemId}`);
  },
};
