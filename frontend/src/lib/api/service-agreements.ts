import { api } from '../api';
import type { ServiceAgreementSummary, AgreementStatus } from '@/types/service-agreement';

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
};
