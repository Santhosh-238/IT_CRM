import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Lead,
  LeadFormData,
  LeadFilter,
  LeadPagination,
  LeadStats,
  LeadMetadata,
} from '../types/lead';
import { leadService } from '../services/leadService';

interface LeadContextType {
  leads: Lead[];
  stats: LeadStats | null;
  metadata: LeadMetadata | null;
  selectedLead: Lead | null;
  loading: boolean;
  filters: LeadFilter;
  pagination: LeadPagination;

  fetchLeads: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchMetadata: () => Promise<void>;
  setSelectedLead: (lead: Lead | null) => void;
  setFilters: (newFilters: Partial<LeadFilter>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;

  createLead: (data: LeadFormData) => Promise<{ success: boolean; data?: Lead; message?: string }>;
  updateLead: (id: string, data: Partial<LeadFormData>) => Promise<{ success: boolean; data?: Lead; message?: string }>;
  deleteLead: (id: string) => Promise<{ success: boolean; message?: string }>;
}

const defaultPagination: LeadPagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const defaultFilters: LeadFilter = {
  search: '',
  companyName: 'All',
  contactType: 'All',
  category: 'All',
  source: 'All',
  status: 'All',
  stage: 'All',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const defaultMetadata: LeadMetadata = {
  sources: ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Social Media', 'Other'],
  statuses: ['New', 'In Progress', 'Qualified', 'Proposal Sent', 'In Negotiation', 'Complete', 'Lost'],
  stages: ['Initialization', 'Qualification', 'Discovery', 'Requirement Analysis', 'Demo / Presentation', 'Proposal', 'Negotiation', 'Decision Making', 'Won', 'Lost'],
  categories: ['Product', 'Service'],
  contactTypes: ['Individual', 'Company Representative'],
  productOptions: [
    'HRMS',
    'IT CRM',
    'Fintech CRM',
    'Cloud ERP',
    'Custom Enterprise Software',
    'AI & ML Assistant',
    'Mobile Apps',
  ],
  serviceOptions: [
    'Cloud Migration & DevOps',
    'Cybersecurity & Compliance',
    'Custom API & Backend Integration',
    'Full-Stack Web Development',
    'Staff Augmentation',
    'UI/UX Design',
  ],
};

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [metadata, setMetadata] = useState<LeadMetadata | null>(defaultMetadata);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFiltersState] = useState<LeadFilter>(defaultFilters);
  const [pagination, setPagination] = useState<LeadPagination>(defaultPagination);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await leadService.getLeads(filters, {
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res.success) {
        setLeads(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err: any) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await leadService.getLeadStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      console.error('Error fetching lead stats:', err);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await leadService.getLeadMetadata();
      if (res.success && res.metadata) {
        setMetadata((prev) => ({
          ...defaultMetadata,
          ...res.metadata,
        }));
      }
    } catch (err: any) {
      console.error('Error fetching lead metadata:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchStats();
    fetchMetadata();
  }, [fetchStats, fetchMetadata]);

  const setFilters = useCallback((newFilters: Partial<LeadFilter>) => {
    setFiltersState((prev) => {
      const isDifferent = Object.keys(newFilters).some(
        (key) => (prev as any)[key] !== (newFilters as any)[key]
      );
      return isDifferent ? { ...prev, ...newFilters } : prev;
    });
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => (prev.page === page ? prev : { ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => (prev.limit === limit && prev.page === 1 ? prev : { ...prev, limit, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFiltersState((prev) => {
      if (prev.sortBy === sortBy && prev.sortOrder === sortOrder) return prev;
      return { ...prev, sortBy, sortOrder };
    });
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, []);

  const createLead = useCallback(async (data: LeadFormData) => {
    try {
      setLoading(true);
      const res = await leadService.createLead(data);
      if (res.success) {
        notifications.show({
          title: 'Lead Created Successfully',
          message: `${res.data.name} (${res.data.leadId}) has been added to leads.`,
          color: 'teal',
        });
        await Promise.all([fetchLeads(), fetchStats()]);
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Creation failed.' };
    } catch (err: any) {
      notifications.show({
        title: 'Creation Failed',
        message: err.message || 'Could not create lead. Please check your inputs.',
        color: 'red',
      });
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchLeads, fetchStats]);

  const updateLead = useCallback(async (id: string, data: Partial<LeadFormData>) => {
    try {
      setLoading(true);
      const res = await leadService.updateLead(id, data);
      if (res.success) {
        notifications.show({
          title: 'Lead Updated Successfully',
          message: `${res.data.name} (${res.data.leadId}) details have been updated.`,
          color: 'teal',
        });
        await Promise.all([fetchLeads(), fetchStats()]);
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Update failed.' };
    } catch (err: any) {
      notifications.show({
        title: 'Update Failed',
        message: err.message || 'Could not update lead.',
        color: 'red',
      });
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchLeads, fetchStats]);

  const deleteLead = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await leadService.deleteLead(id);
      if (res.success) {
        notifications.show({
          title: 'Lead Removed',
          message: 'Lead record has been removed from the pipeline.',
          color: 'gray',
        });
        await Promise.all([fetchLeads(), fetchStats()]);
        return { success: true };
      }
      return { success: false, message: res.message || 'Delete failed.' };
    } catch (err: any) {
      notifications.show({
        title: 'Delete Failed',
        message: err.message || 'Could not delete lead.',
        color: 'red',
      });
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchLeads, fetchStats]);

  const contextValue = useMemo(
    () => ({
      leads,
      stats,
      metadata,
      selectedLead,
      loading,
      filters,
      pagination,
      fetchLeads,
      fetchStats,
      fetchMetadata,
      setSelectedLead,
      setFilters,
      resetFilters,
      setPage,
      setLimit,
      setSort,
      createLead,
      updateLead,
      deleteLead,
    }),
    [
      leads,
      stats,
      metadata,
      selectedLead,
      loading,
      filters,
      pagination,
      fetchLeads,
      fetchStats,
      fetchMetadata,
      setFilters,
      resetFilters,
      setPage,
      setLimit,
      setSort,
      createLead,
      updateLead,
      deleteLead,
    ]
  );

  return (
    <LeadContext.Provider value={contextValue}>
      {children}
    </LeadContext.Provider>
  );
};

export const useLead = (): LeadContextType => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLead must be used within a LeadProvider');
  }
  return context;
};

export default LeadContext;
