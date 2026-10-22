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
  Progress,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconRefresh,
  IconFileSpreadsheet,
  IconFlag,
  IconFileInvoice,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { SalesOrder } from '../../../types/billing';
import { billingService } from '../../../services/billingService';
import { SalesOrderModal } from './SalesOrderModal';

interface SalesOrdersViewProps {
  onAddNew?: () => void;
  onOpenMilestoneModal?: (orderId: string) => void;
  onOpenInvoiceModal?: (orderId: string) => void;
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({
  onAddNew,
  onOpenMilestoneModal,
  onOpenInvoiceModal,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');

  // Modal State
  const [modalOpened, setModalOpened] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await billingService.getSalesOrders({
        search: search.trim() || undefined,
        status: statusFilter,
        billingMethod: methodFilter,
      });
      setOrders(data || []);
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to load sales orders' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, methodFilter]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchOrders();
    }
  };

  // Status Badge matching existing modules
  const renderStatusBadge = (status: string) => {
    const sLow = status.toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (sLow === 'completed') {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (sLow === 'confirmed') {
      bg = isDark ? 'rgba(79, 70, 229, 0.16)' : '#EEF2FF';
      color = isDark ? '#818CF8' : '#4F46E5';
      border = isDark ? 'rgba(79, 70, 229, 0.35)' : '#C7D2FE';
    } else if (sLow === 'in progress') {
      bg = isDark ? 'rgba(6, 182, 212, 0.16)' : '#ECFEFF';
      color = isDark ? '#67E8F9' : '#0E7490';
      border = isDark ? 'rgba(6, 182, 212, 0.35)' : '#A5F3FC';
    } else if (sLow === 'cancelled') {
      bg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#B91C1C';
      border = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
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
              placeholder="Search by order #, client, company..."
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
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
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
            <Select
              placeholder="All Methods"
              data={[
                { value: 'All', label: 'All Methods' },
                { value: 'Milestone', label: 'Milestone' },
                { value: 'Fixed Price', label: 'Fixed Price' },
                { value: 'Product', label: 'Product' },
              ]}
              value={methodFilter}
              onChange={(v) => setMethodFilter(v || 'All')}
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
              onClick={fetchOrders}
              title="Refresh Orders"
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
            Create Sales Order
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

        {orders.length === 0 && !loading ? (
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
                <IconFileSpreadsheet size={32} stroke={1.8} />
              </Box>
              <Text fw={700} size="lg" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                No Sales Orders Found
              </Text>
              <Text size="sm" c="dimmed" style={{ maxWidth: 420, textAlign: 'center' }}>
                No active sales orders or contracts match your filters.
              </Text>
              <Button
                mt="xs"
                radius="md"
                leftSection={<IconFileSpreadsheet size={16} />}
                onClick={() => {
                  if (onAddNew) onAddNew();
                  else {
                    setEditingOrder(null);
                    setModalOpened(true);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                + Create Sales Order
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
                    ORDER NUMBER
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    CLIENT / COMPANY
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    METHOD
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    ORDER DATE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                    CONTRACT VALUE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    INVOICED PROGRESS
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
                {orders.map((o) => {
                  const initialLetter = (o.contactName || 'C').charAt(0).toUpperCase();
                  const invoicedSum = o.invoices?.reduce((acc, inv) => inv.status !== 'Cancelled' ? acc + (Number(inv.grandTotal) || 0) : acc, 0) || 0;
                  const invoicedPercent = o.contractValue > 0 ? Math.min(100, (invoicedSum / o.contractValue) * 100) : 0;

                  return (
                    <Table.Tr key={o.id}>
                      {/* Order Number */}
                      <Table.Td>
                        <Text fw={700} size="sm" style={{ color: isDark ? '#818CF8' : '#4F46E5' }}>
                          {o.orderNumber}
                        </Text>
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
                              {o.contactName}
                            </Text>
                            {o.companyName && (
                              <Text size="xs" c="dimmed">
                                {o.companyName}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Table.Td>

                      {/* Method */}
                      <Table.Td>
                        <Box
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 6,
                            backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                            color: isDark ? '#93C5FD' : '#2563EB',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {o.billingMethod}
                        </Box>
                      </Table.Td>

                      {/* Order Date */}
                      <Table.Td>
                        <Text size="xs" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                          {new Date(o.orderDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </Table.Td>

                      {/* Contract Value */}
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text fw={700} size="sm" style={{ color: isDark ? '#10B981' : '#047857' }}>
                          ₹{Number(o.contractValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </Table.Td>

                      {/* Invoiced Progress */}
                      <Table.Td style={{ minWidth: 140 }}>
                        <Group justify="space-between" mb={2}>
                          <Text size="11px" c="dimmed">₹{invoicedSum.toLocaleString('en-IN')}</Text>
                          <Text size="11px" fw={700} style={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                            {invoicedPercent.toFixed(0)}%
                          </Text>
                        </Group>
                        <Progress
                          value={invoicedPercent}
                          size="xs"
                          radius="xl"
                          color={invoicedPercent >= 100 ? 'teal' : 'indigo'}
                        />
                      </Table.Td>

                      {/* Status */}
                      <Table.Td>{renderStatusBadge(o.status)}</Table.Td>

                      {/* Actions */}
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap={6} justify="flex-end">
                          {o.billingMethod === 'Milestone' && onOpenMilestoneModal && (
                            <Tooltip label="Manage Milestones">
                              <ActionIcon
                                variant="subtle"
                                color="cyan"
                                radius="md"
                                size="sm"
                                onClick={() => onOpenMilestoneModal(o.id)}
                              >
                                <IconFlag size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          {onOpenInvoiceModal && (
                            <Tooltip label="Create Invoice">
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                radius="md"
                                size="sm"
                                onClick={() => onOpenInvoiceModal(o.id)}
                              >
                                <IconFileInvoice size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          <Tooltip label="Edit Order">
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              radius="md"
                              size="sm"
                              onClick={() => {
                                setEditingOrder(o);
                                setModalOpened(true);
                              }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
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

      {/* Modal */}
      <SalesOrderModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingOrder(null);
        }}
        order={editingOrder}
        onSuccess={fetchOrders}
      />
    </Stack>
  );
};
