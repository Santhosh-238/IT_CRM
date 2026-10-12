export type MeetingStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rescheduled';
export type MeetingType = 'Virtual' | 'In-person' | 'Phone Call';

export interface ScheduledMeeting {
  id: string;
  leadId?: string;
  lead_id?: string;
  leadDbId?: string;
  leadCode?: string;
  leadName?: string;
  companyName?: string;
  leadEmail?: string;
  leadPhone?: string;
  meetingTitle?: string;
  meeting_title?: string;
  title: string;
  purpose: string;
  meetingDate: string; // YYYY-MM-DD
  meeting_date?: string;
  date?: string;
  startTime: string;   // e.g. "10:00 AM"
  endTime?: string;    // e.g. "11:00 AM"
  meetingTime?: string;
  meeting_time?: string;
  time?: string;
  meetingType: MeetingType | string;
  meeting_type?: string;
  location?: string;
  meetingLocation?: string;
  meeting_location?: string;
  meetingLink?: string;
  meeting_link?: string;
  assignedTo?: string;
  assigned_to?: string;
  employeeId?: string;
  employeeName: string; // which employee created the meeting
  employeeEmail?: string;
  employeeDesignation?: string;
  contactId?: string;
  clientName?: string;
  meetingStatus?: MeetingStatus | string;
  status: MeetingStatus | string;
  description?: string;
  notes?: string;
  requirements?: string;
  requirementFileName?: string;
  requirementFileUrl?: string;
  requirementFileSize?: string;
  createdBy?: string;
  duration?: string;
  hostName?: string;
  stageAfterMeeting?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingStats {
  total: number;
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  employeeBreakdown: Record<string, number>;
}

export interface MeetingFilters {
  leadId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  employeeId?: string;
  search?: string;
}
