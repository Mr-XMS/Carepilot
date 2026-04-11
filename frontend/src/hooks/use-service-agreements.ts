'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { serviceAgreementsApi } from '@/lib/api/service-agreements';
import type { AgreementStatus, AddLineItemInput } from '@/types/service-agreement';

export const serviceAgreementKeys = {
  all: ['service-agreements'] as const,
  list: (params: { participantId?: string; status?: AgreementStatus }) =>
    [...serviceAgreementKeys.all, 'list', params] as const,
  detail: (id: string) => [...serviceAgreementKeys.all, 'detail', id] as const,
};

export function useServiceAgreements(params?: { participantId?: string; status?: AgreementStatus }) {
  return useQuery({
    queryKey: serviceAgreementKeys.list(params || {}),
    queryFn: () => serviceAgreementsApi.list(params),
  });
}

export function useServiceAgreement(id: string | undefined) {
  return useQuery({
    queryKey: serviceAgreementKeys.detail(id ?? ''),
    queryFn: () => serviceAgreementsApi.getOne(id!),
    enabled: !!id,
  });
}

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

export function useActivateAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceAgreementsApi.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceAgreementKeys.all });
      toast.success('Agreement activated');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to activate agreement');
    },
  });
}

export function useCancelAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceAgreementsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceAgreementKeys.all });
      toast.success('Agreement cancelled');
    },
    onError: () => toast.error('Failed to cancel agreement'),
  });
}

export function useAddLineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agreementId, ...input }: AddLineItemInput & { agreementId: string }) =>
      serviceAgreementsApi.addLineItem(agreementId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceAgreementKeys.all });
      toast.success('Line item added');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to add line item');
    },
  });
}

export function useRemoveLineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agreementId, itemId }: { agreementId: string; itemId: string }) =>
      serviceAgreementsApi.removeLineItem(agreementId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceAgreementKeys.all });
      toast.success('Line item removed');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to remove line item');
    },
  });
}
