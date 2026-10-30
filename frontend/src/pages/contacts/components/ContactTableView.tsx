import React, { useState, useEffect } from 'react';
import {
  Table,
  Group,
  Text,
  Badge,
  ActionIcon,
  Paper,
  Stack,
  Center,
  Button,
  Tooltip,
  useComputedColorScheme,
  Box,
  UnstyledButton,
  Menu,
  Loader,
  SimpleGrid,
  ScrollArea,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconUserCheck,
  IconUserX,
  IconChevronDown,
  IconBrandLinkedin,
  IconWorld,
  IconShare,
  IconPhoneCall,
  IconUsers,
  IconBuilding,
  IconPhone,
  IconMail,
  IconBrandWhatsapp,
  IconShieldCheck,
  IconTargetArrow,
  IconUser,
  IconCalendar,
  IconArrowRight,
} from '@tabler/icons-react';
import { Contact } from '../../../types/contact';
import { useContact } from '../../../context/ContactContext';
import { useCRM } from '../../../context/CRMContext';
import { useEmployee } from '../../../context/EmployeeContext';

export type ContactTableActiveTab = 'BULK_IMPORT' | 'NEW' | 'ASSIGNED';

interface ContactTableViewProps {
  contacts: Contact[];
  activeTab?: ContactTableActiveTab;
  onView: (contact: Contact) => void;
  onRowClick?: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onAddNew: () => void;
  onQualify?: (contact: Contact) => void;
  loading?: boolean;
  onTabChange?: (tab: ContactTableActiveTab) => void;
  onContactUpdated?: (contact: Contact) => void;
}

export const ContactTableView: React.FC<ContactTableViewProps> = ({
  contacts,
  activeTab,
  onView,
  onRowClick,
  onEdit,
  onDelete,
  onAddNew,
  onQualify,
  loading = false,
  onTabChange,
  onContactUpdated,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const isMobile = useMediaQuery('(max-width: 820px)');
  const { setActiveNav, currentUser } = useCRM();
  const { setSelectedContact, metadata, assignContact } = useContact();
  const { employees: contextEmployees, fetchEmployees } = useEmployee();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    if (!contextEmployees || contextEmployees.length === 0) {
      fetchEmployees();
    }
  }, [contextEmployees, fetchEmployees]);

  const availableEmployees =
    contextEmployees && contextEmployees.length > 0
      ? contextEmployees
      : (metadata?.employees || []);

  const roleUpper = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPER ADMIN';
  const isAdmin = isSuperAdmin || roleUpper === 'ADMIN' || roleUpper === 'MANAGEMENT';

  const handleAssignOwner = async (contact: Contact, targetId: string | null) => {
    try {
      const contactTargetId = contact.id || contact.contactId;
      if (!contactTargetId) return;
      setAssigningId(contactTargetId);

      const res = await assignContact(contactTargetId, targetId);
      if (res && res.success && res.data) {
        onContactUpdated?.(res.data);
      }
    } catch (err: any) {
      console.error('Failed to assign contact owner:', err);
    } finally {
      setAssigningId(null);
    }
  };

  const handleMoveToAssigned = async (contact: Contact) => {
    try {
      const contactTargetId = contact.id || contact.contactId;
      if (!contactTargetId) return;
      setAssigningId(contactTargetId);
      const myEmp = availableEmployees.find(
        (e) =>
          (currentUser?.email && e.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
          (currentUser?.name && e.name?.toLowerCase() === currentUser.name?.toLowerCase()) ||
          (currentUser?.id && e.id === currentUser.id)
      );
      const targetEmpId = myEmp?.id || currentUser?.id || currentUser?.name || 'me';
      const res = await assignContact(contactTargetId, targetEmpId);
      if (res && res.success && res.data) {
        onContactUpdated?.(res.data);
      }
    } catch (err: any) {
      console.error('Failed to move contact to assigned:', err);
    } finally {
      setAssigningId(null);
    }
  };

  const formatLastUpdate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleOpenQualification = (contact: Contact) => {
    setSelectedContact(contact);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_qualifying_contact', JSON.stringify(contact));
    }
    setActiveNav('contact-qualification');
  };

  // 1. Sleek Modern SOURCE Badge (Ultra Clean Pill Design)
  const renderSourceBadge = (source?: string | null) => {
    const s = (source || 'Direct').trim();
    let bg = isDark ? 'rgba(148, 163, 184, 0.12)' : '#F1F5F9';
    let color = isDark ? '#CBD5E1' : '#475569';
    let border = isDark ? 'rgba(148, 163, 184, 0.2)' : '#E2E8F0';
    let icon = <IconWorld size={13} stroke={2} />;

    const sLow = s.toLowerCase();
    if (sLow.includes('linkedin')) {
      bg = isDark ? 'rgba(10, 102, 194, 0.16)' : '#EFF6FF';
      color = isDark ? '#93C5FD' : '#0A66C2';
      border = isDark ? 'rgba(10, 102, 194, 0.28)' : '#BFDBFE';
      icon = <IconBrandLinkedin size={13} stroke={2.2} />;
    } else if (sLow.includes('social')) {
      bg = isDark ? 'rgba(147, 51, 234, 0.14)' : '#FAF5FF';
      color = isDark ? '#D8B4FE' : '#7E22CE';
      border = isDark ? 'rgba(147, 51, 234, 0.25)' : '#E9D5FF';
      icon = <IconShare size={12} stroke={2} />;
    } else if (sLow.includes('referral')) {
      bg = isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0';
      icon = <IconUsers size={12} stroke={2} />;
    } else if (sLow.includes('call')) {
      bg = isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB';
      color = isDark ? '#FCD34D' : '#B45309';
      border = isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A';
      icon = <IconPhoneCall size={12} stroke={2} />;
    } else if (sLow.includes('web')) {
      bg = isDark ? 'rgba(14, 165, 233, 0.14)' : '#F0F9FF';
      color = isDark ? '#7DD3FC' : '#0369A1';
      border = isDark ? 'rgba(14, 165, 233, 0.25)' : '#BAE6FD';
      icon = <IconWorld size={13} stroke={2} />;
    }

    return (
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 100,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {icon}
        <span>{s}</span>
      </Box>
    );
  };

  // 2. Sleek Modern STATUS Badge
  const renderStatusBadge = (statusVal?: string | null, stageVal?: string | null) => {
    const st = (statusVal || stageVal || 'Not Connected').trim();
    const sLow = st.toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (sLow.includes('not connected') || sLow.includes('not-connected') || sLow === 'new') {
      bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
      color = isDark ? '#93C5FD' : '#1D4ED8';
      border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';
    } else if (sLow.includes('unqual') || sLow.includes('disqual') || sLow.includes('lost') || sLow.includes('cancel') || sLow.includes('not interested') || sLow.includes('failed')) {
      bg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#DC2626';
      border = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
    } else if (sLow.includes('qualif') || (sLow.includes('interested') && !sLow.includes('not'))) {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (sLow.includes('follow') || sLow.includes('follow-up')) {
      bg = isDark ? 'rgba(249, 115, 22, 0.16)' : '#FFF7ED';
      color = isDark ? '#FB923C' : '#C2410C';
      border = isDark ? 'rgba(249, 115, 22, 0.35)' : '#FFEDD5';
    } else if (sLow.includes('replied')) {
      bg = isDark ? 'rgba(20, 184, 166, 0.16)' : '#F0FDFA';
      color = isDark ? '#2DD4BF' : '#0D9488';
      border = isDark ? 'rgba(20, 184, 166, 0.35)' : '#99F6E4';
    } else if (sLow.includes('sent')) {
      bg = isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF';
      color = isDark ? '#A5B4FC' : '#4F46E5';
      border = isDark ? 'rgba(99, 102, 241, 0.35)' : '#C7D2FE';
    } else if (sLow.includes('draft')) {
      bg = isDark ? 'rgba(148, 163, 184, 0.16)' : '#F8FAFC';
      color = isDark ? '#94A3B8' : '#64748B';
      border = isDark ? 'rgba(148, 163, 184, 0.35)' : '#CBD5E1';
    } else if (sLow.includes('progress')) {
      bg = isDark ? 'rgba(14, 165, 233, 0.16)' : '#F0F9FF';
      color = isDark ? '#7DD3FC' : '#0284C7';
      border = isDark ? 'rgba(14, 165, 233, 0.35)' : '#BAE6FD';
    } else if (sLow.includes('won') || sLow.includes('complete')) {
      bg = isDark ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7';
      color = isDark ? '#86EFAC' : '#15803D';
      border = isDark ? 'rgba(34, 197, 94, 0.4)' : '#86EFAC';
    } else if (sLow.includes('hold') || sLow.includes('pend')) {
      bg = isDark ? 'rgba(234, 179, 8, 0.16)' : '#FEFCE8';
      color = isDark ? '#FACC15' : '#A16207';
      border = isDark ? 'rgba(234, 179, 8, 0.35)' : '#FEF08A';
    } else if (sLow.includes('init') || sLow.includes('active')) {
      bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
      color = isDark ? '#93C5FD' : '#1D4ED8';
      border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';
    }

    const displayLabel = sLow === 'new' ? 'Not Connected' : st;

    return (
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 12px',
          borderRadius: 100,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {displayLabel}
      </Box>
    );
  };

  // Determine canonical contact display status (Default is 'Not Connected' for uncontacted/new contacts)
  const getContactDisplayStatus = (c: Contact) => {
    if (
      c.status === 'Not Connected' ||
      c.status === 'New' ||
      c.qualificationStatus === 'New' ||
      (!c.status && !c.qualificationStatus)
    ) {
      return 'Not Connected';
    }
    if (c.qualificationStatus === 'Qualified' || c.status === 'Qualified') {
      return 'Qualified';
    }
    if (
      c.qualificationStatus === 'Unqualified' ||
      c.qualificationStatus === 'Disqualified' ||
      c.status === 'Unqualified' ||
      c.status === 'Disqualified'
    ) {
      return 'Unqualified';
    }
    if (c.qualificationStatus === 'Follow-up Required' || c.status === 'Follow-up Required') {
      return 'Follow-up Required';
    }
    if (c.qualificationStatus === 'Pending' || c.status === 'Pending') {
      return 'Pending';
    }
    return c.status || c.qualificationStatus || 'Not Connected';
  };



  if (!loading && contacts.length === 0) {
    return (
      <Paper
        p="3.5rem"
        radius="lg"
        style={{
          background: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          textAlign: 'center',
          marginTop: 16,
        }}
      >
        <Center>
          <Stack align="center" gap="sm">
            <Box
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#60A5FA' : '#0F172A',
              }}
            >
              <IconUserPlus size={32} stroke={1.8} />
            </Box>
            <Text fw={700} size="lg" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              No Contacts Found
            </Text>
            <Text size="sm" c="dimmed" style={{ maxWidth: 420 }}>
              No contact records match your current view or filter criteria.
            </Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  if (isMobile) {
    return (
      <Stack gap="sm" mt="md">
        {contacts.map((contact) => {
          const displayStatus = getContactDisplayStatus(contact);
          const sLow = displayStatus.toLowerCase();
          const isNotInterestedOrUnqualified =
            sLow.includes('not interested') ||
            sLow.includes('not-interested') ||
            sLow.includes('unqual') ||
            sLow.includes('disqual');

          const reasonParts = [
            contact.remarks,
            contact.description,
            contact.unqualifiedReason,
            (contact as any).disqualificationReason,
            contact.notes,
          ]
            .map((s) => (s ? String(s).trim() : ''))
            .filter(Boolean);

          const uniqueReason = reasonParts.filter((v, i, a) => a.indexOf(v) === i).join(' • ');

          return (
          <Paper
            key={contact.id}
            p="md"
            radius="16px"
            onClick={() => {
              if (onRowClick) {
                onRowClick(contact);
              } else {
                onView(contact);
              }
            }}
            style={{
              cursor: 'pointer',
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              boxShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Header: Initial Avatar + Name + Designation + Status Badge */}
            <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
              <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                <Box
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {(contact.name || 'C').charAt(0).toUpperCase()}
                </Box>
                <Box style={{ minWidth: 0, flex: 1 }}>
                  <Text fw={700} size="sm" truncate style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                    {contact.name || '—'}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {contact.designation || contact.profession || contact.contactType || '—'}
                  </Text>
                </Box>
              </Group>
              <Box style={{ flexShrink: 0, textAlign: 'right' }}>
                {renderStatusBadge(displayStatus, contact.stage)}
                {isNotInterestedOrUnqualified && uniqueReason && (
                  <Text
                    size="11px"
                    style={{
                      color: isDark ? '#F87171' : '#DC2626',
                      fontWeight: 500,
                      maxWidth: 130,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontStyle: 'italic',
                      marginTop: 2,
                    }}
                  >
                    {uniqueReason}
                  </Text>
                )}
              </Box>
            </Group>

            {/* Details Grid */}
            <SimpleGrid cols={2} spacing="xs" mb="xs" style={{ fontSize: 12 }}>
              {contact.companyName && (
                <Group gap={5} wrap="nowrap">
                  <IconBuilding size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="xs" truncate style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                    {contact.companyName}
                  </Text>
                </Group>
              )}
              {contact.contactPerson && (
                <Group gap={5} wrap="nowrap">
                  <IconUser size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="xs" truncate style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                    {contact.contactPerson}
                  </Text>
                </Group>
              )}
              {contact.phone && (
                <Group gap={5} wrap="nowrap">
                  <IconPhone size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="xs" style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                    {contact.phone}
                  </Text>
                </Group>
              )}
              {contact.email && (
                <Group gap={5} wrap="nowrap">
                  <IconMail size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="xs" truncate style={{ color: '#2563EB' }}>
                    {contact.email}
                  </Text>
                </Group>
              )}
              {contact.estimatedValue && (
                <Group gap={5} wrap="nowrap">
                  <Text size="xs" fw={600} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                    Est: {contact.estimatedValue.startsWith('₹') ? contact.estimatedValue : `₹ ${contact.estimatedValue}`}
                  </Text>
                </Group>
              )}
              {contact.expectedCloseDate && (
                <Group gap={5} wrap="nowrap">
                  <IconCalendar size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Close: {contact.expectedCloseDate}
                  </Text>
                </Group>
              )}
            </SimpleGrid>

            {/* Footer: Assigned Employee + Source + Action Icons */}
            <Group justify="space-between" align="center" pt="xs" style={{ borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9' }}>
              <Group gap={6} align="center" wrap="nowrap" onClick={(e) => e.stopPropagation()}>
                <Menu
                  shadow="lg"
                  width={230}
                  position="bottom-start"
                  radius="md"
                  withinPortal
                >
                  <Menu.Target>
                    <UnstyledButton style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                      {assigningId === (contact.id || contact.contactId) ? (
                        <Badge size="xs" radius="xl">
                          <Loader size={10} color="blue" /> Assigning...
                        </Badge>
                      ) : contact.assignedToName ? (
                        <Badge size="xs" variant="light" color="blue" radius="xl" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconUserCheck size={11} stroke={2.2} />
                          <span>{contact.assignedToName}</span>
                          <IconChevronDown size={10} stroke={2} style={{ opacity: 0.7 }} />
                        </Badge>
                      ) : (
                        <Badge size="xs" variant="outline" color="blue" radius="xl" style={{ borderStyle: 'dashed', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconUserPlus size={11} stroke={2.2} />
                          <span>+ Assign</span>
                          <IconChevronDown size={9} stroke={2} style={{ opacity: 0.7 }} />
                        </Badge>
                      )}
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown p="xs">
                    <Menu.Label>ASSIGNED OWNER</Menu.Label>
                    <Menu.Item
                      leftSection={<IconUserCheck size={14} color="#0284C7" stroke={2.2} />}
                      onClick={() => handleAssignOwner(contact, 'me')}
                    >
                      <Text size="12px" fw={600}>Assigned for Me</Text>
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Label>EMPLOYEES LIST</Menu.Label>
                    <ScrollArea.Autosize mah={180} type="scroll">
                      {availableEmployees && availableEmployees.length > 0 ? (
                        availableEmployees.map((emp) => (
                          <Menu.Item
                            key={emp.id}
                            leftSection={<IconUserCheck size={13} color={contact.assignedTo === emp.id ? '#10B981' : undefined} />}
                            onClick={() => handleAssignOwner(contact, emp.id)}
                          >
                            <Text size="12px" fw={contact.assignedTo === emp.id ? 700 : 500}>{emp.name}</Text>
                          </Menu.Item>
                        ))
                      ) : (
                        <Menu.Item disabled>No employees available</Menu.Item>
                      )}
                    </ScrollArea.Autosize>
                    {contact.assignedToName && (
                      <>
                        <Menu.Divider />
                        <Menu.Item color="red" leftSection={<IconUserX size={13} />} onClick={() => handleAssignOwner(contact, null)}>
                          <Text size="12px" fw={600}>Unassign Owner</Text>
                        </Menu.Item>
                      </>
                    )}
                  </Menu.Dropdown>
                </Menu>
                {contact.source && renderSourceBadge(contact.source)}
              </Group>

              <Group gap={4} onClick={(e) => e.stopPropagation()}>
                <Tooltip label="Edit Contact">
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    radius="md"
                    color="indigo"
                    onClick={() => onEdit(contact)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete Contact">
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    radius="md"
                    color="red"
                    onClick={() => onDelete(contact)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Paper>
        );
      })}
      </Stack>
    );
  }

  return (
    <Paper
      radius="lg"
      style={{
        background: isDark ? '#111827' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 1px 4px rgba(0,0,0,0.03)',
        marginTop: 16,
      }}
    >
      <Box
        style={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Table
          verticalSpacing="sm"
          horizontalSpacing="xs"
          highlightOnHover
          style={{
            width: '100%',
            minWidth: 760,
            userSelect: 'none',
          }}
        >
          <Table.Thead
            style={{
              background: isDark ? '#0F172A' : '#FBFBFC',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
            }}
          >
            <Table.Tr>
              <Table.Th style={{ width: 95, minWidth: 90, color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                ID
              </Table.Th>
              <Table.Th style={{ minWidth: 110, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                COMPANY
              </Table.Th>
              <Table.Th style={{ minWidth: 105, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                CONTACT PERSON
              </Table.Th>
              <Table.Th style={{ minWidth: 120, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                EMAIL
              </Table.Th>
              <Table.Th style={{ minWidth: 100, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                PHONE NUMBER
              </Table.Th>
              <Table.Th style={{ minWidth: 110, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                ASSIGNED OWNER
              </Table.Th>
              <Table.Th style={{ width: 110, minWidth: 100, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                STATUS
              </Table.Th>
              <Table.Th style={{ width: 85, minWidth: 85, textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                ACTIONS
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {contacts.map((contact) => {
              const isAssigned =
                contact.assignmentStatus === 'Assigned' ||
                (contact.assignedTo && contact.assignedTo !== 'Unassigned') ||
                Boolean(contact.assignedToName);

              const displayStatus = getContactDisplayStatus(contact);
              const sLow = displayStatus.toLowerCase();
              const isNotInterestedOrUnqualified =
                sLow.includes('not interested') ||
                sLow.includes('not-interested') ||
                sLow.includes('unqual') ||
                sLow.includes('disqual');

              const reasonParts = [
                contact.remarks,
                contact.description,
                contact.unqualifiedReason,
                (contact as any).disqualificationReason,
                contact.notes,
              ]
                .map((s) => (s ? String(s).trim() : ''))
                .filter(Boolean);

              const uniqueReason = reasonParts.filter((v, i, a) => a.indexOf(v) === i).join(' • ');

              return (
                <React.Fragment key={contact.id}>
                  <Table.Tr
                    onClick={() => {
                      if (onRowClick) {
                        onRowClick(contact);
                      } else {
                        onView(contact);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                      borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #F1F5F9',
                    }}
                  >
                    {/* 1. ID */}
                    <Table.Td style={{ width: 95, minWidth: 90 }}>
                      <Text
                        fw={700}
                        size="sm"
                        style={{
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          fontFamily: 'monospace',
                        }}
                      >
                        {contact.contactId || contact.bulkId || (contact.id ? (contact.id.startsWith('CNT-') || contact.id.startsWith('BLK-') ? contact.id : ((contact as any).isBulkImport ? `BLK-${contact.id.slice(0, 4).toUpperCase()}` : `CNT-${contact.id.slice(0, 4).toUpperCase()}`)) : '—')}
                      </Text>
                    </Table.Td>

                    {/* 2. COMPANY */}
                    <Table.Td style={{ minWidth: 110 }}>
                      <Text
                        size="13px"
                        fw={600}
                        truncate
                        style={{
                          color: isDark ? '#F8FAFC' : '#1E293B',
                          maxWidth: 160,
                        }}
                      >
                        {contact.companyName || '—'}
                      </Text>
                    </Table.Td>

                    {/* 3. CONTACT PERSON */}
                    <Table.Td style={{ minWidth: 105 }}>
                      <Text
                        size="13px"
                        truncate
                        style={{
                          color: isDark ? '#CBD5E1' : '#334155',
                          maxWidth: 140,
                        }}
                      >
                        {contact.contactPerson || contact.name || '—'}
                      </Text>
                    </Table.Td>

                    {/* 4. EMAIL */}
                    <Table.Td style={{ minWidth: 120 }}>
                      <Text
                        size="13px"
                        truncate
                        style={{
                          color: isDark ? '#94A3B8' : '#64748B',
                          maxWidth: 170,
                        }}
                      >
                        {contact.email || '—'}
                      </Text>
                    </Table.Td>

                    {/* 5. PHONE NUMBER */}
                    <Table.Td style={{ minWidth: 100, whiteSpace: 'nowrap' }}>
                      <Text size="13px" fw={500} style={{ color: isDark ? '#CBD5E1' : '#334155', whiteSpace: 'nowrap' }}>
                        {contact.phone || '—'}
                      </Text>
                    </Table.Td>

                    {/* 6. ASSIGNED OWNER: Quick Assign dropdown matching bulk import batches */}
                    <Table.Td
                      style={{ minWidth: 125, whiteSpace: 'nowrap' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Menu
                        shadow="lg"
                        width={230}
                        position="bottom-start"
                        radius="md"
                        withinPortal
                      >
                        <Menu.Target>
                          <Tooltip
                            label={
                              contact.assignedToName
                                ? `Assigned to ${contact.assignedToName} (Click to change)`
                                : 'Click to assign employee'
                            }
                            withArrow
                            position="top"
                          >
                            <UnstyledButton
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.12s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.04)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              {assigningId === (contact.id || contact.contactId) ? (
                                <Badge
                                  radius="xl"
                                  styles={{
                                    root: {
                                      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                                      color: isDark ? '#93C5FD' : '#64748B',
                                      padding: '4px 10px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                    },
                                  }}
                                >
                                  <Loader size={12} color="blue" />
                                  Assigning...
                                </Badge>
                              ) : contact.assignedToName ? (
                                <Badge
                                  radius="xl"
                                  styles={{
                                    root: {
                                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                                      color: isDark ? '#93C5FD' : '#1D4ED8',
                                      border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE',
                                      fontWeight: 600,
                                      fontSize: 11.5,
                                      textTransform: 'none',
                                      padding: '4px 10px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      cursor: 'pointer',
                                    },
                                  }}
                                >
                                  <IconUserCheck size={12} stroke={2.2} />
                                  <span>{contact.assignedToName}</span>
                                  <IconChevronDown size={11} stroke={2} style={{ opacity: 0.7 }} />
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  radius="xl"
                                  styles={{
                                    root: {
                                      borderStyle: 'dashed',
                                      borderColor: isDark ? '#60A5FA' : '#3B82F6',
                                      color: isDark ? '#93C5FD' : '#2563EB',
                                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#EFF6FF',
                                      fontWeight: 600,
                                      fontSize: 11,
                                      textTransform: 'none',
                                      padding: '4px 9px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      cursor: 'pointer',
                                    },
                                  }}
                                >
                                  <IconUserPlus size={11} stroke={2.2} />
                                  <span>+ Assign</span>
                                  <IconChevronDown size={10} stroke={2} style={{ opacity: 0.7 }} />
                                </Badge>
                              )}
                            </UnstyledButton>
                          </Tooltip>
                        </Menu.Target>

                        <Menu.Dropdown p="xs" onClick={(e) => e.stopPropagation()}>
                          <Menu.Label>ASSIGNED OWNER</Menu.Label>

                          {/* 1. Assign to Me / Assigned for Me option */}
                          <Menu.Item
                            leftSection={<IconUserCheck size={15} color="#0284C7" stroke={2.2} />}
                            rightSection={
                              (currentUser?.name &&
                                contact.assignedToName &&
                                contact.assignedToName.toLowerCase() === currentUser.name.toLowerCase()) ||
                              (currentUser?.id && contact.assignedTo === currentUser.id) ? (
                                <Badge size="xs" color="teal" variant="light">
                                  Current
                                </Badge>
                              ) : undefined
                            }
                            onClick={() => handleAssignOwner(contact, 'me')}
                          >
                            <Box>
                              <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                Assigned for Me
                              </Text>
                              <Text size="11px" c="dimmed">
                                {currentUser?.name ? `${currentUser.name} (You)` : 'Assign to currently logged-in account'}
                              </Text>
                            </Box>
                          </Menu.Item>

                          <Menu.Divider />
                          <Menu.Label>EMPLOYEES LIST</Menu.Label>

                          <ScrollArea.Autosize mah={200} type="scroll">
                            {availableEmployees && availableEmployees.length > 0 ? (
                              availableEmployees.map((emp) => {
                                const isCurrent =
                                  contact.assignedTo === emp.id ||
                                  contact.assignedTo === emp.empCode ||
                                  (contact.assignedToName &&
                                    contact.assignedToName.toLowerCase() === emp.name.toLowerCase());
                                return (
                                  <Menu.Item
                                    key={emp.id}
                                    leftSection={
                                      <IconUserCheck
                                        size={14}
                                        color={isCurrent ? '#10B981' : undefined}
                                      />
                                    }
                                    rightSection={
                                      isCurrent ? (
                                        <Badge size="xs" color="teal" variant="light">
                                          Current
                                        </Badge>
                                      ) : undefined
                                    }
                                    onClick={() => handleAssignOwner(contact, emp.id)}
                                  >
                                    <Box>
                                      <Text size="13px" fw={isCurrent ? 700 : 500}>
                                        {emp.name}
                                      </Text>
                                      {(emp.designation || emp.department || emp.empCode) && (
                                        <Text size="10.5px" c="dimmed">
                                          {[emp.designation, emp.empCode ? `(${emp.empCode})` : '']
                                            .filter(Boolean)
                                            .join(' ')}
                                        </Text>
                                      )}
                                    </Box>
                                  </Menu.Item>
                                );
                              })
                            ) : (
                              <Menu.Item disabled>No employees available</Menu.Item>
                            )}
                          </ScrollArea.Autosize>

                          {contact.assignedToName && (
                            <>
                              <Menu.Divider />
                              <Menu.Item
                                color="red"
                                leftSection={<IconUserX size={14} />}
                                onClick={() => handleAssignOwner(contact, null)}
                              >
                                <Text size="12.5px" fw={600}>
                                  Unassign Owner
                                </Text>
                              </Menu.Item>
                            </>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>



                    {/* 7. STATUS */}
                    <Table.Td style={{ minWidth: 110, verticalAlign: 'middle' }}>
                      <Stack gap={2} align="flex-start" justify="center">
                        {isAssigned ? (
                          <Tooltip label="Click to open Qualification Screen" withArrow position="top">
                            <UnstyledButton
                              onClick={(e) => {
                                e.stopPropagation();
                                onQualify?.(contact);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.12s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.04)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              {renderStatusBadge(displayStatus, contact.stage)}
                            </UnstyledButton>
                          </Tooltip>
                        ) : (
                          renderStatusBadge(displayStatus, contact.stage)
                        )}

                        {isNotInterestedOrUnqualified && uniqueReason && (
                          <Tooltip label={uniqueReason} multiline maw={280} withArrow position="bottom-start">
                            <Text
                              size="11px"
                              style={{
                                color: isDark ? '#F87171' : '#DC2626',
                                fontWeight: 500,
                                maxWidth: 140,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontStyle: 'italic',
                                lineHeight: 1.25,
                              }}
                            >
                              {uniqueReason}
                            </Text>
                          </Tooltip>
                        )}
                      </Stack>
                    </Table.Td>

                    {/* 8. ACTIONS */}
                    <Table.Td style={{ width: 85, minWidth: 85, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <Group gap={4} justify="center" wrap="nowrap">
                        <Tooltip label="Qualify Contact" withArrow>
                          <ActionIcon
                            variant="light"
                            size="sm"
                            radius="md"
                            color="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQualify?.(contact);
                            }}
                          >
                            <IconTargetArrow size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Edit Contact" withArrow>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            radius="md"
                            color="indigo"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(contact);
                            }}
                          >
                            <IconEdit size={15} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Delete Contact" withArrow>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            radius="md"
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(contact);
                            }}
                          >
                            <IconTrash size={15} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                </React.Fragment>
              );
            })}
          </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
};

export default ContactTableView;
