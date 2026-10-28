import React from 'react';
import {
  Box,
  Group,
  Text,
  Badge,
  SimpleGrid,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBuilding,
  IconArrowDown,
  IconArrowUp,
} from '@tabler/icons-react';
import { Contact } from '../../../types/contact';

interface ContactQualificationCardProps {
  contact: Contact;
  onToggleExpand?: () => void;
  expanded?: boolean;
}

export const ContactQualificationCard: React.FC<ContactQualificationCardProps> = ({
  contact,
  onToggleExpand,
  expanded = false,
}) => {
  const isQualified =
    contact.qualificationStatus === 'Qualified' || contact.status === 'Qualified';
  const isUnqualified =
    contact.qualificationStatus === 'Unqualified' ||
    contact.qualificationStatus === 'Disqualified' ||
    contact.status === 'Disqualified';

  const statusLabel = isQualified
    ? 'Qualified'
    : isUnqualified
    ? 'Unqualified'
    : 'Pending';

  const badgeBg = isQualified
    ? 'rgba(22, 101, 52, 0.45)'
    : isUnqualified
    ? 'rgba(153, 27, 27, 0.45)'
    : 'rgba(180, 83, 9, 0.35)';

  const badgeColor = isQualified
    ? '#4ADE80'
    : isUnqualified
    ? '#F87171'
    : '#FBBF24';

  const badgeBorder = isQualified
    ? '1px solid rgba(34, 197, 94, 0.35)'
    : isUnqualified
    ? '1px solid rgba(239, 68, 68, 0.35)'
    : '1px solid rgba(245, 158, 11, 0.35)';

  const resultColor = isQualified
    ? '#22C55E'
    : isUnqualified
    ? '#EF4444'
    : '#F59E0B';

  const resultText = isQualified
    ? 'Result: Qualified → Create Opportunity → Prepare Proposition/Quotation'
    : isUnqualified
    ? `Result: Unqualified → ${contact.unqualifiedReason || contact.disqualificationReason || 'Budget issue / Not immediate need'}`
    : 'Result: Pending → Needs Assessment / Follow-up Required';

  const companyTitle = contact.companyName || contact.name || '—';
  const serviceVal = contact.interestedService || contact.customProduct || (contact.productList && contact.productList[0]) || (contact.serviceList && contact.serviceList[0]) || '';
  const serviceSubtitle = serviceVal ? `Lead: ${serviceVal}` : 'Lead: General Inquiry';
  const businessNeed = contact.businessNeed || contact.description || contact.notes || '—';
  const budget = contact.budgetRange || (contact.estimatedValue ? `₹ ${contact.estimatedValue}` : '—');
  const decisionMaker = contact.decisionMaker || (contact.contactPerson ? `${contact.contactPerson}` : (contact.name || '—'));
  const timeline = contact.purchaseTimeline || (contact.nextFollowDate ? `Follow-up: ${contact.nextFollowDate}` : '—');

  return (
    <Box
      style={{
        background: '#05070B',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 14,
        padding: '24px 28px 20px 28px',
        color: '#FFFFFF',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65)',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Top Header */}
      <Group align="flex-start" gap="md" mb="lg">
        {/* Building Icon Container */}
        <Box
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <IconBuilding size={24} stroke={1.8} color="#FFFFFF" />
        </Box>

        {/* Company Title, Subtitle & Status Badge */}
        <Box style={{ flex: 1 }}>
          <Text fw={700} size="18px" style={{ color: '#FFFFFF', lineHeight: 1.2 }}>
            {companyTitle}
          </Text>
          <Text size="13.5px" style={{ color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>
            {serviceSubtitle}
          </Text>
          <Box mt={8}>
            <Badge
              radius="xl"
              styles={{
                root: {
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  border: badgeBorder,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'none',
                  padding: '3px 12px',
                  height: 22,
                },
              }}
            >
              {statusLabel}
            </Badge>
          </Box>
        </Box>
      </Group>

      {/* 2x2 Grid for the Qualification Parameters */}
      <SimpleGrid cols={2} spacing="xl" mb="lg">
        {/* Row 1: Business Need */}
        <Box>
          <Text size="12.5px" style={{ color: '#94A3B8', fontWeight: 500, marginBottom: 3 }}>
            Business Need
          </Text>
          <Text size="15px" fw={700} style={{ color: '#FFFFFF', lineHeight: 1.3 }}>
            {businessNeed}
          </Text>
        </Box>

        {/* Row 1: Budget */}
        <Box>
          <Text size="12.5px" style={{ color: '#94A3B8', fontWeight: 500, marginBottom: 3 }}>
            Budget
          </Text>
          <Text size="15px" fw={700} style={{ color: '#FFFFFF', lineHeight: 1.3 }}>
            {budget}
          </Text>
        </Box>

        {/* Row 2: Decision Maker */}
        <Box>
          <Text size="12.5px" style={{ color: '#94A3B8', fontWeight: 500, marginBottom: 3 }}>
            Decision Maker
          </Text>
          <Text size="15px" fw={700} style={{ color: '#FFFFFF', lineHeight: 1.3 }}>
            {decisionMaker}
          </Text>
        </Box>

        {/* Row 2: Timeline */}
        <Box>
          <Text size="12.5px" style={{ color: '#94A3B8', fontWeight: 500, marginBottom: 3 }}>
            Timeline
          </Text>
          <Text size="15px" fw={700} style={{ color: '#FFFFFF', lineHeight: 1.3 }}>
            {timeline}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Result Line */}
      <Box pt="xs" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Text
          size="13.5px"
          fw={600}
          style={{
            color: resultColor,
            letterSpacing: '0.01em',
          }}
        >
          {resultText}
        </Text>
      </Box>

      {/* Optional Down/Up Arrow Toggle Button at Bottom Center */}
      {onToggleExpand && (
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 10,
            marginBottom: -8,
          }}
        >
          <UnstyledButton
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
          >
            {expanded ? <IconArrowUp size={13} stroke={2.5} /> : <IconArrowDown size={13} stroke={2.5} />}
          </UnstyledButton>
        </Box>
      )}
    </Box>
  );
};

export default ContactQualificationCard;
