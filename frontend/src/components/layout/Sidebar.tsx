import React from 'react';
import {
  NavLink,
  Stack,
  Group,
  Text,
  Badge,
  Box,
  Paper,
  ActionIcon,
  Avatar,
  Indicator,
  Menu,
  Tooltip,
  useMantineColorScheme,
  ScrollArea,
} from '@mantine/core';
import {
  IconDashboard,
  IconUsersGroup,
  IconTerminal2,
  IconSun,
  IconMoon,
  IconLogout,
  IconUserPlus,
  IconLogin,
} from '@tabler/icons-react';
import { useCRM } from '../../context/CRMContext';
import { useEmployee } from '../../context/EmployeeContext';
import { CRM_COLORS } from '../../theme/colors';

interface SidebarProps {
  onSelectNav: (nav: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectNav }) => {
  const { activeNav, currentUser, logoutUser } = useCRM();
  const { employees } = useEmployee();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const employeesCount = employees.length;

  return (
    <Box
      style={{
        width: 260,
        height: '100vh',
        background: 'var(--mantine-color-default)',
        borderRight: '1px solid var(--mantine-color-default-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        userSelect: 'none',
        zIndex: 110,
      }}
    >
      {/* 1. Top 64px Brand Logo Header (Aligned with Right Header) */}
      <Box
        px="md"
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          flexShrink: 0,
        }}
      >
        <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => onSelectNav('dashboard')}>
          <Box
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #14181F 0%, #2A3241 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(20, 24, 31, 0.25)',
            }}
          >
            <IconTerminal2 size={19} color="#FFFFFF" stroke={2.2} />
          </Box>
          <div>
            <Text fw={800} size="15px" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              IT <Text span inherit fw={400} c="dimmed">CRM</Text>
            </Text>
            <Text size="9px" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Enterprise Hub
            </Text>
          </div>
        </Group>

        <Badge size="xs" variant="light" color="blue" radius="sm" style={{ fontWeight: 700 }}>
          v2.4
        </Badge>
      </Box>

      {/* 2. Main Navigation Items */}
      <ScrollArea style={{ flex: 1 }} p="md" type="never">
        <Stack gap="sm">
          <Text size="10px" fw={800} c="dimmed" tt="uppercase" px="xs" style={{ letterSpacing: '0.08em' }}>
            Main Navigation
          </Text>
          <Stack gap={6}>
            <NavLink
              label="Dashboard"
              leftSection={<IconDashboard size={18} stroke={2} />}
              active={activeNav === 'dashboard'}
              onClick={() => onSelectNav('dashboard')}
              className={activeNav === 'dashboard' ? 'crextio-pill-active' : 'crextio-pill-inactive'}
              style={{ borderRadius: 10, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
            />
            <NavLink
              label="Employees Directory"
              leftSection={<IconUsersGroup size={18} stroke={2} />}
              rightSection={
                employeesCount > 0 ? (
                  <Badge size="xs" style={{ background: CRM_COLORS.pastelMint, color: CRM_COLORS.pastelMintText, fontWeight: 700 }}>
                    {employeesCount} Staff
                  </Badge>
                ) : null
              }
              active={activeNav === 'employees' || activeNav === 'add-employee' || activeNav === 'onboard-employee' || activeNav === 'onboard'}
              onClick={() => onSelectNav('employees')}
              className={activeNav === 'employees' || activeNav === 'add-employee' || activeNav === 'onboard-employee' || activeNav === 'onboard' ? 'crextio-pill-active' : 'crextio-pill-inactive'}
              style={{ borderRadius: 10, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
            />
          </Stack>
        </Stack>
      </ScrollArea>

      {/* 3. Bottom User Profile & Theme Toggle */}
      <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Paper
          p="xs"
          radius="12px"
          style={{
            background: 'var(--mantine-color-default-hover)',
            border: '1px solid var(--mantine-color-default-border)',
          }}
        >
          <Group justify="space-between" align="center" wrap="nowrap">
            <Menu shadow="md" width={220} position="top-start" radius="md">
              <Menu.Target>
                <Group gap="xs" style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                  <Indicator inline size={9} offset={2} position="bottom-end" color="teal" withBorder>
                    <Avatar src={currentUser.avatar} size={30} radius="md" />
                  </Indicator>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" fw={700} truncate style={{ lineHeight: 1.2 }}>
                      {currentUser.name}
                    </Text>
                    <Text size="10px" c="dimmed" truncate>
                      {currentUser.role}
                    </Text>
                  </div>
                </Group>
              </Menu.Target>
              <Menu.Dropdown p={6}>
                <Menu.Label>Active Account</Menu.Label>
                <Menu.Item leftSection={<IconUserPlus size={15} />} onClick={() => onSelectNav('signup')}>
                  Create New Account
                </Menu.Item>
                <Menu.Item leftSection={<IconLogin size={15} />} onClick={() => onSelectNav('login')}>
                  Sign In (Login)
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconLogout size={15} />} onClick={() => logoutUser()}>
                  Log Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Tooltip label={isDark ? 'Switch to Light' : 'Switch to Dark'}>
              <ActionIcon
                variant="subtle"
                color={isDark ? 'yellow' : 'gray'}
                size="sm"
                radius="md"
                onClick={() => toggleColorScheme()}
              >
                {isDark ? <IconSun size={15} /> : <IconMoon size={15} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Paper>
      </Box>
    </Box>
  );
};
