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
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
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
  const {
    employees,
    fetchEmployees,
    deleteEmployee,
    updateEmployeeStatus,
  } = useEmployee();

  const [localSearch, setLocalSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('ACTIVE');
  const [drawerEmployee, setDrawerEmployee] = useState<Employee | null>(null);

  const effectiveSearch = (localSearch || globalSearch).toLowerCase().trim();

  // Counts
  const activeCount = employees.filter((e) => {
    const s = (e.status || '').toUpperCase();
    return s.includes('ACT') || s.includes('LIVE') || s === '' || !e.status;
  }).length;

  const inactiveCount = employees.filter((e) => {
    const s = (e.status || '').toUpperCase();
    return s.includes('INACT') || s.includes('RELIEV') || s.includes('TERM') || s.includes('NOTIC');
  }).length;

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
    const s = (emp.status || '').toUpperCase();
    const isEmpActive = s.includes('ACT') || s.includes('LIVE') || s === '' || !emp.status;
    const isEmpInactive = s.includes('INACT') || s.includes('RELIEV') || s.includes('TERM') || s.includes('NOTIC');

    let matchesTab = true;
    if (activeTab === 'ACTIVE') {
      matchesTab = isEmpActive;
    } else if (activeTab === 'INACTIVE') {
      matchesTab = isEmpInactive;
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
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'inline-flex',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Group gap={4}>
            {/* Tab 1: Active Employees */}
            <UnstyledButton
              onClick={() => setActiveTab('ACTIVE')}
              style={{
                padding: '8px 16px',
                borderRadius: '100px',
                backgroundColor: activeTab === 'ACTIVE' ? '#F0FDF4' : 'transparent',
                border: activeTab === 'ACTIVE' ? '1px solid #BBF7D0' : '1px solid transparent',
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
                    color: activeTab === 'ACTIVE' ? '#15803D' : '#64748B',
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
                backgroundColor: activeTab === 'INACTIVE' ? '#FEF2F2' : 'transparent',
                border: activeTab === 'INACTIVE' ? '1px solid #FECACA' : '1px solid transparent',
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
                    color: activeTab === 'INACTIVE' ? '#DC2626' : '#64748B',
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
                backgroundColor: activeTab === 'ALL' ? '#F1F5F9' : 'transparent',
                border: activeTab === 'ALL' ? '1px solid #E2E8F0' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Text
                size="13px"
                fw={activeTab === 'ALL' ? 700 : 500}
                style={{
                  color: activeTab === 'ALL' ? '#0F172A' : '#64748B',
                }}
              >
                All Employees ({totalCount})
              </Text>
            </UnstyledButton>
          </Group>
        </Paper>
      </Group>

      {/* 2. Main White Table Container Card */}
      <Paper
        p="xl"
        radius="lg"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Top Search & Actions Toolbar */}
        <Group justify="space-between" align="center" mb="xl" wrap="wrap" gap="md">
          {/* Left: Search Bar */}
          <TextInput
            placeholder="Search by name..."
            leftSection={<IconSearch size={16} color="#94A3B8" />}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.currentTarget.value)}
            radius="md"
            size="sm"
            style={{ width: 340, maxWidth: '100%' }}
            styles={{
              input: {
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#0F172A',
                '&:focus': {
                  borderColor: '#3B82F6',
                },
              },
            }}
          />

          {/* Right: Refresh & Add Employee Buttons */}
          <Group gap="sm">
            <Button
              variant="default"
              size="sm"
              radius="md"
              leftSection={<IconRefresh size={15} color="#64748B" />}
              onClick={() => fetchEmployees()}
              style={{
                border: '1px solid #E2E8F0',
                fontWeight: 600,
                color: '#334155',
                backgroundColor: '#FFFFFF',
              }}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              radius="md"
              leftSection={<IconUserPlus size={16} />}
              onClick={handleOpenAddScreen}
              style={{
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 600,
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
                <Text fw={700} size="md" style={{ color: '#0F172A' }}>
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
            onViewDetails={(e) => setDrawerEmployee(e)}
            onEdit={(e) => handleOpenEditScreen(e)}
            onDelete={(id) => deleteEmployee(id)}
            onStatusChange={(id, status) => updateEmployeeStatus(id, status)}
          />
        )}
      </Paper>

      {/* 3. Details Drawer */}
      <EmployeeDrawer
        opened={Boolean(drawerEmployee)}
        onClose={() => setDrawerEmployee(null)}
        employee={drawerEmployee}
        onEdit={(e) => handleOpenEditScreen(e)}
      />
    </Box>
  );
};

export default EmployeesPage;
