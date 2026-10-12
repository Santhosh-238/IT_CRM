import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Stack,
  Grid,
  SimpleGrid,
  TextInput,
  Select,
  Textarea,
  Button,
  Group,
  Text,
  ActionIcon,
  Badge,
  useComputedColorScheme,
  UnstyledButton,
  CopyButton,
  Tooltip,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
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
  IconShieldCheck,
  IconShieldX,
  IconUsers,
  IconReceiptTax,
  IconCreditCard,
  IconFileCertificate,
  IconMapPin,
  IconCoin,
  IconWorld,
  IconBrandLinkedin,
  IconExternalLink,
  IconCopy,
  IconIdBadge,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Contact } from '../../types/contact';
import { useContact } from '../../context/ContactContext';
import { useLead } from '../../context/LeadContext';
import { useCRM } from '../../context/CRMContext';
// Business Identification Validation Regex Patterns
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const CIN_REGEX = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/i;
const LINKEDIN_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)*linkedin\.com(\/.*)?$/i;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Puducherry', 'Chandigarh', 'Jammu and Kashmir', 'Ladakh'
];

const GST_STATE_MAP: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};



interface ContactQualificationPageProps {
  contact?: Contact | null;
  onBack: () => void;
  onSuccess?: (status?: string) => void;
}

export const ContactQualificationPage: React.FC<ContactQualificationPageProps> = ({
  contact: propContact,
  onBack,
  onSuccess,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { currentUser } = useCRM();
  const { contacts, updateContact, assignContact, metadata, loading } = useContact();
  const { fetchLeads, fetchStats } = useLead();

  // If no contact passed via props, check sessionStorage or default to the first contact
  const [activeContact, setActiveContact] = useState<Contact | null>(() => {
    if (propContact) return propContact;
    try {
      const saved = sessionStorage.getItem('crm_qualifying_contact');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return contacts.length > 0 ? contacts[0] : null;
  });

  useEffect(() => {
    if (propContact) {
      setActiveContact(propContact);
    } else {
      try {
        const saved = sessionStorage.getItem('crm_qualifying_contact');
        if (saved) setActiveContact(JSON.parse(saved));
      } catch (e) {}
    }
  }, [propContact]);

  const [status, setStatus] = useState<string>(activeContact?.status === 'Disqualified' ? 'Disqualified' : activeContact?.status || 'Qualified');
  const [qualifiedBy, setQualifiedBy] = useState<string>(activeContact?.qualifiedBy || activeContact?.assignedToName || currentUser?.name || 'Admin');
  const [qualificationDate, setQualificationDate] = useState<string>(activeContact?.qualificationDate || new Date().toISOString().split('T')[0]);
  const [nextFollowDate, setNextFollowDate] = useState<string>(activeContact?.nextFollowDate || '');
  const [followUpNotes, setFollowUpNotes] = useState<string>(activeContact?.remarks || activeContact?.notes || '');
  const [disqualificationReason, setDisqualificationReason] = useState<string>(activeContact?.disqualificationReason || '');

  // Assignment & Company Verification states
  const [assignedTo, setAssignedTo] = useState<string>(activeContact?.assignedTo || '');
  const [gstNumber, setGstNumber] = useState<string>(activeContact?.gstNumber || '');
  const [employeeCount, setEmployeeCount] = useState<string>(activeContact?.employeeCount || '');
  const [companyPan, setCompanyPan] = useState<string>(activeContact?.companyPan || '');
  const [cinNumber, setCinNumber] = useState<string>(activeContact?.cinNumber || '');
  const [companyWebsite, setCompanyWebsite] = useState<string>(activeContact?.companyWebsite || '');
  const [linkedinUrl, setLinkedinUrl] = useState<string>(activeContact?.linkedinUrl || '');
  const [annualTurnover, setAnnualTurnover] = useState<string>(activeContact?.annualTurnover || '');
  const [verificationStatus, setVerificationStatus] = useState<string>(activeContact?.verificationStatus || 'Unverified');
  const [registeredState, setRegisteredState] = useState<string>(activeContact?.registeredState || '');

  // Tags
  const [tags, setTags] = useState<string[]>(() => {
    const initialTags: string[] = [];
    if (activeContact?.productList && activeContact.productList.length > 0) {
      initialTags.push(...activeContact.productList);
    }
    if (activeContact?.serviceList && activeContact.serviceList.length > 0) {
      initialTags.push(...activeContact.serviceList);
    }
    return initialTags;
  });
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [showTagInput, setShowTagInput] = useState<boolean>(false);

  // Sync state whenever activeContact changes
  useEffect(() => {
    if (activeContact) {
      setStatus(activeContact.status === 'Disqualified' ? 'Disqualified' : activeContact.status || 'Qualified');
      setQualifiedBy(activeContact.qualifiedBy || activeContact.assignedToName || currentUser?.name || 'Admin');
      setQualificationDate(activeContact.qualificationDate || new Date().toISOString().split('T')[0]);
      setNextFollowDate(activeContact.nextFollowDate || '');
      setFollowUpNotes(activeContact.remarks || activeContact.notes || '');
      setDisqualificationReason(activeContact.disqualificationReason || '');

      setAssignedTo(activeContact.assignedTo || '');
      setGstNumber(activeContact.gstNumber || '');
      setEmployeeCount(activeContact.employeeCount || '');
      setCompanyPan(activeContact.companyPan || '');
      setCinNumber(activeContact.cinNumber || '');
      setCompanyWebsite(activeContact.companyWebsite || '');
      setLinkedinUrl(activeContact.linkedinUrl || '');
      setAnnualTurnover(activeContact.annualTurnover || '');
      setVerificationStatus(activeContact.verificationStatus || 'Unverified');
      setRegisteredState(activeContact.registeredState || '');

      const initialTags: string[] = [];
      if (activeContact.productList && activeContact.productList.length > 0) {
        initialTags.push(...activeContact.productList);
      }
      if (activeContact.serviceList && activeContact.serviceList.length > 0) {
        initialTags.push(...activeContact.serviceList);
      }
      setTags(initialTags);
    }
  }, [activeContact, currentUser]);

  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleGstChange = (val: string) => {
    const upper = val.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setGstNumber(upper);
    clearError('gstNumber');
    clearError('verificationStatus');

    // Smart auto-fill PAN and State from GST if 15 chars and valid
    if (upper.length === 15 && GST_REGEX.test(upper)) {
      const extractedPan = upper.slice(2, 12);
      if (!companyPan || companyPan !== extractedPan) {
        setCompanyPan(extractedPan);
        clearError('companyPan');
      }
      const stateCode = upper.slice(0, 2);
      if (GST_STATE_MAP[stateCode] && !registeredState) {
        setRegisteredState(GST_STATE_MAP[stateCode]);
        clearError('registeredState');
      }
    }
  };

  const handlePanChange = (val: string) => {
    const upper = val.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 10);
    setCompanyPan(upper);
    clearError('companyPan');
    clearError('verificationStatus');
  };

  const handleCinChange = (val: string) => {
    const upper = val.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 21);
    setCinNumber(upper);
    clearError('cinNumber');
  };

  const handleWebsiteChange = (val: string) => {
    setCompanyWebsite(val);
    clearError('companyWebsite');
  };

  const handleLinkedinChange = (val: string) => {
    setLinkedinUrl(val);
    clearError('linkedinUrl');
  };

  const handleVerificationStatusChange = (val: string | null) => {
    const nextStatus = val || 'Unverified';
    setVerificationStatus(nextStatus);
    if (nextStatus === 'Verified') {
      const cleanGst = (gstNumber || '').trim().toUpperCase();
      const cleanPan = (companyPan || '').trim().toUpperCase();
      if (!cleanGst && !cleanPan) {
        setErrors((prev) => ({
          ...prev,
          verificationStatus: 'GST or PAN is required to mark company as Verified',
        }));
      } else {
        clearError('verificationStatus');
      }
    } else {
      clearError('verificationStatus');
    }
  };

  const handleBlurField = (field: string) => {
    const newErr = { ...errors };

    if (field === 'gstNumber' && gstNumber) {
      if (!GST_REGEX.test(gstNumber)) {
        newErr.gstNumber = 'Invalid GST format (15 characters, e.g. 33AAAAA0000A1Z5)';
      } else {
        delete newErr.gstNumber;
      }
    }

    if (field === 'companyPan' && companyPan) {
      if (!PAN_REGEX.test(companyPan)) {
        newErr.companyPan = 'Invalid PAN format (5 letters, 4 digits, 1 letter, e.g. ABCDE1234F)';
      } else if (gstNumber && GST_REGEX.test(gstNumber) && companyPan !== gstNumber.slice(2, 12)) {
        newErr.companyPan = `PAN must match GST (${gstNumber.slice(2, 12)})`;
      } else {
        delete newErr.companyPan;
      }
    }

    if (field === 'cinNumber' && cinNumber) {
      if (!CIN_REGEX.test(cinNumber)) {
        newErr.cinNumber = 'Invalid CIN format (21 characters, e.g. U72900TN2020PTC123456)';
      } else {
        delete newErr.cinNumber;
      }
    }

    if (field === 'companyWebsite' && companyWebsite) {
      if (!URL_REGEX.test(companyWebsite)) {
        newErr.companyWebsite = 'Invalid website URL (e.g. https://company.com)';
      } else {
        delete newErr.companyWebsite;
      }
    }

    if (field === 'linkedinUrl' && linkedinUrl) {
      if (!LINKEDIN_REGEX.test(linkedinUrl)) {
        newErr.linkedinUrl = 'Invalid LinkedIn URL (e.g. https://linkedin.com/company/xyz)';
      } else {
        delete newErr.linkedinUrl;
      }
    }

    if (field === 'verificationStatus' && verificationStatus === 'Verified') {
      const cleanGst = (gstNumber || '').trim().toUpperCase();
      const cleanPan = (companyPan || '').trim().toUpperCase();
      if (!cleanGst && !cleanPan) {
        newErr.verificationStatus = 'GST or PAN is required to mark company as Verified';
      } else {
        delete newErr.verificationStatus;
      }
    }

    setErrors(newErr);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!qualificationDate) {
      errs.qualificationDate = 'Date is required';
    }

    if (status === 'Follow-up Required') {
      if (!nextFollowDate) {
        errs.nextFollowDate = 'Next Follow-up Date is required';
      }
      if (!followUpNotes?.trim()) {
        errs.followUpNotes = 'Follow-up Note / Agenda is required';
      }
    }

    if (status === 'Disqualified') {
      if (!disqualificationReason?.trim()) {
        errs.disqualificationReason = 'Disqualification Reason is required';
      }
    }

    // Company Verification Validation
    const cleanGst = (gstNumber || '').trim().toUpperCase();
    const cleanPan = (companyPan || '').trim().toUpperCase();
    const cleanCin = (cinNumber || '').trim().toUpperCase();
    const cleanWeb = (companyWebsite || '').trim();
    const cleanLinkedIn = (linkedinUrl || '').trim();

    // If marked Verified, at least GST or PAN must be provided and valid
    if (verificationStatus === 'Verified') {
      if (!cleanGst && !cleanPan) {
        errs.verificationStatus = 'GST or PAN is required to mark company as Verified';
        errs.gstNumber = 'Provide GST or PAN for verification';
      }
    }

    if (cleanGst && !GST_REGEX.test(cleanGst)) {
      errs.gstNumber = 'Invalid GST format (15 characters, e.g. 33AAAAA0000A1Z5)';
    }

    if (cleanPan) {
      if (!PAN_REGEX.test(cleanPan)) {
        errs.companyPan = 'Invalid PAN format (5 letters, 4 digits, 1 letter, e.g. ABCDE1234F)';
      } else if (cleanGst && GST_REGEX.test(cleanGst) && cleanPan !== cleanGst.slice(2, 12)) {
        errs.companyPan = `PAN must match GST (${cleanGst.slice(2, 12)})`;
      }
    }

    if (cleanCin && !CIN_REGEX.test(cleanCin)) {
      errs.cinNumber = 'Invalid CIN format (21 characters, e.g. U72900TN2020PTC123456)';
    }

    if (cleanWeb && !URL_REGEX.test(cleanWeb)) {
      errs.companyWebsite = 'Invalid website URL (e.g. https://company.com)';
    }

    if (cleanLinkedIn && !LINKEDIN_REGEX.test(cleanLinkedIn)) {
      errs.linkedinUrl = 'Invalid LinkedIn URL (e.g. https://linkedin.com/company/xyz)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact?.id) return;

    if (!validateForm()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please resolve the highlighted errors in Company Verification.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setSaving(true);

    const res = await updateContact(activeContact.id, {
      stage: status === 'Qualified' ? 'Qualification' : 'Initialization',
      status: status,
      qualificationStatus:
        status === 'Disqualified'
          ? 'Disqualified'
          : status === 'Follow-up Required'
          ? 'Follow-up Required'
          : status === 'In Progress'
          ? 'In Progress'
          : 'Qualified',
      qualifiedBy: qualifiedBy,
      qualificationDate: qualificationDate,
      nextFollowDate: status === 'Follow-up Required' ? nextFollowDate : undefined,
      remarks: status === 'Follow-up Required' ? followUpNotes : (status === 'Disqualified' ? disqualificationReason : undefined),
      notes: status === 'Follow-up Required' ? followUpNotes : undefined,
      disqualificationReason: status === 'Disqualified' ? disqualificationReason : undefined,
      productList: activeContact.category === 'Product' ? tags : activeContact.productList,
      serviceList: activeContact.category === 'Service' ? tags : activeContact.serviceList,
      assignedTo: assignedTo && assignedTo !== 'none' ? assignedTo : undefined,
      gstNumber: gstNumber || undefined,
      employeeCount: employeeCount || undefined,
      companyPan: companyPan || undefined,
      cinNumber: cinNumber || undefined,
      companyWebsite: companyWebsite || undefined,
      linkedinUrl: linkedinUrl || undefined,
      annualTurnover: annualTurnover || undefined,
      verificationStatus: verificationStatus || undefined,
      registeredState: registeredState || undefined,
    });

    setSaving(false);
    if (res.success) {
      if (status === 'Qualified') {
        await Promise.all([fetchLeads(), fetchStats()]);
      }
      if (onSuccess) onSuccess(status);
      else onBack();
    }
  };

  const getInitial = (name?: string) => {
    if (!name) return 'C';
    return name.trim().charAt(0).toUpperCase();
  };

  const getDateLabel = () => {
    switch (status) {
      case 'Qualified':
        return 'Qualification Date';
      case 'In Progress':
        return 'In Progress Date';
      case 'Follow-up Required':
        return 'Follow-up Date';
      case 'Disqualified':
        return 'Disqualification Date';
      default:
        return 'Status Date';
    }
  };

  const getSubmitButtonLabel = () => {
    switch (status) {
      case 'Qualified':
        return 'Complete Qualification';
      case 'In Progress':
        return 'Save In Progress';
      case 'Follow-up Required':
        return 'Schedule Follow-up';
      case 'Disqualified':
        return 'Disqualify Contact';
      default:
        return 'Save Status';
    }
  };

  const contactName = activeContact?.name || '—';
  const designation = activeContact?.designation || activeContact?.profession || '—';
  const email = activeContact?.email || '—';
  const phone = activeContact?.phone || '—';
  const contactType = activeContact?.contactType || '—';
  const companyName = activeContact?.companyName || activeContact?.profession || '—';
  const requirementType = activeContact?.category || '—';
  const product = activeContact?.productList && activeContact.productList.length > 0
    ? activeContact.productList.join(', ')
    : activeContact?.serviceList && activeContact.serviceList.length > 0
    ? activeContact.serviceList.join(', ')
    : '—';

  const employeeOptions = metadata?.employees?.map((emp) => ({
    value: emp.name,
    label: emp.name,
  })) || [
    { value: 'Admin', label: 'Admin' },
  ];

  const employeeAssignOptions = [
    { value: 'none', label: '— Unassigned —' },
    ...(metadata?.employees?.map((emp) => ({
      value: emp.id,
      label: `${emp.name} (${emp.empCode})`,
    })) || []),
  ];

  return (
    <Box p={{ base: 'xs', sm: 'sm', md: 'md' }} style={{ maxWidth: 1560, margin: '0 auto' }}>
      {/* 2-Column Split View matching Screenshot */}
      <Grid gutter="lg" style={{ alignItems: 'flex-start' }}>
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Contact Summary Panel (Span 4)                               */}
        {/* ========================================================================= */}
        <Grid.Col span={{ base: 12, md: 5, lg: 4 }}>
          <Paper
            p={{ base: 'md', sm: 'xl' }}
            radius="20px"
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECEF',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Header: Back Button + Contact Summary Title */}
            <Group gap="xs" mb={{ base: 'md', sm: 'xl' }} align="center">
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
                Contact Summary
              </Text>
            </Group>

            {/* Contact Large Avatar */}
            <Group justify="center" mb={{ base: 'md', sm: 'xl' }}>
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
                {getInitial(contactName)}
              </Box>
            </Group>

            {/* Summary Field Rows matching Screenshot */}
            <Stack gap="md">
              {/* Contact Person */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <IconUser size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Contact Person
                  </Text>
                </Group>
                <Text size="13px" fw={600} truncate style={{ color: isDark ? '#F8FAFC' : '#111827', textAlign: 'right' }}>
                  {contactName}
                </Text>
              </Group>

              {/* Designation */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <IconBriefcase size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Designation
                  </Text>
                </Group>
                <Text size="13px" fw={600} truncate style={{ color: isDark ? '#F8FAFC' : '#111827', textAlign: 'right' }}>
                  {designation}
                </Text>
              </Group>

              {/* Email */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <IconMail size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Email
                  </Text>
                </Group>
                <Text
                  size="13px"
                  fw={600}
                  truncate
                  component="a"
                  href={`mailto:${email}`}
                  style={{ color: '#2563EB', textDecoration: 'none', textAlign: 'right', maxWidth: '60%' }}
                >
                  {email}
                </Text>
              </Group>

              {/* Phone */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <IconPhone size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Phone
                  </Text>
                </Group>
                <Group gap={6} align="center" wrap="nowrap">
                  <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                    {phone}
                  </Text>
                  <Box
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: '#22C55E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      flexShrink: 0,
                    }}
                  >
                    <IconBrandWhatsapp size={12} stroke={2.5} />
                  </Box>
                </Group>
              </Group>

              {/* Contact Type */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <IconUserCheck size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Contact Type
                  </Text>
                </Group>
                <Text size="13px" fw={700} truncate style={{ color: isDark ? '#F8FAFC' : '#111827', textAlign: 'right' }}>
                  {contactType}
                </Text>
              </Group>

              {/* Company Name */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <IconBuilding size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Company Name
                  </Text>
                </Group>
                <Text size="13px" fw={700} truncate style={{ color: isDark ? '#F8FAFC' : '#111827', textAlign: 'right' }}>
                  {companyName}
                </Text>
              </Group>

              {/* Requirement Type */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <IconBox size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Requirement Type
                  </Text>
                </Group>
                <Group gap={6} align="center" wrap="nowrap">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#F97316',
                      flexShrink: 0,
                    }}
                  />
                  <Text size="13px" fw={600} style={{ color: '#F97316' }}>
                    {requirementType}
                  </Text>
                </Group>
              </Group>

              {/* Product */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <IconLayersSubtract size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Product
                  </Text>
                </Group>
                <Text size="13px" fw={700} truncate style={{ color: isDark ? '#F8FAFC' : '#111827', textAlign: 'right' }}>
                  {product}
                </Text>
              </Group>
            </Stack>

            {/* Tags Section matching screenshot */}
            <Box mt="xl" pt="md" style={{ borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9' }}>
              <Group justify="space-between" align="center" mb="xs">
                <Group gap={6}>
                  <IconTag size={15} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}>
                    Tags
                  </Text>
                </Group>
                <UnstyledButton
                  onClick={() => setShowTagInput(!showTagInput)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isDark ? '#94A3B8' : '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  <IconPlus size={13} />
                  <span>Add Tag</span>
                </UnstyledButton>
              </Group>

              {showTagInput && (
                <Group gap="xs" mb="sm">
                  <TextInput
                    size="xs"
                    placeholder="New tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button size="xs" variant="light" onClick={handleAddTag}>
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
        {/* RIGHT COLUMN: Qualification Form & Stepper (Span 8)                       */}
        {/* ========================================================================= */}
        <Grid.Col span={{ base: 12, md: 7, lg: 8 }}>
          <Paper
            p={{ base: 'md', sm: 'xl' }}
            radius="20px"
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECEF',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 4px 20px rgba(79, 70, 229, 0.04)',
            }}
          >
            {/* Top Bar: Title + Stepper Badge matching Screenshot */}
            <Group justify="space-between" align="center" mb={{ base: 'md', sm: 'xl' }} wrap="wrap" gap="sm">
              <Group gap="sm" align="center">
                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#A5B4FC' : '#4F46E5',
                  }}
                >
                  <IconClock size={18} stroke={2.2} />
                </Box>
                <Text fw={800} size="20px" style={{ color: isDark ? '#F8FAFC' : '#111827', letterSpacing: '-0.02em' }}>
                  Qualification
                </Text>
              </Group>

              {/* 2-Step Stepper Capsule */}
              <Group gap={6} align="center" wrap="nowrap">
                {/* Step 1: Initialization */}
                <Box
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 100,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5',
                    color: isDark ? '#34D399' : '#047857',
                    border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #BBF7D0',
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  <IconCheck size={12} stroke={2.5} />
                  <span>Initialization</span>
                </Box>

                <Text size="11px" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                  ➔
                </Text>

                {/* Step 2: Qualification (Active) */}
                <Box
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 12px',
                    borderRadius: 100,
                    background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                    color: '#FFFFFF',
                    fontSize: 11.5,
                    fontWeight: 700,
                    boxShadow: '0 2px 10px rgba(79, 70, 229, 0.35)',
                  }}
                >
                  <Box
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9.5,
                      fontWeight: 800,
                    }}
                  >
                    2
                  </Box>
                  <span>Qualification</span>
                </Box>
              </Group>
            </Group>

            {/* Form Fields matching Screenshot */}
            <form onSubmit={handleSubmit}>
              <Stack gap="lg">
                {/* Clean 2-Field Form: Status & Qualification Date */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <Select
                    label="Status"
                    required
                    placeholder="Select Status"
                    data={[
                      { value: 'Qualified', label: 'Qualified' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Follow-up Required', label: 'Follow-up Required' },
                      { value: 'Disqualified', label: 'Disqualified' },
                    ]}
                    value={status}
                    onChange={(val) => {
                      setStatus(val || 'Qualified');
                      clearError('status');
                    }}
                    radius="md"
                    size="md"
                    styles={{
                      input: {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    }}
                  />

                  {status === 'Follow-up Required' ? (
                    <TextInput
                      label="Next Follow-up Date"
                      required
                      placeholder="YYYY-MM-DD"
                      type="date"
                      value={nextFollowDate}
                      onChange={(e) => {
                        setNextFollowDate(e.target.value);
                        clearError('nextFollowDate');
                      }}
                      error={errors.nextFollowDate}
                      radius="md"
                      size="md"
                      styles={{
                        input: {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        },
                      }}
                    />
                  ) : (
                    <TextInput
                      label={getDateLabel()}
                      required
                      placeholder="YYYY-MM-DD"
                      type="date"
                      value={qualificationDate}
                      onChange={(e) => {
                        setQualificationDate(e.target.value);
                        clearError('qualificationDate');
                      }}
                      error={errors.qualificationDate}
                      radius="md"
                      size="md"
                      styles={{
                        input: {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        },
                      }}
                    />
                  )}
                </SimpleGrid>

                {/* Employee Assignment Row */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <Select
                    label="Assign to Employee"
                    placeholder="Select employee to assign"
                    data={employeeAssignOptions}
                    value={assignedTo || 'none'}
                    onChange={(val) => setAssignedTo(val === 'none' ? '' : val || '')}
                    radius="md"
                    size="md"
                    leftSection={<IconIdBadge size={16} />}
                    styles={{
                      input: {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    }}
                  />

                  <Select
                    label="Qualified / Reviewed By"
                    placeholder="Select who qualified"
                    data={employeeOptions}
                    value={qualifiedBy}
                    onChange={(val) => setQualifiedBy(val || 'Admin')}
                    radius="md"
                    size="md"
                    leftSection={<IconUserCheck size={16} />}
                    styles={{
                      input: {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    }}
                  />
                </SimpleGrid>

                {/* Company Verification Inputs */}
                <Paper
                  p={{ base: 'md', sm: 'lg' }}
                  radius="18px"
                  style={{
                    backgroundColor: isDark ? '#141E2E' : '#F8FAFC',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.09)' : '1px solid #E2E8F0',
                    boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 2px 12px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  {/* Card Header: Simple & Clean */}
                  <Group justify="space-between" align="center" mb="md">
                    <Group gap="sm" align="center">
                      <Box
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: isDark ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isDark ? '#A5B4FC' : '#4F46E5',
                        }}
                      >
                        <IconShieldCheck size={18} stroke={2} />
                      </Box>
                      <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                        Company Verification
                      </Text>
                    </Group>
                  </Group>

                  <Divider mb="md" color={isDark ? 'rgba(255, 255, 255, 0.06)' : '#EAECEF'} />

                  {/* Form Grid: 3 Clean Rows of 3 Fields */}
                  <Stack gap="md">
                    {/* Row 1: GST Number, Employee Count, Verification Status */}
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      <TextInput
                        label="GST Number"
                        placeholder="e.g. 33AAAAA0000A1Z5"
                        maxLength={15}
                        value={gstNumber}
                        onChange={(e) => handleGstChange(e.target.value)}
                        onBlur={() => handleBlurField('gstNumber')}
                        error={errors.gstNumber}
                        radius="md"
                        leftSection={<IconBuilding size={16} />}
                        rightSection={
                          gstNumber ? (
                            <CopyButton value={gstNumber} timeout={2000}>
                              {({ copied, copy }) => (
                                <Tooltip label={copied ? 'Copied' : 'Copy GST'}>
                                  <ActionIcon size="sm" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </CopyButton>
                          ) : null
                        }
                        styles={{
                          label: {
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isDark ? '#E2E8F0' : '#334155',
                            marginBottom: 6,
                            whiteSpace: 'nowrap',
                          },
                          input: {
                            height: 42,
                            fontSize: 13,
                            fontWeight: 500,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: errors.gstNumber ? '#FA5252' : isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            borderRadius: 10,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      />

                      <Select
                        label="Employee Count"
                        placeholder="Select employee range"
                        data={[
                          { value: '1-10 Employees', label: '1 - 10 Employees' },
                          { value: '11-50 Employees', label: '11 - 50 Employees' },
                          { value: '51-200 Employees', label: '51 - 200 Employees' },
                          { value: '201-500 Employees', label: '201 - 500 Employees' },
                          { value: '500+ Employees', label: '500+ Employees' },
                        ]}
                        value={employeeCount || null}
                        onChange={(val) => {
                          setEmployeeCount(val || '');
                          clearError('employeeCount');
                        }}
                        radius="md"
                        leftSection={<IconUsers size={16} />}
                        styles={{
                          label: {
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isDark ? '#E2E8F0' : '#334155',
                            marginBottom: 6,
                            whiteSpace: 'nowrap',
                          },
                          input: {
                            height: 42,
                            fontSize: 13,
                            fontWeight: 500,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            borderRadius: 10,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      />

                      <Select
                        label="Verification Status"
                        placeholder="Select status"
                        data={[
                          { value: 'Verified', label: 'Verified' },
                          { value: 'Pending', label: 'Pending' },
                          { value: 'Unverified', label: 'Unverified' },
                        ]}
                        value={verificationStatus}
                        onChange={handleVerificationStatusChange}
                        onBlur={() => handleBlurField('verificationStatus')}
                        error={errors.verificationStatus}
                        radius="md"
                        leftSection={<IconShieldCheck size={16} />}
                        styles={{
                          label: {
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isDark ? '#E2E8F0' : '#334155',
                            marginBottom: 6,
                            whiteSpace: 'nowrap',
                          },
                          input: {
                            height: 42,
                            fontSize: 13,
                            fontWeight: 500,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: errors.verificationStatus ? '#FA5252' : isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            borderRadius: 10,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      />
                    </SimpleGrid>

                    {/* Row 2: Company PAN, CIN Number, Registered State */}
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      <TextInput
                        label="Company PAN"
                        placeholder="e.g. ABCDE1234F"
                        maxLength={10}
                        value={companyPan}
                        onChange={(e) => handlePanChange(e.target.value)}
                        onBlur={() => handleBlurField('companyPan')}
                        error={errors.companyPan}
                        radius="md"
                        leftSection={<IconCreditCard size={16} />}
                        styles={{
                          label: {
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isDark ? '#E2E8F0' : '#334155',
                            marginBottom: 6,
                            whiteSpace: 'nowrap',
                          },
                          input: {
                            height: 42,
                            fontSize: 13,
                            fontWeight: 500,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: errors.companyPan ? '#FA5252' : isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            borderRadius: 10,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      />

                      <TextInput
                        label="CIN Number"
                        placeholder="e.g. U72900TN2020PTC123456"
                        maxLength={21}
                        value={cinNumber}
                        onChange={(e) => handleCinChange(e.target.value)}
                        onBlur={() => handleBlurField('cinNumber')}
                        error={errors.cinNumber}
                        radius="md"
                        leftSection={<IconFileCertificate size={16} />}
                        styles={{
                          label: {
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isDark ? '#E2E8F0' : '#334155',
                            marginBottom: 6,
                            whiteSpace: 'nowrap',
                          },
                          input: {
                            height: 42,
                            fontSize: 13,
                            fontWeight: 500,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: errors.cinNumber ? '#FA5252' : isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            borderRadius: 10,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      />

                      <Select
                        label="Registered State"
                        placeholder="Select or search state"
                        data={Array.from(new Set([...INDIAN_STATES, ...(registeredState ? [registeredState] : [])]))}
                        searchable
                        clearable
                        value={registeredState || null}
                        onChange={(val) => {
                          setRegisteredState(val || '');
                          clearError('registeredState');
                        }}
                        radius="md"
                        leftSection={<IconMapPin size={16} />}
                        styles={{
                          label: {
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isDark ? '#E2E8F0' : '#334155',
                            marginBottom: 6,
                            whiteSpace: 'nowrap',
                          },
                          input: {
                            height: 42,
                            fontSize: 13,
                            fontWeight: 500,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            borderRadius: 10,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      />
                    </SimpleGrid>

                    {/* Row 3: Annual Turnover, Website, LinkedIn */}
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      <Select
                        label="Annual Turnover"
                        placeholder="Select turnover"
                        data={[
                          { value: '< ₹50 Lakhs', label: '< ₹50 Lakhs' },
                          { value: '₹50 Lakhs - ₹2 Cr', label: '₹50 Lakhs - ₹2 Cr' },
                          { value: '₹2 Cr - ₹10 Cr', label: '₹2 Cr - ₹10 Cr' },
                          { value: '₹10 Cr - ₹50 Cr', label: '₹10 Cr - ₹50 Cr' },
                          { value: '₹50 Cr+', label: '₹50 Cr+' },
                        ]}
                        value={annualTurnover || null}
                        onChange={(val) => {
                          setAnnualTurnover(val || '');
                          clearError('annualTurnover');
                        }}
                        radius="md"
                        leftSection={<IconCoin size={16} />}
                        styles={{
                          label: {
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isDark ? '#E2E8F0' : '#334155',
                            marginBottom: 6,
                            whiteSpace: 'nowrap',
                          },
                          input: {
                            height: 42,
                            fontSize: 13,
                            fontWeight: 500,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            borderRadius: 10,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      />

                      <TextInput
                        label="Website"
                        placeholder="https://company.com"
                        value={companyWebsite}
                        onChange={(e) => handleWebsiteChange(e.target.value)}
                        onBlur={() => handleBlurField('companyWebsite')}
                        error={errors.companyWebsite}
                        radius="md"
                        leftSection={<IconWorld size={16} />}
                        styles={{
                          label: {
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isDark ? '#E2E8F0' : '#334155',
                            marginBottom: 6,
                            whiteSpace: 'nowrap',
                          },
                          input: {
                            height: 42,
                            fontSize: 13,
                            fontWeight: 500,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: errors.companyWebsite ? '#FA5252' : isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            borderRadius: 10,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      />

                      <TextInput
                        label="LinkedIn"
                        placeholder="https://linkedin.com/company/..."
                        value={linkedinUrl}
                        onChange={(e) => handleLinkedinChange(e.target.value)}
                        onBlur={() => handleBlurField('linkedinUrl')}
                        error={errors.linkedinUrl}
                        radius="md"
                        leftSection={<IconBrandLinkedin size={16} />}
                        styles={{
                          label: {
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isDark ? '#E2E8F0' : '#334155',
                            marginBottom: 6,
                            whiteSpace: 'nowrap',
                          },
                          input: {
                            height: 42,
                            fontSize: 13,
                            fontWeight: 500,
                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                            borderColor: errors.linkedinUrl ? '#FA5252' : isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            borderRadius: 10,
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      />
                    </SimpleGrid>
                  </Stack>
                </Paper>

                {/* If Follow-up Required, prompt Follow-up Note / Agenda */}
                {status === 'Follow-up Required' && (
                  <Textarea
                    label="Follow-up Note / Agenda (Enna follow pannanum)"
                    placeholder="Specify what to follow up on (e.g. Client requested callback on Friday to discuss product demo and pricing)..."
                    required
                    value={followUpNotes}
                    onChange={(e) => {
                      setFollowUpNotes(e.target.value);
                      clearError('followUpNotes');
                    }}
                    error={errors.followUpNotes}
                    radius="md"
                    size="md"
                    minRows={3}
                    styles={{
                      input: {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    }}
                  />
                )}

                {/* If Disqualified, prompt reason */}
                {status === 'Disqualified' && (
                  <Textarea
                    label="Disqualification Reason"
                    placeholder="Please specify why this contact is disqualified (e.g. Budget mismatch, Timeline mismatch, No active requirement)..."
                    required
                    value={disqualificationReason}
                    onChange={(e) => {
                      setDisqualificationReason(e.target.value);
                      clearError('disqualificationReason');
                    }}
                    error={errors.disqualificationReason}
                    radius="md"
                    size="md"
                    minRows={2}
                    styles={{
                      input: {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    }}
                  />
                )}

                {/* Footer Navigation Bar */}
                <Group justify="space-between" align="center" mt="xl" pt="md" wrap="wrap" gap="sm">
                  <Button
                    variant="default"
                    radius="md"
                    onClick={onBack}
                    leftSection={<IconArrowLeft size={14} />}
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Back to Initialization
                  </Button>

                  <Text size="xs" fw={600} style={{ color: isDark ? '#94A3B8' : '#94A3B8' }}>
                    Step 2 of 2
                  </Text>

                  <Button
                    type="submit"
                    radius="md"
                    loading={saving || loading}
                    rightSection={<IconCheck size={15} stroke={2.5} />}
                    style={{
                      background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: 13,
                      padding: '0 20px',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                    }}
                  >
                    {getSubmitButtonLabel()}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default ContactQualificationPage;
