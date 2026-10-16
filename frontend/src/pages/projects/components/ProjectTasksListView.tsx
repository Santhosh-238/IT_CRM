import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Text,
  Group,
  Badge,
  Avatar,
  ActionIcon,
  Button,
  TextInput,
  Tooltip,
  Menu,
  Collapse,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconLock,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconStar,
  IconLayoutList,
  IconLayoutKanban,
  IconChartBar,
  IconLayersLinked,
  IconGitBranch,
  IconColumns,
  IconFilter,
  IconTrash,
  IconCheck,
  IconClock,
  IconX,
  IconCircleDotted,
  IconChecklist,
  IconRefresh,
} from '@tabler/icons-react';
import { Project, ProjectTask } from '../../../types/project';
import { taskService } from '../../../services/taskService';
import { notifications } from '@mantine/notifications';

interface ProjectTasksListViewProps {
  projects: Project[];
  activeView: 'list' | 'board' | 'table';
  onViewChange: (view: 'list' | 'board' | 'table') => void;
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
}

export const ProjectTasksListView: React.FC<ProjectTasksListViewProps> = ({
  projects,
  activeView,
  onViewChange,
  selectedProjectId = 'All',
  onSelectProject,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Collapsed state per group
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    'In Progress': false,
    'To Do': false,
    'In Review': false,
    'Completed': false,
  });

  // Inline adding task per group
  const [inlineAddingGroup, setInlineAddingGroup] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState<string>('');

  // Load tasks dynamically
  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getTasks({
        projectId: selectedProjectId,
      });
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [selectedProjectId]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Status transitions
  const handleStatusChange = async (taskId: string, newStatus: ProjectTask['status']) => {
    try {
      const updated = await taskService.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      notifications.show({
        title: 'Status Updated',
        message: `Task moved to ${newStatus}`,
        color: 'teal',
        autoClose: 2000,
      });
    } catch (e: any) {
      notifications.show({
        title: 'Error',
        message: e.message || 'Could not update task status',
        color: 'red',
      });
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      notifications.show({
        title: 'Task Deleted',
        message: 'Task removed successfully',
        color: 'gray',
        autoClose: 2000,
      });
    } catch (e: any) {}
  };

  // Add task inline
  const handleAddInlineTask = async (statusGroup: string) => {
    if (!inlineTitle.trim()) {
      setInlineAddingGroup(null);
      return;
    }

    try {
      const defaultProject = projects[0];
      const newTask = await taskService.createTask({
        title: inlineTitle.trim(),
        status: statusGroup as any,
        projectId: defaultProject?.projectId || 'PRJ-1001',
        projectName: defaultProject?.name || 'Loan Eligibility & Recommendation System',
        assignedTo: 'Rahul V',
        assignedAvatar: 'RV',
        priority: 'High',
      });

      setTasks((prev) => [newTask, ...prev]);
      setInlineTitle('');
      setInlineAddingGroup(null);
      notifications.show({
        title: 'Task Created',
        message: `"${newTask.title}" added to ${statusGroup}`,
        color: 'teal',
        autoClose: 2500,
      });
    } catch (e: any) {
      notifications.show({
        title: 'Error Creating Task',
        message: e.message || 'Could not create task',
        color: 'red',
      });
    }
  };

  // Status configurations
  const statusConfigs: Array<{
    id: ProjectTask['status'];
    label: string;
    pillBg: string;
    pillBorder: string;
    pillTextColor: string;
    iconColor: string;
  }> = [
    {
      id: 'In Progress',
      label: 'IN PROGRESS',
      pillBg: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
      pillBorder: isDark ? '#6366F1' : '#4F46E5',
      pillTextColor: isDark ? '#A5B4FC' : '#4338CA',
      iconColor: '#818CF8',
    },
    {
      id: 'To Do',
      label: 'TO DO',
      pillBg: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.6)',
      pillBorder: isDark ? 'rgba(148, 163, 184, 0.3)' : '#CBD5E1',
      pillTextColor: isDark ? '#CBD5E1' : '#64748B',
      iconColor: '#94A3B8',
    },
    {
      id: 'In Review',
      label: 'IN REVIEW',
      pillBg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(254, 243, 199, 0.8)',
      pillBorder: isDark ? '#F59E0B' : '#D97706',
      pillTextColor: isDark ? '#FCD34D' : '#B45309',
      iconColor: '#F59E0B',
    },
    {
      id: 'Completed',
      label: 'COMPLETED',
      pillBg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(209, 250, 229, 0.8)',
      pillBorder: isDark ? '#10B981' : '#059669',
      pillTextColor: isDark ? '#6EE7B7' : '#047857',
      iconColor: '#10B981',
    },
  ];

  // Theme styles matching screenshot
  const pageBg = isDark ? '#0A0D14' : '#F8FAFC';
  const headerCardBg = isDark ? '#111622' : '#FFFFFF';
  const rowHoverBg = isDark ? 'rgba(255, 255, 255, 0.035)' : '#F1F5F9';
  const textColor = isDark ? '#E2E8F0' : '#1E293B';
  const subtleBorder = isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0';

  return (
    <Box
      style={{
        backgroundColor: pageBg,
        minHeight: '85vh',
        borderRadius: 14,
        padding: '16px 20px',
        border: `1px solid ${subtleBorder}`,
      }}
    >
      {/* 1. TOP BREADCRUMB & STAR ROW (Matching screenshot: crm 🔒 / 📋 List v ⭐) */}
      <Group justify="space-between" align="center" mb="xs">
        <Group gap={8} align="center">
          {/* CRM Pill with Lock */}
          <Group
            gap={5}
            px={8}
            py={3}
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <Text size="12px" fw={700} style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
              crm
            </Text>
            <IconLock size={12} color={isDark ? '#94A3B8' : '#64748B'} />
          </Group>

          <Text size="13px" c="dimmed">
            /
          </Text>

          {/* List Breadcrumb */}
          <Group gap={5} align="center" style={{ cursor: 'pointer' }}>
            <IconChecklist size={16} color={isDark ? '#E2E8F0' : '#334155'} />
            <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              List
            </Text>
            <IconChevronDown size={13} color="#94A3B8" />
            <IconStar size={14} color="#94A3B8" style={{ marginLeft: 2, cursor: 'pointer' }} />
          </Group>
        </Group>

        {/* Right side reload button */}
        <Tooltip label="Reset to original tasks" withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => {
              const reset = taskService.resetToDefault();
              setTasks(reset);
              notifications.show({
                title: 'Reset Completed',
                message: 'Loaded original task list',
                color: 'blue',
              });
            }}
          >
            <IconRefresh size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* 2. VIEWS SUB-NAVIGATION BAR (Add Channel, Board, Gantt, List, + View) */}
      <Box
        pb="xs"
        mb="md"
        style={{
          borderBottom: `1px solid ${subtleBorder}`,
        }}
      >
        <Group gap="xs" align="center" wrap="wrap">
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: isDark ? '#94A3B8' : '#64748B',
            }}
          >
            Add Channel
          </Button>

          {/* Board View Button */}
          <Button
            size="compact-xs"
            variant={activeView === 'board' ? 'filled' : 'subtle'}
            color={activeView === 'board' ? 'indigo' : 'gray'}
            leftSection={<IconLayoutKanban size={13} color="#3B82F6" />}
            onClick={() => onViewChange('board')}
            style={{
              fontSize: 12,
              fontWeight: activeView === 'board' ? 700 : 500,
              backgroundColor:
                activeView === 'board'
                  ? isDark
                    ? 'rgba(99, 102, 241, 0.25)'
                    : '#EEF2FF'
                  : 'transparent',
              color: activeView === 'board' ? (isDark ? '#A5B4FC' : '#4F46E5') : isDark ? '#94A3B8' : '#64748B',
            }}
          >
            Board
          </Button>

          {/* Gantt Button */}
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            leftSection={<IconChartBar size={13} color="#EF4444" />}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: isDark ? '#94A3B8' : '#64748B',
            }}
          >
            Gantt
          </Button>

          {/* List View Button (ACTIVE by default) */}
          <Button
            size="compact-xs"
            variant={activeView === 'list' ? 'filled' : 'subtle'}
            color={activeView === 'list' ? 'indigo' : 'gray'}
            leftSection={<IconLayoutList size={13} color={isDark ? '#818CF8' : '#4F46E5'} />}
            onClick={() => onViewChange('list')}
            style={{
              fontSize: 12,
              fontWeight: activeView === 'list' ? 700 : 500,
              backgroundColor:
                activeView === 'list'
                  ? isDark
                    ? 'rgba(99, 102, 241, 0.25)'
                    : '#EEF2FF'
                  : 'transparent',
              color: activeView === 'list' ? (isDark ? '#A5B4FC' : '#4F46E5') : isDark ? '#94A3B8' : '#64748B',
              borderBottom: activeView === 'list' ? '2px solid #6366F1' : 'none',
              borderRadius: activeView === 'list' ? '6px 6px 0 0' : 6,
            }}
          >
            List
          </Button>

          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            leftSection={<IconPlus size={12} />}
            onClick={() => onViewChange('table')}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: isDark ? '#94A3B8' : '#64748B',
            }}
          >
            + View
          </Button>
        </Group>
      </Box>

      {/* 3. TOOLBAR (Group: Status, Subtasks, Columns, Filter) */}
      <Group justify="space-between" align="center" mb="lg">
        <Group gap="xs" align="center" wrap="wrap">
          {/* Group: Status Purple Pill */}
          <Group
            gap={6}
            px={12}
            py={5}
            style={{
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.22)' : '#EEF2FF',
              borderRadius: 20,
              border: isDark ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid #C7D2FE',
              cursor: 'pointer',
            }}
          >
            <IconLayersLinked size={14} color={isDark ? '#A5B4FC' : '#4F46E5'} />
            <Text size="12px" fw={700} style={{ color: isDark ? '#C7D2FE' : '#4338CA' }}>
              Group: Status
            </Text>
          </Group>

          {/* Subtasks Button */}
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            leftSection={<IconGitBranch size={13} color="#94A3B8" />}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: isDark ? '#CBD5E1' : '#475569',
            }}
          >
            Subtasks
          </Button>

          {/* Columns Button */}
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            leftSection={<IconColumns size={13} color="#94A3B8" />}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: isDark ? '#CBD5E1' : '#475569',
            }}
          >
            Columns
          </Button>
        </Group>

        {/* Right Filter Button */}
        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          leftSection={<IconFilter size={13} color="#94A3B8" />}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: isDark ? '#CBD5E1' : '#475569',
          }}
        >
          Filter
        </Button>
      </Group>

      {/* 4. TASK GROUPS (IN PROGRESS, TO DO, IN REVIEW, COMPLETED) */}
      <Box>
        {statusConfigs.map((group) => {
          const groupTasks = tasks.filter((t) => t.status === group.id);
          const isCollapsed = collapsedGroups[group.id];
          const isAdding = inlineAddingGroup === group.id;

          // Don't show Review/Completed if empty and not active, but always show In Progress and To Do like screenshot
          if (groupTasks.length === 0 && group.id !== 'In Progress' && group.id !== 'To Do') {
            return null;
          }

          return (
            <Box key={group.id} mb="xl">
              {/* Group Header Bar */}
              <Group
                gap="sm"
                align="center"
                mb={8}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleGroup(group.id)}
              >
                {/* Collapse icon */}
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  color="gray"
                  style={{ transition: 'transform 0.15s ease' }}
                >
                  {isCollapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
                </ActionIcon>

                {/* Status Pill Badge */}
                <Group
                  gap={6}
                  px={10}
                  py={3}
                  style={{
                    backgroundColor: group.pillBg,
                    border: `1px solid ${group.pillBorder}`,
                    borderRadius: 12,
                  }}
                >
                  {/* Partial circle icon for in progress, dotted for todo, check for completed */}
                  {group.id === 'In Progress' ? (
                    <Box
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: '50%',
                        border: '2px solid #818CF8',
                        borderRightColor: 'transparent',
                        transform: 'rotate(-45deg)',
                      }}
                    />
                  ) : group.id === 'Completed' ? (
                    <IconCheck size={13} color="#10B981" />
                  ) : (
                    <IconCircleDotted size={13} color={group.iconColor} />
                  )}

                  <Text
                    size="11px"
                    fw={800}
                    style={{
                      color: group.pillTextColor,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {group.label}
                  </Text>
                </Group>

                {/* Count badge */}
                <Text size="12px" fw={600} c="dimmed">
                  {groupTasks.length}
                </Text>
              </Group>

              <Collapse in={!isCollapsed}>
                {/* Table Header: Name ... Assignee */}
                <Box
                  py={6}
                  px="sm"
                  style={{
                    borderBottom: `1px solid ${subtleBorder}`,
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Text size="11px" fw={700} c="dimmed" style={{ width: '70%' }}>
                      Name
                    </Text>
                    <Text size="11px" fw={700} c="dimmed" style={{ width: 80, textAlign: 'right' }}>
                      Assignee
                    </Text>
                  </Group>
                </Box>

                {/* Task Rows List */}
                <Box>
                  {groupTasks.map((task) => (
                    <Box
                      key={task.id}
                      py={8}
                      px="sm"
                      style={{
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.035)' : '#F1F5F9'}`,
                        transition: 'background-color 0.12s ease',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      className="task-list-row"
                    >
                      {/* Left: Partial circle icon + Task title */}
                      <Group gap="sm" style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
                        {/* Status Icon Menu to easily switch status */}
                        <Menu shadow="md" width={160} position="bottom-start">
                          <Menu.Target>
                            <Box style={{ cursor: 'pointer', flexShrink: 0 }}>
                              <Tooltip label={`Status: ${task.status} (Click to change)`} withArrow>
                                <Box
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    border: `2px solid ${group.pillBorder}`,
                                    borderRightColor:
                                      task.status === 'In Progress' ? 'transparent' : group.pillBorder,
                                    backgroundColor:
                                      task.status === 'Completed' ? '#10B981' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {task.status === 'Completed' && (
                                    <IconCheck size={9} color="#FFFFFF" stroke={3} />
                                  )}
                                </Box>
                              </Tooltip>
                            </Box>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Change Status</Menu.Label>
                            <Menu.Item
                              leftSection={<IconCircleDotted size={14} color="#94A3B8" />}
                              onClick={() => handleStatusChange(task.id, 'To Do')}
                            >
                              To Do
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconClock size={14} color="#6366F1" />}
                              onClick={() => handleStatusChange(task.id, 'In Progress')}
                            >
                              In Progress
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconCheck size={14} color="#F59E0B" />}
                              onClick={() => handleStatusChange(task.id, 'In Review')}
                            >
                              In Review
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconCheck size={14} color="#10B981" />}
                              onClick={() => handleStatusChange(task.id, 'Completed')}
                            >
                              Completed
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>

                        {/* Task Title */}
                        <Text
                          size="13px"
                          fw={500}
                          truncate
                          style={{
                            color:
                              task.status === 'Completed'
                                ? isDark
                                  ? '#64748B'
                                  : '#94A3B8'
                                : textColor,
                            textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
                            lineHeight: 1.4,
                          }}
                        >
                          {task.title}
                        </Text>
                      </Group>

                      {/* Right: Quick actions on hover + Assignee Avatar */}
                      <Group gap="sm" align="center" style={{ flexShrink: 0 }}>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteTask(task.id)}
                          style={{ opacity: 0.7 }}
                        >
                          <IconTrash size={13} />
                        </ActionIcon>

                        {/* Assignee Avatar (RV badge matching screenshot) */}
                        <Avatar
                          size={24}
                          radius="xl"
                          style={{
                            backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                            color: isDark ? '#0F172A' : '#FFFFFF',
                            fontSize: 10,
                            fontWeight: 800,
                            border: isDark ? 'none' : '1px solid #CBD5E1',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          }}
                        >
                          {task.assignedAvatar ||
                            (task.assignedTo
                              ? task.assignedTo
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()
                              : 'RV')}
                        </Avatar>
                      </Group>
                    </Box>
                  ))}

                  {/* Inline Add Task Input or Button */}
                  {isAdding ? (
                    <Box py={8} px="sm">
                      <Group gap="xs" align="center">
                        <TextInput
                          size="xs"
                          placeholder="Task name..."
                          value={inlineTitle}
                          onChange={(e) => setInlineTitle(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddInlineTask(group.id);
                            if (e.key === 'Escape') setInlineAddingGroup(null);
                          }}
                          autoFocus
                          styles={{
                            input: {
                              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                              color: textColor,
                              borderColor: '#6366F1',
                              height: 32,
                              fontSize: 12.5,
                            },
                          }}
                          style={{ flex: 1 }}
                        />
                        <Button
                          size="xs"
                          color="indigo"
                          onClick={() => handleAddInlineTask(group.id)}
                          style={{ height: 32 }}
                        >
                          Save
                        </Button>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="gray"
                          onClick={() => setInlineAddingGroup(null)}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Group>
                    </Box>
                  ) : (
                    <Box
                      py={8}
                      px="sm"
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                      onClick={() => {
                        setInlineAddingGroup(group.id);
                        setInlineTitle('');
                      }}
                    >
                      <Group gap={6} align="center">
                        <IconPlus size={13} color={isDark ? '#94A3B8' : '#64748B'} />
                        <Text size="12px" fw={600} c="dimmed">
                          Add Task
                        </Text>
                      </Group>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ProjectTasksListView;
