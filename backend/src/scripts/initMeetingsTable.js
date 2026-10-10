import { prisma } from '../config/prisma.js';

async function init() {
  console.log('Ensuring ScheduledMeeting table in database...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ScheduledMeeting" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL DEFAULT 'Client Discussion',
      "purpose" TEXT NOT NULL,
      "meetingDate" TEXT NOT NULL,
      "startTime" TEXT NOT NULL,
      "endTime" TEXT NOT NULL,
      "meetingType" TEXT DEFAULT 'Virtual',
      "location" TEXT,
      "employeeId" TEXT,
      "employeeName" TEXT NOT NULL,
      "employeeEmail" TEXT,
      "employeeDesignation" TEXT,
      "contactId" TEXT,
      "clientName" TEXT,
      "status" TEXT DEFAULT 'Scheduled',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('ScheduledMeeting table is ready.');

  // Check if any meetings exist, if not seed a few realistic scheduled meetings
  const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "ScheduledMeeting"`);
  const count = countRes[0]?.count || 0;
  console.log('Current scheduled meetings count:', count);

  if (count === 0) {
    console.log('Seeding initial scheduled meetings...');
    const today = new Date();
    const formatDate = (offsetDays) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    };

    const initialMeetings = [
      {
        id: 'meet-101',
        title: 'ERP Integration Kickoff',
        purpose: 'Technical architecture alignment and ERP system data mapping',
        meetingDate: formatDate(0), // Today
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        meetingType: 'Virtual',
        location: 'https://meet.google.com/one-assist-erp',
        employeeId: 'EMP-1001',
        employeeName: 'Santhosh Kumar',
        employeeEmail: 'santhosh@oneassist.in',
        employeeDesignation: 'Lead Solution Architect',
        clientName: 'Tata Consultancy Enterprise',
        status: 'Scheduled',
        notes: 'Review Phase 1 scope and API endpoints specifications.',
      },
      {
        id: 'meet-102',
        title: 'CRM Demo & Proposal Walkthrough',
        purpose: 'Demonstrate custom CRM pipeline, contact assignment, and live reporting',
        meetingDate: formatDate(0), // Today
        startTime: '02:30 PM',
        endTime: '03:30 PM',
        meetingType: 'Virtual',
        location: 'https://meet.google.com/crm-live-demo',
        employeeId: 'EMP-1002',
        employeeName: 'Priya Sharma',
        employeeEmail: 'priya.s@oneassist.in',
        employeeDesignation: 'Senior Sales Executive',
        clientName: 'Apex Healthtech Solutions',
        status: 'Scheduled',
        notes: 'Client VP of Sales and 4 team leads attending.',
      },
      {
        id: 'meet-103',
        title: 'Contract Negotiation & SOW Sign-off',
        purpose: 'Finalize SLA terms, pricing discount tiers, and contract sign-off',
        meetingDate: formatDate(1), // Tomorrow
        startTime: '11:30 AM',
        endTime: '12:30 PM',
        meetingType: 'In-person',
        location: 'Executive Boardroom, OneAssist HQ, Chennai',
        employeeId: 'EMP-1003',
        employeeName: 'Rajesh V',
        employeeEmail: 'rajesh.v@oneassist.in',
        employeeDesignation: 'Enterprise Account Manager',
        clientName: 'Kovai Logistics Group',
        status: 'Scheduled',
        notes: 'Legal counsel reviewed draft. Print 2 signed hard copies.',
      },
      {
        id: 'meet-104',
        title: 'Requirement Gathering - HRMS Customization',
        purpose: 'Gather biometric attendance sync and payroll calculation business rules',
        meetingDate: formatDate(2), // Day after tomorrow
        startTime: '04:00 PM',
        endTime: '05:00 PM',
        meetingType: 'Virtual',
        location: 'https://meet.google.com/hrms-gather',
        employeeId: 'EMP-1004',
        employeeName: 'Ananya Ramesh',
        employeeEmail: 'ananya.r@oneassist.in',
        employeeDesignation: 'Business Analyst',
        clientName: 'Zenith Retail Chains',
        status: 'Scheduled',
        notes: 'Document all standard shift times and overtime formulas.',
      },
      {
        id: 'meet-105',
        title: 'Quarterly Vendor Review',
        purpose: 'Assess Q3 deliverables, response SLA compliance, and future roadmap',
        meetingDate: formatDate(-1), // Yesterday (Past)
        startTime: '03:00 PM',
        endTime: '04:00 PM',
        meetingType: 'Virtual',
        location: 'https://zoom.us/j/987654321',
        employeeId: 'EMP-1001',
        employeeName: 'Santhosh Kumar',
        employeeEmail: 'santhosh@oneassist.in',
        employeeDesignation: 'Lead Solution Architect',
        clientName: 'Matrix Cloud Systems',
        status: 'Completed',
        notes: 'Q3 performance rated 9.4/10. Renewal confirmed.',
      },
    ];

    for (const m of initialMeetings) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "ScheduledMeeting" ("id", "title", "purpose", "meetingDate", "startTime", "endTime", "meetingType", "location", "employeeId", "employeeName", "employeeEmail", "employeeDesignation", "clientName", "status", "notes", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
         ON CONFLICT ("id") DO NOTHING`,
        m.id,
        m.title,
        m.purpose,
        m.meetingDate,
        m.startTime,
        m.endTime,
        m.meetingType,
        m.location,
        m.employeeId,
        m.employeeName,
        m.employeeEmail,
        m.employeeDesignation,
        m.clientName,
        m.status,
        m.notes
      );
    }
    console.log('Seeded 5 sample scheduled meetings.');
  }

  process.exit(0);
}

init().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
