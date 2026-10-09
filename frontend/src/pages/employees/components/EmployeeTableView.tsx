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
  Button,
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
  IconStar,
  IconMapPin,
  IconCheck,
  IconClock,
  IconBeach,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Employee, EmployeeStatus } from '../../../types/employee';
import { CRM_COLORS } from '../../../theme/colors';

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
  const getStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('ACT') || s.includes('FULL')) {
      return {
        bg: CRM_COLORS.pastelMint,
        color: CRM_COLORS.pastelMintText,
        label: status || 'Active',
        icon: <IconCheck size={11} />,
      };
    }
    if (s.includes('PROB') || s.includes('PEND')) {
      return {
        bg: '#FEF3C7',
        color: '#B45309',
        label: status || 'Probation',
        icon: <IconClock size={11} />,
      };
    }
    if (s.includes('LEAV')) {
      return {
        bg: CRM_COLORS.pastelBlue,
        color: CRM_COLORS.pastelBlueText,
        label: status || 'On Leave',
        icon: <IconBeach size={11} />,
      };
    }
    if (s.includes('NOTIC') || s.includes('TERM')) {
      return {
        bg: CRM_COLORS.pastelCoral,
        color: CRM_COLORS.pastelCoralText,
        label: status || 'Notice Period',
        icon: <IconAlertTriangle size={11} />,
      };
    }
    return {
      bg: '#F1F5F9',
      color: '#475569',
      label: status || '—',
      icon: null,
    };
  };

  return (
    <Paper
      radius="24px"
      className="crextio-card"
      style={{
        background: CRM_COLORS.cardBg,
        border: `1px solid ${CRM_COLORS.border}`,
        overflow: 'hidden',
      }}
    >
      <Table.ScrollContainer minWidth={900}>
        <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
          <Table.Thead style={{ background: CRM_COLORS.backgroundLight }}>
            <Table.Tr>
              <Table.Th style={{ color: CRM_COLORS.textSecondary, fontWeight: 700 }}>Employee</Table.Th>
              <Table.Th style={{ color: CRM_COLORS.textSecondary, fontWeight: 700 }}>Designation & Role</Table.Th>
              <Table.Th style={{ color: CRM_COLORS.textSecondary, fontWeight: 700 }}>Department</Table.Th>
              <Table.Th style={{ color: CRM_COLORS.textSecondary, fontWeight: 700 }}>Location</Table.Th>
              <Table.Th style={{ color: CRM_COLORS.textSecondary, fontWeight: 700 }}>Status</Table.Th>
              <Table.Th style={{ color: CRM_COLORS.textSecondary, fontWeight: 700 }}>Experience</Table.Th>
              <Table.Th style={{ color: CRM_COLORS.textSecondary, fontWeight: 700 }}>Current Project</Table.Th>
              <Table.Th style={{ color: CRM_COLORS.textSecondary, fontWeight: 700 }}>Rating</Table.Th>
              <Table.Th style={{ textAlign: 'right', color: CRM_COLORS.textSecondary, fontWeight: 700 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {employees.map((emp) => {
              const statusInfo = getStatusBadge(emp.status);
              return (
                <Table.Tr key={emp.id} style={{ transition: 'background-color 0.15s ease' }}>
                  {/* Employee Name & Code */}
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <Avatar
                        src={emp.avatar}
                        radius="14px"
                        size={42}
                        alt={emp.name}
                        style={{ border: `1px solid ${CRM_COLORS.borderLight}` }}
                      />
                      <div>
                        <Text fw={700} size="sm" style={{ color: CRM_COLORS.textPrimary }}>
                          {emp.name}
                        </Text>
                        <Group gap={6} mt={2}>
                          <Badge
                            size="xs"
                            variant="outline"
                            radius="100px"
                            style={{
                              borderColor: CRM_COLORS.border,
                              color: CRM_COLORS.textSecondary,
                              fontWeight: 700,
                            }}
                          >
                            {emp.empCode}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {emp.email}
                          </Text>
                        </Group>
                      </div>
                    </Group>
                  </Table.Td>

                  {/* Designation */}
                  <Table.Td>
                    <Text size="sm" fw={600} style={{ color: CRM_COLORS.textPrimary }}>
                      {emp.designation}
                    </Text>
                    <Badge
                      size="xs"
                      radius="100px"
                      variant="subtle"
                      style={{
                        background: CRM_COLORS.backgroundLight,
                        color: CRM_COLORS.textSecondary,
                        fontWeight: 600,
                        border: `1px solid ${CRM_COLORS.borderLight}`,
                      }}
                      mt={3}
                    >
                      {emp.employmentType}
                    </Badge>
                  </Table.Td>

                  {/* Department */}
                  <Table.Td>
                    <Badge
                      size="xs"
                      radius="100px"
                      style={{
                        background: CRM_COLORS.pastelPurple,
                        color: CRM_COLORS.pastelPurpleText,
                        fontWeight: 700,
                      }}
                    >
                      {emp.department}
                    </Badge>
                  </Table.Td>

                  {/* Location */}
                  <Table.Td>
                    <Group gap={4}>
                      <IconMapPin size={13} color={CRM_COLORS.textMuted} />
                      <Text size="xs" style={{ color: CRM_COLORS.textPrimary }}>
                        {emp.workLocation}
                      </Text>
                    </Group>
                  </Table.Td>

                  {/* Status Switcher */}
                  <Table.Td>
                    <Badge
                      size="sm"
                      radius="100px"
                      leftSection={statusInfo.icon}
                      style={{
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        fontWeight: 700,
                      }}
                    >
                      {statusInfo.label}
                    </Badge>
                  </Table.Td>

                  {/* Experience */}
                  <Table.Td>
                    <Text size="xs" fw={700} style={{ color: CRM_COLORS.textPrimary }}>
                      {emp.experienceYears} yrs
                    </Text>
                    <Text size="11px" c="dimmed">
                      Joined: {emp.joiningDate}
                    </Text>
                  </Table.Td>

                  {/* Current Project */}
                  <Table.Td>
                    <Text size="xs" fw={600} style={{ color: emp.currentProject ? CRM_COLORS.textPrimary : CRM_COLORS.textMuted }}>
                      {emp.currentProject || '🛋️ Bench'}
                    </Text>
                  </Table.Td>

                  {/* Rating */}
                  <Table.Td>
                    <Group gap={3}>
                      <IconStar size={13} color="#F59E0B" fill="#F59E0B" />
                      <Text size="xs" fw={700} style={{ color: CRM_COLORS.textPrimary }}>
                        {emp.rating}
                      </Text>
                    </Group>
                  </Table.Td>

                  {/* Actions */}
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Group gap={4} justify="flex-end">
                      <Button
                        size="xs"
                        variant="subtle"
                        radius="100px"
                        leftSection={<IconEye size={13} />}
                        onClick={() => onViewDetails(emp)}
                        style={{ fontWeight: 600 }}
                      >
                        Profile
                      </Button>
                      <Tooltip label="Edit Details">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          radius="100px"
                          onClick={() => onEdit(emp)}
                        >
                          <IconEdit size={15} />
                        </ActionIcon>
                      </Tooltip>
                      <Menu shadow="lg" position="bottom-end" radius="16px">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size="sm" radius="100px">
                            <IconDotsVertical size={15} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown p="xs">
                          <Menu.Label>Change Status</Menu.Label>
                          <Menu.Item
                            leftSection={<IconCheck size={14} color="teal" />}
                            onClick={() => onStatusChange(emp.id, 'ACTIVE')}
                          >
                            Mark Active
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconClock size={14} color="orange" />}
                            onClick={() => onStatusChange(emp.id, 'PROBATION')}
                          >
                            Mark Probation
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconBeach size={14} color="blue" />}
                            onClick={() => onStatusChange(emp.id, 'ON_LEAVE')}
                          >
                            Mark On Leave
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconAlertTriangle size={14} color="red" />}
                            onClick={() => onStatusChange(emp.id, 'NOTICE_PERIOD')}
                          >
                            Mark Notice Period
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
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
};
