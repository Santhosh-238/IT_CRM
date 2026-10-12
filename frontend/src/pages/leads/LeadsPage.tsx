import React, { useState } from 'react';
import {
  Group,
  TextInput,
  Button,
  Box,
  Text,
  ActionIcon,
  Modal,
  Paper,
  useComputedColorScheme,
  UnstyledButton,
} from '@mantine/core';
import {
  IconSearch,
  IconX,
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { Lead } from '../../types/lead';
import { useLead } from '../../context/LeadContext';
import { LeadTableView } from './components/LeadTableView';
import { LeadModal } from './components/LeadModal';

type ActiveTabType = 'ALL' | 'NEW' | 'IN_PROGRESS' | 'COMPLETE';

export const LeadsPage: React.FC = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const {
    leads,
    stats,
    metadata,
    loading,
    filters,
    pagination,
    setFilters,
    setPage,
    deleteLead,
    fetchLeads,
    fetchStats,
  } = useLead();

  const [activeTab, setActiveTab] = useState<ActiveTabType>(() => {
    try {
      const savedTab = sessionStorage.getItem('crm_leads_tab');
      if (savedTab === 'NEW') {
        sessionStorage.removeItem('crm_leads_tab');
        return 'NEW';
      }
    } catch (e) {}
    return 'ALL';
  });

  React.useEffect(() => {
    try {
      const savedTab = sessionStorage.getItem('crm_leads_tab');
      if (savedTab === 'NEW') {
        sessionStorage.removeItem('crm_leads_tab');
        setActiveTab('NEW');
        setFilters({ status: 'New' });
      }
    } catch (e) {}
    fetchLeads();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');

  const handleTabChange = (tab: ActiveTabType) => {
    setActiveTab(tab);
    if (tab === 'NEW') {
      setFilters({ status: 'New' });
    } else if (tab === 'IN_PROGRESS') {
      setFilters({ status: 'In Progress' });
    } else if (tab === 'COMPLETE') {
      setFilters({ status: 'Complete' });
    } else {
      setFilters({ status: 'All' });
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFilters({ search: searchInput });
  };

  const handleOpenAddModal = () => {
    setSelectedLeadForEdit(null);
    setModalOpened(true);
  };

  const handleOpenEditModal = (lead: Lead) => {
    setSelectedLeadForEdit(lead);
    setModalOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteLead(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalCount = stats?.total ?? leads.length;
  const newCount = stats?.new ?? 0;
  const inProgressCount = stats?.inProgress ?? 0;
  const completedCount = stats?.complete ?? stats?.completed ?? stats?.won ?? 0;

  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <Box p={{ base: 'md', md: 'lg' }} style={{ maxWidth: 1520, margin: '0 auto' }}>
      {/* Top Controls Bar - Modern Toolbar Card matching Contacts Page */}
      <Paper
        p="sm"
        radius="lg"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <Group justify="space-between" wrap="wrap" gap="sm" align="center">
          {/* Left: Capsule Segmented Tabs */}
          <Box
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              padding: 3,
              borderRadius: 10,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
            }}
          >
            {/* 1. All */}
            <UnstyledButton
              onClick={() => handleTabChange('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'ALL'
                    ? isDark
                      ? '#0F172A'
                      : '#FFFFFF'
                    : 'transparent',
                boxShadow:
                  activeTab === 'ALL'
                    ? isDark
                      ? '0 1px 3px rgba(0, 0, 0, 0.4)'
                      : '0 1px 3px rgba(0, 0, 0, 0.08)'
                    : 'none',
                color:
                  activeTab === 'ALL'
                    ? isDark
                      ? '#818CF8'
                      : '#4F46E5'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B',
                fontWeight: activeTab === 'ALL' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s ease',
              }}
            >
              <span>All</span>
              <Box
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor:
                    activeTab === 'ALL'
                      ? '#4F46E5'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#E2E8F0',
                  color:
                    activeTab === 'ALL'
                      ? '#FFFFFF'
                      : isDark
                      ? '#CBD5E1'
                      : '#64748B',
                }}
              >
                {totalCount}
              </Box>
            </UnstyledButton>

            {/* 2. New */}
            <UnstyledButton
              onClick={() => handleTabChange('NEW')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'NEW'
                    ? isDark
                      ? '#0F172A'
                      : '#FFFFFF'
                    : 'transparent',
                boxShadow:
                  activeTab === 'NEW'
                    ? isDark
                      ? '0 1px 3px rgba(0, 0, 0, 0.4)'
                      : '0 1px 3px rgba(0, 0, 0, 0.08)'
                    : 'none',
                color:
                  activeTab === 'NEW'
                    ? isDark
                      ? '#60A5FA'
                      : '#2563EB'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B',
                fontWeight: activeTab === 'NEW' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s ease',
              }}
            >
              <span>New</span>
              <Box
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor:
                    activeTab === 'NEW'
                      ? '#2563EB'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#E2E8F0',
                  color:
                    activeTab === 'NEW'
                      ? '#FFFFFF'
                      : isDark
                      ? '#CBD5E1'
                      : '#64748B',
                }}
              >
                {newCount}
              </Box>
            </UnstyledButton>

            {/* 3. In Progress */}
            <UnstyledButton
              onClick={() => handleTabChange('IN_PROGRESS')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'IN_PROGRESS'
                    ? isDark
                      ? '#0F172A'
                      : '#FFFFFF'
                    : 'transparent',
                boxShadow:
                  activeTab === 'IN_PROGRESS'
                    ? isDark
                      ? '0 1px 3px rgba(0, 0, 0, 0.4)'
                      : '0 1px 3px rgba(0, 0, 0, 0.08)'
                    : 'none',
                color:
                  activeTab === 'IN_PROGRESS'
                    ? isDark
                      ? '#F59E0B'
                      : '#D97706'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B',
                fontWeight: activeTab === 'IN_PROGRESS' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s ease',
              }}
            >
              <span>In Progress</span>
              <Box
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor:
                    activeTab === 'IN_PROGRESS'
                      ? '#D97706'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#E2E8F0',
                  color:
                    activeTab === 'IN_PROGRESS'
                      ? '#FFFFFF'
                      : isDark
                      ? '#CBD5E1'
                      : '#64748B',
                }}
              >
                {inProgressCount}
              </Box>
            </UnstyledButton>

            {/* 4. Complete */}
            <UnstyledButton
              onClick={() => handleTabChange('COMPLETE')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'COMPLETE'
                    ? isDark
                      ? '#0F172A'
                      : '#FFFFFF'
                    : 'transparent',
                boxShadow:
                  activeTab === 'COMPLETE'
                    ? isDark
                      ? '0 1px 3px rgba(0, 0, 0, 0.4)'
                      : '0 1px 3px rgba(0, 0, 0, 0.08)'
                    : 'none',
                color:
                  activeTab === 'COMPLETE'
                    ? isDark
                      ? '#34D399'
                      : '#059669'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B',
                fontWeight: activeTab === 'COMPLETE' ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s ease',
              }}
            >
              <span>Complete</span>
              <Box
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor:
                    activeTab === 'COMPLETE'
                      ? '#059669'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#E2E8F0',
                  color:
                    activeTab === 'COMPLETE'
                      ? '#FFFFFF'
                      : isDark
                      ? '#CBD5E1'
                      : '#64748B',
                }}
              >
                {completedCount}
              </Box>
            </UnstyledButton>
          </Box>

          {/* Right: Search, Filter Selects & Add Button */}
          <Group gap="xs" align="center" wrap="wrap" style={{ flex: 1, justifyContent: 'flex-end' }}>
            {/* Search leads... */}
            <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 180px', maxWidth: 220, minWidth: 150 }}>
              <TextInput
                placeholder="Search leads..."
                leftSection={<IconSearch size={15} color="#94A3B8" />}
                rightSection={
                  searchInput ? (
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      onClick={() => {
                        setSearchInput('');
                        setFilters({ search: '' });
                      }}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  ) : null
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={() => setFilters({ search: searchInput })}
                size="sm"
                radius="md"
                styles={{
                  input: {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                    fontSize: 13,
                    height: 36,
                  },
                }}
              />
            </form>

          </Group>
        </Group>
      </Paper>

      {/* Table Content */}
      <LeadTableView
        leads={leads}
        onEdit={handleOpenEditModal}
        onDelete={(lead) => setDeleteTarget(lead)}
        loading={loading}
      />

      {/* Pagination Footer matching Contacts page */}
      <Paper
        mt="md"
        p="sm"
        radius="lg"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap">
          <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
            Showing {startRecord} to {endRecord} of {pagination.total} leads
          </Text>

          <Group gap={6} align="center">
            {/* Previous */}
            <Button
              variant="default"
              size="xs"
              radius="md"
              disabled={pagination.page <= 1}
              onClick={() => setPage(pagination.page - 1)}
              leftSection={<IconChevronLeft size={13} />}
              style={{
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Previous
            </Button>

            {/* Page number pill */}
            <Box
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 28,
                height: 28,
                padding: '0 6px',
                borderRadius: 6,
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                color: isDark ? '#F8FAFC' : '#0F172A',
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {pagination.page}
            </Box>

            <Text size="12px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              of {pagination.totalPages || 1}
            </Text>

            {/* Next */}
            <Button
              variant="default"
              size="xs"
              radius="md"
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() => setPage(pagination.page + 1)}
              rightSection={<IconChevronRight size={13} />}
              style={{
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Next
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Add / Edit Modal */}
      <LeadModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        lead={selectedLeadForEdit}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        opened={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={
          <Group gap="xs">
            <IconAlertTriangle color="#EF4444" size={20} />
            <Text fw={700}>Delete Lead Record</Text>
          </Group>
        }
        centered
        radius="lg"
      >
        <Text size="sm" c="dimmed" mb="lg">
          Are you sure you want to delete lead{' '}
          <Text span fw={700} c={isDark ? 'white' : 'dark'}>
            {deleteTarget?.name} ({deleteTarget?.leadId})
          </Text>
          ? This action cannot be undone.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirmDelete} loading={deleteLoading}>
            Delete Permanently
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default LeadsPage;
