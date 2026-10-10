import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Stack,
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
} from '@tabler/icons-react';
import { Contact } from '../../types/contact';
import { useContact } from '../../context/ContactContext';
import { useCRM } from '../../context/CRMContext';

interface ContactQualificationPageProps {
  contact?: Contact | null;
  onBack: () => void;
  onSuccess?: () => void;
}

export const ContactQualificationPage: React.FC<ContactQualificationPageProps> = ({
  contact: propContact,
  onBack,
  onSuccess,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { currentUser } = useCRM();
  const { contacts, updateContact, metadata, loading } = useContact();

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

    setSaving(true);

    const res = await updateContact(activeContact.id, {
      stage: status === 'Qualified' ? 'Qualification' : 'Initialization',
      status: status,
      qualificationStatus: status === 'Disqualified' ? 'Disqualified' : status === 'Follow-up Required' ? 'Follow-up Required' : 'Qualified',
      qualifiedBy: qualifiedBy,
      qualificationDate: qualificationDate,
      nextFollowDate: status === 'Follow-up Required' ? nextFollowDate : undefined,
      remarks: status === 'Follow-up Required' ? followUpNotes : (status === 'Disqualified' ? disqualificationReason : undefined),
      notes: status === 'Follow-up Required' ? followUpNotes : undefined,
      disqualificationReason: status === 'Disqualified' ? disqualificationReason : undefined,
    });

    setSaving(false);
    if (res.success) {
      if (onSuccess) onSuccess();
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

  return (
    <Box p={{ base: 'sm', md: 'md' }} style={{ maxWidth: 1560, margin: '0 auto' }}>
      {/* 2-Column Split View matching Screenshot */}
      <SimpleGrid cols={{ base: 1, lg: 12 }} spacing="lg" style={{ alignItems: 'flex-start' }}>
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Contact Summary Panel (Span 4)                               */}
        {/* ========================================================================= */}
        <Box style={{ gridColumn: 'span 4' }}>
          <Paper
            p="xl"
            radius="20px"
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECEF',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Header: Back Button + Contact Summary Title */}
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
                Contact Summary
              </Text>
            </Group>

            {/* Contact Large Avatar */}
            <Group justify="center" mb="xl">
              <Box
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#14532D' : '#1E3A2B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(30, 58, 43, 0.25)',
                }}
              >
                {getInitial(contactName)}
              </Box>
            </Group>

            {/* Summary Field Rows matching Screenshot */}
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
                  {contactName}
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
                  href={`mailto:${email}`}
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
                    }}
                  >
                    <IconBrandWhatsapp size={12} stroke={2.5} />
                  </Box>
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
                <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
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
                <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
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
                      backgroundColor: '#F97316',
                    }}
                  />
                  <Text size="13px" fw={600} style={{ color: '#F97316' }}>
                    {requirementType}
                  </Text>
                </Group>
              </Group>

              {/* Product */}
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <IconLayersSubtract size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text size="13px" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Product
                  </Text>
                </Group>
                <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
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
                              ? 'rgba(34, 197, 94, 0.15)'
                              : '#DCFCE7'
                            : isDark
                            ? 'rgba(217, 70, 239, 0.15)'
                            : '#F5D0FE',
                        color:
                          idx === 0
                            ? isDark
                              ? '#86EFAC'
                              : '#15803D'
                            : isDark
                            ? '#F0ABFC'
                            : '#86198F',
                        border: 'none',
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
        </Box>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Qualification Form & Stepper (Span 8)                       */}
        {/* ========================================================================= */}
        <Box style={{ gridColumn: 'span 8' }}>
          <Paper
            p="xl"
            radius="20px"
            style={{
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECEF',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Top Bar: Title + Stepper Badge matching Screenshot */}
            <Group justify="space-between" align="center" mb="xl">
              <Group gap="sm" align="center">
                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: isDark ? '#14532D' : '#E8F5E9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#86EFAC' : '#2E7D32',
                  }}
                >
                  <IconClock size={18} stroke={2.2} />
                </Box>
                <Text fw={800} size="20px" style={{ color: isDark ? '#F8FAFC' : '#111827', letterSpacing: '-0.02em' }}>
                  Qualification
                </Text>
              </Group>

              {/* 2-Step Stepper Capsule */}
              <Group gap={6} align="center">
                {/* Step 1: Initialization */}
                <Box
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    borderRadius: 100,
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
                    color: isDark ? '#86EFAC' : '#166534',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <IconCheck size={13} stroke={2.5} />
                  <span>Initialization</span>
                </Box>

                <Text size="12px" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                  ➔
                </Text>

                {/* Step 2: Qualification (Active) */}
                <Box
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 14px',
                    borderRadius: 100,
                    backgroundColor: isDark ? '#14532D' : '#1E3A2B',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(30, 58, 43, 0.25)',
                  }}
                >
                  <Box
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
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
                    onChange={(val) => setStatus(val || 'Qualified')}
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
                      onChange={(e) => setNextFollowDate(e.target.value)}
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
                      onChange={(e) => setQualificationDate(e.target.value)}
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

                {/* If Follow-up Required, prompt Follow-up Note / Agenda */}
                {status === 'Follow-up Required' && (
                  <Textarea
                    label="Follow-up Note / Agenda (Enna follow pannanum)"
                    placeholder="Specify what to follow up on (e.g. Client requested callback on Friday to discuss product demo and pricing)..."
                    required
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
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
                    onChange={(e) => setDisqualificationReason(e.target.value)}
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

                {/* Footer Navigation Bar matching Screenshot */}
                <Group justify="space-between" align="center" mt="xl" pt="md">
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
                      backgroundColor: isDark ? '#14532D' : '#1E3A2B',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: 13,
                      padding: '0 22px',
                      boxShadow: '0 2px 10px rgba(30, 58, 43, 0.3)',
                    }}
                  >
                    {getSubmitButtonLabel()}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default ContactQualificationPage;
