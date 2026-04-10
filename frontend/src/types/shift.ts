export type ShiftStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type ShiftType = 'STANDARD' | 'SLEEPOVER' | 'ACTIVE_NIGHT';

export interface CalendarShift {
  id: string;
  organisationId: string;
  participantId: string;
  userId: string;
  serviceAgreementItemId: string;
  scheduledStart: string; // ISO
  scheduledEnd: string; // ISO
  actualStart: string | null;
  actualEnd: string | null;
  status: ShiftStatus;
  shiftType: ShiftType;
  breakMinutes: number;
  billableHours: string | null;
  isRecurring: boolean;
  recurringPatternId: string | null;
  notes: string | null;
  participant: {
    id: string;
    firstName: string;
    lastName: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  serviceAgreementItem: {
    supportItemName: string;
  };
}

export interface CreateShiftInput {
  participantId: string;
  userId: string;
  serviceAgreementItemId: string;
  scheduledStart: string;
  scheduledEnd: string;
  shiftType?: ShiftType;
  breakMinutes?: number;
  notes?: string;
}
