/**
 * Lead Domain Utility Functions
 */

/**
 * Generate standardized Lead ID (e.g. LED-1001)
 */
export function generateLeadId(totalCount = 0) {
  return `LED-${1000 + totalCount + 1}`;
}

/**
 * Build Prisma WHERE query for Lead search & filtering
 */
export function buildLeadFilterQuery(queryParams = {}) {
  const {
    search = '',
    companyName,
    contactType,
    category,
    source,
    status,
    stage,
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
    const s = status.trim();
    if (s.toLowerCase() === 'in progress' || s.toLowerCase() === 'in_progress') {
      andConditions.push({
        status: { in: ['In Progress', 'Contacted', 'Qualified'] },
      });
    } else if (
      s.toLowerCase() === 'completed' ||
      s.toLowerCase() === 'complete' ||
      s.toLowerCase() === 'won'
    ) {
      andConditions.push({
        status: { in: ['Completed', 'Complete', 'Won', 'Closed Won'] },
      });
    } else {
      andConditions.push({ status: { equals: s, mode: 'insensitive' } });
    }
  }
  if (stage && stage !== 'All' && stage.trim() !== '') {
    andConditions.push({ stage: { equals: stage.trim(), mode: 'insensitive' } });
  }

  if (search && search.trim() !== '') {
    const q = search.trim();
    andConditions.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { leadId: { contains: q, mode: 'insensitive' } },
        { profession: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
}

/**
 * Format single lead object for API response
 */
export function formatLeadResponse(lead) {
  if (!lead) return null;
  return {
    ...lead,
    displayCompany: lead.companyName || lead.profession || 'Individual',
  };
}
