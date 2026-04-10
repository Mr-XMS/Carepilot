'use client';

import { useQuery } from '@tanstack/react-query';
import { serviceAgreementsApi } from '@/lib/api/service-agreements';
import type { AgreementStatus } from '@/types/service-agreement';

export const serviceAgreementKeys = {
  all: ['service-agreements'] as const,
  list: (params: { participantId?: string; status?: AgreementStatus }) =>
    [...serviceAgreementKeys.all, 'list', params] as const,
};

/**
 * Fetch service agreements (with line items) for a specific participant.
 * Used by the create-shift modal to populate the agreement-item dropdown.
 * Disabled until participantId is set.
 */
export function useParticipantAgreements(participantId: string | undefined) {
  return useQuery({
    queryKey: serviceAgreementKeys.list({ participantId, status: 'ACTIVE' }),
    queryFn: () =>
      serviceAgreementsApi.list({ participantId, status: 'ACTIVE' }),
    enabled: !!participantId,
    staleTime: 60_000,
  });
}
