import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  Avatar,
  Button,
  SimpleGrid,
  Divider,
  ActionIcon,
  Breadcrumbs,
  Anchor,
  useComputedColorScheme,
  Grid,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconMail,
  IconPhone,
  IconBuildingSkyscraper,
  IconMapPin,
  IconBox,
  IconCalendar,
  IconTargetArrow,
  IconIdBadge,
  IconUser,
} from '@tabler/icons-react';
import { Contact } from '../../types/contact';
import { useCRM } from '../../context/CRMContext';

interface ContactDetailsPageProps {
  contact: Contact;
  onBack: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export const ContactDetailsPage: React.FC<ContactDetailsPageProps> = ({
  contact,
  onBack,
  onEdit,
  onDelete,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { setActiveNav } = useCRM();

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
  const headingColor = isDark ? '#F8FAFC' : '#0F172A';
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const valueColor = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <Box p={{ base: 'md', md: 'xl' }} style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Top Breadcrumb & Action Header */}
      <Group justify="space-between" align="center" mb="lg">
        <div>
          <Breadcrumbs separator="→" mb={6}>
            <Anchor size="xs" c="dimmed" onClick={onBack} style={{ cursor: 'pointer', fontWeight: 600 }}>
              Contacts
            </Anchor>
            <Text size="xs" fw={700} style={{ color: isDark ? '#60A5FA' : '#2563EB' }}>
              {contact.contactId}
            </Text>
          </Breadcrumbs>
          <Group gap="sm">
            <ActionIcon variant="subtle" size="lg" radius="100px" onClick={onBack} style={{ border: cardBorder }}>
              <IconArrowLeft size={18} />
            </ActionIcon>
            <div>
              <Text fw={800} size="24px" style={{ letterSpacing: '-0.02em', color: headingColor }}>
                {contact.name}
              </Text>
              <Text size="xs" c="dimmed">
                {contact.designation || contact.profession || 'Contact'} {contact.companyName ? `• ${contact.companyName}` : ''}
              </Text>
            </div>
          </Group>
        </div>

        <Group gap="xs">
          <Button
            variant="filled"
            color="teal"
            radius="100px"
            leftSection={<IconTargetArrow size={16} />}
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('crm_qualifying_contact', JSON.stringify(contact));
              }
              setActiveNav('contact-qualification');
            }}
          >
            Qualify Contact
          </Button>
          <Button
            variant="default"
            radius="100px"
            leftSection={<IconEdit size={16} />}
            onClick={() => onEdit(contact)}
          >
            Edit Contact
          </Button>
          <Button
            color="red"
            variant="light"
            radius="100px"
            leftSection={<IconTrash size={16} />}
            onClick={() => onDelete(contact)}
          >
            Delete
          </Button>
        </Group>
      </Group>

      {/* Main Grid Layout */}
      <Grid gutter="lg">
        {/* Left Col: Summary Card */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Paper p="xl" radius="24px" style={{ background: cardBg, border: cardBorder }}>
              <Stack align="center" gap="xs" mb="lg">
                <Avatar
                  size={88}
                  radius="24px"
                  color={contact.contactType === 'Individual' ? 'violet' : 'blue'}
                  style={{
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    border: `3px solid ${isDark ? '#1E293B' : '#F1F5F9'}`,
                  }}
                >
                  {getInitials(contact.name)}
                </Avatar>

                <Text fw={800} size="xl" style={{ color: headingColor, textAlign: 'center' }}>
                  {contact.name}
                </Text>

                <Text size="sm" c="dimmed">
                  {contact.designation || contact.profession || 'Contact'}
                </Text>

                <Group gap="xs" mt={4}>
                  <Badge variant="light" color={contact.contactType === 'Individual' ? 'violet' : 'blue'} size="md">
                    {contact.contactType || 'Company Representative'}
                  </Badge>
                  <Badge variant="light" color="indigo" size="md">
                    Stage: {contact.stage || 'New Lead'}
                  </Badge>
                </Group>
              </Stack>

              <Divider color={isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'} my="md" />

              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Contact ID
                  </Text>
                  <Badge variant="light" color="gray" radius="sm">
                    {contact.contactId}
                  </Badge>
                </Group>

                <Group justify="space-between">
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Assigned To
                  </Text>
                  <Text size="xs" fw={700} style={{ color: headingColor }}>
                    {contact.assignedToName || 'Unassigned'}
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Lead Source
                  </Text>
                  <Text size="xs" fw={600} style={{ color: headingColor }}>
                    {contact.source === 'Other' && contact.customSource ? `${contact.source} (${contact.customSource})` : contact.source || 'Website'}
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Priority
                  </Text>
                  <Badge variant="outline" color={getPriorityBadgeColor(contact.priority || 'Medium')} size="sm">
                    {contact.priority || 'Medium'}
                  </Badge>
                </Group>

                <Group justify="space-between">
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Stage
                  </Text>
                  <Badge variant="light" color="indigo" size="sm">
                    {contact.stage || 'New Lead'}
                  </Badge>
                </Group>
              </Stack>

              <Divider color={isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'} my="md" />

              <Stack gap={4}>
                <Text size="11px" c="dimmed">
                  Created: {formatDateTime(contact.createdAt)}
                </Text>
                <Text size="11px" c="dimmed">
                  Updated: {formatDateTime(contact.updatedAt)}
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* Right Col: 6 Detailed Sections */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="lg">
            {/* 1. Basic Information */}
            <Paper p="xl" radius="24px" style={{ background: cardBg, border: cardBorder }}>
              <Group gap="xs" mb="md">
                <IconUser size={18} color={isDark ? '#60A5FA' : '#2563EB'} />
                <Text fw={800} size="md" style={{ color: headingColor }}>
                  1. Basic Contact Information
                </Text>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Mobile / Phone Number
                  </Text>
                  <Group gap="xs" mt={4}>
                    <IconPhone size={16} color={isDark ? '#34D399' : '#059669'} />
                    <Text size="sm" fw={700} style={{ color: headingColor }}>
                      {contact.phone}
                    </Text>
                  </Group>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Email Address
                  </Text>
                  <Group gap="xs" mt={4}>
                    <IconMail size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                    <Text size="sm" fw={700} style={{ color: isDark ? '#93C5FD' : '#2563EB' }}>
                      {contact.email || '—'}
                    </Text>
                  </Group>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Address
                  </Text>
                  <Group gap="xs" mt={4}>
                    <IconMapPin size={16} color={labelColor} />
                    <Text size="sm" fw={500} style={{ color: headingColor }}>
                      {contact.address || '—'}
                    </Text>
                  </Group>
                </div>
              </SimpleGrid>
            </Paper>

            {/* 2. Professional & Company Details */}
            <Paper p="xl" radius="24px" style={{ background: cardBg, border: cardBorder }}>
              <Group gap="xs" mb="md">
                <IconBuildingSkyscraper size={18} color={isDark ? '#34D399' : '#059669'} />
                <Text fw={800} size="md" style={{ color: headingColor }}>
                  2. Professional & Company Information
                </Text>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Company Name
                  </Text>
                  <Text size="sm" fw={700} style={{ color: headingColor }} mt={4}>
                    {contact.companyName || '—'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Designation / Profession
                  </Text>
                  <Text size="sm" fw={600} style={{ color: headingColor }} mt={4}>
                    {contact.designation || contact.profession || '—'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Contact Type
                  </Text>
                  <Text size="sm" fw={600} style={{ color: headingColor }} mt={4}>
                    {contact.contactType || 'Company Representative'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Annual Revenue
                  </Text>
                  <Text size="sm" fw={600} style={{ color: headingColor }} mt={4}>
                    {contact.annualRevenue || '—'}
                  </Text>
                </div>
              </SimpleGrid>
            </Paper>

            {/* 3. Requirement Details */}
            <Paper p="xl" radius="24px" style={{ background: cardBg, border: cardBorder }}>
              <Group gap="xs" mb="md">
                <IconBox size={18} color={isDark ? '#FB923C' : '#EA580C'} />
                <Text fw={800} size="md" style={{ color: headingColor }}>
                  3. Requirement Details
                </Text>
              </Group>

              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Category
                  </Text>
                  <Badge variant="light" color={contact.category === 'Service' ? 'teal' : 'indigo'}>
                    {contact.category || 'Product'}
                  </Badge>
                </Group>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }} mb={6}>
                    Selected {contact.category === 'Service' ? 'Services' : 'Products'}
                  </Text>
                  <Group gap={6}>
                    {(contact.category === 'Service' ? contact.serviceList : contact.productList)?.length ? (
                      (contact.category === 'Service' ? contact.serviceList : contact.productList).map((item, idx) => (
                        <Badge key={idx} variant="outline" color="blue">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <Text size="xs" c="dimmed">
                        None specified
                      </Text>
                    )}
                  </Group>
                </div>

                {contact.customProduct && (
                  <div>
                    <Text size="xs" fw={600} style={{ color: labelColor }}>
                      Custom Product / Service Details
                    </Text>
                    <Text size="xs" style={{ color: valueColor, background: isDark ? '#0F172A' : '#F8FAFC', padding: 10, borderRadius: 10 }} mt={4}>
                      {contact.customProduct}
                    </Text>
                  </div>
                )}
              </Stack>
            </Paper>

            {/* 4. Interaction & Follow-up Details */}
            <Paper p="xl" radius="24px" style={{ background: cardBg, border: cardBorder }}>
              <Group gap="xs" mb="md">
                <IconCalendar size={18} color={isDark ? '#C084FC' : '#9333EA'} />
                <Text fw={800} size="md" style={{ color: headingColor }}>
                  4. Interaction & Follow-up Details
                </Text>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Contact Mode
                  </Text>
                  <Text size="sm" fw={600} style={{ color: headingColor }} mt={2}>
                    {contact.contactMode === 'Other' && contact.customContactMode ? `${contact.contactMode} (${contact.customContactMode})` : contact.contactMode || 'Call'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Meeting Type
                  </Text>
                  <Text size="sm" fw={600} style={{ color: headingColor }} mt={2}>
                    {contact.meetingType || 'Virtual'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Next Follow-up Date
                  </Text>
                  <Badge variant="filled" color="orange" size="md" mt={2}>
                    {contact.nextFollowDate || 'Not Scheduled'}
                  </Badge>
                </div>
              </SimpleGrid>

              {contact.remarks && (
                <Box mt="md">
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Remarks / Discussion Highlights
                  </Text>
                  <Text size="xs" style={{ color: headingColor }} mt={2}>
                    {contact.remarks}
                  </Text>
                </Box>
              )}

              {contact.notes && (
                <Box mt="md">
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Notes & Action Items
                  </Text>
                  <Paper p="md" radius="12px" style={{ background: isDark ? '#0F172A' : '#F8FAFC', whiteSpace: 'pre-wrap' }} mt={2}>
                    <Text size="xs" style={{ color: headingColor }}>
                      {contact.notes}
                    </Text>
                  </Paper>
                </Box>
              )}
            </Paper>

            {/* 5. Qualification & Project Details */}
            <Paper p="xl" radius="24px" style={{ background: cardBg, border: cardBorder }}>
              <Group gap="xs" mb="md">
                <IconTargetArrow size={18} color={isDark ? '#F472B6' : '#DB2777'} />
                <Text fw={800} size="md" style={{ color: headingColor }}>
                  5. Qualification & Project Details
                </Text>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Qualification Status
                  </Text>
                  <Badge variant="light" color={contact.qualificationStatus === 'Qualified' ? 'teal' : 'blue'} mt={2}>
                    {contact.qualificationStatus || 'In Progress'}
                  </Badge>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Qualified By & Date
                  </Text>
                  <Text size="xs" fw={600} style={{ color: headingColor }} mt={2}>
                    {contact.qualifiedBy || '—'} {contact.qualificationDate ? `(${contact.qualificationDate})` : ''}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Estimated Budget
                  </Text>
                  <Text size="sm" fw={700} style={{ color: isDark ? '#34D399' : '#059669' }} mt={2}>
                    {contact.estimatedBudget ? `₹${Number(contact.estimatedBudget).toLocaleString()}` : '—'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Project Type
                  </Text>
                  <Text size="xs" fw={600} style={{ color: headingColor }} mt={2}>
                    {contact.projectType || 'New Implementation'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Expected Users
                  </Text>
                  <Text size="xs" fw={600} style={{ color: headingColor }} mt={2}>
                    {contact.expectedUsers ? `${contact.expectedUsers} Users` : '—'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Target Go-Live Date
                  </Text>
                  <Text size="xs" fw={600} style={{ color: headingColor }} mt={2}>
                    {contact.expectedGoLiveDate || '—'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Decision Maker
                  </Text>
                  <Text size="xs" fw={600} style={{ color: headingColor }} mt={2}>
                    {contact.influencer || '—'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Competitors / Alternatives
                  </Text>
                  <Text size="xs" fw={600} style={{ color: headingColor }} mt={2}>
                    {contact.otherOptions || '—'}
                  </Text>
                </div>
              </SimpleGrid>

              {contact.disqualificationReason && (
                <Box mt="md" p="md" style={{ background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)', borderRadius: 12 }}>
                  <Text size="xs" fw={700} c="red">
                    Disqualification Reason:
                  </Text>
                  <Text size="xs" c="red" mt={2}>
                    {contact.disqualificationReason}
                  </Text>
                </Box>
              )}
            </Paper>

            {/* 6. Assignment & Metadata */}
            <Paper p="xl" radius="24px" style={{ background: cardBg, border: cardBorder }}>
              <Group gap="xs" mb="md">
                <IconIdBadge size={18} color={isDark ? '#818CF8' : '#4F46E5'} />
                <Text fw={800} size="md" style={{ color: headingColor }}>
                  6. Assignment & System Metadata
                </Text>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Assigned Employee
                  </Text>
                  <Text size="sm" fw={700} style={{ color: headingColor }} mt={2}>
                    {contact.assignedToName || 'Unassigned'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Assignment Status
                  </Text>
                  <Badge variant="light" color={contact.assignmentStatus === 'Assigned' ? 'teal' : 'gray'} mt={2}>
                    {contact.assignmentStatus || 'Unassigned'}
                  </Badge>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Assigned By
                  </Text>
                  <Text size="xs" fw={500} style={{ color: headingColor }} mt={2}>
                    {contact.assignedBy || '—'}
                  </Text>
                </div>

                <div>
                  <Text size="xs" fw={600} style={{ color: labelColor }}>
                    Created By
                  </Text>
                  <Text size="xs" fw={500} style={{ color: headingColor }} mt={2}>
                    {contact.createdBy || 'System Admin'}
                  </Text>
                </div>
              </SimpleGrid>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default ContactDetailsPage;
