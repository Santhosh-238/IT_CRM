import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  SimpleGrid,
  TextInput,
  Button,
  Group,
  Text,
  ActionIcon,
  Box,
  Textarea,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconX,
  IconUser,
  IconBuilding,
  IconId,
  IconMail,
  IconPhone,
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

  const { createContact, updateContact, loading } = useContact();
  const isEditing = Boolean(contact);

  const initialFormState: ContactFormData = {
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    assignedTo: '',
    estimatedValue: '',
    expectedCloseDate: '',
    description: '',
  };

  const [formData, setFormData] = useState<ContactFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact) {
      setFormData({
        id: contact.id,
        contactId: contact.contactId,
        name: contact.name || '',
        companyName: contact.companyName || '',
        contactPerson: contact.contactPerson || '',
        email: contact.email || '',
        phone: contact.phone || '',
        assignedTo: contact.assignedTo || '',
        estimatedValue: contact.estimatedValue || '',
        expectedCloseDate: contact.expectedCloseDate || '',
        description: contact.description || contact.notes || '',
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

    // 1. Name validation (required)
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    // 2. Company validation (required)
    if (!formData.companyName?.trim()) {
      newErrors.companyName = 'Company is required';
    }

    // 3. Email validation (if filled)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Invalid email address format';
      }
    }

    // 4. Phone validation (required)
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length !== 10) {
        newErrors.phone = 'Phone number must be exactly 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload: ContactFormData = {
        name: formData.name.trim(),
        companyName: formData.companyName?.trim(),
        contactPerson: formData.contactPerson?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : '',
        assignedTo: formData.assignedTo && formData.assignedTo !== 'none' ? formData.assignedTo : undefined,
        estimatedValue: formData.estimatedValue?.trim() || undefined,
        expectedCloseDate: formData.expectedCloseDate?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        status: contact?.status || 'New',
        stage: contact?.stage || 'Initialization',
        qualificationStatus: contact?.qualificationStatus || 'New',
      };

      let res;
      if (isEditing && contact?.id) {
        res = await updateContact(contact.id, payload);
      } else {
        res = await createContact(payload);
      }

      if (res?.success) {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving contact:', err);
    }
  };



  const inputStyles = {
    input: {
      height: 44,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      border: isDark ? '1.5px solid rgba(255, 255, 255, 0.16)' : '1.5px solid #CBD5E1',
      borderRadius: 10,
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontSize: 14,
      fontWeight: 500,
      boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
    },
    label: {
      fontWeight: 600,
      fontSize: 13,
      marginBottom: 6,
      color: isDark ? '#E2E8F0' : '#1E293B',
      letterSpacing: '0.01em',
    },
    section: {
      color: isDark ? '#94A3B8' : '#64748B',
    },
  };

  const textareaStyles = {
    input: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      border: isDark ? '1.5px solid rgba(255, 255, 255, 0.16)' : '1.5px solid #CBD5E1',
      borderRadius: 10,
      color: isDark ? '#F8FAFC' : '#0F172A',
      fontSize: 14,
      fontWeight: 500,
      padding: '12px 14px',
      boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    },
    label: {
      fontWeight: 600,
      fontSize: 13,
      marginBottom: 6,
      color: isDark ? '#E2E8F0' : '#1E293B',
      letterSpacing: '0.01em',
    },
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="720px"
      radius="16px"
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
          padding: '28px 32px 32px 32px',
        },
      }}
    >
      <style>{`
        .contact-form-field input:focus,
        .contact-form-field textarea:focus {
          border-color: #3B82F6 !important;
          box-shadow: 0 0 0 3.5px rgba(59, 130, 246, 0.18) !important;
        }
        .contact-form-field input:hover,
        .contact-form-field textarea:hover {
          border-color: ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#94A3B8'} !important;
        }
      `}</style>

      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="xl">
        <Box>
          <Text fw={700} size="22px" style={{ color: isDark ? '#F8FAFC' : '#111827', lineHeight: 1.2 }}>
            {isEditing ? 'Edit contact' : 'Create contact'}
          </Text>
          <Text size="13.5px" c="dimmed" mt={4}>
            Add the essential details. You can complete the record later.
          </Text>
        </Box>

        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          radius="100px"
          onClick={onClose}
          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
        >
          <IconX size={20} />
        </ActionIcon>
      </Group>

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          {/* Row 1: Name | Company */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <TextInput
              className="contact-form-field"
              label="Name"
              placeholder="e.g. John Doe / Lead Name"
              required
              leftSection={<IconUser size={18} stroke={1.6} />}
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              error={errors.name}
              styles={inputStyles}
            />

            <TextInput
              className="contact-form-field"
              label="Company"
              placeholder="e.g. TechCorp Solutions"
              required
              leftSection={<IconBuilding size={18} stroke={1.6} />}
              value={formData.companyName || ''}
              onChange={(e) => handleFieldChange('companyName', e.target.value)}
              error={errors.companyName}
              styles={inputStyles}
            />
          </SimpleGrid>

          {/* Row 2: Contact person | Email */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <TextInput
              className="contact-form-field"
              label="Contact person"
              placeholder="e.g. Alex Morgan (Optional)"
              leftSection={<IconId size={18} stroke={1.6} />}
              value={formData.contactPerson || ''}
              onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
              styles={inputStyles}
            />

            <TextInput
              className="contact-form-field"
              label="Email"
              placeholder="e.g. alex@techcorp.com"
              type="email"
              leftSection={<IconMail size={18} stroke={1.6} />}
              value={formData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              error={errors.email}
              styles={inputStyles}
            />
          </SimpleGrid>

          {/* Row 3: Phone number */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <TextInput
              className="contact-form-field"
              label="Phone number"
              placeholder="e.g. 9876543210"
              required
              maxLength={10}
              leftSection={<IconPhone size={18} stroke={1.6} />}
              value={formData.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleFieldChange('phone', val);
              }}
              error={errors.phone}
              styles={inputStyles}
            />
          </SimpleGrid>

          {/* Row 4: Description */}
          <Textarea
            className="contact-form-field"
            label="Description"
            placeholder="Add context, requirements, or notes..."
            minRows={3}
            value={formData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            styles={textareaStyles}
          />

          {/* Footer Buttons */}
          <Group justify="flex-end" gap="sm" mt="md">
            <Button
              variant="default"
              radius="md"
              size="md"
              onClick={onClose}
              disabled={loading}
              style={{
                fontWeight: 600,
                paddingLeft: 20,
                paddingRight: 20,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB',
                color: isDark ? '#E2E8F0' : '#374151',
                background: isDark ? '#1F2937' : '#FFFFFF',
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              radius="md"
              size="md"
              loading={loading}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                paddingLeft: 24,
                paddingRight: 24,
                border: 'none',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              }}
            >
              Save record
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default ContactModal;
