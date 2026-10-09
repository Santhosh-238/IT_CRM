import React from 'react';
import {
  Table,
  Paper,
  Group,
  Avatar,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Tooltip,
  Box,
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
  IconCheck,
  IconClock,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Employee, EmployeeStatus } from '../../../types/employee';

interface EmployeeTableViewProps {
  employees: Employee[];
  onViewDetails: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: EmployeeStatus) => void;
}

export const EmployeeTableView: React.FC<EmployeeTableViewProps> = ({
  employees,
  onViewDetails,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  // Format dates cleanly like "08 Oct 2026"
  const formatJoiningDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'E';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusDisplay = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('ACT') || s.includes('LIVE') || s === '' || !status) {
      return {
        bg: '#ECFDF5',
        color: '#059669',
        border: '#A7F3D0',
        dot: '#10B981',
        label: 'LIVE',
      };
    }
    if (s.includes('INACT') || s.includes('RELIEV') || s.includes('TERM') || s.includes('NOTIC')) {
      return {
        bg: '#FEF2F2',
        color: '#DC2626',
        border: '#FECACA',
        dot: '#EF4444',
        label: 'INACTIVE',
      };
    }
    if (s.includes('PROB')) {
      return {
        bg: '#FEF3C7',
        color: '#D97706',
        border: '#FDE68A',
        dot: '#F59E0B',
        label: 'PROBATION',
      };
    }
    return {
      bg: '#F8FAFC',
      color: '#475569',
      border: '#E2E8F0',
      dot: '#94A3B8',
      label: status || 'ACTIVE',
    };
  };

  return (
    <Box style={{ width: '100%', overflowX: 'auto' }}>
      <Table verticalSpacing="lg" horizontalSpacing="md" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <Table.Thead>
          <Table.Tr style={{ borderBottom: '1px solid #F1F5F9' }}>
            <Table.Th style={{ color: '#64748B', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', paddingBottom: '14px' }}>
              NAME
            </Table.Th>
            <Table.Th style={{ color: '#64748B', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', paddingBottom: '14px' }}>
              OFFICIAL EMAIL
            </Table.Th>
            <Table.Th style={{ color: '#64748B', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', paddingBottom: '14px' }}>
              CONTACT
            </Table.Th>
            <Table.Th style={{ color: '#64748B', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', paddingBottom: '14px' }}>
              ROLE
            </Table.Th>
            <Table.Th style={{ color: '#64748B', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', paddingBottom: '14px' }}>
              EMP ID
            </Table.Th>
            <Table.Th style={{ color: '#64748B', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', paddingBottom: '14px' }}>
              STATUS
            </Table.Th>
            <Table.Th style={{ color: '#64748B', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', paddingBottom: '14px' }}>
              JOINING
            </Table.Th>
            <Table.Th style={{ width: 40, paddingBottom: '14px' }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {employees.map((emp) => {
            const statusConfig = getStatusDisplay(emp.status);
            const initials = getInitials(emp.name);

            return (
              <Table.Tr
                key={emp.id}
                style={{
                  borderBottom: '1px solid #F1F5F9',
                  transition: 'background-color 0.15s ease',
                  cursor: 'pointer',
                }}
                onClick={() => onViewDetails(emp)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* 1. NAME */}
                <Table.Td style={{ padding: '16px 12px' }}>
                  <Group gap="md" wrap="nowrap">
                    <Avatar
                      src={emp.avatar || undefined}
                      size={40}
                      radius="xl"
                      style={{
                        backgroundColor: '#0F172A',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '14px',
                        border: '1px solid #E2E8F0',
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Text fw={700} size="14px" style={{ color: '#0F172A' }}>
                      {emp.name}
                    </Text>
                  </Group>
                </Table.Td>

                {/* 2. OFFICIAL EMAIL */}
                <Table.Td style={{ padding: '16px 12px' }}>
                  <Text
                    size="13px"
                    fw={500}
                    style={{
                      color: '#4F46E5',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {emp.email}
                  </Text>
                </Table.Td>

                {/* 3. CONTACT */}
                <Table.Td style={{ padding: '16px 12px' }}>
                  <Text size="13px" fw={500} style={{ color: '#334155' }}>
                    {emp.phone || '—'}
                  </Text>
                </Table.Td>

                {/* 4. ROLE */}
                <Table.Td style={{ padding: '16px 12px' }}>
                  {emp.role ? (
                    <Badge
                      variant="filled"
                      radius="xl"
                      size="md"
                      style={{
                        backgroundColor: '#EEF2F6',
                        color: '#475569',
                        fontWeight: 600,
                        fontSize: '12px',
                        textTransform: 'none',
                        padding: '4px 12px',
                        boxShadow: 'none',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {emp.role}
                    </Badge>
                  ) : (
                    <Text size="13px" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>

                {/* 5. EMP ID */}
                <Table.Td style={{ padding: '16px 12px' }}>
                  <Text size="13px" fw={500} style={{ color: '#334155', letterSpacing: '0.02em' }}>
                    {emp.empCode}
                  </Text>
                </Table.Td>

                {/* 6. STATUS */}
                <Table.Td style={{ padding: '16px 12px' }}>
                  <Badge
                    variant="outline"
                    radius="xl"
                    size="md"
                    leftSection={
                      <Box
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: statusConfig.dot,
                          marginRight: 4,
                        }}
                      />
                    }
                    style={{
                      backgroundColor: statusConfig.bg,
                      color: statusConfig.color,
                      borderColor: statusConfig.border,
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '0.04em',
                      padding: '4px 10px',
                    }}
                  >
                    {statusConfig.label}
                  </Badge>
                </Table.Td>

                {/* 7. JOINING */}
                <Table.Td style={{ padding: '16px 12px' }}>
                  <Text size="13px" fw={500} style={{ color: '#475569' }}>
                    {formatJoiningDate(emp.joiningDate)}
                  </Text>
                </Table.Td>

                {/* 8. ACTIONS */}
                <Table.Td style={{ padding: '16px 12px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <Menu shadow="md" position="bottom-end" radius="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" size="sm" radius="md">
                        <IconDotsVertical size={16} color="#94A3B8" />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown p="xs">
                      <Menu.Item
                        leftSection={<IconEye size={14} />}
                        onClick={() => onViewDetails(emp)}
                      >
                        View Details
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => onEdit(emp)}
                      >
                        Edit Employee
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Label>Change Status</Menu.Label>
                      <Menu.Item
                        leftSection={<IconCheck size={14} color="teal" />}
                        onClick={() => onStatusChange(emp.id, 'Active')}
                      >
                        Mark Active
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconAlertTriangle size={14} color="red" />}
                        onClick={() => onStatusChange(emp.id, 'Inactive')}
                      >
                        Mark Inactive
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => onDelete(emp.id)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Box>
  );
};
