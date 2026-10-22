import React, { useState } from 'react';
import {
  Box,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Paper,
  SimpleGrid,
  ThemeIcon,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Divider,
  ActionIcon,
  Card,
  Table,
  Progress,
} from '@mantine/core';
import {
  IconScale,
  IconPlus,
  IconCheck,
  IconArrowRight,
  IconArrowLeft,
  IconCash,
  IconUserCheck,
  IconPercentage,
  IconNote,
  IconMessageDots,
  IconFileCheck,
  IconDownload,
  IconSend,
  IconBuilding,
  IconSignature,
  IconCalendar,
  IconClock,
  IconShieldCheck,
  IconReceipt,
  IconAlertCircle,
  IconCreditCard,
  IconBuildingBank,
  IconQrcode,
  IconRocket,
  IconExternalLink,
  IconUser,
  IconCode,
  IconChevronRight,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  Lead,
  LeadDealData,
  LeadProposal,
  LeadNegotiation,
  NegotiationEntry,
  LeadContract,
  LeadInvoiceItem,
  LeadPaymentRecord,
  LeadProgressData,
  ProjectMilestoneItem,
} from '../../../types/lead';
import { Quotation } from '../../../types/billing';

// =========================================================================
// 1. LEAD DEAL STORE HELPERS
// =========================================================================

export const getInitialLeadDealData = (lead: Lead): LeadDealData => {
  const company = lead.companyName || lead.profession || lead.name || 'Company';
  const offering =
    lead.category === 'Product'
      ? lead.productList && lead.productList.length > 0
        ? lead.productList.join(', ')
        : 'Enterprise IT CRM Platform'
      : lead.serviceList && lead.serviceList.length > 0
      ? lead.serviceList.join(', ')
      : 'Custom Cloud & Software Engineering';

  // 1. Initial Proposal
  const initialProposal: LeadProposal = {
    id: `prop-${lead.id}-1`,
    leadId: lead.id,
    proposalNumber: `PROP-${new Date().getFullYear()}-0042`,
    title: `${offering} Solution Proposal for ${company}`,
    issueDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Accepted',
    currency: 'INR (₹)',
    items: [
      {
        id: 'item-1',
        description: `${offering} - Enterprise License (1 Year)`,
        quantity: 1,
        unitPrice: 95000,
        total: 95000,
      },
      {
        id: 'item-2',
        description: 'Cloud Infrastructure, Database Setup & Security Hardening',
        quantity: 1,
        unitPrice: 35000,
        total: 35000,
      },
      {
        id: 'item-3',
        description: 'Team Onboarding, Role Setup & Workflow Integration',
        quantity: 1,
        unitPrice: 20000,
        total: 20000,
      },
    ],
    discountPercent: 10,
    taxPercent: 18,
    subtotal: 150000,
    totalAmount: 159300,
    notes: 'Includes dedicated account manager, 99.9% uptime SLA, and 90 days complimentary post-go-live bug-fixing support.',
    terms: 'Payment terms: 40% advance upon contract signing, 30% upon beta release UAT, 30% upon final production handover.',
    createdAt: new Date().toISOString(),
  };

  // 1b. Initial Quotation
  const initialQuotation: Quotation = {
    id: `quo-${lead.id}-1`,
    quotationNumber: `QUO-${new Date().getFullYear()}-1042`,
    leadId: lead.id,
    contactId: lead.id,
    contactName: lead.name,
    companyName: company,
    contactEmail: lead.email || 'client@example.com',
    contactPhone: lead.phone || '',
    clientAddress: lead.address || 'Corporate Headquarters',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Sent',
    currency: 'INR',
    subtotal: 150000,
    discountType: 'percentage',
    discountValue: 10,
    discountAmount: 15000,
    taxAmount: 24300,
    grandTotal: 159300,
    paymentTerms: 'Net 30 Days (40% advance, 30% UAT, 30% handover)',
    notes: 'Itemized pricing quotation aligned with technical discovery and scope proposal.',
    termsConditions: '1. Quotation valid for 30 days from date of issue.\n2. 50% advance along with confirmed Purchase Order.\n3. Taxes extra as applicable by law.',
    items: [
      {
        id: 'qitem-1',
        itemName: `${offering} - Enterprise License (1 Year)`,
        itemType: 'Product',
        description: 'Complete core software suite license with 10 user seats.',
        quantity: 1,
        unitPrice: 95000,
        discount: 0,
        taxRate: 18,
        taxAmount: 17100,
        totalAmount: 112100,
      },
      {
        id: 'qitem-2',
        itemName: 'Cloud Deployment & Security Hardening',
        itemType: 'Service',
        description: 'Multi-region AWS cloud setup, automated daily snapshots, SSL certificates.',
        quantity: 1,
        unitPrice: 35000,
        discount: 0,
        taxRate: 18,
        taxAmount: 6300,
        totalAmount: 41300,
      },
      {
        id: 'qitem-3',
        itemName: 'Onboarding & Data Migration Support',
        itemType: 'Service',
        description: 'Staff training workshops and historical CRM data importing.',
        quantity: 1,
        unitPrice: 20000,
        discount: 0,
        taxRate: 18,
        taxAmount: 3600,
        totalAmount: 23600,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 2. Initial Negotiation
  const initialNegotiation: LeadNegotiation = {
    leadId: lead.id,
    originalQuotedAmount: 150000,
    currentAgreedAmount: 135000,
    discountPercentage: 10,
    status: 'Terms Agreed',
    decisionMaker: `${lead.name} (${lead.designation || 'Key Decision Maker'})`,
    keyConcessions: [
      '10% commercial discount on upfront commitment',
      'Extended free maintenance support from 30 days to 90 days',
      'Dedicated tech manager assigned for onboarding',
    ],
    nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    entries: [
      {
        id: 'neg-1',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        author: 'Sandy (Account Exec)',
        topic: 'Initial Commercial Discussion',
        notes: `Presented proposal of ₹1,50,000 for ${offering}. Client requested concession for annual billing.`,
        type: 'pricing',
      },
      {
        id: 'neg-2',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        author: 'Sandy (Account Exec)',
        topic: 'Discount & Scope Finalization',
        notes: 'Agreed on ₹1,35,000 with 3-phase milestone payment (40% advance, 30% UAT, 30% handover). Client approved terms.',
        priceImpact: -15000,
        type: 'terms',
      },
    ],
  };

  // 3. Initial Contract
  const initialContract: LeadContract = {
    id: `cnt-${lead.id}-1`,
    leadId: lead.id,
    contractNumber: `CNT-${new Date().getFullYear()}-018`,
    title: `Master Services Agreement - ${company}`,
    contractValue: 135000,
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    durationMonths: 12,
    status: 'Signed',
    signedByClient: true,
    clientSignerName: `${lead.name} (${lead.designation || 'CEO'})`,
    clientSignedDate: new Date().toISOString().split('T')[0],
    signedByCompany: true,
    companySignerName: 'Sales Director (OneAssist CRM)',
    paymentTerms: '40% advance on execution (₹54,000), 30% UAT signoff (₹40,500), 30% final go-live (₹40,500).',
    slaTerms: '99.9% application uptime, Level 1 response within 4 hours, monthly system backups.',
    scopeSummary: `Implementation and deployment of ${offering} with customized data pipelines, security controls, and training.`,
  };

  // 4. Initial Invoices
  const initialInvoices: LeadInvoiceItem[] = [
    {
      id: `inv-${lead.id}-1`,
      invoiceNumber: `INV-${new Date().getFullYear()}-001`,
      title: 'Advance Contract Fee (40%)',
      issueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 54000,
      taxAmount: 9720,
      totalAmount: 63720,
      status: 'Paid',
      type: 'Advance (40%)',
      description: '40% advance payment upon contract signing for project kickoff.',
    },
    {
      id: `inv-${lead.id}-2`,
      invoiceNumber: `INV-${new Date().getFullYear()}-002`,
      title: 'Milestone 1 - Beta UAT Release (30%)',
      issueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 40500,
      taxAmount: 7290,
      totalAmount: 47790,
      status: 'Unpaid',
      type: 'Milestone 1 (30%)',
      description: '30% milestone release billing upon successful UAT deployment.',
    },
  ];

  // 5. Initial Payment Records
  const initialPayments: LeadPaymentRecord[] = [
    {
      id: `pay-${lead.id}-1`,
      receiptNumber: 'TXN-882910',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 63720,
      method: 'Bank Transfer (NEFT/IMPS)',
      referenceId: 'SBIN002948172',
      invoiceNumber: `INV-${new Date().getFullYear()}-001`,
      status: 'Confirmed',
      notes: 'Advance 40% payment cleared and verified with bank statement.',
    },
  ];

  // 6. Initial Progress
  const initialProgress: LeadProgressData = {
    leadId: lead.id,
    projectName: `${company} - ${offering} Deployment`,
    projectCode: `PRJ-${(company.replace(/[^A-Za-z0-9]/g, '').slice(0, 3) || 'CRM').toUpperCase()}-01`,
    overallPercentage: 40,
    status: 'In Development',
    projectManager: 'Kavin (Project Lead)',
    techLead: 'Ranjith (Senior Dev)',
    targetDeliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    stagingUrl: `https://${(company.replace(/[^A-Za-z0-9]/g, '').toLowerCase() || 'client')}.oneassist.app`,
    milestones: [
      {
        id: 'ms-1',
        title: 'Discovery & System Architecture Signoff',
        description: 'Client requirements finalized, entity relations defined and approved.',
        percentage: 100,
        status: 'Completed',
        targetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        id: 'ms-2',
        title: 'Database Schema & Core API Integrations',
        description: 'Authentication, database migrations, and lead pipeline services deployed on staging.',
        percentage: 100,
        status: 'Completed',
        targetDate: new Date().toISOString().split('T')[0],
      },
      {
        id: 'ms-3',
        title: 'Custom Modules & Dashboard Development',
        description: 'Building custom CRM views, user permission matrix, and real-time activity feeds.',
        percentage: 45,
        status: 'In Progress',
        targetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        id: 'ms-4',
        title: 'Client UAT & Staff Training',
        description: 'Handover staging instance to client team for user testing and feedback.',
        percentage: 0,
        status: 'Upcoming',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        id: 'ms-5',
        title: 'Production Go-Live & Handover',
        description: 'Custom domain mapping, SSL provisioning, and final production rollout.',
        percentage: 0,
        status: 'Upcoming',
        targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
  };

  return {
    proposals: [initialProposal],
    quotations: [initialQuotation],
    negotiation: initialNegotiation,
    contract: initialContract,
    invoices: initialInvoices,
    payments: initialPayments,
    progress: initialProgress,
  };
};

export const loadLeadDealData = (lead: Lead): LeadDealData => {
  try {
    const saved = localStorage.getItem(`crm_lead_deal_${lead.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.quotations || !Array.isArray(parsed.quotations) || parsed.quotations.length === 0) {
        const defaultData = getInitialLeadDealData(lead);
        parsed.quotations = defaultData.quotations;
        saveLeadDealData(lead.id, parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse deal data from localStorage:', e);
  }
  const defaultData = getInitialLeadDealData(lead);
  saveLeadDealData(lead.id, defaultData);
  return defaultData;
};

export const saveLeadDealData = (leadId: string, data: LeadDealData): void => {
  try {
    localStorage.setItem(`crm_lead_deal_${leadId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save deal data to localStorage:', e);
  }
};


// =========================================================================
// 2. LEAD NEGOTIATION SECTION
// =========================================================================

interface LeadNegotiationSectionProps {
  lead: Lead;
  isDark: boolean;
  negotiation: LeadNegotiation;
  onUpdateNegotiation: (negotiation: LeadNegotiation) => void;
  onNavigateSection: (section: any) => void;
}

export const LeadNegotiationSection: React.FC<LeadNegotiationSectionProps> = ({
  lead,
  isDark,
  negotiation,
  onUpdateNegotiation,
  onNavigateSection,
}) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPriceImpact, setNewPriceImpact] = useState<number>(0);
  const [newType, setNewType] = useState<string>('pricing');

  const [editValuesModal, setEditValuesModal] = useState(false);
  const [editAgreedPrice, setEditAgreedPrice] = useState<number>(negotiation.currentAgreedAmount);
  const [editStatus, setEditStatus] = useState<string>(negotiation.status);

  const handleAddLog = () => {
    if (!newNotes.trim()) {
      notifications.show({ title: 'Notes Required', message: 'Please enter discussion notes.', color: 'red' });
      return;
    }

    const newEntry: NegotiationEntry = {
      id: `neg-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: 'Sandy (Account Exec)',
      topic: newTopic.trim() || 'Negotiation Discussion',
      notes: newNotes.trim(),
      priceImpact: newPriceImpact !== 0 ? newPriceImpact : undefined,
      type: newType as any,
    };

    const updatedAgreedAmount = newPriceImpact !== 0
      ? Math.max(0, negotiation.currentAgreedAmount + newPriceImpact)
      : negotiation.currentAgreedAmount;

    const discount = negotiation.originalQuotedAmount > 0
      ? Math.round(((negotiation.originalQuotedAmount - updatedAgreedAmount) / negotiation.originalQuotedAmount) * 100)
      : 0;

    const updated: LeadNegotiation = {
      ...negotiation,
      currentAgreedAmount: updatedAgreedAmount,
      discountPercentage: Math.max(0, discount),
      entries: [newEntry, ...negotiation.entries],
    };

    onUpdateNegotiation(updated);
    setNewTopic('');
    setNewNotes('');
    setNewPriceImpact(0);
    setModalOpened(false);

    notifications.show({
      title: 'Negotiation Note Added',
      message: 'Discussion update recorded successfully.',
      color: 'teal',
    });
  };

  const handleSaveTerms = () => {
    const discount = negotiation.originalQuotedAmount > 0
      ? Math.round(((negotiation.originalQuotedAmount - editAgreedPrice) / negotiation.originalQuotedAmount) * 100)
      : 0;

    const updated: LeadNegotiation = {
      ...negotiation,
      currentAgreedAmount: editAgreedPrice,
      discountPercentage: Math.max(0, discount),
      status: editStatus as any,
    };

    onUpdateNegotiation(updated);
    setEditValuesModal(false);

    notifications.show({
      title: 'Commercial Terms Finalized',
      message: `Deal agreed at ₹${editAgreedPrice.toLocaleString('en-IN')} with status ${editStatus}.`,
      color: 'green',
    });
  };

  return (
    <Box>
      {/* Top Header */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <div>
          <Group gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" color="violet" variant="light">
              <IconScale size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                Deal Negotiation & Commercials
              </Text>
              <Text size="xs" c="dimmed">
                Track counter-offers, concessions, and pricing alignment for {lead.name}
              </Text>
            </div>
          </Group>
        </div>

        <Group gap="xs">
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              setEditAgreedPrice(negotiation.currentAgreedAmount);
              setEditStatus(negotiation.status);
              setEditValuesModal(true);
            }}
            style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
          >
            Adjust Commercials
          </Button>

          <Button
            size="sm"
            leftSection={<IconPlus size={15} />}
            onClick={() => setModalOpened(true)}
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
              color: '#FFF',
              borderRadius: 10,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            }}
          >
            Log Discussion
          </Button>

          <Button
            size="sm"
            variant="default"
            rightSection={<IconArrowRight size={15} />}
            onClick={() => onNavigateSection('contract')}
            style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
          >
            Go to Contract
          </Button>
        </Group>
      </Group>

      {/* KPI Cards Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="lg">
        <Paper
          p="md"
          radius="14px"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            ORIGINAL QUOTE
          </Text>
          <Text size="20px" fw={800} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
            ₹{negotiation.originalQuotedAmount.toLocaleString('en-IN')}
          </Text>
          <Text size="11px" c="dimmed" mt={2}>
            First proposal benchmark
          </Text>
        </Paper>

        <Paper
          p="md"
          radius="14px"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            AGREED DEAL VALUE
          </Text>
          <Text size="20px" fw={900} style={{ color: '#10B981' }}>
            ₹{negotiation.currentAgreedAmount.toLocaleString('en-IN')}
          </Text>
          <Text size="11px" c="dimmed" mt={2}>
            Commercial target for contract
          </Text>
        </Paper>

        <Paper
          p="md"
          radius="14px"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            DISCOUNT GRANTED
          </Text>
          <Group gap={6} align="baseline">
            <Text size="20px" fw={800} style={{ color: '#F59E0B' }}>
              {negotiation.discountPercentage}%
            </Text>
            <Text size="xs" c="dimmed">
              (-₹{(negotiation.originalQuotedAmount - negotiation.currentAgreedAmount).toLocaleString('en-IN')})
            </Text>
          </Group>
          <Text size="11px" c="dimmed" mt={2}>
            Margin protection intact
          </Text>
        </Paper>

        <Paper
          p="md"
          radius="14px"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            STAGE STATUS
          </Text>
          <Badge
            size="lg"
            variant="light"
            color={negotiation.status === 'Terms Agreed' ? 'green' : 'violet'}
            style={{ fontWeight: 700 }}
          >
            {negotiation.status}
          </Badge>
          <Text size="11px" c="dimmed" mt={6}>
            Contact: {negotiation.decisionMaker}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Agreed Concessions Summary */}
      <Paper
        p="md"
        radius="14px"
        mb="lg"
        style={{
          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
          border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
        }}
      >
        <Group justify="space-between" align="center" mb="xs">
          <Text size="xs" fw={800} style={{ color: isDark ? '#C4B5FD' : '#6D28D9', letterSpacing: '0.04em' }}>
            AGREED COMMERCIAL CONCESSIONS & SCOPE ALIGNMENT
          </Text>
          <Badge size="sm" color="violet" variant="outline">
            {negotiation.keyConcessions.length} Concessions
          </Badge>
        </Group>

        <Stack gap="xs">
          {negotiation.keyConcessions.map((c, idx) => (
            <Group key={idx} gap="xs" align="center">
              <ThemeIcon size="xs" radius="xl" color="green">
                <IconCheck size={10} />
              </ThemeIcon>
              <Text size="13px" style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                {c}
              </Text>
            </Group>
          ))}
        </Stack>
      </Paper>

      {/* Negotiation Entries Timeline */}
      <Paper
        p="xl"
        radius="16px"
        style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
        }}
      >
        <Group justify="space-between" align="center" mb="md">
          <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            Discussion Log & Negotiation History
          </Text>
          <Badge variant="dot" color="indigo">
            {negotiation.entries.length} Logged Entries
          </Badge>
        </Group>

        <Stack gap="md">
          {negotiation.entries.map((entry) => (
            <Box
              key={entry.id}
              p="md"
              style={{
                backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                borderRadius: 12,
              }}
            >
              <Group justify="space-between" align="center" mb={6}>
                <Group gap="xs">
                  <Badge size="xs" color="violet" variant="light">
                    {entry.type.toUpperCase()}
                  </Badge>
                  <Text fw={700} size="13px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                    {entry.topic}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {entry.date} • {entry.author}
                </Text>
              </Group>

              <Text size="13px" style={{ color: isDark ? '#CBD5E1' : '#475569', lineHeight: 1.5 }}>
                {entry.notes}
              </Text>

              {entry.priceImpact && (
                <Text size="xs" fw={700} color={entry.priceImpact < 0 ? 'orange' : 'green'} mt={6}>
                  Price Impact: {entry.priceImpact < 0 ? '-' : '+'}₹{Math.abs(entry.priceImpact).toLocaleString('en-IN')}
                </Text>
              )}
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* Modal: Log Discussion */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        size="md"
        radius="16px"
        title={
          <Group gap="xs">
            <ThemeIcon color="violet" size="md" radius="md">
              <IconMessageDots size={16} />
            </ThemeIcon>
            <Text fw={700} size="16px">
              Log Negotiation Discussion
            </Text>
          </Group>
        }
      >
        <Stack gap="md">
          <TextInput
            label="Topic / Focus"
            placeholder="e.g. Budget discount request, milestone modification"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            required
          />

          <Select
            label="Discussion Type"
            value={newType}
            onChange={(v) => setNewType(v || 'pricing')}
            data={[
              { value: 'pricing', label: 'Pricing & Commercials' },
              { value: 'scope', label: 'Scope Modification' },
              { value: 'terms', label: 'Payment Terms & Milestones' },
              { value: 'general', label: 'General Alignment' },
            ]}
          />

          <NumberInput
            label="Price Impact (₹)"
            description="Use negative value for discount concession, e.g. -15000"
            value={newPriceImpact}
            onChange={(v) => setNewPriceImpact(Number(v) || 0)}
          />

          <Textarea
            label="Discussion Notes & Client Response"
            placeholder="Details of client counter-offer, objections or agreed concessions..."
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            minRows={3}
            required
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddLog}
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                color: '#FFF',
                fontWeight: 700,
              }}
            >
              Save Log Entry ✓
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal: Adjust Commercials */}
      <Modal
        opened={editValuesModal}
        onClose={() => setEditValuesModal(false)}
        size="sm"
        radius="16px"
        title={<Text fw={700}>Adjust Commercial Agreement</Text>}
      >
        <Stack gap="md">
          <NumberInput
            label="Agreed Deal Value (₹)"
            value={editAgreedPrice}
            onChange={(v) => setEditAgreedPrice(Number(v) || 0)}
            min={0}
            required
          />

          <Select
            label="Negotiation Status"
            value={editStatus}
            onChange={(v) => setEditStatus(v || 'Terms Agreed')}
            data={['In Discussion', 'Counter-Offer Received', 'Terms Agreed', 'Stalled']}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setEditValuesModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTerms}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFF',
                fontWeight: 700,
              }}
            >
              Update Terms ✓
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};


// =========================================================================
// 3. LEAD CONTRACT SECTION
// =========================================================================

interface LeadContractSectionProps {
  lead: Lead;
  isDark: boolean;
  contract: LeadContract;
  onUpdateContract: (contract: LeadContract) => void;
  onNavigateSection: (section: any) => void;
}

export const LeadContractSection: React.FC<LeadContractSectionProps> = ({
  lead,
  isDark,
  contract,
  onUpdateContract,
  onNavigateSection,
}) => {
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [contractValue, setContractValue] = useState<number>(contract.contractValue);
  const [durationMonths, setDurationMonths] = useState<number>(contract.durationMonths);
  const [paymentTerms, setPaymentTerms] = useState<string>(contract.paymentTerms);
  const [slaTerms, setSlaTerms] = useState<string>(contract.slaTerms);

  const handleToggleSign = () => {
    const isNowSigned = !contract.signedByClient;
    const updated: LeadContract = {
      ...contract,
      signedByClient: isNowSigned,
      clientSignedDate: isNowSigned ? new Date().toISOString().split('T')[0] : undefined,
      status: isNowSigned ? 'Signed' : 'Draft',
    };
    onUpdateContract(updated);
    notifications.show({
      title: isNowSigned ? 'Contract Signed & Executed' : 'Contract Status Reset',
      message: isNowSigned
        ? `Signed by ${contract.clientSignerName || lead.name}. Contract is now legally binding.`
        : 'Contract returned to draft status.',
      color: isNowSigned ? 'teal' : 'gray',
    });
  };

  const handleSaveEdits = () => {
    const updated: LeadContract = {
      ...contract,
      contractValue,
      durationMonths,
      paymentTerms,
      slaTerms,
    };
    onUpdateContract(updated);
    setEditModalOpened(false);
    notifications.show({
      title: 'Contract Updated',
      message: 'Agreement parameters have been saved.',
      color: 'teal',
    });
  };

  const handleDownload = () => {
    notifications.show({
      title: 'Agreement PDF',
      message: `Downloading executed copy of ${contract.contractNumber}...`,
      color: 'blue',
    });
  };

  return (
    <Box>
      {/* Top Header */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <div>
          <Group gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" color="teal" variant="light">
              <IconFileCheck size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                Contract & Legal Agreement
              </Text>
              <Text size="xs" c="dimmed">
                Manage Master Services Agreement (MSA) and execution status for {lead.name}
              </Text>
            </div>
          </Group>
        </div>

        <Group gap="xs">
          <Button
            size="sm"
            variant="default"
            onClick={() => setEditModalOpened(true)}
            style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
          >
            Edit Terms
          </Button>

          <Button
            size="sm"
            variant="default"
            leftSection={<IconDownload size={15} />}
            onClick={handleDownload}
            style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
          >
            Download MSA
          </Button>

          <Button
            size="sm"
            leftSection={<IconCheck size={15} />}
            onClick={handleToggleSign}
            style={{
              background: contract.signedByClient
                ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                : 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
              color: '#FFF',
              borderRadius: 10,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
          >
            {contract.signedByClient ? 'Executed & Signed ✓' : 'Sign Agreement ✓'}
          </Button>

          <Button
            size="sm"
            variant="default"
            rightSection={<IconArrowRight size={15} />}
            onClick={() => onNavigateSection('invoice')}
            style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
          >
            Go to Invoice
          </Button>
        </Group>
      </Group>

      {/* Contract Details Card */}
      <Paper
        p="xl"
        radius="16px"
        mb="lg"
        style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.03)',
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md" mb="md">
          <div>
            <Group gap="xs" align="center" mb={6}>
              <Badge size="lg" color="teal" variant="light" style={{ fontWeight: 700 }}>
                {contract.contractNumber}
              </Badge>
              <Badge
                size="lg"
                color={contract.signedByClient ? 'green' : 'orange'}
                variant="filled"
                style={{ fontWeight: 700 }}
              >
                {contract.signedByClient ? 'Executed / Active' : 'Pending Signature'}
              </Badge>
            </Group>
            <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              {contract.title}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Between <strong>OneAssist IT CRM Hub</strong> & <strong>{lead.companyName || lead.name}</strong>
            </Text>
          </div>

          <Box style={{ textAlign: 'right' }}>
            <Text size="xs" fw={700} c="dimmed">
              TOTAL CONTRACT VALUE
            </Text>
            <Text size="24px" fw={900} style={{ color: '#10B981' }}>
              ₹{contract.contractValue.toLocaleString('en-IN')}
            </Text>
            <Text size="xs" c="dimmed">
              Duration: {contract.durationMonths} Months
            </Text>
          </Box>
        </Group>

        <Divider mb="lg" />

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="lg">
          <Box>
            <Group gap={6} mb={4}>
              <IconCalendar size={15} color="#6366F1" />
              <Text size="xs" fw={700} c="dimmed">
                EFFECTIVE PERIOD
              </Text>
            </Group>
            <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
              {contract.effectiveDate} to {contract.expiryDate}
            </Text>
          </Box>

          <Box>
            <Group gap={6} mb={4}>
              <IconClock size={15} color="#10B981" />
              <Text size="xs" fw={700} c="dimmed">
                PAYMENT MILESTONES
              </Text>
            </Group>
            <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
              40% Advance / 30% UAT / 30% Go-Live
            </Text>
          </Box>

          <Box>
            <Group gap={6} mb={4}>
              <IconShieldCheck size={15} color="#F59E0B" />
              <Text size="xs" fw={700} c="dimmed">
                SLA COMMITMENT
              </Text>
            </Group>
            <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
              99.9% Uptime SLA • 4h Critical Response
            </Text>
          </Box>
        </SimpleGrid>

        {/* Scope and Terms Summary */}
        <Box
          p="md"
          mb="lg"
          style={{
            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            borderRadius: 12,
          }}
        >
          <Text size="xs" fw={800} style={{ color: isDark ? '#A5B4FC' : '#4F46E5', letterSpacing: '0.04em' }} mb={4}>
            SCOPE SUMMARY & PAYMENT CLAUSES
          </Text>
          <Text size="13px" style={{ color: isDark ? '#E2E8F0' : '#334155', lineHeight: 1.6 }} mb={8}>
            {contract.scopeSummary}
          </Text>
          <Text size="xs" c="dimmed">
            <strong>Payment Terms:</strong> {contract.paymentTerms}
          </Text>
        </Box>

        {/* Dual Signatures Execution Section */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {/* Client Signatory */}
          <Paper
            p="md"
            radius="12px"
            style={{
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              border: contract.signedByClient ? '1px solid #10B981' : isDark ? '1px dashed #475569' : '1px dashed #CBD5E1',
            }}
          >
            <Group justify="space-between" align="center" mb={6}>
              <Group gap={6}>
                <IconSignature size={16} color={contract.signedByClient ? '#10B981' : '#94A3B8'} />
                <Text size="xs" fw={700} c="dimmed">
                  CLIENT SIGNATORY
                </Text>
              </Group>
              <Badge size="xs" color={contract.signedByClient ? 'green' : 'gray'}>
                {contract.signedByClient ? 'Signed ✓' : 'Pending Signature'}
              </Badge>
            </Group>
            <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
              {contract.clientSignerName || lead.name}
            </Text>
            <Text size="xs" c="dimmed">
              Authorized Representative, {lead.companyName || 'Client'}
            </Text>
            {contract.clientSignedDate && (
              <Text size="11px" color="teal" fw={600} mt={4}>
                Digitally verified on {contract.clientSignedDate}
              </Text>
            )}
          </Paper>

          {/* Company Signatory */}
          <Paper
            p="md"
            radius="12px"
            style={{
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              border: '1px solid #10B981',
            }}
          >
            <Group justify="space-between" align="center" mb={6}>
              <Group gap={6}>
                <IconSignature size={16} color="#10B981" />
                <Text size="xs" fw={700} c="dimmed">
                  SERVICE PROVIDER SIGNATORY
                </Text>
              </Group>
              <Badge size="xs" color="green">
                Countersigned ✓
              </Badge>
            </Group>
            <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
              {contract.companySignerName}
            </Text>
            <Text size="xs" c="dimmed">
              Authorized Representative, OneAssist CRM Hub
            </Text>
            <Text size="11px" color="teal" fw={600} mt={4}>
              Legally certified & counter-signed
            </Text>
          </Paper>
        </SimpleGrid>
      </Paper>

      {/* Edit Terms Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        size="md"
        radius="16px"
        title={<Text fw={700}>Edit Contract Details</Text>}
      >
        <Stack gap="md">
          <NumberInput
            label="Total Contract Value (₹)"
            value={contractValue}
            onChange={(v) => setContractValue(Number(v) || 0)}
            min={0}
            required
          />
          <NumberInput
            label="Duration (Months)"
            value={durationMonths}
            onChange={(v) => setDurationMonths(Number(v) || 12)}
            min={1}
            required
          />
          <Textarea
            label="Payment Milestones Clause"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            minRows={2}
          />
          <Textarea
            label="SLA & Support Terms"
            value={slaTerms}
            onChange={(e) => setSlaTerms(e.target.value)}
            minRows={2}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setEditModalOpened(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdits}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFF',
                fontWeight: 700,
              }}
            >
              Save Agreement ✓
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};


// =========================================================================
// 4. LEAD INVOICE SECTION
// =========================================================================

interface LeadInvoiceSectionProps {
  lead: Lead;
  isDark: boolean;
  invoices: LeadInvoiceItem[];
  onUpdateInvoices: (invoices: LeadInvoiceItem[]) => void;
  onNavigateSection: (section: any) => void;
}

export const LeadInvoiceSection: React.FC<LeadInvoiceSectionProps> = ({
  lead,
  isDark,
  invoices,
  onUpdateInvoices,
  onNavigateSection,
}) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [newTitle, setNewTitle] = useState('Milestone Deployment Invoice');
  const [newType, setNewType] = useState<LeadInvoiceItem['type']>('Milestone 1 (30%)');
  const [newAmount, setNewAmount] = useState<number>(40500);
  const [newDueDate, setNewDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newDesc, setNewDesc] = useState('Payment for completed project milestone deliverable.');

  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === 'Paid').reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const balanceDue = totalInvoiced - totalPaid;

  const handleCreateInvoice = () => {
    const tax = Math.round(newAmount * 0.18);
    const total = newAmount + tax;

    const newInv: LeadInvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate,
      amount: newAmount,
      taxAmount: tax,
      totalAmount: total,
      status: 'Unpaid',
      type: newType,
      description: newDesc,
    };

    const updated = [newInv, ...invoices];
    onUpdateInvoices(updated);
    setModalOpened(false);

    notifications.show({
      title: 'Invoice Generated',
      message: `${newInv.invoiceNumber} created for ₹${total.toLocaleString('en-IN')}.`,
      color: 'teal',
    });
  };

  const handleTogglePaid = (invId: string) => {
    const target = invoices.find((i) => i.id === invId);
    if (!target) return;
    const isNowPaid = target.status !== 'Paid';
    const updated = invoices.map((inv) =>
      inv.id === invId ? { ...inv, status: isNowPaid ? ('Paid' as const) : ('Unpaid' as const) } : inv
    );
    onUpdateInvoices(updated);
    notifications.show({
      title: isNowPaid ? 'Invoice Settled' : 'Invoice Marked Unpaid',
      message: `${target.invoiceNumber} status updated.`,
      color: isNowPaid ? 'green' : 'orange',
    });
  };

  const handleDownload = (inv: LeadInvoiceItem) => {
    notifications.show({
      title: 'Downloading Tax Invoice',
      message: `Fetching PDF for ${inv.invoiceNumber}...`,
      color: 'indigo',
    });
  };

  return (
    <Box>
      {/* Top Header */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <div>
          <Group gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" color="blue" variant="light">
              <IconReceipt size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                Billing & Tax Invoices
              </Text>
              <Text size="xs" c="dimmed">
                Track GST invoices and payment milestones for {lead.name} ({lead.companyName || 'Lead'})
              </Text>
            </div>
          </Group>
        </div>

        <Group gap="xs">
          <Button
            size="sm"
            leftSection={<IconPlus size={15} />}
            onClick={() => setModalOpened(true)}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFF',
              borderRadius: 10,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            Create Invoice
          </Button>

          <Button
            size="sm"
            variant="default"
            rightSection={<IconArrowRight size={15} />}
            onClick={() => onNavigateSection('payment')}
            style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
          >
            Go to Payment
          </Button>
        </Group>
      </Group>

      {/* KPI Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
        <Paper
          p="md"
          radius="14px"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            TOTAL INVOICED
          </Text>
          <Text size="22px" fw={900} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            ₹{totalInvoiced.toLocaleString('en-IN')}
          </Text>
          <Text size="11px" c="dimmed" mt={2}>
            Across {invoices.length} billing items
          </Text>
        </Paper>

        <Paper
          p="md"
          radius="14px"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            TOTAL COLLECTED (PAID)
          </Text>
          <Text size="22px" fw={900} style={{ color: '#10B981' }}>
            ₹{totalPaid.toLocaleString('en-IN')}
          </Text>
          <Text size="11px" c="dimmed" mt={2}>
            Verified receipts & payments
          </Text>
        </Paper>

        <Paper
          p="md"
          radius="14px"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            BALANCE DUE
          </Text>
          <Text size="22px" fw={900} style={{ color: balanceDue > 0 ? '#F59E0B' : '#10B981' }}>
            ₹{balanceDue.toLocaleString('en-IN')}
          </Text>
          <Text size="11px" c="dimmed" mt={2}>
            {balanceDue > 0 ? 'Pending milestone completion' : 'All invoices cleared ✓'}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Invoices List / Cards */}
      <Stack gap="md">
        {invoices.map((inv) => (
          <Paper
            key={inv.id}
            p="lg"
            radius="14px"
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              <div>
                <Group gap="xs" align="center" mb={4}>
                  <Badge size="md" color="blue" variant="light" style={{ fontWeight: 700 }}>
                    {inv.invoiceNumber}
                  </Badge>
                  <Badge size="md" color="indigo" variant="outline">
                    {inv.type}
                  </Badge>
                  <Badge
                    size="md"
                    color={inv.status === 'Paid' ? 'green' : inv.status === 'Overdue' ? 'red' : 'yellow'}
                    variant="filled"
                    style={{ fontWeight: 700 }}
                  >
                    {inv.status}
                  </Badge>
                </Group>

                <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                  {inv.title}
                </Text>

                <Group gap="md" mt={4}>
                  <Text size="xs" c="dimmed">
                    Issued: <strong>{inv.issueDate}</strong>
                  </Text>
                  <Text size="xs" c="dimmed">
                    Due Date: <strong>{inv.dueDate}</strong>
                  </Text>
                </Group>
              </div>

              <Group gap="lg" align="center">
                <Box style={{ textAlign: 'right' }}>
                  <Text size="18px" fw={800} style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </Text>
                  <Text size="xs" c="dimmed">
                    (Base: ₹{inv.amount.toLocaleString('en-IN')} + GST: ₹{inv.taxAmount.toLocaleString('en-IN')})
                  </Text>
                </Box>

                <Group gap="xs">
                  <Button
                    size="xs"
                    color={inv.status === 'Paid' ? 'gray' : 'teal'}
                    variant={inv.status === 'Paid' ? 'default' : 'light'}
                    leftSection={<IconCheck size={13} />}
                    onClick={() => handleTogglePaid(inv.id)}
                    style={{ fontWeight: 600, borderRadius: 8 }}
                  >
                    {inv.status === 'Paid' ? 'Mark Unpaid' : 'Mark as Paid'}
                  </Button>

                  <ActionIcon
                    variant="default"
                    size="md"
                    radius="md"
                    onClick={() => handleDownload(inv)}
                    title="Download Invoice PDF"
                  >
                    <IconDownload size={15} />
                  </ActionIcon>
                </Group>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>

      {/* Modal: Create Invoice */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        size="md"
        radius="16px"
        title={<Text fw={700}>Create Invoice</Text>}
      >
        <Stack gap="md">
          <TextInput
            label="Invoice Title / Milestone"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <Select
            label="Milestone Phase"
            value={newType}
            onChange={(v) => setNewType((v as any) || 'Milestone 1 (30%)')}
            data={['Advance (40%)', 'Milestone 1 (30%)', 'Final Handover (30%)', 'Custom']}
          />

          <SimpleGrid cols={2}>
            <NumberInput
              label="Base Amount (₹)"
              value={newAmount}
              onChange={(v) => setNewAmount(Number(v) || 0)}
              min={0}
              required
            />
            <TextInput
              label="Due Date"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              required
            />
          </SimpleGrid>

          <Text size="xs" c="dimmed">
            GST 18% will be added automatically (+₹{Math.round(newAmount * 0.18).toLocaleString('en-IN')}).
            Total payable: <strong>₹{Math.round(newAmount * 1.18).toLocaleString('en-IN')}</strong>.
          </Text>

          <TextInput
            label="Description / Scope reference"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvoice}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFF',
                fontWeight: 700,
              }}
            >
              Generate Invoice ✓
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};


// =========================================================================
// 5. LEAD PAYMENT SECTION
// =========================================================================

interface LeadPaymentSectionProps {
  lead: Lead;
  isDark: boolean;
  payments: LeadPaymentRecord[];
  invoices: LeadInvoiceItem[];
  onUpdatePayments: (payments: LeadPaymentRecord[]) => void;
  onNavigateSection: (section: any) => void;
}

export const LeadPaymentSection: React.FC<LeadPaymentSectionProps> = ({
  lead,
  isDark,
  payments,
  invoices,
  onUpdatePayments,
  onNavigateSection,
}) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [amount, setAmount] = useState<number>(47790);
  const [method, setMethod] = useState<LeadPaymentRecord['method']>('Bank Transfer (NEFT/IMPS)');
  const [referenceId, setReferenceId] = useState<string>('HDFC00392817');
  const [linkedInvoice, setLinkedInvoice] = useState<string>(invoices[1]?.invoiceNumber || invoices[0]?.invoiceNumber || 'INV-2026-001');
  const [notes, setNotes] = useState<string>('Milestone 1 payment received via direct account transfer.');

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const pendingBalance = Math.max(0, totalInvoiced - totalCollected);

  const handleRecordPayment = () => {
    if (!amount || amount <= 0) {
      notifications.show({ title: 'Amount Required', message: 'Please enter received payment amount.', color: 'red' });
      return;
    }

    const newPayment: LeadPaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNumber: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString().split('T')[0],
      amount: amount,
      method: method,
      referenceId: referenceId.trim() || `REF-${Date.now()}`,
      invoiceNumber: linkedInvoice,
      status: 'Confirmed',
      notes: notes.trim(),
    };

    const updated = [newPayment, ...payments];
    onUpdatePayments(updated);
    setModalOpened(false);

    notifications.show({
      title: 'Payment Recorded Successfully',
      message: `Receipt ${newPayment.receiptNumber} generated for ₹${amount.toLocaleString('en-IN')}.`,
      color: 'teal',
    });
  };

  const handleDownloadReceipt = (pay: LeadPaymentRecord) => {
    notifications.show({
      title: 'Downloading Payment Receipt',
      message: `Generating digital receipt for ${pay.receiptNumber}...`,
      color: 'indigo',
    });
  };

  return (
    <Box>
      {/* Top Header */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <div>
          <Group gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" color="teal" variant="light">
              <IconCreditCard size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                Payment Transactions & Receipts
              </Text>
              <Text size="xs" c="dimmed">
                Reconciliation & banking receipts for {lead.name} ({lead.companyName || 'Lead'})
              </Text>
            </div>
          </Group>
        </div>

        <Group gap="xs">
          <Button
            size="sm"
            leftSection={<IconPlus size={15} />}
            onClick={() => setModalOpened(true)}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#FFF',
              borderRadius: 10,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
          >
            Record Payment
          </Button>

          <Button
            size="sm"
            variant="default"
            rightSection={<IconArrowRight size={15} />}
            onClick={() => onNavigateSection('progress')}
            style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
          >
            Go to Progress
          </Button>
        </Group>
      </Group>

      {/* KPI Stats */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
        <Paper
          p="md"
          radius="14px"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            TOTAL RECEIVED TO DATE
          </Text>
          <Text size="22px" fw={900} style={{ color: '#10B981' }}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </Text>
          <Text size="11px" c="dimmed" mt={2}>
            {payments.length} verified transactions
          </Text>
        </Paper>

        <Paper
          p="md"
          radius="14px"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            OUTSTANDING BALANCE
          </Text>
          <Text size="22px" fw={900} style={{ color: pendingBalance > 0 ? '#F59E0B' : '#10B981' }}>
            ₹{pendingBalance.toLocaleString('en-IN')}
          </Text>
          <Text size="11px" c="dimmed" mt={2}>
            Tied to project delivery milestones
          </Text>
        </Paper>

        <Paper
          p="md"
          radius="14px"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            PAYMENT HEALTH
          </Text>
          <Badge size="lg" color="green" variant="light" style={{ fontWeight: 700 }}>
            Advance Cleared ✓
          </Badge>
          <Text size="11px" c="dimmed" mt={6}>
            Client in good standing
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Transactions Table */}
      <Paper
        p="xl"
        radius="16px"
        style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.03)',
        }}
      >
        <Group justify="space-between" align="center" mb="md">
          <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            Transaction History & Bank References
          </Text>
          <Badge variant="dot" color="teal">
            {payments.length} Payments
          </Badge>
        </Group>

        <Box style={{ overflowX: 'auto' }}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                  RECEIPT / REF
                </Table.Th>
                <Table.Th style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                  DATE
                </Table.Th>
                <Table.Th style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                  METHOD
                </Table.Th>
                <Table.Th style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                  INVOICE #
                </Table.Th>
                <Table.Th style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', textAlign: 'right' }}>
                  AMOUNT PAID
                </Table.Th>
                <Table.Th style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', textAlign: 'center' }}>
                  STATUS
                </Table.Th>
                <Table.Th style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', textAlign: 'right' }}>
                  ACTION
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payments.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Text fw={700} size="13px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                      {p.receiptNumber}
                    </Text>
                    <Text size="11px" c="dimmed">
                      Ref: {p.referenceId}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="13px" c="dimmed">
                      {p.date}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="outline" color="blue">
                      {p.method}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light" color="indigo">
                      {p.invoiceNumber}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text fw={800} size="14px" style={{ color: '#10B981' }}>
                      ₹{p.amount.toLocaleString('en-IN')}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Badge size="sm" color="green" variant="filled">
                      {p.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <ActionIcon
                      variant="subtle"
                      color="indigo"
                      size="md"
                      onClick={() => handleDownloadReceipt(p)}
                      title="Download Payment Receipt"
                    >
                      <IconDownload size={15} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>

      {/* Modal: Record Payment */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        size="md"
        radius="16px"
        title={<Text fw={700}>Record Received Payment</Text>}
      >
        <Stack gap="md">
          <NumberInput
            label="Amount Received (₹)"
            value={amount}
            onChange={(v) => setAmount(Number(v) || 0)}
            min={0}
            required
          />

          <Select
            label="Payment Method"
            value={method}
            onChange={(v) => setMethod((v as any) || 'Bank Transfer (NEFT/IMPS)')}
            data={['Bank Transfer (NEFT/IMPS)', 'UPI', 'Credit Card', 'Cheque']}
          />

          <TextInput
            label="Transaction Reference / UTR Number"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            required
          />

          <Select
            label="Linked Invoice"
            value={linkedInvoice}
            onChange={(v) => setLinkedInvoice(v || 'INV-2026-001')}
            data={invoices.map((i) => ({
              value: i.invoiceNumber,
              label: `${i.invoiceNumber} - ${i.title} (₹${i.totalAmount.toLocaleString('en-IN')})`,
            }))}
          />

          <TextInput
            label="Payment Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFF',
                fontWeight: 700,
              }}
            >
              Confirm Payment ✓
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};


// =========================================================================
// 6. LEAD PROGRESS SECTION
// =========================================================================

interface LeadProgressSectionProps {
  lead: Lead;
  isDark: boolean;
  progress: LeadProgressData;
  onUpdateProgress: (progress: LeadProgressData) => void;
  onNavigateSection: (section: any) => void;
}

export const LeadProgressSection: React.FC<LeadProgressSectionProps> = ({
  lead,
  isDark,
  progress,
  onUpdateProgress,
  onNavigateSection,
}) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTargetDate, setNewTargetDate] = useState(
    new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const handleAddMilestone = () => {
    if (!newTitle.trim()) {
      notifications.show({ title: 'Title Required', message: 'Please enter milestone title.', color: 'red' });
      return;
    }

    const newMs: ProjectMilestoneItem = {
      id: `ms-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      percentage: 0,
      status: 'Upcoming',
      targetDate: newTargetDate,
    };

    const updatedMilestones = [...progress.milestones, newMs];
    const updated: LeadProgressData = {
      ...progress,
      milestones: updatedMilestones,
    };

    onUpdateProgress(updated);
    setNewTitle('');
    setNewDesc('');
    setModalOpened(false);

    notifications.show({
      title: 'Milestone Added',
      message: `${newMs.title} added to project roadmap.`,
      color: 'teal',
    });
  };

  const handleAdvanceMilestone = (msId: string) => {
    const updatedMilestones = progress.milestones.map((ms: ProjectMilestoneItem) => {
      if (ms.id === msId) {
        if (ms.status === 'Upcoming') {
          return { ...ms, status: 'In Progress' as const, percentage: 50 };
        }
        if (ms.status === 'In Progress') {
          return { ...ms, status: 'Completed' as const, percentage: 100 };
        }
        return { ...ms, status: 'Upcoming' as const, percentage: 0 };
      }
      return ms;
    });

    const completedCount = updatedMilestones.filter((m: ProjectMilestoneItem) => m.status === 'Completed').length;
    const inProgCount = updatedMilestones.filter((m: ProjectMilestoneItem) => m.status === 'In Progress').length;
    const computedOverall = Math.round(
      ((completedCount * 100 + inProgCount * 50) / (updatedMilestones.length * 100)) * 100
    );

    const updated: LeadProgressData = {
      ...progress,
      overallPercentage: Math.min(100, Math.max(0, computedOverall)),
      status: computedOverall === 100 ? 'Completed' : 'In Development',
      milestones: updatedMilestones,
    };

    onUpdateProgress(updated);
    notifications.show({
      title: 'Roadmap Updated',
      message: `Overall delivery progress is now ${computedOverall}%.`,
      color: 'blue',
    });
  };

  return (
    <Box>
      {/* Top Header */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <div>
          <Group gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" color="orange" variant="light">
              <IconRocket size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                Implementation & Delivery Progress
              </Text>
              <Text size="xs" c="dimmed">
                Post-sale project delivery and technical milestones for {lead.name} ({lead.companyName || 'Lead'})
              </Text>
            </div>
          </Group>
        </div>

        <Group gap="xs">
          <Button
            size="sm"
            variant="default"
            leftSection={<IconArrowLeft size={15} />}
            onClick={() => onNavigateSection('payment')}
            style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
          >
            Back to Payment
          </Button>

          <Button
            size="sm"
            leftSection={<IconPlus size={15} />}
            onClick={() => setModalOpened(true)}
            style={{
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: '#FFF',
              borderRadius: 10,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            }}
          >
            Add Milestone
          </Button>
        </Group>
      </Group>

      {/* Main Project Card */}
      <Paper
        p="xl"
        radius="16px"
        mb="lg"
        style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.03)',
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md" mb="md">
          <div>
            <Group gap="xs" align="center" mb={6}>
              <Badge size="lg" color="orange" variant="light" style={{ fontWeight: 700 }}>
                {progress.projectCode}
              </Badge>
              <Badge size="lg" color="blue" variant="filled" style={{ fontWeight: 700 }}>
                {progress.status}
              </Badge>
            </Group>
            <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              {progress.projectName}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Target Delivery: <strong>{progress.targetDeliveryDate}</strong>
            </Text>
          </div>

          <Box style={{ textAlign: 'right', minWidth: 200 }}>
            <Group justify="flex-end" gap={6} align="baseline" mb={4}>
              <Text size="26px" fw={900} style={{ color: '#F97316' }}>
                {progress.overallPercentage}%
              </Text>
              <Text size="xs" c="dimmed">
                Completed
              </Text>
            </Group>
            <Progress
              value={progress.overallPercentage}
              size="lg"
              radius="xl"
              color="orange"
              animated={progress.overallPercentage < 100}
            />
          </Box>
        </Group>

        <Divider mb="lg" />

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
          <Paper
            p="md"
            radius="12px"
            style={{
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconUser size={15} color="#6366F1" />
              <Text size="xs" fw={700} c="dimmed">
                PROJECT MANAGER
              </Text>
            </Group>
            <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
              {progress.projectManager}
            </Text>
          </Paper>

          <Paper
            p="md"
            radius="12px"
            style={{
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconCode size={15} color="#10B981" />
              <Text size="xs" fw={700} c="dimmed">
                LEAD ENGINEER
              </Text>
            </Group>
            <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
              {progress.techLead}
            </Text>
          </Paper>

          <Paper
            p="md"
            radius="12px"
            style={{
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconExternalLink size={15} color="#F97316" />
              <Text size="xs" fw={700} c="dimmed">
                STAGING PREVIEW
              </Text>
            </Group>
            <Text
              size="13px"
              fw={700}
              component="a"
              href={progress.stagingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563EB', textDecoration: 'none' }}
            >
              Open Staging Environment ↗
            </Text>
          </Paper>
        </SimpleGrid>

        {/* Milestones Roadmap List */}
        <Box>
          <Text size="xs" fw={800} style={{ color: isDark ? '#FDBA74' : '#EA580C', letterSpacing: '0.04em' }} mb="md">
            DELIVERY ROADMAP & PHASE MILESTONES
          </Text>

          <Stack gap="md">
            {progress.milestones.map((ms: ProjectMilestoneItem, idx: number) => (
              <Paper
                key={ms.id}
                p="md"
                radius="12px"
                style={{
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  border:
                    ms.status === 'Completed'
                      ? '1px solid #10B981'
                      : ms.status === 'In Progress'
                      ? '1px solid #F97316'
                      : isDark
                      ? '1px solid #334155'
                      : '1px solid #E2E8F0',
                }}
              >
                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                  <Group gap="md">
                    <ThemeIcon
                      size="md"
                      radius="xl"
                      color={ms.status === 'Completed' ? 'green' : ms.status === 'In Progress' ? 'orange' : 'gray'}
                      variant={ms.status === 'Completed' ? 'filled' : 'light'}
                    >
                      {ms.status === 'Completed' ? <IconCheck size={14} /> : <Text size="xs" fw={800}>{idx + 1}</Text>}
                    </ThemeIcon>

                    <div>
                      <Group gap="xs" align="center">
                        <Text fw={700} size="14px" style={{ color: isDark ? '#F8FAFC' : '#111827' }}>
                          {ms.title}
                        </Text>
                        <Badge
                          size="xs"
                          color={ms.status === 'Completed' ? 'green' : ms.status === 'In Progress' ? 'orange' : 'gray'}
                          variant="light"
                        >
                          {ms.status}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" mt={2}>
                        {ms.description} • Target: {ms.targetDate}
                      </Text>
                    </div>
                  </Group>

                  <Group gap="sm" align="center">
                    <Text size="xs" fw={700} c="dimmed">
                      {ms.percentage}%
                    </Text>
                    <Button
                      size="xs"
                      variant="light"
                      color={ms.status === 'Completed' ? 'gray' : 'orange'}
                      onClick={() => handleAdvanceMilestone(ms.id)}
                      style={{ borderRadius: 8, fontWeight: 600 }}
                    >
                      {ms.status === 'Upcoming'
                        ? 'Start Phase'
                        : ms.status === 'In Progress'
                        ? 'Mark Done ✓'
                        : 'Reopen Phase'}
                    </Button>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Paper>

      {/* Modal: Add Milestone */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        size="md"
        radius="16px"
        title={<Text fw={700}>Add Delivery Milestone</Text>}
      >
        <Stack gap="md">
          <TextInput
            label="Milestone Phase Name"
            placeholder="e.g. Mobile App API Integration & Push Notification Engine"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <TextInput
            label="Deliverable Scope Description"
            placeholder="Summary of engineering outcomes and deliverables"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />

          <TextInput
            label="Target Completion Date"
            type="date"
            value={newTargetDate}
            onChange={(e) => setNewTargetDate(e.target.value)}
            required
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMilestone}
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: '#FFF',
                fontWeight: 700,
              }}
            >
              Add Milestone ✓
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
