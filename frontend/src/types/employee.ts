export type UserRole = string;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  phone?: string;
}

export type EmploymentType = string;
export type EmployeeStatus = string;
export type EmployeeDepartment = string;

export interface Employee {
  id: string;
  empCode: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  dob?: string;
  gender?: string;
  address?: string;
  department: string;
  designation: string;
  role: UserRole;
  reportingManager?: string;
  joiningDate: string;
  employmentType: EmploymentType;
  workLocation: string;
  status: EmployeeStatus;
  salary?: number;
  currency?: string;
  skills?: string[];
  experienceYears?: number;
  currentProject?: string;
  rating?: number;
  github?: string;
  linkedin?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFilter {
  department: string;
  status: string;
  role: string;
  employmentType: string;
  search: string;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeCount: number;
  probationCount: number;
  onLeaveCount: number;
  activePercentage: number;
  avgRating: number;
  departmentBreakdown: Record<string, number>;
}
