import React, { useState } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Textarea,
  Text,
  Alert,
  Box,
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
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a specific reason for cancelling this invoice.');
      return;
    }

    try {
      setSubmitting(true);
      await billingService.cancelInvoice(invoice.id, reason.trim());

      notifications.show({
        title: 'Invoice Cancelled',
        message: `Invoice #${invoice.invoiceNumber} has been cancelled.`,
        color: 'gray',
        icon: <IconX size={18} />,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel invoice');
    } finally {
      setSubmitting(false);
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
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
            }}
          >
            <IconAlertTriangle size={20} />
          </Box>
          <Box>
            <Text fw={700} size="sm">
              Cancel Invoice
            </Text>
            <Text size="xs" c="dimmed">
              Invoice #{invoice.invoiceNumber}
            </Text>
          </Box>
        </Group>
      }
      centered
      radius="md"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md" mt="xs">
          <Alert color="red" variant="light" radius="md">
            Cancelling this invoice will void the document and zero out the outstanding balance of{' '}
            <b>₹{Number(invoice.outstandingBalance).toLocaleString('en-IN')}</b>. This action is irreversible.
          </Alert>

          {error && (
            <Alert color="red" radius="md">
              {error}
            </Alert>
          )}

          <Textarea
            label="Cancellation Reason"
            description="State the business rationale or revised proposal reference"
            placeholder="e.g. Scope revised by customer, superseded by quotation QUO-2026-1004, or duplicate draft..."
            required
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.currentTarget.value);
              setError(null);
            }}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Keep Active
            </Button>
            <Button
              type="submit"
              color="red"
              loading={submitting}
              leftSection={<IconX size={16} />}
              disabled={!reason.trim()}
            >
              Confirm Cancellation
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
