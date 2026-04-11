export type AgreementStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type FundingCategory = 'CORE' | 'CAPACITY_BUILDING' | 'CAPITAL';

export interface ServiceAgreementItem {
  id: string;
  serviceAgreementId: string;
  supportItemNumber: string;
  supportItemName: string;
  category: FundingCategory;
  unitPrice: string; // Decimal serialised as string
  allocatedQty: string;
  allocatedBudget: string;
  deliveredQty: string;
  deliveredBudget: string;
}

export interface ServiceAgreementSummary {
  id: string;
  organisationId: string;
  participantId: string;
  ndisPlanId: string;
  startDate: string;
  endDate: string;
  status: AgreementStatus;
  signedAt: string | null;
  documentUrl: string | null;
  createdAt: string;
  updatedAt: string;
  participant: {
    id: string;
    firstName: string;
    lastName: string;
    ndisNumber: string;
  };
  ndisPlan?: {
    id: string;
    startDate: string;
    endDate: string;
  };
  lineItems: ServiceAgreementItem[];
  _count?: { lineItems: number };
}

export interface AddLineItemInput {
  supportItemNumber: string;
  unitPrice: number;
  allocatedQty: number;
}
