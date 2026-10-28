import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Paper,
  Table,
  ThemeIcon,
  Modal,
  ActionIcon,
  Tooltip,
  Center,
  Loader,
  Divider,
  Menu,
} from '@mantine/core';
import {
  IconReceipt,
  IconPlus,
  IconArrowRight,
  IconPrinter,
  IconDownload,
  IconCheck,
  IconClock,
  IconEye,
  IconEdit,
  IconCreditCard,
  IconFileInvoice,
  IconArrowLeft,
  IconX,
  IconCash,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Lead, LeadInvoiceItem } from '../../../../types/lead';
import { Invoice, BillingSettings } from '../../../../types/billing';
import { billingService } from '../../../../services/billingService';
import { useInvoicePdfDownload } from '../../../../hooks/useInvoicePdfDownload';
import { InvoiceModal } from '../../../billing/components/InvoiceModal';
import { InvoicePrintModal } from '../../../billing/components/InvoicePrintModal';
import { InvoiceDocument } from '../../../billing/components/InvoiceDocument';
import { RecordPaymentModal } from '../../../invoices/components/RecordPaymentModal';
import dayjs from 'dayjs';

export interface LeadInvoiceSectionProps {
  lead: Lead;
  isDark: boolean;
  invoices?: LeadInvoiceItem[];
  onUpdateInvoices?: (invoices: LeadInvoiceItem[]) => void;
  onNavigateSection?: (section: any) => void;
}

export const LeadInvoiceSection: React.FC<LeadInvoiceSectionProps> = ({
  lead,
  isDark,
  invoices: initialInvoices = [],
  onUpdateInvoices,
  onNavigateSection,
}) => {
  // Backend dynamic data state
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [backendInvoices, setBackendInvoices] = useState<Invoice[]>([]);

  const [createModalOpened, setCreateModalOpened] = useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [modalKey, setModalKey] = useState<number>(0);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [autoPrint, setAutoPrint] = useState<boolean>(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [recordPaymentOpened, setRecordPaymentOpened] = useState<boolean>(false);

  const { triggerDownload, HiddenInvoiceDownloadContainer } = useInvoicePdfDownload();

  useEffect(() => {
    billingService.getSettings().then(setSettings).catch(() => {});
  }, []);

  // Fetch real invoices from backend
  const fetchInvoices = useCallback(async () => {
    try {
      const invoicesRes = await billingService.getInvoices().catch(() => []);
      const invoiceList: Invoice[] = Array.isArray(invoicesRes)
        ? invoicesRes
        : Array.isArray((invoicesRes as any)?.data)
        ? (invoicesRes as any).data
        : [];
      const leadNameLower = (lead.name || '').trim().toLowerCase();
      const leadCompanyLower = (lead.companyName || '').trim().toLowerCase();

      // Filter invoices belonging to this lead
      const matching = invoiceList.filter((inv: Invoice) => {
        if (inv.contactId && (inv.contactId === lead.id || inv.contactId === lead.leadId)) {
          return true;
        }
        if (inv.contactName) {
          const c = inv.contactName.toLowerCase();
          if (leadNameLower && c.includes(leadNameLower)) return true;
        }
        if (inv.companyName) {
          const comp = inv.companyName.toLowerCase();
          if (leadCompanyLower && comp.includes(leadCompanyLower)) return true;
        }
        return false;
      });

      setBackendInvoices(matching);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lead]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Unified list of invoice items for display
  const unifiedInvoices = useMemo(() => {
    if (backendInvoices.length > 0) {
      return backendInvoices.map((inv) => {
        const pName = (inv.projectName || inv.projectTitle || '').trim();
        const rawTitle = pName || inv.items?.[0]?.itemName || inv.notes || 'IT Services Invoice';
        const mainTitle = rawTitle ? rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1) : 'IT Services Invoice';
        const moduleNames = (inv.items || []).map((it) => it.itemName).filter(Boolean);
        
        // Filter out duplicate or redundant module names that simply match the project title
        const filteredModules = moduleNames.filter(
          (m) =>
            m.toLowerCase().trim() !== mainTitle.toLowerCase().trim() &&
            !mainTitle.toLowerCase().startsWith(m.toLowerCase().trim())
        );

        const subtitle = filteredModules.length > 0 ? filteredModules.join(', ') : '';

        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          title: mainTitle,
          subtitle,
          issueDate: inv.invoiceDate ? dayjs(inv.invoiceDate).format('DD MMM YYYY') : '—',
          dueDate: inv.dueDate ? dayjs(inv.dueDate).format('DD MMM YYYY') : '—',
          amount: inv.subtotal || 0,
          taxAmount: inv.taxAmount || 0,
          totalAmount: inv.grandTotal || 0,
          status: (inv.status === 'Paid'
            ? 'Paid'
            : inv.status === 'Partially Paid'
            ? 'Partially Paid'
            : inv.status === 'Overdue'
            ? 'Overdue'
            : 'Unpaid') as any,
          type: 'Tax Invoice' as const,
          description: inv.notes || '',
          rawInvoice: inv,
        };
      });
    }

    // When no backend invoices exist for this lead, return empty list
    return [];
  }, [backendInvoices]);

  const renderStatusBadge = (status: string) => {
    const s = (status || 'Unpaid').toLowerCase();

    let bg = isDark ? 'rgba(148, 163, 184, 0.12)' : '#F8FAFC';
    let color = isDark ? '#94A3B8' : '#64748B';
    let border = isDark ? 'rgba(148, 163, 184, 0.25)' : '#E2E8F0';
    let dotColor = '#94A3B8';
    let label = status || 'Unpaid';

    if (s === 'paid') {
      bg = isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5';
      color = isDark ? '#34D399' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0';
      dotColor = '#10B981';
      label = 'Paid';
    } else if (s === 'partially paid') {
      bg = isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB';
      color = isDark ? '#FBBF24' : '#B45309';
      border = isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A';
      dotColor = '#F59E0B';
      label = 'Partially Paid';
    } else if (s === 'unpaid' || s === 'issued' || s === 'pending') {
      bg = isDark ? 'rgba(249, 115, 22, 0.12)' : '#FFF7ED';
      color = isDark ? '#FB923C' : '#C2410C';
      border = isDark ? 'rgba(249, 115, 22, 0.25)' : '#FFEDD5';
      dotColor = '#EA580C';
      label = 'Unpaid';
    } else if (s === 'overdue') {
      bg = isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEF2F2';
      color = isDark ? '#F87171' : '#B91C1C';
      border = isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA';
      dotColor = '#EF4444';
      label = 'Overdue';
    }

    return (
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 9999,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <Box
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0,
          }}
        />
        {label}
      </Box>
    );
  };

  const handleInvoiceSuccess = async () => {
    await fetchInvoices();
    setCreateModalOpened(false);
    setEditingInvoice(null);
    notifications.show({
      title: 'Invoice Saved',
      message: 'Tax invoice updated and live synced with billing records.',
      color: 'teal',
    });
    if (onUpdateInvoices) {
      onUpdateInvoices(backendInvoices as any);
    }
  };

  const handleOpenRecordPayment = (inv: any) => {
    setPayingInvoice(resolveInvoiceObject(inv));
    setRecordPaymentOpened(true);
  };

  const handleQuickMarkPaid = async (inv: any) => {
    try {
      setLoading(true);
      const invoiceObj = resolveInvoiceObject(inv);
      await billingService.updateInvoice(invoiceObj.id, {
        status: 'Paid',
      });

      notifications.show({
        title: 'Invoice Paid & Live Synced',
        message: `${invoiceObj.invoiceNumber} marked as Paid. Transaction automatically logged in Payments tab.`,
        color: 'teal',
        icon: <IconCheck size={16} />,
      });

      await fetchInvoices();
      if (onUpdateInvoices) {
        onUpdateInvoices(backendInvoices as any);
      }
    } catch (err: any) {
      notifications.show({
        title: 'Update Failed',
        message: err.message || 'Could not mark invoice as Paid.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnpaid = async (inv: any) => {
    try {
      setLoading(true);
      const invoiceObj = resolveInvoiceObject(inv);
      await billingService.updateInvoice(invoiceObj.id, {
        status: 'Issued',
        amountPaid: 0,
      });
      notifications.show({
        title: 'Invoice Status Updated',
        message: `${invoiceObj.invoiceNumber} marked as Unpaid / Issued.`,
        color: 'blue',
        icon: <IconClock size={16} />,
      });
      await fetchInvoices();
      if (onUpdateInvoices) {
        onUpdateInvoices(backendInvoices as any);
      }
    } catch (err: any) {
      notifications.show({
        title: 'Update Failed',
        message: err.message || 'Could not update status.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveInvoiceObject = (item: any): Invoice => {
    if (item.rawInvoice) return item.rawInvoice;
    return {
      id: item.id,
      invoiceNumber: item.invoiceNumber,
      contactName: lead.name,
      companyName: lead.companyName || undefined,
      contactEmail: lead.email || undefined,
      contactPhone: lead.phone || undefined,
      clientAddress: lead.address || undefined,
      invoiceDate: item.issueDate,
      dueDate: item.dueDate,
      subtotal: item.amount,
      discountAmount: 0,
      taxAmount: item.taxAmount,
      grandTotal: item.totalAmount,
      amountPaid: item.status === 'Paid' ? item.totalAmount : 0,
      outstandingBalance: item.status === 'Paid' ? 0 : item.totalAmount,
      status: item.status === 'Paid' ? 'Paid' : 'Issued',
      paymentTerms: 'Due within 30 days',
      notes: item.description,
      items: [
        {
          itemName: item.title,
          itemType: 'Service',
          description: item.description,
          quantity: 1,
          unitPrice: item.amount,
          discount: 0,
          taxRate: 18,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handlePrint = (item: any, autoDownload = false) => {
    setAutoPrint(autoDownload);
    setPrintingInvoice(resolveInvoiceObject(item));
  };



  const handleOpenCreateInvoice = () => {
    setEditingInvoice(null);
    setModalKey((k) => k + 1);
    setCreateModalOpened(true);
  };

  if (createModalOpened) {
    return (
      <Box p={{ base: 'xs', sm: 'sm' }}>
        <InvoiceModal
          key={createModalOpened ? (editingInvoice ? `edit-${editingInvoice.id}-${modalKey}` : `fresh-${modalKey}`) : 'closed'}
          opened={createModalOpened}
          onClose={() => {
            setCreateModalOpened(false);
            setEditingInvoice(null);
          }}
          invoice={editingInvoice}
          onSuccess={handleInvoiceSuccess}
          initialLead={lead}
          asScreen={true}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Top Header */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <div>
          <Group gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" color="blue" variant="light">
              <IconFileInvoice size={20} />
            </ThemeIcon>
            <div>
              <Group gap={8} align="center">
                <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                  Billing & Tax Invoices
                </Text>
                <Badge size="xs" variant="light" color="blue">
                  Live Synced
                </Badge>
              </Group>
            </div>
          </Group>
        </div>

        <Group gap="xs">
          <Button
            size="sm"
            leftSection={<IconPlus size={15} />}
            onClick={handleOpenCreateInvoice}
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

          {onNavigateSection && (
            <Button
              size="sm"
              variant="default"
              rightSection={<IconArrowRight size={15} />}
              onClick={() => onNavigateSection('payments')}
              style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
            >
              Go to Payments
            </Button>
          )}
        </Group>
      </Group>

      {/* Invoices List / Table */}
      <Paper
        p="md"
        radius="16px"
        style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        <Group justify="space-between" align="center" mb="sm">
          <Text fw={750} size="sm" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
            Tax Invoices
          </Text>
          <Badge size="xs" variant="light" color="blue">
            {unifiedInvoices.length} Invoice{unifiedInvoices.length === 1 ? '' : 's'}
          </Badge>
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader size="sm" color="blue" />
          </Center>
        ) : unifiedInvoices.length === 0 ? (
          <Center py={40}>
            <Stack align="center" gap="xs">
              <ThemeIcon size={44} radius="xl" color="gray" variant="light">
                <IconReceipt size={22} />
              </ThemeIcon>
              <Text fw={700} size="sm" style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                No Invoices Raised Yet
              </Text>
              <Text size="xs" c="dimmed" style={{ maxWidth: 340, textAlign: 'center' }}>
                No tax invoices have been generated for {lead.name}. Click below to build a GST invoice using the full invoice generator.
              </Text>
              <Button
                size="xs"
                color="blue"
                variant="light"
                leftSection={<IconPlus size={13} />}
                onClick={handleOpenCreateInvoice}
                mt={4}
              >
                Create Tax Invoice
              </Button>
            </Stack>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={750}>
            <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr style={{ borderBottom: isDark ? '1px solid #334155' : '1px solid #E2E8F0' }}>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    INVOICE #
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    TITLE / SCOPE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    DATES
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    BASE + GST
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    TOTAL AMOUNT
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    STATUS
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>
                    ACTIONS
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {unifiedInvoices.map((inv) => (
                  <Table.Tr key={inv.id} style={{ borderBottom: isDark ? '1px solid #1E293B' : '1px solid #F1F5F9' }}>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <ThemeIcon size="sm" radius="md" color="blue" variant="light">
                          <IconFileInvoice size={12} />
                        </ThemeIcon>
                        <Text fw={750} size="12px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                          {inv.invoiceNumber}
                        </Text>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Text fw={650} size="12px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }} lineClamp={1}>
                        {inv.title}
                      </Text>
                      {inv.subtitle && (
                        <Text size="10px" c="dimmed" lineClamp={1} mt={2}>
                          {inv.subtitle}
                        </Text>
                      )}
                    </Table.Td>

                    <Table.Td>
                      <Box>
                        <Text fw={650} size="12px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                          {inv.issueDate}
                        </Text>
                        {inv.dueDate && inv.dueDate !== '—' && (
                          <Text size="10.5px" c="dimmed" mt={2} fw={500}>
                            Due: {inv.dueDate}
                          </Text>
                        )}
                      </Box>
                    </Table.Td>

                    <Table.Td>
                      <Box>
                        <Text fw={700} size="12px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                          ₹{Number(inv.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Text size="10.5px" c="dimmed" mt={2} fw={500}>
                          + GST ₹{Number(inv.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </Box>
                    </Table.Td>

                    <Table.Td>
                      <Text fw={800} size="13px" style={{ color: '#2563EB' }}>
                        ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </Table.Td>

                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Menu shadow="md" width={220} position="bottom-start" withinPortal radius="md">
                        <Menu.Target>
                          <Tooltip label="Click to change payment status" withArrow>
                            <Box style={{ display: 'inline-block', cursor: 'pointer' }}>
                              {renderStatusBadge(inv.status)}
                            </Box>
                          </Tooltip>
                        </Menu.Target>
                        <Menu.Dropdown p="xs">
                          <Menu.Label>Change Payment Status</Menu.Label>
                          {inv.status !== 'Paid' && (
                            <Menu.Item
                              leftSection={<IconCheck size={14} color="#10B981" />}
                              onClick={() => handleQuickMarkPaid(inv)}
                            >
                              <Text size="13px" fw={600} c="teal">
                                Mark as Paid (Quick Settle)
                              </Text>
                            </Menu.Item>
                          )}
                          {inv.status !== 'Partially Paid' && (
                            <Menu.Item
                              leftSection={<IconCash size={14} color="#F59E0B" />}
                              onClick={() => handleOpenRecordPayment(inv)}
                            >
                              <Text size="13px" fw={500} style={{ color: '#D97706' }}>
                                Record Partial Payment...
                              </Text>
                            </Menu.Item>
                          )}
                          {inv.status !== 'Unpaid' && (
                            <Menu.Item
                              leftSection={<IconClock size={14} color="#EA580C" />}
                              onClick={() => handleMarkUnpaid(inv)}
                            >
                              <Text size="13px" fw={500} c="orange">
                                Mark as Unpaid / Issued
                              </Text>
                            </Menu.Item>
                          )}
                          <Divider my={4} />
                          <Menu.Item
                            leftSection={<IconCreditCard size={14} color="#2563EB" />}
                            onClick={() => handleOpenRecordPayment(inv)}
                          >
                            <Text size="13px" fw={500}>
                              Record Custom Payment...
                            </Text>
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'right' }}>
                      <Group gap={6} justify="flex-end" wrap="nowrap">
                        {inv.status !== 'Paid' && (
                          <Tooltip label="Record Payment" withArrow>
                            <ActionIcon
                              variant="light"
                              color="teal"
                              size="sm"
                              radius="md"
                              onClick={() => handleOpenRecordPayment(inv)}
                            >
                              <IconCash size={15} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        <Tooltip label="View Invoice" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            radius="md"
                            onClick={() => setViewingInvoice(resolveInvoiceObject(inv))}
                          >
                            <IconEye size={15} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Download PDF" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="indigo"
                            size="sm"
                            radius="md"
                            onClick={() => triggerDownload(resolveInvoiceObject(inv))}
                          >
                            <IconDownload size={15} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Print Tax Invoice" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            radius="md"
                            onClick={() => {
                              setAutoPrint(false);
                              setPrintingInvoice(resolveInvoiceObject(inv));
                            }}
                          >
                            <IconPrinter size={15} />
                          </ActionIcon>
                        </Tooltip>

                        {inv.rawInvoice && (
                          <Tooltip label="Edit Invoice" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              radius="md"
                              onClick={() => {
                                setEditingInvoice(inv.rawInvoice);
                                setModalKey((k) => k + 1);
                                setCreateModalOpened(true);
                              }}
                            >
                              <IconEdit size={15} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Invoice Print & PDF Modal */}
      {printingInvoice && (
        <InvoicePrintModal
          opened={!!printingInvoice}
          onClose={() => {
            setPrintingInvoice(null);
            setAutoPrint(false);
          }}
          invoice={printingInvoice}
          autoPrint={autoPrint}
        />
      )}

      {/* Invoice View Popup Modal */}
      <Modal
        opened={Boolean(viewingInvoice)}
        onClose={() => setViewingInvoice(null)}
        size="960px"
        radius="16px"
        centered
        withCloseButton={false}
        padding={0}
        overlayProps={{
          backgroundOpacity: 0.6,
          blur: 5,
        }}
        styles={{
          content: {
            overflow: 'hidden',
            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
            borderRadius: 16,
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          },
          body: {
            padding: 0,
          },
        }}
      >
        {viewingInvoice && (
          <Box>
            {/* Modal Top Header - Completely Flush */}
            <Box
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
              }}
            >
              <Group gap="sm" align="center" wrap="nowrap">
                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                    border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #C7D2FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/oneassist-logo.png"
                    alt="OneAssist"
                    style={{ width: 18, height: 18, objectFit: 'contain' }}
                  />
                </Box>
                <Text fw={800} size="md" c={isDark ? '#FFFFFF' : '#0F172A'} style={{ whiteSpace: 'nowrap' }}>
                  Invoice #{viewingInvoice.invoiceNumber}
                </Text>
                {renderStatusBadge(viewingInvoice.status)}
              </Group>

              <Group gap="xs" align="center" wrap="nowrap">
                <Button
                  size="xs"
                  variant="filled"
                  color="indigo"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => triggerDownload(viewingInvoice)}
                  style={{
                    background: '#4F46E5',
                    fontWeight: 600,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  Download PDF
                </Button>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  radius="md"
                  onClick={() => setViewingInvoice(null)}
                >
                  <IconX size={18} />
                </ActionIcon>
              </Group>
            </Box>

            {/* Modal Body with Scrollable Invoice Preview */}
            <Box
              style={{
                maxHeight: 'calc(88vh - 75px)',
                overflowY: 'auto',
                padding: '24px 20px 40px 20px',
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              }}
            >
              <Box
                style={{
                  width: '100%',
                  maxWidth: 880,
                  boxShadow: isDark
                    ? '0 8px 30px rgba(0,0,0,0.35)'
                    : '0 8px 30px rgba(15,23,42,0.06)',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <InvoiceDocument invoice={viewingInvoice} settings={settings} />
              </Box>
            </Box>
          </Box>
        )}
      </Modal>

      {/* Create / Edit Invoice Modal */}
      {createModalOpened && (
        <InvoiceModal
          key={modalKey}
          opened={createModalOpened}
          onClose={() => {
            setCreateModalOpened(false);
            setEditingInvoice(null);
          }}
          onSuccess={handleInvoiceSuccess}
          invoice={editingInvoice}
          initialLead={lead}
        />
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        opened={recordPaymentOpened}
        onClose={() => setRecordPaymentOpened(false)}
        invoice={payingInvoice}
        onSuccess={async () => {
          await fetchInvoices();
          setRecordPaymentOpened(false);
          if (onUpdateInvoices) {
            onUpdateInvoices(backendInvoices as any);
          }
        }}
      />

      {/* Hidden PDF Generation Container */}
      {HiddenInvoiceDownloadContainer}
    </Box>
  );
};

export default LeadInvoiceSection;
