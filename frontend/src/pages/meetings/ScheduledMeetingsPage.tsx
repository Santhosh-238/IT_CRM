import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Paper,
  SimpleGrid,
  TextInput,
  Select,
  Textarea,
  Modal,
  ActionIcon,
  Tooltip,
  Avatar,
  ThemeIcon,
  SegmentedControl,
  Card,
  Divider,
  Loader,
  Center,
  Menu,
  useComputedColorScheme,
  Grid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCalendarEvent,
  IconClock,
  IconUser,
  IconVideo,
  IconBuilding,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconCheck,
  IconX,
  IconEdit,
  IconTrash,
  IconExternalLink,
  IconCalendar,
  IconFilter,
  IconMapPin,
  IconDotsVertical,
  IconUsers,
  IconInfoCircle,
} from '@tabler/icons-react';
import { ScheduledMeeting, MeetingStats } from '../../types/meeting';
import {
  fetchMeetingsApi,
  fetchMeetingStatsApi,
  createMeetingApi,
  updateMeetingApi,
  deleteMeetingApi,
} from '../../services/meetingService';
import { useEmployee } from '../../context/EmployeeContext';
import { CRM_COLORS } from '../../theme/colors';

export const ScheduledMeetingsPage: React.FC = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { employees } = useEmployee();

  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [dateFilterTab, setDateFilterTab] = useState<string>('all'); // 'all', 'today', 'upcoming', 'past'
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state
  const [formPurpose, setFormPurpose] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState<string | null>(null);
  const [formEmployeeName, setFormEmployeeName] = useState('');
  const [formEmployeeEmail, setFormEmployeeEmail] = useState('');
  const [formEmployeeDesignation, setFormEmployeeDesignation] = useState('');
  const [formMeetingDate, setFormMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState('10:00 AM');
  const [formEndTime, setFormEndTime] = useState('11:00 AM');
  const [formMeetingType, setFormMeetingType] = useState('Virtual');
  const [formLocation, setFormLocation] = useState('https://meet.google.com/');
  const [formClientName, setFormClientName] = useState('');
  const [formStatus, setFormStatus] = useState('Scheduled');
  const [formNotes, setFormNotes] = useState('');

  // Today ISO String
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [meetingsRes, statsRes] = await Promise.all([
        fetchMeetingsApi(),
        fetchMeetingStatsApi().catch(() => null),
      ]);
      setMeetings(meetingsRes.meetings);
      if (statsRes) setStats(statsRes);
    } catch (err: any) {
      notifications.show({
        title: 'Error Loading Meetings',
        message: err.message || 'Could not fetch scheduled meetings',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      // 1. Date tab filter
      if (dateFilterTab === 'today') {
        if (m.meetingDate !== todayStr) return false;
      } else if (dateFilterTab === 'upcoming') {
        if (m.meetingDate < todayStr) return false;
      } else if (dateFilterTab === 'past') {
        if (m.meetingDate >= todayStr) return false;
      }

      // 2. Specific date
      if (selectedDate && m.meetingDate !== selectedDate) {
        return false;
      }

      // 3. Employee
      if (selectedEmployeeId !== 'ALL') {
        if (m.employeeId !== selectedEmployeeId && m.employeeName !== selectedEmployeeId) {
          return false;
        }
      }

      // 4. Status
      if (selectedStatus !== 'ALL') {
        if (m.status?.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // 5. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inPurpose = m.purpose?.toLowerCase().includes(q);
        const inTitle = m.title?.toLowerCase().includes(q);
        const inEmp = m.employeeName?.toLowerCase().includes(q);
        const inClient = m.clientName?.toLowerCase().includes(q);
        const inNotes = m.notes?.toLowerCase().includes(q);
        if (!inPurpose && !inTitle && !inEmp && !inClient && !inNotes) {
          return false;
        }
      }

      return true;
    });
  }, [meetings, dateFilterTab, selectedDate, selectedEmployeeId, selectedStatus, searchQuery, todayStr]);

  // Group date-wise sorted by date ascending
  const dateWiseGrouped = useMemo(() => {
    const groups: Record<string, ScheduledMeeting[]> = {};
    filteredMeetings.forEach((m) => {
      const d = m.meetingDate || 'Unscheduled';
      if (!groups[d]) groups[d] = [];
      groups[d].push(m);
    });

    // Sort dates
    const sortedDates = Object.keys(groups).sort((a, b) => {
      if (dateFilterTab === 'past') return b.localeCompare(a); // past descending
      return a.localeCompare(b); // upcoming ascending
    });

    return sortedDates.map((date) => ({
      date,
      items: groups[date],
    }));
  }, [filteredMeetings, dateFilterTab]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingMeeting(null);
    setFormPurpose('');
    setFormTitle('');
    // Auto select first employee if available
    if (employees.length > 0) {
      const first = employees[0];
      setFormEmployeeId(first.id || first.empCode);
      setFormEmployeeName(first.name);
      setFormEmployeeEmail(first.email || '');
      setFormEmployeeDesignation(first.designation || first.role || '');
    } else {
      setFormEmployeeId(null);
      setFormEmployeeName('Admin Employee');
      setFormEmployeeEmail('');
      setFormEmployeeDesignation('Sales Executive');
    }
    setFormMeetingDate(todayStr);
    setFormStartTime('10:00 AM');
    setFormEndTime('11:00 AM');
    setFormMeetingType('Virtual');
    setFormLocation('https://meet.google.com/crm-session');
    setFormClientName('');
    setFormStatus('Scheduled');
    setFormNotes('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (meeting: ScheduledMeeting) => {
    setEditingMeeting(meeting);
    setFormPurpose(meeting.purpose || '');
    setFormTitle(meeting.title || '');
    setFormEmployeeId(meeting.employeeId || null);
    setFormEmployeeName(meeting.employeeName || '');
    setFormEmployeeEmail(meeting.employeeEmail || '');
    setFormEmployeeDesignation(meeting.employeeDesignation || '');
    setFormMeetingDate(meeting.meetingDate || todayStr);
    setFormStartTime(meeting.startTime || '10:00 AM');
    setFormEndTime(meeting.endTime || '11:00 AM');
    setFormMeetingType(meeting.meetingType || 'Virtual');
    setFormLocation(meeting.location || '');
    setFormClientName(meeting.clientName || '');
    setFormStatus(meeting.status || 'Scheduled');
    setFormNotes(meeting.notes || '');
    setModalOpen(true);
  };

  // Save / Update Meeting
  const handleSaveMeeting = async () => {
    if (!formPurpose.trim()) {
      notifications.show({ title: 'Validation', message: 'Purpose of the meeting is required.', color: 'red' });
      return;
    }
    if (!formMeetingDate) {
      notifications.show({ title: 'Validation', message: 'Meeting date is required.', color: 'red' });
      return;
    }
    if (!formEmployeeName.trim()) {
      notifications.show({ title: 'Validation', message: 'Employee name is required.', color: 'red' });
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<ScheduledMeeting> = {
        title: formTitle.trim() || formPurpose.trim(),
        purpose: formPurpose.trim(),
        meetingDate: formMeetingDate,
        startTime: formStartTime.trim(),
        endTime: formEndTime.trim(),
        meetingType: formMeetingType,
        location: formLocation.trim(),
        employeeId: formEmployeeId || undefined,
        employeeName: formEmployeeName.trim(),
        employeeEmail: formEmployeeEmail.trim() || undefined,
        employeeDesignation: formEmployeeDesignation.trim() || undefined,
        clientName: formClientName.trim() || 'Internal / Client Session',
        status: formStatus,
        notes: formNotes.trim(),
      };

      if (editingMeeting) {
        await updateMeetingApi(editingMeeting.id, payload);
        notifications.show({
          title: 'Meeting Updated',
          message: `Meeting details updated successfully.`,
          color: 'teal',
          icon: <IconCheck size={16} />,
        });
      } else {
        await createMeetingApi(payload);
        notifications.show({
          title: 'Meeting Scheduled',
          message: `Scheduled meeting added for ${formEmployeeName}.`,
          color: 'teal',
          icon: <IconCheck size={16} />,
        });
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      notifications.show({
        title: 'Error Saving Meeting',
        message: err.message || 'Could not save meeting details',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Update
  const handleQuickStatus = async (id: string, newStatus: string) => {
    try {
      await updateMeetingApi(id, { status: newStatus });
      notifications.show({
        title: 'Status Updated',
        message: `Meeting marked as ${newStatus}`,
        color: 'teal',
      });
      await loadData();
    } catch (err: any) {
      notifications.show({ title: 'Update Failed', message: err.message, color: 'red' });
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async (id: string, purpose: string) => {
    if (!window.confirm(`Are you sure you want to delete the meeting: "${purpose}"?`)) return;
    try {
      await deleteMeetingApi(id);
      notifications.show({
        title: 'Meeting Deleted',
        message: 'Scheduled meeting removed.',
        color: 'blue',
      });
      await loadData();
    } catch (err: any) {
      notifications.show({ title: 'Delete Failed', message: err.message, color: 'red' });
    }
  };

  // Helper: Format Date Friendly
  const formatDateHeader = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Colors
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)';
  const headingColor = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <Stack gap="xl">
      {/* 1. Header & Actions */}
      <Box>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Group gap="xs" align="center">
              <ThemeIcon size={38} radius="12px" color="indigo" variant="light">
                <IconCalendarEvent size={22} />
              </ThemeIcon>
              <div>
                <Group gap="xs" align="center">
                  <Text fw={800} size="26px" style={{ letterSpacing: '-0.03em', color: headingColor, lineHeight: 1.2 }}>
                    Scheduled Meetings
                  </Text>
                  <Badge size="md" variant="light" color="indigo" radius="sm" fw={700}>
                    Admin Module
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed" mt={2}>
                  Track date-wise scheduled meetings, employee creators, purpose, and meeting timings
                </Text>
              </div>
            </Group>
          </div>

          <Group gap="sm">
            <Button
              variant="default"
              size="sm"
              radius="100px"
              leftSection={<IconRefresh size={16} />}
              onClick={loadData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              radius="100px"
              leftSection={<IconPlus size={16} />}
              onClick={handleOpenAddModal}
              style={{
                background: isDark ? '#3B82F6' : CRM_COLORS.primary,
                color: '#FFFFFF',
                fontWeight: 700,
                boxShadow: isDark ? '0 4px 14px rgba(59, 130, 246, 0.35)' : undefined,
              }}
            >
              Schedule Meeting
            </Button>
          </Group>
        </Group>
      </Box>

      {/* 2. Overview KPI Metrics */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {/* Card 1: Today's Meetings */}
        <Paper p="lg" radius="20px" className="crextio-card" style={{ background: cardBg, border: cardBorder }}>
          <Group justify="space-between" align="flex-start" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Today's Schedule
            </Text>
            <ThemeIcon size="md" radius="xl" variant="light" color="cyan">
              <IconCalendarEvent size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="30px" style={{ letterSpacing: '-0.03em', color: isDark ? '#38BDF8' : '#0284C7', lineHeight: 1.2 }}>
            {stats ? stats.todayCount : meetings.filter((m) => m.meetingDate === todayStr).length}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Meetings scheduled for today
          </Text>
        </Paper>

        {/* Card 2: Upcoming Meetings */}
        <Paper p="lg" radius="20px" className="crextio-card" style={{ background: cardBg, border: cardBorder }}>
          <Group justify="space-between" align="flex-start" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Upcoming Meetings
            </Text>
            <ThemeIcon size="md" radius="xl" variant="light" color="indigo">
              <IconClock size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="30px" style={{ letterSpacing: '-0.03em', color: isDark ? '#818CF8' : '#4F46E5', lineHeight: 1.2 }}>
            {stats ? stats.upcomingCount : meetings.filter((m) => m.meetingDate > todayStr).length}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Tomorrow & future dates
          </Text>
        </Paper>

        {/* Card 3: Total Scheduled */}
        <Paper p="lg" radius="20px" className="crextio-card" style={{ background: cardBg, border: cardBorder }}>
          <Group justify="space-between" align="flex-start" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Total Meetings
            </Text>
            <ThemeIcon size="md" radius="xl" variant="light" color="teal">
              <IconVideo size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="30px" style={{ letterSpacing: '-0.03em', color: isDark ? '#34D399' : '#059669', lineHeight: 1.2 }}>
            {stats ? stats.total : meetings.length}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Across all employees & dates
          </Text>
        </Paper>

        {/* Card 4: Active Employee Creators */}
        <Paper p="lg" radius="20px" className="crextio-card" style={{ background: cardBg, border: cardBorder }}>
          <Group justify="space-between" align="flex-start" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Active Hosts
            </Text>
            <ThemeIcon size="md" radius="xl" variant="light" color="violet">
              <IconUsers size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="30px" style={{ letterSpacing: '-0.03em', color: isDark ? '#C084FC' : '#7C3AED', lineHeight: 1.2 }}>
            {stats ? Object.keys(stats.employeeBreakdown || {}).length : new Set(meetings.map((m) => m.employeeName)).size}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Employees hosting sessions
          </Text>
        </Paper>
      </SimpleGrid>

      {/* 3. Date-Wise Filter & Search Bar */}
      <Paper p="md" radius="18px" style={{ background: cardBg, border: cardBorder }}>
        <Stack gap="md">
          {/* Quick Date Tabs */}
          <Group justify="space-between" align="center" wrap="wrap">
            <SegmentedControl
              value={dateFilterTab}
              onChange={(val) => {
                setDateFilterTab(val);
                setSelectedDate('');
              }}
              data={[
                { label: 'All Dates', value: 'all' },
                {
                  label: `Today (${meetings.filter((m) => m.meetingDate === todayStr).length})`,
                  value: 'today',
                },
                {
                  label: `Upcoming (${meetings.filter((m) => m.meetingDate > todayStr).length})`,
                  value: 'upcoming',
                },
                {
                  label: `Past (${meetings.filter((m) => m.meetingDate < todayStr).length})`,
                  value: 'past',
                },
              ]}
              radius="100px"
              size="xs"
              style={{ fontWeight: 600 }}
            />

            <Group gap="xs">
              <Text size="xs" fw={700} c="dimmed">
                Showing {filteredMeetings.length} of {meetings.length} meetings
              </Text>
            </Group>
          </Group>

          {/* Detailed Filters Bar */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
            {/* Search Input */}
            <TextInput
              placeholder="Search by purpose, employee, client..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              radius="100px"
              size="sm"
            />

            {/* Jump to Specific Date */}
            <TextInput
              type="date"
              placeholder="Specific Date"
              leftSection={<IconCalendar size={16} />}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.currentTarget.value);
                if (e.currentTarget.value) setDateFilterTab('all');
              }}
              radius="100px"
              size="sm"
            />

            {/* Employee Filter */}
            <Select
              placeholder="Filter by Employee Creator"
              leftSection={<IconUser size={16} />}
              value={selectedEmployeeId}
              onChange={(val) => setSelectedEmployeeId(val || 'ALL')}
              data={[
                { value: 'ALL', label: 'All Employees' },
                ...Array.from(new Set(meetings.map((m) => m.employeeName))).map((name) => ({
                  value: name,
                  label: name,
                })),
              ]}
              radius="100px"
              size="sm"
              searchable
            />

            {/* Status Filter */}
            <Select
              placeholder="Filter by Status"
              leftSection={<IconFilter size={16} />}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val || 'ALL')}
              data={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              radius="100px"
              size="sm"
            />
          </SimpleGrid>
        </Stack>
      </Paper>

      {/* 4. Date-Wise Grouped Display */}
      {loading ? (
        <Center py={80}>
          <Stack align="center" gap="sm">
            <Loader size="lg" color="indigo" />
            <Text size="sm" c="dimmed">
              Loading scheduled meetings date-wise...
            </Text>
          </Stack>
        </Center>
      ) : dateWiseGrouped.length === 0 ? (
        <Paper p={60} radius="24px" style={{ background: cardBg, border: cardBorder, textAlign: 'center' }}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="24px" variant="light" color="indigo">
              <IconCalendarEvent size={32} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="lg" style={{ color: headingColor }}>
                No Scheduled Meetings Found
              </Text>
              <Text size="sm" c="dimmed" mt={4} style={{ maxWidth: 460 }}>
                {searchQuery || selectedDate || selectedEmployeeId !== 'ALL' || selectedStatus !== 'ALL'
                  ? 'No meetings match your selected filters. Try clearing filters or search terms.'
                  : 'There are no meetings scheduled for this period. Click below to schedule a new meeting.'}
              </Text>
            </div>
            <Button
              size="sm"
              radius="100px"
              leftSection={<IconPlus size={16} />}
              onClick={handleOpenAddModal}
              style={{
                background: isDark ? '#3B82F6' : CRM_COLORS.primary,
                color: '#FFFFFF',
                fontWeight: 700,
              }}
            >
              Schedule New Meeting
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="xl">
          {dateWiseGrouped.map(({ date, items }) => {
            const isToday = date === todayStr;
            const isTomorrow = (() => {
              const tm = new Date();
              tm.setDate(tm.getDate() + 1);
              return date === tm.toISOString().split('T')[0];
            })();
            const isPast = date < todayStr;

            return (
              <Box key={date}>
                {/* Date Group Header */}
                <Group justify="space-between" align="center" mb="md" px="xs">
                  <Group gap="sm" align="center">
                    <ThemeIcon
                      size={28}
                      radius="8px"
                      color={isToday ? 'cyan' : isTomorrow ? 'indigo' : isPast ? 'gray' : 'blue'}
                      variant={isToday ? 'filled' : 'light'}
                    >
                      <IconCalendar size={16} />
                    </ThemeIcon>
                    <Text fw={800} size="18px" style={{ color: headingColor, letterSpacing: '-0.02em' }}>
                      {formatDateHeader(date)}
                    </Text>

                    {isToday && (
                      <Badge color="cyan" variant="filled" size="sm" radius="sm" fw={800}>
                        TODAY
                      </Badge>
                    )}
                    {isTomorrow && (
                      <Badge color="indigo" variant="light" size="sm" radius="sm" fw={700}>
                        TOMORROW
                      </Badge>
                    )}
                    {isPast && (
                      <Badge color="gray" variant="light" size="sm" radius="sm">
                        PAST
                      </Badge>
                    )}
                  </Group>

                  <Badge variant="outline" color="gray" size="sm" radius="sm">
                    {items.length} {items.length === 1 ? 'Meeting' : 'Meetings'}
                  </Badge>
                </Group>

                {/* Meetings List for this date */}
                <Stack gap="sm">
                  {items.map((m) => {
                    const isCompleted = m.status?.toLowerCase() === 'completed';
                    const isCancelled = m.status?.toLowerCase() === 'cancelled';

                    return (
                      <Paper
                        key={m.id}
                        p="lg"
                        radius="18px"
                        className="crextio-card"
                        style={{
                          background: cardBg,
                          border: isToday
                            ? `1.5px solid ${isDark ? 'rgba(56, 189, 248, 0.4)' : '#38BDF8'}`
                            : cardBorder,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Grid align="center" gutter="md">
                          {/* Column 1: Time & Mode (Left) */}
                          <Grid.Col span={{ base: 12, md: 3 }}>
                            <Stack gap={6}>
                              <Group gap="xs" align="center">
                                <ThemeIcon
                                  size="md"
                                  radius="8px"
                                  variant="light"
                                  color={isCompleted ? 'teal' : isCancelled ? 'gray' : 'indigo'}
                                >
                                  <IconClock size={16} />
                                </ThemeIcon>
                                <div>
                                  <Text fw={800} size="15px" style={{ color: headingColor }}>
                                    {m.startTime} – {m.endTime}
                                  </Text>
                                  <Text size="11px" c="dimmed">
                                    Date: {m.meetingDate}
                                  </Text>
                                </div>
                              </Group>

                              <Group gap={6} mt={2}>
                                <Badge
                                  size="xs"
                                  variant="dot"
                                  color={m.meetingType === 'In-person' ? 'orange' : 'blue'}
                                  radius="sm"
                                >
                                  {m.meetingType || 'Virtual'}
                                </Badge>
                                {m.location && (
                                  <Tooltip label={m.location}>
                                    <Text
                                      size="xs"
                                      c="dimmed"
                                      style={{
                                        maxWidth: 140,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {m.location}
                                    </Text>
                                  </Tooltip>
                                )}
                              </Group>
                            </Stack>
                          </Grid.Col>

                          {/* Column 2: Purpose of the Meeting & Agenda (Center) */}
                          <Grid.Col span={{ base: 12, md: 5 }}>
                            <Stack gap={4}>
                              <Group gap="xs" align="center">
                                <Badge size="xs" variant="light" color="indigo" radius="sm" fw={700}>
                                  PURPOSE
                                </Badge>
                                <Text fw={700} size="15px" style={{ color: headingColor }}>
                                  {m.title || m.purpose}
                                </Text>
                              </Group>

                              {/* Detailed Purpose Description */}
                              <Box
                                p="xs"
                                style={{
                                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)',
                                  borderRadius: 8,
                                  borderLeft: `3px solid ${isDark ? '#3B82F6' : CRM_COLORS.primary}`,
                                }}
                              >
                                <Text size="13px" fw={500} style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                                  {m.purpose}
                                </Text>
                                {m.notes && (
                                  <Text size="12px" c="dimmed" mt={4}>
                                    Notes: {m.notes}
                                  </Text>
                                )}
                              </Box>

                              {m.clientName && (
                                <Group gap={6} mt={2}>
                                  <IconBuilding size={14} color="#94A3B8" />
                                  <Text size="xs" fw={600} c="dimmed">
                                    Client / Account: <Text span inherit c={isDark ? '#F8FAFC' : '#0F172A'}>{m.clientName}</Text>
                                  </Text>
                                </Group>
                              )}
                            </Stack>
                          </Grid.Col>

                          {/* Column 3: Which Employee Created the Meeting */}
                          <Grid.Col span={{ base: 12, md: 2.5 }}>
                            <Box
                              p="xs"
                              style={{
                                background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC',
                                borderRadius: 12,
                                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0'}`,
                              }}
                            >
                              <Text size="10px" fw={800} c="dimmed" tt="uppercase" mb={6} style={{ letterSpacing: '0.04em' }}>
                                Meeting Creator / Host
                              </Text>
                              <Group gap="xs" align="center">
                                <Avatar size={34} radius="xl" color="indigo">
                                  {m.employeeName ? m.employeeName.charAt(0).toUpperCase() : 'E'}
                                </Avatar>
                                <Box style={{ minWidth: 0 }}>
                                  <Text fw={700} size="13px" style={{ color: headingColor }} truncate>
                                    {m.employeeName}
                                  </Text>
                                  <Text size="11px" c="dimmed" truncate>
                                    {m.employeeDesignation || 'CRM Team Member'}
                                  </Text>
                                </Box>
                              </Group>
                            </Box>
                          </Grid.Col>

                          {/* Column 4: Status & Actions (Right) */}
                          <Grid.Col span={{ base: 12, md: 1.5 }}>
                            <Stack gap="xs" align="flex-end">
                              <Badge
                                size="sm"
                                radius="sm"
                                variant="light"
                                color={
                                  isCompleted ? 'teal' : isCancelled ? 'red' : 'blue'
                                }
                                fw={700}
                              >
                                {m.status || 'Scheduled'}
                              </Badge>

                              <Group gap={6}>
                                {m.location && m.location.startsWith('http') && (
                                  <Tooltip label="Open Meeting Link">
                                    <ActionIcon
                                      size="sm"
                                      variant="light"
                                      color="cyan"
                                      radius="md"
                                      component="a"
                                      href={m.location}
                                      target="_blank"
                                    >
                                      <IconExternalLink size={14} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}

                                <Menu shadow="md" width={180} position="bottom-end">
                                  <Menu.Target>
                                    <ActionIcon size="sm" variant="subtle" radius="md">
                                      <IconDotsVertical size={16} />
                                    </ActionIcon>
                                  </Menu.Target>

                                  <Menu.Dropdown>
                                    <Menu.Label>Actions</Menu.Label>
                                    <Menu.Item
                                      leftSection={<IconEdit size={14} />}
                                      onClick={() => handleOpenEditModal(m)}
                                    >
                                      Edit Details
                                    </Menu.Item>
                                    {!isCompleted && (
                                      <Menu.Item
                                        leftSection={<IconCheck size={14} />}
                                        color="teal"
                                        onClick={() => handleQuickStatus(m.id, 'Completed')}
                                      >
                                        Mark Completed
                                      </Menu.Item>
                                    )}
                                    {!isCancelled && (
                                      <Menu.Item
                                        leftSection={<IconX size={14} />}
                                        color="orange"
                                        onClick={() => handleQuickStatus(m.id, 'Cancelled')}
                                      >
                                        Mark Cancelled
                                      </Menu.Item>
                                    )}
                                    <Menu.Divider />
                                    <Menu.Item
                                      leftSection={<IconTrash size={14} />}
                                      color="red"
                                      onClick={() => handleDeleteMeeting(m.id, m.purpose)}
                                    >
                                      Delete Meeting
                                    </Menu.Item>
                                  </Menu.Dropdown>
                                </Menu>
                              </Group>
                            </Stack>
                          </Grid.Col>
                        </Grid>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      {/* 5. Schedule / Edit Meeting Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon size={28} radius="md" color="indigo" variant="light">
              <IconCalendarEvent size={18} />
            </ThemeIcon>
            <Text fw={800} size="16px">
              {editingMeeting ? 'Edit Scheduled Meeting' : 'Schedule New Meeting'}
            </Text>
          </Group>
        }
        size="lg"
        radius="18px"
      >
        <Stack gap="md">
          {/* Meeting Purpose (Crucial Requirement) */}
          <Textarea
            label="Purpose of the Meeting"
            description="Clearly define the agenda, purpose, and objectives"
            placeholder="e.g. Sales Demo for ERP Cloud & Module Pricing Discussion"
            value={formPurpose}
            onChange={(e) => setFormPurpose(e.currentTarget.value)}
            required
            autosize
            minRows={2}
            maxRows={4}
          />

          {/* Title */}
          <TextInput
            label="Meeting Title"
            placeholder="e.g. ERP Solution Walkthrough"
            value={formTitle}
            onChange={(e) => setFormTitle(e.currentTarget.value)}
          />

          {/* Employee Creator Selection */}
          <Select
            label="Employee Creator / Host"
            description="Which employee created and leads this meeting"
            placeholder="Select employee"
            data={
              employees.length > 0
                ? employees.map((emp) => ({
                    value: emp.id || emp.empCode,
                    label: `${emp.name} (${emp.designation || emp.role || 'Staff'})`,
                  }))
                : [{ value: 'admin', label: 'Admin User' }]
            }
            value={formEmployeeId}
            onChange={(val) => {
              setFormEmployeeId(val);
              const found = employees.find((e) => (e.id || e.empCode) === val);
              if (found) {
                setFormEmployeeName(found.name);
                setFormEmployeeEmail(found.email || '');
                setFormEmployeeDesignation(found.designation || found.role || '');
              }
            }}
            searchable
            required
          />

          {/* Custom Employee Name input if not selected from list */}
          {(!employees.length || !formEmployeeId) && (
            <TextInput
              label="Employee Name"
              placeholder="e.g. Santhosh Kumar"
              value={formEmployeeName}
              onChange={(e) => setFormEmployeeName(e.currentTarget.value)}
              required
            />
          )}

          {/* Date & Timings */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <TextInput
              type="date"
              label="Meeting Date"
              value={formMeetingDate}
              onChange={(e) => setFormMeetingDate(e.currentTarget.value)}
              required
            />
            <TextInput
              label="Start Time"
              placeholder="10:00 AM"
              value={formStartTime}
              onChange={(e) => setFormStartTime(e.currentTarget.value)}
              required
            />
            <TextInput
              label="End Time"
              placeholder="11:00 AM"
              value={formEndTime}
              onChange={(e) => setFormEndTime(e.currentTarget.value)}
              required
            />
          </SimpleGrid>

          {/* Meeting Type & Location / Link */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
              label="Meeting Type"
              data={[
                { value: 'Virtual', label: 'Virtual (Google Meet / Zoom)' },
                { value: 'In-person', label: 'In-person (Office / Client Site)' },
                { value: 'Phone Call', label: 'Phone Call' },
              ]}
              value={formMeetingType}
              onChange={(val) => setFormMeetingType(val || 'Virtual')}
            />

            <TextInput
              label="Location / Meeting URL"
              placeholder="https://meet.google.com/xyz or Room 102"
              value={formLocation}
              onChange={(e) => setFormLocation(e.currentTarget.value)}
            />
          </SimpleGrid>

          {/* Client / Attendee & Status */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Client / Attendee Organization"
              placeholder="e.g. Infosys Technologies"
              value={formClientName}
              onChange={(e) => setFormClientName(e.currentTarget.value)}
            />

            <Select
              label="Meeting Status"
              data={[
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              value={formStatus}
              onChange={(val) => setFormStatus(val || 'Scheduled')}
            />
          </SimpleGrid>

          {/* Additional Notes */}
          <Textarea
            label="Additional Notes / Discussion Points"
            placeholder="Special preparation, slides link, key client concerns..."
            value={formNotes}
            onChange={(e) => setFormNotes(e.currentTarget.value)}
            minRows={2}
          />

          {/* Buttons */}
          <Group justify="flex-end" mt="md">
            <Button variant="default" radius="100px" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              radius="100px"
              loading={submitting}
              onClick={handleSaveMeeting}
              style={{
                background: isDark ? '#3B82F6' : CRM_COLORS.primary,
                color: '#FFFFFF',
                fontWeight: 700,
              }}
            >
              {editingMeeting ? 'Save Changes' : 'Confirm & Schedule'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default ScheduledMeetingsPage;
