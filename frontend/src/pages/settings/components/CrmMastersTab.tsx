import React, { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  Button,
  Box,
  TagsInput,
  LoadingOverlay,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconCheck,
  IconPencil,
  IconRotateClockwise,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { CrmPipelinePresets } from '../../../types/settings';
import { settingsService } from '../../../services/settingsService';

export const CrmMastersTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [presets, setPresets] = useState<CrmPipelinePresets>({
    leadStages: [],
    leadSources: [],
    priorities: [],
    projectTypes: [],
    categories: [],
    unqualifiedReasons: [],
  });

  const loadPresets = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getCrmPipelineSettings();
      if (res.success && res.data) {
        setPresets((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to load CRM presets',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  const handleTagsChange = (field: keyof CrmPipelinePresets, value: string[]) => {
    setPresets((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await settingsService.updateCrmPipelineSettings(presets);
      if (res.success) {
        notifications.show({
          title: 'Pipeline Settings Saved',
          message: 'Lead stages and project categories updated successfully.',
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Save Failed',
        message: err.message || 'Failed to update CRM presets',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const res = await settingsService.resetSetting('crm_pipeline');
      if (res.success && res.data) {
        setPresets(res.data);
        notifications.show({
          title: 'Reset Completed',
          message: 'CRM pipeline presets reset to defaults.',
          color: 'blue',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Reset Error',
        message: err.message,
        color: 'red',
      });
    }
  };

  const cardStyle = {
    backgroundColor: isDark ? '#111827' : '#FFFFFF',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECF0',
    borderRadius: '16px',
    boxShadow: isDark ? 'none' : '0 1px 3px rgba(16, 24, 40, 0.05)',
  };

  const editButtonStyle = {
    borderRadius: '100px',
    fontWeight: 500,
    fontSize: '13px',
    padding: '6px 14px',
    height: '32px',
    color: isDark ? '#94A3B8' : '#475569',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#D0D5DD',
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
  };

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ blur: 1 }} />

      <Group justify="space-between" align="center" mb="md">
        <Text fw={800} size="20px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
          CRM Pipeline
        </Text>
        <Group gap="xs">
          <Button
            variant="default"
            size="xs"
            radius="xl"
            leftSection={<IconRotateClockwise size={13} />}
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            color="blue"
            size="xs"
            radius="xl"
            loading={saving}
            onClick={handleSave}
          >
            Save Pipeline
          </Button>
        </Group>
      </Group>

      <Stack gap="md">
        {/* CARD 1: Pipeline Stages */}
        <Paper p="lg" style={cardStyle}>
          <Group justify="space-between" align="center" mb="sm">
            <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#101828' }}>
              Sales Pipeline Stages
            </Text>
            <Button variant="default" style={editButtonStyle} rightSection={<IconPencil size={13} />} onClick={handleSave}>
              Save
            </Button>
          </Group>
          <Text size="xs" c="dimmed" mb="xs">
            Stages used across CRM leads, deals, and sales progression pipeline.
          </Text>
          <TagsInput
            placeholder="Type new stage and press Enter"
            value={presets.leadStages}
            onChange={(val) => handleTagsChange('leadStages', val)}
          />
        </Paper>

        {/* CARD 2: Lead Acquisition Sources */}
        <Paper p="lg" style={cardStyle}>
          <Group justify="space-between" align="center" mb="sm">
            <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#101828' }}>
              Lead Acquisition Channels
            </Text>
            <Button variant="default" style={editButtonStyle} rightSection={<IconPencil size={13} />} onClick={handleSave}>
              Save
            </Button>
          </Group>
          <Text size="xs" c="dimmed" mb="xs">
            Marketing channels where potential inbound/outbound client leads originate.
          </Text>
          <TagsInput
            placeholder="Type channel and press Enter"
            value={presets.leadSources}
            onChange={(val) => handleTagsChange('leadSources', val)}
          />
        </Paper>

        {/* CARD 3: Project Domain Categories */}
        <Paper p="lg" style={cardStyle}>
          <Group justify="space-between" align="center" mb="sm">
            <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#101828' }}>
              Service Domain Categories
            </Text>
            <Button variant="default" style={editButtonStyle} rightSection={<IconPencil size={13} />} onClick={handleSave}>
              Save
            </Button>
          </Group>
          <Text size="xs" c="dimmed" mb="xs">
            Domain categories displayed in master project catalog and client proposals.
          </Text>
          <TagsInput
            placeholder="Type category and press Enter"
            value={presets.categories}
            onChange={(val) => handleTagsChange('categories', val)}
          />
        </Paper>

        {/* CARD 4: Disqualification Reasons */}
        <Paper p="lg" style={cardStyle}>
          <Group justify="space-between" align="center" mb="sm">
            <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#101828' }}>
              Lead Disqualification Reasons
            </Text>
            <Button variant="default" style={editButtonStyle} rightSection={<IconPencil size={13} />} onClick={handleSave}>
              Save
            </Button>
          </Group>
          <Text size="xs" c="dimmed" mb="xs">
            Preset drop reasons available when marking a lead as unqualified.
          </Text>
          <TagsInput
            placeholder="Type drop reason and press Enter"
            value={presets.unqualifiedReasons}
            onChange={(val) => handleTagsChange('unqualifiedReasons', val)}
          />
        </Paper>
      </Stack>
    </Box>
  );
};

export default CrmMastersTab;
