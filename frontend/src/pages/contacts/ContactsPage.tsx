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
  ThemeIcon,
  Badge,
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
import { ContactDrawer } from './components/ContactDrawer';
import { CRM_COLORS } from '../../theme/colors';

type ActiveTabType = 'NEW' | 'ASSIGNED';

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
      if (saved === 'NEW' || saved === 'ASSIGNED') {
        return saved;
      }
    }
    return 'NEW';
  });

  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Modal State for Add / Edit Contact Popup
  const [contactModalOpened, setContactModalOpened] = useState<boolean>(false);
  const [modalContact, setModalContact] = useState<Contact | null>(null);

  // Drawer State for Contact Details View
  const [drawerContact, setDrawerContact] = useState<Contact | null>(null);
  const [drawerOpened, setDrawerOpened] = useState<boolean>(false);

  const [searchInput, setSearchInput] = useState<string>(filters.search || '');

  // Keep filters in sync on initial mount and tab switch
  useEffect(() => {
    if (activeTab === 'NEW') {
      setFilters({ assignmentStatus: 'Unassigned', status: 'All', assignedTo: 'All' });
    } else if (activeTab === 'ASSIGNED') {
      setFilters({ assignmentStatus: 'Assigned', status: 'All', assignedTo: 'All' });
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
      setFilters({ assignmentStatus: 'Unassigned', status: 'All', assignedTo: 'All' });
    } else if (tab === 'ASSIGNED') {
      setFilters({ assignmentStatus: 'Assigned', status: 'All', assignedTo: 'All' });
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

  const handleOpenViewDrawer = (contact: Contact) => {
    setDrawerContact(contact);
    setDrawerOpened(true);
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
    { value: 'Qualified', label: 'Qualified' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Follow-up Required', label: 'Follow-up Required' },
    { value: 'Disqualified', label: 'Disqualified' },
    ...(metadata?.statuses && metadata.statuses.length > 0
      ? metadata.statuses
          .filter((s) => !['Qualified', 'In Progress', 'Follow-up Required', 'Disqualified'].includes(s))
          .map((s) => ({ value: s, label: s }))
      : [
          { value: 'New', label: 'New' },
          { value: 'Active', label: 'Active' },
          { value: 'Won', label: 'Won' },
          { value: 'Lost', label: 'Lost' },
        ]),
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

  const totalCount = stats?.total ?? contacts.length;
  const newCount = stats?.unassigned ?? stats?.new ?? 0;
  const assignedCount = stats?.assigned ?? 0;

  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <Box p={{ base: 'md', md: 'lg' }} style={{ maxWidth: 1520, margin: '0 auto' }}>
      {/* 1. Header Toolbar */}
      <Paper
        p="sm"
        radius="lg"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          {/* Left: Modern Capsule Segmented Tabs */}
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
            {/* Tab: New */}
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
                      ? '#818CF8'
                      : '#4F46E5'
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
                      ? '#4F46E5'
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

            {/* Tab: Assigned */}
            <UnstyledButton
              onClick={() => handleTabChange('ASSIGNED')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'ASSIGNED'
                    ? isDark
                      ? '#0F172A'
                      : '#FFFFFF'
                    : 'transparent',
                boxShadow:
                  activeTab === 'ASSIGNED'
                    ? isDark
                      ? '0 1px 3px rgba(0, 0, 0, 0.4)'
                      : '0 1px 3px rgba(0, 0, 0, 0.08)'
                    : 'none',
                color:
                  activeTab === 'ASSIGNED'
                    ? isDark
                      ? '#60A5FA'
                      : '#2563EB'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B',
                fontWeight: activeTab === 'ASSIGNED' ? 700 : 500,
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
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor:
                    activeTab === 'ASSIGNED'
                      ? '#2563EB'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#E2E8F0',
                  color:
                    activeTab === 'ASSIGNED'
                      ? '#FFFFFF'
                      : isDark
                      ? '#CBD5E1'
                      : '#64748B',
                }}
              >
                {assignedCount}
              </Box>
            </UnstyledButton>
          </Box>

          {/* Right: Search, Filter Selects & Add Button */}
          <Group gap="xs" align="center" wrap="wrap" style={{ flex: 1, justifyContent: 'flex-end' }}>
            {/* Search contacts... */}
            <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 180px', maxWidth: 220, minWidth: 150 }}>
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

            {/* All Statuses */}
            <Select
              data={statusOptions}
              value={filters.status || 'All'}
              onChange={(val) => setFilters({ status: val || 'All' })}
              size="sm"
              radius="md"
              style={{ width: 135 }}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                  fontSize: 13,
                  height: 36,
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
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                  fontSize: 13,
                  height: 36,
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
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                  fontSize: 13,
                  height: 36,
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
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 13,
                height: 36,
                border: 'none',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.15s ease',
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
        onView={handleOpenViewDrawer}
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

      {/* 4. Drawer for Contact Quick View */}
      <ContactDrawer
        opened={drawerOpened}
        onClose={() => {
          setDrawerOpened(false);
          setDrawerContact(null);
        }}
        contact={drawerContact}
        onEdit={(contact) => {
          setDrawerOpened(false);
          handleOpenEditModal(contact);
        }}
        onDelete={(contact) => {
          setDrawerOpened(false);
          setDeleteTarget(contact);
        }}
      />

      {/* 5. Modal Popup for Add / Edit Contact */}
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

      {/* 5. Modern Delete Confirmation Dialog */}
      <Modal
        opened={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        centered
        radius="lg"
        padding="lg"
        withCloseButton={false}
        styles={{
          content: {
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
            boxShadow: isDark
              ? '0 20px 45px -10px rgba(0, 0, 0, 0.6)'
              : '0 20px 45px -10px rgba(0, 0, 0, 0.12)',
            borderRadius: 16,
          },
          body: {
            padding: 24,
          },
        }}
      >
        <Stack gap="md">
          <Group align="flex-start" wrap="nowrap" gap="md">
            <ThemeIcon
              size={44}
              radius="xl"
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                color: '#EF4444',
                flexShrink: 0,
              }}
            >
              <IconAlertTriangle size={22} stroke={2} />
            </ThemeIcon>

            <Box style={{ flex: 1 }}>
              <Text fw={700} size="md" style={{ color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.3 }}>
                Delete Contact
              </Text>
              <Text size="sm" mt={4} style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                Are you sure you want to delete this contact? This action cannot be undone.
              </Text>
            </Box>
          </Group>

          {/* Contact Details Highlight Card */}
          {deleteTarget && (
            <Paper
              p="sm"
              radius="md"
              style={{
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Box style={{ minWidth: 0 }}>
                  <Text fw={600} size="sm" truncate style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}>
                    {deleteTarget.name}
                  </Text>
                  {deleteTarget.email && (
                    <Text size="xs" truncate style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                      {deleteTarget.email}
                    </Text>
                  )}
                </Box>
                <Badge
                  variant="light"
                  color="red"
                  radius="sm"
                  size="sm"
                  style={{ fontWeight: 600, flexShrink: 0 }}
                >
                  {deleteTarget.contactId}
                </Badge>
              </Group>
            </Paper>
          )}

          <Group justify="flex-end" gap="sm" mt="xs">
            <Button
              variant="default"
              radius="md"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
              style={{
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                color: isDark ? '#CBD5E1' : '#475569',
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              radius="md"
              size="sm"
              loading={deleteLoading}
              onClick={handleConfirmDelete}
              leftSection={<IconTrash size={15} stroke={2} />}
              style={{
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                fontWeight: 600,
              }}
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
