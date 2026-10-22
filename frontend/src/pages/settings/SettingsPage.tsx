import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import {
  Stack,
  Text,
  Box,
  UnstyledButton,
  Paper,
  Group,
  ThemeIcon,
  Button,
  useComputedColorScheme,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { ProjectCatalogTab } from './components/ProjectCatalogTab';
import { CompanyProfileTab } from './components/CompanyProfileTab';
import { CalendarRemindersTab } from './components/CalendarRemindersTab';

type SettingsTabKey = 'company' | 'calendar' | 'projects';

interface NavItem {
  key: SettingsTabKey;
  label: string;
}

interface TabErrorBoundaryProps {
  tabName: string;
  children: ReactNode;
}

interface TabErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  state: TabErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): TabErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[SettingsPage] Error in tab "${this.props.tabName}":`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Paper p="xl" radius="md" withBorder style={{ maxWidth: 800 }}>
          <Group gap="sm" mb="sm">
            <ThemeIcon color="red" variant="light" size="lg" radius="md">
              <IconAlertCircle size={22} />
            </ThemeIcon>
            <Box>
              <Text fw={700} size="md">
                Error Loading {this.props.tabName}
              </Text>
              <Text size="xs" c="dimmed">
                {this.state.error?.message || 'An unexpected runtime error occurred.'}
              </Text>
            </Box>
          </Group>
          <Button size="xs" variant="light" color="indigo" onClick={this.handleRetry}>
            Try Again
          </Button>
        </Paper>
      );
    }
    return this.props.children;
  }
}

const getInitialSettingsTab = (): SettingsTabKey => {
  if (typeof window !== 'undefined') {
    // 1. Check URL query param ?tab=
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as SettingsTabKey | null;
    if (tabParam && (tabParam === 'company' || tabParam === 'calendar' || tabParam === 'projects')) {
      return tabParam;
    }
    // 2. Check URL hash #calendar
    const hash = window.location.hash.replace(/^#/, '') as SettingsTabKey;
    if (hash && (hash === 'company' || hash === 'calendar' || hash === 'projects')) {
      return hash;
    }
    // 3. Check localStorage
    const saved = localStorage.getItem('crm_settings_tab') as SettingsTabKey | null;
    if (saved && (saved === 'company' || saved === 'calendar' || saved === 'projects')) {
      return saved;
    }
  }
  return 'company';
};

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTabState] = useState<SettingsTabKey>(getInitialSettingsTab);
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const navItems: NavItem[] = [
    { key: 'company', label: 'My Profile' },
    { key: 'calendar', label: 'Calendar & Reminders' },
    { key: 'projects', label: 'Project Catalog' },
  ];

  const handleTabChange = (key: SettingsTabKey) => {
    setActiveTabState(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_settings_tab', key);
      const url = new URL(window.location.href);
      if (key === 'company') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', key);
      }
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_settings_tab', activeTab);
      const url = new URL(window.location.href);
      if (activeTab !== 'company') {
        if (url.searchParams.get('tab') !== activeTab) {
          url.searchParams.set('tab', activeTab);
          window.history.replaceState(null, '', url.pathname + url.search);
        }
      } else if (url.searchParams.has('tab')) {
        url.searchParams.delete('tab');
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }

    const handlePop = () => {
      const tab = getInitialSettingsTab();
      setActiveTabState(tab);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [activeTab]);

  return (
    <Box style={{ width: '100%', maxWidth: '100%' }}>
      {/* 1. Main Page Title */}
      <Box mb="lg" pl={2}>
        <Text
          fw={800}
          size="24px"
          style={{
            letterSpacing: '-0.02em',
            color: isDark ? '#F8FAFC' : '#0F172A',
          }}
        >
          Account Settings
        </Text>
      </Box>

      {/* 2. Inner Split Layout (Sub-sidebar + Main Workspace) */}
      <Box
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        {/* Left Sub-Sidebar (Clean minimal pills matching reference design) */}
        <Box
          style={{
            width: 220,
            flexShrink: 0,
            position: 'sticky',
            top: 80,
          }}
        >
          <Stack gap={6}>
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <UnstyledButton
                  key={item.key}
                  onClick={() => handleTabChange(item.key)}
                  style={{
                    backgroundColor: isActive
                      ? isDark
                        ? 'rgba(37, 99, 235, 0.18)'
                        : '#EFF6FF'
                      : 'transparent',
                    color: isActive
                      ? isDark
                        ? '#60A5FA'
                        : '#2563EB'
                      : isDark
                      ? '#94A3B8'
                      : '#64748B',
                    borderRadius: 100,
                    padding: '8px 18px',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 14,
                    width: 'fit-content',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = isDark ? '#F8FAFC' : '#1E293B';
                      e.currentTarget.style.backgroundColor = isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = isDark ? '#94A3B8' : '#64748B';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {item.label}
                </UnstyledButton>
              );
            })}
          </Stack>
        </Box>

        {/* Right Active View Workspace */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'company' && (
            <TabErrorBoundary tabName="My Profile">
              <CompanyProfileTab />
            </TabErrorBoundary>
          )}
          {activeTab === 'calendar' && (
            <TabErrorBoundary tabName="Calendar & Reminders">
              <CalendarRemindersTab />
            </TabErrorBoundary>
          )}
          {activeTab === 'projects' && (
            <TabErrorBoundary tabName="Project Catalog">
              <ProjectCatalogTab />
            </TabErrorBoundary>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage;
