import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  TextInput,
  Select,
  NumberInput,
  Textarea,
  ActionIcon,
  Table,
  Badge,
  Box,
  Divider,
  Grid,
  Card,
  Tooltip,
  SegmentedControl,
  FileInput,
  useComputedColorScheme,
  Alert,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconCheck,
  IconDeviceFloppy,
  IconSend,
  IconCalculator,
  IconBuilding,
  IconFileInvoice,
  IconCash,
  IconInfoCircle,
  IconUpload,
  IconReceipt2,
  IconBriefcase,
  IconSparkles,
  IconPencil,
  IconCalendar,
  IconFolders,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Invoice, InvoiceItem, InvoiceType, TaxType } from '../../types/billing';
import { billingService } from '../../services/billingService';
import { projectService } from '../../services/projectService';
import { settingsService } from '../../services/settingsService';
import { Project, ProjectModuleItem } from '../../types/project';
import { MasterProject } from '../../types/settings';
import { useCustomer } from '../../context/CustomerContext';
import { useCRM } from '../../context/CRMContext';
import { crmApi } from '../../services/api';

interface LineItemFormState {
  id?: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
}

interface CreateInvoicePageProps {
  onBack: () => void;
  onSuccess: (invoice: Invoice) => void;
  initialInvoice?: Invoice | null;
}

const COMMON_IT_CATALOG = [
  { name: 'Custom Full-Stack Web Application', price: 150000, tax: 18, desc: 'Enterprise responsive web portal architecture & React/Node implementation' },
  { name: 'Mobile App Development (iOS & Android)', price: 180000, tax: 18, desc: 'Native/Flutter cross-platform mobile app with cloud API sync' },
  { name: 'Cloud Infrastructure & DevOps CI/CD', price: 90000, tax: 18, desc: 'AWS/GCP Kubernetes deployment, Docker containerization, and automated pipeline' },
  { name: 'CRM & ERP Custom Integration', price: 80000, tax: 18, desc: 'Custom API webhooks, third-party ERP data migration and staff onboarding' },
  { name: 'Annual Software Maintenance SLA', price: 60000, tax: 18, desc: '24/7 Priority support SLA, bug fixes, security audits and performance tuning' },
  { name: 'UI/UX Design & Brand System', price: 45000, tax: 18, desc: 'Interactive Figma design system, prototypes, and user journey optimization' },
];

export const CreateInvoicePage: React.FC<CreateInvoicePageProps> = ({
  onBack,
  onSuccess,
  initialInvoice,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { customers, fetchCustomers } = useCustomer();
  const { currentUser } = useCRM();

  const isEdit = Boolean(initialInvoice);

  // Section A: Invoice Information
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoice?.invoiceNumber || '');
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(
    initialInvoice?.invoiceDate ? new Date(initialInvoice.invoiceDate) : new Date()
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    initialInvoice?.dueDate ? new Date(initialInvoice.dueDate) : new Date(Date.now() + 30 * 86400000)
  );
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(
    initialInvoice?.invoiceType || 'One-Time'
  );
  const [currency, setCurrency] = useState(initialInvoice?.currency || 'INR');
  const [paymentTerms, setPaymentTerms] = useState(initialInvoice?.paymentTerms || 'Net 30');
  const [status, setStatus] = useState(initialInvoice?.status || 'Draft');

  // Project Management & Master Project Catalog Integration
  const [projects, setProjects] = useState<Project[]>([]);
  const [catalogProjects, setCatalogProjects] = useState<MasterProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialInvoice?.projectId || null);
  const [projectName, setProjectName] = useState(initialInvoice?.projectName || initialInvoice?.projectTitle || '');
  const [isManualProject, setIsManualProject] = useState<boolean>(false);

  useEffect(() => {
    projectService.getProjects({ limit: 100 }).then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setProjects(res.data);
      }
    }).catch(() => {});

    settingsService.getMasterProjects().then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setCatalogProjects(res.data);
      }
    }).catch(() => {});
  }, []);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    const foundProject = projects.find((p) => p.id === selectedProjectId);
    if (foundProject) return foundProject;

    const cleanId = selectedProjectId.startsWith('cat:') ? selectedProjectId.replace('cat:', '') : selectedProjectId;
    const catFound = catalogProjects.find((c) => c.id === cleanId || c.projectCode === cleanId);
    if (catFound) {
      return {
        id: catFound.id,
        name: catFound.name,
        projectId: catFound.projectCode || 'CATALOG',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        estimatedBudget: catFound.basePrice || 0,
        modules: Array.isArray(catFound.modules) ? catFound.modules.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description || `Module deliverables & development for ${m.name} (${catFound.name})`,
          price: m.price,
        })) : [],
      } as unknown as Project;
    }
    return null;
  }, [selectedProjectId, projects, catalogProjects]);

  const handleSelectProject = (projId: string | null) => {
    setSelectedProjectId(projId);
    if (!projId) {
      setProjectName('');
      return;
    }
    const cleanId = projId.startsWith('cat:') ? projId.replace('cat:', '') : projId;
    const catFound = catalogProjects.find((c) => c.id === cleanId || c.projectCode === cleanId);
    if (catFound) {
      setProjectName(catFound.name);
      notifications.show({
        color: 'indigo',
        title: `Project Catalog: ${catFound.name}`,
        message: `${catFound.modules?.length || 0} module(s) available in Line Items.`,
      });
      return;
    }

    const found = projects.find((p) => p.id === projId);
    if (found) {
      setProjectName(found.name);
      if (!customerName.trim() && found.clientName) {
        setCustomerName(found.clientName);
      }
      if (!email.trim() && found.clientEmail) {
        setEmail(found.clientEmail);
      }
      if (!phone.trim() && found.clientPhone) {
        setPhone(found.clientPhone);
      }
      notifications.show({
        color: 'indigo',
        title: `Project: ${found.name}`,
        message: `${found.modules?.length || 0} module(s) available in Line Items.`,
      });
    }
  };

  const handleAddAllProjectModules = (proj: any) => {
    if (!proj.modules || proj.modules.length === 0) {
      notifications.show({ color: 'yellow', message: 'No modules found for this project' });
      return;
    }
    const defaultUnitRate =
      proj.estimatedBudget && proj.estimatedBudget > 0
        ? Math.round(proj.estimatedBudget / proj.modules.length)
        : 35000;
    const newItems: LineItemFormState[] = proj.modules.map((m: any) => {
      const qty = 1;
      const price = Number(m.price) || defaultUnitRate;
      const disc = 0;
      const taxRate = 18;
      const taxable = qty * price;
      const taxAmt = Number(((taxable * taxRate) / 100).toFixed(2));
      const lineTotal = Number((taxable + taxAmt).toFixed(2));
      return {
        itemName: m.name,
        description: m.description || `Module deliverables & deployment for ${m.name} (${proj.name})`,
        quantity: qty,
        unitPrice: price,
        discountPercent: disc,
        taxRate,
        taxableAmount: taxable,
        taxAmount: taxAmt,
        lineTotal,
      };
    });
    if (items.length === 1 && !items[0].itemName.trim()) {
      setItems(newItems);
    } else {
      setItems([...items, ...newItems]);
    }
    notifications.show({
      color: 'teal',
      message: `Loaded all ${newItems.length} modules from "${proj.name}"`,
    });
  };

  // Section B: Customer and Billing Details
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialInvoice?.customerId || initialInvoice?.contactId || ''
  );
  const [customerName, setCustomerName] = useState(initialInvoice?.companyName || initialInvoice?.contactName || '');
  const [customerIdCode, setCustomerIdCode] = useState(initialInvoice?.customerId || '');
  const [contactPerson, setContactPerson] = useState(initialInvoice?.contactPerson || initialInvoice?.contactName || '');
  const [email, setEmail] = useState(initialInvoice?.contactEmail || '');
  const [phone, setPhone] = useState(initialInvoice?.contactPhone || '');
  const [billingAddress, setBillingAddress] = useState(initialInvoice?.clientAddress || '');
  const [gstin, setGstin] = useState(initialInvoice?.clientGst || '');
  const [customerState, setCustomerState] = useState(initialInvoice?.clientState || 'Tamil Nadu');
  const [customerTier, setCustomerTier] = useState(initialInvoice?.customerTier || 'Enterprise');

  // Section C: Invoice Items
  const [items, setItems] = useState<LineItemFormState[]>(() => {
    if (initialInvoice?.items && initialInvoice.items.length > 0) {
      return initialInvoice.items.map((it) => {
        const qty = it.quantity || 1;
        const price = it.unitPrice || 0;
        const discPct = it.discountPercent || (price * qty > 0 ? ((it.discount || 0) / (price * qty)) * 100 : 0);
        const lineDisc = it.discount || (qty * price * discPct) / 100;
        const taxable = Math.max(0, qty * price - lineDisc);
        const taxRate = it.taxRate ?? 18;
        const taxAmt = (taxable * taxRate) / 100;
        return {
          id: it.id,
          itemName: it.itemName,
          description: it.description || '',
          quantity: qty,
          unitPrice: price,
          discountPercent: Number(discPct.toFixed(1)),
          taxRate,
          taxableAmount: taxable,
          taxAmount: taxAmt,
          lineTotal: taxable + taxAmt,
        };
      });
    }
    return [
      {
        itemName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxRate: 18,
        taxableAmount: 0,
        taxAmount: 0,
        lineTotal: 0,
      },
    ];
  });

  // Section D: Tax & Amount Summary
  const [taxType, setTaxType] = useState<TaxType>(
    initialInvoice?.taxType || 'INTRA_STATE'
  );
  const [additionalCharges, setAdditionalCharges] = useState<number>(
    initialInvoice?.additionalCharges || 0
  );
  const [overallDiscount, setOverallDiscount] = useState<number>(0);

  // Section E: Payment Tracking
  const [amountPaid, setAmountPaid] = useState<number>(initialInvoice?.amountPaid || 0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState<Date | null>(new Date());
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Section F: Additional Information
  const [notes, setNotes] = useState(
    initialInvoice?.notes || 'Thank you for partnering with OmniTech Solutions. Please process payment by the stipulated due date.'
  );
  const [termsConditions, setTermsConditions] = useState(
    initialInvoice?.termsConditions ||
      '1. Payment is due within the stipulated credit term from invoice date.\n2. In case of delayed payment, interest @ 18% per annum will be charged.\n3. Goods or services once delivered/rendered are not refundable.\n4. Subject to Chennai jurisdiction.'
  );
  const [internalRemarks, setInternalRemarks] = useState(initialInvoice?.internalRemarks || '');
  const [createdBy, setCreatedBy] = useState(initialInvoice?.createdBy || currentUser?.name || 'Admin');
  const [approvedBy, setApprovedBy] = useState(initialInvoice?.approvedBy || 'Operations Lead');

  const [loading, setLoading] = useState(false);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);

  // Load CRM Customers
  useEffect(() => {
    async function loadCusts() {
      try {
        const res = await crmApi.getCustomers();
        if (res.success && Array.isArray(res.data)) {
          setAllCustomers(res.data);
        } else if (customers && customers.length > 0) {
          setAllCustomers(customers);
        }
      } catch (_) {
        if (customers && customers.length > 0) {
          setAllCustomers(customers);
        }
      }
    }
    loadCusts();
  }, [customers]);

  // Load next invoice sequence for new invoice
  useEffect(() => {
    if (!isEdit && !invoiceNumber) {
      billingService
        .getSettings()
        .then((settings) => {
          if (settings) {
            const next = settings.invoiceNextNumber || 1001;
            setInvoiceNumber(`${settings.invoicePrefix || 'INV-2026-'}${String(next).padStart(6, '0')}`);
          }
        })
        .catch(() => {
          setInvoiceNumber(`INV-2026-${String(Math.floor(1000 + Math.random() * 9000))}`);
        });
    }
  }, [isEdit]);

  // Update Due Date based on Payment Terms
  const handlePaymentTermsChange = (val: string | null) => {
    const terms = val || 'Net 30';
    setPaymentTerms(terms);
    if (!invoiceDate) return;

    let daysToAdd = 30;
    if (terms === 'Due on Receipt') daysToAdd = 0;
    else if (terms === 'Net 15') daysToAdd = 15;
    else if (terms === 'Net 30') daysToAdd = 30;
    else if (terms === 'Net 45') daysToAdd = 45;
    else if (terms === 'Net 60') daysToAdd = 60;

    const newDue = new Date(invoiceDate.getTime() + daysToAdd * 86400000);
    setDueDate(newDue);
  };

  // Auto-populate Customer Details when Customer is Selected
  const handleSelectCustomer = (custVal: string | null) => {
    if (!custVal) return;
    setSelectedCustomerId(custVal);

    const found = allCustomers.find((c) => c.id === custVal || c.customerId === custVal || c.companyName === custVal);
    if (found) {
      setCustomerName(found.companyName || found.name);
      setCustomerIdCode(found.customerId || found.id);
      setContactPerson(found.contactPerson || found.name || '');
      setEmail(found.email || '');
      setPhone(found.phone || '');
      setBillingAddress(found.address ? `${found.address}, ${found.city || ''} ${found.state || ''}`.trim() : '');
      setGstin(found.gstNumber || '');
      setCustomerState(found.state || found.city || 'Tamil Nadu');
      setCustomerTier(found.customerTier || 'Enterprise');

      // Auto-detect Intra vs Inter-State GST
      const isTN = (found.state && found.state.toLowerCase().includes('tamil nadu')) ||
        (found.gstNumber && found.gstNumber.startsWith('33'));
      setTaxType(isTN ? 'INTRA_STATE' : 'INTER_STATE');

      notifications.show({
        message: `Customer details loaded for ${found.companyName || found.name}`,
        color: 'blue',
      });
    }
  };

  // Recalculate Line Item
  const updateLineItem = (index: number, field: keyof LineItemFormState, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };

      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const discPct = Math.max(0, Math.min(100, Number(item.discountPercent) || 0));
      const lineDisc = (qty * price * discPct) / 100;
      const taxable = Math.max(0, qty * price - lineDisc);
      const rate = taxType === 'EXPORT_NON_GST' ? 0 : Number(item.taxRate) || 0;
      const taxAmt = (taxable * rate) / 100;

      item.taxableAmount = Number(taxable.toFixed(2));
      item.taxAmount = Number(taxAmt.toFixed(2));
      item.lineTotal = Number((taxable + taxAmt).toFixed(2));

      copy[index] = item;
      return copy;
    });
  };

  const addLineItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxRate: 18,
        taxableAmount: 0,
        taxAmount: 0,
        lineTotal: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (items.length <= 1) {
      notifications.show({ message: 'At least one line item is required on the invoice.', color: 'orange' });
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick Catalog selection
  const handleCatalogPick = (index: number, catName: string) => {
    const found = COMMON_IT_CATALOG.find((c) => c.name === catName);
    if (!found) return;

    setItems((prev) => {
      const copy = [...prev];
      const qty = copy[index].quantity || 1;
      const price = found.price;
      const discPct = copy[index].discountPercent || 0;
      const lineDisc = (qty * price * discPct) / 100;
      const taxable = Math.max(0, qty * price - lineDisc);
      const taxAmt = (taxable * found.tax) / 100;

      copy[index] = {
        ...copy[index],
        itemName: found.name,
        description: found.desc,
        unitPrice: price,
        taxRate: found.tax,
        taxableAmount: taxable,
        taxAmount: taxAmt,
        lineTotal: taxable + taxAmt,
      };
      return copy;
    });
  };

  // Calculations for Summary
  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  const totalLineDiscounts = items.reduce((acc, it) => acc + ((it.quantity * it.unitPrice * it.discountPercent) / 100), 0);
  const totalDiscount = totalLineDiscounts + overallDiscount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);

  let totalTax = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (taxType !== 'EXPORT_NON_GST') {
    totalTax = items.reduce((acc, it) => acc + it.taxAmount, 0);
    if (taxType === 'INTRA_STATE') {
      cgstAmount = Number((totalTax / 2).toFixed(2));
      sgstAmount = Number((totalTax / 2).toFixed(2));
      igstAmount = 0;
    } else {
      igstAmount = Number(totalTax.toFixed(2));
      cgstAmount = 0;
      sgstAmount = 0;
    }
  }

  const grandTotal = Math.max(0, Number((taxableAmount + totalTax + additionalCharges).toFixed(2)));
  const calculatedBalanceDue = Math.max(0, Number((grandTotal - amountPaid).toFixed(2)));

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';

  const handleSaveInvoice = async (targetStatus?: string) => {
    if (!customerName.trim()) {
      notifications.show({ title: 'Customer Required', message: 'Please select or enter customer details.', color: 'red' });
      return;
    }

    if (items.some((it) => !it.itemName.trim() || it.unitPrice <= 0)) {
      notifications.show({
        title: 'Invalid Line Items',
        message: 'All items must have a valid item name and unit price greater than zero.',
        color: 'red',
      });
      return;
    }

    if (amountPaid > grandTotal) {
      notifications.show({
        title: 'Payment Amount Error',
        message: `Amount paid (${currencySymbol}${amountPaid}) cannot exceed Grand Total (${currencySymbol}${grandTotal}).`,
        color: 'red',
      });
      return;
    }

    try {
      setLoading(true);
      const invoicePayload: Partial<Invoice> = {
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate: invoiceDate ? invoiceDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        invoiceType,
        currency,
        paymentTerms,
        status: (targetStatus || status) as any,
        contactId: customerIdCode || selectedCustomerId || null,
        customerId: customerIdCode || selectedCustomerId || null,
        projectId: selectedProjectId || selectedProject?.id || null,
        projectName: projectName.trim() || null,
        projectTitle: projectName.trim() || null,
        contactName: contactPerson || customerName,
        contactPerson,
        companyName: customerName,
        contactEmail: email.trim() || null,
        contactPhone: phone.trim() || null,
        clientAddress: billingAddress.trim() || null,
        clientGst: gstin.trim() || null,
        clientState: customerState,
        customerTier,
        taxType,
        subtotal,
        discountAmount: totalDiscount,
        taxAmount: totalTax,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxableAmount,
        additionalCharges,
        grandTotal,
        amountPaid,
        outstandingBalance: calculatedBalanceDue,
        notes: notes.trim(),
        termsConditions: termsConditions.trim(),
        internalRemarks: internalRemarks.trim() || null,
        approvedBy: approvedBy.trim() || null,
        createdBy: createdBy.trim() || currentUser?.name || 'Admin',
        items: items.map((it) => ({
          itemName: it.itemName.trim(),
          description: it.description?.trim() || null,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: (it.quantity * it.unitPrice * it.discountPercent) / 100,
          discountPercent: it.discountPercent,
          taxRate: taxType === 'EXPORT_NON_GST' ? 0 : it.taxRate,
          taxAmount: taxType === 'EXPORT_NON_GST' ? 0 : it.taxAmount,
          taxableAmount: it.taxableAmount,
          totalAmount: it.lineTotal,
        })),
        ...(amountPaid > 0
          ? {
              advanceAmount: amountPaid,
              paymentMethod,
              paymentDate: paymentDate ? paymentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              transactionReference,
              paymentNotes,
            }
          : {}),
      };

      let resultInvoice: Invoice;
      if (isEdit && initialInvoice) {
        resultInvoice = await billingService.updateInvoice(initialInvoice.id, invoicePayload);
        notifications.show({
          title: 'Invoice Updated',
          message: `Invoice #${resultInvoice.invoiceNumber} has been updated successfully.`,
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
      } else {
        resultInvoice = await billingService.createInvoice(invoicePayload);
        notifications.show({
          title: targetStatus === 'Sent' ? 'Invoice Created & Sent' : 'Invoice Created',
          message: `Invoice #${resultInvoice.invoiceNumber} created with Grand Total ${currencySymbol}${grandTotal.toLocaleString('en-IN')}`,
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crm_invoices_updated'));
      }

      onSuccess(resultInvoice);
    } catch (err: any) {
      notifications.show({
        title: 'Submission Failed',
        message: err.message || 'Could not save invoice.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box pb={60}>
      {/* Top Header */}
      <Group justify="space-between" align="center" mb="lg">
        <Group gap="sm">
          <ActionIcon variant="subtle" size="lg" radius="md" onClick={onBack}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Box>
            <Title order={3} fw={800} style={{ letterSpacing: '-0.02em' }}>
              {isEdit ? `Edit Invoice: ${initialInvoice?.invoiceNumber}` : 'Create New Invoice'}
            </Title>
            <Text size="xs" c="dimmed">
              Configure invoice terms, customer billing profile, GST line items, and payment allocations
            </Text>
          </Box>
        </Group>

        <Group gap="xs">
          <Button variant="default" onClick={onBack} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="outline"
            color="blue"
            loading={loading}
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={() => handleSaveInvoice('Draft')}
          >
            Save as Draft
          </Button>
          <Button
            variant="filled"
            color="blue"
            loading={loading}
            leftSection={<IconSend size={16} />}
            onClick={() => handleSaveInvoice('Sent')}
          >
            {isEdit ? 'Update Invoice' : 'Create & Send'}
          </Button>
        </Group>
      </Group>

      <Stack gap="lg">
        {/* Section A: Invoice Information */}
        <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
          <Group gap="xs" mb="sm" align="center">
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: 'rgba(59, 130, 246, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <IconFileInvoice size={18} />
            </Box>
            <Text fw={700} size="sm">
              Section A: Invoice Information
            </Text>
          </Group>
          <Divider mb="md" />

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Invoice Number"
                description="Unique sequential identifier"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.currentTarget.value)}
                styles={{ input: { fontWeight: 700 } }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <DateInput
                label="Invoice Date"
                required
                value={invoiceDate}
                valueFormat="DD-MM-YYYY"
                placeholder="DD-MM-YYYY"
                leftSection={<IconCalendar size={14} color="#94A3B8" />}
                leftSectionPointerEvents="none"
                popoverProps={{ withinPortal: true, zIndex: 3000 }}
                onChange={(d) => {
                  setInvoiceDate(d);
                  if (d && paymentTerms) {
                    let days = 30;
                    if (paymentTerms === 'Due on Receipt') days = 0;
                    else if (paymentTerms === 'Net 15') days = 15;
                    else if (paymentTerms === 'Net 30') days = 30;
                    else if (paymentTerms === 'Net 45') days = 45;
                    setDueDate(new Date(d.getTime() + days * 86400000));
                  }
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <DateInput
                label="Due Date"
                required
                value={dueDate}
                valueFormat="DD-MM-YYYY"
                placeholder="DD-MM-YYYY"
                leftSection={<IconCalendar size={14} color="#94A3B8" />}
                leftSectionPointerEvents="none"
                popoverProps={{ withinPortal: true, zIndex: 3000 }}
                onChange={setDueDate}
                description="Payment cutoff date"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Payment Terms"
                required
                data={['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom']}
                value={paymentTerms}
                onChange={handlePaymentTermsChange}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Text size="xs" fw={500} mb={4}>
                Invoice Type
              </Text>
              <SegmentedControl
                fullWidth
                value={invoiceType}
                onChange={(val) => setInvoiceType(val as InvoiceType)}
                data={[
                  { label: 'One-Time Project', value: 'One-Time' },
                  { label: 'Recurring Subscription', value: 'Recurring' },
                ]}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Currency"
                required
                data={[
                  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
                  { value: 'USD', label: 'USD ($) - US Dollar' },
                  { value: 'EUR', label: 'EUR (€) - Euro' },
                  { value: 'GBP', label: 'GBP (£) - British Pound' },
                ]}
                value={currency}
                onChange={(val) => setCurrency(val || 'INR')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Invoice Status"
                required
                data={['Draft', 'Sent', 'Partially Paid', 'Paid', 'Cancelled']}
                value={status}
                onChange={(val) => setStatus((val as any) || 'Draft')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              {isManualProject ? (
                <TextInput
                  label={
                    <Group justify="space-between" align="center" style={{ width: '100%' }}>
                      <Text size="xs" fw={500}>
                        Project Name / Title
                      </Text>
                      <Text
                        size="xs"
                        c="blue"
                        style={{ cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setIsManualProject(false)}
                      >
                        <IconBriefcase size={12} /> Select from Project Catalog / Management
                      </Text>
                    </Group>
                  }
                  placeholder="Type project title manually (e.g. Venus Implementation)"
                  value={projectName}
                  onChange={(e) => setProjectName(e.currentTarget.value)}
                  description="Manual project or engagement title"
                />
              ) : (
                <Select
                  label={
                    <Group justify="space-between" align="center" style={{ width: '100%' }}>
                      <Text size="xs" fw={500}>
                        Project (Project Catalog & Management)
                      </Text>
                      <Text
                        size="xs"
                        c="blue"
                        style={{ cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setIsManualProject(true)}
                      >
                        <IconPencil size={12} /> Enter Manually
                      </Text>
                    </Group>
                  }
                  placeholder="Select project from Project Catalog (e.g. Venus) or Project Management..."
                  data={[
                    ...(catalogProjects.length > 0 ? [{
                      group: '📁 Project Catalog (Templates & Products)',
                      items: catalogProjects.map((c) => ({
                        value: `cat:${c.id}`,
                        label: `📁 ${c.name} ${c.projectCode ? `(${c.projectCode})` : ''} • ${c.modules?.length || 0} modules ${c.basePrice ? `• ₹${Number(c.basePrice).toLocaleString('en-IN')}` : ''}`,
                      })),
                    }] : []),
                    ...(projects.length > 0 ? [{
                      group: '🏢 Active Client Projects',
                      items: projects.map((p) => ({
                        value: p.id,
                        label: `🏢 ${p.name} ${p.clientName ? `• ${p.clientName}` : ''}`,
                      })),
                    }] : []),
                  ]}
                  value={selectedProjectId || null}
                  onChange={handleSelectProject}
                  searchable
                  clearable
                  description="Select a project template from Project Catalog (e.g. Venus) or active client projects to automatically load modules and rates"
                  nothingFoundMessage="No projects found in Project Catalog or Management"
                />
              )}
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Section B: Customer and Billing Details */}
        <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
          <Group justify="space-between" mb="sm" align="center">
            <Group gap="xs">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                }}
              >
                <IconBuilding size={18} />
              </Box>
              <Box>
                <Text fw={700} size="sm">
                  Section B: Customer and Billing Details
                </Text>
                <Text size="11px" c="dimmed">
                  Selecting a CRM Customer auto-populates all verification and billing fields without duplication
                </Text>
              </Box>
            </Group>

            {customerIdCode && (
              <Badge color="blue" variant="light" size="sm">
                Linked Customer: {customerIdCode}
              </Badge>
            )}
          </Group>
          <Divider mb="md" />

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Customer Name (From CRM Directory)"
                placeholder="Choose registered customer..."
                searchable
                clearable
                required
                data={allCustomers.map((c) => ({
                  value: c.id,
                  label: `${c.companyName || c.name} (${c.customerId || 'CRM Client'})`,
                }))}
                value={selectedCustomerId}
                onChange={handleSelectCustomer}
                description="Auto-syncs contact person, GSTIN, and state for tax determination"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Customer ID"
                value={customerIdCode}
                onChange={(e) => setCustomerIdCode(e.currentTarget.value)}
                placeholder="e.g. CUST-1001"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Contact Person"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.currentTarget.value)}
                placeholder="Billing representative"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="accounts@client.com"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                placeholder="+91 98765 43210"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Customer GSTIN"
                value={gstin}
                onChange={(e) => {
                  const val = e.currentTarget.value.toUpperCase();
                  setGstin(val);
                  if (val.startsWith('33')) {
                    setTaxType('INTRA_STATE');
                  } else if (val.length >= 2) {
                    setTaxType('INTER_STATE');
                  }
                }}
                placeholder="e.g. 33AAACZ1234A1Z5"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Registered State"
                value={customerState}
                onChange={(e) => setCustomerState(e.currentTarget.value)}
                placeholder="e.g. Tamil Nadu, Karnataka"
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <TextInput
                label="Billing Address"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.currentTarget.value)}
                placeholder="Registered corporate / branch office street address, city, pincode"
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Section C: Invoice Items */}
        <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
          <Group justify="space-between" mb="sm" align="center">
            <Group gap="xs">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: 'rgba(245, 158, 11, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                }}
              >
                <IconCalculator size={18} />
              </Box>
              <Box>
                <Text fw={700} size="sm">
                  Section C: Invoice Items
                </Text>
                <Text size="11px" c="dimmed">
                  Dynamic line items with instant tax, discount, and line total computation
                </Text>
              </Box>
            </Group>

            <Group gap="xs">
              {selectedProject && selectedProject.modules && selectedProject.modules.length > 0 && (
                <Button
                  variant="light"
                  color="violet"
                  size="xs"
                  leftSection={<IconSparkles size={14} />}
                  onClick={() => handleAddAllProjectModules(selectedProject)}
                >
                  Add All {selectedProject.name} Modules ({selectedProject.modules.length})
                </Button>
              )}

              <Button
                variant="light"
                color="blue"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={addLineItem}
              >
                Add Item
              </Button>
            </Group>
          </Group>
          <Divider mb="md" />

          <Box style={{ overflowX: 'auto' }}>
            <Table withTableBorder withColumnBorders style={{ minWidth: 900, fontSize: 13 }}>
              <Table.Thead style={{ background: isDark ? 'var(--mantine-color-dark-6)' : '#F8FAFC' }}>
                <Table.Tr>
                  <Table.Th style={{ width: 40, textAlign: 'center' }}>#</Table.Th>
                  <Table.Th style={{ minWidth: 260 }}>Item / Service Name & Description</Table.Th>
                  <Table.Th style={{ width: 90, textAlign: 'center' }}>Qty</Table.Th>
                  <Table.Th style={{ width: 130, textAlign: 'right' }}>Unit Price ({currencySymbol})</Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>Disc %</Table.Th>
                  <Table.Th style={{ width: 110, textAlign: 'center' }}>GST Rate</Table.Th>
                  <Table.Th style={{ width: 130, textAlign: 'right' }}>Taxable Amt</Table.Th>
                  <Table.Th style={{ width: 140, textAlign: 'right' }}>Line Total ({currencySymbol})</Table.Th>
                  <Table.Th style={{ width: 50, textAlign: 'center' }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((it, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td style={{ textAlign: 'center', fontWeight: 600, color: '#94A3B8' }}>
                      {idx + 1}
                    </Table.Td>

                    <Table.Td>
                      <Stack gap={6}>
                        <Group gap={6} wrap="nowrap">
                          <TextInput
                            placeholder="Item or service name..."
                            required
                            style={{ flex: 1 }}
                            value={it.itemName}
                            onChange={(e) => updateLineItem(idx, 'itemName', e.currentTarget.value)}
                          />
                          <Select
                            placeholder="Preset / Catalog"
                            style={{ width: 170 }}
                            data={[
                              ...(selectedProject?.modules && selectedProject.modules.length > 0 ? [{
                                group: `🎯 Selected: ${selectedProject.name}`,
                                items: selectedProject.modules.map((m: any) => ({
                                  value: `__PROJ__:${m.name}`,
                                  label: `🎯 ${m.name} ${m.price ? `(₹${Number(m.price).toLocaleString('en-IN')})` : ''}`,
                                })),
                              }] : []),
                              ...(catalogProjects.length > 0 ? [{
                                group: '📁 Project Catalog (Templates)',
                                items: catalogProjects.flatMap((cp) => [
                                  {
                                    value: `__CAT_PROJ__:${cp.id}`,
                                    label: `📦 Full: ${cp.name} ${cp.basePrice ? `(₹${Number(cp.basePrice).toLocaleString('en-IN')})` : ''}`,
                                  },
                                  ...(cp.modules || []).map((cm) => ({
                                    value: `__CAT_MOD__:${cp.id}:${cm.name}`,
                                    label: `🧩 ${cm.name} (${cp.name}) ${cm.price ? `(₹${Number(cm.price).toLocaleString('en-IN')})` : ''}`,
                                  })),
                                ]),
                              }] : []),
                              {
                                group: 'Common IT Services',
                                items: COMMON_IT_CATALOG.map((c) => ({ value: c.name, label: `${c.name} (₹${c.price.toLocaleString('en-IN')})` })),
                              },
                            ]}
                            onChange={(val) => {
                              if (!val) return;
                              if (val.startsWith('__PROJ__:')) {
                                const modName = val.replace('__PROJ__:', '');
                                const projMod = selectedProject?.modules?.find((m: any) => m.name === modName);
                                if (projMod) {
                                  updateLineItem(idx, 'itemName', projMod.name);
                                  if ((projMod as any).price) {
                                    updateLineItem(idx, 'unitPrice', Number((projMod as any).price));
                                  }
                                  updateLineItem(
                                    idx,
                                    'description',
                                    projMod.description || `Module deliverables & deployment for ${projMod.name}${selectedProject?.name ? ` (${selectedProject.name})` : ''}`
                                  );
                                }
                              } else if (val.startsWith('__CAT_PROJ__:')) {
                                const catId = val.replace('__CAT_PROJ__:', '');
                                const cp = catalogProjects.find((c) => c.id === catId);
                                if (cp) {
                                  updateLineItem(idx, 'itemName', `${cp.name} - Complete Project Package`);
                                  updateLineItem(
                                    idx,
                                    'description',
                                    cp.description || `Deliverables: ${cp.deliverables?.join(', ') || 'Architecture, Design, APIs, Database & Deployment'}`
                                  );
                                  if (cp.basePrice) {
                                    updateLineItem(idx, 'unitPrice', Number(cp.basePrice));
                                  }
                                }
                              } else if (val.startsWith('__CAT_MOD__:')) {
                                const rest = val.replace('__CAT_MOD__:', '');
                                const firstColon = rest.indexOf(':');
                                const catId = rest.slice(0, firstColon);
                                const modName = rest.slice(firstColon + 1);
                                const cp = catalogProjects.find((c) => c.id === catId);
                                const cm = cp?.modules?.find((m) => m.name === modName);
                                if (cm) {
                                  updateLineItem(idx, 'itemName', cm.name);
                                  updateLineItem(
                                    idx,
                                    'description',
                                    cm.description || `Module deliverables & development for ${cm.name} (${cp?.name || 'Project'})`
                                  );
                                  if (cm.price) {
                                    updateLineItem(idx, 'unitPrice', Number(cm.price));
                                  }
                                }
                              } else {
                                handleCatalogPick(idx, val);
                              }
                            }}
                          />
                        </Group>
                        <TextInput
                          placeholder="Scope description, deliverables, or specifications..."
                          size="xs"
                          value={it.description}
                          onChange={(e) => updateLineItem(idx, 'description', e.currentTarget.value)}
                        />
                      </Stack>
                    </Table.Td>

                    <Table.Td>
                      <NumberInput
                        min={1}
                        value={it.quantity}
                        onChange={(v) => updateLineItem(idx, 'quantity', Number(v) || 1)}
                        styles={{ input: { textAlign: 'center' } }}
                      />
                    </Table.Td>

                    <Table.Td>
                      <NumberInput
                        min={0}
                        value={it.unitPrice}
                        onChange={(v) => updateLineItem(idx, 'unitPrice', Number(v) || 0)}
                        decimalScale={2}
                        thousandSeparator=","
                        styles={{ input: { textAlign: 'right', fontWeight: 600 } }}
                      />
                    </Table.Td>

                    <Table.Td>
                      <NumberInput
                        min={0}
                        max={100}
                        value={it.discountPercent}
                        onChange={(v) => updateLineItem(idx, 'discountPercent', Number(v) || 0)}
                        styles={{ input: { textAlign: 'center' } }}
                      />
                    </Table.Td>

                    <Table.Td>
                      <Select
                        data={[
                          { value: '0', label: '0% (Exempt)' },
                          { value: '5', label: '5%' },
                          { value: '12', label: '12%' },
                          { value: '18', label: '18% (Standard)' },
                          { value: '28', label: '28%' },
                        ]}
                        value={String(it.taxRate)}
                        onChange={(v) => updateLineItem(idx, 'taxRate', Number(v) || 0)}
                        styles={{ input: { textAlign: 'center' } }}
                      />
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {currencySymbol}{it.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'right', fontWeight: 800, color: '#0284C7' }}>
                      {currencySymbol}{it.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'center' }}>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => removeLineItem(idx)}
                        disabled={items.length <= 1}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>

          <Group justify="flex-start" mt="sm">
            <Button
              variant="subtle"
              color="blue"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={addLineItem}
            >
              Add Item Row
            </Button>
          </Group>
        </Paper>

        {/* Section D: Tax and Amount Summary */}
        <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
          <Group justify="space-between" mb="sm" align="center">
            <Group gap="xs">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: 'rgba(147, 51, 234, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9333EA',
                }}
              >
                <IconReceipt2 size={18} />
              </Box>
              <Box>
                <Text fw={700} size="sm">
                  Section D: Tax & Amount Summary
                </Text>
                <Text size="11px" c="dimmed">
                  GST compliant tax calculation without double-counting (Intra-state vs Inter-state)
                </Text>
              </Box>
            </Group>
          </Group>
          <Divider mb="md" />

          <Grid gutter="xl">
            {/* Left: GST Configuration */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <Box>
                  <Text size="xs" fw={700} mb={6}>
                    GST Tax Jurisdiction Rules:
                  </Text>
                  <SegmentedControl
                    fullWidth
                    value={taxType}
                    onChange={(val) => setTaxType(val as TaxType)}
                    data={[
                      { label: 'Intra-State (CGST + SGST)', value: 'INTRA_STATE' },
                      { label: 'Inter-State (IGST)', value: 'INTER_STATE' },
                      { label: 'Export / Non-GST (0%)', value: 'EXPORT_NON_GST' },
                    ]}
                  />
                  <Text size="11px" c="dimmed" mt={6}>
                    {taxType === 'INTRA_STATE'
                      ? '• Intra-State Sale (within Tamil Nadu): Tax split equally into CGST (50%) and SGST (50%).'
                      : taxType === 'INTER_STATE'
                      ? '• Inter-State Sale (outside Tamil Nadu): Tax charged as unified IGST (100%). No CGST/SGST.'
                      : '• Zero-rated export or SEZ transaction without GST levy.'}
                  </Text>
                </Box>

                <Group grow>
                  <NumberInput
                    label="Additional Charges"
                    description="Shipping, setup, or handling fees"
                    min={0}
                    value={additionalCharges}
                    onChange={(v) => setAdditionalCharges(Number(v) || 0)}
                    prefix={currencySymbol + ' '}
                    decimalScale={2}
                  />

                  <NumberInput
                    label="Extra Overall Discount"
                    description="Lump-sum discount on invoice"
                    min={0}
                    value={overallDiscount}
                    onChange={(v) => setOverallDiscount(Number(v) || 0)}
                    prefix={currencySymbol + ' '}
                    decimalScale={2}
                  />
                </Group>
              </Stack>
            </Grid.Col>

            {/* Right: Amount Summary Table */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" radius="md" withBorder style={{ backgroundColor: isDark ? 'var(--mantine-color-dark-6)' : '#F8FAFC' }}>
                <Stack gap={6}>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Subtotal (Gross Item Total):
                    </Text>
                    <Text size="xs" fw={700}>
                      {currencySymbol}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>

                  {totalDiscount > 0 && (
                    <Group justify="space-between">
                      <Text size="xs" c="orange">
                        Total Discount:
                      </Text>
                      <Text size="xs" fw={700} c="orange">
                        -{currencySymbol}{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Text>
                    </Group>
                  )}

                  <Group justify="space-between">
                    <Text size="xs" fw={600} c="dimmed">
                      Taxable Amount:
                    </Text>
                    <Text size="xs" fw={700}>
                      {currencySymbol}{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>

                  <Divider my={4} />

                  {taxType === 'INTRA_STATE' ? (
                    <>
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">
                          CGST (Central GST - 50% of tax):
                        </Text>
                        <Text size="xs" fw={600} c="blue">
                          {currencySymbol}{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">
                          SGST (State GST - 50% of tax):
                        </Text>
                        <Text size="xs" fw={600} c="blue">
                          {currencySymbol}{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </Group>
                    </>
                  ) : taxType === 'INTER_STATE' ? (
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        IGST (Integrated GST - 100% of tax):
                      </Text>
                      <Text size="xs" fw={600} c="blue">
                        {currencySymbol}{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Text>
                    </Group>
                  ) : (
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        GST Levy (Export / Exempt):
                      </Text>
                      <Text size="xs" fw={600} c="teal">
                        {currencySymbol}0.00
                      </Text>
                    </Group>
                  )}

                  {additionalCharges > 0 && (
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        Additional Charges:
                      </Text>
                      <Text size="xs" fw={600}>
                        {currencySymbol}{additionalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Text>
                    </Group>
                  )}

                  <Divider my={6} color="#CBD5E1" />

                  <Group justify="space-between">
                    <Text size="md" fw={800} c="#0F172A">
                      Grand Total:
                    </Text>
                    <Text size="lg" fw={900} c="#0284C7">
                      {currencySymbol}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>

                  <Group justify="space-between">
                    <Text size="xs" fw={600} c="teal">
                      Amount Paid (Advance / Received):
                    </Text>
                    <Text size="xs" fw={700} c="teal">
                      {currencySymbol}{amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>

                  <Group justify="space-between" pt={4} style={{ borderTop: '1px dashed #CBD5E1' }}>
                    <Text size="sm" fw={800} c="red">
                      Balance Due:
                    </Text>
                    <Text size="md" fw={900} c="red">
                      {currencySymbol}{calculatedBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Section E: Payment Tracking */}
        <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
          <Group gap="xs" mb="sm" align="center">
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <IconCash size={18} />
            </Box>
            <Box>
              <Text fw={700} size="sm">
                Section E: Payment Tracking
              </Text>
              <Text size="11px" c="dimmed">
                Optionally record initial kickoff advance or existing payment against this invoice
              </Text>
            </Box>
          </Group>
          <Divider mb="md" />

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <NumberInput
                label="Amount Received (Advance)"
                description="Must not exceed Grand Total"
                min={0}
                max={grandTotal}
                value={amountPaid}
                onChange={(v) => setAmountPaid(Number(v) || 0)}
                prefix={currencySymbol + ' '}
                decimalScale={2}
                thousandSeparator=","
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Payment Method"
                data={['Bank Transfer', 'UPI', 'Credit Card', 'Cheque', 'Cash']}
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val || 'Bank Transfer')}
                disabled={amountPaid <= 0}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <DateInput
                label="Payment Date"
                value={paymentDate}
                valueFormat="DD-MM-YYYY"
                placeholder="DD-MM-YYYY"
                leftSection={<IconCalendar size={14} color="#94A3B8" />}
                leftSectionPointerEvents="none"
                popoverProps={{ withinPortal: true, zIndex: 3000 }}
                onChange={setPaymentDate}
                disabled={amountPaid <= 0}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Transaction Reference / UTR"
                placeholder="e.g. HDFC98234120"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.currentTarget.value)}
                disabled={amountPaid <= 0}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <TextInput
                label="Payment Notes"
                placeholder="Optional notes regarding the transaction or bank receipt..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.currentTarget.value)}
                disabled={amountPaid <= 0}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Section F: Additional Information */}
        <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-7)' : '#FFFFFF' }}>
          <Group gap="xs" mb="sm" align="center">
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: 'rgba(99, 102, 241, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4F46E5',
              }}
            >
              <IconInfoCircle size={18} />
            </Box>
            <Text fw={700} size="sm">
              Section F: Additional Information
            </Text>
          </Group>
          <Divider mb="md" />

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea
                label="Invoice Notes (Visible to Customer)"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea
                label="Internal Remarks (CRM Staff Only)"
                description="Private notes not displayed on printable PDF invoice"
                rows={3}
                value={internalRemarks}
                onChange={(e) => setInternalRemarks(e.currentTarget.value)}
                placeholder="e.g. Approved by Director; customer requested Net 45 for next milestone..."
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label="Terms and Conditions"
                rows={4}
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <TextInput
                label="Created By"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <TextInput
                label="Approved By"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.currentTarget.value)}
                description="Role / manager approval signatory"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <FileInput
                label="Attachments"
                placeholder="Upload purchase orders or signed contracts"
                leftSection={<IconUpload size={16} />}
                clearable
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Bottom Actions Bar */}
        <Paper
          p="md"
          radius="md"
          withBorder
          style={{
            position: 'sticky',
            bottom: 16,
            zIndex: 10,
            background: isDark ? 'rgba(26, 27, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Text size="xs" c="dimmed">
                Invoice Total:
              </Text>
              <Text size="lg" fw={900} c="blue">
                {currencySymbol}{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <Badge color={calculatedBalanceDue === 0 ? 'teal' : 'red'} variant="light" size="sm">
                Balance Due: {currencySymbol}{calculatedBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Badge>
            </Group>

            <Group gap="xs">
              <Button variant="default" onClick={onBack} disabled={loading}>
                Back to Invoices
              </Button>
              <Button
                variant="outline"
                color="blue"
                loading={loading}
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={() => handleSaveInvoice('Draft')}
              >
                Save as Draft
              </Button>
              <Button
                color="blue"
                loading={loading}
                leftSection={<IconSend size={16} />}
                onClick={() => handleSaveInvoice('Sent')}
              >
                {isEdit ? 'Update Invoice' : 'Create & Send'}
              </Button>
            </Group>
          </Group>
        </Paper>
      </Stack>
    </Box>
  );
};
