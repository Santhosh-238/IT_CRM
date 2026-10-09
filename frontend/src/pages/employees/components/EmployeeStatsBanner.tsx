import React from 'react';
import { SimpleGrid, Paper, Group, Text, ThemeIcon, Badge, Box, Progress } from '@mantine/core';
import {
  IconUsers,
  IconUserCheck,
  IconCode,
  IconStar,
  IconTrendingUp,
  IconSparkles,
} from '@tabler/icons-react';
import { Employee, EmployeeStats } from '../../../types/employee';
import { CRM_COLORS } from '../../../theme/colors';

interface EmployeeStatsBannerProps {
  employees: Employee[];
  stats: EmployeeStats | null;
}

export const EmployeeStatsBanner: React.FC<EmployeeStatsBannerProps> = ({ employees, stats }) => {
  const totalEmployees = stats?.totalEmployees ?? employees.length;
  const activeCount = stats?.activeCount ?? employees.filter((e) => e.status === 'ACTIVE').length;
  const probationCount = stats?.probationCount ?? employees.filter((e) => e.status === 'PROBATION').length;
  const onLeaveCount = stats?.onLeaveCount ?? employees.filter((e) => e.status === 'ON_LEAVE').length;
  
  const engineeringCount = employees.filter((e) => {
    const d = (e.department || '').toLowerCase();
    return d.includes('engineering') || d.includes('cloud') || d.includes('ai') || d.includes('qa') || d.includes('dev');
  }).length;

  const avgRating = stats?.avgRating ?? (
    totalEmployees > 0 
      ? Number((employees.reduce((acc, e) => acc + (e.rating || 0), 0) / totalEmployees).toFixed(1))
      : 0
  );

  const activePercent = totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0;
  const engineeringPercent = totalEmployees > 0 ? Math.round((engineeringCount / totalEmployees) * 100) : 0;

  const departmentCount = stats?.departmentBreakdown 
    ? Object.keys(stats.departmentBreakdown).length 
    : Array.from(new Set(employees.map(e => e.department))).length;

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
      {/* Card 1: Total Workforce */}
      <Paper
        p="lg"
        radius="24px"
        className="crextio-card card-hover-effect"
        style={{
          background: CRM_COLORS.cardBg,
          border: `1px solid ${CRM_COLORS.border}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Group justify="space-between" align="flex-start" mb="xs">
          <div>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
              Total Workforce
            </Text>
            <Text fw={800} size="34px" style={{ letterSpacing: '-0.04em', color: CRM_COLORS.textPrimary, lineHeight: 1.1 }} mt={4}>
              {totalEmployees}
            </Text>
          </div>
          <ThemeIcon
            size={48}
            radius="16px"
            variant="light"
            style={{
              background: CRM_COLORS.pastelLime,
              color: CRM_COLORS.pastelLimeText,
            }}
          >
            <IconUsers size={24} stroke={2.2} />
          </ThemeIcon>
        </Group>

        <Group justify="space-between" align="center" mt="md">
          <Badge size="sm" variant="light" color="blue" radius="md" style={{ fontWeight: 700 }}>
            {departmentCount} {departmentCount === 1 ? 'Department' : 'Departments'}
          </Badge>
          <Group gap={4}>
            <IconTrendingUp size={14} color="#10B981" />
            <Text size="xs" c="teal" fw={700}>
              Enterprise Ready
            </Text>
          </Group>
        </Group>
      </Paper>

      {/* Card 2: Active Staffing */}
      <Paper
        p="lg"
        radius="24px"
        className="crextio-card card-hover-effect"
        style={{
          background: CRM_COLORS.cardBg,
          border: `1px solid ${CRM_COLORS.border}`,
        }}
      >
        <Group justify="space-between" align="flex-start" mb="xs">
          <div>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
              Active Staffing
            </Text>
            <Group gap="xs" align="baseline" mt={4}>
              <Text fw={800} size="34px" style={{ letterSpacing: '-0.04em', color: CRM_COLORS.textPrimary, lineHeight: 1.1 }}>
                {activeCount}
              </Text>
              <Text size="sm" fw={700} c="teal">
                ({activePercent}%)
              </Text>
            </Group>
          </div>
          <ThemeIcon
            size={48}
            radius="16px"
            variant="light"
            style={{
              background: CRM_COLORS.pastelMint,
              color: CRM_COLORS.pastelMintText,
            }}
          >
            <IconUserCheck size={24} stroke={2.2} />
          </ThemeIcon>
        </Group>

        <Box mt="xs">
          <Progress value={activePercent || 100} size="sm" radius="xl" color="teal" animated={activePercent > 0} />
          <Group justify="space-between" align="center" mt={6}>
            <Text size="11px" c="dimmed">
              {probationCount > 0 ? `${probationCount} on probation` : '100% active staff'}
            </Text>
            {onLeaveCount > 0 && (
              <Text size="11px" c="dimmed">
                {onLeaveCount} on leave
              </Text>
            )}
          </Group>
        </Box>
      </Paper>

      {/* Card 3: Tech & Engineering Core */}
      <Paper
        p="lg"
        radius="24px"
        className="crextio-card card-hover-effect"
        style={{
          background: CRM_COLORS.cardBg,
          border: `1px solid ${CRM_COLORS.border}`,
        }}
      >
        <Group justify="space-between" align="flex-start" mb="xs">
          <div>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
              Tech & Engineering
            </Text>
            <Text fw={800} size="34px" style={{ letterSpacing: '-0.04em', color: CRM_COLORS.textPrimary, lineHeight: 1.1 }} mt={4}>
              {engineeringCount}
            </Text>
          </div>
          <ThemeIcon
            size={48}
            radius="16px"
            variant="light"
            style={{
              background: CRM_COLORS.pastelPurple,
              color: CRM_COLORS.pastelPurpleText,
            }}
          >
            <IconCode size={24} stroke={2.2} />
          </ThemeIcon>
        </Group>

        <Group justify="space-between" align="center" mt="md">
          <Badge size="sm" variant="light" color="grape" radius="md" style={{ fontWeight: 700 }}>
            {engineeringPercent}% of total team
          </Badge>
          <Text size="xs" c="dimmed" fw={600}>
            Core Developers
          </Text>
        </Group>
      </Paper>

      {/* Card 4: Team Performance Quality Index */}
      <Paper
        p="lg"
        radius="24px"
        className="crextio-card card-hover-effect"
        style={{
          background: CRM_COLORS.cardBg,
          border: `1px solid ${CRM_COLORS.border}`,
        }}
      >
        <Group justify="space-between" align="flex-start" mb="xs">
          <div>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
              Avg Performance
            </Text>
            <Group gap="xs" align="baseline" mt={4}>
              <Text fw={800} size="34px" style={{ letterSpacing: '-0.04em', color: CRM_COLORS.textPrimary, lineHeight: 1.1 }}>
                {avgRating}
              </Text>
              <Text size="sm" c="dimmed" fw={600}>
                / 5.0
              </Text>
            </Group>
          </div>
          <ThemeIcon
            size={48}
            radius="16px"
            variant="light"
            style={{
              background: '#FEF3C7',
              color: '#D97706',
            }}
          >
            <IconStar size={24} stroke={2.2} fill="#D97706" />
          </ThemeIcon>
        </Group>

        <Group justify="space-between" align="center" mt="md">
          <Badge
            size="sm"
            variant="light"
            color={avgRating >= 4.5 ? 'yellow' : 'teal'}
            radius="md"
            leftSection={<IconSparkles size={12} />}
            style={{ fontWeight: 700 }}
          >
            {avgRating >= 4.8 ? 'Top Performer Rating' : avgRating >= 4.0 ? 'High Quality' : 'Standard'}
          </Badge>
          <Text size="xs" c="dimmed" fw={600}>
            Quality Score
          </Text>
        </Group>
      </Paper>
    </SimpleGrid>
  );
};
