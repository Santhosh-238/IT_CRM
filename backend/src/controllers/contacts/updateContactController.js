import { prisma } from '../../config/prisma.js';
import { delCache } from '../../config/redis.js';
import { logAuditEvent } from '../../services/auditService.js';
import { io } from '../../server.js';

/**
 * Handle Updating an Existing Contact with all 6 Detailed Sections
 */
export async function updateContact(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.contact.findFirst({
      where: {
        OR: [{ id }, { contactId: id }, { uuid: id }],
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Contact with ID '${id}' not found.`,
      });
    }

    // 1. Basic Contact Information
    const name = body.name !== undefined ? String(body.name).trim() : existing.name;
    let email = existing.email;
    if (body.email !== undefined) {
      email = body.email && String(body.email).trim() ? String(body.email).toLowerCase().trim() : null;
    }
    const rawPhone = body.phone !== undefined ? body.phone : body.mobile_number !== undefined ? body.mobile_number : existing.phone;
    const phone = rawPhone ? String(rawPhone).trim() : existing.phone;
    const address = body.address !== undefined ? (body.address ? String(body.address).trim() : null) : existing.address;
    const source = body.source !== undefined ? String(body.source).trim() : existing.source;
    const customSource = body.customSource !== undefined ? (body.customSource ? String(body.customSource).trim() : null) : existing.customSource;

    // 2. Professional & Company Information
    const contactType = body.contactType !== undefined ? body.contactType : body.contact_type !== undefined ? body.contact_type : existing.contactType;
    const companyName = body.companyName !== undefined ? (body.companyName ? String(body.companyName).trim() : null) : body.company_name !== undefined ? (body.company_name ? String(body.company_name).trim() : null) : existing.companyName;
    const designation = body.designation !== undefined ? (body.designation ? String(body.designation).trim() : null) : existing.designation;
    const profession = body.profession !== undefined ? (body.profession ? String(body.profession).trim() : null) : existing.profession;
    const annualRevenue = body.annualRevenue !== undefined ? (body.annualRevenue ? String(body.annualRevenue).trim() : null) : body.annual_revenue !== undefined ? (body.annual_revenue ? String(body.annual_revenue).trim() : null) : existing.annualRevenue;

    // 3. Requirement Details
    const category = body.category !== undefined ? body.category : existing.category;
    let productList = existing.productList;
    if (body.productList !== undefined || body.product_list !== undefined) {
      const pl = body.productList !== undefined ? body.productList : body.product_list;
      productList = Array.isArray(pl) ? pl : pl ? [pl] : [];
    }
    let serviceList = existing.serviceList;
    if (body.serviceList !== undefined || body.service_list !== undefined) {
      const sl = body.serviceList !== undefined ? body.serviceList : body.service_list;
      serviceList = Array.isArray(sl) ? sl : sl ? [sl] : [];
    }
    const customProduct = body.customProduct !== undefined ? (body.customProduct ? String(body.customProduct).trim() : null) : body.custom_product !== undefined ? (body.custom_product ? String(body.custom_product).trim() : null) : existing.customProduct;

    // 4. Interaction & Follow-up Details
    const contactMode = body.contactMode !== undefined ? body.contactMode : body.contact_mode !== undefined ? body.contact_mode : existing.contactMode;
    const customContactMode = body.customContactMode !== undefined ? (body.customContactMode ? String(body.customContactMode).trim() : null) : body.custom_contact_mode !== undefined ? (body.custom_contact_mode ? String(body.custom_contact_mode).trim() : null) : existing.customContactMode;
    const meetingType = body.meetingType !== undefined ? body.meetingType : body.meeting_type !== undefined ? body.meeting_type : existing.meetingType;
    const nextFollowDate = body.nextFollowDate !== undefined ? (body.nextFollowDate ? String(body.nextFollowDate).trim() : null) : body.next_follow_date !== undefined ? (body.next_follow_date ? String(body.next_follow_date).trim() : null) : existing.nextFollowDate;
    const remarks = body.remarks !== undefined ? (body.remarks ? String(body.remarks).trim() : null) : existing.remarks;
    const notes = body.notes !== undefined ? (body.notes ? String(body.notes).trim() : null) : existing.notes;

    // 5. Qualification & Project Details
    const status = body.status !== undefined ? body.status : existing.status;
    const stage = body.stage !== undefined ? body.stage : existing.stage;
    const qualificationStatus = body.qualificationStatus !== undefined ? body.qualificationStatus : body.qualification_status !== undefined ? body.qualification_status : existing.qualificationStatus;
    const qualifiedBy = body.qualifiedBy !== undefined ? (body.qualifiedBy ? String(body.qualifiedBy).trim() : null) : body.qualified_by !== undefined ? (body.qualified_by ? String(body.qualified_by).trim() : null) : existing.qualifiedBy;
    const qualificationDate = body.qualificationDate !== undefined ? (body.qualificationDate ? String(body.qualificationDate).trim() : null) : body.qualification_date !== undefined ? (body.qualification_date ? String(body.qualification_date).trim() : null) : existing.qualificationDate;
    const priority = body.priority !== undefined ? body.priority : existing.priority;
    const estimatedBudget = body.estimatedBudget !== undefined ? (body.estimatedBudget ? parseFloat(body.estimatedBudget) : null) : body.estimated_budget !== undefined ? (body.estimated_budget ? parseFloat(body.estimated_budget) : null) : existing.estimatedBudget;
    const projectType = body.projectType !== undefined ? (body.projectType ? String(body.projectType).trim() : null) : body.project_type !== undefined ? (body.project_type ? String(body.project_type).trim() : null) : existing.projectType;
    const expectedUsers = body.expectedUsers !== undefined ? (body.expectedUsers ? parseInt(body.expectedUsers, 10) : null) : body.expected_users !== undefined ? (body.expected_users ? parseInt(body.expected_users, 10) : null) : existing.expectedUsers;
    const expectedGoLiveDate = body.expectedGoLiveDate !== undefined ? (body.expectedGoLiveDate ? String(body.expectedGoLiveDate).trim() : null) : body.expected_go_live_date !== undefined ? (body.expected_go_live_date ? String(body.expected_go_live_date).trim() : null) : existing.expectedGoLiveDate;
    const influencer = body.influencer !== undefined ? (body.influencer ? String(body.influencer).trim() : null) : existing.influencer;
    const otherOptions = body.otherOptions !== undefined ? (body.otherOptions ? String(body.otherOptions).trim() : null) : body.other_options !== undefined ? (body.other_options ? String(body.other_options).trim() : null) : existing.otherOptions;
    const disqualificationReason = body.disqualificationReason !== undefined ? (body.disqualificationReason ? String(body.disqualificationReason).trim() : null) : body.disqualification_reason !== undefined ? (body.disqualification_reason ? String(body.disqualification_reason).trim() : null) : existing.disqualificationReason;

    // 6. Assignment & System Metadata
    let assignedTo = existing.assignedTo;
    let assignedToName = existing.assignedToName;
    let assignedAt = existing.assignedAt;
    let assignmentStatus = existing.assignmentStatus;

    if (body.assignedTo !== undefined || body.assigned_to !== undefined) {
      const newAssignedTo = body.assignedTo !== undefined ? body.assignedTo : body.assigned_to;
      assignedTo = newAssignedTo || null;
      if (assignedTo) {
        assignmentStatus = 'Assigned';
        assignedAt = existing.assignedTo === assignedTo ? existing.assignedAt : new Date();
        const emp = await prisma.employee.findUnique({
          where: { id: assignedTo },
          select: { name: true },
        });
        assignedToName = emp ? emp.name : body.assignedToName || body.assigned_to_name || null;
      } else {
        assignmentStatus = 'Unassigned';
        assignedToName = null;
        assignedAt = null;
      }
    }

    const assignedBy = body.assignedBy || body.assigned_by || existing.assignedBy;

    const updatedContact = await prisma.contact.update({
      where: { id: existing.id },
      data: {
        name,
        email,
        phone,
        address,
        source,
        customSource,
        contactType,
        companyName,
        designation,
        profession,
        annualRevenue,
        category,
        productList,
        serviceList,
        customProduct,
        contactMode,
        customContactMode,
        meetingType,
        nextFollowDate,
        remarks,
        notes,
        status,
        stage,
        qualificationStatus,
        qualifiedBy,
        qualificationDate,
        priority,
        estimatedBudget,
        projectType,
        expectedUsers,
        expectedGoLiveDate,
        influencer,
        otherOptions,
        disqualificationReason,
        assignedTo,
        assignedToName,
        assignedBy,
        assignedAt,
        assignmentStatus,
      },
    });

    // Invalidate Redis Caches
    try {
      await delCache('crm:contacts:*');
      await delCache('crm:stats');
    } catch (e) {}

    // WebSocket Broadcast
    if (io) {
      io.emit('contact_updated', updatedContact);
    }

    // Audit Log
    try {
      await logAuditEvent({
        userId: req.user?.id || 'admin',
        userName: req.user?.name || 'Admin User',
        userRole: req.user?.role || 'SUPER_ADMIN',
        action: 'UPDATE',
        entity: 'CONTACT',
        entityId: updatedContact.id,
        ipAddress: req.ip,
        details: `Updated contact ${updatedContact.name} (${updatedContact.contactId}).`,
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: `Contact ${updatedContact.name} (${updatedContact.contactId}) updated successfully!`,
      data: updatedContact,
    });
  } catch (error) {
    console.error('[updateContact Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update contact: ' + error.message,
    });
  }
}
