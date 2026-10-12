import React from 'react';
import {
  Box,
  Paper,
  Text,
  Group,
  SimpleGrid,
  Progress,
  Badge,
  Table,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconCurrencyRupee,
  IconChartBar,
  IconTrendingUp,
  IconClock,
  IconCircleCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Project, ProjectStats } from '../../../types/project';

interface ProjectReportsProps {
  projects: Project[];
  stats: ProjectStats | null;
}

export const ProjectReports: React.FC<ProjectReportsProps> = ({ projects, stats }) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.estimatedBudget) || 0), 0);
  const totalCost = projects.reduce((acc, p) => acc + (Number(p.actualCost) || 0), 0);
  const totalMargin = totalBudget - totalCost;
  const marginPercent = totalBudget > 0 ? Math.round((totalMargin / totalBudget) * 100) : 0;

  const inProgressCount = projects.filter((p) => p.status === 'In Progress').length;
  const planningCount = projects.filter((p) => p.status === 'Planning').length;
  const onHoldCount = projects.filter((p) => p.status === 'On Hold').length;
  const notStartedCount = projects.filter((p) => p.status === 'Not Started').length;
  const completedCount = projects.filter((p) => p.status === 'Completed').length;

  const highPriorityCount = projects.filter((p) => p.priority === 'High' || p.priority === 'Urgent').length;
  const mediumPriorityCount = projects.filter((p) => p.priority === 'Medium').length;
  const lowPriorityCount = projects.filter((p) => p.priority === 'Low').length;

  return (
    <Box>
      {/* 1. Top Financial & Delivery KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="lg">
        <Paper
          p="md"
          radius="md"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Portfolio Contract Value
            </Text>
            <IconCurrencyRupee size={20} color="#2563EB" />
          </Group>
          <Text fw={800} size="22px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            ₹{totalBudget.toLocaleString()}
          </Text>
          <Text size="11px" c="dimmed" mt={4}>
            Across {projects.length} active client contracts
          </Text>
        </Paper>

        <Paper
          p="md"
          radius="md"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Actual Execution Cost
            </Text>
            <IconTrendingUp size={20} color="#F59E0B" />
          </Group>
          <Text fw={800} size="22px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            ₹{totalCost.toLocaleString()}
          </Text>
          <Text size="11px" c="dimmed" mt={4}>
            Resource & cloud infra spending
          </Text>
        </Paper>

        <Paper
          p="md"
          radius="md"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Estimated Net Margin
            </Text>
            <IconChartBar size={20} color="#10B981" />
          </Group>
          <Text fw={800} size="22px" c="teal">
            ₹{totalMargin.toLocaleString()} ({marginPercent}%)
          </Text>
          <Text size="11px" c="dimmed" mt={4}>
            Target profitability benchmark
          </Text>
        </Paper>

        <Paper
          p="md"
          radius="md"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Active Project Health
            </Text>
            <IconCircleCheck size={20} color="#06B6D4" />
          </Group>
          <Text fw={800} size="22px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            {inProgressCount + planningCount} Active
          </Text>
          <Text size="11px" c="dimmed" mt={4}>
            {onHoldCount} On Hold • {completedCount} Completed
          </Text>
        </Paper>
      </SimpleGrid>

      {/* 2. Visual Breakdowns Grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="lg">
        {/* Status Distribution */}
        <Paper
          p="md"
          radius="md"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Text fw={700} size="sm" mb="md" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            Lifecycle Status Distribution
          </Text>

          <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Box>
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={600}>
                  In Progress
                </Text>
                <Text size="xs" fw={700} c="green">
                  {inProgressCount} ({projects.length > 0 ? Math.round((inProgressCount / projects.length) * 100) : 0}%)
                </Text>
              </Group>
              <Progress value={projects.length > 0 ? (inProgressCount / projects.length) * 100 : 0} size="sm" color="green" radius="xl" />
            </Box>

            <Box>
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={600}>
                  Planning
                </Text>
                <Text size="xs" fw={700} c="blue">
                  {planningCount} ({projects.length > 0 ? Math.round((planningCount / projects.length) * 100) : 0}%)
                </Text>
              </Group>
              <Progress value={projects.length > 0 ? (planningCount / projects.length) * 100 : 0} size="sm" color="blue" radius="xl" />
            </Box>

            <Box>
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={600}>
                  Not Started
                </Text>
                <Text size="xs" fw={700} c="gray">
                  {notStartedCount} ({projects.length > 0 ? Math.round((notStartedCount / projects.length) * 100) : 0}%)
                </Text>
              </Group>
              <Progress value={projects.length > 0 ? (notStartedCount / projects.length) * 100 : 0} size="sm" color="gray" radius="xl" />
            </Box>

            <Box>
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={600}>
                  On Hold
                </Text>
                <Text size="xs" fw={700} c="pink">
                  {onHoldCount} ({projects.length > 0 ? Math.round((onHoldCount / projects.length) * 100) : 0}%)
                </Text>
              </Group>
              <Progress value={projects.length > 0 ? (onHoldCount / projects.length) * 100 : 0} size="sm" color="pink" radius="xl" />
            </Box>
          </Box>
        </Paper>

        {/* Priority & Urgency Breakdown */}
        <Paper
          p="md"
          radius="md"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Text fw={700} size="sm" mb="md" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            Priority & Risk Allocation
          </Text>

          <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Box>
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={600}>
                  High / Urgent Priority
                </Text>
                <Text size="xs" fw={700} c="red">
                  {highPriorityCount} Projects
                </Text>
              </Group>
              <Progress value={projects.length > 0 ? (highPriorityCount / projects.length) * 100 : 0} size="sm" color="red" radius="xl" />
            </Box>

            <Box>
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={600}>
                  Medium Priority
                </Text>
                <Text size="xs" fw={700} c="yellow">
                  {mediumPriorityCount} Projects
                </Text>
              </Group>
              <Progress value={projects.length > 0 ? (mediumPriorityCount / projects.length) * 100 : 0} size="sm" color="yellow" radius="xl" />
            </Box>

            <Box>
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={600}>
                  Low Priority
                </Text>
                <Text size="xs" fw={700} c="gray">
                  {lowPriorityCount} Projects
                </Text>
              </Group>
              <Progress value={projects.length > 0 ? (lowPriorityCount / projects.length) * 100 : 0} size="sm" color="gray" radius="xl" />
            </Box>
          </Box>
        </Paper>
      </SimpleGrid>

      {/* 3. Financial Budget vs Cost Breakdown Table */}
      <Paper
        p="md"
        radius="md"
        style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <Text fw={700} size="sm" mb="md" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
          Project Financial Performance & Burn Rate
        </Text>

        <Table.ScrollContainer minWidth={700}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead style={{ backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
              <Table.Tr>
                <Table.Th style={{ fontSize: 12 }}>PROJECT</Table.Th>
                <Table.Th style={{ fontSize: 12 }}>CLIENT</Table.Th>
                <Table.Th style={{ fontSize: 12 }}>CONTRACT BUDGET</Table.Th>
                <Table.Th style={{ fontSize: 12 }}>ACTUAL COST</Table.Th>
                <Table.Th style={{ fontSize: 12 }}>BUDGET UTILIZATION</Table.Th>
                <Table.Th style={{ fontSize: 12, textAlign: 'right' }}>MARGIN</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {projects.map((p) => {
                const b = Number(p.estimatedBudget) || 0;
                const c = Number(p.actualCost) || 0;
                const util = b > 0 ? Math.min(100, Math.round((c / b) * 100)) : 0;
                const margin = b - c;

                return (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Text fw={600} size="13px">
                        {p.projectId} - {p.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="12px">{p.clientName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="13px" fw={700}>
                        ₹{b.toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="13px" fw={600} c="dimmed">
                        ₹{c.toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ width: 140 }}>
                      <Group gap={6} align="center">
                        <Box style={{ flex: 1 }}>
                          <Progress value={util} size="xs" color={util > 80 ? 'orange' : 'blue'} />
                        </Box>
                        <Text size="11px" fw={600}>
                          {util}%
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text size="13px" fw={700} c={margin >= 0 ? 'teal' : 'red'}>
                        ₹{margin.toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Box>
  );
};

export default ProjectReports;
