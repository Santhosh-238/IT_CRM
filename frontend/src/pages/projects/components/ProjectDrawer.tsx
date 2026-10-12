import React from 'react';
import {
  Drawer,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Paper,
  Box,
  SimpleGrid,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconFolders,
  IconEdit,
  IconTrash,
  IconUser,
  IconUsers,
  IconCalendar,
  IconBrandFigma,
  IconBrandGithub,
  IconWorld,
} from '@tabler/icons-react';
import { Project } from '../../../types/project';

interface ProjectDrawerProps {
  opened: boolean;
  onClose: () => void;
  project?: Project | null;
  onEdit: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({
  opened,
  onClose,
  project,
  onEdit,
  onDelete,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  if (!project) return null;

  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0';
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const valueColor = isDark ? '#F8FAFC' : '#0F172A';

  const statusColorMap: Record<string, string> = {
    Planning: 'blue',
    'In Progress': 'teal',
    'In Review': 'orange',
    'On Hold': 'yellow',
    Completed: 'green',
    Cancelled: 'red',
  };

  const priorityColorMap: Record<string, string> = {
    Low: 'gray',
    Medium: 'yellow',
    High: 'red',
    Critical: 'red',
    Urgent: 'orange',
  };

  const clientMatch = (project.clientName || '').match(/^(.*?)\s*\((.*?)\)$/);
  const company = clientMatch ? clientMatch[1].trim() : (project.clientName || '—');
  const clientPerson = clientMatch ? clientMatch[2].trim() : '—';

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="520px"
      title={
        <Group gap="xs">
          <IconFolders size={20} color={isDark ? '#818CF8' : '#2563EB'} />
          <Text fw={700} size="md" style={{ color: valueColor }}>
            Project Overview
          </Text>
        </Group>
      }
      styles={{
        header: {
          background: isDark ? '#0F172A' : '#F8FAFC',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
        },
        body: {
          background: isDark ? '#0A0F1D' : '#F8FAFC',
          padding: 20,
        },
      }}
    >
      <Stack gap="md">
        {/* Top Header Card */}
        <Paper p="md" radius="lg" style={{ background: cardBg, border: cardBorder }}>
          <Group justify="space-between" align="flex-start">
            <Box style={{ flex: 1 }}>
              <Group gap="xs" mb={6}>
                <Badge variant="filled" color="blue" size="sm" radius="sm">
                  {project.projectId}
                </Badge>
                <Badge variant="light" color={statusColorMap[project.status] || 'blue'} size="sm">
                  {project.status}
                </Badge>
                <Badge variant="light" color={priorityColorMap[project.priority] || 'gray'} size="sm">
                  {project.priority} Priority
                </Badge>
              </Group>

              <Text fw={700} size="lg" style={{ color: valueColor, lineHeight: 1.3 }}>
                {project.name}
              </Text>

              {/* Start & End Dates */}
              {(project.startDate || project.targetEndDate) && (
                <Group gap="lg" mt="xs">
                  <Group gap={6}>
                    <IconCalendar size={14} color="#94A3B8" />
                    <Text size="12px" fw={500} style={{ color: labelColor }}>
                      Start Date:{' '}
                      <Text span fw={600} style={{ color: valueColor }}>
                        {project.startDate || '—'}
                      </Text>
                    </Text>
                  </Group>
                  <Group gap={6}>
                    <IconCalendar size={14} color={project.isOverdue ? '#EF4444' : '#94A3B8'} />
                    <Text size="12px" fw={500} style={{ color: labelColor }}>
                      End Date:{' '}
                      <Text
                        span
                        fw={600}
                        style={{ color: project.isOverdue ? '#EF4444' : valueColor }}
                      >
                        {project.targetEndDate || '—'}
                      </Text>
                    </Text>
                    {project.isOverdue && (
                      <Badge color="red" size="xs" variant="filled">
                        Overdue
                      </Badge>
                    )}
                  </Group>
                </Group>
              )}
            </Box>
          </Group>

          {/* Quick Action Buttons */}
          <Group gap="xs" mt="md">
            <Button
              size="xs"
              variant="light"
              color="blue"
              radius="md"
              leftSection={<IconEdit size={14} />}
              onClick={() => onEdit(project)}
            >
              Edit Project
            </Button>
            {onDelete && (
              <Button
                size="xs"
                variant="light"
                color="red"
                radius="md"
                leftSection={<IconTrash size={14} />}
                onClick={() => onDelete(project)}
              >
                Delete
              </Button>
            )}
          </Group>
        </Paper>

        {/* Client Details */}
        <Paper p="md" radius="lg" style={{ background: cardBg, border: cardBorder }}>
          <Group gap="xs" mb="xs">
            <IconUser size={16} color={isDark ? '#34D399' : '#059669'} />
            <Text
              fw={700}
              size="xs"
              tt="uppercase"
              style={{ color: isDark ? '#34D399' : '#059669', letterSpacing: '0.05em' }}
            >
              Client Information
            </Text>
          </Group>

          <SimpleGrid cols={2} spacing="xs">
            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Company Name
              </Text>
              <Text size="xs" fw={700} style={{ color: valueColor }} mt={2}>
                {company}
              </Text>
            </div>
            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Client Contact Person
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {clientPerson}
              </Text>
            </div>
          </SimpleGrid>
        </Paper>

        {/* Tech Team & Ownership */}
        <Paper p="md" radius="lg" style={{ background: cardBg, border: cardBorder }}>
          <Group gap="xs" mb="xs">
            <IconUsers size={16} color={isDark ? '#FB923C' : '#EA580C'} />
            <Text
              fw={700}
              size="xs"
              tt="uppercase"
              style={{ color: isDark ? '#FB923C' : '#EA580C', letterSpacing: '0.05em' }}
            >
              Team & Leadership
            </Text>
          </Group>

          <Box mb="sm">
            <Text size="11px" fw={600} style={{ color: labelColor }}>
              Project TL
            </Text>
            <Text size="13px" fw={700} style={{ color: valueColor }} mt={4}>
              {project.projectManagerName && project.projectManagerName !== 'Unassigned'
                ? project.projectManagerName
                : '—'}
            </Text>
          </Box>

          <Box>
            <Text size="11px" fw={600} style={{ color: labelColor }} mb={6}>
              Assigned Team Members ({project.teamMembers?.length || 0})
            </Text>
            <Group gap={6} wrap="wrap">
              {Array.isArray(project.teamMembers) && project.teamMembers.length > 0 ? (
                project.teamMembers.map((member, idx) => (
                  <Badge key={idx} variant="light" color="blue" radius="md" size="sm">
                    {member}
                  </Badge>
                ))
              ) : (
                <Text size="xs" c="dimmed">
                  No team members assigned
                </Text>
              )}
            </Group>
          </Box>
        </Paper>

        {/* Deliverables & Quick Links */}
        {(project.figmaUrl || project.githubUrl || project.liveUrl) && (
          <Paper p="md" radius="lg" style={{ background: cardBg, border: cardBorder }}>
            <Text
              fw={700}
              size="xs"
              tt="uppercase"
              mb="xs"
              style={{ color: labelColor, letterSpacing: '0.05em' }}
            >
              Deliverables & Repositories
            </Text>
            <Group gap="xs">
              {project.figmaUrl && (
                <Button
                  component="a"
                  href={project.figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  variant="default"
                  radius="md"
                  leftSection={<IconBrandFigma size={14} color="#EA580C" />}
                >
                  Figma Specs
                </Button>
              )}
              {project.githubUrl && (
                <Button
                  component="a"
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  variant="default"
                  radius="md"
                  leftSection={<IconBrandGithub size={14} />}
                >
                  GitHub
                </Button>
              )}
              {project.liveUrl && (
                <Button
                  component="a"
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  variant="default"
                  radius="md"
                  leftSection={<IconWorld size={14} color="#059669" />}
                >
                  Live Preview
                </Button>
              )}
            </Group>
          </Paper>
        )}

        {/* Description / Scope */}
        {project.description && (
          <Paper p="md" radius="lg" style={{ background: cardBg, border: cardBorder }}>
            <Text fw={700} size="xs" tt="uppercase" mb={4} style={{ color: labelColor }}>
              Scope of Work
            </Text>
            <Text size="xs" style={{ color: valueColor, whiteSpace: 'pre-wrap' }}>
              {project.description}
            </Text>
          </Paper>
        )}
      </Stack>
    </Drawer>
  );
};

export default ProjectDrawer;
