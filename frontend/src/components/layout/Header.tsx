import React from 'react';
import {
  Group,
  TextInput,
  ActionIcon,
  Menu,
  Avatar,
  Text,
  Button,
  useMantineColorScheme,
  useComputedColorScheme,
  Box,
  Tooltip,
  Kbd,
} from '@mantine/core';
import {
  IconSearch,
  IconSun,
  IconMoon,
  IconUserShield,
  IconMicrophone,
  IconLogout,
} from '@tabler/icons-react';
import { useCRM } from '../../context/CRMContext';
import { CRM_COLORS } from '../../theme/colors';

interface HeaderProps {}

export const Header: React.FC<HeaderProps> = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { currentUser, setCurrentUserRole, globalSearch, setGlobalSearch, logoutUser } = useCRM();

  return (
    <Box
      style={{
        height: 64,
        background: 'var(--mantine-color-default)',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Left: Search Bar */}
      <Group gap="md" style={{ flex: 1, maxWidth: 440 }}>
        <TextInput
          placeholder="Search employees, skills, department..."
          leftSection={<IconSearch size={16} stroke={2} color={CRM_COLORS.textSecondary} />}
          rightSection={
            <Group gap={4} pr={4}>
              <Kbd size="xs" style={{ background: CRM_COLORS.backgroundLight, border: 'none', color: CRM_COLORS.textSecondary, fontWeight: 700 }}>
                ⌘
              </Kbd>
              <ActionIcon size="xs" variant="subtle" color="gray">
                <IconMicrophone size={14} color={CRM_COLORS.textSecondary} />
              </ActionIcon>
            </Group>
          }
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.currentTarget.value)}
          style={{ width: '100%' }}
          radius="100px"
          variant="unstyled"
          styles={{
            input: {
              background: CRM_COLORS.backgroundLight,
              paddingLeft: 38,
              paddingRight: 60,
              height: 38,
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 500,
              color: isDark ? CRM_COLORS.textOnPrimary : CRM_COLORS.textPrimary,
              border: `1px solid ${CRM_COLORS.borderLight}`,
            },
          }}
        />
      </Group>

      {/* 2. Right: Role Switcher, Dark/Light, Log Out, User Avatar */}
      <Group gap="sm">
        {/* Role Switcher Pill */}
        <Menu shadow="lg" width={220} position="bottom-end" radius="16px">
          <Menu.Target>
            <Button
              variant="subtle"
              size="xs"
              radius="100px"
              style={{
                background: CRM_COLORS.backgroundLight,
                color: CRM_COLORS.textPrimary,
                fontWeight: 600,
                border: `1px solid ${CRM_COLORS.borderLight}`,
              }}
              leftSection={<IconUserShield size={14} color={CRM_COLORS.primary} />}
            >
              {currentUser.role.replace('_', ' ')}
            </Button>
          </Menu.Target>
          <Menu.Dropdown p="xs">
            <Menu.Label>Simulate Role (RBAC)</Menu.Label>
            <Menu.Item onClick={() => setCurrentUserRole('SUPER_ADMIN')}>Super Admin</Menu.Item>
            <Menu.Item onClick={() => setCurrentUserRole('PROJECT_MANAGER')}>Project Manager</Menu.Item>
            <Menu.Item onClick={() => setCurrentUserRole('TECH_LEAD')}>Tech Lead</Menu.Item>
            <Menu.Item onClick={() => setCurrentUserRole('DEVELOPER')}>Developer</Menu.Item>
          </Menu.Dropdown>
        </Menu>

        {/* Dark / Light Toggle */}
        <Tooltip label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <ActionIcon
            variant="subtle"
            size="md"
            radius="100px"
            style={{
              background: CRM_COLORS.backgroundLight,
              color: CRM_COLORS.textPrimary,
              border: `1px solid ${CRM_COLORS.borderLight}`,
            }}
            onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? <IconSun size={16} stroke={1.8} /> : <IconMoon size={16} stroke={1.8} />}
          </ActionIcon>
        </Tooltip>

        {/* Log Out Button */}
        <Button
          size="xs"
          radius="100px"
          leftSection={<IconLogout size={14} />}
          style={{
            background: CRM_COLORS.pastelCoral,
            color: CRM_COLORS.pastelCoralText,
            fontWeight: 700,
            border: `1px solid rgba(249, 183, 180, 0.5)`,
          }}
          onClick={() => logoutUser()}
        >
          Log Out
        </Button>

        {/* Profile Avatar Pill */}
        <Group
          gap="xs"
          p={3}
          pr="sm"
          style={{
            background: CRM_COLORS.backgroundLight,
            borderRadius: 100,
            border: `1px solid ${CRM_COLORS.borderLight}`,
          }}
        >
          <Avatar src={currentUser.avatar} radius="100px" size="sm" />
          <Text size="xs" fw={700} style={{ color: isDark ? CRM_COLORS.textOnPrimary : CRM_COLORS.textPrimary }}>
            {currentUser.name}
          </Text>
        </Group>
      </Group>
    </Box>
  );
};
