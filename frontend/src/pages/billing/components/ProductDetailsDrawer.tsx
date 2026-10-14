import React from 'react';
import {
  Drawer,
  Box,
  Group,
  Stack,
  Text,
  Badge,
  Paper,
  Button,
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconPackage,
  IconTools,
  IconEdit,
  IconX,
  IconLayersLinked,
  IconInfoCircle,
  IconCalendar,
  IconCheck,
} from '@tabler/icons-react';
import { BillingProduct } from '../../../types/billing';

interface ProductDetailsDrawerProps {
  opened: boolean;
  onClose: () => void;
  product: BillingProduct | null;
  onEdit?: (product: BillingProduct) => void;
}

export const ProductDetailsDrawer: React.FC<ProductDetailsDrawerProps> = ({
  opened,
  onClose,
  product,
  onEdit,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  if (!product) return null;

  const isProduct = product.type === 'Product';

  // Normalize modules list (strings or objects)
  const modulesList = Array.isArray(product.modules)
    ? product.modules.map((m: any, idx: number) => {
        if (typeof m === 'string') {
          return { id: `mod-${idx}`, name: m, description: '' };
        }
        return {
          id: m.id || `mod-${idx}`,
          name: m.name || '',
          description: m.description || '',
        };
      })
    : [];

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="560px"
      withCloseButton={false}
      styles={{
        header: {
          display: 'none',
        },
        body: {
          background: isDark ? '#0B0F19' : '#F8FAFC',
          padding: 0,
          height: '100%',
        },
      }}
    >
      <Stack gap={0} style={{ height: '100%' }}>
        {/* Top Sticky Header */}
        <Box
          p="md"
          style={{
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: isProduct
                    ? isDark
                      ? 'rgba(59, 130, 246, 0.2)'
                      : '#EFF6FF'
                    : isDark
                    ? 'rgba(139, 92, 246, 0.2)'
                    : '#F5F3FF',
                  color: isProduct ? '#3B82F6' : '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isProduct ? <IconPackage size={18} stroke={1.8} /> : <IconTools size={18} stroke={1.8} />}
              </Box>
              <div>
                <Text fw={700} size="sm" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
                  {isProduct ? 'Product Specification' : 'Service Specification'}
                </Text>
                <Text size="11px" c="dimmed">
                  Catalogue item details & modular deliverables
                </Text>
              </div>
            </Group>

            <Group gap="xs">
              {onEdit && (
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  radius="md"
                  leftSection={<IconEdit size={14} />}
                  onClick={() => {
                    onClose();
                    onEdit(product);
                  }}
                >
                  Edit Item
                </Button>
              )}

              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                radius="100px"
                onClick={onClose}
              >
                <IconX size={18} />
              </ActionIcon>
            </Group>
          </Group>
        </Box>

        {/* Scrollable Body Content */}
        <Box p="md" style={{ flex: 1, overflowY: 'auto' }}>
          <Stack gap="md">
            {/* Primary Hero Card */}
            <Paper
              p="lg"
              radius="lg"
              style={{
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
              }}
            >
              <Group gap="md" align="flex-start">
                <Box
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: isProduct
                      ? isDark
                        ? 'rgba(59, 130, 246, 0.2)'
                        : '#EFF6FF'
                      : isDark
                      ? 'rgba(139, 92, 246, 0.2)'
                      : '#F5F3FF',
                    color: isProduct ? '#3B82F6' : '#8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isProduct ? <IconPackage size={28} stroke={1.8} /> : <IconTools size={28} stroke={1.8} />}
                </Box>

                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" mb={4} wrap="wrap">
                    <Badge variant="filled" color={isProduct ? 'blue' : 'violet'} radius="sm" size="sm">
                      {product.type}
                    </Badge>
                    <Badge variant="light" color="indigo" radius="sm" size="sm" style={{ fontWeight: 700 }}>
                      {product.itemCode}
                    </Badge>
                    <Badge
                      variant="light"
                      color={product.status === 'Active' ? 'teal' : 'gray'}
                      radius="100px"
                      size="sm"
                      style={{ fontWeight: 600 }}
                    >
                      {product.status}
                    </Badge>
                  </Group>

                  <Text
                    fw={800}
                    size="xl"
                    style={{
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {product.name}
                  </Text>
                </Box>
              </Group>
            </Paper>

            {/* Included Modules Section */}
            <Paper
              p="md"
              radius="lg"
              style={{
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
              }}
            >
              <Group justify="space-between" align="center" mb="sm">
                <Group gap="xs">
                  <Box
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: isDark ? 'rgba(79, 70, 229, 0.25)' : '#EEF2FF',
                      color: isDark ? '#818CF8' : '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconLayersLinked size={16} stroke={2} />
                  </Box>
                  <Text fw={700} size="sm" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
                    Included Modules ({modulesList.length})
                  </Text>
                </Group>

                <Badge size="xs" variant="light" color="indigo">
                  Modular Scope
                </Badge>
              </Group>

              {modulesList.length === 0 ? (
                <Paper
                  p="md"
                  radius="md"
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    border: '1px dashed',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                    textAlign: 'center',
                  }}
                >
                  <Text size="xs" c="dimmed">
                    No individual modules have been configured for this item.
                  </Text>
                </Paper>
              ) : (
                <Stack gap="xs">
                  {modulesList.map((mod, idx) => (
                    <Paper
                      key={mod.id}
                      p="xs"
                      radius="md"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <Box
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          backgroundColor: isDark ? 'rgba(79, 70, 229, 0.3)' : '#EEF2FF',
                          color: isDark ? '#818CF8' : '#4F46E5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {idx + 1}
                      </Box>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={700} size="sm" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
                          {mod.name}
                        </Text>
                        {mod.description ? (
                          <Text size="xs" c="dimmed" mt={2} style={{ lineHeight: 1.4 }}>
                            {mod.description}
                          </Text>
                        ) : (
                          <Text size="xs" c="dimmed" mt={2} style={{ fontStyle: 'italic' }}>
                            Standard feature scope
                          </Text>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>

            {/* Overview & Scope Card */}
            {product.description && (
              <Paper
                p="md"
                radius="lg"
                style={{
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                  boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                }}
              >
                <Group gap="xs" mb="xs">
                  <Box
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
                      color: isDark ? '#93C5FD' : '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconInfoCircle size={16} stroke={2} />
                  </Box>
                  <Text fw={700} size="sm" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
                    Overview & Description
                  </Text>
                </Group>
                <Text size="sm" style={{ color: isDark ? '#CBD5E1' : '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {product.description}
                </Text>
              </Paper>
            )}

            {/* Timestamps & Audit Metadata Card */}
            <Paper
              p="sm"
              radius="lg"
              style={{
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              }}
            >
              <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                <Group gap={6} align="center">
                  <IconCalendar size={14} color="#94A3B8" />
                  <Text size="12px" c="dimmed">
                    Created:{' '}
                    <Text span fw={600} style={{ color: isDark ? '#E2E8F0' : '#475569' }}>
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'}
                    </Text>
                  </Text>
                </Group>

                {product.updatedAt && (
                  <Text size="12px" c="dimmed">
                    Updated:{' '}
                    <Text span fw={600} style={{ color: isDark ? '#E2E8F0' : '#475569' }}>
                      {new Date(product.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  </Text>
                )}
              </Group>
            </Paper>
          </Stack>
        </Box>
      </Stack>
    </Drawer>
  );
};
