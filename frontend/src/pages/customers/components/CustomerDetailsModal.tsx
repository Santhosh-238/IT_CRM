import React, { useMemo } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  Paper,
  Box,
  Button,
  Grid,
  useComputedColorScheme,
  ActionIcon,
  Tooltip,
  CopyButton,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import {
  IconBuilding,
  IconUser,
  IconPhone,
  IconMail,
  IconWorld,
  IconMapPin,
  IconCurrencyRupee,
  IconEdit,
  IconTrash,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconShieldCheck,
  IconIdBadge,
  IconBriefcase,
  IconRocket,
  IconFolderCheck,
} from '@tabler/icons-react';
import { Customer } from '../../../types/customer';
import { CRM_COLORS } from '../../../theme/colors';
import { parseAccountNotes } from '../CustomerDetailsPage';

export interface CustomerProjectItem {
  id: string;
  projectNumber: number;
  title: string;
  category?: string;
  status: string;
  stage?: string;
  date?: string;
  source?: string;
  notes?: string;
}

interface CustomerDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  customer: Customer | null;
  projects?: CustomerProjectItem[];
  highlightedProjectNumber?: number | null;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onMoveToNextProject?: (customer: Customer) => void;
  onNavigateToProjects?: () => void;
  onNavigateToLeads?: () => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  opened,
  onClose,
  customer,
  projects = [],
  highlightedProjectNumber = null,
  onEdit,
  onDelete,
  onMoveToNextProject,
  onNavigateToProjects,
  onNavigateToLeads,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const parsedNotes = useMemo(() => parseAccountNotes(customer?.notes || undefined), [customer?.notes]);

  const [selectedFilter, setSelectedFilter] = React.useState<number | 'all'>('all');

  React.useEffect(() => {
    if (highlightedProjectNumber) {
      setSelectedFilter(highlightedProjectNumber);
    } else {
      setSelectedFilter('all');
    }
  }, [highlightedProjectNumber, opened]);

  if (!customer) return null;

  const cardBg = isDark ? '#1E293B' : '#F8FAFC';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Enterprise':
        return 'grape';
      case 'Mid-Market':
        return 'blue';
      case 'Startup':
        return 'teal';
      case 'Government':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Active':
        return 'teal';
      case 'Onboarding':
        return 'yellow';
      case 'Inactive':
        return 'gray';
      case 'Churned':
        return 'red';
      default:
        return 'blue';
    }
  };

  const resolvedProjects: CustomerProjectItem[] = useMemo(() => {
    if (projects && projects.length > 0) return projects;
    if (!customer) return [];

    const list: CustomerProjectItem[] = [];
    const notes = customer.notes || '';

    const leadMatch = notes.match(/\((LED-\d+)\)/i);
    const leadRef = leadMatch ? leadMatch[1] : undefined;

    const servicesMatch = notes.match(/Services:\s*([^)]+)/i);
    const productsMatch = notes.match(/Products:\s*([^)]+)/i);

    if (servicesMatch && servicesMatch[1]) {
      const rawItems = servicesMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
      rawItems.forEach((item, idx) => {
        const projNumMatch = item.match(/Project\s*(\d+)[:\s-]*(.*)/i);
        const projNum = projNumMatch ? parseInt(projNumMatch[1], 10) : idx + 1;
        const cleanTitle = projNumMatch && projNumMatch[2] ? projNumMatch[2].trim() : item.replace(/^Project \d+:\s*/i, '').trim();

        const isSecondInLeads = projNum === 2 && notes.includes('2nd Project in Leads');
        list.push({
          id: `proj-${projNum}`,
          projectNumber: projNum,
          title: cleanTitle || `Project ${projNum}`,
          category: 'IT Service Delivery',
          status: isSecondInLeads ? 'In Progress' : 'Complete',
          stage: isSecondInLeads ? 'Initialization' : 'Won & Delivered',
          source: leadRef ? `Lead ${leadRef}` : 'Customer Agreement',
        });
      });
    } else if (productsMatch && productsMatch[1]) {
      const rawItems = productsMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
      rawItems.forEach((item, idx) => {
        list.push({
          id: `proj-${idx + 1}`,
          projectNumber: idx + 1,
          title: item,
          category: 'Software Product License',
          status: 'Complete',
          stage: 'Delivered',
          source: leadRef ? `Lead ${leadRef}` : 'Customer Agreement',
        });
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'proj-1',
        projectNumber: 1,
        title: customer.industry || 'Enterprise IT Solutions & Services',
        category: 'Primary Contract',
        status: customer.status === 'Active' || customer.status === 'Complete' ? 'Complete' : 'In Progress',
        stage: 'Delivered',
        source: leadRef ? `Lead ${leadRef}` : 'Customer Agreement',
      });
    }

    return list;
  }, [projects, customer]);

  const getProjectDeliverables = (proj: CustomerProjectItem) => {
    const title = (proj.title || '').toLowerCase();
    if (title.includes('cloud') || title.includes('devops')) {
      return [
        'Multi-Region Cloud Architecture & VPC Isolation',
        'Automated CI/CD Deployment Pipelines & Docker Orchestration',
        'Kubernetes Cluster Configuration & Auto-scaling',
        '24/7 Server Health Monitoring & Security Compliance Hardening',
      ];
    }
    if (title.includes('web') || title.includes('full-stack') || title.includes('frontend')) {
      return [
        'Modern High-Performance Web Architecture (React & TypeScript)',
        'Enterprise REST API Integration & Microservices Engine',
        'Role-Based Access Control, JWT Security & State Management',
        'Cross-Browser Optimization, SEO Best Practices & Production Launch',
      ];
    }
    if (title.includes('mobile') || title.includes('app')) {
      return [
        'Cross-Platform iOS & Android Native Core Implementation',
        'Real-Time Offline Data Synchronization & Push Notifications',
        'Biometric Authentication & Secure API Token Management',
        'App Store & Play Store Deployment Readiness Audit',
      ];
    }
    if (title.includes('ai') || title.includes('ml')) {
      return [
        'Custom Deep Learning Pipeline & Model Fine-Tuning',
        'Low-Latency Inference API & Microservices Containerization',
        'Data Preprocessing, Vector Embeddings & Vector DB Storage',
        'Model Accuracy Validation & Real-Time Performance Analytics',
      ];
    }
    return [
      'Business Scope & Technical Requirement Finalization',
      'Core Solution Engineering, Integration & Architecture Review',
      'Rigorous Quality Assurance Testing & Performance Optimization',
      'Final Production Release, Knowledge Transfer & Client Sign-off',
    ];
  };

  const displayedProjects = useMemo(() => {
    if (selectedFilter === 'all') return resolvedProjects;
    return resolvedProjects.filter((p) => p.projectNumber === selectedFilter);
  }, [resolvedProjects, selectedFilter]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      radius="lg"
      centered
      padding="xl"
      title={
        <Group gap="sm" align="center">
          <ThemeIcon size={38} radius="md" color="indigo" variant="light">
            <IconBuilding size={20} />
          </ThemeIcon>
          <Box>
            <Group gap={8} align="center">
              <Text fw={800} size="md" style={{ color: isDark ? '#FFFFFF' : '#0F172A', lineHeight: 1.2 }}>
                {customer.companyName}
              </Text>
              <CopyButton value={customer.customerId ? customer.customerId.replace(/^CUST-/i, '') : ''} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied to clipboard!' : `Customer ID: ${customer.customerId || 'N/A'} • Click to copy`} withArrow>
                    <Box
                      onClick={copy}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                        border: isDark ? '1px solid rgba(129, 140, 248, 0.35)' : '1px solid #C7D2FE',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: 12,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '0.02em',
                        color: isDark ? '#E0E7FF' : '#4338CA',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{customer.customerId ? customer.customerId.replace(/^CUST-/i, '') : customer.customerId}</span>
                      {copied ? <IconCheck size={12} color="#10B981" /> : null}
                    </Box>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
            <Text size="xs" c="dimmed" mt={2}>
              Client: <strong style={{ color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: 700 }}>{customer.contactPerson}</strong> • {customer.industry || 'Technology & IT Services'}
            </Text>
          </Box>
        </Group>
      }
      styles={{
        header: {
          borderBottom: `1px solid ${borderCol}`,
          paddingBottom: 16,
          marginBottom: 16,
        },
      }}
    >
      <Stack gap="md">
        {/* Top Hero Banner */}
        <Paper
          p="md"
          radius="md"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)'
              : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
            border: isDark ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid #C7D2FE',
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="xl">
              <Box>
                <Text size="11px" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  Annual Contract Value
                </Text>
                <Text fw={900} size="22px" style={{ color: isDark ? '#34D399' : '#059669', lineHeight: 1.2 }} mt={2}>
                  {customer.contractValue ? `₹${Number(customer.contractValue).toLocaleString('en-IN')}` : '₹0'}
                </Text>
              </Box>

              <Divider orientation="vertical" />

              <Box>
                <Text size="11px" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  Account Manager
                </Text>
                <Text fw={700} size="sm" mt={2} style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}>
                  {customer.accountManager || 'Unassigned'}
                </Text>
              </Box>
            </Group>

            <Group gap="xs">
              <Badge color={getTierColor(customer.customerTier)} variant="filled" size="lg" radius="sm">
                {customer.customerTier || 'Mid-Market'}
              </Badge>
              <Badge color={getStatusColor(customer.status)} variant="filled" size="lg" radius="sm">
                {customer.status || 'Active'}
              </Badge>
            </Group>
          </Group>
        </Paper>

        {/* 2-Column Spacious Grid Layout */}
        <Grid gutter="md">
          {/* Left Column: Primary Contact Person */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" radius="md" style={{ background: cardBg, border: `1px solid ${borderCol}`, height: '100%' }}>
              <Group gap="xs" mb="sm">
                <ThemeIcon size={26} radius="sm" color="blue" variant="light">
                  <IconUser size={15} />
                </ThemeIcon>
                <Text size="xs" fw={800} tt="uppercase" style={{ letterSpacing: '0.06em', color: isDark ? '#94A3B8' : '#475569' }}>
                  Client Profile & Primary Contact
                </Text>
              </Group>

              <Stack gap="xs">
                <Box>
                  <Text size="10px" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                    Client Name
                  </Text>
                  <Text size="md" fw={800} style={{ color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }} mt={1}>
                    {customer.contactPerson}
                  </Text>
                  {customer.designation && (
                    <Text size="xs" c="dimmed" mt={2}>
                      {customer.designation}
                    </Text>
                  )}
                </Box>

                <Group justify="space-between" align="center" p={8} style={{ borderRadius: 8, background: isDark ? '#0F172A' : '#FFFFFF', border: `1px solid ${borderCol}` }}>
                  <Group gap="xs">
                    <IconPhone size={15} color="#10B981" />
                    <Text size="xs" fw={600}>
                      {customer.phone}
                    </Text>
                  </Group>
                  <CopyButton value={customer.phone} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy phone'}>
                        <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                          {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>

                {customer.email ? (
                  <Group justify="space-between" align="center" p={8} style={{ borderRadius: 8, background: isDark ? '#0F172A' : '#FFFFFF', border: `1px solid ${borderCol}` }}>
                    <Group gap="xs">
                      <IconMail size={15} color="#6366F1" />
                      <Text size="xs" fw={600} component="a" href={`mailto:${customer.email}`} style={{ color: '#2563EB' }}>
                        {customer.email}
                      </Text>
                    </Group>
                    <CopyButton value={customer.email} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copied' : 'Copy email'}>
                          <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                            {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Group>
                ) : null}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Right Column: Tax & Regulatory Information */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" radius="md" style={{ background: cardBg, border: `1px solid ${borderCol}`, height: '100%' }}>
              <Group gap="xs" mb="sm">
                <ThemeIcon size={26} radius="sm" color="indigo" variant="light">
                  <IconShieldCheck size={15} />
                </ThemeIcon>
                <Text size="xs" fw={800} tt="uppercase" style={{ letterSpacing: '0.06em', color: isDark ? '#94A3B8' : '#475569' }}>
                  Firmographic & Regulatory Details
                </Text>
              </Group>

              <Grid gutter="xs">
                <Grid.Col span={6}>
                  <Text size="11px" c="dimmed">
                    GSTIN Number
                  </Text>
                  <Text size="xs" fw={700} style={{ fontFamily: 'monospace' }}>
                    {customer.gstNumber || 'Not provided'}
                  </Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="11px" c="dimmed">
                    PAN Number
                  </Text>
                  <Text size="xs" fw={700} style={{ fontFamily: 'monospace' }}>
                    {customer.panNumber || 'Not provided'}
                  </Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="11px" c="dimmed">
                    Official Website
                  </Text>
                  {customer.website ? (
                    <Group gap={4}>
                      <Text size="xs" c="blue" component="a" href={customer.website} target="_blank" rel="noreferrer" fw={600}>
                        {customer.website}
                      </Text>
                      <IconExternalLink size={12} color="#2563EB" />
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed">
                      Not provided
                    </Text>
                  )}
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="11px" c="dimmed">
                    Registered Location
                  </Text>
                  <Text size="xs" fw={600}>
                    {[customer.address, customer.city, customer.state].filter(Boolean).join(', ') || 'Not specified'}
                  </Text>
                </Grid.Col>
              </Grid>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Notes & Account Summary */}
        {customer.notes && (
          <Paper p="md" radius="md" style={{ background: cardBg, border: `1px solid ${borderCol}` }}>
            <Group justify="space-between" align="center" mb="xs">
              <Text size="xs" fw={800} tt="uppercase" style={{ letterSpacing: '0.06em', color: isDark ? '#94A3B8' : '#475569' }}>
                Account Notes & Conversion Details
              </Text>
              {parsedNotes.isSystemNote && (
                <Badge variant="light" color="teal" size="xs" radius="sm" leftSection={<IconCheck size={10} stroke={3} />}>
                  Lead Converted
                </Badge>
              )}
            </Group>

            {parsedNotes.isSystemNote ? (
              <Stack gap="xs" mt="xs">
                <Group gap="xs" wrap="wrap" align="center">
                  {parsedNotes.leadId && (
                    <Group gap={4} align="center">
                      <Text size="11px" fw={700} c="dimmed">Source Lead:</Text>
                      <Badge size="xs" variant="filled" color="indigo" radius="sm">
                        {parsedNotes.leadId}
                      </Badge>
                    </Group>
                  )}
                  {parsedNotes.category && (
                    <Group gap={4} align="center">
                      <Text size="11px" fw={700} c="dimmed">Category:</Text>
                      <Badge size="xs" variant="light" color="violet" radius="sm">
                        {parsedNotes.category}
                      </Badge>
                    </Group>
                  )}
                </Group>

                {parsedNotes.projects.length > 0 && (
                  <Stack gap={4} mt={2}>
                    <Text size="10px" fw={700} tt="uppercase" c="dimmed">
                      Purchased Services ({parsedNotes.projects.length}):
                    </Text>
                    {parsedNotes.projects.map((proj, idx) => (
                      <Group
                        key={idx}
                        gap={6}
                        wrap="nowrap"
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                          border: `1px solid ${borderCol}`,
                        }}
                      >
                        <Badge size="xs" variant="filled" color={idx === 0 ? 'teal' : idx === 1 ? 'blue' : 'violet'} style={{ height: 16, fontSize: 9 }}>
                          P{proj.projectNumber}
                        </Badge>
                        <Text size="xs" fw={600} style={{ color: isDark ? '#F1F5F9' : '#1E293B', flex: 1 }} truncate>
                          {proj.title}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                )}

                {parsedNotes.customNotes && (
                  <Text size="xs" style={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.4 }} mt={2}>
                    {parsedNotes.customNotes}
                  </Text>
                )}
              </Stack>
            ) : (
              <Text size="xs" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: isDark ? '#CBD5E1' : '#334155' }}>
                {customer.notes}
              </Text>
            )}
          </Paper>
        )}

        {/* Bottom Actions */}
        <Divider mt="xs" color={borderCol} />
        <Group justify="space-between" align="center">
          <Button
            variant="subtle"
            color="red"
            size="xs"
            leftSection={<IconTrash size={15} />}
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete customer ${customer.companyName}?`)) {
                onDelete(customer.id);
                onClose();
              }
            }}
          >
            Delete Account
          </Button>

          <Group gap="xs">
            <Button variant="default" size="xs" radius="md" onClick={onClose}>
              Close
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
