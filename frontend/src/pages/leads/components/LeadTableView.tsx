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
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconTarget,
  IconPhoneCall,
  IconMail,
  IconBuilding,
  IconUser,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { Lead } from '../../../types/lead';
import { useCRM } from '../../../context/CRMContext';
import { useLead } from '../../../context/LeadContext';

interface LeadTableViewProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onAddNew?: () => void;
  loading?: boolean;
}

export const LeadTableView: React.FC<LeadTableViewProps> = ({
  leads,
  onEdit,
  onDelete,
  onAddNew,
  loading = false,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { setActiveNav } = useCRM();
  const { setSelectedLead } = useLead();

  const handleOpenLeadSchedule = (lead: Lead, forceTab?: 'schedule' | 'pipeline') => {
    setSelectedLead(lead);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_selected_lead', JSON.stringify(lead));
      const isNew = !lead.status || lead.status.toLowerCase() === 'new';
      const targetTab = forceTab || (isNew ? 'schedule' : 'pipeline');
      sessionStorage.setItem('crm_schedule_tab', targetTab);
    }
    setActiveNav('lead-schedule');
  };

  // Sleek Modern STATUS Badge matching Contacts design
  const renderStatusBadge = (statusVal?: string | null, stageVal?: string | null) => {
    let raw = (statusVal || stageVal || 'New').trim();
    if (raw.toLowerCase() === 'contacted') {
      raw = 'In Progress';
    } else if (raw.toLowerCase() === 'won' || raw.toLowerCase() === 'closed won' || raw.toLowerCase() === 'completed') {
      raw = 'Complete';
    }
    const st = raw;
    const sLow = st.toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (sLow.includes('unqual') || sLow.includes('disqual') || sLow.includes('lost') || sLow.includes('cancel')) {
      bg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#DC2626';
      border = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
    } else if (sLow.includes('qualif') || sLow.includes('won') || sLow.includes('complete')) {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (sLow.includes('progress') || sLow.includes('contact')) {
      bg = isDark ? 'rgba(14, 165, 233, 0.16)' : '#F0F9FF';
      color = isDark ? '#7DD3FC' : '#0284C7';
      border = isDark ? 'rgba(14, 165, 233, 0.35)' : '#BAE6FD';
    } else if (sLow.includes('proposal') || sLow.includes('negotiat')) {
      bg = isDark ? 'rgba(147, 51, 234, 0.14)' : '#FAF5FF';
      color = isDark ? '#D8B4FE' : '#7E22CE';
      border = isDark ? 'rgba(147, 51, 234, 0.25)' : '#E9D5FF';
    } else if (sLow.includes('new') || sLow.includes('init')) {
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

  const formatLastUpdate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (!loading && leads.length === 0) {
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
                background: isDark ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#818CF8' : '#4F46E5',
              }}
            >
              <IconTarget size={32} stroke={1.8} />
            </Box>
            <Text fw={700} size="lg" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              No Leads Found
            </Text>
            <Text size="sm" c="dimmed" style={{ maxWidth: 420 }}>
              No lead records match your current view or filter criteria.
            </Text>
            {onAddNew && (
              <Button
                mt="xs"
                radius="md"
                leftSection={<IconTarget size={16} />}
                onClick={onAddNew}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                + Add Lead
              </Button>
            )}
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <>
      {/* DESKTOP / TABLET VIEW: Full Table Container matching Contacts Design */}
      <Paper
        visibleFrom="sm"
        radius="lg"
        style={{
          background: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 1px 4px rgba(0,0,0,0.03)',
          marginTop: 16,
        }}
      >
        <Table.ScrollContainer minWidth={750}>
          <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
            <Table.Thead
              style={{
                background: isDark ? '#0F172A' : '#FBFBFC',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
              }}
            >
              <Table.Tr>
                <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                  LEAD NAME
                </Table.Th>
                <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                  COMPANY / PROFESSION
                </Table.Th>
                <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                  CONTACT INFO
                </Table.Th>
                <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                  STATUS
                </Table.Th>
                <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                  ACTIONS
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {leads.map((lead) => (
                <Table.Tr
                  key={lead.id}
                  style={{
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #F1F5F9',
                  }}
                  onClick={() => handleOpenLeadSchedule(lead)}
                >
                  {/* 1. Lead Name */}
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <Box
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: isDark ? '#1E3A8A' : '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isDark ? '#93C5FD' : '#2563EB',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                      </Box>
                      <div>
                        <Text
                          fw={700}
                          size="sm"
                          style={{
                            color: isDark ? '#F9FAFB' : '#0F172A',
                            transition: 'color 0.15s ease',
                          }}
                        >
                          {lead.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Added: {formatLastUpdate(lead.createdAt)}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>

                  {/* 2. Company / Profession */}
                  <Table.Td>
                    <Stack gap={2}>
                      <Group gap={6} wrap="nowrap">
                        {lead.companyName ? (
                          <IconBuilding size={14} color="#64748B" />
                        ) : (
                          <IconUser size={14} color="#64748B" />
                        )}
                        <Text size="sm" fw={500}>
                          {lead.companyName || lead.profession || 'Individual'}
                        </Text>
                      </Group>
                      {lead.designation && (
                        <Text size="xs" c="dimmed">
                          {lead.designation}
                        </Text>
                      )}
                    </Stack>
                  </Table.Td>

                  {/* 3. Contact Info */}
                  <Table.Td>
                    <Stack gap={2}>
                      {lead.phone && (
                        <Group gap={6} wrap="nowrap">
                          <IconPhoneCall size={14} color="#10B981" />
                          <Text size="xs" fw={500}>
                            {lead.phone}
                          </Text>
                        </Group>
                      )}
                      {lead.email && (
                        <Group gap={6} wrap="nowrap">
                          <IconMail size={14} color="#3B82F6" />
                          <Text size="xs" style={{ color: '#2563EB' }}>
                            {lead.email}
                          </Text>
                        </Group>
                      )}
                      {!lead.phone && !lead.email && (
                        <Text size="xs" c="dimmed">
                          No contact details
                        </Text>
                      )}
                    </Stack>
                  </Table.Td>

                  {/* 4. Status */}
                  <Table.Td>
                    <Stack gap={4} align="flex-start">
                      {renderStatusBadge(lead.status, lead.stage)}
                      {lead.stage && (
                        <Text size="11px" c="dimmed" style={{ paddingLeft: 4 }}>
                          {lead.stage}
                        </Text>
                      )}
                    </Stack>
                  </Table.Td>

                  {/* 5. Actions */}
                  <Table.Td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <Group gap={6} justify="flex-end">
                      <Tooltip label="Schedule Meeting" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          size="md"
                          radius="md"
                          onClick={() => handleOpenLeadSchedule(lead, 'schedule')}
                        >
                          <IconCalendarEvent size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit Lead" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="indigo"
                          size="md"
                          radius="md"
                          onClick={() => onEdit(lead)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete Lead" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="md"
                          radius="md"
                          onClick={() => onDelete(lead)}
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
        </Table.ScrollContainer>
      </Paper>

      {/* MOBILE VIEW: Responsive Touch Cards List */}
      <Stack hiddenFrom="sm" gap="sm" mt="md">
        {leads.map((lead) => (
          <Paper
            key={lead.id}
            p="md"
            radius="14px"
            style={{
              background: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            {/* Header: Avatar, Name & Status */}
            <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
              <Group
                gap="sm"
                wrap="nowrap"
                style={{ cursor: 'pointer', flex: 1 }}
                onClick={() => handleOpenLeadSchedule(lead)}
              >
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: isDark ? '#14532D' : '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#86EFAC' : '#15803D',
                    fontWeight: 700,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                </Box>
                <Box style={{ overflow: 'hidden' }}>
                  <Text fw={700} size="14px" truncate style={{ color: isDark ? '#F9FAFB' : '#0F172A' }}>
                    {lead.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatLastUpdate(lead.createdAt)}
                  </Text>
                </Box>
              </Group>

              {renderStatusBadge(lead.status)}
            </Group>

            {/* Company / Profession & Stage */}
            <Group justify="space-between" align="center" wrap="wrap" gap="xs" mb="xs">
              <Group gap={6} wrap="nowrap">
                {lead.companyName ? (
                  <IconBuilding size={14} color="#64748B" />
                ) : (
                  <IconUser size={14} color="#64748B" />
                )}
                <Text size="xs" fw={500} style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                  {lead.companyName || lead.profession || 'Individual'}
                  {lead.designation ? ` • ${lead.designation}` : ''}
                </Text>
              </Group>

              {lead.stage && (
                <Badge variant="outline" size="xs" color="gray" style={{ textTransform: 'none' }}>
                  {lead.stage}
                </Badge>
              )}
            </Group>

            {/* Contact Chips */}
            <Group gap="xs" wrap="wrap" mb="sm">
              {lead.phone && (
                <Button
                  component="a"
                  href={`tel:${lead.phone}`}
                  size="compact-xs"
                  variant="light"
                  color="teal"
                  leftSection={<IconPhoneCall size={12} />}
                  style={{ borderRadius: 6, fontWeight: 500 }}
                >
                  {lead.phone}
                </Button>
              )}
              {lead.email && (
                <Button
                  component="a"
                  href={`mailto:${lead.email}`}
                  size="compact-xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconMail size={12} />}
                  style={{ borderRadius: 6, fontWeight: 500 }}
                >
                  {lead.email}
                </Button>
              )}
            </Group>

            {/* Action Bar */}
            <Group
              justify="space-between"
              pt="xs"
              style={{
                borderTop: isDark ? '1px solid #1F2937' : '1px solid #F1F5F9',
              }}
            >
              <Button
                size="xs"
                variant="light"
                color="teal"
                leftSection={<IconCalendarEvent size={14} />}
                onClick={() => handleOpenLeadSchedule(lead, 'schedule')}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Schedule Meeting
              </Button>

              <Group gap={6}>
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  size="md"
                  radius="md"
                  onClick={() => onEdit(lead)}
                  title="Edit Lead"
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="md"
                  radius="md"
                  onClick={() => onDelete(lead)}
                  title="Delete Lead"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
    </>
  );
};

export default LeadTableView;
