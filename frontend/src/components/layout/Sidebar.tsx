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
  IconTarget,
  IconTerminal2,
  IconShieldLock,
  IconCalendarEvent,
  IconFolders,
  IconPhoneCall,
  IconBuilding,
  IconSettings,
  IconUserCheck,
  IconClock,
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
        <Group
          gap={8}
          wrap="nowrap"
          align="center"
          className="sidebar-brand-box"
          style={{ cursor: 'pointer', minWidth: 0, flex: 1 }}
          onClick={() => onSelectNav('dashboard')}
        >
          <Box
            className="sidebar-logo-icon"
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
          <Text className="sidebar-section-header" size="10px" fw={800} c="dimmed" tt="uppercase" px="xs" style={{ letterSpacing: '0.08em' }}>
            Main Navigation
          </Text>
          <Stack gap={6}>
            {can('dashboard', 'view') && (
              <NavLink
                label="Dashboard"
                leftSection={<IconDashboard size={18} stroke={2} />}
                active={activeNav === 'dashboard'}
                onClick={() => onSelectNav('dashboard')}
                className={`sidebar-nav-item ${activeNav === 'dashboard' ? 'crextio-pill-active' : 'crextio-pill-inactive'}`}
                style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
            {can('employee_dashboard', 'view') && (
              <NavLink
                label="Employee Dashboard"
                leftSection={<IconUserCheck size={18} stroke={2} />}
                active={activeNav === 'employee-dashboard'}
                onClick={() => onSelectNav('employee-dashboard')}
                className={`sidebar-nav-item ${activeNav === 'employee-dashboard' ? 'crextio-pill-active' : 'crextio-pill-inactive'}`}
                style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
            {can('employee_management', 'view') && (
              <NavLink
                label="Employee Management"
                leftSection={<IconUsersGroup size={18} stroke={2} />}
                active={activeNav === 'employees' || activeNav === 'add-employee' || activeNav === 'onboard-employee' || activeNav === 'onboard'}
                onClick={() => onSelectNav('employees')}
                className={`sidebar-nav-item ${activeNav === 'employees' || activeNav === 'add-employee' || activeNav === 'onboard-employee' || activeNav === 'onboard' ? 'crextio-pill-active' : 'crextio-pill-inactive'}`}
                style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
            {can('contacts', 'view') && (
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
                className={`sidebar-nav-item ${
                  activeNav === 'contacts' ||
                  activeNav === 'add-contact' ||
                  activeNav === 'contact-details' ||
                  activeNav === 'contact-qualification' ||
                  activeNav === 'qualification'
                    ? 'crextio-pill-active'
                    : 'crextio-pill-inactive'
                }`}
                style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
            {can('leads', 'view') && (
              <NavLink
                label="Leads"
                leftSection={<IconTarget size={18} stroke={2} />}
                active={activeNav === 'leads' || activeNav === 'add-lead' || activeNav === 'lead-schedule' || activeNav === 'lead-details'}
                onClick={() => onSelectNav('leads')}
                className={`sidebar-nav-item ${activeNav === 'leads' || activeNav === 'add-lead' || activeNav === 'lead-schedule' || activeNav === 'lead-details' ? 'crextio-pill-active' : 'crextio-pill-inactive'}`}
                style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
            {/* Scheduled Meetings Item - Directly following Leads */}
            {can('scheduled_meetings', 'view') && (
              <NavLink
                label="Scheduled Meetings"
                leftSection={<IconCalendarEvent size={18} stroke={2} />}
                active={activeNav === 'scheduled-meetings' || activeNav === 'meetings'}
                onClick={() => onSelectNav('scheduled-meetings')}
                className={`sidebar-nav-item ${activeNav === 'scheduled-meetings' || activeNav === 'meetings' ? 'crextio-pill-active' : 'crextio-pill-inactive'}`}
                style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
            {/* Call Logs Item */}
            {can('call_logs', 'view') && (
              <NavLink
                label="Call Logs"
                leftSection={<IconPhoneCall size={18} stroke={2} />}
                active={activeNav === 'call-logs' || activeNav === 'calls'}
                onClick={() => onSelectNav('call-logs')}
                className={`sidebar-nav-item ${activeNav === 'call-logs' || activeNav === 'calls' ? 'crextio-pill-active' : 'crextio-pill-inactive'}`}
                style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
            {/* Customers Item */}
            {can('customers', 'view') && (
              <NavLink
                label="Customers"
                leftSection={<IconBuilding size={18} stroke={2} />}
                active={
                  activeNav === 'customers' ||
                  activeNav === 'customer' ||
                  activeNav === 'customer-details' ||
                  activeNav === 'add-customer'
                }
                onClick={() => onSelectNav('customers')}
                className={`sidebar-nav-item ${
                  activeNav === 'customers' ||
                  activeNav === 'customer' ||
                  activeNav === 'customer-details' ||
                  activeNav === 'add-customer'
                    ? 'crextio-pill-active'
                    : 'crextio-pill-inactive'
                }`}
                style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
            {/* Projects Management Item */}
            {can('projects', 'view') && (
              <NavLink
                label="Projects Management"
                leftSection={<IconFolders size={18} stroke={2} />}
                active={
                  activeNav.startsWith('projects') ||
                  activeNav === 'project' ||
                  activeNav === 'add-project'
                }
                onClick={() => onSelectNav('projects')}
                className={`sidebar-nav-item ${
                  activeNav.startsWith('projects') || activeNav === 'project' || activeNav === 'add-project'
                    ? 'crextio-pill-active'
                    : 'crextio-pill-inactive'
                }`}
                style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
            {/* Activity Timeline Item */}
            {(can('activity_timeline', 'view') || can('activities', 'view') || isSuperAdmin || can('leads', 'view')) && (
              <NavLink
                label="Activity Timeline"
                leftSection={<IconClock size={18} stroke={2} />}
                active={
                  activeNav === 'activity-timeline' ||
                  activeNav === 'activities' ||
                  activeNav === 'activity'
                }
                onClick={() => onSelectNav('activity-timeline')}
                className={
                  activeNav === 'activity-timeline' ||
                  activeNav === 'activities' ||
                  activeNav === 'activity'
                    ? 'crextio-pill-active'
                    : 'crextio-pill-inactive'
                }
                style={{ borderRadius: 10, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
              />
            )}
          </Stack>

          {/* Administration & Security Section */}
          {(can('access_control', 'view') || can('settings', 'view') || isSuperAdmin) && (
            <>
              <Text className="sidebar-section-header" size="10px" fw={800} c="dimmed" tt="uppercase" px="xs" mt="sm" style={{ letterSpacing: '0.08em' }}>
                Administration & Security
              </Text>
              <Stack gap={6}>
                {can('access_control', 'view') && (
                  <NavLink
                    label="Access Control"
                    leftSection={<IconShieldLock size={18} stroke={2} />}
                    active={activeNav === 'access-control' || activeNav === 'rbac'}
                    onClick={() => onSelectNav('access-control')}
                    className={`sidebar-nav-item ${activeNav === 'access-control' || activeNav === 'rbac' ? 'crextio-pill-active' : 'crextio-pill-inactive'}`}
                    style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
                  />
                )}
                {(can('settings', 'view') || isSuperAdmin) && (
                  <NavLink
                    label="Settings"
                    leftSection={<IconSettings size={18} stroke={2} />}
                    active={activeNav === 'settings'}
                    onClick={() => onSelectNav('settings')}
                    className={`sidebar-nav-item ${activeNav === 'settings' ? 'crextio-pill-active' : 'crextio-pill-inactive'}`}
                    style={{ borderRadius: 12, padding: '9px 14px', height: 42, fontSize: 13, fontWeight: 600 }}
                  />
                )}
              </Stack>
            </>
          )}
        </Stack>
      </ScrollArea>
    </Box>
  );
};
