import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  SimpleGrid,
  TextInput,
  Button,
  Group,
  Text,
  ActionIcon,
  Box,
  Textarea,
  Select,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconX,
  IconUser,
  IconBuilding,
  IconId,
  IconMail,
  IconPhone,
  IconWorld,
  IconMapPin,
  IconPhoneCall,
  IconPhoneOutgoing,
  IconClock,
  IconCheck,
  IconCalendar,
  IconBrandWhatsapp,
  IconSend,
  IconActivity,
  IconCalendarEvent,
  IconLink,
} from '@tabler/icons-react';
import { Contact, ContactFormData } from '../../../types/contact';
import { useContact } from '../../../context/ContactContext';
import { useCRM } from '../../../context/CRMContext';
import { createMeetingApi } from '../../../services/meetingService';
import { MeetingTimePicker } from '../../meetings/components/MeetingTimePicker';
import { MeetingDatePicker } from '../../meetings/components/MeetingDatePicker';

interface ContactModalProps {
  opened: boolean;
  onClose: () => void;
  contact?: Contact | null;
  onSuccess?: () => void;
  title?: string;
  showContactMode?: boolean;
}

const parseTimeToMinutes = (timeStr: string): { minutes: number; isAM: boolean; isPM: boolean; rawHours: number } | null => {
  if (!timeStr) return null;
  const trimmed = timeStr.trim();

  // Match 12-hour: e.g. "10:05 AM", "10:05:00 AM", "10:05am", "2:30 pm"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (match12) {
    const rawHours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[4].toUpperCase();

    let h = rawHours;
    if (h === 12) {
      h = meridiem === 'PM' ? 12 : 0;
    } else if (meridiem === 'PM') {
      h += 12;
    }

    return {
      minutes: h * 60 + minutes,
      isAM: meridiem === 'AM',
      isPM: meridiem === 'PM',
      rawHours,
    };
  }

  // Match 24-hour: e.g. "10:05", "14:30"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);

    return {
      minutes: hours * 60 + minutes,
      isAM: hours < 12,
      isPM: hours >= 12,
      rawHours: hours,
    };
  }

  return null;
};

const calculateCallDuration = (from: string, to: string): string => {
  const fromParsed = parseTimeToMinutes(from);
  const toParsed = parseTimeToMinutes(to);

  if (!fromParsed || !toParsed) return '';

  let fromMin = fromParsed.minutes;
  let toMin = toParsed.minutes;

  // Handle standard human clock logic when user enters "12:00 AM" after morning hours:
  // E.g., From: 10:00 AM (or 11:00 AM) and To: 12:00 AM (intending 12:00 noon, +1 or +2 hours)
  if (toParsed.rawHours === 12 && toParsed.isAM && fromParsed.isAM && fromMin >= 360) {
    toMin = 720; // 12:00 noon = 720 minutes
  }

  let diffMinutes = toMin - fromMin;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Cross midnight
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = Math.floor(diffMinutes % 60);

  // Return standard H:MM format (e.g. "1:00", "2:00", "0:45", "1:30")
  return `${hours}:${String(minutes).padStart(2, '0')}`;
};

const getTodayDateStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getCurrentTimeStr = (): string => {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

export const ContactModal: React.FC<ContactModalProps> = ({
  opened,
  onClose,
  contact,
  onSuccess,
  title,
  showContactMode,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { createContact, updateContact, loading, metadata } = useContact();
  const { currentUser } = useCRM();
  const isEditing = Boolean(contact);

  const initialFormState: ContactFormData = {
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    contactMode: '',
    source: '',
    location: '',
    assignedTo: '',
    estimatedValue: '',
    expectedCloseDate: '',
    description: '',
  };

  const [formData, setFormData] = useState<ContactFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic Call Fields State
  const [callType, setCallType] = useState<string>('Outgoing');
  const [callDate, setCallDate] = useState<string>(getTodayDateStr());
  const [callFromTime, setCallFromTime] = useState<string>('');
  const [callToTime, setCallToTime] = useState<string>('');
  const [callDuration, setCallDuration] = useState<string>('');
  const [callStatus, setCallStatus] = useState<string>('Follow-up');
  const [nextFollowDate, setNextFollowDate] = useState<string>('');

  // Dynamic WhatsApp Fields State
  const [whatsappMessageType, setWhatsappMessageType] = useState<string>('Outgoing');
  const [whatsappStatus, setWhatsappStatus] = useState<string>('Msg Sent');
  const [whatsappDate, setWhatsappDate] = useState<string>(getTodayDateStr());
  const [whatsappTime, setWhatsappTime] = useState<string>(getCurrentTimeStr());

  // Dynamic Email Fields State
  const [emailType, setEmailType] = useState<string>('Outgoing');
  const [emailStatus, setEmailStatus] = useState<string>('Mail Sent');
  const [emailDate, setEmailDate] = useState<string>(getTodayDateStr());
  const [emailTime, setEmailTime] = useState<string>(getCurrentTimeStr());

  // Dynamic Other Activity Fields State
  const [otherActivityType, setOtherActivityType] = useState<string>('Direct Visit');
  const [otherStatus, setOtherStatus] = useState<string>('Follow up');
  const [otherActivityDate, setOtherActivityDate] = useState<string>(getTodayDateStr());
  const [otherActivityTime, setOtherActivityTime] = useState<string>(getCurrentTimeStr());

  // Dynamic Meeting Fields State
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [meetingPurpose, setMeetingPurpose] = useState<string>('Requirement discussion & demo');
  const [meetingHostId, setMeetingHostId] = useState<string>('');
  const [meetingHostName, setMeetingHostName] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>(getTodayDateStr());
  const [meetingFromTime, setMeetingFromTime] = useState<string>('10:00 AM');
  const [meetingToTime, setMeetingToTime] = useState<string>('10:30 AM');
  const [meetingDuration, setMeetingDuration] = useState<string>('30 Minutes');
  const [meetingType, setMeetingType] = useState<string>('Virtual');
  const [meetingLocation, setMeetingLocation] = useState<string>('https://meet.google.com/');
  const [meetingStatus, setMeetingStatus] = useState<string>('Scheduled');

  useEffect(() => {
    if (contact) {
      setFormData({
        id: contact.id,
        contactId: contact.contactId,
        name: contact.name || '',
        companyName: contact.companyName || '',
        contactPerson: contact.contactPerson || contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        contactMode: (contact as any).contactMode || 'Call',
        source: contact.source || '',
        location: (contact as any).location || (contact as any).city || contact.address || (contact as any).street || '',
        assignedTo: contact.assignedTo || '',
        estimatedValue: contact.estimatedValue || '',
        expectedCloseDate: contact.expectedCloseDate || '',
        description: contact.description || contact.notes || '',
      });
      setCallType((contact as any).callType || 'Outgoing');
      setCallDate((contact as any).callDate || getTodayDateStr());
      setCallFromTime((contact as any).callFromTime || (contact as any).fromTime || '');
      setCallToTime((contact as any).callToTime || (contact as any).toTime || '');
      setCallDuration((contact as any).callDuration || (contact as any).duration || '');
      const existingStatus = (contact as any).callStatus || (contact as any).status;
      setCallStatus(existingStatus && existingStatus !== 'Completed' ? existingStatus : 'Follow-up');
      setNextFollowDate((contact as any).nextFollowDate || '');

      setWhatsappMessageType((contact as any).whatsappMessageType || 'Outgoing');
      setWhatsappStatus((contact as any).whatsappStatus || (contact as any).status || 'Msg Sent');
      setWhatsappDate((contact as any).whatsappDate || getTodayDateStr());
      setWhatsappTime((contact as any).whatsappTime || getCurrentTimeStr());

      setEmailType((contact as any).emailType || 'Outgoing');
      setEmailStatus((contact as any).emailStatus || (contact as any).status || 'Mail Sent');
      setEmailDate((contact as any).emailDate || getTodayDateStr());
      setEmailTime((contact as any).emailTime || getCurrentTimeStr());

      setOtherActivityType((contact as any).activityType || (contact as any).otherActivityType || 'Direct Visit');
      setOtherStatus((contact as any).activityStatus || (contact as any).otherStatus || (contact as any).status || 'Follow up');
      setOtherActivityDate((contact as any).activityDate || (contact as any).otherActivityDate || getTodayDateStr());
      setOtherActivityTime((contact as any).activityTime || (contact as any).otherActivityTime || getCurrentTimeStr());

      const contactDisplayName = contact.name || 'Client';
      setMeetingTitle((contact as any).meetingTitle || `Discovery Call & Demo with ${contactDisplayName}`);
      setMeetingPurpose((contact as any).meetingPurpose || 'Requirement discussion & demo');
      const defaultHostName = (contact as any).assignedToName || (contact as any).assignedTo || currentUser?.name || 'Sandy';
      const defaultHost = metadata?.employees?.find(
        (e: any) => e.name === defaultHostName || e.id === (contact as any).assignedTo || (e as any).empCode === (contact as any).assignedTo
      );
      setMeetingHostId((contact as any).meetingHostId || defaultHost?.id || (contact as any).assignedTo || '');
      setMeetingHostName((contact as any).meetingHostName || defaultHost?.name || defaultHostName);
      setMeetingDate((contact as any).meetingDate || getTodayDateStr());
      setMeetingFromTime((contact as any).meetingFromTime || '10:00 AM');
      setMeetingToTime((contact as any).meetingToTime || '10:30 AM');
      setMeetingDuration((contact as any).meetingDuration || '30 Minutes');
      setMeetingType((contact as any).meetingType || 'Virtual');
      setMeetingLocation((contact as any).meetingLocation || 'https://meet.google.com/');
      setMeetingStatus((contact as any).meetingStatus || 'Scheduled');
    } else {
      setFormData(initialFormState);
      setCallType('Outgoing');
      setCallDate(getTodayDateStr());
      setCallFromTime('');
      setCallToTime('');
      setCallDuration('');
      setCallStatus('Follow-up');
      setNextFollowDate('');

      setWhatsappMessageType('Outgoing');
      setWhatsappStatus('Msg Sent');
      setWhatsappDate(getTodayDateStr());
      setWhatsappTime(getCurrentTimeStr());

      setEmailType('Outgoing');
      setEmailStatus('Mail Sent');
      setEmailDate(getTodayDateStr());
      setEmailTime(getCurrentTimeStr());

      setOtherActivityType('Direct Visit');
      setOtherStatus('Follow up');
      setOtherActivityDate(getTodayDateStr());
      setOtherActivityTime(getCurrentTimeStr());

      setMeetingTitle('Discovery Call & Demo');
      setMeetingPurpose('Requirement discussion & demo');
      const defaultHost = metadata?.employees?.find((e: any) => e.name === currentUser?.name || e.id === currentUser?.id);
      setMeetingHostId(defaultHost?.id || currentUser?.id || '');
      setMeetingHostName(defaultHost?.name || currentUser?.name || 'Sandy');
      setMeetingDate(getTodayDateStr());
      setMeetingFromTime('10:00 AM');
      setMeetingToTime('10:30 AM');
      setMeetingDuration('30 Minutes');
      setMeetingType('Virtual');
      setMeetingLocation('https://meet.google.com/');
      setMeetingStatus('Scheduled');
    }
    setErrors({});
  }, [contact, opened]);

  const calculateMeetingDurationStr = (from: string, to: string): string => {
    const fromParsed = parseTimeToMinutes(from);
    const toParsed = parseTimeToMinutes(to);
    if (!fromParsed || !toParsed) return '';

    let fromMin = fromParsed.minutes;
    let toMin = toParsed.minutes;
    if (toParsed.rawHours === 12 && toParsed.isAM && fromParsed.isAM && fromMin >= 360) {
      toMin = 720;
    }
    let diffMinutes = toMin - fromMin;
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    if (diffMinutes === 0) return '0 Minutes';

    const h = Math.floor(diffMinutes / 60);
    const m = Math.floor(diffMinutes % 60);
    if (h > 0 && m > 0) return `${h} Hour ${m} Minutes`;
    if (h > 0 && m === 0) return `${h} ${h === 1 ? 'Hour' : 'Hours'}`;
    return `${m} Minutes`;
  };

  const handleFromTimeChange = (val: string) => {
    setCallFromTime(val);
    if (val && callToTime) {
      const dur = calculateCallDuration(val, callToTime);
      if (dur) setCallDuration(dur);
    }
  };

  const handleToTimeChange = (val: string) => {
    setCallToTime(val);
    if (callFromTime && val) {
      const dur = calculateCallDuration(callFromTime, val);
      if (dur) setCallDuration(dur);
    }
  };

  const handleMeetingFromTimeChange = (val: string) => {
    setMeetingFromTime(val);
    if (val && meetingToTime) {
      const dur = calculateMeetingDurationStr(val, meetingToTime);
      if (dur) setMeetingDuration(dur);
    }
  };

  const handleMeetingToTimeChange = (val: string) => {
    setMeetingToTime(val);
    if (meetingFromTime && val) {
      const dur = calculateMeetingDurationStr(meetingFromTime, val);
      if (dur) setMeetingDuration(dur);
    }
  };

  const handleFieldChange = (field: keyof ContactFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'contactMode' && value === 'Call') {
      if (callFromTime && callToTime && !callDuration) {
        const dur = calculateCallDuration(callFromTime, callToTime);
        if (dur) setCallDuration(dur);
      }
    }

    if (field === 'contactMode' && value === 'Meeting') {
      if (!meetingTitle) {
        const nameVal = formData.name || contact?.name || 'Contact';
        setMeetingTitle(`Discovery & Demo Meeting with ${nameVal}`);
      }
      if (meetingFromTime && meetingToTime && !meetingDuration) {
        const dur = calculateMeetingDurationStr(meetingFromTime, meetingToTime);
        if (dur) setMeetingDuration(dur);
      }
    }

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Email validation (only if filled)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Invalid email address format';
      }
    }

    // 2. Phone validation (only if filled)
    if (formData.phone && formData.phone.trim()) {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length > 0 && digits.length !== 10) {
        newErrors.phone = 'Phone number must be exactly 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      let finalStatus = contact?.status || 'Not Connected';
      let finalFollowDate: string | undefined = undefined;

      if (formData.contactMode === 'Call') {
        finalStatus = callStatus === 'Follow-up' ? 'Follow-up Required' : callStatus;
        if (callStatus === 'Follow-up') finalFollowDate = nextFollowDate || undefined;
      } else if (formData.contactMode === 'WhatsApp') {
        finalStatus = whatsappStatus === 'Follow up' ? 'Follow-up Required' : (whatsappStatus === 'Interested' ? 'Qualified' : (whatsappStatus === 'Not Interested' ? 'Disqualified' : whatsappStatus));
        if (whatsappStatus === 'Follow up') finalFollowDate = nextFollowDate || undefined;
      } else if (formData.contactMode === 'Email') {
        finalStatus = emailStatus === 'Follow up' ? 'Follow-up Required' : (emailStatus === 'Interested' ? 'Qualified' : (emailStatus === 'Not Interested' ? 'Disqualified' : emailStatus));
        if (emailStatus === 'Follow up') finalFollowDate = nextFollowDate || undefined;
      } else if (formData.contactMode === 'Other' || formData.contactMode === 'Others') {
        finalStatus = otherStatus === 'Follow up' ? 'Follow-up Required' : (otherStatus === 'Interested' ? 'Qualified' : (otherStatus === 'Not Interested' ? 'Disqualified' : otherStatus));
        if (otherStatus === 'Follow up') finalFollowDate = nextFollowDate || undefined;
      } else if (formData.contactMode === 'Meeting') {
        finalStatus = meetingStatus === 'Completed'
          ? 'Qualified'
          : (meetingStatus === 'Cancelled' ? 'Disqualified' : (meetingStatus === 'Follow-up' ? 'Follow-up Required' : 'In Progress'));
        if (meetingStatus === 'Follow-up') finalFollowDate = nextFollowDate || undefined;
      }

      const payload: ContactFormData = {
        name: formData.name ? formData.name.trim() : (contact?.name || 'Contact'),
        companyName: formData.companyName?.trim() || undefined,
        contactPerson: formData.contactPerson?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : '',
        contactMode: formData.contactMode?.trim() || undefined,
        source: formData.source?.trim() || undefined,
        location: formData.location?.trim() || undefined,
        city: formData.location?.trim() || undefined,
        address: formData.location?.trim() || undefined,
        assignedTo: formData.assignedTo && formData.assignedTo !== 'none' ? formData.assignedTo : undefined,
        estimatedValue: formData.estimatedValue?.trim() || undefined,
        expectedCloseDate: formData.expectedCloseDate?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        status: finalStatus,
        stage: contact?.stage || 'Initialization',
        qualificationStatus: finalStatus === 'Qualified' ? 'Qualified' : (finalStatus === 'Follow-up Required' ? 'Follow-up Required' : (finalStatus === 'Disqualified' ? 'Disqualified' : (contact?.qualificationStatus || 'New'))),
        // Dynamic Call
        callType: formData.contactMode === 'Call' ? callType : undefined,
        callDate: formData.contactMode === 'Call' ? callDate : undefined,
        callFromTime: formData.contactMode === 'Call' ? callFromTime : undefined,
        callToTime: formData.contactMode === 'Call' ? callToTime : undefined,
        callDuration: formData.contactMode === 'Call' ? callDuration : undefined,
        callStatus: formData.contactMode === 'Call' ? callStatus : undefined,
        // Dynamic WhatsApp
        whatsappMessageType: formData.contactMode === 'WhatsApp' ? whatsappMessageType : undefined,
        whatsappStatus: formData.contactMode === 'WhatsApp' ? whatsappStatus : undefined,
        whatsappDate: formData.contactMode === 'WhatsApp' ? whatsappDate : undefined,
        whatsappTime: formData.contactMode === 'WhatsApp' ? whatsappTime : undefined,
        // Dynamic Email
        emailType: formData.contactMode === 'Email' ? emailType : undefined,
        emailStatus: formData.contactMode === 'Email' ? emailStatus : undefined,
        emailDate: formData.contactMode === 'Email' ? emailDate : undefined,
        emailTime: formData.contactMode === 'Email' ? emailTime : undefined,
        // Dynamic Other
        activityType: (formData.contactMode === 'Other' || formData.contactMode === 'Others') ? otherActivityType : undefined,
        activityStatus: (formData.contactMode === 'Other' || formData.contactMode === 'Others') ? otherStatus : undefined,
        activityDate: (formData.contactMode === 'Other' || formData.contactMode === 'Others') ? otherActivityDate : undefined,
        activityTime: (formData.contactMode === 'Other' || formData.contactMode === 'Others') ? otherActivityTime : undefined,
        // Dynamic Meeting
        meetingTitle: formData.contactMode === 'Meeting' ? meetingTitle : undefined,
        meetingPurpose: formData.contactMode === 'Meeting' ? meetingPurpose : undefined,
        meetingHostId: formData.contactMode === 'Meeting' ? meetingHostId : undefined,
        meetingHostName: formData.contactMode === 'Meeting' ? meetingHostName : undefined,
        meetingDate: formData.contactMode === 'Meeting' ? meetingDate : undefined,
        meetingFromTime: formData.contactMode === 'Meeting' ? meetingFromTime : undefined,
        meetingToTime: formData.contactMode === 'Meeting' ? meetingToTime : undefined,
        meetingDuration: formData.contactMode === 'Meeting' ? meetingDuration : undefined,
        meetingType: formData.contactMode === 'Meeting' ? meetingType : undefined,
        meetingLocation: formData.contactMode === 'Meeting' ? meetingLocation : undefined,
        meetingStatus: formData.contactMode === 'Meeting' ? meetingStatus : undefined,
        nextFollowDate: finalFollowDate,
      };

      let res;
      if (isEditing && contact?.id) {
        res = await updateContact(contact.id, payload);
      } else {
        res = await createContact(payload);
      }

      // If contact mode is Meeting, automatically update/log the meeting in Scheduled Meetings module
      if (formData.contactMode === 'Meeting') {
        try {
          const contactIdentifier = res?.data?.id || res?.data?.contactId || contact?.id || contact?.contactId;
          const clientDisplayName = formData.companyName
            ? `${formData.name || contact?.name || 'Contact'} (${formData.companyName})`
            : (formData.name || contact?.name || 'Contact');

          await createMeetingApi({
            contactId: contactIdentifier,
            leadId: contactIdentifier,
            clientName: clientDisplayName,
            title: meetingTitle.trim() || `Meeting with ${formData.name || contact?.name || 'Client'}`,
            purpose: meetingPurpose.trim() || meetingTitle.trim() || 'Client Meeting',
            meetingDate: meetingDate,
            startTime: meetingFromTime,
            endTime: meetingToTime,
            meetingTime: meetingFromTime,
            duration: meetingDuration,
            meetingType: meetingType,
            location: meetingLocation.trim(),
            meetingLocation: meetingLocation.trim(),
            meetingLink: meetingLocation.trim(),
            employeeId: meetingHostId || undefined,
            employeeName: meetingHostName || formData.assignedTo || currentUser?.name || 'Sandy',
            notes: formData.description?.trim() || undefined,
            status: meetingStatus,
            meetingStatus: meetingStatus,
          });

          window.dispatchEvent(new CustomEvent('crm_meetings_updated'));
        } catch (meetingErr) {
          console.error('Error logging scheduled meeting:', meetingErr);
        }
      }

      // Notify Activity Logs and Contacts to refresh multi-channel records
      try {
        window.dispatchEvent(new CustomEvent('crm_call_logs_updated'));
        window.dispatchEvent(new CustomEvent('crm_activities_updated'));
        window.dispatchEvent(new CustomEvent('crm_contacts_updated'));
        window.dispatchEvent(new CustomEvent('crm_meetings_updated'));
      } catch (_) {}

      if (res?.success) {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving contact:', err);
    }
  };



  const inputStyles = {
    input: {
      height: 44,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      border: isDark ? '1.5px solid rgba(255, 255, 255, 0.16)' : '1.5px solid #CBD5E1',
      borderRadius: 10,
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontSize: 14,
      fontWeight: 500,
      boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
    },
    label: {
      fontWeight: 600,
      fontSize: 13,
      marginBottom: 6,
      color: isDark ? '#E2E8F0' : '#1E293B',
      letterSpacing: '0.01em',
    },
    section: {
      color: isDark ? '#94A3B8' : '#64748B',
    },
  };

  const textareaStyles = {
    input: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      border: isDark ? '1.5px solid rgba(255, 255, 255, 0.16)' : '1.5px solid #CBD5E1',
      borderRadius: 10,
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontSize: 14,
      fontWeight: 500,
      padding: '12px 14px',
      boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    },
    label: {
      fontWeight: 600,
      fontSize: 13,
      marginBottom: 6,
      color: isDark ? '#E2E8F0' : '#1E293B',
      letterSpacing: '0.01em',
    },
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="720px"
      radius="16px"
      padding="xl"
      centered
      styles={{
        header: {
          display: 'none',
        },
        content: {
          background: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.18)',
        },
        body: {
          padding: '28px 32px 32px 32px',
        },
      }}
    >
      <style>{`
        .contact-form-field input:focus,
        .contact-form-field textarea:focus {
          border-color: #3B82F6 !important;
          box-shadow: 0 0 0 3.5px rgba(59, 130, 246, 0.18) !important;
        }
        .contact-form-field input:hover,
        .contact-form-field textarea:hover {
          border-color: ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#94A3B8'} !important;
        }
      `}</style>

      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="xl">
        <Box>
          <Text fw={700} size="22px" style={{ color: isDark ? '#F8FAFC' : '#111827', lineHeight: 1.2 }}>
            {title || (isEditing ? 'Update contact' : 'Create contact')}
          </Text>
          <Text size="13.5px" c="dimmed" mt={4}>
            Add the essential details. You can complete the record later.
          </Text>
        </Box>

        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          radius="100px"
          onClick={onClose}
          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
        >
          <IconX size={20} />
        </ActionIcon>
      </Group>

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          {/* Row 1: Name | Company */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <TextInput
              className="contact-form-field"
              label="Name"
              placeholder="e.g. John Doe / Lead Name"
              leftSection={<IconUser size={18} stroke={1.6} />}
              value={formData.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              error={errors.name}
              styles={inputStyles}
            />

            <TextInput
              className="contact-form-field"
              label="Company"
              placeholder="e.g. TechCorp Solutions"
              leftSection={<IconBuilding size={18} stroke={1.6} />}
              value={formData.companyName || ''}
              onChange={(e) => handleFieldChange('companyName', e.target.value)}
              error={errors.companyName}
              styles={inputStyles}
            />
          </SimpleGrid>

          {/* Row 2: Contact person | Email */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <TextInput
              className="contact-form-field"
              label="Contact person"
              placeholder="e.g. Alex Morgan (Optional)"
              leftSection={<IconId size={18} stroke={1.6} />}
              value={formData.contactPerson || ''}
              onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
              styles={inputStyles}
            />

            <TextInput
              className="contact-form-field"
              label="Email"
              placeholder="e.g. alex@techcorp.com"
              type="email"
              leftSection={<IconMail size={18} stroke={1.6} />}
              value={formData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              error={errors.email}
              styles={inputStyles}
            />
          </SimpleGrid>

          {/* Row 3: Phone number | Source */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <TextInput
              className="contact-form-field"
              label="Phone number"
              placeholder="e.g. 9876543210"
              maxLength={10}
              leftSection={<IconPhone size={18} stroke={1.6} />}
              value={formData.phone || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleFieldChange('phone', val);
              }}
              error={errors.phone}
              styles={inputStyles}
            />

            <TextInput
              className="contact-form-field"
              label="Source"
              placeholder="e.g. Bulk Import, Website, Referral"
              leftSection={<IconWorld size={18} stroke={1.6} />}
              value={formData.source || ''}
              onChange={(e) => handleFieldChange('source', e.target.value)}
              styles={inputStyles}
            />
          </SimpleGrid>

          {/* Row 4: Location | Contact mode */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <TextInput
              className="contact-form-field"
              label="Location"
              placeholder="e.g. Chennai, Tamil Nadu, India"
              leftSection={<IconMapPin size={18} stroke={1.6} />}
              value={formData.location || ''}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              styles={inputStyles}
            />

            <Select
              className="contact-form-field"
              label="Contact mode"
              placeholder="Select contact mode (e.g. Call, WhatsApp)"
              data={[
                { value: 'Call', label: 'Call' },
                { value: 'WhatsApp', label: 'WhatsApp' },
                { value: 'Email', label: 'Email' },
                { value: 'Meeting', label: 'Meeting' },
                { value: 'Other', label: 'Other' },
              ]}
              leftSection={<IconPhoneCall size={18} stroke={1.6} />}
              value={formData.contactMode || null}
              onChange={(val) => handleFieldChange('contactMode', val || '')}
              clearable
              styles={inputStyles}
            />
          </SimpleGrid>

          {/* Dynamic Call Fields (when Contact mode is Call) */}
          {formData.contactMode === 'Call' && (
            <Box
              p="md"
              style={{
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              }}
            >
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Group gap={8}>
                    <IconPhoneCall size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                    <Text size="xs" fw={700} style={{ color: isDark ? '#93C5FD' : '#1D4ED8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Call Details
                    </Text>
                  </Group>
                  <Text size="11px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Auto-logs call activity
                  </Text>
                </Group>

                {/* Call Type | Call Date */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <Select
                    className="contact-form-field"
                    label="Call type"
                    placeholder="Select Call Type"
                    data={[
                      { value: 'Outgoing', label: 'Outgoing' },
                      { value: 'Incoming', label: 'Incoming' },
                    ]}
                    leftSection={<IconPhoneOutgoing size={18} stroke={1.6} />}
                    value={callType}
                    onChange={(val) => setCallType(val || 'Outgoing')}
                    allowDeselect={false}
                    styles={inputStyles}
                  />

                  <MeetingDatePicker
                    label="Call date"
                    placeholder="DD-MM-YYYY"
                    value={callDate}
                    onChange={(val) => setCallDate(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    leftSection={<IconCalendar size={18} stroke={1.6} />}
                  />
                </SimpleGrid>

                {/* From time | To time */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <MeetingTimePicker
                    label="From time"
                    placeholder="e.g. 10:00 AM"
                    value={callFromTime}
                    onChange={handleFromTimeChange}
                    styles={inputStyles}
                    zIndex={3000}
                    hideQuickSelect
                  />

                  <MeetingTimePicker
                    label="To time"
                    placeholder="e.g. 10:05 AM"
                    value={callToTime}
                    onChange={handleToTimeChange}
                    styles={inputStyles}
                    zIndex={3000}
                    hideQuickSelect
                  />
                </SimpleGrid>

                {/* Duration | Status */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <TextInput
                    className="contact-form-field"
                    label="Duration"
                    placeholder="1:00 (Auto-calculated)"
                    leftSection={<IconClock size={18} stroke={1.6} />}
                    value={callDuration}
                    onChange={(e) => setCallDuration(e.target.value)}
                    styles={inputStyles}
                  />

                  <Select
                    className="contact-form-field"
                    label="Status"
                    placeholder="Select Status"
                    data={[
                      { value: 'Follow-up', label: 'Follow-up' },
                      { value: 'Missed', label: 'Missed' },
                      { value: 'Busy', label: 'Busy' },
                      { value: 'No Answer', label: 'No Answer' },
                      { value: 'Not Interested', label: 'Not Interested' },
                    ]}
                    leftSection={<IconCheck size={18} stroke={1.6} />}
                    value={callStatus}
                    onChange={(val) => setCallStatus(val || 'Follow-up')}
                    allowDeselect={false}
                    styles={inputStyles}
                  />
                </SimpleGrid>

                {/* Dynamic Next Follow-up Date (shown when Follow-up is selected) */}
                {callStatus === 'Follow-up' && (
                  <MeetingDatePicker
                    label="Next follow-up date"
                    placeholder="DD-MM-YYYY"
                    value={nextFollowDate}
                    onChange={(val) => setNextFollowDate(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    leftSection={<IconCalendar size={18} stroke={1.6} />}
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* Dynamic WhatsApp Fields (when Contact mode is WhatsApp) */}
          {formData.contactMode === 'WhatsApp' && (
            <Box
              p="md"
              style={{
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(20, 83, 45, 0.25)' : '#F0FDF4',
                border: isDark ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid #BBF7D0',
              }}
            >
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Group gap={8}>
                    <IconBrandWhatsapp size={16} color={isDark ? '#4ADE80' : '#16A34A'} />
                    <Text size="xs" fw={700} style={{ color: isDark ? '#86EFAC' : '#15803D', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      WhatsApp Details
                    </Text>
                  </Group>
                  <Text size="11px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Auto-logs WhatsApp activity
                  </Text>
                </Group>

                {/* Message type | Status */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <Select
                    className="contact-form-field"
                    label="Message type"
                    placeholder="Select Message Type"
                    data={[
                      { value: 'Outgoing', label: 'Outgoing' },
                      { value: 'Incoming', label: 'Incoming' },
                      { value: 'Template Message', label: 'Template Message' },
                      { value: 'Direct Message', label: 'Direct Message' },
                    ]}
                    leftSection={<IconSend size={18} stroke={1.6} />}
                    value={whatsappMessageType}
                    onChange={(val) => setWhatsappMessageType(val || 'Outgoing')}
                    allowDeselect={false}
                    styles={inputStyles}
                  />

                  <Select
                    className="contact-form-field"
                    label="Status"
                    placeholder="Select Status"
                    data={[
                      { value: 'Msg Sent', label: 'Msg Sent' },
                      { value: 'Replied', label: 'Replied' },
                      { value: 'Failed', label: 'Failed' },
                      { value: 'Interested', label: 'Interested' },
                      { value: 'Follow up', label: 'Follow up' },
                      { value: 'Not Interested', label: 'Not Interested' },
                    ]}
                    leftSection={<IconCheck size={18} stroke={1.6} />}
                    value={whatsappStatus}
                    onChange={(val) => setWhatsappStatus(val || 'Msg Sent')}
                    allowDeselect={false}
                    styles={inputStyles}
                  />
                </SimpleGrid>

                {/* Message activity date | Message activity time */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <MeetingDatePicker
                    label="Message activity date"
                    placeholder="DD-MM-YYYY"
                    value={whatsappDate}
                    onChange={(val) => setWhatsappDate(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    leftSection={<IconCalendar size={18} stroke={1.6} />}
                  />

                  <MeetingTimePicker
                    label="Message activity time"
                    placeholder="e.g. 10:00 AM"
                    value={whatsappTime}
                    onChange={(val) => setWhatsappTime(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    hideQuickSelect
                  />
                </SimpleGrid>

                {/* Dynamic Next Follow-up Date (shown when Follow up is selected) */}
                {whatsappStatus === 'Follow up' && (
                  <MeetingDatePicker
                    label="Next follow-up date"
                    placeholder="DD-MM-YYYY"
                    value={nextFollowDate}
                    onChange={(val) => setNextFollowDate(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    leftSection={<IconCalendar size={18} stroke={1.6} />}
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* Dynamic Email Fields (when Contact mode is Email) */}
          {formData.contactMode === 'Email' && (
            <Box
              p="md"
              style={{
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(67, 56, 202, 0.2)' : '#EEF2FF',
                border: isDark ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid #C7D2FE',
              }}
            >
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Group gap={8}>
                    <IconMail size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                    <Text size="xs" fw={700} style={{ color: isDark ? '#A5B4FC' : '#4338CA', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Email Details
                    </Text>
                  </Group>
                  <Text size="11px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Auto-logs email activity
                  </Text>
                </Group>

                {/* Email type | Status */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <Select
                    className="contact-form-field"
                    label="Email type"
                    placeholder="Select Email Type"
                    data={[
                      { value: 'Outgoing', label: 'Outgoing' },
                      { value: 'Incoming', label: 'Incoming' },
                      { value: 'Proposal', label: 'Proposal' },
                      { value: 'Follow-up Email', label: 'Follow-up Email' },
                      { value: 'Introduction', label: 'Introduction' },
                    ]}
                    leftSection={<IconMail size={18} stroke={1.6} />}
                    value={emailType}
                    onChange={(val) => setEmailType(val || 'Outgoing')}
                    allowDeselect={false}
                    styles={inputStyles}
                  />

                  <Select
                    className="contact-form-field"
                    label="Status"
                    placeholder="Select Status"
                    data={[
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Mail Sent', label: 'Mail Sent' },
                      { value: 'Replied', label: 'Replied' },
                      { value: 'Failed', label: 'Failed' },
                      { value: 'Interested', label: 'Interested' },
                      { value: 'Follow up', label: 'Follow up' },
                      { value: 'Not Interested', label: 'Not Interested' },
                    ]}
                    leftSection={<IconCheck size={18} stroke={1.6} />}
                    value={emailStatus}
                    onChange={(val) => setEmailStatus(val || 'Mail Sent')}
                    allowDeselect={false}
                    styles={inputStyles}
                  />
                </SimpleGrid>

                {/* Email activity date | Email activity time */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <MeetingDatePicker
                    label="Email activity date"
                    placeholder="DD-MM-YYYY"
                    value={emailDate}
                    onChange={(val) => setEmailDate(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    leftSection={<IconCalendar size={18} stroke={1.6} />}
                  />

                  <MeetingTimePicker
                    label="Email activity time"
                    placeholder="e.g. 10:00 AM"
                    value={emailTime}
                    onChange={(val) => setEmailTime(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    hideQuickSelect
                  />
                </SimpleGrid>

                {/* Dynamic Next Follow-up Date (shown when Follow up is selected) */}
                {emailStatus === 'Follow up' && (
                  <MeetingDatePicker
                    label="Next follow-up date"
                    placeholder="DD-MM-YYYY"
                    value={nextFollowDate}
                    onChange={(val) => setNextFollowDate(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    leftSection={<IconCalendar size={18} stroke={1.6} />}
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* Dynamic Other Activity Fields (when Contact mode is Other / Others) */}
          {(formData.contactMode === 'Other' || formData.contactMode === 'Others') && (
            <Box
              p="md"
              style={{
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(180, 83, 9, 0.2)' : '#FFFBEB',
                border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #FDE68A',
              }}
            >
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Group gap={8}>
                    <IconActivity size={16} color={isDark ? '#FBBF24' : '#D97706'} />
                    <Text size="xs" fw={700} style={{ color: isDark ? '#FDE68A' : '#B45309', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Activity Details
                    </Text>
                  </Group>
                  <Text size="11px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Auto-logs interaction activity
                  </Text>
                </Group>

                {/* Activity type | Status */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <Select
                    className="contact-form-field"
                    label="Activity type"
                    placeholder="Select Activity Type"
                    data={[
                      { value: 'Direct Visit', label: 'Direct Visit' },
                      { value: 'SMS', label: 'SMS' },
                      { value: 'Social Media', label: 'Social Media' },
                      { value: 'Referral', label: 'Referral' },
                      { value: 'Event / Exhibition', label: 'Event / Exhibition' },
                      { value: 'Other', label: 'Other' },
                    ]}
                    leftSection={<IconActivity size={18} stroke={1.6} />}
                    value={otherActivityType}
                    onChange={(val) => setOtherActivityType(val || 'Direct Visit')}
                    allowDeselect={false}
                    styles={inputStyles}
                  />

                  <Select
                    className="contact-form-field"
                    label="Status"
                    placeholder="Select Status"
                    data={[
                      { value: 'Interested', label: 'Interested' },
                      { value: 'Not Interested', label: 'Not Interested' },
                      { value: 'Follow up', label: 'Follow up' },
                    ]}
                    leftSection={<IconCheck size={18} stroke={1.6} />}
                    value={otherStatus}
                    onChange={(val) => setOtherStatus(val || 'Follow up')}
                    allowDeselect={false}
                    styles={inputStyles}
                  />
                </SimpleGrid>

                {/* Activity date | Activity time */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <MeetingDatePicker
                    label="Activity date"
                    placeholder="DD-MM-YYYY"
                    value={otherActivityDate}
                    onChange={(val) => setOtherActivityDate(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    leftSection={<IconCalendar size={18} stroke={1.6} />}
                  />

                  <MeetingTimePicker
                    label="Activity time"
                    placeholder="e.g. 10:00 AM"
                    value={otherActivityTime}
                    onChange={(val) => setOtherActivityTime(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    hideQuickSelect
                  />
                </SimpleGrid>

                {/* Dynamic Next Follow-up Date (shown when Follow up is selected) */}
                {otherStatus === 'Follow up' && (
                  <MeetingDatePicker
                    label="Next follow-up date"
                    placeholder="DD-MM-YYYY"
                    value={nextFollowDate}
                    onChange={(val) => setNextFollowDate(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    leftSection={<IconCalendar size={18} stroke={1.6} />}
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* Dynamic Meeting Fields (when Contact mode is Meeting) */}
          {formData.contactMode === 'Meeting' && (
            <Box
              p="md"
              style={{
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #BFDBFE',
              }}
            >
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Group gap={8}>
                    <IconCalendarEvent size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                    <Text size="xs" fw={700} style={{ color: isDark ? '#93C5FD' : '#1D4ED8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Meeting Details
                    </Text>
                  </Group>
                  <Text size="11px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Auto-logs scheduled meeting
                  </Text>
                </Group>

                {/* Meeting Title | Purpose / Agenda */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <TextInput
                    className="contact-form-field"
                    label="Meeting Title"
                    placeholder="e.g. Discovery & Product Demo"
                    leftSection={<IconCalendarEvent size={18} stroke={1.6} />}
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    required
                    styles={inputStyles}
                  />

                  <TextInput
                    className="contact-form-field"
                    label="Purpose / Agenda"
                    placeholder="e.g. Requirement discussion & demo"
                    leftSection={<IconActivity size={18} stroke={1.6} />}
                    value={meetingPurpose}
                    onChange={(e) => setMeetingPurpose(e.target.value)}
                    required
                    styles={inputStyles}
                  />
                </SimpleGrid>

                {/* Assigned Host | Meeting Date */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <Select
                    className="contact-form-field"
                    label="Assigned Host"
                    placeholder="Select Host / Employee"
                    data={(() => {
                      const list = (metadata?.employees || []).map((e: any) => ({
                        value: e.id || e.empCode || e.name,
                        label: e.name ? (e.designation ? `${e.name} (${e.designation})` : e.name) : 'Unknown',
                      }));
                      if (meetingHostName && !list.some((item: any) => item.label.startsWith(meetingHostName))) {
                        list.unshift({ value: meetingHostId || meetingHostName, label: meetingHostName });
                      }
                      return list;
                    })()}
                    leftSection={<IconUser size={18} stroke={1.6} />}
                    value={meetingHostId || meetingHostName || null}
                    onChange={(val) => {
                      const emp = metadata?.employees?.find((e: any) => (e.id || e.empCode || e.name) === val);
                      if (emp) {
                        setMeetingHostId(emp.id || emp.empCode || '');
                        setMeetingHostName(emp.name);
                      } else {
                        setMeetingHostId(val || '');
                        setMeetingHostName(val || '');
                      }
                    }}
                    searchable
                    clearable
                    styles={inputStyles}
                  />

                  <MeetingDatePicker
                    label="Meeting Date"
                    placeholder="DD-MM-YYYY"
                    value={meetingDate}
                    onChange={(val) => setMeetingDate(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    leftSection={<IconCalendar size={18} stroke={1.6} />}
                  />
                </SimpleGrid>

                {/* From time | To time */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <MeetingTimePicker
                    label="From time"
                    placeholder="e.g. 10:00 AM"
                    value={meetingFromTime}
                    onChange={handleMeetingFromTimeChange}
                    styles={inputStyles}
                    zIndex={3000}
                    hideQuickSelect
                  />

                  <MeetingTimePicker
                    label="To time"
                    placeholder="e.g. 10:30 AM"
                    value={meetingToTime}
                    onChange={handleMeetingToTimeChange}
                    styles={inputStyles}
                    zIndex={3000}
                    hideQuickSelect
                  />
                </SimpleGrid>

                {/* Duration | Meeting Type */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <TextInput
                    className="contact-form-field"
                    label="Duration"
                    placeholder="30 Minutes (Auto-calculated)"
                    leftSection={<IconClock size={18} stroke={1.6} />}
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(e.target.value)}
                    styles={inputStyles}
                  />

                  <Select
                    className="contact-form-field"
                    label="Meeting Type"
                    placeholder="Select Meeting Type"
                    data={[
                      { value: 'Virtual', label: 'Virtual' },
                      { value: 'In-person', label: 'In-person' },
                    ]}
                    leftSection={<IconWorld size={18} stroke={1.6} />}
                    value={meetingType}
                    onChange={(val) => setMeetingType(val || 'Virtual')}
                    allowDeselect={false}
                    styles={inputStyles}
                  />
                </SimpleGrid>

                {/* Meeting Link | Meeting Status */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <TextInput
                    className="contact-form-field"
                    label="Meeting Link"
                    placeholder="e.g. https://meet.google.com/xyz-abc-def"
                    leftSection={<IconLink size={18} stroke={1.6} />}
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    styles={inputStyles}
                  />

                  <Select
                    className="contact-form-field"
                    label="Meeting Status"
                    placeholder="Select Status"
                    data={[
                      { value: 'Scheduled', label: 'Scheduled' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Follow-up', label: 'Follow-up' },
                      { value: 'Rescheduled', label: 'Rescheduled' },
                      { value: 'Cancelled', label: 'Cancelled' },
                    ]}
                    leftSection={<IconCheck size={18} stroke={1.6} />}
                    value={meetingStatus}
                    onChange={(val) => setMeetingStatus(val || 'Scheduled')}
                    allowDeselect={false}
                    styles={inputStyles}
                  />
                </SimpleGrid>

                {/* Dynamic Next Follow-up Date (shown when Follow-up is selected) */}
                {meetingStatus === 'Follow-up' && (
                  <MeetingDatePicker
                    label="Next follow-up date"
                    placeholder="DD-MM-YYYY"
                    value={nextFollowDate}
                    onChange={(val) => setNextFollowDate(val)}
                    styles={inputStyles}
                    zIndex={3000}
                    leftSection={<IconCalendar size={18} stroke={1.6} />}
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* Row 5: Description */}
          <Textarea
            className="contact-form-field"
            label="Description"
            placeholder="Add context, requirements, or notes..."
            minRows={3}
            value={formData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            styles={textareaStyles}
          />

          {/* Footer Buttons */}
          <Group justify="flex-end" gap="sm" mt="md">
            <Button
              variant="default"
              radius="md"
              size="md"
              onClick={onClose}
              disabled={loading}
              style={{
                fontWeight: 600,
                paddingLeft: 20,
                paddingRight: 20,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB',
                color: isDark ? '#E2E8F0' : '#374151',
                background: isDark ? '#1F2937' : '#FFFFFF',
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              radius="md"
              size="md"
              loading={loading}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                paddingLeft: 24,
                paddingRight: 24,
                border: 'none',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              }}
            >
              Save record
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default ContactModal;
