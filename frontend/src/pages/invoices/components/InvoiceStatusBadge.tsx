import React from 'react';
import { Badge, Box } from '@mantine/core';
import { InvoiceStatus, PaymentStatus } from '../../../types/billing';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const s = (status || 'Draft').toLowerCase();

  switch (s) {
    case 'paid':
      return (
        <Badge
          size={size}
          variant="light"
          color="teal"
          radius="sm"
          styles={{
            root: {
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            },
          }}
        >
          Paid
        </Badge>
      );
    case 'partially paid':
      return (
        <Badge
          size={size}
          variant="light"
          color="yellow"
          radius="sm"
          styles={{
            root: {
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#D97706',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            },
          }}
        >
          Partially Paid
        </Badge>
      );
    case 'sent':
    case 'issued':
      return (
        <Badge
          size={size}
          variant="light"
          color="blue"
          radius="sm"
          styles={{
            root: {
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#2563EB',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            },
          }}
        >
          Sent
        </Badge>
      );
    case 'overdue':
      return (
        <Badge
          size={size}
          variant="light"
          color="red"
          radius="sm"
          styles={{
            root: {
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#DC2626',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            },
          }}
        >
          Overdue
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge
          size={size}
          variant="light"
          color="gray"
          radius="sm"
          styles={{
            root: {
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(100, 116, 139, 0.12)',
              color: '#64748B',
              border: '1px solid rgba(100, 116, 139, 0.25)',
            },
          }}
        >
          Cancelled
        </Badge>
      );
    case 'draft':
    default:
      return (
        <Badge
          size={size}
          variant="light"
          color="gray"
          radius="sm"
          styles={{
            root: {
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(148, 163, 184, 0.14)',
              color: '#475569',
              border: '1px solid rgba(148, 163, 184, 0.3)',
            },
          }}
        >
          Draft
        </Badge>
      );
  }
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const s = (status || 'Unpaid').toLowerCase();

  switch (s) {
    case 'paid':
      return (
        <Badge
          size={size}
          variant="filled"
          color="teal"
          radius="xl"
          styles={{
            root: {
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'capitalize',
            },
          }}
        >
          Paid
        </Badge>
      );
    case 'partially paid':
      return (
        <Badge
          size={size}
          variant="filled"
          color="orange"
          radius="xl"
          styles={{
            root: {
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'capitalize',
            },
          }}
        >
          Partially Paid
        </Badge>
      );
    case 'overdue':
      return (
        <Badge
          size={size}
          variant="filled"
          color="red"
          radius="xl"
          styles={{
            root: {
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'capitalize',
            },
          }}
        >
          Overdue
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge
          size={size}
          variant="outline"
          color="gray"
          radius="xl"
          styles={{
            root: {
              fontWeight: 600,
              letterSpacing: '0.02em',
              textTransform: 'capitalize',
            },
          }}
        >
          Cancelled
        </Badge>
      );
    case 'unpaid':
    default:
      return (
        <Badge
          size={size}
          variant="light"
          color="red"
          radius="xl"
          styles={{
            root: {
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'capitalize',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: '#EF4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            },
          }}
        >
          Unpaid
        </Badge>
      );
  }
};
