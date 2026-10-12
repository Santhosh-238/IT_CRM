import React, { useState } from 'react';
import {
  Box,
  Paper,
  Text,
  Title,
  Button,
  Group,
  TextInput,
  Select,
  Modal,
  Badge,
  Tooltip,
  useComputedColorScheme,
  ActionIcon,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconAlertTriangle,
  IconChevronRight,
  IconX,
  IconActivity,
  IconFlag,
  IconBuilding,
  IconUserCheck,
  IconRefresh,
} from '@tabler/icons-react';
import { useProject } from '../../context/ProjectContext';
import { useCRM } from '../../context/CRMContext';
import { Project } from '../../types/project';
import { ProjectTableView } from './components/ProjectTableView';

export type ProjectSubNav = 'all' | 'my' | 'tasks' | 'team' | 'reports';

interface ProjectsPageProps {
  initialSubNav?: ProjectSubNav;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { setActiveNav } = useCRM();
  const {
    projects,
    metadata,
    loading,
    filters,
    pagination,
    setFilters,
    setPage,
    setSort,
    deleteProject,
    setSelectedProject,
  } = useProject();

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Local filter states
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');
  const [statusFilter, setStatusFilter] = useState<string>(filters.status || 'All');
  const [priorityFilter, setPriorityFilter] = useState<string>(filters.priority || 'All');
  const [clientFilter, setClientFilter] = useState<string>(filters.client || 'All');
  const [managerFilter, setManagerFilter] = useState<string>(filters.manager || 'All');

  // Handle Search Debounce / Direct
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    setFilters({ search: val, page: 1 });
  };

  // Handle Dropdown Filters
  const handleStatusChange = (val: string | null) => {
    const s = val || 'All';
    setStatusFilter(s);
    setFilters({ status: s, page: 1 });
  };

  const handlePriorityChange = (val: string | null) => {
    const p = val || 'All';
    setPriorityFilter(p);
    setFilters({ priority: p, page: 1 });
  };

  const handleClientChange = (val: string | null) => {
    const c = val || 'All';
    setClientFilter(c);
    setFilters({ client: c, page: 1 });
  };

  const handleManagerChange = (val: string | null) => {
    const m = val || 'All';
    setManagerFilter(m);
    setFilters({ manager: m, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setClientFilter('All');
    setManagerFilter('All');
    setFilters({
      search: '',
      status: 'All',
      priority: 'All',
      client: 'All',
      manager: 'All',
      page: 1,
    });
  };

  const isFiltered =
    Boolean(searchInput.trim()) ||
    statusFilter !== 'All' ||
    priorityFilter !== 'All' ||
    clientFilter !== 'All' ||
    managerFilter !== 'All';

  // Status Filter Options
  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Planning', label: 'Planning' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
  ];

  // Priority Filter Options
  const priorityOptions = [
    { value: 'All', label: 'All Priorities' },
    { value: 'Critical', label: 'Critical' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];

  // Dynamic Client Options from Metadata
  const clientOptions = [
    { value: 'All', label: 'All Clients' },
    ...(metadata?.contacts || []).map((c: any) => ({
      value: c.companyName || c.name,
      label: c.companyName ? `${c.companyName} (${c.name})` : c.name,
    })),
  ];

  // Dynamic Manager Options from Metadata
  const managerOptions = [
    { value: 'All', label: 'All Managers' },
    ...(metadata?.employees || []).map((e: any) => ({
      value: e.name,
      label: e.name,
    })),
  ];

  // Action handlers
  const handleOpenAddModal = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('crm_editing_project');
    }
    setActiveNav('add-project');
  };

  const handleOpenEditModal = (project: Project) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_editing_project', JSON.stringify(project));
    }
    setActiveNav('add-project');
  };

  const handleOpenView = (project: Project) => {
    setSelectedProject(project);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_viewing_project', JSON.stringify(project));
    }
    setActiveNav('project-details');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await deleteProject(deleteTarget.id);
    setDeleteLoading(false);
    if (res.success) {
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
      {/* 1. Modern Header with Breadcrumbs & Title */}
      <Box mb="md">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          <Box>
            <Group gap={6} align="center" mb={4}>
              <Text size="12px" fw={600} c="dimmed">
                Projects Management
              </Text>
              <IconChevronRight size={13} color="#94A3B8" />
              <Text size="12px" fw={700} style={{ color: isDark ? '#93C5FD' : '#2563EB' }}>
                All Projects
              </Text>
            </Group>
            <Group gap="sm" align="center">
              <Title
                order={3}
                fw={800}
                style={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  letterSpacing: '-0.02em',
                  fontSize: '21px',
                }}
              >
                Projects Directory
              </Title>
              <Badge
                size="md"
                variant="light"
                color="blue"
                radius="md"
                style={{ fontWeight: 700, height: 24 }}
              >
                {pagination.total} {pagination.total === 1 ? 'Project' : 'Projects'}
              </Badge>
            </Group>
          </Box>
        </Group>
      </Box>

      {/* 2. Unified Filter Toolbar */}
      <Paper
        p="sm"
        radius="md"
        mb="md"
        style={{
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Group justify="space-between" wrap="wrap" gap="sm" align="center">
          {/* Left: Search & Filter Inputs */}
          <Group gap="xs" wrap="wrap" style={{ flex: 1, minWidth: 260 }} align="center">
            {/* Search Bar */}
            <TextInput
              placeholder="Search projects..."
              size="sm"
              radius="md"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              leftSection={<IconSearch size={15} color={isDark ? '#60A5FA' : '#2563EB'} />}
              rightSection={
                searchInput ? (
                  <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => handleSearchChange('')}>
                    <IconX size={12} />
                  </ActionIcon>
                ) : null
              }
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  fontSize: 13,
                  height: 36,
                },
              }}
              style={{ flex: '1 1 200px', minWidth: 160 }}
            />

            {/* Status Filter Dropdown */}
            <Select
              size="sm"
              radius="md"
              data={statusOptions}
              value={statusFilter}
              onChange={handleStatusChange}
              leftSection={<IconActivity size={14} color="#6366F1" />}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  fontSize: 13,
                  height: 36,
                },
              }}
              style={{ flex: '1 1 130px', minWidth: 120 }}
            />

            {/* Priority Filter Dropdown */}
            <Select
              size="sm"
              radius="md"
              data={priorityOptions}
              value={priorityFilter}
              onChange={handlePriorityChange}
              leftSection={<IconFlag size={14} color="#F59E0B" />}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  fontSize: 13,
                  height: 36,
                },
              }}
              style={{ flex: '1 1 130px', minWidth: 120 }}
            />

            {/* Client Filter Dropdown */}
            <Select
              size="sm"
              radius="md"
              data={clientOptions}
              value={clientFilter}
              onChange={handleClientChange}
              leftSection={<IconBuilding size={14} color="#06B6D4" />}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  fontSize: 13,
                  height: 36,
                },
              }}
              style={{ flex: '1 1 150px', minWidth: 130 }}
              searchable
            />

            {/* Manager Filter Dropdown */}
            <Select
              size="sm"
              radius="md"
              data={managerOptions}
              value={managerFilter}
              onChange={handleManagerChange}
              leftSection={<IconUserCheck size={14} color="#10B981" />}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  fontSize: 13,
                  height: 36,
                },
              }}
              style={{ flex: '1 1 140px', minWidth: 120 }}
              searchable
            />

            {/* Clear Filters Button (Visible only when filters active) */}
            {isFiltered && (
              <Tooltip label="Reset all filters" withArrow position="top">
                <Button
                  size="sm"
                  variant="subtle"
                  color="gray"
                  radius="md"
                  onClick={handleResetFilters}
                  leftSection={<IconRefresh size={14} />}
                  style={{
                    height: 36,
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  Clear
                </Button>
              </Tooltip>
            )}
          </Group>

          {/* Right Action: Create Project Button */}
          <Group gap="xs">
            <Button
              size="sm"
              radius="md"
              leftSection={<IconPlus size={16} stroke={2.5} />}
              onClick={handleOpenAddModal}
              style={{
                backgroundColor: '#2563EB',
                fontWeight: 600,
                fontSize: 13,
                padding: '0 16px',
                height: 36,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              Create Project
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* 3. Main Projects Table */}
      <ProjectTableView
        projects={projects}
        totalProjects={pagination.total}
        loading={loading}
        currentPage={pagination.page}
        totalPages={Math.max(1, pagination.totalPages)}
        onPageChange={(page: number) => setPage(page)}
        onView={handleOpenView}
        onEdit={handleOpenEditModal}
        onDelete={(proj: Project) => setDeleteTarget(proj)}
        onAddNew={handleOpenAddModal}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortChange={(field: any) => {
          const newOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
          setSort(field, newOrder);
        }}
      />

      {/* 4. Delete Confirmation Dialog */}
      <Modal
        opened={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={
          <Group gap="xs">
            <IconAlertTriangle size={20} color="#EF4444" />
            <Text fw={700} size="sm">
              Delete Project
            </Text>
          </Group>
        }
        radius="md"
        centered
        size="sm"
      >
        <Box>
          <Text size="sm" c="dimmed">
            Are you sure you want to delete project{' '}
            <Text span fw={700} c={isDark ? '#F8FAFC' : '#0F172A'}>
              {deleteTarget?.name} ({deleteTarget?.projectId})
            </Text>
            ? This action cannot be undone.
          </Text>

          <Group justify="flex-end" mt="lg" gap="xs">
            <Button variant="default" size="xs" radius="md" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              color="red"
              size="xs"
              radius="md"
              loading={deleteLoading}
              leftSection={<IconTrash size={14} />}
              onClick={handleConfirmDelete}
            >
              Delete Project
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};

export default ProjectsPage;
