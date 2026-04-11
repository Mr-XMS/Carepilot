export type IncidentCategory =
  | 'ABUSE'
  | 'NEGLECT'
  | 'INJURY'
  | 'DEATH'
  | 'RESTRICTIVE_PRACTICE'
  | 'MEDICATION'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

export interface Incident {
  id: string;
  organisationId: string;
  participantId: string | null;
  reportedByUserId: string;
  incidentDate: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  isReportable: boolean;
  description: string;
  immediateActions: string | null;
  status: IncidentStatus;
  outcomeNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  participant: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  reportedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface IncidentsListResponse {
  data: Incident[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    openCount: number;
    reportableCount: number;
  };
}

export interface CreateIncidentInput {
  participantId?: string;
  incidentDate: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  immediateActions?: string;
}

export interface UpdateIncidentInput {
  category?: IncidentCategory;
  severity?: IncidentSeverity;
  description?: string;
  immediateActions?: string;
}

export interface ResolveIncidentInput {
  outcomeNotes: string;
}

export interface QueryIncidentsParams {
  participantId?: string;
  status?: IncidentStatus;
  category?: IncidentCategory;
  severity?: IncidentSeverity;
  isReportable?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface RegisterReportSummary {
  total: number;
  byCategory: Partial<Record<IncidentCategory, number>>;
  bySeverity: Partial<Record<IncidentSeverity, number>>;
  byStatus: Partial<Record<IncidentStatus, number>>;
  reportableCount: number;
  overdueReportables: number;
}

export interface RegisterReport {
  summary: RegisterReportSummary;
  incidents: Incident[];
}

export interface OverdueReportable extends Incident {
  hoursOverdue: number;
  deadline: string;
}
