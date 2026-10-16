import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Breadcrumbs,
  Anchor,
  useComputedColorScheme,
  Divider,
  Grid,
  ThemeIcon,
  Progress,
  Table,
  Modal,
  TextInput,
  Textarea,
  Select,
  Slider,
  ActionIcon,
  Tooltip,
  Card,
  Loader,
  RingProgress,
  Avatar,
  Menu,
  Pagination,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates'; 
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconUser,
  IconUsers,
  IconBriefcase,
  IconBrandFigma,
  IconBrandGithub,
  IconWorld,
  IconFileText,
  IconFolders,
  IconBuilding,
  IconPlus,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconDeviceLaptop,
  IconListCheck,
  IconFlag,
  IconTrendingUp,
  IconSparkles,
  IconRefresh,
  IconX,
  IconChevronDown,
  IconCircleCheckFilled,
  IconActivity,
  IconMail,
  IconPhone, 
  IconExternalLink,
  IconCrown,
  IconShieldCheck,
  IconUserCheck,
  IconReceipt2,
  IconTag,
  IconCoin,
  IconCurrencyRupee,
} from '@tabler/icons-react';
import { Project, ProjectModuleItem } from '../../types/project';
import { projectService } from '../../services/projectService';
import { contactService } from '../../services/contactService';

interface ProjectDetailsPageProps {
  project: Project;
  onBack: () => void;
  onEdit: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({
  project: initialProject,
  onBack,
  onEdit,
  onDelete,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  // State for current project with real-time refresh
  const [currentProject, setCurrentProject] = useState<Project>(initialProject);
  const [modules, setModules] = useState<ProjectModuleItem[]>(
    Array.isArray(initialProject.modules) ? initialProject.modules : []
  );
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [savingModules, setSavingModules] = useState<boolean>(false);
  const [modulesPage, setModulesPage] = useState<number>(1);
  const MODULES_PER_PAGE = 5;

  // Modules Pagination Calculations
  const totalModules = modules.length;
  const totalModulesPages = Math.max(1, Math.ceil(totalModules / MODULES_PER_PAGE));
  const currentModulesPage = Math.min(modulesPage, totalModulesPages);
  const startModuleIdx = (currentModulesPage - 1) * MODULES_PER_PAGE;
  const endModuleIdx = Math.min(startModuleIdx + MODULES_PER_PAGE, totalModules);
  const paginatedModules = modules.slice(startModuleIdx, endModuleIdx);
  const startRecord = totalModules === 0 ? 0 : startModuleIdx + 1;
  const endRecord = endModuleIdx;

  // Modal State for Add / Edit Module
  const [moduleModalOpened, setModuleModalOpened] = useState<boolean>(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleFormData, setModuleFormData] = useState<{
    name: string;
    description: string;
    assignedTo: string;
    deadline: string; // DD-MM-YYYY
    progress: number;
    status: 'Not Started' | 'In Progress' | 'In Review' | 'Completed';
  }>({
    name: '',
    description: '',
    assignedTo: '',
    deadline: '',
    progress: 0,
    status: 'Not Started',
  });
  const [modalError, setModalError] = useState<string>('');

  // Project Type State
  const [projectType, setProjectType] = useState<string>(
    currentProject.projectType || 'Full-Stack Web App'
  );
  const [isUpdatingType, setIsUpdatingType] = useState<boolean>(false);

  // Fetch freshest data from DB on mount or when project ID changes
  const refreshProjectData = async (targetId?: string) => {
    const idToFetch = targetId || initialProject?.id || currentProject?.id;
    if (!idToFetch) return;
    setRefreshing(true);
    try {
      const res = await projectService.getProjectById(idToFetch);
      if (res.success && res.data) {
        let pData = res.data;

        // Direct sync from contactDetails if available
        if (pData.contactDetails) {
          pData.clientEmail = pData.clientEmail || pData.contactDetails.email || '';
          pData.clientPhone = pData.clientPhone || pData.contactDetails.phone || '';
          pData.contactId = pData.contactId || pData.contactDetails.id || '';
        }

        // Fallback: If clientEmail or clientPhone missing, check contactService
        if (!pData.clientEmail || !pData.clientPhone) {
          try {
            const contactsRes = await contactService.getContacts({ limit: 100 });
            if (contactsRes.success && Array.isArray(contactsRes.data)) {
              const clientMatch = (pData.clientName || '').match(/^(.*?)\s*\((.*?)\)$/);
              const comp = (clientMatch ? clientMatch[1] : pData.clientName || '').trim().toLowerCase();
              const person = (clientMatch ? clientMatch[2] : '').trim().toLowerCase();

              const matched = contactsRes.data.find((c) => {
                if (pData.contactId && (c.id === pData.contactId || c.contactId === pData.contactId)) return true;
                const cComp = (c.companyName || '').toLowerCase();
                const cName = (c.name || '').toLowerCase();
                if (comp && (cComp.includes(comp) || comp.includes(cComp) || cName.includes(comp))) return true;
                if (person && (cName.includes(person) || person.includes(cName) || cComp.includes(person))) return true;
                return false;
              });

              if (matched) {
                pData = {
                  ...pData,
                  clientEmail: pData.clientEmail || matched.email || '',
                  clientPhone: pData.clientPhone || matched.phone || '',
                  contactId: pData.contactId || matched.id || '',
                };
              }
            }
          } catch (e) {}
        }

        setCurrentProject(pData);
        if (Array.isArray(pData.modules)) {
          setModules(pData.modules);
        }
        if (pData.projectType) {
          setProjectType(pData.projectType);
        }
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('crm_viewing_project', JSON.stringify(pData));
        }
      }
    } catch (err) {
      console.error('Failed to refresh project data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setCurrentProject(initialProject);
    if (Array.isArray(initialProject.modules)) {
      setModules(initialProject.modules);
    }
    if (initialProject.projectType) {
      setProjectType(initialProject.projectType);
    }
    if (initialProject.id) {
      refreshProjectData(initialProject.id);
    }
  }, [initialProject.id]);

  // Project Type Options
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

  // Normalized, Deduplicated Team Members
  const normalizedTeamMembers = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    (currentProject.teamMembers || []).forEach((m) => {
      const trimmed = (m || '').trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        result.push(capitalized);
      }
    });
    return result;
  }, [currentProject.teamMembers]);

  // Team options for assigning module
  const assignedOptions = useMemo(() => {
    const list: string[] = [];
    if (currentProject.projectManagerName && currentProject.projectManagerName !== 'Unassigned') {
      list.push(`${currentProject.projectManagerName} (TL)`);
    }
    normalizedTeamMembers.forEach((m) => {
      if (!list.includes(m)) list.push(m);
    });
    if (list.length === 0) list.push('Unassigned');
    return list.map((item) => ({ value: item, label: item }));
  }, [currentProject.projectManagerName, normalizedTeamMembers]);

  // Handle Project Type Change
  const handleProjectTypeChange = async (newType: string) => {
    if (!newType || newType === projectType) return;
    setProjectType(newType);
    setIsUpdatingType(true);
    try {
      const res = await projectService.updateProject(currentProject.id, { projectType: newType });
      if (res.success && res.data) {
        setCurrentProject((prev) => ({ ...prev, projectType: newType }));
        notifications.show({
          title: 'Project Classification Updated',
          message: `Project Type set to ${newType}`,
          color: 'teal',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Update Failed',
        message: err.message || 'Could not update project classification',
        color: 'red',
      });
    } finally {
      setIsUpdatingType(false);
    }
  };

  // Helper date parsing
  const parseDateString = (str?: string | null): Date | null => {
    if (!str) return null;
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const parsed = dayjs(str, 'DD-MM-YYYY');
      return parsed.isValid() ? parsed.toDate() : null;
    }
    const d = dayjs(str);
    return d.isValid() ? d.toDate() : null;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    const d = dayjs(dateStr);
    return d.isValid() ? d.format('DD-MM-YYYY') : dateStr;
  };

  // Calculate if module is overdue
  const isModuleOverdue = (deadlineStr?: string, progress?: number) => {
    if (!deadlineStr || (progress !== undefined && progress >= 100)) return false;
    const d = dayjs(deadlineStr, 'DD-MM-YYYY');
    if (!d.isValid()) return false;
    return d.isBefore(dayjs().startOf('day'));
  };

  // Dynamic End-to-End Metrics
  const metrics = useMemo(() => {
    const total = modules.length;
    if (total === 0) {
      return {
        overallProgress: currentProject.progress || 0,
        totalModules: 0,
        completedCount: 0,
        inProgressCount: 0,
        overdueCount: 0,
      };
    }
    const totalProg = modules.reduce((acc, m) => acc + (m.progress || 0), 0);
    const overallProgress = Math.round(totalProg / total);
    const completedCount = modules.filter((m) => m.progress >= 100 || m.status === 'Completed').length;
    const inProgressCount = modules.filter(
      (m) => (m.progress > 0 && m.progress < 100) || m.status === 'In Progress' || m.status === 'In Review'
    ).length;
    const overdueCount = modules.filter((m) => isModuleOverdue(m.deadline, m.progress)).length;

    return {
      overallProgress,
      totalModules: total,
      completedCount,
      inProgressCount,
      overdueCount,
    };
  }, [modules, currentProject.progress]);

  // Open Modal to Add
  const handleOpenAddModule = () => {
    setEditingModuleId(null);
    setModuleFormData({
      name: '',
      description: '',
      assignedTo: assignedOptions[0]?.value || '',
      deadline: '',
      progress: 0,
      status: 'Not Started',
    });
    setModalError('');
    setModuleModalOpened(true);
  };

  // Open Modal to Edit
  const handleOpenEditModule = (mod: ProjectModuleItem) => {
    setEditingModuleId(mod.id);
    setModuleFormData({
      name: mod.name,
      description: mod.description || '',
      assignedTo: mod.assignedTo || '',
      deadline: mod.deadline || '',
      progress: mod.progress || 0,
      status: mod.status || 'In Progress',
    });
    setModalError('');
    setModuleModalOpened(true);
  };

  // Persist updated modules list to backend
  const saveModulesList = async (newList: ProjectModuleItem[]) => {
    setSavingModules(true);
    try {
      const res = await projectService.updateProjectModules(currentProject.id, newList);
      if (res.success && res.data) {
        setModules(newList);
        setCurrentProject(res.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('crm_viewing_project', JSON.stringify(res.data));
        }
        notifications.show({
          title: 'Modules Updated',
          message: 'Project modules and delivery progress updated successfully.',
          color: 'teal',
        });
        return true;
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error Saving Modules',
        message: err.message || 'Could not save module changes.',
        color: 'red',
      });
    } finally {
      setSavingModules(false);
    }
    return false;
  };

  // Save Modal Form
  const handleSaveModule = async () => {
    if (!moduleFormData.name.trim()) {
      setModalError('Module name is required.');
      return;
    }

    let updatedList: ProjectModuleItem[] = [];
    if (editingModuleId) {
      updatedList = modules.map((m) => {
        if (m.id === editingModuleId) {
          return {
            ...m,
            ...moduleFormData,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      });
    } else {
      const newModule: ProjectModuleItem = {
        id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...moduleFormData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedList = [...modules, newModule];
    }

    const success = await saveModulesList(updatedList);
    if (success) {
      setModuleModalOpened(false);
    }
  };

  // Delete Module
  const handleDeleteModule = async (moduleId: string) => {
    const updatedList = modules.filter((m) => m.id !== moduleId);
    await saveModulesList(updatedList);
  };

  // Quick Progress Updater (One-Click)
  const handleQuickProgressUpdate = async (mod: ProjectModuleItem, newProgress: number) => {
    let newStatus: ProjectModuleItem['status'] = mod.status;
    if (newProgress >= 100) newStatus = 'Completed';
    else if (newProgress > 0) newStatus = 'In Progress';
    else newStatus = 'Not Started';

    const updatedList = modules.map((m) =>
      m.id === mod.id
        ? { ...m, progress: newProgress, status: newStatus, updatedAt: new Date().toISOString() }
        : m
    );
    await saveModulesList(updatedList);
  };

  // One-click Template: Load 5 Standard Milestones
  const handleLoadStandardTemplate = async () => {
    const defaultDev = assignedOptions[0]?.value || 'Unassigned';
    const startDate = parseDateString(currentProject.startDate) || new Date();
    const targetDate = parseDateString(currentProject.targetEndDate) || dayjs().add(60, 'day').toDate();

    const spanDays = Math.max(10, dayjs(targetDate).diff(dayjs(startDate), 'day'));
    const step = Math.floor(spanDays / 5);

    const templates: ProjectModuleItem[] = [
      {
        id: `mod-${Date.now()}-1`,
        name: 'reworking ui design for dark theme',
        description: 'Interactive Figma design system, dark mode color tokens, responsive components & layout polish.',
        assignedTo: 'Rahul V',
        deadline: dayjs(startDate).add(step * 1, 'day').format('DD-MM-YYYY'),
        progress: 100,
        status: 'Completed',
      },
      {
        id: `mod-${Date.now()}-2`,
        name: 'adding (Rule-Based Loan Eligibility and Bank Recommendation) Module in the backend',
        description: 'Rule evaluation engine, credit threshold scoring algorithms, dynamic bank partner recommendation matrix.',
        assignedTo: 'Rahul V',
        deadline: dayjs(startDate).add(step * 2, 'day').format('DD-MM-YYYY'),
        progress: 65,
        status: 'In Progress',
      },
      {
        id: `mod-${Date.now()}-3`,
        name: 'working n backend for eligiblity creiterias',
        description: 'Eligibility criteria schema models, RESTful APIs, validation pipelines and debt-to-income limits.',
        assignedTo: 'Rahul V',
        deadline: dayjs(startDate).add(step * 3, 'day').format('DD-MM-YYYY'),
        progress: 40,
        status: 'In Progress',
      },
      {
        id: `mod-${Date.now()}-4`,
        name: 'API endpoint for bank partner interest rates and offers',
        description: 'RESTful endpoints to query and filter bank loan offers based on customer eligibility.',
        assignedTo: defaultDev,
        deadline: dayjs(startDate).add(step * 4, 'day').format('DD-MM-YYYY'),
        progress: 0,
        status: 'Not Started',
      },
      {
        id: `mod-${Date.now()}-5`,
        name: 'Deployment, CI/CD Pipeline & Final Handover',
        description: 'Automated test suites, production server release, DNS configuration & user training.',
        assignedTo: defaultDev,
        deadline: dayjs(targetDate).format('DD-MM-YYYY'),
        progress: 10,
        status: 'In Progress',
      },
    ];

    await saveModulesList(templates);
  };

  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0';
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const valueColor = isDark ? '#F8FAFC' : '#0F172A';

  const clientMatch = (currentProject.clientName || '').match(/^(.*?)\s*\((.*?)\)$/);
  const company = clientMatch ? clientMatch[1].trim() : (currentProject.clientName || '—');
  const clientPerson = clientMatch ? clientMatch[2].trim() : '—';

  // Get project initials for avatar badge
  const projectInitials = useMemo(() => {
    const parts = (currentProject.name || 'PR').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (currentProject.name || 'PR').slice(0, 2).toUpperCase();
  }, [currentProject.name]);

  return (
    <Box pt={0} pb="xl" px={{ base: 0, sm: 'xs' }} style={{ width: '100%', maxWidth: '100%' }}>
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <Group justify="space-between" align="center" mb="sm">
        <Group gap="sm" align="center">
          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            leftSection={<IconArrowLeft size={15} />}
            onClick={onBack}
            style={{ fontWeight: 600 }}
          >
            Back
          </Button>
          <Divider orientation="vertical" style={{ height: 16 }} />
          <Breadcrumbs separator="→">
            <Anchor size="xs" c="dimmed" onClick={onBack} style={{ cursor: 'pointer', fontWeight: 600 }}>
              Projects Management
            </Anchor>
            <Anchor size="xs" c="dimmed" onClick={onBack} style={{ cursor: 'pointer', fontWeight: 600 }}>
              All Projects
            </Anchor>
            <Text size="xs" fw={700} style={{ color: isDark ? '#60A5FA' : '#2563EB' }}>
              {currentProject.projectId}
            </Text>
          </Breadcrumbs>
        </Group>

        <Group gap="xs">

          <Button
            variant="light"
            color="blue"
            radius="md"
            size="sm"
            leftSection={<IconEdit size={16} />}
            onClick={() => onEdit(currentProject)}
            style={{ fontWeight: 600 }}
          >
            Edit Project
          </Button>
          {onDelete && (
            <Button
              variant="light"
              color="red"
              radius="md"
              size="sm"
              leftSection={<IconTrash size={16} />}
              onClick={() => onDelete(currentProject)}
              style={{ fontWeight: 600 }}
            >
              Delete
            </Button>
          )}
        </Group>
      </Group>

      {/* 2. EXECUTIVE SHOWCASE HERO CARD */}
      <Paper
        radius="lg"
        mb="xl"
        style={{
          background: isDark
            ? 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)'
            : '#FFFFFF',
          border: cardBorder,
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.4)'
            : '0 4px 20px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box p={{ base: 'md', sm: 'lg' }}>
          <Grid align="center" gutter="lg">
            {/* Left: Project Branding & Meta */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="md" align="center" wrap="nowrap">
                {/* Stylized Branding Icon Badge */}
                <Box
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 20,
                    letterSpacing: '-0.02em',
                    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.28)',
                    flexShrink: 0,
                  }}
                >
                  {projectInitials}
                </Box>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Status Badges Row */}
                  <Group gap={6} mb={4} wrap="wrap" align="center">
                    <Box
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF',
                        border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #DBEAFE',
                        color: isDark ? '#93C5FD' : '#2563EB',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      {currentProject.projectId}
                    </Box>

                    <Box
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '2px 9px',
                        borderRadius: 16,
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                        border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #BBF7D0',
                        color: isDark ? '#34D399' : '#15803D',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <Box
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                        }}
                      />
                      {currentProject.status}
                    </Box>

                    <Box
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 9px',
                        borderRadius: 16,
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                        border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA',
                        color: isDark ? '#F87171' : '#B91C1C',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      ⚡ {currentProject.priority} Priority
                    </Box>
                  </Group>

                  {/* Project Title */}
                  <Text
                    fw={800}
                    size="24px"
                    style={{
                      color: valueColor,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.2,
                      marginBottom: 6,
                    }}
                  >
                    {currentProject.name}
                  </Text>

                  {/* INTERACTIVE PROJECT TYPE PILL MENU */}
                  <Group gap={8} align="center" wrap="wrap">
                    <Text size="xs" fw={700} style={{ color: labelColor }}>
                      Classification:
                    </Text>

                    <Menu shadow="xl" width={280} radius="md" position="bottom-start">
                      <Menu.Target>
                        <Button
                          variant="light"
                          color="blue"
                          size="xs"
                          radius="xl"
                          leftSection={<IconDeviceLaptop size={14} color="#2563EB" />}
                          rightSection={<IconChevronDown size={13} color="#2563EB" />}
                          loading={isUpdatingType}
                          style={{
                            fontWeight: 700,
                            fontSize: '12px',
                            backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                            border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE',
                            color: isDark ? '#93C5FD' : '#1D4ED8',
                            height: 28,
                          }}
                        >
                          {projectType}
                        </Button>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Label>Select Project Type</Menu.Label>
                        {projectTypeOptions.map((opt) => (
                          <Menu.Item
                            key={opt.value}
                            onClick={() => handleProjectTypeChange(opt.value)}
                            rightSection={
                              opt.value === projectType ? <IconCheck size={14} color="#10B981" /> : null
                            }
                            style={{
                              fontWeight: opt.value === projectType ? 700 : 500,
                              fontSize: '12.5px',
                            }}
                          >
                            {opt.label}
                          </Menu.Item>
                        ))}
                      </Menu.Dropdown>
                    </Menu>

                    {currentProject.category ? (
                      <Badge
                        size="md"
                        variant="light"
                        color="violet"
                        radius="xl"
                        leftSection={<IconTag size={13} />}
                        style={{
                          fontWeight: 700,
                          fontSize: '12px',
                          textTransform: 'capitalize',
                          height: 28,
                        }}
                      >
                        {currentProject.category}
                      </Badge>
                    ) : null}

                    {normalizedTeamMembers.length > 0 && (
                      <Group gap={5} align="center" ml={4}>
                        <Text size="xs" c="dimmed">•</Text>
                        <ThemeIcon size={20} radius="xl" variant="light" color="blue">
                          <IconUsers size={12} />
                        </ThemeIcon>
                        <Text size="xs" fw={600} style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                          {normalizedTeamMembers.length} {normalizedTeamMembers.length === 1 ? 'Engineer' : 'Engineers'}
                        </Text>
                      </Group>
                    )}
                  </Group>
                </div>
              </Group>
            </Grid.Col>

            {/* Right: 4 Metadata KPI Cards */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                {/* 1. Client Card */}
                <Paper
                  p="xs"
                  radius="md"
                  style={{
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#F8FAFC',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: 64,
                  }}
                >
                  <Group gap={6} align="center" mb={6}>
                    <ThemeIcon size={22} radius="sm" variant="light" color="cyan">
                      <IconBuilding size={12} />
                    </ThemeIcon>
                    <Text size="10.5px" fw={700} style={{ color: labelColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Client
                    </Text>
                  </Group>
                  <Tooltip
                    label={clientPerson && clientPerson !== '—' ? `Contact: ${clientPerson}` : company}
                    disabled={!clientPerson || clientPerson === '—'}
                  >
                    <Text size="13.5px" fw={800} pl={28} style={{ color: valueColor, lineHeight: 1.2 }} truncate>
                      {company}
                    </Text>
                  </Tooltip>
                </Paper>

                {/* 2. Project Lead Card */}
                <Paper
                  p="xs"
                  radius="md"
                  style={{
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#F8FAFC',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: 64,
                  }}
                >
                  <Group gap={6} align="center" mb={6}>
                    <ThemeIcon size={22} radius="sm" variant="light" color="blue">
                      <IconUserCheck size={12} />
                    </ThemeIcon>
                    <Text size="10.5px" fw={700} style={{ color: labelColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Project Lead
                    </Text>
                  </Group>
                  <Text
                    size="13.5px"
                    fw={800}
                    pl={28}
                    style={{ color: valueColor, lineHeight: 1.2 }}
                    truncate
                  >
                    {currentProject.projectManagerName && currentProject.projectManagerName !== 'Unassigned'
                      ? currentProject.projectManagerName
                      : 'Unassigned'}
                  </Text>
                </Paper>

                {/* 3. Start Date Card */}
                <Paper
                  p="xs"
                  radius="md"
                  style={{
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#F8FAFC',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: 64,
                  }}
                >
                  <Group gap={6} align="center" mb={6}>
                    <ThemeIcon size={22} radius="sm" variant="light" color="blue">
                      <IconCalendar size={12} />
                    </ThemeIcon>
                    <Text size="10.5px" fw={700} style={{ color: labelColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Start Date
                    </Text>
                  </Group>
                  <Text size="13.5px" fw={800} pl={28} style={{ color: valueColor, lineHeight: 1.2 }}>
                    {formatDate(currentProject.startDate)}
                  </Text>
                </Paper>

                {/* 4. Target Deadline Card */}
                <Paper
                  p="xs"
                  radius="md"
                  style={{
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#F8FAFC',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: 64,
                  }}
                >
                  <Group justify="space-between" align="center" mb={6} wrap="nowrap">
                    <Group gap={6} align="center" wrap="nowrap">
                      <ThemeIcon
                        size={22}
                        radius="sm"
                        variant="light"
                        color={currentProject.isOverdue ? 'red' : 'amber'}
                      >
                        <IconClock size={12} />
                      </ThemeIcon>
                      <Text size="10.5px" fw={700} style={{ color: labelColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Deadline
                      </Text>
                    </Group>
                    {currentProject.isOverdue ? (
                      <Badge color="red" size="xs" variant="filled" radius="sm">
                        Overdue
                      </Badge>
                    ) : (
                      <Badge color="teal" size="xs" variant="light" radius="sm">
                        On Track
                      </Badge>
                    )}
                  </Group>
                  <Text
                    size="13.5px"
                    fw={800}
                    pl={28}
                    style={{
                      color: currentProject.isOverdue ? '#EF4444' : valueColor,
                      lineHeight: 1.2,
                    }}
                  >
                    {formatDate(currentProject.targetEndDate)}
                  </Text>
                </Paper>
              </SimpleGrid>
            </Grid.Col>
          </Grid>
        </Box>
      </Paper>

      {/* 3. EXECUTIVE DELIVERY HEALTH & MILESTONE TRACKING HUB */}
      <Paper
        p={{ base: 'md', sm: 'lg' }}
        radius="lg"
        mb="xl"
        style={{
          background: cardBg,
          border: cardBorder,
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.03)',
        }}
      >
        <Grid gutter="lg" align="center">
          {/* Left Column: Circular Health Gauge & Linear Delivery Bar */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Group gap="md" align="center" wrap="nowrap">
              <RingProgress
                size={76}
                thickness={7}
                roundCaps
                sections={[
                  {
                    value: metrics.overallProgress,
                    color:
                      metrics.overallProgress === 100
                        ? '#10B981'
                        : metrics.overallProgress >= 50
                        ? '#2563EB'
                        : '#F59E0B',
                  },
                ]}
                label={
                  <Box ta="center">
                    <Text fw={800} size="14px" style={{ color: valueColor, lineHeight: 1 }}>
                      {metrics.overallProgress}%
                    </Text>
                    <Text size="8.5px" c="dimmed" fw={700}>
                      DONE
                    </Text>
                  </Box>
                }
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <Group justify="space-between" align="center" mb={4} wrap="nowrap">
                  <Text fw={800} size="sm" style={{ color: valueColor, letterSpacing: '-0.01em' }} truncate>
                    Delivery Milestone Health
                  </Text>
                  <Badge
                    size="sm"
                    radius="sm"
                    variant="light"
                    color={
                      metrics.overallProgress === 100
                        ? 'teal'
                        : metrics.overallProgress >= 50
                        ? 'blue'
                        : 'orange'
                    }
                    style={{ fontWeight: 700 }}
                  >
                    {metrics.overallProgress === 100 ? 'Completed' : 'Active Sprints'}
                  </Badge>
                </Group>

                <Text size="xs" c="dimmed" mb={8}>
                  {metrics.completedCount} of {metrics.totalModules} modules verified & delivered
                </Text>

                <Progress
                  value={metrics.overallProgress}
                  size="xs"
                  radius="xl"
                  animated={metrics.overallProgress > 0 && metrics.overallProgress < 100}
                  color={
                    metrics.overallProgress === 100
                      ? 'teal'
                      : metrics.overallProgress >= 50
                      ? 'blue'
                      : 'orange'
                  }
                />
              </div>
            </Group>
          </Grid.Col>

          {/* Right Column: 4 Modern Metric Tiles */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
              {/* Tile 1: Total Modules */}
              <Paper
                p="xs"
                radius="md"
                style={{
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                }}
              >
                <Group justify="space-between" align="center" mb={4}>
                  <ThemeIcon size={24} radius="sm" variant="light" color="indigo">
                    <IconFolders size={13} />
                  </ThemeIcon>
                  <Badge size="xs" variant="light" color="indigo" radius="sm">
                    Total
                  </Badge>
                </Group>
                <Text size="18px" fw={800} style={{ color: valueColor, lineHeight: 1.2 }}>
                  {metrics.totalModules}
                </Text>
                <Text size="11px" fw={600} c="dimmed">
                  Planned Sprints
                </Text>
              </Paper>

              {/* Tile 2: Completed Modules */}
              <Paper
                p="xs"
                radius="md"
                style={{
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                }}
              >
                <Group justify="space-between" align="center" mb={4}>
                  <ThemeIcon size={24} radius="sm" variant="light" color="teal">
                    <IconCircleCheckFilled size={13} />
                  </ThemeIcon>
                  <Badge size="xs" variant="light" color="teal" radius="sm">
                    {metrics.totalModules > 0
                      ? `${Math.round((metrics.completedCount / metrics.totalModules) * 100)}%`
                      : '0%'}
                  </Badge>
                </Group>
                <Text size="18px" fw={800} style={{ color: '#10B981', lineHeight: 1.2 }}>
                  {metrics.completedCount}
                </Text>
                <Text size="11px" fw={600} c="dimmed">
                  100% Delivered
                </Text>
              </Paper>

              {/* Tile 3: In Progress / Active */}
              <Paper
                p="xs"
                radius="md"
                style={{
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                }}
              >
                <Group justify="space-between" align="center" mb={4}>
                  <ThemeIcon size={24} radius="sm" variant="light" color="blue">
                    <IconActivity size={13} />
                  </ThemeIcon>
                  <Badge size="xs" variant="light" color="blue" radius="sm">
                    Active
                  </Badge>
                </Group>
                <Text size="18px" fw={800} style={{ color: isDark ? '#93C5FD' : '#2563EB', lineHeight: 1.2 }}>
                  {metrics.inProgressCount}
                </Text>
                <Text size="11px" fw={600} c="dimmed">
                  In Development
                </Text>
              </Paper>

              {/* Tile 4: Overdue Risks */}
              <Paper
                p="xs"
                radius="md"
                style={{
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#F8FAFC',
                  border:
                    metrics.overdueCount > 0
                      ? `1px solid ${isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA'}`
                      : isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                }}
              >
                <Group justify="space-between" align="center" mb={4}>
                  <ThemeIcon
                    size={24}
                    radius="sm"
                    variant="light"
                    color={metrics.overdueCount > 0 ? 'red' : 'gray'}
                  >
                    <IconAlertCircle size={13} />
                  </ThemeIcon>
                  <Badge
                    size="xs"
                    variant={metrics.overdueCount > 0 ? 'filled' : 'light'}
                    color={metrics.overdueCount > 0 ? 'red' : 'gray'}
                    radius="sm"
                  >
                    {metrics.overdueCount > 0 ? 'At Risk' : 'Healthy'}
                  </Badge>
                </Group>
                <Text
                  size="18px"
                  fw={800}
                  style={{
                    color: metrics.overdueCount > 0 ? (isDark ? '#F87171' : '#DC2626') : valueColor,
                    lineHeight: 1.2,
                  }}
                >
                  {metrics.overdueCount}
                </Text>
                <Text
                  size="11px"
                  fw={600}
                  style={{
                    color: metrics.overdueCount > 0 ? (isDark ? '#FCA5A5' : '#EF4444') : undefined,
                  }}
                  c={metrics.overdueCount > 0 ? undefined : 'dimmed'}
                >
                  {metrics.overdueCount > 0 ? 'Deadlines Passed' : 'Zero Overdue'}
                </Text>
              </Paper>
            </SimpleGrid>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* 4. INTERACTIVE MODULES & SPRINTS TABLE */}
      <Paper
        radius="xl"
        mb="xl"
        style={{
          background: cardBg,
          border: cardBorder,
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.35)'
            : '0 8px 24px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
        }}
      >
        <Box p="lg" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="sm" align="center">
              <ThemeIcon
                size={38}
                radius="md"
                variant="light"
                color="indigo"
                style={{
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                }}
              >
                <IconListCheck size={20} color="#4F46E5" />
              </ThemeIcon>
              <div>
                <Text fw={800} size="15.5px" style={{ color: valueColor, letterSpacing: '-0.01em' }}>
                  Project Modules & Sprints
                </Text>
                <Text size="xs" c="dimmed">
                  Milestone breakdown, developer assignments, deadline schedules and delivery progress
                </Text>
              </div>
            </Group>

            <Group gap="xs">
              {modules.length === 0 && (
                <Button
                  variant="light"
                  color="indigo"
                  size="xs"
                  radius="md"
                  leftSection={<IconSparkles size={14} />}
                  onClick={handleLoadStandardTemplate}
                  loading={savingModules}
                >
                  Load 4-Sprint Standard Template
                </Button>
              )}

              <Button
                variant="filled"
                color="blue"
                size="xs"
                radius="md"
                leftSection={<IconPlus size={15} stroke={2.5} />}
                onClick={handleOpenAddModule}
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  fontWeight: 700,
                  height: 32,
                }}
              >
                Add Module
              </Button>
            </Group>
          </Group>
        </Box>

        {/* Modules Table or Empty State */}
        {modules.length === 0 ? (
          <Box p={40} ta="center">
            <ThemeIcon size={52} radius="xl" variant="light" color="blue" mb="sm">
              <IconListCheck size={26} />
            </ThemeIcon>
            <Text fw={700} size="sm" style={{ color: valueColor }}>
              No Modules Entered Yet
            </Text>
            <Text size="xs" c="dimmed" mb="md" style={{ maxWidth: 440, margin: '6px auto 16px' }}>
              Break down this project into key modules, assign developers, set deadlines, and track
              completion percentage end-to-end.
            </Text>
            <Group justify="center" gap="xs">
              <Button
                size="xs"
                variant="filled"
                color="blue"
                radius="md"
                leftSection={<IconPlus size={14} />}
                onClick={handleOpenAddModule}
              >
                Create First Module
              </Button>
              <Button
                size="xs"
                variant="light"
                color="indigo"
                radius="md"
                leftSection={<IconSparkles size={14} />}
                onClick={handleLoadStandardTemplate}
              >
                Use Standard Milestones Template
              </Button>
            </Group>
          </Box>
        ) : (
          <>
            <Box style={{ overflowX: 'auto', scrollbarWidth: 'none' }} className="no-scrollbar">
            <Table
              verticalSpacing={14}
              horizontalSpacing="md"
              style={{ minWidth: 840 }}
              highlightOnHover
            >
              <Table.Thead
                style={{
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                }}
              >
                <Table.Tr>
                  <Table.Th style={{ width: 42, textAlign: 'center', fontSize: 11, fontWeight: 700, color: labelColor }}>
                    #
                  </Table.Th>
                  <Table.Th style={{ minWidth: 220, fontSize: 11, fontWeight: 700, color: labelColor }}>
                    MODULE / SPRINT
                  </Table.Th>
                  <Table.Th style={{ minWidth: 150, fontSize: 11, fontWeight: 700, color: labelColor }}>
                    ASSIGNED TO
                  </Table.Th>
                  <Table.Th style={{ minWidth: 130, fontSize: 11, fontWeight: 700, color: labelColor }}>
                    DEADLINE
                  </Table.Th>
                  <Table.Th style={{ minWidth: 260, fontSize: 11, fontWeight: 700, color: labelColor }}>
                    COMPLETION PROGRESS
                  </Table.Th>
                  <Table.Th style={{ minWidth: 110, fontSize: 11, fontWeight: 700, color: labelColor }}>
                    STATUS
                  </Table.Th>
                  <Table.Th style={{ width: 90, textAlign: 'center', fontSize: 11, fontWeight: 700, color: labelColor }}>
                    ACTIONS
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {paginatedModules.map((mod, index) => {
                  const isOverdue = isModuleOverdue(mod.deadline, mod.progress);
                  const devInitials = (mod.assignedTo || 'DV')
                    .replace('(TL)', '')
                    .trim()
                    .slice(0, 2)
                    .toUpperCase();
                  const rowNum = startModuleIdx + index + 1;

                  return (
                    <Table.Tr
                      key={mod.id || index}
                      style={{
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid #F1F5F9',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* 1. Index Pill */}
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Box
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                            fontSize: 11,
                            fontWeight: 700,
                            color: labelColor,
                          }}
                        >
                          {rowNum}
                        </Box>
                      </Table.Td>

                      {/* 2. Module Name & Description */}
                      <Table.Td>
                        <Text fw={700} size="13.5px" style={{ color: valueColor, lineHeight: 1.3 }}>
                          {mod.name}
                        </Text>
                        {mod.description && (
                          <Text size="11px" c="dimmed" lineClamp={1} mt={2}>
                            {mod.description}
                          </Text>
                        )}
                      </Table.Td>

                      {/* 3. Assigned Developer */}
                      <Table.Td>
                        <Group gap={7} wrap="nowrap" align="center">
                          <Avatar size={24} radius="xl" color="blue" style={{ fontSize: 10, fontWeight: 700 }}>
                            {devInitials}
                          </Avatar>
                          <Text size="12.5px" fw={600} style={{ color: valueColor }}>
                            {mod.assignedTo || 'Unassigned'}
                          </Text>
                        </Group>
                      </Table.Td>

                      {/* 4. Deadline with Overdue indicator */}
                      <Table.Td>
                        <Group gap={6} wrap="nowrap" align="center">
                          <IconCalendar
                            size={14}
                            color={isOverdue ? '#EF4444' : isDark ? '#94A3B8' : '#64748B'}
                          />
                          <Text
                            size="12.5px"
                            fw={600}
                            style={{ color: isOverdue ? '#EF4444' : valueColor }}
                          >
                            {formatDate(mod.deadline)}
                          </Text>
                          {isOverdue && (
                            <Badge color="red" size="xs" variant="filled">
                              Overdue
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>

                      {/* 5. Progress with Modern Quick Buttons */}
                      <Table.Td>
                        <Box style={{ width: '100%' }}>
                          <Group justify="space-between" align="center" mb={4}>
                            <Text size="12px" fw={800} style={{ color: valueColor }}>
                              {mod.progress || 0}% Completed
                            </Text>

                            {/* Preset Buttons for Instant 1-Click Update */}
                            <Group gap={3}>
                              {[25, 50, 75, 100].map((val) => {
                                const isActive = mod.progress === val;
                                return (
                                  <Button
                                    key={val}
                                    size="compact-xs"
                                    variant={isActive ? 'filled' : 'subtle'}
                                    color={val === 100 ? 'teal' : 'blue'}
                                    radius="sm"
                                    onClick={() => handleQuickProgressUpdate(mod, val)}
                                    style={{
                                      height: 20,
                                      fontSize: '10px',
                                      padding: '0 5px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {val === 100 ? '100% ✓' : `${val}%`}
                                  </Button>
                                );
                              })}
                            </Group>
                          </Group>

                          <Progress
                            value={mod.progress || 0}
                            size="sm"
                            radius="xl"
                            animated={mod.progress > 0 && mod.progress < 100}
                            color={
                              mod.progress >= 100
                                ? 'teal'
                                : mod.progress >= 50
                                ? 'blue'
                                : 'orange'
                            }
                          />
                        </Box>
                      </Table.Td>

                      {/* 6. Status Badge */}
                      <Table.Td>
                        <Badge
                          size="sm"
                          radius="md"
                          variant="light"
                          color={
                            mod.status === 'Completed' || mod.progress >= 100
                              ? 'teal'
                              : mod.status === 'In Review'
                              ? 'orange'
                              : mod.status === 'In Progress'
                              ? 'blue'
                              : 'gray'
                          }
                          style={{ textTransform: 'capitalize', fontWeight: 700 }}
                        >
                          {mod.progress >= 100 ? 'Completed' : mod.status || 'In Progress'}
                        </Badge>
                      </Table.Td>

                      {/* 7. Actions */}
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Group gap={4} justify="center" wrap="nowrap">
                          <Tooltip label="Edit Module">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="blue"
                              onClick={() => handleOpenEditModule(mod)}
                            >
                              <IconEdit size={15} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete Module">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => handleDeleteModule(mod.id)}
                            >
                              <IconTrash size={15} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>

          {/* Modules Pagination Footer */}
          <Box
            px="md"
            py="sm"
            style={{
              borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FAFAFA',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Left Side: Count Badge & Showing Range */}
            <Group gap="xs" wrap="wrap" align="center">
              <Box
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  backgroundColor: isDark ? '#1E293B' : '#EDF2F7',
                  color: isDark ? '#94A3B8' : '#475569',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Total {totalModules} module{totalModules !== 1 ? 's' : ''}
              </Box>

              <Text size="xs" c="dimmed" fw={500}>
                Showing <Text span fw={700} c={isDark ? '#F8FAFC' : '#1E293B'}>{startRecord}</Text> to{' '}
                <Text span fw={700} c={isDark ? '#F8FAFC' : '#1E293B'}>{endRecord}</Text> of{' '}
                <Text span fw={700} c={isDark ? '#F8FAFC' : '#1E293B'}>{totalModules}</Text> modules
              </Text>
            </Group>

            {/* Right Side: Page Navigation Buttons */}
            <Group gap={6} align="center" wrap="wrap">
              <Pagination
                value={currentModulesPage}
                onChange={(newPage) => setModulesPage(newPage)}
                total={totalModulesPages}
                radius="md"
                size="sm"
                color="blue"
                withEdges
                styles={{
                  control: {
                    fontWeight: 600,
                    fontSize: 12,
                    borderRadius: 8,
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    color: isDark ? '#E2E8F0' : '#1E293B',
                  },
                }}
              />
            </Group>
          </Box>
        </>
      )}
      </Paper>

      {/* 5. ENTERPRISE PROJECT DOSSIER (Client, Team, Repositories, Scope) */}
      <Grid gutter="md">
        {/* Card 1: Client & Stakeholder Information */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper
            p="md"
            radius="md"
            style={{
              background: cardBg,
              border: cardBorder,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isDark
                ? '0 2px 10px rgba(0, 0, 0, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            {/* Minimal Card Header */}
            <Group justify="space-between" align="center" mb="xs">
              <Group gap={8} align="center">
                <IconBuilding size={16} color="#10B981" />
                <Text fw={700} size="sm" style={{ color: valueColor, letterSpacing: '-0.01em' }}>
                  Client & Organization Details
                </Text>
              </Group>

              <Badge
                variant="light"
                color="teal"
                size="xs"
                radius="sm"
                style={{ fontWeight: 600 }}
              >
                Client Account
              </Badge>
            </Group>

            {/* Organization & Primary Contact Row */}
            <Box
              py="xs"
              style={{
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
              }}
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text size="11px" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Organization
                  </Text>
                  <Text size="sm" fw={700} style={{ color: valueColor }}>
                    {company}
                  </Text>
                </div>

                {clientPerson && clientPerson !== '—' && (
                  <Box ta="right">
                    <Text size="11px" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Primary Contact
                    </Text>
                    <Text size="sm" fw={700} style={{ color: valueColor }}>
                      {clientPerson}
                    </Text>
                  </Box>
                )}
              </Group>
            </Box>

            {/* Contact Channels (Email & Phone) */}
            <Group gap="md" mt="sm" align="center" wrap="wrap">
              <Group gap={6} align="center">
                <IconMail size={14} color="#3B82F6" />
                <Text size="11px" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Email:
                </Text>
                {currentProject.clientEmail ? (
                  <Anchor
                    href={`mailto:${currentProject.clientEmail}`}
                    size="xs"
                    fw={600}
                    style={{ color: '#2563EB', wordBreak: 'break-all' }}
                  >
                    {currentProject.clientEmail}
                  </Anchor>
                ) : (
                  <Text size="xs" c="dimmed">
                    —
                  </Text>
                )}
              </Group>

              <Divider orientation="vertical" style={{ height: 14 }} />

              <Group gap={6} align="center">
                <IconPhone size={14} color="#10B981" />
                <Text size="11px" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Phone:
                </Text>
                {currentProject.clientPhone ? (
                  <Anchor
                    href={`tel:${currentProject.clientPhone}`}
                    size="xs"
                    fw={600}
                    style={{ color: valueColor }}
                  >
                    {currentProject.clientPhone}
                  </Anchor>
                ) : (
                  <Text size="xs" c="dimmed">
                    —
                  </Text>
                )}
              </Group>
            </Group>
          </Paper>
        </Grid.Col>

        {/* Card 2: Team Leadership & Engineering Team */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper
            p="md"
            radius="md"
            style={{
              background: cardBg,
              border: cardBorder,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isDark
                ? '0 2px 10px rgba(0, 0, 0, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            {/* Minimal Card Header */}
            <Group justify="space-between" align="center" mb="xs">
              <Group gap={8} align="center">
                <IconUsers size={16} color="#6366F1" />
                <Text fw={700} size="sm" style={{ color: valueColor, letterSpacing: '-0.01em' }}>
                  Project Leadership & Team
                </Text>
              </Group>

              <Badge
                variant="light"
                color="indigo"
                size="xs"
                radius="sm"
                style={{ fontWeight: 600 }}
              >
                {normalizedTeamMembers.length} {normalizedTeamMembers.length === 1 ? 'Engineer' : 'Engineers'}
              </Badge>
            </Group>

            {/* Tech Lead Row */}
            <Box
              py="xs"
              style={{
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
              }}
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text size="11px" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Project Tech Lead (TL)
                  </Text>
                  <Group gap={6} align="center" mt={2}>
                    <IconCrown size={14} color="#6366F1" />
                    <Text size="sm" fw={700} style={{ color: valueColor }}>
                      {currentProject.projectManagerName && currentProject.projectManagerName !== 'Unassigned'
                        ? currentProject.projectManagerName
                        : 'Unassigned'}
                    </Text>
                  </Group>
                </div>
                <Badge size="xs" color="indigo" variant="subtle" radius="sm">
                  Tech Lead
                </Badge>
              </Group>
            </Box>

            {/* Assigned Developers Row */}
            <Box mt="sm" style={{ flex: 1 }}>
              <Group gap={6} align="center" wrap="wrap">
                <Text size="11px" fw={600} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }} mr={4}>
                  Developers:
                </Text>
                {normalizedTeamMembers.length > 0 ? (
                  normalizedTeamMembers.map((member, idx) => (
                    <Box
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                      }}
                    >
                      <Avatar size={16} radius="xl" color="blue" style={{ fontSize: 8, fontWeight: 800 }}>
                        {member.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Text size="11.5px" fw={600} style={{ color: valueColor }}>
                        {member}
                      </Text>
                    </Box>
                  ))
                ) : (
                  <Text size="xs" c="dimmed">
                    No developers assigned
                  </Text>
                )}
              </Group>
            </Box>
          </Paper>
        </Grid.Col>


        {/* Card 5: Scope of Work */}
        {currentProject.description ? (
          <Grid.Col span={12}>
            <Paper p="md" radius="md" style={{ background: cardBg, border: cardBorder }}>
              <Group gap={6} mb="xs" align="center">
                <IconFileText size={16} color="#6366F1" />
                <Text fw={700} size="sm" style={{ color: valueColor }}>
                  Project Scope of Work & Description
                </Text>
              </Group>
              <Text size="xs" style={{ color: valueColor, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {currentProject.description}
              </Text>
            </Paper>
          </Grid.Col>
        ) : null}
      </Grid>

      {/* 6. ADD / EDIT MODULE MODAL */}
      <Modal
        opened={moduleModalOpened}
        onClose={() => setModuleModalOpened(false)}
        title={
          <Group gap="sm" align="center">
            <ThemeIcon
              size={38}
              radius="md"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(79, 70, 229, 0.25))'
                  : 'linear-gradient(135deg, #EFF6FF, #EEF2FF)',
                border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : '#DBEAFE'}`,
                color: '#2563EB',
              }}
            >
              <IconListCheck size={20} stroke={2.2} />
            </ThemeIcon>
            <Box>
              <Text fw={800} size="md" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
                {editingModuleId ? 'Edit Project Module' : 'Add New Project Module'}
              </Text>
              <Text size="xs" c="dimmed">
                {editingModuleId
                  ? 'Update milestone objectives, engineer assignment, and progress targets'
                  : 'Define sprint milestone deliverables and allocate engineering resources'}
              </Text>
            </Box>
          </Group>
        }
        radius="lg"
        size="lg"
        centered
        overlayProps={{
          blur: 4,
          backgroundOpacity: 0.4,
        }}
        styles={{
          header: {
            paddingBottom: 14,
            borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}`,
            marginBottom: 14,
          },
          content: {
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
              : '0 25px 50px -12px rgba(15, 23, 42, 0.16)',
            border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
          },
        }}
      >
        <Stack gap="md">
          {modalError && (
            <Paper
              p="xs"
              radius="md"
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <IconAlertCircle size={16} color="#EF4444" />
              <Text size="xs" c="red" fw={600}>
                {modalError}
              </Text>
            </Paper>
          )}

          {/* Module Name */}
          <TextInput
            label={
              <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#475569' }}>
                Module / Milestone Name <span style={{ color: '#EF4444' }}>*</span>
              </Text>
            }
            placeholder="e.g. Authentication, RBAC & Security Matrix"
            required
            size="sm"
            radius="md"
            leftSection={<IconBriefcase size={16} color="#3B82F6" />}
            value={moduleFormData.name}
            onChange={(e) => {
              setModalError('');
              setModuleFormData({ ...moduleFormData, name: e.target.value });
            }}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {/* Assigned Developer */}
            <Select
              label={
                <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#475569' }}>
                  Assigned Engineer
                </Text>
              }
              placeholder="Select team member"
              data={assignedOptions}
              value={moduleFormData.assignedTo}
              onChange={(val) => setModuleFormData({ ...moduleFormData, assignedTo: val || '' })}
              searchable
              clearable
              size="sm"
              radius="md"
              leftSection={<IconUserCheck size={16} color="#6366F1" />}
            />

            {/* Deadline */}
            <DatePickerInput
              label={
                <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#475569' }}>
                  Milestone Deadline
                </Text>
              }
              placeholder="DD-MM-YYYY"
              value={parseDateString(moduleFormData.deadline)}
              onChange={(val) => {
                setModuleFormData({
                  ...moduleFormData,
                  deadline: val ? dayjs(val).format('DD-MM-YYYY') : '',
                });
              }}
              valueFormat="DD-MM-YYYY"
              clearable
              size="sm"
              radius="md"
              leftSection={<IconCalendar size={16} color="#F59E0B" />}
              popoverProps={{ withinPortal: true }}
            />
          </SimpleGrid>

          {/* Completion Progress Card & Slider */}
          <Paper
            p="md"
            radius="md"
            style={{
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : '#F8FAFC',
              border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
            }}
          >
            {/* Header */}
            <Group justify="space-between" align="center" mb="sm">
              <Group gap={6}>
                <ThemeIcon
                  size={24}
                  radius="sm"
                  variant="light"
                  color={moduleFormData.progress === 100 ? 'teal' : 'blue'}
                >
                  <IconTrendingUp size={14} />
                </ThemeIcon>
                <Text
                  size="xs"
                  fw={700}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#E2E8F0' : '#334155' }}
                >
                  Completion Progress
                </Text>
              </Group>

              <Badge
                size="md"
                radius="md"
                variant="filled"
                color={
                  moduleFormData.progress === 100
                    ? 'teal'
                    : moduleFormData.progress >= 50
                    ? 'blue'
                    : moduleFormData.progress > 0
                    ? 'cyan'
                    : 'gray'
                }
                styles={{
                  root: {
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    boxShadow:
                      moduleFormData.progress === 100
                        ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                        : '0 2px 8px rgba(37, 99, 235, 0.25)',
                  },
                }}
                leftSection={moduleFormData.progress === 100 ? <IconCheck size={12} stroke={3} /> : undefined}
              >
                {moduleFormData.progress}% {moduleFormData.progress === 100 ? 'Completed' : ''}
              </Badge>
            </Group>

            {/* Clean Slider without colliding text labels */}
            <Box px={6} py={4}>
              <Slider
                value={moduleFormData.progress}
                onChange={(val) => {
                  let status: ProjectModuleItem['status'] = moduleFormData.status;
                  if (val >= 100) status = 'Completed';
                  else if (val > 0 && status === 'Not Started') status = 'In Progress';
                  else if (val === 0 && status === 'Completed') status = 'Not Started';
                  setModuleFormData({ ...moduleFormData, progress: val, status });
                }}
                min={0}
                max={100}
                step={5}
                size="sm"
                color={moduleFormData.progress === 100 ? 'teal' : 'blue'}
                marks={[
                  { value: 0 },
                  { value: 25 },
                  { value: 50 },
                  { value: 75 },
                  { value: 100 },
                ]}
                styles={{
                  track: {
                    backgroundColor: isDark ? '#334155' : '#E2E8F0',
                  },
                  mark: {
                    borderColor: isDark ? '#475569' : '#CBD5E1',
                    borderWidth: 2,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    transform: 'translate(-3px, -1.5px)',
                  },
                }}
              />
            </Box>

            {/* Quick Presets - Cleanly arranged in dedicated buttons below */}
            <Box mt="md">
              <Text
                size="11px"
                fw={600}
                c="dimmed"
                mb={6}
                style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                Quick Target Presets:
              </Text>
              <SimpleGrid cols={5} spacing={8}>
                {[
                  { val: 0, label: '0%', sub: 'Pending' },
                  { val: 25, label: '25%', sub: 'Started' },
                  { val: 50, label: '50%', sub: 'Halfway' },
                  { val: 75, label: '75%', sub: 'Testing' },
                  { val: 100, label: '100%', sub: 'Done ✓' },
                ].map((preset) => {
                  const isActive = moduleFormData.progress === preset.val;
                  const isDone = preset.val === 100;
                  return (
                    <Button
                      key={preset.val}
                      size="xs"
                      variant={isActive ? 'filled' : 'default'}
                      color={isDone ? 'teal' : 'blue'}
                      radius="md"
                      onClick={() => {
                        let status: ProjectModuleItem['status'] = moduleFormData.status;
                        if (preset.val >= 100) status = 'Completed';
                        else if (preset.val > 0) status = 'In Progress';
                        else status = 'Not Started';
                        setModuleFormData({ ...moduleFormData, progress: preset.val, status });
                      }}
                      style={{
                        height: 38,
                        border: isActive ? 'none' : `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                        background: isActive
                          ? isDone
                            ? 'linear-gradient(135deg, #10B981, #059669)'
                            : 'linear-gradient(135deg, #2563EB, #4F46E5)'
                          : isDark
                          ? '#1E293B'
                          : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569',
                        boxShadow: isActive
                          ? isDone
                            ? '0 4px 10px rgba(16, 185, 129, 0.3)'
                            : '0 4px 10px rgba(37, 99, 235, 0.25)'
                          : 'none',
                        transition: 'all 0.15s ease',
                        padding: '0 4px',
                      }}
                    >
                      <Stack gap={0} align="center">
                        <Text size="xs" fw={isActive ? 800 : 700} lh={1.1}>
                          {preset.label}
                        </Text>
                        <Text size="9px" fw={500} opacity={isActive ? 0.9 : 0.6} lh={1.1}>
                          {preset.sub}
                        </Text>
                      </Stack>
                    </Button>
                  );
                })}
              </SimpleGrid>
            </Box>
          </Paper>

          {/* Module Lifecycle Status */}
          <Box>
            <Text
              size="xs"
              fw={700}
              mb={6}
              style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#475569' }}
            >
              Module Lifecycle Status
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
              {[
                { value: 'Not Started', label: 'Not Started', color: '#64748B', activeBg: '#F1F5F9', activeColor: '#334155' },
                { value: 'In Progress', label: 'In Progress', color: '#3B82F6', activeBg: '#EFF6FF', activeColor: '#1D4ED8' },
                { value: 'In Review', label: 'In Review', color: '#F59E0B', activeBg: '#FEF3C7', activeColor: '#B45309' },
                { value: 'Completed', label: 'Completed', color: '#10B981', activeBg: '#ECFDF5', activeColor: '#047857' },
              ].map((st) => {
                const isCurrent = moduleFormData.status === st.value;
                return (
                  <Button
                    key={st.value}
                    size="sm"
                    radius="md"
                    variant={isCurrent ? 'filled' : 'default'}
                    onClick={() => {
                      const newStatus = st.value as ProjectModuleItem['status'];
                      let progress = moduleFormData.progress;
                      if (newStatus === 'Completed' && progress < 100) progress = 100;
                      else if (newStatus === 'Not Started' && progress > 0) progress = 0;
                      else if (newStatus === 'In Progress' && progress === 0) progress = 25;
                      setModuleFormData({ ...moduleFormData, status: newStatus, progress });
                    }}
                    style={{
                      height: 38,
                      border: isCurrent
                        ? `1.5px solid ${st.color}`
                        : `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                      backgroundColor: isCurrent
                        ? isDark
                          ? 'rgba(30, 41, 59, 0.95)'
                          : st.activeBg
                        : isDark
                        ? '#1E293B'
                        : '#FFFFFF',
                      color: isCurrent
                        ? isDark
                          ? '#F8FAFC'
                          : st.activeColor
                        : isDark
                        ? '#94A3B8'
                        : '#64748B',
                      fontWeight: isCurrent ? 700 : 500,
                      fontSize: '12px',
                      transition: 'all 0.15s ease',
                      padding: '0 8px',
                    }}
                    leftSection={
                      <Box
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: st.color,
                          boxShadow: isCurrent ? `0 0 6px ${st.color}` : 'none',
                        }}
                      />
                    }
                  >
                    {st.label}
                  </Button>
                );
              })}
            </SimpleGrid>
          </Box>

          {/* Description */}
          <Textarea
            label={
              <Text
                size="xs"
                fw={700}
                style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#475569' }}
              >
                Module Scope & Deliverables <span style={{ fontWeight: 400, opacity: 0.7 }}>(Optional)</span>
              </Text>
            }
            placeholder="Key deliverables, tasks, acceptance criteria or technical architecture notes..."
            rows={3}
            radius="md"
            value={moduleFormData.description}
            onChange={(e) =>
              setModuleFormData({ ...moduleFormData, description: e.target.value })
            }
          />

          {/* Modal Footer */}
          <Divider my={4} color={isDark ? '#334155' : '#F1F5F9'} />

          <Group justify="space-between" align="center" mt="xs">
            <Group gap={6}>
              <ThemeIcon
                size={20}
                radius="xl"
                variant="light"
                color={moduleFormData.progress === 100 ? 'teal' : 'blue'}
              >
                <IconActivity size={12} />
              </ThemeIcon>
              <Text size="xs" c="dimmed" fw={500}>
                {moduleFormData.progress === 100
                  ? 'Milestone ready for sprint sign-off'
                  : 'Auto-syncs project health on save'}
              </Text>
            </Group>

            <Group gap="xs">
              <Button
                variant="default"
                radius="md"
                size="sm"
                onClick={() => setModuleModalOpened(false)}
                style={{
                  borderColor: isDark ? '#475569' : '#CBD5E1',
                  fontWeight: 600,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="filled"
                radius="md"
                size="sm"
                loading={savingModules}
                onClick={handleSaveModule}
                leftSection={<IconCheck size={16} stroke={2.5} />}
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                }}
              >
                {editingModuleId ? 'Save Changes' : 'Add Module'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default ProjectDetailsPage;
