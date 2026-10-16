import React, { useState } from 'react';
import {
  Box,
  Paper,
  Text,
  Group,
  Stack,
  Badge,
  Avatar,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  Button,
  Collapse,
  useComputedColorScheme,
  Menu,
} from '@mantine/core';
import {
  IconBuilding,
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconEye,
  IconEdit,
  IconTrash,
  IconPhoneCall,
  IconBrandWhatsapp,
  IconShieldCheck,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconBriefcase,
  IconCheck,
  IconClock,
  IconWorld,
  IconUserCheck,
} from '@tabler/icons-react';
import { Contact } from '../../../types/contact';
import { useCRM } from '../../../context/CRMContext';

export type ContactGroupBy = 'none' | 'company' | 'contactType' | 'status' | 'assignedTo';

interface ContactCardGridViewProps {
  contacts: Contact[];
  loading?: boolean;
  groupBy?: ContactGroupBy;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onAddNew: () => void;
  onQualify?: (contact: Contact) => void;
}

// Generate pleasing consistent gradient colors for avatar backgrounds
const getAvatarGradient = (str: string) => {
  const gradients = [
    'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
    'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
    'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export const ContactCardGridView: React.FC<ContactCardGridViewProps> = ({
  contacts,
  loading = false,
  groupBy = 'none',
  onView,
  onEdit,
  onDelete,
  onAddNew,
  onQualify,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { setActiveNav } = useCRM();

  // Collapsed state for grouped sections
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0';
  const nameColor = isDark ? '#F8FAFC' : '#0F172A';
  const subColor = isDark ? '#94A3B8' : '#64748B';

  // Status Badge Color Map
  const statusColors: Record<string, string> = {
    Qualified: 'teal',
    'In Progress': 'indigo',
    'Follow-up Required': 'yellow',
    Disqualified: 'red',
    New: 'blue',
    Active: 'teal',
  };

  const handleQualifyClick = (contact: Contact) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('crm_qualifying_contact', JSON.stringify(contact));
    }
    setActiveNav('contact-qualification');
  };

  // Render a Single Odoo Contact Card
  const renderCard = (contact: Contact) => {
    const isCompany = contact.contactType === 'Company Representative';
    const initials = contact.name
      ? contact.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'CO';

    const bgGradient = getAvatarGradient(contact.name || contact.companyName || 'Contact');

    return (
      <Paper
        key={contact.id}
        p="md"
        radius="lg"
        style={{
          backgroundColor: cardBg,
          border: cardBorder,
          boxShadow: isDark
            ? '0 4px 16px rgba(0, 0, 0, 0.25)'
            : '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        className="odoo-contact-card"
        onClick={() => onView(contact)}
      >
        <Box>
          {/* Card Top Row: Avatar on Left, Main details on Right */}
          <Group align="flex-start" wrap="nowrap" gap="md" mb="xs">
            {/* Odoo Style Avatar / Photo Box */}
            <Box style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                size={54}
                radius="md"
                style={{
                  background: bgGradient,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 16,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {initials}
              </Avatar>

              {/* Online/Active Indicator Dot */}
              <Box
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: contact.status === 'Qualified' ? '#10B981' : '#6366F1',
                  border: `2px solid ${cardBg}`,
                }}
              />
            </Box>

            {/* Right Header: Name, Designation & Badges */}
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
                <Text
                  fw={700}
                  size="15px"
                  truncate
                  style={{
                    color: nameColor,
                    lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                  }}
                  title={contact.name}
                >
                  {contact.name}
                </Text>
                <Badge
                  size="xs"
                  variant="outline"
                  color="gray"
                  style={{ fontFamily: 'monospace', flexShrink: 0 }}
                >
                  {contact.contactId}
                </Badge>
              </Group>

              {/* Designation / Job Title */}
              {(contact.designation || contact.profession) && (
                <Text size="12px" fw={500} c="dimmed" truncate mt={2}>
                  {contact.designation || contact.profession}
                </Text>
              )}

              {/* Company Name */}
              {contact.companyName && (
                <Group gap={4} align="center" mt={3} wrap="nowrap">
                  <IconBuilding size={13} color="#6366F1" style={{ flexShrink: 0 }} />
                  <Text size="12px" fw={600} style={{ color: isDark ? '#A5B4FC' : '#4F46E5' }} truncate>
                    {contact.companyName}
                  </Text>
                </Group>
              )}
            </Box>
          </Group>

          {/* Contact Details List (Location, Email, Phone) */}
          <Stack gap={5} mt="xs" mb="sm">
            {/* Location (City, State / Address) */}
            {(contact.registeredState || contact.address) && (
              <Group gap={6} align="center" wrap="nowrap">
                <IconMapPin size={13} color={subColor} style={{ flexShrink: 0 }} />
                <Text size="12px" c="dimmed" truncate>
                  {contact.registeredState || contact.address}
                </Text>
              </Group>
            )}

            {/* Email */}
            {contact.email && (
              <Group gap={6} align="center" wrap="nowrap">
                <IconMail size={13} color={subColor} style={{ flexShrink: 0 }} />
                <Text
                  size="12px"
                  truncate
                  style={{
                    color: isDark ? '#93C5FD' : '#2563EB',
                    textDecoration: 'none',
                  }}
                  component="a"
                  href={`mailto:${contact.email}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {contact.email}
                </Text>
              </Group>
            )}

            {/* Phone */}
            {contact.phone && (
              <Group gap={6} align="center" wrap="nowrap">
                <IconPhone size={13} color={subColor} style={{ flexShrink: 0 }} />
                <Text
                  size="12px"
                  fw={600}
                  truncate
                  style={{ color: nameColor }}
                  component="a"
                  href={`tel:${contact.phone}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {contact.phone}
                </Text>
              </Group>
            )}
          </Stack>

          {/* Tags & Badges Row (Odoo category tags) */}
          <Group gap={5} wrap="wrap" mb="xs">
            {/* Contact Type Tag */}
            <Badge
              size="xs"
              variant="light"
              color={isCompany ? 'indigo' : 'blue'}
              radius="sm"
            >
              {isCompany ? 'Company Rep' : 'Individual'}
            </Badge>

            {/* Status Badge */}
            {contact.status && (
              <Badge
                size="xs"
                variant="filled"
                color={statusColors[contact.status] || 'gray'}
                radius="sm"
              >
                {contact.status}
              </Badge>
            )}

            {/* Priority Badge */}
            {contact.priority === 'High' && (
              <Badge size="xs" variant="light" color="red" radius="sm">
                High Priority
              </Badge>
            )}

            {/* Product / Requirement Tags */}
            {Array.isArray(contact.productList) &&
              contact.productList.slice(0, 2).map((prod, idx) => (
                <Badge key={idx} size="xs" variant="outline" color="gray" radius="sm">
                  {prod}
                </Badge>
              ))}
          </Group>
        </Box>

        {/* Card Footer Action Bar */}
        <Box
          pt="xs"
          style={{
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Group justify="space-between" align="center">
            {/* Left: Direct Quick Call & WhatsApp Buttons */}
            <Group gap={6}>
              {contact.phone && (
                <>
                  <Tooltip label={`Call ${contact.phone}`} withArrow>
                    <ActionIcon
                      size="sm"
                      radius="md"
                      variant="light"
                      color="blue"
                      component="a"
                      href={`tel:${contact.phone}`}
                    >
                      <IconPhoneCall size={13} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Chat on WhatsApp" withArrow>
                    <ActionIcon
                      size="sm"
                      radius="md"
                      variant="light"
                      color="teal"
                      component="a"
                      href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                    >
                      <IconBrandWhatsapp size={13} />
                    </ActionIcon>
                  </Tooltip>
                </>
              )}

              {/* Qualify Button */}
              <Tooltip label="Lead Qualification Workflow" withArrow>
                <ActionIcon
                  size="sm"
                  radius="md"
                  variant="light"
                  color="indigo"
                  onClick={() => handleQualifyClick(contact)}
                >
                  <IconShieldCheck size={13} />
                </ActionIcon>
              </Tooltip>
            </Group>

            {/* Right: View, Edit, Delete Actions */}
            <Group gap={4}>
              <Tooltip label="View Contact Overview" withArrow>
                <ActionIcon
                  size="sm"
                  radius="md"
                  variant="subtle"
                  color="gray"
                  onClick={() => onView(contact)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Edit Contact" withArrow>
                <ActionIcon
                  size="sm"
                  radius="md"
                  variant="subtle"
                  color="blue"
                  onClick={() => onEdit(contact)}
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Delete Contact" withArrow>
                <ActionIcon
                  size="sm"
                  radius="md"
                  variant="subtle"
                  color="red"
                  onClick={() => onDelete(contact)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Box>
      </Paper>
    );
  };

  // If No Contacts Match Filters
  if (contacts.length === 0) {
    return (
      <Paper
        p={50}
        radius="lg"
        ta="center"
        style={{
          backgroundColor: cardBg,
          border: cardBorder,
          marginTop: 16,
        }}
      >
        <Avatar
          size={64}
          radius="xl"
          color="indigo"
          variant="light"
          mx="auto"
          mb="md"
        >
          <IconUser size={32} />
        </Avatar>
        <Text fw={700} size="md" style={{ color: nameColor }}>
          No Contacts Found
        </Text>
        <Text size="xs" c="dimmed" mb="lg" style={{ maxWidth: 380, margin: '6px auto 16px' }}>
          No contacts match your current search, tab or filter criteria. Create a new contact to get started.
        </Text>
        <Button
          size="xs"
          radius="md"
          leftSection={<IconPlus size={14} />}
          onClick={onAddNew}
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
          }}
        >
          + Create Contact
        </Button>
      </Paper>
    );
  }

  // Flat Grid (No Grouping)
  if (groupBy === 'none') {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md" mt="md">
        {contacts.map((contact) => renderCard(contact))}
      </SimpleGrid>
    );
  }

  // Grouped Rendering (Company, Type, Status, Assigned)
  const groupedData: Record<string, Contact[]> = {};
  contacts.forEach((c) => {
    let groupKey = 'Other';
    if (groupBy === 'company') {
      groupKey = c.companyName || 'Independent Individuals';
    } else if (groupBy === 'contactType') {
      groupKey = c.contactType || 'Individual';
    } else if (groupBy === 'status') {
      groupKey = c.status || 'New';
    } else if (groupBy === 'assignedTo') {
      groupKey = c.assignedToName || c.assignmentStatus || 'Unassigned';
    }
    if (!groupedData[groupKey]) groupedData[groupKey] = [];
    groupedData[groupKey].push(c);
  });

  return (
    <Box mt="md">
      {Object.entries(groupedData).map(([groupTitle, groupContacts]) => {
        const isCollapsed = collapsedGroups[groupTitle];
        return (
          <Box key={groupTitle} mb="lg">
            {/* Group Header Bar */}
            <Paper
              p="xs"
              px="md"
              radius="md"
              mb="sm"
              onClick={() => toggleGroup(groupTitle)}
              style={{
                backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap="xs" align="center">
                  <ActionIcon size="xs" variant="transparent" color="gray">
                    {isCollapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
                  </ActionIcon>
                  {groupBy === 'company' && <IconBuilding size={16} color="#6366F1" />}
                  {groupBy === 'contactType' && <IconUser size={16} color="#3B82F6" />}
                  <Text fw={700} size="14px" style={{ color: nameColor }}>
                    {groupTitle}
                  </Text>
                  <Badge size="sm" variant="light" color="indigo" radius="md">
                    {groupContacts.length} {groupContacts.length === 1 ? 'Contact' : 'Contacts'}
                  </Badge>
                </Group>
              </Group>
            </Paper>

            {/* Cards for this group */}
            <Collapse in={!isCollapsed}>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md" mb="md">
                {groupContacts.map((contact) => renderCard(contact))}
              </SimpleGrid>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
};

export default ContactCardGridView;
