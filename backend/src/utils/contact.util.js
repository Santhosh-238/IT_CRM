/**
 * Contact Domain Utility Functions
 */

/**
 * Generate standardized Contact ID (e.g. CNT-1001)
 */
export function generateContactId(totalCount = 0) {
  return `CNT-${1000 + totalCount + 1}`;
}

/**
 * Build Prisma WHERE query for Contact search & filtering
 */
export function buildContactFilterQuery(queryParams = {}) {
  const {
    search = '',
    companyName,
    contactType,
    category,
    source,
    status,
    stage,
    qualificationStatus,
    priority,
    assignedTo,
    assignmentStatus,
  } = queryParams;

  const andConditions = [];

  if (companyName && companyName !== 'All' && companyName.trim() !== '') {
    andConditions.push({ companyName: { equals: companyName.trim(), mode: 'insensitive' } });
  }
  if (contactType && contactType !== 'All' && contactType.trim() !== '') {
    andConditions.push({ contactType: { equals: contactType.trim(), mode: 'insensitive' } });
  }
  if (category && category !== 'All' && category.trim() !== '') {
    andConditions.push({ category: { equals: category.trim(), mode: 'insensitive' } });
  }
  if (source && source !== 'All' && source.trim() !== '') {
    andConditions.push({ source: { equals: source.trim(), mode: 'insensitive' } });
  }
  if (status && status !== 'All' && status.trim() !== '') {
    andConditions.push({ status: { equals: status.trim(), mode: 'insensitive' } });
  }
  if (stage && stage !== 'All' && stage.trim() !== '') {
    andConditions.push({ stage: { equals: stage.trim(), mode: 'insensitive' } });
  }
  if (qualificationStatus && qualificationStatus !== 'All' && qualificationStatus.trim() !== '') {
    andConditions.push({ qualificationStatus: { equals: qualificationStatus.trim(), mode: 'insensitive' } });
  }
  if (priority && priority !== 'All' && priority.trim() !== '') {
    andConditions.push({ priority: { equals: priority.trim(), mode: 'insensitive' } });
  }
  if (assignedTo && assignedTo !== 'All') {
    andConditions.push({ assignedTo });
  }
  if (assignmentStatus && assignmentStatus !== 'All') {
    if (assignmentStatus === 'Unassigned') {
      andConditions.push({
        OR: [
          { assignmentStatus: 'Unassigned' },
          { assignmentStatus: null },
          { assignedTo: null },
          { assignedTo: '' },
          { assignedTo: 'none' },
        ],
      });
    } else if (assignmentStatus === 'Assigned') {
      andConditions.push({
        AND: [
          { assignmentStatus: 'Assigned' },
          { assignedTo: { not: null } },
          { assignedTo: { not: '' } },
          { assignedTo: { not: 'none' } },
        ],
      });
    }
  }

  if (search && search.trim() !== '') {
    const q = search.trim();
    andConditions.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { contactId: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
}

/**
 * Format single contact object for API response
 */
export function formatContactResponse(contact) {
  if (!contact) return null;
  return {
    ...contact,
    displayCompany: contact.companyName || contact.profession || 'Individual',
    isAssigned: Boolean(contact.assignedTo && contact.assignedTo !== 'none'),
  };
}

export default {
  generateContactId,
  buildContactFilterQuery,
  formatContactResponse,
};
