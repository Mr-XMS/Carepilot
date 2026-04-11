import { api } from '../api';
import type {
  Invoice,
  InvoicesListResponse,
  GenerateInvoicesInput,
  GenerateInvoicesResult,
  RecordPaymentInput,
  ExportProdaCsvResult,
  OutstandingSummary,
  QueryInvoicesParams,
} from '@/types/invoice';

export const invoicesApi = {
  list: async (params: QueryInvoicesParams = {}): Promise<InvoicesListResponse> => {
    const { data } = await api.get<InvoicesListResponse>('/invoices', { params });
    return data;
  },

  getOne: async (id: string): Promise<Invoice> => {
    const { data } = await api.get<Invoice>(`/invoices/${id}`);
    return data;
  },

  generate: async (input: GenerateInvoicesInput): Promise<GenerateInvoicesResult> => {
    const { data } = await api.post<GenerateInvoicesResult>('/invoices/generate', input);
    return data;
  },

  send: async (id: string): Promise<Invoice> => {
    const { data } = await api.post<Invoice>(`/invoices/${id}/send`);
    return data;
  },

  recordPayment: async (id: string, input: RecordPaymentInput): Promise<Invoice> => {
    const { data } = await api.post<Invoice>(`/invoices/${id}/payment`, input);
    return data;
  },

  voidInvoice: async (id: string): Promise<Invoice> => {
    const { data } = await api.post<Invoice>(`/invoices/${id}/void`);
    return data;
  },

  exportProdaCsv: async (invoiceIds: string[]): Promise<ExportProdaCsvResult> => {
    const { data } = await api.post<ExportProdaCsvResult>('/invoices/export-proda-csv', {
      invoiceIds,
    });
    return data;
  },

  getOutstandingSummary: async (): Promise<OutstandingSummary> => {
    const { data } = await api.get<OutstandingSummary>('/invoices/outstanding-summary');
    return data;
  },
};
