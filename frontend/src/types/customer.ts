export type CustomerStatus = 'Active' | 'Onboarding' | 'Inactive' | 'Churned';
export type CustomerTier = 'Enterprise' | 'Mid-Market' | 'Startup' | 'Government';

export interface Customer {
  id: string;
  customerId: string;
  companyName: string;
  contactPerson: string;
  email?: string | null;
  phone: string;
  designation?: string | null;
  industry?: string | null;
  customerTier?: CustomerTier | string;
  status: CustomerStatus | string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  website?: string | null;
  contractValue?: number | null;
  accountManager?: string | null;
  accountManagerId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerStats {
  total: number;
  active: number;
  onboarding: number;
  enterprise: number;
  totalContractValue: number;
}

export interface CustomerFormData {
  companyName: string;
  contactPerson: string;
  email?: string;
  phone: string;
  designation?: string;
  industry?: string;
  customerTier?: CustomerTier | string;
  status?: CustomerStatus | string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  panNumber?: string;
  website?: string;
  contractValue?: number;
  accountManager?: string;
  notes?: string;
}
