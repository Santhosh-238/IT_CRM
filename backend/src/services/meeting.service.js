import { prisma } from '../config/prisma.js';
import { getCache, setCache, delCache } from '../config/redis.js';
import { io } from '../utils/socket.js';

const CACHE_KEY_PREFIX = 'crm:meetings:';

/**
 * 1. Get all scheduled meetings with date-wise sorting and filtering
 */
export async function getMeetingsService(queryParams = {}) {
  const { date, startDate, endDate, status, employeeId, search } = queryParams;

  let query = `
    SELECT 
      id, title, purpose, "meetingDate", "startTime", "endTime",
      "meetingType", location, "employeeId", "employeeName", "employeeEmail",
      "employeeDesignation", "contactId", "clientName", status, notes,
      "createdAt", "updatedAt"
    FROM "ScheduledMeeting"
    WHERE 1=1
  `;
  const params = [];
  let paramIdx = 1;

  if (date && date !== 'ALL') {
    query += ` AND "meetingDate" = $${paramIdx++}`;
    params.push(date);
  } else {
    if (startDate) {
      query += ` AND "meetingDate" >= $${paramIdx++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND "meetingDate" <= $${paramIdx++}`;
      params.push(endDate);
    }
  }

  if (status && status !== 'ALL') {
    query += ` AND LOWER(status) = LOWER($${paramIdx++})`;
    params.push(status);
  }

  if (employeeId && employeeId !== 'ALL') {
    query += ` AND ("employeeId" = $${paramIdx} OR "employeeName" ILIKE '%' || $${paramIdx} || '%')`;
    paramIdx++;
    params.push(employeeId);
  }

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    query += ` AND (
      purpose ILIKE $${paramIdx} OR 
      title ILIKE $${paramIdx} OR 
      "employeeName" ILIKE $${paramIdx} OR 
      "clientName" ILIKE $${paramIdx} OR
      location ILIKE $${paramIdx}
    )`;
    paramIdx++;
    params.push(s);
  }

  // Date-wise ordering: Meeting Date ASC, Start Time ASC
  query += ` ORDER BY "meetingDate" ASC, "startTime" ASC`;

  const meetings = await prisma.$queryRawUnsafe(query, ...params);

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
 * 2. Get Meeting by ID
 */
export async function getMeetingByIdService(id) {
  const results = await prisma.$queryRawUnsafe(
    `SELECT * FROM "ScheduledMeeting" WHERE id = $1 LIMIT 1`,
    id
  );

  if (!results || results.length === 0) {
    const error = new Error('Scheduled meeting not found.');
    error.status = 404;
    throw error;
  }

  return results[0];
}

/**
 * 3. Create New Scheduled Meeting
 */
export async function createMeetingService(body) {
  const {
    title,
    purpose,
    meetingDate,
    startTime,
    endTime,
    meetingType = 'Virtual',
    location = '',
    employeeId,
    employeeName,
    employeeEmail,
    employeeDesignation,
    contactId,
    clientName,
    status = 'Scheduled',
    notes = '',
  } = body;

  if (!purpose || !purpose.trim()) {
    const error = new Error('Meeting purpose is required.');
    error.status = 400;
    throw error;
  }

  if (!meetingDate) {
    const error = new Error('Meeting date is required.');
    error.status = 400;
    throw error;
  }

  if (!startTime || !endTime) {
    const error = new Error('Start time and end time are required.');
    error.status = 400;
    throw error;
  }

  if (!employeeName || !employeeName.trim()) {
    const error = new Error('Employee creator name is required.');
    error.status = 400;
    throw error;
  }

  const id = `meet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const finalTitle = title && title.trim() ? title.trim() : purpose.trim();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "ScheduledMeeting" (
      id, title, purpose, "meetingDate", "startTime", "endTime",
      "meetingType", location, "employeeId", "employeeName", "employeeEmail",
      "employeeDesignation", "contactId", "clientName", status, notes,
      "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
    )`,
    id,
    finalTitle,
    purpose.trim(),
    meetingDate,
    startTime,
    endTime,
    meetingType,
    location,
    employeeId || null,
    employeeName.trim(),
    employeeEmail || null,
    employeeDesignation || null,
    contactId || null,
    clientName || 'General Discussion',
    status,
    notes
  );

  const created = await getMeetingByIdService(id);

  // Broadcast realtime update
  try {
    io.emit('meeting:created', created);
  } catch (_) {}

  return created;
}

/**
 * 4. Update Scheduled Meeting
 */
export async function updateMeetingService(id, body) {
  await getMeetingByIdService(id); // Ensure exists

  const fields = [];
  const params = [];
  let paramIdx = 1;

  const allowed = [
    'title',
    'purpose',
    'meetingDate',
    'startTime',
    'endTime',
    'meetingType',
    'location',
    'employeeId',
    'employeeName',
    'employeeEmail',
    'employeeDesignation',
    'contactId',
    'clientName',
    'status',
    'notes',
  ];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      fields.push(`"${key}" = $${paramIdx++}`);
      params.push(body[key]);
    }
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
 * 5. Delete Scheduled Meeting
 */
export async function deleteMeetingService(id) {
  const existing = await getMeetingByIdService(id);
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
