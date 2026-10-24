import React, { useState, useMemo } from 'react';
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
  UnstyledButton,
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
  IconRefresh,
} from '@tabler/icons-react';
import { useProject } from '../../context/ProjectContext';
import { useCRM } from '../../context/CRMContext';
import { Project } from '../../types/project';
import { ProjectTableView } from './components/ProjectTableView';
import {
  DateFilterControl,
  DateFilterValue,
  DEFAULT_DATE_FILTER,
  isDateMatchingFilter,
} from '../../components/common/DateFilterControl';

export type ProjectSubNav = 'all' | 'my' | 'tasks' | 'team' | 'reports';

interface ProjectsPageProps {
  initialSubNav?: ProjectSubNav;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ initialSubNav = 'all' }) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { setActiveNav } = useCRM();
  const {
    projects,
    stats,
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

  // Status Counts for Segmented Tabs
  const totalCount = stats?.total ?? pagination.total ?? projects.length;
  const inProgressCount =
    stats?.inProgress ??
    projects.filter((p) => (p.status || '').toLowerCase().includes('progress')).length;
  const planningCount =
    stats?.planning ??
    projects.filter((p) => (p.status || '').toLowerCase().includes('planning')).length;
  const onHoldCount =
    stats?.onHold ??
    projects.filter((p) => (p.status || '').toLowerCase().includes('hold')).length;
  const completedCount =
    stats?.completed ??
    projects.filter((p) => (p.status || '').toLowerCase().includes('completed')).length;

  // Local filter states
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');
  const [statusFilter, setStatusFilter] = useState<string>(filters.status || 'All');
  const [priorityFilter, setPriorityFilter] = useState<string>(filters.priority || 'All');
  const [clientFilter, setClientFilter] = useState<string>(filters.client || 'All');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(DEFAULT_DATE_FILTER);

  // Client-side date filter (Day-wise & Month-wise)
  const filteredProjects = useMemo(() => {
    if (dateFilter.type === 'ALL') return projects;
    return projects.filter((p) => {
      const dateVal = p.startDate || p.createdAt || p.updatedAt;
      return isDateMatchingFilter(dateVal, dateFilter);
    });
  }, [projects, dateFilter]);

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

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setClientFilter('All');
    setDateFilter(DEFAULT_DATE_FILTER);
    setFilters({
      search: '',
      status: 'All',
      priority: 'All',
      client: 'All',
      page: 1,
    });
  };

  const isFiltered =
    Boolean(searchInput.trim()) ||
    statusFilter !== 'All' ||
    priorityFilter !== 'All' ||
    clientFilter !== 'All' ||
    dateFilter.type !== 'ALL';

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

  // Dynamic Client Options from Metadata (deduplicated by value to prevent Mantine runtime error)
  const clientOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [{ value: 'All', label: 'All Clients' }];
    (metadata?.contacts || []).forEach((c: any) => {
      const val = (c.companyName || c.name || '').trim();
      if (val && !seen.has(val.toLowerCase())) {
        seen.add(val.toLowerCase());
        options.push({
          value: val,
          label: c.companyName ? `${c.companyName} (${c.name})` : c.name,
        });
      }
    });
    return options;
  }, [metadata?.contacts]);

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
                Projects Directory
              </Text>
            </Group>
            <Group gap="sm" align="center">
              <Title
                order={3}
                fw={800}
                style={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  letterSpacing: '-0.02em',
                  fontSize: '22px',
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
                {dateFilter.type !== 'ALL' ? filteredProjects.length : pagination.total}{' '}
                {(dateFilter.type !== 'ALL' ? filteredProjects.length : pagination.total) === 1
                  ? 'Project'
                  : 'Projects'}
              </Badge>
            </Group>
          </Box>

          {/* Primary Action Button in Header */}
          <Button
            size="sm"
            radius="md"
            leftSection={<IconPlus size={16} stroke={2.5} />}
            onClick={handleOpenAddModal}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              height: 38,
              padding: '0 18px',
              border: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            Create Project
          </Button>
        </Group>
      </Box>

      {/* 2. Unified Filter Toolbar (Card 1) */}
      <Paper
        p="sm"
        radius="lg"
        mb="md"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          {/* Left: Modern Segmented Status Tabs */}
          <Box
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              padding: 3,
              borderRadius: 10,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
              flexShrink: 0,
            }}
          >
            {[
              {
                key: 'All',
                label: 'All',
                count: totalCount,
                activeColor: '#4F46E5',
                activeColorDark: '#818CF8',
              },
              {
                key: 'In Progress',
                label: 'In Progress',
                count: inProgressCount,
                activeColor: '#2563EB',
                activeColorDark: '#60A5FA',
              },
              {
                key: 'Planning',
                label: 'Planning',
                count: planningCount,
                activeColor: '#0EA5E9',
                activeColorDark: '#38BDF8',
              },
              {
                key: 'Completed',
                label: 'Completed',
                count: completedCount,
                activeColor: '#059669',
                activeColorDark: '#34D399',
              },
            ].map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <UnstyledButton
                  key={tab.key}
                  onClick={() => handleStatusChange(tab.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 11px',
                    borderRadius: 7,
                    backgroundColor: isActive
                      ? isDark
                        ? '#0F172A'
                        : '#FFFFFF'
                      : 'transparent',
                    boxShadow: isActive
                      ? isDark
                        ? '0 1px 3px rgba(0, 0, 0, 0.4)'
                        : '0 1px 3px rgba(0, 0, 0, 0.08)'
                      : 'none',
                    color: isActive
                      ? isDark
                        ? tab.activeColorDark
                        : tab.activeColor
                      : isDark
                      ? '#94A3B8'
                      : '#64748B',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 12,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  <Box
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 18,
                      height: 18,
                      padding: '0 5px',
                      borderRadius: 9,
                      fontSize: 10,
                      fontWeight: 700,
                      backgroundColor: isActive
                        ? isDark
                          ? tab.activeColorDark
                          : tab.activeColor
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : '#E2E8F0',
                      color: isActive
                        ? isDark
                          ? '#0F172A'
                          : '#FFFFFF'
                        : isDark
                        ? '#CBD5E1'
                        : '#64748B',
                    }}
                  >
                    {tab.count}
                  </Box>
                </UnstyledButton>
              );
            })}
          </Box>

          {/* Right: Search, Priority, Client, Date & Clear Filters */}
          <Group gap={6} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* Search Bar */}
            <TextInput
              placeholder="Search projects..."
              size="xs"
              radius="md"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              leftSection={<IconSearch size={13} color={isDark ? '#60A5FA' : '#2563EB'} />}
              rightSection={
                searchInput ? (
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="gray"
                    onClick={() => handleSearchChange('')}
                  >
                    <IconX size={11} />
                  </ActionIcon>
                ) : null
              }
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  fontSize: 12,
                  height: 34,
                },
              }}
              style={{ width: 175 }}
            />

            {/* Priority Filter Dropdown */}
            <Select
              size="xs"
              radius="md"
              data={priorityOptions}
              value={priorityFilter}
              onChange={handlePriorityChange}
              leftSection={<IconFlag size={13} color="#F59E0B" />}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  fontSize: 12,
                  height: 34,
                },
              }}
              style={{ width: 115 }}
            />

            {/* Client Filter Dropdown */}
            <Select
              size="xs"
              radius="md"
              data={clientOptions}
              value={clientFilter}
              onChange={handleClientChange}
              leftSection={<IconBuilding size={13} color="#06B6D4" />}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  fontSize: 12,
                  height: 34,
                },
              }}
              style={{ width: 130 }}
              searchable
            />

            {/* Date Filter Dropdown */}
            <DateFilterControl
              value={dateFilter}
              onChange={setDateFilter}
              width={110}
            />

            {/* Clear Filters Button */}
            {isFiltered && (
              <Tooltip label="Reset all filters" withArrow position="top">
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  radius="md"
                  onClick={handleResetFilters}
                  leftSection={<IconRefresh size={13} />}
                  style={{
                    height: 34,
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  Clear
                </Button>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Paper>

          {/* 3. Main Projects Table */}
          <ProjectTableView
            projects={filteredProjects}
            totalProjects={dateFilter.type !== 'ALL' ? filteredProjects.length : pagination.total}
            loading={loading}
            currentPage={pagination.page}
            totalPages={
              dateFilter.type !== 'ALL'
                ? Math.max(1, Math.ceil(filteredProjects.length / (pagination.limit || 10)))
                : Math.max(1, pagination.totalPages)
            }
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
