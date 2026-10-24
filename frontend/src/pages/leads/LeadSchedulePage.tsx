import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
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
  Menu,
  Modal,
  Tooltip,
  ThemeIcon,
  ScrollArea,
  UnstyledButton,
  TagsInput,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconUser,
  IconBriefcase,
  IconMail,
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
  IconChevronUp,
  IconPhoneCall,
  IconMessageDots,
  IconNote,
  IconSend,
  IconCopy,
  IconEdit,
  IconUsers,
  IconLock,
  IconInfoCircle,
  IconFileDescription,
  IconCalculator,
  IconFileCheck,
  IconReceipt,
  IconCreditCard,
  IconRocket,
  IconScale,
  IconArrowRight,
  IconDots,
  IconDotsVertical,
  IconHistory,
  IconChevronRight,
  IconCalendarEvent,
  IconX,
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
import { MeetingTableView } from '../meetings/components/MeetingTableView';
import { MeetingDetailsModal } from '../meetings/components/MeetingDetailsModal';
import { ScheduledMeeting as MeetingTypeScheduledMeeting } from '../../types/meeting';
import { CallLogModal } from '../calls/components/CallLogModal';
import { CallLog } from '../../types/callLog';
import { fetchCallLogsApi, createCallLogApi, deleteCallLogApi } from '../../services/callLogService';
import { LeadSectionType, LeadDealData } from '../../types/lead';
import {
  loadLeadDealData,
  saveLeadDealData,
  LeadNegotiationSection,
  LeadContractSection,
  LeadInvoiceSection,
  LeadPaymentSection,
  LeadProgressSection,
} from './components/LeadDealSections';
import { LeadProposalSection } from './components/LeadProposalSection';
import { LeadQuotationSection } from './components/LeadQuotationSection';

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

  // Section Navigation State (activity timeline, calls, notes removed)
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('crm_lead_active_section');
      if (
        saved &&
        ['meetings', 'proposals', 'quotation', 'quotations', 'negotiation', 'contracts', 'invoices', 'payments', 'progress'].includes(saved)
      ) {
        return saved;
      }
    } catch (_) {}
    return 'meetings';
  });

  const handleSelectTab = (tab: string) => {
    handleProceedToSection(tab);
  };

  // Navigate to target section and update lead stage accordingly
  const handleProceedToSection = async (tab: string) => {
    const normalized = tab === 'quotation' ? 'quotations' : tab;
    setActiveTab(normalized);
    try {
      sessionStorage.setItem('crm_lead_active_section', normalized);
    } catch (_) {}

    if (!activeLead) return;

    const sectionStageMap: Record<string, { stage: string; status: string }> = {
      meetings: { stage: 'Meetings', status: 'In Progress' },
      proposals: { stage: 'Proposals', status: 'In Progress' },
      quotations: { stage: 'Quotations', status: 'In Progress' },
      negotiation: { stage: 'Negotiation', status: 'In Progress' },
      contracts: { stage: 'Contracts', status: 'In Progress' },
      invoices: { stage: 'Invoices', status: 'In Progress' },
      payments: { stage: 'Payments', status: 'In Progress' },
      progress: { stage: 'Progress', status: 'In Progress' },
      completed: { stage: 'Completed', status: 'Complete' },
    };

    const target = sectionStageMap[normalized.toLowerCase()];
    if (target) {
      setActiveLead((prev) => (prev ? { ...prev, stage: target.stage, status: target.status } : prev));
      try {
        await updateLead(activeLead.id, {
          stage: target.stage,
          status: target.status,
        });
      } catch (_) {}
    }
  };

  // Activity Timeline Category Filter ('all' | 'meetings' | 'calls' | 'proposals')
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'meetings' | 'calls' | 'proposals'>('all');

  // Collapsible Accordion states for timeline cards
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'item-0': true, // first item expanded by default as in screenshot
  });

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Deal lifecycle data persistence
  const [dealData, setDealData] = useState<LeadDealData | null>(() => {
    if (activeLead) return loadLeadDealData(activeLead);
    return null;
  });

  useEffect(() => {
    if (activeLead) {
      setDealData(loadLeadDealData(activeLead));
    }
  }, [activeLead]);

  const handleUpdateProposals = async (newProposals: any) => {
    if (!dealData || !activeLead) return;
    const updated = { ...dealData, proposals: newProposals };
    setDealData(updated);
    saveLeadDealData(activeLead.id, updated);
    setActiveLead((prev) => (prev ? { ...prev, stage: 'Proposals', status: 'In Progress' } : prev));
    try {
      await updateLead(activeLead.id, {
        stage: 'Proposals',
        status: 'In Progress',
      });
    } catch (_) {}
  };

  const handleUpdateQuotations = async (newQuotations: any) => {
    if (!dealData || !activeLead) return;
    const updated = { ...dealData, quotations: newQuotations };
    setDealData(updated);
    saveLeadDealData(activeLead.id, updated);
    setActiveLead((prev) => (prev ? { ...prev, stage: 'Quotations', status: 'In Progress' } : prev));
    try {
      await updateLead(activeLead.id, {
        stage: 'Quotations',
        status: 'In Progress',
      });
    } catch (_) {}
  };

  const handleUpdateNegotiation = async (newNeg: any) => {
    if (!dealData || !activeLead) return;
    const updated = { ...dealData, negotiation: newNeg };
    setDealData(updated);
    saveLeadDealData(activeLead.id, updated);
    setActiveLead((prev) => (prev ? { ...prev, stage: 'Negotiation', status: 'In Progress' } : prev));
    try {
      await updateLead(activeLead.id, {
        stage: 'Negotiation',
        status: 'In Progress',
      });
    } catch (_) {}
  };

  const handleUpdateContract = async (newContract: any) => {
    if (!dealData || !activeLead) return;
    const updated = { ...dealData, contract: newContract };
    setDealData(updated);
    saveLeadDealData(activeLead.id, updated);
    setActiveLead((prev) => (prev ? { ...prev, stage: 'Contracts', status: 'In Progress' } : prev));
    try {
      await updateLead(activeLead.id, {
        stage: 'Contracts',
        status: 'In Progress',
      });
    } catch (_) {}
  };

  const handleUpdateInvoices = async (newInvoices: any) => {
    if (!dealData || !activeLead) return;
    const updated = { ...dealData, invoices: newInvoices };
    setDealData(updated);
    saveLeadDealData(activeLead.id, updated);
    setActiveLead((prev) => (prev ? { ...prev, stage: 'Invoices', status: 'In Progress' } : prev));
    try {
      await updateLead(activeLead.id, {
        stage: 'Invoices',
        status: 'In Progress',
      });
    } catch (_) {}
  };

  const handleUpdatePayments = async (newPayments: any) => {
    if (!dealData || !activeLead) return;
    const updated = { ...dealData, payments: newPayments };
    setDealData(updated);
    saveLeadDealData(activeLead.id, updated);
    setActiveLead((prev) => (prev ? { ...prev, stage: 'Payments', status: 'In Progress' } : prev));
    try {
      await updateLead(activeLead.id, {
        stage: 'Payments',
        status: 'In Progress',
      });
    } catch (_) {}
  };

  const handleUpdateProgress = async (newProgress: any) => {
    if (!dealData || !activeLead) return;
    const updated = { ...dealData, progress: newProgress };
    setDealData(updated);
    saveLeadDealData(activeLead.id, updated);

    const isCompleted =
      newProgress?.overallPercentage === 100 ||
      newProgress?.status === 'Completed' ||
      (Array.isArray(newProgress?.milestones) &&
        newProgress.milestones.length > 0 &&
        newProgress.milestones.every((m: any) => m.status === 'Completed' || m.percentage === 100));

    const finalStage = isCompleted ? 'Completed' : 'Progress';
    const finalStatus = isCompleted ? 'Complete' : 'In Progress';
    setActiveLead((prev) => (prev ? { ...prev, stage: finalStage, status: finalStatus } : prev));
    try {
      await updateLead(activeLead.id, {
        stage: finalStage,
        status: finalStatus,
      });
    } catch (_) {}
  };

  // Modals State
  const [detailsMeeting, setDetailsMeeting] = useState<MeetingTypeScheduledMeeting | null>(null);
  const [scheduleModalOpened, setScheduleModalOpened] = useState<boolean>(false);
  const [callModalOpened, setCallModalOpened] = useState<boolean>(false);
  const [replyBoxOpened, setReplyBoxOpened] = useState<boolean>(false);
  const [commentBoxOpened, setCommentBoxOpened] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [commentText, setCommentText] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('');

  // Meeting Form Fields
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [formLeadId, setFormLeadId] = useState<string>(activeLead?.id || '');
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [meetingPurpose, setMeetingPurpose] = useState<string>('');
  const [meetingType, setMeetingType] = useState<string>('Virtual');
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [meetingTime, setMeetingTime] = useState<string>('');
  const [duration, setDuration] = useState<string>('30 Minutes');
  const [hostName, setHostName] = useState<string>(currentUser?.name || 'Ranjith (Sales executive)');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [meetingStatus, setMeetingStatus] = useState<string>('Scheduled');
  const [internalAttendees, setInternalAttendees] = useState<string[]>([]);
  const [clientAttendees, setClientAttendees] = useState<string[]>([]);
  const [meetingOutcome, setMeetingOutcome] = useState<string>('Pending');
  const [meetingNotes, setMeetingNotes] = useState<string>('');
  const [stageAfterMeeting, setStageAfterMeeting] = useState<string>('Discovery');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (activeLead && !formLeadId) {
      setFormLeadId(activeLead.id);
    }
  }, [activeLead, formLeadId]);

  // Scheduled Meetings Store
  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>(() => {
    if (!activeLead) return [];
    try {
      const saved = localStorage.getItem(`crm_meetings_${activeLead.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: `meet-${activeLead.id}-1`,
        leadId: activeLead.id,
        title: 'demo meeting',
        purpose: 'demo meeting',
        meetingType: 'Virtual',
        date: '2026-10-13',
        time: '01:00 AM',
        duration: '30 Minutes',
        hostName: 'Kavin',
        meetingLink: 'coimbatore',
        stageAfterMeeting: 'Discovery',
        status: 'Scheduled',
        requirements: 'Google Meet link and conference dial-in details shared.',
        createdAt: '2026-10-13T01:00:00Z',
      },
      {
        id: `meet-${activeLead.id}-2`,
        leadId: activeLead.id,
        title: 'requirerment meeting',
        purpose: 'requirerment meeting',
        meetingType: 'Virtual',
        date: '2026-10-13',
        time: '12:00 AM',
        duration: '45 Minutes',
        hostName: 'sandy',
        meetingLink: 'https://meet.google.com/ifg-xzt-abc',
        stageAfterMeeting: 'Discovery',
        status: 'Completed',
        requirements: 'Client requirement sign-off and proposal preparation.',
        createdAt: '2026-10-13T00:00:00Z',
      },
    ];
  });

  // Custom Activities (Calls, Emails, Notes)
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

  // Sync scheduled meetings from backend API for this lead
  const fetchLeadBackendMeetings = useCallback(async () => {
    if (!activeLead) return;
    try {
      const res = await fetchMeetingsApi({ leadId: activeLead.id });
      if (res.meetings && res.meetings.length > 0) {
        const mapped: ScheduledMeeting[] = res.meetings.map((m) => ({
          id: m.id,
          leadId: activeLead.id,
          title: m.meetingTitle || m.title || m.purpose || 'Meeting',
          purpose: m.meetingTitle || m.title || m.purpose || 'Meeting',
          meetingType: m.meetingType || 'Virtual (Google Meet)',
          date: m.meetingDate || m.date || '',
          meetingDate: m.meetingDate || m.date || '',
          time: m.startTime || m.meetingTime || m.time || '',
          startTime: m.startTime || m.meetingTime || m.time || '',
          duration: m.duration || '30 Minutes',
          hostName: m.assignedTo || m.employeeName || 'Host',
          employeeName: m.assignedTo || m.employeeName || 'Host',
          meetingLink: m.meetingLink || m.meetingLocation || m.location || '',
          stageAfterMeeting: m.stageAfterMeeting || activeLead.stage || '',
          status: (m.meetingStatus || (m.status as any)) || 'Scheduled',
          meetingStatus: (m.meetingStatus || (m.status as any)) || 'Scheduled',
          requirements: m.requirements || '',
          requirementFileName: m.requirementFileName,
          requirementFileUrl: m.requirementFileUrl,
          requirementFileSize: m.requirementFileSize,
          rescheduleReason: m.rescheduleReason,
          rescheduleHistory: m.rescheduleHistory,
          notes: m.notes,
          createdAt: m.createdAt || new Date().toISOString(),
        }));
        setScheduledMeetings((prev) => {
          const merged = mapped.map((bm) => {
            const existing = prev.find((p) => p.id === bm.id);
            return {
              ...existing,
              ...bm,
              rescheduleReason: bm.rescheduleReason || existing?.rescheduleReason,
              rescheduleHistory: bm.rescheduleHistory || existing?.rescheduleHistory,
            };
          });
          try {
            localStorage.setItem(`crm_meetings_${activeLead.id}`, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }
    } catch (_) {}
  }, [activeLead?.id, activeLead?.stage]);

  useEffect(() => {
    fetchLeadBackendMeetings();
  }, [fetchLeadBackendMeetings]);

  // Synchronize call logs for this lead from backend
  const fetchLeadBackendCalls = useCallback(async () => {
    if (!activeLead) return;
    try {
      const res = await fetchCallLogsApi({ leadId: activeLead.id });
      if (res.calls) {
        setCustomActivities((prev) => {
          const nonCallActivities = prev.filter((a) => a.type !== 'call');
          const backendCallActivities = res.calls.map((c) => {
            const dateStr = c.callDate || new Date().toISOString().split('T')[0];
            return {
              id: c.id,
              type: 'call' as const,
              author: c.employeeName || 'Staff',
              title: `${c.callType || 'Outgoing'} Call`,
              duration: c.duration,
              status: c.status,
              text: c.description || '',
              date: dateStr,
              timeAgo: c.callTime || 'Recorded',
            };
          });
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
  }, [activeLead?.id]);

  useEffect(() => {
    fetchLeadBackendCalls();
  }, [fetchLeadBackendCalls]);

  // Lead Properties
  const leadName = activeLead?.name || 'Athi';
  const email = activeLead?.email || 'athi@gmail.com';
  const phone = activeLead?.phone || '+9000000012';
  const contactType = activeLead?.contactType || 'Company Representative';
  const companyName = activeLead?.companyName || activeLead?.profession || 'Athi Tech';
  const requirementType = activeLead?.category || 'Product';
  const offerings =
    requirementType === 'Product'
      ? activeLead?.productList && activeLead.productList.length > 0
        ? activeLead.productList.join(', ')
        : 'IT CRM'
      : activeLead?.serviceList && activeLead.serviceList.length > 0
      ? activeLead.serviceList.join(', ')
      : 'IT Consulting';

  // Schedule Meeting Handler
  const handleScheduleMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetLead = leads.find((l) => l.id === formLeadId) || activeLead;
    if (!targetLead) {
      notifications.show({
        title: 'Lead Required',
        message: 'Please select an associated lead.',
        color: 'red',
      });
      return;
    }

    const finalTitle = meetingTitle.trim() || (targetLead ? `Discovery Call with ${targetLead.name}` : 'Discovery Call');
    const finalPurpose = meetingPurpose.trim() || 'Product Demo & Scope Discussion';
    const finalLink = meetingLink.trim() || (meetingType.toLowerCase().includes('in-person') ? 'Client Office' : 'https://meet.google.com/xyz-abcd-efg');

    if (!finalTitle || !meetingDate || !meetingTime.trim()) {
      notifications.show({
        title: 'Missing Details',
        message: 'Please provide meeting date and time.',
        color: 'red',
      });
      return;
    }

    try {
      setSaving(true);
      const finalTime = meetingTime.trim();

      if (editingMeetingId) {
        const updatedList = scheduledMeetings.map((m) =>
          m.id === editingMeetingId
            ? {
                ...m,
                leadId: targetLead.id,
                title: finalTitle,
                purpose: finalPurpose,
                meetingType: meetingType,
                date: meetingDate,
                meetingDate: meetingDate,
                time: finalTime,
                startTime: finalTime,
                duration: duration || '30 Minutes',
                hostName: hostName.trim() || currentUser?.name || 'Ranjith',
                employeeName: hostName.trim() || currentUser?.name || 'Ranjith',
                internalAttendees: internalAttendees,
                clientAttendees: clientAttendees,
                meetingOutcome: meetingOutcome || 'Pending',
                outcome: meetingOutcome || 'Pending',
                meetingLink: finalLink,
                status: meetingStatus || 'Scheduled',
                meetingStatus: meetingStatus || 'Scheduled',
                stageAfterMeeting: stageAfterMeeting || targetLead.stage || 'Discovery',
                requirements: meetingNotes.trim(),
                notes: meetingNotes.trim(),
              }
            : m
        );
        setScheduledMeetings(updatedList);
        localStorage.setItem(`crm_meetings_${targetLead.id}`, JSON.stringify(updatedList));
        notifications.show({
          title: 'Meeting Updated',
          message: 'Meeting details updated successfully.',
          color: 'teal',
        });
        setEditingMeetingId(null);
        setScheduleModalOpened(false);
        return;
      }

      let backendId = `meet-${Date.now()}`;
      try {
        const savedApiMeeting = await createMeetingApi({
          leadId: targetLead.id,
          lead_id: targetLead.id,
          title: finalTitle,
          purpose: finalPurpose,
          meetingTitle: finalTitle,
          meetingDate: meetingDate,
          startTime: finalTime,
          meetingTime: finalTime,
          meetingType: meetingType,
          meetingLocation: finalLink,
          meetingLink: finalLink,
          employeeName: hostName.trim() || currentUser?.name || 'Ranjith',
          assignedTo: hostName.trim() || currentUser?.name || 'Ranjith',
          clientName: targetLead.companyName ? `${targetLead.name} (${targetLead.companyName})` : targetLead.name,
          contactId: targetLead.id,
          status: meetingStatus || 'Scheduled',
          meetingStatus: meetingStatus || 'Scheduled',
          description: meetingNotes.trim() || `Meeting with ${targetLead.name}`,
          stageAfterMeeting: stageAfterMeeting || targetLead.stage || 'Discovery',
          notes: meetingNotes.trim(),
          requirements: meetingNotes.trim(),
        });
        if (savedApiMeeting && savedApiMeeting.id) {
          backendId = savedApiMeeting.id;
        }
      } catch (_) {}

      const newMeeting: ScheduledMeeting = {
        id: backendId,
        leadId: targetLead.id,
        title: finalTitle,
        purpose: finalPurpose,
        meetingType: meetingType,
        date: meetingDate,
        meetingDate: meetingDate,
        time: finalTime,
        startTime: finalTime,
        duration: duration || '30 Minutes',
        hostName: hostName.trim() || currentUser?.name || 'Ranjith',
        employeeName: hostName.trim() || currentUser?.name || 'Ranjith',
        internalAttendees: internalAttendees.length > 0 ? internalAttendees : (currentUser?.name ? [currentUser.name] : []),
        clientAttendees: clientAttendees.length > 0 ? clientAttendees : (targetLead?.name ? [targetLead.name] : []),
        meetingOutcome: meetingOutcome || 'Pending',
        outcome: meetingOutcome || 'Pending',
        meetingLink: finalLink,
        stageAfterMeeting: stageAfterMeeting || targetLead.stage || 'Discovery',
        status: meetingStatus || 'Scheduled',
        meetingStatus: meetingStatus || 'Scheduled',
        requirements: meetingNotes.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedList = [newMeeting, ...scheduledMeetings];
      setScheduledMeetings(updatedList);
      localStorage.setItem(`crm_meetings_${targetLead.id}`, JSON.stringify(updatedList));

      const resolvedStage =
        stageAfterMeeting && stageAfterMeeting !== 'Discovery'
          ? stageAfterMeeting
          : 'Meetings';
      setActiveLead((prev) =>
        prev && prev.id === targetLead.id
          ? { ...prev, stage: resolvedStage, status: 'In Progress' }
          : prev
      );
      await updateLead(targetLead.id, {
        stage: resolvedStage,
        status: 'In Progress',
      });

      notifications.show({
        title: 'Meeting Scheduled Successfully!',
        message: `Meeting with ${targetLead.name} on ${meetingDate} at ${finalTime} has been saved.`,
        color: 'teal',
      });

      setScheduleModalOpened(false);
    } catch (err: any) {
      notifications.show({ title: 'Error', message: err.message || 'Failed to schedule meeting.', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  // Save Call from Modal
  const handleSaveCall = async (callData: Partial<CallLog>) => {
    if (!activeLead) return;
    try {
      await createCallLogApi({
        ...callData,
        leadId: activeLead.id,
      });
      await fetchLeadBackendCalls();
      setCallModalOpened(false);
      notifications.show({ title: 'Call Logged', message: 'Call record saved to activity timeline.', color: 'teal' });
    } catch (err: any) {
      notifications.show({ title: 'Error', message: err.message || 'Failed to log call.', color: 'red' });
    }
  };

  // Add Comment/Note
  const handleAddComment = () => {
    if (!commentText.trim() || !activeLead) return;
    const newComment = {
      id: `comm-${Date.now()}`,
      type: 'comment' as const,
      author: currentUser?.name || 'Sandy',
      title: noteTitle.trim() || 'Internal Note',
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
    notifications.show({ title: 'Note Added', message: 'Note saved to timeline.', color: 'teal' });
  };

  // Send Email
  const handleSendReply = () => {
    if (!replyText.trim() || !activeLead) return;
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
    notifications.show({ title: 'Email Sent', message: `Email dispatched to ${activeLead.email}.`, color: 'teal' });
  };

  // Delete Meeting
  const handleDeleteMeeting = (meetingId: string) => {
    if (!activeLead) return;
    const updated = scheduledMeetings.filter((m) => m.id !== meetingId);
    setScheduledMeetings(updated);
    localStorage.setItem(`crm_meetings_${activeLead.id}`, JSON.stringify(updated));
    notifications.show({ title: 'Meeting Cancelled', message: 'Meeting removed from timeline.', color: 'gray' });
  };

  // Open Schedule Meeting Modal
  const handleOpenScheduleModal = () => {
    setEditingMeetingId(null);
    setFormLeadId(activeLead?.id || (leads.length > 0 ? leads[0].id : ''));
    setMeetingTitle('');
    setMeetingPurpose('');
    setMeetingType('Virtual');
    setMeetingDate('');
    setMeetingTime('');
    setDuration('30 Minutes');
    setHostName(currentUser?.name || '');
    setInternalAttendees([]);
    setClientAttendees([]);
    setMeetingOutcome('Pending');
    setMeetingLink('');
    setMeetingStatus('Scheduled');
    setMeetingNotes('');
    setStageAfterMeeting('Discovery');
    setScheduleModalOpened(true);
  };

  // Open Edit Meeting Modal (opens Meeting Details & Requirements modal with status & reschedule options)
  const handleOpenEditMeeting = (m: MeetingTypeScheduledMeeting) => {
    setDetailsMeeting(m);
  };

  // Handle Meeting Updated from Table Details Modal
  const handleMeetingUpdated = (updatedMeeting: MeetingTypeScheduledMeeting) => {
    setScheduledMeetings((prev) => {
      const updated = prev.map((m) =>
        m.id === updatedMeeting.id
          ? {
              ...m,
              title: updatedMeeting.title || updatedMeeting.purpose || m.title,
              purpose: updatedMeeting.title || updatedMeeting.purpose || m.purpose,
              date: updatedMeeting.meetingDate || updatedMeeting.date || m.date,
              meetingDate: updatedMeeting.meetingDate || updatedMeeting.date || m.meetingDate || m.date,
              time: updatedMeeting.startTime || updatedMeeting.meetingTime || updatedMeeting.time || m.time,
              startTime: updatedMeeting.startTime || updatedMeeting.meetingTime || updatedMeeting.time || m.startTime || m.time,
              meetingTime: updatedMeeting.meetingTime || updatedMeeting.startTime || updatedMeeting.time || m.meetingTime || m.time,
              duration: updatedMeeting.duration || m.duration,
              meetingType: updatedMeeting.meetingType || m.meetingType,
              hostName: updatedMeeting.employeeName || updatedMeeting.hostName || m.hostName,
              meetingLink: updatedMeeting.meetingLocation || updatedMeeting.location || updatedMeeting.meetingLink || m.meetingLink,
              status: (updatedMeeting.status as any) || m.status,
              meetingStatus: (updatedMeeting.meetingStatus as any) || (updatedMeeting.status as any) || m.status,
              meetingOutcome: (updatedMeeting as any).meetingOutcome || m.meetingOutcome,
              outcome: (updatedMeeting as any).outcome || (updatedMeeting as any).meetingOutcome || m.outcome,
              rescheduleReason: updatedMeeting.rescheduleReason !== undefined ? updatedMeeting.rescheduleReason : m.rescheduleReason,
              rescheduleHistory: updatedMeeting.rescheduleHistory || m.rescheduleHistory,
              notes: updatedMeeting.notes !== undefined ? updatedMeeting.notes : m.notes,
              requirements: updatedMeeting.requirements !== undefined ? updatedMeeting.requirements : m.requirements,
              requirementFileName: updatedMeeting.requirementFileName ?? m.requirementFileName,
              requirementFileUrl: updatedMeeting.requirementFileUrl ?? m.requirementFileUrl,
              requirementFileSize: updatedMeeting.requirementFileSize ?? m.requirementFileSize,
              stageAfterMeeting: updatedMeeting.stageAfterMeeting || m.stageAfterMeeting,
            }
          : m
      );
      if (activeLead) {
        try {
          localStorage.setItem(`crm_meetings_${activeLead.id}`, JSON.stringify(updated));
        } catch (_) {}
        updateLead(activeLead.id, {
          stage: 'Meetings',
          status: 'In Progress',
        }).catch(() => {});
        setActiveLead((prev) => (prev ? { ...prev, stage: 'Meetings', status: 'In Progress' } : prev));
      }
      return updated;
    });
  };

  // Map scheduledMeetings to MeetingTypeScheduledMeeting for MeetingTableView
  const meetingTableData = useMemo<MeetingTypeScheduledMeeting[]>(() => {
    const lName = activeLead?.name || 'athi';
    const cName = activeLead?.companyName || activeLead?.profession || 'Athi tech';
    return scheduledMeetings.map((m, idx) => {
      const chosenDate = m.meetingDate || m.date || '2026-10-13';
      const chosenTime = m.startTime || m.meetingTime || m.time || '01:00 AM';
      const calcEnd = calculateEndTime(chosenTime, m.duration || '30 Minutes');
      const isCompleted = m.status?.toLowerCase() === 'completed';
      const mLink = m.meetingLink || (idx === 1 ? 'https://meet.google.com/ifg-xzt-abc' : 'coimbatore');
      const isKavin = (m.hostName?.toLowerCase() === 'kavin' || (!m.hostName && !m.employeeName));
      return {
        id: m.id,
        leadId: activeLead?.id,
        lead_id: activeLead?.id,
        leadName: lName,
        companyName: cName,
        clientName: `${lName} (${cName})`,
        title: m.title || m.purpose || 'demo meeting',
        purpose: m.title || m.purpose || 'demo meeting',
        meetingTitle: m.title || m.purpose || 'demo meeting',
        meetingDate: chosenDate,
        date: chosenDate,
        startTime: chosenTime,
        endTime: m.endTime || calcEnd,
        meetingTime: chosenTime,
        time: chosenTime,
        duration: m.duration || '30 Minutes',
        meetingType: m.meetingType?.toLowerCase().includes('in-person') ? 'In-person' : 'Virtual',
        meetingLocation: mLink,
        location: mLink,
        meetingLink: mLink,
        hostName: m.hostName || m.employeeName || 'Kavin',
        employeeName: m.hostName || m.employeeName || 'Kavin',
        employeeDesignation: isKavin ? 'Software developer' : undefined,
        assignedTo: m.hostName || m.employeeName || 'Kavin',
        stageAfterMeeting: m.stageAfterMeeting || 'Discovery',
        status: m.status || (isCompleted ? 'Completed' : 'Scheduled'),
        meetingStatus: m.status || (isCompleted ? 'Completed' : 'Scheduled'),
        rescheduleReason: m.rescheduleReason,
        rescheduleHistory: m.rescheduleHistory,
        requirements: m.requirements || '',
        requirementFileUrl: (idx === 1 || isCompleted || (m.requirements && m.requirements.length > 0)) ? 'https://example.com/requirements.pdf' : undefined,
        requirementFileName: 'requirements.pdf',
        createdAt: m.createdAt || '2026-10-13T01:00:00Z',
      };
    });
  }, [scheduledMeetings, activeLead]);

  // Built Unified Timeline Activities matching Screenshot
  const unifiedTimelineItems = useMemo(() => {
    type TimelineItem = {
      id: string;
      category: 'meeting' | 'call' | 'proposal' | 'note';
      date: string;
      time: string;
      title: string;
      status: string;
      statusColor: string;
      iconType: 'meeting' | 'call' | 'proposal' | 'note';
      badges: Array<{ label: string; icon?: string }>;
      venue?: {
        type: string;
        address: string;
        note: string;
      };
      agenda?: {
        leadInterest: string;
        organization: string;
        representative: string;
      };
      notesText?: string;
    };

    const items: TimelineItem[] = [];

    // 1. Add Scheduled Meetings
    scheduledMeetings.forEach((m, idx) => {
      const isCompleted = m.status ? (m.status.toLowerCase() === 'completed') : idx > 0;
      const isRescheduled = m.status?.toLowerCase() === 'rescheduled';
      const isCancelled = m.status?.toLowerCase() === 'cancelled';
      const statusLabel = m.status || (isCompleted ? 'Completed' : 'Scheduled');
      const statusColor = isCompleted ? 'green' : isRescheduled ? 'orange' : isCancelled ? 'red' : 'blue';
      items.push({
        id: `meet-${m.id}`,
        category: 'meeting',
        date: m.date || 'Oct 14, 2026',
        time: m.time || '12:15 PM',
        title: `Meeting with ${leadName}`,
        status: statusLabel,
        statusColor: statusColor,
        iconType: 'meeting',
        badges: [
          { label: m.title || 'Demo call', icon: 'pin' },
          { label: m.duration || '30 Minutes', icon: 'clock' },
          { label: m.meetingType?.includes('In-Person') ? 'In-Person' : 'Virtual', icon: 'mode' },
          { label: `Status: ${m.status || 'Scheduled'}` },
          { label: `Host: ${m.hostName || 'Kavin'}` },
        ],
        venue: {
          type: m.meetingType?.includes('In-Person') ? 'IN-PERSON VENUE' : 'VIRTUAL VENUE',
          address: m.meetingLink || 'coimbatore',
          note: m.meetingType?.includes('In-Person')
            ? 'In-person meeting venue address for client and team.'
            : 'Google Meet link and conference dial-in details shared.',
        },
        agenda: {
          leadInterest: offerings,
          organization: `${companyName} (${contactType})`,
          representative: m.hostName || 'Kavin',
        },
      });
    });

    // 2. Add Historical Fallback items if meetings list is empty, matching screenshot exactly
    if (items.length === 0) {
      items.push({
        id: 'hist-1',
        category: 'meeting',
        date: 'Oct 14, 2026',
        time: '12:15 PM',
        title: `Meeting with ${leadName}`,
        status: 'Completed',
        statusColor: 'green',
        iconType: 'meeting',
        badges: [
          { label: 'Demo call', icon: 'pin' },
          { label: '30 Minutes', icon: 'clock' },
          { label: 'Virtual', icon: 'mode' },
          { label: 'Status: Scheduled' },
          { label: 'Host: Kavin' },
        ],
        venue: {
          type: 'IN-PERSON VENUE',
          address: 'coimbatore',
          note: 'In-person meeting venue address for client and team.',
        },
        agenda: {
          leadInterest: offerings,
          organization: `${companyName} (${contactType})`,
          representative: 'Kavin',
        },
      });
    }

    // Historical secondary meeting
    items.push({
      id: 'hist-2',
      category: 'meeting',
      date: 'Oct 13, 2026',
      time: '10:00 AM',
      title: `Meeting with ${leadName}`,
      status: 'Completed',
      statusColor: 'green',
      iconType: 'call',
      badges: [
        { label: 'Office Visit', icon: 'pin' },
        { label: '45 Minutes', icon: 'clock' },
        { label: 'In-Person', icon: 'mode' },
        { label: 'Status: Completed' },
        { label: 'Host: Kavin' },
      ],
      venue: {
        type: 'IN-PERSON VENUE',
        address: 'Coimbatore Branch Office, Crosscut Road',
        note: 'Executive presentation and requirement sign-off.',
      },
    });

    // Calls from custom activities or historical fallback
    customActivities
      .filter((a) => a.type === 'call')
      .forEach((c) => {
        items.push({
          id: `call-${c.id}`,
          category: 'call',
          date: c.date || 'Oct 10, 2026',
          time: c.timeAgo || '04:20 PM',
          title: `Call with ${leadName}`,
          status: c.status || 'Completed',
          statusColor: 'green',
          iconType: 'meeting',
          badges: [
            { label: 'Outgoing Call', icon: 'phone' },
            { label: c.duration || '15 Minutes', icon: 'clock' },
            { label: 'Call Type: Follow-up' },
            { label: `Status: ${c.status || 'Completed'}` },
            { label: `Host: ${c.author || 'Kavin'}` },
          ],
          notesText: c.text,
        });
      });

    if (!items.some((i) => i.id.startsWith('call-'))) {
      items.push({
        id: 'hist-3',
        category: 'call',
        date: 'Oct 10, 2026',
        time: '04:20 PM',
        title: `Call with ${leadName}`,
        status: 'Completed',
        statusColor: 'green',
        iconType: 'meeting',
        badges: [
          { label: 'Outgoing Call', icon: 'phone' },
          { label: '15 Minutes', icon: 'clock' },
          { label: 'Call Type: Follow-up' },
          { label: 'Status: Completed' },
          { label: 'Host: Kavin' },
        ],
        notesText: 'Follow-up discussion on custom CRM workflow and pricing options.',
      });
    }

    // Earlier scheduled meeting
    items.push({
      id: 'hist-4',
      category: 'meeting',
      date: 'Oct 08, 2026',
      time: '11:00 AM',
      title: `Meeting with ${leadName}`,
      status: 'Scheduled',
      statusColor: 'orange',
      iconType: 'meeting',
      badges: [
        { label: 'Online Meeting', icon: 'pin' },
        { label: '60 Minutes', icon: 'clock' },
        { label: 'Virtual', icon: 'mode' },
        { label: 'Status: Scheduled' },
        { label: 'Host: Kavin' },
      ],
      venue: {
        type: 'VIRTUAL VENUE',
        address: 'https://meet.google.com/xyz-demo-crm',
        note: 'Google Meet virtual room for software presentation.',
      },
    });

    // Proposals
    if (dealData?.proposals && dealData.proposals.length > 0) {
      dealData.proposals.forEach((p) => {
        items.push({
          id: `prop-${p.id}`,
          category: 'proposal',
          date: p.issueDate || 'Oct 05, 2026',
          time: '03:30 PM',
          title: 'Proposal Sent',
          status: p.status || 'Sent',
          statusColor: p.status === 'Accepted' ? 'green' : 'blue',
          iconType: 'meeting',
          badges: [
            { label: p.title || 'IT CRM Solution Proposal' },
            { label: `Valid Till: ${p.validUntil}` },
            { label: `Prepared by: ${currentUser?.name || 'Kavin'}` },
          ],
          notesText: `Proposed Value: ₹${p.totalAmount.toLocaleString('en-IN')}. ${p.notes || ''}`,
        });
      });
    } else {
      items.push({
        id: 'hist-5',
        category: 'proposal',
        date: 'Oct 05, 2026',
        time: '03:30 PM',
        title: 'Proposal Sent',
        status: 'Sent',
        statusColor: 'blue',
        iconType: 'meeting',
        badges: [
          { label: 'IT CRM Solution Proposal' },
          { label: 'Valid Till: Oct 20, 2026' },
          { label: 'Prepared by: Kavin' },
        ],
        notesText: 'Initial commercial proposal sent to client CEO for evaluation.',
      });
    }

    return items;
  }, [scheduledMeetings, customActivities, dealData, leadName, offerings, companyName, contactType, currentUser?.name]);

  // Filtered timeline items
  const filteredTimelineItems = useMemo(() => {
    if (timelineFilter === 'all') return unifiedTimelineItems;
    if (timelineFilter === 'meetings') return unifiedTimelineItems.filter((i) => i.category === 'meeting');
    if (timelineFilter === 'calls') return unifiedTimelineItems.filter((i) => i.category === 'call');
    if (timelineFilter === 'proposals') return unifiedTimelineItems.filter((i) => i.category === 'proposal');
    return unifiedTimelineItems;
  }, [unifiedTimelineItems, timelineFilter]);

  // Deal Sections (activity timeline, calls, and notes removed as requested)
  const SECTIONS = [
    { id: 'meetings', label: 'Meetings', icon: IconCalendar },
    { id: 'proposals', label: 'Proposals', icon: IconFileDescription },
    { id: 'quotations', label: 'Quotations', icon: IconCalculator },
    { id: 'negotiation', label: 'Negotiation', icon: IconScale },
    { id: 'contracts', label: 'Contracts', icon: IconFileCheck },
    { id: 'invoices', label: 'Invoices', icon: IconReceipt },
    { id: 'payments', label: 'Payments', icon: IconCreditCard },
    { id: 'progress', label: 'Progress', icon: IconRocket },
  ];

  return (
    <Box style={{ width: '100%' }}>
      
      {/* ========================================================================= */}
      {/* 1. BREADCRUMBS                                                           */}
      {/* ========================================================================= */}
      <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="sm">
        <Group gap={6} align="center">
          <Text
            size="13px"
            fw={500}
            style={{
              color: isDark ? '#94A3B8' : '#64748B',
              cursor: 'pointer',
            }}
            onClick={onBack}
          >
            Leads
          </Text>
          <IconChevronRight size={13} color="#94A3B8" />
          <Text
            size="13px"
            fw={700}
            style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
          >
            {leadName}
          </Text>
        </Group>

        <Group gap="xs" align="center">
          <Badge
            size="sm"
            variant="light"
            color={activeLead?.status?.toLowerCase() === 'complete' ? 'teal' : 'blue'}
            radius="xl"
            style={{ textTransform: 'capitalize', fontWeight: 700 }}
          >
            {activeLead?.status === 'Contacted' ? 'In Progress' : (activeLead?.status || 'In Progress')}
          </Badge>
          <Badge
            size="sm"
            variant="outline"
            color="indigo"
            radius="xl"
            style={{ fontWeight: 600 }}
          >
            Stage: {activeLead?.stage === 'Discovery' ? 'Meetings' : (activeLead?.stage || 'Meetings')}
          </Badge>
        </Group>
      </Group>

      {/* ========================================================================= */}
      {/* 2. SECTION TABS                                                           */}
      {/* ========================================================================= */}
      <Box
        mb="xl"
        style={{
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <Group gap="xl" wrap="nowrap" style={{ minWidth: 'max-content' }}>
          {SECTIONS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <UnstyledButton
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                style={{
                  padding: '14px 6px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  borderBottom: isActive ? '3px solid #2563EB' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                  marginBottom: -1,
                }}
              >
                <Icon
                  size={16}
                  color={isActive ? '#2563EB' : (isDark ? '#94A3B8' : '#64748B')}
                  stroke={isActive ? 2.4 : 1.8}
                />
                <Text
                  size="14px"
                  fw={isActive ? 700 : 500}
                  style={{
                    color: isActive ? (isDark ? '#93C5FD' : '#2563EB') : (isDark ? '#94A3B8' : '#64748B'),
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </Text>
              </UnstyledButton>
            );
          })}
        </Group>
      </Box>

      {/* ========================================================================= */}
      {/* 3. ACTIVE SECTION CONTENT                                                 */}
      {/* ========================================================================= */}
      <Box>


      {/* SECTION 1: MEETINGS */}
      {activeTab === 'meetings' && (
        <Box>
          <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="md">
            <div>
              <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                Meetings & Discovery Sessions
              </Text>
              <Text size="xs" c="dimmed">
                Manage upcoming and conducted client meetings with {leadName}.
              </Text>
            </div>
            <Group gap="sm">
              <Button
                size="sm"
                leftSection={<IconPlus size={14} />}
                onClick={handleOpenScheduleModal}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  color: '#FFF',
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                Schedule Meeting
              </Button>
              <Button
                size="sm"
                variant="light"
                color="blue"
                rightSection={<IconArrowRight size={14} />}
                onClick={() => handleProceedToSection('proposals')}
                style={{ borderRadius: 10, fontWeight: 700 }}
              >
                Proceed to Proposal
              </Button>
            </Group>
          </Group>

          <MeetingTableView
            meetings={meetingTableData}
            hideLeadColumn
            hideAssignedUserColumn
            hideRequirementButtons
            onEdit={handleOpenEditMeeting}
            onDelete={(m) => handleDeleteMeeting(m.id)}
            onAddNew={handleOpenScheduleModal}
            onMeetingUpdated={handleMeetingUpdated}
            onViewDetails={(m) => setDetailsMeeting(m)}
          />

          <MeetingDetailsModal
            opened={!!detailsMeeting}
            onClose={() => setDetailsMeeting(null)}
            meeting={detailsMeeting}
            onMeetingUpdated={(updated) => {
              setDetailsMeeting(updated);
              handleMeetingUpdated(updated);
            }}
          />
        </Box>
      )}



      {/* TAB 4: PROPOSALS */}
      {activeTab === 'proposals' && dealData && activeLead && (
        <LeadProposalSection
          lead={activeLead}
          isDark={isDark}
          proposals={dealData.proposals}
          onUpdateProposals={handleUpdateProposals}
          onNavigateSection={handleProceedToSection}
        />
      )}

      {/* TAB 4b: QUOTATIONS */}
      {(activeTab === 'quotations' || activeTab === 'quotation') && dealData && activeLead && (
        <LeadQuotationSection
          lead={activeLead}
          isDark={isDark}
          quotations={dealData.quotations || []}
          onUpdateQuotations={handleUpdateQuotations}
          onNavigateSection={handleProceedToSection}
        />
      )}

      {/* TAB 5: NEGOTIATION */}
      {activeTab === 'negotiation' && dealData && activeLead && (
        <LeadNegotiationSection
          lead={activeLead}
          isDark={isDark}
          negotiation={dealData.negotiation}
          onUpdateNegotiation={handleUpdateNegotiation}
          onNavigateSection={handleProceedToSection}
        />
      )}

      {/* TAB 6: CONTRACTS */}
      {activeTab === 'contracts' && dealData && activeLead && (
        <LeadContractSection
          lead={activeLead}
          isDark={isDark}
          contract={dealData.contract}
          onUpdateContract={handleUpdateContract}
          onNavigateSection={handleProceedToSection}
        />
      )}

      {/* TAB 7: INVOICES */}
      {activeTab === 'invoices' && dealData && activeLead && (
        <LeadInvoiceSection
          lead={activeLead}
          isDark={isDark}
          invoices={dealData.invoices}
          onUpdateInvoices={handleUpdateInvoices}
          onNavigateSection={handleProceedToSection}
        />
      )}

      {/* TAB 8: PAYMENTS */}
      {activeTab === 'payments' && dealData && activeLead && (
        <LeadPaymentSection
          lead={activeLead}
          isDark={isDark}
          payments={dealData.payments}
          invoices={dealData.invoices}
          onUpdatePayments={handleUpdatePayments}
          onNavigateSection={handleProceedToSection}
        />
      )}

      {/* TAB 9: PROGRESS */}
      {activeTab === 'progress' && dealData && activeLead && (
        <LeadProgressSection
          lead={activeLead}
          isDark={isDark}
          progress={dealData.progress}
          onUpdateProgress={handleUpdateProgress}
          onNavigateSection={handleProceedToSection}
        />
      )}
      </Box>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* SCHEDULE MEETING MODAL */}
      <Modal
        opened={scheduleModalOpened}
        onClose={() => setScheduleModalOpened(false)}
        size="lg"
        radius="18px"
        withCloseButton={false}
        padding="xl"
        centered
        styles={{
          content: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          },
        }}
      >
        {/* Custom Header matching screenshot */}
        <Group justify="space-between" align="flex-start" mb="lg">
          <Group gap="sm" align="center">
            <Box
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#60A5FA' : '#2563EB',
              }}
            >
              <IconCalendarEvent size={22} stroke={1.8} />
            </Box>
            <div>
              <Text fw={800} size="19px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
                Schedule Meeting
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                Enter meeting details
              </Text>
            </div>
          </Group>

          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            radius="100px"
            onClick={() => setScheduleModalOpened(false)}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>

        <Box component="form" onSubmit={handleScheduleMeeting}>
          <Stack gap="md">
            {/* 1. Meeting Title * & Purpose / Agenda * */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput
                label="Meeting Title"
                withAsterisk
                placeholder={activeLead ? `e.g. Discovery Call with ${activeLead.name}` : 'e.g. Discovery & Architecture Call'}
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.currentTarget.value)}
                radius="md"
              />
              <TextInput
                label="Purpose / Agenda"
                withAsterisk
                placeholder="e.g. Product Demo & Scope Discussion"
                value={meetingPurpose}
                onChange={(e) => setMeetingPurpose(e.currentTarget.value)}
                radius="md"
              />
            </SimpleGrid>

            {/* 2. Internal Attendees & Client Attendees */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TagsInput
                label="Internal Attendees"
                placeholder="Select or enter internal team members..."
                data={employees.map((e) => e.name)}
                value={internalAttendees}
                onChange={setInternalAttendees}
                clearable
                radius="md"
              />
              <TagsInput
                label="Client Attendees"
                placeholder={activeLead ? `e.g. ${activeLead.name}, Tech Lead, Decision Maker...` : 'e.g. Athi, Tech Lead, Decision Maker...'}
                data={activeLead ? [activeLead.name] : []}
                value={clientAttendees}
                onChange={setClientAttendees}
                clearable
                radius="md"
              />
            </SimpleGrid>

            {/* 4. Meeting Date *, Meeting Time *, Duration * */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <MeetingDatePicker
                label="Meeting Date"
                placeholder="dd-mm-yyyy"
                value={meetingDate}
                onChange={(val) => setMeetingDate(val)}
                required
              />
              <MeetingTimePicker
                label="Meeting Time"
                placeholder="hh:mm"
                value={meetingTime}
                onChange={(val) => setMeetingTime(val)}
                required
              />
              <Select
                label="Duration"
                withAsterisk
                data={['15 Minutes', '30 Minutes', '45 Minutes', '1 Hour', '1.5 Hours', '2 Hours']}
                value={duration}
                onChange={(val) => setDuration(val || '30 Minutes')}
                allowDeselect={false}
                required
                radius="md"
              />
            </SimpleGrid>

            {/* 5. Meeting Type * & Meeting Link * */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <Select
                label="Meeting Type"
                withAsterisk
                required
                data={[
                  { value: 'Virtual', label: 'Virtual (Google Meet / Zoom)' },
                  { value: 'In-person', label: 'In-person (Office / Client Site)' },
                  { value: 'Phone Call', label: 'Phone Call' },
                ]}
                value={meetingType}
                onChange={(val) => setMeetingType(val || 'Virtual')}
                radius="md"
              />

              <TextInput
                label={meetingType.toLowerCase().includes('in-person') ? 'Meeting Location' : 'Meeting Link'}
                withAsterisk
                placeholder={
                  meetingType.toLowerCase().includes('in-person')
                    ? 'e.g. Client Office Address or Office Room'
                    : 'e.g. https://meet.google.com/xyz-abcd-efg or Zoom URL'
                }
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.currentTarget.value)}
                radius="md"
              />
            </SimpleGrid>

            {/* 6. Additional Notes / Discussion Points */}
            <Textarea
              label="Additional Notes / Discussion Points"
              placeholder="Special preparation, slides link, key client concerns..."
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.currentTarget.value)}
              minRows={2}
              radius="md"
            />

            {/* Action Buttons: Cancel & Save Meeting */}
            <Group justify="flex-end" gap="sm" mt="md">
              <Button
                variant="default"
                radius="md"
                onClick={() => setScheduleModalOpened(false)}
                disabled={saving}
                style={{
                  fontWeight: 600,
                  minWidth: 90,
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                radius="md"
                loading={saving}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  minWidth: 120,
                }}
              >
                Save Meeting
              </Button>
            </Group>
          </Stack>
        </Box>
      </Modal>

      {/* CALL LOG MODAL */}
      <CallLogModal
        opened={callModalOpened}
        onClose={() => setCallModalOpened(false)}
        onSave={handleSaveCall}
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

      {/* SEND EMAIL MODAL */}
      <Modal
        opened={replyBoxOpened}
        onClose={() => setReplyBoxOpened(false)}
        size="md"
        radius="16px"
        title={
          <Group gap="xs">
            <ThemeIcon color="blue" size="md" radius="md">
              <IconMail size={16} />
            </ThemeIcon>
            <Text fw={700} size="16px">Send Email to {leadName}</Text>
          </Group>
        }
      >
        <Stack gap="md">
          <TextInput
            label="To (Lead Email)"
            value={email}
            readOnly
            disabled
          />
          <TextInput
            label="Subject"
            placeholder="e.g. Requirement discussion follow-up"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            required
          />
          <Textarea
            label="Message"
            placeholder="Write your email body..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            minRows={4}
            required
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setReplyBoxOpened(false)}>Cancel</Button>
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

      {/* ADD NOTE MODAL */}
      <Modal
        opened={commentBoxOpened}
        onClose={() => setCommentBoxOpened(false)}
        size="md"
        radius="16px"
        title={
          <Group gap="xs">
            <ThemeIcon color="yellow" size="md" radius="md">
              <IconNote size={16} />
            </ThemeIcon>
            <Text fw={700} size="16px">Add Internal Activity Note</Text>
          </Group>
        }
      >
        <Stack gap="md">
          <TextInput
            label="Note Title / Focus"
            placeholder="e.g. Requirement minutes, decision makers"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <Textarea
            label="Note Content"
            placeholder="Enter discussion points, client preferences, action items..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            minRows={4}
            required
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setCommentBoxOpened(false)}>Cancel</Button>
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
    </Box>
  );
};

export default LeadSchedulePage;
