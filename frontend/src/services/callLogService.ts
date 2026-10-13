import { CallLog, CallLogStats, CallLogFilters } from '../types/callLog';

const API_BASE = 'http://localhost:5000/api/call-logs';

export async function fetchCallLogsApi(filters?: CallLogFilters): Promise<{
  calls: CallLog[];
  count: number;
}> {
  const params = new URLSearchParams();
  if (filters?.callType && filters.callType !== 'ALL' && filters.callType !== 'All') {
    params.append('callType', filters.callType);
  }
  if (filters?.status && filters.status !== 'ALL' && filters.status !== 'All') {
    params.append('status', filters.status);
  }
  if (filters?.date && filters.date !== 'ALL') {
    params.append('date', filters.date);
  }
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.employeeId && filters.employeeId !== 'ALL') {
    params.append('employeeId', filters.employeeId);
  }
  if (filters?.contactId && filters.contactId !== 'ALL') {
    params.append('contactId', filters.contactId);
  }
  if (filters?.leadId && filters.leadId !== 'ALL') {
    params.append('leadId', filters.leadId);
  }
  if (filters?.search && filters.search.trim()) {
    params.append('search', filters.search.trim());
  }

  const url = `${API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { credentials: 'include' });

  if (!res.ok) {
    throw new Error(`Failed to fetch call logs (${res.status})`);
  }

  const json = await res.json();
  const data = json.data || {};
  return {
    calls: data.calls || [],
    count: data.count || 0,
  };
}

export async function fetchCallLogStatsApi(): Promise<CallLogStats> {
  const res = await fetch(`${API_BASE}/stats`, { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to fetch call log stats');
  }
  const json = await res.json();
  return json.data;
}

export async function createCallLogApi(callData: Partial<CallLog>): Promise<CallLog> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(callData),
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Failed to log call.');
  }
  return json.data;
}

export async function updateCallLogApi(id: string, callData: Partial<CallLog>): Promise<CallLog> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(callData),
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Failed to update call log.');
  }
  return json.data;
}

export async function deleteCallLogApi(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Failed to delete call record.');
  }
  return true;
}
