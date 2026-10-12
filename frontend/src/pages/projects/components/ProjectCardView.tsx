import React from 'react';
import {
  SimpleGrid,
  Paper,
  Text,
  Badge,
  Group,
  Box,
  Progress,
  Avatar,
  ActionIcon,
  Menu,
  Divider,
  Center,
  Loader,
  Button,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconUser,
  IconFolders,
  IconPlus,
} from '@tabler/icons-react';
import { Project } from '../../../types/project';

interface ProjectCardViewProps {
  projects: Project[];
  loading?: boolean;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onAddNew?: () => void;
}

export const ProjectCardView: React.FC<ProjectCardViewProps> = ({
  projects,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const statusColorMap: Record<string, string> = {
    Planning: 'blue',
    'In Progress': 'indigo',
    'In Review': 'orange',
    'On Hold': 'yellow',
    Completed: 'teal',
    Cancelled: 'red',
  };

  const priorityColorMap: Record<string, string> = {
    Low: 'gray',
    Medium: 'blue',
    High: 'orange',
    Critical: 'red',
  };

  if (loading && projects.length === 0) {
    return (
      <Paper
        p="xl"
        radius="lg"
        mt="md"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
        }}
      >
        <Center py={60}>
          <Group gap="md">
            <Loader size="sm" color="blue" />
            <Text size="sm" c="dimmed">
              Loading projects...
            </Text>
          </Group>
        </Center>
      </Paper>
    );
  }

  if (!loading && projects.length === 0) {
    return (
      <Paper
        p="xl"
        radius="lg"
        mt="md"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          textAlign: 'center',
        }}
      >
        <Center py={40}>
          <Box style={{ maxWidth: 360 }}>
            <Box
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                marginBottom: 12,
              }}
            >
              <IconFolders size={28} />
            </Box>
            <Text fw={700} size="md" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              No Projects Found
            </Text>
            <Text size="xs" c="dimmed" mt={4} mb="md">
              There are no projects matching your filter criteria.
            </Text>
            {onAddNew && (
              <Button
                size="xs"
                radius="md"
                leftSection={<IconPlus size={14} />}
                onClick={onAddNew}
                style={{
                  backgroundColor: '#2563EB',
                }}
              >
                Create Project
              </Button>
            )}
          </Box>
        </Center>
      </Paper>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt="md">
      {projects.map((project) => (
        <Paper
          key={project.id}
          p="md"
          radius="md"
          style={{
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onClick={() => onView(project)}
        >
          {/* Header: Project ID, Priority and Menu */}
          <Group justify="space-between" align="center" mb="xs">
            <Group gap="xs">
              <Badge variant="filled" color="blue" size="xs" style={{ fontFamily: 'monospace' }}>
                {project.projectId}
              </Badge>
              <Badge variant="light" color={statusColorMap[project.status] || 'blue'} size="xs">
                {project.status}
              </Badge>
            </Group>

            <Group gap={4} onClick={(e) => e.stopPropagation()}>
              <Badge variant="subtle" color={priorityColorMap[project.priority] || 'gray'} size="xs">
                {project.priority}
              </Badge>

              <Menu shadow="md" width={150} position="bottom-end">
                <Menu.Target>
                  <ActionIcon size="xs" variant="subtle" color="gray">
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconEye size={13} />} onClick={() => onView(project)}>
                    View Details
                  </Menu.Item>
                  <Menu.Item leftSection={<IconEdit size={13} />} onClick={() => onEdit(project)}>
                    Edit Project
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
          </Group>

          {/* Project Title & Category */}
          <Text fw={700} size="md" truncate style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            {project.name}
          </Text>
          <Text size="xs" c="dimmed" truncate mb="sm">
            {project.category}
          </Text>

          {/* Client & PM */}
          <Group justify="space-between" align="center" mb="sm">
            <Group gap={6}>
              <IconUser size={13} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text size="xs" fw={600} truncate style={{ color: isDark ? '#CBD5E1' : '#475569', maxWidth: 130 }}>
                {project.clientName}
              </Text>
            </Group>

            <Group gap={6}>
              <Avatar size={20} radius="xl" color="blue">
                {project.projectManagerName?.[0] || 'P'}
              </Avatar>
              <Text size="xs" fw={500} style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                {project.projectManagerName || 'Unassigned'}
              </Text>
            </Group>
          </Group>

          {/* Progress Bar */}
          <Box mb="xs">
            <Group justify="space-between" mb={4}>
              <Text size="11px" fw={600} style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                Progress
              </Text>
              <Text size="11px" fw={700} c="blue">
                {project.progress}%
              </Text>
            </Group>
            <Progress
              value={project.progress}
              size="sm"
              radius="xl"
              color={project.progress >= 100 ? '#10B981' : '#2563EB'}
            />
          </Box>

          <Divider my="xs" color={isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'} />

          {/* Footer: Budget & Target Due Date */}
          <Group justify="space-between" align="center">
            <Box>
              <Text size="10px" fw={600} c="dimmed">
                BUDGET
              </Text>
              <Text size="xs" fw={800} style={{ color: isDark ? '#34D399' : '#059669' }}>
                {project.estimatedBudget ? `₹${Number(project.estimatedBudget).toLocaleString()}` : '—'}
              </Text>
            </Box>

            <Box style={{ textAlign: 'right' }}>
              <Text size="10px" fw={600} c="dimmed">
                DUE DATE
              </Text>
              <Group gap={4} justify="flex-end">
                <IconCalendar size={12} color={project.isOverdue ? '#EF4444' : '#94A3B8'} />
                <Text size="xs" fw={600} style={{ color: project.isOverdue ? '#EF4444' : isDark ? '#E2E8F0' : '#475569' }}>
                  {project.targetEndDate || '—'}
                </Text>
              </Group>
            </Box>
          </Group>
        </Paper>
      ))}
    </SimpleGrid>
  );
};

export default ProjectCardView;
