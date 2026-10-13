import React from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  Paper,
  Box,
  Button,
  SimpleGrid,
  useComputedColorScheme,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconPhoneCall,
  IconPhoneIncoming,
  IconPhoneOutgoing,
  IconClock,
  IconCalendar,
  IconUser,
  IconPhone,
  IconBuilding,
  IconEdit,
  IconTrash,
  IconNotes,
} from '@tabler/icons-react';
import { CallLog } from '../../../types/callLog';

interface CallDetailsModalProps {
  call: CallLog | null;
  opened: boolean;
  onClose: () => void;
  onEdit: (call: CallLog) => void;
  onDelete: (call: CallLog) => void;
}

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({
  call,
  opened,
  onClose,
  onEdit,
  onDelete,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  if (!call) return null;

  const isIncoming = call.callType === 'Incoming';

  const renderStatusBadge = (st: string) => {
    const s = st.toLowerCase();
    let bg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    let color = isDark ? '#93C5FD' : '#1D4ED8';
    let border = isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE';

    if (s.includes('complet')) {
      bg = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5';
      color = isDark ? '#6EE7B7' : '#047857';
      border = isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0';
    } else if (s.includes('miss')) {
      bg = isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2';
      color = isDark ? '#FCA5A5' : '#B91C1C';
      border = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
    } else if (s.includes('busy')) {
      bg = isDark ? 'rgba(249, 115, 22, 0.16)' : '#FFF7ED';
      color = isDark ? '#FB923C' : '#C2410C';
      border = isDark ? 'rgba(249, 115, 22, 0.35)' : '#FFEDD5';
    } else if (s.includes('no answer')) {
      bg = isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB';
      color = isDark ? '#FCD34D' : '#B45309';
      border = isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A';
    }

    return (
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: 100,
          backgroundColor: bg,
          color,
          border: `1px solid ${border}`,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {st}
      </Box>
    );
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } else {
          const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: isIncoming
                ? isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5'
                : isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isIncoming ? '#10B981' : '#2563EB',
            }}
          >
            {isIncoming ? <IconPhoneIncoming size={18} /> : <IconPhoneOutgoing size={18} />}
          </Box>
          <div>
            <Text fw={700} size="md">
              Call Details ({call.callId})
            </Text>
            <Text size="xs" c="dimmed">
              {call.callType} Call
            </Text>
          </div>
        </Group>
      }
      size="md"
      radius="lg"
    >
      <Stack gap="md" mt="xs">
        {/* Top Header Card */}
        <Paper
          p="md"
          radius="md"
          style={{
            background: isDark ? '#1E293B' : '#F8FAFC',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          }}
        >
          <Group justify="space-between" align="center">
            <div>
              <Text size="xs" fw={600} c="dimmed">
                Status
              </Text>
              <Box mt={4}>{renderStatusBadge(call.status)}</Box>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text size="xs" fw={600} c="dimmed">
                Duration
              </Text>
              <Text fw={700} size="md" mt={2} style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
                {call.duration}
              </Text>
            </div>
          </Group>
        </Paper>

        {/* Details Grid */}
        <SimpleGrid cols={2} spacing="md">
          {/* Assigned Employee */}
          <Paper
            p="sm"
            radius="md"
            style={{
              background: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid #374151' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconUser size={15} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text size="xs" fw={600} c="dimmed">
                Assigned Employee
              </Text>
            </Group>
            <Text fw={700} size="sm" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
              {call.employeeName}
            </Text>
          </Paper>

          {/* Contact Name */}
          <Paper
            p="sm"
            radius="md"
            style={{
              background: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid #374151' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconBuilding size={15} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text size="xs" fw={600} c="dimmed">
                Contact Name
              </Text>
            </Group>
            <Text fw={700} size="sm" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
              {call.contactName}
            </Text>
          </Paper>

          {/* Phone Number */}
          <Paper
            p="sm"
            radius="md"
            style={{
              background: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid #374151' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconPhone size={15} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text size="xs" fw={600} c="dimmed">
                Phone Number
              </Text>
            </Group>
            <Text fw={700} size="sm" style={{ color: isDark ? '#38BDF8' : '#0284C7' }}>
              {call.phoneNumber}
            </Text>
          </Paper>

          {/* Date & Time */}
          <Paper
            p="sm"
            radius="md"
            style={{
              background: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid #374151' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconCalendar size={15} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text size="xs" fw={600} c="dimmed">
                Date & Time
              </Text>
            </Group>
            <Text fw={700} size="sm" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
              {formatDisplayDate(call.callDate)} • {call.callTime}
            </Text>
          </Paper>
        </SimpleGrid>

        {/* Description / Notes */}
        {call.description && (
          <Paper
            p="sm"
            radius="md"
            style={{
              background: isDark ? '#1E293B' : '#F8FAFC',
              border: isDark ? '1px solid #374151' : '1px solid #E2E8F0',
            }}
          >
            <Group gap={6} mb={4}>
              <IconNotes size={15} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text size="xs" fw={600} c="dimmed">
                Notes / Discussion Summary
              </Text>
            </Group>
            <Text size="sm" style={{ color: isDark ? '#E2E8F0' : '#334155', whiteSpace: 'pre-wrap' }}>
              {call.description}
            </Text>
          </Paper>
        )}

        {/* Action Controls */}
        <Group justify="space-between" mt="sm">
          <Button
            color="red"
            variant="light"
            size="sm"
            radius="md"
            leftSection={<IconTrash size={15} />}
            onClick={() => {
              onClose();
              onDelete(call);
            }}
          >
            Delete
          </Button>

          <Group gap="xs">
            <Button
              variant="default"
              size="sm"
              radius="md"
              leftSection={<IconEdit size={15} />}
              onClick={() => {
                onClose();
                onEdit(call);
              }}
            >
              Edit Call
            </Button>
            <Button variant="default" size="sm" radius="md" onClick={onClose}>
              Close
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
