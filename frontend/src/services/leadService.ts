import {
  Lead,
  LeadFormData,
  LeadFilter,
  LeadPagination,
  LeadStats,
  LeadMetadata,
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
};

export default leadService;
