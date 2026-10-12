import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  SimpleGrid,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  Button,
  Group,
  Text,
  ActionIcon,
  Box,
  Slider,
  Divider,
  Paper,
  Badge,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconFolders,
  IconX,
  IconBrandFigma,
  IconBrandGithub,
  IconWorld,
  IconUser,
  IconUsers,
  IconCalendar,
  IconCurrencyRupee,
  IconTarget,
  IconCheck,
} from '@tabler/icons-react';
import { Project, ProjectFormData } from '../../../types/project';
import { useProject } from '../../../context/ProjectContext';

interface ProjectModalProps {
  opened: boolean;
  onClose: () => void;
  project?: Project | null;
  initialData?: Partial<ProjectFormData> | null;
  onSuccess?: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  opened,
  onClose,
  project,
  initialData,
  onSuccess,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { projects, metadata, createProject, updateProject } = useProject();
  const isEditing = Boolean(project);

  const initialFormState: ProjectFormData = {
    projectId: '',
    name: '',
    description: '',
    contactId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectType: 'Fixed Price',
    category: 'Full-Stack Web Development',
    projectManagerId: '',
    projectManagerName: '',
    teamMembers: ['Santhosh C'],
    status: 'In Progress',
    priority: 'High',
    progress: 0,
    estimatedBudget: '',
    actualCost: '',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '',
    figmaUrl: '',
    githubUrl: '',
    liveUrl: '',
  };

  const [formData, setFormData] = useState<ProjectFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (project) {
      setFormData({
        id: project.id,
        projectId: project.projectId || '',
        name: project.name || '',
        description: project.description || '',
        contactId: project.contactId || '',
        clientName: project.clientName || '',
        clientEmail: project.clientEmail || '',
        clientPhone: project.clientPhone || '',
        projectType: project.projectType || 'Fixed Price',
        category: project.category || 'Full-Stack Web Development',
        projectManagerId: project.projectManagerId || '',
        projectManagerName: project.projectManagerName || '',
        teamMembers: project.teamMembers || [],
        status: project.status || 'In Progress',
        priority: project.priority || 'High',
        progress: project.progress || 0,
        estimatedBudget: project.estimatedBudget ? String(project.estimatedBudget) : '',
        actualCost: project.actualCost ? String(project.actualCost) : '',
        startDate: project.startDate || '',
        targetEndDate: project.targetEndDate || '',
        figmaUrl: project.figmaUrl || '',
        githubUrl: project.githubUrl || '',
        liveUrl: project.liveUrl || '',
      });
    } else if (initialData) {
      setFormData({
        ...initialFormState,
        ...initialData,
        projectId: initialData.projectId || `P00${projects.length + 1}`,
      });
    } else {
      setFormData({
        ...initialFormState,
        projectId: `P00${projects.length + 1}`,
      });
    }
    setErrors({});
  }, [project, initialData, opened, projects.length]);

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'Project Name is required';
    }
    if (!formData.clientName?.trim()) {
      newErrors.clientName = 'Client / Company Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    if (isEditing && project?.id) {
      const res = await updateProject(project.id, formData);
      setSubmitting(false);
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      }
    } else {
      const res = await createProject(formData);
      setSubmitting(false);
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      }
    }
  };

  // Pre-configured team member options matching mock-up
  const defaultTeamList = [
    'Santhosh C',
    'Priya S',
    'Rahul K',
    'Sneha R',
    'Arjun M',
    'Vikram S',
  ];

  const employeeOptions = [
    { value: '', label: '— Select or Enter Manager —' },
    ...defaultTeamList.map((name) => ({ value: name, label: `${name} (Engineering)` })),
    ...(metadata?.employees?.map((emp: any) => ({
      value: emp.id,
      label: `${emp.name} (${emp.empCode})`,
    })) || []),
  ];

  const teamMemberOptions = Array.from(
    new Set([
      ...defaultTeamList,
      ...(metadata?.employees?.map((e: any) => e.name) || []),
    ])
  ).map((name) => ({ value: name, label: name }));

  const contactOptions = [
    { value: '', label: '— Select from CRM Contacts (Optional) —' },
    ...(metadata?.contacts?.map((c: any) => ({
      value: c.id,
      label: `${c.companyName ? `${c.companyName} (${c.name})` : c.name} - ${c.contactId}`,
    })) || []),
  ];

  const statusOptions = [
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Planning', label: 'Planning' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Not Started', label: 'Not Started' },
    { value: 'Completed', label: 'Completed' },
  ];

  const priorityOptions = [
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Urgent', label: 'Urgent' },
    { value: 'Low', label: 'Low' },
  ];

  const categoryOptions = [
    { value: 'Full-Stack Web Development', label: 'Full-Stack Web Development' },
    { value: 'Mobile App Development (Flutter/React Native)', label: 'Mobile App Development' },
    { value: 'Enterprise CRM & API Integration', label: 'Enterprise CRM & API Integration' },
    { value: 'UI/UX & Modern Frontend Redesign', label: 'UI/UX & Modern Frontend Redesign' },
    { value: 'Cloud ERP & Database Architecture', label: 'Cloud ERP & Database Architecture' },
    { value: 'AI/ML Solutions & LLM Agents', label: 'AI/ML Solutions & LLM Agents' },
    { value: 'DevOps, CI/CD & Cloud Infrastructure', label: 'DevOps & Cloud Infrastructure' },
  ];

  const projectTypeOptions = [
    { value: 'Fixed Price', label: 'Fixed Price Contract' },
    { value: 'Time & Material', label: 'Time & Material' },
    { value: 'Dedicated Team', label: 'Dedicated Team Retainer' },
    { value: 'Hourly Milestone', label: 'Hourly Milestone' },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="760px"
      radius="16px"
      padding={0}
      centered
      styles={{
        header: { display: 'none' },
        content: {
          background: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        },
        body: { padding: 0 },
      }}
    >
      {/* 1. Modal Top Banner Header */}
      <Box
        px="xl"
        py="lg"
        style={{
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Group gap="md">
          <Box
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            <IconFolders size={22} stroke={2} />
          </Box>
          <div>
            <Group gap={8}>
              <Text fw={800} size="17px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                {isEditing ? `Edit Project (${project?.projectId})` : 'Create New Project'}
              </Text>
              <Badge size="sm" variant="filled" color="blue" style={{ fontFamily: 'monospace' }}>
                {formData.projectId || 'P001'}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mt={2}>
              Fill in client details, tech manager, assigned team members, timeline & budget
            </Text>
          </div>
        </Group>

        <ActionIcon variant="subtle" color="gray" size="md" radius="100px" onClick={onClose}>
          <IconX size={18} />
        </ActionIcon>
      </Box>

      {/* 2. Modal Body Form */}
      <form onSubmit={handleSubmit}>
        <Box p="xl" style={{ maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
          <Stack gap="lg">
            {/* SECTION 1: Project Identification & Client */}
            <Box>
              <Text size="11px" fw={700} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: '0.05em' }}>
                1. Project Identity & Client Info
              </Text>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
                {/* 1. Project Code */}
                <TextInput
                  label="Project Code"
                  placeholder="Enter project code"
                  value={formData.projectId}
                  onChange={(e) => handleFieldChange('projectId', e.target.value.toUpperCase())}
                  radius="md"
                  styles={{
                    input: { fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' },
                  }}
                />

                {/* 2. Project Name */}
                <Box style={{ gridColumn: 'span 2' }}>
                  <TextInput
                    label="Project Name *"
                    placeholder="Enter project name"
                    required
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    error={errors.name}
                    radius="md"
                  />
                </Box>
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {/* 3. Link Contact from CRM */}
                <Select
                  label="Link from CRM Contact (Optional)"
                  placeholder="Select qualified client"
                  data={contactOptions}
                  value={formData.contactId || ''}
                  onChange={(val) => {
                    handleFieldChange('contactId', val || '');
                    if (val) {
                      const selected = metadata?.contacts?.find((c: any) => c.id === val);
                      if (selected) {
                        setFormData((prev) => ({
                          ...prev,
                          contactId: val,
                          clientName: selected.companyName || selected.name,
                          clientEmail: selected.email || prev.clientEmail,
                          clientPhone: selected.phone || prev.clientPhone,
                        }));
                      }
                    }
                  }}
                  searchable
                  clearable
                  radius="md"
                />

                {/* 4. Client / Company Name */}
                <TextInput
                  label="Client / Company Name *"
                  placeholder="Enter client or company name"
                  required
                  value={formData.clientName}
                  onChange={(e) => handleFieldChange('clientName', e.target.value)}
                  error={errors.clientName}
                  radius="md"
                />
              </SimpleGrid>
            </Box>

            <Divider color={isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'} />

            {/* SECTION 2: Project Manager & Team Assignment */}
            <Box>
              <Text size="11px" fw={700} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: '0.05em' }}>
                2. Project Manager & Assigned Team
              </Text>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {/* 5. Project Manager */}
                <Select
                  label="Project Manager (Lead)"
                  placeholder="Select Project Tech Lead"
                  data={employeeOptions}
                  value={formData.projectManagerName || formData.projectManagerId || ''}
                  onChange={(val) => {
                    handleFieldChange('projectManagerName', val || '');
                    handleFieldChange('projectManagerId', val || '');
                  }}
                  searchable
                  clearable
                  radius="md"
                />

                {/* 6. Team Members Stack */}
                <MultiSelect
                  label="Team Members (Avatar Stack)"
                  placeholder="Select team members"
                  data={teamMemberOptions}
                  value={formData.teamMembers || []}
                  onChange={(val) => handleFieldChange('teamMembers', val)}
                  searchable
                  clearable
                  radius="md"
                />
              </SimpleGrid>
            </Box>

            <Divider color={isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'} />

            {/* SECTION 3: Timeline, Priority & Status */}
            <Box>
              <Text size="11px" fw={700} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: '0.05em' }}>
                3. Timeline, Priority & Status
              </Text>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
                {/* 7. Start Date */}
                <TextInput
                  label="Start Date (DD-MM-YYYY)"
                  placeholder="Select start date (DD-MM-YYYY)"
                  value={formData.startDate || ''}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                  radius="md"
                  leftSection={<IconCalendar size={15} color="#94A3B8" />}
                />

                {/* 8. Deadline */}
                <TextInput
                  label="Deadline (DD-MM-YYYY)"
                  placeholder="Select end date (DD-MM-YYYY)"
                  value={formData.targetEndDate || ''}
                  onChange={(e) => handleFieldChange('targetEndDate', e.target.value)}
                  radius="md"
                  leftSection={<IconCalendar size={15} color="#94A3B8" />}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
                {/* 9. Priority */}
                <Select
                  label="Priority Level"
                  data={priorityOptions}
                  value={formData.priority || 'High'}
                  onChange={(val) => handleFieldChange('priority', val || 'High')}
                  radius="md"
                />

                {/* 10. Status */}
                <Select
                  label="Project Status"
                  data={statusOptions}
                  value={formData.status || 'In Progress'}
                  onChange={(val) => handleFieldChange('status', val || 'In Progress')}
                  radius="md"
                />

                {/* 11. Engagement Model */}
                <Select
                  label="Contract Type"
                  data={projectTypeOptions}
                  value={formData.projectType || 'Fixed Price'}
                  onChange={(val) => handleFieldChange('projectType', val || 'Fixed Price')}
                  radius="md"
                />
              </SimpleGrid>

              {/* 12. Progress Slider & Indicator */}
              <Paper
                p="md"
                radius="md"
                style={{
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                }}
              >
                <Group justify="space-between" mb={8}>
                  <Text size="xs" fw={700} style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}>
                    Project Progress Percentage
                  </Text>
                  <Badge size="md" variant="filled" color="blue">
                    {formData.progress || 0}% Completed
                  </Badge>
                </Group>
                <Slider
                  value={formData.progress || 0}
                  onChange={(val) => handleFieldChange('progress', val)}
                  color="blue"
                  radius="md"
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 25, label: '25%' },
                    { value: 45, label: '45%' },
                    { value: 75, label: '75%' },
                    { value: 100, label: '100%' },
                  ]}
                />
              </Paper>
            </Box>

            <Divider color={isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'} />

            {/* SECTION 4: Financials & Category */}
            <Box>
              <Text size="11px" fw={700} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: '0.05em' }}>
                4. Financials & Tech Category
              </Text>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
                <Select
                  label="Domain Category"
                  data={categoryOptions}
                  value={formData.category || 'Full-Stack Web Development'}
                  onChange={(val) => handleFieldChange('category', val || 'Full-Stack Web Development')}
                  radius="md"
                />

                <TextInput
                  label="Estimated Budget (₹)"
                  placeholder="Enter estimated budget"
                  type="number"
                  value={formData.estimatedBudget || ''}
                  onChange={(e) => handleFieldChange('estimatedBudget', e.target.value)}
                  radius="md"
                  leftSection={<IconCurrencyRupee size={15} color="#10B981" />}
                />

                <TextInput
                  label="Actual Cost (₹)"
                  placeholder="Enter actual cost"
                  type="number"
                  value={formData.actualCost || ''}
                  onChange={(e) => handleFieldChange('actualCost', e.target.value)}
                  radius="md"
                  leftSection={<IconCurrencyRupee size={15} color="#F59E0B" />}
                />
              </SimpleGrid>
            </Box>

            <Divider color={isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'} />

            {/* SECTION 5: Deliverables & URLs */}
            <Box>
              <Text size="11px" fw={700} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: '0.05em' }}>
                5. Project Assets & Repository Links
              </Text>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mb="md">
                <TextInput
                  label="GitHub Repository"
                  placeholder="Enter GitHub repository URL"
                  leftSection={<IconBrandGithub size={15} />}
                  value={formData.githubUrl || ''}
                  onChange={(e) => handleFieldChange('githubUrl', e.target.value)}
                  radius="md"
                  size="xs"
                />

                <TextInput
                  label="Figma UI Design"
                  placeholder="Enter Figma design URL"
                  leftSection={<IconBrandFigma size={15} color="#EA580C" />}
                  value={formData.figmaUrl || ''}
                  onChange={(e) => handleFieldChange('figmaUrl', e.target.value)}
                  radius="md"
                  size="xs"
                />

                <TextInput
                  label="Live Deployment URL"
                  placeholder="Enter live deployment URL"
                  leftSection={<IconWorld size={15} color="#0284C7" />}
                  value={formData.liveUrl || ''}
                  onChange={(e) => handleFieldChange('liveUrl', e.target.value)}
                  radius="md"
                  size="xs"
                />
              </SimpleGrid>

              <Textarea
                label="Scope of Work & Requirements"
                placeholder="Enter project scope, technical specifications, and milestones..."
                rows={3}
                value={formData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                radius="md"
              />
            </Box>
          </Stack>
        </Box>

        {/* 3. Modal Footer Actions */}
        <Box
          px="xl"
          py="md"
          style={{
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <Button variant="default" size="xs" radius="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="xs"
            radius="md"
            loading={submitting}
            style={{
              backgroundColor: '#2563EB',
              fontWeight: 600,
              padding: '0 18px',
            }}
          >
            {isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </Box>
      </form>
    </Modal>
  );
};

export default ProjectModal;
