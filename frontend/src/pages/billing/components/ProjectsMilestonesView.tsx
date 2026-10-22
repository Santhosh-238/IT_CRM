import React, { useState, useEffect } from 'react';
import {
  Paper,
  Group,
  Stack,
  Text,
  Button,
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
  IconEdit,
  IconCheck,
  IconRefresh,
  IconFileInvoice,
  IconShieldCheck,
  IconFlag,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { BillingMilestone, SalesOrder } from '../../../types/billing';
import { billingService } from '../../../services/billingService';
import { MilestoneModal } from './MilestoneModal';

interface ProjectsMilestonesViewProps {
  onAddNew?: () => void;
  onOpenInvoiceForMilestone?: (milestone: BillingMilestone) => void;
  selectedOrderId?: string;
}

export const ProjectsMilestonesView: React.FC<ProjectsMilestonesViewProps> = ({
  onAddNew,
  onOpenInvoiceForMilestone,
  selectedOrderId,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [milestones, setMilestones] = useState<BillingMilestone[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>(selectedOrderId || 'All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [modalOpened, setModalOpened] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<BillingMilestone | null>(null);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const data = await billingService.getMilestones({
        salesOrderId: orderFilter !== 'All' ? orderFilter : undefined,
        status: statusFilter,
      });
      setMilestones(data || []);
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to load milestones' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    billingService.getSalesOrders().then((data) => {
      if (data) setOrders(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [orderFilter, statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      setLoading(true);
      await billingService.approveMilestone(id);
      notifications.show({
        color: 'green',
        title: 'Milestone Approved',
        message: 'Milestone is now approved and eligible for invoicing',
      });
      fetchMilestones();
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to approve milestone' });
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const sLow = status.toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (sLow === 'completed') {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (sLow === 'in progress') {
      bg = isDark ? 'rgba(6, 182, 212, 0.16)' : '#ECFEFF';
      color = isDark ? '#67E8F9' : '#0E7490';
      border = isDark ? 'rgba(6, 182, 212, 0.35)' : '#A5F3FC';
    } else if (sLow === 'pending') {
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
            <Select
              placeholder="Filter by Order"
              data={[
                { value: 'All', label: 'All Orders' },
                ...orders.map((o) => ({
                  value: o.id,
                  label: `${o.orderNumber} - ${o.contactName}`,
                })),
              ]}
              value={orderFilter}
              onChange={(v) => setOrderFilter(v || 'All')}
              size="sm"
              radius="md"
              style={{ minWidth: 260 }}
              searchable
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
                { value: 'Pending', label: 'Pending' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
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
              onClick={fetchMilestones}
              title="Refresh Milestones"
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
            Add Milestone
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

        {milestones.length === 0 && !loading ? (
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
                <IconFlag size={32} stroke={1.8} />
              </Box>
              <Text fw={700} size="lg" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                No Milestones Found
              </Text>
              <Text size="sm" c="dimmed" style={{ maxWidth: 420, textAlign: 'center' }}>
                No project milestones or billing phases found matching your filter criteria.
              </Text>
              <Button
                mt="xs"
                radius="md"
                leftSection={<IconFlag size={16} />}
                onClick={() => {
                  if (onAddNew) onAddNew();
                  else {
                    setEditingMilestone(null);
                    setModalOpened(true);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                + Add Milestone
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
                    PHASE / MILESTONE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    ORDER REF
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'center' }}>
                    SHARE %
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                    AMOUNT
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    DUE DATE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    EXECUTION STATUS
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    APPROVAL
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    BILLING STATUS
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                    ACTIONS
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {milestones.map((m) => (
                  <Table.Tr key={m.id}>
                    {/* Phase / Milestone Name */}
                    <Table.Td>
                      <Text fw={700} size="sm" style={{ color: isDark ? '#F9FAFB' : '#0F172A' }}>
                        {m.name}
                      </Text>
                      {m.description && (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {m.description}
                        </Text>
                      )}
                    </Table.Td>

                    {/* Order Ref */}
                    <Table.Td>
                      {m.salesOrder ? (
                        <div>
                          <Text fw={600} size="xs" style={{ color: isDark ? '#818CF8' : '#4F46E5' }}>
                            {m.salesOrder.orderNumber}
                          </Text>
                          <Text size="11px" c="dimmed">
                            {m.salesOrder.contactName}
                          </Text>
                        </div>
                      ) : (
                        <Text size="xs" c="dimmed">Direct Project</Text>
                      )}
                    </Table.Td>

                    {/* Share % */}
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Text fw={700} size="xs" style={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                        {m.percentage ? `${m.percentage}%` : '—'}
                      </Text>
                    </Table.Td>

                    {/* Amount */}
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text fw={700} size="sm" style={{ color: isDark ? '#10B981' : '#047857' }}>
                        ₹{Number(m.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Text>
                    </Table.Td>

                    {/* Due Date */}
                    <Table.Td>
                      <Text size="xs" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                        {m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </Text>
                    </Table.Td>

                    {/* Execution Status */}
                    <Table.Td>{renderStatusBadge(m.status)}</Table.Td>

                    {/* Approval */}
                    <Table.Td>
                      {m.isApproved ? (
                        <Box
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            borderRadius: 100,
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
                            color: isDark ? '#6EE7B7' : '#047857',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          <IconShieldCheck size={13} stroke={2.5} />
                          <span>Approved</span>
                        </Box>
                      ) : (
                        <Button
                          size="xs"
                          variant="light"
                          color="teal"
                          radius="md"
                          leftSection={<IconCheck size={13} />}
                          onClick={() => handleApprove(m.id)}
                          style={{ fontWeight: 600 }}
                        >
                          Approve
                        </Button>
                      )}
                    </Table.Td>

                    {/* Billing Status */}
                    <Table.Td>
                      {Number(m.invoicedAmount) > 0 ? (
                        <Box
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 100,
                            backgroundColor: isDark ? 'rgba(79, 70, 229, 0.16)' : '#EEF2FF',
                            color: isDark ? '#818CF8' : '#4F46E5',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Invoiced
                        </Box>
                      ) : m.isApproved ? (
                        <Box
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 100,
                            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB',
                            color: isDark ? '#FCD34D' : '#B45309',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Ready to Bill
                        </Box>
                      ) : (
                        <Text size="xs" c="dimmed">Awaiting Sign-off</Text>
                      )}
                    </Table.Td>

                    {/* Actions */}
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Group gap={6} justify="flex-end">
                        {m.isApproved && Number(m.invoicedAmount) === 0 && onOpenInvoiceForMilestone && (
                          <Tooltip label="Create Invoice for this Milestone">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              radius="md"
                              size="sm"
                              onClick={() => onOpenInvoiceForMilestone(m)}
                            >
                              <IconFileInvoice size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="Edit Milestone">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            radius="md"
                            size="sm"
                            onClick={() => {
                              setEditingMilestone(m);
                              setModalOpened(true);
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Modal */}
      <MilestoneModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingMilestone(null);
        }}
        milestone={editingMilestone}
        defaultSalesOrderId={orderFilter !== 'All' ? orderFilter : undefined}
        onSuccess={fetchMilestones}
      />
    </Stack>
  );
};
