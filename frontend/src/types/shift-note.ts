export type NoteType = 'PROGRESS' | 'INCIDENT' | 'HANDOVER' | 'GENERAL';

export interface ShiftNote {
  id: string;
  shiftId: string;
  userId: string;
  content: string;
  noteType: NoteType;
  goalIds: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateShiftNoteInput {
  content: string;
  noteType?: NoteType;
  goalIds?: string[];
}
