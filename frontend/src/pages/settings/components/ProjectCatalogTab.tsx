import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  TextInput,
  Table,
  Modal,
  LoadingOverlay,
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
  IconFolders,
  IconComponents,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { MasterProject } from '../../../types/settings';
import { settingsService } from '../../../services/settingsService';
import { ProjectModuleModal } from './ProjectModuleModal';

export const ProjectCatalogTab: React.FC = () => {
  const [projects, setProjects] = useState<MasterProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  // Modal State
  const [modalOpened, setModalOpened] = useState(false);
  const [editingProject, setEditingProject] = useState<MasterProject | null>(null);

  // Delete Confirmation State
  const [projectToDelete, setProjectToDelete] = useState<MasterProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Projects from API (only user-added master projects)
  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getMasterProjects({
        search: search.trim() || undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setProjects(res.data);
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error Loading Projects',
        message: err.message || 'Failed to fetch projects',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Search trigger on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      loadProjects();
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProject(null);
    setModalOpened(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (proj: MasterProject) => {
    setEditingProject(proj);
    setModalOpened(true);
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await settingsService.deleteMasterProject(projectToDelete.id);
      notifications.show({
        title: 'Project Deleted',
        message: `Removed ${projectToDelete.name} from catalog`,
        color: 'gray',
      });
      setProjectToDelete(null);
      loadProjects();
    } catch (err: any) {
      notifications.show({
        title: 'Delete Failed',
        message: err.message || 'Could not delete project',
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Stack gap="md">
      {/* 1. Header Toolbar */}
      <Group justify="space-between" align="center">
        <Box>
          <Group gap="xs" align="center">
            <Text fw={800} size="20px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
              Project Catalog
            </Text>
            <Badge size="sm" variant="light" color="indigo">
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" mt={2}>
            Manage project templates and their configured module scope
          </Text>
        </Box>
        <Button
          color="indigo"
          size="sm"
          radius="md"
          leftSection={<IconPlus size={16} />}
          onClick={handleOpenCreate}
        >
          Add Project
        </Button>
      </Group>

      {/* 2. Search Bar */}
      <Paper p="xs" radius="md" withBorder bg="var(--mantine-color-default)">
        <Group justify="space-between" align="center" gap="sm">
          <TextInput
            placeholder="Search projects or module names... (Press Enter)"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            onKeyDown={handleSearchKeyDown}
            style={{ flex: 1 }}
            size="sm"
          />
          <Button variant="light" color="indigo" size="sm" onClick={loadProjects}>
            Search
          </Button>
        </Group>
      </Paper>

      {/* 3. Streamlined Table View */}
      <Box pos="relative" style={{ minHeight: 200 }}>
        <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ blur: 1 }} />

        {projects.length === 0 && !loading ? (
          <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
            <IconFolders size={48} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
            <Text fw={700} size="md">
              No Projects Added Yet
            </Text>
            <Text size="sm" c="dimmed" mt={4} mb="md">
              Click the button below to add your project name and configure its modules.
            </Text>
            <Button color="indigo" leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
              Add Project
            </Button>
          </Paper>
        ) : (
          <Paper withBorder radius="md" style={{ overflow: 'hidden' }} bg="var(--mantine-color-default)">
            <Table.ScrollContainer minWidth={600}>
              <Table highlightOnHover verticalSpacing="md" horizontalSpacing="md">
              <Table.Thead style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                <Table.Tr>
                  <Table.Th style={{ width: 50, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>
                    #
                  </Table.Th>
                  <Table.Th style={{ width: 110, fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>
                    CODE
                  </Table.Th>
                  <Table.Th style={{ width: 220, fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>
                    PROJECT NAME
                  </Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>
                    CONFIGURED MODULES
                  </Table.Th>
                  <Table.Th style={{ width: 140, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>
                    TOTAL MODULES
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'right', width: 90, fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>
                    ACTIONS
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {projects.map((proj, index) => {
                  const mList = Array.isArray(proj.modules) ? proj.modules : [];

                  return (
                    <Table.Tr key={proj.id} style={{ transition: 'background-color 0.15s ease' }}>
                      {/* S.No */}
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Text size="xs" c="dimmed" fw={600}>
                          {index + 1}
                        </Text>
                      </Table.Td>

                      {/* Code */}
                      <Table.Td>
                        <Badge
                          size="sm"
                          variant="outline"
                          color="indigo"
                          radius="sm"
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {proj.projectCode || `PRJ-${String(index + 1).padStart(2, '0')}`}
                        </Badge>
                      </Table.Td>

                      {/* Project Name */}
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Box
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#4F46E5',
                              flexShrink: 0,
                            }}
                          >
                            <IconFolders size={17} />
                          </Box>
                          <Text
                            fw={700}
                            size="sm"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleOpenEdit(proj)}
                          >
                            {proj.name}
                          </Text>
                        </Group>
                      </Table.Td>

                      {/* Modules Pills */}
                      <Table.Td>
                        {mList.length > 0 ? (
                          <Group gap={6} wrap="wrap" align="center">
                            {mList.slice(0, 2).map((m: any, mIdx: number) => {
                              const moduleName = typeof m === 'string' ? m : m.name;
                              return (
                                <Box
                                  key={m.id || mIdx}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: isDark ? 'rgba(99, 102, 241, 0.15)' : '#F1F5F9',
                                    border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #E2E8F0',
                                    color: isDark ? '#C7D2FE' : '#334155',
                                  }}
                                >
                                  <Box
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      background: '#6366F1',
                                    }}
                                  />
                                  {moduleName}
                                </Box>
                              );
                            })}

                            {mList.length > 2 && (
                              <Tooltip
                                label={mList
                                  .slice(2)
                                  .map((m: any) => (typeof m === 'string' ? m : m.name))
                                  .join(', ')}
                                withArrow
                                multiline
                                w={220}
                              >
                                <Box
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                                    color: isDark ? '#E2E8F0' : '#475569',
                                    cursor: 'pointer',
                                  }}
                                >
                                  +{mList.length - 2} more
                                </Box>
                              </Tooltip>
                            )}
                          </Group>
                        ) : (
                          <Text size="xs" c="dimmed">
                            No modules configured
                          </Text>
                        )}
                      </Table.Td>

                      {/* Total Modules */}
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Badge
                          size="md"
                          variant="light"
                          color="teal"
                          radius="xl"
                          leftSection={<IconComponents size={12} />}
                          styles={{ label: { overflow: 'visible', fontWeight: 600 } }}
                        >
                          {mList.length} {mList.length === 1 ? 'Module' : 'Modules'}
                        </Badge>
                      </Table.Td>

                      {/* Actions */}
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap={6} justify="flex-end" wrap="nowrap">
                          <Tooltip label="Edit Project & Modules" withArrow>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="indigo"
                              radius="md"
                              onClick={() => handleOpenEdit(proj)}
                            >
                              <IconPencil size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete Project" withArrow>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              radius="md"
                              onClick={() => setProjectToDelete(proj)}
                            >
                              <IconTrash size={16} />
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
        </Paper>
        )}
      </Box>

      {/* Create / Edit Project Modal */}
      <ProjectModuleModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        projectToEdit={editingProject}
        onSuccess={() => loadProjects()}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        opened={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title={
          <Text fw={700} size="md" c="red">
            Delete Project?
          </Text>
        }
        size="sm"
        radius="md"
      >
        <Text size="sm">
          Are you sure you want to delete <b>{projectToDelete?.name}</b>? This will remove this project and its modules from the catalog.
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setProjectToDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete} loading={deleting}>
            Confirm Delete
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
};

export default ProjectCatalogTab;
