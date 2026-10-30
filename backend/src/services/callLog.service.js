import { prisma } from '../config/prisma.js';
import { generateCallId, formatCallLogResponse } from '../utils/callLog.util.js';
import { io } from '../utils/socket.js';

/**
 * 1. Get Call Logs with filters and search
 */
export async function getCallLogsService(queryParams = {}) {
  const {
    callType,
    status,
    search,
    date,
    startDate,
    endDate,
    employeeId,
    contactId,
    leadId,
    page,
    limit,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  const where = {};

  if (callType && callType !== 'ALL' && callType !== 'All') {
    where.callType = { equals: callType, mode: 'insensitive' };
  }

  if (status && status !== 'ALL' && status !== 'All') {
    const sLower = status.toLowerCase();
    if (sLower.includes('not') && (sLower.includes('interest') || sLower.includes('intrest'))) {
      where.OR = [
        ...(where.OR || []),
        { status: { equals: 'Not Interested', mode: 'insensitive' } },
        { status: { contains: 'interest', mode: 'insensitive' } },
        { status: { contains: 'intrest', mode: 'insensitive' } },
      ];
    } else if (sLower.includes('follow')) {
      where.OR = [
        ...(where.OR || []),
        { status: { equals: 'Follow-up', mode: 'insensitive' } },
        { status: { equals: 'Follow Up', mode: 'insensitive' } },
        { status: { contains: 'follow', mode: 'insensitive' } },
      ];
    } else {
      where.status = { equals: status, mode: 'insensitive' };
    }
  }

  if (employeeId && employeeId !== 'ALL') {
    where.OR = [
      ...(where.OR || []),
      { employeeId },
      { employeeName: { contains: employeeId, mode: 'insensitive' } },
    ];
  }

  if (contactId && contactId !== 'ALL') {
    where.OR = [
      ...(where.OR || []),
      { contactId },
      { contactName: { contains: contactId, mode: 'insensitive' } },
    ];
  }

  if (leadId && leadId !== 'ALL') {
    let matchedLead = null;
    try {
      matchedLead = await prisma.lead.findFirst({
        where: { OR: [{ id: leadId }, { leadId }] },
      });
    } catch (_) {}

    const leadConditions = [
      { leadId },
      { contactId: leadId },
    ];
    if (matchedLead) {
      leadConditions.push({ leadId: matchedLead.id });
      leadConditions.push({ leadId: matchedLead.leadId });
      leadConditions.push({ contactId: matchedLead.id });
      leadConditions.push({ contactId: matchedLead.leadId });
      if (matchedLead.phone) {
        leadConditions.push({ phoneNumber: matchedLead.phone });
        if (matchedLead.phone.length >= 10) {
          leadConditions.push({ phoneNumber: { contains: matchedLead.phone.slice(-10), mode: 'insensitive' } });
        }
      }
      if (matchedLead.name) {
        leadConditions.push({ contactName: { equals: matchedLead.name, mode: 'insensitive' } });
      }
    }

    where.OR = [
      ...(where.OR || []),
      ...leadConditions,
    ];
  }

  if (date && date !== 'ALL') {
    where.callDate = date;
  } else {
    if (startDate && endDate) {
      where.callDate = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.callDate = { gte: startDate };
    } else if (endDate) {
      where.callDate = { lte: endDate };
    }
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { callId: { contains: s, mode: 'insensitive' } },
      { employeeName: { contains: s, mode: 'insensitive' } },
      { contactName: { contains: s, mode: 'insensitive' } },
      { phoneNumber: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
      { status: { contains: s, mode: 'insensitive' } },
    ];
  }

  const orderBy = [];
  if (sortBy === 'callDate') {
    orderBy.push({ callDate: sortOrder === 'asc' ? 'asc' : 'desc' });
    orderBy.push({ callTime: sortOrder === 'asc' ? 'asc' : 'desc' });
  } else {
    orderBy.push({ [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' });
  }

  let calls;
  let total;

  if (page && limit) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    [total, calls] = await Promise.all([
      prisma.callLog.count({ where }),
      prisma.callLog.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);
  } else {
    calls = await prisma.callLog.findMany({
      where,
      orderBy,
    });
    total = calls.length;
  }

  return {
    count: total,
    calls: calls.map(formatCallLogResponse),
  };
}

/**
 * 2. Get Overview KPI Statistics for Call Logs
 */
export async function getCallLogStatsService() {
  const [total, incoming, outgoing, completed, missed, busy, noAnswer, notInterested, followUp] = await Promise.all([
    prisma.callLog.count(),
    prisma.callLog.count({ where: { callType: { equals: 'Incoming', mode: 'insensitive' } } }),
    prisma.callLog.count({ where: { callType: { equals: 'Outgoing', mode: 'insensitive' } } }),
    prisma.callLog.count({ where: { status: { equals: 'Completed', mode: 'insensitive' } } }),
    prisma.callLog.count({ where: { status: { equals: 'Missed', mode: 'insensitive' } } }),
    prisma.callLog.count({ where: { status: { equals: 'Busy', mode: 'insensitive' } } }),
    prisma.callLog.count({ where: { status: { equals: 'No Answer', mode: 'insensitive' } } }),
    prisma.callLog.count({
      where: {
        OR: [
          { status: { equals: 'Not Interested', mode: 'insensitive' } },
          { status: { contains: 'interest', mode: 'insensitive' } },
          { status: { contains: 'intrest', mode: 'insensitive' } },
        ],
      },
    }),
    prisma.callLog.count({
      where: {
        OR: [
          { status: { equals: 'Follow-up', mode: 'insensitive' } },
          { status: { equals: 'Follow Up', mode: 'insensitive' } },
          { status: { contains: 'follow', mode: 'insensitive' } },
        ],
      },
    }),
  ]);

  return {
    total,
    incoming,
    outgoing,
    completed,
    missed,
    busy,
    noAnswer,
    notInterested,
    followUp,
  };
}

/**
 * 3. Get Call Log by ID or Call ID
 */
export async function getCallLogByIdService(id) {
  const call = await prisma.callLog.findFirst({
    where: {
      OR: [{ id }, { callId: id }],
    },
  });

  if (!call) {
    const error = new Error('Call record not found.');
    error.status = 404;
    throw error;
  }

  return formatCallLogResponse(call);
}

/**
 * 4. Create New Call Log
 */
export async function createCallLogService(data) {
  // Support field mapping:
  // Caller Name -> employeeName
  // Receiver Name -> contactName
  // Receiver Number -> phoneNumber
  const callType = data.callType || data.type || 'Outgoing';
  const employeeId = data.employeeId || null;
  const employeeName = data.employeeName || data.callerName || '';
  const contactId = data.contactId || null;
  const contactName = data.contactName || data.receiverName || '';
  const phoneNumber = data.phoneNumber || data.receiverNumber || data.phone || '';
  let leadId = data.leadId || data.lead_id || null;
  const duration = data.duration || '00:00';
  const status = data.status || 'Completed';
  const callDate = data.callDate || data.date || new Date().toISOString().split('T')[0];
  const callTime = data.callTime || data.time || '10:00 AM';
  const description = data.description || data.notes || '';

  // If leadId is not provided, try to find matching Lead by contactId, phone, or name:
  if (!leadId) {
    try {
      const foundLead = await prisma.lead.findFirst({
        where: {
          OR: [
            ...(contactId ? [{ id: contactId }, { leadId: contactId }] : []),
            ...(phoneNumber ? [{ phone: phoneNumber }] : []),
            ...(contactName ? [{ name: { equals: contactName, mode: 'insensitive' } }] : []),
          ],
        },
      });
      if (foundLead) {
        leadId = foundLead.id;
      }
    } catch (_) {}
  }

  // Validations
  if (!callType || !['Incoming', 'Outgoing'].includes(callType)) {
    const error = new Error('Call Type must be either "Incoming" or "Outgoing".');
    error.status = 400;
    throw error;
  }

  if (!employeeName.trim()) {
    const error = new Error('Assigned Employee Name is required.');
    error.status = 400;
    throw error;
  }

  if (!contactName.trim()) {
    const error = new Error('Contact Name is required.');
    error.status = 400;
    throw error;
  }

  if (!phoneNumber.trim()) {
    const error = new Error('Phone Number is required.');
    error.status = 400;
    throw error;
  }

  const validStatuses = ['Completed', 'Follow-up', 'Missed', 'Busy', 'No Answer', 'Not Interested'];
  let normalizedStatus = validStatuses.find(
    (s) => s.toLowerCase() === status.trim().toLowerCase()
  );
  if (!normalizedStatus) {
    const sLower = status.trim().toLowerCase();
    if (sLower.includes('not') && (sLower.includes('interest') || sLower.includes('intrest'))) {
      normalizedStatus = 'Not Interested';
    } else if (sLower.includes('follow')) {
      normalizedStatus = 'Follow-up';
    }
  }
  normalizedStatus = normalizedStatus || 'Completed';

  // Generate unique Call ID
  const callId = await generateCallId();

  const newCall = await prisma.callLog.create({
    data: {
      callId,
      callType,
      employeeId,
      employeeName: employeeName.trim(),
      contactId,
      contactName: contactName.trim(),
      phoneNumber: phoneNumber.trim(),
      leadId,
      duration: duration.trim(),
      status: normalizedStatus,
      callDate,
      callTime,
      description: description.trim() || null,
    },
  });

  // Socket broadcast if available
  try {
    if (io) {
      io.emit('call:created', formatCallLogResponse(newCall));
    }
  } catch (_) {}

  return formatCallLogResponse(newCall);
}

/**
 * 5. Update Call Log
 */
export async function updateCallLogService(id, data) {
  const existing = await prisma.callLog.findFirst({
    where: { OR: [{ id }, { callId: id }] },
  });

  if (!existing) {
    const error = new Error('Call record not found.');
    error.status = 404;
    throw error;
  }

  const updateData = {};
  if (data.callType) updateData.callType = data.callType;
  if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
  if (data.employeeName || data.callerName) updateData.employeeName = (data.employeeName || data.callerName).trim();
  if (data.contactId !== undefined) updateData.contactId = data.contactId;
  if (data.contactName || data.receiverName) updateData.contactName = (data.contactName || data.receiverName).trim();
  if (data.phoneNumber || data.receiverNumber) updateData.phoneNumber = (data.phoneNumber || data.receiverNumber).trim();
  if (data.leadId !== undefined || data.lead_id !== undefined) updateData.leadId = data.leadId || data.lead_id || null;
  if (data.duration !== undefined) updateData.duration = data.duration.trim();
  if (data.status) {
    const validStatuses = ['Completed', 'Follow-up', 'Missed', 'Busy', 'No Answer', 'Not Interested'];
    let matched = validStatuses.find((s) => s.toLowerCase() === data.status.trim().toLowerCase());
    if (!matched) {
      const sLower = data.status.trim().toLowerCase();
      if (sLower.includes('not') && (sLower.includes('interest') || sLower.includes('intrest'))) {
        matched = 'Not Interested';
      } else if (sLower.includes('follow')) {
        matched = 'Follow-up';
      }
    }
    if (matched) updateData.status = matched;
  }
  if (data.callDate) updateData.callDate = data.callDate;
  if (data.callTime) updateData.callTime = data.callTime;
  if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;

  const updated = await prisma.callLog.update({
    where: { id: existing.id },
    data: updateData,
  });

  try {
    if (io) {
      io.emit('call:updated', formatCallLogResponse(updated));
    }
  } catch (_) {}

  return formatCallLogResponse(updated);
}

/**
 * 6. Delete Call Log
 */
export async function deleteCallLogService(id) {
  const existing = await prisma.callLog.findFirst({
    where: { OR: [{ id }, { callId: id }] },
  });

  if (!existing) {
    const error = new Error('Call record not found.');
    error.status = 404;
    throw error;
  }

  await prisma.callLog.delete({
    where: { id: existing.id },
  });

  try {
    if (io) {
      io.emit('call:deleted', { id: existing.id, callId: existing.callId });
    }
  } catch (_) {}

  return { id: existing.id, callId: existing.callId };
}

/**
 * Format Activity item for Activity Logs module
 */
export function formatSectionActivity(act) {
  if (!act) return null;
  const meta = typeof act.metadata === 'object' && act.metadata !== null ? act.metadata : {};
  return {
    id: act.id,
    activityNumber: act.activityNumber || `ACT-${act.id.slice(0, 8)}`,
    type: act.type,
    title: act.title,
    description: act.description,
    leadId: act.leadId,
    leadName: act.leadName,
    customerId: act.customerId,
    customerName: act.customerName || meta.companyName || '',
    contactId: act.contactId,
    contactName: act.contactName || '',
    phone: meta.phoneNumber || meta.phone || '',
    phoneNumber: meta.phoneNumber || meta.phone || '',
    email: meta.email || '',
    messageType: meta.messageType || (act.title?.includes('Template') ? 'Template Message' : (act.title?.includes('Direct') ? 'Direct Message' : (act.title?.includes('Incoming') ? 'Incoming' : 'Outgoing'))),
    emailType: meta.emailType || (act.title?.includes('Proposal') ? 'Proposal' : (act.title?.includes('Introduction') ? 'Introduction' : (act.title?.includes('Incoming') ? 'Incoming' : 'Outgoing'))),
    activityType: meta.activityType || (act.title?.includes('Direct Visit') ? 'Direct Visit' : (act.title?.includes('SMS') ? 'SMS' : (act.title?.includes('Social') ? 'Social Media' : (act.title?.includes('Event') ? 'Event / Exhibition' : 'Other')))),
    status: act.status || 'Completed',
    activityDate: act.activityDate,
    activityTime: act.activityTime || '10:00 AM',
    performedBy: act.performedBy || 'Staff',
    performedById: act.performedById,
    nextFollowDate: meta.nextFollowDate || null,
    metadata: meta,
    createdAt: act.createdAt,
    updatedAt: act.updatedAt,
  };
}

/**
 * 7. Get Section Activities (whatsapp, email, others, calls)
 */
export async function getSectionActivitiesService(section = 'calls', queryParams = {}) {
  const sec = String(section).toLowerCase().trim();
  if (sec === 'calls' || sec === 'call') {
    return getCallLogsService(queryParams);
  }

  const {
    status,
    search,
    date,
    startDate,
    endDate,
    contactId,
    leadId,
    page,
    limit,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  const where = {};

  if (sec === 'whatsapp') {
    where.type = 'whatsapp';
  } else if (sec === 'email') {
    where.type = 'email';
  } else {
    // others
    where.type = { in: ['other', 'others', 'task'] };
  }

  if (status && status !== 'ALL' && status !== 'All') {
    where.status = { equals: status, mode: 'insensitive' };
  }

  if (contactId && contactId !== 'ALL') {
    where.contactId = contactId;
  }

  if (leadId && leadId !== 'ALL') {
    where.leadId = leadId;
  }

  if (date && date !== 'ALL') {
    where.activityDate = date;
  } else {
    if (startDate && endDate) {
      where.activityDate = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.activityDate = { gte: startDate };
    } else if (endDate) {
      where.activityDate = { lte: endDate };
    }
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { activityNumber: { contains: s, mode: 'insensitive' } },
      { contactName: { contains: s, mode: 'insensitive' } },
      { customerName: { contains: s, mode: 'insensitive' } },
      { performedBy: { contains: s, mode: 'insensitive' } },
      { title: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
      { status: { contains: s, mode: 'insensitive' } },
    ];
  }

  const orderBy = [];
  if (sortBy === 'activityDate' || sortBy === 'callDate') {
    orderBy.push({ activityDate: sortOrder === 'asc' ? 'asc' : 'desc' });
  } else {
    orderBy.push({ [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' });
  }

  let items;
  let total;

  if (page && limit) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    [total, items] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);
  } else {
    items = await prisma.activity.findMany({
      where,
      orderBy,
    });
    total = items.length;
  }

  return {
    count: total,
    items: items.map(formatSectionActivity),
  };
}

/**
 * 8. Get Section Statistics (calls, whatsapp, email, others)
 */
export async function getSectionStatsService(section = 'calls') {
  const sec = String(section).toLowerCase().trim();
  if (sec === 'calls' || sec === 'call') {
    return getCallLogStatsService();
  }

  if (sec === 'whatsapp') {
    const baseWhere = { type: 'whatsapp' };
    const [total, sent, replied, interested, followUp, failed, notInterested] = await Promise.all([
      prisma.activity.count({ where: baseWhere }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Sent', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Replied', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Interested', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Follow', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Failed', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Not Interested', mode: 'insensitive' } } }),
    ]);
    return { total, sent, replied, interested, followUp, failed, notInterested };
  }

  if (sec === 'email') {
    const baseWhere = { type: 'email' };
    const [total, sent, replied, draft, interested, followUp, failed, notInterested] = await Promise.all([
      prisma.activity.count({ where: baseWhere }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Sent', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Replied', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Draft', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Interested', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Follow', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Failed', mode: 'insensitive' } } }),
      prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Not Interested', mode: 'insensitive' } } }),
    ]);
    return { total, sent, replied, draft, interested, followUp, failed, notInterested };
  }

  // others
  const baseWhere = { type: { in: ['other', 'others', 'task'] } };
  const [total, interested, followUp, notInterested, directVisit, sms] = await Promise.all([
    prisma.activity.count({ where: baseWhere }),
    prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Interested', mode: 'insensitive' } } }),
    prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Follow', mode: 'insensitive' } } }),
    prisma.activity.count({ where: { ...baseWhere, status: { contains: 'Not Interested', mode: 'insensitive' } } }),
    prisma.activity.count({ where: { ...baseWhere, OR: [{ title: { contains: 'Visit', mode: 'insensitive' } }, { description: { contains: 'Visit', mode: 'insensitive' } }] } }),
    prisma.activity.count({ where: { ...baseWhere, OR: [{ title: { contains: 'SMS', mode: 'insensitive' } }, { description: { contains: 'SMS', mode: 'insensitive' } }] } }),
  ]);
  return { total, interested, followUp, notInterested, directVisit, sms };
}

/**
 * 9. Create Section Activity (whatsapp, email, others)
 */
export async function createSectionActivityService(section, data, user) {
  const sec = String(section).toLowerCase().trim();
  if (sec === 'calls' || sec === 'call') {
    return createCallLogService(data);
  }

  const now = new Date();
  const todayStr = data.activityDate || now.toISOString().slice(0, 10);
  const timeStr = data.activityTime || '10:00 AM';

  const type = sec === 'whatsapp' ? 'whatsapp' : (sec === 'email' ? 'email' : 'other');
  const count = await prisma.activity.count();
  const prefix = sec === 'whatsapp' ? 'WA' : (sec === 'email' ? 'EML' : 'ACT');
  const activityNumber = `${prefix}-2026-${1001 + count}`;

  const meta = {
    ...(data.metadata || {}),
    phoneNumber: data.phoneNumber || data.phone || undefined,
    email: data.email || undefined,
    messageType: data.messageType || (sec === 'whatsapp' ? 'Outgoing' : undefined),
    emailType: data.emailType || (sec === 'email' ? 'Outgoing' : undefined),
    activityType: data.activityType || (sec === 'others' ? 'Direct Visit' : undefined),
    nextFollowDate: data.nextFollowDate || undefined,
    companyName: data.companyName || data.customerName || undefined,
  };

  const activity = await prisma.activity.create({
    data: {
      activityNumber,
      type,
      title: data.title || `${sec.toUpperCase()}: ${data.status || 'Logged'}`,
      description: data.description || '',
      contactId: data.contactId || null,
      contactName: data.contactName || 'Contact',
      customerName: data.customerName || data.companyName || null,
      status: data.status || (sec === 'whatsapp' ? 'Msg Sent' : (sec === 'email' ? 'Mail Sent' : 'Interested')),
      performedBy: data.performedBy || user?.name || 'Staff',
      performedById: data.performedById ? String(data.performedById) : (user?.id ? String(user.id) : null),
      activityDate: todayStr,
      activityTime: timeStr,
      metadata: meta,
    },
  });

  try {
    if (io) {
      io.emit('activity:created', formatSectionActivity(activity));
      io.emit('activity:new', formatSectionActivity(activity));
    }
  } catch (_) {}

  return formatSectionActivity(activity);
}

/**
 * 10. Delete Section Activity
 */
export async function deleteSectionActivityService(section, id) {
  const sec = String(section).toLowerCase().trim();
  if (sec === 'calls' || sec === 'call') {
    return deleteCallLogService(id);
  }

  const existing = await prisma.activity.findFirst({
    where: { OR: [{ id }, { activityNumber: id }] },
  });

  if (!existing) {
    const error = new Error('Activity record not found.');
    error.status = 404;
    throw error;
  }

  await prisma.activity.delete({
    where: { id: existing.id },
  });

  try {
    if (io) {
      io.emit('activity:deleted', { id: existing.id });
    }
  } catch (_) {}

  return { id: existing.id, success: true };
}
