import React from 'react';
import {
  Table,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Paper,
  Stack,
  Center,
  Button,
  Tooltip,
  useComputedColorScheme,
  Box,
  UnstyledButton,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconChevronDown,
  IconCheck,
  IconUserX,
  IconUserCheck,
  IconBrandLinkedin,
  IconWorld,
  IconShare,
  IconPhoneCall,
  IconUsers,
  IconLayersSubtract,
} from '@tabler/icons-react';
import { Contact } from '../../../types/contact';
import { useContact } from '../../../context/ContactContext';
import { useCRM } from '../../../context/CRMContext';
import { IconTarget } from '@tabler/icons-react';

interface ContactTableViewProps {
  contacts: Contact[];
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onAddNew: () => void;
  loading?: boolean;
}

export const ContactTableView: React.FC<ContactTableViewProps> = ({
  contacts,
  onEdit,
  onDelete,
  onAddNew,
  loading = false,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { setActiveNav } = useCRM();
  const { metadata, assignContact, updateContact, setSelectedContact } = useContact();

  const getInitials = (name?: string) => {
    if (!name) return 'CT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
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

  const handleAssign = async (contactId: string, employeeId: string | null) => {
    await assignContact(contactId, employeeId);
  };

  const handleOpenQualification = (contact: Contact) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_qualifying_contact', JSON.stringify(contact));
    }
    setSelectedContact(contact);
    setActiveNav('contact-qualification');
  };

  const handleUpdateStage = async (contact: Contact, stage: string) => {
    if (stage === 'Qualification') {
      handleOpenQualification(contact);
      return;
    }
    await updateContact(contact.id, { stage });
  };

  const handleUpdateStatus = async (contactId: string, status: string) => {
    await updateContact(contactId, { status });
  };

  // 1. Sleek Modern SOURCE Badge
  const renderSourceBadge = (source?: string | null) => {
    const s = (source || 'Direct').trim();
    let bg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC';
    let color = isDark ? '#CBD5E1' : '#475569';
    let border = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';
    let icon = <IconWorld size={12} />;

    if (s.toLowerCase().includes('linkedin')) {
      bg = isDark ? 'rgba(10, 102, 194, 0.18)' : '#EFF6FF';
      color = isDark ? '#93C5FD' : '#0A66C2';
      border = isDark ? 'rgba(10, 102, 194, 0.35)' : '#BFDBFE';
      icon = <IconBrandLinkedin size={13} stroke={2.2} />;
    } else if (s.toLowerCase().includes('social')) {
      bg = isDark ? 'rgba(147, 51, 234, 0.18)' : '#FAF5FF';
      color = isDark ? '#D8B4FE' : '#7E22CE';
      border = isDark ? 'rgba(147, 51, 234, 0.35)' : '#E9D5FF';
      icon = <IconShare size={12} />;
    } else if (s.toLowerCase().includes('referral')) {
      bg = isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#059669';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
      icon = <IconUsers size={12} />;
    } else if (s.toLowerCase().includes('call')) {
      bg = isDark ? 'rgba(245, 158, 11, 0.18)' : '#FFFBEB';
      color = isDark ? '#FCD34D' : '#D97706';
      border = isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A';
      icon = <IconPhoneCall size={12} />;
    } else if (s.toLowerCase().includes('web')) {
      bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#F0F9FF';
      color = isDark ? '#93C5FD' : '#0284C7';
      border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BAE6FD';
      icon = <IconWorld size={12} />;
    }

    return (
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 9px',
          borderRadius: 6,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {icon}
        <span>{s}</span>
      </Box>
    );
  };

  // 2. Sleek Modern STAGE Badge
  const renderStageBadge = (stage?: string | null) => {
    const st = (stage || 'Qualification').trim();
    const sLow = st.toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (sLow.includes('qualif')) {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (sLow.includes('disco')) {
      bg = isDark ? 'rgba(14, 165, 233, 0.16)' : '#F0F9FF';
      color = isDark ? '#7DD3FC' : '#0284C7';
      border = isDark ? 'rgba(14, 165, 233, 0.35)' : '#BAE6FD';
    } else if (sLow.includes('requir')) {
      bg = isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF';
      color = isDark ? '#A5B4FC' : '#4338CA';
      border = isDark ? 'rgba(99, 102, 241, 0.35)' : '#C7D2FE';
    } else if (sLow.includes('propos')) {
      bg = isDark ? 'rgba(217, 119, 6, 0.16)' : '#FFFBEB';
      color = isDark ? '#FCD34D' : '#B45309';
      border = isDark ? 'rgba(217, 119, 6, 0.35)' : '#FDE68A';
    } else if (sLow.includes('negot')) {
      bg = isDark ? 'rgba(234, 88, 12, 0.16)' : '#FFF7ED';
      color = isDark ? '#FDBA74' : '#C2410C';
      border = isDark ? 'rgba(234, 88, 12, 0.35)' : '#FFEDD5';
    } else if (sLow.includes('demo') || sLow.includes('present')) {
      bg = isDark ? 'rgba(168, 85, 247, 0.16)' : '#FAF5FF';
      color = isDark ? '#D8B4FE' : '#7E22CE';
      border = isDark ? 'rgba(168, 85, 247, 0.35)' : '#E9D5FF';
    } else if (sLow.includes('decis')) {
      bg = isDark ? 'rgba(236, 72, 153, 0.16)' : '#FDF2F8';
      color = isDark ? '#F472B6' : '#BE185D';
      border = isDark ? 'rgba(236, 72, 153, 0.35)' : '#FCE7F3';
    } else if (sLow.includes('contra') || sLow.includes('agree')) {
      bg = isDark ? 'rgba(20, 184, 166, 0.16)' : '#F0FDFA';
      color = isDark ? '#5EEAD4' : '#0F766E';
      border = isDark ? 'rgba(20, 184, 166, 0.35)' : '#CCFBF1';
    } else if (sLow.includes('won')) {
      bg = isDark ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7';
      color = isDark ? '#86EFAC' : '#15803D';
      border = isDark ? 'rgba(34, 197, 94, 0.4)' : '#86EFAC';
    } else if (sLow.includes('lost')) {
      bg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#B91C1C';
      border = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
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

  // 3. Sleek Modern STATUS Badge with Indicator Dot
  const renderStatusBadge = (status?: string | null) => {
    const s = (status || 'New').trim();
    const sLow = s.toLowerCase();
    let bg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC';
    let color = isDark ? '#CBD5E1' : '#334155';
    let border = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0';
    let dotColor = '#94A3B8';

    if (sLow === 'new') {
      bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
      color = isDark ? '#93C5FD' : '#1D4ED8';
      border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';
      dotColor = '#2563EB';
    } else if (sLow === 'active') {
      bg = isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4';
      color = isDark ? '#86EFAC' : '#15803D';
      border = isDark ? 'rgba(22, 163, 74, 0.3)' : '#BBF7D0';
      dotColor = '#16A34A';
    } else if (sLow === 'qualified') {
      bg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0';
      dotColor = '#059669';
    } else if (sLow === 'in progress') {
      bg = isDark ? 'rgba(14, 165, 233, 0.15)' : '#F0F9FF';
      color = isDark ? '#7DD3FC' : '#0284C7';
      border = isDark ? 'rgba(14, 165, 233, 0.3)' : '#BAE6FD';
      dotColor = '#0284C7';
    } else if (sLow === 'on hold') {
      bg = isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB';
      color = isDark ? '#FCD34D' : '#B45309';
      border = isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A';
      dotColor = '#D97706';
    } else if (sLow === 'pending') {
      bg = isDark ? 'rgba(168, 85, 247, 0.15)' : '#FAF5FF';
      color = isDark ? '#D8B4FE' : '#7E22CE';
      border = isDark ? 'rgba(168, 85, 247, 0.3)' : '#E9D5FF';
      dotColor = '#9333EA';
    } else if (sLow.includes('follow')) {
      bg = isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED';
      color = isDark ? '#FDBA74' : '#C2410C';
      border = isDark ? 'rgba(249, 115, 22, 0.3)' : '#FFEDD5';
      dotColor = '#EA580C';
    } else if (sLow === 'completed' || sLow === 'won') {
      bg = isDark ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7';
      color = isDark ? '#86EFAC' : '#15803D';
      border = isDark ? 'rgba(34, 197, 94, 0.35)' : '#86EFAC';
      dotColor = '#16A34A';
    } else if (sLow === 'lost' || sLow === 'cancelled' || sLow.includes('disqualif')) {
      bg = isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#B91C1C';
      border = isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA';
      dotColor = '#DC2626';
    }

    return (
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 11px',
          borderRadius: 100,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        <Box
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0,
          }}
        />
        <span>{s}</span>
      </Box>
    );
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
              No contact records match your current view or filter criteria. Click below to add a new contact.
            </Text>
            <Button
              mt="xs"
              radius="md"
              leftSection={<IconUserPlus size={16} />}
              onClick={onAddNew}
              style={{
                background: isDark ? '#3B82F6' : '#0F172A',
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              + Add Contact
            </Button>
          </Stack>
        </Center>
      </Paper>
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
          horizontalSpacing="lg"
          highlightOnHover
          style={{
            minWidth: 1280,
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
              <Table.Th style={{ minWidth: 200, color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                CONTACT
              </Table.Th>
              <Table.Th style={{ minWidth: 140, color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                COMPANY
              </Table.Th>
              <Table.Th style={{ minWidth: 190, color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                EMAIL
              </Table.Th>
              <Table.Th style={{ minWidth: 130, color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                PHONE
              </Table.Th>
              <Table.Th style={{ minWidth: 130, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                SOURCE
              </Table.Th>
              <Table.Th style={{ minWidth: 140, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                STAGE
              </Table.Th>
              <Table.Th style={{ minWidth: 130, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                STATUS
              </Table.Th>
              <Table.Th style={{ minWidth: 110, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                LAST UPDATE
              </Table.Th>
              <Table.Th style={{ minWidth: 160, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                ASSIGNED TO
              </Table.Th>
              <Table.Th style={{ width: 90, minWidth: 90, textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                ACTIONS
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {contacts.map((contact) => (
              <Table.Tr
                key={contact.id}
                style={{
                  transition: 'background 0.12s ease',
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #F1F5F9',
                }}
              >
                {/* 1. CONTACT: Avatar badge + Name + Designation */}
                <Table.Td style={{ minWidth: 200 }}>
                  <Group gap="sm" wrap="nowrap">
                    <Box
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        backgroundColor: isDark ? '#3B82F6' : '#2563EB',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                        boxShadow: isDark ? '0 2px 8px rgba(59, 130, 246, 0.3)' : '0 2px 6px rgba(37, 99, 235, 0.2)',
                      }}
                    >
                      {getInitials(contact.name)}
                    </Box>
                    <Box style={{ minWidth: 110 }}>
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
                      <Text
                        size="11px"
                        style={{
                          color: isDark ? '#94A3B8' : '#64748B',
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {contact.designation || contact.profession || contact.contactType || 'Contact'}
                      </Text>
                    </Box>
                  </Group>
                </Table.Td>

                {/* 2. COMPANY */}
                <Table.Td style={{ minWidth: 140, whiteSpace: 'nowrap' }}>
                  <Text size="13px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B', whiteSpace: 'nowrap' }}>
                    {contact.companyName || '—'}
                  </Text>
                </Table.Td>

                {/* 3. EMAIL */}
                <Table.Td style={{ minWidth: 190, whiteSpace: 'nowrap' }}>
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap' }}>
                    {contact.email || '—'}
                  </Text>
                </Table.Td>

                {/* 4. PHONE */}
                <Table.Td style={{ minWidth: 130, whiteSpace: 'nowrap' }}>
                  <Text size="13px" fw={500} style={{ color: isDark ? '#CBD5E1' : '#334155', whiteSpace: 'nowrap' }}>
                    {contact.phone || '—'}
                  </Text>
                </Table.Td>

                {/* 5. SOURCE: Beautiful Styled Badge */}
                <Table.Td style={{ minWidth: 130, whiteSpace: 'nowrap' }}>
                  {renderSourceBadge(contact.source)}
                </Table.Td>

                {/* 6. STAGE: 1-Click Dropdown to advance pipeline stage */}
                <Table.Td style={{ minWidth: 140, whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                  <Menu position="bottom-start" shadow="lg" radius="md" width={200} withinPortal>
                    <Menu.Target>
                      <UnstyledButton style={{ cursor: 'pointer' }}>
                        <Group gap={4} align="center" wrap="nowrap">
                          {renderStageBadge(contact.stage)}
                          <IconChevronDown size={11} style={{ opacity: 0.6 }} />
                        </Group>
                      </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Move Pipeline Stage</Menu.Label>
                      {[
                        { value: 'Qualification', label: 'Qualification' },
                        { value: 'Discovery', label: 'Discovery' },
                        { value: 'Requirement Analysis', label: 'Requirement Analysis' },
                        { value: 'Proposal', label: 'Proposal' },
                        { value: 'Negotiation', label: 'Negotiation' },
                        { value: 'Demo / Presentation', label: 'Demo / Presentation' },
                        { value: 'Decision Making', label: 'Decision Making' },
                        { value: 'Contract / Agreement', label: 'Contract / Agreement' },
                        { value: 'Closed Won', label: 'Closed Won' },
                        { value: 'Closed Lost', label: 'Closed Lost' },
                      ].map((st) => (
                        <Menu.Item
                          key={st.value}
                          rightSection={
                            (contact.stage || 'Qualification').toLowerCase() === st.value.toLowerCase() ? (
                              <IconCheck size={14} color="#2563EB" />
                            ) : undefined
                          }
                          onClick={() => handleUpdateStage(contact, st.value)}
                        >
                          <Text
                            size="xs"
                            fw={
                              (contact.stage || 'Qualification').toLowerCase() === st.value.toLowerCase()
                                ? 700
                                : 500
                            }
                          >
                            {st.label}
                          </Text>
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>

                {/* 7. STATUS: 1-Click Dropdown to update contact status */}
                <Table.Td style={{ minWidth: 130, whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                  <Menu position="bottom-start" shadow="lg" radius="md" width={190} withinPortal>
                    <Menu.Target>
                      <UnstyledButton style={{ cursor: 'pointer' }}>
                        <Group gap={4} align="center" wrap="nowrap">
                          {renderStatusBadge(contact.status)}
                          <IconChevronDown size={11} style={{ opacity: 0.6 }} />
                        </Group>
                      </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Update Status</Menu.Label>
                      {[
                        { value: 'New', label: 'New', dotColor: '#2563EB' },
                        { value: 'Active', label: 'Active', dotColor: '#16A34A' },
                        { value: 'Qualified', label: 'Qualified', dotColor: '#059669' },
                        { value: 'In Progress', label: 'In Progress', dotColor: '#0284C7' },
                        { value: 'On Hold', label: 'On Hold', dotColor: '#D97706' },
                        { value: 'Pending', label: 'Pending', dotColor: '#9333EA' },
                        { value: 'Follow-up Required', label: 'Follow-up Required', dotColor: '#EA580C' },
                        { value: 'Completed', label: 'Completed', dotColor: '#16A34A' },
                        { value: 'Won', label: 'Won', dotColor: '#16A34A' },
                        { value: 'Lost', label: 'Lost', dotColor: '#DC2626' },
                        { value: 'Cancelled', label: 'Cancelled', dotColor: '#DC2626' },
                      ].map((st) => (
                        <Menu.Item
                          key={st.value}
                          leftSection={
                            <Box
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                backgroundColor: st.dotColor,
                              }}
                            />
                          }
                          rightSection={
                            (contact.status || 'New').toLowerCase() === st.value.toLowerCase() ? (
                              <IconCheck size={14} color="#2563EB" />
                            ) : undefined
                          }
                          onClick={() => handleUpdateStatus(contact.id, st.value)}
                        >
                          <Text
                            size="xs"
                            fw={
                              (contact.status || 'New').toLowerCase() === st.value.toLowerCase()
                                ? 700
                                : 500
                            }
                          >
                            {st.label}
                          </Text>
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>

                {/* 8. LAST UPDATE */}
                <Table.Td style={{ minWidth: 110, whiteSpace: 'nowrap' }}>
                  <Text size="12px" fw={500} style={{ color: isDark ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap' }}>
                    {formatLastUpdate(contact.updatedAt || contact.createdAt)}
                  </Text>
                </Table.Td>

                {/* 9. ASSIGNED TO: 1-Click interactive assignment dropdown */}
                <Table.Td style={{ minWidth: 160, whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                  <Menu position="bottom-start" shadow="lg" radius="md" width={220} withinPortal>
                    <Menu.Target>
                      <UnstyledButton>
                        {contact.assignedToName ? (
                          <Tooltip label="Click to reassign employee" withArrow>
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
                                  cursor: 'pointer',
                                  padding: '5px 12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                },
                              }}
                            >
                              <IconUserCheck size={12} stroke={2.2} />
                              {contact.assignedToName}
                              <IconChevronDown size={11} style={{ opacity: 0.7 }} />
                            </Badge>
                          </Tooltip>
                        ) : (
                          <Tooltip label="Click to assign to an employee" withArrow>
                            <Badge
                              variant="outline"
                              radius="xl"
                              styles={{
                                root: {
                                  borderStyle: 'dashed',
                                  borderColor: isDark ? '#475569' : '#CBD5E1',
                                  color: isDark ? '#94A3B8' : '#64748B',
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                                  fontWeight: 500,
                                  fontSize: 11,
                                  textTransform: 'none',
                                  cursor: 'pointer',
                                  padding: '5px 10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                },
                              }}
                            >
                              <IconUserPlus size={12} />
                              Assign
                              <IconChevronDown size={11} style={{ opacity: 0.7 }} />
                            </Badge>
                          </Tooltip>
                        )}
                      </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Assign Contact to Employee</Menu.Label>
                      {metadata?.employees && metadata.employees.length > 0 ? (
                        metadata.employees.map((emp) => {
                          const isAssigned =
                            contact.assignedTo === emp.id || contact.assignedToName === emp.name;
                          return (
                            <Menu.Item
                              key={emp.id}
                              leftSection={
                                <Box
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    backgroundColor: '#2563EB',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 10,
                                    fontWeight: 700,
                                  }}
                                >
                                  {getInitials(emp.name)}
                                </Box>
                              }
                              rightSection={
                                isAssigned ? <IconCheck size={14} color="#2563EB" /> : undefined
                              }
                              onClick={() => handleAssign(contact.id, emp.id)}
                            >
                              <Box>
                                <Text size="xs" fw={isAssigned ? 700 : 500}>
                                  {emp.name}
                                </Text>
                                {emp.designation && (
                                  <Text size="10px" c="dimmed">
                                    {emp.designation}
                                  </Text>
                                )}
                              </Box>
                            </Menu.Item>
                          );
                        })
                      ) : (
                        <Menu.Item disabled>No employees available</Menu.Item>
                      )}

                      {contact.assignedToName && (
                        <>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconUserX size={14} />}
                            onClick={() => handleAssign(contact.id, null)}
                          >
                            Unassign Contact
                          </Menu.Item>
                        </>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>

                {/* 10. ACTIONS (Direct Action Icons) */}
                <Table.Td style={{ width: 110, textAlign: 'center' }}>
                  <Group gap={6} justify="center" wrap="nowrap">
                    <Tooltip label="Qualify Contact (2-Step Flow)" withArrow>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        radius="md"
                        color="teal"
                        onClick={() => handleOpenQualification(contact)}
                      >
                        <IconTarget size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Edit Contact" withArrow>
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

                    <Tooltip label="Delete Contact" withArrow>
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
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
};

export default ContactTableView;
