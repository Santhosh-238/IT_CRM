import React, { useState } from 'react';
import { Box, SimpleGrid, Paper, Text, Button, Center, Stack, ThemeIcon } from '@mantine/core';
import { IconUsers, IconUserPlus } from '@tabler/icons-react';
import { useCRM } from '../../context/CRMContext';
import { useEmployee } from '../../context/EmployeeContext';
import { Employee } from '../../types/employee';
import { EmployeeFilterHeader } from './components/EmployeeFilterHeader';
import { EmployeeCard } from './components/EmployeeCard';
import { EmployeeTableView } from './components/EmployeeTableView';
import { EmployeeDrawer } from './components/EmployeeDrawer';
import { CRM_COLORS } from '../../theme/colors';

export const EmployeesPage: React.FC = () => {
  const { globalSearch, setActiveNav } = useCRM();
  const {
    employees,
    fetchEmployees,
    deleteEmployee,
    updateEmployeeStatus,
  } = useEmployee();

  const [localSearch, setLocalSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Drawer state
  const [drawerEmployee, setDrawerEmployee] = useState<Employee | null>(null);

  const effectiveSearch = (localSearch || globalSearch).toLowerCase().trim();

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      !effectiveSearch ||
      emp.name.toLowerCase().includes(effectiveSearch) ||
      emp.email.toLowerCase().includes(effectiveSearch) ||
      emp.empCode.toLowerCase().includes(effectiveSearch) ||
      emp.designation.toLowerCase().includes(effectiveSearch) ||
      emp.department.toLowerCase().includes(effectiveSearch) ||
      (emp.skills && emp.skills.some((s) => s.toLowerCase().includes(effectiveSearch)));

    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
    const matchesType = employmentTypeFilter === 'ALL' || emp.employmentType === employmentTypeFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesType;
  });

  const handleOpenAddScreen = () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('crm_editing_employee');
    setActiveNav('add-employee');
  };

  const handleOpenEditScreen = (emp: Employee) => {
    if (typeof window !== 'undefined') sessionStorage.setItem('crm_editing_employee', JSON.stringify(emp));
    setActiveNav('add-employee');
  };

  const availableDepartments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
  const availableStatuses = Array.from(new Set(employees.map((e) => e.status).filter(Boolean)));
  const availableEmploymentTypes = Array.from(new Set(employees.map((e) => e.employmentType).filter(Boolean)));

  return (
    <Box>
      {/* 1. Filter & Controls Header */}
      <EmployeeFilterHeader
        search={localSearch}
        onSearchChange={setLocalSearch}
        department={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        employmentType={employmentTypeFilter}
        onEmploymentTypeChange={setEmploymentTypeFilter}
        availableDepartments={availableDepartments}
        availableStatuses={availableStatuses}
        availableEmploymentTypes={availableEmploymentTypes}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAddModal={handleOpenAddScreen}
        onRefresh={() => fetchEmployees()}
        totalCount={filteredEmployees.length}
      />

      {/* 2. Main Content: Grid or Table */}
      {filteredEmployees.length === 0 ? (
        <Paper
          p={60}
          radius="28px"
          className="crextio-card"
          style={{
            background: CRM_COLORS.cardBg,
            border: `1px dashed ${CRM_COLORS.border}`,
            textAlign: 'center',
          }}
        >
          <Center>
            <Stack align="center" gap="sm">
              <ThemeIcon
                size={68}
                radius="24px"
                variant="light"
                style={{
                  background: CRM_COLORS.pastelMint,
                  color: CRM_COLORS.pastelMintText,
                }}
              >
                <IconUsers size={34} stroke={2.2} />
              </ThemeIcon>
              <Text fw={800} size="22px" mt="xs" style={{ color: CRM_COLORS.textPrimary }}>
                {employees.length === 0 ? 'No Employees in Directory' : 'No employees match your search'}
              </Text>
              <Text size="sm" c="dimmed" maw={440}>
                {employees.length === 0
                  ? 'Your employee workforce directory is currently empty. Click below to add your first team member.'
                  : 'Try adjusting your search query, department filter, or reset your filters to view all staff.'}
              </Text>
              <Button
                leftSection={<IconUserPlus size={18} />}
                mt="md"
                size="md"
                radius="100px"
                onClick={handleOpenAddScreen}
                style={{
                  background: CRM_COLORS.primary,
                  color: CRM_COLORS.textOnPrimary,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(20, 24, 31, 0.25)',
                }}
              >
                Add First Employee
              </Button>
            </Stack>
          </Center>
        </Paper>
      ) : viewMode === 'grid' ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
          {filteredEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onViewDetails={(e) => setDrawerEmployee(e)}
              onEdit={(e) => handleOpenEditScreen(e)}
              onDelete={(id) => deleteEmployee(id)}
              onStatusChange={(id, status) => updateEmployeeStatus(id, status)}
            />
          ))}
        </SimpleGrid>
      ) : (
        <EmployeeTableView
          employees={filteredEmployees}
          onViewDetails={(e) => setDrawerEmployee(e)}
          onEdit={(e) => handleOpenEditScreen(e)}
          onDelete={(id) => deleteEmployee(id)}
          onStatusChange={(id, status) => updateEmployeeStatus(id, status)}
        />
      )}

      {/* 3. 360-Degree Profile Drawer */}
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
