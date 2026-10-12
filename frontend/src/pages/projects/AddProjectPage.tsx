import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Stack,
  SimpleGrid,
  TextInput,
  Textarea,
  Select,
  Autocomplete,
  Button,
  Group,
  Text,
  ActionIcon,
  Slider,
  Badge,
  useComputedColorScheme,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);
import {
  IconArrowLeft,
  IconFolders,
  IconBrandFigma,
  IconBrandGithub,
  IconWorld,
  IconCalendar,
  IconCurrencyRupee,
  IconCheck,
  IconUsers,
  IconPlus,
  IconX,
  IconUserPlus,
  IconBriefcase,
  IconUser,
  IconBuilding,
  IconUserCheck,
  IconCalendarEvent,
  IconFlag,
  IconActivity,
  IconDeviceLaptop,
} from '@tabler/icons-react';
import { Project, ProjectFormData } from '../../types/project';
import { useProject } from '../../context/ProjectContext';
import { useCRM } from '../../context/CRMContext';
import { contactService } from '../../services/contactService';
import { Contact } from '../../types/contact';

interface AddProjectPageProps {
  onBack?: () => void;
  initialData?: Project | null;
}

export const AddProjectPage: React.FC<AddProjectPageProps> = ({ onBack, initialData }) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { setActiveNav } = useCRM();
  const { projects, createProject, updateProject } = useProject();

  const isEditing = Boolean(initialData);

  const initialFormState: ProjectFormData = {
    projectId: `P00${projects.length + 1}`,
    name: '',
    description: '',
    contactId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectType: 'Fixed Price',
    category: '',
    projectManagerId: '',
    projectManagerName: '',
    teamMembers: [],
    status: 'In Progress',
    priority: 'High',
    progress: 0,
    estimatedBudget: '',
    actualCost: '',
    startDate: '',
    targetEndDate: '',
    figmaUrl: '',
    githubUrl: '',
    liveUrl: '',
  };

  const [formData, setFormData] = useState<ProjectFormData>(initialFormState);
  const [clientPersonName, setClientPersonName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [newMemberInput, setNewMemberInput] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Contacts fetched from Contacts module / page
  const [contactsList, setContactsList] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadContacts = async () => {
      setLoadingContacts(true);
      try {
        const res = await contactService.getContacts({
          assignmentStatus: 'Assigned',
          qualificationStatus: 'Qualified',
          limit: 100,
        });
        if (isMounted && res.success && Array.isArray(res.data)) {
          // Strictly filter only Qualified contacts from the Assigned page (excluding In Progress, Disqualified, New)
          const qualifiedOnly = res.data.filter((c) => {
            const qStatus = (c.qualificationStatus || '').trim().toLowerCase();
            const sStatus = (c.status || '').trim().toLowerCase();
            const isAssigned = c.assignmentStatus === 'Assigned' || (c.assignedTo && c.assignedTo !== 'Unassigned');

            // Strictly exclude anything that is In Progress, Disqualified, or New
            if (
              sStatus === 'in progress' ||
              qStatus === 'in progress' ||
              sStatus === 'disqualified' ||
              qStatus === 'disqualified' ||
              sStatus === 'new'
            ) {
              return false;
            }

            const isQual = qStatus === 'qualified' || sStatus === 'qualified';
            return isQual && isAssigned;
          });
          setContactsList(qualifiedOnly);
        }
      } catch (err) {
        console.error('Failed to load assigned contacts for AddProjectPage:', err);
      } finally {
        if (isMounted) setLoadingContacts(false);
      }
    };
    loadContacts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Unique company names from Contacts page
  const companyOptions = useMemo(() => {
    const list: string[] = [];
    contactsList.forEach((c) => {
      if (c.companyName && c.companyName.trim() && !list.includes(c.companyName.trim())) {
        list.push(c.companyName.trim());
      }
    });
    return list;
  }, [contactsList]);

  // Client/Person names from Contacts page
  const clientOptions = useMemo(() => {
    const list: string[] = [];
    contactsList.forEach((c) => {
      if (c.name && c.name.trim() && !list.includes(c.name.trim())) {
        list.push(c.name.trim());
      }
    });
    return list;
  }, [contactsList]);

  // Current matched contact from Contacts page
  const currentLinkedContact = useMemo(() => {
    if (formData.contactId) {
      const byId = contactsList.find((c) => c.id === formData.contactId || c.contactId === formData.contactId);
      if (byId) return byId;
    }
    const comp = companyName.trim().toLowerCase();
    const person = clientPersonName.trim().toLowerCase();
    if (!comp && !person) return null;
    return (
      contactsList.find((c) => {
        const cComp = (c.companyName || '').trim().toLowerCase();
        const cName = (c.name || '').trim().toLowerCase();
        if (comp && person) {
          return (cComp === comp && cName === person) || (cComp.includes(comp) && cName.includes(person));
        }
        if (comp && cComp === comp) return true;
        if (person && cName === person) return true;
        return false;
      }) || null
    );
  }, [formData.contactId, companyName, clientPersonName, contactsList]);

  const handleCompanyChange = (val: string) => {
    setCompanyName(val);
    if (errors.company) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.company;
        return next;
      });
    }

    const matched = contactsList.find(
      (c) => c.companyName && c.companyName.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (matched) {
      if (matched.name && (!clientPersonName || clientPersonName.trim() === '')) {
        setClientPersonName(matched.name);
      }
      setFormData((prev) => ({
        ...prev,
        contactId: matched.id,
        clientEmail: matched.email || prev.clientEmail,
        clientPhone: matched.phone || prev.clientPhone,
      }));
    }
  };

  const handleClientPersonChange = (val: string) => {
    setClientPersonName(val);

    const matched = contactsList.find(
      (c) => c.name && c.name.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (matched) {
      if (matched.companyName && (!companyName || companyName.trim() === '')) {
        setCompanyName(matched.companyName);
        if (errors.company) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.company;
            return next;
          });
        }
      }
      setFormData((prev) => ({
        ...prev,
        contactId: matched.id,
        clientEmail: matched.email || prev.clientEmail,
        clientPhone: matched.phone || prev.clientPhone,
      }));
    }
  };

  const handleSelectContactPreset = (contact: Contact) => {
    if (contact.companyName) {
      setCompanyName(contact.companyName);
    }
    setClientPersonName(contact.name);
    setFormData((prev) => ({
      ...prev,
      contactId: contact.id,
      clientEmail: contact.email || '',
      clientPhone: contact.phone || '',
    }));
    if (errors.company) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.company;
        return next;
      });
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        projectId: initialData.projectId || `P00${projects.length + 1}`,
        name: initialData.name || '',
        description: initialData.description || '',
        contactId: initialData.contactId || '',
        clientName: initialData.clientName || '',
        clientEmail: initialData.clientEmail || '',
        clientPhone: initialData.clientPhone || '',
        projectType: initialData.projectType || 'Fixed Price',
        category: initialData.category || '',
        projectManagerId: initialData.projectManagerId || initialData.projectManagerName || '',
        projectManagerName: initialData.projectManagerName || initialData.projectManagerId || '',
        teamMembers: Array.isArray(initialData.teamMembers) ? initialData.teamMembers : [],
        status: initialData.status || 'In Progress',
        priority: initialData.priority || 'High',
        progress: initialData.progress || 0,
        estimatedBudget: initialData.estimatedBudget ? String(initialData.estimatedBudget) : '',
        actualCost: initialData.actualCost ? String(initialData.actualCost) : '',
        startDate: initialData.startDate || '',
        targetEndDate: initialData.targetEndDate || '',
        figmaUrl: initialData.figmaUrl || '',
        githubUrl: initialData.githubUrl || '',
        liveUrl: initialData.liveUrl || '',
      });

      if (initialData.clientName) {
        const match = initialData.clientName.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
          setCompanyName(match[1].trim());
          setClientPersonName(match[2].trim());
        } else {
          setCompanyName(initialData.clientName);
          setClientPersonName('');
        }
      } else {
        setCompanyName('');
        setClientPersonName('');
      }

      setNewMemberInput('');
    } else {
      const prefillStatus = typeof window !== 'undefined' ? sessionStorage.getItem('crm_new_project_status') : null;
      if (prefillStatus) {
        sessionStorage.removeItem('crm_new_project_status');
      }

      setFormData({
        ...initialFormState,
        projectId: `P00${projects.length + 1}`,
        status: prefillStatus || 'Planning',
      });
      setCompanyName('');
      setClientPersonName('');
      setNewMemberInput('');
    }
  }, [initialData, projects.length]);

  const handleFieldChange = (field: keyof ProjectFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddTeamMember = () => {
    const trimmed = newMemberInput.trim();
    if (!trimmed) return;
    const names = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    const current = Array.isArray(formData.teamMembers) ? formData.teamMembers : [];
    const updated = Array.from(new Set([...current, ...names]));
    handleFieldChange('teamMembers', updated);
    setNewMemberInput('');
  };

  const handleRemoveTeamMember = (indexToRemove: number) => {
    const current = Array.isArray(formData.teamMembers) ? formData.teamMembers : [];
    const updated = current.filter((_, idx) => idx !== indexToRemove);
    handleFieldChange('teamMembers', updated);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'Project Name is required';
    }
    if (!companyName.trim() && !clientPersonName.trim()) {
      newErrors.company = 'Company or Client Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('crm_editing_project');
    }
    if (onBack) {
      onBack();
    } else {
      setActiveNav('projects');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let finalTeam = Array.isArray(formData.teamMembers) ? [...formData.teamMembers] : [];
    if (newMemberInput.trim()) {
      const extraNames = newMemberInput.split(',').map((s) => s.trim()).filter(Boolean);
      finalTeam = Array.from(new Set([...finalTeam, ...extraNames]));
    }

    const combinedClient = companyName.trim() && clientPersonName.trim()
      ? `${companyName.trim()} (${clientPersonName.trim()})`
      : (companyName.trim() || clientPersonName.trim());

    const tlName = (formData.projectManagerName || formData.projectManagerId || '').trim();

    const matchedContact = currentLinkedContact || contactsList.find((c) => {
      const cComp = (c.companyName || '').trim().toLowerCase();
      const cName = (c.name || '').trim().toLowerCase();
      const comp = companyName.trim().toLowerCase();
      const person = clientPersonName.trim().toLowerCase();
      if (comp && cComp === comp) return true;
      if (person && cName === person) return true;
      return false;
    });

    const submissionData: ProjectFormData = {
      ...formData,
      contactId: formData.contactId || (matchedContact ? matchedContact.id : undefined),
      clientEmail: formData.clientEmail || (matchedContact ? matchedContact.email : undefined),
      clientPhone: formData.clientPhone || (matchedContact ? matchedContact.phone : undefined),
      projectManagerName: tlName,
      projectManagerId: tlName,
      clientName: combinedClient,
      teamMembers: finalTeam,
    };

    setSubmitting(true);
    if (isEditing && initialData?.id) {
      const res = await updateProject(initialData.id, submissionData);
      setSubmitting(false);
      if (res.success) {
        handleGoBack();
      }
    } else {
      const res = await createProject(submissionData);
      setSubmitting(false);
      if (res.success) {
        handleGoBack();
      }
    }
  };

  const statusOptions = [
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Planning', label: 'Planning' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Not Started', label: 'Not Started' },
    { value: 'Completed', label: 'Completed' },
  ];

  const projectTypeOptions = [
    { value: 'Full-Stack Web App', label: 'Full-Stack Web App' },
    { value: 'Mobile App (iOS / Android)', label: 'Mobile App (iOS / Android)' },
    { value: 'Enterprise CRM / ERP', label: 'Enterprise CRM / ERP' },
    { value: 'E-Commerce Platform', label: 'E-Commerce Platform' },
    { value: 'Cloud Infrastructure & DevOps', label: 'Cloud Infrastructure & DevOps' },
    { value: 'AI / ML Solution', label: 'AI / ML Solution' },
    { value: 'UI/UX Design & Prototype', label: 'UI/UX Design & Prototype' },
    { value: 'Fixed Price', label: 'Fixed Price Contract' },
    { value: 'Time & Material', label: 'Time & Material' },
    { value: 'Dedicated Team', label: 'Dedicated Development Team' },
  ];

  const priorityOptions = [
    { value: 'High', label: 'High Priority' },
    { value: 'Medium', label: 'Medium Priority' },
    { value: 'Urgent', label: 'Urgent Priority' },
    { value: 'Low', label: 'Low Priority' },
  ];

  const inputStyles = {
    label: {
      fontWeight: 600,
      fontSize: '12.5px',
      marginBottom: '5px',
      color: isDark ? '#E2E8F0' : '#334155',
      letterSpacing: '-0.01em',
    },
    input: {
      height: '36px',
      borderRadius: '7px',
      fontSize: '13px',
      fontWeight: 500,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      border: isDark ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #CBD5E1',
      color: isDark ? '#F8FAFC' : '#0F172A',
      boxShadow: isDark ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    section: {
      color: isDark ? '#94A3B8' : '#64748B',
    },
    error: {
      fontSize: '11.5px',
      marginTop: '3px',
      fontWeight: 500,
    },
  };

  const selectStyles = {
    ...inputStyles,
    input: {
      ...inputStyles.input,
      cursor: 'pointer',
    },
  };

  const textareaStyles = {
    ...inputStyles,
    input: {
      ...inputStyles.input,
      height: 'auto',
      minHeight: '85px',
      padding: '8px 12px',
    },
  };

  const parseDateStringToDate = (dateStr?: string | null): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    const parsed = dayjs(dateStr.trim(), ['DD-MM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'], true);
    if (parsed.isValid()) {
      return parsed.toDate();
    }
    const fallback = dayjs(dateStr);
    return fallback.isValid() ? fallback.toDate() : null;
  };

  const cardStyle = {
    backgroundColor: isDark ? '#111827' : '#FFFFFF',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
    borderRadius: '14px',
    boxShadow: isDark
      ? '0 4px 16px -2px rgba(0, 0, 0, 0.4)'
      : '0 2px 12px -2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
  };

  return (
    <Box>
      {/* 1. Header Bar */}
      <Box mb="md">
        <Group align="center" gap="md">
          <ActionIcon
            variant="default"
            size="lg"
            radius="md"
            onClick={handleGoBack}
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            }}
          >
            <IconArrowLeft size={18} />
          </ActionIcon>

          <Text fw={800} size="20px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.02em' }}>
            {isEditing ? `Edit Project: ${formData.name || 'Project'}` : 'Create New Project'}
          </Text>
        </Group>
      </Box>

      {/* 2. Main Full-Screen Form Cards */}
      <form onSubmit={handleSubmit} autoComplete="off" className="project-form-input">
        <Stack gap="md">
          {/* CARD 1: Project Identity & Client */}
          <Paper p="lg" style={cardStyle}>
            <Group gap="sm" mb="md">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <IconFolders size={17} stroke={1.8} />
              </Box>
              <div>
                <Text fw={700} size="14.5px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
                  1. Project Identity & Client Information
                </Text>
                <Text size="xs" c="dimmed">
                  Project title, designated client, and company affiliation
                </Text>
              </div>
            </Group>

            {/* Quick Contact Presets from Contact Page */}
            {contactsList.length > 0 && (
              <Box mb="sm" p="xs" style={{ borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0' }}>
                <Group justify="space-between" align="center" wrap="wrap" gap={8}>
                  <Group gap={6} align="center">
                    <IconUserCheck size={14} color="#10B981" />
                    <Text size="11.5px" fw={700} style={{ color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Qualified Clients:
                    </Text>
                  </Group>
                  <Group gap={6} align="center" wrap="wrap">
                    {contactsList.map((c) => {
                      const isSel = (c.companyName && companyName === c.companyName) || (clientPersonName === c.name);
                      const displayTitle = c.companyName ? `${c.companyName} (${c.name})` : c.name;
                      return (
                        <Badge
                          key={c.id}
                          variant={isSel ? 'filled' : 'light'}
                          color={isSel ? 'blue' : 'teal'}
                          size="sm"
                          radius="sm"
                          style={{
                            cursor: 'pointer',
                            textTransform: 'none',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => handleSelectContactPreset(c)}
                        >
                          {displayTitle}
                        </Badge>
                      );
                    })}
                  </Group>
                </Group>
              </Box>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              <TextInput
                label="Project Name"
                placeholder="e.g. Venus ERP"
                required
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                error={errors.name}
                leftSection={<IconBriefcase size={16} stroke={1.8} color="#2563EB" />}
                styles={inputStyles}
                autoComplete="off"
              />

              <Select
                label="Project Type"
                placeholder="Select Project Type"
                data={projectTypeOptions}
                value={formData.projectType || 'Full-Stack Web App'}
                onChange={(val) => handleFieldChange('projectType', val || 'Full-Stack Web App')}
                leftSection={<IconDeviceLaptop size={16} stroke={1.8} color="#2563EB" />}
                styles={selectStyles}
              />

              <Autocomplete
                label="Company"
                placeholder="e.g. SK Home Products"
                required
                value={companyName}
                data={companyOptions}
                onChange={handleCompanyChange}
                error={errors.company}
                leftSection={<IconBuilding size={16} stroke={1.8} color="#64748B" />}
                styles={inputStyles}
              />

              <Autocomplete
                label="Client Name"
                placeholder="e.g. Sudhan"
                value={clientPersonName}
                data={clientOptions}
                onChange={handleClientPersonChange}
                leftSection={<IconUser size={16} stroke={1.8} color="#64748B" />}
                styles={inputStyles}
              />
            </SimpleGrid>

            {/* Linked Contact Live Feedback */}
            {currentLinkedContact && (
              <Box mt="xs" px="xs" py={5} style={{ borderRadius: 6, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4', border: isDark ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #BBF7D0' }}>
                <Group justify="space-between" align="center">
                  <Group gap={6} align="center">
                    <IconCheck size={13} color="#10B981" />
                    <Text size="11.5px" fw={600} style={{ color: isDark ? '#6EE7B7' : '#047857' }}>
                      Linked Contact: <b>{currentLinkedContact.name}</b> {currentLinkedContact.companyName ? `(${currentLinkedContact.companyName})` : ''}
                    </Text>
                  </Group>
                  <Group gap="md">
                    {currentLinkedContact.email && (
                      <Text size="11px" c="dimmed">
                        ✉️ {currentLinkedContact.email}
                      </Text>
                    )}
                    {currentLinkedContact.phone && (
                      <Text size="11px" c="dimmed">
                        📞 {currentLinkedContact.phone}
                      </Text>
                    )}
                  </Group>
                </Group>
              </Box>
            )}
          </Paper>

          {/* CARD 2: Project TL & Team Member */}
          <Paper p="lg" style={cardStyle}>
            <Group gap="sm" mb="md">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                }}
              >
                <IconUsers size={17} stroke={1.8} />
              </Box>
              <div>
                <Text fw={700} size="14.5px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
                  2. Project Leadership & Team
                </Text>
                <Text size="xs" c="dimmed">
                  Project Tech Lead and assigned development team members
                </Text>
              </div>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" style={{ maxWidth: 760 }}>
              <TextInput
                label="Project TL"
                placeholder="e.g. Santhosh C (Team Lead)"
                value={formData.projectManagerName || ''}
                onChange={(e) => {
                  handleFieldChange('projectManagerName', e.target.value);
                  handleFieldChange('projectManagerId', e.target.value);
                }}
                leftSection={<IconUserCheck size={16} stroke={1.8} color="#10B981" />}
                styles={inputStyles}
                autoComplete="off"
              />

              <Box>
                <TextInput
                  label={`Team Member${formData.teamMembers?.length ? ` (${formData.teamMembers.length})` : ''}`}
                  placeholder="Type name & press Enter or Add"
                  value={newMemberInput}
                  onChange={(e) => setNewMemberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTeamMember();
                    }
                  }}
                  leftSection={<IconUsers size={16} stroke={1.8} color="#64748B" />}
                  rightSectionWidth={68}
                  rightSection={
                    <Button
                      size="compact-xs"
                      variant="filled"
                      color="blue"
                      radius="sm"
                      onClick={handleAddTeamMember}
                      disabled={!newMemberInput.trim()}
                      leftSection={<IconPlus size={11} stroke={2.5} />}
                      style={{
                        height: 26,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        marginRight: 5,
                        boxShadow: newMemberInput.trim() ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                      }}
                    >
                      Add
                    </Button>
                  }
                  styles={inputStyles}
                  autoComplete="off"
                />

                {formData.teamMembers && formData.teamMembers.length > 0 && (
                  <Group gap={6} mt={8} wrap="wrap">
                    {formData.teamMembers.map((member, idx) => (
                      <Badge
                        key={`${member}-${idx}`}
                        size="sm"
                        variant="light"
                        color="blue"
                        radius="sm"
                        leftSection={<IconUser size={11} stroke={2} />}
                        rightSection={
                          <ActionIcon
                            size={12}
                            color="blue"
                            variant="subtle"
                            onClick={() => handleRemoveTeamMember(idx)}
                            style={{ cursor: 'pointer', marginLeft: 2 }}
                          >
                            <IconX size={10} stroke={2.5} />
                          </ActionIcon>
                        }
                        style={{
                          textTransform: 'none',
                          fontWeight: 600,
                          paddingLeft: 6,
                          paddingRight: 4,
                          height: 24,
                          fontSize: '12px',
                        }}
                      >
                        {member}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Box>
            </SimpleGrid>
          </Paper>

          {/* CARD 3: Timeline, Priority & Pipeline Status */}
          <Paper p="lg" style={cardStyle}>
            <Group gap="sm" mb="md">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F59E0B',
                }}
              >
                <IconCalendar size={17} stroke={1.8} />
              </Box>
              <div>
                <Text fw={700} size="14.5px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
                  3. Timeline, Priority Level & Project Status
                </Text>
                <Text size="xs" c="dimmed">
                  Milestone timelines, execution priority, and operational state
                </Text>
              </div>
            </Group>

            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
              <DatePickerInput
                label="Start Date"
                placeholder="DD-MM-YYYY"
                value={parseDateStringToDate(formData.startDate)}
                onChange={(val) => {
                  handleFieldChange('startDate', val ? dayjs(val).format('DD-MM-YYYY') : '');
                }}
                valueFormat="DD-MM-YYYY"
                clearable
                leftSection={<IconCalendar size={16} stroke={1.8} color="#F59E0B" />}
                styles={inputStyles}
                popoverProps={{ withinPortal: true, shadow: 'md' }}
              />

              <DatePickerInput
                label="End Date"
                placeholder="DD-MM-YYYY"
                value={parseDateStringToDate(formData.targetEndDate)}
                onChange={(val) => {
                  handleFieldChange('targetEndDate', val ? dayjs(val).format('DD-MM-YYYY') : '');
                }}
                valueFormat="DD-MM-YYYY"
                clearable
                minDate={parseDateStringToDate(formData.startDate) || undefined}
                leftSection={<IconCalendarEvent size={16} stroke={1.8} color="#F59E0B" />}
                styles={inputStyles}
                popoverProps={{ withinPortal: true, shadow: 'md' }}
              />

              <Select
                label="Priority Level"
                data={priorityOptions}
                value={formData.priority || 'High'}
                onChange={(val) => handleFieldChange('priority', val || 'High')}
                leftSection={<IconFlag size={16} stroke={1.8} color="#EF4444" />}
                styles={selectStyles}
              />

              <Select
                label="Project Status"
                data={statusOptions}
                value={formData.status || 'In Progress'}
                onChange={(val) => handleFieldChange('status', val || 'In Progress')}
                leftSection={<IconActivity size={16} stroke={1.8} color="#06B6D4" />}
                styles={selectStyles}
              />
            </SimpleGrid>
          </Paper>

          {/* CARD 4: Deliverables, Repository Links & Scope of Work */}
          <Paper p="lg" style={cardStyle}>
            <Group gap="sm" mb="md">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8B5CF6',
                }}
              >
                <IconBrandGithub size={17} stroke={1.8} />
              </Box>
              <div>
                <Text fw={700} size="14.5px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
                  4. Deliverables, Repository Links & Scope of Work
                </Text>
                <Text size="xs" c="dimmed">
                  Source control, Figma prototypes, deployment staging, and sprint deliverables
                </Text>
              </div>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="sm">
              <TextInput
                label="Repository Links (GitHub)"
                placeholder="https://github.com/company/repo"
                leftSection={<IconBrandGithub size={16} stroke={1.8} color={isDark ? '#F8FAFC' : '#0F172A'} />}
                value={formData.githubUrl || ''}
                onChange={(e) => handleFieldChange('githubUrl', e.target.value)}
                styles={inputStyles}
                autoComplete="off"
              />

              <TextInput
                label="Deliverables (Figma UI)"
                placeholder="https://figma.com/file/..."
                leftSection={<IconBrandFigma size={16} stroke={1.8} color="#EA580C" />}
                value={formData.figmaUrl || ''}
                onChange={(e) => handleFieldChange('figmaUrl', e.target.value)}
                styles={inputStyles}
                autoComplete="off"
              />

              <TextInput
                label="Deliverables (Live URL)"
                placeholder="https://app.clientdomain.com"
                leftSection={<IconWorld size={16} stroke={1.8} color="#0284C7" />}
                value={formData.liveUrl || ''}
                onChange={(e) => handleFieldChange('liveUrl', e.target.value)}
                styles={inputStyles}
                autoComplete="off"
              />
            </SimpleGrid>

            <Textarea
              label="Scope of Work & Milestone Notes"
              placeholder="Describe key deliverables, milestone goals, technology stack specifications, sprint roadmap, and client expectations..."
              rows={3}
              value={formData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              styles={textareaStyles}
              autoComplete="off"
            />
          </Paper>

          {/* Sticky Bottom Actions Bar */}
          <Paper
            p="md"
            style={{
              ...cardStyle,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <Button variant="default" radius="md" size="sm" onClick={handleGoBack}>
              Cancel
            </Button>
            <Button
              type="submit"
              radius="md"
              size="sm"
              loading={submitting}
              leftSection={<IconCheck size={15} />}
              style={{
                backgroundColor: '#2563EB',
                fontWeight: 600,
                padding: '0 20px',
              }}
            >
              {isEditing ? 'Save Changes' : 'Create Project'}
            </Button>
          </Paper>
        </Stack>
      </form>
    </Box>
  );
};

export default AddProjectPage;
