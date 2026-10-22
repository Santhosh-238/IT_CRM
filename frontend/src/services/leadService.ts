import {
  Lead,
  LeadFormData,
  LeadFilter,
  LeadPagination,
  LeadStats,
  LeadMetadata,
  LeadProposal,
} from '../types/lead';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchWithCookies<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export const leadService = {
  // Get leads list with search, filters, pagination, and sorting
  getLeads: async (
    params: LeadFilter = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ success: boolean; data: Lead[]; pagination: LeadPagination }> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.companyName && params.companyName !== 'All') query.append('companyName', params.companyName);
    if (params.contactType && params.contactType !== 'All') query.append('contactType', params.contactType);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.source && params.source !== 'All') query.append('source', params.source);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.stage && params.stage !== 'All') query.append('stage', params.stage);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (pagination.page) query.append('page', String(pagination.page));
    if (pagination.limit) query.append('limit', String(pagination.limit));

    const qs = query.toString();
    const endpoint = `/leads${qs ? `?${qs}` : ''}`;
    return fetchWithCookies<{ success: boolean; data: Lead[]; pagination: LeadPagination }>(endpoint);
  },

  // Get lead by ID
  getLeadById: async (id: string): Promise<{ success: boolean; data: Lead }> => {
    return fetchWithCookies<{ success: boolean; data: Lead }>(`/leads/${encodeURIComponent(id)}`);
  },

  // Get lead statistics
  getLeadStats: async (): Promise<{ success: boolean; stats: LeadStats }> => {
    return fetchWithCookies<{ success: boolean; stats: LeadStats }>('/leads/stats');
  },

  // Get lead metadata
  getLeadMetadata: async (): Promise<{ success: boolean; metadata: LeadMetadata }> => {
    return fetchWithCookies<{ success: boolean; metadata: LeadMetadata }>('/leads/metadata');
  },

  // Create lead
  createLead: async (data: LeadFormData): Promise<{ success: boolean; message: string; data: Lead }> => {
    return fetchWithCookies<{ success: boolean; message: string; data: Lead }>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update lead
  updateLead: async (id: string, data: Partial<LeadFormData>): Promise<{ success: boolean; message: string; data: Lead }> => {
    return fetchWithCookies<{ success: boolean; message: string; data: Lead }>(`/leads/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete lead
  deleteLead: async (id: string): Promise<{ success: boolean; message: string; data: { id: string; leadId: string } }> => {
    return fetchWithCookies<{ success: boolean; message: string; data: { id: string; leadId: string } }>(`/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ----------------------------------------------------
  // PROPOSALS (Inside Lead Service)
  // ----------------------------------------------------
  getProposals: async (params?: { leadId?: string; search?: string; status?: string }): Promise<LeadProposal[]> => {
    const query = new URLSearchParams();
    if (params?.leadId && params.leadId !== 'All') query.append('leadId', params.leadId);
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    const qs = query.toString();
    const endpoint = `/leads/proposals${qs ? `?${qs}` : ''}`;
    const res = await fetchWithCookies<{ success: boolean; data: any[] }>(endpoint);
    return (res.data || []).map((p) => ({
      id: p.id,
      leadId: p.leadId || '',
      proposalNumber: p.proposalNumber,
      title: p.title || '',
      issueDate: p.proposalDate,
      validUntil: p.validUntil,
      status: p.status,
      currency: p.currency || 'INR (₹)',
      items: (p.items || []).map((it: any) => ({
        id: it.id,
        description: it.itemName || it.description || '',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        total: it.totalAmount || 0,
      })),
      discountPercent: p.discountPercent || 0,
      taxPercent: p.taxPercent || 0,
      subtotal: p.subtotal || 0,
      totalAmount: p.totalAmount || p.grandTotal || 0,
      notes: p.notes || '',
      terms: p.terms || '',
      documentName: p.documentName,
      documentUrl: p.documentUrl,
      documentSize: p.documentSize,
      createdAt: p.createdAt,
    }));
  },

  getProposalById: async (id: string): Promise<LeadProposal> => {
    const res = await fetchWithCookies<{ success: boolean; data: any }>(`/leads/proposals/${encodeURIComponent(id)}`);
    const p = res.data;
    return {
      id: p.id,
      leadId: p.leadId || '',
      proposalNumber: p.proposalNumber,
      title: p.title || '',
      issueDate: p.proposalDate,
      validUntil: p.validUntil,
      status: p.status,
      currency: p.currency || 'INR (₹)',
      items: (p.items || []).map((it: any) => ({
        id: it.id,
        description: it.itemName || it.description || '',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        total: it.totalAmount || 0,
      })),
      discountPercent: p.discountPercent || 0,
      taxPercent: p.taxPercent || 0,
      subtotal: p.subtotal || 0,
      totalAmount: p.totalAmount || p.grandTotal || 0,
      notes: p.notes || '',
      terms: p.terms || '',
      documentName: p.documentName,
      documentUrl: p.documentUrl,
      documentSize: p.documentSize,
      createdAt: p.createdAt,
    };
  },

  createProposal: async (data: Partial<LeadProposal> & { [key: string]: any }): Promise<any> => {
    const payload = {
      ...data,
      proposalDate: data.issueDate || data.proposalDate,
    };
    return fetchWithCookies<{ success: boolean; message: string; data: any }>('/leads/proposals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateProposal: async (id: string, data: Partial<LeadProposal> & { [key: string]: any }): Promise<any> => {
    const payload = {
      ...data,
      proposalDate: data.issueDate || data.proposalDate,
    };
    return fetchWithCookies<{ success: boolean; message: string; data: any }>(`/leads/proposals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteProposal: async (id: string): Promise<any> => {
    return fetchWithCookies<{ success: boolean; message: string; data: any }>(`/leads/proposals/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export default leadService;

