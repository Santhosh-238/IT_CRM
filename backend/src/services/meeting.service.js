import { prisma } from '../config/prisma.js';
import { getCache, setCache, delCache } from '../config/redis.js';
import { io } from '../utils/socket.js';

const CACHE_KEY_PREFIX = 'crm:meetings:';

/**
 * Helper to build the unified SQL SELECT query for "ScheduledMeeting" with Lead join
 */
function getScheduledMeetingSelectQuery(whereClause = 'WHERE 1=1') {
  return `
    SELECT 
      m.id,
      COALESCE(m."lead_id", m."contactId") AS "leadId",
      COALESCE(m."lead_id", m."contactId") AS "lead_id",
      COALESCE(m."contactId", m."lead_id") AS "contactId",
      m.title,
      m.title AS "meetingTitle",
      m.purpose,
      m."meetingDate",
      m."meetingDate" AS "date",
      m."startTime",
      m."startTime" AS "meetingTime",
      m."startTime" AS "time",
      m."endTime",
      m."meetingType",
      m.location,
      m.location AS "meetingLocation",
      m.location AS "meetingLink",
      m."employeeId",
      m."employeeName",
      m."employeeName" AS "assignedTo",
      m."employeeEmail",
      m."employeeDesignation",
      COALESCE(l.name, m."clientName") AS "leadName",
      COALESCE(m."clientName", l.name) AS "clientName",
      l."companyName" AS "companyName",
      l.email AS "leadEmail",
      l.phone AS "leadPhone",
      l."leadId" AS "leadCode",
      l.id AS "leadDbId",
      l.stage AS "leadStage",
      l.status AS "leadStatus",
      m.status,
      m.status AS "meetingStatus",
      m.notes,
      m.notes AS "description",
      m.requirements,
      m."requirementFileName",
      m."requirementFileUrl",
      m."requirementFileSize",
      m."createdAt",
      m."updatedAt"
    FROM "ScheduledMeeting" m
    LEFT JOIN "Lead" l ON (
      m."lead_id" = l.id OR 
      m."contactId" = l.id OR 
      m."lead_id" = l."leadId" OR 
      m."contactId" = l."leadId"
    )
    ${whereClause}
  `;
}

/**
 * 1. Get all scheduled meetings from ScheduledMeeting with date-wise sorting and filtering
 */
export async function getMeetingsService(queryParams = {}) {
  const { date, startDate, endDate, status, employeeId, leadId, search } = queryParams;

  let where = 'WHERE 1=1';
  const params = [];
  let paramIdx = 1;

  if (leadId && leadId !== 'ALL') {
    where += ` AND (m."lead_id" = $${paramIdx} OR m."contactId" = $${paramIdx} OR l."leadId" = $${paramIdx} OR l.id = $${paramIdx})`;
    paramIdx++;
    params.push(leadId);
  }

  if (date && date !== 'ALL') {
    where += ` AND m."meetingDate" = $${paramIdx++}`;
    params.push(date);
  } else {
    if (startDate) {
      where += ` AND m."meetingDate" >= $${paramIdx++}`;
      params.push(startDate);
    }
    if (endDate) {
      where += ` AND m."meetingDate" <= $${paramIdx++}`;
      params.push(endDate);
    }
  }

  if (status && status !== 'ALL') {
    where += ` AND LOWER(m.status) = LOWER($${paramIdx++})`;
    params.push(status);
  }

  if (employeeId && employeeId !== 'ALL') {
    where += ` AND (m."employeeId" = $${paramIdx} OR m."employeeName" ILIKE '%' || $${paramIdx} || '%')`;
    paramIdx++;
    params.push(employeeId);
  }

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    where += ` AND (
      m.title ILIKE $${paramIdx} OR 
      m.purpose ILIKE $${paramIdx} OR 
      m.notes ILIKE $${paramIdx} OR 
      m."employeeName" ILIKE $${paramIdx} OR 
      m."clientName" ILIKE $${paramIdx} OR 
      m.location ILIKE $${paramIdx} OR 
      l.name ILIKE $${paramIdx} OR 
      l."companyName" ILIKE $${paramIdx}
    )`;
    paramIdx++;
    params.push(s);
  }

  // Date-wise ordering: Meeting Date ASC, Start Time ASC, Created At DESC
  const fullQuery = `${getScheduledMeetingSelectQuery(where)} ORDER BY m."meetingDate" ASC, m."startTime" ASC, m."createdAt" DESC`;

  const meetings = await prisma.$queryRawUnsafe(fullQuery, ...params);

  // Group date-wise
  const dateWiseMap = {};
  meetings.forEach((m) => {
    const d = m.meetingDate;
    if (!dateWiseMap[d]) {
      dateWiseMap[d] = [];
    }
    dateWiseMap[d].push(m);
  });

  return {
    count: meetings.length,
    meetings,
    dateWise: dateWiseMap,
  };
}

/**
 * 2. Get Meeting by ID from ScheduledMeeting
 */
export async function getMeetingByIdService(id) {
  const query = `${getScheduledMeetingSelectQuery('WHERE m.id = $1')} LIMIT 1`;
  const results = await prisma.$queryRawUnsafe(query, id);

  if (!results || results.length === 0) {
    const error = new Error('Scheduled meeting not found.');
    error.status = 404;
    throw error;
  }

  return results[0];
}

/**
 * 3. Create New Scheduled Meeting in ScheduledMeeting
 */
export async function createMeetingService(body) {
  const {
    leadId,
    lead_id,
    contactId,
    title,
    purpose,
    meetingTitle,
    meeting_title,
    meetingDate,
    meeting_date,
    date,
    startTime,
    meetingTime,
    meeting_time,
    time,
    endTime,
    meetingType = 'Virtual',
    meeting_type = 'Virtual',
    location = '',
    meetingLocation = '',
    meeting_location = '',
    meetingLink = '',
    meeting_link = '',
    employeeId,
    employeeName,
    assignedTo,
    assigned_to,
    employeeEmail,
    employeeDesignation,
    clientName,
    status = 'Scheduled',
    meetingStatus = 'Scheduled',
    meeting_status = 'Scheduled',
    notes = '',
    description,
    stageAfterMeeting,
  } = body;

  const targetLeadIdentifier = lead_id || leadId || contactId;

  // Resolve lead from Lead table if identifier provided
  let resolvedLead = null;
  if (targetLeadIdentifier) {
    const leads = await prisma.$queryRawUnsafe(
      `SELECT id, "leadId", name, "companyName", stage, status FROM "Lead" WHERE id = $1 OR "leadId" = $1 LIMIT 1`,
      targetLeadIdentifier
    );
    if (leads && leads.length > 0) {
      resolvedLead = leads[0];
    }
  }

  const finalLeadId = resolvedLead ? resolvedLead.id : targetLeadIdentifier || null;
  const finalTitle = (title || meeting_title || meetingTitle || purpose || 'Client Discovery Meeting').trim();
  const finalPurpose = (purpose || finalTitle).trim();
  const finalDate = meeting_date || meetingDate || date;
  const finalStartTime = (startTime || meeting_time || meetingTime || time || '10:00 AM').trim();
  const finalEndTime = (endTime || finalStartTime).trim();
  const finalType = meeting_type || meetingType || 'Virtual';
  const finalLocation = (location || meetingLocation || meeting_location || meetingLink || meeting_link || '').trim();
  const finalEmployeeName = (employeeName || assignedTo || assigned_to || 'Sandy').trim();
  const finalStatus = meeting_status || meetingStatus || status || 'Scheduled';
  const finalNotes = (description !== undefined ? description : notes || '').trim();

  let finalClientName = clientName;
  if (!finalClientName && resolvedLead) {
    finalClientName = resolvedLead.companyName ? `${resolvedLead.name} (${resolvedLead.companyName})` : resolvedLead.name;
  }
  finalClientName = (finalClientName || 'Lead Client').trim();

  if (!finalDate) {
    const error = new Error('Meeting date is required.');
    error.status = 400;
    throw error;
  }

  if (!finalStartTime) {
    const error = new Error('Start time is required.');
    error.status = 400;
    throw error;
  }

  // Accidental double-click protection (only if identical meeting with same title & location was submitted < 2s ago)
  if (finalLeadId) {
    const rapidDuplicate = await prisma.$queryRawUnsafe(
      `SELECT id FROM "ScheduledMeeting" 
       WHERE ("lead_id" = $1 OR "contactId" = $1)
         AND "meetingDate" = $2 
         AND "startTime" = $3 
         AND COALESCE(location, '') = $4
         AND title = $5
         AND "createdAt" > NOW() - INTERVAL '2 seconds'
       LIMIT 1`,
      finalLeadId,
      finalDate,
      finalStartTime,
      finalLocation,
      finalTitle
    );

    if (rapidDuplicate && rapidDuplicate.length > 0) {
      return await getMeetingByIdService(rapidDuplicate[0].id);
    }
  }

  const meetingId = `meet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const finalRequirements = (body.requirements || '').trim() || null;
  const finalReqFileName = (body.requirementFileName || '').trim() || null;
  const finalReqFileUrl = body.requirementFileUrl || null;
  const finalReqFileSize = (body.requirementFileSize || '').trim() || null;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "ScheduledMeeting" (
      id,
      title,
      purpose,
      "meetingDate",
      "startTime",
      "endTime",
      "meetingType",
      location,
      "employeeId",
      "employeeName",
      "employeeEmail",
      "employeeDesignation",
      "contactId",
      "lead_id",
      "clientName",
      status,
      notes,
      requirements,
      "requirementFileName",
      "requirementFileUrl",
      "requirementFileSize",
      "createdAt",
      "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
    )`,
    meetingId,
    finalTitle,
    finalPurpose,
    finalDate,
    finalStartTime,
    finalEndTime,
    finalType,
    finalLocation,
    employeeId || null,
    finalEmployeeName,
    employeeEmail || null,
    employeeDesignation || null,
    finalLeadId,
    finalLeadId,
    finalClientName,
    finalStatus,
    finalNotes,
    finalRequirements,
    finalReqFileName,
    finalReqFileUrl,
    finalReqFileSize
  );

  // If a lead exists, advance stage to Discovery / Contacted
  if (resolvedLead) {
    try {
      const targetStage = stageAfterMeeting || (resolvedLead.stage === 'Initialization' ? 'Discovery' : resolvedLead.stage);
      await prisma.$executeRawUnsafe(
        `UPDATE "Lead" 
         SET stage = $1, status = CASE WHEN status = 'New' THEN 'Contacted' ELSE status END, "updatedAt" = NOW()
         WHERE id = $2`,
        targetStage,
        resolvedLead.id
      );
    } catch (leadUpdateErr) {
      console.warn('Note: Lead stage update warning:', leadUpdateErr.message);
    }
  }

  const created = await getMeetingByIdService(meetingId);

  // Broadcast realtime update via socket
  try {
    io.emit('meeting:created', created);
  } catch (_) {}

  return created;
}

/**
 * 4. Update Scheduled Meeting in ScheduledMeeting
 */
export async function updateMeetingService(id, body) {
  await getMeetingByIdService(id); // Ensure meeting exists

  const fields = [];
  const params = [];
  let paramIdx = 1;

  if (body.title !== undefined || body.meeting_title !== undefined || body.meetingTitle !== undefined) {
    const val = body.title || body.meeting_title || body.meetingTitle;
    fields.push(`title = $${paramIdx++}`);
    params.push(val);
  }

  if (body.purpose !== undefined) {
    fields.push(`purpose = $${paramIdx++}`);
    params.push(body.purpose);
  }

  if (body.meetingDate !== undefined || body.meeting_date !== undefined || body.date !== undefined) {
    const val = body.meetingDate || body.meeting_date || body.date;
    fields.push(`"meetingDate" = $${paramIdx++}`);
    params.push(val);
  }

  if (body.startTime !== undefined || body.meeting_time !== undefined || body.meetingTime !== undefined || body.time !== undefined) {
    const val = body.startTime || body.meeting_time || body.meetingTime || body.time;
    fields.push(`"startTime" = $${paramIdx++}`);
    params.push(val);
  }

  if (body.endTime !== undefined) {
    fields.push(`"endTime" = $${paramIdx++}`);
    params.push(body.endTime);
  }

  if (body.meetingType !== undefined || body.meeting_type !== undefined) {
    const val = body.meetingType || body.meeting_type;
    fields.push(`"meetingType" = $${paramIdx++}`);
    params.push(val);
  }

  if (body.location !== undefined || body.meetingLocation !== undefined || body.meeting_location !== undefined || body.meetingLink !== undefined) {
    const val = body.location || body.meetingLocation || body.meeting_location || body.meetingLink;
    fields.push(`location = $${paramIdx++}`);
    params.push(val);
  }

  if (body.employeeId !== undefined) {
    fields.push(`"employeeId" = $${paramIdx++}`);
    params.push(body.employeeId);
  }

  if (body.employeeName !== undefined || body.assignedTo !== undefined || body.assigned_to !== undefined) {
    const val = body.employeeName || body.assignedTo || body.assigned_to;
    fields.push(`"employeeName" = $${paramIdx++}`);
    params.push(val);
  }

  if (body.employeeEmail !== undefined) {
    fields.push(`"employeeEmail" = $${paramIdx++}`);
    params.push(body.employeeEmail);
  }

  if (body.employeeDesignation !== undefined) {
    fields.push(`"employeeDesignation" = $${paramIdx++}`);
    params.push(body.employeeDesignation);
  }

  if (body.clientName !== undefined) {
    fields.push(`"clientName" = $${paramIdx++}`);
    params.push(body.clientName);
  }

  if (body.status !== undefined || body.meetingStatus !== undefined || body.meeting_status !== undefined) {
    const val = body.status || body.meetingStatus || body.meeting_status;
    fields.push(`status = $${paramIdx++}`);
    params.push(val);
  }

  if (body.notes !== undefined || body.description !== undefined) {
    const val = body.notes !== undefined ? body.notes : body.description;
    fields.push(`notes = $${paramIdx++}`);
    params.push(val);
  }

  if (body.requirements !== undefined) {
    fields.push(`requirements = $${paramIdx++}`);
    params.push(body.requirements);
  }

  if (body.requirementFileName !== undefined) {
    fields.push(`"requirementFileName" = $${paramIdx++}`);
    params.push(body.requirementFileName);
  }

  if (body.requirementFileUrl !== undefined) {
    fields.push(`"requirementFileUrl" = $${paramIdx++}`);
    params.push(body.requirementFileUrl);
  }

  if (body.requirementFileSize !== undefined) {
    fields.push(`"requirementFileSize" = $${paramIdx++}`);
    params.push(body.requirementFileSize);
  }

  if (body.leadId !== undefined || body.lead_id !== undefined || body.contactId !== undefined) {
    const val = body.leadId || body.lead_id || body.contactId;
    fields.push(`"contactId" = $${paramIdx++}`);
    params.push(val);
    fields.push(`"lead_id" = $${paramIdx++}`);
    params.push(val);
  }

  if (fields.length === 0) {
    return await getMeetingByIdService(id);
  }

  fields.push(`"updatedAt" = NOW()`);
  params.push(id);

  const query = `
    UPDATE "ScheduledMeeting"
    SET ${fields.join(', ')}
    WHERE id = $${paramIdx}
  `;

  await prisma.$executeRawUnsafe(query, ...params);

  const updated = await getMeetingByIdService(id);

  try {
    io.emit('meeting:updated', updated);
  } catch (_) {}

  return updated;
}

/**
 * 5. Delete Scheduled Meeting from ScheduledMeeting
 */
export async function deleteMeetingService(id) {
  await getMeetingByIdService(id);
  await prisma.$executeRawUnsafe(`DELETE FROM "ScheduledMeeting" WHERE id = $1`, id);

  try {
    io.emit('meeting:deleted', { id });
  } catch (_) {}

  return { success: true, id, message: 'Meeting deleted successfully.' };
}

/**
 * 6. Meeting Statistics & Overview
 */
export async function getMeetingStatsService() {
  const todayStr = new Date().toISOString().split('T')[0];

  const allMeetings = await prisma.$queryRawUnsafe(
    `SELECT id, "meetingDate", status, "employeeName" FROM "ScheduledMeeting"`
  );

  const total = allMeetings.length;
  let todayCount = 0;
  let upcomingCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  const employeeCountMap = {};

  allMeetings.forEach((m) => {
    if (m.meetingDate === todayStr) todayCount++;
    else if (m.meetingDate > todayStr) upcomingCount++;

    const st = (m.status || '').toLowerCase();
    if (st === 'completed') completedCount++;
    if (st === 'cancelled') cancelledCount++;

    if (m.employeeName) {
      employeeCountMap[m.employeeName] = (employeeCountMap[m.employeeName] || 0) + 1;
    }
  });

  return {
    total,
    todayCount,
    upcomingCount,
    completedCount,
    cancelledCount,
    employeeBreakdown: employeeCountMap,
  };
}
