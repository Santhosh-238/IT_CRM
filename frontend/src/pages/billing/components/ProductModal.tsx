import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Textarea,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Text,
  ActionIcon,
  Box,
  Badge,
  Paper,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconPackage,
  IconX,
  IconPlus,
  IconTrash,
  IconLayersLinked,
  IconSparkles,
  IconCheck,
} from '@tabler/icons-react';
import { BillingProduct, ProductType } from '../../../types/billing';

interface ProductModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (data: Partial<BillingProduct>) => Promise<void>;
  editingProduct?: BillingProduct | null;
}

interface ProductModuleItem {
  id: string;
  name: string;
  description?: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  opened,
  onClose,
  onSave,
  editingProduct,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [name, setName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [type, setType] = useState<ProductType>('Product');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modules State
  const [modules, setModules] = useState<ProductModuleItem[]>([]);
  const [moduleNameInput, setModuleNameInput] = useState('');
  const [moduleDescInput, setModuleDescInput] = useState('');

  // Preset module suggestions
  const productPresets = [
    'User Authentication & Roles',
    'Executive Dashboard',
    'Employee Management',
    'Payroll Engine & Compliance',
    'Attendance & Biometrics',
    'Leave Management',
    'Role & Access Permissions',
    'Reports & Analytics',
  ];

  const servicePresets = [
    'UI/UX Design & Prototyping',
    'Frontend Web Application',
    'Backend Architecture & REST APIs',
    'Database Schema & Migrations',
    'Payment Gateway Integration',
    'Third-Party API Integrations',
    'QA & Functional Testing',
    'DevOps & Cloud Deployment',
  ];

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setItemCode(editingProduct.itemCode || '');
      setType(editingProduct.type || 'Product');
      setDescription(editingProduct.description || '');
      setStatus(editingProduct.status || 'Active');

      // Populate modules
      if (editingProduct.modules && Array.isArray(editingProduct.modules)) {
        const parsed: ProductModuleItem[] = editingProduct.modules.map((m: any, idx: number) => {
          if (typeof m === 'string') {
            return { id: `mod-${idx}-${Date.now()}`, name: m, description: '' };
          }
          return {
            id: m.id || `mod-${idx}-${Date.now()}`,
            name: m.name || '',
            description: m.description || '',
          };
        });
        setModules(parsed);
      } else {
        setModules([]);
      }
    } else {
      setName('');
      setItemCode('');
      setType('Product');
      setDescription('');
      setStatus('Active');
      setModules([]);
    }
    setModuleNameInput('');
    setModuleDescInput('');
    setErrors({});
  }, [editingProduct, opened]);

  // Add a module to the list
  const handleAddModule = () => {
    if (!moduleNameInput.trim()) return;
    const newMod: ProductModuleItem = {
      id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: moduleNameInput.trim(),
      description: moduleDescInput.trim() || undefined,
    };
    setModules((prev) => [...prev, newMod]);
    setModuleNameInput('');
    setModuleDescInput('');
  };

  // Add preset suggestion
  const handleAddPreset = (presetName: string) => {
    if (modules.some((m) => m.name.toLowerCase() === presetName.toLowerCase())) return;
    setModules((prev) => [
      ...prev,
      {
        id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: presetName,
      },
    ]);
  };

  // Remove a module
  const handleRemoveModule = (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddModule();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Item name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        itemCode: itemCode.trim() || undefined,
        type,
        description: description.trim() || null,
        unitPrice: 0,
        taxRate: 18,
        unit: 'Unit',
        status,
        modules: modules.map((m) => ({
          name: m.name.trim(),
          description: m.description ? m.description.trim() : '',
        })),
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save product/service.' });
    } finally {
      setLoading(false);
    }
  };

  const currentPresets = type === 'Product' ? productPresets : servicePresets;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="780px"
      centered
      yOffset="4vh"
      withCloseButton={false}
      radius="lg"
      styles={{
        content: {
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.22)',
          maxHeight: '94vh',
          maxWidth: '95vw',
        },
        body: {
          padding: '24px 28px',
          maxHeight: 'calc(94vh - 20px)',
          overflowY: 'auto',
        },
      }}
      closeOnClickOutside={!loading}
    >
      {/* Header matching existing CRM modal design */}
      <Group justify="space-between" align="flex-start" mb="lg">
        <Group gap="md">
          <Box
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#818CF8' : '#4F46E5',
            }}
          >
            <IconPackage size={22} stroke={1.8} />
          </Box>
          <div>
            <Text fw={800} size="19px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
              {editingProduct ? 'Edit Product / Service' : 'Add Billable Item'}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Configure item catalog details, modular breakdown, and deliverables
            </Text>
          </div>
        </Group>

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

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Item Type & SKU */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
              label="Item Type"
              data={[
                { value: 'Product', label: 'Product (e.g. HRMS, CRM, ERP, Custom App)' },
                { value: 'Service', label: 'Service (e.g. Web Dev, Support, Maintenance)' },
              ]}
              value={type}
              onChange={(val) => setType((val as ProductType) || 'Product')}
              required
              radius="md"
            />

            <TextInput
              label="Item Code (SKU)"
              placeholder="e.g. PRD-HRMS, SRV-WEBDEV"
              value={itemCode}
              onChange={(e) => setItemCode(e.currentTarget.value)}
              radius="md"
            />
          </SimpleGrid>

          {/* Item Name */}
          <TextInput
            label="Item Name"
            placeholder="e.g. Enterprise HRMS Suite, LedgerOne Accounting, IT CRM"
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={errors.name}
            required
            radius="md"
          />

          {/* ========================================================================= */}
          {/* MODULES & FEATURE BREAKDOWN SECTION (Replaces Unit Price, GST, Unit)      */}
          {/* ========================================================================= */}
          <Paper
            p="md"
            radius="md"
            style={{
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            }}
          >
            <Group justify="space-between" align="center" mb="xs">
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
                  Modules & Scope Breakdown
                </Text>
              </Group>

              <Badge
                size="sm"
                variant="light"
                color={modules.length > 0 ? 'blue' : 'gray'}
                radius="sm"
                style={{ fontWeight: 700 }}
              >
                {modules.length} {modules.length === 1 ? 'Module' : 'Modules'} Added
              </Badge>
            </Group>

            {/* Input Row to Add a Module */}
            <Stack gap="xs" mt="xs">
              <Group align="flex-end" gap="xs">
                <TextInput
                  label="Module / Feature Name"
                  placeholder="e.g. Employee Database, Payroll Engine, Attendance, Reports..."
                  value={moduleNameInput}
                  onChange={(e) => setModuleNameInput(e.currentTarget.value)}
                  onKeyDown={handleKeyDown}
                  radius="md"
                  size="sm"
                  style={{ flex: 1.2, minWidth: 200 }}
                />

                <TextInput
                  label="Scope / Key Deliverables (Optional)"
                  placeholder="e.g. Biometric sync, payslip PDF generation..."
                  value={moduleDescInput}
                  onChange={(e) => setModuleDescInput(e.currentTarget.value)}
                  onKeyDown={handleKeyDown}
                  radius="md"
                  size="sm"
                  style={{ flex: 1.5, minWidth: 200 }}
                />

                <Button
                  onClick={handleAddModule}
                  disabled={!moduleNameInput.trim()}
                  size="sm"
                  radius="md"
                  leftSection={<IconPlus size={15} stroke={2.5} />}
                  style={{
                    background: moduleNameInput.trim()
                      ? 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)'
                      : undefined,
                    fontWeight: 600,
                    height: 36,
                  }}
                >
                  Add Module
                </Button>
              </Group>

              {/* Quick Preset Suggestion Chips */}
              <Box mt={4}>
                <Group gap={6} align="center" wrap="wrap">
                  <Text size="11px" fw={600} c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconSparkles size={12} color="#F59E0B" /> Quick suggestions:
                  </Text>
                  {currentPresets.map((preset) => {
                    const isAdded = modules.some((m) => m.name.toLowerCase() === preset.toLowerCase());
                    return (
                      <Badge
                        key={preset}
                        size="sm"
                        variant={isAdded ? 'filled' : 'outline'}
                        color={isAdded ? 'teal' : 'gray'}
                        style={{
                          cursor: isAdded ? 'default' : 'pointer',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: 11,
                          opacity: isAdded ? 0.7 : 1,
                        }}
                        onClick={() => !isAdded && handleAddPreset(preset)}
                      >
                        {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                      </Badge>
                    );
                  })}
                </Group>
              </Box>

              {/* Added Modules List */}
              <Box mt="xs">
                {modules.length === 0 ? (
                  <Paper
                    p="sm"
                    radius="md"
                    style={{
                      border: '1px dashed',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                      backgroundColor: 'transparent',
                      textAlign: 'center',
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      No modules added yet. Type a module name above and click <b>Add Module</b> or click any quick suggestion chip.
                    </Text>
                  </Paper>
                ) : (
                  <Stack gap={6}>
                    {modules.map((m, index) => (
                      <Paper
                        key={m.id}
                        p="xs"
                        radius="md"
                        style={{
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                          <Box
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF',
                              color: isDark ? '#818CF8' : '#4F46E5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600} size="sm" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
                              {m.name}
                            </Text>
                            {m.description && (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {m.description}
                              </Text>
                            )}
                          </Box>
                        </Group>

                        <Tooltip label="Remove module" withArrow position="top">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => handleRemoveModule(m.id)}
                          >
                            <IconTrash size={15} />
                          </ActionIcon>
                        </Tooltip>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Paper>

          {/* Overall Description & Deliverables */}
          <Textarea
            label="Product / Service Overview"
            placeholder="Provide a general summary or specifications of this product or service..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            rows={3}
            radius="md"
          />

          {/* Catalogue Status */}
          <Select
            label="Catalogue Status"
            data={[
              { value: 'Active', label: 'Active (Available for Quotations & Invoices)' },
              { value: 'Inactive', label: 'Inactive (Hidden)' },
            ]}
            value={status}
            onChange={(val) => setStatus((val as 'Active' | 'Inactive') || 'Active')}
            radius="md"
          />

          {errors.form && (
            <Text c="red" size="xs" fw={500}>
              {errors.form}
            </Text>
          )}

          {/* Form Action Buttons */}
          <Group justify="flex-end" gap="sm" mt="md">
            <Button
              variant="default"
              radius="md"
              onClick={onClose}
              disabled={loading}
              style={{ fontWeight: 600, minWidth: 90 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              radius="md"
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                minWidth: 140,
                border: 'none',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              {editingProduct ? 'Save Changes' : 'Add to Catalogue'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
