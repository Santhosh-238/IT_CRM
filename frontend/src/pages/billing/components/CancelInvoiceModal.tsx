import React, { useState } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  Textarea,
  Alert,
  ActionIcon,
  Box,
  useComputedColorScheme,
} from '@mantine/core';
import { IconAlertTriangle, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Invoice } from '../../../types/billing';
import { billingService } from '../../../services/billingService';

interface CancelInvoiceModalProps {
  opened: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: () => void;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  opened,
  onClose,
  invoice,
  onSuccess,
}) => {
  const isDark = useComputedColorScheme('light') === 'dark';
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!invoice) return null;

  const handleCancel = async () => {
    if (!reason.trim()) {
      notifications.show({ color: 'red', message: 'Cancellation reason is required' });
      return;
    }

    try {
      setSubmitting(true);
      await billingService.cancelInvoice(invoice.id, reason);
      notifications.show({
        color: 'green',
        title: 'Invoice Cancelled',
        message: `Invoice ${invoice.invoiceNumber} marked as Cancelled`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to cancel invoice' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton={false}
      radius="lg"
      styles={{
        content: {
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.18)',
        },
        body: {
          padding: 24,
        },
      }}
      closeOnClickOutside={!submitting}
    >
      {/* Header matching existing CRM modals */}
      <Group justify="space-between" align="flex-start" mb="lg">
        <Group gap="md">
          <Box
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
            }}
          >
            <IconAlertTriangle size={22} stroke={1.8} />
          </Box>
          <div>
            <Text fw={800} size="19px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
              Cancel Tax Invoice
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Invoice #{invoice.invoiceNumber} • This action will mark it void
            </Text>
          </div>
        </Group>

        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          radius="100px"
          onClick={onClose}
        >
          <IconX size={18} />
        </ActionIcon>
      </Group>

      <Stack gap="md">
        <Alert color="red" radius="md" title="Audit & Accounting Warning" icon={<IconAlertTriangle size={16} />}>
          Cancelling an issued invoice will mark it void for accounting and audit purposes. If any project milestone is linked, it will be unlocked for re-billing.
        </Alert>

        <Textarea
          label="Mandatory Reason for Cancellation *"
          placeholder="e.g. Scope revised by client, incorrect GSTIN entered, or order cancelled..."
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          minRows={3}
          required
          radius="md"
        />

        <Group justify="flex-end" gap="sm" mt="sm">
          <Button
            variant="default"
            radius="md"
            onClick={onClose}
            disabled={submitting}
            style={{ fontWeight: 600, minWidth: 90 }}
          >
            Go Back
          </Button>
          <Button
            color="red"
            radius="md"
            loading={submitting}
            onClick={handleCancel}
            style={{ fontWeight: 600, minWidth: 150 }}
          >
            Confirm Cancellation
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
