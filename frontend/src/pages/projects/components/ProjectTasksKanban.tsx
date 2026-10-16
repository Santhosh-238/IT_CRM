import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Text,
  Group,
  Button,
  Select,
  Badge,
  Avatar,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  SimpleGrid,
  Progress,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconPlus,
  IconClock,
  IconChevronRight,
  IconChevronLeft,
  IconTrash,
  IconCheck,
  IconFlag,
  IconTarget,
  IconLayoutList,
  IconLayoutKanban,
  IconChartBar,
  IconLock,
  IconChecklist,
  IconStar,
  IconChevronDown,
} from '@tabler/icons-react';
import { Project, ProjectTask } from '../../../types/project';
import { taskService, INITIAL_DYNAMIC_TASKS } from '../../../services/taskService';
import { notifications } from '@mantine/notifications';

interface ProjectTasksKanbanProps {
  projects?: Project[];
  onAddNewProject?: () => void;
  activeView?: 'list' | 'board' | 'table';
  onViewChange?: (view: 'list' | 'board' | 'table') => void;
}

export const ProjectTasksKanban: React.FC<ProjectTasksKanbanProps> = ({
  projects = [],
  activeView = 'board',
  onViewChange,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [modalOpened, setModalOpened] = useState<boolean>(false);

  // Dynamic task data from taskService (shared with List View)
  const [tasks, setTasks] = useState<ProjectTask[]>(INITIAL_DYNAMIC_TASKS);

  const loadTasks = async () => {
    const data = await taskService.getTasks();
    setTasks(data);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Form state for creating new task
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    projectId: projects?.[0]?.projectId || 'PRJ-1001',
    priority: 'High' as 'Low' | 'Medium' | 'High' | 'Urgent',
    assignedTo: 'Rahul V',
    dueDate: '',
    tags: 'Backend, Rules Engine',
  });

  const columns: Array<{ id: 'To Do' | 'In Progress' | 'In Review' | 'Completed'; title: string; color: string; bg: string }> = [
    { id: 'To Do', title: 'To Do', color: '#64748B', bg: isDark ? 'rgba(100, 116, 139, 0.1)' : '#F8FAFC' },
    { id: 'In Progress', title: 'In Progress', color: '#2563EB', bg: isDark ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF' },
    { id: 'In Review', title: 'In Review', color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB' },
    { id: 'Completed', title: 'Completed', color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' },
  ];

  // Move task status
  const moveTask = async (taskId: string, direction: 'next' | 'prev') => {
    const colOrder: Array<'To Do' | 'In Progress' | 'In Review' | 'Completed'> = [
      'To Do',
      'In Progress',
      'In Review',
      'Completed',
    ];

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;
    const curIdx = colOrder.indexOf(currentTask.status);
    const nextIdx = direction === 'next' ? Math.min(curIdx + 1, colOrder.length - 1) : Math.max(curIdx - 1, 0);
    const newStatus = colOrder[nextIdx];

    try {
      const updated = await taskService.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (e) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return { ...t, status: newStatus };
        })
      );
    }
  };

  const deleteTask = async (taskId: string) => {
    await taskService.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCreateTask = async () => {
    if (!newTaskForm.title.trim()) return;
    const proj = (projects || []).find((p) => p.projectId === newTaskForm.projectId || p.id === newTaskForm.projectId);
    const created = await taskService.createTask({
      projectId: proj?.projectId || newTaskForm.projectId,
      projectName: proj?.name || 'Loan Eligibility & Recommendation System',
      title: newTaskForm.title,
      description: newTaskForm.description,
      status: 'To Do',
      priority: newTaskForm.priority,
      assignedTo: newTaskForm.assignedTo,
      assignedAvatar: newTaskForm.assignedTo === 'Rahul V' ? 'RV' : 'SC',
      dueDate: newTaskForm.dueDate || '25-10-2026',
      tags: newTaskForm.tags.split(',').map((s) => s.trim()).filter(Boolean),
    });

    setTasks((prev) => [created, ...prev]);
    setNewTaskForm({
      title: '',
      description: '',
      projectId: projects[0]?.projectId || 'PRJ-1001',
      priority: 'High',
      assignedTo: 'Rahul V',
      dueDate: '',
      tags: '',
    });
    setModalOpened(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId === 'All') return true;
    return t.projectId === selectedProjectId;
  });

  const completedCount = filteredTasks.filter((t) => t.status === 'Completed').length;
  const progressPercent = filteredTasks.length > 0 ? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  return (
    <Box>
      {/* 0. Top Breadcrumb & Views Bar */}
      <Box mb="md">
        <Group justify="space-between" align="center" mb="xs">
          <Group gap={8} align="center">
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
            <Group gap={5} align="center" style={{ cursor: 'pointer' }}>
              <IconLayoutKanban size={16} color={isDark ? '#E2E8F0' : '#334155'} />
              <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                Board
              </Text>
              <IconChevronDown size={13} color="#94A3B8" />
              <IconStar size={14} color="#94A3B8" style={{ marginLeft: 2 }} />
            </Group>
          </Group>
        </Group>

        {/* View Tabs */}
        {onViewChange && (
          <Group gap="xs" align="center" wrap="wrap" pb="xs" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0' }}>
            <Button size="compact-xs" variant="subtle" color="gray" style={{ fontSize: 12 }}>
              Add Channel
            </Button>
            <Button
              size="compact-xs"
              variant={activeView === 'board' ? 'filled' : 'subtle'}
              color="indigo"
              leftSection={<IconLayoutKanban size={13} color="#3B82F6" />}
              onClick={() => onViewChange('board')}
              style={{
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.25)' : '#EEF2FF',
                color: isDark ? '#A5B4FC' : '#4F46E5',
                borderBottom: '2px solid #6366F1',
                borderRadius: '6px 6px 0 0',
              }}
            >
              Board
            </Button>
            <Button size="compact-xs" variant="subtle" color="gray" leftSection={<IconChartBar size={13} color="#EF4444" />} style={{ fontSize: 12 }}>
              Gantt
            </Button>
            <Button
              size="compact-xs"
              variant={activeView === 'list' ? 'filled' : 'subtle'}
              color="gray"
              leftSection={<IconLayoutList size={13} color={isDark ? '#818CF8' : '#4F46E5'} />}
              onClick={() => onViewChange('list')}
              style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#94A3B8' : '#64748B' }}
            >
              List
            </Button>
            <Button size="compact-xs" variant="subtle" color="gray" leftSection={<IconPlus size={12} />} onClick={() => onViewChange('table')} style={{ fontSize: 12 }}>
              + View
            </Button>
          </Group>
        )}
      </Box>

      {/* 1. Top Milestones & Task Filter Bar */}
      <Paper
        p="md"
        radius="md"
        mb="md"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="md">
            <Box style={{ width: 220 }}>
              <Select
                label="Filter by Project"
                size="xs"
                radius="md"
                data={[
                  { value: 'All', label: 'All Projects' },
                  ...(projects || []).map((p) => ({
                    value: p.projectId,
                    label: `${p.projectId} - ${p.name}`,
                  })),
                ]}
                value={selectedProjectId}
                onChange={(val) => setSelectedProjectId(val || 'All')}
              />
            </Box>

            <Box style={{ minWidth: 240 }}>
              <Text size="xs" fw={600} c="dimmed" mb={4}>
                Sprint Completion Rate ({completedCount}/{filteredTasks.length} Tasks)
              </Text>
              <Group gap="xs" align="center">
                <Box style={{ flex: 1 }}>
                  <Progress value={progressPercent} size="sm" radius="xl" color="#10B981" />
                </Box>
                <Text size="xs" fw={700} c="teal">
                  {progressPercent}%
                </Text>
              </Group>
            </Box>
          </Group>

          <Button
            size="xs"
            radius="md"
            leftSection={<IconPlus size={14} />}
            onClick={() => setModalOpened(true)}
            style={{
              backgroundColor: '#2563EB',
            }}
          >
            + Add New Task
          </Button>
        </Group>
      </Paper>

      {/* 2. Kanban Board Columns */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <Paper
              key={col.id}
              p="sm"
              radius="md"
              style={{
                backgroundColor: col.bg,
                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                minHeight: 520,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column Header */}
              <Group justify="space-between" mb="xs" px={4}>
                <Group gap={6}>
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: col.color,
                    }}
                  />
                  <Text fw={700} size="13px" style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}>
                    {col.title}
                  </Text>
                </Group>
                <Badge size="xs" variant="light" color="gray" radius="sm">
                  {colTasks.length}
                </Badge>
              </Group>

              {/* Task Cards List */}
              <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {colTasks.length === 0 ? (
                  <Paper
                    p="lg"
                    radius="md"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      border: '1px dashed #CBD5E1',
                      textAlign: 'center',
                      marginTop: 12,
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      No tasks in {col.title}
                    </Text>
                  </Paper>
                ) : (
                  colTasks.map((task) => (
                    <Paper
                      key={task.id}
                      p="sm"
                      radius="md"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      {/* Top Badges */}
                      <Group justify="space-between" mb={6}>
                        <Badge size="xs" variant="outline" color="blue" radius="sm" style={{ fontFamily: 'monospace' }}>
                          {task.projectId} • {task.taskId}
                        </Badge>
                        <Badge
                          size="xs"
                          radius="sm"
                          variant="light"
                          color={
                            task.priority === 'High' || task.priority === 'Urgent'
                              ? 'red'
                              : task.priority === 'Medium'
                              ? 'yellow'
                              : 'gray'
                          }
                        >
                          {task.priority}
                        </Badge>
                      </Group>

                      {/* Title & Description */}
                      <Text fw={600} size="13px" mb={4} style={{ color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.3 }}>
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text size="11px" c="dimmed" mb={8} lineClamp={2}>
                          {task.description}
                        </Text>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <Group gap={4} mb={8}>
                          {task.tags.map((tag, i) => (
                            <Badge key={i} size="xs" variant="subtle" color="gray">
                              #{tag}
                            </Badge>
                          ))}
                        </Group>
                      )}

                      {/* Footer Info & Actions */}
                      <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
                        <Group gap={6}>
                          <Avatar size={20} radius="xl" color="indigo" fz={9}>
                            {task.assignedTo?.charAt(0) || 'U'}
                          </Avatar>
                          <Text size="11px" fw={500} c="dimmed">
                            {task.assignedTo?.split(' ')[0]}
                          </Text>
                        </Group>

                        <Group gap={4}>
                          {task.dueDate && (
                            <Group gap={2} c="dimmed">
                              <IconClock size={12} />
                              <Text size="10px">{task.dueDate}</Text>
                            </Group>
                          )}

                          {col.id !== 'To Do' && (
                            <Tooltip label="Move Back" withArrow fz="xs">
                              <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => moveTask(task.id, 'prev')}>
                                <IconChevronLeft size={12} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          {col.id !== 'Completed' && (
                            <Tooltip label="Move Forward" withArrow fz="xs">
                              <ActionIcon size="xs" variant="subtle" color="blue" onClick={() => moveTask(task.id, 'next')}>
                                <IconChevronRight size={12} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          <Tooltip label="Delete Task" withArrow fz="xs">
                            <ActionIcon size="xs" variant="subtle" color="red" onClick={() => deleteTask(task.id)}>
                              <IconTrash size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                    </Paper>
                  ))
                )}
              </Box>
            </Paper>
          );
        })}
      </SimpleGrid>

      {/* Modal for Creating New Task */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group gap={8}>
            <IconTarget size={18} color="#2563EB" />
            <Text fw={700} size="sm">
              Create New Task / Milestone
            </Text>
          </Group>
        }
        radius="md"
        size="md"
      >
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextInput
            label="Task Title"
            placeholder="e.g. Implement OAuth2 API Authentication"
            required
            value={newTaskForm.title}
            onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
          />

          <Select
            label="Assign to Project"
            required
            data={projects.map((p) => ({
              value: p.projectId,
              label: `${p.projectId} - ${p.name}`,
            }))}
            value={newTaskForm.projectId}
            onChange={(val) => setNewTaskForm({ ...newTaskForm, projectId: val || 'P001' })}
          />

          <SimpleGrid cols={2} spacing="sm">
            <Select
              label="Priority"
              data={['Low', 'Medium', 'High', 'Urgent']}
              value={newTaskForm.priority}
              onChange={(val: any) => setNewTaskForm({ ...newTaskForm, priority: val || 'Medium' })}
            />
            <TextInput
              label="Assigned Lead / Member"
              placeholder="e.g. Santhosh C"
              value={newTaskForm.assignedTo}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedTo: e.target.value })}
            />
          </SimpleGrid>

          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label="Due Date (DD-MM-YYYY)"
              placeholder="15-10-2025"
              value={newTaskForm.dueDate}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
            />
            <TextInput
              label="Tags (Comma separated)"
              placeholder="Frontend, API, Auth"
              value={newTaskForm.tags}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, tags: e.target.value })}
            />
          </SimpleGrid>

          <Textarea
            label="Description & Acceptance Criteria"
            placeholder="Key deliverables and specifications..."
            rows={3}
            value={newTaskForm.description}
            onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" size="xs" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button size="xs" color="blue" onClick={handleCreateTask}>
              Create Task
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};

export default ProjectTasksKanban;
