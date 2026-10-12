import React, { useState } from 'react';
import {
  Group,
  TextInput,
  Select,
  Button,
  Box,
  Text,
  ActionIcon,
  Modal,
  Pagination,
  useComputedColorScheme,
  UnstyledButton,
} from '@mantine/core';
import {
  IconSearch,
  IconX,
  IconPlus,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Lead } from '../../types/lead';
import { useLead } from '../../context/LeadContext';
import { LeadTableView } from './components/LeadTableView';
import { LeadModal } from './components/LeadModal';

type ActiveTabType = 'ALL' | 'NEW' | 'IN_PROGRESS' | 'WON';

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
    if (activeTab === 'NEW') {
      setFilters({ status: 'New' });
    }
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
    } else if (tab === 'WON') {
      setFilters({ status: 'Won' });
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

  const statusOptions = ['All', ...(metadata?.statuses || ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'])];
  const sourceOptions = ['All', ...(metadata?.sources || ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Social Media', 'Other'])];
  const categoryOptions = ['All', ...(metadata?.categories || ['Product', 'Service'])];

  const totalCount = stats?.total ?? leads.length;
  const newCount = stats?.new ?? 0;
  const inProgressCount = stats?.inProgress ?? 0;
  const wonCount = stats?.won ?? 0;

  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <Box>
      {/* Top Controls Bar */}
      <Box
        p="sm"
        px="md"
        style={{
          background: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          borderRadius: 16,
        }}
      >
        <Group justify="space-between" wrap="wrap" gap="md" align="center">
          {/* Left: Filter Tabs with Mobile Horizontal Scrolling */}
          <Group
            gap={8}
            wrap="nowrap"
            style={{
              overflowX: 'auto',
              maxWidth: '100%',
              scrollbarWidth: 'none',
              paddingBottom: 2,
              WebkitOverflowScrolling: 'touch',
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
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: activeTab === 'ALL' ? (isDark ? '#374151' : '#0F172A') : 'transparent',
                color: activeTab === 'ALL' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                border: activeTab === 'ALL' ? 'none' : isDark ? '1px solid #374151' : '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
              }}
            >
              <span>All</span>
              <Box
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                  backgroundColor: activeTab === 'ALL' ? 'rgba(255, 255, 255, 0.2)' : isDark ? '#1F2937' : '#F1F5F9',
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
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: activeTab === 'NEW' ? (isDark ? '#374151' : '#0F172A') : 'transparent',
                color: activeTab === 'NEW' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                border: activeTab === 'NEW' ? 'none' : isDark ? '1px solid #374151' : '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
              }}
            >
              <span>New</span>
              <Box
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                  backgroundColor: activeTab === 'NEW' ? 'rgba(255, 255, 255, 0.2)' : isDark ? '#1F2937' : '#F1F5F9',
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
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: activeTab === 'IN_PROGRESS' ? (isDark ? '#374151' : '#0F172A') : 'transparent',
                color: activeTab === 'IN_PROGRESS' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                border: activeTab === 'IN_PROGRESS' ? 'none' : isDark ? '1px solid #374151' : '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
              }}
            >
              <span>In Progress</span>
              <Box
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                  backgroundColor: activeTab === 'IN_PROGRESS' ? 'rgba(255, 255, 255, 0.2)' : isDark ? '#1F2937' : '#F1F5F9',
                }}
              >
                {inProgressCount}
              </Box>
            </UnstyledButton>

            {/* 4. Won */}
            <UnstyledButton
              onClick={() => handleTabChange('WON')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: activeTab === 'WON' ? (isDark ? '#374151' : '#0F172A') : 'transparent',
                color: activeTab === 'WON' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                border: activeTab === 'WON' ? 'none' : isDark ? '1px solid #374151' : '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Won</span>
              <Box
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                  backgroundColor: activeTab === 'WON' ? 'rgba(255, 255, 255, 0.2)' : isDark ? '#1F2937' : '#F1F5F9',
                }}
              >
                {wonCount}
              </Box>
            </UnstyledButton>
          </Group>

          {/* Right: Search, Dropdowns, Add Lead - Mobile Responsive */}
          <Group
            gap="sm"
            wrap="wrap"
            align="center"
            style={{
              flex: '1 1 auto',
              justifyContent: 'flex-end',
            }}
          >
            {/* Search leads */}
            <Box style={{ flex: '1 1 180px', minWidth: 140 }}>
              <form onSubmit={handleSearchSubmit}>
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
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                      fontSize: 13,
                    },
                  }}
                />
              </form>
            </Box>

            {/* Status Dropdown */}
            <Box style={{ flex: '0 1 140px', minWidth: 110 }}>
              <Select
                data={statusOptions}
                value={filters.status || 'All'}
                onChange={(val) => setFilters({ status: val || 'All' })}
                size="sm"
                radius="md"
                styles={{
                  input: {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                    fontSize: 13,
                  },
                }}
              />
            </Box>

            {/* Add Lead Button */}
            <Button
              radius="md"
              size="sm"
              leftSection={<IconPlus size={16} stroke={2.5} />}
              onClick={handleOpenAddModal}
              style={{
                backgroundColor: isDark ? '#374151' : '#0F172A',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 13,
                height: 36,
                padding: '0 16px',
                whiteSpace: 'nowrap',
              }}
            >
              + Add Lead
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Table Content */}
      <LeadTableView
        leads={leads}
        onEdit={handleOpenEditModal}
        onDelete={(lead) => setDeleteTarget(lead)}
        onAddNew={handleOpenAddModal}
        loading={loading}
      />

      {/* Pagination Footer */}
      {pagination.total > 0 && (
        <Group justify="space-between" mt="md" px="xs" wrap="wrap">
          <Text size="sm" c="dimmed">
            Showing {startRecord} to {endRecord} of {pagination.total} leads
          </Text>
          <Pagination
            value={pagination.page}
            onChange={(newPage) => setPage(newPage)}
            total={pagination.totalPages}
            radius="md"
            size="sm"
            color="dark"
          />
        </Group>
      )}

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
