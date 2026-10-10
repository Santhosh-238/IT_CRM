/**
 * Lead Module Definition & Schema
 */
export const LEAD_MODULE = {
  id: 'leads',
  name: 'Leads',
  category: 'Sales & CRM',
  description: 'Inbound sales opportunities, prospective customer conversion, and pipeline management.',
  actions: ['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport', 'canApprove'],
  defaultPermissions: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canApprove: false,
  },
  statuses: [
    'New',
    'Contacted',
    'Qualified',
    'Proposal Sent',
    'Converted',
    'Disqualified',
  ],
  schema: {
    fields: ['id', 'leadId', 'title', 'companyName', 'contactName', 'status', 'createdAt', 'updatedAt'],
  },
};

export default LEAD_MODULE;
