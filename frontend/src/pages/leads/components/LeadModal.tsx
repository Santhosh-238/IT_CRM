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
  IconTarget,
  IconX,
} from '@tabler/icons-react';
import { Lead, LeadFormData } from '../../../types/lead';
import { useLead } from '../../../context/LeadContext';
import { useCRM } from '../../../context/CRMContext';

interface LeadModalProps {
  opened: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSuccess?: () => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  opened,
  onClose,
  lead,
  onSuccess,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const { setActiveNav } = useCRM();
  const { metadata, createLead, updateLead, setSelectedLead, loading } = useLead();
  const isEditing = Boolean(lead);

  const initialFormState: LeadFormData = {
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
    category: 'Service',
    productList: [],
    serviceList: [],
    status: 'New',
    stage: 'Initialization',
  };

  const [formData, setFormData] = useState<LeadFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        contactType: lead.contactType || 'Individual',
        profession: lead.profession || '',
        companyName: lead.companyName || '',
        designation: lead.designation || '',
        address: lead.address || '',
        source: lead.source || 'Website',
        customSource: lead.customSource || '',
        category: lead.category || 'Service',
        productList: lead.productList || [],
        serviceList: lead.serviceList || [],
        status: lead.status || 'New',
        stage: lead.stage || 'Initialization',
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
  }, [lead, opened]);

  const handleFieldChange = (field: keyof LeadFormData, value: any) => {
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
    if (!formData.name.trim()) {
      newErrors.name = 'Lead Name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEditing && lead) {
      const res = await updateLead(lead.id, formData);
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      }
    } else {
      const res = await createLead(formData);
      if (res.success) {
        onClose();
        if (res.data) {
          setSelectedLead(res.data);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('crm_selected_lead', JSON.stringify(res.data));
            sessionStorage.setItem('crm_schedule_tab', 'schedule');
          }
          setActiveNav('lead-schedule');
        }
        if (onSuccess) onSuccess();
      }
    }
  };

  const isCompanyRep = formData.contactType === 'Company Representative';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="620px"
      radius="16px"
      padding={0}
      centered
      styles={{
        content: {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: 'calc(100vw - 20px)',
          margin: '10px auto',
        },
        body: {
          padding: 0,
        },
      }}
    >
      {/* Header */}
      <Box p={{ base: 'sm', sm: 'lg' }} style={{ borderBottom: isDark ? '1px solid #1F2937' : '1px solid #E2E8F0' }}>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Box
              p={8}
              style={{
                borderRadius: 8,
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconTarget size={20} />
            </Box>
            <div>
              <Text fw={700} size="lg" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                {isEditing ? 'Edit Lead' : 'Add Lead'}
              </Text>
              <Text size="xs" c="dimmed">
                {isEditing ? `Update details for ${lead?.leadId || 'record'}` : 'Enter lead contact details & requirement info'}
              </Text>
            </div>
          </Group>
          <ActionIcon variant="subtle" color="gray" onClick={onClose} radius="md">
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </Box>

      {/* Form Body */}
      <form onSubmit={handleSubmit}>
        <Box
          p={{ base: 'sm', sm: 'lg' }}
          style={{
            maxHeight: 'calc(80vh - 130px)',
            overflowY: 'auto',
          }}
        >
          <Stack gap="md">
          {/* Row 1: Name & Email */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Name"
              placeholder="e.g. Anand Kumar"
              required
              withAsterisk
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              error={errors.name}
            />
            <TextInput
              label="Email Address"
              placeholder="anand@company.com"
              value={formData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              error={errors.email}
            />
          </SimpleGrid>

          {/* Row 2: Mobile Number & Contact Type */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Mobile Number"
              placeholder="9876543210"
              value={formData.phone || ''}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
            />
            <Select
              label="Contact Type"
              data={metadata?.contactTypes || ['Individual', 'Company Representative']}
              value={formData.contactType || 'Individual'}
              onChange={(val) => handleFieldChange('contactType', val || 'Individual')}
            />
          </SimpleGrid>

          {/* Row 3: Professional Details */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {isCompanyRep ? (
              <>
                <TextInput
                  label="Company Name"
                  placeholder="e.g. OmniTech Solutions"
                  value={formData.companyName || ''}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                />
                <TextInput
                  label="Designation"
                  placeholder="e.g. Chief Technology Officer"
                  value={formData.designation || ''}
                  onChange={(e) => handleFieldChange('designation', e.target.value)}
                />
              </>
            ) : (
              <>
                <TextInput
                  label="Profession / Occupation"
                  placeholder="e.g. Independent Consultant"
                  value={formData.profession || ''}
                  onChange={(e) => handleFieldChange('profession', e.target.value)}
                />
                <TextInput
                  label="Company / Org Name (Optional)"
                  placeholder="Optional company name"
                  value={formData.companyName || ''}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                />
              </>
            )}
          </SimpleGrid>

          {/* Row 4: Address */}
          <TextInput
            label="Address / Location"
            placeholder="City, State, Country"
            value={formData.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
          />

          {/* Row 5: Source & Category */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Select
              label="Source"
              data={metadata?.sources || ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Other']}
              value={formData.source || 'Website'}
              onChange={(val) => handleFieldChange('source', val || 'Website')}
            />
            <Select
              label="Category"
              data={metadata?.categories || ['Product', 'Service']}
              value={formData.category || 'Service'}
              onChange={(val) => handleFieldChange('category', val || 'Service')}
            />
          </SimpleGrid>

          {/* Row 6: Product / Service Selection */}
          {formData.category === 'Product' ? (
            <MultiSelect
              label="Product List"
              placeholder="Select products"
              data={metadata?.productOptions || ['HRMS', 'IT CRM', 'Fintech CRM', 'Cloud ERP']}
              value={formData.productList || []}
              onChange={(vals) => handleFieldChange('productList', vals)}
              searchable
              clearable
            />
          ) : (
            <MultiSelect
              label="Service List"
              placeholder="Select services"
              data={metadata?.serviceOptions || ['Cloud Migration & DevOps', 'Full-Stack Web Development', 'Cybersecurity']}
              value={formData.serviceList || []}
              onChange={(vals) => handleFieldChange('serviceList', vals)}
              searchable
              clearable
            />
          )}

          {/* Row 7: Status & Stage */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Select
              label="Status"
              data={Array.from(
                new Set(
                  (metadata?.statuses || ['New', 'In Progress', 'Qualified', 'Proposal Sent', 'Complete', 'Lost']).map(
                    (s) => (s === 'Contacted' ? 'In Progress' : (s === 'Won' || s === 'Completed' ? 'Complete' : s))
                  )
                )
              )}
              value={formData.status === 'Won' ? 'Complete' : (formData.status || 'New')}
              onChange={(val) => handleFieldChange('status', val || 'New')}
            />
            <Select
              label="Pipeline Stage"
              data={metadata?.stages || ['Initialization', 'Qualification', 'Discovery', 'Demo / Presentation', 'Won', 'Lost']}
              value={formData.stage || 'Initialization'}
              onChange={(val) => handleFieldChange('stage', val || 'Initialization')}
            />
          </SimpleGrid>
        </Stack>
      </Box>

      {/* Footer (Pinned at bottom, always visible) */}
      <Box
        p="md"
        px="lg"
        style={{
          borderTop: isDark ? '1px solid #1F2937' : '1px solid #E2E8F0',
          backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
          flexShrink: 0,
        }}
      >
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={loading} radius="md">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            radius="md"
            style={{
              backgroundColor: isDark ? '#22c55e' : '#0F172A',
              color: '#FFFFFF',
              fontWeight: 600,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            {isEditing ? 'Save Changes' : 'Save Lead'}
          </Button>
        </Group>
      </Box>
    </form>
    </Modal>
  );
};

export default LeadModal;
