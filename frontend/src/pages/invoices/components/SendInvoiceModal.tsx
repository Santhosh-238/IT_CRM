import React, { useState } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  TextInput,
  Textarea,
  Text,
  Paper,
  Box,
  Divider,
  Badge,
} from '@mantine/core';
import { IconSend, IconMail, IconFileInvoice, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Invoice } from '../../../types/billing';
import { billingService } from '../../../services/billingService';

interface SendInvoiceModalProps {
  opened: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: () => void;
}

export const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  opened,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (invoice) {
      const email = invoice.contactEmail || 'accounts@client.com';
      setRecipientEmail(email);
      setSubject(`Tax Invoice #${invoice.invoiceNumber} from OmniTech Solutions`);
      setMessage(
        `Dear ${invoice.contactPerson || invoice.contactName},\n\nPlease find attached Tax Invoice #${invoice.invoiceNumber} dated ${invoice.invoiceDate} for ₹${Number(invoice.grandTotal).toLocaleString('en-IN')}.\n\nPayment Terms: ${invoice.paymentTerms || 'Net 30'}\nDue Date: ${invoice.dueDate}\n\nPlease transfer payment to the nominated bank account indicated on the invoice.\n\nBest Regards,\nBilling Operations Team\nOmniTech Solutions Pvt Ltd`
      );
    }
  }, [invoice, opened]);

  if (!invoice) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await billingService.sendInvoice(invoice.id);

      notifications.show({
        title: 'Invoice Sent',
        message: `Invoice #${invoice.invoiceNumber} has been transmitted to ${recipientEmail}.`,
        color: 'teal',
        icon: <IconCheck size={18} />,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      notifications.show({
        title: 'Transmission Failed',
        message: err.message || 'Could not send invoice email.',
        color: 'red',
      });
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
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
            }}
          >
            <IconMail size={20} />
          </Box>
          <Box>
            <Text fw={700} size="sm">
              Send Invoice via Email
            </Text>
            <Text size="xs" c="dimmed">
              Invoice #{invoice.invoiceNumber} • {invoice.companyName || invoice.contactName}
            </Text>
          </Box>
        </Group>
      }
      centered
      radius="md"
      size="lg"
    >
      <form onSubmit={handleSend}>
        <Stack gap="md" mt="xs">
          <TextInput
            label="Recipient Email Address"
            required
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.currentTarget.value)}
            leftSection={<IconMail size={16} />}
          />

          <TextInput
            label="Email Subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.currentTarget.value)}
          />

          <Textarea
            label="Message Body"
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
          />

          <Paper p="xs" radius="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <IconFileInvoice size={20} color="#2563EB" />
                <Box>
                  <Text size="xs" fw={700}>
                    {invoice.invoiceNumber}.pdf
                  </Text>
                  <Text size="10px" c="dimmed">
                    System Generated Digitally Signed Tax Invoice • ₹{Number(invoice.grandTotal).toLocaleString('en-IN')}
                  </Text>
                </Box>
              </Group>
              <Badge size="xs" color="blue" variant="light">
                Attached
              </Badge>
            </Group>
          </Paper>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="blue"
              loading={submitting}
              leftSection={<IconSend size={16} />}
            >
              Send Invoice
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
