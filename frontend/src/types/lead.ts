export type LeadContactType = 'Company Representative' | 'Individual';
export type LeadRequirementCategory = 'Product' | 'Service';

export type LeadStatus =
  | 'New'
  | 'In Progress'
  | 'Contacted'
  | 'Qualified'
  | 'Proposal Sent'
  | 'In Negotiation'
  | 'Completed'
  | 'Complete'
  | 'Won'
  | 'Lost';

export type LeadStage =
  | 'Initialization'
  | 'Qualification'
  | 'Discovery'
  | 'Requirement Analysis'
  | 'Demo / Presentation'
  | 'Proposal / Quotation'
  | 'Negotiation'
  | 'Decision Making'
  | 'Won'
  | 'Lost';

export interface Lead {
  id: string;
  leadId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  source?: string | null;
  customSource?: string | null;

  // Professional details
  contactType?: LeadContactType | string | null;
  companyName?: string | null;
  designation?: string | null;
  profession?: string | null;

  // Requirement details
  category?: LeadRequirementCategory | string | null;
  productList: string[];
  serviceList: string[];

  // Pipeline Status & Stage
  status: LeadStatus | string;
  stage?: LeadStage | string | null;

  displayCompany?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  source?: string;
  customSource?: string;
  contactType?: LeadContactType | string;
  companyName?: string;
  designation?: string;
  profession?: string;
  category?: LeadRequirementCategory | string;
  productList?: string[];
  serviceList?: string[];
  status?: LeadStatus | string;
  stage?: LeadStage | string;
}

export interface LeadFilter {
  search?: string;
  status?: string;
  stage?: string;
  category?: string;
  source?: string;
  contactType?: string;
  companyName?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LeadPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadStats {
  total: number;
  new: number;
  inProgress: number;
  won: number;
  completed?: number;
  complete?: number;
  lost: number;
}

export interface LeadMetadata {
  sources: string[];
  statuses: string[];
  stages: string[];
  categories: string[];
  contactTypes: string[];
  productOptions: string[];
  serviceOptions: string[];
}

export interface ScheduledMeeting {
  id: string;
  leadId: string;
  title: string;
  meetingType: string;
  date: string;
  time: string;
  duration: string;
  hostName: string;
  meetingLink?: string;
  agenda?: string;
  purpose?: string;
  stageAfterMeeting?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'In Progress' | string;
  meetingStatus?: string;
  requirements?: string;
  requirementFileName?: string;
  requirementFileUrl?: string;
  requirementFileSize?: string;
  createdAt: string;
}

