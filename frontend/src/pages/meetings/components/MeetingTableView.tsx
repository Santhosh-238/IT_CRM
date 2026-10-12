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
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconUser,
  IconBuilding,
  IconCalendarEvent,
  IconCalendar,
  IconClock,
  IconTarget,
  IconFileDescription,
} from '@tabler/icons-react';
import { ScheduledMeeting } from '../../../types/meeting';
import { MeetingDetailsModal } from './MeetingDetailsModal';

interface MeetingTableViewProps {
  meetings: ScheduledMeeting[];
  onEdit: (meeting: ScheduledMeeting) => void;
  onDelete: (meeting: ScheduledMeeting) => void;
  onAddNew: () => void;
  onNavigateToLead?: (meeting: ScheduledMeeting) => void;
  onMeetingUpdated?: (meeting: ScheduledMeeting) => void;
  onViewDetails?: (meeting: ScheduledMeeting) => void;
  loading?: boolean;
}

export const MeetingTableView: React.FC<MeetingTableViewProps> = ({
  meetings,
  onEdit,
  onDelete,
  onAddNew,
  onNavigateToLead,
  onMeetingUpdated,
  onViewDetails,
  loading = false,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [detailsMeeting, setDetailsMeeting] = useState<ScheduledMeeting | null>(null);

  const handleOpenDetails = (meeting: ScheduledMeeting) => {
    if (onViewDetails) {
      onViewDetails(meeting);
    } else {
      setDetailsMeeting(meeting);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Sleek Modern STATUS Badge matching Contacts design
  const renderStatusBadge = (statusVal?: string | null) => {
    const st = (statusVal || 'Scheduled').trim();
    const sLow = st.toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (sLow.includes('complet') || sLow.includes('won')) {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (sLow.includes('resched') || sLow.includes('hold')) {
      bg = isDark ? 'rgba(249, 115, 22, 0.16)' : '#FFF7ED';
      color = isDark ? '#FB923C' : '#C2410C';
      border = isDark ? 'rgba(249, 115, 22, 0.35)' : '#FFEDD5';
    } else if (sLow.includes('progress')) {
      bg = isDark ? 'rgba(14, 165, 233, 0.16)' : '#F0F9FF';
      color = isDark ? '#7DD3FC' : '#0284C7';
      border = isDark ? 'rgba(14, 165, 233, 0.35)' : '#BAE6FD';
    } else if (sLow.includes('cancel') || sLow.includes('lost')) {
      bg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#B91C1C';
      border = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
    } else if (sLow.includes('sched')) {
      bg = isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB';
      color = isDark ? '#FCD34D' : '#B45309';
      border = isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A';
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

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Helper to extract lead and company names if stored together
  const parseClientInfo = (clientName?: string) => {
    if (!clientName) return { leadName: 'Lead Contact', companyName: 'Individual' };
    const match = clientName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { leadName: match[1].trim(), companyName: match[2].trim() };
    }
    return { leadName: clientName, companyName: 'Company / Organization' };
  };

  if (!loading && meetings.length === 0) {
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
              <IconCalendarEvent size={32} stroke={1.8} />
            </Box>
            <Text fw={700} size="lg" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              No Meetings Found
            </Text>
            <Text size="sm" c="dimmed" style={{ maxWidth: 420 }}>
              No scheduled meeting records match your current view. Click below to schedule a new meeting.
            </Text>
            <Button
              mt="xs"
              radius="md"
              leftSection={<IconCalendarEvent size={16} />}
              onClick={onAddNew}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              + Schedule Meeting
            </Button>
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
        <Table.ScrollContainer minWidth={850}>
          <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
            <Table.Thead
              style={{
                background: isDark ? '#0F172A' : '#FBFBFC',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
              }}
            >
              <Table.Tr>
                <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                  MEETING / PURPOSE
                </Table.Th>
                <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                  LEAD & COMPANY / PROFESSION
                </Table.Th>
                <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                  DATE & TIME
                </Table.Th>
                <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                  MEETING TYPE
                </Table.Th>
                <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                  ASSIGNED USER
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
              {meetings.map((meeting) => {
                const isToday = meeting.meetingDate === todayStr;
                const isUpcoming = meeting.meetingDate > todayStr;
                const titleText = meeting.title || meeting.purpose || 'Discovery Meeting';
                const initialLetter = titleText.charAt(0).toUpperCase();
                const parsed = parseClientInfo(meeting.clientName);
                const leadName = meeting.leadName || parsed.leadName;
                const companyName = meeting.companyName || parsed.companyName;

                return (
                  <Table.Tr
                    key={meeting.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDetails(meeting)}
                  >
                    {/* 1. Meeting Name / Purpose */}
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Box
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: isDark ? '#14532D' : '#DCFCE7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#86EFAC' : '#15803D',
                            fontWeight: 700,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {initialLetter}
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
                            {titleText}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Added: {formatDisplayDate(meeting.createdAt || meeting.meetingDate)}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>

                    {/* 2. Lead Name & Company Name */}
                    <Table.Td>
                      <Stack gap={2}>
                        <Group gap={6} wrap="nowrap">
                          <IconUser size={14} color="#3B82F6" />
                          <Text
                            size="sm"
                            fw={600}
                            style={{
                              color: isDark ? '#60A5FA' : '#2563EB',
                              textDecoration: 'none',
                            }}
                          >
                            {leadName}
                          </Text>
                        </Group>
                        <Group gap={6} wrap="nowrap">
                          <IconBuilding size={14} color="#64748B" />
                          <Text size="xs" c="dimmed">
                            {companyName}
                          </Text>
                        </Group>
                      </Stack>
                    </Table.Td>

                    {/* 3. Date & Time */}
                    <Table.Td>
                      <Stack gap={2}>
                        <Group gap={6} wrap="nowrap">
                          <IconCalendar size={14} color="#64748B" />
                          <Text size="sm" fw={600} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                            {formatDisplayDate(meeting.meetingDate)}
                          </Text>
                        </Group>
                        <Group gap={6} wrap="nowrap">
                          <IconClock size={12} color="#94A3B8" />
                          <Text size="xs" c="dimmed">
                            {meeting.startTime} – {meeting.endTime}
                          </Text>
                        </Group>
                      </Stack>
                    </Table.Td>

                    {/* 4. Meeting Type */}
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={meeting.meetingType?.toLowerCase().includes('in-person') ? 'cyan' : 'blue'}
                        size="sm"
                        radius="sm"
                      >
                        {meeting.meetingType || 'Virtual'}
                      </Badge>
                      {meeting.location && (
                        <Text size="xs" c="dimmed" truncate style={{ maxWidth: 160 }} mt={2}>
                          {meeting.location.replace(/^https?:\/\//, '')}
                        </Text>
                      )}
                    </Table.Td>

                    {/* 5. Assigned User / Host */}
                    <Table.Td>
                      <Stack gap={2}>
                        <Group gap={6} wrap="nowrap">
                          <IconUser size={14} color="#64748B" />
                          <Text size="sm" fw={500}>
                            {meeting.employeeName || 'Assigned Host'}
                          </Text>
                        </Group>
                        {meeting.employeeDesignation && (
                          <Text size="xs" c="dimmed">
                            {meeting.employeeDesignation}
                          </Text>
                        )}
                      </Stack>
                    </Table.Td>

                    {/* 6. Meeting Status */}
                    <Table.Td>
                      <Stack gap={4} align="flex-start">
                        {renderStatusBadge(meeting.status)}
                        <Text size="11px" c="dimmed" style={{ paddingLeft: 4 }}>
                          {isToday ? 'Today' : isUpcoming ? 'Upcoming' : 'Discovery'}
                        </Text>
                      </Stack>
                    </Table.Td>

                    {/* 7. Actions */}
                    <Table.Td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <Group gap={6} justify="flex-end" wrap="nowrap">
                        {/* View Details & Requirements */}
                        <Tooltip label="View Details & Requirements" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="teal"
                            size="md"
                            radius="md"
                            onClick={() => handleOpenDetails(meeting)}
                          >
                            <IconFileDescription size={16} />
                          </ActionIcon>
                        </Tooltip>

                        {/* Go to Lead Details */}
                        {onNavigateToLead && (
                          <Tooltip label="View Lead Details & Pipeline" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="indigo"
                              size="md"
                              radius="md"
                              onClick={() => onNavigateToLead(meeting)}
                            >
                              <IconTarget size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        {/* Join Virtual Meeting */}
                        {meeting.location && meeting.location.startsWith('http') ? (
                          <Tooltip label="Join Virtual Meeting" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              size="md"
                              radius="md"
                              component="a"
                              href={meeting.location}
                              target="_blank"
                            >
                              <IconCalendarEvent size={16} />
                            </ActionIcon>
                          </Tooltip>
                        ) : null}

                        {/* Edit Meeting */}
                        <Tooltip label="Edit Meeting" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="indigo"
                            size="md"
                            radius="md"
                            onClick={() => onEdit(meeting)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>

                        {/* Delete Meeting */}
                        <Tooltip label="Delete Meeting" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="md"
                            radius="md"
                            onClick={() => onDelete(meeting)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* MOBILE VIEW: Responsive Touch Cards List */}
      <Stack hiddenFrom="sm" gap="sm" mt="md">
        {meetings.map((meeting) => {
          const titleText = meeting.title || meeting.purpose || 'Discovery Meeting';
          const initialLetter = titleText.charAt(0).toUpperCase();
          const { leadName, companyName } = parseClientInfo(meeting.clientName);

          return (
            <Paper
              key={meeting.id}
              p="md"
              radius="14px"
              style={{
                background: isDark ? '#111827' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              {/* Header: Initial, Title & Status */}
              <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
                <Group
                  gap="sm"
                  wrap="nowrap"
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => handleOpenDetails(meeting)}
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
                    {initialLetter}
                  </Box>
                  <Box style={{ overflow: 'hidden' }}>
                    <Text fw={700} size="14px" truncate style={{ color: isDark ? '#F9FAFB' : '#0F172A' }}>
                      {titleText}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDisplayDate(meeting.meetingDate)} • {meeting.startTime}
                    </Text>
                  </Box>
                </Group>

                {renderStatusBadge(meeting.status)}
              </Group>

              {/* Lead & Company Info */}
              <Group justify="space-between" align="center" wrap="wrap" gap="xs" mb="xs">
                <Group gap={6} wrap="nowrap">
                  <IconUser size={14} color="#3B82F6" />
                  <Text size="xs" fw={600} style={{ color: isDark ? '#60A5FA' : '#2563EB' }}>
                    {leadName}
                  </Text>
                </Group>
                <Group gap={6} wrap="nowrap">
                  <IconBuilding size={14} color="#64748B" />
                  <Text size="xs" c="dimmed">
                    {companyName}
                  </Text>
                </Group>
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
                  onClick={() => handleOpenDetails(meeting)}
                  leftSection={<IconFileDescription size={14} />}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Details & Requirements
                </Button>

                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    radius="md"
                    size="sm"
                    onClick={() => onEdit(meeting)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    radius="md"
                    size="sm"
                    onClick={() => onDelete(meeting)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          );
        })}
      </Stack>

      {/* Meeting Details & Requirements Modal (Used if parent does not control details modal) */}
      {!onViewDetails && (
        <MeetingDetailsModal
          opened={!!detailsMeeting}
          onClose={() => setDetailsMeeting(null)}
          meeting={detailsMeeting}
          onNavigateToLead={onNavigateToLead}
          onMeetingUpdated={(updated) => {
            setDetailsMeeting(updated);
            if (onMeetingUpdated) {
              onMeetingUpdated(updated);
            }
          }}
        />
      )}
    </>
  );
};

export default MeetingTableView;
