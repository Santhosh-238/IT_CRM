import React, { useState, useEffect } from 'react';
import {
  Paper,
  Group,
  Stack,
  Text,
  Button,
  TextInput,
  NumberInput,
  Textarea,
  Grid,
  Divider,
  Table,
  Badge,
  Tabs,
  LoadingOverlay,
  Box,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconSettings,
  IconBuildingBank,
  IconReceipt2,
  IconHistory,
  IconDeviceFloppy,
  IconRefresh,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { BillingSettings, BillingAuditLog } from '../../../types/billing';
import { billingService } from '../../../services/billingService';

export const BillingSettingsView: React.FC = () => {
  const isDark = useComputedColorScheme('light') === 'dark';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<BillingAuditLog[]>([]);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyGst, setCompanyGst] = useState('');
  const [companyPan, setCompanyPan] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');

  // Bank
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [upiId, setUpiId] = useState('');

  // Numbering
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [invoiceNextNumber, setInvoiceNextNumber] = useState(1001);
  const [quotationPrefix, setQuotationPrefix] = useState('QT-');
  const [quotationNextNumber, setQuotationNextNumber] = useState(1001);
  const [orderPrefix, setOrderPrefix] = useState('SO-');
  const [orderNextNumber, setOrderNextNumber] = useState(1001);
  const [paymentPrefix, setPaymentPrefix] = useState('PAY-');
  const [paymentNextNumber, setPaymentNextNumber] = useState(1001);

  // Defaults
  const [defaultTaxRate, setDefaultTaxRate] = useState(18);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('Due within 15 days');
  const [defaultTermsConditions, setDefaultTermsConditions] = useState('');

  const fetchSettingsAndLogs = async () => {
    try {
      setLoading(true);
      const [sett, logs] = await Promise.all([
        billingService.getSettings(),
        billingService.getAuditLogs(),
      ]);

      if (sett) {
        setSettings(sett);
        setCompanyName(sett.companyName || '');
        setCompanyAddress(sett.companyAddress || '');
        setCompanyGst(sett.companyGst || '');
        setCompanyPan(sett.companyPan || '');
        setCompanyPhone(sett.companyPhone || '');
        setCompanyEmail(sett.companyEmail || '');
        setCompanyWebsite(sett.companyWebsite || '');

        setBankName(sett.bankName || '');
        setAccountNumber(sett.accountNumber || '');
        setAccountHolderName(sett.accountHolderName || '');
        setIfscCode(sett.ifscCode || '');
        setBranchName(sett.branchName || '');
        setUpiId(sett.upiId || '');

        setInvoicePrefix(sett.invoicePrefix || 'INV-');
        setInvoiceNextNumber(Number(sett.invoiceNextNumber) || 1001);
        setQuotationPrefix(sett.quotationPrefix || 'QT-');
        setQuotationNextNumber(Number(sett.quotationNextNumber) || 1001);
        setOrderPrefix(sett.orderPrefix || 'SO-');
        setOrderNextNumber(Number(sett.orderNextNumber) || 1001);
        setPaymentPrefix(sett.paymentPrefix || 'PAY-');
        setPaymentNextNumber(Number(sett.paymentNextNumber) || 1001);

        setDefaultTaxRate(Number(sett.defaultTaxRate) || 18);
        setDefaultPaymentTerms(sett.defaultPaymentTerms || 'Due within 15 days');
        setDefaultTermsConditions(sett.defaultTermsConditions || '');
      }

      if (logs) setAuditLogs(logs);
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to load billing settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: Partial<BillingSettings> = {
        companyName,
        companyAddress,
        companyGst,
        companyPan,
        companyPhone,
        companyEmail,
        companyWebsite,
        bankName,
        accountNumber,
        accountHolderName,
        ifscCode,
        branchName,
        upiId,
        invoicePrefix,
        invoiceNextNumber,
        quotationPrefix,
        quotationNextNumber,
        orderPrefix,
        orderNextNumber,
        paymentPrefix,
        paymentNextNumber,
        defaultTaxRate,
        defaultPaymentTerms,
        defaultTermsConditions,
      };

      await billingService.updateSettings(payload);
      notifications.show({ color: 'green', message: 'Billing settings saved successfully' });
      fetchSettingsAndLogs();
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to save billing settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md" style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />

      <Tabs defaultValue="company" variant="outline" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="company" leftSection={<IconSettings size={16} />}>
            Company & Tax Profile
          </Tabs.Tab>
          <Tabs.Tab value="banking" leftSection={<IconBuildingBank size={16} />}>
            Bank & UPI Remittance
          </Tabs.Tab>
          <Tabs.Tab value="sequences" leftSection={<IconReceipt2 size={16} />}>
            Numbering Sequences & Policies
          </Tabs.Tab>
          <Tabs.Tab value="audit" leftSection={<IconHistory size={16} />}>
            Audit Trail ({auditLogs.length})
          </Tabs.Tab>
        </Tabs.List>

        <form onSubmit={handleSave}>
          {/* Tab 1: Company Profile */}
          <Tabs.Panel value="company">
            <Paper p="md" withBorder radius="md">
              <Text fw={700} size="md" mb="xs">
                Organization Details for Tax Documents
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                These legal details appear on all printed Quotations, Sales Orders, and GST Tax Invoices.
              </Text>

              <Grid gutter="sm">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Legal Entity / Company Name *"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.currentTarget.value)}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <TextInput
                    label="Corporate GSTIN *"
                    value={companyGst}
                    onChange={(e) => setCompanyGst(e.currentTarget.value)}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <TextInput
                    label="Corporate PAN *"
                    value={companyPan}
                    onChange={(e) => setCompanyPan(e.currentTarget.value)}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput
                    label="Registered Office Address *"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.currentTarget.value)}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    label="Official Phone"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    label="Billing Email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    label="Website URL"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.currentTarget.value)}
                  />
                </Grid.Col>
              </Grid>

              <Group justify="flex-end" mt="md">
                <Button
                  type="submit"
                  color="blue"
                  leftSection={<IconDeviceFloppy size={18} />}
                  loading={saving}
                >
                  Save Company Settings
                </Button>
              </Group>
            </Paper>
          </Tabs.Panel>

          {/* Tab 2: Bank & UPI */}
          <Tabs.Panel value="banking">
            <Paper p="md" withBorder radius="md">
              <Text fw={700} size="md" mb="xs">
                Bank Account & UPI Payment Remittance Details
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                Printed directly in invoice footer for electronic transfers (NEFT / RTGS / IMPS / UPI QR).
              </Text>

              <Grid gutter="sm">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Bank Name *"
                    placeholder="e.g. HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.currentTarget.value)}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Account Holder Name *"
                    placeholder="e.g. OneAssist Technologies Pvt Ltd"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.currentTarget.value)}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    label="Account Number *"
                    placeholder="e.g. 50200012345678"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.currentTarget.value)}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    label="IFSC Code *"
                    placeholder="e.g. HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.currentTarget.value)}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    label="Branch Name"
                    placeholder="e.g. Guindy, Chennai"
                    value={branchName}
                    onChange={(e) => setBranchName(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Official UPI ID"
                    placeholder="e.g. oneassist@hdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.currentTarget.value)}
                  />
                </Grid.Col>
              </Grid>

              <Group justify="flex-end" mt="md">
                <Button
                  type="submit"
                  color="blue"
                  leftSection={<IconDeviceFloppy size={18} />}
                  loading={saving}
                >
                  Save Banking Details
                </Button>
              </Group>
            </Paper>
          </Tabs.Panel>

          {/* Tab 3: Sequences & Policies */}
          <Tabs.Panel value="sequences">
            <Paper p="md" withBorder radius="md">
              <Text fw={700} size="md" mb="xs">
                Auto-Numbering Sequences & Default Policies
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                Define document prefix codes and starting sequence numbers for all billing modules.
              </Text>

              <Grid gutter="sm">
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <TextInput
                    label="Quotation Prefix"
                    value={quotationPrefix}
                    onChange={(e) => setQuotationPrefix(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <NumberInput
                    label="Quotation Next #"
                    value={quotationNextNumber}
                    onChange={(v) => setQuotationNextNumber(Number(v) || 1001)}
                    min={1}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <TextInput
                    label="Sales Order Prefix"
                    value={orderPrefix}
                    onChange={(e) => setOrderPrefix(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <NumberInput
                    label="Sales Order Next #"
                    value={orderNextNumber}
                    onChange={(v) => setOrderNextNumber(Number(v) || 1001)}
                    min={1}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <TextInput
                    label="Tax Invoice Prefix"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <NumberInput
                    label="Tax Invoice Next #"
                    value={invoiceNextNumber}
                    onChange={(v) => setInvoiceNextNumber(Number(v) || 1001)}
                    min={1}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <TextInput
                    label="Payment Receipt Prefix"
                    value={paymentPrefix}
                    onChange={(e) => setPaymentPrefix(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <NumberInput
                    label="Payment Next #"
                    value={paymentNextNumber}
                    onChange={(v) => setPaymentNextNumber(Number(v) || 1001)}
                    min={1}
                  />
                </Grid.Col>
              </Grid>

              <Divider my="md" />

              <Grid gutter="sm">
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <NumberInput
                    label="Default Tax Rate (GST %)"
                    value={defaultTaxRate}
                    onChange={(v) => setDefaultTaxRate(Number(v) || 18)}
                    min={0}
                    max={100}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 8 }}>
                  <TextInput
                    label="Default Payment Terms"
                    value={defaultPaymentTerms}
                    onChange={(e) => setDefaultPaymentTerms(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="Default Terms & Conditions"
                    value={defaultTermsConditions}
                    onChange={(e) => setDefaultTermsConditions(e.currentTarget.value)}
                    minRows={3}
                  />
                </Grid.Col>
              </Grid>

              <Group justify="flex-end" mt="md">
                <Button
                  type="submit"
                  color="blue"
                  leftSection={<IconDeviceFloppy size={18} />}
                  loading={saving}
                >
                  Save Sequence & Policy Settings
                </Button>
              </Group>
            </Paper>
          </Tabs.Panel>
        </form>

        {/* Tab 4: Audit Trail */}
        <Tabs.Panel value="audit">
          <Paper p="md" withBorder radius="md">
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <IconHistory size={20} color="#6366F1" />
                <Text fw={700} size="md">
                  System Billing Audit Trail
                </Text>
              </Group>
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchSettingsAndLogs}
              >
                Refresh Log
              </Button>
            </Group>

            <Box style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Timestamp</Table.Th>
                    <Table.Th>Entity Type</Table.Th>
                    <Table.Th>Document / Ref #</Table.Th>
                    <Table.Th>Action</Table.Th>
                    <Table.Th>User / Operator</Table.Th>
                    <Table.Th>Audit Event Details</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {auditLogs.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                        <Text c="dimmed">No audit logs recorded yet</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    auditLogs.map((log) => (
                      <Table.Tr key={log.id}>
                        <Table.Td>
                          <Text size="11px">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" variant="outline" color="blue">
                            {log.entityType}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" fw={700}>{log.entityNumber || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            size="xs"
                            color={
                              log.action.includes('CANCEL')
                                ? 'red'
                                : log.action.includes('CONVERT') || log.action.includes('CREATE')
                                ? 'green'
                                : 'indigo'
                            }
                          >
                            {log.action}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{log.performedBy || 'System Admin'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="11px" c="dimmed">
                            {log.details || '-'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Box>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
