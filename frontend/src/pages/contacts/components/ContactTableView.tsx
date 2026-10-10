import React from 'react';
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
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconUserCheck,
  IconBrandLinkedin,
  IconWorld,
  IconShare,
  IconPhoneCall,
  IconUsers,
} from '@tabler/icons-react';
import { Contact } from '../../../types/contact';
import { useContact } from '../../../context/ContactContext';
import { useCRM } from '../../../context/CRMContext';

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
  const { setSelectedContact } = useContact();

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

    if (sLow.includes('qualif')) {
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
    } else if (sLow.includes('disqual') || sLow.includes('lost') || sLow.includes('cancel')) {
      bg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#B91C1C';
      border = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
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
              <Table.Th style={{ minWidth: 160, color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                COMPANY / PROFESSION
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
              <Table.Th style={{ minWidth: 110, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                LAST UPDATE
              </Table.Th>
              <Table.Th style={{ minWidth: 160, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                ASSIGNED TO
              </Table.Th>
              <Table.Th style={{ minWidth: 140, whiteSpace: 'nowrap', color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                STATUS
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
                onClick={() => handleOpenQualification(contact)}
                style={{
                  cursor: 'pointer',
                  transition: 'background 0.12s ease',
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #F1F5F9',
                }}
              >
                {/* 1. CONTACT: Name + Designation / Type */}
                <Table.Td style={{ minWidth: 200 }}>
                  <Box style={{ display: 'inline-block' }}>
                    <Text
                      fw={700}
                      size="sm"
                      style={{
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#3B82F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isDark ? '#F8FAFC' : '#0F172A';
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
                      {contact.designation || (contact.contactType === 'Individual' ? 'Individual' : 'Company Representative')}
                    </Text>
                  </Box>
                </Table.Td>

                {/* 2. COMPANY / PROFESSION: Displays company name or profession entered by user */}
                <Table.Td style={{ minWidth: 160, whiteSpace: 'nowrap' }}>
                  <Text size="13px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B', whiteSpace: 'nowrap' }}>
                    {contact.companyName || contact.profession || contact.contactType || '—'}
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

                {/* 6. LAST UPDATE */}
                <Table.Td style={{ minWidth: 110, whiteSpace: 'nowrap' }}>
                  <Text size="12px" fw={500} style={{ color: isDark ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap' }}>
                    {formatLastUpdate(contact.updatedAt || contact.createdAt)}
                  </Text>
                </Table.Td>

                {/* 8. ASSIGNED TO: 1-Click to open Qualification Page */}
                <Table.Td style={{ minWidth: 160, whiteSpace: 'nowrap' }}>
                  <Tooltip label="Click to open Qualification Page" withArrow position="top">
                    <Box
                      style={{
                        display: 'inline-block',
                        transition: 'transform 0.12s ease, opacity 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.04)';
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      {contact.assignedToName ? (
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
                              padding: '5px 12px',
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
                              padding: '5px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            },
                          }}
                        >
                          <IconUserPlus size={12} />
                          Assign
                        </Badge>
                      )}
                    </Box>
                  </Tooltip>
                </Table.Td>

                {/* 9. STATUS: 1-Click to open Qualification Page */}
                <Table.Td style={{ minWidth: 140, whiteSpace: 'nowrap' }}>
                  <Tooltip label="Click to open Qualification Page" withArrow position="top">
                    <Box
                      style={{
                        display: 'inline-block',
                        transition: 'transform 0.12s ease, opacity 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.04)';
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      {renderStatusBadge(contact.status || contact.qualificationStatus, contact.stage)}
                    </Box>
                  </Tooltip>
                </Table.Td>

                {/* 10. ACTIONS (Direct Action Icons: Edit & Delete) */}
                <Table.Td style={{ width: 80, minWidth: 80, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <Group gap={6} justify="center" wrap="nowrap">
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
                        <IconEdit size={16} />
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
