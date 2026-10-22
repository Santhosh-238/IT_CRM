import React, { useState } from 'react';
import {
  Box,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Paper,
  Progress,
  SimpleGrid,
  ThemeIcon,
  Modal,
  TextInput,
  NumberInput,
  Select,
  ActionIcon,
  Divider,
} from '@mantine/core';
import {
  IconRocket,
  IconPlus,
  IconCheck,
  IconExternalLink,
  IconClock,
  IconUser,
  IconCode,
  IconCalendar,
  IconArrowLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Lead } from '../../../../types/lead';
import { LeadProgressData, ProjectMilestoneItem } from './types';

export interface LeadProgressSectionProps {
  lead: Lead;
  isDark: boolean;
  progress: LeadProgressData;
  onUpdateProgress: (progress: LeadProgressData) => void;
  onNavigateSection: (section: any) => void;
}

export const LeadProgressSection: React.FC<LeadProgressSectionProps> = ({
  lead,
  isDark,
  progress,
  onUpdateProgress,
  onNavigateSection,
}) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTargetDate, setNewTargetDate] = useState(
    new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const handleAddMilestone = () => {
    if (!newTitle.trim()) {
      notifications.show({ title: 'Title Required', message: 'Please enter milestone title.', color: 'red' });
      return;
    }

    const newMs: ProjectMilestoneItem = {
      id: `ms-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      percentage: 0,
      status: 'Upcoming',
      targetDate: newTargetDate,
    };

    const updatedMilestones = [...progress.milestones, newMs];
    const updated: LeadProgressData = {
      ...progress,
      milestones: updatedMilestones,
    };

    onUpdateProgress(updated);
    setNewTitle('');
    setNewDesc('');
    setModalOpened(false);

    notifications.show({
      title: 'Milestone Added',
      message: `${newMs.title} added to project roadmap.`,
      color: 'teal',
    });
  };

  const handleAdvanceMilestone = (msId: string) => {
    const updatedMilestones = progress.milestones.map((ms: ProjectMilestoneItem) => {
      if (ms.id === msId) {
        if (ms.status === 'Upcoming') {
          return { ...ms, status: 'In Progress' as const, percentage: 50 };
        }
        if (ms.status === 'In Progress') {
          return { ...ms, status: 'Completed' as const, percentage: 100 };
        }
        return { ...ms, status: 'Upcoming' as const, percentage: 0 };
      }
      return ms;
    });

    const completedCount = updatedMilestones.filter((m: ProjectMilestoneItem) => m.status === 'Completed').length;
    const inProgCount = updatedMilestones.filter((m: ProjectMilestoneItem) => m.status === 'In Progress').length;
    const computedOverall = Math.round(
      ((completedCount * 100 + inProgCount * 50) / (updatedMilestones.length * 100)) * 100
    );

    const updated: LeadProgressData = {
      ...progress,
      overallPercentage: Math.min(100, Math.max(0, computedOverall)),
      status: computedOverall === 100 ? 'Completed' : 'In Development',
      milestones: updatedMilestones,
    };

    onUpdateProgress(updated);
    notifications.show({
      title: 'Roadmap Updated',
      message: `Overall delivery progress is now ${computedOverall}%.`,
      color: 'blue',
    });
  };

  return (
    <Box>
      {/* Top Header */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <div>
          <Group gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" color="orange" variant="light">
              <IconRocket size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                Implementation & Delivery Progress
              </Text>
              <Text size="xs" c="dimmed">
                Post-sale project delivery and technical milestones for {lead.name} ({lead.companyName || 'Lead'})
              </Text>
            </div>
          </Group>
        </div>

        <Group gap="xs">
          <Button
            size="sm"
            variant="default"
            leftSection={<IconArrowLeft size={15} />}
            onClick={() => onNavigateSection('payment')}
            style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
          >
            Back to Payment
          </Button>

          <Button
            size="sm"
            leftSection={<IconPlus size={15} />}
            onClick={() => setModalOpened(true)}
            style={{
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: '#FFF',
              borderRadius: 10,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            }}
          >
            Add Milestone
          </Button>
        </Group>
      </Group>

      {/* Main Project Card */}
      <Paper
        p="xl"
        radius="16px"
        mb="lg"
        style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.03)',
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md" mb="md">
          <div>
            <Group gap="xs" align="center" mb={6}>
              <Badge size="lg" color="orange" variant="light" style={{ fontWeight: 700 }}>
                {progress.projectCode}
              </Badge>
              <Badge size="lg" color="blue" variant="filled" style={{ fontWeight: 700 }}>
                {progress.status}
              </Badge>
            </Group>
            <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              {progress.projectName}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Target Delivery: <strong>{progress.targetDeliveryDate}</strong>
            </Text>
          </div>

          <Box style={{ textAlign: 'right', minWidth: 200 }}>
            <Group justify="flex-end" gap={6} align="baseline" mb={4}>
              <Text size="26px" fw={900} style={{ color: '#F97316' }}>
                {progress.overallPercentage}%
              </Text>
              <Text size="xs" c="dimmed">
                Completed
              </Text>
            </Group>
            <Progress
              value={progress.overallPercentage}
              size="lg"
              radius="xl"
              color="orange"
              animated={progress.overallPercentage < 100}
            />
          </Box>
        </Group>

        <Divider mb="lg" />

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
          <Paper
            p="md"
            radius="12px"
            style={{
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconUser size={15} color="#6366F1" />
              <Text size="xs" fw={700} c="dimmed">
                PROJECT MANAGER
              </Text>
            </Group>
            <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
              {progress.projectManager}
            </Text>
          </Paper>

          <Paper
            p="md"
            radius="12px"
            style={{
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconCode size={15} color="#10B981" />
              <Text size="xs" fw={700} c="dimmed">
                TECH LEAD
              </Text>
            </Group>
            <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
              {progress.techLead}
            </Text>
          </Paper>

          <Paper
            p="md"
            radius="12px"
            style={{
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconCalendar size={15} color="#F59E0B" />
              <Text size="xs" fw={700} c="dimmed">
                TARGET DELIVERY
              </Text>
            </Group>
            <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
              {progress.targetDeliveryDate}
            </Text>
          </Paper>
        </SimpleGrid>

        {/* Milestones Roadmap List */}
        <Box>
          <Text size="xs" fw={800} style={{ color: isDark ? '#FDBA74' : '#EA580C', letterSpacing: '0.04em' }} mb="md">
            DELIVERY ROADMAP & PHASE MILESTONES
          </Text>

          <Stack gap="md">
            {progress.milestones.map((ms: ProjectMilestoneItem, idx: number) => (
              <Paper
                key={ms.id}
                p="md"
                radius="12px"
                style={{
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  border:
                    ms.status === 'Completed'
                      ? '1px solid #10B981'
                      : ms.status === 'In Progress'
                      ? '1px solid #F97316'
                      : isDark
                      ? '1px solid #334155'
                      : '1px solid #E2E8F0',
                }}
              >
                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                  <Group gap="md">
                    <ThemeIcon
                      size="md"
                      radius="xl"
                      color={ms.status === 'Completed' ? 'green' : ms.status === 'In Progress' ? 'orange' : 'gray'}
                      variant={ms.status === 'Completed' ? 'filled' : 'light'}
                    >
                      {ms.status === 'Completed' ? <IconCheck size={14} /> : <Text size="xs" fw={800}>{idx + 1}</Text>}
                    </ThemeIcon>

                    <div>
                      <Group gap="xs" align="center">
                        <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                          {ms.title}
                        </Text>
                        <Badge
                          size="xs"
                          color={ms.status === 'Completed' ? 'green' : ms.status === 'In Progress' ? 'orange' : 'gray'}
                          variant="light"
                        >
                          {ms.status}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" mt={2}>
                        {ms.description} • Target: {ms.targetDate}
                      </Text>
                    </div>
                  </Group>

                  <Group gap="sm" align="center">
                    <Text size="xs" fw={700} c="dimmed">
                      {ms.percentage}%
                    </Text>
                    <Button
                      size="xs"
                      variant="light"
                      color={ms.status === 'Completed' ? 'gray' : 'orange'}
                      onClick={() => handleAdvanceMilestone(ms.id)}
                      style={{ borderRadius: 8, fontWeight: 600 }}
                    >
                      {ms.status === 'Upcoming'
                        ? 'Start Phase'
                        : ms.status === 'In Progress'
                        ? 'Mark Done ✓'
                        : 'Reopen Phase'}
                    </Button>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Paper>

      {/* Modal: Add Milestone */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        size="md"
        radius="16px"
        title={<Text fw={700}>Add Delivery Milestone</Text>}
      >
        <Stack gap="md">
          <TextInput
            label="Milestone Phase Name"
            placeholder="e.g. Mobile App API Integration & Push Notification Engine"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <TextInput
            label="Deliverable Scope Description"
            placeholder="Summary of engineering outcomes and deliverables"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />

          <TextInput
            label="Target Completion Date"
            type="date"
            value={newTargetDate}
            onChange={(e) => setNewTargetDate(e.target.value)}
            required
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMilestone}
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: '#FFF',
                fontWeight: 700,
              }}
            >
              Add Milestone ✓
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default LeadProgressSection;
