import React, { useState } from 'react';
import {
  Box,
  Paper,
  Text,
  Group,
  SimpleGrid,
  Avatar,
  Badge,
  Button,
  Progress,
  Modal,
  Select,
  MultiSelect,
  Tooltip,
  ActionIcon,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconUsers,
  IconUserCheck,
  IconPlus,
  IconBriefcase,
  IconMail,
  IconCircleCheck,
  IconAlertCircle,
  IconUserPlus,
} from '@tabler/icons-react';
import { Project } from '../../../types/project';

interface TeamMemberAllocation {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  avatarColor: string;
  assignedProjectIds: string[];
  maxCapacity: number;
}

interface ProjectTeamAssignmentProps {
  projects: Project[];
  onUpdateProject?: (id: string, data: any) => Promise<any>;
}

export const ProjectTeamAssignment: React.FC<ProjectTeamAssignmentProps> = ({ projects }) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [assignModalOpened, setAssignModalOpened] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberAllocation | null>(null);
  const [targetProjectIds, setTargetProjectIds] = useState<string[]>([]);

  // Team allocation data
  const [teamMembers, setTeamMembers] = useState<TeamMemberAllocation[]>([
    {
      id: 'emp-1',
      name: 'Santhosh C',
      role: 'Lead Full-Stack Architect',
      department: 'Engineering',
      email: 'sandy@gmail.com',
      avatarColor: '#2563EB',
      assignedProjectIds: ['P001', 'P003', 'P006'],
      maxCapacity: 4,
    },
    {
      id: 'emp-2',
      name: 'Priya S',
      role: 'Senior Mobile Developer',
      department: 'Mobile Apps',
      email: 'priya.s@oneassist.io',
      avatarColor: '#10B981',
      assignedProjectIds: ['P001', 'P002', 'P004'],
      maxCapacity: 3,
    },
    {
      id: 'emp-3',
      name: 'Rahul K',
      role: 'Backend & DevOps Engineer',
      department: 'Cloud & Infrastructure',
      email: 'rahul.k@oneassist.io',
      avatarColor: '#8B5CF6',
      assignedProjectIds: ['P001', 'P003', 'P005'],
      maxCapacity: 3,
    },
    {
      id: 'emp-4',
      name: 'Sneha R',
      role: 'Lead UI/UX Designer',
      department: 'Product Design',
      email: 'sneha.r@oneassist.io',
      avatarColor: '#EC4899',
      assignedProjectIds: ['P002', 'P004', 'P006'],
      maxCapacity: 4,
    },
    {
      id: 'emp-5',
      name: 'Arjun M',
      role: 'Database & ERP Specialist',
      department: 'Enterprise Solutions',
      email: 'arjun.m@oneassist.io',
      avatarColor: '#F59E0B',
      assignedProjectIds: ['P002', 'P004', 'P005'],
      maxCapacity: 3,
    },
    {
      id: 'emp-6',
      name: 'Vikram S',
      role: 'AI / ML Solutions Engineer',
      department: 'AI Lab',
      email: 'vikram.s@oneassist.io',
      avatarColor: '#06B6D4',
      assignedProjectIds: ['P003', 'P005', 'P006'],
      maxCapacity: 3,
    },
  ]);

  const handleOpenAssignModal = (member: TeamMemberAllocation) => {
    setSelectedMember(member);
    setTargetProjectIds(member.assignedProjectIds);
    setAssignModalOpened(true);
  };

  const handleSaveAssignment = () => {
    if (!selectedMember) return;
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === selectedMember.id ? { ...m, assignedProjectIds: targetProjectIds } : m
      )
    );
    setAssignModalOpened(false);
  };

  const totalAssignedSlots = teamMembers.reduce((acc, m) => acc + m.assignedProjectIds.length, 0);
  const totalCapacitySlots = teamMembers.reduce((acc, m) => acc + m.maxCapacity, 0);
  const overallUtilization = Math.round((totalAssignedSlots / totalCapacitySlots) * 100);

  return (
    <Box>
      {/* 1. Resource Utilization Summary Banner */}
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
          <Group gap="lg">
            <Box>
              <Text size="xs" fw={600} c="dimmed">
                Total Team Members
              </Text>
              <Text fw={800} size="xl" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                {teamMembers.length} Engineers & Leads
              </Text>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed">
                Active Projects Managed
              </Text>
              <Text fw={800} size="xl" c="blue">
                {projects.length} Projects
              </Text>
            </Box>
          </Group>

          <Box style={{ minWidth: 260 }}>
            <Group justify="space-between" mb={4}>
              <Text size="xs" fw={600} c="dimmed">
                Team Workload Utilization
              </Text>
              <Text size="xs" fw={700} c={overallUtilization > 85 ? 'orange' : 'teal'}>
                {overallUtilization}% ({totalAssignedSlots}/{totalCapacitySlots} Slots)
              </Text>
            </Group>
            <Progress
              value={overallUtilization}
              size="sm"
              radius="xl"
              color={overallUtilization > 85 ? 'orange' : '#2563EB'}
            />
          </Box>
        </Group>
      </Paper>

      {/* 2. Team Members Cards Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {teamMembers.map((member) => {
          const projectCount = member.assignedProjectIds.length;
          const loadPercent = Math.min(100, Math.round((projectCount / member.maxCapacity) * 100));

          let statusLabel = 'Available';
          let statusColor = 'green';
          if (loadPercent >= 90) {
            statusLabel = 'At Capacity';
            statusColor = 'orange';
          } else if (loadPercent >= 60) {
            statusLabel = 'Optimal Load';
            statusColor = 'blue';
          }

          return (
            <Paper
              key={member.id}
              p="md"
              radius="md"
              style={{
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Top Profile Header */}
              <Box>
                <Group justify="space-between" mb="xs" align="flex-start">
                  <Group gap="sm">
                    <Avatar
                      size={42}
                      radius="xl"
                      style={{
                        backgroundColor: member.avatarColor,
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {member.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                        {member.name}
                      </Text>
                      <Text size="11px" fw={600} c="dimmed">
                        {member.role}
                      </Text>
                    </Box>
                  </Group>

                  <Badge size="xs" variant="light" color={statusColor} radius="sm">
                    {statusLabel}
                  </Badge>
                </Group>

                <Group gap={6} mb="sm" c="dimmed">
                  <IconMail size={13} />
                  <Text size="11px">{member.email}</Text>
                </Group>

                {/* Capacity Progress Bar */}
                <Box mb="md">
                  <Group justify="space-between" mb={3}>
                    <Text size="11px" fw={600} c="dimmed">
                      Assigned Workload
                    </Text>
                    <Text size="11px" fw={700} style={{ color: isDark ? '#93C5FD' : '#2563EB' }}>
                      {projectCount} / {member.maxCapacity} Projects
                    </Text>
                  </Group>
                  <Progress
                    value={loadPercent}
                    size="sm"
                    radius="xl"
                    color={loadPercent >= 90 ? 'orange' : '#2563EB'}
                  />
                </Box>

                {/* Assigned Projects Badges */}
                <Text size="11px" fw={700} c="dimmed" tt="uppercase" mb={6} style={{ letterSpacing: '0.04em' }}>
                  Assigned Software Projects
                </Text>
                <Group gap={6} wrap="wrap" mb="md">
                  {member.assignedProjectIds.map((pid) => {
                    const proj = projects.find((p) => p.projectId === pid);
                    return (
                      <Badge
                        key={pid}
                        size="sm"
                        variant="outline"
                        color="blue"
                        radius="md"
                        style={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        {pid} • {proj?.name || 'Project'}
                      </Badge>
                    );
                  })}
                </Group>
              </Box>

              {/* Action Button */}
              <Button
                size="xs"
                variant="light"
                color="blue"
                radius="md"
                fullWidth
                leftSection={<IconUserPlus size={14} />}
                onClick={() => handleOpenAssignModal(member)}
              >
                Manage Project Allocation
              </Button>
            </Paper>
          );
        })}
      </SimpleGrid>

      {/* Modal for Allocating Projects */}
      <Modal
        opened={assignModalOpened}
        onClose={() => setAssignModalOpened(false)}
        title={
          <Group gap={8}>
            <IconUserPlus size={18} color="#2563EB" />
            <Text fw={700} size="sm">
              Assign Projects to {selectedMember?.name}
            </Text>
          </Group>
        }
        radius="md"
        size="md"
      >
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Text size="xs" c="dimmed">
            Select the software projects this engineer should be allocated to. Their profile and avatar will appear across project task assignments and table stacks.
          </Text>

          <MultiSelect
            label="Select Active Projects"
            placeholder="Choose projects..."
            data={projects.map((p) => ({
              value: p.projectId,
              label: `${p.projectId} - ${p.name} (${p.clientName})`,
            }))}
            value={targetProjectIds}
            onChange={setTargetProjectIds}
            searchable
            clearable
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" size="xs" onClick={() => setAssignModalOpened(false)}>
              Cancel
            </Button>
            <Button size="xs" color="blue" onClick={handleSaveAssignment}>
              Save Allocations
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};

export default ProjectTeamAssignment;
