import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  TextInput,
  Button,
  Text,
  Paper,
  ActionIcon,
  Tooltip,
  Badge,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconCheck,
  IconFolders,
  IconComponents,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { MasterProject, MasterModuleItem, MasterProjectFormData } from '../../../types/settings';
import { settingsService } from '../../../services/settingsService';

interface ProjectModuleModalProps {
  opened: boolean;
  onClose: () => void;
  projectToEdit?: MasterProject | null;
  onSuccess: (savedProject: MasterProject) => void;
}

export const ProjectModuleModal: React.FC<ProjectModuleModalProps> = ({
  opened,
  onClose,
  projectToEdit,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [modules, setModules] = useState<MasterModuleItem[]>([]);
  const [newModuleName, setNewModuleName] = useState('');

  // Populate data when opening / editing
  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setModules(
        Array.isArray(projectToEdit.modules)
          ? projectToEdit.modules.map((m: any, idx: number) => ({
              id: m.id || `mod-${Date.now()}-${idx}`,
              name: typeof m === 'string' ? m : m.name || '',
            }))
          : []
      );
    } else {
      setName('');
      setModules([]);
    }
    setNewModuleName('');
  }, [projectToEdit, opened]);

  // Add new module to list
  const handleAddModule = () => {
    const trimmed = newModuleName.trim();
    if (!trimmed) return;

    const newModule: MasterModuleItem = {
      id: `mod-${Date.now()}-${modules.length}`,
      name: trimmed,
    };

    setModules([...modules, newModule]);
    setNewModuleName('');
  };

  // Handle enter key in module input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddModule();
    }
  };

  // Remove module
  const handleRemoveModule = (id: string) => {
    setModules(modules.filter((m) => m.id !== id));
  };

  // Save project
  const handleSubmit = async () => {
    if (!name.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a project name',
        color: 'red',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: MasterProjectFormData = {
        name: name.trim(),
        modules,
      };

      let result: MasterProject;
      if (projectToEdit?.id) {
        const res = await settingsService.updateMasterProject(projectToEdit.id, payload);
        result = res.data;
        notifications.show({
          title: 'Project Updated',
          message: `${result.name} updated successfully!`,
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
      } else {
        const res = await settingsService.createMasterProject(payload);
        result = res.data;
        notifications.show({
          title: 'Project Created',
          message: `${result.name} created with ${modules.length} modules!`,
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      notifications.show({
        title: 'Save Failed',
        message: err.message || 'Failed to save project',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <IconFolders size={18} />
          </Box>
          <Box>
            <Text fw={700} size="md">
              {projectToEdit ? 'Edit Project' : 'Add Project'}
            </Text>
            <Text size="xs" c="dimmed">
              Define the project name and its included modules
            </Text>
          </Box>
        </Group>
      }
      size="lg"
      radius="md"
    >
      <Stack gap="md" mt="xs">
        {/* 1. Project Name */}
        <TextInput
          label="Project Name"
          placeholder="e.g. Hospital Management System, E-Commerce Platform"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
          size="sm"
          autoFocus
        />

        <Divider label="Project Modules" labelPosition="left" />

        {/* 2. Add Module Inline Input */}
        <Group align="flex-end" gap="xs">
          <TextInput
            label="Add Module"
            placeholder="e.g. User Authentication, Billing, Dashboard..."
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
            size="sm"
          />
          <Button
            color="indigo"
            size="sm"
            leftSection={<IconPlus size={16} />}
            onClick={handleAddModule}
            disabled={!newModuleName.trim()}
          >
            Add Module
          </Button>
        </Group>

        {/* 3. Modules List */}
        <Box>
          <Group justify="space-between" mb={6}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Configured Modules
            </Text>
            <Badge size="sm" variant="light" color="indigo">
              {modules.length} {modules.length === 1 ? 'Module' : 'Modules'}
            </Badge>
          </Group>

          {modules.length === 0 ? (
            <Paper p="md" withBorder radius="md" style={{ textAlign: 'center' }}>
              <IconComponents size={32} color="#9CA3AF" style={{ margin: '0 auto 6px' }} />
              <Text size="sm" c="dimmed">
                No modules added yet. Type a module name above and click <b>Add Module</b>.
              </Text>
            </Paper>
          ) : (
            <Stack gap={6} style={{ maxHeight: 280, overflowY: 'auto' }}>
              {modules.map((m, index) => (
                <Paper
                  key={m.id || index}
                  p="xs"
                  withBorder
                  radius="sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Group gap="xs">
                    <Badge size="xs" variant="filled" color="indigo" radius="sm">
                      #{index + 1}
                    </Badge>
                    <Text size="sm" fw={600}>
                      {m.name}
                    </Text>
                  </Group>
                  <Tooltip label="Remove module">
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      onClick={() => handleRemoveModule(m.id)}
                    >
                      <IconTrash size={15} />
                    </ActionIcon>
                  </Tooltip>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        {/* Footer Actions */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button color="indigo" onClick={handleSubmit} loading={submitting}>
            {projectToEdit ? 'Update Project' : 'Save Project'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ProjectModuleModal;
