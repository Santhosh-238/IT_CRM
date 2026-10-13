import { ScheduledMeeting } from '../../types/meeting';
import { Lead } from '../../types/lead';

/**
 * Checks if a scheduled meeting belongs to a specific lead.
 * Matches strictly by lead IDs first (UUID, leadDbId, leadCode, contactId).
 * Only if the meeting has NO ID assigned at all does it fall back to matching by clientName.
 */
export const isMeetingForLead = (m: ScheduledMeeting, lead: Lead): boolean => {
  if (!lead || !m) return false;

  // 1. Strict ID matching
  if (m.leadId && String(m.leadId) === String(lead.id)) return true;
  if (m.leadDbId && String(m.leadDbId) === String(lead.id)) return true;
  if (m.contactId && String(m.contactId) === String(lead.id)) return true;
  if (m.leadCode && lead.leadId && String(m.leadCode) === String(lead.leadId)) return true;

  // If the meeting has ANY specific lead/contact ID assigned, but did not match this lead,
  // it belongs to someone else. Never guess by name when IDs exist!
  if (m.leadId || m.leadDbId || m.contactId || m.leadCode) {
    return false;
  }

  // 2. Exact name matching only if NO ID exists on the meeting
  const rawClientName = (m.clientName || m.leadName || '').trim().toLowerCase();
  const rawLeadName = (lead.name || '').trim().toLowerCase();
  if (!rawClientName || !rawLeadName) return false;

  if (rawClientName === rawLeadName) return true;

  // In case clientName is stored with company: e.g. "athi (Athi tech)"
  const clientNameWithoutCompany = rawClientName.split('(')[0].trim();
  return clientNameWithoutCompany === rawLeadName;
};

/**
 * Finds the matching lead for a scheduled meeting from a list of leads.
 * Uses strict ID matching first. Only if the meeting has no ID does it match by exact clientName.
 */
export const findLeadForMeeting = (m: ScheduledMeeting, leads: Lead[]): Lead | undefined => {
  if (!m || !leads || leads.length === 0) return undefined;

  // 1. Strict ID matching first
  const matchedById = leads.find((lead) => {
    if (m.leadId && String(m.leadId) === String(lead.id)) return true;
    if (m.leadDbId && String(m.leadDbId) === String(lead.id)) return true;
    if (m.contactId && String(m.contactId) === String(lead.id)) return true;
    if (m.leadCode && lead.leadId && String(m.leadCode) === String(lead.leadId)) return true;
    return false;
  });
  if (matchedById) return matchedById;

  // If the meeting already has an ID assigned that didn't match any lead in list,
  // never fall back to substring/name guessing!
  if (m.leadId || m.leadDbId || m.contactId || m.leadCode) {
    return undefined;
  }

  // 2. Name matching fallback ONLY if no ID is present
  const rawClientName = (m.clientName || m.leadName || '').trim().toLowerCase();
  if (!rawClientName) return undefined;

  const clientNameWithoutCompany = rawClientName.split('(')[0].trim();

  return leads.find((lead) => {
    const rawLeadName = (lead.name || '').trim().toLowerCase();
    if (!rawLeadName) return false;
    return rawLeadName === rawClientName || rawLeadName === clientNameWithoutCompany;
  });
};
