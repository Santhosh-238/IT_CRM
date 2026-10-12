import React, { useState } from 'react';
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
} from '@tabler/icons-react';
import { Project, ProjectTask } from '../../../types/project';

interface ProjectTasksKanbanProps {
  projects: Project[];
  onAddNewProject?: () => void;
}

export const ProjectTasksKanban: React.FC<ProjectTasksKanbanProps> = ({ projects }) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [modalOpened, setModalOpened] = useState<boolean>(false);

  // Initial rich task data connected to the seeded projects
  const [tasks, setTasks] = useState<ProjectTask[]>([
    {
      id: 'task-1',
      taskId: 'TSK-101',
      projectId: 'P001',
      projectName: 'E-commerce Website',
      title: 'Design Stripe & Razorpay Checkout Flow',
      description: 'Implement secure multi-currency payment gateway and webhook handlers.',
      status: 'In Progress',
      priority: 'High',
      assignedTo: 'Santhosh C',
      dueDate: '12-10-2025',
      estimatedHours: 16,
      tags: ['Payment', 'Backend'],
    },
    {
      id: 'task-2',
      taskId: 'TSK-102',
      projectId: 'P001',
      projectName: 'E-commerce Website',
      title: 'Cart & Inventory Stock Synchronization',
      description: 'Real-time Redis inventory locking to prevent double booking of items.',
      status: 'In Progress',
      priority: 'Urgent',
      assignedTo: 'Priya S',
      dueDate: '14-10-2025',
      estimatedHours: 12,
      tags: ['Database', 'Redis'],
    },
    {
      id: 'task-3',
      taskId: 'TSK-103',
      projectId: 'P001',
      projectName: 'E-commerce Website',
      title: 'Product Catalog Filters & Algolia Search',
      description: 'Elastic/Algolia search integration with facets for brands and price ranges.',
      status: 'Completed',
      priority: 'Medium',
      assignedTo: 'Rahul K',
      dueDate: '08-10-2025',
      estimatedHours: 20,
      tags: ['Search', 'Frontend'],
    },
    {
      id: 'task-4',
      taskId: 'TSK-104',
      projectId: 'P002',
      projectName: 'Mobile App',
      title: 'Push Notifications & Deep Linking Setup',
      description: 'Firebase Cloud Messaging integration for iOS APNs and Android.',
      status: 'To Do',
      priority: 'Medium',
      assignedTo: 'Arjun M',
      dueDate: '18-10-2025',
      estimatedHours: 8,
      tags: ['Mobile', 'FCM'],
    },
    {
      id: 'task-5',
      taskId: 'TSK-105',
      projectId: 'P003',
      projectName: 'CRM Integration',
      title: 'OAuth2 Token Refresh & Webhook Dispatcher',
      description: 'Handle 2-way lead sync between Zoho/Salesforce and internal CRM.',
      status: 'In Review',
      priority: 'High',
      assignedTo: 'Vikram S',
      dueDate: '22-10-2025',
      estimatedHours: 14,
      tags: ['API', 'Auth'],
    },
    {
      id: 'task-6',
      taskId: 'TSK-106',
      projectId: 'P004',
      projectName: 'Website Redesign',
      title: 'Figma UI Component System & Tokens',
      description: 'Design system review and Tailwind typography scale approval.',
      status: 'In Review',
      priority: 'Medium',
      assignedTo: 'Sneha R',
      dueDate: '28-10-2025',
      estimatedHours: 10,
      tags: ['UI/UX', 'Figma'],
    },
    {
      id: 'task-7',
      taskId: 'TSK-107',
      projectId: 'P005',
      projectName: 'ERP Module',
      title: 'PostgreSQL Schema & Role Permission Matrix',
      description: 'Define relational models for warehouse inventory and purchase orders.',
      status: 'To Do',
      priority: 'Urgent',
      assignedTo: 'Arjun M',
      dueDate: '30-10-2025',
      estimatedHours: 24,
      tags: ['Architecture', 'SQL'],
    },
    {
      id: 'task-8',
      taskId: 'TSK-108',
      projectId: 'P006',
      projectName: 'AI Chatbot',
      title: 'RAG Pipeline & Embeddings Storage',
      description: 'LangChain pipeline with vector database for customer support FAQ docs.',
      status: 'To Do',
      priority: 'Medium',
      assignedTo: 'Vikram S',
      dueDate: '05-11-2025',
      estimatedHours: 30,
      tags: ['AI/ML', 'VectorDB'],
    },
  ]);

  // Form state for creating new task
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    projectId: projects[0]?.projectId || 'P001',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    assignedTo: 'Santhosh C',
    dueDate: '',
    tags: 'Frontend, Feature',
  });

  const columns: Array<{ id: 'To Do' | 'In Progress' | 'In Review' | 'Completed'; title: string; color: string; bg: string }> = [
    { id: 'To Do', title: 'To Do', color: '#64748B', bg: isDark ? 'rgba(100, 116, 139, 0.1)' : '#F8FAFC' },
    { id: 'In Progress', title: 'In Progress', color: '#2563EB', bg: isDark ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF' },
    { id: 'In Review', title: 'In Review', color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB' },
    { id: 'Completed', title: 'Completed', color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' },
  ];

  // Move task status
  const moveTask = (taskId: string, direction: 'next' | 'prev') => {
    const colOrder: Array<'To Do' | 'In Progress' | 'In Review' | 'Completed'> = [
      'To Do',
      'In Progress',
      'In Review',
      'Completed',
    ];

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const curIdx = colOrder.indexOf(t.status);
        const nextIdx = direction === 'next' ? Math.min(curIdx + 1, colOrder.length - 1) : Math.max(curIdx - 1, 0);
        return { ...t, status: colOrder[nextIdx] };
      })
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCreateTask = () => {
    if (!newTaskForm.title.trim()) return;
    const proj = projects.find((p) => p.projectId === newTaskForm.projectId || p.id === newTaskForm.projectId);
    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      taskId: `TSK-${100 + tasks.length + 1}`,
      projectId: proj?.projectId || newTaskForm.projectId,
      projectName: proj?.name || 'Project',
      title: newTaskForm.title,
      description: newTaskForm.description,
      status: 'To Do',
      priority: newTaskForm.priority,
      assignedTo: newTaskForm.assignedTo,
      dueDate: newTaskForm.dueDate || '15-10-2025',
      tags: newTaskForm.tags.split(',').map((s) => s.trim()).filter(Boolean),
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskForm({
      title: '',
      description: '',
      projectId: projects[0]?.projectId || 'P001',
      priority: 'Medium',
      assignedTo: 'Santhosh C',
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
                  ...projects.map((p) => ({
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
