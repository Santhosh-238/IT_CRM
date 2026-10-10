import React from 'react';
import {
  NavLink,
  Stack,
  Group,
  Text,
  Box,
  ScrollArea,
  Badge,
} from '@mantine/core';
import {
  IconDashboard,
  IconUsersGroup,
  IconAddressBook,
  IconTerminal2,
  IconShieldLock,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { useCRM } from '../../context/CRMContext';
import { usePermissions } from '../../context/AccessControlContext';

interface SidebarProps {
  onSelectNav: (nav: string) => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectNav, isMobile = false }) => {
  const { activeNav } = useCRM();
  const { can, isSuperAdmin } = usePermissions();

  return (
    <Box
      style={{
        width: isMobile ? '100%' : 260,
        height: isMobile ? '100%' : '100vh',
        background: 'var(--mantine-color-default)',
        borderRight: isMobile ? 'none' : '1px solid var(--mantine-color-default-border)',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'relative' : 'sticky',
        top: 0,
        flexShrink: 0,
        userSelect: 'none',
        zIndex: 110,
      }}
    >
      {/* 1. Top 64px Brand Logo Header (Aligned with Right Header) */}
      <Box
        px="sm"
        style={{
          height: 64,
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          flexShrink: 0,
          boxSizing: 'border-box',
          overflow: 'hidden',
          gap: 6,
        }}
      >
        <Group gap={8} wrap="nowrap" align="center" style={{ cursor: 'pointer', minWidth: 0, flex: 1 }} onClick={() => onSelectNav('dashboard')}>
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#FFFFFF',
              border: '1px solid rgba(79, 70, 229, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 3,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
              flexShrink: 0,
            }}
          >
            <img
              src="/oneassist-logo.png"
              alt="OneAssist Technologies"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
          <Box style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <Text fw={800} size="14px" truncate style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              OneAssist <Text span inherit fw={700} style={{ color: '#0EA5E9' }}>CRM</Text>
            </Text>
            <Text size="9px" fw={700} c="dimmed" tt="uppercase" truncate style={{ letterSpacing: '0.04em', lineHeight: 1.1 }}>
              IT Sales & Operations Hub
            </Text>
          </Box>
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
            {isSuperAdmin && (
              <NavLink
                label="Employees Directory"
                leftSection={<IconUsersGroup size={18} stroke={2} />}
                active={activeNav === 'employees' || activeNav === 'add-employee' || activeNav === 'onboard-employee' || activeNav === 'onboard'}
                onClick={() => onSelectNav('employees')}
                className={activeNav === 'employees' || activeNav === 'add-employee' || activeNav === 'onboard-employee' || activeNav === 'onboard' ? 'crextio-pill-active' : 'crextio-pill-inactive'}
                style={{ borderRadius: 10, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
            <NavLink
              label="Contacts"
              leftSection={<IconAddressBook size={18} stroke={2} />}
              active={
                activeNav === 'contacts' ||
                activeNav === 'add-contact' ||
                activeNav === 'contact-details' ||
                activeNav === 'contact-qualification' ||
                activeNav === 'qualification'
              }
              onClick={() => onSelectNav('contacts')}
              className={
                activeNav === 'contacts' ||
                activeNav === 'add-contact' ||
                activeNav === 'contact-details' ||
                activeNav === 'contact-qualification' ||
                activeNav === 'qualification'
                  ? 'crextio-pill-active'
                  : 'crextio-pill-inactive'
              }
              style={{ borderRadius: 10, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
            />
          </Stack>

          {/* 3. Administration Section */}
          <Text size="10px" fw={800} c="dimmed" tt="uppercase" px="xs" mt="sm" style={{ letterSpacing: '0.08em' }}>
            Administration & Security
          </Text>
          <Stack gap={6}>
            <NavLink
              label="Scheduled Meetings"
              leftSection={<IconCalendarEvent size={18} stroke={2} />}
              active={activeNav === 'scheduled-meetings' || activeNav === 'meetings'}
              onClick={() => onSelectNav('scheduled-meetings')}
              className={activeNav === 'scheduled-meetings' || activeNav === 'meetings' ? 'crextio-pill-active' : 'crextio-pill-inactive'}
              style={{ borderRadius: 10, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
            />
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
