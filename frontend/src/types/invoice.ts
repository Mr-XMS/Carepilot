export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'VOID';
export type BillingTarget = 'NDIA' | 'PLAN_MANAGER' | 'SELF_MANAGED';
export type ClaimType = 'STANDARD' | 'CANCELLATION' | 'TRAVEL' | 'REPORT_WRITING';

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  shiftId: string | null;
  serviceAgreementItemId: string;
  supportItemNumber: string;
  description: string;
  serviceDate: string;
  quantity: string; // Decimal from Prisma
  unitPrice: string;
  lineTotal: string;
  gstApplicable: boolean;
  claimType: ClaimType | null;
  shift: {
    id: string;
    scheduledStart: string;
    actualStart: string | null;
    actualEnd: string | null;
  } | null;
  serviceAgreementItem: {
    supportItemName: string;
  };
}

export interface Invoice {
  id: string;
  organisationId: string;
  participantId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  billingTarget: BillingTarget;
  billingEmail: string | null;
  subtotal: string;
  gst: string;
  total: string;
  paidAmount: string;
  xeroInvoiceId: string | null;
  prodaClaimId: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  participant: {
    id: string;
    firstName: string;
    lastName: string;
    ndisNumber: string;
  };
  lineItems?: InvoiceLineItem[];
  _count?: {
    lineItems: number;
  };
}

export interface InvoicesListResponse {
  data: Invoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    sumTotal: number;
    sumPaid: number;
    sumOutstanding: number;
  };
}

export interface OutstandingSummary {
  totalOutstanding: number;
  invoiceCount: number;
  ageingBuckets: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
  };
}

export interface GenerateInvoicesInput {
  startDate: string;
  endDate: string;
  participantIds?: string[];
  paymentTermsDays?: number;
}

export interface GenerateInvoicesResult {
  invoicesCreated: number;
  shiftsBilled?: number;
  totalValue?: number;
  message?: string;
  invoices?: Array<{ id: string; invoiceNumber: string; total: number }>;
}

export interface RecordPaymentInput {
  amount: number;
  paymentDate?: string;
  reference?: string;
}

export interface ExportProdaCsvResult {
  filename: string;
  contentType: string;
  content: string;
  lineCount: number;
  invoiceCount: number;
}

export interface QueryInvoicesParams {
  participantId?: string;
  status?: InvoiceStatus;
  billingTarget?: BillingTarget;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
