import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Autocomplete,
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
  ThemeIcon,
  Tooltip,
  SimpleGrid,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconCalculator,
  IconDeviceFloppy,
  IconX,
  IconPencil,
  IconList,
  IconUpload,
  IconDownload,
  IconFileDescription,
  IconEye,
  IconFile,
  IconArrowLeft,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Quotation, QuotationItem, BillingProduct } from '../../../types/billing';
import { billingService } from '../../../services/billingService';
import { contactService } from '../../../services/contactService';
import { Contact } from '../../../types/contact';
import { Lead } from '../../../types/lead';

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
  onSuccess: (savedQuote?: Quotation) => void;
  initialLead?: Lead | null;
  embedded?: boolean;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  opened,
  onClose,
  quotation,
  onSuccess,
  initialLead,
  embedded = false,
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
    initialLead
      ? '1. Proposal valid for 30 days from issue.\n2. 50% advance along with confirmed Purchase Order.\n3. Taxes extra as applicable by law.'
      : '1. Quotation valid for 30 days from issue.\n2. 50% advance along with confirmed Purchase Order.\n3. Taxes extra as applicable by law.'
  );

  const [items, setItems] = useState<QuotationItem[]>([
    {
      itemName: '',
      itemType: 'Service',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      taxRate: 18,
      taxAmount: 0,
      totalAmount: 0,
    },
  ]);

  // Load Contacts & Products on open
  useEffect(() => {
    if (opened) {
      contactService.getContacts({ limit: 100 }).then((res) => {
        if (res?.data) {
          setContacts(res.data);
          // If we have an initialLead and clientGst is empty, try to match contact
          if (initialLead && !quotation) {
            const found = res.data.find(
              (c: Contact) =>
                (initialLead.email && c.email && c.email.toLowerCase() === initialLead.email.toLowerCase()) ||
                (initialLead.phone && c.phone && c.phone === initialLead.phone) ||
                (c.name && c.name.toLowerCase() === initialLead.name.toLowerCase())
            );
            if (found) {
              if (found.gstNumber) setClientGst((prev) => prev || found.gstNumber || '');
              if (!initialLead.address && found.address) {
                setClientAddress((prev) => prev || found.address || '');
              }
            }
          }
        }
      }).catch(() => {});

      billingService.getProductsServices({ status: 'Active' }).then((data) => {
        if (data) setProducts(data);
      }).catch(() => {});
    }
  }, [opened, initialLead]);

  // Populate on edit or initialLead
  useEffect(() => {
    if (!opened) return;

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
          quotation.items.map((it) => {
            const qty = Number(it.quantity) || 1;
            const price = Number(it.unitPrice) || 0;
            const disc = Number(it.discount) || 0;
            const discType = it.discountType || 'percentage';
            const gross = qty * price;
            const discAmt = discType === 'percentage' ? (gross * disc) / 100 : Math.min(gross, disc);
            const base = Math.max(0, gross - discAmt);
            const taxRate = Number(it.taxRate) || 0;
            const taxAmount = Number(((base * taxRate) / 100).toFixed(2));
            const totalAmount = Number((base + taxAmount).toFixed(2));

            return {
              ...it,
              quantity: qty,
              unitPrice: price,
              discount: disc,
              discountType: discType,
              taxRate,
              taxAmount: it.taxAmount ? Number(it.taxAmount) : taxAmount,
              totalAmount: it.totalAmount ? Number(it.totalAmount) : totalAmount,
            };
          })
        );
      }
    } else if (initialLead) {
      // Auto-fetch details directly from the active Lead
      const matchedContact = contacts.find(
        (c) =>
          (initialLead.email && c.email && c.email.toLowerCase() === initialLead.email.toLowerCase()) ||
          (initialLead.phone && c.phone && c.phone === initialLead.phone) ||
          (c.name && c.name.toLowerCase() === initialLead.name.toLowerCase())
      );

      setContactId(initialLead.id || '');
      setContactName(initialLead.name || '');
      setCompanyName(initialLead.companyName || initialLead.profession || '');
      setContactEmail(initialLead.email || '');
      setContactPhone(initialLead.phone || '');
      setClientGst(matchedContact?.gstNumber || '');
      setClientAddress(
        initialLead.address ||
          (matchedContact?.address
            ? `${matchedContact.address}${matchedContact.registeredState ? `, ${matchedContact.registeredState}` : ''}`.trim()
            : '')
      );
      setQuotationDate(new Date().toISOString().split('T')[0]);
      setValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setStatus('Draft');
      setDiscountType('percentage');
      setDiscountValue(0);
      setPaymentTerms('Net 30 Days');
      setNotes('');
      setTermsConditions(
        initialLead
          ? '1. Proposal valid for 30 days from issue.\n2. 50% advance along with confirmed Purchase Order.\n3. Taxes extra as applicable by law.'
          : '1. Quotation valid for 30 days from issue.\n2. 50% advance along with confirmed Purchase Order.\n3. Taxes extra as applicable by law.'
      );
      setSelectedCatalogueId(null);
      setCustomRowIndices([]);
      const defaultItemName =
        initialLead.category === 'Product'
          ? initialLead.productList?.[0] || 'IT CRM Software Enterprise License'
          : initialLead.serviceList?.[0] || 'Custom Software Development & Implementation';
      setItems([
        {
          itemName: defaultItemName,
          itemType: 'Service',
          description: 'Initial scope, implementation, and deployment deliverables',
          quantity: 1,
          unitPrice: 85000,
          discount: 0,
          discountType: 'percentage',
          taxRate: 18,
          taxAmount: 15300,
          totalAmount: 100300,
        },
      ]);
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
          discountType: 'percentage',
          taxRate: 18,
          taxAmount: 0,
          totalAmount: 0,
        },
      ]);
    }
  }, [quotation, opened, initialLead]);

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
    const gross = qty * price;
    const disc = Number(updated[index].discount) || 0;
    const discType = updated[index].discountType || 'percentage';
    const rate = Number(updated[index].taxRate) || 0;

    let lineDiscAmt = 0;
    if (discType === 'percentage') {
      lineDiscAmt = (gross * disc) / 100;
    } else {
      lineDiscAmt = Math.min(gross, disc);
    }
    lineDiscAmt = Number(lineDiscAmt.toFixed(2));

    const baseAmount = Math.max(0, gross - lineDiscAmt);
    const tax = Number(((baseAmount * rate) / 100).toFixed(2));
    const total = Number((baseAmount + tax).toFixed(2));

    updated[index].taxAmount = tax;
    updated[index].totalAmount = total;

    setItems(updated);
  };

  // Smart suggestions for item names (products + modules)
  const autocompleteOptions = useMemo(() => {
    const list: string[] = [];
    for (const p of products) {
      if (p.name && !list.includes(p.name)) {
        list.push(p.name);
      }
      const mods = getProductModules(p);
      for (const m of mods) {
        if (m.name && !list.includes(m.name)) {
          list.push(m.name);
        }
      }
    }
    return list;
  }, [products]);

  const handleItemSelect = (idx: number, val: string) => {
    const updated = [...items];
    updated[idx].itemName = val;

    // Check if it matches a catalogue product
    const prod = products.find((p) => p.name.toLowerCase() === val.toLowerCase());
    if (prod) {
      updated[idx].productId = prod.id;
      updated[idx].itemCode = prod.itemCode;
      updated[idx].itemType = prod.type || 'Product';
      if (prod.unitPrice !== undefined && prod.unitPrice > 0) {
        updated[idx].unitPrice = prod.unitPrice;
      }
      if (prod.description && !updated[idx].description) {
        updated[idx].description = prod.description;
      }
      if (prod.taxRate !== undefined) {
        updated[idx].taxRate = prod.taxRate;
      }
    } else {
      // Check if it matches a module
      for (const p of products) {
        const mods = getProductModules(p);
        const mod = mods.find((m) => m.name.toLowerCase() === val.toLowerCase());
        if (mod) {
          if (mod.description && !updated[idx].description) {
            updated[idx].description = mod.description;
          }
          break;
        }
      }
    }

    // Recalculate line total
    const qty = Number(updated[idx].quantity) || 1;
    const price = Number(updated[idx].unitPrice) || 0;
    const gross = qty * price;
    const disc = Number(updated[idx].discount) || 0;
    const discType = updated[idx].discountType || 'percentage';
    let lineDiscAmt = 0;
    if (discType === 'percentage') {
      lineDiscAmt = (gross * disc) / 100;
    } else {
      lineDiscAmt = Math.min(gross, disc);
    }
    lineDiscAmt = Number(lineDiscAmt.toFixed(2));
    const base = Math.max(0, gross - lineDiscAmt);
    const taxRate = updated[idx].taxRate !== undefined ? Number(updated[idx].taxRate) : 18;
    const taxAmt = Number(((base * taxRate) / 100).toFixed(2));
    updated[idx].taxAmount = taxAmt;
    updated[idx].totalAmount = Number((base + taxAmt).toFixed(2));

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

    const price = prod.unitPrice || 0;
    const taxRate = prod.taxRate !== undefined ? prod.taxRate : 18;
    const taxAmt = Number(((price * taxRate) / 100).toFixed(2));

    const newItem: QuotationItem = {
      productId: prod.id,
      itemCode: prod.itemCode,
      itemName: prod.name,
      itemType: prod.type || 'Product',
      description: prod.description || '',
      quantity: 1,
      unitPrice: price,
      discount: 0,
      taxRate: taxRate,
      taxAmount: taxAmt,
      totalAmount: Number((price + taxAmt).toFixed(2)),
    };

    if (isFirstItemEmpty) {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }

    notifications.show({
      color: 'teal',
      message: `Added "${prod.name}" to line items (₹${price.toLocaleString('en-IN')})`,
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
        message: initialLead ? 'A proposal must have at least one line item.' : 'A quotation must have at least one line item.',
      });
      return;
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  // Grand summary calculations matching PDF and DB
  const grossSubtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const totalItemDiscount = items.reduce((acc, it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    const gross = qty * price;
    const disc = Number(it.discount) || 0;
    const discType = it.discountType || 'percentage';
    const lineDiscAmt = discType === 'percentage' ? (gross * disc) / 100 : Math.min(gross, disc);
    return acc + lineDiscAmt;
  }, 0);
  const netSubtotal = Math.max(0, grossSubtotal - totalItemDiscount);
  const overallDiscount = discountType === 'percentage'
    ? (netSubtotal * discountValue) / 100
    : Math.min(netSubtotal, discountValue);
  const taxableSubtotal = Math.max(0, netSubtotal - overallDiscount);
  const factor = netSubtotal > 0 ? taxableSubtotal / netSubtotal : 1;
  const totalTax = items.reduce((acc, it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    const gross = qty * price;
    const disc = Number(it.discount) || 0;
    const discType = it.discountType || 'percentage';
    const lineDiscAmt = discType === 'percentage' ? (gross * disc) / 100 : Math.min(gross, disc);
    const lineBase = Math.max(0, gross - lineDiscAmt);
    const effectiveBase = lineBase * factor;
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
        leadId: initialLead?.id || quotation?.leadId || null,
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
        discountAmount: Number(overallDiscount.toFixed(2)),
        taxAmount: Number(totalTax.toFixed(2)),
        paymentTerms,
        notes,
        termsConditions,
        grandTotal,
        subtotal: Number(netSubtotal.toFixed(2)),
        items,
      };

      let savedQuote: Quotation | undefined;
      if (quotation?.id) {
        savedQuote = await billingService.updateQuotation(quotation.id, payload);
        notifications.show({
          color: 'green',
          message: 'Quotation updated successfully in CRM database',
        });
      } else {
        savedQuote = await billingService.createQuotation(payload);
        notifications.show({
          color: 'green',
          message: 'Quotation created and saved in CRM database',
        });
      }

      onSuccess(savedQuote);
      onClose();
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to save quotation' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!opened) return null;

  const formContent = (
    <>
      {/* Header */}
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
              {quotation
                ? `Edit Quotation (${quotation.quotationNumber})`
                : initialLead
                ? `Create Quotation • ${initialLead.name}`
                : 'Quotation Maker • New Quotation'}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              {initialLead
                ? `Build and save quotation for ${initialLead.name} (${initialLead.companyName || 'Lead'}) directly in CRM database`
                : 'Prepare itemized estimate with catalogue products, GST rates, and terms (Stored in CRM Database)'}
            </Text>
          </div>
        </Group>

        {embedded ? (
          <Button
            variant="light"
            color="gray"
            size="sm"
            radius="md"
            leftSection={<IconArrowLeft size={16} />}
            onClick={onClose}
            style={{ fontWeight: 600 }}
          >
            Back to Quotations
          </Button>
        ) : (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            radius="100px"
            onClick={onClose}
          >
            <IconX size={18} />
          </ActionIcon>
        )}
      </Group>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Client Details Section */}
          <Paper p="md" withBorder radius="lg" style={{ background: isDark ? '#111827' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0' }}>
            <Group justify="space-between" align="center" mb="xs">
              <Text fw={700} size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                Client Information {initialLead ? '(Auto-fetched from Lead)' : '(CRM Contact / Organization)'}
              </Text>
              {initialLead && (
                <Badge size="xs" variant="light" color="indigo" radius="sm">
                  Lead: {initialLead.name}
                </Badge>
              )}
            </Group>
            <Grid gutter="xs">
              {!initialLead && (
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
              )}
              <Grid.Col span={{ base: 12, sm: initialLead ? 6 : 6 }}>
                <TextInput
                  label="Contact / Client Name"
                  placeholder="e.g. Rahul Sharma"
                  value={contactName}
                  onChange={(e) => setContactName(e.currentTarget.value)}
                  required
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: initialLead ? 6 : 4 }}>
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
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Client GSTIN"
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  value={clientGst}
                  onChange={(e) => setClientGst(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: initialLead ? 12 : 8 }}>
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

          {/* Validity & Dates */}
          <Grid gutter="xs">
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput
                label={initialLead ? 'Proposal Date' : 'Quotation Date'}
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

                {selectedCatalogueProduct && (
                  <Button
                    variant="light"
                    color="indigo"
                    size="compact-xs"
                    radius="sm"
                    leftSection={<IconPlus size={12} />}
                    onClick={() => {
                      if (selectedProductModules.length > 0) {
                        handleAddAllModules(selectedCatalogueProduct);
                      } else {
                        handleAddProductLineItem(selectedCatalogueProduct);
                      }
                    }}
                  >
                    {selectedProductModules.length > 0
                      ? `Add All ${selectedCatalogueProduct.name} Modules (${selectedProductModules.length})`
                      : `+ Add "${selectedCatalogueProduct.name}" (₹${selectedCatalogueProduct.unitPrice?.toLocaleString('en-IN')})`}
                  </Button>
                )}
              </Group>
            </Paper>

            <Box style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover withTableBorder withColumnBorders style={{ minWidth: 800 }}>
                <Table.Thead>
                  <Table.Tr style={{ background: isDark ? '#0F172A' : '#F8FAFC' }}>
                    <Table.Th style={{ width: '36%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Items / Item Description
                    </Table.Th>
                    <Table.Th style={{ width: '7%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Qty
                    </Table.Th>
                    <Table.Th style={{ width: '14%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Unit Rate (₹)
                    </Table.Th>
                    <Table.Th style={{ width: '17%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Discount
                    </Table.Th>
                    <Table.Th style={{ width: '10%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      GST %
                    </Table.Th>
                    <Table.Th style={{ width: '12%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                      Total (₹)
                    </Table.Th>
                    <Table.Th style={{ width: '4%', textAlign: 'center' }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.map((item, idx) => {
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.unitPrice) || 0;
                    const gross = qty * price;
                    const disc = Number(item.discount) || 0;
                    const discType = item.discountType || 'percentage';
                    const lineDiscAmt = discType === 'percentage' ? (gross * disc) / 100 : Math.min(gross, disc);

                    return (
                      <Table.Tr key={idx}>
                        <Table.Td>
                          <Autocomplete
                            placeholder="Type or select product/service, enter item description..."
                            data={autocompleteOptions}
                            value={item.itemName || ''}
                            onChange={(val) => updateItem(idx, 'itemName', val)}
                            onOptionSubmit={(val) => handleItemSelect(idx, val)}
                            size="xs"
                            radius="sm"
                            style={{ width: '100%' }}
                            required
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
                          <Group gap={3} wrap="nowrap" align="center">
                            <Select
                              data={[
                                { value: 'percentage', label: '%' },
                                { value: 'fixed', label: '₹' },
                              ]}
                              value={item.discountType || 'percentage'}
                              onChange={(v) => updateItem(idx, 'discountType', v || 'percentage')}
                              size="xs"
                              radius="sm"
                              style={{ width: 54 }}
                              comboboxProps={{ withinPortal: false }}
                            />
                            <NumberInput
                              value={item.discount}
                              onChange={(val) => updateItem(idx, 'discount', Number(val) || 0)}
                              min={0}
                              size="xs"
                              radius="sm"
                              style={{ width: 70 }}
                            />
                          </Group>
                          {disc > 0 && discType === 'percentage' && (
                            <Text size="10px" c="green" mt={2} ta="right">
                              -₹{lineDiscAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </Text>
                          )}
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
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Box>

            {/* Calculations Box matching PDF & DB */}
            <Group justify="flex-end" mt="md">
              <Box style={{ width: 340 }}>
                <Stack gap={6}>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Subtotal before discounts:</Text>
                    <Text size="xs" fw={600}>₹{grossSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  </Group>

                  <Group justify="space-between">
                    <Text size="xs" c={totalItemDiscount > 0 ? 'green' : 'dimmed'}>Total Item-wise Discount:</Text>
                    <Text size="xs" fw={600} c={totalItemDiscount > 0 ? 'green' : 'dimmed'}>
                      {totalItemDiscount > 0 ? `-₹${totalItemDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00'}
                    </Text>
                  </Group>

                  <Group justify="space-between">
                    <Group gap={4}>
                      <Text size="xs" c="dimmed">Overall Discount:</Text>
                      <Select
                        data={[{ value: 'percentage', label: '%' }, { value: 'fixed', label: '₹' }]}
                        value={discountType}
                        onChange={(v) => setDiscountType((v as any) || 'percentage')}
                        size="xs"
                        radius="xs"
                        style={{ width: 56 }}
                        comboboxProps={{ withinPortal: false }}
                      />
                      <NumberInput
                        value={discountValue}
                        onChange={(v) => setDiscountValue(Number(v) || 0)}
                        min={0}
                        size="xs"
                        radius="xs"
                        style={{ width: 68 }}
                      />
                    </Group>
                    <Text size="xs" fw={600} c={overallDiscount > 0 ? 'green' : 'dimmed'}>
                      {overallDiscount > 0 ? `-₹${overallDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00'}
                    </Text>
                  </Group>

                  <Divider my={2} />

                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Taxable Amount:</Text>
                    <Text size="xs" fw={600}>₹{taxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  </Group>

                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">GST Amount:</Text>
                    <Text size="xs" fw={600}>₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  </Group>

                  <Divider my={2} />

                  <Group justify="space-between">
                    <Text size="sm" fw={700}>Grand Total:</Text>
                    <Text size="sm" fw={800} c="indigo">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
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
    </>
  );

  if (embedded) {
    return (
      <Paper
        p={{ base: 'md', sm: 'xl' }}
        radius="lg"
        style={{
          background: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        {formContent}
      </Paper>
    );
  }

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
      {formContent}
    </Modal>
  );
};
