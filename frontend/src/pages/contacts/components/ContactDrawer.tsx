import React from 'react';
import {
  Drawer,
  Stack,
  Group,
  Avatar,
  Text,
  Badge,
  Button,
  SimpleGrid,
  Paper,
  Box,
  Divider,
  ActionIcon,
  useComputedColorScheme,
  CopyButton,
  Tooltip,
  Select,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconMail,
  IconPhone,
  IconBuildingSkyscraper,
  IconMapPin,
  IconUser,
  IconCheck,
  IconCopy,
  IconCalendar,
  IconFileText,
  IconBox,
  IconTargetArrow,
  IconIdBadge,
} from '@tabler/icons-react';
import { Contact } from '../../../types/contact';
import { useContact } from '../../../context/ContactContext';

interface ContactDrawerProps {
  contact: Contact | null;
  opened: boolean;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export const ContactDrawer: React.FC<ContactDrawerProps> = ({
  contact,
  opened,
  onClose,
  onEdit,
  onDelete,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { metadata, assignContact } = useContact();

  if (!contact) return null;

  const getInitials = (name?: string) => {
    if (!name) return 'CT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusBadgeColor = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'new':
        return 'blue';
      case 'active':
        return 'green';
      case 'qualified':
        return 'teal';
      case 'inactive':
        return 'gray';
      case 'disqualified':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getPriorityBadgeColor = (priority?: string) => {
    switch ((priority || '').toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0';
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const valueColor = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="600px"
      padding="xl"
      title={
        <Group gap="xs">
          <Badge variant="filled" color={contact.contactType === 'Individual' ? 'violet' : 'blue'} radius="sm" size="sm">
            {contact.contactType || 'Company Representative'}
          </Badge>
          <Text fw={700} size="sm" c="dimmed">
            {contact.contactId}
          </Text>
        </Group>
      }
      styles={{
        header: {
          background: isDark ? '#0B0F17' : '#FFFFFF',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
        },
        body: {
          background: isDark ? '#0B0F17' : '#F8FAFC',
          paddingTop: 20,
        },
      }}
    >
      <Stack gap="lg">
        {/* Profile Header Card */}
        <Paper p="lg" radius="20px" style={{ background: cardBg, border: cardBorder }}>
          <Group align="flex-start" justify="space-between">
            <Group gap="md">
              <Avatar
                size={64}
                radius="16px"
                color={contact.contactType === 'Individual' ? 'violet' : 'blue'}
              >
                {getInitials(contact.name)}
              </Avatar>
              <div>
                <Text fw={800} size="lg" style={{ color: valueColor, lineHeight: 1.2 }}>
                  {contact.name}
                </Text>
                <Text size="xs" fw={500} c="dimmed" mt={2}>
                  {contact.designation || contact.profession || 'Representative'} {contact.companyName ? `• ${contact.companyName}` : ''}
                </Text>
                <Group gap="xs" mt="xs">
                  <Badge size="sm" variant="outline" color={getPriorityBadgeColor(contact.priority || 'Medium')}>
                    {contact.priority || 'Medium'} Priority
                  </Badge>
                  <Badge size="sm" variant="light" color="indigo">
                    Stage: {contact.stage || 'New Lead'}
                  </Badge>
                </Group>
              </div>
            </Group>
          </Group>
        </Paper>

        {/* Action Buttons */}
        <Group grow gap="sm">
          <Button
            radius="100px"
            variant="filled"
            color="blue"
            leftSection={<IconEdit size={16} />}
            onClick={() => onEdit(contact)}
          >
            Edit Contact
          </Button>
          <Button
            radius="100px"
            variant="light"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => onDelete(contact)}
          >
            Delete Contact
          </Button>
        </Group>

        {/* 1. Basic Contact Information */}
        <Paper p="lg" radius="20px" style={{ background: cardBg, border: cardBorder }}>
          <Group gap="xs" mb="sm">
            <IconUser size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
            <Text fw={700} size="xs" tt="uppercase" style={{ color: isDark ? '#60A5FA' : '#2563EB', letterSpacing: '0.05em' }}>
              1. Basic Contact Information
            </Text>
          </Group>

          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="xs" fw={600} style={{ color: labelColor }}>
                Mobile / Phone
              </Text>
              <Text size="xs" fw={700} style={{ color: valueColor }}>
                {contact.phone}
              </Text>
            </Group>

            {contact.email && (
              <>
                <Divider color={isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'} />
                <Group justify="space-between">
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Email Address
                  </Text>
                  <Group gap={4}>
                    <Text size="xs" fw={600} style={{ color: isDark ? '#93C5FD' : '#2563EB' }}>
                      {contact.email}
                    </Text>
                    <CopyButton value={contact.email} timeout={2000}>
                      {({ copied, copy }) => (
                        <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                </Group>
              </>
            )}

            <Divider color={isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'} />

            <Group justify="space-between">
              <Text size="xs" fw={600} style={{ color: labelColor }}>
                Source
              </Text>
              <Badge variant="light" color="blue" size="sm">
                {contact.source === 'Other' && contact.customSource ? `${contact.source} (${contact.customSource})` : contact.source || 'Website'}
              </Badge>
            </Group>

            {contact.address && (
              <>
                <Divider color={isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'} />
                <Group justify="space-between" align="flex-start">
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Address
                  </Text>
                  <Text size="xs" fw={500} style={{ color: valueColor, maxWidth: 300, textAlign: 'right' }}>
                    {contact.address}
                  </Text>
                </Group>
              </>
            )}
          </Stack>
        </Paper>

        {/* 2. Professional & Company Information */}
        <Paper p="lg" radius="20px" style={{ background: cardBg, border: cardBorder }}>
          <Group gap="xs" mb="sm">
            <IconBuildingSkyscraper size={16} color={isDark ? '#34D399' : '#059669'} />
            <Text fw={700} size="xs" tt="uppercase" style={{ color: isDark ? '#34D399' : '#059669', letterSpacing: '0.05em' }}>
              2. Professional & Company Details
            </Text>
          </Group>

          <SimpleGrid cols={2} spacing="xs">
            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Contact Type
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.contactType || 'Company Representative'}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Annual Revenue
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.annualRevenue || '—'}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Company Name
              </Text>
              <Text size="xs" fw={700} style={{ color: valueColor }} mt={2}>
                {contact.companyName || '—'}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Designation / Profession
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.designation || contact.profession || '—'}
              </Text>
            </div>
          </SimpleGrid>
        </Paper>

        {/* 3. Requirement Details */}
        <Paper p="lg" radius="20px" style={{ background: cardBg, border: cardBorder }}>
          <Group gap="xs" mb="sm">
            <IconBox size={16} color={isDark ? '#FB923C' : '#EA580C'} />
            <Text fw={700} size="xs" tt="uppercase" style={{ color: isDark ? '#FB923C' : '#EA580C', letterSpacing: '0.05em' }}>
              3. Requirement Details
            </Text>
          </Group>

          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="xs" fw={600} style={{ color: labelColor }}>
                Category
              </Text>
              <Badge variant="light" color={contact.category === 'Service' ? 'teal' : 'indigo'} size="sm">
                {contact.category || 'Product'}
              </Badge>
            </Group>

            <Box>
              <Text size="11px" fw={600} style={{ color: labelColor }} mb={4}>
                Selected {contact.category === 'Service' ? 'Services' : 'Products'}
              </Text>
              <Group gap={6}>
                {(contact.category === 'Service' ? contact.serviceList : contact.productList)?.length ? (
                  (contact.category === 'Service' ? contact.serviceList : contact.productList).map((item, idx) => (
                    <Badge key={idx} variant="outline" color="blue" size="sm">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <Text size="xs" c="dimmed">
                    None selected
                  </Text>
                )}
              </Group>
            </Box>

            {contact.customProduct && (
              <Box mt={4}>
                <Text size="11px" fw={600} style={{ color: labelColor }}>
                  Custom Requirements
                </Text>
                <Text size="xs" style={{ color: valueColor, background: isDark ? '#0F172A' : '#F8FAFC', padding: 8, borderRadius: 8 }} mt={2}>
                  {contact.customProduct}
                </Text>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* 4. Interaction & Follow-up Details */}
        <Paper p="lg" radius="20px" style={{ background: cardBg, border: cardBorder }}>
          <Group gap="xs" mb="sm">
            <IconCalendar size={16} color={isDark ? '#C084FC' : '#9333EA'} />
            <Text fw={700} size="xs" tt="uppercase" style={{ color: isDark ? '#C084FC' : '#9333EA', letterSpacing: '0.05em' }}>
              4. Interaction & Follow-up Details
            </Text>
          </Group>

          <SimpleGrid cols={2} spacing="xs">
            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Contact Mode
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.contactMode === 'Other' && contact.customContactMode ? `${contact.contactMode} (${contact.customContactMode})` : contact.contactMode || 'Call'}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Meeting Type
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.meetingType || 'Virtual'}
              </Text>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Next Follow-up Date
              </Text>
              <Badge variant="filled" color="orange" size="sm" mt={2}>
                {contact.nextFollowDate || 'Not Scheduled'}
              </Badge>
            </div>
          </SimpleGrid>

          {contact.remarks && (
            <Box mt="xs">
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Remarks / Comments
              </Text>
              <Text size="xs" style={{ color: valueColor }} mt={2}>
                {contact.remarks}
              </Text>
            </Box>
          )}

          {contact.notes && (
            <Box mt="xs">
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Detailed Notes
              </Text>
              <Text size="xs" style={{ color: valueColor, whiteSpace: 'pre-wrap', background: isDark ? '#0F172A' : '#F8FAFC', padding: 8, borderRadius: 8 }} mt={2}>
                {contact.notes}
              </Text>
            </Box>
          )}
        </Paper>

        {/* 5. Qualification & Project Details */}
        <Paper p="lg" radius="20px" style={{ background: cardBg, border: cardBorder }}>
          <Group gap="xs" mb="sm">
            <IconTargetArrow size={16} color={isDark ? '#F472B6' : '#DB2777'} />
            <Text fw={700} size="xs" tt="uppercase" style={{ color: isDark ? '#F472B6' : '#DB2777', letterSpacing: '0.05em' }}>
              5. Qualification & Project Metrics
            </Text>
          </Group>

          <SimpleGrid cols={2} spacing="xs">
            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Qualification Status
              </Text>
              <Badge variant="light" color={contact.qualificationStatus === 'Qualified' ? 'teal' : 'blue'} size="sm" mt={2}>
                {contact.qualificationStatus || 'In Progress'}
              </Badge>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Qualified By & Date
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.qualifiedBy || '—'} {contact.qualificationDate ? `(${contact.qualificationDate})` : ''}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Estimated Budget
              </Text>
              <Text size="xs" fw={700} style={{ color: isDark ? '#34D399' : '#059669' }} mt={2}>
                {contact.estimatedBudget ? `₹${Number(contact.estimatedBudget).toLocaleString()}` : '—'}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Project Type
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.projectType || 'New Implementation'}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Expected Users
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.expectedUsers ? `${contact.expectedUsers} Users` : '—'}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Target Go-Live Date
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.expectedGoLiveDate || '—'}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Decision Maker
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.influencer || '—'}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Competitors
              </Text>
              <Text size="xs" fw={600} style={{ color: valueColor }} mt={2}>
                {contact.otherOptions || '—'}
              </Text>
            </div>
          </SimpleGrid>

          {contact.disqualificationReason && (
            <Box mt="xs" p="xs" style={{ background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)', borderRadius: 8 }}>
              <Text size="11px" fw={700} c="red">
                Disqualification Reason:
              </Text>
              <Text size="xs" c="red" mt={2}>
                {contact.disqualificationReason}
              </Text>
            </Box>
          )}
        </Paper>

        {/* 6. Assignment & System Metadata */}
        <Paper p="lg" radius="20px" style={{ background: cardBg, border: cardBorder }}>
          <Group gap="xs" mb="sm">
            <IconIdBadge size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
            <Text fw={700} size="xs" tt="uppercase" style={{ color: isDark ? '#818CF8' : '#4F46E5', letterSpacing: '0.05em' }}>
              6. Assignment & Metadata
            </Text>
          </Group>

          <SimpleGrid cols={2} spacing="xs">
            <div style={{ gridColumn: 'span 2' }}>
              <Text size="11px" fw={600} style={{ color: labelColor }} mb={4}>
                Quick Assign Employee
              </Text>
              <Select
                placeholder="Assign employee"
                data={[
                  { value: 'none', label: '— Unassigned —' },
                  ...(metadata?.employees?.map((emp) => ({ value: emp.id, label: `${emp.name} (${emp.empCode})` })) || []),
                ]}
                value={contact.assignedTo || 'none'}
                onChange={async (val) => {
                  await assignContact(contact.id, val === 'none' ? null : val);
                }}
                radius="md"
                size="xs"
              />
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Assignment Status
              </Text>
              <Badge variant="light" color={contact.assignmentStatus === 'Assigned' ? 'teal' : 'gray'} size="sm" mt={2}>
                {contact.assignmentStatus || 'Unassigned'}
              </Badge>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Assigned By
              </Text>
              <Text size="xs" fw={500} style={{ color: valueColor }} mt={2}>
                {contact.assignedBy || '—'}
              </Text>
            </div>

            <div>
              <Text size="11px" fw={600} style={{ color: labelColor }}>
                Created By
              </Text>
              <Text size="xs" fw={500} style={{ color: valueColor }} mt={2}>
                {contact.createdBy || 'System Admin'}
              </Text>
            </div>
          </SimpleGrid>

          <Divider my="sm" color={isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'} />

          <Group justify="space-between">
            <Text size="11px" c="dimmed">
              Created: {formatDateTime(contact.createdAt)}
            </Text>
            <Text size="11px" c="dimmed">
              Updated: {formatDateTime(contact.updatedAt)}
            </Text>
          </Group>
        </Paper>
      </Stack>
    </Drawer>
  );
};

export default ContactDrawer;
