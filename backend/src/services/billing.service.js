import { prisma } from '../config/prisma.js';
import { io } from '../utils/socket.js';

/**
 * -----------------------------------------------------------------------------
 * 1. BILLING SETTINGS SERVICE
 * -----------------------------------------------------------------------------
 */
export async function getBillingSettingsService() {
  let settings = await prisma.billingSettings.findUnique({
    where: { id: 'default_billing_settings' },
  });

  if (!settings) {
    settings = await prisma.billingSettings.create({
      data: {
        id: 'default_billing_settings',
        companyName: 'OmniTech Solutions Pvt Ltd',
        companyAddress: 'Tidel Park, Rajiv Gandhi Salai, Taramani, Chennai, Tamil Nadu 600113',
        companyGst: '33AAAAA0000A1Z5',
        companyPan: 'AAAAA0000A',
        companyPhone: '+91 98765 43210',
        companyEmail: 'billing@omnitech.io',
        companyWebsite: 'https://omnitech.io',
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        accountHolderName: 'OmniTech Solutions Pvt Ltd',
        ifscCode: 'HDFC0001234',
        branchName: 'Tidel Park Branch',
        upiId: 'omnitech@hdfcbank',
        invoicePrefix: 'INV-2026-',
        invoiceNextNumber: 1,
        quotationPrefix: 'QUO-2026-',
        quotationNextNumber: 1001,
        orderPrefix: 'SO-2026-',
        orderNextNumber: 1001,
        paymentPrefix: 'PAY-2026-',
        paymentNextNumber: 1001,
        defaultTaxRate: 18.0,
        defaultPaymentTerms: 'Net 30',
        defaultTermsConditions:
          '1. Payment is due within the stipulated credit term from invoice date.\n2. In case of delayed payment, interest @ 18% per annum will be charged.\n3. Goods or services once delivered/rendered are not refundable.',
      },
    });
  }

  return settings;
}

export async function updateBillingSettingsService(data, user) {
  const settings = await getBillingSettingsService();

  const updated = await prisma.billingSettings.update({
    where: { id: settings.id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  await logBillingAudit('Settings', settings.id, 'CONFIG', 'UPDATED', user?.name || user?.email || 'Admin', 'Updated billing settings');

  return updated;
}

/**
 * -----------------------------------------------------------------------------
 * 2. PRODUCTS & SERVICES CATALOGUE
 * -----------------------------------------------------------------------------
 */
const DEFAULT_CATALOGUE = [
  { itemCode: 'PRD-HRMS', name: 'HRMS', type: 'Product', description: 'Complete Human Resource Management & Payroll Suite', unitPrice: 120000, taxRate: 18, unit: 'License' },
  { itemCode: 'PRD-CRM', name: 'CRM', type: 'Product', description: 'Enterprise Sales & Lead Lifecycle CRM Platform', unitPrice: 150000, taxRate: 18, unit: 'License' },
  { itemCode: 'PRD-LEDGER', name: 'ledgerone', type: 'Product', description: 'Cloud Financial Accounting, Invoicing & GST Filing ERP', unitPrice: 85000, taxRate: 18, unit: 'Subscription/Yr' },
  { itemCode: 'PRD-ERP', name: 'Cloud ERP', type: 'Product', description: 'Multi-branch Enterprise Resource Planning System', unitPrice: 250000, taxRate: 18, unit: 'License' },
  { itemCode: 'SRV-WEBDEV', name: 'Website Development', type: 'Service', description: 'Custom responsive enterprise corporate portal & CMS', unitPrice: 75000, taxRate: 18, unit: 'Project' },
  { itemCode: 'SRV-SOFTDEV', name: 'Software Development', type: 'Service', description: 'Bespoke full-stack web and mobile application engineering', unitPrice: 150000, taxRate: 18, unit: 'Project' },
  { itemCode: 'SRV-CRMIMP', name: 'CRM Implementation', type: 'Service', description: 'End-to-end data migration, workflows, pipelines and team training', unitPrice: 60000, taxRate: 18, unit: 'Project' },
  { itemCode: 'SRV-MAINT', name: 'Software Maintenance', type: 'Service', description: 'Annual maintenance SLA, bug fixes, performance monitoring and updates', unitPrice: 35000, taxRate: 18, unit: 'Quarterly' },
  { itemCode: 'SRV-TECHSUPP', name: 'Technical Support', type: 'Service', description: '24/7 dedicated tier-3 technical and cloud infrastructure support', unitPrice: 25000, taxRate: 18, unit: 'Monthly' },
  { itemCode: 'SRV-ITCONS', name: 'IT Consulting', type: 'Service', description: 'System architecture, cybersecurity audit, and cloud optimization consulting', unitPrice: 50000, taxRate: 18, unit: 'Engagement' },
];

export async function getProductsServicesService(query = {}) {
  const { search, type, status } = query;
  const count = await prisma.billingProduct.count();

  // Auto-seed default catalogue if empty
  if (count === 0) {
    for (const item of DEFAULT_CATALOGUE) {
      await prisma.billingProduct.create({ data: item }).catch(() => {});
    }
  }

  const where = {};
  if (type && type !== 'All') {
    where.type = { equals: type, mode: 'insensitive' };
  }
  if (status && status !== 'All') {
    where.status = { equals: status, mode: 'insensitive' };
  }
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { itemCode: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.billingProduct.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return items;
}

export async function createProductService(data, user) {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Product or Service name is required.');
    err.status = 400;
    throw err;
  }

  let itemCode = (data.itemCode || '').trim();
  if (!itemCode) {
    const prefix = data.type === 'Service' ? 'SRV' : 'PRD';
    const rand = Math.floor(1000 + Math.random() * 9000);
    itemCode = `${prefix}-${rand}`;
  }

  const existing = await prisma.billingProduct.findUnique({ where: { itemCode } });
  if (existing) {
    itemCode = `${itemCode}-${Date.now().toString().slice(-4)}`;
  }

  const product = await prisma.billingProduct.create({
    data: {
      itemCode,
      name: data.name.trim(),
      type: data.type || 'Product',
      description: data.description ? data.description.trim() : null,
      unitPrice: Number(data.unitPrice) || 0,
      taxRate: Number(data.taxRate) >= 0 ? Number(data.taxRate) : 18.0,
      unit: data.unit ? data.unit.trim() : 'Unit',
      status: data.status || 'Active',
      modules: Array.isArray(data.modules) ? data.modules : [],
    },
  });

  await logBillingAudit('Product', product.id, product.itemCode, 'CREATED', user?.name || user?.email || 'User', `Created ${product.type}: ${product.name}`);

  return product;
}

export async function updateProductService(id, data, user) {
  const existing = await prisma.billingProduct.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Product or Service record not found.');
    err.status = 404;
    throw err;
  }

  const updated = await prisma.billingProduct.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : existing.name,
      type: data.type !== undefined ? data.type : existing.type,
      description: data.description !== undefined ? (data.description ? data.description.trim() : null) : existing.description,
      unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : existing.unitPrice,
      taxRate: data.taxRate !== undefined ? Number(data.taxRate) : existing.taxRate,
      unit: data.unit !== undefined ? data.unit.trim() : existing.unit,
      status: data.status !== undefined ? data.status : existing.status,
      modules: data.modules !== undefined ? (Array.isArray(data.modules) ? data.modules : []) : existing.modules,
    },
  });

  await logBillingAudit('Product', updated.id, updated.itemCode, 'UPDATED', user?.name || user?.email || 'User', `Updated ${updated.name}`);

  return updated;
}

export async function deleteProductService(id, user) {
  const existing = await prisma.billingProduct.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Product not found.');
    err.status = 404;
    throw err;
  }

  await prisma.billingProduct.delete({ where: { id } });
  await logBillingAudit('Product', id, existing.itemCode, 'DELETED', user?.name || user?.email || 'User', `Deleted ${existing.name}`);
  return true;
}

/**
 * -----------------------------------------------------------------------------
 * 3. QUOTATIONS SERVICE
 * -----------------------------------------------------------------------------
 */
export async function getQuotationsService(query = {}) {
  const { status, search, contactId, leadId } = query;
  const where = {};

  if (status && status !== 'All') {
    where.status = { equals: status, mode: 'insensitive' };
  }
  if (contactId && contactId !== 'All') {
    where.contactId = contactId;
  }
  if (leadId && leadId !== 'All') {
    where.leadId = leadId;
  }
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { quotationNumber: { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
    ];
  }

  const quotes = await prisma.quotation.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return quotes;
}

export async function getQuotationByIdService(id) {
  const quote = await prisma.quotation.findFirst({
    where: { OR: [{ id }, { quotationNumber: id }] },
    include: { items: true },
  });

  if (!quote) {
    const err = new Error('Quotation not found.');
    err.status = 404;
    throw err;
  }

  return quote;
}

/**
 * Unified calculation function for Quotation totals, line items, and GST taxes
 */
export function calculateQuotationTotals(rawItems = [], discountType = 'percentage', discountValue = 0) {
  let grossSubtotal = 0;
  let totalLineDiscount = 0;

  const itemsWithComputed = (Array.isArray(rawItems) ? rawItems : []).map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice) || 0;
    const gross = qty * price;
    const discVal = Number(item.discount) || 0;
    const discType = item.discountType || 'percentage';

    let lineDiscAmt = 0;
    if (discType === 'percentage') {
      lineDiscAmt = (gross * discVal) / 100;
    } else {
      lineDiscAmt = Math.min(gross, discVal);
    }
    lineDiscAmt = Number(lineDiscAmt.toFixed(2));
    const lineTaxable = Math.max(0, gross - lineDiscAmt);
    const taxRate = item.taxRate !== undefined ? Number(item.taxRate) : 18.0;

    grossSubtotal += gross;
    totalLineDiscount += lineDiscAmt;

    return {
      item,
      qty,
      price,
      discVal,
      discType,
      lineDiscAmt,
      lineTaxable,
      taxRate,
    };
  });

  const netSubtotal = Math.max(0, grossSubtotal - totalLineDiscount);

  // Overall Quotation Discount
  const discType = discountType || 'percentage';
  const discVal = Number(discountValue) || 0;
  let discountAmount = 0;
  if (discType === 'percentage') {
    discountAmount = (netSubtotal * discVal) / 100;
  } else {
    discountAmount = Math.min(netSubtotal, discVal);
  }
  discountAmount = Number(discountAmount.toFixed(2));

  const taxableAmount = Math.max(0, netSubtotal - discountAmount);
  const factor = netSubtotal > 0 ? taxableAmount / netSubtotal : 1;

  let totalTax = 0;
  const itemsToCreate = itemsWithComputed.map((calc) => {
    const effectiveBase = calc.lineTaxable * factor;
    const lineTax = Number(((effectiveBase * calc.taxRate) / 100).toFixed(2));
    const lineTotal = Number((calc.lineTaxable + lineTax).toFixed(2));
    totalTax += lineTax;

    return {
      productId: calc.item.productId || null,
      itemCode: calc.item.itemCode || null,
      itemName: calc.item.itemName?.trim() || 'Item',
      itemType: calc.item.itemType || 'Product',
      description: calc.item.description ? calc.item.description.trim() : null,
      quantity: calc.qty,
      unitPrice: calc.price,
      discount: calc.discVal,
      discountType: calc.discType || 'percentage',
      taxRate: calc.taxRate,
      taxAmount: lineTax,
      totalAmount: lineTotal,
    };
  });

  totalTax = Number(totalTax.toFixed(2));
  const grandTotal = Number((taxableAmount + totalTax).toFixed(2));

  return {
    grossSubtotal: Number(grossSubtotal.toFixed(2)),
    totalLineDiscount: Number(totalLineDiscount.toFixed(2)),
    subtotal: Number(netSubtotal.toFixed(2)),
    discountType: discType,
    discountValue: discVal,
    discountAmount,
    taxAmount: totalTax,
    grandTotal,
    itemsToCreate,
  };
}

export async function createQuotationService(data, user) {
  if (!data.contactName?.trim()) {
    const err = new Error('Client / Contact Name is required.');
    err.status = 400;
    throw err;
  }

  // Sequence Generation
  const settings = await getBillingSettingsService();
  const nextNum = settings.quotationNextNumber || 1001;
  const quotationNumber = `${settings.quotationPrefix || 'QUO-2026-'}${nextNum}`;

  // Update Settings sequence
  await prisma.billingSettings.update({
    where: { id: settings.id },
    data: { quotationNextNumber: nextNum + 1 },
  });

  // Calculate Totals using unified helper
  const rawItems = Array.isArray(data.items) && data.items.length > 0 ? data.items : [];
  const totals = calculateQuotationTotals(rawItems, data.discountType, data.discountValue);

  const quote = await prisma.quotation.create({
    data: {
      quotationNumber,
      contactId: data.contactId || null,
      contactName: data.contactName.trim(),
      contactEmail: data.contactEmail ? data.contactEmail.trim() : null,
      contactPhone: data.contactPhone ? data.contactPhone.trim() : null,
      companyName: data.companyName ? data.companyName.trim() : null,
      clientGst: data.clientGst ? data.clientGst.trim() : null,
      clientAddress: data.clientAddress ? data.clientAddress.trim() : null,
      leadId: data.leadId || null,
      quotationDate: data.quotationDate || new Date().toISOString().split('T')[0],
      validUntil: data.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: data.status || 'Draft',
      currency: data.currency || 'INR',
      subtotal: totals.subtotal,
      discountType: totals.discountType,
      discountValue: totals.discountValue,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paymentTerms: data.paymentTerms || settings.defaultPaymentTerms || 'Net 30',
      notes: data.notes ? data.notes.trim() : null,
      termsConditions: data.termsConditions ? data.termsConditions.trim() : settings.defaultTermsConditions,
      salesOwnerId: user?.id || null,
      salesOwnerName: user?.name || null,
      items: {
        create: totals.itemsToCreate,
      },
    },
    include: { items: true },
  });

  await logBillingAudit('Quotation', quote.id, quote.quotationNumber, 'CREATED', user?.name || user?.email || 'User', `Created quote for ₹${quote.grandTotal}`);

  return quote;
}

export async function updateQuotationService(id, data, user) {
  const existing = await prisma.quotation.findFirst({
    where: { OR: [{ id }, { quotationNumber: id }] },
    include: { items: true },
  });

  if (!existing) {
    const err = new Error('Quotation not found.');
    err.status = 404;
    throw err;
  }

  // Recalculate if items or discount passed
  let updateData = {};
  if (data.status) updateData.status = data.status;
  if (data.quotationDate) updateData.quotationDate = data.quotationDate;
  if (data.validUntil) updateData.validUntil = data.validUntil;
  if (data.paymentTerms) updateData.paymentTerms = data.paymentTerms;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.termsConditions !== undefined) updateData.termsConditions = data.termsConditions;
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;

  if (Array.isArray(data.items)) {
    await prisma.quotationItem.deleteMany({ where: { quotationId: existing.id } });

    const discType = data.discountType || existing.discountType;
    const discVal = data.discountValue !== undefined ? Number(data.discountValue) : existing.discountValue;
    const totals = calculateQuotationTotals(data.items, discType, discVal);

    updateData = {
      ...updateData,
      subtotal: totals.subtotal,
      discountType: totals.discountType,
      discountValue: totals.discountValue,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal,
      items: { create: totals.itemsToCreate },
    };
  }

  const updated = await prisma.quotation.update({
    where: { id: existing.id },
    data: updateData,
    include: { items: true },
  });

  await logBillingAudit('Quotation', updated.id, updated.quotationNumber, 'UPDATED', user?.name || user?.email || 'User', `Updated quotation details.`);

  return updated;
}

/**
 * Convert Accepted Quotation to Sales Order / Contract
 */
export async function convertQuotationToOrderService(id, data = {}, user) {
  const quote = await prisma.quotation.findFirst({
    where: { OR: [{ id }, { quotationNumber: id }] },
    include: { items: true },
  });

  if (!quote) {
    const err = new Error('Quotation record not found.');
    err.status = 404;
    throw err;
  }

  if (quote.convertedToOrderId) {
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { id: quote.convertedToOrderId },
      include: { items: true },
    });
    if (existingOrder) {
      return existingOrder;
    }
  }

  // Sequence Generation
  const settings = await getBillingSettingsService();
  const nextNum = settings.orderNextNumber || 1001;
  const orderNumber = `${settings.orderPrefix || 'SO-2026-'}${nextNum}`;

  await prisma.billingSettings.update({
    where: { id: settings.id },
    data: { orderNextNumber: nextNum + 1 },
  });

  const billingMethod = data.billingMethod || (quote.items.some((i) => i.itemType === 'Service') ? 'Milestone' : 'Product');

  const order = await prisma.salesOrder.create({
    data: {
      orderNumber,
      quotationId: quote.id,
      contactId: quote.contactId,
      contactName: quote.contactName,
      contactEmail: quote.contactEmail,
      contactPhone: quote.contactPhone,
      companyName: quote.companyName,
      clientGst: quote.clientGst,
      clientAddress: quote.clientAddress,
      leadId: quote.leadId,
      billingMethod,
      contractValue: quote.grandTotal,
      currency: quote.currency || 'INR',
      orderDate: new Date().toISOString().split('T')[0],
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || null,
      paymentTerms: quote.paymentTerms || 'Net 30',
      status: 'Confirmed',
      notes: quote.notes,
      termsConditions: quote.termsConditions,
      items: {
        create: quote.items.map((i) => ({
          productId: i.productId,
          itemCode: i.itemCode,
          itemName: i.itemName,
          itemType: i.itemType,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
          taxAmount: i.taxAmount,
          totalAmount: i.totalAmount,
        })),
      },
    },
    include: { items: true },
  });

  // Mark Quotation as Accepted & Converted
  await prisma.quotation.update({
    where: { id: quote.id },
    data: {
      status: 'Accepted',
      convertedToOrderId: order.id,
      convertedAt: new Date(),
    },
  });

  // If milestone billing method, create initial milestone template
  if (billingMethod === 'Milestone') {
    const defaultMilestones = [
      { name: 'Milestone 1: Project Kickoff & UI/UX Sign-off', percentage: 25, amount: quote.grandTotal * 0.25 },
      { name: 'Milestone 2: Core Development & Alpha Release', percentage: 35, amount: quote.grandTotal * 0.35 },
      { name: 'Milestone 3: Beta Testing & UAT Sign-off', percentage: 25, amount: quote.grandTotal * 0.25 },
      { name: 'Milestone 4: Deployment & Final Handover', percentage: 15, amount: quote.grandTotal * 0.15 },
    ];

    for (let idx = 0; idx < defaultMilestones.length; idx++) {
      const m = defaultMilestones[idx];
      await prisma.billingMilestone.create({
        data: {
          salesOrderId: order.id,
          milestoneNumber: idx + 1,
          name: m.name,
          percentage: m.percentage,
          amount: Number(m.amount.toFixed(2)),
          status: 'Pending',
          isApproved: false,
          isInvoiceEligible: false,
        },
      });
    }
  }

  await logBillingAudit('SalesOrder', order.id, order.orderNumber, 'CONVERTED', user?.name || user?.email || 'User', `Converted quotation ${quote.quotationNumber} to Sales Order`);

  return order;
}

/**
 * -----------------------------------------------------------------------------
 * 4. SALES ORDERS & CONTRACTS SERVICE
 * -----------------------------------------------------------------------------
 */
export async function getSalesOrdersService(query = {}) {
  const { status, billingMethod, search, contactId } = query;
  const where = {};

  if (status && status !== 'All') {
    where.status = { equals: status, mode: 'insensitive' };
  }
  if (billingMethod && billingMethod !== 'All') {
    where.billingMethod = { equals: billingMethod, mode: 'insensitive' };
  }
  if (contactId && contactId !== 'All') {
    where.contactId = contactId;
  }
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { orderNumber: { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const orders = await prisma.salesOrder.findMany({
    where,
    include: {
      items: true,
      milestones: true,
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          grandTotal: true,
          amountPaid: true,
          outstandingBalance: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
}

export async function getSalesOrderByIdService(id) {
  const order = await prisma.salesOrder.findFirst({
    where: { OR: [{ id }, { orderNumber: id }] },
    include: {
      items: true,
      milestones: { orderBy: { milestoneNumber: 'asc' } },
      invoices: true,
    },
  });

  if (!order) {
    const err = new Error('Sales Order not found.');
    err.status = 404;
    throw err;
  }

  return order;
}

export async function createSalesOrderService(data, user) {
  if (!data.contactName?.trim()) {
    const err = new Error('Client Name is required.');
    err.status = 400;
    throw err;
  }

  const settings = await getBillingSettingsService();
  const nextNum = settings.orderNextNumber || 1001;
  const orderNumber = `${settings.orderPrefix || 'SO-2026-'}${nextNum}`;

  await prisma.billingSettings.update({
    where: { id: settings.id },
    data: { orderNextNumber: nextNum + 1 },
  });

  const rawItems = Array.isArray(data.items) ? data.items : [];
  let computedVal = 0;
  const itemsToCreate = rawItems.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice) || 0;
    const taxRate = Number(item.taxRate) || 18.0;
    const lineSub = qty * price;
    const taxAmt = Number(((lineSub * taxRate) / 100).toFixed(2));
    const total = lineSub + taxAmt;
    computedVal += total;

    return {
      productId: item.productId || null,
      itemCode: item.itemCode || null,
      itemName: item.itemName?.trim() || 'Item',
      itemType: item.itemType || 'Product',
      description: item.description ? item.description.trim() : null,
      quantity: qty,
      unitPrice: price,
      taxRate,
      taxAmount: taxAmt,
      totalAmount: total,
    };
  });

  const contractValue = data.contractValue !== undefined ? Number(data.contractValue) : computedVal;

  const order = await prisma.salesOrder.create({
    data: {
      orderNumber,
      quotationId: data.quotationId || null,
      contactId: data.contactId || null,
      contactName: data.contactName.trim(),
      contactEmail: data.contactEmail ? data.contactEmail.trim() : null,
      contactPhone: data.contactPhone ? data.contactPhone.trim() : null,
      companyName: data.companyName ? data.companyName.trim() : null,
      clientGst: data.clientGst ? data.clientGst.trim() : null,
      clientAddress: data.clientAddress ? data.clientAddress.trim() : null,
      leadId: data.leadId || null,
      dealId: data.dealId || null,
      billingMethod: data.billingMethod || 'Milestone',
      contractValue: Number(contractValue.toFixed(2)),
      currency: data.currency || 'INR',
      orderDate: data.orderDate || new Date().toISOString().split('T')[0],
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || null,
      paymentTerms: data.paymentTerms || settings.defaultPaymentTerms || 'Net 30',
      status: data.status || 'Confirmed',
      notes: data.notes ? data.notes.trim() : null,
      termsConditions: data.termsConditions ? data.termsConditions.trim() : settings.defaultTermsConditions,
      projectId: data.projectId || null,
      items: {
        create: itemsToCreate,
      },
    },
    include: { items: true },
  });

  await logBillingAudit('SalesOrder', order.id, order.orderNumber, 'CREATED', user?.name || user?.email || 'User', `Created Sales Order for ₹${order.contractValue}`);

  return order;
}

export async function updateSalesOrderService(id, data, user) {
  const existing = await prisma.salesOrder.findFirst({
    where: { OR: [{ id }, { orderNumber: id }] },
  });

  if (!existing) {
    const err = new Error('Sales Order not found.');
    err.status = 404;
    throw err;
  }

  const updated = await prisma.salesOrder.update({
    where: { id: existing.id },
    data: {
      status: data.status || existing.status,
      billingMethod: data.billingMethod || existing.billingMethod,
      contractValue: data.contractValue !== undefined ? Number(data.contractValue) : existing.contractValue,
      startDate: data.startDate !== undefined ? data.startDate : existing.startDate,
      endDate: data.endDate !== undefined ? data.endDate : existing.endDate,
      paymentTerms: data.paymentTerms || existing.paymentTerms,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      projectId: data.projectId !== undefined ? data.projectId : existing.projectId,
    },
  });

  await logBillingAudit('SalesOrder', updated.id, updated.orderNumber, 'UPDATED', user?.name || user?.email || 'User', `Updated sales order status to ${updated.status}`);

  return updated;
}

/**
 * -----------------------------------------------------------------------------
 * 5. PROJECTS & MILESTONES SERVICE
 * -----------------------------------------------------------------------------
 */
export async function getBillingProjectsService() {
  const [projects, orders] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.salesOrder.findMany({
      include: {
        milestones: { orderBy: { milestoneNumber: 'asc' } },
        invoices: true,
      },
    }),
  ]);

  // Combine project details with milestone & billing metrics
  const combined = projects.map((prj) => {
    const linkedOrder = orders.find((o) => o.projectId === prj.id || o.id === prj.salesOrderId);
    const milestones = linkedOrder ? linkedOrder.milestones : [];
    const invoices = linkedOrder ? linkedOrder.invoices : [];

    const contractValue = linkedOrder ? linkedOrder.contractValue : prj.estimatedBudget || 0;
    const totalInvoiced = invoices.reduce((acc, inv) => (inv.status !== 'Cancelled' ? acc + inv.grandTotal : acc), 0);
    const totalCollected = invoices.reduce((acc, inv) => (inv.status !== 'Cancelled' ? acc + inv.amountPaid : acc), 0);

    return {
      ...prj,
      linkedOrder: linkedOrder ? { id: linkedOrder.id, orderNumber: linkedOrder.orderNumber, billingMethod: linkedOrder.billingMethod } : null,
      contractValue,
      totalInvoiced,
      totalCollected,
      milestones,
    };
  });

  return combined;
}

export async function getMilestonesService(query = {}) {
  const { salesOrderId, projectId, status } = query;
  const where = {};
  if (salesOrderId) where.salesOrderId = salesOrderId;
  if (projectId) where.projectId = projectId;
  if (status && status !== 'All') where.status = { equals: status, mode: 'insensitive' };

  const milestones = await prisma.billingMilestone.findMany({
    where,
    orderBy: { milestoneNumber: 'asc' },
  });

  return milestones;
}

export async function createMilestoneService(data, user) {
  if (!data.name?.trim()) {
    const err = new Error('Milestone name is required.');
    err.status = 400;
    throw err;
  }

  const amount = Number(data.amount) || 0;
  if (amount <= 0) {
    const err = new Error('Milestone amount must be greater than zero.');
    err.status = 400;
    throw err;
  }

  // Contract value validation if salesOrderId is supplied
  if (data.salesOrderId) {
    const order = await prisma.salesOrder.findUnique({
      where: { id: data.salesOrderId },
      include: { milestones: true },
    });

    if (order) {
      const existingSum = order.milestones.reduce((acc, m) => acc + m.amount, 0);
      if (data.validateContractTotal && existingSum + amount > order.contractValue + 1) {
        const err = new Error(`Total milestone amount (₹${existingSum + amount}) exceeds contract value (₹${order.contractValue}).`);
        err.status = 400;
        throw err;
      }
    }
  }

  const milestone = await prisma.billingMilestone.create({
    data: {
      salesOrderId: data.salesOrderId || null,
      projectId: data.projectId || null,
      projectName: data.projectName ? data.projectName.trim() : null,
      milestoneNumber: Number(data.milestoneNumber) || 1,
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      percentage: Number(data.percentage) || null,
      amount,
      dueDate: data.dueDate || null,
      status: data.status || 'Pending',
      isApproved: false,
      isInvoiceEligible: false,
    },
  });

  await logBillingAudit('Milestone', milestone.id, `M-${milestone.milestoneNumber}`, 'CREATED', user?.name || user?.email || 'User', `Created milestone: ${milestone.name} for ₹${milestone.amount}`);

  return milestone;
}

export async function updateMilestoneService(id, data, user) {
  const existing = await prisma.billingMilestone.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Milestone not found.');
    err.status = 404;
    throw err;
  }

  const newStatus = data.status || existing.status;
  const isApproved = data.isApproved !== undefined ? Boolean(data.isApproved) : existing.isApproved;

  // Invoice eligibility condition: Completed AND Approved
  const isInvoiceEligible = (newStatus === 'Completed' && isApproved) || Boolean(data.isInvoiceEligible);

  const updated = await prisma.billingMilestone.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      amount: data.amount !== undefined ? Number(data.amount) : existing.amount,
      percentage: data.percentage !== undefined ? Number(data.percentage) : existing.percentage,
      dueDate: data.dueDate !== undefined ? data.dueDate : existing.dueDate,
      status: newStatus,
      isApproved,
      approvedBy: isApproved ? (existing.approvedBy || user?.name || user?.email || 'Manager') : null,
      approvedAt: isApproved ? (existing.approvedAt || new Date()) : null,
      isInvoiceEligible,
    },
  });

  await logBillingAudit('Milestone', updated.id, `M-${updated.milestoneNumber}`, 'UPDATED', user?.name || user?.email || 'User', `Updated milestone ${updated.name} (Status: ${updated.status}, Approved: ${updated.isApproved})`);

  return updated;
}

export async function approveMilestoneService(id, user) {
  const milestone = await prisma.billingMilestone.findUnique({ where: { id } });
  if (!milestone) {
    const err = new Error('Milestone record not found.');
    err.status = 404;
    throw err;
  }

  const updated = await prisma.billingMilestone.update({
    where: { id },
    data: {
      isApproved: true,
      approvedBy: user?.name || user?.email || 'Manager',
      approvedAt: new Date(),
      isInvoiceEligible: milestone.status === 'Completed',
    },
  });

  await logBillingAudit('Milestone', updated.id, `M-${updated.milestoneNumber}`, 'APPROVED', user?.name || user?.email || 'User', `Approved milestone: ${updated.name}`);

  return updated;
}

/**
 * -----------------------------------------------------------------------------
 * 6. INVOICE MANAGEMENT SERVICE
 * -----------------------------------------------------------------------------
 */
export async function getInvoicesService(query = {}) {
  const { status, search, contactId, salesOrderId, projectId } = query;
  const where = {};

  if (status && status !== 'All') {
    where.status = { equals: status, mode: 'insensitive' };
  }
  if (contactId && contactId !== 'All') {
    where.contactId = contactId;
  }
  if (salesOrderId && salesOrderId !== 'All') {
    where.salesOrderId = salesOrderId;
  }
  if (projectId && projectId !== 'All') {
    where.projectId = projectId;
  }
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { invoiceNumber: { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
      { milestoneName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      items: true,
      allocations: {
        include: {
          payment: {
            select: {
              paymentNumber: true,
              paymentDate: true,
              paymentMethod: true,
              transactionReference: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Check for auto-overdue transition on fetched records
  const today = new Date().toISOString().split('T')[0];
  const processed = invoices.map((inv) => {
    if (inv.status === 'Issued' && inv.dueDate < today && inv.outstandingBalance > 0) {
      return { ...inv, status: 'Overdue' };
    }
    return inv;
  });

  return processed;
}

export async function getInvoiceByIdService(id) {
  const invoice = await prisma.invoice.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] },
    include: {
      items: true,
      allocations: {
        include: {
          payment: true,
        },
      },
    },
  });

  if (!invoice) {
    const err = new Error('Invoice not found.');
    err.status = 404;
    throw err;
  }

  return invoice;
}

export async function createInvoiceService(data, user) {
  if (!data.contactName?.trim()) {
    const err = new Error('Client / Contact Name is required.');
    err.status = 400;
    throw err;
  }

  const settings = await getBillingSettingsService();
  const nextNum = settings.invoiceNextNumber || 1;
  const padded = String(nextNum).padStart(6, '0');
  const invoiceNumber = `${settings.invoicePrefix || 'INV-2026-'}${padded}`;

  await prisma.billingSettings.update({
    where: { id: settings.id },
    data: { invoiceNextNumber: nextNum + 1 },
  });

  // Items and Calculation
  const rawItems = Array.isArray(data.items) && data.items.length > 0 ? data.items : [];
  let subtotal = 0;
  let totalTax = 0;

  const itemsToCreate = rawItems.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice) || 0;
    const itemDisc = Number(item.discount) || 0;
    const lineSub = Math.max(0, qty * price - itemDisc);
    const taxRate = item.taxRate !== undefined ? Number(item.taxRate) : 18.0;
    const taxAmt = Number(((lineSub * taxRate) / 100).toFixed(2));
    const totalAmount = lineSub + taxAmt;

    subtotal += lineSub;
    totalTax += taxAmt;

    return {
      productId: item.productId || null,
      itemCode: item.itemCode || null,
      itemName: item.itemName?.trim() || 'Billing Item',
      itemType: item.itemType || 'Product',
      description: item.description ? item.description.trim() : null,
      quantity: qty,
      unitPrice: price,
      discount: itemDisc,
      taxRate,
      taxAmount: taxAmt,
      totalAmount,
    };
  });

  const discountAmount = Number(data.discountAmount) || 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + totalTax);

  const bankDetails = {
    bankName: settings.bankName,
    accountNumber: settings.accountNumber,
    accountHolderName: settings.accountHolderName,
    ifscCode: settings.ifscCode,
    branchName: settings.branchName,
    upiId: settings.upiId,
  };

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      contactId: data.contactId || null,
      contactName: data.contactName.trim(),
      contactEmail: data.contactEmail ? data.contactEmail.trim() : null,
      contactPhone: data.contactPhone ? data.contactPhone.trim() : null,
      companyName: data.companyName ? data.companyName.trim() : null,
      clientGst: data.clientGst ? data.clientGst.trim() : null,
      clientAddress: data.clientAddress ? data.clientAddress.trim() : null,
      leadId: data.leadId || null,
      salesOrderId: data.salesOrderId || null,
      projectId: data.projectId || null,
      projectName: data.projectName ? data.projectName.trim() : null,
      milestoneId: data.milestoneId || null,
      milestoneName: data.milestoneName ? data.milestoneName.trim() : null,
      invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      taxAmount: Number(totalTax.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      amountPaid: 0,
      outstandingBalance: Number(grandTotal.toFixed(2)),
      status: data.status || 'Issued',
      paymentTerms: data.paymentTerms || settings.defaultPaymentTerms || 'Net 30',
      notes: data.notes ? data.notes.trim() : null,
      termsConditions: data.termsConditions ? data.termsConditions.trim() : settings.defaultTermsConditions,
      bankDetails,
      issuedAt: new Date(),
      createdBy: user?.name || user?.email || 'User',
      items: {
        create: itemsToCreate,
      },
    },
    include: { items: true },
  });

  // If created for a milestone, link milestone and set invoiced amount
  if (data.milestoneId) {
    await prisma.billingMilestone.update({
      where: { id: data.milestoneId },
      data: {
        invoiceId: invoice.id,
        invoicedAmount: invoice.grandTotal,
      },
    }).catch(() => {});
  }

  await logBillingAudit('Invoice', invoice.id, invoice.invoiceNumber, 'CREATED', user?.name || user?.email || 'User', `Created invoice for ₹${invoice.grandTotal}`);

  return invoice;
}

export async function updateInvoiceService(id, data, user) {
  const existing = await prisma.invoice.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] },
  });

  if (!existing) {
    const err = new Error('Invoice not found.');
    err.status = 404;
    throw err;
  }

  // Prevent silent modification of issued, paid, or partially paid invoices
  if (existing.status !== 'Draft' && data.items) {
    const err = new Error('Issued or Paid invoices cannot be silently altered. Cancel the invoice or issue an adjustment.');
    err.status = 400;
    throw err;
  }

  const updated = await prisma.invoice.update({
    where: { id: existing.id },
    data: {
      notes: data.notes !== undefined ? data.notes : existing.notes,
      termsConditions: data.termsConditions !== undefined ? data.termsConditions : existing.termsConditions,
      dueDate: data.dueDate || existing.dueDate,
      paymentTerms: data.paymentTerms || existing.paymentTerms,
    },
    include: { items: true },
  });

  await logBillingAudit('Invoice', updated.id, updated.invoiceNumber, 'UPDATED', user?.name || user?.email || 'User', 'Updated invoice terms & notes');

  return updated;
}

export async function cancelInvoiceService(id, reason, user) {
  if (!reason || !reason.trim()) {
    const err = new Error('A cancellation reason is required.');
    err.status = 400;
    throw err;
  }

  const existing = await prisma.invoice.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] },
  });

  if (!existing) {
    const err = new Error('Invoice not found.');
    err.status = 404;
    throw err;
  }

  if (existing.status === 'Paid') {
    const err = new Error('Cannot cancel a fully paid invoice. Process a refund first.');
    err.status = 400;
    throw err;
  }

  const updated = await prisma.invoice.update({
    where: { id: existing.id },
    data: {
      status: 'Cancelled',
      cancellationReason: reason.trim(),
      outstandingBalance: 0,
    },
  });

  // If linked to milestone, free up the milestone
  if (existing.milestoneId) {
    await prisma.billingMilestone.update({
      where: { id: existing.milestoneId },
      data: { invoiceId: null, invoicedAmount: 0 },
    }).catch(() => {});
  }

  await logBillingAudit('Invoice', updated.id, updated.invoiceNumber, 'CANCELLED', user?.name || user?.email || 'User', `Cancelled invoice. Reason: ${reason}`);

  return updated;
}

/**
 * -----------------------------------------------------------------------------
 * 7. PAYMENT MANAGEMENT SERVICE
 * -----------------------------------------------------------------------------
 */
export async function getPaymentsService(query = {}) {
  const { search, paymentMethod, contactId } = query;
  const where = {};

  if (paymentMethod && paymentMethod !== 'All') {
    where.paymentMethod = { equals: paymentMethod, mode: 'insensitive' };
  }
  if (contactId && contactId !== 'All') {
    where.contactId = contactId;
  }
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { paymentNumber: { contains: q, mode: 'insensitive' } },
      { clientName: { contains: q, mode: 'insensitive' } },
      { transactionReference: { contains: q, mode: 'insensitive' } },
      { bankName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      allocations: {
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              grandTotal: true,
              amountPaid: true,
              outstandingBalance: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return payments;
}

export async function getPaymentByIdService(id) {
  const payment = await prisma.payment.findFirst({
    where: { OR: [{ id }, { paymentNumber: id }] },
    include: {
      allocations: {
        include: {
          invoice: true,
        },
      },
    },
  });

  if (!payment) {
    const err = new Error('Payment record not found.');
    err.status = 404;
    throw err;
  }

  return payment;
}

export async function recordPaymentService(data, user) {
  const amount = Number(data.amountReceived) || 0;
  if (amount <= 0) {
    const err = new Error('Payment amount must be greater than zero.');
    err.status = 400;
    throw err;
  }

  if (!data.clientName?.trim()) {
    const err = new Error('Client Name is required.');
    err.status = 400;
    throw err;
  }

  // Sequence Generation
  const settings = await getBillingSettingsService();
  const nextNum = settings.paymentNextNumber || 1001;
  const paymentNumber = `${settings.paymentPrefix || 'PAY-2026-'}${nextNum}`;

  await prisma.billingSettings.update({
    where: { id: settings.id },
    data: { paymentNextNumber: nextNum + 1 },
  });

  // Verify allocations against active invoices
  const rawAllocations = Array.isArray(data.allocations) ? data.allocations : [];
  if (rawAllocations.length === 0 && data.invoiceId) {
    rawAllocations.push({ invoiceId: data.invoiceId, amountAllocated: amount });
  }

  // Verify invoice balances
  for (const alloc of rawAllocations) {
    const inv = await prisma.invoice.findUnique({ where: { id: alloc.invoiceId } });
    if (!inv) {
      const err = new Error(`Invoice with ID ${alloc.invoiceId} not found.`);
      err.status = 404;
      throw err;
    }
    if (inv.status === 'Cancelled') {
      const err = new Error(`Invoice ${inv.invoiceNumber} is cancelled and cannot accept payments.`);
      err.status = 400;
      throw err;
    }
    const allocAmt = Number(alloc.amountAllocated) || 0;
    if (allocAmt > inv.outstandingBalance + 0.01) {
      const err = new Error(`Allocated payment ₹${allocAmt} exceeds invoice ${inv.invoiceNumber} outstanding balance ₹${inv.outstandingBalance}.`);
      err.status = 400;
      throw err;
    }
  }

  const payment = await prisma.payment.create({
    data: {
      paymentNumber,
      contactId: data.contactId || null,
      clientName: data.clientName.trim(),
      paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
      amountReceived: amount,
      paymentMethod: data.paymentMethod || 'Bank Transfer',
      transactionReference: data.transactionReference ? data.transactionReference.trim() : null,
      bankName: data.bankName ? data.bankName.trim() : null,
      notes: data.notes ? data.notes.trim() : null,
      recordedBy: user?.name || user?.email || 'User',
      status: 'Completed',
      allocations: {
        create: rawAllocations.map((a) => ({
          invoiceId: a.invoiceId,
          amountAllocated: Number(a.amountAllocated) || amount,
        })),
      },
    },
    include: { allocations: true },
  });

  // Update Invoices with new balances
  for (const alloc of rawAllocations) {
    const inv = await prisma.invoice.findUnique({ where: { id: alloc.invoiceId } });
    const allocAmt = Number(alloc.amountAllocated) || amount;
    const newPaid = Number((inv.amountPaid + allocAmt).toFixed(2));
    const newBalance = Math.max(0, Number((inv.grandTotal - newPaid).toFixed(2)));
    const newStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';

    await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        amountPaid: newPaid,
        outstandingBalance: newBalance,
        status: newStatus,
        paidAt: newStatus === 'Paid' ? new Date() : inv.paidAt,
      },
    });
  }

  await logBillingAudit('Payment', payment.id, payment.paymentNumber, 'PAYMENT_RECORDED', user?.name || user?.email || 'User', `Recorded payment ₹${payment.amountReceived} via ${payment.paymentMethod}`);

  return payment;
}

/**
 * -----------------------------------------------------------------------------
 * 8. BILLING DASHBOARD SERVICE
 * -----------------------------------------------------------------------------
 */
export async function getBillingDashboardService() {
  const [invoices, payments, projects, orders] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { not: 'Cancelled' } },
      orderBy: { invoiceDate: 'desc' },
    }),
    prisma.payment.findMany({
      where: { status: 'Completed' },
      include: {
        allocations: {
          include: {
            invoice: {
              select: { invoiceNumber: true },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: 8,
    }),
    prisma.project.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.salesOrder.findMany({
      include: { invoices: true },
    }),
  ]);

  const today = new Date().toISOString().split('T')[0];

  let totalInvoiced = 0;
  let totalCollected = 0;
  let outstandingAmount = 0;
  let overdueAmount = 0;
  let unpaidInvoicesCount = 0;

  for (const inv of invoices) {
    totalInvoiced += inv.grandTotal;
    totalCollected += inv.amountPaid;
    outstandingAmount += inv.outstandingBalance;

    if (inv.outstandingBalance > 0) {
      unpaidInvoicesCount += 1;
      if (inv.dueDate < today) {
        overdueAmount += inv.outstandingBalance;
      }
    }
  }

  // Monthly trends (Last 6 Months)
  const monthlyMap = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyMap[key] = { month: key, invoiced: 0, collected: 0 };
  }

  invoices.forEach((inv) => {
    try {
      const d = new Date(inv.invoiceDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyMap[key]) {
        monthlyMap[key].invoiced += inv.grandTotal;
        monthlyMap[key].collected += inv.amountPaid;
      }
    } catch (_) {}
  });

  const monthlyTrends = Object.values(monthlyMap);

  // Upcoming Due Dates
  const upcomingDueInvoices = invoices
    .filter((inv) => inv.outstandingBalance > 0)
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
    .slice(0, 6)
    .map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.contactName,
      companyName: inv.companyName,
      dueDate: inv.dueDate,
      grandTotal: inv.grandTotal,
      outstandingBalance: inv.outstandingBalance,
      isOverdue: inv.dueDate < today,
    }));

  // Project-wise billing progress
  const projectBillingProgress = projects.map((prj) => {
    const linkedOrder = orders.find((o) => o.projectId === prj.id || o.id === prj.salesOrderId);
    const orderInvoices = linkedOrder ? linkedOrder.invoices.filter((i) => i.status !== 'Cancelled') : [];
    const contractVal = linkedOrder ? linkedOrder.contractValue : prj.estimatedBudget || 0;
    const invoiced = orderInvoices.reduce((a, b) => a + b.grandTotal, 0);
    const collected = orderInvoices.reduce((a, b) => a + b.amountPaid, 0);
    const progress = contractVal > 0 ? Math.min(100, Math.round((collected / contractVal) * 100)) : 0;

    return {
      id: prj.id,
      projectId: prj.projectId,
      name: prj.name,
      clientName: prj.clientName,
      contractValue: contractVal,
      totalInvoiced: invoiced,
      totalCollected: collected,
      progressPercentage: progress,
      status: prj.status,
    };
  });

  return {
    kpis: {
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      totalCollected: Number(totalCollected.toFixed(2)),
      outstandingAmount: Number(outstandingAmount.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2)),
      totalInvoicesCount: invoices.length,
      unpaidInvoicesCount,
    },
    recentPayments: payments,
    upcomingDueInvoices,
    monthlyTrends,
    projectBillingProgress,
  };
}

/**
 * -----------------------------------------------------------------------------
 * 9. BILLING REPORTS SERVICE
 * -----------------------------------------------------------------------------
 */
export async function getBillingReportsService(query = {}) {
  const { startDate, endDate } = query;
  const where = { status: { not: 'Cancelled' } };

  if (startDate && endDate) {
    where.invoiceDate = { gte: startDate, lte: endDate };
  }

  const [invoices, payments, projects] = await Promise.all([
    prisma.invoice.findMany({ where, include: { items: true }, orderBy: { invoiceDate: 'desc' } }),
    prisma.payment.findMany({ where: { status: 'Completed' }, orderBy: { paymentDate: 'desc' } }),
    prisma.project.findMany(),
  ]);

  const today = new Date().toISOString().split('T')[0];

  // Aging Buckets
  const aging = {
    current: 0,
    days1_30: 0,
    days31_60: 0,
    days61_90: 0,
    days90Plus: 0,
    totalOverdue: 0,
  };

  invoices.forEach((inv) => {
    if (inv.outstandingBalance > 0) {
      if (inv.dueDate >= today) {
        aging.current += inv.outstandingBalance;
      } else {
        const diffDays = Math.floor((new Date(today) - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
        aging.totalOverdue += inv.outstandingBalance;
        if (diffDays <= 30) aging.days1_30 += inv.outstandingBalance;
        else if (diffDays <= 60) aging.days31_60 += inv.outstandingBalance;
        else if (diffDays <= 90) aging.days61_90 += inv.outstandingBalance;
        else aging.days90Plus += inv.outstandingBalance;
      }
    }
  });

  // Client Summaries
  const clientMap = {};
  invoices.forEach((inv) => {
    const key = inv.companyName || inv.contactName;
    if (!clientMap[key]) {
      clientMap[key] = {
        clientName: inv.contactName,
        companyName: inv.companyName || '—',
        invoiceCount: 0,
        totalInvoiced: 0,
        totalPaid: 0,
        outstandingBalance: 0,
      };
    }
    clientMap[key].invoiceCount += 1;
    clientMap[key].totalInvoiced += inv.grandTotal;
    clientMap[key].totalPaid += inv.amountPaid;
    clientMap[key].outstandingBalance += inv.outstandingBalance;
  });

  const clientSummaries = Object.values(clientMap).sort((a, b) => b.totalInvoiced - a.totalInvoiced);

  // GST / Tax Report
  let totalTaxable = 0;
  let totalGst = 0;
  invoices.forEach((inv) => {
    totalTaxable += inv.subtotal - inv.discountAmount;
    totalGst += inv.taxAmount;
  });

  const taxSummary = {
    totalTaxableAmount: Number(totalTaxable.toFixed(2)),
    totalTaxAmount: Number(totalGst.toFixed(2)),
    cgst: Number((totalGst / 2).toFixed(2)),
    sgst: Number((totalGst / 2).toFixed(2)),
    igst: 0,
  };

  return {
    agingSummary: aging,
    clientSummaries,
    taxSummary,
    totalInvoicesRecorded: invoices.length,
    totalPaymentsRecorded: payments.length,
  };
}

/**
 * -----------------------------------------------------------------------------
 * 10. BILLING AUDIT LOG SERVICE
 * -----------------------------------------------------------------------------
 */
export async function logBillingAudit(entityType, entityId, entityNumber, action, performedBy, details) {
  try {
    return await prisma.billingAuditLog.create({
      data: {
        entityType,
        entityId,
        entityNumber,
        action,
        performedBy,
        details: typeof details === 'string' ? details : JSON.stringify(details),
      },
    });
  } catch (_) {
    return null;
  }
}

export async function getBillingAuditLogsService(query = {}) {
  const { entityType, entityId } = query;
  const where = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  const logs = await prisma.billingAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return logs;
}
