import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Text,
  Button,
  Group,
  TextInput,
  Select,
  Stack,
  Modal,
  useComputedColorScheme,
  ActionIcon,
  UnstyledButton,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconAlertTriangle,
  IconX,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { useContact } from '../../context/ContactContext';
import { Contact } from '../../types/contact';
import { ContactTableView } from './components/ContactTableView';
import { ContactModal } from './components/ContactModal';

type ActiveTabType = 'NEW' | 'ASSIGNED' | 'ALL';

export const ContactsPage: React.FC = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const {
    contacts,
    stats,
    metadata,
    loading,
    filters,
    pagination,
    setFilters,
    setPage,
    deleteContact,
    fetchContacts,
  } = useContact();

  const [activeTab, setActiveTab] = useState<ActiveTabType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_contacts_tab') as ActiveTabType;
      if (saved === 'NEW' || saved === 'ASSIGNED' || saved === 'ALL') {
        return saved;
      }
    }
    return 'ALL';
  });

  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Modal State for Add / Edit Contact Popup
  const [contactModalOpened, setContactModalOpened] = useState<boolean>(false);
  const [modalContact, setModalContact] = useState<Contact | null>(null);

  const [searchInput, setSearchInput] = useState<string>(filters.search || '');

  // Keep filters in sync on initial mount and tab switch
  useEffect(() => {
    if (activeTab === 'NEW') {
      setFilters({ assignmentStatus: 'Unassigned', assignedTo: 'All' });
    } else if (activeTab === 'ASSIGNED') {
      setFilters({ assignmentStatus: 'Assigned', assignedTo: 'All' });
    } else {
      setFilters({ assignmentStatus: 'All', assignedTo: 'All' });
    }
  }, [activeTab]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFilters({ search: searchInput });
  };

  const handleTabChange = (tab: ActiveTabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_contacts_tab', tab);
    }
    if (tab === 'NEW') {
      setFilters({ assignmentStatus: 'Unassigned', assignedTo: 'All' });
    } else if (tab === 'ASSIGNED') {
      setFilters({ assignmentStatus: 'Assigned', assignedTo: 'All' });
    } else {
      setFilters({ assignmentStatus: 'All', assignedTo: 'All' });
    }
  };

  const handleOpenAddModal = () => {
    setModalContact(null);
    setContactModalOpened(true);
  };

  const handleOpenEditModal = (contact: Contact) => {
    setModalContact(contact);
    setContactModalOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await deleteContact(deleteTarget.id);
    setDeleteLoading(false);
    if (res.success) {
      setDeleteTarget(null);
    }
  };

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'New', label: 'New' },
    { value: 'Active', label: 'Active' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Follow-up Required', label: 'Follow-up Required' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Won', label: 'Won' },
    { value: 'Lost', label: 'Lost' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  const sourceOptions = [
    { value: 'All', label: 'All Sources' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Website', label: 'Website' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Cold Call', label: 'Cold Call' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'Other', label: 'Other' },
    ...(metadata?.sources
      ?.filter(
        (s) =>
          !['Social Media', 'Website', 'Referral', 'Cold Call', 'LinkedIn', 'Other'].includes(s)
      )
      .map((s) => ({ value: s, label: s })) || []),
  ];

  const assignedOptions = [
    { value: 'All', label: 'All Assigned' },
    { value: 'Assigned', label: 'Assigned Only' },
    { value: 'Unassigned', label: 'Unassigned Only' },
    ...(metadata?.employees?.map((emp) => ({ value: emp.id, label: emp.name })) || []),
  ];

  const newCount = stats?.unassigned ?? stats?.new ?? 0;
  const assignedCount = stats?.assigned ?? 0;

  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  const totalCount = stats?.total ?? (newCount + assignedCount);

  return (
    <Box p={{ base: 'md', md: 'lg' }} style={{ maxWidth: 1520, margin: '0 auto' }}>
      {/* 1. Header Toolbar */}
      <Paper
        p="md"
        radius="lg"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          {/* Left: Tab Pills (All / New / Assigned) */}
          <Group gap={6}>
            {/* Tab: All */}
            <UnstyledButton
              onClick={() => handleTabChange('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor:
                  activeTab === 'ALL'
                    ? isDark
                      ? '#3B82F6'
                      : '#0F172A'
                    : isDark
                    ? '#1E293B'
                    : '#F1F5F9',
                border:
                  activeTab === 'ALL'
                    ? isDark
                      ? '1px solid #3B82F6'
                      : '1px solid #0F172A'
                    : isDark
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid #E2E8F0',
                color:
                  activeTab === 'ALL'
                    ? '#FFFFFF'
                    : isDark
                    ? '#94A3B8'
                    : '#475569',
                fontWeight: 600,
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
                  borderRadius: '10px',
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor:
                    activeTab === 'ALL'
                      ? 'rgba(255, 255, 255, 0.22)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#E2E8F0',
                  color:
                    activeTab === 'ALL'
                      ? '#FFFFFF'
                      : isDark
                      ? '#CBD5E1'
                      : '#475569',
                }}
              >
                {totalCount}
              </Box>
            </UnstyledButton>

            {/* Tab: New */}
            <UnstyledButton
              onClick={() => handleTabChange('NEW')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor:
                  activeTab === 'NEW'
                    ? isDark
                      ? '#3B82F6'
                      : '#0F172A'
                    : isDark
                    ? '#1E293B'
                    : '#F1F5F9',
                border:
                  activeTab === 'NEW'
                    ? isDark
                      ? '1px solid #3B82F6'
                      : '1px solid #0F172A'
                    : isDark
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid #E2E8F0',
                color:
                  activeTab === 'NEW'
                    ? '#FFFFFF'
                    : isDark
                    ? '#94A3B8'
                    : '#475569',
                fontWeight: 600,
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
                  borderRadius: '10px',
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor:
                    activeTab === 'NEW'
                      ? 'rgba(255, 255, 255, 0.22)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#E2E8F0',
                  color:
                    activeTab === 'NEW'
                      ? '#FFFFFF'
                      : isDark
                      ? '#CBD5E1'
                      : '#475569',
                }}
              >
                {newCount}
              </Box>
            </UnstyledButton>

            {/* Tab: Assigned */}
            <UnstyledButton
              onClick={() => handleTabChange('ASSIGNED')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor:
                  activeTab === 'ASSIGNED'
                    ? isDark
                      ? '#3B82F6'
                      : '#0F172A'
                    : isDark
                    ? '#1E293B'
                    : '#F1F5F9',
                border:
                  activeTab === 'ASSIGNED'
                    ? isDark
                      ? '1px solid #3B82F6'
                      : '1px solid #0F172A'
                    : isDark
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid #E2E8F0',
                color:
                  activeTab === 'ASSIGNED'
                    ? '#FFFFFF'
                    : isDark
                    ? '#94A3B8'
                    : '#475569',
                fontWeight: 600,
                fontSize: 13,
                transition: 'all 0.15s ease',
              }}
            >
              <span>Assigned</span>
              <Box
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: '10px',
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor:
                    activeTab === 'ASSIGNED'
                      ? 'rgba(255, 255, 255, 0.22)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#E2E8F0',
                  color:
                    activeTab === 'ASSIGNED'
                      ? '#FFFFFF'
                      : isDark
                      ? '#CBD5E1'
                      : '#475569',
                }}
              >
                {assignedCount}
              </Box>
            </UnstyledButton>
          </Group>

          {/* Right: Search, Dropdowns, Add Contact */}
          <Group gap="sm" wrap="wrap" align="center">
            {/* Search contacts... */}
            <form onSubmit={handleSearchSubmit}>
              <TextInput
                placeholder="Search contacts..."
                leftSection={<IconSearch size={15} color={isDark ? '#94A3B8' : '#94A3B8'} />}
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
                style={{ width: 190 }}
                styles={{
                  input: {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                    fontSize: 13,
                  },
                }}
              />
            </form>

            {/* All Statuses */}
            <Select
              data={statusOptions}
              value={filters.status || 'All'}
              onChange={(val) => setFilters({ status: val || 'All' })}
              size="sm"
              radius="md"
              style={{ width: 130 }}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                  fontSize: 13,
                },
              }}
            />

            {/* All Sources */}
            <Select
              data={sourceOptions}
              value={filters.source || 'All'}
              onChange={(val) => setFilters({ source: val || 'All' })}
              size="sm"
              radius="md"
              style={{ width: 130 }}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                  fontSize: 13,
                },
              }}
            />

            {/* All Assigned */}
            <Select
              data={assignedOptions}
              value={
                filters.assignedTo && filters.assignedTo !== 'All'
                  ? filters.assignedTo
                  : filters.assignmentStatus && filters.assignmentStatus !== 'All'
                  ? filters.assignmentStatus
                  : 'All'
              }
              onChange={(val) => {
                if (!val || val === 'All') {
                  setFilters({ assignedTo: 'All', assignmentStatus: 'All' });
                } else if (val === 'Assigned' || val === 'Unassigned') {
                  setFilters({ assignmentStatus: val, assignedTo: 'All' });
                } else {
                  setFilters({ assignedTo: val, assignmentStatus: 'All' });
                }
              }}
              size="sm"
              radius="md"
              style={{ width: 140 }}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                  fontSize: 13,
                },
              }}
            />

            {/* + Add Contact Button */}
            <Button
              size="sm"
              radius="md"
              leftSection={<IconPlus size={15} stroke={2.5} />}
              onClick={handleOpenAddModal}
              style={{
                backgroundColor: isDark ? '#3B82F6' : '#0F172A',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 13,
                boxShadow: isDark ? '0 2px 10px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(15, 23, 42, 0.15)',
              }}
            >
              Add Contact
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* 2. Contact Table View */}
      <ContactTableView
        contacts={contacts}
        loading={loading}
        onView={(contact) => handleOpenEditModal(contact)}
        onEdit={(contact) => handleOpenEditModal(contact)}
        onDelete={(contact) => setDeleteTarget(contact)}
        onAddNew={handleOpenAddModal}
      />

      {/* 3. Pagination Footer matching Screenshot */}
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
            Showing {startRecord} to {endRecord} of {pagination.total} contacts
          </Text>

          <Group gap={6} align="center">
            {/* Previous */}
            <Button
              variant="default"
              size="xs"
              radius="md"
              disabled={!pagination.hasPrev}
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
              disabled={!pagination.hasNext}
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

      {/* 4. Modal Popup for Add / Edit Contact */}
      <ContactModal
        opened={contactModalOpened}
        onClose={() => {
          setContactModalOpened(false);
          setModalContact(null);
        }}
        contact={modalContact}
        onSuccess={() => {
          fetchContacts();
        }}
      />

      {/* 5. Delete Confirmation Dialog */}
      <Modal
        opened={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={
          <Group gap="xs">
            <IconAlertTriangle color="#EF4444" size={20} />
            <Text fw={700} size="md" c="red">
              Delete Contact
            </Text>
          </Group>
        }
        centered
        radius="lg"
        padding="lg"
        styles={{
          header: {
            background: isDark ? '#111827' : '#FFFFFF',
          },
          body: {
            background: isDark ? '#111827' : '#FFFFFF',
          },
        }}
      >
        <Stack gap="md">
          <Text size="sm" style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
            Are you sure you want to delete contact{' '}
            <Text span fw={700} c="red">
              {deleteTarget?.name} ({deleteTarget?.contactId})
            </Text>
            ? This action cannot be undone.
          </Text>

          <Group justify="flex-end" gap="sm" mt="sm">
            <Button
              variant="default"
              radius="md"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              color="red"
              radius="md"
              loading={deleteLoading}
              onClick={handleConfirmDelete}
              leftSection={<IconTrash size={15} />}
            >
              Confirm Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default ContactsPage;
