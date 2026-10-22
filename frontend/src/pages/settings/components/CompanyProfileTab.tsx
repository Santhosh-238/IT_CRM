import React, { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  Button,
  SimpleGrid,
  Box,
  Avatar,
  Badge,
  LoadingOverlay,
  Modal,
  TextInput,
  Divider,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconPencil,
  IconCheck,
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconShieldCheck,
  IconBriefcase,
  IconId,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { UserProfileData } from '../../../types/settings';
import { settingsService } from '../../../services/settingsService';
import { useCRM } from '../../../context/CRMContext';

export const CompanyProfileTab: React.FC = () => {
  const { currentUser, setCurrentUser } = useCRM();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [profile, setProfile] = useState<UserProfileData>({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    designation: '',
    department: '',
    empCode: '',
    workLocation: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    bio: '',
    avatar: '',
  });

  // Working copy for edit modal
  const [formValues, setFormValues] = useState<UserProfileData>(profile);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getUserProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setFormValues(res.data);
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to load profile details',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleOpenEdit = () => {
    setFormValues(profile);
    setEditModalOpened(true);
  };

  const handleFieldChange = (field: keyof UserProfileData, value: string) => {
    setFormValues((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'firstName' || field === 'lastName') {
        const fn = field === 'firstName' ? value : prev.firstName;
        const ln = field === 'lastName' ? value : prev.lastName;
        updated.name = `${fn} ${ln}`.trim();
      }
      return updated;
    });
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await settingsService.updateUserProfile(formValues);
      if (res.success && res.data) {
        setProfile(res.data);
        setFormValues(res.data);
        setEditModalOpened(false);

        // Synchronize application-wide user state (header, navigation)
        if (setCurrentUser) {
          setCurrentUser({
            ...currentUser,
            name: res.data.name,
            email: res.data.email,
            phone: res.data.phone,
            department: res.data.department,
            role: res.data.role,
            avatar: res.data.avatar || currentUser?.avatar,
          });
        }

        notifications.show({
          title: 'Profile Updated',
          message: 'Your profile details have been saved dynamically.',
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Save Failed',
        message: err.message || 'Failed to update profile',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    backgroundColor: isDark ? '#111827' : '#FFFFFF',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECF0',
    borderRadius: '16px',
    boxShadow: isDark ? 'none' : '0 1px 3px rgba(16, 24, 40, 0.05)',
  };

  const initialLetter = (profile.firstName || profile.name || 'U').charAt(0).toUpperCase();
  const roleDisplay = profile.role === 'SUPER_ADMIN' ? 'Super Administrator' : (profile.role ? profile.role.replace(/_/g, ' ') : 'Administrator');

  return (
    <Box pos="relative" style={{ maxWidth: 940 }}>
      <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ blur: 1 }} />

      {/* 1. Header with Page Title and Edit Profile Action */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <Box>
          <Text fw={800} size="20px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
            My Profile
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            Manage your personal identity, enterprise role, contact records, and office location
          </Text>
        </Box>
        <Button
          color="indigo"
          size="sm"
          radius="md"
          leftSection={<IconPencil size={15} />}
          onClick={handleOpenEdit}
        >
          Edit Profile
        </Button>
      </Group>

      <Stack gap="lg">
        {/* 2. Sleek Profile Identity Card (NO oversized empty banner) */}
        <Paper p="xl" style={cardStyle}>
          <Group justify="space-between" align="center" wrap="wrap" gap="lg">
            <Group gap="lg" align="center">
              {/* Avatar with Status Ring */}
              <Box style={{ position: 'relative' }}>
                {profile.avatar ? (
                  <Avatar
                    src={profile.avatar}
                    size={74}
                    radius="100px"
                    alt={profile.name}
                    style={{
                      border: isDark ? '3px solid #1E293B' : '3px solid #EEF2FF',
                      boxShadow: '0 2px 10px rgba(99, 102, 241, 0.15)',
                    }}
                  />
                ) : (
                  <Avatar
                    size={74}
                    radius="100px"
                    color="indigo"
                    style={{
                      background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: 28,
                      border: isDark ? '3px solid #1E293B' : '3px solid #EEF2FF',
                      boxShadow: '0 2px 10px rgba(99, 102, 241, 0.15)',
                    }}
                  >
                    {initialLetter}
                  </Avatar>
                )}
                {/* Active status indicator */}
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    background: '#10B981',
                    border: isDark ? '3px solid #111827' : '3px solid #FFFFFF',
                  }}
                />
              </Box>

              {/* Identity & Role */}
              <Box>
                <Group gap="xs" align="center">
                  <Text fw={800} size="22px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.02em' }}>
                    {profile.name || `${profile.firstName} ${profile.lastName}`.trim() || 'Santhosh C'}
                  </Text>
                  <Badge size="sm" variant="light" color="indigo" radius="sm">
                    {roleDisplay}
                  </Badge>
                  <Badge size="sm" variant="light" color="teal" radius="sm">
                    ● Active
                  </Badge>
                </Group>

                <Group gap="xs" mt={4} align="center">
                  <IconBriefcase size={14} color="#64748B" />
                  <Text size="sm" fw={500} c="dimmed">
                    {profile.designation || 'Super Administrator'} • {profile.department || 'Engineering'}
                  </Text>
                </Group>

                <Group gap="md" mt="sm" wrap="wrap">
                  <Group gap={6}>
                    <IconMail size={14} color="#6366F1" />
                    <Text size="xs" fw={500} c={isDark ? 'gray.3' : 'gray.7'}>
                      {profile.email || 'sandy@gmail.com'}
                    </Text>
                  </Group>

                  <Group gap={6}>
                    <IconPhone size={14} color="#10B981" />
                    <Text size="xs" fw={500} c={isDark ? 'gray.3' : 'gray.7'}>
                      {profile.phone ? (profile.phone.startsWith('+') ? profile.phone : `+91 ${profile.phone}`) : '+91 9846598465'}
                    </Text>
                  </Group>

                  <Group gap={6}>
                    <IconMapPin size={14} color="#EC4899" />
                    <Text size="xs" fw={500} c={isDark ? 'gray.3' : 'gray.7'}>
                      {[profile.city, profile.state, profile.country].filter(Boolean).join(', ') || 'Chennai, Tamil Nadu, India'}
                    </Text>
                  </Group>
                </Group>
              </Box>
            </Group>

            {/* Quick Meta Badge */}
            <Paper
              p="xs"
              px="md"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                borderRadius: 12,
                textAlign: 'right',
              }}
            >
              <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                Employee ID
              </Text>
              <Text size="13px" fw={700} c={isDark ? '#F8FAFC' : '#0F172A'}>
                {profile.empCode || 'EMP-001'}
              </Text>
            </Paper>
          </Group>
        </Paper>

        {/* 3. Personal & Contact Information (Clean Spec Table Design) */}
        <Paper p="xl" style={cardStyle}>
          <Group gap="xs" mb="md" align="center">
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4F46E5',
              }}
            >
              <IconUser size={18} />
            </Box>
            <Box>
              <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#101828' }}>
                Personal Information
              </Text>
              <Text size="xs" c="dimmed">
                Official employee identity and direct contact records
              </Text>
            </Box>
          </Group>

          <Divider my="sm" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Box py="xs" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F5F9' }}>
              <Text size="11px" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.03em' }}>
                First Name
              </Text>
              <Text size="14px" fw={600} mt={3} c={isDark ? '#F8FAFC' : '#0F172A'}>
                {profile.firstName || 'Santhosh'}
              </Text>
            </Box>

            <Box py="xs" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F5F9' }}>
              <Text size="11px" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.03em' }}>
                Last Name
              </Text>
              <Text size="14px" fw={600} mt={3} c={isDark ? '#F8FAFC' : '#0F172A'}>
                {profile.lastName || 'C'}
              </Text>
            </Box>

            <Box py="xs" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F5F9' }}>
              <Text size="11px" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.03em' }}>
                Email Address
              </Text>
              <Group gap="xs" mt={3} align="center">
                <Text size="14px" fw={600} c={isDark ? '#F8FAFC' : '#0F172A'}>
                  {profile.email || 'sandy@gmail.com'}
                </Text>
                <Badge size="xs" color="teal" variant="light">
                  Verified
                </Badge>
              </Group>
            </Box>

            <Box py="xs" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F5F9' }}>
              <Text size="11px" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.03em' }}>
                Phone Number
              </Text>
              <Text size="14px" fw={600} mt={3} c={isDark ? '#F8FAFC' : '#0F172A'}>
                {profile.phone ? (profile.phone.startsWith('+') ? profile.phone : `+91 ${profile.phone}`) : '+91 9846598465'}
              </Text>
            </Box>

            <Box py="xs" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F5F9' }}>
              <Text size="11px" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.03em' }}>
                Designation / Job Title
              </Text>
              <Text size="14px" fw={600} mt={3} c={isDark ? '#F8FAFC' : '#0F172A'}>
                {profile.designation || 'Super Administrator'}
              </Text>
            </Box>

            <Box py="xs" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F5F9' }}>
              <Text size="11px" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.03em' }}>
                Department
              </Text>
              <Text size="14px" fw={600} mt={3} c={isDark ? '#F8FAFC' : '#0F172A'}>
                {profile.department || 'Engineering'}
              </Text>
            </Box>
          </SimpleGrid>

          <Box pt="md">
            <Text size="11px" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.03em' }}>
              Professional Bio & Summary
            </Text>
            <Text size="13px" fw={500} mt={4} c={isDark ? '#CBD5E1' : '#475569'}>
              {profile.bio || `${profile.designation || 'Super Administrator'} overseeing enterprise CRM operations, client projects, and engineering infrastructure.`}
            </Text>
          </Box>
        </Paper>
      </Stack>

      {/* COMPREHENSIVE EDIT PROFILE MODAL */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title={
          <Group gap="xs">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <IconUser size={18} />
            </Box>
            <Box>
              <Text fw={700} size="md">
                Edit My Profile
              </Text>
              <Text size="xs" c="dimmed">
                Update your personal details, designation, and contact info
              </Text>
            </Box>
          </Group>
        }
        radius="md"
        size="lg"
      >
        <form onSubmit={handleSaveModal}>
          <Stack gap="md" mt="xs">
            {/* Personal Details */}
            <Divider label="Personal Details" labelPosition="left" />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput
                label="First Name"
                placeholder="Santhosh"
                required
                value={formValues.firstName}
                onChange={(e) => handleFieldChange('firstName', e.currentTarget.value)}
              />
              <TextInput
                label="Last Name"
                placeholder="C"
                value={formValues.lastName}
                onChange={(e) => handleFieldChange('lastName', e.currentTarget.value)}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput
                label="Email Address"
                value={formValues.email}
                disabled
                description="Tied to system login credentials"
              />
              <TextInput
                label="Phone Number"
                placeholder="9846598465"
                required
                value={formValues.phone}
                onChange={(e) => handleFieldChange('phone', e.currentTarget.value)}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput
                label="Designation / Title"
                placeholder="Super Administrator"
                value={formValues.designation}
                onChange={(e) => handleFieldChange('designation', e.currentTarget.value)}
              />
              <TextInput
                label="Department"
                placeholder="Engineering"
                value={formValues.department}
                onChange={(e) => handleFieldChange('department', e.currentTarget.value)}
              />
            </SimpleGrid>

            <TextInput
              label="Bio / Professional Tagline"
              placeholder="e.g. Super Administrator • Engineering & Operations"
              value={formValues.bio}
              onChange={(e) => handleFieldChange('bio', e.currentTarget.value)}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setEditModalOpened(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" color="indigo" loading={saving} radius="md">
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Box>
  );
};

export default CompanyProfileTab;
