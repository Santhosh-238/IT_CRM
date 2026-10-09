import React from 'react';
import {
  Group,
  TextInput,
  Select,
  Button,
  Box,
  Text,
  Badge,
  ActionIcon,
  Paper,
} from '@mantine/core';
import {
  IconSearch,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';
import { CRM_COLORS } from '../../../theme/colors';

interface EmployeeFilterHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  employmentType: string;
  onEmploymentTypeChange: (value: string) => void;
  availableDepartments?: string[];
  availableStatuses?: string[];
  availableEmploymentTypes?: string[];
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (mode: 'grid' | 'table') => void;
  onOpenAddModal: () => void;
  onRefresh?: () => void;
  totalCount: number;
}

export const EmployeeFilterHeader: React.FC<EmployeeFilterHeaderProps> = ({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  status,
  onStatusChange,
  employmentType,
  onEmploymentTypeChange,
  availableDepartments = [],
  availableStatuses = [],
  availableEmploymentTypes = [],
  onOpenAddModal,
  totalCount,
}) => {
  const hasActiveFilters = department !== 'ALL' || status !== 'ALL' || employmentType !== 'ALL' || search.trim() !== '';

  const handleResetFilters = () => {
    onSearchChange('');
    onDepartmentChange('ALL');
    onStatusChange('ALL');
    onEmploymentTypeChange('ALL');
  };

  const departmentOptions = [
    { value: 'ALL', label: 'All Departments' },
    ...availableDepartments.map((d) => ({ value: d, label: d })),
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    ...availableStatuses.map((s) => ({ value: s, label: s })),
  ];

  const typeOptions = [
    { value: 'ALL', label: 'All Types' },
    ...availableEmploymentTypes.map((t) => ({ value: t, label: t })),
  ];

  return (
    <Box mb="xl">
      {/* 1. Page Title & Action Header */}
      <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="md">
        <div>
          <Group gap="xs" align="center">
            <Text size="26px" fw={800} style={{ letterSpacing: '-0.03em', color: CRM_COLORS.textPrimary }}>
              Employee Directory
            </Text>
            <Badge
              size="md"
              radius="100px"
              style={{
                background: CRM_COLORS.pastelMint,
                color: CRM_COLORS.pastelMintText,
                fontWeight: 700,
              }}
            >
              {totalCount} Staff Members
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" mt={2}>
            Manage IT engineering talent, project allocations, and employee lifecycle
          </Text>
        </div>

        <Group gap="xs">
          <Button
            leftSection={<IconUserPlus size={17} />}
            radius="100px"
            onClick={onOpenAddModal}
            style={{
              background: CRM_COLORS.primary,
              color: CRM_COLORS.textOnPrimary,
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(20, 24, 31, 0.2)',
            }}
          >
            Add Employee
          </Button>
        </Group>
      </Group>

      {/* 2. Floating Filter Capsule Bar */}
      <Paper
        p="sm"
        radius="20px"
        className="crextio-card"
        style={{
          background: CRM_COLORS.cardBg,
          border: `1px solid ${CRM_COLORS.border}`,
        }}
      >
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            placeholder="Search by name, EMP code, skills, or email..."
            leftSection={<IconSearch size={16} color={CRM_COLORS.textSecondary} />}
            rightSection={
              search ? (
                <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => onSearchChange('')}>
                  <IconX size={12} />
                </ActionIcon>
              ) : null
            }
            value={search}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            radius="100px"
            size="sm"
            style={{ flex: 1, minWidth: 260 }}
            styles={{
              input: {
                background: CRM_COLORS.backgroundLight,
                border: `1px solid ${CRM_COLORS.borderLight}`,
              },
            }}
          />

          <Select
            placeholder="Department"
            value={department}
            onChange={(val) => onDepartmentChange(val || 'ALL')}
            radius="100px"
            size="sm"
            data={departmentOptions}
            style={{ width: 170 }}
            styles={{
              input: {
                background: CRM_COLORS.backgroundLight,
                border: `1px solid ${CRM_COLORS.borderLight}`,
                fontWeight: 500,
              },
            }}
          />

          <Select
            placeholder="Status"
            value={status}
            onChange={(val) => onStatusChange(val || 'ALL')}
            radius="100px"
            size="sm"
            data={statusOptions}
            style={{ width: 140 }}
            styles={{
              input: {
                background: CRM_COLORS.backgroundLight,
                border: `1px solid ${CRM_COLORS.borderLight}`,
                fontWeight: 500,
              },
            }}
          />

          <Select
            placeholder="Work Type"
            value={employmentType}
            onChange={(val) => onEmploymentTypeChange(val || 'ALL')}
            radius="100px"
            size="sm"
            data={typeOptions}
            style={{ width: 130 }}
            styles={{
              input: {
                background: CRM_COLORS.backgroundLight,
                border: `1px solid ${CRM_COLORS.borderLight}`,
                fontWeight: 500,
              },
            }}
          />

          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              radius="100px"
              leftSection={<IconX size={13} />}
              onClick={handleResetFilters}
            >
              Clear Filters
            </Button>
          )}
        </Group>
      </Paper>
    </Box>
  );
};
