import React, { useRef } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Box,
  Divider,
  Table,
  Badge,
} from '@mantine/core';
import { IconPrinter, IconDownload, IconX } from '@tabler/icons-react';
import { Quotation } from '../../../types/billing';

interface QuotationPrintModalProps {
  opened: boolean;
  onClose: () => void;
  quotation: Quotation | null;
}

export const QuotationPrintModal: React.FC<QuotationPrintModalProps> = ({
  opened,
  onClose,
  quotation,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const statusColors: Record<string, string> = {
    Draft: 'gray',
    Sent: 'blue',
    Accepted: 'green',
    Rejected: 'red',
    Expired: 'orange',
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group justify="space-between" style={{ width: '100%' }}>
          <Text fw={700} size="md">
            Quotation Document: {quotation.quotationNumber}
          </Text>
          <Group gap="xs">
            <Button
              leftSection={<IconPrinter size={16} />}
              size="xs"
              variant="filled"
              color="blue"
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
          </Group>
        </Group>
      }
      centered
      radius="md"
    >
      <Box p="md">
        {/* Printable Paper Canvas */}
        <Paper
          ref={printRef}
          p="xl"
          withBorder
          radius="sm"
          className="printable-document"
          style={{
            background: '#FFFFFF',
            color: '#0F172A',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <Group justify="space-between" align="flex-start" mb="xl">
            <Box>
              <Group gap="xs" align="center" mb={6}>
                <Box
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#0EA5E9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 18,
                  }}
                >
                  OA
                </Box>
                <Text fw={900} size="xl" c="#0F172A" style={{ letterSpacing: '-0.02em' }}>
                  OneAssist <Text span inherit c="#0EA5E9">CRM</Text>
                </Text>
              </Group>
              <Text size="xs" c="#475569" fw={500}>OneAssist Technologies Pvt Ltd</Text>
              <Text size="xs" c="#64748B">104, Tech Park, Guindy, Chennai - 600032</Text>
              <Text size="xs" c="#64748B">GSTIN: 33AAAAA0000A1Z5 | PAN: AAAAA0000A</Text>
              <Text size="xs" c="#64748B">billing@oneassist.tech | +91 44 2233 4455</Text>
            </Box>

            <Box style={{ textAlign: 'right' }}>
              <Text fw={900} size="22px" c="#0EA5E9" style={{ letterSpacing: '0.04em' }}>
                FORMAL QUOTATION
              </Text>
              <Text fw={700} size="sm" c="#1E293B">#{quotation.quotationNumber}</Text>
              <Group gap={6} justify="flex-end" mt={4}>
                <Text size="xs" c="#64748B">Status:</Text>
                <Badge size="sm" color={statusColors[quotation.status] || 'blue'}>
                  {quotation.status}
                </Badge>
              </Group>
              <Text size="xs" c="#64748B" mt={4}>
                Date: {new Date(quotation.quotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
              <Text size="xs" c="#DC2626" fw={600}>
                Valid Until: {new Date(quotation.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </Box>
          </Group>

          <Divider mb="lg" color="#E2E8F0" />

          {/* Client & Billing Info */}
          <Group justify="space-between" align="flex-start" mb="xl">
            <Box style={{ maxWidth: '60%' }}>
              <Text size="11px" fw={800} c="#64748B" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                QUOTATION FOR:
              </Text>
              <Text fw={800} size="md" c="#0F172A" mt={2}>
                {quotation.contactName}
              </Text>
              {quotation.companyName && (
                <Text fw={600} size="sm" c="#334155">
                  {quotation.companyName}
                </Text>
              )}
              {quotation.clientAddress && (
                <Text size="xs" c="#64748B" mt={2}>
                  {quotation.clientAddress}
                </Text>
              )}
              {quotation.clientGst && (
                <Text size="xs" c="#475569" fw={600} mt={2}>
                  GSTIN: {quotation.clientGst}
                </Text>
              )}
              {quotation.contactEmail && (
                <Text size="xs" c="#64748B">Email: {quotation.contactEmail}</Text>
              )}
              {quotation.contactPhone && (
                <Text size="xs" c="#64748B">Phone: {quotation.contactPhone}</Text>
              )}
            </Box>

            <Box style={{ textAlign: 'right' }}>
              <Text size="11px" fw={800} c="#64748B" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                PAYMENT TERMS:
              </Text>
              <Text fw={700} size="sm" c="#0F172A" mt={2}>
                {quotation.paymentTerms || 'Net 30 Days'}
              </Text>
              <Text size="xs" c="#64748B" mt={4}>
                Currency: INR (₹)
              </Text>
            </Box>
          </Group>

          {/* Items Table */}
          <Table
            withTableBorder
            withColumnBorders
            mb="lg"
            styles={{
              table: { borderColor: '#E2E8F0', color: '#0F172A' },
              th: { background: '#F8FAFC', color: '#334155', fontWeight: 700, fontSize: 12 },
              td: { fontSize: 12, color: '#1E293B' },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40, textAlign: 'center' }}>#</Table.Th>
                <Table.Th>Item & Description</Table.Th>
                <Table.Th style={{ width: 70, textAlign: 'center' }}>Qty</Table.Th>
                <Table.Th style={{ width: 110, textAlign: 'right' }}>Rate (₹)</Table.Th>
                <Table.Th style={{ width: 90, textAlign: 'right' }}>Disc (₹)</Table.Th>
                <Table.Th style={{ width: 75, textAlign: 'center' }}>GST</Table.Th>
                <Table.Th style={{ width: 120, textAlign: 'right' }}>Amount (₹)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {quotation.items?.map((item, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td style={{ textAlign: 'center' }}>{idx + 1}</Table.Td>
                  <Table.Td>
                    <Text fw={700} size="xs" c="#0F172A">{item.itemName}</Text>
                    {item.description && (
                      <Text size="11px" c="#64748B">{item.description}</Text>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>{item.quantity}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    {Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    {Number(item.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>{item.taxRate}%</Table.Td>
                  <Table.Td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {Number(item.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {/* Totals Summary */}
          <Group justify="space-between" align="flex-start" mb="xl">
            <Box style={{ maxWidth: '55%' }}>
              {quotation.termsConditions && (
                <Box mb="md">
                  <Text size="11px" fw={800} c="#64748B" tt="uppercase" mb={4}>
                    Terms & Conditions:
                  </Text>
                  <Text size="xs" c="#475569" style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                    {quotation.termsConditions}
                  </Text>
                </Box>
              )}
              {quotation.notes && (
                <Box>
                  <Text size="11px" fw={800} c="#64748B" tt="uppercase" mb={4}>
                    Notes:
                  </Text>
                  <Text size="xs" c="#475569">
                    {quotation.notes}
                  </Text>
                </Box>
              )}
            </Box>

            <Box style={{ width: 260 }}>
              <Stack gap={6}>
                <Group justify="space-between">
                  <Text size="xs" c="#64748B">Subtotal:</Text>
                  <Text size="xs" fw={600} c="#0F172A">
                    ₹{Number(quotation.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
                {Number(quotation.discountAmount) > 0 && (
                  <Group justify="space-between">
                    <Text size="xs" c="#DC2626">Discount:</Text>
                    <Text size="xs" fw={600} c="#DC2626">
                      -₹{Number(quotation.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>
                )}
                <Group justify="space-between">
                  <Text size="xs" c="#64748B">Tax (GST):</Text>
                  <Text size="xs" fw={600} c="#0F172A">
                    ₹{Number(quotation.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
                <Divider color="#E2E8F0" />
                <Group justify="space-between">
                  <Text size="sm" fw={800} c="#0F172A">Grand Total:</Text>
                  <Text size="md" fw={900} c="#0EA5E9">
                    ₹{Number(quotation.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
              </Stack>
            </Box>
          </Group>

          {/* Signature Block */}
          <Divider mb="lg" color="#E2E8F0" />
          <Group justify="space-between" align="flex-end" pt="lg">
            <Box>
              <Text size="xs" c="#64748B">Customer Acceptance (Sign & Seal)</Text>
              <Box style={{ height: 40 }} />
              <Text size="xs" c="#94A3B8">Authorized Signatory</Text>
            </Box>
            <Box style={{ textAlign: 'right' }}>
              <Text size="xs" c="#64748B">For OneAssist Technologies Pvt Ltd</Text>
              <Box style={{ height: 40 }} />
              <Text size="xs" fw={700} c="#0F172A">Authorized Signatory</Text>
            </Box>
          </Group>
        </Paper>
      </Box>

      {/* Embedded print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-document, .printable-document * {
            visibility: visible !important;
          }
          .printable-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </Modal>
  );
};
