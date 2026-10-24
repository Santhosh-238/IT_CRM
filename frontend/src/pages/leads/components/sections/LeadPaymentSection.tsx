import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Paper,
  Table,
  SimpleGrid,
  ThemeIcon,
  Modal,
  TextInput,
  NumberInput,
  Select,
  ActionIcon,
  Tooltip,
  Center,
  Loader,
  Divider,
} from '@mantine/core';
import {
  IconCreditCard,
  IconPlus,
  IconCheck,
  IconDownload,
  IconArrowRight,
  IconBuildingBank,
  IconQrcode,
  IconReceipt,
  IconRefresh,
  IconCash,
  IconFileInvoice,
  IconPrinter,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Lead, LeadPaymentRecord, LeadInvoiceItem } from '../../../../types/lead';
import { Invoice, Payment } from '../../../../types/billing';
import { billingService } from '../../../../services/billingService';
import dayjs from 'dayjs';

export interface LeadPaymentSectionProps {
  lead: Lead;
  isDark: boolean;
  payments?: LeadPaymentRecord[];
  invoices?: LeadInvoiceItem[];
  onUpdatePayments?: (payments: LeadPaymentRecord[]) => void;
  onNavigateSection?: (section: any) => void;
}

export const LeadPaymentSection: React.FC<LeadPaymentSectionProps> = ({
  lead,
  isDark,
  payments: initialPayments = [],
  invoices: initialInvoices = [],
  onUpdatePayments,
  onNavigateSection,
}) => {
  // Backend dynamic data state
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [backendPayments, setBackendPayments] = useState<Payment[]>([]);
  const [backendInvoices, setBackendInvoices] = useState<Invoice[]>([]);

  // Modal State
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const [receiptModalOpened, setReceiptModalOpened] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Form State
  const [amount, setAmount] = useState<number | string>('');
  const [method, setMethod] = useState<string>('Bank Transfer (NEFT/IMPS)');
  const [referenceId, setReferenceId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch real invoices & payments from backend
  const fetchBillingData = useCallback(async () => {
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        billingService.getPayments().catch(() => []),
        billingService.getInvoices().catch(() => []),
      ]);

      const leadNameLower = (lead.name || '').trim().toLowerCase();
      const leadCompanyLower = (lead.companyName || '').trim().toLowerCase();

      // Filter payments belonging to this lead
      const matchingPayments = (paymentsRes || []).filter((p) => {
        if (p.contactId && (p.contactId === lead.id || p.contactId === lead.leadId)) {
          return true;
        }
        if (p.clientName) {
          const c = p.clientName.toLowerCase();
          if (leadNameLower && c.includes(leadNameLower)) return true;
          if (leadCompanyLower && c.includes(leadCompanyLower)) return true;
        }
        return false;
      });

      const invoiceList: Invoice[] = Array.isArray(invoicesRes)
        ? invoicesRes
        : Array.isArray((invoicesRes as any)?.data)
        ? (invoicesRes as any).data
        : [];

      // Filter invoices belonging to this lead
      const matchingInvoices = invoiceList.filter((inv: Invoice) => {
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

      setBackendPayments(matchingPayments);
      setBackendInvoices(matchingInvoices);
    } catch (err: any) {
      console.error('Error fetching lead billing data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lead]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // Unified list of payment items for display
  const unifiedPayments = useMemo(() => {
    // Convert backend payments to unified model
    const fromBackend = backendPayments.map((p) => ({
      id: p.id,
      receiptNumber: p.paymentNumber || p.transactionReference || `PAY-${p.id.slice(0, 6)}`,
      date: p.paymentDate ? dayjs(p.paymentDate).format('YYYY-MM-DD') : '—',
      amount: p.amountReceived || 0,
      method: p.paymentMethod || 'Bank Transfer',
      referenceId: p.transactionReference || '—',
      bankName: p.bankName || '',
      invoiceNumber:
        p.allocations?.[0]?.invoice?.invoiceNumber ||
        (p.allocations?.[0] as any)?.invoiceNumber ||
        'Advance / Unallocated',
      status: 'Confirmed',
      notes: p.notes || '',
    }));

    if (fromBackend.length > 0) {
      return fromBackend;
    }

    // Filter out dummy 'TXN-882910' mock records so clean leads start with 0 records
    const customLocal = (initialPayments || []).filter(
      (p) => p.receiptNumber !== 'TXN-882910'
    );

    return customLocal.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      date: p.date,
      amount: p.amount || 0,
      method: p.method,
      referenceId: p.referenceId || '—',
      bankName: '',
      invoiceNumber: p.invoiceNumber || 'Advance / General',
      status: p.status || 'Confirmed',
      notes: p.notes || '',
    }));
  }, [backendPayments, initialPayments]);

  // Available invoices for dropdown
  const availableInvoices = useMemo(() => {
    if (backendInvoices.length > 0) {
      return backendInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        label: `${inv.invoiceNumber} — Balance: ₹${(inv.outstandingBalance || 0).toLocaleString('en-IN')} (Total: ₹${inv.grandTotal.toLocaleString('en-IN')})`,
        outstanding: inv.outstandingBalance || 0,
      }));
    }

    // Fallback to dealData invoices (filtering dummy placeholder if appropriate)
    return (initialInvoices || []).map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      label: `${inv.invoiceNumber} — ${inv.title} (₹${inv.totalAmount.toLocaleString('en-IN')})`,
      outstanding: inv.status === 'Paid' ? 0 : inv.totalAmount,
    }));
  }, [backendInvoices, initialInvoices]);

  // Balance calculation for pre-filling payment record
  const totalReceived = useMemo(() => {
    return unifiedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [unifiedPayments]);

  const totalInvoiced = useMemo(() => {
    if (backendInvoices.length > 0) {
      return backendInvoices.reduce((acc, inv) => acc + (Number(inv.grandTotal) || 0), 0);
    }
    return (initialInvoices || []).reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0);
  }, [backendInvoices, initialInvoices]);

  const outstandingBalance = useMemo(() => {
    if (backendInvoices.length > 0) {
      return backendInvoices.reduce((acc, inv) => acc + (Number(inv.outstandingBalance) || 0), 0);
    }
    return Math.max(0, totalInvoiced - totalReceived);
  }, [backendInvoices, totalInvoiced, totalReceived]);

  // Handle Record Payment
  const handleRecordPayment = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      notifications.show({
        title: 'Amount Required',
        message: 'Please enter a valid received payment amount.',
        color: 'red',
      });
      return;
    }

    setSubmitting(true);
    try {
      const clientLabel = lead.companyName
        ? `${lead.companyName} (${lead.name})`
        : lead.name;

      const payload = {
        clientName: clientLabel,
        contactId: lead.id,
        paymentDate: new Date().toISOString().split('T')[0],
        amountReceived: numAmount,
        paymentMethod: method,
        transactionReference: referenceId.trim() || `REF-${Date.now()}`,
        bankName: bankName.trim() || undefined,
        notes: notes.trim() || undefined,
        invoiceId: selectedInvoiceId && selectedInvoiceId !== 'advance' ? selectedInvoiceId : undefined,
        allocations:
          selectedInvoiceId && selectedInvoiceId !== 'advance'
            ? [{ invoiceId: selectedInvoiceId, amountAllocated: numAmount }]
            : [],
      };

      await billingService.recordPayment(payload);

      notifications.show({
        title: 'Payment Recorded',
        message: `₹${numAmount.toLocaleString('en-IN')} received via ${method}.`,
        color: 'teal',
      });

      // Reset form
      setModalOpened(false);
      setAmount('');
      setReferenceId('');
      setBankName('');
      setNotes('');
      setSelectedInvoiceId(null);

      // Re-fetch dynamic data from backend
      await fetchBillingData();

      // Also trigger parent callback if available
      if (onUpdatePayments) {
        const newLocalPayment: LeadPaymentRecord = {
          id: `pay-${Date.now()}`,
          receiptNumber: payload.transactionReference,
          date: payload.paymentDate,
          amount: numAmount,
          method: method as any,
          referenceId: payload.transactionReference,
          invoiceNumber: selectedInvoiceId || 'Advance / General',
          status: 'Confirmed',
          notes: notes.trim(),
        };
        onUpdatePayments([newLocalPayment, ...(initialPayments || [])]);
      }
    } catch (err: any) {
      notifications.show({
        title: 'Failed to Record Payment',
        message: err.message || 'Could not save payment to database.',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Receipt Modal
  const handleOpenReceipt = (pay: any) => {
    setSelectedReceipt(pay);
    setReceiptModalOpened(true);
  };

  // Print Receipt
  const handlePrintReceipt = () => {
    window.print();
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
              <Group gap={8} align="center">
                <Text fw={800} size="18px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                  Payment Transactions & Receipts
                </Text>
                <Badge size="xs" variant="light" color="teal">
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
            onClick={() => {
              setAmount(outstandingBalance > 0 ? outstandingBalance : '');
              setModalOpened(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#FFF',
              borderRadius: 10,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            Record Payment
          </Button>

          {onNavigateSection && (
            <Button
              size="sm"
              variant="default"
              rightSection={<IconArrowRight size={15} />}
              onClick={() => onNavigateSection('progress')}
              style={{ borderRadius: 10, fontWeight: 600, borderColor: isDark ? '#374151' : '#E2E8F0' }}
            >
              Go to Progress
            </Button>
          )}
        </Group>
      </Group>


      {/* Payment Records Table */}
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
            Transaction History & Bank References
          </Text>
          <Badge size="xs" variant="light" color="teal">
            {unifiedPayments.length} Payment{unifiedPayments.length === 1 ? '' : 's'}
          </Badge>
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader size="sm" color="teal" />
          </Center>
        ) : unifiedPayments.length === 0 ? (
          <Center py={40}>
            <Stack align="center" gap="xs">
              <ThemeIcon size={44} radius="xl" color="gray" variant="light">
                <IconReceipt size={22} />
              </ThemeIcon>
              <Text fw={700} size="sm" style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                No Payments Recorded Yet
              </Text>
              <Text size="xs" c="dimmed" style={{ maxWidth: 320, textAlign: 'center' }}>
                No payment transactions have been logged for {lead.name}. Click below to record an advance or milestone payment.
              </Text>
              <Button
                size="xs"
                color="teal"
                variant="light"
                leftSection={<IconPlus size={13} />}
                onClick={() => setModalOpened(true)}
                mt={4}
              >
                Record Advance Payment
              </Button>
            </Stack>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr style={{ borderBottom: isDark ? '1px solid #334155' : '1px solid #E2E8F0' }}>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    RECEIPT / REF
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    DATE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    METHOD
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    INVOICE #
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    AMOUNT PAID
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                    STATUS
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>
                    ACTION
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {unifiedPayments.map((p) => (
                  <Table.Tr key={p.id} style={{ borderBottom: isDark ? '1px solid #1E293B' : '1px solid #F1F5F9' }}>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <ThemeIcon size="sm" radius="xl" color="teal" variant="light">
                          <IconReceipt size={12} />
                        </ThemeIcon>
                        <div>
                          <Text fw={700} size="12px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                            {p.receiptNumber}
                          </Text>
                          {p.referenceId && p.referenceId !== '—' && (
                            <Text size="10px" ff="monospace" c="dimmed">
                              Ref: {p.referenceId}
                            </Text>
                          )}
                        </div>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Text size="12px" c="dimmed">
                        {p.date}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        {p.method.toLowerCase().includes('bank') ? (
                          <IconBuildingBank size={14} color="#6366F1" />
                        ) : p.method.toLowerCase().includes('upi') ? (
                          <IconQrcode size={14} color="#10B981" />
                        ) : p.method.toLowerCase().includes('cash') ? (
                          <IconCash size={14} color="#10B981" />
                        ) : (
                          <IconCreditCard size={14} color="#F59E0B" />
                        )}
                        <Text size="12px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                          {p.method}
                        </Text>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Badge size="xs" variant="light" color="blue">
                        {p.invoiceNumber}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Text fw={800} size="13px" style={{ color: '#10B981' }}>
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Badge size="xs" color="teal" variant="filled">
                        {p.status}
                      </Badge>
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'right' }}>
                      <Tooltip label="View & Print Digital Receipt" withArrow>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="indigo"
                          onClick={() => handleOpenReceipt(p)}
                        >
                          <IconDownload size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Modal: Record Payment */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        size="md"
        radius="16px"
        title={
          <Group gap="xs">
            <ThemeIcon color="teal" size="sm" radius="md">
              <IconCreditCard size={14} />
            </ThemeIcon>
            <Text fw={700} size="sm">
              Record Received Payment for {lead.name}
            </Text>
          </Group>
        }
      >
        <Stack gap="sm">
          <NumberInput
            label="Received Amount (INR ₹)"
            placeholder="e.g. 50000"
            value={amount}
            onChange={setAmount}
            min={1}
            required
          />

          <Select
            label="Payment Method"
            data={[
              'Bank Transfer (NEFT/IMPS)',
              'UPI',
              'Credit Card',
              'Cheque',
              'Cash',
            ]}
            value={method}
            onChange={(val) => setMethod(val || 'Bank Transfer (NEFT/IMPS)')}
            required
          />

          <Select
            label="Allocated Invoice"
            placeholder="Select invoice or record as advance"
            value={selectedInvoiceId}
            onChange={setSelectedInvoiceId}
            clearable
            data={[
              { value: 'advance', label: '⭐ Advance Payment (Kickoff / Unallocated)' },
              ...availableInvoices.map((inv) => ({
                value: inv.id || inv.invoiceNumber,
                label: inv.label,
              })),
            ]}
          />

          <TextInput
            label="UTR / Transaction Reference ID"
            placeholder="e.g. SBIN002948172 or UPI-981249"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
          />

          <TextInput
            label="Bank Name (Optional)"
            placeholder="e.g. HDFC Bank, SBI, ICICI"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />

          <TextInput
            label="Payment Notes"
            placeholder="e.g. Advance 40% cleared via RTGS"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" size="xs" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              color="teal"
              loading={submitting}
              onClick={handleRecordPayment}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFF',
                fontWeight: 700,
              }}
            >
              Confirm & Save Payment ✓
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal: Digital Receipt View */}
      <Modal
        opened={receiptModalOpened}
        onClose={() => setReceiptModalOpened(false)}
        size="md"
        radius="16px"
        title={
          <Group gap="xs">
            <ThemeIcon color="teal" size="sm" radius="md">
              <IconReceipt size={14} />
            </ThemeIcon>
            <Text fw={700} size="sm">
              Official Payment Receipt — {selectedReceipt?.receiptNumber}
            </Text>
          </Group>
        }
      >
        {selectedReceipt && (
          <Stack gap="sm">
            <Paper
              p="md"
              radius="md"
              style={{
                background: isDark ? '#0B0F17' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              }}
            >
              <Group justify="space-between" mb="xs">
                <div>
                  <Text fw={800} size="md">
                    OneAssist Enterprise Operations
                  </Text>
                  <Text size="11px" c="dimmed">
                    Banking Reconciliation & Official Tax Receipt
                  </Text>
                </div>
                <Badge color="teal" variant="filled">
                  CONFIRMED ✓
                </Badge>
              </Group>

              <Divider my="sm" />

              <SimpleGrid cols={2} spacing="xs">
                <div>
                  <Text size="11px" c="dimmed">
                    CLIENT / CONTACT
                  </Text>
                  <Text size="xs" fw={700}>
                    {lead.name}
                  </Text>
                  {lead.companyName && (
                    <Text size="11px" c="dimmed">
                      {lead.companyName}
                    </Text>
                  )}
                </div>

                <div>
                  <Text size="11px" c="dimmed">
                    RECEIPT NUMBER
                  </Text>
                  <Text size="xs" fw={700}>
                    {selectedReceipt.receiptNumber}
                  </Text>
                </div>

                <div>
                  <Text size="11px" c="dimmed">
                    PAYMENT DATE
                  </Text>
                  <Text size="xs" fw={600}>
                    {selectedReceipt.date}
                  </Text>
                </div>

                <div>
                  <Text size="11px" c="dimmed">
                    PAYMENT METHOD
                  </Text>
                  <Text size="xs" fw={600}>
                    {selectedReceipt.method}
                  </Text>
                </div>

                <div>
                  <Text size="11px" c="dimmed">
                    TRANSACTION REF / UTR
                  </Text>
                  <Text size="xs" ff="monospace" fw={600}>
                    {selectedReceipt.referenceId || 'N/A'}
                  </Text>
                </div>

                <div>
                  <Text size="11px" c="dimmed">
                    LINKED INVOICE
                  </Text>
                  <Text size="xs" fw={600}>
                    {selectedReceipt.invoiceNumber}
                  </Text>
                </div>
              </SimpleGrid>

              <Divider my="sm" />

              <Group justify="space-between" align="center">
                <Text size="sm" fw={700}>
                  AMOUNT RECEIVED
                </Text>
                <Text size="18px" fw={900} style={{ color: '#10B981' }}>
                  ₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}
                </Text>
              </Group>

              {selectedReceipt.notes && (
                <Text size="11px" c="dimmed" mt="xs" style={{ fontStyle: 'italic' }}>
                  Note: {selectedReceipt.notes}
                </Text>
              )}
            </Paper>

            <Group justify="flex-end" gap="xs">
              <Button
                variant="default"
                size="xs"
                leftSection={<IconPrinter size={13} />}
                onClick={handlePrintReceipt}
              >
                Print Receipt
              </Button>
              <Button size="xs" color="teal" onClick={() => setReceiptModalOpened(false)}>
                Done
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};

export default LeadPaymentSection;
