import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Group,
  TextInput,
  Select,
  Button,
  Text,
  ActionIcon,
  Modal,
  Pagination,
  useComputedColorScheme,
  UnstyledButton,
  Stack,
  Textarea,
  SimpleGrid,
  ThemeIcon,
  Loader,
  Center,
  Paper,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconSearch,
  IconPlus,
  IconX,
  IconAlertTriangle,
  IconAlertCircle,
  IconCalendarEvent,
  IconArrowLeft,
  IconBuilding,
  IconUser,
  IconPhoneCall,
  IconMail,
  IconLayersSubtract,
} from '@tabler/icons-react';
import { ScheduledMeeting, MeetingStats } from '../../types/meeting';
import { Lead } from '../../types/lead';
import {
  fetchMeetingsApi,
  fetchMeetingStatsApi,
  createMeetingApi,
  updateMeetingApi,
  deleteMeetingApi,
} from '../../services/meetingService';
import { useEmployee } from '../../context/EmployeeContext';
import { useCRM } from '../../context/CRMContext';
import { useLead } from '../../context/LeadContext';
import { CRM_COLORS } from '../../theme/colors';
import { MeetingTableView } from './components/MeetingTableView';
import { LeadMeetingsTableView } from './components/LeadMeetingsTableView';
import { MeetingDetailsModal } from './components/MeetingDetailsModal';
import { MeetingTimePicker } from './components/MeetingTimePicker';
import { MeetingDatePicker } from './components/MeetingDatePicker';

type ActiveLeadTabType = 'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED';

export const ScheduledMeetingsPage: React.FC = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { employees } = useEmployee();
  const { activeNav, setActiveNav } = useCRM();
  const { leads, setSelectedLead, fetchLeads } = useLead();

  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Drill-down State: Which lead's meetings are currently being viewed
  const [activeLeadSelection, setActiveLeadSelection] = useState<Lead | null>(null);

  // Meeting Details Modal State
  const [detailsMeeting, setDetailsMeeting] = useState<ScheduledMeeting | null>(null);

  // Filter States for Leads View
  const [leadTab, setLeadTab] = useState<ActiveLeadTabType>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Modal States
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<ScheduledMeeting | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

// Helper to compute end time from start time and duration
const calculateEndTime = (startTimeStr: string, durationStr: string): string => {
  try {
    const trimmed = (startTimeStr || '10:00 AM').trim();
    const parts = trimmed.split(' ');
    const timePart = parts[0] || '10:00';
    const meridiem = (parts[1] || 'AM').toUpperCase();
    const [h, m] = timePart.split(':').map(Number);
    let durMin = 30;
    if (durationStr.includes('15')) durMin = 15;
    else if (durationStr.includes('45')) durMin = 45;
    else if (durationStr.includes('1.5')) durMin = 90;
    else if (durationStr.includes('2')) durMin = 120;
    else if (durationStr.includes('1 Hour') || durationStr.includes('60')) durMin = 60;
    else durMin = 30;

    const baseH = (h % 12) + (meridiem === 'PM' ? 12 : 0);
    const totalMin = baseH * 60 + (isNaN(m) ? 0 : m) + durMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    const endMeridiem = endH >= 12 ? 'PM' : 'AM';
    const displayEndH = (endH % 12) || 12;
    return `${displayEndH}:${endM.toString().padStart(2, '0')} ${endMeridiem}`;
  } catch (_) {
    return '10:30 AM';
  }
};

const inferDuration = (start?: string, end?: string): string => {
  if (!start || !end) return '30 Minutes';
  try {
    const parseM = (t: string) => {
      const parts = t.trim().split(' ');
      const timePart = parts[0] || '10:00';
      const meridiem = (parts[1] || 'AM').toUpperCase();
      const [h, m] = timePart.split(':').map(Number);
      return ((h % 12) + (meridiem === 'PM' ? 12 : 0)) * 60 + (isNaN(m) ? 0 : m);
    };
    const diff = parseM(end) - parseM(start);
    if (diff === 15) return '15 Minutes';
    if (diff === 30) return '30 Minutes';
    if (diff === 45) return '45 Minutes';
    if (diff === 60) return '1 Hour';
    if (diff === 90) return '1.5 Hours';
    if (diff === 120) return '2 Hours';
  } catch (_) {}
  return '30 Minutes';
};

  // Form Fields State
  const [formPurpose, setFormPurpose] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState<string | null>(null);
  const [formEmployeeName, setFormEmployeeName] = useState('');
  const [formEmployeeEmail, setFormEmployeeEmail] = useState('');
  const [formEmployeeDesignation, setFormEmployeeDesignation] = useState('');
  const [formMeetingDate, setFormMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState('10:00 AM');
  const [formDuration, setFormDuration] = useState('30 Minutes');
  const [formEndTime, setFormEndTime] = useState('10:30 AM');
  const [formMeetingType, setFormMeetingType] = useState('Virtual');
  const [formLocation, setFormLocation] = useState('');
  const [formContactId, setFormContactId] = useState<string | null>(null);
  const [formClientName, setFormClientName] = useState('');
  const [formStatus, setFormStatus] = useState('Scheduled');
  const [formNotes, setFormNotes] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [meetingsRes, statsRes] = await Promise.all([
        fetchMeetingsApi(),
        fetchMeetingStatsApi().catch(() => null),
      ]);
      setMeetings(meetingsRes.meetings || []);
      if (statsRes) setStats(statsRes);
      if (fetchLeads) fetchLeads();
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

  // Auto-open meeting details if navigated via "View Outcome" from Activity Pipeline
  useEffect(() => {
    if (activeNav !== 'scheduled-meetings' && activeNav !== 'meetings') return;
    const targetMeetingId = sessionStorage.getItem('crm_open_meeting_id');
    const targetMeetingDataStr = sessionStorage.getItem('crm_open_meeting_data');
    if (!targetMeetingId && !targetMeetingDataStr) return;

    let targetMeetingData: ScheduledMeeting | null = null;
    try {
      if (targetMeetingDataStr) targetMeetingData = JSON.parse(targetMeetingDataStr);
    } catch (_) {}

    const openMeetingModal = (targetMeeting: ScheduledMeeting) => {
      // Find matching lead
      const matchedLead = leads.find(
        (l) =>
          (targetMeeting.leadId && String(targetMeeting.leadId) === String(l.id)) ||
          (targetMeeting.leadDbId && String(targetMeeting.leadDbId) === String(l.id)) ||
          (targetMeeting.leadCode && targetMeeting.leadCode === l.leadId) ||
          (targetMeeting.contactId && String(targetMeeting.contactId) === String(l.id)) ||
          (targetMeeting.clientName && l.name && targetMeeting.clientName.toLowerCase().includes(l.name.toLowerCase()))
      );

      if (matchedLead) {
        setActiveLeadSelection(matchedLead);
      } else {
        try {
          const saved = sessionStorage.getItem('crm_selected_lead');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed) setActiveLeadSelection(parsed);
          }
        } catch (_) {}
      }

      setDetailsMeeting(targetMeeting);
      sessionStorage.removeItem('crm_open_meeting_id');
      sessionStorage.removeItem('crm_open_meeting_data');
      return true;
    };

    // 1. If full meeting data is in session, open it immediately without any delay!
    if (targetMeetingData) {
      const fresh = meetings.find((m) => String(m.id) === String(targetMeetingId || targetMeetingData?.id));
      openMeetingModal(fresh || targetMeetingData);
      return;
    }

    // 2. Otherwise search in meetings list with String comparison
    const found = meetings.find((m) => String(m.id) === String(targetMeetingId));
    if (found) {
      openMeetingModal(found);
    } else {
      fetchMeetingsApi()
        .then((res) => {
          if (res.meetings) {
            setMeetings(res.meetings);
            const foundInApi = res.meetings.find((m) => String(m.id) === String(targetMeetingId));
            if (foundInApi) {
              openMeetingModal(foundInApi);
            }
          }
        })
        .catch(() => {});
    }
  }, [activeNav, meetings, leads]);

  // Map meetings to leads
  const leadMeetingsMap = useMemo(() => {
    const map = new Map<string, ScheduledMeeting[]>();
    leads.forEach((l) => map.set(l.id, []));

    meetings.forEach((m) => {
      // Find matching lead
      const matched = leads.find(
        (l) =>
          (m.leadId && m.leadId === l.id) ||
          (m.leadDbId && m.leadDbId === l.id) ||
          (m.leadCode && m.leadCode === l.leadId) ||
          (m.contactId && m.contactId === l.id) ||
          (m.clientName && m.clientName.toLowerCase().includes(l.name.toLowerCase()))
      );
      if (matched) {
        const arr = map.get(matched.id) || [];
        arr.push(m);
        map.set(matched.id, arr);
      }
    });

    return map;
  }, [leads, meetings]);

  // Filtered Leads List (ONLY leads that have meetings are displayed)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const leadMeets = leadMeetingsMap.get(lead.id) || [];
      const hasMeetings = leadMeets.length > 0;

      // Must have scheduled meetings
      if (!hasMeetings) return false;

      const hasToday = leadMeets.some((m) => m.meetingDate === todayStr);
      const hasUpcoming = leadMeets.some(
        (m) => m.meetingDate > todayStr && m.status?.toLowerCase() !== 'cancelled'
      );
      const hasCompleted = leadMeets.some((m) => m.status?.toLowerCase() === 'completed');

      // 1. Tab filter
      if (leadTab === 'TODAY' && !hasToday) return false;
      if (leadTab === 'UPCOMING' && !hasUpcoming) return false;
      if (leadTab === 'COMPLETED' && !hasCompleted) return false;

      // 2. Status dropdown filter
      if (statusFilter !== 'All') {
        const matchesStatus = leadMeets.some(
          (m) => (m.status || m.meetingStatus || '').toLowerCase() === statusFilter.toLowerCase()
        );
        if (!matchesStatus) return false;
      }

      // 3. Search query
      if (searchInput.trim()) {
        const query = searchInput.toLowerCase();
        const matchName = (lead.name || '').toLowerCase().includes(query);
        const matchCompany = (lead.companyName || '').toLowerCase().includes(query);
        const matchEmail = (lead.email || '').toLowerCase().includes(query);
        const matchPhone = (lead.phone || '').toLowerCase().includes(query);
        const matchProfession = (lead.profession || '').toLowerCase().includes(query);
        const matchMeeting = leadMeets.some(
          (m) =>
            (m.title || '').toLowerCase().includes(query) ||
            (m.purpose || '').toLowerCase().includes(query) ||
            (m.employeeName || '').toLowerCase().includes(query)
        );
        if (!matchName && !matchCompany && !matchEmail && !matchPhone && !matchProfession && !matchMeeting)
          return false;
      }

      return true;
    });
  }, [leads, leadMeetingsMap, leadTab, statusFilter, searchInput, todayStr]);

  // Pagination for Leads list
  const totalLeadPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page, pageSize]);

  // Counts for top capsule pills (for leads with meetings)
  const leadsWithMeetings = useMemo(() => {
    return leads.filter((l) => (leadMeetingsMap.get(l.id) || []).length > 0);
  }, [leads, leadMeetingsMap]);

  const totalLeadsWithMeetingsCount = leadsWithMeetings.length;

  const todayLeadsCount = useMemo(() => {
    return leadsWithMeetings.filter((l) =>
      (leadMeetingsMap.get(l.id) || []).some((m) => m.meetingDate === todayStr)
    ).length;
  }, [leadsWithMeetings, leadMeetingsMap, todayStr]);

  const upcomingLeadsCount = useMemo(() => {
    return leadsWithMeetings.filter((l) =>
      (leadMeetingsMap.get(l.id) || []).some(
        (m) => m.meetingDate > todayStr && m.status?.toLowerCase() !== 'cancelled'
      )
    ).length;
  }, [leadsWithMeetings, leadMeetingsMap, todayStr]);

  const completedLeadsCount = useMemo(() => {
    return leadsWithMeetings.filter((l) =>
      (leadMeetingsMap.get(l.id) || []).some((m) => m.status?.toLowerCase() === 'completed')
    ).length;
  }, [leadsWithMeetings, leadMeetingsMap]);

  // Selected Lead's Meetings
  const selectedLeadMeetings = useMemo(() => {
    if (!activeLeadSelection) return [];
    return leadMeetingsMap.get(activeLeadSelection.id) || [];
  }, [activeLeadSelection, leadMeetingsMap]);

  // Handlers
  const handleLeadTabChange = (tab: ActiveLeadTabType) => {
    setLeadTab(tab);
    setPage(1);
  };

  const handleSelectLead = (lead: Lead) => {
    setActiveLeadSelection(lead);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_selected_lead', JSON.stringify(lead));
    }
  };

  const handleOpenAddModal = (targetLead?: Lead | null) => {
    setEditingMeeting(null);
    setFormPurpose('');
    setFormTitle('');
    const host = employees.length > 0 ? employees[0] : null;
    setFormEmployeeId(host ? host.id || host.empCode : null);
    setFormEmployeeName(host ? host.name : 'Admin User');
    setFormEmployeeEmail(host ? host.email || '' : '');
    setFormEmployeeDesignation(host ? host.designation || host.role || '' : '');

    const leadToUse = targetLead || activeLeadSelection;
    if (leadToUse) {
      setFormContactId(leadToUse.id);
      setFormClientName(leadToUse.companyName ? `${leadToUse.name} (${leadToUse.companyName})` : leadToUse.name);
    } else {
      setFormContactId(null);
      setFormClientName('');
    }

    setFormMeetingDate(new Date().toISOString().split('T')[0]);
    setFormStartTime('10:00 AM');
    setFormDuration('30 Minutes');
    setFormEndTime('10:30 AM');
    setFormMeetingType('Virtual');
    setFormLocation('');
    setFormStatus('Scheduled');
    setFormNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (meeting: ScheduledMeeting) => {
    setEditingMeeting(meeting);
    setFormPurpose(meeting.purpose || meeting.title || '');
    setFormTitle(meeting.title || meeting.purpose || '');
    setFormEmployeeId(meeting.employeeId || null);
    setFormEmployeeName(meeting.employeeName || meeting.assignedTo || '');
    setFormEmployeeEmail(meeting.employeeEmail || '');
    setFormEmployeeDesignation(meeting.employeeDesignation || '');
    setFormMeetingDate(meeting.meetingDate || '');
    const meetingTime = meeting.meetingTime || meeting.startTime || meeting.time || '10:00 AM';
    const dur = meeting.duration || inferDuration(meeting.startTime, meeting.endTime);
    setFormStartTime(meetingTime);
    setFormDuration(dur);
    setFormEndTime(meeting.endTime || calculateEndTime(meetingTime, dur));
    setFormMeetingType(meeting.meetingType || 'Virtual');
    setFormLocation(meeting.location || meeting.meetingLocation || meeting.meetingLink || '');
    setFormContactId(meeting.leadId || meeting.contactId || null);
    setFormClientName(meeting.clientName || meeting.leadName || '');
    setFormStatus(meeting.status || 'Scheduled');
    setFormNotes(meeting.notes || meeting.description || '');
    setModalOpen(true);
  };

  const handleSaveMeeting = async () => {
    if (!formPurpose.trim() && !formTitle.trim()) {
      notifications.show({ title: 'Validation Error', message: 'Please enter meeting title or purpose.', color: 'red' });
      return;
    }
    if (!formMeetingDate) {
      notifications.show({ title: 'Validation Error', message: 'Please select meeting date.', color: 'red' });
      return;
    }

    const resolvedLeadId = formContactId || activeLeadSelection?.id;
    if (!resolvedLeadId && !editingMeeting) {
      notifications.show({ title: 'Validation Error', message: 'Please select an associated lead.', color: 'red' });
      return;
    }

    setSubmitting(true);
    try {
      const computedEndTime = calculateEndTime(formStartTime, formDuration);
      const payload: Partial<ScheduledMeeting> = {
        title: (formTitle || formPurpose).trim(),
        purpose: (formPurpose || formTitle).trim(),
        meetingTitle: (formTitle || formPurpose).trim(),
        leadId: resolvedLeadId || undefined,
        lead_id: resolvedLeadId || undefined,
        employeeId: formEmployeeId || undefined,
        employeeName: formEmployeeName.trim() || 'Admin User',
        assignedTo: formEmployeeName.trim() || 'Admin User',
        assigned_to: formEmployeeName.trim() || 'Admin User',
        employeeEmail: formEmployeeEmail.trim() || undefined,
        employeeDesignation: formEmployeeDesignation.trim() || undefined,
        meetingDate: formMeetingDate,
        startTime: formStartTime,
        meetingTime: formStartTime,
        time: formStartTime,
        endTime: computedEndTime,
        duration: formDuration,
        meetingType: formMeetingType,
        location: formLocation.trim() || undefined,
        meetingLocation: formLocation.trim() || undefined,
        contactId: resolvedLeadId || undefined,
        clientName: formClientName.trim() || undefined,
        status: formStatus,
        meetingStatus: formStatus,
        notes: formNotes.trim() || undefined,
        description: formNotes.trim() || undefined,
      };

      if (editingMeeting) {
        await updateMeetingApi(editingMeeting.id, payload);
        notifications.show({
          title: 'Meeting Updated',
          message: 'Scheduled meeting updated successfully.',
          color: 'teal',
        });
      } else {
        await createMeetingApi(payload);
        notifications.show({
          title: 'Meeting Scheduled',
          message: 'New meeting scheduled successfully.',
          color: 'teal',
        });
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      notifications.show({
        title: 'Save Failed',
        message: err.message || 'Could not save meeting to database.',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteMeetingApi(deleteTarget.id);
      notifications.show({
        title: 'Meeting Deleted',
        message: 'Scheduled meeting removed successfully from database.',
        color: 'blue',
      });
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      notifications.show({ title: 'Delete Failed', message: err.message, color: 'red' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenLeadActivityPipeline = (lead: Lead) => {
    setSelectedLead(lead);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_selected_lead', JSON.stringify(lead));
      sessionStorage.setItem('crm_schedule_tab', 'pipeline');
    }
    setActiveNav('lead-schedule');
  };

  const handleNavigateToLeadFromMeeting = (m: ScheduledMeeting) => {
    const matched = leads.find(
      (l) =>
        (m.leadId && m.leadId === l.id) ||
        (m.leadDbId && m.leadDbId === l.id) ||
        (m.leadCode && m.leadCode === l.leadId) ||
        (m.contactId && m.contactId === l.id) ||
        (m.clientName && m.clientName.toLowerCase().includes(l.name.toLowerCase()))
    );
    if (matched) {
      handleOpenLeadActivityPipeline(matched);
    } else if (activeLeadSelection) {
      handleOpenLeadActivityPipeline(activeLeadSelection);
    }
  };

  const statusDropdownOptions = [
    { value: 'All', label: 'All' },
    { value: 'Scheduled', label: 'Scheduled' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  return (
    <Box p={{ base: 'md', md: 'lg' }} style={{ maxWidth: 1520, margin: '0 auto' }}>
      {/* ========================================================================= */}
      {/* VIEW A: SELECTED LEAD MEETINGS VIEW (Drill-Down Detail)                   */}
      {/* ========================================================================= */}
      {activeLeadSelection ? (
        <Box>
          {/* Top Bar with Back Button & Action Controls */}
          <Paper
            p="sm"
            radius="lg"
            mb="md"
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              <Group gap="sm">
                <Button
                  variant="subtle"
                  color="gray"
                  size="sm"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => setActiveLeadSelection(null)}
                  style={{
                    fontWeight: 600,
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  Back to Leads
                </Button>

                <Box
                  style={{
                    height: 24,
                    width: 1,
                    backgroundColor: isDark ? '#374151' : '#E2E8F0',
                  }}
                />

                <Group gap="xs">
                  <Box
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: isDark ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDark ? '#818CF8' : '#4F46E5',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {(activeLeadSelection.name || 'L').charAt(0).toUpperCase()}
                  </Box>
                  <div>
                    <Group gap={8} align="center">
                      <Text fw={700} size="md" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                        {activeLeadSelection.name}
                      </Text>
                      <Box
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px 8px',
                          borderRadius: 100,
                          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                          color: isDark ? '#A5B4FC' : '#4F46E5',
                          border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #E0E7FF',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {selectedLeadMeetings.length} {selectedLeadMeetings.length === 1 ? 'Meeting' : 'Meetings'}
                      </Box>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {activeLeadSelection.companyName
                        ? `${activeLeadSelection.companyName} • ${activeLeadSelection.email || activeLeadSelection.phone || 'Lead'}`
                        : `${activeLeadSelection.email || activeLeadSelection.phone || 'Individual Lead'}`}
                    </Text>
                  </div>
                </Group>
              </Group>

              <Group gap="xs">
                <Button
                  size="sm"
                  variant="default"
                  radius="md"
                  leftSection={<IconLayersSubtract size={16} color="#4F46E5" />}
                  onClick={() => handleOpenLeadActivityPipeline(activeLeadSelection)}
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    height: 36,
                    borderColor: isDark ? '#374151' : '#E2E8F0',
                  }}
                >
                  Activity Pipeline
                </Button>

                <Button
                  size="sm"
                  radius="md"
                  leftSection={<IconPlus size={16} />}
                  onClick={() => handleOpenAddModal(activeLeadSelection)}
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: 13,
                    height: 36,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                  }}
                >
                  Schedule Meeting
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* That Lead's Meetings Table */}
          <MeetingTableView
            meetings={selectedLeadMeetings}
            onEdit={handleOpenEditModal}
            onDelete={(m) => setDeleteTarget(m)}
            onAddNew={() => handleOpenAddModal(activeLeadSelection)}
            onNavigateToLead={() => handleOpenLeadActivityPipeline(activeLeadSelection)}
            onMeetingUpdated={() => loadData()}
            onViewDetails={(m) => setDetailsMeeting(m)}
            loading={loading}
          />
        </Box>
      ) : (
        /* ========================================================================= */
        /* VIEW B: LEADS LIST VIEW (Screenshot 2 Layout)                              */
        /* ========================================================================= */
        <Box>
          {/* Top Controls Bar - Matches Contacts design */}
          <Paper
            p="sm"
            radius="lg"
            mb="md"
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              {/* Left Capsule Filter Tabs */}
              <Box
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  padding: 3,
                  borderRadius: 10,
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                }}
              >
                {[
                  { id: 'ALL' as ActiveLeadTabType, label: 'All', count: totalLeadsWithMeetingsCount },
                  { id: 'TODAY' as ActiveLeadTabType, label: 'Today', count: todayLeadsCount },
                  { id: 'UPCOMING' as ActiveLeadTabType, label: 'Upcoming', count: upcomingLeadsCount },
                  { id: 'COMPLETED' as ActiveLeadTabType, label: 'Completed', count: completedLeadsCount },
                ].map((tab) => {
                  const active = leadTab === tab.id;
                  return (
                    <UnstyledButton
                      key={tab.id}
                      onClick={() => handleLeadTabChange(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        backgroundColor: active ? (isDark ? '#0F172A' : '#FFFFFF') : 'transparent',
                        color: active ? (isDark ? '#818CF8' : '#4F46E5') : isDark ? '#94A3B8' : '#64748B',
                        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{tab.label}</span>
                      <Box
                        style={{
                          minWidth: 20,
                          height: 20,
                          padding: '0 6px',
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: active
                            ? isDark
                              ? '#4338CA'
                              : '#4F46E5'
                            : isDark
                            ? '#334155'
                            : '#CBD5E1',
                          color: active ? '#FFFFFF' : isDark ? '#94A3B8' : '#475569',
                        }}
                      >
                        {tab.count}
                      </Box>
                    </UnstyledButton>
                  );
                })}
              </Box>

              {/* Right Search, Dropdown & Schedule Meeting Button */}
              <Group gap="xs" wrap="wrap">
                <TextInput
                  placeholder="Search meetings or leads..."
                  leftSection={<IconSearch size={15} color={isDark ? '#94A3B8' : '#64748B'} />}
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.currentTarget.value);
                    setPage(1);
                  }}
                  size="sm"
                  radius="md"
                  styles={{
                    input: {
                      backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                      borderColor: isDark ? '#374151' : '#E2E8F0',
                      color: isDark ? '#F1F5F9' : '#0F172A',
                      fontSize: 13,
                      height: 36,
                    },
                  }}
                  style={{ width: 220 }}
                  rightSection={
                    searchInput ? (
                      <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setSearchInput('')}>
                        <IconX size={12} />
                      </ActionIcon>
                    ) : null
                  }
                />

                <Select
                  data={statusDropdownOptions}
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val || 'All');
                    setPage(1);
                  }}
                  size="sm"
                  radius="md"
                  styles={{
                    input: {
                      backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                      borderColor: isDark ? '#374151' : '#E2E8F0',
                      color: isDark ? '#F1F5F9' : '#0F172A',
                      fontSize: 13,
                      height: 36,
                    },
                  }}
                  style={{ width: 125 }}
                  allowDeselect={false}
                />

                <Button
                  leftSection={<IconPlus size={16} />}
                  radius="md"
                  size="sm"
                  onClick={() => handleOpenAddModal(null)}
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: 13,
                    height: 36,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                  }}
                >
                  Schedule Meeting
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* Table Container: Leads List View */}
          {loading ? (
            <Center p="4rem">
              <Stack align="center" gap="sm">
                <Loader color="indigo" />
                <Text size="sm" c="dimmed">
                  Loading leads and scheduled meetings...
                </Text>
              </Stack>
            </Center>
          ) : (
            <LeadMeetingsTableView
              leads={paginatedLeads}
              meetings={meetings}
              onSelectLead={handleSelectLead}
              onScheduleMeetingForLead={(l) => handleOpenAddModal(l)}
              loading={loading}
            />
          )}

          {/* Pagination Footer */}
          {!loading && filteredLeads.length > 0 && (
            <Paper
              p="sm"
              px="md"
              radius="lg"
              mt="md"
              style={{
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <Group justify="space-between" align="center">
                <Text size="xs" c="dimmed">
                  Showing {filteredLeads.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
                  {Math.min(page * pageSize, filteredLeads.length)} of {filteredLeads.length} leads with meetings
                </Text>
                {totalLeadPages > 1 && (
                  <Group gap="xs">
                    <Button
                      variant="subtle"
                      size="xs"
                      color="gray"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      style={{ fontSize: 12, fontWeight: 500 }}
                    >
                      &lt; Previous
                    </Button>
                    <Box
                      style={{
                        minWidth: 28,
                        height: 28,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isDark ? '1px solid #374151' : '1px solid #E2E8F0',
                        fontSize: 12,
                        fontWeight: 600,
                        color: isDark ? '#F1F5F9' : '#0F172A',
                      }}
                    >
                      {page}
                    </Box>
                    <Text size="xs" c="dimmed">of {totalLeadPages}</Text>
                    <Button
                      variant="subtle"
                      size="xs"
                      color="gray"
                      disabled={page === totalLeadPages}
                      onClick={() => setPage((p) => Math.min(totalLeadPages, p + 1))}
                      style={{ fontSize: 12, fontWeight: 500 }}
                    >
                      Next &gt;
                    </Button>
                  </Group>
                )}
              </Group>
            </Paper>
          )}
        </Box>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT MEETING MODAL                                                  */}
      {/* ========================================================================= */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="teal" variant="light" size="md" radius="md">
              <IconCalendarEvent size={18} />
            </ThemeIcon>
            <Text fw={700} size="md">
              {editingMeeting ? 'Edit Scheduled Meeting' : 'Schedule New Meeting'}
            </Text>
          </Group>
        }
        size="lg"
        radius="lg"
      >
        <Stack gap="md" mt="xs">
          {/* Associated Lead Selection */}
          <Select
            label="Associated Lead"
            placeholder="Select Lead from CRM"
            data={leads.map((l) => ({
              value: l.id,
              label: l.companyName ? `${l.name} (${l.companyName})` : l.name,
            }))}
            value={formContactId}
            onChange={(val) => {
              setFormContactId(val);
              const matched = leads.find((l) => l.id === val);
              if (matched) {
                setFormClientName(matched.companyName ? `${matched.name} (${matched.companyName})` : matched.name);
                if (!formTitle) {
                  setFormTitle(`Discovery Call with ${matched.name}`);
                  setFormPurpose(`Discovery Call with ${matched.name}`);
                }
              }
            }}
            searchable
            clearable
            required
          />

          {/* Meeting Title & Purpose */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Meeting Title"
              placeholder="e.g. Discovery & Architecture Call"
              value={formTitle}
              onChange={(e) => setFormTitle(e.currentTarget.value)}
              required
            />
            <TextInput
              label="Purpose / Agenda"
              placeholder="e.g. Product Demo & Scope Discussion"
              value={formPurpose}
              onChange={(e) => setFormPurpose(e.currentTarget.value)}
              required
            />
          </SimpleGrid>

          {/* Assigned Host / Employee */}
          <Select
            label="Assigned Host / User"
            placeholder="Select Host"
            data={employees.map((e) => ({
              value: e.id || e.empCode,
              label: `${e.name} (${e.designation || e.role || 'Host'})`,
            }))}
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
            clearable
          />

          {/* Date & Timings */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <MeetingDatePicker
              label="Meeting Date"
              value={formMeetingDate}
              onChange={(val) => setFormMeetingDate(val)}
              required
            />
            <MeetingTimePicker
              label="Meeting Time"
              placeholder="10:00 AM"
              value={formStartTime}
              onChange={(val) => setFormStartTime(val)}
              required
            />
            <Select
              label="Duration"
              data={['15 Minutes', '30 Minutes', '45 Minutes', '1 Hour', '1.5 Hours', '2 Hours']}
              value={formDuration}
              onChange={(val) => setFormDuration(val || '30 Minutes')}
              allowDeselect={false}
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

          {/* Status */}
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
            <Button variant="default" radius="md" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              radius="md"
              loading={submitting}
              onClick={handleSaveMeeting}
              style={{
                background: isDark ? '#374151' : '#0F172A',
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      <Modal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={
          <Group gap="xs">
            <ThemeIcon color="red" variant="light" size="md" radius="md">
              <IconAlertTriangle size={18} />
            </ThemeIcon>
            <Text fw={700} size="md">
              Cancel / Delete Meeting
            </Text>
          </Group>
        }
        size="sm"
        radius="lg"
      >
        <Stack gap="md" mt="xs">
          <Text size="sm" c="dimmed">
            Are you sure you want to remove the scheduled meeting &quot;
            <Text component="span" fw={600} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              {deleteTarget?.title || deleteTarget?.purpose}
            </Text>
            &quot;? This record will be permanently deleted from database.
          </Text>

          <Group justify="flex-end" mt="xs">
            <Button variant="default" radius="md" onClick={() => setDeleteTarget(null)}>
              No, Keep
            </Button>
            <Button color="red" radius="md" loading={deleteLoading} onClick={handleConfirmDelete}>
              Yes, Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Meeting Details & Requirements Modal */}
      <MeetingDetailsModal
        opened={!!detailsMeeting}
        onClose={() => setDetailsMeeting(null)}
        meeting={detailsMeeting}
        onMeetingUpdated={(updated) => {
          setDetailsMeeting(updated);
          loadData();
        }}
        onNavigateToLead={handleNavigateToLeadFromMeeting}
      />
    </Box>
  );
};
