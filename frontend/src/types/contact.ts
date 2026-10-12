export type ContactType = 'Company Representative' | 'Individual';
export type RequirementCategory = 'Product' | 'Service';
export type ContactMode = 'Call' | 'Email' | 'Meeting' | 'WhatsApp' | 'Other';
export type MeetingType = 'Virtual' | 'In-person';
export type ContactStatus =
  | 'New'
  | 'Active'
  | 'Qualified'
  | 'In Progress'
  | 'On Hold'
  | 'Pending'
  | 'Follow-up Required'
  | 'Completed'
  | 'Won'
  | 'Lost'
  | 'Cancelled'
  | 'Inactive'
  | 'Disqualified';

export type ContactStage =
  | 'New Lead'
  | 'Qualification'
  | 'Discovery'
  | 'Requirement Analysis'
  | 'Demo / Presentation'
  | 'Proposal / Quotation'
  | 'Negotiation'
  | 'Decision Making'
  | 'Won'
  | 'Lost'
  | 'Proposal'
  | 'Contract / Agreement'
  | 'Closed Won'
  | 'Closed Lost'
  | 'Initialization';
export type QualificationStatus = 'In Progress' | 'Qualified' | 'Disqualified';
export type ContactPriority = 'High' | 'Medium' | 'Low';
export type AssignmentStatus = 'Assigned' | 'Unassigned';

export interface EmployeeOption {
  id: string;
  name: string;
  empCode: string;
  email: string;
  designation?: string | null;
  department?: string | null;
}

export interface CompanyOption {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  address?: string | null;
}

export interface LeadOption {
  id: string;
  leadId: string;
  title: string;
  companyName?: string | null;
  status: string;
}

export interface Contact {
  id: string;
  contactId: string;

  // 1. Basic Contact Information
  name: string;
  email?: string | null;
  phone: string; // Mobile Number
  address?: string | null;
  source?: string | null;
  customSource?: string | null;

  // 2. Professional & Company Information
  contactType?: ContactType | string | null;
  companyName?: string | null;
  designation?: string | null;
  profession?: string | null;

  // Company Verification & Firmographic Details
  gstNumber?: string | null;
  employeeCount?: string | null;
  companyPan?: string | null;
  cinNumber?: string | null;
  companyWebsite?: string | null;
  linkedinUrl?: string | null;
  annualTurnover?: string | null;
  annualRevenue?: string | null;
  verificationStatus?: 'Verified' | 'Pending' | 'Unverified' | string | null;
  registeredState?: string | null;

  // 3. Requirement Details
  category?: RequirementCategory | string | null;
  productList: string[];
  serviceList: string[];
  customProduct?: string | null;

  // 4. Interaction & Follow-up Details
  contactMode?: ContactMode | string | null;
  customContactMode?: string | null;
  meetingType?: MeetingType | string | null;
  nextFollowDate?: string | null;
  remarks?: string | null;
  notes?: string | null;

  // 5. Qualification Details
  status: ContactStatus | string;
  stage?: ContactStage | string | null;
  qualificationStatus?: QualificationStatus | string | null;
  qualifiedBy?: string | null;
  qualificationDate?: string | null;
  priority?: ContactPriority | string | null;
  disqualificationReason?: string | null;
  estimatedBudget?: number | string | null;
  projectType?: string | null;
  expectedUsers?: number | string | null;
  expectedGoLiveDate?: string | null;
  influencer?: string | null;
  otherOptions?: string | null;

  // 6. Assignment & System Metadata
  assignedTo?: string | null;
  assignedToName?: string | null;
  assignedBy?: string | null;
  createdBy?: string | null;
  assignmentStatus?: AssignmentStatus | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFormData {
  id?: string;
  contactId?: string;

  // 1. Basic Contact Information
  name: string;
  email?: string;
  phone: string;
  address?: string;
  source?: string;
  customSource?: string;

  // 2. Professional & Company Information
  contactType?: ContactType | string;
  companyName?: string;
  designation?: string;
  profession?: string;

  // Company Verification & Firmographic Details
  gstNumber?: string;
  employeeCount?: string;
  companyPan?: string;
  cinNumber?: string;
  companyWebsite?: string;
  linkedinUrl?: string;
  annualTurnover?: string;
  annualRevenue?: string;
  verificationStatus?: 'Verified' | 'Pending' | 'Unverified' | string;
  registeredState?: string;

  // 3. Requirement Details
  category?: RequirementCategory | string;
  productList?: string[];
  serviceList?: string[];
  customProduct?: string;

  // 4. Interaction & Follow-up Details
  contactMode?: ContactMode | string;
  customContactMode?: string;
  meetingType?: MeetingType | string;
  nextFollowDate?: string;
  remarks?: string;
  notes?: string;

  // 5. Qualification & Status
  status?: ContactStatus | string;
  stage?: ContactStage | string;
  qualificationStatus?: QualificationStatus | string;
  qualifiedBy?: string;
  qualificationDate?: string;
  priority?: ContactPriority | string;
  disqualificationReason?: string;
  estimatedBudget?: number | string;
  projectType?: string;
  expectedUsers?: number | string;
  expectedGoLiveDate?: string;
  influencer?: string;
  otherOptions?: string;

  // 6. Assignment
  assignedTo?: string;
  assignedBy?: string;
  createdBy?: string;
}

export interface ContactFilter {
  search?: string;
  companyName?: string;
  contactType?: string;
  category?: string;
  source?: string;
  status?: string;
  stage?: string;
  qualificationStatus?: string;
  priority?: string;
  assignedTo?: string;
  assignmentStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ContactPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface ContactStats {
  total: number;
  new: number;
  active: number;
  qualified: number;
  disqualified: number;
  assigned: number;
  unassigned: number;
  highPriority: number;
}

export interface ContactMetadata {
  contactTypes: string[];
  sources: string[];
  categories: string[];
  productOptions: string[];
  serviceOptions: string[];
  contactModes: string[];
  meetingTypes: string[];
  statuses: string[];
  stages: string[];
  qualificationStatuses: string[];
  priorities: string[];
  projectTypes: string[];
  assignmentStatuses: string[];
  employees: EmployeeOption[];
  companies: CompanyOption[];
  leads: LeadOption[];
}
