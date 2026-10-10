import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  SimpleGrid,
  TextInput,
  Select,
  MultiSelect,
  Button,
  Group,
  Text,
  ActionIcon,
  Box,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconUser,
  IconX,
} from '@tabler/icons-react';
import { Contact, ContactFormData } from '../../../types/contact';
import { useContact } from '../../../context/ContactContext';

interface ContactModalProps {
  opened: boolean;
  onClose: () => void;
  contact?: Contact | null;
  onSuccess?: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  opened,
  onClose,
  contact,
  onSuccess,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { metadata, createContact, updateContact, loading } = useContact();
  const isEditing = Boolean(contact);

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
    assignedTo: '',
  };

  const [formData, setFormData] = useState<ContactFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact) {
      setFormData({
        id: contact.id,
        contactId: contact.contactId,
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        contactType: contact.contactType || 'Individual',
        profession: contact.profession || '',
        companyName: contact.companyName || '',
        designation: contact.designation || '',
        address: contact.address || '',
        source: contact.source || 'Website',
        customSource: contact.customSource || '',
        category: contact.category || 'Product',
        productList: contact.productList || [],
        serviceList: contact.serviceList || [],
        status: contact.status || 'Active',
        stage: contact.stage || 'New Lead',
        qualificationStatus: contact.qualificationStatus || 'In Progress',
        assignedTo: contact.assignedTo || '',
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
  }, [contact, opened]);

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

    if (isEditing && contact?.id) {
      const res = await updateContact(contact.id, formData);
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      }
    } else {
      const res = await createContact(formData);
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      }
    }
  };

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

  const employeeOptions = [
    { value: '', label: 'Unassigned (New)' },
    ...(metadata?.employees?.map((emp) => ({
      value: emp.id,
      label: `${emp.name} (${emp.designation || emp.department || 'Staff'})`,
    })) || []),
  ];

  const stageOptions = (metadata?.stages && metadata.stages.length > 0
    ? metadata.stages
    : [
        'New Lead',
        'Qualification',
        'Discovery',
        'Requirement Analysis',
        'Demo / Presentation',
        'Proposal / Quotation',
        'Negotiation',
        'Decision Making',
        'Won',
        'Lost',
      ]
  ).map((st) => ({ value: st, label: st }));


  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="620px"
      radius="20px"
      padding="xl"
      centered
      styles={{
        header: {
          display: 'none',
        },
        content: {
          background: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.18)',
        },
        body: {
          padding: 24,
        },
      }}
    >
      {/* Header matching image */}
      <Group justify="space-between" align="flex-start" mb="lg">
        <Group gap="md">
          <Box
            style={{
              width: 42,
              height: 42,
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
            <Text fw={800} size="19px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
              {isEditing ? `Edit Contact` : 'Add Contact'}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Enter contact details
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

      {/* Form Fields matching the image */}
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

          {/* Row 7: Assignment & Stage Progression */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Select
              label="Assign To"
              placeholder="Select employee"
              data={employeeOptions}
              value={formData.assignedTo || ''}
              onChange={(val) => setFormData({ ...formData, assignedTo: val || '' })}
              radius="md"
            />

            <Select
              label="Stage"
              placeholder="Select stage"
              data={stageOptions}
              value={formData.stage || 'New Lead'}
              onChange={(val) => setFormData({ ...formData, stage: val || 'New Lead' })}
              radius="md"
            />
          </SimpleGrid>

          {/* Row 8: Action Buttons matching the image */}
          <Group justify="flex-end" gap="sm" mt="md">
            <Button
              variant="default"
              radius="md"
              onClick={onClose}
              disabled={loading}
              style={{
                fontWeight: 600,
                minWidth: 90,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              radius="md"
              loading={loading}
              style={{
                background: isDark ? '#3B82F6' : '#0F172A',
                color: '#FFFFFF',
                fontWeight: 600,
                minWidth: 120,
              }}
            >
              {isEditing ? 'Update Contact' : 'Save Contact'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default ContactModal;
