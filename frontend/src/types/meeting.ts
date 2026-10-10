export type MeetingStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rescheduled';
export type MeetingType = 'Virtual' | 'In-person' | 'Phone Call';

export interface ScheduledMeeting {
  id: string;
  title: string;
  purpose: string;
  meetingDate: string; // YYYY-MM-DD
  startTime: string;   // e.g. "10:00 AM"
  endTime: string;     // e.g. "11:00 AM"
  meetingType: MeetingType | string;
  location?: string;
  employeeId?: string;
  employeeName: string; // which employee created the meeting
  employeeEmail?: string;
  employeeDesignation?: string;
  contactId?: string;
  clientName?: string;
  status: MeetingStatus | string;
  notes?: string;
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
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  employeeId?: string;
  search?: string;
}
