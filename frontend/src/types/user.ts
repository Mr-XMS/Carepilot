export type UserRole = 'OWNER' | 'ADMIN' | 'COORDINATOR' | 'SUPPORT_WORKER' | 'BILLING';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CASUAL' | 'CONTRACTOR';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  employmentType: EmploymentType | null;
}
