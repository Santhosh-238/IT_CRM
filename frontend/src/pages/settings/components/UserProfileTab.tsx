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
  ThemeIcon,
  useComputedColorScheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
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

export const UserProfileTab: React.FC = () => {
  const { currentUser, setCurrentUser } = useCRM();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

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
    <Box pos="relative" style={{ maxWidth: 940, width: '100%' }}>
      <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ blur: 1 }} />

      {/* 1. Header with Page Title and Desktop Edit Action */}
      <Group justify="space-between" align="center" mb={isMobile ? 'xs' : 'md'} wrap="nowrap">
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text
            fw={800}
            size={isMobile ? '18px' : '20px'}
            style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}
          >
            My Profile
          </Text>
          <Text size="xs" c="dimmed" mt={1} truncate>
            Personal identity & enterprise credentials
          </Text>
        </Box>
        {!isMobile && (
          <Button
            color="indigo"
            size="sm"
            radius="md"
            leftSection={<IconPencil size={15} />}
            onClick={handleOpenEdit}
            style={{ flexShrink: 0, fontWeight: 650 }}
          >
            Edit Profile
          </Button>
        )}
      </Group>

      <Stack gap={isMobile ? 'sm' : 'lg'}>
        {/* 2. Sleek Profile Identity Hero Card */}
        <Paper p={isMobile ? 'md' : 'xl'} style={cardStyle}>
          {isMobile ? (
            /* MOBILE-FIRST PROFILE CARD */
            <Box>
              {/* Top Identity Row: Avatar + Name + Badges */}
              <Group gap="sm" align="flex-start" wrap="nowrap">
                {/* Avatar with Glow and Active Ring */}
                <Box style={{ position: 'relative', flexShrink: 0 }}>
                  {profile.avatar ? (
                    <Avatar
                      src={profile.avatar}
                      size={64}
                      radius="100px"
                      alt={profile.name}
                      style={{
                        border: isDark ? '2.5px solid #1E293B' : '2.5px solid #FFFFFF',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                      }}
                    />
                  ) : (
                    <Box
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #6366F1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: 26,
                        letterSpacing: '-0.02em',
                        border: isDark ? '2.5px solid #1E293B' : '2.5px solid #FFFFFF',
                        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      }}
                    >
                      {initialLetter}
                    </Box>
                  )}
                  {/* Status Indicator */}
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: 1,
                      right: 1,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#10B981',
                      border: isDark ? '2.5px solid #111827' : '2.5px solid #FFFFFF',
                      boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)',
                    }}
                  />
                </Box>

                {/* Identity & Badges */}
                <Box style={{ minWidth: 0, flex: 1 }}>
                  <Text
                    fw={800}
                    size="18px"
                    truncate
                    style={{
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.25,
                    }}
                  >
                    {profile.name || `${profile.firstName} ${profile.lastName}`.trim() || 'Santhosh C'}
                  </Text>

                  <Group gap={5} mt={5} wrap="wrap">
                    <Badge size="xs" variant="light" color="indigo" radius="sm">
                      {roleDisplay}
                    </Badge>
                    <Badge size="xs" variant="light" color="teal" radius="sm">
                      ● Active
                    </Badge>
                    <Badge size="xs" variant="outline" color="gray" radius="sm">
                      {profile.empCode || 'EMP-1001'}
                    </Badge>
                  </Group>

                  <Group gap={4} mt={5} align="center" wrap="nowrap">
                    <IconBriefcase size={13} color="#64748B" style={{ flexShrink: 0 }} />
                    <Text size="xs" fw={500} c="dimmed" truncate>
                      {profile.designation || 'Super Administrator'} • {profile.department || 'Engineering'}
                    </Text>
                  </Group>
                </Box>
              </Group>

              {/* Mobile Quick Action Buttons Bar */}
              <Group gap="xs" mt="sm" grow>
                <Button
                  size="xs"
                  variant="light"
                  color="indigo"
                  radius="md"
                  leftSection={<IconPencil size={13} />}
                  onClick={handleOpenEdit}
                  style={{ fontWeight: 650, flex: 1.4 }}
                >
                  Edit Profile
                </Button>
                {profile.email && (
                  <Button
                    component="a"
                    href={`mailto:${profile.email}`}
                    size="xs"
                    variant="subtle"
                    color="blue"
                    radius="md"
                    leftSection={<IconMail size={13} />}
                    style={{ fontWeight: 600 }}
                  >
                    Email
                  </Button>
                )}
                {profile.phone && (
                  <Button
                    component="a"
                    href={`tel:${profile.phone}`}
                    size="xs"
                    variant="subtle"
                    color="teal"
                    radius="md"
                    leftSection={<IconPhone size={13} />}
                    style={{ fontWeight: 600 }}
                  >
                    Call
                  </Button>
                )}
              </Group>

              {/* Contact Channels List */}
              <Box
                mt="sm"
                pt="sm"
                style={{
                  borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
                }}
              >
                <Stack gap={6}>
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon size={24} radius="md" variant="light" color="indigo">
                      <IconMail size={13} />
                    </ThemeIcon>
                    <Text size="xs" fw={500} truncate c={isDark ? 'gray.3' : 'gray.8'} style={{ flex: 1, minWidth: 0 }}>
                      {profile.email || 'sandy@gmail.com'}
                    </Text>
                    <Badge size="xs" color="teal" variant="light">
                      Verified
                    </Badge>
                  </Group>

                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon size={24} radius="md" variant="light" color="teal">
                      <IconPhone size={13} />
                    </ThemeIcon>
                    <Text size="xs" fw={500} truncate c={isDark ? 'gray.3' : 'gray.8'} style={{ flex: 1, minWidth: 0 }}>
                      {profile.phone ? (profile.phone.startsWith('+') ? profile.phone : `+91 ${profile.phone}`) : '+91 9846598465'}
                    </Text>
                  </Group>

                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon size={24} radius="md" variant="light" color="pink">
                      <IconMapPin size={13} />
                    </ThemeIcon>
                    <Text size="xs" fw={500} truncate c={isDark ? 'gray.3' : 'gray.8'} style={{ flex: 1, minWidth: 0 }}>
                      {[profile.city, profile.state, profile.country].filter(Boolean).join(', ') || 'Chennai, Tamil Nadu, India'}
                    </Text>
                  </Group>
                </Stack>
              </Box>
            </Box>
          ) : (
            /* DESKTOP PROFILE CARD */
            <Group justify="space-between" align="center" wrap="wrap" gap="lg">
              <Group gap="lg" align="center">
                {/* Avatar with Status Ring */}
                <Box style={{ position: 'relative' }}>
                  {profile.avatar ? (
                    <Avatar
                      src={profile.avatar}
                      size={76}
                      radius="100px"
                      alt={profile.name}
                      style={{
                        border: isDark ? '3px solid #1E293B' : '3px solid #FFFFFF',
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.2)',
                      }}
                    />
                  ) : (
                    <Box
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #6366F1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: 30,
                        border: isDark ? '3px solid #1E293B' : '3px solid #FFFFFF',
                        boxShadow: '0 4px 16px rgba(79, 70, 229, 0.25)',
                      }}
                    >
                      {initialLetter}
                    </Box>
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
                      boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)',
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
                  {profile.empCode || 'EMP-1001'}
                </Text>
              </Paper>
            </Group>
          )}
        </Paper>

        {/* 3. Personal & Enterprise Details (Structured Key-Value Spec Tiles) */}
        <Paper p={isMobile ? 'md' : 'xl'} style={cardStyle}>
          <Group gap="xs" mb="sm" align="center">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4F46E5',
              }}
            >
              <IconUser size={17} />
            </Box>
            <Box>
              <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#101828' }}>
                Personal & Enterprise Details
              </Text>
              <Text size="xs" c="dimmed">
                Official employee credentials & system access records
              </Text>
            </Box>
          </Group>

          <Divider my="xs" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={isMobile ? 'xs' : 'sm'}>
            {[
              { label: 'First Name', value: profile.firstName || 'Santhosh' },
              { label: 'Last Name', value: profile.lastName || 'C' },
              { label: 'Employee ID', value: profile.empCode || 'EMP-1001', isCode: true },
              { label: 'Designation / Title', value: profile.designation || 'Super Administrator' },
              { label: 'Department', value: profile.department || 'Engineering' },
              { label: 'Work Location', value: [profile.city, profile.state, profile.country].filter(Boolean).join(', ') || 'Chennai, Tamil Nadu, India' },
              { label: 'Enterprise Access', value: roleDisplay },
              { label: 'Account Status', value: 'Active & Verified', isStatus: true },
            ].map((item, idx) => (
              <Box
                key={idx}
                p="xs"
                px="sm"
                style={{
                  borderRadius: 10,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid #F1F5F9',
                }}
              >
                <Text size="11px" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.03em' }}>
                  {item.label}
                </Text>
                <Group gap="xs" mt={2} align="center">
                  <Text size="13.5px" fw={600} c={isDark ? '#F8FAFC' : '#0F172A'}>
                    {item.value}
                  </Text>
                  {item.isStatus && (
                    <Badge size="xs" color="teal" variant="light">
                      Verified
                    </Badge>
                  )}
                  {item.isCode && (
                    <Badge size="xs" color="indigo" variant="outline">
                      Official
                    </Badge>
                  )}
                </Group>
              </Box>
            ))}
          </SimpleGrid>

          {/* Professional Bio / Summary Callout */}
          <Box
            mt="md"
            p="sm"
            style={{
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.05)' : '#F5F7FF',
              borderLeft: '3px solid #6366F1',
            }}
          >
            <Text size="11px" c="indigo" fw={700} tt="uppercase" style={{ letterSpacing: '0.03em' }}>
              Professional Bio & Overview
            </Text>
            <Text size="13px" fw={500} mt={3} c={isDark ? '#CBD5E1' : '#334155'}>
              {profile.bio || `${profile.designation || 'Super Administrator'} overseeing enterprise CRM operations, client projects, and engineering infrastructure.`}
            </Text>
          </Box>
        </Paper>
      </Stack>

      {/* 4. COMPREHENSIVE EDIT PROFILE MODAL */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        size={isMobile ? '100%' : 'lg'}
        fullScreen={isSmallMobile}
        radius={isMobile ? 'md' : 'lg'}
        padding={isMobile ? 'md' : 'lg'}
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

            {/* Bottom Action Buttons (Sticky on mobile for ease of touch) */}
            <Box
              style={
                isMobile
                  ? {
                      position: 'sticky',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: isDark ? '#1A1B1E' : '#FFFFFF',
                      paddingTop: 12,
                      paddingBottom: 4,
                      borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #EAECF0',
                      marginTop: 16,
                      zIndex: 10,
                    }
                  : { marginTop: 16 }
              }
            >
              <Group justify="flex-end" grow={isMobile}>
                <Button variant="default" onClick={() => setEditModalOpened(false)} disabled={saving} radius="md">
                  Cancel
                </Button>
                <Button type="submit" color="indigo" loading={saving} radius="md">
                  Save Changes
                </Button>
              </Group>
            </Box>
          </Stack>
        </form>
      </Modal>
    </Box>
  );
};

export default UserProfileTab;
