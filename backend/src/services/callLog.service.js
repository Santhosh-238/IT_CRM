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
