import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoicesApi } from '@/lib/api/invoices';
import type {
  GenerateInvoicesInput,
  RecordPaymentInput,
  QueryInvoicesParams,
} from '@/types/invoice';

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: (params: QueryInvoicesParams) => [...invoiceKeys.all, 'list', params] as const,
  detail: (id: string) => [...invoiceKeys.all, 'detail', id] as const,
  outstandingSummary: () => [...invoiceKeys.all, 'outstanding-summary'] as const,
};

export function useInvoices(params: QueryInvoicesParams = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoicesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: invoiceKeys.detail(id ?? ''),
    queryFn: () => invoicesApi.getOne(id!),
    enabled: !!id,
  });
}

export function useOutstandingSummary() {
  return useQuery({
    queryKey: invoiceKeys.outstandingSummary(),
    queryFn: () => invoicesApi.getOutstandingSummary(),
    staleTime: 60_000,
  });
}

export function useGenerateInvoices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateInvoicesInput) => invoicesApi.generate(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      if (data.invoicesCreated > 0) {
        toast.success(
          `${data.invoicesCreated} invoice${data.invoicesCreated === 1 ? '' : 's'} generated ($${data.totalValue?.toFixed(2)})`,
        );
      } else {
        toast.info(data.message || 'No uninvoiced shifts found in that range');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to generate invoices');
    },
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.send(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success('Invoice marked as sent');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to send invoice');
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: RecordPaymentInput & { id: string }) =>
      invoicesApi.recordPayment(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success('Payment recorded');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to record payment');
    },
  });
}

export function useVoidInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.voidInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success('Invoice voided');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to void invoice');
    },
  });
}
