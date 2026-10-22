import React, { useState } from 'react';
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
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Lead } from '../../../../types/lead';
import { LeadPaymentRecord, LeadInvoiceItem } from './types';

export interface LeadPaymentSectionProps {
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
            COLLECTION RATIO
          </Text>
          <Text size="22px" fw={900} style={{ color: '#6366F1' }}>
            {totalInvoiced > 0 ? `${Math.round((totalCollected / totalInvoiced) * 100)}%` : '0%'}
          </Text>
          <Text size="11px" c="dimmed" mt={2}>
            Progressive release schedule
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Payment Records Table */}
      <Paper
        p="md"
        radius="16px"
        style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.03)',
        }}
      >
        <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr style={{ borderBottom: isDark ? '1px solid #334155' : '1px solid #E2E8F0' }}>
              <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                RECEIPT #
              </Table.Th>
              <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                DATE
              </Table.Th>
              <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                INVOICE
              </Table.Th>
              <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                PAYMENT METHOD
              </Table.Th>
              <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                REF / TXN ID
              </Table.Th>
              <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                AMOUNT
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
            {payments.map((p) => (
              <Table.Tr key={p.id} style={{ borderBottom: isDark ? '1px solid #1E293B' : '1px solid #F1F5F9' }}>
                <Table.Td>
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="xl" color="teal" variant="light">
                      <IconReceipt size={12} />
                    </ThemeIcon>
                    <Text fw={700} size="13px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                      {p.receiptNumber}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="13px" c="dimmed">
                    {p.date}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge size="sm" variant="outline" color="blue">
                    {p.invoiceNumber}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={6}>
                    {p.method.includes('Bank') ? (
                      <IconBuildingBank size={14} color="#6366F1" />
                    ) : p.method.includes('UPI') ? (
                      <IconQrcode size={14} color="#10B981" />
                    ) : (
                      <IconCreditCard size={14} color="#F59E0B" />
                    )}
                    <Text size="13px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
                      {p.method}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="12px" ff="monospace" c="dimmed">
                    {p.referenceId}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={800} size="14px" style={{ color: '#10B981' }}>
                    ₹{p.amount.toLocaleString('en-IN')}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge size="sm" color="teal" variant="filled">
                    {p.status} ✓
                  </Badge>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<IconDownload size={13} />}
                    onClick={() => handleDownloadReceipt(p)}
                    style={{ borderRadius: 6, fontWeight: 600 }}
                  >
                    Receipt
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
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
            label="Received Amount (INR ₹)"
            placeholder="e.g. 47790"
            value={amount}
            onChange={(val) => setAmount(Number(val) || 0)}
            min={0}
            required
          />

          <Select
            label="Payment Method"
            data={['Bank Transfer (NEFT/IMPS)', 'UPI', 'Credit Card', 'Cheque']}
            value={method}
            onChange={(val) => setMethod(val as any)}
            required
          />

          <Select
            label="Allocated Invoice"
            data={invoices.map((inv) => ({ value: inv.invoiceNumber, label: `${inv.invoiceNumber} - ${inv.title} (₹${inv.totalAmount.toLocaleString('en-IN')})` }))}
            value={linkedInvoice}
            onChange={(val) => setLinkedInvoice(val || '')}
            required
          />

          <TextInput
            label="UTR / Bank Transaction Reference"
            placeholder="e.g. HDFC00392817"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            required
          />

          <TextInput
            label="Payment Notes"
            placeholder="Optional reference notes"
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

export default LeadPaymentSection;
