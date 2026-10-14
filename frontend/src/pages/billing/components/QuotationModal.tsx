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
import { IconPlus, IconTrash, IconCalculator, IconDeviceFloppy, IconX, IconPencil, IconList } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Quotation, QuotationItem, BillingProduct } from '../../../types/billing';
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

interface QuotationModalProps {
  opened: boolean;
  onClose: () => void;
  quotation?: Quotation | null;
  onSuccess: () => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  opened,
  onClose,
  quotation,
  onSuccess,
}) => {
  const isDark = useComputedColorScheme('light') === 'dark';
  const [submitting, setSubmitting] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<BillingProduct[]>([]);
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
  const [quotationDate, setQuotationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<string>('Draft');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30 Days');
  const [notes, setNotes] = useState<string>('');
  const [termsConditions, setTermsConditions] = useState<string>(
    '1. Quotation valid for 30 days from issue.\n2. 50% advance along with confirmed Purchase Order.\n3. Taxes extra as applicable by law.'
  );

  const [items, setItems] = useState<QuotationItem[]>([
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

  // Load Contacts & Products on open
  useEffect(() => {
    if (opened) {
      contactService.getContacts({ limit: 100 }).then((res) => {
        if (res?.data) setContacts(res.data);
      }).catch(() => {});

      billingService.getProductsServices({ status: 'Active' }).then((data) => {
        if (data) setProducts(data);
      }).catch(() => {});
    }
  }, [opened]);

  // Populate on edit
  useEffect(() => {
    if (quotation) {
      setContactId(quotation.contactId || '');
      setContactName(quotation.contactName || '');
      setCompanyName(quotation.companyName || '');
      setContactEmail(quotation.contactEmail || '');
      setContactPhone(quotation.contactPhone || '');
      setClientGst(quotation.clientGst || '');
      setClientAddress(quotation.clientAddress || '');
      setQuotationDate(quotation.quotationDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setValidUntil(quotation.validUntil?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setStatus(quotation.status || 'Draft');
      setDiscountType(quotation.discountType || 'percentage');
      setDiscountValue(Number(quotation.discountValue) || 0);
      setPaymentTerms(quotation.paymentTerms || 'Net 30 Days');
      setNotes(quotation.notes || '');
      setTermsConditions(quotation.termsConditions || '');
      if (quotation.items && quotation.items.length > 0) {
        setItems(
          quotation.items.map((it) => ({
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
    } else {
      // Reset form
      setContactId('');
      setContactName('');
      setCompanyName('');
      setContactEmail('');
      setContactPhone('');
      setClientGst('');
      setClientAddress('');
      setQuotationDate(new Date().toISOString().split('T')[0]);
      setValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setStatus('Draft');
      setDiscountType('percentage');
      setDiscountValue(0);
      setPaymentTerms('Net 30 Days');
      setNotes('');
      setTermsConditions(
        '1. Quotation valid for 30 days from issue.\n2. 50% advance along with confirmed Purchase Order.\n3. Taxes extra as applicable by law.'
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
  }, [quotation, opened]);

  // Handle Contact Selection
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

  // Calculations & Item Updates
  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Recompute line item total
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
    if (selectedCatalogueProduct) {
      const mod = selectedProductModules.find((m) => m.name === val);
      if (mod) foundDesc = mod.description;
    } else {
      for (const p of products) {
        const mods = getProductModules(p);
        const mod = mods.find((m) => m.name === val);
        if (mod) {
          foundDesc = mod.description || p.description || '';
          break;
        }
      }
    }

    const updated = [...items];
    updated[idx].itemName = val;
    if (foundDesc && !updated[idx].description) {
      updated[idx].description = foundDesc;
    }
    setItems(updated);
  };

  const handleAddAllModules = (prod: BillingProduct) => {
    const mods = getProductModules(prod);
    if (mods.length === 0) return;

    const isFirstItemEmpty =
      items.length === 1 && !items[0].itemName.trim() && (items[0].unitPrice === 0 || !items[0].unitPrice);

    const newItems: QuotationItem[] = mods.map((m) => ({
      productId: prod.id,
      itemCode: prod.itemCode,
      itemName: m.name,
      itemType: prod.type,
      description: m.description || prod.description || '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 18,
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

  const handleAddProductLineItem = (prod: BillingProduct) => {
    const isFirstItemEmpty =
      items.length === 1 && !items[0].itemName.trim() && (items[0].unitPrice === 0 || !items[0].unitPrice);

    const newItem: QuotationItem = {
      productId: prod.id,
      itemCode: prod.itemCode,
      itemName: prod.name,
      itemType: prod.type,
      description: prod.description || '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 18,
      taxAmount: 0,
      totalAmount: 0,
    };

    if (isFirstItemEmpty) {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }

    notifications.show({
      color: 'teal',
      message: `Added "${prod.name}" to line items`,
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
    if (items.length <= 1) {
      notifications.show({
        color: 'yellow',
        message: 'A quotation must have at least one line item.',
      });
      return;
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  // Grand summary
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0), 0);
  const overallDiscount = discountType === 'percentage'
    ? (subtotal * discountValue) / 100
    : discountValue;
  const taxableSubtotal = Math.max(0, subtotal - overallDiscount);
  const totalTax = items.reduce((acc, it) => {
    // If overall discount applied, proportion tax
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
      notifications.show({ color: 'red', message: 'All items must have a valid name and quantity greater than 0' });
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<Quotation> = {
        contactId: contactId || null,
        contactName,
        companyName,
        contactEmail,
        contactPhone,
        clientGst,
        clientAddress,
        quotationDate,
        validUntil,
        status: status as any,
        discountType,
        discountValue,
        discountAmount: overallDiscount,
        paymentTerms,
        notes,
        termsConditions,
        items,
      };

      if (quotation?.id) {
        await billingService.updateQuotation(quotation.id, payload);
        notifications.show({ color: 'green', message: 'Quotation updated successfully' });
      } else {
        await billingService.createQuotation(payload);
        notifications.show({ color: 'green', message: 'Quotation created successfully' });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to save quotation' });
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
            <IconCalculator size={22} stroke={1.8} />
          </Box>
          <div>
            <Text fw={800} size="19px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
              {quotation ? `Edit Quotation: ${quotation.quotationNumber}` : 'Create New Quotation'}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Prepare estimate with items, pricing, discounts, and terms
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
          {/* Client Details Section */}
          <Paper p="md" withBorder radius="lg" style={{ background: isDark ? '#111827' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0' }}>
            <Text fw={700} size="xs" mb="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              Client Information (CRM Contact / Organization)
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
                <TextInput
                  label="Contact / Client Name"
                  placeholder="e.g. Rahul Sharma"
                  value={contactName}
                  onChange={(e) => setContactName(e.currentTarget.value)}
                  required
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Company Name"
                  placeholder="e.g. Acme Innovations Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Client GSTIN"
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  value={clientGst}
                  onChange={(e) => setClientGst(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Email Address"
                  placeholder="client@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 8 }}>
                <TextInput
                  label="Billing Address"
                  placeholder="Registered Office Address"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Quotation Validity & Dates */}
          <Grid gutter="xs">
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput
                label="Quotation Date"
                type="date"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.currentTarget.value)}
                required
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput
                label="Valid Until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.currentTarget.value)}
                required
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select
                label="Status"
                data={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Sent', label: 'Sent to Client' },
                  { value: 'Accepted', label: 'Accepted' },
                  { value: 'Rejected', label: 'Rejected' },
                  { value: 'Expired', label: 'Expired' },
                ]}
                value={status}
                onChange={(val) => setStatus(val || 'Draft')}
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput
                label="Payment Terms"
                placeholder="e.g. Net 30 Days"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.currentTarget.value)}
                radius="md"
              />
            </Grid.Col>
          </Grid>

          {/* Line Items Table */}
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
                  Line Items (Products, Services & Modules)
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
              <Table striped highlightOnHover withTableBorder withColumnBorders style={{ minWidth: 800 }}>
                <Table.Thead>
                  <Table.Tr style={{ background: isDark ? '#0F172A' : '#F8FAFC' }}>
                    <Table.Th style={{ width: '28%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Item Name / Module
                    </Table.Th>
                    <Table.Th style={{ width: '24%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Scope / Description
                    </Table.Th>
                    <Table.Th style={{ width: '8%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Qty
                    </Table.Th>
                    <Table.Th style={{ width: '13%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Unit Rate (₹)
                    </Table.Th>
                    <Table.Th style={{ width: '8%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Disc (₹)
                    </Table.Th>
                    <Table.Th style={{ width: '8%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      GST %
                    </Table.Th>
                    <Table.Th style={{ width: '8%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
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
                            minRows={3}
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
                            thousandSeparator=","
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
              <Box style={{ width: 280 }}>
                <Stack gap={6}>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Subtotal:</Text>
                    <Text size="xs" fw={600}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Group gap={4}>
                      <Text size="xs" c="dimmed">Discount:</Text>
                      <Select
                        data={[{ value: 'percentage', label: '%' }, { value: 'fixed', label: '₹' }]}
                        value={discountType}
                        onChange={(v) => setDiscountType((v as any) || 'percentage')}
                        size="xs"
                        radius="xs"
                        style={{ width: 60 }}
                      />
                      <NumberInput
                        value={discountValue}
                        onChange={(v) => setDiscountValue(Number(v) || 0)}
                        min={0}
                        size="xs"
                        radius="xs"
                        style={{ width: 70 }}
                      />
                    </Group>
                    <Text size="xs" fw={600} c="red">-₹{overallDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Taxes (GST):</Text>
                    <Text size="xs" fw={600}>₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </Group>
                  <Divider />
                  <Group justify="space-between">
                    <Text size="sm" fw={700}>Grand Total:</Text>
                    <Text size="sm" fw={800} c="indigo">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </Group>
                </Stack>
              </Box>
            </Group>
          </Paper>

          {/* Notes & Terms */}
          <Grid gutter="xs">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Textarea
                label="Notes / Client Remarks"
                placeholder="Internal notes or project remarks"
                value={notes}
                onChange={(e) => setNotes(e.currentTarget.value)}
                minRows={2}
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Textarea
                label="Terms & Conditions"
                placeholder="Payment terms, delivery timeline..."
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.currentTarget.value)}
                minRows={2}
                radius="md"
              />
            </Grid.Col>
          </Grid>

          {/* Footer Actions */}
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
              {quotation ? 'Update Quotation' : 'Create Quotation'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
