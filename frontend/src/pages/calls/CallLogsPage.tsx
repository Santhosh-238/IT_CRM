import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Group,
  TextInput,
  Select,
  Button,
  Text,
  ActionIcon,
  Modal,
  Pagination,
  useComputedColorScheme,
  UnstyledButton,
  Paper,
  Center,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconSearch,
  IconPlus,
  IconX,
  IconAlertTriangle,
  IconPhoneCall,
} from '@tabler/icons-react';
import { CallLog, CallLogStats } from '../../types/callLog';
import {
  fetchCallLogsApi,
  fetchCallLogStatsApi,
  createCallLogApi,
  updateCallLogApi,
  deleteCallLogApi,
} from '../../services/callLogService';
import { useEmployee } from '../../context/EmployeeContext';
import { useContact } from '../../context/ContactContext';
import { useLead } from '../../context/LeadContext';
import { contactService } from '../../services/contactService';
import { Contact } from '../../types/contact';
import { CallLogTableView } from './components/CallLogTableView';
import { CallLogModal } from './components/CallLogModal';
import {
  DateFilterControl,
  DateFilterValue,
  DEFAULT_DATE_FILTER,
  isDateMatchingFilter,
} from '../../components/common/DateFilterControl';
import { CallDetailsModal } from './components/CallDetailsModal';

type ActiveCallTabType = 'ALL' | 'INCOMING' | 'OUTGOING' | 'COMPLETED' | 'MISSED';

export const CallLogsPage: React.FC = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  // Contexts
  const { employees, fetchEmployees } = useEmployee();
  const { contacts: contextContacts } = useContact();
  const { leads } = useLead();
  const [allContacts, setAllContacts] = useState<Contact[]>([]);

  // Call Logs & Stats State
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [stats, setStats] = useState<CallLogStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters State
  const [callTab, setCallTab] = useState<ActiveCallTabType>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(DEFAULT_DATE_FILTER);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Modals State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCall, setEditingCall] = useState<CallLog | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [detailsCall, setDetailsCall] = useState<CallLog | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<CallLog | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Load Contacts list if context is empty or limited
  useEffect(() => {
    if (contextContacts && contextContacts.length > 0) {
      setAllContacts(contextContacts);
    } else {
      contactService
        .getContacts({ limit: 100 })
        .then((res) => {
          if (res?.data) setAllContacts(res.data);
        })
        .catch(() => {});
    }
  }, [contextContacts]);

  // Load Call Logs & Stats
  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetchCallLogsApi(),
        fetchCallLogStatsApi().catch(() => null),
      ]);
      setCalls(logsRes.calls || []);
      if (statsRes) setStats(statsRes);
      if (fetchEmployees) fetchEmployees();
    } catch (err: any) {
      notifications.show({
        title: 'Error Loading Call Logs',
        message: err.message || 'Could not fetch call records',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Calls list based on tab, search, and status dropdown
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      // 1. Tab filter
      if (callTab === 'INCOMING' && call.callType.toLowerCase() !== 'incoming') return false;
      if (callTab === 'OUTGOING' && call.callType.toLowerCase() !== 'outgoing') return false;
      if (callTab === 'COMPLETED' && call.status.toLowerCase() !== 'completed') return false;
      if (callTab === 'MISSED' && call.status.toLowerCase() !== 'missed') return false;

      // 2. Status dropdown filter
      if (statusFilter !== 'All') {
        if (call.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // 3. Date filter (Day-wise & Month-wise)
      if (!isDateMatchingFilter(call.callDate || call.createdAt, dateFilter)) {
        return false;
      }

      // 4. Search query
      if (searchInput.trim()) {
        const query = searchInput.toLowerCase();
        const matchEmp = (call.employeeName || '').toLowerCase().includes(query);
        const matchContact = (call.contactName || '').toLowerCase().includes(query);
        const matchPhone = (call.phoneNumber || '').toLowerCase().includes(query);
        const matchId = (call.callId || '').toLowerCase().includes(query);
        const matchNotes = (call.description || '').toLowerCase().includes(query);
        const matchStatus = (call.status || '').toLowerCase().includes(query);
        if (!matchEmp && !matchContact && !matchPhone && !matchId && !matchNotes && !matchStatus) {
          return false;
        }
      }

      return true;
    });
  }, [calls, callTab, statusFilter, dateFilter, searchInput]);

  // Pagination for Calls list
  const totalPages = Math.ceil(filteredCalls.length / pageSize) || 1;
  const paginatedCalls = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCalls.slice(start, start + pageSize);
  }, [filteredCalls, page, pageSize]);

  // Counts for Top Capsule Tabs
  const totalCount = calls.length;
  const incomingCount = useMemo(() => calls.filter((c) => c.callType.toLowerCase() === 'incoming').length, [calls]);
  const outgoingCount = useMemo(() => calls.filter((c) => c.callType.toLowerCase() === 'outgoing').length, [calls]);
  const completedCount = useMemo(() => calls.filter((c) => c.status.toLowerCase() === 'completed').length, [calls]);
  const missedCount = useMemo(() => calls.filter((c) => c.status.toLowerCase() === 'missed').length, [calls]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingCall(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (call: CallLog) => {
    setEditingCall(call);
    setModalOpen(true);
  };

  const handleSaveCall = async (payload: Partial<CallLog>) => {
    setSubmitting(true);
    try {
      if (editingCall) {
        await updateCallLogApi(editingCall.id, payload);
        notifications.show({
          title: 'Call Record Updated',
          message: 'Call log details have been updated successfully.',
          color: 'blue',
        });
      } else {
        await createCallLogApi(payload);
        notifications.show({
          title: 'Call Logged Successfully',
          message: 'New call record has been saved to the database.',
          color: 'teal',
        });
      }

      setModalOpen(false);
      setEditingCall(null);
      await loadData();
    } catch (err: any) {
      notifications.show({
        title: 'Save Failed',
        message: err.message || 'Could not save call record.',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCallLogApi(deleteTarget.id);
      notifications.show({
        title: 'Call Record Deleted',
        message: 'Call log has been removed from database.',
        color: 'blue',
      });
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      notifications.show({
        title: 'Delete Failed',
        message: err.message || 'Could not delete call record.',
        color: 'red',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const statusDropdownOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Missed', label: 'Missed' },
    { value: 'Busy', label: 'Busy' },
    { value: 'No Answer', label: 'No Answer' },
  ];

  return (
    <Box p={{ base: 'xs', sm: 'sm', md: 'md' }} style={{ width: '100%', maxWidth: '100%' }}>
      {/* ========================================================================= */}
      {/* TOP CONTROLS BAR - Exact Meetings Module Aesthetics                       */}
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
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          {/* Left Capsule Filter Tabs */}
          <Box
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              padding: 3,
              borderRadius: 10,
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
            }}
          >
            {[
              { id: 'ALL' as ActiveCallTabType, label: 'All', count: totalCount },
              { id: 'INCOMING' as ActiveCallTabType, label: 'Incoming', count: incomingCount },
              { id: 'OUTGOING' as ActiveCallTabType, label: 'Outgoing', count: outgoingCount },
              { id: 'COMPLETED' as ActiveCallTabType, label: 'Completed', count: completedCount },
              { id: 'MISSED' as ActiveCallTabType, label: 'Missed', count: missedCount },
            ].map((tab) => {
              const active = callTab === tab.id;
              return (
                <UnstyledButton
                  key={tab.id}
                  onClick={() => {
                    setCallTab(tab.id);
                    setPage(1);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active ? (isDark ? '#0F172A' : '#FFFFFF') : 'transparent',
                    color: active ? (isDark ? '#818CF8' : '#4F46E5') : isDark ? '#94A3B8' : '#64748B',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  <Box
                    style={{
                      minWidth: 20,
                      height: 20,
                      padding: '0 6px',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: active
                        ? isDark
                          ? '#4338CA'
                          : '#4F46E5'
                        : isDark
                        ? '#334155'
                        : '#CBD5E1',
                      color: active ? '#FFFFFF' : isDark ? '#94A3B8' : '#475569',
                    }}
                  >
                    {tab.count}
                  </Box>
                </UnstyledButton>
              );
            })}
          </Box>

          {/* Right Search, Dropdown & Log Call Button */}
          <Group gap="xs" wrap="wrap">
            <TextInput
              placeholder="Search by caller, contact, phone..."
              leftSection={<IconSearch size={15} color={isDark ? '#94A3B8' : '#64748B'} />}
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.currentTarget.value);
                setPage(1);
              }}
              size="sm"
              radius="md"
              styles={{
                input: {
                  backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                  borderColor: isDark ? '#374151' : '#E2E8F0',
                  color: isDark ? '#F1F5F9' : '#0F172A',
                  fontSize: 13,
                  height: 36,
                },
              }}
              style={{ width: 230 }}
              rightSection={
                searchInput ? (
                  <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setSearchInput('')}>
                    <IconX size={12} />
                  </ActionIcon>
                ) : null
              }
            />

            <Select
              data={statusDropdownOptions}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val || 'All');
                setPage(1);
              }}
              size="sm"
              radius="md"
              styles={{
                input: {
                  backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                  borderColor: isDark ? '#374151' : '#E2E8F0',
                  color: isDark ? '#F1F5F9' : '#0F172A',
                  fontSize: 13,
                  height: 36,
                },
              }}
              style={{ width: 140 }}
              allowDeselect={false}
            />

            {/* Date Filter: Day-wise & Month-wise */}
            <DateFilterControl
              value={dateFilter}
              onChange={(val) => {
                setDateFilter(val);
                setPage(1);
              }}
              width={135}
            />

            <Button
              leftSection={<IconPlus size={16} />}
              radius="md"
              size="sm"
              onClick={handleOpenAddModal}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 13,
                height: 36,
                border: 'none',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
              }}
            >
              Log Call
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* ========================================================================= */}
      {/* CALL LOGS TABLE VIEW                                                      */}
      {/* ========================================================================= */}
      {loading ? (
        <Paper
          p="4rem"
          radius="lg"
          style={{
            background: isDark ? '#111827' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            textAlign: 'center',
          }}
        >
          <Center>
            <Loader size="md" color="indigo" />
          </Center>
        </Paper>
      ) : (
        <>
          <CallLogTableView
            calls={paginatedCalls}
            onEdit={handleOpenEditModal}
            onDelete={(call) => setDeleteTarget(call)}
            onAddNew={handleOpenAddModal}
            onViewDetails={(call) => setDetailsCall(call)}
            loading={loading}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <Group justify="space-between" align="center" mt="md" wrap="wrap">
              <Text size="xs" c="dimmed">
                Showing {paginatedCalls.length} of {filteredCalls.length} call records
              </Text>
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                size="sm"
                radius="md"
                color="indigo"
              />
            </Group>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* LOG CALL / EDIT CALL MODAL                                                */}
      {/* ========================================================================= */}
      <CallLogModal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCall(null);
        }}
        onSave={handleSaveCall}
        editingCall={editingCall}
        employees={employees}
        contacts={allContacts}
        leads={leads}
        submitting={submitting}
      />

      {/* ========================================================================= */}
      {/* CALL DETAILS MODAL                                                        */}
      {/* ========================================================================= */}
      <CallDetailsModal
        call={detailsCall}
        opened={!!detailsCall}
        onClose={() => setDetailsCall(null)}
        onEdit={(call) => {
          setDetailsCall(null);
          handleOpenEditModal(call);
        }}
        onDelete={(call) => {
          setDetailsCall(null);
          setDeleteTarget(call);
        }}
      />

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      <Modal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={
          <Group gap="xs">
            <IconAlertTriangle size={20} color="#EF4444" />
            <Text fw={700} size="md" c="red">
              Delete Call Record
            </Text>
          </Group>
        }
        size="sm"
        radius="lg"
      >
        <Text size="sm" mb="md" c={isDark ? '#E2E8F0' : '#475569'}>
          Are you sure you want to delete call record{' '}
          <Text span fw={700} c={isDark ? '#FFFFFF' : '#0F172A'}>
            {deleteTarget?.callId}
          </Text>
          ? This action cannot be undone.
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" radius="md" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button color="red" radius="md" loading={deleteLoading} onClick={handleConfirmDelete}>
            Delete Call
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};
