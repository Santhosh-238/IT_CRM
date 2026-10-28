import React, { useState } from 'react';
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
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconUserCheck,
  IconUserX,
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

export type ContactTableActiveTab = 'NEW' | 'ASSIGNED';

interface ContactTableViewProps {
  contacts: Contact[];
  activeTab?: ContactTableActiveTab;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onAddNew: () => void;
  onQualify?: (contact: Contact) => void;
  loading?: boolean;
  onTabChange?: (tab: ContactTableActiveTab) => void;
}

export const ContactTableView: React.FC<ContactTableViewProps> = ({
  contacts,
  activeTab,
  onView,
  onEdit,
  onDelete,
  onAddNew,
  onQualify,
  loading = false,
  onTabChange,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const isMobile = useMediaQuery('(max-width: 820px)');
  const { setActiveNav, currentUser } = useCRM();
  const { setSelectedContact, metadata, assignContact } = useContact();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const roleUpper = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPER ADMIN';
  const isAdmin = isSuperAdmin;

  const handleMoveToAssigned = async (contact: Contact) => {
    try {
      setAssigningId(contact.id);
      const myEmp = metadata?.employees?.find(
        (e) =>
          (currentUser?.email && e.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
          (currentUser?.name && e.name?.toLowerCase() === currentUser.name?.toLowerCase()) ||
          (currentUser?.id && e.id === currentUser.id)
      );
      const targetEmpId = myEmp?.id || currentUser?.id || currentUser?.name || 'me';
      await assignContact(contact.id, targetEmpId);
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
    const st = (statusVal || stageVal || 'New').trim();
    const sLow = st.toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (sLow.includes('unqual') || sLow.includes('disqual') || sLow.includes('lost') || sLow.includes('cancel')) {
      bg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#DC2626';
      border = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
    } else if (sLow.includes('qualif')) {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (sLow.includes('follow') || sLow.includes('follow-up')) {
      bg = isDark ? 'rgba(249, 115, 22, 0.16)' : '#FFF7ED';
      color = isDark ? '#FB923C' : '#C2410C';
      border = isDark ? 'rgba(249, 115, 22, 0.35)' : '#FFEDD5';
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
    } else if (sLow.includes('new') || sLow.includes('init') || sLow.includes('active')) {
      bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
      color = isDark ? '#93C5FD' : '#1D4ED8';
      border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';
    }

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
        {st}
      </Box>
    );
  };

  // Determine canonical contact display status (Prioritizes 'New' for freshly created contacts)
  const getContactDisplayStatus = (c: Contact) => {
    if (c.status === 'New' || c.qualificationStatus === 'New' || (!c.status && !c.qualificationStatus)) {
      return 'New';
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
    return c.status || c.qualificationStatus || 'New';
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
        {contacts.map((contact) => (
          <Paper
            key={contact.id}
            p="md"
            radius="16px"
            style={{
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
              <Box style={{ flexShrink: 0 }}>
                {renderStatusBadge(getContactDisplayStatus(contact), contact.stage)}
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
              <Group gap={6} align="center" wrap="nowrap">
                {contact.assignedToName ? (
                  <Badge size="xs" variant="light" color="blue">
                    👤 {contact.assignedToName}
                  </Badge>
                ) : !isAdmin ? (
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    radius="xl"
                    loading={assigningId === contact.id}
                    leftSection={<IconArrowRight size={11} stroke={2.2} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveToAssigned(contact);
                    }}
                    styles={{
                      root: {
                        height: 24,
                        paddingLeft: 8,
                        paddingRight: 8,
                        fontSize: 10.5,
                        fontWeight: 600,
                      },
                    }}
                  >
                    Move to Assigned
                  </Button>
                ) : (
                  <Badge size="xs" variant="outline" color="gray">
                    Unassigned
                  </Badge>
                )}
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
        ))}
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
      <Box style={{ overflowX: 'auto' }}>
        <Table
          verticalSpacing="md"
          horizontalSpacing="md"
          highlightOnHover
          style={{
            minWidth: 960,
            width: '100%',
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
              <Table.Th style={{ minWidth: 130, color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                NAME
              </Table.Th>
              <Table.Th style={{ minWidth: 125, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                COMPANY
              </Table.Th>
              <Table.Th style={{ minWidth: 125, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                CONTACT PERSON
              </Table.Th>
              <Table.Th style={{ minWidth: 150, color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                EMAIL
              </Table.Th>
              <Table.Th style={{ minWidth: 115, color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                PHONE NUMBER
              </Table.Th>
              <Table.Th style={{ minWidth: 135, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                ASSIGNED OWNER
              </Table.Th>
              <Table.Th style={{ minWidth: 110, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                STATUS
              </Table.Th>
              <Table.Th style={{ width: 75, minWidth: 75, textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
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

              return (
                <React.Fragment key={contact.id}>
                  <Table.Tr
                    style={{
                      transition: 'background 0.12s ease',
                      borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #F1F5F9',
                    }}
                  >
                    {/* 1. NAME */}
                    <Table.Td style={{ minWidth: 130 }}>
                      <Text
                        fw={700}
                        size="sm"
                        style={{
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {contact.name}
                      </Text>
                    </Table.Td>

                    {/* 2. COMPANY */}
                    <Table.Td style={{ minWidth: 125 }}>
                      <Text
                        size="13px"
                        fw={600}
                        style={{
                          color: isDark ? '#F8FAFC' : '#1E293B',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {contact.companyName || '—'}
                      </Text>
                    </Table.Td>

                    {/* 3. CONTACT PERSON */}
                    <Table.Td style={{ minWidth: 125 }}>
                      <Text
                        size="13px"
                        style={{
                          color: isDark ? '#CBD5E1' : '#334155',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {contact.contactPerson || '—'}
                      </Text>
                    </Table.Td>

                    {/* 4. EMAIL */}
                    <Table.Td style={{ minWidth: 150, whiteSpace: 'nowrap' }}>
                      <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap' }}>
                        {contact.email || '—'}
                      </Text>
                    </Table.Td>

                    {/* 5. PHONE NUMBER */}
                    <Table.Td style={{ minWidth: 115, whiteSpace: 'nowrap' }}>
                      <Text size="13px" fw={500} style={{ color: isDark ? '#CBD5E1' : '#334155', whiteSpace: 'nowrap' }}>
                        {contact.phone || '—'}
                      </Text>
                    </Table.Td>

                    {/* 6. ASSIGNED OWNER: Quick Assign (Super Admin / Admin Only) or Static Badge / Move Button (Employee) */}
                    <Table.Td
                      style={{ minWidth: 135, whiteSpace: 'nowrap' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isAdmin ? (
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
                                {assigningId === contact.id ? (
                                  <Badge
                                    radius="xl"
                                    styles={{
                                      root: {
                                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                                        color: isDark ? '#94A3B8' : '#64748B',
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
                                        fontSize: 11,
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
                                    {contact.assignedToName}
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
                                        padding: '4px 8px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        cursor: 'pointer',
                                      },
                                    }}
                                  >
                                    <IconUserPlus size={11} />
                                    + Assign
                                  </Badge>
                                )}
                              </UnstyledButton>
                            </Tooltip>
                          </Menu.Target>

                          <Menu.Dropdown p="xs" onClick={(e) => e.stopPropagation()}>
                            <Menu.Label>Assign to Team Member</Menu.Label>
                            {metadata?.employees && metadata.employees.length > 0 ? (
                              metadata.employees.map((emp) => (
                                <Menu.Item
                                  key={emp.id}
                                  leftSection={
                                    <IconUserCheck
                                      size={14}
                                      color={contact.assignedTo === emp.id ? '#10B981' : undefined}
                                    />
                                  }
                                  rightSection={
                                    contact.assignedTo === emp.id ? (
                                      <Badge size="xs" color="teal" variant="light">
                                        Current
                                      </Badge>
                                    ) : undefined
                                  }
                                  onClick={async () => {
                                    try {
                                      setAssigningId(contact.id);
                                      await assignContact(contact.id, emp.id);
                                    } finally {
                                      setAssigningId(null);
                                    }
                                  }}
                                >
                                  <Box>
                                    <Text size="13px" fw={contact.assignedTo === emp.id ? 700 : 500}>
                                      {emp.name}
                                    </Text>
                                    {emp.designation && (
                                      <Text size="10px" c="dimmed">
                                        {emp.designation} {emp.empCode ? `(${emp.empCode})` : ''}
                                      </Text>
                                    )}
                                  </Box>
                                </Menu.Item>
                              ))
                            ) : (
                              <Menu.Item disabled>No employees available</Menu.Item>
                            )}

                            {contact.assignedTo && (
                              <>
                                <Menu.Divider />
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconUserX size={14} />}
                                  onClick={async () => {
                                    try {
                                      setAssigningId(contact.id);
                                      await assignContact(contact.id, null);
                                    } finally {
                                      setAssigningId(null);
                                    }
                                  }}
                                >
                                  Unassign Contact
                                </Menu.Item>
                              </>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      ) : (
                        /* Non-Admin Employee: Static assigned badge or Move to Assigned button */
                        contact.assignedToName ? (
                          <Badge
                            radius="xl"
                            styles={{
                              root: {
                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                                color: isDark ? '#93C5FD' : '#1D4ED8',
                                border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE',
                                fontWeight: 600,
                                fontSize: 11,
                                textTransform: 'none',
                                padding: '4px 10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                              },
                            }}
                          >
                            <IconUserCheck size={12} stroke={2.2} />
                            {contact.assignedToName}
                          </Badge>
                        ) : (
                          <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            radius="xl"
                            loading={assigningId === contact.id}
                            leftSection={<IconArrowRight size={12} stroke={2.2} />}
                            onClick={() => handleMoveToAssigned(contact)}
                            styles={{
                              root: {
                                height: 26,
                                paddingLeft: 10,
                                paddingRight: 10,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                                color: isDark ? '#93C5FD' : '#2563EB',
                                border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE',
                                '&:hover': {
                                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#DBEAFE',
                                },
                              },
                            }}
                          >
                            Move to Assigned
                          </Button>
                        )
                      )}
                    </Table.Td>



                    {/* 7. STATUS */}
                    <Table.Td style={{ minWidth: 110, whiteSpace: 'nowrap' }}>
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
                            {renderStatusBadge(getContactDisplayStatus(contact), contact.stage)}
                          </UnstyledButton>
                        </Tooltip>
                      ) : (
                        renderStatusBadge(getContactDisplayStatus(contact), contact.stage)
                      )}
                    </Table.Td>

                    {/* 8. ACTIONS */}
                    <Table.Td style={{ width: 100, minWidth: 100, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <Group gap={4} justify="center" wrap="nowrap">
                        {isAssigned && (
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
                        )}

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
