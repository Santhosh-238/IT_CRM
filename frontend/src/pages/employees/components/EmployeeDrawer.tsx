import React from 'react';
import {
  Drawer,
  Avatar,
  Text,
  Badge,
  Group,
  Stack,
  Divider,
  Paper,
  SimpleGrid,
  Button,
  ActionIcon,
  CopyButton,
  Tooltip,
} from '@mantine/core';
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconBriefcase,
  IconStar,
  IconBrandGithub,
  IconBrandLinkedin,
  IconEdit,
  IconCopy,
  IconCheck,
  IconClock,
  IconBeach,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Employee, EmployeeStatus } from '../../../types/employee';
import { CRM_COLORS } from '../../../theme/colors';

interface EmployeeDrawerProps {
  opened: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEdit: (employee: Employee) => void;
}

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  opened,
  onClose,
  employee,
  onEdit,
}) => {
  if (!employee) return null;

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
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      radius="28px 0 0 28px"
      title={
        <Group gap="xs">
          <Badge
            size="sm"
            variant="outline"
            radius="100px"
            style={{
              borderColor: CRM_COLORS.border,
              color: CRM_COLORS.textSecondary,
              fontWeight: 700,
            }}
          >
            {employee.empCode}
          </Badge>
          <Text fw={800} size="md" style={{ color: CRM_COLORS.textPrimary }}>
            Employee 360° Profile
          </Text>
        </Group>
      }
      padding="xl"
      styles={{
        content: {
          background: CRM_COLORS.cardBg,
          borderLeft: `1px solid ${CRM_COLORS.border}`,
        },
        header: {
          borderBottom: `1px solid ${CRM_COLORS.borderLight}`,
          paddingBottom: 16,
        },
      }}
    >
      <Stack gap="lg" mt="md">
        {/* Header Profile Card */}
        <Paper
          p="lg"
          radius="24px"
          style={{
            background: CRM_COLORS.backgroundLight,
            border: `1px solid ${CRM_COLORS.borderLight}`,
            textAlign: 'center',
          }}
        >
          <Avatar
            size={90}
            radius="28px"
            mx="auto"
            alt={employee.name}
            style={{
              border: `3px solid ${CRM_COLORS.cardBg}`,
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
            }}
          >
            {getInitials(employee.name)}
          </Avatar>
          <Text fw={800} size="20px" mt="sm" style={{ color: CRM_COLORS.textPrimary }}>
            {employee.name}
          </Text>
          <Text size="sm" c="dimmed" fw={500}>
            {employee.designation}
          </Text>
          <Group justify="center" gap="xs" mt="xs">
            <Badge
              size="sm"
              radius="100px"
              style={{
                background: CRM_COLORS.pastelPurple,
                color: CRM_COLORS.pastelPurpleText,
                fontWeight: 700,
              }}
            >
              {employee.department}
            </Badge>
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
            <Badge
              size="sm"
              variant="outline"
              radius="100px"
              style={{
                borderColor: CRM_COLORS.border,
                color: CRM_COLORS.textSecondary,
                fontWeight: 600,
              }}
            >
              {employee.employmentType}
            </Badge>
          </Group>

          <Group justify="center" gap="xs" mt="md">
            <Button
              size="xs"
              leftSection={<IconEdit size={14} />}
              radius="100px"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
              style={{
                background: CRM_COLORS.primary,
                color: CRM_COLORS.textOnPrimary,
                fontWeight: 700,
              }}
            >
              Edit Profile
            </Button>
            {employee.email && (
              <Button
                component="a"
                href={`mailto:${employee.email}`}
                size="xs"
                leftSection={<IconMail size={14} />}
                variant="light"
                radius="100px"
                style={{
                  background: CRM_COLORS.cardBg,
                  color: CRM_COLORS.textPrimary,
                  border: `1px solid ${CRM_COLORS.borderLight}`,
                  fontWeight: 600,
                }}
              >
                Send Email
              </Button>
            )}
          </Group>
        </Paper>

        {/* Contact & Location */}
        <div>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs" style={{ letterSpacing: '0.06em' }}>
            Contact & Location
          </Text>
          <Paper
            p="md"
            radius="20px"
            style={{
              background: CRM_COLORS.backgroundLight,
              border: `1px solid ${CRM_COLORS.borderLight}`,
            }}
          >
            <Stack gap="sm">
              <Group justify="space-between">
                <Group gap="xs">
                  <IconMail size={16} color={CRM_COLORS.textSecondary} />
                  <Text size="sm" fw={600} style={{ color: CRM_COLORS.textPrimary }}>{employee.email}</Text>
                </Group>
                <CopyButton value={employee.email}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied' : 'Copy Email'}>
                      <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>

              {employee.phone && (
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconPhone size={16} color={CRM_COLORS.textSecondary} />
                    <Text size="sm" fw={600} style={{ color: CRM_COLORS.textPrimary }}>{employee.phone}</Text>
                  </Group>
                  <CopyButton value={employee.phone}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy Phone'}>
                        <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              )}

              <Group gap="xs">
                <IconMapPin size={16} color={CRM_COLORS.textSecondary} />
                <Text size="sm" fw={600} style={{ color: CRM_COLORS.textPrimary }}>{employee.workLocation}</Text>
              </Group>
            </Stack>
          </Paper>
        </div>

        {/* Technical Competencies & Skills */}
        <div>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs" style={{ letterSpacing: '0.06em' }}>
            Technical Competencies & Skills
          </Text>
          <Group gap={6} wrap="wrap">
            {employee.skills?.map((skill, index) => (
              <Badge
                key={index}
                size="md"
                radius="100px"
                style={{
                  background: CRM_COLORS.backgroundLight,
                  color: CRM_COLORS.textPrimary,
                  border: `1px solid ${CRM_COLORS.borderLight}`,
                  fontWeight: 600,
                  padding: '6px 12px',
                }}
              >
                {skill}
              </Badge>
            ))}
          </Group>
        </div>

        {/* Employment & Project Info */}
        <div>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs" style={{ letterSpacing: '0.06em' }}>
            Employment & Project Governance
          </Text>
          <SimpleGrid cols={2} spacing="xs">
            <Paper p="sm" radius="16px" style={{ background: CRM_COLORS.backgroundLight, border: `1px solid ${CRM_COLORS.borderLight}` }}>
              <Text size="11px" c="dimmed" fw={600}>
                Experience
              </Text>
              <Text size="sm" fw={800} mt={2} style={{ color: CRM_COLORS.textPrimary }}>
                {employee.experienceYears} Years
              </Text>
            </Paper>

            <Paper p="sm" radius="16px" style={{ background: CRM_COLORS.backgroundLight, border: `1px solid ${CRM_COLORS.borderLight}` }}>
              <Text size="11px" c="dimmed" fw={600}>
                Quality Rating
              </Text>
              <Group gap={4} mt={2}>
                <IconStar size={14} color="#F59E0B" fill="#F59E0B" />
                <Text size="sm" fw={800} style={{ color: CRM_COLORS.textPrimary }}>
                  {employee.rating} / 5.0
                </Text>
              </Group>
            </Paper>

            <Paper p="sm" radius="16px" style={{ background: CRM_COLORS.backgroundLight, border: `1px solid ${CRM_COLORS.borderLight}` }}>
              <Text size="11px" c="dimmed" fw={600}>
                Joining Date
              </Text>
              <Text size="sm" fw={700} mt={2} style={{ color: CRM_COLORS.textPrimary }}>
                {employee.joiningDate}
              </Text>
            </Paper>

            <Paper p="sm" radius="16px" style={{ background: CRM_COLORS.backgroundLight, border: `1px solid ${CRM_COLORS.borderLight}` }}>
              <Text size="11px" c="dimmed" fw={600}>
                Reporting Manager
              </Text>
              <Text size="sm" fw={700} mt={2} style={{ color: CRM_COLORS.textPrimary }} truncate>
                {employee.reportingManager || 'Executive Management'}
              </Text>
            </Paper>
          </SimpleGrid>

          {employee.currentProject && (
            <Paper p="sm" radius="16px" style={{ background: CRM_COLORS.backgroundLight, border: `1px solid ${CRM_COLORS.borderLight}` }} mt="xs">
              <Text size="11px" c="dimmed" fw={600}>
                Active Client Project
              </Text>
              <Group gap="xs" mt={3}>
                <IconBriefcase size={16} color="#3B82F6" />
                <Text size="sm" fw={800} style={{ color: CRM_COLORS.textPrimary }}>
                  {employee.currentProject}
                </Text>
              </Group>
            </Paper>
          )}
        </div>

        {/* Profiles & Notes */}
        {(employee.github || employee.linkedin || employee.notes) && (
          <div>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs" style={{ letterSpacing: '0.06em' }}>
              Profiles & Notes
            </Text>
            <Paper p="md" radius="20px" style={{ background: CRM_COLORS.backgroundLight, border: `1px solid ${CRM_COLORS.borderLight}` }}>
              {employee.notes && (
                <Text size="xs" c="dimmed" mb="sm" style={{ fontStyle: 'italic' }}>
                  "{employee.notes}"
                </Text>
              )}
              <Group gap="xs">
                {employee.github && (
                  <Button
                    component="a"
                    href={`https://github.com/${employee.github}`}
                    target="_blank"
                    size="xs"
                    radius="100px"
                    variant="subtle"
                    leftSection={<IconBrandGithub size={15} />}
                  >
                    GitHub ({employee.github})
                  </Button>
                )}
                {employee.linkedin && (
                  <Button
                    component="a"
                    href={`https://linkedin.com/in/${employee.linkedin}`}
                    target="_blank"
                    size="xs"
                    radius="100px"
                    variant="subtle"
                    leftSection={<IconBrandLinkedin size={15} />}
                  >
                    LinkedIn Profile
                  </Button>
                )}
              </Group>
            </Paper>
          </div>
        )}
      </Stack>
    </Drawer>
  );
};
