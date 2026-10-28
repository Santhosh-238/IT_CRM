import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Box,
  Divider,
  Grid,
  Table,
  ActionIcon,
  Timeline,
  Card,
  Progress,
  useComputedColorScheme,
  Tooltip,
  SegmentedControl,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconPrinter,
  IconDownload,
  IconSend,
  IconCash,
  IconEdit,
  IconX,
  IconCheck,
  IconBuilding,
  IconFileInvoice,
  IconClock,
  IconAlertCircle,
  IconReceipt,
  IconReceipt2,
} from '@tabler/icons-react';
import { Invoice, BillingSettings } from '../../types/billing';
import { InvoiceStatusBadge, PaymentStatusBadge } from './components/InvoiceStatusBadge';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { CancelInvoiceModal } from './components/CancelInvoiceModal';
import { SendInvoiceModal } from './components/SendInvoiceModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { InvoiceDocument } from '../billing/components/InvoiceDocument';
import { billingService } from '../../services/billingService';
import { notifications } from '@mantine/notifications';
import { useInvoicePdfDownload } from '../../hooks/useInvoicePdfDownload';

interface InvoiceDetailsPageProps {
  invoice: Invoice;
  onBack: () => void;
  onEdit: (invoice: Invoice) => void;
  onRefresh?: () => void;
}

export const InvoiceDetailsPage: React.FC<InvoiceDetailsPageProps> = ({
  invoice: initialInvoice,
  onBack,
  onEdit,
  onRefresh,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [loading, setLoading] = useState(false);

  const [recordPaymentOpened, setRecordPaymentOpened] = useState(false);
  const [cancelModalOpened, setCancelModalOpened] = useState(false);
  const [sendModalOpened, setSendModalOpened] = useState(false);
  const [printModalOpened, setPrintModalOpened] = useState(false);
  const [activeView, setActiveView] = useState<'document' | 'crm'>('document');
  const [settings, setSettings] = useState<BillingSettings | null>(null);

  const { triggerDownload, HiddenInvoiceDownloadContainer } = useInvoicePdfDownload();

  useEffect(() => {
    billingService.getSettings().then((res) => {
      if (res) setSettings(res);
    }).catch(() => {});
  }, []);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const data = await billingService.getInvoiceById(invoice.id);
      if (data) {
        setInvoice(data);
      }
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to refresh invoice details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoice.id]);

  const currencySymbol = invoice.currency === 'USD' ? '$' : invoice.currency === 'EUR' ? '€' : '₹';
  const outstanding = Number(invoice.outstandingBalance || 0);
  const grandTotal = Number(invoice.grandTotal || 0);
  const amountPaid = Number(invoice.amountPaid || 0);
  const paymentProgress = grandTotal > 0 ? Math.min(100, Math.round((amountPaid / grandTotal) * 100)) : 0;

  const isInterState = invoice.taxType === 'INTER_STATE';
  const isIntraState = invoice.taxType === 'INTRA_STATE' || (!invoice.taxType && invoice.clientGst?.startsWith('33'));
  const halfTax = (Number(invoice.taxAmount) / 2).toFixed(2);

  return (
    <Box pb={60}>
      {/* Top Header & Actions Bar */}
      <Paper
        p="md"
        radius="md"
        withBorder
        mb="lg"
        style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="sm">
            <ActionIcon variant="subtle" size="lg" radius="md" onClick={onBack}>
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Box>
              <Group gap="xs" align="center">
                <Title order={3} fw={800} style={{ letterSpacing: '-0.02em' }}>
                  Invoice #{invoice.invoiceNumber}
                </Title>
                <InvoiceStatusBadge status={invoice.status} size="md" />
                {invoice.paymentStatus && <PaymentStatusBadge status={invoice.paymentStatus} size="sm" />}
              </Group>
              <Text size="xs" c="dimmed">
                Billed to <b>{invoice.companyName || invoice.contactName}</b> • Created on {invoice.invoiceDate}
              </Text>
            </Box>
          </Group>

          {/* Quick Actions */}
          <Group gap="xs" wrap="wrap">
            <Button
              variant="default"
              size="sm"
              leftSection={<IconDownload size={16} />}
              onClick={() => triggerDownload(invoice)}
            >
              Download PDF
            </Button>

            <Button
              variant="default"
              size="sm"
              leftSection={<IconPrinter size={16} />}
              onClick={() => setPrintModalOpened(true)}
            >
              Print
            </Button>

            {invoice.status !== 'Cancelled' && (
              <Button
                variant="outline"
                color="blue"
                size="sm"
                leftSection={<IconSend size={16} />}
                onClick={() => setSendModalOpened(true)}
              >
                Send Invoice
              </Button>
            )}

            {invoice.status === 'Draft' && (
              <Button
                variant="outline"
                color="teal"
                size="sm"
                leftSection={<IconEdit size={16} />}
                onClick={() => onEdit(invoice)}
              >
                Edit Invoice
              </Button>
            )}

            {outstanding > 0 && invoice.status !== 'Cancelled' && (
              <Button
                color="teal"
                size="sm"
                leftSection={<IconCash size={16} />}
                onClick={() => setRecordPaymentOpened(true)}
              >
                Record Payment
              </Button>
            )}

            {invoice.status !== 'Cancelled' && invoice.status !== 'Paid' && (
              <Button
                color="red"
                variant="subtle"
                size="sm"
                leftSection={<IconX size={16} />}
                onClick={() => setCancelModalOpened(true)}
              >
                Cancel Invoice
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* View Toggle Bar */}
      <Group justify="center" mb="lg">
        <SegmentedControl
          value={activeView}
          onChange={(val: any) => setActiveView(val)}
          size="sm"
          radius="md"
          data={[
            { label: 'Invoice Document Preview', value: 'document' },
            { label: 'CRM Details & Management', value: 'crm' },
          ]}
          styles={{
            root: {
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            },
          }}
        />
      </Group>

      {activeView === 'document' ? (
        <Box style={{ maxWidth: 880, margin: '0 auto', boxShadow: '0 8px 30px rgba(0,0,0,0.07)' }}>
          <InvoiceDocument invoice={invoice} settings={settings} />
        </Box>
      ) : (
        /* Main Grid: Left Details & Items, Right Summary & Payments */
        <Grid gutter="lg">
        {/* Left Column */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="lg">
            {/* Customer & Invoice Information Cards */}
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" radius="md" withBorder style={{ height: '100%', background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
                  <Group gap="xs" mb="xs">
                    <IconBuilding size={18} color="#0284C7" />
                    <Text size="xs" fw={800} c="#0284C7" tt="uppercase" style={{ letterSpacing: '0.04em' }}>
                      Customer & Billing Profile
                    </Text>
                  </Group>
                  <Divider mb="sm" />
                  <Text size="sm" fw={800} c={isDark ? '#FFFFFF' : '#0F172A'}>
                    {invoice.companyName || invoice.contactName}
                  </Text>
                  {invoice.contactPerson && (
                    <Text size="xs" fw={600} c="dimmed">
                      Contact: {invoice.contactPerson}
                    </Text>
                  )}
                  {invoice.customerId && (
                    <Badge size="xs" color="blue" variant="light" mt={4} mb={6}>
                      ID: {invoice.customerId}
                    </Badge>
                  )}
                  <Stack gap={3} mt="xs">
                    {invoice.contactEmail && (
                      <Text size="xs" c="dimmed">
                        <b>Email:</b> {invoice.contactEmail}
                      </Text>
                    )}
                    {invoice.contactPhone && (
                      <Text size="xs" c="dimmed">
                        <b>Phone:</b> {invoice.contactPhone}
                      </Text>
                    )}
                    {invoice.clientAddress && (
                      <Text size="xs" c="dimmed">
                        <b>Address:</b> {invoice.clientAddress}
                      </Text>
                    )}
                    {invoice.clientGst && (
                      <Text size="xs" fw={700} c={isDark ? '#93C5FD' : '#1D4ED8'} mt={2}>
                        <b>GSTIN:</b> {invoice.clientGst}
                      </Text>
                    )}
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" radius="md" withBorder style={{ height: '100%', background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
                  <Group gap="xs" mb="xs">
                    <IconFileInvoice size={18} color="#0284C7" />
                    <Text size="xs" fw={800} c="#0284C7" tt="uppercase" style={{ letterSpacing: '0.04em' }}>
                      Invoice Terms & Metadata
                    </Text>
                  </Group>
                  <Divider mb="sm" />
                  <Table variant="unstyled" style={{ fontSize: 12 }}>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td style={{ padding: '3px 0', color: 'gray' }}>Invoice Date:</Table.Td>
                        <Table.Td style={{ padding: '3px 0', fontWeight: 700, textAlign: 'right' }}>{invoice.invoiceDate}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td style={{ padding: '3px 0', color: 'gray' }}>Due Date:</Table.Td>
                        <Table.Td style={{ padding: '3px 0', fontWeight: 800, color: '#DC2626', textAlign: 'right' }}>{invoice.dueDate}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td style={{ padding: '3px 0', color: 'gray' }}>Payment Terms:</Table.Td>
                        <Table.Td style={{ padding: '3px 0', fontWeight: 600, textAlign: 'right' }}>{invoice.paymentTerms || 'Net 30'}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td style={{ padding: '3px 0', color: 'gray' }}>Invoice Type:</Table.Td>
                        <Table.Td style={{ padding: '3px 0', fontWeight: 600, textAlign: 'right' }}>{invoice.invoiceType || 'One-Time'}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td style={{ padding: '3px 0', color: 'gray' }}>Tax Structure:</Table.Td>
                        <Table.Td style={{ padding: '3px 0', fontWeight: 700, textAlign: 'right', color: '#0284C7' }}>
                          {invoice.taxType === 'INTRA_STATE' ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td style={{ padding: '3px 0', color: 'gray' }}>Created By:</Table.Td>
                        <Table.Td style={{ padding: '3px 0', fontWeight: 600, textAlign: 'right' }}>{invoice.createdBy || 'Admin'}</Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Grid.Col>
            </Grid>

            {/* Itemized Services / Products Table */}
            <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
              <Group justify="space-between" mb="sm" align="center">
                <Group gap="xs">
                  <IconReceipt size={18} color="#0284C7" />
                  <Text size="sm" fw={800}>
                    Itemized Services & Products
                  </Text>
                </Group>
                <Badge size="sm" color="blue" variant="light">
                  {invoice.items?.length || 0} Line Items
                </Badge>
              </Group>
              <Divider mb="md" />

              <Box style={{ overflowX: 'auto' }}>
                <Table withTableBorder withColumnBorders style={{ fontSize: 13, minWidth: 600 }}>
                  <Table.Thead style={{ background: isDark ? 'var(--mantine-color-dark-6)' : '#F8FAFC' }}>
                    <Table.Tr>
                      <Table.Th style={{ width: 40, textAlign: 'center' }}>#</Table.Th>
                      <Table.Th>Item / Service Description</Table.Th>
                      <Table.Th style={{ width: 70, textAlign: 'center' }}>Qty</Table.Th>
                      <Table.Th style={{ width: 110, textAlign: 'right' }}>Unit Price</Table.Th>
                      <Table.Th style={{ width: 80, textAlign: 'right' }}>Disc</Table.Th>
                      <Table.Th style={{ width: 80, textAlign: 'center' }}>Tax Rate</Table.Th>
                      <Table.Th style={{ width: 120, textAlign: 'right' }}>Line Total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((it, idx) => (
                        <Table.Tr key={it.id || idx}>
                          <Table.Td style={{ textAlign: 'center', color: 'gray' }}>{idx + 1}</Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={700}>
                              {it.itemName}
                            </Text>
                            {it.description && (
                              <Text size="11px" c="dimmed" style={{ lineHeight: 1.3 }}>
                                {it.description}
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center', fontWeight: 600 }}>{it.quantity}</Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>
                            {currencySymbol}{Number(it.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right', color: it.discount > 0 ? 'orange' : 'gray' }}>
                            {it.discount > 0 ? `-${currencySymbol}${Number(it.discount).toLocaleString('en-IN')}` : '—'}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center', fontWeight: 600, color: '#0284C7' }}>
                            {it.taxRate}%
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right', fontWeight: 800, color: '#0284C7' }}>
                            {currencySymbol}{Number(it.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Table.Td>
                        </Table.Tr>
                      ))
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>
                          No line items found.
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Box>
            </Paper>

            {/* Notes & Terms */}
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
                  <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb="xs">
                    Customer Notes
                  </Text>
                  <Text size="xs" style={{ whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                    {invoice.notes || 'No customer notes added.'}
                  </Text>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
                  <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb="xs">
                    Internal Remarks (Private)
                  </Text>
                  <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                    {invoice.internalRemarks || 'No internal remarks recorded.'}
                  </Text>
                </Paper>
              </Grid.Col>
            </Grid>

            {/* Activity History Timeline */}
            <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
              <Group gap="xs" mb="sm">
                <IconClock size={18} color="#0284C7" />
                <Text size="sm" fw={800}>
                  Activity & Audit Trail
                </Text>
              </Group>
              <Divider mb="md" />

              {invoice.activityLogs && invoice.activityLogs.length > 0 ? (
                <Timeline active={invoice.activityLogs.length} bulletSize={24} lineWidth={2}>
                  {invoice.activityLogs.map((log: any, idx: number) => (
                    <Timeline.Item
                      key={log.id || idx}
                      bullet={<IconCheck size={12} />}
                      title={log.action}
                      color="blue"
                    >
                      <Text size="xs" c="dimmed" mt={2}>
                        {log.details}
                      </Text>
                      <Text size="10px" c="dimmed" mt={2}>
                        By {log.performedBy || 'System'} • {new Date(log.createdAt).toLocaleString()}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Text size="xs" c="dimmed">
                  Invoice initialized and recorded in system audit log.
                </Text>
              )}
            </Paper>
          </Stack>
        </Grid.Col>

        {/* Right Column: Amount Summary & Payment Records */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="lg">
            {/* Amount Summary Card */}
            <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
              <Text size="xs" fw={800} c="#0284C7" tt="uppercase" mb="xs" style={{ letterSpacing: '0.04em' }}>
                Tax & Amount Summary
              </Text>
              <Divider mb="sm" />

              <Stack gap={8}>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Subtotal:</Text>
                  <Text size="xs" fw={700}>
                    {currencySymbol}{Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>

                {invoice.discountAmount > 0 && (
                  <Group justify="space-between">
                    <Text size="xs" c="orange">Total Discount:</Text>
                    <Text size="xs" fw={700} c="orange">
                      -{currencySymbol}{Number(invoice.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>
                )}

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Taxable Amount:</Text>
                  <Text size="xs" fw={700}>
                    {currencySymbol}{Number(invoice.subtotal - invoice.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>

                <Divider my={2} />

                {isIntraState ? (
                  <>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">CGST (9%):</Text>
                      <Text size="xs" fw={600} c="blue">
                        {currencySymbol}{invoice.cgstAmount ? invoice.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : halfTax}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">SGST (9%):</Text>
                      <Text size="xs" fw={600} c="blue">
                        {currencySymbol}{invoice.sgstAmount ? invoice.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : halfTax}
                      </Text>
                    </Group>
                  </>
                ) : (
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">IGST (18%):</Text>
                    <Text size="xs" fw={600} c="blue">
                      {currencySymbol}{Number(invoice.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>
                )}

                {(Number(invoice.additionalCharges) || 0) > 0 && (
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Additional Charges:</Text>
                    <Text size="xs" fw={600}>
                      {currencySymbol}{Number(invoice.additionalCharges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>
                )}

                <Divider my={4} color="#CBD5E1" />

                <Group justify="space-between">
                  <Text size="sm" fw={800}>Grand Total:</Text>
                  <Text size="md" fw={900} c="#0284C7">
                    {currencySymbol}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Text size="xs" fw={600} c="teal">Amount Paid:</Text>
                  <Text size="xs" fw={700} c="teal">
                    {currencySymbol}{amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>

                <Box mt={2}>
                  <Group justify="space-between" mb={2}>
                    <Text size="10px" c="dimmed">Payment Progress</Text>
                    <Text size="10px" fw={700} c={paymentProgress === 100 ? 'teal' : 'blue'}>{paymentProgress}%</Text>
                  </Group>
                  <Progress value={paymentProgress} color={paymentProgress === 100 ? 'teal' : 'blue'} size="sm" radius="xl" />
                </Box>

                <Divider my={2} />

                <Group justify="space-between" pt={2}>
                  <Text size="sm" fw={800} c="red">Balance Due:</Text>
                  <Text size="md" fw={900} c="red">
                    {currencySymbol}{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            {/* Payment History Card */}
            <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" fw={800} c="#0284C7" tt="uppercase" style={{ letterSpacing: '0.04em' }}>
                  Payment Records & Allocations
                </Text>
                {outstanding > 0 && invoice.status !== 'Cancelled' && (
                  <Button
                    size="xs"
                    color="teal"
                    variant="light"
                    leftSection={<IconCash size={12} />}
                    onClick={() => setRecordPaymentOpened(true)}
                  >
                    + Record
                  </Button>
                )}
              </Group>
              <Divider mb="sm" />

              {invoice.allocations && invoice.allocations.length > 0 ? (
                <Stack gap="xs">
                  {invoice.allocations.map((alloc: any, idx: number) => {
                    const pay = alloc.payment || {};
                    return (
                      <Paper key={alloc.id || idx} p="xs" radius="sm" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-6)' : '#F8FAFC' }}>
                        <Group justify="space-between" align="flex-start">
                          <Box>
                            <Text size="xs" fw={700} c="teal">
                              +{currencySymbol}{Number(alloc.amountAllocated || pay.amountReceived || 0).toLocaleString('en-IN')}
                            </Text>
                            <Text size="11px" fw={600} mt={1}>
                              {pay.paymentMethod || 'Bank Transfer'} • {pay.paymentNumber || 'Receipt'}
                            </Text>
                            {pay.transactionReference && (
                              <Text size="10px" c="dimmed">
                                UTR: {pay.transactionReference}
                              </Text>
                            )}
                          </Box>
                          <Text size="10px" c="dimmed" fw={600}>
                            {pay.paymentDate || 'Recorded'}
                          </Text>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Box py="sm" style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">
                    No payment records yet.
                  </Text>
                  {outstanding > 0 && invoice.status !== 'Cancelled' && (
                    <Button
                      size="xs"
                      color="teal"
                      variant="subtle"
                      mt="xs"
                      onClick={() => setRecordPaymentOpened(true)}
                    >
                      Record First Payment
                    </Button>
                  )}
                </Box>
              )}
            </Paper>

            {/* Bank Details Card */}
            <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
              <Text size="xs" fw={800} c="#0284C7" tt="uppercase" mb="xs" style={{ letterSpacing: '0.04em' }}>
                Bank Settlement Account
              </Text>
              <Divider mb="sm" />

              <Stack gap={4} style={{ fontSize: 12 }}>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Beneficiary:</Text>
                  <Text size="xs" fw={700}>{invoice.bankDetails?.accountHolderName || 'OmniTech Solutions Pvt Ltd'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Bank:</Text>
                  <Text size="xs" fw={600}>{invoice.bankDetails?.bankName || 'HDFC Bank'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Account #:</Text>
                  <Text size="xs" fw={800} style={{ letterSpacing: '0.03em' }}>{invoice.bankDetails?.accountNumber || '50200012345678'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">IFSC Code:</Text>
                  <Text size="xs" fw={800} c="blue">{invoice.bankDetails?.ifscCode || 'HDFC0001234'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">UPI ID:</Text>
                  <Text size="xs" fw={700} c="teal">{invoice.bankDetails?.upiId || 'omnitech@hdfcbank'}</Text>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
      )}

      {/* Modals */}
      <RecordPaymentModal
        opened={recordPaymentOpened}
        onClose={() => setRecordPaymentOpened(false)}
        invoice={invoice}
        onSuccess={() => {
          fetchInvoiceDetails();
          if (onRefresh) onRefresh();
        }}
      />

      <CancelInvoiceModal
        opened={cancelModalOpened}
        onClose={() => setCancelModalOpened(false)}
        invoice={invoice}
        onSuccess={() => {
          fetchInvoiceDetails();
          if (onRefresh) onRefresh();
        }}
      />

      <SendInvoiceModal
        opened={sendModalOpened}
        onClose={() => setSendModalOpened(false)}
        invoice={invoice}
        onSuccess={() => {
          fetchInvoiceDetails();
          if (onRefresh) onRefresh();
        }}
      />

      <InvoicePrintModal
        opened={printModalOpened}
        onClose={() => setPrintModalOpened(false)}
        invoice={invoice}
      />

      {/* Hidden PDF Generation Container */}
      {HiddenInvoiceDownloadContainer}
    </Box>
  );
};
