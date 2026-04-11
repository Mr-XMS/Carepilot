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
  hourlyRate: string | null;
  qualifications: unknown | null;
  createdAt?: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  employmentType?: EmploymentType;
  hourlyRate?: number;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phone?: string;
  isActive?: boolean;
  employmentType?: EmploymentType;
  hourlyRate?: number;
}
