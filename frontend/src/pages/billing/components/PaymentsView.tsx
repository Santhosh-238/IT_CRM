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
  IconRefresh,
  IconCash,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Payment } from '../../../types/billing';
import { billingService } from '../../../services/billingService';
import { PaymentModal } from './PaymentModal';

interface PaymentsViewProps {
  onAddNew?: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ onAddNew }) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');

  // Modal State
  const [modalOpened, setModalOpened] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await billingService.getPayments({
        search: search.trim() || undefined,
        paymentMethod: methodFilter,
      });
      setPayments(data || []);
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to load payments' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchPayments();
    }
  };

  // Payment Method Pill Badge
  const renderMethodBadge = (method: string) => {
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (method === 'UPI') {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (method === 'Cheque') {
      bg = isDark ? 'rgba(249, 115, 22, 0.16)' : '#FFF7ED';
      color = isDark ? '#FB923C' : '#C2410C';
      border = isDark ? 'rgba(249, 115, 22, 0.35)' : '#FFEDD5';
    } else if (method === 'Cash') {
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
        {method}
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
              placeholder="Search by payment #, client, UTR / ref..."
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
              placeholder="All Methods"
              data={[
                { value: 'All', label: 'All Methods' },
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Cheque', label: 'Cheque' },
                { value: 'Cash', label: 'Cash' },
              ]}
              value={methodFilter}
              onChange={(v) => setMethodFilter(v || 'All')}
              size="sm"
              radius="md"
              style={{ width: 150 }}
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
              onClick={fetchPayments}
              title="Refresh Payments"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>

          <Button
            leftSection={<IconPlus size={16} stroke={2.5} />}
            radius="md"
            size="sm"
            onClick={onAddNew || (() => setModalOpened(true))}
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
            Record Payment
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

        {payments.length === 0 && !loading ? (
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
                <IconCash size={32} stroke={1.8} />
              </Box>
              <Text fw={700} size="lg" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                No Payments Recorded
              </Text>
              <Text size="sm" c="dimmed" style={{ maxWidth: 420, textAlign: 'center' }}>
                No payment transactions found matching your criteria.
              </Text>
              <Button
                mt="xs"
                radius="md"
                leftSection={<IconCash size={16} />}
                onClick={() => {
                  if (onAddNew) onAddNew();
                  else setModalOpened(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                + Record Payment
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
                    PAYMENT #
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    CLIENT NAME
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    DATE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    METHOD
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    TRANSACTION / UTR #
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    BANK
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                    AMOUNT RECEIVED
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    ALLOCATIONS
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {payments.map((p) => {
                  const initialLetter = (p.clientName || 'C').charAt(0).toUpperCase();

                  return (
                    <Table.Tr key={p.id}>
                      {/* Payment Number */}
                      <Table.Td>
                        <Text fw={700} size="sm" style={{ color: isDark ? '#818CF8' : '#4F46E5' }}>
                          {p.paymentNumber}
                        </Text>
                      </Table.Td>

                      {/* Client with Avatar Box */}
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
                          <Text fw={700} size="sm" style={{ color: isDark ? '#F9FAFB' : '#0F172A' }}>
                            {p.clientName}
                          </Text>
                        </Group>
                      </Table.Td>

                      {/* Date */}
                      <Table.Td>
                        <Text size="xs" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </Table.Td>

                      {/* Method */}
                      <Table.Td>{renderMethodBadge(p.paymentMethod)}</Table.Td>

                      {/* Reference */}
                      <Table.Td>
                        <Text size="xs" style={{ color: p.transactionReference ? (isDark ? '#F9FAFB' : '#0F172A') : 'dimmed' }}>
                          {p.transactionReference || '—'}
                        </Text>
                      </Table.Td>

                      {/* Bank */}
                      <Table.Td>
                        <Text size="xs" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                          {p.bankName || '—'}
                        </Text>
                      </Table.Td>

                      {/* Amount */}
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text fw={800} size="sm" style={{ color: isDark ? '#10B981' : '#047857' }}>
                          ₹{Number(p.amountReceived).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </Table.Td>

                      {/* Allocations */}
                      <Table.Td>
                        {p.allocations && p.allocations.length > 0 ? (
                          <Group gap={4}>
                            {p.allocations.map((a, i) => (
                              <Box
                                key={i}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                                  color: isDark ? '#93C5FD' : '#2563EB',
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                {a.invoice?.invoiceNumber || 'Inv'}: ₹{Number(a.amountAllocated).toLocaleString('en-IN')}
                              </Box>
                            ))}
                          </Group>
                        ) : (
                          <Text size="11px" c="dimmed">Direct / Unallocated</Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Modal */}
      <PaymentModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSuccess={fetchPayments}
      />
    </Stack>
  );
};
