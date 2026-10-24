export interface MasterModuleItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  durationDays?: number;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  isCore?: boolean;
  deliverables?: string[];
  price?: number;
}

export interface MasterProject {
  id: string;
  projectCode?: string; // e.g. "PRJ-HRMS"
  name: string;
  category?: string;
  projectType?: string;
  basePrice?: number;
  currency?: string;
  defaultDuration?: string;
  techStack?: string[];
  description?: string;
  status?: string;
  modules: MasterModuleItem[];
  deliverables?: string[];
  icon?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterProjectFormData {
  id?: string;
  projectCode?: string;
  name: string;
  category?: string;
  projectType?: string;
  basePrice?: number | string;
  currency?: string;
  defaultDuration?: string;
  techStack?: string[];
  description?: string;
  status?: string;
  modules: MasterModuleItem[];
  deliverables?: string[];
  icon?: string;
}

export interface UserProfileData {
  id?: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  designation: string;
  department: string;
  empCode?: string;
  workLocation?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  bio?: string;
  avatar?: string;
  passwordUpdatedAt?: string;
  accountCreatedAt?: string;
}

export interface SecurityAuditLog {
  id: string;
  action: string;
  target: string;
  user: string;
  ip: string;
  time: string;
}

export interface CompanyProfile {
  companyName: string;
  legalName?: string;
  tagline?: string;
  gstNumber?: string;
  companyGst?: string;
  panNumber?: string;
  companyPan?: string;
  cinNumber?: string;
  email: string;
  companyEmail?: string;
  supportEmail?: string;
  phone: string;
  companyPhone?: string;
  website?: string;
  companyWebsite?: string;
  address: string;
  companyAddress?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  currency?: string;
  timezone?: string;
  fiscalYear?: string;
  dateFormat?: string;
  logoUrl?: string;
  companyLogoUrl?: string;
  placeOfSupply?: string;
  // Bank & Payment Details
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  branchName?: string;
  accountType?: string;
  upiId?: string;
  // Authorized Signatory Details
  authorizedSignatory?: string;
  signatoryDesignation?: string;
  signatureUrl?: string;
}

export interface CrmPipelinePresets {
  leadStages: string[];
  leadSources: string[];
  priorities: string[];
  projectTypes: string[];
  categories: string[];
  unqualifiedReasons: string[];
}

export interface SecuritySettings {
  sessionTimeoutHours: number;
  passwordMinLength: number;
  requireNumberInPassword: boolean;
  requireSpecialChar: boolean;
  enableAuditLogging: boolean;
  allowDataExport: boolean;
  maxFileUploadMb: number;
}

export interface SecurityAuditLog {
  id: string;
  action: string;
  target: string;
  user: string;
  ip: string;
  time: string;
}

export interface NotificationSettings {
  dailyDigest: boolean;
  leadAssignment: boolean;
  projectMilestones: boolean;
  meetingReminders: boolean;
  inAppMentions: boolean;
  securityAlerts: boolean;
  soundAlerts: boolean;
  desktopBanners: boolean;
  digestTime: string;
  frequency: 'instant' | 'hourly' | 'daily';
}

export interface ReminderItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  notes?: string;
  completed: boolean;
  createdById: string;
  createdByName: string;
  createdByRole: string;
  createdByEmail?: string;
  assignedToId?: string;
  assignedUserId?: string;
  assignedEmployeeId?: string;
  assignedToName?: string;
  assignedToEmail?: string;
  isSuperAdminOnly: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ReminderFormData {
  title: string;
  date: string;
  time: string;
  priority: 'High' | 'Medium' | 'Low' | '';
  category: string;
  notes: string;
  assignedToId?: string;
  assignedEmployeeId?: string;
  assignedToName?: string;
  assignedToEmail?: string;
}

