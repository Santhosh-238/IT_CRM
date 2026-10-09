import React from 'react';
import {
  Grid,
  Paper,
  Text,
  Group,
  Avatar,
  Badge,
  Stack,
  Box,
  SimpleGrid,
  Button,
  ThemeIcon,
} from '@mantine/core';
import {
  IconUsers,
  IconUserCheck,
  IconBuildingSkyscraper,
  IconStar,
  IconArrowRight,
  IconShieldCheck,
  IconBolt,
  IconDatabase,
} from '@tabler/icons-react';
import { useCRM } from '../context/CRMContext';
import { useEmployee } from '../context/EmployeeContext';
import { CRM_COLORS } from '../theme/colors';

interface DashboardPageProps {
  onNavigate: (nav: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser } = useCRM();
  const { employees, employeeStats } = useEmployee();

  const totalEmployees = employeeStats?.totalEmployees ?? employees.length;
  const activeCount = employeeStats?.activeCount ?? employees.filter((e) => e.status === 'ACTIVE').length;
  const avgRating = employeeStats?.avgRating ?? (
    totalEmployees > 0 
      ? Number((employees.reduce((acc, e) => acc + (e.rating || 0), 0) / totalEmployees).toFixed(1))
      : 0
  );
  const totalDepts = employeeStats?.departmentBreakdown
    ? Object.keys(employeeStats.departmentBreakdown).length
    : Array.from(new Set(employees.map((e) => e.department))).length;

  return (
    <Stack gap="lg">
      {/* Top Page Title */}
      <Group justify="space-between" align="center">
        <div>
          <Text fw={800} size="28px" style={{ letterSpacing: '-0.03em', color: CRM_COLORS.textPrimary }}>
            Welcome back, {currentUser.name}
          </Text>
          <Text size="sm" c="dimmed">
            Enterprise IT CRM & Engineering Workforce Hub
          </Text>
        </div>
        <Button
          size="sm"
          radius="100px"
          leftSection={<IconUsers size={16} />}
          rightSection={<IconArrowRight size={14} />}
          onClick={() => onNavigate('employees')}
          style={{
            background: CRM_COLORS.primary,
            color: CRM_COLORS.textOnPrimary,
            fontWeight: 700,
          }}
        >
          View Employees Directory
        </Button>
      </Group>

      {/* Main Grid: User Profile & KPI Cards */}
      <Grid gutter="md">
        {/* Left: User Profile Summary Card */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper p="xl" radius="24px" className="crextio-card" style={{ background: CRM_COLORS.cardBg, height: '100%' }}>
            <Stack justify="space-between" style={{ height: '100%' }}>
              <Group gap="md" align="center">
                <Avatar
                  src={currentUser.avatar}
                  size={72}
                  radius="20px"
                  style={{
                    border: `3px solid ${CRM_COLORS.backgroundLight}`,
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Box>
                  <Text fw={800} size="18px" style={{ color: CRM_COLORS.textPrimary }}>
                    {currentUser.name}
                  </Text>
                  <Badge size="sm" radius="sm" style={{ background: CRM_COLORS.primary, color: CRM_COLORS.textOnPrimary }} mt={4}>
                    {currentUser.role.replace('_', ' ')}
                  </Badge>
                  <Text size="xs" c="dimmed" mt={4}>
                    {currentUser.email}
                  </Text>
                </Box>
              </Group>

              <Box pt="md" style={{ borderTop: `1px solid ${CRM_COLORS.border}` }}>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                  System Environment
                </Text>
                <SimpleGrid cols={2} spacing="xs">
                  <Group gap={6}>
                    <ThemeIcon size="xs" color="teal" variant="light" radius="xl">
                      <IconShieldCheck size={12} />
                    </ThemeIcon>
                    <Text size="xs" fw={600}>JWT Auth: Active</Text>
                  </Group>
                  <Group gap={6}>
                    <ThemeIcon size="xs" color="blue" variant="light" radius="xl">
                      <IconBolt size={12} />
                    </ThemeIcon>
                    <Text size="xs" fw={600}>Redis Cache: &lt;1ms</Text>
                  </Group>
                  <Group gap={6}>
                    <ThemeIcon size="xs" color="violet" variant="light" radius="xl">
                      <IconDatabase size={12} />
                    </ThemeIcon>
                    <Text size="xs" fw={600}>PostgreSQL: Connected</Text>
                  </Group>
                  <Group gap={6}>
                    <ThemeIcon size="xs" color="cyan" variant="light" radius="xl">
                      <IconUsers size={12} />
                    </ThemeIcon>
                    <Text size="xs" fw={600}>Directory: Ready</Text>
                  </Group>
                </SimpleGrid>
              </Box>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Right: Live Employee & System Metrics (4 Cards) */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {/* Card 1: Total Workforce */}
            <Paper p="lg" radius="20px" className="crextio-card" style={{ background: CRM_COLORS.cardBg }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Total Employees
                </Text>
                <ThemeIcon size="md" radius="xl" variant="light" color="blue">
                  <IconUsers size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="32px" style={{ letterSpacing: '-0.03em', color: CRM_COLORS.textPrimary, lineHeight: 1.2 }}>
                {totalEmployees}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {totalDepts} Active Departments
              </Text>
            </Paper>

            {/* Card 2: Active Staffing */}
            <Paper p="lg" radius="20px" className="crextio-card" style={{ background: CRM_COLORS.cardBg }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Active Staffing
                </Text>
                <ThemeIcon size="md" radius="xl" variant="light" color="teal">
                  <IconUserCheck size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="32px" style={{ letterSpacing: '-0.03em', color: CRM_COLORS.textPrimary, lineHeight: 1.2 }}>
                {activeCount}
              </Text>
              <Text size="xs" c="teal" fw={600} mt={4}>
                {totalEmployees > 0 ? `${Math.round((activeCount / totalEmployees) * 100)}% active rate` : 'Ready for onboarding'}
              </Text>
            </Paper>

            {/* Card 3: Departments */}
            <Paper p="lg" radius="20px" className="crextio-card" style={{ background: CRM_COLORS.cardBg }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Departments
                </Text>
                <ThemeIcon size="md" radius="xl" variant="light" color="violet">
                  <IconBuildingSkyscraper size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="32px" style={{ letterSpacing: '-0.03em', color: CRM_COLORS.textPrimary, lineHeight: 1.2 }}>
                {totalDepts}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Engineering & Tech Domains
              </Text>
            </Paper>

            {/* Card 4: Avg Performance */}
            <Paper p="lg" radius="20px" className="crextio-card" style={{ background: CRM_COLORS.cardBg }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Avg Rating
                </Text>
                <ThemeIcon size="md" radius="xl" variant="light" color="yellow">
                  <IconStar size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="32px" style={{ letterSpacing: '-0.03em', color: CRM_COLORS.textPrimary, lineHeight: 1.2 }}>
                {avgRating} <Text span size="lg" c="dimmed" fw={500}>/ 5.0</Text>
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Engineering Quality Score
              </Text>
            </Paper>
          </SimpleGrid>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default DashboardPage;
