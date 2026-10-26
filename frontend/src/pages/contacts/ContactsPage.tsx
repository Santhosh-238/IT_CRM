import React, { useState, useEffect, useMemo } from 'react';
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
  IconBuilding,
  IconUser,
} from '@tabler/icons-react';
import { useContact } from '../../context/ContactContext';
import { useCRM } from '../../context/CRMContext';
import { Contact } from '../../types/contact';
import { ContactTableView } from './components/ContactTableView';
import { ContactModal } from './components/ContactModal';
import { ContactDrawer } from './components/ContactDrawer';
import { CRM_COLORS } from '../../theme/colors';
import {
  DateFilterControl,
  DateFilterValue,
  DEFAULT_DATE_FILTER,
  isDateMatchingFilter,
} from '../../components/common/DateFilterControl';

type ActiveTabType = 'NEW' | 'ASSIGNED';

export const ContactsPage: React.FC = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { setActiveNav, currentUser } = useCRM();
  const isSuperAdmin = currentUser?.role?.toUpperCase() === 'SUPER_ADMIN' || currentUser?.role?.toUpperCase() === 'SUPER ADMIN';
  const isAdmin = isSuperAdmin;

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
    fetchStats,
    setSelectedContact,
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

  const [searchInput, setSearchInput] = useState<string>(filters.search || '');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(DEFAULT_DATE_FILTER);

  // Filter contacts by date (day-wise and month-wise) and scope contacts for non-admins (own data only)
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (!isAdmin) {
        const myName = currentUser?.name?.toLowerCase().trim();
        const myEmail = currentUser?.email?.toLowerCase().trim();
        const myId = currentUser?.id?.toLowerCase().trim();

        if (activeTab === 'NEW' || c.assignmentStatus === 'Unassigned') {
          // Employee sees unassigned contacts created by themselves
          const creator = (c.createdBy || '').toLowerCase().trim();
          const isMine =
            (myName && creator === myName) ||
            (myEmail && creator === myEmail) ||
            (myId && creator === myId);
          if (!isMine) return false;
        } else if (activeTab === 'ASSIGNED' || c.assignmentStatus === 'Assigned') {
          // Employee sees contacts assigned to them
          const assignedName = (c.assignedToName || '').toLowerCase().trim();
          const assignedId = (c.assignedTo || '').toLowerCase().trim();
          const isAssignedToMe =
            (myName && assignedName && (assignedName === myName || assignedName.includes(myName) || myName.includes(assignedName))) ||
            (myId && assignedId === myId) ||
            (myEmail && assignedId === myEmail);
          if (!isAssignedToMe) return false;
        }
      }

      // Status filter matching (checks both status and qualificationStatus)
      if (filters.status && filters.status !== 'All') {
        const s = filters.status.toLowerCase().trim();
        const contactStatus = (c.status || '').toLowerCase().trim();
        const qualStatus = (c.qualificationStatus || '').toLowerCase().trim();
        const matchesStatus =
          contactStatus === s ||
          qualStatus === s ||
          (s === 'disqualified' && (qualStatus === 'unqualified' || contactStatus === 'unqualified')) ||
          (s === 'unqualified' && (qualStatus === 'disqualified' || contactStatus === 'disqualified'));
        if (!matchesStatus) return false;
      }

      // Source filter matching
      if (filters.source && filters.source !== 'All') {
        const s = filters.source.toLowerCase().trim();
        const contactSource = (c.source || '').toLowerCase().trim();
        if (contactSource !== s) return false;
      }

      return isDateMatchingFilter(c.updatedAt || c.createdAt, dateFilter);
    });
  }, [contacts, dateFilter, isAdmin, currentUser, activeTab, filters.status, filters.source]);

  // Keep filters in sync on initial mount and tab switch
  useEffect(() => {
    if (activeTab === 'ASSIGNED') {
      const assignedTarget = !isAdmin && currentUser?.name ? currentUser.name : 'All';
      setFilters({ assignmentStatus: 'Assigned', status: 'All', assignedTo: assignedTarget, sortBy: 'updatedAt', sortOrder: 'desc' });
    } else {
      setFilters({ assignmentStatus: 'Unassigned', status: 'All', assignedTo: 'All', sortBy: 'updatedAt', sortOrder: 'desc' });
    }
  }, [activeTab, isAdmin, currentUser?.name]);

  // Fresh load on mount to immediately view contacts without page refresh
  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [fetchContacts, fetchStats]);

  // Listen to contacts update event across CRM components
  useEffect(() => {
    const handleUpdated = () => {
      fetchContacts();
      fetchStats();
    };
    window.addEventListener('crm_contacts_updated', handleUpdated);
    return () => {
      window.removeEventListener('crm_contacts_updated', handleUpdated);
    };
  }, [fetchContacts, fetchStats]);

  // Real-time debounced search so typing immediately filters contacts
  useEffect(() => {
    const handler = setTimeout(() => {
      if ((filters.search || '') !== searchInput) {
        setFilters({ search: searchInput });
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFilters({ search: searchInput });
  };

  const handleTabChange = (tab: ActiveTabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_contacts_tab', tab);
    }
    if (tab === 'ASSIGNED') {
      const assignedTarget = !isAdmin && currentUser?.name ? currentUser.name : 'All';
      setFilters({ assignmentStatus: 'Assigned', status: 'All', assignedTo: assignedTarget, sortBy: 'updatedAt', sortOrder: 'desc' });
    } else {
      setFilters({ assignmentStatus: 'Unassigned', status: 'All', assignedTo: 'All', sortBy: 'updatedAt', sortOrder: 'desc' });
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

  const handleOpenViewDetails = (contact: Contact) => {
    setSelectedContact(contact);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_selected_contact', JSON.stringify(contact));
    }
    setActiveNav('contact-details');
  };

  const handleOpenQualification = (contact: Contact) => {
    setSelectedContact(contact);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_qualifying_contact', JSON.stringify(contact));
    }
    setActiveNav('contact-qualification');
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

  const assignedOptions = useMemo(() => {
    if (!isAdmin) {
      return [
        { value: currentUser?.name || 'Assigned', label: 'My Assigned Contacts' },
        { value: 'Unassigned', label: 'Unassigned Only' },
      ];
    }
    return [
      { value: 'All', label: 'All Assigned' },
      ...(currentUser?.name ? [{ value: currentUser.name, label: `Assigned to Me (${currentUser.name})` }] : []),
      { value: 'Assigned', label: 'Assigned Only' },
      { value: 'Unassigned', label: 'Unassigned Only' },
      ...(metadata?.employees?.map((emp) => ({ value: emp.id, label: emp.name })) || []),
    ];
  }, [isAdmin, currentUser, metadata?.employees]);

  const totalCount = stats?.total ?? contacts.length;
  const newCount = useMemo(() => {
    if (isAdmin) return stats?.unassigned ?? stats?.new ?? 0;
    if (stats?.unassigned !== undefined) return stats.unassigned;
    const myName = currentUser?.name?.toLowerCase().trim();
    const myEmail = currentUser?.email?.toLowerCase().trim();
    const myId = currentUser?.id?.toLowerCase().trim();
    return contacts.filter((c) =>
      c.assignmentStatus === 'Unassigned' &&
      (((c.createdBy || '').toLowerCase().trim() === myName) ||
       ((c.createdBy || '').toLowerCase().trim() === myEmail) ||
       ((c.createdBy || '').toLowerCase().trim() === myId))
    ).length;
  }, [isAdmin, stats?.unassigned, stats?.new, contacts, currentUser]);

  const assignedCount = useMemo(() => {
    if (isAdmin) return stats?.assigned ?? 0;
    if (stats?.assigned !== undefined) return stats.assigned;
    const myName = currentUser?.name?.toLowerCase().trim();
    return contacts.filter((c) =>
      c.assignmentStatus === 'Assigned' &&
      ((myName && c.assignedToName?.toLowerCase().trim() === myName) || c.assignedTo === currentUser?.id)
    ).length;
  }, [isAdmin, stats?.assigned, contacts, currentUser]);

  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <Box p={{ base: 'xs', sm: 'sm', md: 'md' }} style={{ width: '100%', maxWidth: '100%' }}>
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
        <Group justify="space-between" align="center" wrap="nowrap" gap={8}>
          {/* Left: Modern Capsule Segmented Tabs */}
          <Box
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              padding: 2.5,
              borderRadius: 10,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
              flexShrink: 0,
            }}
          >


            {/* Tab: New */}
            <UnstyledButton
              onClick={() => handleTabChange('NEW')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 11px',
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
                gap: 6,
                padding: '5px 11px',
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

          {/* Right: Search, Filter Selects & Add Button (All in Single Row) */}
          <Group gap={6} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* Search contacts... */}
            <form onSubmit={handleSearchSubmit} style={{ width: 160 }}>
              <TextInput
                placeholder="Search contacts..."
                leftSection={<IconSearch size={14} color="#94A3B8" />}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setFilters({ search: searchInput });
                  }
                }}
                onBlur={() => setFilters({ search: searchInput })}
                size="sm"
                radius="md"
                styles={{
                  input: {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                    fontSize: 12.5,
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
              style={{ width: 122 }}
              comboboxProps={{ width: 195, position: 'bottom-start', withinPortal: true, shadow: 'md' }}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                  fontSize: 12.5,
                  height: 36,
                },
                option: {
                  fontSize: 12.5,
                  padding: '7px 12px',
                  whiteSpace: 'nowrap',
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
              style={{ width: 118 }}
              comboboxProps={{ width: 175, position: 'bottom-start', withinPortal: true, shadow: 'md' }}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                  fontSize: 12.5,
                  height: 36,
                },
                option: {
                  fontSize: 12.5,
                  padding: '7px 12px',
                  whiteSpace: 'nowrap',
                },
              }}
            />

            {/* All Assigned (Admin Only) */}
            {isAdmin && (
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
                style={{ width: 165 }}
                comboboxProps={{ width: 220, position: 'bottom-start', withinPortal: true, shadow: 'md' }}
                styles={{
                  input: {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                    fontSize: 12.5,
                    height: 36,
                  },
                  option: {
                    fontSize: 12.5,
                    padding: '7px 12px',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            )}

            {/* Date Filter: Day-wise & Month-wise */}
            <DateFilterControl value={dateFilter} onChange={setDateFilter} width={112} />

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
                fontSize: 12.5,
                height: 36,
                padding: '0 14px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Add Contact
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* 2. Contact Table View */}
      <ContactTableView
        contacts={filteredContacts}
        activeTab={activeTab}
        loading={loading}
        onView={handleOpenViewDetails}
        onEdit={(contact) => handleOpenEditModal(contact)}
        onDelete={(contact) => setDeleteTarget(contact)}
        onAddNew={handleOpenAddModal}
        onQualify={handleOpenQualification}
        onTabChange={handleTabChange}
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
            Showing {startRecord} to {Math.min(endRecord, filteredContacts.length)} of {dateFilter.type !== 'ALL' ? filteredContacts.length : pagination.total} contacts
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
          handleTabChange('NEW');
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
