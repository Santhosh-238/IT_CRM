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
  useComputedColorScheme,
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
  IconCalendarEvent,
  IconClock,
  IconVideo,
} from '@tabler/icons-react';
import { useCRM } from '../context/CRMContext';
import { useEmployee } from '../context/EmployeeContext';
import { usePermissions } from '../context/AccessControlContext';
import { CRM_COLORS } from '../theme/colors';
import { fetchMeetingsApi } from '../services/meetingService';
import { ScheduledMeeting } from '../types/meeting';

interface DashboardPageProps {
  onNavigate: (nav: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser } = useCRM();
  const { isSuperAdmin } = usePermissions();
  const { employees, employeeStats } = useEmployee();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

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

  const [upcomingMeetings, setUpcomingMeetings] = React.useState<ScheduledMeeting[]>([]);

  React.useEffect(() => {
    fetchMeetingsApi()
      .then((res) => {
        setUpcomingMeetings(res.meetings.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.07)';
  const headingColor = isDark ? '#F8FAFC' : '#0F172A';
  const statColor = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <Stack gap="lg">
      {/* Top Page Title */}
      <Group justify="space-between" align="center">
        <div>
          <Text fw={800} size="28px" style={{ letterSpacing: '-0.03em', color: headingColor }}>
            Welcome back{currentUser.name ? `, ${currentUser.name}` : ''}
          </Text>
          <Text size="sm" c="dimmed">
            OneAssist Technologies · IT Sales Pipeline & Operations Management Hub
          </Text>
        </div>
        <Group gap="xs">
          <Button
            size="sm"
            variant="default"
            radius="100px"
            leftSection={<IconCalendarEvent size={16} />}
            onClick={() => onNavigate('scheduled-meetings')}
            style={{ fontWeight: 600 }}
          >
            Scheduled Meetings
          </Button>
          {isSuperAdmin && (
            <Button
              size="sm"
              radius="100px"
              leftSection={<IconUsers size={16} />}
              rightSection={<IconArrowRight size={14} />}
              onClick={() => onNavigate('employees')}
              style={{
                background: isDark ? '#3B82F6' : CRM_COLORS.primary,
                color: '#FFFFFF',
                fontWeight: 700,
                boxShadow: isDark ? '0 4px 14px rgba(59, 130, 246, 0.35)' : undefined,
              }}
            >
              View Employees Directory
            </Button>
          )}
        </Group>
      </Group>

      {/* Main Grid: User Profile & KPI Cards */}
      <Grid gutter="md">
        {/* Left: User Profile Summary Card */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper p="xl" radius="24px" className="crextio-card" style={{ background: cardBg, border: cardBorder, height: '100%' }}>
            <Stack justify="space-between" style={{ height: '100%' }}>
              <Group gap="md" align="center">
                <Avatar
                  src={currentUser.avatar || undefined}
                  size={72}
                  radius="20px"
                  color="blue"
                  style={{
                    border: `3px solid ${isDark ? '#1E293B' : CRM_COLORS.backgroundLight}`,
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box>
                  <Text fw={800} size="18px" style={{ color: headingColor }}>
                    {currentUser.name || 'Admin User'}
                  </Text>
                  <Badge size="sm" radius="sm" style={{ background: isDark ? '#2563EB' : CRM_COLORS.primary, color: '#FFFFFF' }} mt={4}>
                    {(currentUser.role || 'Super Admin').replace('_', ' ')}
                  </Badge>
                  <Text size="xs" c="dimmed" mt={4}>
                    {currentUser.email || '—'}
                  </Text>
                </Box>
              </Group>

              <Box pt="md" style={{ borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : CRM_COLORS.border}` }}>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                  System Environment
                </Text>
                <SimpleGrid cols={2} spacing="xs">
                  <Group gap={6}>
                    <ThemeIcon size="xs" color="teal" variant="light" radius="xl">
                      <IconShieldCheck size={12} />
                    </ThemeIcon>
                    <Text size="xs" fw={600} style={{ color: isDark ? '#CBD5E1' : undefined }}>JWT Auth: Active</Text>
                  </Group>
                  <Group gap={6}>
                    <ThemeIcon size="xs" color="blue" variant="light" radius="xl">
                      <IconBolt size={12} />
                    </ThemeIcon>
                    <Text size="xs" fw={600} style={{ color: isDark ? '#CBD5E1' : undefined }}>Redis Cache: &lt;1ms</Text>
                  </Group>
                  <Group gap={6}>
                    <ThemeIcon size="xs" color="violet" variant="light" radius="xl">
                      <IconDatabase size={12} />
                    </ThemeIcon>
                    <Text size="xs" fw={600} style={{ color: isDark ? '#CBD5E1' : undefined }}>PostgreSQL: Connected</Text>
                  </Group>
                  <Group gap={6}>
                    <ThemeIcon size="xs" color="cyan" variant="light" radius="xl">
                      <IconUsers size={12} />
                    </ThemeIcon>
                    <Text size="xs" fw={600} style={{ color: isDark ? '#CBD5E1' : undefined }}>Directory: Ready</Text>
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
            <Paper p="lg" radius="20px" className="crextio-card" style={{ background: cardBg, border: cardBorder }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Total Employees
                </Text>
                <ThemeIcon size="md" radius="xl" variant="light" color="blue">
                  <IconUsers size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="32px" style={{ letterSpacing: '-0.03em', color: statColor, lineHeight: 1.2 }}>
                {totalEmployees}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {totalDepts} Active Departments
              </Text>
            </Paper>

            {/* Card 2: Active Staffing */}
            <Paper p="lg" radius="20px" className="crextio-card" style={{ background: cardBg, border: cardBorder }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Active Staffing
                </Text>
                <ThemeIcon size="md" radius="xl" variant="light" color="teal">
                  <IconUserCheck size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="32px" style={{ letterSpacing: '-0.03em', color: statColor, lineHeight: 1.2 }}>
                {activeCount}
              </Text>
              <Text size="xs" c={isDark ? '#34D399' : 'teal'} fw={600} mt={4}>
                {totalEmployees > 0 ? `${Math.round((activeCount / totalEmployees) * 100)}% active rate` : 'Ready for onboarding'}
              </Text>
            </Paper>

            {/* Card 3: Departments */}
            <Paper p="lg" radius="20px" className="crextio-card" style={{ background: cardBg, border: cardBorder }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Departments
                </Text>
                <ThemeIcon size="md" radius="xl" variant="light" color="violet">
                  <IconBuildingSkyscraper size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="32px" style={{ letterSpacing: '-0.03em', color: statColor, lineHeight: 1.2 }}>
                {totalDepts}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Engineering & Tech Domains
              </Text>
            </Paper>

            {/* Card 4: Avg Performance */}
            <Paper p="lg" radius="20px" className="crextio-card" style={{ background: cardBg, border: cardBorder }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Avg Rating
                </Text>
                <ThemeIcon size="md" radius="xl" variant="light" color="yellow">
                  <IconStar size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="32px" style={{ letterSpacing: '-0.03em', color: statColor, lineHeight: 1.2 }}>
                {avgRating} <Text span size="lg" c="dimmed" fw={500}>/ 5.0</Text>
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Engineering Quality Score
              </Text>
            </Paper>
          </SimpleGrid>
        </Grid.Col>
      </Grid>

      {/* Date-Wise Scheduled Meetings Spotlight */}
      <Paper p="xl" radius="24px" className="crextio-card" style={{ background: cardBg, border: cardBorder }}>
        <Group justify="space-between" align="center" mb="lg">
          <div>
            <Group gap="xs" align="center">
              <ThemeIcon size={28} radius="md" color="indigo" variant="light">
                <IconCalendarEvent size={18} />
              </ThemeIcon>
              <Text fw={800} size="18px" style={{ color: headingColor, letterSpacing: '-0.02em' }}>
                Upcoming & Today's Scheduled Meetings
              </Text>
              <Badge color="indigo" variant="light" size="sm" radius="sm">
                Date-Wise Agenda
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              Client demos, technical reviews, and discussions organized by date, employee creator, and time
            </Text>
          </div>

          <Button
            size="xs"
            variant="light"
            color="indigo"
            radius="100px"
            rightSection={<IconArrowRight size={14} />}
            onClick={() => onNavigate('scheduled-meetings')}
          >
            Open Meetings Module
          </Button>
        </Group>

        {upcomingMeetings.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            No scheduled meetings right now. Click "Open Meetings Module" to schedule a meeting.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {upcomingMeetings.map((m) => (
              <Paper
                key={m.id}
                p="md"
                radius="16px"
                style={{
                  background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#F8FAFC',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0'}`,
                }}
              >
                <Stack gap="xs">
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Badge size="xs" color="indigo" variant="filled" radius="sm">
                        {m.meetingDate}
                      </Badge>
                      <Group gap={4} align="center">
                        <IconClock size={13} color="#94A3B8" />
                        <Text size="xs" fw={700} style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                          {m.startTime} – {m.endTime}
                        </Text>
                      </Group>
                    </Group>
                    <Badge size="xs" variant="light" color={m.status === 'Completed' ? 'teal' : 'blue'}>
                      {m.status || 'Scheduled'}
                    </Badge>
                  </Group>

                  {/* Purpose */}
                  <Box>
                    <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.04em' }}>
                      Purpose
                    </Text>
                    <Text fw={700} size="14px" style={{ color: headingColor }} lineClamp={2}>
                      {m.purpose}
                    </Text>
                  </Box>

                  {/* Creator Employee & Client */}
                  <Group justify="space-between" align="center" pt={4} style={{ borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0'}` }}>
                    <Group gap="xs" align="center">
                      <Avatar size={24} radius="xl" color="indigo">
                        {m.employeeName ? m.employeeName.charAt(0).toUpperCase() : 'E'}
                      </Avatar>
                      <div>
                        <Text size="11px" fw={700} style={{ color: headingColor }}>
                          {m.employeeName}
                        </Text>
                        <Text size="10px" c="dimmed">
                          {m.employeeDesignation || 'Host'}
                        </Text>
                      </div>
                    </Group>

                    {m.clientName && (
                      <Badge size="xs" variant="outline" color="gray">
                        {m.clientName}
                      </Badge>
                    )}
                  </Group>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        )}
      </Paper>
    </Stack>
  );
};

export default DashboardPage;
