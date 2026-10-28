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
  IconArrowRightCircle,
  IconRefresh,
  IconCheck,
  IconCalculator,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Quotation } from '../../../types/billing';
import { billingService } from '../../../services/billingService';
import { QuotationModal } from './QuotationModal';
import { QuotationPrintModal } from './QuotationPrintModal';

interface QuotationsViewProps {
  onAddNew?: () => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({ onAddNew }) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [printingQuotation, setPrintingQuotation] = useState<Quotation | null>(null);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const data = await billingService.getQuotations({
        search: search.trim() || undefined,
        status: statusFilter,
      });
      setQuotations(data || []);
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to load quotations' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchQuotations();
    }
  };

  const handleConvertToOrder = async (quote: Quotation) => {
    try {
      setLoading(true);
      const order = await billingService.convertQuotationToOrder(quote.id, {
        billingMethod: 'Milestone',
      });
      notifications.show({
        color: 'green',
        title: 'Quotation Converted',
        message: `Successfully converted into Sales Order ${order.orderNumber}`,
      });
      fetchQuotations();
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to convert quotation' });
    } finally {
      setLoading(false);
    }
  };

  // Status Badge matching existing modules (Meetings, Calls, Contacts)
  const renderStatusBadge = (status: string) => {
    const sLow = status.toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (sLow === 'accepted') {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (sLow === 'sent') {
      bg = isDark ? 'rgba(79, 70, 229, 0.16)' : '#EEF2FF';
      color = isDark ? '#818CF8' : '#4F46E5';
      border = isDark ? 'rgba(79, 70, 229, 0.35)' : '#C7D2FE';
    } else if (sLow === 'draft') {
      bg = isDark ? 'rgba(148, 163, 184, 0.16)' : '#F1F5F9';
      color = isDark ? '#CBD5E1' : '#475569';
      border = isDark ? 'rgba(148, 163, 184, 0.35)' : '#E2E8F0';
    } else if (sLow === 'rejected') {
      bg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#B91C1C';
      border = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
    } else if (sLow === 'expired') {
      bg = isDark ? 'rgba(249, 115, 22, 0.16)' : '#FFF7ED';
      color = isDark ? '#FB923C' : '#C2410C';
      border = isDark ? 'rgba(249, 115, 22, 0.35)' : '#FFEDD5';
    } else if (sLow.includes('changes') || sLow.includes('required')) {
      bg = isDark ? 'rgba(249, 115, 22, 0.16)' : '#FFF7ED';
      color = isDark ? '#FB923C' : '#EA580C';
      border = isDark ? 'rgba(249, 115, 22, 0.35)' : '#FED7AA';
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
              placeholder="Search by quote #, client, company..."
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
                { value: 'Sent', label: 'Sent' },
                { value: 'Accepted', label: 'Accepted' },
                { value: 'Rejected', label: 'Rejected' },
                { value: 'Expired', label: 'Expired' },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v || 'All')}
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
              onClick={fetchQuotations}
              title="Refresh Quotations"
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
            Create Quotation
          </Button>
        </Group>
      </Paper>

      {/* 2. Table Container matching CallLogTableView / ContactTableView */}
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

        {quotations.length === 0 && !loading ? (
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
                <IconCalculator size={32} stroke={1.8} />
              </Box>
              <Text fw={700} size="lg" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                No Quotations Found
              </Text>
              <Text size="sm" c="dimmed" style={{ maxWidth: 420, textAlign: 'center' }}>
                No quotation records match your filter criteria. Click below to create a new quotation.
              </Text>
              <Button
                mt="xs"
                radius="md"
                leftSection={<IconCalculator size={16} />}
                onClick={() => {
                  if (onAddNew) onAddNew();
                  else {
                    setEditingQuotation(null);
                    setCreateModalOpened(true);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                + Create Quotation
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
                    QUOTE NUMBER
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    CLIENT / COMPANY
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    DATE
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    VALID UNTIL
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                    TOTAL AMOUNT
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    STATUS
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    ORDER CONVERSION
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'right' }}>
                    ACTIONS
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {quotations.map((q) => {
                  const initialLetter = (q.contactName || 'C').charAt(0).toUpperCase();

                  return (
                    <Table.Tr key={q.id}>
                      {/* Quote Number */}
                      <Table.Td>
                        <Text
                          fw={700}
                          size="sm"
                          style={{
                            color: isDark ? '#818CF8' : '#4F46E5',
                            cursor: 'pointer',
                          }}
                          onClick={() => setPrintingQuotation(q)}
                        >
                          {q.quotationNumber}
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
                              {q.contactName}
                            </Text>
                            {q.companyName && (
                              <Text size="xs" c="dimmed">
                                {q.companyName}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Table.Td>

                      {/* Date */}
                      <Table.Td>
                        <Text size="xs" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                          {new Date(q.quotationDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </Table.Td>

                      {/* Valid Until */}
                      <Table.Td>
                        <Text
                          size="xs"
                          fw={new Date(q.validUntil) < new Date() ? 700 : 500}
                          style={{
                            color: new Date(q.validUntil) < new Date() ? '#EF4444' : isDark ? '#94A3B8' : '#64748B',
                          }}
                        >
                          {new Date(q.validUntil).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </Table.Td>

                      {/* Total */}
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text fw={700} size="sm" style={{ color: isDark ? '#10B981' : '#047857' }}>
                          ₹{Number(q.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </Table.Td>

                      {/* Status */}
                      <Table.Td>{renderStatusBadge(q.status)}</Table.Td>

                      {/* Conversion */}
                      <Table.Td>
                        {q.convertedToOrderId ? (
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
                            <IconCheck size={13} stroke={2.5} />
                            <span>Converted</span>
                          </Box>
                        ) : (
                          <Button
                            size="xs"
                            variant="subtle"
                            color="indigo"
                            radius="md"
                            leftSection={<IconArrowRightCircle size={14} />}
                            onClick={() => handleConvertToOrder(q)}
                            style={{ fontWeight: 600 }}
                          >
                            Convert
                          </Button>
                        )}
                      </Table.Td>

                      {/* Actions */}
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap={6} justify="flex-end">
                          <Tooltip label="Print / View Quotation">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              radius="md"
                              size="sm"
                              onClick={() => setPrintingQuotation(q)}
                            >
                              <IconPrinter size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Edit Quotation">
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              radius="md"
                              size="sm"
                              onClick={() => {
                                setEditingQuotation(q);
                                setCreateModalOpened(true);
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

      {/* Modals */}
      <QuotationModal
        opened={createModalOpened}
        onClose={() => {
          setCreateModalOpened(false);
          setEditingQuotation(null);
        }}
        quotation={editingQuotation}
        onSuccess={fetchQuotations}
      />

      <QuotationPrintModal
        opened={Boolean(printingQuotation)}
        onClose={() => setPrintingQuotation(null)}
        quotation={printingQuotation}
      />
    </Stack>
  );
};
