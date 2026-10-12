import React, { useState } from 'react';
import {
  Box,
  Paper,
  Text,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Tooltip,
  Avatar,
  Menu,
  Button,
  useComputedColorScheme,
  ScrollArea,
} from '@mantine/core';
import {
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconUser,
  IconBrandGithub,
  IconBrandFigma,
  IconWorld,
  IconDotsVertical,
  IconFolders,
  IconArrowRight,
  IconClock,
} from '@tabler/icons-react';
import { Project } from '../../../types/project';
import { useProject } from '../../../context/ProjectContext';

interface ProjectPipelineViewProps {
  projects: Project[];
  loading?: boolean;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onAddNewWithStatus?: (status: string) => void;
}

interface PipelineStageConfig {
  id: string;
  label: string;
  color: string;
  headerBgLight: string;
  headerBgDark: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
}

export const ProjectPipelineView: React.FC<ProjectPipelineViewProps> = ({
  projects,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onAddNewWithStatus,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { updateProject } = useProject();
  const [movingId, setMovingId] = useState<string | null>(null);

  const stages: PipelineStageConfig[] = [
    {
      id: 'Planning',
      label: 'Planning',
      color: '#3B82F6',
      headerBgLight: '#EFF6FF',
      headerBgDark: 'rgba(59, 130, 246, 0.15)',
      badgeBg: '#DBEAFE',
      badgeText: '#1E40AF',
      icon: '📌',
    },
    {
      id: 'In Progress',
      label: 'In Progress',
      color: '#F59E0B',
      headerBgLight: '#FFFBEB',
      headerBgDark: 'rgba(245, 158, 11, 0.15)',
      badgeBg: '#FEF3C7',
      badgeText: '#92400E',
      icon: '🚀',
    },
    {
      id: 'In Review',
      label: 'In Review',
      color: '#8B5CF6',
      headerBgLight: '#F5F3FF',
      headerBgDark: 'rgba(139, 92, 246, 0.15)',
      badgeBg: '#EDE9FE',
      badgeText: '#5B21B6',
      icon: '🔍',
    },
    {
      id: 'On Hold',
      label: 'On Hold',
      color: '#EC4899',
      headerBgLight: '#FDF2F8',
      headerBgDark: 'rgba(236, 72, 153, 0.15)',
      badgeBg: '#FCE7F3',
      badgeText: '#9D174D',
      icon: '⏸️',
    },
    {
      id: 'Completed',
      label: 'Completed',
      color: '#10B981',
      headerBgLight: '#ECFDF5',
      headerBgDark: 'rgba(16, 185, 129, 0.15)',
      badgeBg: '#D1FAE5',
      badgeText: '#065F46',
      icon: '✅',
    },
  ];

  const stageOrder = stages.map((s) => s.id);

  const handleMoveStage = async (project: Project, targetStage: string) => {
    if (project.status === targetStage) return;
    setMovingId(project.id);
    await updateProject(project.id, { status: targetStage });
    setMovingId(null);
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Urgent':
      case 'Critical':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
          text: isDark ? '#FCA5A5' : '#B91C1C',
          border: '#F87171',
        };
      case 'High':
        return {
          bg: isDark ? 'rgba(249, 115, 22, 0.2)' : '#FFEDD5',
          text: isDark ? '#FDBA74' : '#C2410C',
          border: '#FB923C',
        };
      case 'Medium':
        return {
          bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
          text: isDark ? '#93C5FD' : '#1D4ED8',
          border: '#60A5FA',
        };
      default:
        return {
          bg: isDark ? 'rgba(100, 116, 139, 0.2)' : '#F1F5F9',
          text: isDark ? '#CBD5E1' : '#475569',
          border: '#94A3B8',
        };
    }
  };

  return (
    <ScrollArea type="auto" offsetScrollbars>
      <Box style={{ minWidth: 1200, paddingBottom: 16 }}>
        <Group align="flex-start" gap="md" wrap="nowrap">
          {stages.map((stage, stageIndex) => {
            const stageProjects = projects.filter((p) => {
              if (stage.id === 'In Progress') {
                return p.status === 'In Progress' || !stageOrder.includes(p.status);
              }
              return p.status === stage.id;
            });

            return (
              <Box
                key={stage.id}
                style={{
                  flex: '1 1 0',
                  minWidth: 260,
                  maxWidth: 320,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Column Pipeline Stage Header */}
                <Paper
                  p="sm"
                  radius="md"
                  mb="xs"
                  style={{
                    backgroundColor: isDark ? stage.headerBgDark : stage.headerBgLight,
                    border: isDark ? `1px solid ${stage.color}33` : `1px solid ${stage.color}44`,
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Group gap={6}>
                      <Text size="sm">{stage.icon}</Text>
                      <Text
                        fw={700}
                        size="13px"
                        style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}
                      >
                        {stage.label}
                      </Text>
                      <Badge
                        size="sm"
                        variant="filled"
                        style={{
                          backgroundColor: stage.color,
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: 11,
                          padding: '0 6px',
                          height: 18,
                        }}
                      >
                        {stageProjects.length}
                      </Badge>
                    </Group>

                    {onAddNewWithStatus && (
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="gray"
                        radius="sm"
                        title={`Add project in ${stage.label}`}
                        onClick={() => onAddNewWithStatus(stage.id)}
                      >
                        <IconPlus size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                </Paper>

                {/* Column Body: Pipeline Project Cards */}
                <Stack gap="xs" style={{ minHeight: 350 }}>
                  {stageProjects.length > 0 ? (
                    stageProjects.map((project) => {
                      const priorityStyle = getPriorityStyle(project.priority);
                      const isUpdating = movingId === project.id;

                      const prevStage = stageIndex > 0 ? stages[stageIndex - 1].id : null;
                      const nextStage = stageIndex < stages.length - 1 ? stages[stageIndex + 1].id : null;

                      return (
                        <Paper
                          key={project.id}
                          p="sm"
                          radius="md"
                          style={{
                            backgroundColor: isDark ? '#111827' : '#FFFFFF',
                            border: isDark
                              ? '1px solid rgba(255, 255, 255, 0.08)'
                              : '1px solid #E2E8F0',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                            opacity: isUpdating ? 0.6 : 1,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Card Top: Code + Priority + Menu */}
                          <Group justify="space-between" align="center" mb={6}>
                            <Group gap={6}>
                              <Badge
                                size="xs"
                                variant="outline"
                                color="blue"
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  fontSize: 10,
                                }}
                              >
                                {project.projectId}
                              </Badge>

                              <Badge
                                size="xs"
                                variant="filled"
                                style={{
                                  backgroundColor: priorityStyle.bg,
                                  color: priorityStyle.text,
                                  fontWeight: 700,
                                  fontSize: 10,
                                  textTransform: 'none',
                                }}
                              >
                                {project.priority}
                              </Badge>
                            </Group>

                            <Menu position="bottom-end" shadow="md" width={140}>
                              <Menu.Target>
                                <ActionIcon size="xs" variant="subtle" color="gray">
                                  <IconDotsVertical size={13} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<IconEye size={13} />}
                                  onClick={() => onView(project)}
                                >
                                  View
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<IconEdit size={13} />}
                                  onClick={() => onEdit(project)}
                                >
                                  Edit
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={13} />}
                                  onClick={() => onDelete(project)}
                                >
                                  Delete
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>

                          {/* Project Name (Clickable) */}
                          <Text
                            fw={700}
                            size="13px"
                            mb={2}
                            onClick={() => onView(project)}
                            style={{
                              color: isDark ? '#F8FAFC' : '#0F172A',
                              cursor: 'pointer',
                              lineHeight: 1.3,
                            }}
                          >
                            {project.name}
                          </Text>

                          {/* Client & Company Name */}
                          <Text size="xs" c="dimmed" mb={8} lineClamp={1}>
                            {project.clientName || 'Direct Client'}
                          </Text>

                          {/* TL & Team Members */}
                          <Group justify="space-between" align="center" mb={8}>
                            <Group gap={4}>
                              <Tooltip label={`TL: ${project.projectManagerName || 'Unassigned'}`}>
                                <Box
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: isDark ? '#94A3B8' : '#64748B',
                                  }}
                                >
                                  <IconUser size={13} color="#2563EB" />
                                  <Text size="11px" fw={600} truncate style={{ maxWidth: 100 }}>
                                    {project.projectManagerName || 'No TL'}
                                  </Text>
                                </Box>
                              </Tooltip>
                            </Group>

                            {/* Team Member Avatars Stack */}
                            {project.teamMembers && project.teamMembers.length > 0 && (
                              <Tooltip label={`Team: ${project.teamMembers.join(', ')}`}>
                                <Avatar.Group spacing="xs">
                                  {project.teamMembers.slice(0, 3).map((m, i) => (
                                    <Avatar
                                      key={i}
                                      size={20}
                                      radius="xl"
                                      color="blue"
                                      style={{ fontSize: 9, fontWeight: 700 }}
                                    >
                                      {m.slice(0, 2).toUpperCase()}
                                    </Avatar>
                                  ))}
                                  {project.teamMembers.length > 3 && (
                                    <Avatar size={20} radius="xl" color="gray" style={{ fontSize: 9 }}>
                                      +{project.teamMembers.length - 3}
                                    </Avatar>
                                  )}
                                </Avatar.Group>
                              </Tooltip>
                            )}
                          </Group>

                          {/* Dates: Start & End */}
                          {(project.startDate || project.targetEndDate) && (
                            <Group gap={4} mb={8} style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                              <IconCalendar size={12} />
                              <Text size="11px">
                                {project.startDate || 'TBD'} ➔ {project.targetEndDate || 'TBD'}
                              </Text>
                            </Group>
                          )}

                          {/* Deliverable & Repo Links */}
                          {(project.githubUrl || project.figmaUrl || project.liveUrl) && (
                            <Group gap={6} mb={8}>
                              {project.githubUrl && (
                                <Tooltip label="GitHub Repo">
                                  <ActionIcon
                                    size="xs"
                                    variant="light"
                                    color="gray"
                                    component="a"
                                    href={project.githubUrl}
                                    target="_blank"
                                  >
                                    <IconBrandGithub size={12} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                              {project.figmaUrl && (
                                <Tooltip label="Figma Design">
                                  <ActionIcon
                                    size="xs"
                                    variant="light"
                                    color="orange"
                                    component="a"
                                    href={project.figmaUrl}
                                    target="_blank"
                                  >
                                    <IconBrandFigma size={12} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                              {project.liveUrl && (
                                <Tooltip label="Live Site">
                                  <ActionIcon
                                    size="xs"
                                    variant="light"
                                    color="blue"
                                    component="a"
                                    href={project.liveUrl}
                                    target="_blank"
                                  >
                                    <IconWorld size={12} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </Group>
                          )}

                          {/* Pipeline Stage Transition Bar */}
                          <Box
                            pt={6}
                            mt={4}
                            style={{
                              borderTop: isDark
                                ? '1px solid rgba(255, 255, 255, 0.06)'
                                : '1px solid #F1F5F9',
                            }}
                          >
                            <Group justify="space-between" align="center">
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                disabled={!prevStage || isUpdating}
                                onClick={() => prevStage && handleMoveStage(project, prevStage)}
                                title={prevStage ? `Move back to ${prevStage}` : 'At first stage'}
                              >
                                <IconChevronLeft size={13} />
                              </ActionIcon>

                              {/* Quick Move Menu to Any Stage */}
                              <Menu position="bottom" shadow="sm" width={140}>
                                <Menu.Target>
                                  <Button
                                    size="compact-xs"
                                    variant="subtle"
                                    color="gray"
                                    style={{ fontSize: 10, height: 20, padding: '0 4px' }}
                                  >
                                    Move Stage
                                  </Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  {stages.map((s) => (
                                    <Menu.Item
                                      key={s.id}
                                      disabled={project.status === s.id}
                                      onClick={() => handleMoveStage(project, s.id)}
                                      style={{ fontSize: 11 }}
                                    >
                                      {s.icon} {s.label}
                                    </Menu.Item>
                                  ))}
                                </Menu.Dropdown>
                              </Menu>

                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="blue"
                                disabled={!nextStage || isUpdating}
                                onClick={() => nextStage && handleMoveStage(project, nextStage)}
                                title={nextStage ? `Advance to ${nextStage}` : 'At final stage'}
                              >
                                <IconChevronRight size={13} />
                              </ActionIcon>
                            </Group>
                          </Box>
                        </Paper>
                      );
                    })
                  ) : (
                    <Paper
                      p="lg"
                      radius="md"
                      style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                        border: isDark
                          ? '1px dashed rgba(255, 255, 255, 0.08)'
                          : '1px dashed #E2E8F0',
                        textAlign: 'center',
                      }}
                    >
                      <Text size="xs" c="dimmed">
                        No projects in {stage.label}
                      </Text>
                    </Paper>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Group>
      </Box>
    </ScrollArea>
  );
};

export default ProjectPipelineView;
