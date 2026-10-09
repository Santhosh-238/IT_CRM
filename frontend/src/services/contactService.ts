import {
  Contact,
  ContactFormData,
  ContactFilter,
  ContactPagination,
  ContactStats,
  ContactMetadata,
} from '../types/contact';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchWithCookies<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export const contactService = {
  // Get contacts list with search, filters, pagination, and sorting
  getContacts: async (
    params: ContactFilter = {}
  ): Promise<{ success: boolean; data: Contact[]; pagination: ContactPagination }> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.companyName && params.companyName !== 'All') query.append('companyName', params.companyName);
    if (params.contactType && params.contactType !== 'All') query.append('contactType', params.contactType);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.source && params.source !== 'All') query.append('source', params.source);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.stage && params.stage !== 'All') query.append('stage', params.stage);
    if (params.qualificationStatus && params.qualificationStatus !== 'All') query.append('qualificationStatus', params.qualificationStatus);
    if (params.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params.assignedTo && params.assignedTo !== 'All') query.append('assignedTo', params.assignedTo);
    if (params.assignmentStatus && params.assignmentStatus !== 'All') query.append('assignmentStatus', params.assignmentStatus);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const qs = query.toString();
    const endpoint = `/contacts${qs ? `?${qs}` : ''}`;
    return fetchWithCookies<{ success: boolean; data: Contact[]; pagination: ContactPagination }>(endpoint);
  },

  // Get single contact by ID or contactId (e.g. CNT-1001)
  getContactById: async (id: string): Promise<{ success: boolean; data: Contact }> => {
    return fetchWithCookies<{ success: boolean; data: Contact }>(`/contacts/${encodeURIComponent(id)}`);
  },

  // Get contact statistics & KPI counters
  getContactStats: async (): Promise<{ success: boolean; stats: ContactStats }> => {
    return fetchWithCookies<{ success: boolean; stats: ContactStats }>('/contacts/stats');
  },

  // Get 100% dynamic dropdown metadata
  getContactMetadata: async (): Promise<{ success: boolean; metadata: ContactMetadata }> => {
    return fetchWithCookies<{ success: boolean; metadata: ContactMetadata }>('/contacts/metadata');
  },

  // Create new contact
  createContact: async (data: ContactFormData): Promise<{ success: boolean; message: string; data: Contact }> => {
    return fetchWithCookies<{ success: boolean; message: string; data: Contact }>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update existing contact
  updateContact: async (id: string, data: Partial<ContactFormData>): Promise<{ success: boolean; message: string; data: Contact }> => {
    return fetchWithCookies<{ success: boolean; message: string; data: Contact }>(`/contacts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete contact
  deleteContact: async (id: string): Promise<{ success: boolean; message: string; data: { id: string; contactId: string } }> => {
    return fetchWithCookies<{ success: boolean; message: string; data: { id: string; contactId: string } }>(`/contacts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Quick Assign Contact to Employee
  assignContact: async (
    id: string,
    employeeId: string | null
  ): Promise<{ success: boolean; message: string; data: Contact }> => {
    return fetchWithCookies<{ success: boolean; message: string; data: Contact }>(`/contacts/${encodeURIComponent(id)}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ employeeId }),
    });
  },
};

export default contactService;
