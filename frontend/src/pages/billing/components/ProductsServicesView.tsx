import React, { useState } from 'react';
import {
  Paper,
  Group,
  TextInput,
  Select,
  Button,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  Text,
  Box,
  useComputedColorScheme,
  Center,
  Loader,
  Menu,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconPackage,
  IconTools,
  IconRefresh,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { BillingProduct } from '../../../types/billing';
import { billingService } from '../../../services/billingService';
import { ProductModal } from './ProductModal';
import { ProductDetailsDrawer } from './ProductDetailsDrawer';

interface ProductsServicesViewProps {
  products?: BillingProduct[];
  loading?: boolean;
  onRefresh?: () => void;
  onSaveProduct?: (data: Partial<BillingProduct>) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onAddNew?: () => void;
}

export const ProductsServicesView: React.FC<ProductsServicesViewProps> = ({
  products: externalProducts,
  loading: externalLoading,
  onRefresh: externalOnRefresh,
  onSaveProduct: externalOnSaveProduct,
  onDeleteProduct: externalOnDeleteProduct,
  onAddNew,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [internalProducts, setInternalProducts] = useState<BillingProduct[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  const fetchInternalProducts = async () => {
    try {
      setInternalLoading(true);
      const data = await billingService.getProductsServices();
      setInternalProducts(data || []);
    } catch (err: any) {
      notifications.show({ color: 'red', message: err.message || 'Failed to load products/services' });
    } finally {
      setInternalLoading(false);
    }
  };

  React.useEffect(() => {
    if (!externalProducts) {
      fetchInternalProducts();
    }
  }, [externalProducts]);

  const products = externalProducts || internalProducts;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  const handleRefresh = externalOnRefresh || fetchInternalProducts;

  const handleSaveProduct = async (data: Partial<BillingProduct>) => {
    if (externalOnSaveProduct) {
      await externalOnSaveProduct(data);
    } else {
      try {
        if (data.id) {
          await billingService.updateProduct(data.id, data);
          notifications.show({ color: 'green', message: 'Item updated successfully' });
        } else {
          await billingService.createProduct(data);
          notifications.show({ color: 'green', message: 'Item added successfully' });
        }
        fetchInternalProducts();
      } catch (err: any) {
        notifications.show({ color: 'red', message: err.message || 'Failed to save item' });
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (externalOnDeleteProduct) {
      await externalOnDeleteProduct(id);
    } else {
      try {
        await billingService.deleteProduct(id);
        notifications.show({ color: 'green', message: 'Item deactivated successfully' });
        fetchInternalProducts();
      } catch (err: any) {
        notifications.show({ color: 'red', message: err.message || 'Failed to deactivate item' });
      }
    }
  };

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpened, setModalOpened] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BillingProduct | null>(null);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<BillingProduct | null>(null);

  const filteredProducts = products.filter((item) => {
    if (typeFilter !== 'All' && item.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (statusFilter !== 'All' && item.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = item.itemCode.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesc) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    if (onAddNew) {
      onAddNew();
    } else {
      setEditingProduct(null);
      setModalOpened(true);
    }
  };

  const handleOpenEdit = (item: BillingProduct) => {
    setEditingProduct(item);
    setModalOpened(true);
  };

  const handleOpenDetails = (item: BillingProduct) => {
    setDetailsProduct(item);
    setDrawerOpened(true);
  };

  return (
    <Box>
      {/* Top Filter and Actions Bar */}
      <Paper
        p="sm"
        radius="lg"
        mb="md"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="sm" wrap="wrap">
            <TextInput
              placeholder="Search products & services..."
              leftSection={<IconSearch size={15} color={isDark ? '#94A3B8' : '#64748B'} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="sm"
              radius="md"
              style={{ width: 260 }}
            />

            <Select
              data={[
                { value: 'All', label: 'All Types' },
                { value: 'Product', label: 'Products' },
                { value: 'Service', label: 'Services' },
              ]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val || 'All')}
              size="sm"
              radius="md"
              style={{ width: 140 }}
              allowDeselect={false}
            />

            <Select
              data={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || 'All')}
              size="sm"
              radius="md"
              style={{ width: 140 }}
              allowDeselect={false}
            />

            <ActionIcon
              variant="default"
              size={36}
              radius="md"
              onClick={handleRefresh}
              loading={loading}
              title="Refresh Items"
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Group>

          <Button
            leftSection={<IconPlus size={16} stroke={2.5} />}
            radius="md"
            size="sm"
            onClick={handleOpenAdd}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 13,
              height: 36,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Add Product / Service
          </Button>
        </Group>
      </Paper>

      {/* Table Section */}
      <Paper
        radius="lg"
        style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {loading ? (
          <Center p="xl" style={{ minHeight: 250 }}>
            <Loader size="md" color="indigo" />
          </Center>
        ) : filteredProducts.length === 0 ? (
          <Center p="xl" style={{ minHeight: 280, flexDirection: 'column' }}>
            <Box
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: isDark ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#818CF8' : '#4F46E5',
                marginBottom: 16,
              }}
            >
              <IconPackage size={32} stroke={1.6} />
            </Box>
            <Text fw={700} size="md" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              No products or services found
            </Text>
            <Text size="xs" c="dimmed" mt={4} mb="md">
              Get started by adding items to your product catalogue.
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              size="sm"
              radius="md"
              onClick={handleOpenAdd}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              Add Product / Service
            </Button>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={750}>
            <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
              <Table.Thead
                style={{
                  backgroundColor: isDark ? '#0F172A' : '#FBFBFC',
                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                }}
              >
                <Table.Tr>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#94A3B8' : '#64748B' }}>
                    Item Name
                  </Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#94A3B8' : '#64748B' }}>
                    Type
                  </Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#94A3B8' : '#64748B' }}>
                    Included Modules
                  </Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#94A3B8' : '#64748B' }}>
                    Status
                  </Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#94A3B8' : '#64748B', textAlign: 'right' }}>
                    Actions
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredProducts.map((item) => (
                  <Table.Tr
                    key={item.id}
                    onClick={() => handleOpenDetails(item)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Box
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: item.type === 'Product'
                              ? (isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF')
                              : (isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF'),
                            color: item.type === 'Product' ? '#3B82F6' : '#8B5CF6',
                            flexShrink: 0,
                          }}
                        >
                          {item.type === 'Product' ? <IconPackage size={17} /> : <IconTools size={17} />}
                        </Box>
                        <Text fw={600} size="sm" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
                          {item.name}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={item.type === 'Product' ? 'blue' : 'violet'}
                        size="sm"
                        style={{
                          borderRadius: 100,
                          fontWeight: 600,
                          fontSize: 11,
                          padding: '4px 10px',
                        }}
                      >
                        {item.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ maxWidth: 380 }}>
                      <Group gap={4} wrap="wrap">
                        {item.modules && item.modules.length > 0 ? (
                          <>
                            {item.modules.slice(0, 3).map((mod: any, mIdx: number) => {
                              const mName = typeof mod === 'string' ? mod : mod.name;
                              return (
                                <Badge
                                  key={mIdx}
                                  variant="light"
                                  color="indigo"
                                  radius="sm"
                                  size="xs"
                                  style={{ fontWeight: 600, textTransform: 'none' }}
                                >
                                  {mName}
                                </Badge>
                              );
                            })}
                            {item.modules.length > 3 && (
                              <Tooltip
                                label={item.modules
                                  .slice(3)
                                  .map((m: any) => (typeof m === 'string' ? m : m.name))
                                  .join(', ')}
                                withArrow
                                position="top"
                              >
                                <Badge variant="outline" color="gray" radius="sm" size="xs" style={{ cursor: 'pointer' }}>
                                  +{item.modules.length - 3} more
                                </Badge>
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <Text size="xs" c="dimmed">
                            No modules configured
                          </Text>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={item.status === 'Active' ? 'teal' : 'gray'}
                        size="sm"
                        style={{
                          borderRadius: 100,
                          fontWeight: 600,
                          fontSize: 11,
                          padding: '4px 10px',
                        }}
                      >
                        {item.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Group gap={6} justify="flex-end">
                        <Tooltip label="Edit Item">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(item);
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete Item">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete ${item.name} from catalogue?`)) {
                                handleDeleteProduct(item.id);
                              }
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Product Details Drawer on Row Click */}
      <ProductDetailsDrawer
        opened={drawerOpened}
        onClose={() => {
          setDrawerOpened(false);
          setDetailsProduct(null);
        }}
        product={detailsProduct}
        onEdit={(prod) => {
          setDrawerOpened(false);
          handleOpenEdit(prod);
        }}
      />

      {/* Modal */}
      <ProductModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSave={async (data) => {
          if (editingProduct) {
            await handleSaveProduct({ ...data, id: editingProduct.id });
          } else {
            await handleSaveProduct(data);
          }
          handleRefresh();
        }}
        editingProduct={editingProduct}
      />
    </Box>
  );
};
