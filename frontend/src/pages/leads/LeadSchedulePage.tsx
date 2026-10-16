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
  IconFilter,
  IconFolder,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Lead, ScheduledMeeting } from '../../types/lead';
import { useLead } from '../../context/LeadContext';
import { useCRM } from '../../context/CRMContext';
import { useEmployee } from '../../context/EmployeeContext';
import { useContact } from '../../context/ContactContext';
import { createMeetingApi, fetchMeetingsApi } from '../../services/meetingService';
import { MeetingDatePicker } from '../meetings/components/MeetingDatePicker';
import { MeetingTimePicker } from '../meetings/components/MeetingTimePicker';
import { CallLogModal } from '../calls/components/CallLogModal';
import { CallLog } from '../../types/callLog';
import { fetchCallLogsApi, createCallLogApi, deleteCallLogApi } from '../../services/callLogService';

interface LeadSchedulePageProps {
  lead?: Lead | null;
  onBack: () => void;
  onSuccess?: () => void;
}


const generateGoogleMeetLink = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const r = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${r(3)}-${r(4)}-${r(3)}`;
};

const generateZoomLink = (): string => {
  return `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
};

export const LeadSchedulePage: React.FC<LeadSchedulePageProps> = ({
  lead: propLead,
  onBack,
  onSuccess,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { currentUser, setActiveNav } = useCRM();
  const { leads, updateLead } = useLead();
  const { employees } = useEmployee();
  const { contacts } = useContact();

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

  // Extract all distinct projects / services for this lead
  const leadProjects = useMemo(() => {
    const list: string[] = [];
    if (activeLead?.serviceList && activeLead.serviceList.length > 0) {
      list.push(...activeLead.serviceList);
    }
    if (activeLead?.productList && activeLead.productList.length > 0) {
      list.push(...activeLead.productList);
    }
    tags.forEach((t) => {
      if (t && t !== 'Service' && t !== 'Product' && !list.includes(t)) {
        list.push(t);
      }
    });
    return Array.from(new Set(list.map((item) => item.trim()))).filter(Boolean);
  }, [activeLead?.serviceList, activeLead?.productList, tags]);

  // Selected project filter for the Activity Pipeline (default: first project, NO 'all' option)
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>(() => leadProjects[0] || '');
  const [selectedMeetingProject, setSelectedMeetingProject] = useState<string>('');

  useEffect(() => {
    if (leadProjects.length > 0) {
      if (!selectedProjectFilter || selectedProjectFilter === 'all' || !leadProjects.includes(selectedProjectFilter)) {
        setSelectedProjectFilter(leadProjects[0]);
      }
    }
  }, [leadProjects, selectedProjectFilter]);

  // Filter meetings and activities strictly based on selected project
  const filteredScheduledMeetings = useMemo(() => {
    const targetProject = selectedProjectFilter || (leadProjects.length > 0 ? leadProjects[0] : '');
    if (!targetProject) return scheduledMeetings;
    return scheduledMeetings.filter((m) => {
      if (m.project && m.project === targetProject) return true;
      if (!m.project && leadProjects.length > 0 && targetProject === leadProjects[0]) return true;
      if (m.title && m.title.toLowerCase().includes(targetProject.toLowerCase())) return true;
      if (m.requirements && m.requirements.toLowerCase().includes(targetProject.toLowerCase())) return true;
      return false;
    });
  }, [scheduledMeetings, selectedProjectFilter, leadProjects]);

  const filteredCustomActivities = useMemo(() => {
    const targetProject = selectedProjectFilter || (leadProjects.length > 0 ? leadProjects[0] : '');
    if (!targetProject) return customActivities;
    return customActivities.filter((act) => {
      const txt = `${act.title || ''} ${act.text || ''}`.toLowerCase();
      return txt.includes(targetProject.toLowerCase());
    });
  }, [customActivities, selectedProjectFilter, leadProjects]);

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
          project: (m as any).project || '',
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

  // Synchronize call logs for this lead from backend CallLog database
  const fetchLeadBackendCalls = useCallback(async () => {
    if (!activeLead) return;
    try {
      const res = await fetchCallLogsApi({ leadId: activeLead.id });
      if (res.calls) {
        setCustomActivities((prev) => {
          const nonCallActivities = prev.filter((a) => a.type !== 'call');

          const backendCallActivities = res.calls.map((c) => {
            const dateStr = c.callDate || new Date().toISOString().split('T')[0];
            const parts = dateStr.split('-');
            let formattedD = dateStr;
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                formattedD = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              } else {
                const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
                formattedD = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }
            }

            return {
              id: c.id,
              type: 'call' as const,
              author: c.employeeName || 'Staff',
              title: `${c.callType || 'Outgoing'} Call`,
              duration: c.duration,
              status: c.status,
              text: c.description || '',
              date: formattedD,
              timeAgo: c.callTime || 'Recorded',
            };
          });

          // Merge backend calls with custom comments/emails
          const merged = [...backendCallActivities, ...nonCallActivities];
          try {
            localStorage.setItem(`crm_activities_${activeLead.id}`, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }
    } catch (err) {
      console.error('Failed to sync calls for lead:', err);
    }
  }, [activeLead?.id, activeLead?.leadId, activeLead?.name, activeLead?.phone]);

  useEffect(() => {
    fetchLeadBackendCalls();
  }, [fetchLeadBackendCalls]);

  // Synchronize calls across tabs/windows or when window gets focused
  useEffect(() => {
    const handleSync = () => {
      fetchLeadBackendCalls();
    };
    window.addEventListener('call:created', handleSync);
    window.addEventListener('call:updated', handleSync);
    window.addEventListener('call:deleted', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('call:created', handleSync);
      window.removeEventListener('call:updated', handleSync);
      window.removeEventListener('call:deleted', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [fetchLeadBackendCalls]);

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

  const handleSaveCallFromPipeline = async (callData: Partial<CallLog>) => {
    if (!activeLead) return;
    try {
      const payload: Partial<CallLog> = {
        ...callData,
        leadId: activeLead.id,
      };

      await createCallLogApi(payload);
      await fetchLeadBackendCalls();

      setCallModalOpened(false);
      notifications.show({
        title: 'Call Logged Successfully',
        message: 'Call activity saved to Call Logs module and added to pipeline.',
        color: 'teal',
      });
    } catch (err: any) {
      notifications.show({
        title: 'Error Saving Call',
        message: err.message || 'Failed to log call.',
        color: 'red',
      });
    }
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

  const handleDeleteActivity = async (actId: string) => {
    if (!activeLead) return;
    const target = customActivities.find((a) => a.id === actId);
    if (target && target.type === 'call') {
      try {
        await deleteCallLogApi(target.id);
      } catch (_) {}
    }
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

    let finalMeetingLink = meetingLink.trim();
    if (isVirtualMeeting) {
      if (!finalMeetingLink) {
        finalMeetingLink = meetingType.toLowerCase().includes('zoom') ? generateZoomLink() : generateGoogleMeetLink();
      } else if (!finalMeetingLink.startsWith('http://') && !finalMeetingLink.startsWith('https://')) {
        if (meetingType.toLowerCase().includes('zoom')) {
          finalMeetingLink = `https://zoom.us/j/${finalMeetingLink.replace(/\D/g, '') || Math.floor(1000000000 + Math.random() * 9000000000)}`;
        } else {
          finalMeetingLink = `https://meet.google.com/${finalMeetingLink}`;
        }
      }
    }

    if (!finalMeetingLink && isInPersonMeeting) {
      notifications.show({
        title: 'Meeting Location Required',
        message: 'Please enter the in-person meeting location or office address.',
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
          meetingLocation: finalMeetingLink,
          meetingLink: finalMeetingLink,
          location: finalMeetingLink,
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
        meetingLink: finalMeetingLink,
        stageAfterMeeting: stageAfterMeeting || activeLead.stage || 'Discovery',
        project: selectedMeetingProject || (leadProjects.length > 0 ? leadProjects[0] : ''),
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
  const offeringList = useMemo(() => {
    const list: string[] = [];
    if (requirementType === 'Product') {
      if (Array.isArray(activeLead?.productList) && activeLead.productList.length > 0) {
        list.push(...activeLead.productList);
      } else if (activeLead?.product) {
        list.push(activeLead.product);
      }
    } else {
      if (Array.isArray(activeLead?.serviceList) && activeLead.serviceList.length > 0) {
        list.push(...activeLead.serviceList);
      } else if (activeLead?.service) {
        list.push(activeLead.service);
      }
    }
    return Array.from(new Set(list.map((s) => (typeof s === 'string' ? s.trim() : String(s))))).filter(Boolean);
  }, [requirementType, activeLead?.serviceList, activeLead?.productList, activeLead?.service, activeLead?.product]);

  const offerings = offeringList.length > 0 ? offeringList.join(', ') : '—';

  return (
    <Box p={{ base: 'xs', sm: 'sm', md: 'md' }} style={{ width: '100%', maxWidth: '100%' }}>
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
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0, minWidth: 125 }}>
                  <IconUser size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Contact Person
                  </Text>
                </Group>
                <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827', textAlign: 'right', wordBreak: 'break-word', flex: 1 }}>
                  {leadName}
                </Text>
              </Group>

              {/* Designation */}
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0, minWidth: 125 }}>
                  <IconBriefcase size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Designation
                  </Text>
                </Group>
                <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827', textAlign: 'right', wordBreak: 'break-word', flex: 1 }}>
                  {designation}
                </Text>
              </Group>

              {/* Email */}
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0, minWidth: 125 }}>
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
                  style={{ color: '#2563EB', textDecoration: 'none', textAlign: 'right', wordBreak: 'break-all', flex: 1 }}
                >
                  {email}
                </Text>
              </Group>

              {/* Phone */}
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0, minWidth: 125 }}>
                  <IconPhone size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Phone
                  </Text>
                </Group>
                <Group gap={6} align="center" justify="flex-end" style={{ flex: 1 }}>
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
                        flexShrink: 0,
                      }}
                    >
                      <IconBrandWhatsapp size={12} stroke={2.5} />
                    </Box>
                  )}
                </Group>
              </Group>

              {/* Contact Type */}
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0, minWidth: 125 }}>
                  <IconUserCheck size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Contact Type
                  </Text>
                </Group>
                <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827', textAlign: 'right', wordBreak: 'break-word', flex: 1 }}>
                  {contactType}
                </Text>
              </Group>

              {/* Company Name */}
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0, minWidth: 125 }}>
                  <IconBuilding size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Company Name
                  </Text>
                </Group>
                <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827', textAlign: 'right', wordBreak: 'break-word', flex: 1 }}>
                  {companyName}
                </Text>
              </Group>

              {/* Requirement Type */}
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0, minWidth: 125 }}>
                  <IconBox size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Requirement Type
                  </Text>
                </Group>
                <Group gap={6} align="center" justify="flex-end" style={{ flex: 1 }}>
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: requirementType === 'Product' ? '#F97316' : '#8B5CF6',
                      flexShrink: 0,
                    }}
                  />
                  <Text size="13px" fw={600} style={{ color: requirementType === 'Product' ? '#F97316' : '#8B5CF6' }}>
                    {requirementType}
                  </Text>
                </Group>
              </Group>

              {/* Product / Service Offering(s) */}
              {offeringList.length <= 1 ? (
                <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                  <Group gap={8} wrap="nowrap" style={{ flexShrink: 0, minWidth: 125 }}>
                    <IconLayersSubtract size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                    <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                      {requirementType}
                    </Text>
                  </Group>
                  <Text
                    size="13px"
                    fw={600}
                    style={{
                      color: isDark ? '#F8FAFC' : '#111827',
                      textAlign: 'right',
                      wordBreak: 'break-word',
                      lineHeight: 1.4,
                      flex: 1,
                    }}
                  >
                    {offeringList[0] || '—'}
                  </Text>
                </Group>
              ) : (
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                  <Group gap={8} wrap="nowrap" style={{ flexShrink: 0, minWidth: 125 }}>
                    <IconLayersSubtract size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                    <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                      {requirementType}
                    </Text>
                  </Group>

                  <Stack gap={4} align="flex-end" style={{ flex: 1, minWidth: 0 }}>
                    <Tooltip label="Click to view this project pipeline" withArrow>
                      <Text
                        size="13px"
                        fw={700}
                        onClick={() => {
                          const activePrj = (selectedProjectFilter && offeringList.includes(selectedProjectFilter))
                            ? selectedProjectFilter
                            : offeringList[0];
                          if (activePrj) {
                            setSelectedProjectFilter(activePrj);
                            setRightViewMode('pipeline');
                          }
                        }}
                        style={{
                          color: '#4F46E5',
                          textAlign: 'right',
                          wordBreak: 'break-word',
                          lineHeight: 1.35,
                          cursor: 'pointer',
                        }}
                      >
                        {selectedProjectFilter && offeringList.includes(selectedProjectFilter)
                          ? selectedProjectFilter
                          : offeringList[0]}
                      </Text>
                    </Tooltip>

                    <Menu shadow="md" width={280} position="bottom-end">
                      <Menu.Target>
                        <Button
                          size="compact-xs"
                          variant="light"
                          color="indigo"
                          radius="md"
                          rightSection={<IconChevronDown size={12} />}
                          styles={{
                            root: {
                              height: 22,
                              padding: '0 8px',
                              fontSize: 11,
                              fontWeight: 600,
                            },
                          }}
                        >
                          +{offeringList.length - 1} More Option{offeringList.length - 1 > 1 ? 's' : ''}
                        </Button>
                      </Menu.Target>

                      <Menu.Dropdown
                        style={{
                          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                          borderColor: isDark ? '#374151' : '#E2E8F0',
                          padding: 6,
                          borderRadius: 10,
                        }}
                      >
                        <Menu.Label style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#94A3B8' : '#64748B', letterSpacing: '0.04em' }}>
                          ALL {requirementType.toUpperCase()}S ({offeringList.length})
                        </Menu.Label>
                        {offeringList.map((item, idx) => {
                          const isSelected = (selectedProjectFilter || offeringList[0]) === item;
                          return (
                            <Menu.Item
                              key={idx}
                              onClick={() => {
                                setSelectedProjectFilter(item);
                                setRightViewMode('pipeline');
                              }}
                              leftSection={
                                <Box
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: isSelected
                                      ? '#6366F1'
                                      : requirementType === 'Product'
                                      ? '#F97316'
                                      : '#8B5CF6',
                                    flexShrink: 0,
                                  }}
                                />
                              }
                              rightSection={
                                isSelected ? (
                                  <Badge size="xs" color="indigo" variant="filled">
                                    Active
                                  </Badge>
                                ) : null
                              }
                              style={{
                                fontWeight: isSelected ? 700 : 500,
                                fontSize: 12.5,
                                borderRadius: 6,
                                backgroundColor: isSelected ? (isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF') : undefined,
                              }}
                            >
                              {item}
                            </Menu.Item>
                          );
                        })}
                      </Menu.Dropdown>
                    </Menu>
                  </Stack>
                </Group>
              )}
            </Stack>
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
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                {/* Left Side: Icon, Title, Active Project Badge & Subtitle */}
                <Group gap="xs" align="center" wrap="nowrap" style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <Box
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDark ? '#A5B4FC' : '#4F46E5',
                      flexShrink: 0,
                    }}
                  >
                    <IconCalendar size={18} stroke={2.2} />
                  </Box>
                  <Box style={{ minWidth: 0, flex: 1 }}>
                    <Group gap={6} align="center" wrap="nowrap">
                      <Text
                        fw={800}
                        size="17px"
                        style={{
                          color: isDark ? '#F8FAFC' : '#111827',
                          letterSpacing: '-0.02em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rightViewMode === 'schedule' ? 'Schedule Meeting' : 'Activity Pipeline'}
                      </Text>
                      {rightViewMode === 'pipeline' && selectedProjectFilter && (
                        <Badge
                          size="sm"
                          variant="light"
                          color="indigo"
                          radius="sm"
                          style={{
                            textTransform: 'none',
                            fontWeight: 600,
                            maxWidth: 180,
                            flexShrink: 1,
                          }}
                        >
                          <Text truncate size="11px">{selectedProjectFilter}</Text>
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" truncate style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                      {rightViewMode === 'schedule'
                        ? `Set up a discovery call or presentation with ${leadName}`
                        : `Track activity progress and history for ${leadName}`}
                    </Text>
                  </Box>
                </Group>

                {/* Right Side: View Switcher Pills + "+ New" Button */}
                <Group gap="xs" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
                  {/* View Switcher Pills */}
                  <Group
                    gap={2}
                    p={3}
                    wrap="nowrap"
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
                      styles={{
                        root: {
                          height: 28,
                          padding: '0 10px',
                          fontSize: 12,
                        },
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
                          styles={{
                            root: {
                              height: 28,
                              padding: '0 10px',
                              fontSize: 12,
                            },
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
                          size="xs"
                          variant="default"
                          rightSection={<IconChevronDown size={13} />}
                          styles={{
                            root: {
                              height: 32,
                              padding: '0 10px',
                              fontSize: 12,
                            },
                          }}
                          style={{
                            borderRadius: 8,
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
                  <Grid gutter="lg">
                    {/* Row 1: Meeting Title & Project (or Meeting Type if no projects) */}
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Meeting Title / Subject"
                        withAsterisk
                        placeholder={activeLead ? `e.g. Discovery Call with ${activeLead.name}` : 'e.g. Discovery & Requirement Call'}
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        required
                        styles={{
                          label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                          input: {
                            height: 44,
                            borderRadius: 10,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                            fontSize: 14,
                            color: isDark ? '#F8FAFC' : '#1E293B',
                          },
                        }}
                      />
                    </Grid.Col>

                    {leadProjects.length > 0 ? (
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label="Project / Service Pipeline"
                          placeholder="Select which project this meeting is for"
                          data={leadProjects}
                          value={selectedMeetingProject || leadProjects[0]}
                          onChange={(val) => setSelectedMeetingProject(val || '')}
                          clearable
                          styles={{
                            label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                            input: {
                              height: 44,
                              borderRadius: 10,
                              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                              borderColor: isDark ? '#334155' : '#CBD5E1',
                              fontSize: 14,
                              color: isDark ? '#F8FAFC' : '#1E293B',
                            },
                          }}
                        />
                      </Grid.Col>
                    ) : null}

                    {/* Row 2: Meeting Type & Duration */}
                    <Grid.Col span={{ base: 12, sm: 6 }}>
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
                        onChange={(val) => {
                          const newType = val || '';
                          setMeetingType(newType);
                          if (newType.toLowerCase().includes('google meet')) {
                            if (!meetingLink || meetingLink.startsWith('https://zoom') || !meetingLink.startsWith('http')) {
                              setMeetingLink(generateGoogleMeetLink());
                            }
                          } else if (newType.toLowerCase().includes('zoom')) {
                            if (!meetingLink || meetingLink.startsWith('https://meet') || !meetingLink.startsWith('http')) {
                              setMeetingLink(generateZoomLink());
                            }
                          } else if (newType.toLowerCase().includes('in-person')) {
                            if (meetingLink.startsWith('https://meet.google.com') || meetingLink.startsWith('https://zoom.us')) {
                              setMeetingLink('');
                            }
                          }
                        }}
                        required
                        styles={{
                          label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                          input: {
                            height: 44,
                            borderRadius: 10,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                            fontSize: 14,
                            color: isDark ? '#F8FAFC' : '#1E293B',
                          },
                        }}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
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
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                            fontSize: 14,
                            color: isDark ? '#F8FAFC' : '#1E293B',
                          },
                        }}
                      />
                    </Grid.Col>

                    {/* Row 3: Meeting Date & Meeting Time (Balanced 50/50 side by side) */}
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <MeetingDatePicker
                        label="Meeting Date"
                        placeholder="Select Meeting Date"
                        required
                        value={meetingDate}
                        onChange={(val) => setMeetingDate(val)}
                        styles={{
                          label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                          input: {
                            height: 44,
                            borderRadius: 10,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                            fontSize: 14,
                            color: isDark ? '#F8FAFC' : '#1E293B',
                          },
                        }}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <MeetingTimePicker
                        label="Meeting Time"
                        placeholder="e.g. 11:00 AM"
                        required
                        value={meetingTime}
                        onChange={(val) => setMeetingTime(val)}
                        styles={{
                          label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                          input: {
                            height: 44,
                            borderRadius: 10,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                            fontSize: 14,
                            color: isDark ? '#F8FAFC' : '#1E293B',
                          },
                        }}
                      />
                    </Grid.Col>

                    {/* Row 4: Host / Assigned Rep & Meeting Link / Location */}
                    <Grid.Col span={{ base: 12, sm: leadProjects.length > 0 ? 6 : 6 }}>
                      <TextInput
                        label="Host / Assigned Rep"
                        placeholder={currentUser?.name ? `e.g. ${currentUser.name}` : 'e.g. Santhosh C'}
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        styles={{
                          label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
                          input: {
                            height: 44,
                            borderRadius: 10,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                            fontSize: 14,
                            color: isDark ? '#F8FAFC' : '#1E293B',
                          },
                        }}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: leadProjects.length > 0 ? 6 : 12 }}>
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
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                            fontSize: 14,
                            color: isDark ? '#F8FAFC' : '#1E293B',
                          },
                        }}
                      />
                    </Grid.Col>
                  </Grid>

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
                      {filteredCustomActivities.map((act) => {
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

                      {/* Loop through filtered scheduled meetings: Render each meeting as ONE single comprehensive card */}
                      {filteredScheduledMeetings.map((meet) => {
                        const rawLoc = (meet.meetingLink || '').trim();
                        const meetTypeLower = (meet.meetingType || '').toLowerCase();
                        const isVirtual =
                          meetTypeLower.includes('virtual') ||
                          meetTypeLower.includes('online') ||
                          meetTypeLower.includes('meet') ||
                          meetTypeLower.includes('zoom');

                        const isMeetInPerson =
                          meetTypeLower.includes('in-person') ||
                          meetTypeLower.includes('client office') ||
                          meetTypeLower.includes('our office');

                        // Resolve effective link
                        let effectiveLink = rawLoc;
                        if (!effectiveLink && isVirtual) {
                          const meetSuffix = meet.id ? String(meet.id).replace(/\D/g, '').slice(-8) || 'online' : 'online';
                          effectiveLink = `https://meet.google.com/crm-${meetSuffix}`;
                        } else if (isVirtual && !effectiveLink.startsWith('http://') && !effectiveLink.startsWith('https://')) {
                          if (effectiveLink.toLowerCase().includes('zoom')) {
                            effectiveLink = `https://zoom.us/j/${effectiveLink.replace(/\D/g, '') || '1234567890'}`;
                          } else {
                            effectiveLink = `https://meet.google.com/${effectiveLink}`;
                          }
                        }

                        const isOnlineMeet = isVirtual || effectiveLink.startsWith('http://') || effectiveLink.startsWith('https://');
                        const joinUrl = effectiveLink.startsWith('http://') || effectiveLink.startsWith('https://')
                          ? effectiveLink
                          : `https://${effectiveLink}`;

                        return (
                          <Box key={meet.id} mb="28px" style={{ position: 'relative' }}>
                            {/* Single Timeline Node Marker */}
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

                            {/* Meeting Header */}
                            <Group justify="space-between" align="center" mb={10}>
                              <Group gap="xs" align="center">
                                <Avatar size={26} radius="xl" color="indigo" style={{ fontWeight: 700 }}>
                                  {meet.hostName ? meet.hostName.charAt(0).toUpperCase() : 'S'}
                                </Avatar>
                                <Text size="14px" style={{ color: isDark ? '#F8FAFC' : '#1E293B', lineHeight: 1.4 }}>
                                  <strong>{meet.hostName || 'Representative'}</strong> scheduled a{' '}
                                  <Text span fw={600} style={{ color: isDark ? '#818CF8' : '#4F46E5' }}>
                                    {meet.meetingType?.toLowerCase().includes('virtual') && !meet.meetingType?.toLowerCase().includes('meeting')
                                      ? `${meet.meetingType} Meeting`
                                      : (meet.meetingType || 'Meeting')}
                                  </Text>{' '}
                                  with <strong>{leadName}</strong>
                                </Text>
                              </Group>
                              <Badge
                                size="sm"
                                variant="light"
                                color={getMeetingStatusColor(meet.status)}
                                style={{
                                  fontWeight: 700,
                                  textTransform: 'none',
                                  borderRadius: 6,
                                }}
                              >
                                {meet.status || 'Scheduled'}
                              </Badge>
                            </Group>

                            {/* Single Comprehensive Meeting Card */}
                            <Box
                              p="18px 20px"
                              style={{
                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                                borderRadius: '14px',
                                boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                              }}
                            >
                              {/* Row 1: Title and Top Action Buttons */}
                              <Group justify="space-between" align="center" wrap="nowrap" mb={10}>
                                <Text fw={700} size="16px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.3 }}>
                                  {meet.title}
                                </Text>
                                <Group gap="xs" wrap="nowrap" align="center">
                                  {(() => {
                                    const isCompleted =
                                      meet.status?.toLowerCase() === 'completed' ||
                                      (meet.meetingStatus as string)?.toLowerCase() === 'completed';
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
                                            height: 32,
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
                                    radius="md"
                                  >
                                    <IconTrash size={16} />
                                  </ActionIcon>
                                </Group>
                              </Group>

                              {/* Row 2: Metadata Chips Row (Spans full width so badges never wrap awkwardly!) */}
                              <Group gap="xs" wrap="wrap" mb={meet.purpose && meet.purpose !== meet.title ? 10 : 0}>
                                <Badge
                                  variant="light"
                                  color="blue"
                                  size="md"
                                  leftSection={<IconCalendar size={13} />}
                                  style={{ textTransform: 'none', fontWeight: 600, borderRadius: 8 }}
                                >
                                  {meet.date} • {formatDisplayTime(meet.time)}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  color="gray"
                                  size="md"
                                  leftSection={<IconClock size={13} />}
                                  style={{ textTransform: 'none', fontWeight: 600, borderRadius: 8 }}
                                >
                                  {meet.duration}
                                </Badge>
                                {meet.project && (
                                  <Badge
                                    variant="light"
                                    color="violet"
                                    size="md"
                                    leftSection={<IconLayersSubtract size={12} />}
                                    style={{ textTransform: 'none', fontWeight: 600, borderRadius: 8 }}
                                  >
                                    {meet.project}
                                  </Badge>
                                )}
                                <Badge
                                  variant="light"
                                  color={isOnlineMeet ? 'indigo' : 'teal'}
                                  size="md"
                                  leftSection={isOnlineMeet ? <IconVideo size={13} /> : <IconMapPin size={13} />}
                                  style={{ textTransform: 'none', fontWeight: 600, borderRadius: 8 }}
                                >
                                  {meet.meetingType?.toLowerCase().includes('virtual') && !meet.meetingType?.toLowerCase().includes('meeting')
                                    ? `${meet.meetingType} Meeting`
                                    : (meet.meetingType || (isOnlineMeet ? 'Virtual Meeting' : 'In-Person Meeting'))}
                                </Badge>
                                <Badge
                                  variant="subtle"
                                  color="gray"
                                  size="md"
                                  leftSection={<IconUser size={13} />}
                                  style={{ textTransform: 'none', fontWeight: 600, borderRadius: 8 }}
                                >
                                  Host: {meet.hostName || 'Host'}
                                </Badge>
                              </Group>

                              {(meet.purpose && meet.purpose !== meet.title) && (
                                <Text size="13px" c="dimmed" mt={8} style={{ fontStyle: 'italic', lineHeight: 1.4 }}>
                                  "{meet.purpose}"
                                </Text>
                              )}

                              {/* Sleek Integrated Meeting Room & Action Bar */}
                              <Box
                                mt="14px"
                                p="12px 16px"
                                style={{
                                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                                  border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                                  borderRadius: '10px',
                                }}
                              >
                                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                                  <Group gap="sm" align="center" style={{ flex: 1, minWidth: 220 }}>
                                    <ThemeIcon
                                      size={38}
                                      radius="md"
                                      variant="light"
                                      color={isOnlineMeet ? 'blue' : 'teal'}
                                    >
                                      {isOnlineMeet ? <IconVideo size={18} /> : <IconMapPin size={18} />}
                                    </ThemeIcon>
                                    <Box style={{ flex: 1, minWidth: 0 }}>
                                      <Group gap={6} align="center">
                                        <Text
                                          size="10px"
                                          fw={700}
                                          c="dimmed"
                                          style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}
                                        >
                                          {isOnlineMeet
                                            ? (meetTypeLower.includes('zoom') ? 'Zoom Meeting' : 'Google Meet')
                                            : (isMeetInPerson ? 'In-Person Venue' : 'Location')}
                                        </Text>
                                        {isOnlineMeet && (
                                          <Badge size="xs" color="teal" variant="dot" style={{ fontWeight: 600 }}>
                                            Ready
                                          </Badge>
                                        )}
                                      </Group>
                                      <Text
                                        size="13px"
                                        fw={600}
                                        truncate
                                        component={isOnlineMeet ? 'a' : 'div'}
                                        href={isOnlineMeet ? joinUrl : undefined}
                                        target={isOnlineMeet ? '_blank' : undefined}
                                        rel={isOnlineMeet ? 'noopener noreferrer' : undefined}
                                        style={{
                                          color: isOnlineMeet ? (isDark ? '#60A5FA' : '#2563EB') : (isDark ? '#F1F5F9' : '#0F172A'),
                                          textDecoration: 'none',
                                          display: 'block',
                                        }}
                                      >
                                        {effectiveLink || (isMeetInPerson ? 'Venue address specified' : 'Online meeting link')}
                                      </Text>
                                    </Box>
                                  </Group>

                                  {/* Action Buttons: Join Meet & Copy */}
                                  <Group gap="xs" wrap="nowrap">
                                    {isOnlineMeet && (
                                      <Button
                                        component="a"
                                        href={joinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="sm"
                                        leftSection={<IconVideo size={15} />}
                                        style={{
                                          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                          color: '#FFFFFF',
                                          borderRadius: 8,
                                          fontWeight: 700,
                                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                                          border: 'none',
                                          height: 34,
                                          padding: '0 16px',
                                          textDecoration: 'none',
                                        }}
                                      >
                                        Join Meet
                                      </Button>
                                    )}

                                    <Button
                                      size="sm"
                                      variant="default"
                                      leftSection={isOnlineMeet ? <IconCopy size={13} /> : <IconMapPin size={13} />}
                                      onClick={() => {
                                        navigator.clipboard.writeText(effectiveLink || joinUrl);
                                        notifications.show({
                                          title: isOnlineMeet ? 'Link Copied' : 'Location Copied',
                                          message: isOnlineMeet ? 'Meeting link copied to clipboard.' : 'Venue address copied to clipboard.',
                                          color: 'teal',
                                        });
                                      }}
                                      style={{
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        height: 34,
                                        borderColor: isDark ? '#334155' : '#CBD5E1',
                                      }}
                                    >
                                      {isOnlineMeet ? 'Copy Link' : 'Copy Location'}
                                    </Button>
                                  </Group>
                                </Group>
                              </Box>
                            </Box>
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
          <CallLogModal
            opened={callModalOpened}
            onClose={() => setCallModalOpened(false)}
            onSave={handleSaveCallFromPipeline}
            employees={employees}
            contacts={contacts}
            leads={leads}
            initialLead={
              activeLead
                ? {
                    id: activeLead.id,
                    leadId: activeLead.leadId,
                    name: activeLead.name,
                    phone: activeLead.phone,
                    companyName: activeLead.companyName,
                    assignedEmployeeName: currentUser?.name,
                  }
                : null
            }
          />

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
