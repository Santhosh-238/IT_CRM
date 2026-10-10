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
    contactType: '',
    profession: '',
    companyName: '',
    designation: '',
    address: '',
    source: '',
    customSource: '',
    category: '',
    productList: [],
    serviceList: [],
    status: 'New',
    stage: 'Initialization',
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
        contactType: contact.contactType || '',
        profession: contact.profession || '',
        companyName: contact.companyName || '',
        designation: contact.designation || '',
        address: contact.address || '',
        source: contact.source || '',
        customSource: contact.customSource || '',
        category: contact.category || '',
        productList: contact.productList || [],
        serviceList: contact.serviceList || [],
        status: contact.status || 'New',
        stage: contact.stage || 'Initialization',
        qualificationStatus: contact.qualificationStatus || 'In Progress',
        assignedTo: contact.assignedTo || '',
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
  }, [contact, opened]);

  const handleFieldChange = (field: keyof ContactFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Contact Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Contact Name must be at least 2 characters';
    }

    // 2. Email validation
    if (!formData.email?.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // 3. Mobile Number validation (Fixed 10 digits)
    const cleanPhone = (formData.phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Mobile Number is required';
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = 'Mobile number must be exactly 10 digits';
    }

    // 4. Contact Type validation
    if (!formData.contactType) {
      newErrors.contactType = 'Contact Type is required';
    }

    // 5. Profession / Company validation based on Contact Type
    if (formData.contactType === 'Individual') {
      if (!formData.profession?.trim()) {
        newErrors.profession = 'Profession / Occupation is required';
      } else if (formData.profession.trim().length < 2) {
        newErrors.profession = 'Profession must be at least 2 characters';
      }
    } else if (formData.contactType === 'Company Representative') {
      if (!formData.companyName?.trim()) {
        newErrors.companyName = 'Company Name is required';
      } else if (formData.companyName.trim().length < 2) {
        newErrors.companyName = 'Company Name must be at least 2 characters';
      }
    }

    // 6. Address validation
    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 3) {
      newErrors.address = 'Address must be at least 3 characters';
    }

    // 7. Source validation
    if (!formData.source) {
      newErrors.source = 'Source is required';
    } else if (formData.source === 'Other' && !formData.customSource?.trim()) {
      newErrors.customSource = 'Please specify custom source';
    }

    // 8. Category validation & Product/Service selection
    if (!formData.category) {
      newErrors.category = 'Category is required';
    } else if (formData.category === 'Product' && (!formData.productList || formData.productList.length === 0)) {
      newErrors.productList = 'Please select at least one product';
    } else if (formData.category === 'Service' && (!formData.serviceList || formData.serviceList.length === 0)) {
      newErrors.serviceList = 'Please select at least one service';
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
        'Initialization',
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
              onChange={(e) => handleFieldChange('name', e.target.value)}
              error={errors.name}
              radius="md"
            />

            <TextInput
              label="Email Address"
              placeholder="Enter email address"
              required
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
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
              maxLength={10}
              value={formData.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleFieldChange('phone', val);
              }}
              error={errors.phone}
              radius="md"
            />

            <Select
              label="Contact Type"
              placeholder="Select contact type"
              required
              data={contactTypeOptions}
              value={formData.contactType || null}
              onChange={(val) => {
                const nextType = val || '';
                setFormData((prev) => ({
                  ...prev,
                  contactType: nextType,
                  ...(nextType === 'Individual' ? { companyName: '', designation: '' } : {}),
                  ...(nextType === 'Company Representative' ? { profession: '' } : {}),
                }));
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.contactType;
                  delete copy.profession;
                  delete copy.companyName;
                  return copy;
                });
              }}
              error={errors.contactType}
              radius="md"
            />
          </SimpleGrid>

          {/* Row 3: Profession / Occupation * and Optional Company Name (when Individual) OR Company Name * & Designation (when Company Rep) */}
          {formData.contactType === 'Company Representative' ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Company Name"
                placeholder="Enter company name"
                required
                value={formData.companyName || ''}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                error={errors.companyName}
                radius="md"
              />

              <TextInput
                label="Designation"
                placeholder="Enter designation (e.g. CTO, Manager)"
                value={formData.designation || ''}
                onChange={(e) => handleFieldChange('designation', e.target.value)}
                radius="md"
              />
            </SimpleGrid>
          ) : formData.contactType === 'Individual' ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Profession / Occupation"
                placeholder="Enter profession (e.g. Software Engineer, Consultant)"
                required
                value={formData.profession || ''}
                onChange={(e) => handleFieldChange('profession', e.target.value)}
                error={errors.profession}
                radius="md"
              />

              <TextInput
                label="Company / Org Name (Optional)"
                placeholder="Enter company name if applicable"
                value={formData.companyName || ''}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                radius="md"
              />
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Profession / Occupation"
                placeholder="Enter profession or select Contact Type"
                value={formData.profession || ''}
                onChange={(e) => handleFieldChange('profession', e.target.value)}
                error={errors.profession}
                radius="md"
              />

              <TextInput
                label="Company / Org Name (Optional)"
                placeholder="Enter company name if applicable"
                value={formData.companyName || ''}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                radius="md"
              />
            </SimpleGrid>
          )}

          {/* Row 4: Address (MANDATORY) */}
          <TextInput
            label="Address"
            placeholder="Enter address"
            required
            value={formData.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            error={errors.address}
            radius="md"
          />

          {/* Row 5: Source * and Category * */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Select
              label="Source"
              placeholder="Select Source"
              required
              data={sourceOptions}
              value={formData.source || null}
              onChange={(val) => {
                const nextSource = val || '';
                setFormData((prev) => ({ ...prev, source: nextSource }));
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.source;
                  if (nextSource !== 'Other') delete copy.customSource;
                  return copy;
                });
              }}
              error={errors.source}
              radius="md"
            />

            <Select
              label="Category"
              placeholder="Select Category"
              required
              data={categoryOptions}
              value={formData.category || null}
              onChange={(val) => {
                const nextCat = val || '';
                setFormData((prev) => ({
                  ...prev,
                  category: nextCat,
                  ...(nextCat === 'Product' ? { serviceList: [] } : {}),
                  ...(nextCat === 'Service' ? { productList: [] } : {}),
                }));
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.category;
                  delete copy.productList;
                  delete copy.serviceList;
                  return copy;
                });
              }}
              error={errors.category}
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
              onChange={(e) => handleFieldChange('customSource', e.target.value)}
              error={errors.customSource}
              radius="md"
            />
          )}

          {/* Row 6: Product List (if Product) OR Service List (if Service) */}
          {formData.category === 'Service' ? (
            <MultiSelect
              label="Service List"
              placeholder="Select Service"
              required
              data={serviceOptions}
              searchable
              clearable
              value={formData.serviceList || []}
              onChange={(val) => handleFieldChange('serviceList', val)}
              error={errors.serviceList}
              radius="md"
            />
          ) : formData.category === 'Product' ? (
            <MultiSelect
              label="Product List"
              placeholder="Select Product"
              required
              data={productOptions}
              searchable
              clearable
              value={formData.productList || []}
              onChange={(val) => handleFieldChange('productList', val)}
              error={errors.productList}
              radius="md"
            />
          ) : (
            <MultiSelect
              label="Product List"
              placeholder="Select Product"
              data={productOptions}
              searchable
              clearable
              value={[]}
              onChange={(val) => handleFieldChange('productList', val)}
              radius="md"
            />
          )}

          {/* Row 7: Assignment & Stage Progression */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Select
              label="Assign To"
              placeholder="Unassigned (Assign later)"
              clearable
              data={employeeOptions}
              value={formData.assignedTo || null}
              onChange={(val) => setFormData({ ...formData, assignedTo: val || '' })}
              radius="md"
            />

            <Select
              label="Stage"
              placeholder="Select stage"
              data={stageOptions}
              value={formData.stage || null}
              onChange={(val) => setFormData({ ...formData, stage: val || '' })}
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
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                minWidth: 120,
                border: 'none',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
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
