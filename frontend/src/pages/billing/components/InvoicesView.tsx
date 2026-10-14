import React, { useState, useEffect } from 'react';
import {
  Paper,
  Group,
  Stack,
  Text,
  Button,
  TextInput,
  Select,
  Table,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Box,
  Center,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconPrinter,
  IconEdit,
  IconCash,
  IconX,
  IconRefresh,
  IconFileInvoice,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Invoice } from '../../../types/billing';
import { billingService } from '../../../services/billingService';
import { InvoiceModal } from './InvoiceModal';
import { InvoicePrintModal } from './InvoicePrintModal';
import { CancelInvoiceModal } from './CancelInvoiceModal';

interface InvoicesViewProps {
  onAddNew?: () => void;
  onRecordPayment?: (invoice: Invoice) => void;
  initialOrderId?: string;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onAddNew,
  onRecordPayment,
  initialOrderId,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals State
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await billingService.getInvoices({
        search: search.trim() || undefined,
        status: statusFilter,
        salesOrderId: initialOrderId || undefined,
      });
      setInvoices(data || []);
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to load invoices' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, initialOrderId]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchInvoices();
    }
  };

  const renderStatusBadge = (status: string, dueDate: string, balance: number) => {
    const isOverdue = new Date(dueDate) < new Date() && balance > 0 && status !== 'Cancelled' && status !== 'Paid';
    if (isOverdue) {
      return (
        <Box
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 12px',
            borderRadius: 100,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
            color: isDark ? '#FCA5A5' : '#DC2626',
            border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #FECACA',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          Overdue
        </Box>
      );
    }

    const sLow = status.toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (sLow === 'paid') {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (sLow === 'partially paid') {
      bg = isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB';
      color = isDark ? '#FCD34D' : '#B45309';
      border = isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A';
    } else if (sLow === 'issued') {
      bg = isDark ? 'rgba(79, 70, 229, 0.16)' : '#EEF2FF';
      color = isDark ? '#818CF8' : '#4F46E5';
      border = isDark ? 'rgba(79, 70, 229, 0.35)' : '#C7D2FE';
    } else if (sLow === 'cancelled') {
      bg = isDark ? 'rgba(148, 163, 184, 0.16)' : '#F1F5F9';
      color = isDark ? '#CBD5E1' : '#475569';
      border = isDark ? 'rgba(148, 163, 184, 0.35)' : '#E2E8F0';
    }

    return (
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 12px',
          borderRadius: 100,
          backgroundColor: bg,
          color,
          border: `1px solid ${border}`,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {status}
      </Box>
    );
  };

  return (
    <Stack gap="md">
      {/* 1. Filter Toolbar matching CallLogs / Contacts */}
      <Paper
        p="sm"
        radius="lg"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="xs" wrap="wrap" style={{ flex: 1 }}>
            <TextInput
              placeholder="Search by invoice #, client, company..."
              leftSection={<IconSearch size={15} color={isDark ? '#94A3B8' : '#64748B'} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              onKeyDown={handleSearchKeyDown}
              size="sm"
              radius="md"
              style={{ minWidth: 260 }}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                },
              }}
            />
            <Select
              placeholder="All Statuses"
              data={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Issued', label: 'Issued' },
                { value: 'Partially Paid', label: 'Partially Paid' },
                { value: 'Paid', label: 'Paid' },
                { value: 'Overdue', label: 'Overdue' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v || 'All')}
              size="sm"
              radius="md"
              style={{ width: 140 }}
              styles={{
                input: {
                  backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                },
              }}
            />
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              radius="md"
              onClick={fetchInvoices}
              title="Refresh Invoices"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>

          <Button
            leftSection={<IconPlus size={16} stroke={2.5} />}
            radius="md"
            size="sm"
            onClick={onAddNew || (() => setCreateModalOpened(true))}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 13,
              height: 36,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Create Tax Invoice
          </Button>
        </Group>
      </Paper>

      {/* 2. Table Container matching CallLogTableView */}
      <Paper
        radius="lg"
        style={{
          background: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 1px 4px rgba(0,0,0,0.03)',
          position: 'relative',
        }}
      >
        <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />

        {invoices.length === 0 && !loading ? (
          <Center p="3.5rem">
            <Stack align="center" gap="sm">
              <Box
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#818CF8' : '#4F46E5',
                }}
              >
                <IconFileInvoice size={32} stroke={1.8} />
              </Box>
              <Text fw={700} size="lg" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                No Tax Invoices Found
              </Text>
              <Text size="sm" c="dimmed" style={{ maxWidth: 420, textAlign: 'center' }}>
                No tax invoices match your filter criteria. Click below to generate an invoice.
              </Text>
              <Button
                mt="xs"
                radius="md"
                leftSection={<IconFileInvoice size={16} />}
                onClick={() => {
                  if (onAddNew) onAddNew();
                  else {
                    setEditingInvoice(null);
                    setCreateModalOpened(true);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                + Create Tax Invoice
              </Button>
            </Stack>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={850}>
            <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
              <Table.Thead
                style={{
                  background: isDark ? '#0F172A' : '#FBFBFC',
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
                }}
              >
                <Table.Tr>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    INVOICE NUMBER
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    CLIENT / COMPANY
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    ISSUE DATE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    DUE DATE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                    TOTAL AMOUNT
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                    PAID AMOUNT
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                    BALANCE DUE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    STATUS
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                    ACTIONS
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {invoices.map((inv) => {
                  const initialLetter = (inv.contactName || 'C').charAt(0).toUpperCase();

                  return (
                    <Table.Tr key={inv.id}>
                      {/* Invoice Number */}
                      <Table.Td>
                        <Text
                          fw={700}
                          size="sm"
                          style={{
                            color: isDark ? '#818CF8' : '#4F46E5',
                            cursor: 'pointer',
                          }}
                          onClick={() => setPrintingInvoice(inv)}
                        >
                          {inv.invoiceNumber}
                        </Text>
                        {inv.milestoneName && (
                          <Text size="11px" c="dimmed">
                            Phase: {inv.milestoneName}
                          </Text>
                        )}
                      </Table.Td>

                      {/* Client / Company with Avatar Box */}
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Box
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              background: isDark ? '#1E293B' : '#EEF2FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isDark ? '#818CF8' : '#4F46E5',
                              fontWeight: 700,
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {initialLetter}
                          </Box>
                          <div>
                            <Text fw={700} size="sm" style={{ color: isDark ? '#F9FAFB' : '#0F172A' }}>
                              {inv.contactName}
                            </Text>
                            {inv.companyName && (
                              <Text size="xs" c="dimmed">
                                {inv.companyName}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Table.Td>

                      {/* Issue Date */}
                      <Table.Td>
                        <Text size="xs" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                          {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </Table.Td>

                      {/* Due Date */}
                      <Table.Td>
                        <Text
                          size="xs"
                          fw={new Date(inv.dueDate) < new Date() && inv.outstandingBalance > 0 ? 700 : 500}
                          style={{
                            color: new Date(inv.dueDate) < new Date() && inv.outstandingBalance > 0 ? '#EF4444' : isDark ? '#94A3B8' : '#64748B',
                          }}
                        >
                          {new Date(inv.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </Table.Td>

                      {/* Total */}
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text fw={700} size="sm" style={{ color: isDark ? '#F9FAFB' : '#0F172A' }}>
                          ₹{Number(inv.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </Table.Td>

                      {/* Paid */}
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text fw={600} size="sm" style={{ color: isDark ? '#10B981' : '#047857' }}>
                          ₹{Number(inv.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </Table.Td>

                      {/* Balance */}
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text
                          fw={800}
                          size="sm"
                          style={{
                            color: inv.outstandingBalance > 0 ? '#EF4444' : '#10B981',
                          }}
                        >
                          ₹{Number(inv.outstandingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </Table.Td>

                      {/* Status */}
                      <Table.Td>{renderStatusBadge(inv.status, inv.dueDate, inv.outstandingBalance)}</Table.Td>

                      {/* Actions */}
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap={6} justify="flex-end">
                          <Tooltip label="Print / View Tax Invoice">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              radius="md"
                              size="sm"
                              onClick={() => setPrintingInvoice(inv)}
                            >
                              <IconPrinter size={16} />
                            </ActionIcon>
                          </Tooltip>

                          {inv.status !== 'Paid' && inv.status !== 'Cancelled' && onRecordPayment && (
                            <Tooltip label="Record Payment for Invoice">
                              <ActionIcon
                                variant="subtle"
                                color="teal"
                                radius="md"
                                size="sm"
                                onClick={() => onRecordPayment(inv)}
                              >
                                <IconCash size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}

                          {inv.status !== 'Cancelled' && inv.amountPaid === 0 && (
                            <Tooltip label="Cancel Invoice">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                radius="md"
                                size="sm"
                                onClick={() => setCancellingInvoice(inv)}
                              >
                                <IconX size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}

                          {inv.status !== 'Cancelled' && inv.status !== 'Paid' && (
                            <Tooltip label="Edit Invoice">
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                radius="md"
                                size="sm"
                                onClick={() => {
                                  setEditingInvoice(inv);
                                  setCreateModalOpened(true);
                                }}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Modals */}
      <InvoiceModal
        opened={createModalOpened}
        onClose={() => {
          setCreateModalOpened(false);
          setEditingInvoice(null);
        }}
        invoice={editingInvoice}
        defaultSalesOrderId={initialOrderId}
        onSuccess={fetchInvoices}
      />

      <InvoicePrintModal
        opened={Boolean(printingInvoice)}
        onClose={() => setPrintingInvoice(null)}
        invoice={printingInvoice}
      />

      <CancelInvoiceModal
        opened={Boolean(cancellingInvoice)}
        onClose={() => setCancellingInvoice(null)}
        invoice={cancellingInvoice}
        onSuccess={fetchInvoices}
      />
    </Stack>
  );
};
