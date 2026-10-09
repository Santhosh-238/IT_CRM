import React, { useState } from 'react';
import {
  Box,
  Paper,
  Text,
  Button,
  Group,
  TextInput,
  ThemeIcon,
  Stack,
  Center,
  UnstyledButton,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconSearch,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react';
import { useCRM } from '../../context/CRMContext';
import { useEmployee } from '../../context/EmployeeContext';
import { Employee } from '../../types/employee';
import { EmployeeTableView } from './components/EmployeeTableView';
import { EmployeeDrawer } from './components/EmployeeDrawer';

type StatusTab = 'ACTIVE' | 'INACTIVE' | 'ALL';

export const EmployeesPage: React.FC = () => {
  const { globalSearch, setActiveNav } = useCRM();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const {
    employees,
    fetchEmployees,
    deleteEmployee,
    updateEmployeeStatus,
  } = useEmployee();

  const [localSearch, setLocalSearch] = useState('');
  const [activeTab, setActiveTabState] = useState<StatusTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_employees_tab') as StatusTab;
      if (saved === 'ACTIVE' || saved === 'INACTIVE' || saved === 'ALL') {
        return saved;
      }
    }
    return 'ACTIVE';
  });

  const setActiveTab = (tab: StatusTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_employees_tab', tab);
    }
  };
  const [drawerEmployee, setDrawerEmployee] = useState<Employee | null>(null);

  const effectiveSearch = (localSearch || globalSearch).toLowerCase().trim();

  const isEmpActive = (status?: string) => {
    const s = (status || '').toUpperCase().trim();
    return !(s.includes('INACT') || s.includes('RELIEV') || s.includes('TERM') || s.includes('NOTIC'));
  };

  // Counts
  const activeCount = employees.filter((e) => isEmpActive(e.status)).length;
  const inactiveCount = employees.filter((e) => !isEmpActive(e.status)).length;
  const totalCount = employees.length;

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    // 1. Search Filter
    const matchesSearch =
      !effectiveSearch ||
      emp.name.toLowerCase().includes(effectiveSearch) ||
      emp.email.toLowerCase().includes(effectiveSearch) ||
      emp.empCode.toLowerCase().includes(effectiveSearch) ||
      (emp.phone && emp.phone.includes(effectiveSearch)) ||
      (emp.role && emp.role.toLowerCase().includes(effectiveSearch)) ||
      (emp.department && emp.department.toLowerCase().includes(effectiveSearch));

    // 2. Tab Filter
    const active = isEmpActive(emp.status);
    let matchesTab = true;
    if (activeTab === 'ACTIVE') {
      matchesTab = active;
    } else if (activeTab === 'INACTIVE') {
      matchesTab = !active;
    }

    return matchesSearch && matchesTab;
  });

  const handleOpenAddScreen = () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('crm_editing_employee');
    setActiveNav('add-employee');
  };

  const handleOpenEditScreen = (emp: Employee) => {
    if (typeof window !== 'undefined') sessionStorage.setItem('crm_editing_employee', JSON.stringify(emp));
    setActiveNav('add-employee');
  };

  return (
    <Box p={{ base: 'md', md: 'xl' }} style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* 1. Top Segmented Status Filter Tabs */}
      <Group gap="xs" mb="lg">
        <Paper
          p={4}
          radius="xl"
          style={{
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            display: 'inline-flex',
            boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Group gap={4}>
            {/* Tab 1: Active Employees */}
            <UnstyledButton
              onClick={() => setActiveTab('ACTIVE')}
              style={{
                padding: '8px 16px',
                borderRadius: '100px',
                backgroundColor:
                  activeTab === 'ACTIVE'
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.18)'
                      : '#F0FDF4'
                    : 'transparent',
                border:
                  activeTab === 'ACTIVE'
                    ? isDark
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : '1px solid #BBF7D0'
                    : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Group gap={8} align="center">
                <Box
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: '#16A34A',
                  }}
                />
                <Text
                  size="13px"
                  fw={activeTab === 'ACTIVE' ? 700 : 500}
                  style={{
                    color:
                      activeTab === 'ACTIVE'
                        ? isDark
                          ? '#34D399'
                          : '#15803D'
                        : isDark
                        ? '#94A3B8'
                        : '#64748B',
                  }}
                >
                  Active Employees ({activeCount})
                </Text>
              </Group>
            </UnstyledButton>

            {/* Tab 2: Relieved / Inactive */}
            <UnstyledButton
              onClick={() => setActiveTab('INACTIVE')}
              style={{
                padding: '8px 16px',
                borderRadius: '100px',
                backgroundColor:
                  activeTab === 'INACTIVE'
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.18)'
                      : '#FEF2F2'
                    : 'transparent',
                border:
                  activeTab === 'INACTIVE'
                    ? isDark
                      ? '1px solid rgba(239, 68, 68, 0.35)'
                      : '1px solid #FECACA'
                    : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Group gap={8} align="center">
                <Box
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                  }}
                />
                <Text
                  size="13px"
                  fw={activeTab === 'INACTIVE' ? 700 : 500}
                  style={{
                    color:
                      activeTab === 'INACTIVE'
                        ? isDark
                          ? '#F87171'
                          : '#DC2626'
                        : isDark
                        ? '#94A3B8'
                        : '#64748B',
                  }}
                >
                  Relieved / Inactive ({inactiveCount})
                </Text>
              </Group>
            </UnstyledButton>

            {/* Tab 3: All Employees */}
            <UnstyledButton
              onClick={() => setActiveTab('ALL')}
              style={{
                padding: '8px 16px',
                borderRadius: '100px',
                backgroundColor:
                  activeTab === 'ALL'
                    ? isDark
                      ? '#1E293B'
                      : '#F1F5F9'
                    : 'transparent',
                border:
                  activeTab === 'ALL'
                    ? isDark
                      ? '1px solid rgba(255, 255, 255, 0.12)'
                      : '1px solid #E2E8F0'
                    : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Text
                size="13px"
                fw={activeTab === 'ALL' ? 700 : 500}
                style={{
                  color:
                    activeTab === 'ALL'
                      ? isDark
                        ? '#F8FAFC'
                        : '#0F172A'
                      : isDark
                      ? '#94A3B8'
                      : '#64748B',
                }}
              >
                All Employees ({totalCount})
              </Text>
            </UnstyledButton>
          </Group>
        </Paper>
      </Group>

      {/* 2. Main Table Container Card */}
      <Paper
        p="xl"
        radius="lg"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.45)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Top Search & Actions Toolbar */}
        <Group justify="space-between" align="center" mb="xl" wrap="wrap" gap="md">
          {/* Left: Search Bar */}
          <TextInput
            placeholder="Search by name..."
            leftSection={<IconSearch size={16} color={isDark ? '#94A3B8' : '#94A3B8'} />}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.currentTarget.value)}
            radius="md"
            size="sm"
            style={{ width: 340, maxWidth: '100%' }}
            styles={{
              input: {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                color: isDark ? '#F8FAFC' : '#0F172A',
                '&:focus': {
                  borderColor: '#3B82F6',
                },
              },
            }}
          />

          {/* Right: Add Employee Button */}
          <Group gap="sm">
            <Button
              size="sm"
              radius="md"
              leftSection={<IconUserPlus size={16} />}
              onClick={handleOpenAddScreen}
              style={{
                backgroundColor: isDark ? '#3B82F6' : '#0F172A',
                color: '#FFFFFF',
                fontWeight: 600,
                boxShadow: isDark ? '0 4px 14px rgba(59, 130, 246, 0.35)' : undefined,
              }}
            >
              Add Employee
            </Button>
          </Group>
        </Group>

        {/* Table Content or Empty State */}
        {filteredEmployees.length === 0 ? (
          <Box py={60} style={{ textAlign: 'center' }}>
            <Center>
              <Stack align="center" gap="sm">
                <ThemeIcon size={56} radius="xl" variant="light" color="gray">
                  <IconUsers size={28} />
                </ThemeIcon>
                <Text fw={700} size="md" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                  {employees.length === 0 ? 'No Employees Found' : 'No employees match your search'}
                </Text>
                <Text size="xs" c="dimmed" maw={400}>
                  {employees.length === 0
                    ? 'Your employee directory is empty. Click "+ Add Employee" to create your first team member.'
                    : 'Try typing a different name, email, or switch tabs.'}
                </Text>
              </Stack>
            </Center>
          </Box>
        ) : (
          <EmployeeTableView
            employees={filteredEmployees}
            onViewDetails={(e) => handleOpenEditScreen(e)}
            onEdit={(e) => handleOpenEditScreen(e)}
            onDelete={(id) => deleteEmployee(id)}
            onStatusChange={(id, status) => updateEmployeeStatus(id, status)}
          />
        )}
      </Paper>
    </Box>
  );
};

export default EmployeesPage;
