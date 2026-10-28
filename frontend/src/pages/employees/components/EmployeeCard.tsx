import React from 'react';
import {
  Paper,
  Group,
  Avatar,
  Text,
  Badge,
  Divider,
  ActionIcon,
  Menu,
  Box,
  Button,
  Indicator,
  Tooltip,
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
  IconMail,
  IconPhone,
  IconMapPin,
  IconBriefcase,
  IconStar,
  IconBrandGithub,
  IconBrandLinkedin,
  IconCheck,
  IconClock,
  IconBeach,
  IconAlertTriangle,
  IconArrowRight,
} from '@tabler/icons-react';
import { Employee, EmployeeStatus } from '../../../types/employee';
import { CRM_COLORS } from '../../../theme/colors';

interface EmployeeCardProps {
  employee: Employee;
  onViewDetails: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: EmployeeStatus) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onViewDetails,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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

  const statusInfo = getStatusBadge(employee.status);

  return (
    <Paper
      p="lg"
      radius="24px"
      className="crextio-card card-hover-effect"
      style={{
        background: CRM_COLORS.cardBg,
        border: `1px solid ${CRM_COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        height: '100%',
      }}
    >
      <Box>
        {/* Top Header: Code Badge & Actions */}
        <Group justify="space-between" align="center" mb="sm">
          <Group gap={6}>
            <Badge
              size="xs"
              radius="100px"
              variant="outline"
              style={{
                borderColor: CRM_COLORS.border,
                color: CRM_COLORS.textSecondary,
                fontWeight: 700,
              }}
            >
              {employee.empCode}
            </Badge>

            <Badge
              size="xs"
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
          </Group>

          <Menu shadow="lg" width={190} position="bottom-end" radius="16px">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm" radius="100px">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown p="xs">
              <Menu.Item leftSection={<IconEye size={15} />} onClick={() => onViewDetails(employee)}>
                View 360° Profile
              </Menu.Item>
              <Menu.Item leftSection={<IconEdit size={15} />} onClick={() => onEdit(employee)}>
                Edit Details
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label>Change Status</Menu.Label>
              <Menu.Item
                leftSection={<IconCheck size={14} color="teal" />}
                onClick={() => onStatusChange(employee.id, 'ACTIVE')}
              >
                Mark Active
              </Menu.Item>
              <Menu.Item
                leftSection={<IconClock size={14} color="orange" />}
                onClick={() => onStatusChange(employee.id, 'PROBATION')}
              >
                Mark Probation
              </Menu.Item>
              <Menu.Item
                leftSection={<IconBeach size={14} color="blue" />}
                onClick={() => onStatusChange(employee.id, 'ON_LEAVE')}
              >
                Mark On Leave
              </Menu.Item>
              <Menu.Item
                leftSection={<IconAlertTriangle size={14} color="red" />}
                onClick={() => onStatusChange(employee.id, 'NOTICE_PERIOD')}
              >
                Mark Notice Period
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={15} />}
                onClick={() => onDelete(employee.id)}
              >
                Delete Record
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Profile Info */}
        <Group gap="md" align="center" mb="md">
          <Indicator
            inline
            size={12}
            offset={4}
            position="bottom-end"
            color={employee.status === 'ACTIVE' ? 'teal' : 'gray'}
            withBorder
          >
            <Avatar
              size={60}
              radius="20px"
              alt={employee.name}
              style={{
                border: `2px solid ${CRM_COLORS.borderLight}`,
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
                fontWeight: 700,
              }}
            >
              {getInitials(employee.name)}
            </Avatar>
          </Indicator>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Text fw={800} size="15px" style={{ color: CRM_COLORS.textPrimary, lineHeight: 1.2 }} truncate>
              {employee.name}
            </Text>
            <Text size="xs" c="dimmed" fw={500} truncate mt={2}>
              {employee.designation}
            </Text>
            <Badge
              size="xs"
              radius="100px"
              mt={6}
              style={{
                background: CRM_COLORS.pastelPurple,
                color: CRM_COLORS.pastelPurpleText,
                fontWeight: 700,
              }}
            >
              {employee.department}
            </Badge>
          </div>
        </Group>

        {/* Location, Experience, Rating */}
        <Group gap="xs" mb="sm" wrap="wrap">
          <Group gap={4}>
            <IconMapPin size={13} color={CRM_COLORS.textMuted} />
            <Text size="xs" c="dimmed">
              {employee.workLocation}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">•</Text>
          <Text size="xs" c="dimmed">
            {employee.experienceYears} yrs exp
          </Text>
          <Text size="xs" c="dimmed">•</Text>
          <Group gap={3}>
            <IconStar size={13} color="#F59E0B" fill="#F59E0B" />
            <Text size="xs" fw={700} style={{ color: CRM_COLORS.textPrimary }}>
              {employee.rating}
            </Text>
          </Group>
        </Group>

        {/* Skills Tag Cloud */}
        <Group gap={4} mb="md" wrap="wrap">
          {employee.skills && employee.skills.slice(0, 3).map((skill, idx) => (
            <Badge
              key={idx}
              size="xs"
              radius="100px"
              variant="subtle"
              style={{
                background: CRM_COLORS.backgroundLight,
                color: CRM_COLORS.textSecondary,
                fontWeight: 600,
                fontSize: '10px',
                border: `1px solid ${CRM_COLORS.borderLight}`,
              }}
            >
              {skill}
            </Badge>
          ))}
          {employee.skills && employee.skills.length > 3 && (
            <Badge
              size="xs"
              radius="100px"
              variant="subtle"
              style={{
                background: CRM_COLORS.backgroundLight,
                color: CRM_COLORS.textMuted,
                fontSize: '10px',
              }}
            >
              +{employee.skills.length - 3}
            </Badge>
          )}
        </Group>

        {/* Current Project Pill */}
        {employee.currentProject ? (
          <Box
            p={8}
            px={10}
            mb="xs"
            style={{
              background: CRM_COLORS.backgroundLight,
              borderRadius: 14,
              border: `1px solid ${CRM_COLORS.borderLight}`,
            }}
          >
            <Group gap={6}>
              <IconBriefcase size={13} color="#3B82F6" />
              <Text size="11px" c="dimmed" truncate>
                Project: <Text span fw={700} inherit style={{ color: CRM_COLORS.textPrimary }}>{employee.currentProject}</Text>
              </Text>
            </Group>
          </Box>
        ) : (
          <Box
            p={8}
            px={10}
            mb="xs"
            style={{
              background: CRM_COLORS.backgroundLight,
              borderRadius: 14,
              border: `1px dashed ${CRM_COLORS.borderLight}`,
            }}
          >
            <Group gap={6}>
              <IconBriefcase size={13} color={CRM_COLORS.textMuted} />
              <Text size="11px" c="dimmed">
                Bench / Ready for Allocation
              </Text>
            </Group>
          </Box>
        )}
      </Box>

      {/* Card Footer Actions */}
      <Box mt="xs">
        <Divider mb="xs" style={{ borderColor: CRM_COLORS.borderLight }} />
        <Group justify="space-between" align="center">
          <Group gap={4}>
            {employee.email && (
              <Tooltip label={employee.email}>
                <ActionIcon
                  component="a"
                  href={`mailto:${employee.email}`}
                  variant="subtle"
                  color="gray"
                  size="sm"
                  radius="100px"
                >
                  <IconMail size={15} />
                </ActionIcon>
              </Tooltip>
            )}
            {employee.phone && (
              <Tooltip label={employee.phone}>
                <ActionIcon
                  component="a"
                  href={`tel:${employee.phone}`}
                  variant="subtle"
                  color="gray"
                  size="sm"
                  radius="100px"
                >
                  <IconPhone size={15} />
                </ActionIcon>
              </Tooltip>
            )}
            {employee.github && (
              <Tooltip label={`github.com/${employee.github}`}>
                <ActionIcon
                  component="a"
                  href={`https://github.com/${employee.github}`}
                  target="_blank"
                  variant="subtle"
                  color="gray"
                  size="sm"
                  radius="100px"
                >
                  <IconBrandGithub size={15} />
                </ActionIcon>
              </Tooltip>
            )}
            {employee.linkedin && (
              <Tooltip label="LinkedIn Profile">
                <ActionIcon
                  component="a"
                  href={`https://linkedin.com/in/${employee.linkedin}`}
                  target="_blank"
                  variant="subtle"
                  color="gray"
                  size="sm"
                  radius="100px"
                >
                  <IconBrandLinkedin size={15} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>

          <Button
            size="xs"
            variant="light"
            radius="100px"
            rightSection={<IconArrowRight size={13} />}
            onClick={() => onViewDetails(employee)}
            style={{
              background: CRM_COLORS.primary,
              color: CRM_COLORS.textOnPrimary,
              fontWeight: 700,
            }}
          >
            360° Profile
          </Button>
        </Group>
      </Box>
    </Paper>
  );
};
