import { Quotation } from './billing';

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
  | 'Proposal'
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
  product?: string | null;
  service?: string | null;

  // Pipeline Status & Stage
  status: LeadStatus | string;
  stage?: LeadStage | string | null;

  // Assignment & Additional Details
  assignedTo?: string | null;
  assignedToName?: string | null;
  notes?: string | null;
  agenda?: string | null;

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
  meetingDate?: string;
  time: string;
  startTime?: string;
  meetingTime?: string;
  endTime?: string;
  duration: string;
  hostName: string;
  employeeName?: string;
  meetingLink?: string;
  agenda?: string;
  purpose?: string;
  stageAfterMeeting?: string;
  project?: string;
  status: 'Scheduled' | 'Rescheduled' | 'Completed' | 'Cancelled' | 'In Progress' | string;
  meetingStatus?: string;
  requirements?: string;
  notes?: string;
  requirementFileName?: string;
  requirementFileUrl?: string;
  requirementFileSize?: string;
  internalAttendees?: string[] | string;
  clientAttendees?: string[] | string;
  rescheduleReason?: string;
  rescheduleHistory?: any[];
  meetingOutcome?: string;
  outcome?: string;
  createdAt: string;
}

// ----------------------------------------------------
// LEAD DEAL PIPELINE TYPES
// ----------------------------------------------------
export type LeadSectionType =
  | 'meetings'
  | 'proposal'
  | 'proposals'
  | 'quotation'
  | 'quotations'
  | 'negotiation'
  | 'contract'
  | 'contracts'
  | 'invoice'
  | 'invoices'
  | 'payment'
  | 'payments'
  | 'progress';

export interface SectionMeta {
  id: LeadSectionType;
  stepNumber: number;
  label: string;
  badgeLabel?: string;
  description: string;
}

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface LeadProposal {
  id: string;
  leadId: string;
  proposalNumber: string;
  title: string;
  issueDate: string;
  validUntil: string;
  status: 'Draft' | 'Sent' | 'Under Review' | 'Accepted' | 'Rejected';
  currency: string;
  items: ProposalItem[];
  discountPercent: number;
  taxPercent: number;
  subtotal: number;
  totalAmount: number;
  notes: string;
  terms: string;
  documentName?: string;
  documentUrl?: string;
  documentSize?: string;
  createdAt: string;
}

export interface NegotiationEntry {
  id: string;
  date: string;
  author: string;
  topic: string;
  notes: string;
  priceImpact?: number;
  type: 'scope' | 'pricing' | 'terms' | 'general';
}

export interface LeadNegotiation {
  leadId: string;
  originalQuotedAmount: number;
  currentAgreedAmount: number;
  discountPercentage: number;
  status: 'In Discussion' | 'Counter-Offer Received' | 'Terms Agreed' | 'Stalled';
  decisionMaker: string;
  keyConcessions: string[];
  nextFollowUpDate?: string;
  entries: NegotiationEntry[];
}

export interface LeadContract {
  id: string;
  leadId: string;
  contractNumber: string;
  title: string;
  contractValue: number;
  effectiveDate: string;
  expiryDate: string;
  durationMonths: number;
  status: 'Draft' | 'Sent for Signing' | 'Signed' | 'Active';
  signedByClient: boolean;
  clientSignerName?: string;
  clientSignedDate?: string;
  signedByCompany: boolean;
  companySignerName?: string;
  paymentTerms: string;
  slaTerms: string;
  scopeSummary: string;
}

export interface LeadInvoiceItem {
  id: string;
  invoiceNumber: string;
  title: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Unpaid' | 'Paid' | 'Overdue';
  type: 'Advance (40%)' | 'Milestone 1 (30%)' | 'Final Handover (30%)' | 'Custom';
  description?: string;
}

export interface LeadPaymentRecord {
  id: string;
  receiptNumber: string;
  date: string;
  amount: number;
  method: 'Bank Transfer (NEFT/IMPS)' | 'UPI' | 'Credit Card' | 'Cheque';
  referenceId: string;
  invoiceNumber: string;
  status: 'Confirmed' | 'Pending';
  notes?: string;
}

export interface ProjectMilestoneItem {
  id: string;
  title: string;
  description: string;
  percentage: number;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  targetDate: string;
}

export interface LeadProgressData {
  leadId: string;
  projectName: string;
  projectCode: string;
  overallPercentage: number;
  status: 'Planning' | 'In Development' | 'Testing & UAT' | 'Completed';
  projectManager: string;
  techLead: string;
  targetDeliveryDate: string;
  stagingUrl?: string;
  repoUrl?: string;
  milestones: ProjectMilestoneItem[];
}

export interface LeadDealData {
  proposals: LeadProposal[];
  quotations?: Quotation[];
  negotiation: LeadNegotiation;
  contract: LeadContract;
  invoices: LeadInvoiceItem[];
  payments: LeadPaymentRecord[];
  progress: LeadProgressData;
}


