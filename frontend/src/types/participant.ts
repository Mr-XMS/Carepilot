export type ManagementType = 'NDIA_MANAGED' | 'PLAN_MANAGED' | 'SELF_MANAGED';

export type ParticipantStatus = 'ACTIVE' | 'INACTIVE' | 'ON_HOLD';

export interface Participant {
  id: string;
  organisationId: string;
  ndisNumber: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  managementType: ManagementType;
  planManagerName: string | null;
  planManagerEmail: string | null;
  planManagerPhone: string | null;
  status: ParticipantStatus;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ParticipantWithRelations extends Participant {
  ndisPlans?: NdisPlanSummary[];
  serviceAgreements?: ServiceAgreementSummary[];
  _count?: {
    shifts: number;
    incidents: number;
  };
}

export interface NdisPlanSummary {
  id: string;
  planNumber: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  status: 'ACTIVE' | 'EXPIRED' | 'SUPERSEDED';
}

export interface ServiceAgreementSummary {
  id: string;
  agreementNumber: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  totalValue: number;
}

export interface ParticipantListResponse {
  data: Participant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateParticipantInput {
  ndisNumber: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  managementType: ManagementType;
  planManagerName?: string;
  planManagerEmail?: string;
  planManagerPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  notes?: string;
}

export type UpdateParticipantInput = Partial<CreateParticipantInput> & {
  status?: ParticipantStatus;
};
