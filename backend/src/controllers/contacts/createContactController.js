import { prisma } from '../../config/prisma.js';
import { delCache } from '../../config/redis.js';
import { io } from '../../server.js';
import crypto from 'crypto';

/**
 * Handle Creating a New Contact with all 6 Detailed Sections
 */
export async function createContact(req, res) {
  try {
    const {
      // 1. Basic Contact Information
      name,
      email,
      phone,
      mobile_number,
      address,
      source = 'Website',
      customSource,

      // 2. Professional & Company Information
      contactType = 'Company Representative',
      contact_type,
      companyName,
      company_name,
      designation,
      profession,
      annualRevenue,
      annual_revenue,

      // 3. Requirement Details
      category = 'Product',
      productList = [],
      product_list,
      serviceList = [],
      service_list,
      customProduct,
      custom_product,

      // 4. Interaction & Follow-up Details
      contactMode = 'Call',
      contact_mode,
      customContactMode,
      custom_contact_mode,
      meetingType = 'Virtual',
      meeting_type,
      nextFollowDate,
      next_follow_date,
      remarks,
      notes,

      // 5. Qualification & Project Details
      status = 'New',
      stage = 'Initialization',
      qualificationStatus = 'In Progress',
      qualification_status,
      qualifiedBy,
      qualified_by,
      qualificationDate,
      qualification_date,
      priority = 'Medium',
      estimatedBudget,
      estimated_budget,
      projectType,
      project_type,
      expectedUsers,
      expected_users,
      expectedGoLiveDate,
      expected_go_live_date,
      influencer,
      otherOptions,
      other_options,
      disqualificationReason,
      disqualification_reason,

      // 6. Assignment & System Metadata
      assignedTo,
      assigned_to,
      assignedToName,
      assigned_to_name,
      assignedBy,
      assigned_by,
    } = req.body;

    // 1. Validation: Contact Name & Phone (Required)
    const cleanName = String(name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Contact Name is required (minimum 2 characters).',
      });
    }

    const rawPhone = phone || mobile_number || '';
    const phoneDigits = String(rawPhone).replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A valid Mobile / Phone Number is required (minimum 10 digits).',
      });
    }

    const cleanEmail = email && String(email).trim() ? String(email).toLowerCase().trim() : null;

    // 2. Auto-generate Contact ID (CNT-XXXX)
    const allContacts = await prisma.contact.findMany({
      select: { contactId: true },
    });

    const numericIds = allContacts
      .map((c) => {
        const match = c.contactId?.match(/CNT-(\d+)/i);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n) => n !== null);

    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 1000;
    const nextContactId = `CNT-${maxId + 1}`;

    // 3. Resolve Assignment
    const cleanAssignedTo = assignedTo || assigned_to || null;
    let cleanAssignedToName = assignedToName || assigned_to_name || null;

    if (cleanAssignedTo && !cleanAssignedToName) {
      const emp = await prisma.employee.findUnique({
        where: { id: cleanAssignedTo },
        select: { name: true },
      });
      if (emp) cleanAssignedToName = emp.name;
    }

    const isAssigned = Boolean(cleanAssignedTo);
    const assignmentStatusVal = isAssigned ? 'Assigned' : 'Unassigned';
    const assignedAtVal = isAssigned ? new Date() : null;

    // Normalizing products / services array
    const cleanProductList = Array.isArray(productList)
      ? productList
      : Array.isArray(product_list)
      ? product_list
      : productList
      ? [productList]
      : [];

    const cleanServiceList = Array.isArray(serviceList)
      ? serviceList
      : Array.isArray(service_list)
      ? service_list
      : serviceList
      ? [serviceList]
      : [];

    // 4. Create Contact Record
    const newContact = await prisma.contact.create({
      data: {
        contactId: nextContactId,
        uuid: crypto.randomUUID(),

        // 1. Basic Information
        name: cleanName,
        email: cleanEmail,
        phone: String(rawPhone).trim(),
        address: address || null,
        source: source || 'Website',
        customSource: customSource || null,

        // 2. Professional & Company Information
        contactType: contactType || contact_type || 'Company Representative',
        companyName: companyName || company_name || null,
        designation: designation || null,
        profession: profession || null,
        annualRevenue: annualRevenue || annual_revenue || null,

        // 3. Requirement Details
        category: category || 'Product',
        productList: cleanProductList,
        serviceList: cleanServiceList,
        customProduct: customProduct || custom_product || null,

        // 4. Interaction & Follow-up Details
        contactMode: contactMode || contact_mode || 'Call',
        customContactMode: customContactMode || custom_contact_mode || null,
        meetingType: meetingType || meeting_type || 'Virtual',
        nextFollowDate: nextFollowDate || next_follow_date || null,
        remarks: remarks || null,
        notes: notes || null,

        // 5. Qualification & Project Details
        status: status || 'New',
        stage: stage || 'Initialization',
        qualificationStatus: qualificationStatus || qualification_status || 'In Progress',
        qualifiedBy: qualifiedBy || qualified_by || null,
        qualificationDate: qualificationDate || qualification_date || null,
        priority: priority || 'Medium',
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : estimated_budget ? parseFloat(estimated_budget) : null,
        projectType: projectType || project_type || null,
        expectedUsers: expectedUsers ? parseInt(expectedUsers, 10) : expected_users ? parseInt(expected_users, 10) : null,
        expectedGoLiveDate: expectedGoLiveDate || expected_go_live_date || null,
        influencer: influencer || null,
        otherOptions: otherOptions || other_options || null,
        disqualificationReason: disqualificationReason || disqualification_reason || null,

        // 6. Assignment & System Metadata
        assignedTo: cleanAssignedTo,
        assignedToName: cleanAssignedToName,
        assignedBy: assignedBy || assigned_by || req.user?.name || 'System Admin',
        assignedAt: assignedAtVal,
        assignmentStatus: assignmentStatusVal,
        createdBy: req.user?.name || 'System Admin',
      },
    });

    // Invalidate Redis cache
    try {
      await delCache('crm:contacts:*');
      await delCache('crm:stats');
    } catch (e) {}

    // Broadcast WebSocket
    try {
      if (io) {
        io.emit('contact_created', {
          id: newContact.id,
          contactId: newContact.contactId,
          name: newContact.name,
          companyName: newContact.companyName,
          status: newContact.status,
          createdAt: newContact.createdAt,
        });
      }
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: `Contact '${newContact.name}' created successfully with ID ${newContact.contactId}.`,
      data: newContact,
    });
  } catch (error) {
    console.error('[Create Contact Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create contact in database.',
      error: error.message,
    });
  }
}
