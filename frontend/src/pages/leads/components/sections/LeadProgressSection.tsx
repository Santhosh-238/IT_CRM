import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Paper,
  Table,
  Progress,
  SimpleGrid,
  ThemeIcon,
  Modal,
  TextInput,
  Select,
  Slider,
  ActionIcon,
  Tooltip,
  Center,
  Loader,
  NumberInput,
} from '@mantine/core';
import {
  IconPlus,
  IconCheck,
  IconExternalLink,
  IconFolders,
  IconCalendar,
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
  IconTrash,
  IconListCheck,
  IconUser,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Lead, LeadProgressData } from '../../../../types/lead';
import { Project, ProjectModuleItem } from '../../../../types/project';
import { useCRM } from '../../../../context/CRMContext';
import { useProject } from '../../../../context/ProjectContext';
import { projectService } from '../../../../services/projectService';
import dayjs from 'dayjs';

export interface LeadProgressSectionProps {
  lead: Lead;
  isDark: boolean;
  progress: LeadProgressData;
  onUpdateProgress: (progress: LeadProgressData) => void;
  onNavigateSection: (section: any) => void;
}

export const LeadProgressSection: React.FC<LeadProgressSectionProps> = ({
  lead,
  isDark,
  progress: initialProgress,
  onUpdateProgress,
  onNavigateSection,
}) => {
  const { setActiveNav } = useCRM();
  const {
    projects,
    fetchProjects,
    createProject,
    setSelectedProject,
    loading: projectsLoading,
  } = useProject();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [moduleModalOpen, setModuleModalOpen] = useState<boolean>(false);

  // Active Project for Updating
  const [selectedForUpdate, setSelectedForUpdate] = useState<Project | null>(null);
  const [updateProgressVal, setUpdateProgressVal] = useState<number>(0);
  const [updateStatusVal, setUpdateStatusVal] = useState<string>('In Progress');
  const [savingUpdate, setSavingUpdate] = useState<boolean>(false);

  // Create Project Form State
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectCategory, setNewProjectCategory] = useState<string>('Web Application');
  const [newProjectPriority, setNewProjectPriority] = useState<string>('Medium');
  const [newProjectStatus, setNewProjectStatus] = useState<string>('In Progress');
  const [newProjectTargetDate, setNewProjectTargetDate] = useState<string>('');
  const [newProjectBudget, setNewProjectBudget] = useState<number | string>('');
  const [creatingProject, setCreatingProject] = useState<boolean>(false);

  // Link Existing Project State
  const [selectedExistingProjectId, setSelectedExistingProjectId] = useState<string | null>(null);
  const [linkingProject, setLinkingProject] = useState<boolean>(false);

  // Add Module Form State
  const [newModuleName, setNewModuleName] = useState<string>('');
  const [newModuleDev, setNewModuleDev] = useState<string>('');
  const [newModuleDeadline, setNewModuleDeadline] = useState<string>('');
  const [addingModule, setAddingModule] = useState<boolean>(false);

  // Refresh projects on mount or when lead changes
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProjects();
    } catch (_) {}
    setRefreshing(false);
  };

  useEffect(() => {
    handleRefresh();
  }, [lead.id]);

  // Filter linked projects for this lead
  const linkedProjects = useMemo(() => {
    const leadNameLower = (lead.name || '').trim().toLowerCase();
    const leadCompanyLower = (lead.companyName || '').trim().toLowerCase();

    return projects.filter((p) => {
      // Direct ID match
      if (p.contactId && (p.contactId === lead.id || p.contactId === lead.leadId)) {
        return true;
      }
      // Matching clientName
      if (p.clientName) {
        const clientLower = p.clientName.toLowerCase();
        if (leadNameLower && clientLower.includes(leadNameLower)) return true;
        if (leadCompanyLower && clientLower.includes(leadCompanyLower)) return true;
      }
      return false;
    });
  }, [projects, lead]);

  // Available projects to link (projects not yet assigned to this lead)
  const unlinkedProjects = useMemo(() => {
    return projects.filter(
      (p) => p.contactId !== lead.id && p.contactId !== lead.leadId
    );
  }, [projects, lead]);

  // Format Date Helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    const d = dayjs(dateStr);
    return d.isValid() ? d.format('DD-MM-YYYY') : dateStr;
  };

  // Render Status Badge
  const renderStatusBadge = (status: string, project?: Project) => {
    const s = (status || 'Planning').toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE';

    if (s.includes('progress')) {
      bg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0';
    } else if (s.includes('completed')) {
      bg = isDark ? 'rgba(13, 148, 136, 0.15)' : '#F0FDFA';
      color = isDark ? '#5EEAD4' : '#0F766E';
      border = isDark ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid #99F6E4';
    } else if (s.includes('hold') || s.includes('cancel')) {
      bg = isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#B91C1C';
      border = isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA';
    } else if (s.includes('review')) {
      bg = isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB';
      color = isDark ? '#FCD34D' : '#B45309';
      border = isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A';
    }

    return (
      <Badge
        size="sm"
        radius="sm"
        style={{
          backgroundColor: bg,
          color: color,
          border: border,
          textTransform: 'none',
          fontWeight: 650,
          cursor: project ? 'pointer' : 'default',
        }}
        onClick={(e) => {
          if (project) {
            e.stopPropagation();
            openUpdateModal(project);
          }
        }}
      >
        {status || 'In Progress'}
      </Badge>
    );
  };

  // Render Priority Badge
  const renderPriorityBadge = (priority?: string) => {
    const p = (priority || 'Medium').toLowerCase();
    let color = 'blue';
    if (p === 'critical' || p === 'high') color = 'red';
    else if (p === 'medium') color = 'orange';
    else if (p === 'low') color = 'gray';

    return (
      <Badge size="xs" variant="light" color={color} radius="sm" style={{ textTransform: 'capitalize' }}>
        {priority || 'Medium'}
      </Badge>
    );
  };

  // Navigate to Project Details in Project Management
  const handleOpenProjectDetails = (project: Project) => {
    setSelectedProject(project);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_viewing_project', JSON.stringify(project));
    }
    setActiveNav('project-details');
  };

  // Open Update Progress Modal
  const openUpdateModal = (project: Project) => {
    setSelectedForUpdate(project);
    setUpdateProgressVal(project.progress || 0);
    setUpdateStatusVal(project.status || 'In Progress');
    setUpdateModalOpen(true);
  };

  // Save Progress Update to Database
  const handleSaveProgress = async () => {
    if (!selectedForUpdate) return;
    setSavingUpdate(true);
    try {
      const res = await projectService.updateProject(selectedForUpdate.id, {
        progress: updateProgressVal,
        status: updateStatusVal,
      });

      if (res.success) {
        notifications.show({
          title: 'Project Updated',
          message: `${selectedForUpdate.name} progress set to ${updateProgressVal}% (${updateStatusVal})`,
          color: 'teal',
          icon: <IconCheck size={16} />,
        });
        if (onUpdateProgress) {
          onUpdateProgress({
            leadId: lead.id,
            projectName: selectedForUpdate.name,
            projectCode: selectedForUpdate.projectId || 'PRJ',
            overallPercentage: updateProgressVal,
            status: updateStatusVal,
            targetDeliveryDate: selectedForUpdate.targetEndDate || '',
            milestones: selectedForUpdate.modules?.map((m: any) => ({
              id: m.id,
              title: m.name,
              description: m.description,
              percentage: m.status === 'Completed' ? 100 : (m.status === 'In Progress' ? 50 : 0),
              status: m.status,
              targetDate: m.endDate,
            })) || [],
          });
        }
        setUpdateModalOpen(false);
        await fetchProjects();
      } else {
        notifications.show({
          title: 'Update Failed',
          message: res.message || 'Could not update project',
          color: 'red',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Network error updating project',
        color: 'red',
      });
    } finally {
      setSavingUpdate(false);
    }
  };

  // Create Project Linked to this Lead
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      notifications.show({
        title: 'Project Name Required',
        message: 'Please enter a project name',
        color: 'red',
      });
      return;
    }

    setCreatingProject(true);
    try {
      const clientLabel = lead.companyName
        ? `${lead.companyName} (${lead.name})`
        : lead.name;

      const payload = {
        name: newProjectName.trim(),
        clientName: clientLabel,
        contactId: lead.id,
        clientEmail: lead.email || undefined,
        clientPhone: lead.phone || undefined,
        category: newProjectCategory,
        projectType: 'Fixed Price',
        status: newProjectStatus,
        priority: newProjectPriority,
        progress: newProjectStatus === 'Completed' ? 100 : 0,
        targetEndDate: newProjectTargetDate || undefined,
        estimatedBudget: newProjectBudget ? Number(newProjectBudget) : undefined,
      };

      const res = await createProject(payload);
      if (res.success) {
        notifications.show({
          title: 'Project Created',
          message: `Project "${newProjectName}" created and linked to ${lead.name}`,
          color: 'teal',
          icon: <IconCheck size={16} />,
        });
        setCreateModalOpen(false);
        setNewProjectName('');
        setNewProjectBudget('');
        if (onUpdateProgress) {
          onUpdateProgress({
            leadId: lead.id,
            projectName: newProjectName.trim(),
            projectCode: 'PRJ',
            overallPercentage: newProjectStatus === 'Completed' ? 100 : 0,
            status: newProjectStatus,
            targetDeliveryDate: newProjectTargetDate || '',
            milestones: [],
          });
        }
        await fetchProjects();
      } else {
        notifications.show({
          title: 'Creation Failed',
          message: res.message || 'Could not create project',
          color: 'red',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to create project',
        color: 'red',
      });
    } finally {
      setCreatingProject(false);
    }
  };

  // Link Existing Project to this Lead
  const handleLinkProject = async () => {
    if (!selectedExistingProjectId) return;
    setLinkingProject(true);
    try {
      const clientLabel = lead.companyName
        ? `${lead.companyName} (${lead.name})`
        : lead.name;

      const res = await projectService.updateProject(selectedExistingProjectId, {
        contactId: lead.id,
        clientName: clientLabel,
      });

      if (res.success) {
        notifications.show({
          title: 'Project Linked',
          message: 'Project linked to this lead successfully',
          color: 'teal',
          icon: <IconCheck size={16} />,
        });
        setLinkModalOpen(false);
        setSelectedExistingProjectId(null);
        await fetchProjects();
      } else {
        notifications.show({
          title: 'Link Failed',
          message: res.message || 'Could not link project',
          color: 'red',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Error linking project',
        color: 'red',
      });
    } finally {
      setLinkingProject(false);
    }
  };

  // Unlink Project from Lead
  const handleUnlinkProject = async (project: Project) => {
    try {
      const res = await projectService.updateProject(project.id, {
        contactId: null as any,
      });
      if (res.success) {
        notifications.show({
          title: 'Project Unlinked',
          message: `Unlinked ${project.projectId} from this lead`,
          color: 'blue',
        });
        await fetchProjects();
      }
    } catch (err) {}
  };

  // Add Module to Project
  const handleAddModule = async () => {
    if (!selectedForUpdate || !newModuleName.trim()) return;
    setAddingModule(true);
    try {
      const newMod: ProjectModuleItem = {
        id: `mod-${Date.now()}`,
        name: newModuleName.trim(),
        assignedTo: newModuleDev.trim() || undefined,
        deadline: newModuleDeadline || undefined,
        progress: 0,
        status: 'In Progress',
        createdAt: new Date().toISOString(),
      };

      const updatedModules = [...(selectedForUpdate.modules || []), newMod];
      const res = await projectService.updateProject(selectedForUpdate.id, {
        modules: updatedModules,
      });

      if (res.success) {
        notifications.show({
          title: 'Module Added',
          message: `Added module "${newModuleName}"`,
          color: 'teal',
        });
        setModuleModalOpen(false);
        setNewModuleName('');
        setNewModuleDev('');
        setNewModuleDeadline('');
        await fetchProjects();
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Could not add module',
        color: 'red',
      });
    } finally {
      setAddingModule(false);
    }
  };

  // Update Module Progress & Recalculate Project Overall Progress
  const handleUpdateModuleProgress = async (
    project: Project,
    moduleId: string,
    newProgress: number
  ) => {
    try {
      const updatedModules = (project.modules || []).map((m) => {
        if (m.id === moduleId) {
          const newStatus =
            newProgress === 100
              ? 'Completed'
              : newProgress > 0
              ? 'In Progress'
              : 'Not Started';
          return {
            ...m,
            progress: newProgress,
            status: newStatus as any,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      });

      // Recalculate overall project progress from modules
      const totalProg = updatedModules.reduce((acc, curr) => acc + (curr.progress || 0), 0);
      const overallProg = updatedModules.length > 0 ? Math.round(totalProg / updatedModules.length) : project.progress;
      const overallStatus = overallProg === 100 ? 'Completed' : project.status;

      const res = await projectService.updateProject(project.id, {
        modules: updatedModules,
        progress: overallProg,
        status: overallStatus,
      });

      if (res.success) {
        notifications.show({
          title: 'Module Progress Updated',
          message: `Progress updated to ${newProgress}%`,
          color: 'teal',
          icon: <IconCheck size={16} />,
        });
        await fetchProjects();
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to update module',
        color: 'red',
      });
    }
  };

  // Delete Module from Project
  const handleDeleteModule = async (project: Project, moduleId: string) => {
    try {
      const updatedModules = (project.modules || []).filter((m) => m.id !== moduleId);
      const totalProg = updatedModules.reduce((acc, curr) => acc + (curr.progress || 0), 0);
      const overallProg = updatedModules.length > 0 ? Math.round(totalProg / updatedModules.length) : project.progress;

      const res = await projectService.updateProject(project.id, {
        modules: updatedModules,
        progress: overallProg,
      });

      if (res.success) {
        notifications.show({
          title: 'Module Removed',
          message: 'Module deleted successfully',
          color: 'blue',
        });
        await fetchProjects();
      }
    } catch (err) {}
  };

  // If linked projects exist, show them; otherwise show all projects from Project Management
  const displayedProjects = useMemo(() => {
    return linkedProjects.length > 0 ? linkedProjects : projects;
  }, [linkedProjects, projects]);

  return (
    <Box>
      {/* Main Projects Table */}
      {displayedProjects.length === 0 ? (
        <Paper
          p="xl"
          radius="lg"
          style={{
            background: isDark ? '#111827' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            textAlign: 'center',
          }}
        >
          <Center py={40}>
            <Stack align="center" gap="xs" style={{ maxWidth: 420 }}>
              <Box
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <IconFolders size={28} />
              </Box>
              <Text fw={700} size="md" style={{ color: isDark ? '#F9FAFB' : '#0F172A' }}>
                No Projects Found in Project Management
              </Text>
              <Text size="xs" c="dimmed">
                Create a project to start tracking delivery progress for this lead.
              </Text>
              <Group gap="xs" mt="sm">
                <Button
                  size="xs"
                  color="blue"
                  leftSection={<IconPlus size={14} />}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Create Project
                </Button>
              </Group>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Paper
          radius="lg"
          style={{
            background: isDark ? '#111827' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            overflow: 'hidden',
          }}
        >
          <Table.ScrollContainer minWidth={920}>
            <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
              <Table.Thead
                style={{
                  background: isDark ? '#0F172A' : '#F8FAFC',
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                }}
              >
                <Table.Tr>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    CODE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    PROJECT NAME
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    CLIENT / CONTACT
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    STATUS
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    PRIORITY
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, minWidth: 160 }}>
                    PROGRESS
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    DEADLINE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>
                    ACTIONS
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {displayedProjects.map((p) => {
                  const isLinked =
                    p.contactId === lead.id ||
                    p.contactId === lead.leadId ||
                    (p.clientName && lead.name && p.clientName.toLowerCase().includes(lead.name.toLowerCase()));
                  const isExpanded = expandedProjectId === p.id;
                  const modulesCount = p.modules?.length || 0;

                  return (
                    <React.Fragment key={p.id}>
                      <Table.Tr
                        style={{
                          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #F1F5F9',
                        }}
                      >
                        {/* 1. Project Code */}
                        <Table.Td>
                          <Group gap={6} wrap="nowrap">
                            <Badge
                              size="sm"
                              variant="filled"
                              color={p.progress === 100 ? 'teal' : 'blue'}
                              radius="sm"
                              style={{ fontWeight: 700, letterSpacing: '0.02em' }}
                            >
                              {p.projectId || 'PRJ'}
                            </Badge>
                            {isLinked && (
                              <Tooltip label="Linked to this lead" withArrow>
                                <IconCheck size={14} color="#10B981" />
                              </Tooltip>
                            )}
                          </Group>
                        </Table.Td>

                        {/* 2. Project Name */}
                        <Table.Td>
                          <Box>
                            <Text fw={650} size="sm" style={{ color: isDark ? '#F9FAFB' : '#0F172A' }}>
                              {p.name}
                            </Text>
                            <Group gap={4} mt={2}>
                              {p.category && (
                                <Text size="xs" c="dimmed">
                                  {p.category}
                                </Text>
                              )}
                              {p.projectType && (
                                <Text size="xs" c="dimmed">
                                  • {p.projectType}
                                </Text>
                              )}
                            </Group>
                          </Box>
                        </Table.Td>

                        {/* 3. Client / Contact */}
                        <Table.Td>
                          <Text size="xs" fw={500} style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                            {p.clientName || '—'}
                          </Text>
                          {p.projectManagerName && (
                            <Text size="xs" c="dimmed">
                              PM: {p.projectManagerName}
                            </Text>
                          )}
                        </Table.Td>

                        {/* 4. Status Badge (clickable to update) */}
                        <Table.Td>
                          {renderStatusBadge(p.status, p)}
                        </Table.Td>

                        {/* 5. Priority Badge */}
                        <Table.Td>
                          {renderPriorityBadge(p.priority)}
                        </Table.Td>

                        {/* 6. Progress Bar */}
                        <Table.Td>
                          <Box style={{ width: '100%', minWidth: 140 }}>
                            <Group justify="space-between" mb={4}>
                              <Text size="xs" fw={600} style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                                {p.progress || 0}%
                              </Text>
                              <Button
                                size="compact-xs"
                                variant="subtle"
                                color="blue"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openUpdateModal(p);
                                }}
                                style={{ fontSize: 10, height: 18, padding: '0 4px' }}
                              >
                                Edit
                              </Button>
                            </Group>
                            <Progress
                              value={p.progress || 0}
                              size="sm"
                              radius="xl"
                              color={p.progress === 100 ? 'teal' : p.progress > 50 ? 'blue' : 'orange'}
                              striped={p.status === 'In Progress'}
                              animated={p.status === 'In Progress'}
                            />
                          </Box>
                        </Table.Td>

                        {/* 7. Deadline */}
                        <Table.Td>
                          <Group gap={4} wrap="nowrap">
                            <IconCalendar size={13} color="#64748B" />
                            <Text size="xs" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                              {formatDate(p.targetEndDate || p.actualEndDate)}
                            </Text>
                          </Group>
                        </Table.Td>

                        {/* 8. Actions */}
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Group gap={4} justify="flex-end" wrap="nowrap">
                            {modulesCount > 0 && (
                              <Tooltip label={isExpanded ? 'Hide modules' : `View ${modulesCount} modules`} withArrow>
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  size="sm"
                                  onClick={() => setExpandedProjectId(isExpanded ? null : p.id)}
                                >
                                  {isExpanded ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
                                </ActionIcon>
                              </Tooltip>
                            )}

                            <Tooltip label="Open in Project Management" withArrow>
                              <ActionIcon
                                variant="subtle"
                                color="indigo"
                                size="sm"
                                onClick={() => handleOpenProjectDetails(p)}
                              >
                                <IconExternalLink size={15} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>

                      {/* Expandable Real Modules Row */}
                      {isExpanded && (
                        <Table.Tr
                          style={{
                            background: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
                          }}
                        >
                          <Table.Td colSpan={8} p="md">
                            <Box pl={{ base: 'xs', sm: 'md' }} pr={{ base: 'xs', sm: 'md' }} py={4}>
                              {/* Header row with stats & view switcher */}
                              <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="sm">
                                <Group gap="sm" align="center">
                                  <Box
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 8,
                                      background: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
                                      color: isDark ? '#A5B4FC' : '#4F46E5',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <IconListCheck size={18} />
                                  </Box>
                                  <div>
                                    <Group gap={6} align="center">
                                      <Text size="sm" fw={750} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                        Project Modules & Deliverables
                                      </Text>
                                      <Badge size="xs" variant="light" color="blue" radius="sm">
                                        {modulesCount}
                                      </Badge>
                                    </Group>
                                  </div>
                                </Group>
                              </Group>

                              {/* MODERN TABLE VIEW OF MODULES & DELIVERABLES */}
                              <Paper
                                radius="md"
                                style={{
                                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                  overflow: 'hidden',
                                  background: isDark ? '#111827' : '#FFFFFF',
                                  boxShadow: isDark
                                    ? '0 2px 8px rgba(0, 0, 0, 0.25)'
                                    : '0 2px 6px rgba(0, 0, 0, 0.02)',
                                }}
                              >
                                <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
                                  <Table.Thead
                                    style={{
                                      background: isDark ? '#0B0F17' : '#F8FAFC',
                                      borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    }}
                                  >
                                    <Table.Tr>
                                      <Table.Th style={{ width: 44, color: '#64748B', fontSize: 11, fontWeight: 700 }}>#</Table.Th>
                                      <Table.Th style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>MODULE / SPRINT</Table.Th>
                                      <Table.Th style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>ASSIGNED TO</Table.Th>
                                      <Table.Th style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>TARGET DEADLINE</Table.Th>
                                      <Table.Th style={{ minWidth: 160, color: '#64748B', fontSize: 11, fontWeight: 700 }}>PROGRESS</Table.Th>
                                      <Table.Th style={{ textAlign: 'right', color: '#64748B', fontSize: 11, fontWeight: 700 }}>STATUS</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {p.modules && p.modules.length > 0 ? (
                                      p.modules.map((m, index) => {
                                        const isDone = m.status === 'Completed' || (m.progress || 0) === 100;
                                        const inProgress = m.status === 'In Progress' || ((m.progress || 0) > 0 && (m.progress || 0) < 100);

                                        return (
                                          <Table.Tr key={m.id || index}>
                                            {/* Index / Number */}
                                            <Table.Td>
                                              <Box
                                                style={{
                                                  width: 24,
                                                  height: 24,
                                                  borderRadius: '50%',
                                                  background: isDone
                                                    ? '#10B981'
                                                    : inProgress
                                                    ? isDark ? '#7C2D12' : '#FFEDD5'
                                                    : isDark ? '#1E293B' : '#F1F5F9',
                                                  color: isDone
                                                    ? '#FFFFFF'
                                                    : inProgress
                                                    ? isDark ? '#FDBA74' : '#C2410C'
                                                    : '#64748B',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  fontWeight: 750,
                                                  fontSize: 11,
                                                }}
                                              >
                                                {isDone ? <IconCheck size={13} stroke={3} /> : index + 1}
                                              </Box>
                                            </Table.Td>

                                            {/* Module Name & Desc */}
                                            <Table.Td>
                                              <Text fw={700} size="xs" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                                {m.name}
                                              </Text>
                                              {m.description && (
                                                <Text size="11px" c="dimmed" lineClamp={1}>
                                                  {m.description}
                                                </Text>
                                              )}
                                            </Table.Td>

                                            {/* Assigned Developer */}
                                            <Table.Td>
                                              <Group gap={4} wrap="nowrap">
                                                <IconUser size={13} color="#64748B" />
                                                <Text size="xs" style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                                                  {m.assignedTo || 'Unassigned'}
                                                </Text>
                                              </Group>
                                            </Table.Td>

                                            {/* Deadline */}
                                            <Table.Td>
                                              <Group gap={4} wrap="nowrap">
                                                <IconCalendar size={13} color="#64748B" />
                                                <Text size="xs" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                                                  {m.deadline || '—'}
                                                </Text>
                                              </Group>
                                            </Table.Td>

                                            {/* Progress Bar */}
                                            <Table.Td>
                                              <Box style={{ minWidth: 140 }}>
                                                <Group justify="space-between" mb={3}>
                                                  <Text size="11px" fw={700} style={{ color: isDone ? '#10B981' : isDark ? '#E2E8F0' : '#1E293B' }}>
                                                    {m.progress || 0}% Completed
                                                  </Text>
                                                </Group>
                                                <Progress
                                                  value={m.progress || 0}
                                                  size="sm"
                                                  radius="xl"
                                                  color={isDone ? 'teal' : inProgress ? 'orange' : 'blue'}
                                                  striped={inProgress}
                                                  animated={inProgress}
                                                />
                                              </Box>
                                            </Table.Td>

                                            {/* Status Badge */}
                                            <Table.Td style={{ textAlign: 'right' }}>
                                              <Badge
                                                size="xs"
                                                variant="light"
                                                color={isDone ? 'teal' : inProgress ? 'orange' : 'gray'}
                                                radius="sm"
                                                style={{ fontWeight: 650 }}
                                              >
                                                {isDone ? 'Completed' : inProgress ? 'In Progress' : 'Not Started'}
                                              </Badge>
                                            </Table.Td>
                                          </Table.Tr>
                                        );
                                      })
                                    ) : (
                                      <Table.Tr>
                                        <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '24px 0' }}>
                                          <Text size="xs" c="dimmed">No deliverable modules added yet</Text>
                                        </Table.Td>
                                      </Table.Tr>
                                    )}
                                  </Table.Tbody>
                                </Table>
                              </Paper>
                            </Box>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      {/* MODAL 1: Update Progress Modal */}
      <Modal
        opened={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title={
          <Text fw={700} size="sm">
            Update Progress — {selectedForUpdate?.name}
          </Text>
        }
        radius="md"
        centered
      >
        <Stack gap="md">
          <Box>
            <Text size="xs" fw={600} mb={6}>
              Completion Percentage: {updateProgressVal}%
            </Text>
            <Slider
              value={updateProgressVal}
              onChange={setUpdateProgressVal}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' },
              ]}
              color="blue"
              mb="md"
            />
          </Box>

          <Select
            label="Project Status"
            value={updateStatusVal}
            onChange={(val) => setUpdateStatusVal(val || 'In Progress')}
            data={[
              { value: 'Planning', label: 'Planning' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'In Review', label: 'In Review' },
              { value: 'On Hold', label: 'On Hold' },
              { value: 'Completed', label: 'Completed' },
            ]}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" size="xs" onClick={() => setUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              color="blue"
              loading={savingUpdate}
              onClick={handleSaveProgress}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 2: Create Project Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={
          <Text fw={700} size="sm">
            Create Project for {lead.name}
          </Text>
        }
        radius="md"
        centered
      >
        <Stack gap="sm">
          <TextInput
            label="Project Name"
            placeholder="e.g. Website Revamp, Mobile App"
            required
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />

          <Group grow>
            <Select
              label="Category"
              value={newProjectCategory}
              onChange={(val) => setNewProjectCategory(val || 'Web Application')}
              data={[
                { value: 'Web Application', label: 'Web Application' },
                { value: 'Mobile App', label: 'Mobile App' },
                { value: 'UI/UX Design', label: 'UI/UX Design' },
                { value: 'DevOps / Cloud', label: 'DevOps / Cloud' },
                { value: 'Maintenance', label: 'Maintenance' },
              ]}
            />
            <Select
              label="Priority"
              value={newProjectPriority}
              onChange={(val) => setNewProjectPriority(val || 'Medium')}
              data={[
                { value: 'Critical', label: 'Critical' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' },
              ]}
            />
          </Group>

          <Group grow>
            <Select
              label="Status"
              value={newProjectStatus}
              onChange={(val) => setNewProjectStatus(val || 'In Progress')}
              data={[
                { value: 'Planning', label: 'Planning' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'On Hold', label: 'On Hold' },
                { value: 'Completed', label: 'Completed' },
              ]}
            />
            <TextInput
              label="Target Delivery Date"
              placeholder="DD-MM-YYYY"
              value={newProjectTargetDate}
              onChange={(e) => setNewProjectTargetDate(e.target.value)}
            />
          </Group>

          <NumberInput
            label="Estimated Budget (₹)"
            placeholder="50000"
            value={newProjectBudget}
            onChange={setNewProjectBudget}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" size="xs" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              color="blue"
              loading={creatingProject}
              onClick={handleCreateProject}
            >
              Create Project
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 3: Link Existing Project Modal */}
      <Modal
        opened={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title={
          <Text fw={700} size="sm">
            Link Project to {lead.name}
          </Text>
        }
        radius="md"
        centered
      >
        <Stack gap="md">
          <Select
            label="Select Existing Project from Project Management"
            placeholder="Choose project"
            value={selectedExistingProjectId}
            onChange={setSelectedExistingProjectId}
            data={unlinkedProjects.map((p) => ({
              value: p.id,
              label: `${p.projectId}: ${p.name} (${p.clientName || 'No Client'}) - ${p.status} (${p.progress}%)`,
            }))}
            searchable
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" size="xs" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              color="indigo"
              loading={linkingProject}
              disabled={!selectedExistingProjectId}
              onClick={handleLinkProject}
            >
              Link to Lead
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 4: Add Module Modal */}
      <Modal
        opened={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title={
          <Text fw={700} size="sm">
            Add Deliverable Module to {selectedForUpdate?.name}
          </Text>
        }
        radius="md"
        centered
      >
        <Stack gap="sm">
          <TextInput
            label="Module Name"
            placeholder="e.g. Auth Service, Payment Gateway"
            required
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.target.value)}
          />

          <Group grow>
            <TextInput
              label="Assigned Developer"
              placeholder="Developer Name"
              value={newModuleDev}
              onChange={(e) => setNewModuleDev(e.target.value)}
            />
            <TextInput
              label="Deadline"
              placeholder="DD-MM-YYYY"
              value={newModuleDeadline}
              onChange={(e) => setNewModuleDeadline(e.target.value)}
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" size="xs" onClick={() => setModuleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              color="blue"
              loading={addingModule}
              onClick={handleAddModule}
            >
              Add Module
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default LeadProgressSection;
