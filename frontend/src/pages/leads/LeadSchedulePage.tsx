import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Stack,
  SimpleGrid,
  Grid,
  TextInput,
  Select,
  Popover,
  Textarea,
  Button,
  Group,
  Text,
  ActionIcon,
  Badge,
  useComputedColorScheme,
  Divider,
  Card,
  Menu,
  Modal,
  Avatar,
  Tooltip,
  ThemeIcon,
  ScrollArea,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconUser,
  IconBriefcase,
  IconMail,
  IconPhone,
  IconBrandWhatsapp,
  IconBuilding,
  IconBox,
  IconLayersSubtract,
  IconPlus,
  IconClock,
  IconCheck,
  IconCalendar,
  IconTag,
  IconUserCheck,
  IconVideo,
  IconMapPin,
  IconTrash,
  IconExternalLink,
  IconChevronDown,
  IconPhoneCall,
  IconPhoneOutgoing,
  IconPhoneX,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconMessageDots,
  IconNote,
  IconSend,
  IconCopy,
  IconEdit,
  IconUsers,
  IconLock,
  IconInfoCircle,
  IconFileDescription,
  IconPaperclip,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Lead, ScheduledMeeting } from '../../types/lead';
import { useLead } from '../../context/LeadContext';
import { useCRM } from '../../context/CRMContext';
import { createMeetingApi, fetchMeetingsApi } from '../../services/meetingService';
import { MeetingDatePicker } from '../meetings/components/MeetingDatePicker';

interface LeadSchedulePageProps {
  lead?: Lead | null;
  onBack: () => void;
  onSuccess?: () => void;
}


export const LeadSchedulePage: React.FC<LeadSchedulePageProps> = ({
  lead: propLead,
  onBack,
  onSuccess,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { currentUser, setActiveNav } = useCRM();
  const { leads, updateLead } = useLead();

  // If no lead passed via props, retrieve from sessionStorage or fallback to first lead
  const [activeLead, setActiveLead] = useState<Lead | null>(() => {
    if (propLead) return propLead;
    try {
      const saved = sessionStorage.getItem('crm_selected_lead');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return leads.length > 0 ? leads[0] : null;
  });

  useEffect(() => {
    if (propLead) {
      setActiveLead(propLead);
    } else {
      try {
        const saved = sessionStorage.getItem('crm_selected_lead');
        if (saved) setActiveLead(JSON.parse(saved));
      } catch (e) {}
    }
  }, [propLead]);

  // Tags State
  const [tags, setTags] = useState<string[]>(() => {
    const list: string[] = [];
    if (activeLead?.productList && activeLead.productList.length > 0) {
      list.push(...activeLead.productList);
    }
    if (activeLead?.serviceList && activeLead.serviceList.length > 0) {
      list.push(...activeLead.serviceList);
    }
    if (list.length === 0) list.push(activeLead?.category || 'Service');
    return Array.from(new Set(list));
  });
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [showTagInput, setShowTagInput] = useState<boolean>(false);

  // Meeting Form Fields
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [meetingType, setMeetingType] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [meetingTime, setMeetingTime] = useState<string>('');
  const [timePickerOpened, setTimePickerOpened] = useState<boolean>(false);
  const [meetingHours, setMeetingHours] = useState<string>('11');
  const [meetingMinutes, setMeetingMinutes] = useState<string>('00');
  const [meetingPeriod, setMeetingPeriod] = useState<string>('AM');
  const [exactMinInput, setExactMinInput] = useState<string>('0');
  const [duration, setDuration] = useState<string>('');
  const [hostName, setHostName] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [stageAfterMeeting, setStageAfterMeeting] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Dynamic field labels & placeholders based on Meeting Type (Virtual vs In-Person)
  const isVirtualMeeting = meetingType.toLowerCase().includes('virtual');
  const isInPersonMeeting = meetingType.toLowerCase().includes('in-person');

  const locationFieldLabel = isVirtualMeeting
    ? 'Meeting Link'
    : isInPersonMeeting
    ? 'Meeting Location'
    : 'Meeting Link / Location';

  const locationFieldPlaceholder = isVirtualMeeting
    ? 'https://meet.google.com/... or https://zoom.us/j/...'
    : isInPersonMeeting
    ? 'Client Office Address, Conference Room, or Our Office location'
    : 'Enter meeting link or location address';

  // View mode for right container: 'schedule' (Schedule Meeting form) vs 'pipeline' (Activity Pipeline)
  const [rightViewMode, setRightViewMode] = useState<'schedule' | 'pipeline'>('schedule');

  // Activity stream & Modals State
  const [scheduleModalOpened, setScheduleModalOpened] = useState<boolean>(false);
  const [callModalOpened, setCallModalOpened] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<string>('15m');
  const [callStatus, setCallStatus] = useState<string>('Completed');
  const [callNotes, setCallNotes] = useState<string>('');
  const [replyBoxOpened, setReplyBoxOpened] = useState<boolean>(false);
  const [commentBoxOpened, setCommentBoxOpened] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [commentText, setCommentText] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('');

  const [customActivities, setCustomActivities] = useState<Array<{
    id: string;
    type: 'comment' | 'reply' | 'call';
    author: string;
    title?: string;
    text?: string;
    duration?: string;
    status?: string;
    date: string;
    timeAgo: string;
  }>>(() => {
    if (!activeLead) return [];
    try {
      const saved = localStorage.getItem(`crm_activities_${activeLead.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Scheduled Meetings Store (persisted per lead in backend and localStorage)
  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>(() => {
    if (!activeLead) return [];
    try {
      const saved = localStorage.getItem(`crm_meetings_${activeLead.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return [];
  });

  // Determines whether the first meeting has been scheduled
  const isFirstMeetingScheduled = useMemo(() => {
    return scheduledMeetings.length > 0;
  }, [scheduledMeetings]);

  // Sync scheduled meetings from backend API for this lead
  const fetchLeadBackendMeetings = useCallback(async () => {
    if (!activeLead) return;
    try {
      const res = await fetchMeetingsApi({ leadId: activeLead.id });
      if (res.meetings && res.meetings.length > 0) {
        const mapped: ScheduledMeeting[] = res.meetings.map((m) => ({
          id: m.id,
          leadId: activeLead.id,
          title: m.meetingTitle || m.title || m.purpose,
          purpose: m.meetingTitle || m.title || m.purpose,
          meetingType: m.meetingType || 'Virtual (Google Meet)',
          date: m.meetingDate,
          meetingDate: m.meetingDate,
          time: m.meetingTime || m.startTime,
          startTime: m.meetingTime || m.startTime,
          duration: m.duration || '30 Minutes',
          hostName: m.assignedTo || m.employeeName || 'Host',
          employeeName: m.assignedTo || m.employeeName || 'Host',
          meetingLink: m.meetingLink || m.meetingLocation || m.location || '',
          stageAfterMeeting: m.stageAfterMeeting || activeLead.stage || '',
          status: (m.meetingStatus || m.status as any) || 'Scheduled',
          requirements: m.requirements || '',
          requirementFileName: m.requirementFileName || '',
          requirementFileUrl: m.requirementFileUrl || '',
          requirementFileSize: m.requirementFileSize || '',
          createdAt: m.createdAt || new Date().toISOString(),
        }));
        setScheduledMeetings(mapped);
        localStorage.setItem(`crm_meetings_${activeLead.id}`, JSON.stringify(mapped));
      } else {
        setScheduledMeetings([]);
        localStorage.removeItem(`crm_meetings_${activeLead.id}`);
      }
    } catch (_) {}
  }, [activeLead?.id, activeLead?.stage]);

  useEffect(() => {
    fetchLeadBackendMeetings();
  }, [fetchLeadBackendMeetings]);

  // Synchronize meeting updates in real-time across tabs / views
  useEffect(() => {
    const handleMeetingUpdated = (e: any) => {
      const updated = e.detail as ScheduledMeeting;
      if (!updated) return;
      setScheduledMeetings((prev) =>
        prev.map((m) =>
          m.id === updated.id
            ? {
                ...m,
                ...updated,
                status: updated.status || updated.meetingStatus || m.status,
                requirements: updated.requirements !== undefined ? updated.requirements : m.requirements,
                requirementFileName: updated.requirementFileName !== undefined ? updated.requirementFileName : m.requirementFileName,
                requirementFileUrl: updated.requirementFileUrl !== undefined ? updated.requirementFileUrl : m.requirementFileUrl,
                requirementFileSize: updated.requirementFileSize !== undefined ? updated.requirementFileSize : m.requirementFileSize,
              }
            : m
        )
      );
      fetchLeadBackendMeetings();
    };

    window.addEventListener('crm:meeting-updated', handleMeetingUpdated);
    window.addEventListener('storage', fetchLeadBackendMeetings);
    return () => {
      window.removeEventListener('crm:meeting-updated', handleMeetingUpdated);
      window.removeEventListener('storage', fetchLeadBackendMeetings);
    };
  }, [fetchLeadBackendMeetings]);

  useEffect(() => {
    try {
      const tab = sessionStorage.getItem('crm_schedule_tab');
      if (!isFirstMeetingScheduled) {
        setRightViewMode('schedule');
      } else if (tab === 'schedule') {
        setRightViewMode('schedule');
      } else if (tab === 'pipeline') {
        setRightViewMode('pipeline');
      } else {
        setRightViewMode('pipeline');
      }
    } catch (e) {}
  }, [activeLead, isFirstMeetingScheduled]);

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags((prev) => [...prev, newTagInput.trim()]);
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const updateFromParts = (h: string, m: string, p: string) => {
    const formattedH = h ? (h.length === 1 ? `0${h}` : h) : '11';
    const formattedM = m ? (m.length === 1 ? `0${m}` : m) : '00';
    setMeetingHours(formattedH);
    setMeetingMinutes(formattedM);
    setMeetingPeriod(p);
    setMeetingTime(`${formattedH}:${formattedM} ${p}`);
  };

  const handlePeriodSelect = (p: string) => {
    setMeetingPeriod(p);
    updateFromParts(meetingHours, meetingMinutes, p);
  };

  const handleHourSelect = (h: string) => {
    setMeetingHours(h);
    updateFromParts(h, meetingMinutes, meetingPeriod);
  };

  const handleMinuteSelect = (m: string) => {
    setMeetingMinutes(m);
    setExactMinInput(parseInt(m, 10).toString());
    updateFromParts(meetingHours, m, meetingPeriod);
  };

  const handleExactMinChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setExactMinInput(clean);
    if (clean !== '') {
      const num = parseInt(clean, 10);
      if (num <= 59) {
        const padded = clean.length === 1 ? `0${clean}` : clean;
        setMeetingMinutes(padded);
        updateFromParts(meetingHours, padded, meetingPeriod);
      }
    }
  };

  const handleClearTime = () => {
    setMeetingHours('12');
    setMeetingMinutes('00');
    setMeetingPeriod('AM');
    setExactMinInput('0');
    setMeetingTime('');
  };

  const handleManualTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMeetingTime(val);

    const match = val.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (match) {
      const hNum = parseInt(match[1], 10);
      const mNum = parseInt(match[2], 10);
      if (hNum >= 1 && hNum <= 12 && mNum >= 0 && mNum <= 59) {
        const hStr = hNum < 10 ? `0${hNum}` : `${hNum}`;
        const mStr = mNum < 10 ? `0${mNum}` : `${mNum}`;
        const pStr = match[3] ? match[3].toUpperCase() : meetingPeriod;
        setMeetingHours(hStr);
        setMeetingMinutes(mStr);
        setMeetingPeriod(pStr);
        setExactMinInput(mNum.toString());
      }
    }
  };

  const handleLogCall = () => {
    if (!activeLead) return;
    const newCall = {
      id: `call-${Date.now()}`,
      type: 'call' as const,
      author: currentUser?.name || 'Sandy',
      title: 'Outbound Call',
      duration: callDuration,
      status: callStatus,
      text: callNotes.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeAgo: 'Just now',
    };
    const updated = [newCall, ...customActivities];
    setCustomActivities(updated);
    localStorage.setItem(`crm_activities_${activeLead.id}`, JSON.stringify(updated));
    setCallModalOpened(false);
    setCallNotes('');
    notifications.show({
      title: 'Call Logged Successfully',
      message: 'Call activity added to activity pipeline.',
      color: 'teal',
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !activeLead) {
      notifications.show({
        title: 'Note Content Required',
        message: 'Please enter note content.',
        color: 'red',
      });
      return;
    }
    const newComment = {
      id: `comm-${Date.now()}`,
      type: 'comment' as const,
      author: currentUser?.name || 'Sandy',
      title: noteTitle.trim() || 'Activity Note',
      text: commentText.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeAgo: 'Just now',
    };
    const updated = [newComment, ...customActivities];
    setCustomActivities(updated);
    localStorage.setItem(`crm_activities_${activeLead.id}`, JSON.stringify(updated));
    setCommentText('');
    setNoteTitle('');
    setCommentBoxOpened(false);
    notifications.show({
      title: 'Note Added Successfully',
      message: 'Note added to activity pipeline.',
      color: 'teal',
    });
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !activeLead) {
      notifications.show({
        title: 'Message Required',
        message: 'Please enter your email message.',
        color: 'red',
      });
      return;
    }
    const newReply = {
      id: `reply-${Date.now()}`,
      type: 'reply' as const,
      author: currentUser?.name || 'Sandy',
      title: emailSubject.trim() || `Email to ${activeLead.email || activeLead.name}`,
      text: replyText.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeAgo: 'Just now',
    };
    const updated = [newReply, ...customActivities];
    setCustomActivities(updated);
    localStorage.setItem(`crm_activities_${activeLead.id}`, JSON.stringify(updated));
    setReplyText('');
    setEmailSubject('');
    setReplyBoxOpened(false);
    notifications.show({
      title: 'Email Sent Successfully',
      message: `Email recorded in activity pipeline for ${activeLead.email || 'lead'}.`,
      color: 'teal',
    });
  };

  const handleDeleteActivity = (actId: string) => {
    if (!activeLead) return;
    const updated = customActivities.filter((a) => a.id !== actId);
    setCustomActivities(updated);
    localStorage.setItem(`crm_activities_${activeLead.id}`, JSON.stringify(updated));
    notifications.show({
      title: 'Activity Removed',
      message: 'Item has been removed from the timeline.',
      color: 'gray',
    });
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;

    let finalTime = meetingTime.trim();
    if (!finalTime.toUpperCase().includes('AM') && !finalTime.toUpperCase().includes('PM')) {
      finalTime = `${finalTime} ${meetingPeriod}`;
    }

    if (!meetingTitle.trim() || !meetingDate || !finalTime) {
      notifications.show({
        title: 'Missing Details',
        message: 'Please provide meeting title, date, and meeting time.',
        color: 'red',
      });
      return;
    }

    if (!meetingType) {
      notifications.show({
        title: 'Meeting Type Required',
        message: 'Please select a meeting type (Virtual or In-Person).',
        color: 'red',
      });
      return;
    }

    if (!meetingLink.trim()) {
      notifications.show({
        title: isVirtualMeeting
          ? 'Meeting Link Required'
          : isInPersonMeeting
          ? 'Meeting Location Required'
          : 'Link / Location Required',
        message: isVirtualMeeting
          ? 'Please enter the virtual meeting link (Google Meet or Zoom URL).'
          : isInPersonMeeting
          ? 'Please enter the in-person meeting location or office address.'
          : 'Please enter the meeting link or location address.',
        color: 'red',
      });
      return;
    }

    try {
      setSaving(true);

      // Compute endTime based on duration
      let computedEndTime = '11:30 AM';
      try {
        const [timePart, meridiem] = finalTime.split(' ');
        const [h, m] = timePart.split(':').map(Number);
        const durMin = (duration && duration.includes('45')) ? 45 : (duration && duration.includes('60')) ? 60 : (duration && duration.includes('15')) ? 15 : 30;
        let totalMin = (h % 12 + (meridiem === 'PM' ? 12 : 0)) * 60 + m + durMin;
        const endH = Math.floor(totalMin / 60) % 24;
        const endM = totalMin % 60;
        const endMeridiem = endH >= 12 ? 'PM' : 'AM';
        const displayEndH = (endH % 12) || 12;
        computedEndTime = `${displayEndH}:${endM.toString().padStart(2, '0')} ${endMeridiem}`;
      } catch (_) {}

      // Save to Backend Database it_crm_meetings table
      let backendId = `meet-${Date.now()}`;
      try {
        const savedApiMeeting = await createMeetingApi({
          leadId: activeLead.id,
          lead_id: activeLead.id,
          title: meetingTitle.trim(),
          purpose: meetingTitle.trim(),
          meetingTitle: meetingTitle.trim(),
          meetingDate: meetingDate,
          startTime: finalTime,
          meetingTime: finalTime,
          endTime: computedEndTime,
          meetingType: meetingType || 'Virtual (Google Meet)',
          meetingLocation: meetingLink.trim(),
          meetingLink: meetingLink.trim(),
          location: meetingLink.trim(),
          employeeName: hostName.trim() || currentUser?.name || 'Assigned Host',
          assignedTo: hostName.trim() || currentUser?.name || 'Assigned Host',
          clientName: activeLead.companyName ? `${activeLead.name} (${activeLead.companyName})` : activeLead.name,
          contactId: activeLead.id,
          status: 'Scheduled',
          meetingStatus: 'Scheduled',
          description: `First discovery meeting with ${activeLead.name}. Stage: ${stageAfterMeeting || activeLead.stage || 'Discovery'}`,
          notes: `First discovery meeting with ${activeLead.name}. Stage: ${stageAfterMeeting || activeLead.stage || 'Discovery'}`,
          stageAfterMeeting: stageAfterMeeting || activeLead.stage || 'Discovery',
        });
        if (savedApiMeeting && savedApiMeeting.id) {
          backendId = savedApiMeeting.id;
        }
      } catch (apiErr: any) {
        console.warn('Backend API save warning, saving locally:', apiErr);
      }

      const newMeeting: ScheduledMeeting = {
        id: backendId,
        leadId: activeLead.id,
        title: meetingTitle.trim(),
        meetingType: meetingType || 'Virtual (Google Meet)',
        date: meetingDate,
        time: finalTime,
        duration: duration || '30 Minutes',
        hostName: hostName.trim() || currentUser?.name || 'Assigned Host',
        meetingLink: meetingLink.trim(),
        stageAfterMeeting: stageAfterMeeting || activeLead.stage || 'Discovery',
        status: 'Scheduled',
        createdAt: new Date().toISOString(),
      };

      const updatedList = [newMeeting, ...scheduledMeetings];
      setScheduledMeetings(updatedList);
      localStorage.setItem(`crm_meetings_${activeLead.id}`, JSON.stringify(updatedList));

      // Also update the lead status to In Progress and stage in database
      await updateLead(activeLead.id, {
        stage: stageAfterMeeting,
        status: 'In Progress',
      });

      notifications.show({
        title: 'Meeting Scheduled Successfully!',
        message: `Meeting on ${meetingDate} at ${finalTime} confirmed. Activity Pipeline is now unlocked!`,
        color: 'teal',
        icon: <IconCheck size={16} />,
      });

      setMeetingTitle('');
      setMeetingType('');
      setMeetingDate('');
      setMeetingTime('');
      setDuration('');
      setHostName('');
      setMeetingLink('');
      setStageAfterMeeting('');
      setScheduleModalOpened(false);
      // Immediately open and display Activity Pipeline for this lead
      setRightViewMode('pipeline');
      sessionStorage.setItem('crm_schedule_tab', 'pipeline');
    } catch (err: any) {
      notifications.show({
        title: 'Schedule Error',
        message: err.message || 'Failed to schedule meeting.',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeeting = (meetingId: string) => {
    if (!activeLead) return;
    const updated = scheduledMeetings.filter((m) => m.id !== meetingId);
    setScheduledMeetings(updated);
    localStorage.setItem(`crm_meetings_${activeLead.id}`, JSON.stringify(updated));
    notifications.show({
      title: 'Meeting Cancelled',
      message: 'Scheduled meeting has been removed.',
      color: 'gray',
    });
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayHours = (h + 11) % 12 + 1;
    return `${displayHours}:${m} ${suffix}`;
  };

  const getMeetingStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'yellow';
      case 'in progress':
        return 'blue';
      case 'completed':
        return 'teal';
      case 'cancelled':
        return 'red';
      case 'rescheduled':
        return 'orange';
      default:
        return 'yellow';
    }
  };

  const handleViewOutcome = (meet: ScheduledMeeting) => {
    try {
      sessionStorage.setItem('crm_open_meeting_id', String(meet.id));
      sessionStorage.setItem('crm_open_meeting_data', JSON.stringify(meet));
      if (activeLead) {
        sessionStorage.setItem('crm_selected_lead', JSON.stringify(activeLead));
      }
    } catch (_) {}
    setActiveNav('scheduled-meetings');
  };
  const handleViewRequirement = handleViewOutcome;

  const getInitial = (name?: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : 'L';
  };

  const leadName = activeLead?.name || 'Lead Contact';
  const designation = activeLead?.designation || '—';
  const email = activeLead?.email || '—';
  const phone = activeLead?.phone || '—';
  const contactType = activeLead?.contactType || 'Individual';
  const companyName = activeLead?.companyName || activeLead?.profession || '—';
  const requirementType = activeLead?.category || 'Service';
  const offerings =
    requirementType === 'Product'
      ? activeLead?.productList && activeLead.productList.length > 0
        ? activeLead.productList.join(', ')
        : '—'
      : activeLead?.serviceList && activeLead.serviceList.length > 0
      ? activeLead.serviceList.join(', ')
      : '—';

  return (
    <Box p={{ base: 'xs', sm: 'md' }} style={{ maxWidth: 1560, margin: '0 auto' }}>
      <Grid gutter={{ base: 'md', sm: 'lg' }} align="flex-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Lead Summary Card (Span 4 on desktop, 12 on mobile)          */}
        {/* ========================================================================= */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Paper
            p={{ base: 'md', sm: 'xl' }}
            radius="20px"
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECEF',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0, 0, 0, 0.03)',
              maxHeight: 'calc(100vh - 105px)',
              overflowY: 'auto',
            }}
          >
            {/* Header: Back Button + Lead Summary Title */}
            <Group gap="xs" mb="xl" align="center">
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="md"
                size="md"
                onClick={onBack}
                style={{
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                }}
              >
                <IconArrowLeft size={16} />
              </ActionIcon>
              <Text fw={800} size="16px" style={{ color: isDark ? '#F8FAFC' : '#1F2937' }}>
                Lead Summary
              </Text>
            </Group>

            {/* Lead Large Avatar */}
            <Group justify="center" mb="xl">
              <Box
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 800,
                  boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
                }}
              >
                {getInitial(leadName)}
              </Box>
            </Group>

            {/* Summary Details Rows */}
            <Stack gap="lg">
              {/* Contact Person */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <IconUser size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Contact Person
                  </Text>
                </Group>
                <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                  {leadName}
                </Text>
              </Group>

              {/* Designation */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <IconBriefcase size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Designation
                  </Text>
                </Group>
                <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                  {designation}
                </Text>
              </Group>

              {/* Email */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <IconMail size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Email
                  </Text>
                </Group>
                <Text
                  size="13px"
                  fw={600}
                  component="a"
                  href={email !== '—' ? `mailto:${email}` : undefined}
                  style={{ color: '#2563EB', textDecoration: 'none' }}
                >
                  {email}
                </Text>
              </Group>

              {/* Phone */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <IconPhone size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Phone
                  </Text>
                </Group>
                <Group gap={6} align="center">
                  <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                    {phone}
                  </Text>
                  {phone !== '—' && (
                    <Box
                      component="a"
                      href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        backgroundColor: '#22C55E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                      }}
                    >
                      <IconBrandWhatsapp size={12} stroke={2.5} />
                    </Box>
                  )}
                </Group>
              </Group>

              {/* Contact Type */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <IconUserCheck size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Contact Type
                  </Text>
                </Group>
                <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                  {contactType}
                </Text>
              </Group>

              {/* Company Name */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <IconBuilding size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Company Name
                  </Text>
                </Group>
                <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                  {companyName}
                </Text>
              </Group>

              {/* Requirement Type */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <IconBox size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Requirement Type
                  </Text>
                </Group>
                <Group gap={6} align="center">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: requirementType === 'Product' ? '#F97316' : '#8B5CF6',
                    }}
                  />
                  <Text size="13px" fw={600} style={{ color: requirementType === 'Product' ? '#F97316' : '#8B5CF6' }}>
                    {requirementType}
                  </Text>
                </Group>
              </Group>

              {/* Product / Service Offering */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <IconLayersSubtract size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    {requirementType}
                  </Text>
                </Group>
                <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827', textAlign: 'right' }}>
                  {offerings}
                </Text>
              </Group>
            </Stack>

            {/* Tags Section */}
            <Box mt="xl" pt="md" style={{ borderTop: isDark ? '1px solid #1F2937' : '1px solid #F1F5F9' }}>
              <Group justify="space-between" align="center" mb="xs">
                <Group gap={6}>
                  <IconTag size={15} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#1F2937' }}>
                    Tags
                  </Text>
                </Group>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconPlus size={12} />}
                  onClick={() => setShowTagInput(!showTagInput)}
                  styles={{ root: { padding: '0 6px', height: 24, fontSize: 11 } }}
                >
                  Add Tag
                </Button>
              </Group>

              {showTagInput && (
                <Group gap="xs" mb="sm">
                  <TextInput
                    size="xs"
                    placeholder="Enter tag name..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="xs"
                    onClick={handleAddTag}
                    style={{
                      background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                      color: '#FFFFFF',
                    }}
                  >
                    Add
                  </Button>
                </Group>
              )}

              <Group gap={6} wrap="wrap">
                {tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    radius="md"
                    size="md"
                    styles={{
                      root: {
                        backgroundColor:
                          idx === 0
                            ? isDark
                              ? 'rgba(79, 70, 229, 0.18)'
                              : '#EEF2FF'
                            : isDark
                            ? 'rgba(6, 182, 212, 0.18)'
                            : '#ECFEFF',
                        color:
                          idx === 0
                            ? isDark
                              ? '#A5B4FC'
                              : '#4338CA'
                            : isDark
                            ? '#67E8F9'
                            : '#0891B2',
                        border:
                          idx === 0
                            ? isDark
                              ? '1px solid rgba(99, 102, 241, 0.3)'
                              : '1px solid #C7D2FE'
                            : isDark
                            ? '1px solid rgba(6, 182, 212, 0.3)'
                            : '1px solid #A5F3FC',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 12,
                        padding: '4px 10px',
                      },
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </Group>
            </Box>
          </Paper>
        </Grid.Col>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Activity Pipeline (Span 8 on desktop, 12 on mobile)        */}
        {/* ========================================================================= */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper
            p={{ base: 'md', sm: 'xl' }}
            radius="20px"
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECEF',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0, 0, 0, 0.03)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 105px)',
              maxHeight: 'calc(100vh - 105px)',
              overflow: 'hidden',
            }}
          >
            {/* Top Bar: Title, Subtitle & View Mode Switcher */}
            <Box style={{ flexShrink: 0 }} mb="md">
              <Group justify="space-between" align="center" wrap="wrap" gap="md">
              <Group gap="sm" align="center">
                <Box
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#A5B4FC' : '#4F46E5',
                  }}
                >
                  <IconCalendar size={19} stroke={2.2} />
                </Box>
                <div>
                  <Text fw={800} size="20px" style={{ color: isDark ? '#F8FAFC' : '#111827', letterSpacing: '-0.02em' }}>
                    {rightViewMode === 'schedule' ? 'Schedule Meeting' : 'Activity Pipeline'}
                  </Text>
                  <Text size="xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    {rightViewMode === 'schedule'
                      ? `Set up a discovery call or presentation with ${leadName}`
                      : `Track activity progress and history for ${leadName}`}
                  </Text>
                </div>
              </Group>

              <Group gap="xs">
                {/* View Switcher Pills */}
                <Group
                  gap={4}
                  p={4}
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderRadius: 10,
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                  }}
                >
                  <Button
                    size="xs"
                    leftSection={<IconCalendar size={13} />}
                    onClick={() => {
                      setRightViewMode('schedule');
                      sessionStorage.setItem('crm_schedule_tab', 'schedule');
                    }}
                    style={{
                      borderRadius: 8,
                      fontWeight: 700,
                      background: rightViewMode === 'schedule' ? 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)' : 'transparent',
                      color: rightViewMode === 'schedule' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                      boxShadow: rightViewMode === 'schedule' ? '0 2px 8px rgba(79, 70, 229, 0.35)' : 'none',
                      border: 'none',
                    }}
                  >
                    Schedule Meeting
                  </Button>

                  <Tooltip
                    label={!isFirstMeetingScheduled ? "Schedule the first meeting to unlock the Activity Pipeline" : undefined}
                    withArrow
                  >
                    <Box component="span">
                      <Button
                        size="xs"
                        leftSection={!isFirstMeetingScheduled ? <IconLock size={13} /> : <IconLayersSubtract size={13} />}
                        disabled={!isFirstMeetingScheduled}
                        onClick={() => {
                          if (!isFirstMeetingScheduled) return;
                          setRightViewMode('pipeline');
                          sessionStorage.setItem('crm_schedule_tab', 'pipeline');
                        }}
                        style={{
                          borderRadius: 8,
                          fontWeight: 700,
                          background: rightViewMode === 'pipeline' ? 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)' : 'transparent',
                          color: rightViewMode === 'pipeline' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                          boxShadow: rightViewMode === 'pipeline' ? '0 2px 8px rgba(79, 70, 229, 0.35)' : 'none',
                          border: 'none',
                          opacity: !isFirstMeetingScheduled ? 0.6 : 1,
                          cursor: !isFirstMeetingScheduled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Activity Pipeline
                      </Button>
                    </Box>
                  </Tooltip>
                </Group>

                {rightViewMode === 'pipeline' && (
                  <Menu shadow="md" width={220} position="bottom-end">
                    <Menu.Target>
                      <Button
                        size="sm"
                        variant="default"
                        rightSection={<IconChevronDown size={14} />}
                        style={{
                          borderRadius: 10,
                          fontWeight: 600,
                          borderColor: isDark ? '#374151' : '#E2E8F0',
                          color: isDark ? '#F8FAFC' : '#1F2937',
                        }}
                      >
                        + New
                      </Button>
                    </Menu.Target>

                    <Menu.Dropdown style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF', border: isDark ? '1px solid #374151' : '1px solid #E2E8F0' }}>
                      <Menu.Item
                        leftSection={<IconCalendar size={15} color="#059669" />}
                        onClick={() => {
                          setRightViewMode('schedule');
                          sessionStorage.setItem('crm_schedule_tab', 'schedule');
                        }}
                        style={{ fontWeight: 500 }}
                      >
                        Schedule Next Meeting
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconPhoneCall size={15} color="#10B981" />}
                        onClick={() => {
                          setCallModalOpened(true);
                        }}
                        style={{ fontWeight: 500 }}
                      >
                        Log Call
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconMail size={15} color="#2563EB" />}
                        onClick={() => {
                          setReplyBoxOpened(true);
                          setCommentBoxOpened(false);
                        }}
                        style={{ fontWeight: 500 }}
                      >
                        Send Email to Lead
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconNote size={15} color="#D97706" />}
                        onClick={() => {
                          setCommentBoxOpened(true);
                          setReplyBoxOpened(false);
                        }}
                        style={{ fontWeight: 500 }}
                      >
                        Add Note
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>
            </Group>
          </Box>

            {/* Scrollable Middle Pipeline / Schedule Content Area */}
            <ScrollArea
              style={{ flex: 1, minHeight: 0, width: '100%' }}
              type="auto"
              offsetScrollbars
              scrollbarSize={6}
              pr={6}
            >
              {rightViewMode === 'schedule' ? (
              /* SCHEDULE MEETING FORM (Direct in-page view as in Image 1) */
              <Box
                component="form"
                onSubmit={handleScheduleMeeting}
                p={{ base: 'xs', sm: 'md' }}
              >
                <Stack gap="lg">
                  {!isFirstMeetingScheduled && (
                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                        border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE'}`,
                      }}
                    >
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon color="blue" variant="light" size="md" radius="xl">
                          <IconInfoCircle size={18} />
                        </ThemeIcon>
                        <div>
                          <Text size="xs" fw={700} style={{ color: isDark ? '#93C5FD' : '#1E40AF' }}>
                            First Meeting Scheduling Required
                          </Text>
                          <Text size="xs" style={{ color: isDark ? '#BFDBFE' : '#3B82F6' }} mt={2}>
                            Schedule the initial discovery call with {leadName}. Once scheduled, the Activity Pipeline will automatically unlock to track follow-ups and progression stages.
                          </Text>
                        </div>
                      </Group>
                    </Paper>
                  )}
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <TextInput
                      label="Meeting Title / Subject"
                      withAsterisk
                      placeholder={activeLead ? `e.g. Discovery & Requirement Call with ${activeLead.name}` : 'e.g. Discovery & Requirement Call'}
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      required
                      styles={{
                        label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                        input: {
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      }}
                    />

                    <Select
                      label="Meeting Type"
                      withAsterisk
                      placeholder="Select Meeting Type"
                      clearable
                      data={[
                        'Virtual (Google Meet)',
                        'Virtual (Zoom)',
                        'In-Person (Client Office)',
                        'In-Person (Our Office)',
                      ]}
                      value={meetingType}
                      onChange={(val) => setMeetingType(val || '')}
                      required
                      styles={{
                        label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                        input: {
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      }}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <MeetingDatePicker
                      label="Meeting Date"
                      placeholder="Select Meeting Date"
                      required
                      value={meetingDate}
                      onChange={(val) => setMeetingDate(val)}
                    />

                    {/* 12-Hour Time Picker with Popover */}
                    <Box>
                      <Popover
                        opened={timePickerOpened}
                        onChange={setTimePickerOpened}
                        position="bottom-start"
                        shadow="xl"
                        radius="md"
                        width={310}
                        withArrow
                      >
                        <Popover.Target>
                          <TextInput
                            label="Meeting Time"
                            placeholder="Select Meeting Time (e.g. 11:00 AM)"
                            required
                            withAsterisk
                            value={meetingTime}
                            onChange={handleManualTimeChange}
                            onClick={() => setTimePickerOpened(true)}
                            leftSection={<IconClock size={16} color="#64748B" />}
                            rightSection={
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTimePickerOpened((o) => !o);
                                }}
                              >
                                <IconClock size={16} />
                              </ActionIcon>
                            }
                            styles={{
                              label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                              input: {
                                height: 44,
                                borderRadius: 10,
                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                borderColor: isDark ? '#334155' : '#E2E8F0',
                              },
                            }}
                          />
                        </Popover.Target>

                        <Popover.Dropdown p="sm">
                          {/* Header */}
                          <Group justify="space-between" align="center" mb={8}>
                            <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: '0.05em' }}>
                              12-HOUR TIME
                            </Text>
                            <Badge
                              size="md"
                              radius="sm"
                              variant="outline"
                              styles={{
                                root: {
                                  borderColor: isDark ? '#475569' : '#D1D5DB',
                                  color: isDark ? '#F1F5F9' : '#1F2937',
                                  fontWeight: 700,
                                  backgroundColor: isDark ? '#1E293B' : '#F3F4F6',
                                },
                              }}
                            >
                              {meetingTime || 'Select Time'}
                            </Badge>
                          </Group>
                          <Divider mb={8} />

                          {/* Period (AM / PM) */}
                          <Text size="xs" fw={700} c="dimmed" mb={4} style={{ letterSpacing: '0.03em' }}>
                            PERIOD (AM / PM)
                          </Text>
                          <SimpleGrid cols={2} spacing={6} mb={10}>
                            {['AM', 'PM'].map((p) => (
                              <Button
                                key={p}
                                size="xs"
                                radius="md"
                                onClick={() => handlePeriodSelect(p)}
                                style={{
                                  backgroundColor: meetingPeriod === p ? '#4B5563' : (isDark ? '#1E293B' : '#F3F4F6'),
                                  color: meetingPeriod === p ? '#FFFFFF' : (isDark ? '#94A3B8' : '#4B5563'),
                                  fontWeight: 700,
                                  height: 30,
                                  border: meetingPeriod === p ? 'none' : isDark ? '1px solid #334155' : '1px solid #E5E7EB',
                                  transition: 'all 150ms ease',
                                }}
                              >
                                {p}
                              </Button>
                            ))}
                          </SimpleGrid>

                          {/* Hour (01 - 12) */}
                          <Text size="xs" fw={700} c="dimmed" mb={4} style={{ letterSpacing: '0.03em' }}>
                            HOUR (01 – 12)
                          </Text>
                          <SimpleGrid cols={6} spacing={4} mb={10}>
                            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((hr) => (
                              <Button
                                key={hr}
                                size="xs"
                                radius="sm"
                                p={0}
                                onClick={() => handleHourSelect(hr)}
                                style={{
                                  backgroundColor: meetingHours === hr ? '#4B5563' : (isDark ? '#1E293B' : '#FFFFFF'),
                                  color: meetingHours === hr ? '#FFFFFF' : (isDark ? '#F1F5F9' : '#1F2937'),
                                  height: 28,
                                  fontSize: 12,
                                  fontWeight: meetingHours === hr ? 700 : 500,
                                  border: meetingHours === hr ? 'none' : isDark ? '1px solid #334155' : '1px solid #E5E7EB',
                                  transition: 'all 150ms ease',
                                }}
                              >
                                {hr}
                              </Button>
                            ))}
                          </SimpleGrid>

                          {/* Minute */}
                          <Group justify="space-between" align="center" mb={4}>
                            <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: '0.03em' }}>
                              MINUTE
                            </Text>
                            <Text size="xs" c="dimmed" fw={600}>
                              :{meetingMinutes}
                            </Text>
                          </Group>
                          <SimpleGrid cols={6} spacing={4} mb={10}>
                            {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((min) => (
                              <Button
                                key={min}
                                size="xs"
                                radius="sm"
                                p={0}
                                onClick={() => handleMinuteSelect(min)}
                                style={{
                                  backgroundColor: meetingMinutes === min ? '#4B5563' : (isDark ? '#1E293B' : '#FFFFFF'),
                                  color: meetingMinutes === min ? '#FFFFFF' : (isDark ? '#F1F5F9' : '#1F2937'),
                                  height: 28,
                                  fontSize: 12,
                                  fontWeight: meetingMinutes === min ? 700 : 500,
                                  border: meetingMinutes === min ? 'none' : isDark ? '1px solid #334155' : '1px solid #E5E7EB',
                                  transition: 'all 150ms ease',
                                }}
                              >
                                {min}
                              </Button>
                            ))}
                          </SimpleGrid>

                          <Divider my={8} />

                          {/* Footer */}
                          <Group justify="space-between" align="center">
                            <Button
                              variant="subtle"
                              size="xs"
                              p={0}
                              onClick={handleClearTime}
                              style={{
                                color: '#0078D4',
                                fontWeight: 600,
                                fontSize: 13,
                              }}
                            >
                              Clear Time
                            </Button>

                            <Group gap={4} align="center">
                              <Text size="xs" c="dimmed" fw={500}>Exact Min:</Text>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                value={exactMinInput}
                                onChange={(e) => handleExactMinChange(e.target.value)}
                                placeholder="0"
                                style={{
                                  width: 38,
                                  height: 26,
                                  borderRadius: 4,
                                  border: isDark ? '1px solid #374151' : '1px solid #D1D5DB',
                                  background: isDark ? '#1E293B' : '#FFFFFF',
                                  color: isDark ? '#FFFFFF' : '#1F2937',
                                  textAlign: 'center',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  outline: 'none',
                                }}
                              />
                            </Group>

                            <Button
                              size="xs"
                              radius="sm"
                              onClick={() => setTimePickerOpened(false)}
                              style={{
                                backgroundColor: '#374151',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                height: 26,
                                padding: '0 14px',
                              }}
                            >
                              Done
                            </Button>
                          </Group>
                        </Popover.Dropdown>
                      </Popover>
                    </Box>
                  </SimpleGrid>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <Select
                      label="Duration"
                      placeholder="Select Duration"
                      clearable
                      data={['15 Minutes', '30 Minutes', '45 Minutes', '1 Hour', '1.5 Hours', '2 Hours']}
                      value={duration}
                      onChange={(val) => setDuration(val || '')}
                      styles={{
                        label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                        input: {
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      }}
                    />

                    <TextInput
                      label="Host / Assigned Rep"
                      placeholder={currentUser?.name ? `e.g. ${currentUser.name}` : 'e.g. Host / Assigned Rep'}
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      styles={{
                        label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                        input: {
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      }}
                    />
                  </SimpleGrid>

                  <TextInput
                    label={locationFieldLabel}
                    withAsterisk
                    required
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder={locationFieldPlaceholder}
                    leftSection={
                      isInPersonMeeting ? (
                        <IconMapPin size={16} color="#64748B" />
                      ) : (
                        <IconVideo size={16} color="#64748B" />
                      )
                    }
                    styles={{
                      label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                      input: {
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                    }}
                  />

                  <Group justify="flex-end" mt="xl" gap="md">
                    {isFirstMeetingScheduled && (
                      <Button
                        type="button"
                        variant="default"
                        size="md"
                        radius="10px"
                        onClick={() => {
                          setRightViewMode('pipeline');
                          sessionStorage.setItem('crm_schedule_tab', 'pipeline');
                        }}
                        style={{
                          borderColor: isDark ? '#374151' : '#E2E8F0',
                          fontWeight: 600,
                        }}
                      >
                        View Activity Pipeline
                      </Button>
                    )}
                    <Button
                      type="submit"
                      size="md"
                      radius="10px"
                      loading={saving}
                      leftSection={<IconCheck size={18} />}
                      style={{
                        background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        padding: '0 26px',
                        boxShadow: '0 4px 16px rgba(79, 70, 229, 0.35)',
                        border: 'none',
                      }}
                    >
                      {!isFirstMeetingScheduled ? 'Schedule First Meeting ✓' : 'Schedule Meeting ✓'}
                    </Button>
                  </Group>
                </Stack>
              </Box>
            ) : (
              <>
                {scheduledMeetings.length === 0 && customActivities.length === 0 ? (
                  <Box
                    p="3.5rem"
                    style={{
                      textAlign: 'center',
                      borderRadius: '16px',
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      border: isDark ? '1px dashed #334155' : '1px dashed #CBD5E1',
                      margin: '20px 0',
                    }}
                  >
                    <Box
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#A5B4FC' : '#4F46E5',
                        margin: '0 auto 16px',
                      }}
                    >
                      <IconCalendar size={26} />
                    </Box>
                    <Text fw={700} size="16px" style={{ color: isDark ? '#F8FAFC' : '#111827' }} mb={6}>
                      No Pipeline Activities Yet
                    </Text>
                    <Text size="sm" c="dimmed" mb="lg" style={{ maxWidth: 420, margin: '0 auto 20px' }}>
                      Schedule a meeting, log a call, or add notes to start tracking this lead's activity pipeline.
                    </Text>
                    <Button
                      size="sm"
                      leftSection={<IconCalendar size={15} />}
                      onClick={() => {
                        setRightViewMode('schedule');
                        sessionStorage.setItem('crm_schedule_tab', 'schedule');
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                        color: '#FFFFFF',
                        borderRadius: 10,
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                        border: 'none',
                      }}
                    >
                      Schedule Discovery Meeting
                    </Button>
                  </Box>
                ) : (
                  <>
                    {/* Vertical Activity Pipeline */}
                    <Box style={{ position: 'relative', paddingLeft: '52px', paddingBottom: '20px' }}>
                      {/* Continuous Vertical Timeline Line */}
                      <Box
                        style={{
                          position: 'absolute',
                          left: '18px',
                          top: '16px',
                          bottom: '24px',
                          width: '2px',
                          backgroundColor: isDark ? '#334155' : '#E2E8F0',
                        }}
                      />

                      {/* Custom Activities (Calls, Emails, Notes) */}
                      {customActivities.map((act) => {
                        if (act.type === 'call') {
                          return (
                            <Box key={act.id} mb="28px" style={{ position: 'relative' }}>
                              {/* Node Icon */}
                              <Box
                                style={{
                                  position: 'absolute',
                                  left: '-52px',
                                  top: '0px',
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  backgroundColor: isDark ? '#064E3B' : '#D1FAE5',
                                  border: isDark ? '2px solid #10B981' : '2px solid #059669',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isDark ? '#6EE7B7' : '#047857',
                                  zIndex: 2,
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                }}
                              >
                                <IconPhoneCall size={18} />
                              </Box>

                              {/* Header */}
                              <Group justify="space-between" align="center" mb={8}>
                                <Group gap="xs" align="center">
                                  <Avatar size={24} radius="xl" color="teal">
                                    {act.author ? act.author.charAt(0) : 'S'}
                                  </Avatar>
                                  <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                                    {act.author} logged a call with {leadName}
                                  </Text>
                                </Group>
                                <Group gap="xs" align="center">
                                  <Badge
                                    size="sm"
                                    variant="light"
                                    color={act.status === 'Completed' ? 'green' : 'orange'}
                                    style={{ fontWeight: 600, textTransform: 'none' }}
                                  >
                                    {act.status || 'Completed'}
                                  </Badge>
                                  {act.duration && (
                                    <Badge size="sm" variant="outline" color="gray" style={{ textTransform: 'none' }}>
                                      {act.duration}
                                    </Badge>
                                  )}
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => handleDeleteActivity(act.id)}
                                    title="Delete Call Log"
                                  >
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                </Group>
                              </Group>

                              {/* Card */}
                              <Box
                                p="14px 18px"
                                style={{
                                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                                  border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                                  borderRadius: '14px',
                                }}
                              >
                                {act.text && (
                                  <Text size="13px" style={{ color: isDark ? '#E2E8F0' : '#334155' }} mb={6}>
                                    {act.text}
                                  </Text>
                                )}
                                <Text size="11px" c="dimmed">
                                  {act.date} • {act.timeAgo}
                                </Text>
                              </Box>
                            </Box>
                          );
                        }

                        if (act.type === 'reply') {
                          return (
                            <Box key={act.id} mb="28px" style={{ position: 'relative' }}>
                              {/* Node Icon */}
                              <Box
                                style={{
                                  position: 'absolute',
                                  left: '-52px',
                                  top: '0px',
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF',
                                  border: isDark ? '2px solid #3B82F6' : '2px solid #2563EB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isDark ? '#93C5FD' : '#1D4ED8',
                                  zIndex: 2,
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                }}
                              >
                                <IconMail size={18} />
                              </Box>

                              {/* Header */}
                              <Group justify="space-between" align="center" mb={8}>
                                <Group gap="xs" align="center">
                                  <Avatar size={24} radius="xl" color="blue">
                                    {act.author ? act.author.charAt(0) : 'S'}
                                  </Avatar>
                                  <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                                    {act.author} sent an email to {activeLead?.email || leadName}
                                  </Text>
                                </Group>
                                <Group gap="xs" align="center">
                                  <Badge size="sm" variant="filled" color="blue" style={{ fontWeight: 600, textTransform: 'none' }}>
                                    Email Sent
                                  </Badge>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => handleDeleteActivity(act.id)}
                                    title="Delete Email Activity"
                                  >
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                </Group>
                              </Group>

                              {/* Card */}
                              <Box
                                p="14px 18px"
                                style={{
                                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                                  border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                                  borderRadius: '14px',
                                }}
                              >
                                {act.title && (
                                  <Text fw={700} size="13px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }} mb={4}>
                                    Subject: {act.title}
                                  </Text>
                                )}
                                {act.text && (
                                  <Text size="13px" style={{ color: isDark ? '#CBD5E1' : '#475569', whiteSpace: 'pre-wrap' }} mb={6}>
                                    {act.text}
                                  </Text>
                                )}
                                <Text size="11px" c="dimmed">
                                  {act.date} • {act.timeAgo}
                                </Text>
                              </Box>
                            </Box>
                          );
                        }

                        // type === 'comment' (Note)
                        return (
                          <Box key={act.id} mb="28px" style={{ position: 'relative' }}>
                            {/* Node Icon */}
                            <Box
                              style={{
                                position: 'absolute',
                                left: '-52px',
                                top: '0px',
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: isDark ? '#78350F' : '#FEF3C7',
                                border: isDark ? '2px solid #F59E0B' : '2px solid #D97706',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDark ? '#FDE68A' : '#B45309',
                                zIndex: 2,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                              }}
                            >
                              <IconNote size={18} />
                            </Box>

                            {/* Header */}
                            <Group justify="space-between" align="center" mb={8}>
                              <Group gap="xs" align="center">
                                <Avatar size={24} radius="xl" color="yellow">
                                  {act.author ? act.author.charAt(0) : 'S'}
                                </Avatar>
                                <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                                  {act.author} added an activity note
                                </Text>
                              </Group>
                              <Group gap="xs" align="center">
                                <Badge size="sm" variant="light" color="yellow" style={{ fontWeight: 600, textTransform: 'none' }}>
                                  Internal Note
                                </Badge>
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  color="red"
                                  onClick={() => handleDeleteActivity(act.id)}
                                  title="Delete Note"
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Group>
                            </Group>

                            {/* Card */}
                            <Box
                              p="14px 18px"
                              style={{
                                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                                border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                                borderRadius: '14px',
                              }}
                            >
                              {act.title && (
                                <Text fw={700} size="13px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }} mb={4}>
                                  {act.title}
                                </Text>
                              )}
                              {act.text && (
                                <Text size="13px" style={{ color: isDark ? '#CBD5E1' : '#475569', whiteSpace: 'pre-wrap' }} mb={6}>
                                  {act.text}
                                </Text>
                              )}
                              <Text size="11px" c="dimmed">
                                {act.date} • {act.timeAgo}
                              </Text>
                            </Box>
                          </Box>
                        );
                      })}

                      {/* Loop through all scheduled meetings */}
                      {scheduledMeetings.map((meet, meetIdx) => {
                        const prevMeet = meetIdx > 0 ? scheduledMeetings[meetIdx - 1] : null;
                        const shouldShowAgenda = (() => {
                          if (meetIdx === 0) return true;
                          if (!prevMeet) return false;

                          const currentStage = meet.stageAfterMeeting || activeLead?.stage || 'Discovery';
                          const prevStage = prevMeet.stageAfterMeeting || activeLead?.stage || 'Discovery';
                          if (currentStage !== prevStage) return true;

                          const currentAgenda = (meet.agenda || meet.purpose || '').trim();
                          const prevAgenda = (prevMeet.agenda || prevMeet.purpose || '').trim();
                          if (currentAgenda && currentAgenda !== prevAgenda) return true;

                          const currentHost = (meet.hostName || '').trim();
                          const prevHost = (prevMeet.hostName || '').trim();
                          if (currentHost && prevHost && currentHost !== prevHost) return true;

                          const currentReq = (meet.requirements || '').trim();
                          const prevReq = (prevMeet.requirements || '').trim();
                          if (currentReq && currentReq !== prevReq) return true;

                          return false;
                        })();

                        return (
                          <Box key={meet.id} mb="xl">
                  {/* ========================================================= */}
                  {/* STAGE 1: MEETING SCHEDULED                                */}
                  {/* ========================================================= */}
                  <Box mb="28px" style={{ position: 'relative' }}>
                    {/* Node 1 Marker Icon */}
                    <Box
                      style={{
                        position: 'absolute',
                        left: '-52px',
                        top: '0px',
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
                        border: isDark ? '2px solid #6366F1' : '2px solid #4F46E5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#A5B4FC' : '#4F46E5',
                        zIndex: 2,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      }}
                    >
                      <IconCalendar size={18} stroke={2.2} />
                    </Box>

                    {/* Stage 1 Header */}
                    <Group justify="space-between" align="center" mb={8}>
                      <Group gap="xs" align="center">
                        <Avatar size={24} radius="xl" color="green">
                          {meet.hostName ? meet.hostName.charAt(0) : 'S'}
                        </Avatar>
                        <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                          {meet.hostName} scheduled a meeting with {leadName}
                        </Text>
                      </Group>
                      <Badge
                        size="sm"
                        variant="light"
                        color={getMeetingStatusColor(meet.status)}
                        style={{
                          fontWeight: 700,
                          textTransform: 'none',
                        }}
                      >
                        {meet.status || 'Scheduled'}
                      </Badge>
                    </Group>

                    {/* Stage 1 Card: Meeting Info */}
                    <Box
                      p="16px 20px"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                        borderRadius: '14px',
                      }}
                    >
                      <Group justify="space-between" align="center" wrap="wrap">
                        <Box>
                          <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                            {meet.title}
                          </Text>
                          <Group gap="xs" mt={8} wrap="wrap">
                            <Badge
                              variant="light"
                              color="teal"
                              size="md"
                              leftSection={<IconCalendar size={13} />}
                              style={{ textTransform: 'none', fontWeight: 600 }}
                            >
                              {meet.date} at {formatDisplayTime(meet.time)}
                            </Badge>
                            <Badge
                              variant="outline"
                              color="blue"
                              size="md"
                              leftSection={<IconClock size={13} />}
                              style={{ textTransform: 'none', fontWeight: 600 }}
                            >
                              {meet.duration}
                            </Badge>
                            <Badge
                              variant="subtle"
                              color="gray"
                              size="md"
                              style={{ textTransform: 'none', fontWeight: 600 }}
                            >
                              {meet.meetingType}
                            </Badge>
                            <Badge
                              variant="light"
                              color={getMeetingStatusColor(meet.status)}
                              size="md"
                              style={{ textTransform: 'none', fontWeight: 600 }}
                            >
                              Status: {meet.status || 'Scheduled'}
                            </Badge>
                            <Text size="xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                              Host: {meet.hostName}
                            </Text>
                          </Group>
                        </Box>

                        <Group gap="xs">
                          {(() => {
                            const isCompleted =
                              (meet.status?.toLowerCase() === 'completed') ||
                              ((meet.meetingStatus as string)?.toLowerCase() === 'completed');
                            const hasRequirement = Boolean(meet.requirements && meet.requirements.trim());
                            if (isCompleted || hasRequirement) {
                              return (
                                <Button
                                  size="xs"
                                  leftSection={<IconExternalLink size={13} />}
                                  onClick={() => handleViewOutcome(meet)}
                                  style={{
                                    background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                                    color: '#FFFFFF',
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                                    border: 'none',
                                  }}
                                >
                                  View Outcome
                                </Button>
                              );
                            }
                            return null;
                          })()}

                          <ActionIcon
                            size="md"
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeleteMeeting(meet.id)}
                            title="Cancel Meeting"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Box>
                  </Box>

                  {/* ========================================================= */}
                  {/* STAGE 2: MEETING VENUE & LINK READY                       */}
                  {/* ========================================================= */}
                  <Box mb="28px" style={{ position: 'relative' }}>
                    {/* Node 2 Marker Icon */}
                    <Box
                      style={{
                        position: 'absolute',
                        left: '-52px',
                        top: '0px',
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF',
                        border: isDark ? '2px solid #3B82F6' : '2px solid #2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#93C5FD' : '#1D4ED8',
                        zIndex: 2,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      }}
                    >
                      <IconVideo size={18} />
                    </Box>

                    {/* Stage 2 Header */}
                    <Group justify="space-between" align="center" mb={8}>
                      <Group gap="xs" align="center">
                        <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                          Meeting Access Link & Calendar Invite
                        </Text>
                      </Group>
                    </Group>

                    {/* Stage 2 Card */}
                    <Box
                      p="16px 20px"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                        borderRadius: '14px',
                      }}
                    >
                      <Group justify="space-between" align="center" wrap="wrap">
                        <div>
                          <Text size="xs" fw={700} c="dimmed" mb={4} style={{ letterSpacing: '0.04em' }}>
                            {meet.meetingType ? `${meet.meetingType.toUpperCase()} VENUE` : 'MEETING VENUE'}
                          </Text>
                          <Text
                            fw={600}
                            size="13px"
                            style={{
                              color: meet.meetingLink ? '#0078D4' : isDark ? '#94A3B8' : '#64748B',
                              fontFamily: meet.meetingLink ? 'monospace' : 'inherit',
                              wordBreak: 'break-all',
                            }}
                          >
                            {meet.meetingLink || 'Meeting venue/link not specified'}
                          </Text>
                          <Text size="xs" mt={4} style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                            {meet.meetingLink
                              ? 'Calendar invite & dial-in credentials shared with client.'
                              : 'Location or meeting link can be updated anytime.'}
                          </Text>
                        </div>

                        {meet.meetingLink ? (
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="default"
                              leftSection={<IconCopy size={13} />}
                              onClick={() => {
                                navigator.clipboard.writeText(meet.meetingLink || '');
                                notifications.show({
                                  title: 'Link Copied',
                                  message: 'Meeting link copied to clipboard.',
                                  color: 'teal',
                                });
                              }}
                              style={{ borderRadius: 8, fontWeight: 600 }}
                            >
                              Copy Link
                            </Button>

                            {meet.meetingLink.startsWith('http') && (
                              <Button
                                component="a"
                                href={meet.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="xs"
                                leftSection={<IconExternalLink size={13} />}
                                style={{
                                  backgroundColor: isDark ? '#14532D' : '#1E3A2B',
                                  color: '#FFFFFF',
                                  borderRadius: 8,
                                  fontWeight: 700,
                                }}
                              >
                                Join {meet.meetingLink.includes('meet.google') ? 'Google Meet' : 'Meeting'}
                              </Button>
                            )}
                          </Group>
                        ) : null}
                      </Group>
                    </Box>
                  </Box>

                  {/* ========================================================= */}
                  {/* STAGE 3: DISCUSSION & REQUIREMENTS PHASE                  */}
                  {/* ========================================================= */}
                  {shouldShowAgenda && (
                    <Box mb="28px" style={{ position: 'relative' }}>
                      {/* Node 3 Marker Icon */}
                      <Box
                        style={{
                          position: 'absolute',
                          left: '-52px',
                          top: '0px',
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: isDark ? '#4C1D95' : '#F5F3FF',
                          border: isDark ? '2px solid #8B5CF6' : '2px solid #7C3AED',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isDark ? '#C4B5FD' : '#6D28D9',
                          zIndex: 2,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        }}
                      >
                        <IconUsers size={18} />
                      </Box>

                      {/* Stage 3 Header */}
                      <Group justify="space-between" align="center" mb={8}>
                        <Group gap="xs" align="center">
                          <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                            Discovery Agenda & Discussion Topics
                          </Text>
                        </Group>
                        <Badge
                          size="xs"
                          variant="outline"
                          color="violet"
                          style={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Target Stage: {meet.stageAfterMeeting || activeLead?.stage || '—'}
                        </Badge>
                      </Group>

                      {/* Stage 3 Card */}
                      <Box
                        p="16px 20px"
                        style={{
                          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                          border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                          borderRadius: '14px',
                        }}
                      >
                        <Text size="13px" style={{ color: isDark ? '#E2E8F0' : '#334155', lineHeight: 1.6 }}>
                          • <strong>Lead Interest:</strong> {offerings && offerings !== '—' ? offerings : '—'}.
                          <br />
                          • <strong>Organization:</strong> {companyName && companyName !== '—' ? companyName : '—'} ({contactType || 'Individual'}).
                          <br />
                          • <strong>Representative:</strong> {meet.hostName || 'Host'}
                          {Boolean(meet.agenda || meet.purpose) && (
                            <>
                              <br />
                              • <strong>Agenda / Focus:</strong> {meet.agenda || meet.purpose}.
                            </>
                          )}
                        </Text>
                      </Box>
                    </Box>
                  )}

                  {/* End of meeting pipeline stages */}
                </Box>
              );
            })}
            </Box>
                  </>
                )}
              </>
            )}
            </ScrollArea>
        </Paper>

          {/* ========================================================================= */}
          {/* LOG CALL MODAL                                                            */}
          {/* ========================================================================= */}
          <Modal
            opened={callModalOpened}
            onClose={() => setCallModalOpened(false)}
            size="md"
            radius="16px"
            styles={{
              content: {
                maxWidth: 'calc(100vw - 24px)',
                margin: '10px auto',
              },
            }}
            title={
              <Group gap="xs">
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: isDark ? '#064E3B' : '#D1FAE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                  }}
                >
                  <IconPhoneCall size={16} />
                </Box>
                <Text fw={700} size="16px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                  Log Outbound Call
                </Text>
              </Group>
            }
          >
            <Stack gap="md">
              <Select
                label="Call Outcome"
                data={['Completed', 'No Answer', 'Busy', 'Wrong Number', 'Left Voicemail']}
                value={callStatus}
                onChange={(val) => setCallStatus(val || 'Completed')}
              />
              <Select
                label="Duration"
                data={['1m', '5m', '9m', '15m', '30m']}
                value={callDuration}
                onChange={(val) => setCallDuration(val || '9m')}
              />
              <Textarea
                label="Call Notes"
                placeholder="Discussed requirements and demo availability..."
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                minRows={3}
              />
              <Group justify="flex-end" mt="sm">
                <Button variant="default" onClick={() => setCallModalOpened(false)}>
                  Cancel
                </Button>
                <Button
                  style={{ backgroundColor: '#10B981', color: '#FFF' }}
                  onClick={handleLogCall}
                >
                  Save Call
                </Button>
              </Group>
            </Stack>
          </Modal>

          {/* ========================================================================= */}
          {/* SEND EMAIL MODAL                                                          */}
          {/* ========================================================================= */}
          <Modal
            opened={replyBoxOpened}
            onClose={() => setReplyBoxOpened(false)}
            size="md"
            radius="16px"
            styles={{
              content: {
                maxWidth: 'calc(100vw - 24px)',
                margin: '10px auto',
              },
            }}
            title={
              <Group gap="xs">
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB',
                  }}
                >
                  <IconMail size={16} />
                </Box>
                <Text fw={700} size="16px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                  Send Email to Lead
                </Text>
              </Group>
            }
          >
            <Stack gap="md">
              <TextInput
                label="To (Lead Email)"
                value={activeLead?.email || 'No email specified'}
                readOnly
                disabled
                leftSection={<IconMail size={15} />}
                styles={{
                  input: {
                    backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                    color: isDark ? '#CBD5E1' : '#475569',
                  },
                }}
              />
              <TextInput
                label="Subject"
                placeholder="e.g. Discovery Call Follow-up / Solution Proposal"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                required
              />
              <Textarea
                label="Email Message"
                placeholder="Write your email message to the client..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                minRows={4}
                required
              />
              <Group justify="flex-end" mt="sm">
                <Button variant="default" onClick={() => setReplyBoxOpened(false)}>
                  Cancel
                </Button>
                <Button
                  leftSection={<IconSend size={14} />}
                  style={{ backgroundColor: '#2563EB', color: '#FFF' }}
                  onClick={handleSendReply}
                >
                  Send Email
                </Button>
              </Group>
            </Stack>
          </Modal>

          {/* ========================================================================= */}
          {/* ADD NOTE MODAL                                                            */}
          {/* ========================================================================= */}
          <Modal
            opened={commentBoxOpened}
            onClose={() => setCommentBoxOpened(false)}
            size="md"
            radius="16px"
            styles={{
              content: {
                maxWidth: 'calc(100vw - 24px)',
                margin: '10px auto',
              },
            }}
            title={
              <Group gap="xs">
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: isDark ? '#78350F' : '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                  }}
                >
                  <IconNote size={16} />
                </Box>
                <Text fw={700} size="16px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                  Add Activity Note
                </Text>
              </Group>
            }
          >
            <Stack gap="md">
              <TextInput
                label="Note Title / Topic"
                placeholder="e.g. Client Requirement Note, Follow-up Discussion"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <Textarea
                label="Note Content"
                placeholder="Enter discussion minutes, customer feedback, next action items..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                minRows={4}
                required
              />
              <Group justify="flex-end" mt="sm">
                <Button variant="default" onClick={() => setCommentBoxOpened(false)}>
                  Cancel
                </Button>
                <Button
                  leftSection={<IconNote size={14} />}
                  style={{ backgroundColor: '#D97706', color: '#FFF' }}
                  onClick={handleAddComment}
                >
                  Save Note
                </Button>
              </Group>
            </Stack>
          </Modal>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default LeadSchedulePage;
