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
import { CRM_COLORS } from '../../theme/colors';

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
      productList: activeContact.category === 'Product' ? tags : activeContact.productList,
      serviceList: activeContact.category === 'Service' ? tags : activeContact.serviceList,
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
