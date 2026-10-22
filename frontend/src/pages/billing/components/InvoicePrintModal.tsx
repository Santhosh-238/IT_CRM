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
import { IconPrinter } from '@tabler/icons-react';
import { Invoice } from '../../../types/billing';

interface InvoicePrintModalProps {
  opened: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  opened,
  onClose,
  invoice,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const statusColors: Record<string, string> = {
    Draft: 'gray',
    Issued: 'blue',
    'Partially Paid': 'yellow',
    Paid: 'green',
    Overdue: 'red',
    Cancelled: 'gray',
  };

  // Tax breakdown (half CGST + half SGST for intra-state)
  const halfTax = (Number(invoice.taxAmount) / 2).toFixed(2);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group justify="space-between" style={{ width: '100%' }}>
          <Text fw={700} size="md">
            Tax Invoice: {invoice.invoiceNumber}
          </Text>
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
      }
      centered
      radius="md"
    >
      <Box p="md">
        <Paper
          ref={printRef}
          p="xl"
          withBorder
          radius="sm"
          className="printable-invoice"
          style={{
            background: '#FFFFFF',
            color: '#0F172A',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          {/* Top Banner */}
          <Group justify="space-between" align="flex-start" mb="lg">
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
              <Text size="xs" fw={700} c="#1E293B">OneAssist Technologies Pvt Ltd</Text>
              <Text size="xs" c="#64748B">104, Tech Park, Guindy, Chennai, Tamil Nadu 600032</Text>
              <Text size="xs" c="#64748B">GSTIN: 33AAAAA0000A1Z5 | PAN: AAAAA0000A | State Code: 33</Text>
              <Text size="xs" c="#64748B">billing@oneassist.tech | www.oneassist.tech</Text>
            </Box>

            <Box style={{ textAlign: 'right' }}>
              <Text fw={900} size="22px" c="#0EA5E9" style={{ letterSpacing: '0.04em' }}>
                TAX INVOICE
              </Text>
              <Text size="11px" fw={700} c="#64748B" tt="uppercase">Original For Recipient</Text>
              <Text fw={800} size="md" c="#0F172A" mt={4}>#{invoice.invoiceNumber}</Text>
              <Group gap={6} justify="flex-end" mt={4}>
                <Text size="xs" c="#64748B">Payment Status:</Text>
                <Badge size="sm" color={statusColors[invoice.status] || 'blue'}>
                  {invoice.status}
                </Badge>
              </Group>
              <Text size="xs" c="#64748B" mt={4}>
                Invoice Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
              <Text size="xs" c="#DC2626" fw={700}>
                Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </Box>
          </Group>

          <Divider mb="md" color="#E2E8F0" />

          {/* Billed To / Shipped To */}
          <Group justify="space-between" align="flex-start" mb="lg">
            <Box style={{ maxWidth: '60%' }}>
              <Text size="11px" fw={800} c="#64748B" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                BILLED TO:
              </Text>
              <Text fw={800} size="md" c="#0F172A" mt={2}>
                {invoice.contactName}
              </Text>
              {invoice.companyName && (
                <Text fw={600} size="sm" c="#334155">
                  {invoice.companyName}
                </Text>
              )}
              {invoice.clientAddress && (
                <Text size="xs" c="#64748B" mt={2}>
                  {invoice.clientAddress}
                </Text>
              )}
              {invoice.clientGst && (
                <Text size="xs" c="#0F172A" fw={700} mt={2}>
                  Buyer GSTIN: {invoice.clientGst}
                </Text>
              )}
              {invoice.contactEmail && (
                <Text size="xs" c="#64748B">Email: {invoice.contactEmail}</Text>
              )}
              {invoice.contactPhone && (
                <Text size="xs" c="#64748B">Phone: {invoice.contactPhone}</Text>
              )}
            </Box>

            <Box style={{ textAlign: 'right' }}>
              <Text size="11px" fw={800} c="#64748B" tt="uppercase">
                INVOICE METADATA:
              </Text>
              <Text size="xs" c="#475569" mt={2}>
                <b>Place of Supply:</b> Tamil Nadu (33)
              </Text>
              <Text size="xs" c="#475569">
                <b>Reverse Charge:</b> No
              </Text>
              {invoice.paymentTerms && (
                <Text size="xs" c="#475569" mt={2}>
                  <b>Terms:</b> {invoice.paymentTerms}
                </Text>
              )}
            </Box>
          </Group>

          {/* Items Table */}
          <Table
            withTableBorder
            withColumnBorders
            mb="md"
            styles={{
              table: { borderColor: '#E2E8F0', color: '#0F172A' },
              th: { background: '#F8FAFC', color: '#334155', fontWeight: 700, fontSize: 11 },
              td: { fontSize: 11, color: '#1E293B' },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 35, textAlign: 'center' }}>#</Table.Th>
                <Table.Th>Description of Goods / Services</Table.Th>
                <Table.Th style={{ width: 50, textAlign: 'center' }}>Qty</Table.Th>
                <Table.Th style={{ width: 90, textAlign: 'right' }}>Rate (₹)</Table.Th>
                <Table.Th style={{ width: 80, textAlign: 'right' }}>Taxable (₹)</Table.Th>
                <Table.Th style={{ width: 60, textAlign: 'center' }}>CGST</Table.Th>
                <Table.Th style={{ width: 60, textAlign: 'center' }}>SGST</Table.Th>
                <Table.Th style={{ width: 100, textAlign: 'right' }}>Total (₹)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {invoice.items?.map((item, idx) => {
                const itemBase = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0);
                const halfRate = (Number(item.taxRate) || 0) / 2;

                return (
                  <Table.Tr key={idx}>
                    <Table.Td style={{ textAlign: 'center' }}>{idx + 1}</Table.Td>
                    <Table.Td>
                      <Text fw={700} size="xs" c="#0F172A">{item.itemName}</Text>
                      {item.description && <Text size="10px" c="#64748B">{item.description}</Text>}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>{item.quantity}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {itemBase.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>{halfRate}%</Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>{halfRate}%</Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {Number(item.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

          {/* Totals & Bank Details */}
          <Group justify="space-between" align="flex-start" mb="lg">
            <Box style={{ maxWidth: '50%' }}>
              <Paper p="xs" withBorder radius="sm" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                <Text size="10px" fw={800} c="#0EA5E9" tt="uppercase" mb={4}>
                  Bank Details for Electronic Remittance (NEFT / RTGS / IMPS)
                </Text>
                <Text size="11px" c="#334155"><b>Beneficiary:</b> OneAssist Technologies Pvt Ltd</Text>
                <Text size="11px" c="#334155"><b>Bank Name:</b> HDFC Bank</Text>
                <Text size="11px" c="#334155"><b>Account No:</b> 50200012345678</Text>
                <Text size="11px" c="#334155"><b>IFSC Code:</b> HDFC0001234</Text>
                <Text size="11px" c="#334155"><b>Branch:</b> Guindy, Chennai</Text>
                <Text size="11px" c="#334155"><b>UPI ID:</b> oneassist@hdfcbank</Text>
              </Paper>

              {invoice.notes && (
                <Box mt="xs">
                  <Text size="10px" fw={800} c="#64748B" tt="uppercase">Notes:</Text>
                  <Text size="11px" c="#475569">{invoice.notes}</Text>
                </Box>
              )}
            </Box>

            <Box style={{ width: 280 }}>
              <Stack gap={5}>
                <Group justify="space-between">
                  <Text size="xs" c="#64748B">Subtotal (Taxable):</Text>
                  <Text size="xs" fw={600} c="#0F172A">
                    ₹{Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
                {Number(invoice.discountAmount) > 0 && (
                  <Group justify="space-between">
                    <Text size="xs" c="#DC2626">Discount:</Text>
                    <Text size="xs" fw={600} c="#DC2626">
                      -₹{Number(invoice.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>
                )}
                <Group justify="space-between">
                  <Text size="xs" c="#64748B">CGST (Central Tax):</Text>
                  <Text size="xs" fw={600} c="#0F172A">₹{Number(halfTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="#64748B">SGST (State Tax):</Text>
                  <Text size="xs" fw={600} c="#0F172A">₹{Number(halfTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </Group>
                <Divider color="#E2E8F0" />
                <Group justify="space-between">
                  <Text size="sm" fw={800} c="#0F172A">Total Invoice Value:</Text>
                  <Text size="md" fw={900} c="#0EA5E9">
                    ₹{Number(invoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="#10B981">Amount Paid:</Text>
                  <Text size="xs" fw={700} c="#10B981">
                    ₹{Number(invoice.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" fw={700} c="#DC2626">Balance Due:</Text>
                  <Text size="xs" fw={800} c="#DC2626">
                    ₹{Number(invoice.outstandingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
              </Stack>
            </Box>
          </Group>

          <Divider mb="lg" color="#E2E8F0" />

          {/* Signatures */}
          <Group justify="space-between" align="flex-end">
            <Box>
              <Text size="10px" c="#64748B">This is a computer generated tax invoice and requires no physical seal.</Text>
            </Box>
            <Box style={{ textAlign: 'right' }}>
              <Text size="11px" c="#64748B">For OneAssist Technologies Pvt Ltd</Text>
              <Box style={{ height: 45 }} />
              <Text size="xs" fw={700} c="#0F172A">Authorized Signatory</Text>
            </Box>
          </Group>
        </Paper>
      </Box>

      {/* Embedded Print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-invoice, .printable-invoice * {
            visibility: visible !important;
          }
          .printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </Modal>
  );
};
