import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Stack,
  SimpleGrid,
  TextInput,
  Select,
  MultiSelect,
  Textarea,
  Button,
  Group,
  Text,
  ActionIcon,
  Breadcrumbs,
  Anchor,
  useComputedColorScheme,
} from '@mantine/core';`1`
import {
  IconArrowLeft,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import { Contact, ContactFormData } from '../../types/contact';
import { useContact } from '../../context/ContactContext';
import { useCRM } from '../../context/CRMContext';

interface AddContactPageProps {
  onBack?: () => void;
  initialData?: Contact | null;
}

export const AddContactPage: React.FC<AddContactPageProps> = ({ onBack, initialData }) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { setActiveNav } = useCRM();
  const { metadata, createContact, updateContact, loading } = useContact();

  const isEditing = Boolean(initialData);

  const initialFormState: ContactFormData = {
    name: '',
    email: '',
    phone: '',
    contactType: 'Individual',
    profession: '',
    companyName: '',
    designation: '',
    address: '',
    source: 'Website',
    customSource: '',
    category: 'Product',
    productList: [],
    serviceList: [],
    status: 'Active',
    stage: 'New Lead',
    qualificationStatus: 'In Progress',
  };

  const [formData, setFormData] = useState<ContactFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        contactId: initialData.contactId,
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        contactType: initialData.contactType || 'Individual',
        profession: initialData.profession || '',
        companyName: initialData.companyName || '',
        designation: initialData.designation || '',
        address: initialData.address || '',
        source: initialData.source || 'Website',
        customSource: initialData.customSource || '',
        category: initialData.category || 'Product',
        productList: initialData.productList || [],
        serviceList: initialData.serviceList || [],
        status: initialData.status || 'Active',
        stage: initialData.stage || 'New Lead',
        qualificationStatus: initialData.qualificationStatus || 'In Progress',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Contact Name is required (minimum 2 characters)';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile Number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Mobile number must be at least 10 digits';
    }

    if (!formData.contactType) {
      newErrors.contactType = 'Contact Type is required';
    }

    if (formData.contactType === 'Individual' && !formData.profession?.trim()) {
      newErrors.profession = 'Profession / Occupation is required';
    }

    if (formData.contactType === 'Company Representative' && !formData.companyName?.trim()) {
      newErrors.companyName = 'Company Name is required';
    }

    if (formData.source === 'Other' && !formData.customSource?.trim()) {
      newErrors.customSource = 'Please specify custom source';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEditing && initialData?.id) {
      const res = await updateContact(initialData.id, formData);
      if (res.success) {
        if (onBack) onBack();
        else setActiveNav('contacts');
      }
    } else {
      const res = await createContact(formData);
      if (res.success) {
        if (onBack) onBack();
        else setActiveNav('contacts');
      }
    }
  };

  const handleCancel = () => {
    if (onBack) onBack();
    else setActiveNav('contacts');
  };

  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0';
  const headingColor = isDark ? '#F8FAFC' : '#0F172A';

  // Dynamic Options from backend metadata
  const contactTypeOptions = [
    { value: 'Individual', label: 'Individual' },
    { value: 'Company Representative', label: 'Company Representative' },
  ];

  const sourceOptions = metadata?.sources || ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Other'];
  const categoryOptions = [
    { value: 'Product', label: 'Product' },
    { value: 'Service', label: 'Service' },
  ];

  const productOptions = metadata?.productOptions || [
    'HRMS',
    'IT CRM',
    'Fintech CRM',
    'Cloud ERP',
    'Custom Enterprise Software',
    'AI & ML Assistant',
    'Mobile Apps',
  ];

  const serviceOptions = metadata?.serviceOptions || [
    'Cloud Migration & DevOps',
    'Cybersecurity & Compliance',
    'Custom API & Backend Integration',
    'Full-Stack Web Development',
    'Staff Augmentation',
    'UI/UX Design',
  ];

  return (
    <Box p={{ base: 'md', md: 'xl' }} style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Top Breadcrumb Navigation */}
      <Box mb="md">
        <Breadcrumbs separator="→" mb={6}>
          <Anchor size="xs" c="dimmed" onClick={handleCancel} style={{ cursor: 'pointer', fontWeight: 600 }}>
            Contacts
          </Anchor>
          <Text size="xs" fw={700} style={{ color: isDark ? '#60A5FA' : '#15803D' }}>
            {isEditing ? `Edit Contact (${initialData?.contactId})` : 'Add Contact'}
          </Text>
        </Breadcrumbs>
      </Box>

      {/* Main Card Modal-Style Container */}
      <Paper
        p="xl"
        radius="24px"
        style={{
          background: cardBg,
          border: cardBorder,
          boxShadow: isDark ? '0 12px 32px rgba(0, 0, 0, 0.5)' : '0 8px 30px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Header matching the image */}
        <Group justify="space-between" align="flex-start" mb="xl">
          <Group gap="md">
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#34D399' : '#059669',
              }}
            >
              <IconUser size={22} stroke={1.8} />
            </Box>
            <div>
              <Text fw={800} size="20px" style={{ color: headingColor, lineHeight: 1.2 }}>
                {isEditing ? `Edit Contact: ${initialData?.name}` : 'Add Contact'}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                Enter contact details
              </Text>
            </div>
          </Group>

          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            radius="100px"
            onClick={handleCancel}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>

        {/* Form Fields exactly matching the image */}
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {/* Row 1: Name * and Email Address * */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Name"
                placeholder="Enter contact name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                radius="md"
              />

              <TextInput
                label="Email Address"
                placeholder="Enter email address"
                required
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                radius="md"
              />
            </SimpleGrid>

            {/* Row 2: Mobile Number * and Contact Type * */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Mobile Number"
                placeholder="Enter 10-digit mobile number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                radius="md"
              />

              <Select
                label="Contact Type"
                placeholder="Select contact type"
                required
                data={contactTypeOptions}
                value={formData.contactType || 'Individual'}
                onChange={(val) => setFormData({ ...formData, contactType: val || 'Individual' })}
                error={errors.contactType}
                radius="md"
              />
            </SimpleGrid>

            {/* Row 3: Profession / Occupation * and Optional Company Name (when Individual) OR Company Name * & Designation (when Company Rep) */}
            {formData.contactType === 'Individual' ? (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  label="Profession / Occupation"
                  placeholder="Enter profession (e.g. Software Engineer, Consultant)"
                  required
                  value={formData.profession || ''}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  error={errors.profession}
                  radius="md"
                />

                <TextInput
                  label="Company / Org Name (Optional)"
                  placeholder="Enter company name if applicable"
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  radius="md"
                />
              </SimpleGrid>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  label="Company Name"
                  placeholder="Enter company name"
                  required
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  error={errors.companyName}
                  radius="md"
                />

                <TextInput
                  label="Designation"
                  placeholder="Enter designation (e.g. CTO, Manager)"
                  value={formData.designation || ''}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  radius="md"
                />
              </SimpleGrid>
            )}

            {/* Row 4: Address */}
            <TextInput
              label="Address"
              placeholder="Enter address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              radius="md"
            />

            {/* Row 5: Source * and Category * */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Select
                label="Source"
                placeholder="Select Source"
                required
                data={sourceOptions}
                value={formData.source || 'Website'}
                onChange={(val) => setFormData({ ...formData, source: val || 'Website' })}
                radius="md"
              />

              <Select
                label="Category"
                placeholder="Select Category"
                required
                data={categoryOptions}
                value={formData.category || 'Product'}
                onChange={(val) => setFormData({ ...formData, category: val || 'Product' })}
                radius="md"
              />
            </SimpleGrid>

            {/* If Source === 'Other', custom source input */}
            {formData.source === 'Other' && (
              <TextInput
                label="Custom Source"
                placeholder="Enter custom source details"
                required
                value={formData.customSource || ''}
                onChange={(e) => setFormData({ ...formData, customSource: e.target.value })}
                error={errors.customSource}
                radius="md"
              />
            )}

            {/* Row 6: Product List (if Product) OR Service List (if Service) */}
            {formData.category === 'Product' ? (
              <MultiSelect
                label="Product List"
                placeholder="Select Product"
                data={productOptions}
                searchable
                clearable
                value={formData.productList || []}
                onChange={(val) => setFormData({ ...formData, productList: val })}
                radius="md"
              />
            ) : (
              <MultiSelect
                label="Service List"
                placeholder="Select Service"
                data={serviceOptions}
                searchable
                clearable
                value={formData.serviceList || []}
                onChange={(val) => setFormData({ ...formData, serviceList: val })}
                radius="md"
              />
            )}

            {/* Row 7: Action Buttons matching the image */}
            <Group justify="flex-end" gap="sm" mt="lg">
              <Button
                variant="default"
                radius="md"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  fontWeight: 600,
                  minWidth: 100,
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                radius="md"
                loading={loading}
                style={{
                  background: isDark ? '#10B981' : '#15803D',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  minWidth: 130,
                }}
              >
                {isEditing ? 'Update Contact' : 'Save Contact'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default AddContactPage;
