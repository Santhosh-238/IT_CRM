import React from 'react';
import {
  NavLink,
  Stack,
  Group,
  Text,
  Box,
  ScrollArea,
} from '@mantine/core';
import {
  IconDashboard,
  IconUsersGroup,
  IconAddressBook,
  IconTerminal2,
  IconShieldLock,
} from '@tabler/icons-react';
import { useCRM } from '../../context/CRMContext';
import { usePermissions } from '../../context/AccessControlContext';

interface SidebarProps {
  onSelectNav: (nav: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectNav }) => {
  const { activeNav } = useCRM();
  const { can } = usePermissions();

  return (
    <Box
      style={{
        width: 260,
        height: '100vh',
        background: 'var(--mantine-color-default)',
        borderRight: '1px solid var(--mantine-color-default-border)',
        display: 'flex',
        flexDirection: 'column',
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
              active={activeNav === 'employees' || activeNav === 'add-employee' || activeNav === 'onboard-employee' || activeNav === 'onboard'}
              onClick={() => onSelectNav('employees')}
              className={activeNav === 'employees' || activeNav === 'add-employee' || activeNav === 'onboard-employee' || activeNav === 'onboard' ? 'crextio-pill-active' : 'crextio-pill-inactive'}
              style={{ borderRadius: 10, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
            />
            <NavLink
              label="Contacts"
              leftSection={<IconAddressBook size={18} stroke={2} />}
              active={activeNav === 'contacts' || activeNav === 'add-contact' || activeNav === 'contact-details'}
              onClick={() => onSelectNav('contacts')}
              className={activeNav === 'contacts' || activeNav === 'add-contact' || activeNav === 'contact-details' ? 'crextio-pill-active' : 'crextio-pill-inactive'}
              style={{ borderRadius: 10, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
            />
          </Stack>

          {/* 3. Administration Section */}
          <Text size="10px" fw={800} c="dimmed" tt="uppercase" px="xs" mt="sm" style={{ letterSpacing: '0.08em' }}>
            Administration & Security
          </Text>
          <Stack gap={6}>
            {can('access_control', 'view') && (
              <NavLink
                label="Access Control & RBAC"
                leftSection={<IconShieldLock size={18} stroke={2} />}
                active={activeNav === 'access-control' || activeNav === 'rbac'}
                onClick={() => onSelectNav('access-control')}
                className={activeNav === 'access-control' || activeNav === 'rbac' ? 'crextio-pill-active' : 'crextio-pill-inactive'}
                style={{ borderRadius: 10, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
          </Stack>
        </Stack>
      </ScrollArea>
    </Box>
  );
};
