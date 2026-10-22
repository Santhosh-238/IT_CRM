import React, { useState } from 'react';
import {
  Box,
  Paper,
  Text,
  Title,
  Group,
  Button,
  Badge,
  useComputedColorScheme,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBox,
  IconCalculator,
  IconFileSpreadsheet,
  IconFlag,
  IconFileInvoice,
  IconCash,
  IconChartBar,
  IconSettings,
  IconPlus,
  IconChevronRight,
} from '@tabler/icons-react';

// Components
import { ProductsServicesView } from './components/ProductsServicesView';
import { QuotationsView } from './components/QuotationsView';
import { SalesOrdersView } from './components/SalesOrdersView';
import { ProjectsMilestonesView } from './components/ProjectsMilestonesView';
import { InvoicesView } from './components/InvoicesView';
import { PaymentsView } from './components/PaymentsView';
import { BillingReportsView } from './components/BillingReportsView';
import { BillingSettingsView } from './components/BillingSettingsView';

// Modals
import { QuotationModal } from './components/QuotationModal';
import { InvoiceModal } from './components/InvoiceModal';
import { PaymentModal } from './components/PaymentModal';
import { ProductModal } from './components/ProductModal';
import { MilestoneModal } from './components/MilestoneModal';
import { SalesOrderModal } from './components/SalesOrderModal';
import { Invoice, BillingMilestone } from '../../types/billing';
import { billingService } from '../../services/billingService';
import { notifications } from '@mantine/notifications';

export type BillingSubTab =
  | 'quotations'
  | 'contracts'
  | 'milestones'
  | 'invoices'
  | 'payments'
  | 'catalogue'
  | 'reports'
  | 'settings';

export const BillingPage: React.FC = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<BillingSubTab>('quotations');

  // Cross-modal triggers
  const [quoteModalOpened, setQuoteModalOpened] = useState(false);
  const [orderModalOpened, setOrderModalOpened] = useState(false);
  const [milestoneModalOpened, setMilestoneModalOpened] = useState(false);
  const [invoiceModalOpened, setInvoiceModalOpened] = useState(false);
  const [paymentModalOpened, setPaymentModalOpened] = useState(false);
  const [productModalOpened, setProductModalOpened] = useState(false);

  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);
  const [invoiceTargetMilestone, setInvoiceTargetMilestone] = useState<BillingMilestone | null>(null);
  const [filterOrderId, setFilterOrderId] = useState<string | undefined>(undefined);

  // Tabs Definition matching existing modules
  const tabs: Array<{ id: BillingSubTab; label: string; icon: React.ReactNode }> = [
    { id: 'quotations', label: 'Quotations', icon: <IconCalculator size={15} /> },
    { id: 'contracts', label: 'Sales Orders', icon: <IconFileSpreadsheet size={15} /> },
    { id: 'milestones', label: 'Milestones', icon: <IconFlag size={15} /> },
    { id: 'invoices', label: 'Tax Invoices', icon: <IconFileInvoice size={15} /> },
    { id: 'payments', label: 'Payments', icon: <IconCash size={15} /> },
    { id: 'catalogue', label: 'Products & Services', icon: <IconBox size={15} /> },
    { id: 'reports', label: 'Reports', icon: <IconChartBar size={15} /> },
    { id: 'settings', label: 'Settings', icon: <IconSettings size={15} /> },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  // Primary action button config per tab
  const getPrimaryAction = () => {
    switch (activeTab) {
      case 'quotations':
        return {
          label: 'Create Quotation',
          action: () => setQuoteModalOpened(true),
        };
      case 'contracts':
        return {
          label: 'Create Sales Order',
          action: () => setOrderModalOpened(true),
        };
      case 'milestones':
        return {
          label: 'Add Milestone',
          action: () => setMilestoneModalOpened(true),
        };
      case 'invoices':
        return {
          label: 'Create Tax Invoice',
          action: () => {
            setInvoiceTargetMilestone(null);
            setInvoiceModalOpened(true);
          },
        };
      case 'payments':
        return {
          label: 'Record Payment',
          action: () => {
            setPaymentTargetInvoice(null);
            setPaymentModalOpened(true);
          },
        };
      case 'catalogue':
        return {
          label: 'Add Product / Service',
          action: () => setProductModalOpened(true),
        };
      default:
        return {
          label: 'Create Quotation',
          action: () => setQuoteModalOpened(true),
        };
    }
  };

  const primaryAction = getPrimaryAction();

  // Handlers for cross-tab actions
  const handleRecordPaymentForInvoice = (inv: Invoice) => {
    setPaymentTargetInvoice(inv);
    setPaymentModalOpened(true);
  };

  const handleOpenInvoiceForMilestone = (milestone: BillingMilestone) => {
    setInvoiceTargetMilestone(milestone);
    setInvoiceModalOpened(true);
  };

  const handleOpenMilestoneForOrder = (orderId: string) => {
    setFilterOrderId(orderId);
    setActiveTab('milestones');
  };

  const handleOpenInvoiceForOrder = (orderId: string) => {
    setFilterOrderId(orderId);
    setActiveTab('invoices');
  };

  return (
    <Box p={{ base: 'md', md: 'lg' }} style={{ maxWidth: 1520, margin: '0 auto' }}>
      {/* ========================================================================= */}
      {/* 1. Modern Header with Breadcrumbs & Title matching Projects / Contacts   */}
      {/* ========================================================================= */}
      <Box mb="md">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          <Box>
            <Group gap={6} align="center" mb={4}>
              <Text size="12px" fw={600} c="dimmed">
                Billing & Invoicing
              </Text>
              <IconChevronRight size={13} color="#94A3B8" />
              <Text size="12px" fw={700} style={{ color: isDark ? '#93C5FD' : '#2563EB' }}>
                {currentTabObj.label}
              </Text>
            </Group>
            <Group gap="sm" align="center">
              <Title
                order={3}
                fw={800}
                style={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  letterSpacing: '-0.02em',
                  fontSize: '21px',
                }}
              >
                Billing Management
              </Title>
              <Badge
                size="md"
                variant="light"
                color="blue"
                radius="md"
                style={{ fontWeight: 700, height: 24 }}
              >
                Enterprise Suite
              </Badge>
            </Group>
          </Box>

        </Group>
      </Box>

      {/* ========================================================================= */}
      {/* 2. TOP CONTROLS BAR - Second Navbar with Capsule Tabs & Create Action    */}
      {/* ========================================================================= */}
      <Paper
        p="sm"
        radius="lg"
        mb="md"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          {/* Left Capsule Navigation Tabs matching existing modules */}
          <Box
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              padding: 3,
              borderRadius: 10,
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
              overflowX: 'auto',
              maxWidth: '100%',
            }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <UnstyledButton
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active ? (isDark ? '#0F172A' : '#FFFFFF') : 'transparent',
                    color: active ? (isDark ? '#818CF8' : '#4F46E5') : isDark ? '#94A3B8' : '#64748B',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Box style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</Box>
                  <span>{tab.label}</span>
                </UnstyledButton>
              );
            })}
          </Box>
        </Group>
      </Paper>

      {/* ========================================================================= */}
      {/* 3. Main Content Views                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'quotations' && (
        <QuotationsView onAddNew={() => setQuoteModalOpened(true)} />
      )}

      {activeTab === 'contracts' && (
        <SalesOrdersView
          onAddNew={() => setOrderModalOpened(true)}
          onOpenMilestoneModal={handleOpenMilestoneForOrder}
          onOpenInvoiceModal={handleOpenInvoiceForOrder}
        />
      )}

      {activeTab === 'milestones' && (
        <ProjectsMilestonesView
          selectedOrderId={filterOrderId}
          onAddNew={() => setMilestoneModalOpened(true)}
          onOpenInvoiceForMilestone={handleOpenInvoiceForMilestone}
        />
      )}

      {activeTab === 'invoices' && (
        <InvoicesView
          initialOrderId={filterOrderId}
          onAddNew={() => {
            setInvoiceTargetMilestone(null);
            setInvoiceModalOpened(true);
          }}
          onRecordPayment={handleRecordPaymentForInvoice}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentsView
          onAddNew={() => {
            setPaymentTargetInvoice(null);
            setPaymentModalOpened(true);
          }}
        />
      )}

      {activeTab === 'catalogue' && (
        <ProductsServicesView onAddNew={() => setProductModalOpened(true)} />
      )}

      {activeTab === 'reports' && <BillingReportsView />}

      {activeTab === 'settings' && <BillingSettingsView />}

      {/* ========================================================================= */}
      {/* 4. Global Action Modals                                                   */}
      {/* ========================================================================= */}
      <QuotationModal
        opened={quoteModalOpened}
        onClose={() => setQuoteModalOpened(false)}
        onSuccess={() => setActiveTab('quotations')}
      />

      <SalesOrderModal
        opened={orderModalOpened}
        onClose={() => setOrderModalOpened(false)}
        onSuccess={() => setActiveTab('contracts')}
      />

      <MilestoneModal
        opened={milestoneModalOpened}
        onClose={() => setMilestoneModalOpened(false)}
        defaultSalesOrderId={filterOrderId}
        onSuccess={() => setActiveTab('milestones')}
      />

      <InvoiceModal
        opened={invoiceModalOpened}
        onClose={() => {
          setInvoiceModalOpened(false);
          setInvoiceTargetMilestone(null);
        }}
        defaultMilestone={invoiceTargetMilestone}
        onSuccess={() => setActiveTab('invoices')}
      />

      <PaymentModal
        opened={paymentModalOpened}
        onClose={() => {
          setPaymentModalOpened(false);
          setPaymentTargetInvoice(null);
        }}
        preselectedInvoice={paymentTargetInvoice}
        onSuccess={() => setActiveTab('payments')}
      />

      <ProductModal
        opened={productModalOpened}
        onClose={() => setProductModalOpened(false)}
        onSave={async (data) => {
          await billingService.createProduct(data);
          notifications.show({ color: 'green', message: 'Item added successfully' });
          setProductModalOpened(false);
          setActiveTab('catalogue');
        }}
      />
    </Box>
  );
};

export default BillingPage;
