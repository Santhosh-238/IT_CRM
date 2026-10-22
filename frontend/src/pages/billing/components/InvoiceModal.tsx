import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Text,
  NumberInput,
  Grid,
  Table,
  ActionIcon,
  Textarea,
  Divider,
  Paper,
  Box,
  Badge,
  useComputedColorScheme,
} from '@mantine/core';
import { IconPlus, IconTrash, IconFileInvoice, IconDeviceFloppy, IconX, IconPencil, IconList } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Invoice, InvoiceItem, BillingProduct, SalesOrder, BillingMilestone } from '../../../types/billing';
import { billingService } from '../../../services/billingService';
import { contactService } from '../../../services/contactService';
import { Contact } from '../../../types/contact';

interface ParsedModule {
  name: string;
  description: string;
}

const getProductModules = (product?: BillingProduct | null): ParsedModule[] => {
  if (!product || !product.modules || !Array.isArray(product.modules)) return [];
  return product.modules
    .map((m: any) => {
      if (typeof m === 'string') {
        return { name: m, description: '' };
      }
      return {
        name: m?.name || '',
        description: m?.description || '',
      };
    })
    .filter((m) => m.name && m.name.trim() !== '');
};

interface InvoiceModalProps {
  opened: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  defaultSalesOrderId?: string;
  defaultMilestone?: BillingMilestone | null;
  onSuccess: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  opened,
  onClose,
  invoice,
  defaultSalesOrderId,
  defaultMilestone,
  onSuccess,
}) => {
  const isDark = useComputedColorScheme('light') === 'dark';
  const [submitting, setSubmitting] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<BillingProduct[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [selectedCatalogueId, setSelectedCatalogueId] = useState<string | null>(null);
  const [customRowIndices, setCustomRowIndices] = useState<number[]>([]);

  const selectedCatalogueProduct = products.find((p) => p.id === selectedCatalogueId);
  const selectedProductModules = getProductModules(selectedCatalogueProduct);

  const toggleCustomRow = (idx: number) => {
    setCustomRowIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Form State
  const [contactId, setContactId] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [clientGst, setClientGst] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [salesOrderId, setSalesOrderId] = useState<string>('');
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<string>('Issued');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<string>('Due within 15 days');
  const [notes, setNotes] = useState<string>('');
  const [termsConditions, setTermsConditions] = useState<string>(
    '1. Payment must be made by the due date.\n2. Please mention the Invoice Number in NEFT/RTGS transaction remarks.\n3. Late payment incurs 1.5% interest per month.'
  );

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      itemName: '',
      itemType: 'Service',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 18,
      taxAmount: 0,
      totalAmount: 0,
    },
  ]);

  // Load Contacts, Products, Orders
  useEffect(() => {
    if (opened) {
      contactService.getContacts({ limit: 100 }).then((res) => {
        if (res?.data) setContacts(res.data);
      }).catch(() => {});

      billingService.getProductsServices({ status: 'Active' }).then((data) => {
        if (data) setProducts(data);
      }).catch(() => {});

      billingService.getSalesOrders().then((data) => {
        if (data) setSalesOrders(data);
      }).catch(() => {});
    }
  }, [opened]);

  // Populate data
  useEffect(() => {
    if (invoice) {
      setContactId(invoice.contactId || '');
      setContactName(invoice.contactName || '');
      setCompanyName(invoice.companyName || '');
      setContactEmail(invoice.contactEmail || '');
      setContactPhone(invoice.contactPhone || '');
      setClientGst(invoice.clientGst || '');
      setClientAddress(invoice.clientAddress || '');
      setSalesOrderId(invoice.salesOrderId || '');
      setMilestoneId(invoice.milestoneId || '');
      setInvoiceDate(invoice.invoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setDueDate(invoice.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setStatus(invoice.status || 'Issued');
      setDiscountAmount(Number(invoice.discountAmount) || 0);
      setPaymentTerms(invoice.paymentTerms || 'Due within 15 days');
      setNotes(invoice.notes || '');
      setTermsConditions(invoice.termsConditions || '');
      if (invoice.items && invoice.items.length > 0) {
        setItems(
          invoice.items.map((it) => ({
            ...it,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            discount: Number(it.discount) || 0,
            taxRate: Number(it.taxRate) || 0,
            taxAmount: Number(it.taxAmount) || 0,
            totalAmount: Number(it.totalAmount) || 0,
          }))
        );
      }
    } else if (defaultMilestone) {
      // Prefill from Milestone
      setMilestoneId(defaultMilestone.id);
      setSalesOrderId(defaultMilestone.salesOrderId || '');
      if (defaultMilestone.salesOrder) {
        setContactName(defaultMilestone.salesOrder.contactName || '');
        setCompanyName(defaultMilestone.salesOrder.companyName || '');
      }
      setItems([
        {
          itemName: defaultMilestone.name,
          itemType: 'Service',
          description: defaultMilestone.description || `Milestone Phase: ${defaultMilestone.name}`,
          quantity: 1,
          unitPrice: Number(defaultMilestone.amount) || 0,
          discount: 0,
          taxRate: 18,
          taxAmount: Number(((Number(defaultMilestone.amount) * 18) / 100).toFixed(2)),
          totalAmount: Number((Number(defaultMilestone.amount) * 1.18).toFixed(2)),
        },
      ]);
    } else if (defaultSalesOrderId) {
      setSalesOrderId(defaultSalesOrderId);
      const foundOrder = salesOrders.find((o) => o.id === defaultSalesOrderId);
      if (foundOrder) {
        setContactId(foundOrder.contactId || '');
        setContactName(foundOrder.contactName || '');
        setCompanyName(foundOrder.companyName || '');
        setContactEmail(foundOrder.contactEmail || '');
        setContactPhone(foundOrder.contactPhone || '');
        setClientGst(foundOrder.clientGst || '');
        setClientAddress(foundOrder.clientAddress || '');
      }
    } else {
      setContactId('');
      setContactName('');
      setCompanyName('');
      setContactEmail('');
      setContactPhone('');
      setClientGst('');
      setClientAddress('');
      setSalesOrderId('');
      setMilestoneId('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setStatus('Issued');
      setDiscountAmount(0);
      setPaymentTerms('Due within 15 days');
      setNotes('');
      setTermsConditions(
        '1. Payment must be made by the due date.\n2. Please mention the Invoice Number in NEFT/RTGS transaction remarks.\n3. Late payment incurs 1.5% interest per month.'
      );
      setSelectedCatalogueId(null);
      setCustomRowIndices([]);
      setItems([
        {
          itemName: '',
          itemType: 'Service',
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          taxRate: 18,
          taxAmount: 0,
          totalAmount: 0,
        },
      ]);
    }
  }, [invoice, defaultMilestone, defaultSalesOrderId, opened]);

  const handleSelectContact = (val: string | null) => {
    setContactId(val || '');
    if (!val) return;
    const found = contacts.find((c) => c.id === val);
    if (found) {
      setContactName(found.name || '');
      setCompanyName(found.companyName || '');
      setContactEmail(found.email || '');
      setContactPhone(found.phone || '');
      setClientGst(found.gstNumber || '');
      setClientAddress(found.address ? `${found.address}${found.registeredState ? `, ${found.registeredState}` : ''}`.trim() : (found.registeredState || ''));
    }
  };

  const handleSelectOrder = (orderId: string | null) => {
    setSalesOrderId(orderId || '');
    if (!orderId) return;
    const found = salesOrders.find((o) => o.id === orderId);
    if (found) {
      if (found.contactId) setContactId(found.contactId);
      setContactName(found.contactName || '');
      setCompanyName(found.companyName || '');
      setContactEmail(found.contactEmail || '');
      setContactPhone(found.contactPhone || '');
      setClientGst(found.clientGst || '');
      setClientAddress(found.clientAddress || '');
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].unitPrice) || 0;
    const disc = Number(updated[index].discount) || 0;
    const rate = Number(updated[index].taxRate) || 0;

    const baseAmount = Math.max(0, qty * price - disc);
    const tax = Number(((baseAmount * rate) / 100).toFixed(2));
    const total = Number((baseAmount + tax).toFixed(2));

    updated[index].taxAmount = tax;
    updated[index].totalAmount = total;

    setItems(updated);
  };

  const getRowModuleOptions = (currentItemName: string) => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];

    if (selectedCatalogueProduct && selectedProductModules.length > 0) {
      for (const m of selectedProductModules) {
        if (m.name && !seen.has(m.name)) {
          seen.add(m.name);
          options.push({ value: m.name, label: m.name });
        }
      }
    } else {
      // All modules across all active products
      for (const p of products) {
        const mods = getProductModules(p);
        for (const m of mods) {
          if (m.name && !seen.has(m.name)) {
            seen.add(m.name);
            options.push({ value: m.name, label: `${m.name} (${p.name})` });
          }
        }
      }
    }

    // Add currently selected value if not in list
    if (currentItemName && !seen.has(currentItemName) && currentItemName !== '__CUSTOM__') {
      seen.add(currentItemName);
      options.unshift({
        value: currentItemName,
        label: currentItemName,
      });
    }

    // Add option to switch to custom typing
    options.push({
      value: '__CUSTOM__',
      label: '✎ Type Custom Item Manually...',
    });

    return options;
  };

  const handleModuleSelect = (idx: number, val: string | null) => {
    if (val === '__CUSTOM__') {
      if (!customRowIndices.includes(idx)) {
        setCustomRowIndices((prev) => [...prev, idx]);
      }
      return;
    }

    if (!val) {
      updateItem(idx, 'itemName', '');
      return;
    }

    let foundDesc = '';
    let foundTaxRate = 18;
    let foundProdId: string | undefined = undefined;
    let foundProdType: any = 'Service';

    if (selectedCatalogueProduct) {
      foundProdId = selectedCatalogueProduct.id;
      foundProdType = selectedCatalogueProduct.type;
      foundTaxRate = Number(selectedCatalogueProduct.taxRate) || 18;
      const mod = selectedProductModules.find((m) => m.name === val);
      if (mod) foundDesc = mod.description;
    } else {
      for (const p of products) {
        const mods = getProductModules(p);
        const mod = mods.find((m) => m.name === val);
        if (mod) {
          foundProdId = p.id;
          foundProdType = p.type;
          foundTaxRate = Number(p.taxRate) || 18;
          foundDesc = mod.description || p.description || '';
          break;
        }
      }
    }

    const updated = [...items];
    updated[idx].itemName = val;
    if (foundProdId) updated[idx].productId = foundProdId;
    if (foundProdType) updated[idx].itemType = foundProdType;
    if (foundDesc && !updated[idx].description) {
      updated[idx].description = foundDesc;
    }
    if (foundTaxRate && (!updated[idx].taxRate || updated[idx].taxRate === 18)) {
      updated[idx].taxRate = foundTaxRate;
    }

    const qty = Number(updated[idx].quantity) || 1;
    const price = Number(updated[idx].unitPrice) || 0;
    const disc = Number(updated[idx].discount) || 0;
    const rate = Number(updated[idx].taxRate) || 18;

    const baseAmount = Math.max(0, qty * price - disc);
    const tax = Number(((baseAmount * rate) / 100).toFixed(2));
    const total = Number((baseAmount + tax).toFixed(2));

    updated[idx].taxAmount = tax;
    updated[idx].totalAmount = total;

    setItems(updated);
  };

  const handleAddAllModules = (prod: BillingProduct) => {
    const mods = getProductModules(prod);
    if (mods.length === 0) return;

    const isFirstItemEmpty =
      items.length === 1 && !items[0].itemName.trim() && (items[0].unitPrice === 0 || !items[0].unitPrice);

    const newItems: InvoiceItem[] = mods.map((m) => ({
      productId: prod.id,
      itemCode: prod.itemCode,
      itemName: m.name,
      itemType: prod.type,
      description: m.description || prod.description || '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: Number(prod.taxRate) || 18,
      taxAmount: 0,
      totalAmount: 0,
    }));

    if (isFirstItemEmpty) {
      setItems(newItems);
    } else {
      setItems([...items, ...newItems]);
    }

    notifications.show({
      color: 'teal',
      message: `Added all ${newItems.length} modules from "${prod.name}"`,
    });
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemName: '',
        itemType: 'Service',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 18,
        taxAmount: 0,
        totalAmount: 0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0),
    0
  );
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const totalTax = items.reduce((acc, it) => {
    const lineBase = Math.max(0, (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0));
    const effectiveBase = subtotal > 0 ? (lineBase / subtotal) * taxableSubtotal : lineBase;
    return acc + (effectiveBase * (Number(it.taxRate) || 0)) / 100;
  }, 0);
  const grandTotal = Number((taxableSubtotal + totalTax).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      notifications.show({ color: 'red', message: 'Client or Contact Name is required' });
      return;
    }
    if (items.some((it) => !it.itemName.trim() || Number(it.quantity) <= 0)) {
      notifications.show({ color: 'red', message: 'All invoice items must have a valid name and quantity' });
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<Invoice> = {
        contactId: contactId || null,
        contactName,
        companyName,
        contactEmail,
        contactPhone,
        clientGst,
        clientAddress,
        salesOrderId: salesOrderId || null,
        milestoneId: milestoneId || null,
        invoiceDate,
        dueDate,
        status: status as any,
        discountAmount,
        paymentTerms,
        notes,
        termsConditions,
        items,
      };

      if (invoice?.id) {
        await billingService.updateInvoice(invoice.id, payload);
        notifications.show({ color: 'green', message: 'Invoice updated successfully' });
      } else {
        await billingService.createInvoice(payload);
        notifications.show({ color: 'green', message: 'Invoice generated successfully' });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to save invoice' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="1240px"
      centered
      yOffset="3vh"
      withCloseButton={false}
      radius="lg"
      styles={{
        content: {
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.22)',
          maxWidth: '96vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
        },
        body: {
          padding: '24px 28px',
          overflowY: 'auto',
          maxHeight: 'calc(94vh - 20px)',
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
              background: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#818CF8' : '#4F46E5',
            }}
          >
            <IconFileInvoice size={22} stroke={1.8} />
          </Box>
          <div>
            <Text fw={800} size="19px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
              {invoice ? `Edit Tax Invoice: ${invoice.invoiceNumber}` : 'Create Tax Invoice'}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Generate GST-compliant tax invoice with line items, tax breakdown, and payment terms
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

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Client Details */}
          <Paper p="md" withBorder radius="lg" style={{ background: isDark ? '#111827' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0' }}>
            <Text fw={700} size="xs" mb="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              Bill To (Client / Organization Details)
            </Text>
            <Grid gutter="xs">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Select Existing CRM Contact"
                  placeholder="Choose contact to auto-fill"
                  data={contacts.map((c) => ({
                    value: c.id,
                    label: `${c.name} ${c.companyName ? `(${c.companyName})` : ''}`,
                  }))}
                  value={contactId}
                  onChange={handleSelectContact}
                  searchable
                  clearable
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Link to Sales Order (Optional)"
                  placeholder="Pick Sales Order"
                  data={salesOrders.map((o) => ({
                    value: o.id,
                    label: `${o.orderNumber} - ${o.contactName}`,
                  }))}
                  value={salesOrderId}
                  onChange={handleSelectOrder}
                  searchable
                  clearable
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Client / Contact Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.currentTarget.value)}
                  required
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Client GSTIN"
                  placeholder="33AAAAA0000A1Z5"
                  value={clientGst}
                  onChange={(e) => setClientGst(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput
                  label="Client Billing Address"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Dates & Status */}
          <Grid gutter="xs">
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.currentTarget.value)}
                required
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput
                label="Payment Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.currentTarget.value)}
                required
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select
                label="Status"
                data={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Issued', label: 'Issued' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
                value={status}
                onChange={(v) => setStatus(v || 'Issued')}
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select
                label="Payment Terms"
                placeholder="Select payment terms"
                data={[
                  { value: 'Due within 15 days', label: 'Due within 15 days' },
                  { value: 'Due within 30 days', label: 'Due within 30 days' },
                  { value: 'Due on Receipt', label: 'Due on Receipt' },
                  { value: 'Net 15 Days', label: 'Net 15 Days' },
                  { value: 'Net 30 Days', label: 'Net 30 Days' },
                  { value: 'Net 45 Days', label: 'Net 45 Days' },
                  { value: 'Net 60 Days', label: 'Net 60 Days' },
                  { value: 'Milestone based release', label: 'Milestone based release' },
                  { value: '50% Advance, 50% on Delivery', label: '50% Advance, 50% on Delivery' },
                  { value: '100% Advance', label: '100% Advance' },
                ]}
                value={paymentTerms}
                onChange={(val) => setPaymentTerms(val || 'Due within 15 days')}
                searchable
                radius="md"
              />
            </Grid.Col>
          </Grid>

          {/* Items Table */}
          <Paper
            p="md"
            withBorder
            radius="lg"
            style={{
              background: isDark ? '#111827' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
            }}
          >
            <Group justify="space-between" mb="sm" wrap="wrap" gap="xs">
              <div>
                <Text fw={700} size="sm">
                  Billed Items / Services Scope
                </Text>
                <Text size="xs" c="dimmed">
                  Select a product/service to pick its modules or type custom items manually. Enter rates manually.
                </Text>
              </div>

              <Button
                leftSection={<IconPlus size={15} />}
                variant="light"
                size="xs"
                radius="md"
                onClick={addItem}
                color="indigo"
              >
                Add Item
              </Button>
            </Group>

            {/* Quick Add from Catalogue Toolbar */}
            <Paper
              p="xs"
              radius="md"
              mb="sm"
              style={{
                background: isDark ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
              }}
            >
              <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                <Group gap="xs" align="center">
                  <Badge variant="light" color="indigo" radius="sm" size="sm">
                    Select Catalogue:
                  </Badge>
                  <Select
                    placeholder="Choose Product or Service to filter modules..."
                    data={products.map((p) => ({
                      value: p.id,
                      label: `${p.name} (${p.type})`,
                    }))}
                    value={selectedCatalogueId}
                    onChange={setSelectedCatalogueId}
                    searchable
                    clearable
                    size="xs"
                    radius="md"
                    style={{ width: 300 }}
                  />
                </Group>

                {selectedCatalogueProduct && selectedProductModules.length > 0 && (
                  <Button
                    variant="light"
                    color="indigo"
                    size="compact-xs"
                    radius="sm"
                    leftSection={<IconPlus size={12} />}
                    onClick={() => handleAddAllModules(selectedCatalogueProduct)}
                  >
                    Add All {selectedCatalogueProduct.name} Modules ({selectedProductModules.length})
                  </Button>
                )}
              </Group>
            </Paper>

            <Box style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover withTableBorder withColumnBorders style={{ minWidth: 780 }}>
                <Table.Thead>
                  <Table.Tr style={{ background: isDark ? '#0F172A' : '#F8FAFC' }}>
                    <Table.Th style={{ width: '25%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Item Name / Service
                    </Table.Th>
                    <Table.Th style={{ width: '23%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Scope / Description
                    </Table.Th>
                    <Table.Th style={{ width: '9%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Qty
                    </Table.Th>
                    <Table.Th style={{ width: '13%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Rate (₹)
                    </Table.Th>
                    <Table.Th style={{ width: '10%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Disc (₹)
                    </Table.Th>
                    <Table.Th style={{ width: '9%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      GST %
                    </Table.Th>
                    <Table.Th style={{ width: '12%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                      Total (₹)
                    </Table.Th>
                    <Table.Th style={{ width: '3%', textAlign: 'center' }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.map((item, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap" align="center">
                          {customRowIndices.includes(idx) ? (
                            <TextInput
                              placeholder="Type custom item name..."
                              value={item.itemName}
                              onChange={(e) => updateItem(idx, 'itemName', e.currentTarget.value)}
                              size="xs"
                              radius="sm"
                              style={{ flex: 1 }}
                              required
                              autoFocus
                            />
                          ) : (
                            <Select
                              placeholder="Select Module..."
                              data={getRowModuleOptions(item.itemName)}
                              value={item.itemName || null}
                              onChange={(val) => handleModuleSelect(idx, val)}
                              searchable
                              clearable
                              size="xs"
                              radius="sm"
                              style={{ flex: 1 }}
                              nothingFoundMessage="No matching module"
                            />
                          )}
                          <ActionIcon
                            variant="subtle"
                            color={customRowIndices.includes(idx) ? 'indigo' : 'gray'}
                            size="sm"
                            radius="sm"
                            onClick={() => toggleCustomRow(idx)}
                            title={customRowIndices.includes(idx) ? 'Switch to Select Module' : 'Switch to Type Manually'}
                          >
                            {customRowIndices.includes(idx) ? <IconList size={13} /> : <IconPencil size={13} />}
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Textarea
                          placeholder="Scope details / features..."
                          value={item.description || ''}
                          onChange={(e) => updateItem(idx, 'description', e.currentTarget.value)}
                          size="xs"
                          radius="sm"
                          minRows={2}
                          maxRows={4}
                          autosize
                        />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          value={item.quantity}
                          onChange={(val) => updateItem(idx, 'quantity', val)}
                          min={1}
                          size="xs"
                          radius="sm"
                        />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          placeholder="Enter rate"
                          value={item.unitPrice}
                          onChange={(val) => updateItem(idx, 'unitPrice', val)}
                          min={0}
                          size="xs"
                          radius="sm"
                        />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          value={item.discount}
                          onChange={(val) => updateItem(idx, 'discount', val)}
                          min={0}
                          size="xs"
                          radius="sm"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Select
                          data={[
                            { value: '0', label: '0%' },
                            { value: '5', label: '5%' },
                            { value: '12', label: '12%' },
                            { value: '18', label: '18%' },
                            { value: '28', label: '28%' },
                          ]}
                          value={String(item.taxRate)}
                          onChange={(val) => updateItem(idx, 'taxRate', Number(val) || 0)}
                          size="xs"
                          radius="sm"
                        />
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text size="xs" fw={700}>
                          ₹{Number(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <ActionIcon color="red" variant="subtle" size="sm" onClick={() => removeItem(idx)}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>

            {/* Calculations Box */}
            <Group justify="flex-end" mt="md">
              <Box style={{ width: 260 }}>
                <Stack gap={6}>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Subtotal:</Text>
                    <Text size="xs" fw={600}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Discount (₹):</Text>
                    <NumberInput
                      value={discountAmount}
                      onChange={(v) => setDiscountAmount(Number(v) || 0)}
                      min={0}
                      size="xs"
                      radius="xs"
                      style={{ width: 100 }}
                    />
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Taxes (GST):</Text>
                    <Text size="xs" fw={600}>₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </Group>
                  <Divider />
                  <Group justify="space-between">
                    <Text size="sm" fw={700}>Invoice Total:</Text>
                    <Text size="sm" fw={800} c="indigo">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </Group>
                </Stack>
              </Box>
            </Group>
          </Paper>

          {/* Notes */}
          <Grid gutter="xs">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Textarea
                label="Notes"
                placeholder="Payment instructions or client notes"
                value={notes}
                onChange={(e) => setNotes(e.currentTarget.value)}
                minRows={2}
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Textarea
                label="Terms & Conditions"
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.currentTarget.value)}
                minRows={2}
                radius="md"
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" gap="sm" mt="sm">
            <Button
              variant="default"
              radius="md"
              onClick={onClose}
              disabled={submitting}
              style={{ fontWeight: 600, minWidth: 90 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              radius="md"
              loading={submitting}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                minWidth: 150,
                border: 'none',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              {invoice ? 'Update Invoice' : 'Generate Invoice'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
