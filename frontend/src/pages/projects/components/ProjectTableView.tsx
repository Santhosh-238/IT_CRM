import React from 'react';
import {
  Table,
  Paper,
  Text,
  Group,
  ActionIcon,
  Box,
  Avatar,
  Tooltip,
  Center,
  Loader,
  Button,
  Pagination,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconFolders,
  IconPlus,
  IconCaretUpFilled,
  IconCaretDownFilled,
  IconChevronRight,
  IconChevronLeft,
  IconBrandGithub,
  IconBrandFigma,
  IconWorld,
  IconCalendar,
  IconBuildingSkyscraper,
  IconUser,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Project } from '../../../types/project';

interface ProjectTableViewProps {
  projects: Project[];
  totalProjects: number;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onAddNew: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;
}

export const ProjectTableView: React.FC<ProjectTableViewProps> = ({
  projects,
  totalProjects,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onAddNew,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onSortChange,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  // Format date cleanly and guarantee no line breaking
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    const d = dayjs(dateStr);
    if (d.isValid()) return d.format('DD-MM-YYYY');
    return dateStr;
  };

  // Modern Priority Pill with colored indicator dot
  const renderPriorityBadge = (priority: string) => {
    const p = (priority || 'Medium').toLowerCase();
    let bg = isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7';
    let color = isDark ? '#FBBF24' : '#B45309';
    let border = isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A';
    let dot = '#F59E0B';

    if (p === 'high') {
      bg = isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2';
      color = isDark ? '#F87171' : '#B91C1C';
      border = isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA';
      dot = '#EF4444';
    } else if (p === 'urgent' || p === 'critical') {
      bg = isDark ? 'rgba(234, 88, 12, 0.12)' : '#FFEDD5';
      color = isDark ? '#FB923C' : '#C2410C';
      border = isDark ? '1px solid rgba(234, 88, 12, 0.3)' : '1px solid #FED7AA';
      dot = '#EA580C';
    } else if (p === 'low') {
      bg = isDark ? 'rgba(100, 116, 139, 0.12)' : '#F1F5F9';
      color = isDark ? '#94A3B8' : '#475569';
      border = isDark ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid #E2E8F0';
      dot = '#64748B';
    }

    return (
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 16,
          backgroundColor: bg,
          color: color,
          border: border,
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}
      >
        <Box
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: dot,
            flexShrink: 0,
          }}
        />
        {priority || 'Medium'}
      </Box>
    );
  };

  // Modern Status Pill with colored indicator dot
  const renderStatusBadge = (status: string) => {
    const s = (status || 'Not Started').toLowerCase();
    let bg = isDark ? 'rgba(100, 116, 139, 0.12)' : '#F1F5F9';
    let color = isDark ? '#94A3B8' : '#475569';
    let border = isDark ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid #E2E8F0';
    let dot = '#94A3B8';

    if (s.includes('progress')) {
      bg = isDark ? 'rgba(16, 185, 129, 0.12)' : '#DCFCE7';
      color = isDark ? '#34D399' : '#15803D';
      border = isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #BBF7D0';
      dot = '#10B981';
    } else if (s.includes('planning')) {
      bg = isDark ? 'rgba(14, 165, 233, 0.12)' : '#E0F2FE';
      color = isDark ? '#38BDF8' : '#0369A1';
      border = isDark ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid #BAE6FD';
      dot = '#0EA5E9';
    } else if (s.includes('hold')) {
      bg = isDark ? 'rgba(244, 63, 94, 0.12)' : '#FFE4E6';
      color = isDark ? '#FB7185' : '#BE123C';
      border = isDark ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid #FECDD3';
      dot = '#F43F5E';
    } else if (s.includes('completed')) {
      bg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5';
      color = isDark ? '#34D399' : '#047857';
      border = isDark ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid #A7F3D0';
      dot = '#059669';
    }

    return (
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 16,
          backgroundColor: bg,
          color: color,
          border: border,
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}
      >
        <Box
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: dot,
            flexShrink: 0,
          }}
        />
        {status || 'Not Started'}
      </Box>
    );
  };

  // Direct readable Team member names
  const renderTeamMembers = (members: string[] = []) => {
    const list = Array.isArray(members) && members.length > 0 ? members : [];
    if (list.length === 0) {
      return (
        <Text size="13px" c="dimmed">
          —
        </Text>
      );
    }

    const maxVisible = 3;
    const visible = list.slice(0, maxVisible);
    const extraCount = list.length - maxVisible;

    return (
      <Group gap={4} wrap="nowrap" align="center">
        {visible.map((name, i) => (
          <Box
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 7px',
              borderRadius: 6,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              color: isDark ? '#E2E8F0' : '#334155',
              fontSize: '11.5px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </Box>
        ))}
        {extraCount > 0 && (
          <Tooltip
            label={`Additional Members: ${list.slice(maxVisible).join(', ')}`}
            withArrow
            position="top"
            fz="xs"
            styles={{ tooltip: { fontWeight: 600 } }}
          >
            <Box
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 7px',
                borderRadius: 6,
                backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #DBEAFE',
                color: isDark ? '#93C5FD' : '#2563EB',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              +{extraCount} more
            </Box>
          </Tooltip>
        )}
      </Group>
    );
  };

  if (loading && projects.length === 0) {
    return (
      <Paper
        p="xl"
        radius="lg"
        mt="md"
        style={{
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
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
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
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
            <Button
              size="xs"
              radius="md"
              leftSection={<IconPlus size={14} />}
              onClick={onAddNew}
              style={{
                background: '#2563EB',
              }}
            >
              Create Project
            </Button>
          </Box>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper
      radius="lg"
      mt="md"
      style={{
        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
        border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Mobile Horizontal Scroll Hint */}
      <Box
        hiddenFrom="md"
        px="md"
        py={6}
        style={{
          backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF',
          borderBottom: isDark ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid #DBEAFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Text size="11px" fw={600} style={{ color: isDark ? '#93C5FD' : '#2563EB' }}>
          ⇄ Swipe horizontally to view all columns & actions
        </Text>
      </Box>

      <Table.ScrollContainer
        minWidth={1050}
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Table verticalSpacing={12} horizontalSpacing="xs" highlightOnHover>
          <Table.Thead
            style={{
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
              borderBottom: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            }}
          >
            <Table.Tr>
              {/* 1. Index */}
              <Table.Th
                style={{
                  width: 38,
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                #
              </Table.Th>

              {/* 2. Project Code */}
              <Table.Th
                style={{
                  minWidth: 95,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                Project Code
              </Table.Th>

              {/* 3. Project Name */}
              <Table.Th
                style={{
                  minWidth: 145,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: onSortChange ? 'pointer' : 'default',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => onSortChange && onSortChange('name')}
              >
                <Group gap={4} wrap="nowrap">
                  <span>Project Name</span>
                  {sortBy === 'name' ? (
                    sortOrder === 'asc' ? <IconCaretUpFilled size={12} /> : <IconCaretDownFilled size={12} />
                  ) : (
                    <IconCaretUpFilled size={12} style={{ opacity: 0.3 }} />
                  )}
                </Group>
              </Table.Th>

              {/* 4. Company */}
              <Table.Th
                style={{
                  minWidth: 135,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                Company
              </Table.Th>

              {/* 5. Client Name */}
              <Table.Th
                style={{
                  minWidth: 115,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                Client Name
              </Table.Th>

              {/* 6. Project TL */}
              <Table.Th
                style={{
                  minWidth: 110,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                Project TL
              </Table.Th>

              {/* 7. Team Members */}
              <Table.Th
                style={{
                  minWidth: 145,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                Team Members
              </Table.Th>

              {/* 8. Start Date */}
              <Table.Th
                style={{
                  minWidth: 105,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                Start Date
              </Table.Th>

              {/* 9. End Date */}
              <Table.Th
                style={{
                  minWidth: 105,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                End Date
              </Table.Th>

              {/* 10. Priority */}
              <Table.Th
                style={{
                  minWidth: 90,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                Priority
              </Table.Th>

              {/* 11. Status */}
              <Table.Th
                style={{
                  minWidth: 105,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                Status
              </Table.Th>


              {/* 13. Actions */}
              <Table.Th
                style={{
                  width: 90,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                Actions
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {projects.map((project, index) => {
              const rowNum = (currentPage - 1) * 10 + index + 1;
              const match = (project.clientName || '').match(/^(.*?)\s*\((.*?)\)$/);
              const company = match ? match[1].trim() : (project.clientName || '—');
              const clientPerson = match ? match[2].trim() : '—';

              return (
                <Table.Tr
                  key={project.id}
                  style={{
                    cursor: 'pointer',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid #F1F5F9',
                    transition: 'background-color 0.15s ease',
                  }}
                  onClick={() => onView(project)}
                >
                  {/* 1. Index */}
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Text size="12px" fw={600} style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                      {rowNum}
                    </Text>
                  </Table.Td>

                  {/* 2. Project Code */}
                  <Table.Td>
                    <Box
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                        border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #DBEAFE',
                        color: isDark ? '#93C5FD' : '#2563EB',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '12px',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.projectId || 'PRJ'}
                    </Box>
                  </Table.Td>

                  {/* 3. Project Name */}
                  <Table.Td>
                    <Text
                      fw={600}
                      size="13px"
                      style={{
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.name}
                    </Text>
                    {project.category && (
                      <Text size="11px" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                        {project.category}
                      </Text>
                    )}
                  </Table.Td>

                  {/* 4. Company */}
                  <Table.Td>
                    <Group gap={8} wrap="nowrap" align="center">
                      <Box
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isDark ? '#94A3B8' : '#64748B',
                          flexShrink: 0,
                        }}
                      >
                        <IconBuildingSkyscraper size={14} stroke={1.6} />
                      </Box>
                      <Text
                        fw={600}
                        size="13px"
                        style={{
                          color: isDark ? '#F1F5F9' : '#1E293B',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {company}
                      </Text>
                    </Group>
                  </Table.Td>

                  {/* 5. Client Name */}
                  <Table.Td>
                    <Group gap={6} wrap="nowrap" align="center">
                      <IconUser size={14} style={{ color: isDark ? '#64748B' : '#94A3B8', flexShrink: 0 }} stroke={1.6} />
                      <Text
                        fw={500}
                        size="13px"
                        style={{
                          color: isDark ? '#CBD5E1' : '#475569',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {clientPerson}
                      </Text>
                    </Group>
                  </Table.Td>

                  {/* 6. Project TL */}
                  <Table.Td>
                    <Text
                      size="13px"
                      fw={500}
                      style={{
                        color:
                          project.projectManagerName &&
                          project.projectManagerName.trim() &&
                          project.projectManagerName !== 'Unassigned'
                            ? isDark
                              ? '#F1F5F9'
                              : '#1E293B'
                            : isDark
                            ? '#64748B'
                            : '#94A3B8',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.projectManagerName &&
                      project.projectManagerName.trim() &&
                      project.projectManagerName !== 'Unassigned'
                        ? project.projectManagerName
                        : '—'}
                    </Text>
                  </Table.Td>

                  {/* 7. Team Members */}
                  <Table.Td>
                    {renderTeamMembers(project.teamMembers)}
                  </Table.Td>

                  {/* 8. Start Date */}
                  <Table.Td>
                    <Group gap={6} wrap="nowrap" align="center">
                      <IconCalendar size={14} style={{ color: isDark ? '#64748B' : '#94A3B8', flexShrink: 0 }} stroke={1.6} />
                      <Text
                        size="12px"
                        fw={500}
                        style={{ color: isDark ? '#CBD5E1' : '#475569', whiteSpace: 'nowrap' }}
                      >
                        {formatDate(project.startDate)}
                      </Text>
                    </Group>
                  </Table.Td>

                  {/* 9. End Date */}
                  <Table.Td>
                    <Group gap={6} wrap="nowrap" align="center">
                      <IconCalendar
                        size={14}
                        style={{
                          color: project.isOverdue ? '#EF4444' : isDark ? '#64748B' : '#94A3B8',
                          flexShrink: 0,
                        }}
                        stroke={1.6}
                      />
                      <Text
                        size="12px"
                        fw={500}
                        style={{
                          color: project.isOverdue ? '#EF4444' : isDark ? '#CBD5E1' : '#475569',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(project.targetEndDate)}
                      </Text>
                    </Group>
                  </Table.Td>

                  {/* 10. Priority */}
                  <Table.Td style={{ textAlign: 'center' }}>
                    {renderPriorityBadge(project.priority)}
                  </Table.Td>

                  {/* 11. Status */}
                  <Table.Td style={{ textAlign: 'center' }}>
                    {renderStatusBadge(project.status)}
                  </Table.Td>

                  {/* 13. Actions */}
                  <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <Group gap={4} justify="center" wrap="nowrap">
                      <Tooltip label="Edit Project" withArrow position="top" fz="xs">
                        <ActionIcon
                          size="md"
                          variant="subtle"
                          color="gray"
                          onClick={() => onEdit(project)}
                          style={{
                            borderRadius: 8,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <IconEdit size={17} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete Project" withArrow position="top" fz="xs">
                        <ActionIcon
                          size="md"
                          variant="subtle"
                          color="red"
                          onClick={() => onDelete(project)}
                          style={{
                            borderRadius: 8,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <IconTrash size={17} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {/* Table Footer with Total count, Showing Range & Pagination */}
      {(() => {
        const startRecord = totalProjects === 0 ? 0 : (currentPage - 1) * 10 + 1;
        const endRecord = Math.min(currentPage * 10, totalProjects);
        return (
          <Box
            px={{ base: 'sm', sm: 'lg' }}
            py="sm"
            style={{
              borderTop: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
              backgroundColor: isDark ? '#0F172A' : '#FAFAFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
                Total {totalProjects} project{totalProjects !== 1 ? 's' : ''}
              </Box>

              <Text size="xs" c="dimmed" fw={500}>
                Showing <Text span fw={700} c={isDark ? '#F8FAFC' : '#1E293B'}>{startRecord}</Text> to{' '}
                <Text span fw={700} c={isDark ? '#F8FAFC' : '#1E293B'}>{endRecord}</Text> of{' '}
                <Text span fw={700} c={isDark ? '#F8FAFC' : '#1E293B'}>{totalProjects}</Text> projects
              </Text>
            </Group>

            {/* Right Side: Always Visible Page Navigation */}
            <Group gap={6} align="center" wrap="wrap">
              <Pagination
                value={currentPage}
                onChange={(newPage) => onPageChange(newPage)}
                total={Math.max(1, totalPages)}
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
        );
      })()}
    </Paper>
  );
};

export default ProjectTableView;
