export type CallType = 'Incoming' | 'Outgoing';

export type CallStatus = 'Completed' | 'Missed' | 'Busy' | 'No Answer';

export interface CallLog {
  id: string;
  callId: string;
  callType: CallType;
  employeeId?: string | null;
  employeeName: string;
  contactId?: string | null;
  contactName: string;
  phoneNumber: string;
  leadId?: string | null;
  duration: string;
  status: CallStatus;
  callDate: string;
  callTime: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CallLogStats {
  total: number;
  incoming: number;
  outgoing: number;
  completed: number;
  missed: number;
  busy: number;
  noAnswer: number;
}

export interface CallLogFilters {
  callType?: string;
  status?: string;
  search?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  contactId?: string;
  leadId?: string;
}
