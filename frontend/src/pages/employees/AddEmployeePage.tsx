import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Text,
  TextInput,
  PasswordInput,
  Autocomplete,
  Textarea,
  Button,
  UnstyledButton,
  Group,
  SimpleGrid,
  Stack,
  Badge,
  Divider,
  ThemeIcon,
  Progress,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconUserPlus,
  IconCheck,
  IconMail,
  IconPhone,
  IconUser,
  IconLock,
  IconTrash,
  IconBuilding,
  IconBriefcase,
  IconShield,
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconActivity,
  IconClock,
  IconHome,
  IconGenderBigender,
} from '@tabler/icons-react';
import { useEmployee } from '../../context/EmployeeContext';
import { Employee } from '../../types/employee';
import { CRM_COLORS } from '../../theme/colors';

export interface AddEmployeePageProps {
  onBack: () => void;
  initialData?: Employee | null;
}

export const AddEmployeePage: React.FC<AddEmployeePageProps> = ({
  onBack,
  initialData,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const normalInputStyles = {
    label: {
      fontWeight: 600,
      fontSize: '13px',
      marginBottom: '6px',
      color: isDark ? '#E2E8F0' : '#1E293B',
    },
    input: {
      borderRadius: '8px',
      fontSize: '14px',
      height: '42px',
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(15, 23, 42, 0.1)',
      color: isDark ? '#F8FAFC' : '#0F172A',
    },
    error: {
      fontSize: '12px',
      marginTop: '4px',
      fontWeight: 500,
    },
  };

  const { employees, addEmployee, updateEmployee } = useEmployee();
  const isEditing = Boolean(initialData && initialData.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    // 1. Personal & Contact Information
    name: string;
    empCode: string;
    phone: string;
    email: string;
    password: string;
    dob: string;
    gender: string;
    address: string;

    // 2. Job & Organization Details
    department: string;
    designation: string;
    role: string;
    reportingManager: string;
    joiningDate: string;
    employmentType: string;
    workLocation: string;
    status: string;
  }>({
    name: initialData?.name || '',
    empCode: initialData?.empCode || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    password: '',
    dob: initialData?.dob || '',
    gender: initialData?.gender || '',
    address: initialData?.address || '',

    department: initialData?.department || '',
    designation: initialData?.designation || '',
    role: initialData?.role || '',
    reportingManager: initialData?.reportingManager || '',
    joiningDate: initialData?.joiningDate || new Date().toISOString().split('T')[0],
    employmentType: initialData?.employmentType || '',
    workLocation: initialData?.workLocation || '',
    status: initialData?.status || 'Active',
  });

  // Auto-fill Employee ID code (Non-editable, sequential)
  useEffect(() => {
    if (!isEditing && !formData.empCode) {
      const numericCodes = employees
        .map((e) => {
          const match = e.empCode?.match(/EMP-(\d+)/i);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((n): n is number => n !== null);

      const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 1000;
      const nextCode = `EMP-${maxCode + 1}`;
      setFormData((prev) => ({ ...prev, empCode: nextCode }));
    }
  }, [employees, isEditing, formData.empCode]);

  // 100% Dynamic lists derived from active database records
  const dynamicDepartments = useMemo(() => {
    return Array.from(
      new Set(employees.map((e) => e.department?.trim()).filter(Boolean) as string[])
    ).sort();
  }, [employees]);

  const dynamicDesignations = useMemo(() => {
    return Array.from(
      new Set(employees.map((e) => e.designation?.trim()).filter(Boolean) as string[])
    ).sort();
  }, [employees]);

  const dynamicRoles = useMemo(() => {
    return Array.from(
      new Set(employees.map((e) => e.role?.trim()).filter(Boolean) as string[])
    ).sort();
  }, [employees]);

  const dynamicManagers = useMemo(() => {
    return employees
      .filter((e) => !isEditing || e.id !== initialData?.id)
      .map((e) => `${e.name} (${e.empCode})${e.designation ? ` - ${e.designation}` : ''}`);
  }, [employees, isEditing, initialData]);

  const dynamicEmploymentTypes = useMemo(() => {
    return Array.from(
      new Set(employees.map((e) => e.employmentType?.trim()).filter(Boolean) as string[])
    ).sort();
  }, [employees]);

  const dynamicLocations = useMemo(() => {
    return Array.from(
      new Set(employees.map((e) => e.workLocation?.trim()).filter(Boolean) as string[])
    ).sort();
  }, [employees]);

  const dynamicStatuses = useMemo(() => {
    return Array.from(
      new Set(employees.map((e) => e.status?.trim()).filter(Boolean) as string[])
    ).sort();
  }, [employees]);

  const dynamicGenders = useMemo(() => {
    return Array.from(
      new Set(employees.map((e) => e.gender?.trim()).filter(Boolean) as string[])
    ).sort();
  }, [employees]);

  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
  const [loading, setLoading] = useState(false);


  // Dynamic calculations for Live Preview & Readiness
  const nameValid = formData.name.trim().length >= 3;
  const empCodeDigits = formData.empCode.trim().toUpperCase();
  const isDuplicateEmpCode = employees.some((emp) => {
    if (isEditing && initialData?.id && emp.id === initialData.id) return false;
    return emp.empCode && emp.empCode.toUpperCase() === empCodeDigits;
  });
  const empCodeValid = empCodeDigits.length >= 3 && !isDuplicateEmpCode;

  const phoneDigits = formData.phone.replace(/\D/g, '');
  const isDuplicatePhone = employees.some((emp) => {
    if (isEditing && initialData?.id && emp.id === initialData.id) return false;
    const empDigits = (emp.phone || '').replace(/\D/g, '');
    return empDigits && empDigits === phoneDigits;
  });
  const phoneValid = /^[6-9]\d{9}$/.test(phoneDigits) && !isDuplicatePhone;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanEmail = formData.email.trim().toLowerCase();
  const isDuplicateEmail = employees.some((emp) => {
    if (isEditing && initialData?.id && emp.id === initialData.id) return false;
    return emp.email && emp.email.toLowerCase().trim() === cleanEmail;
  });
  const emailValid = emailRegex.test(formData.email.trim()) && !isDuplicateEmail;

  const hasPassLength = formData.password.length >= 6;
  const hasPassLetter = /[a-zA-Z]/.test(formData.password);
  const hasPassNumber = /\d/.test(formData.password);
  const isPassValid = hasPassLength && hasPassLetter && hasPassNumber;
  const passwordValid = isEditing ? (!formData.password || isPassValid) : isPassValid;

  // Mandatory fields count (Personal & Contact Credentials)
  const mandatoryChecks = [
    nameValid,
    empCodeValid,
    phoneValid,
    emailValid,
    passwordValid,
  ];

  const completedCount = mandatoryChecks.filter(Boolean).length;
  const totalFields = mandatoryChecks.length;
  const completionPercentage = Math.round((completedCount / totalFields) * 100);
  const isReady = completedCount === totalFields;

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(formData.name);

  // Field validator
  const validateField = (field: string, value: string) => {
    let error = '';
    const trimmed = (value || '').trim();

    // Section 1
    if (field === 'name') {
      if (!trimmed) error = 'Full Name is mandatory';
      else if (trimmed.length < 3) error = 'Full Name must be at least 3 characters';
    } else if (field === 'empCode') {
      if (!trimmed) {
        error = 'Employee ID is mandatory';
      } else {
        const dup = employees.some((emp) => {
          if (isEditing && initialData?.id && emp.id === initialData.id) return false;
          return emp.empCode && emp.empCode.toUpperCase() === trimmed.toUpperCase();
        });
        if (dup) error = 'An employee with this ID already exists';
      }
    } else if (field === 'phone') {
      const digits = (value || '').replace(/\D/g, '');
      if (!digits) {
        error = 'Phone Number is mandatory';
      } else if (digits.length !== 10) {
        error = 'Phone number must be exactly 10 digits';
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        error = 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9';
      } else {
        const dup = employees.some((emp) => {
          if (isEditing && initialData?.id && emp.id === initialData.id) return false;
          const empDigits = (emp.phone || '').replace(/\D/g, '');
          return empDigits && empDigits === digits;
        });
        if (dup) error = 'An employee with this phone number already exists';
      }
    } else if (field === 'email') {
      if (!trimmed) {
        error = 'Email is mandatory';
      } else if (!emailRegex.test(trimmed)) {
        error = 'Please enter a valid email address';
      } else {
        const dup = employees.some((emp) => {
          if (isEditing && initialData?.id && emp.id === initialData.id) return false;
          return emp.email && emp.email.toLowerCase().trim() === trimmed.toLowerCase();
        });
        if (dup) error = 'An employee with this email address already exists';
      }
    } else if (field === 'password') {
      if (!isEditing) {
        if (!value) {
          error = 'Login Password is mandatory';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        } else if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
          error = 'Password must contain at least 1 letter and 1 number';
        }
      } else if (value) {
        if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        } else if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
          error = 'Password must contain at least 1 letter and 1 number';
        }
      }
    }

    setErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[field] = error;
      } else {
        delete updated[field];
      }
      return updated;
    });

    return !error;
  };

  const validateAll = () => {
    const newErrors: { [key: string]: string | undefined } = {};

    // 1. Personal & Contact (Mandatory)
    if (!formData.name.trim()) newErrors.name = 'Full Name is mandatory';
    else if (formData.name.trim().length < 3) newErrors.name = 'Full Name must be at least 3 characters';

    let currentEmpCode = formData.empCode.trim();
    if (!currentEmpCode) {
      const numericCodes = employees
        .map((e) => {
          const match = e.empCode?.match(/EMP-(\d+)/i);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((n): n is number => n !== null);
      const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 1000;
      currentEmpCode = `EMP-${maxCode + 1}`;
      setFormData((prev) => ({ ...prev, empCode: currentEmpCode }));
    }

    const digits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim() || !digits) {
      newErrors.phone = 'Phone Number is mandatory';
    } else if (digits.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    } else if (!/^[6-9]\d{9}$/.test(digits)) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9';
    } else {
      const dup = employees.some((emp) => {
        if (isEditing && initialData?.id && emp.id === initialData.id) return false;
        const empDigits = (emp.phone || '').replace(/\D/g, '');
        return empDigits && empDigits === digits;
      });
      if (dup) newErrors.phone = 'An employee with this phone number already exists';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is mandatory';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    } else {
      const dup = employees.some((emp) => {
        if (isEditing && initialData?.id && emp.id === initialData.id) return false;
        return emp.email && emp.email.toLowerCase().trim() === formData.email.trim().toLowerCase();
      });
      if (dup) newErrors.email = 'An employee with this email address already exists';
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Login Password is mandatory';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      } else if (!/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
        newErrors.password = 'Password must contain at least 1 letter and 1 number';
      }
    } else if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      } else if (!/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
        newErrors.password = 'Password must contain at least 1 letter and 1 number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      return;
    }

    setLoading(true);
    let success = false;
    if (isEditing && initialData?.id) {
      success = await updateEmployee(initialData.id, formData);
    } else {
      success = await addEmployee(formData);
    }
    setLoading(false);

    if (success) {
      onBack();
    }
  };

  const paperBg = isDark ? '#111827' : '#FFFFFF';
  const paperBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0';
  const paperShadow = isDark ? '0 12px 36px rgba(0, 0, 0, 0.45)' : '0 2px 8px -2px rgba(0, 0, 0, 0.05)';
  const headingColor = isDark ? '#F8FAFC' : '#0F172A';
  const backBtnColor = isDark ? '#94A3B8' : '#475569';
  const backBtnHover = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <Box>
      {/* 1. Top Navigation */}
      <Group justify="flex-start" align="center" mb="lg">
        <UnstyledButton
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: backBtnColor,
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            padding: '4px 0',
            transition: 'color 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = backBtnHover;
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = backBtnColor;
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <IconArrowLeft size={18} stroke={2.2} />
          <Text fw={600} size="14px" style={{ color: 'inherit' }}>
            Back to Employee Directory
          </Text>
        </UnstyledButton>
      </Group>

      {/* 2. Main Form Layout */}
      <form onSubmit={handleSubmit} noValidate autoComplete="off">
        <Box style={{ maxWidth: 960, margin: '0 auto' }}>
          <Stack gap="xl">
            {/* SECTION 1: Personal & Contact Information */}
            <Paper
              p="xl"
              radius="lg"
              style={{
                background: paperBg,
                border: paperBorder,
                boxShadow: paperShadow,
              }}
            >
              <Group gap="sm" mb="xl">
                <ThemeIcon size={40} radius="md" variant="light" color="blue">
                  <IconUserPlus size={22} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="md" style={{ color: headingColor }}>
                    Personal & Contact Information
                  </Text>
                  <Text size="xs" c="dimmed">
                    Enter basic identity, login access, and contact coordinates
                  </Text>
                </div>
              </Group>

              <Stack gap="lg">
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {/* 1. Full Name */}
                    <TextInput
                      label="Full Name"
                      placeholder="Enter full name"
                      required
                      withAsterisk
                      autoComplete="off"
                      leftSection={<IconUser size={16} color="#64748B" />}
                      value={formData.name}
                      error={errors.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, name: val });
                        if (errors.name) validateField('name', val);
                      }}
                      onBlur={() => validateField('name', formData.name)}
                      styles={normalInputStyles}
                    />

                    {/* 2. Phone Number */}
                    <TextInput
                      label="Phone Number"
                      placeholder="10-digit mobile number"
                      required
                      withAsterisk
                      maxLength={10}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="off"
                      leftSection={<IconPhone size={16} color="#64748B" />}
                      rightSection={
                        formData.phone ? (
                          <Text
                            size="11px"
                            fw={600}
                            c={formData.phone.length === 10 && /^[6-9]\d{9}$/.test(formData.phone) ? 'teal' : 'dimmed'}
                            pr={10}
                          >
                            {formData.phone.length}/10
                          </Text>
                        ) : null
                      }
                      value={formData.phone}
                      error={errors.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: digits });
                        validateField('phone', digits);
                      }}
                      onBlur={() => validateField('phone', formData.phone)}
                      styles={normalInputStyles}
                    />

                    {/* 3. Email */}
                    <TextInput
                      label="Email"
                      placeholder="Enter email"
                      required
                      withAsterisk
                      type="email"
                      autoComplete="off"
                      leftSection={<IconMail size={16} color="#64748B" />}
                      value={formData.email}
                      error={errors.email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, email: val });
                        validateField('email', val);
                      }}
                      onBlur={() => validateField('email', formData.email)}
                      styles={normalInputStyles}
                    />

                    {/* 5. Login Password */}
                    <PasswordInput
                      label={isEditing ? 'New Password (Optional)' : 'Login Password'}
                      placeholder={isEditing ? 'Leave blank to keep unchanged' : 'Enter password'}
                      required={!isEditing}
                      withAsterisk={!isEditing}
                      autoComplete="new-password"
                      leftSection={<IconLock size={16} color="#64748B" />}
                      value={formData.password}
                      error={errors.password}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, password: val });
                        if (errors.password) validateField('password', val);
                      }}
                      onBlur={() => validateField('password', formData.password)}
                      styles={normalInputStyles}
                    />

                    {/* 6. Date of Birth */}
                    <TextInput
                      label="Date of Birth (Optional)"
                      placeholder="YYYY-MM-DD"
                      type="date"
                      autoComplete="off"
                      leftSection={<IconCalendar size={16} color="#64748B" />}
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      styles={normalInputStyles}
                    />

                    {/* 7. Gender */}
                    <Autocomplete
                      label="Gender (Optional)"
                      placeholder="Type or select gender"
                      data={dynamicGenders}
                      leftSection={<IconGenderBigender size={16} color="#64748B" />}
                      value={formData.gender}
                      onChange={(val) => setFormData({ ...formData, gender: val })}
                      styles={normalInputStyles}
                      maxDropdownHeight={220}
                    />

                    {/* 8. Address */}
                    <Box style={{ gridColumn: 'span 2' }}>
                      <Textarea
                        label="Address (Optional)"
                        placeholder="Enter residential or permanent address"
                        minRows={2}
                        autosize
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        styles={normalInputStyles}
                      />
                    </Box>
                  </SimpleGrid>
                </Stack>
              </Paper>

              {/* SECTION 2: Job & Organization Details */}
              <Paper
                p="xl"
                radius="lg"
                style={{
                  background: paperBg,
                  border: paperBorder,
                  boxShadow: paperShadow,
                }}
              >
                <Group gap="sm" mb="xl">
                  <ThemeIcon size={40} radius="md" variant="light" color="indigo">
                    <IconBriefcase size={22} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="md" style={{ color: headingColor }}>
                      Job & Organization Details
                    </Text>
                    <Text size="xs" c="dimmed">
                      Configure employee role, organizational alignment, and employment terms
                    </Text>
                  </div>
                </Group>

                <Stack gap="lg">
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {/* 1. Department */}
                    <Autocomplete
                      label="Department"
                      placeholder="Type or select department"
                      data={dynamicDepartments}
                      leftSection={<IconBuilding size={16} color="#64748B" />}
                      value={formData.department}
                      onChange={(val) => setFormData({ ...formData, department: val })}
                      styles={normalInputStyles}
                      maxDropdownHeight={220}
                    />

                    {/* 2. Designation */}
                    <Autocomplete
                      label="Designation"
                      placeholder="e.g. Senior Software Engineer"
                      data={dynamicDesignations}
                      leftSection={<IconBriefcase size={16} color="#64748B" />}
                      value={formData.designation}
                      onChange={(val) => setFormData({ ...formData, designation: val })}
                      styles={normalInputStyles}
                      maxDropdownHeight={220}
                    />

                    {/* 3. System Role */}
                    <Autocomplete
                      label="Role"
                      placeholder="Type or select role"
                      data={dynamicRoles}
                      leftSection={<IconShield size={16} color="#64748B" />}
                      value={formData.role}
                      onChange={(val) => setFormData({ ...formData, role: val })}
                      styles={normalInputStyles}
                      maxDropdownHeight={220}
                    />

                    {/* 4. Reporting Manager */}
                    <Autocomplete
                      label="Reporting Manager (Optional)"
                      placeholder="Type or select manager / supervisor"
                      data={dynamicManagers}
                      leftSection={<IconUsers size={16} color="#64748B" />}
                      value={formData.reportingManager}
                      onChange={(val) => setFormData({ ...formData, reportingManager: val })}
                      styles={normalInputStyles}
                      maxDropdownHeight={220}
                    />

                    {/* 5. Date of Joining */}
                    <TextInput
                      label="Date of Joining"
                      placeholder="YYYY-MM-DD"
                      type="date"
                      leftSection={<IconCalendar size={16} color="#64748B" />}
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      styles={normalInputStyles}
                    />

                    {/* 6. Employment Type */}
                    <Autocomplete
                      label="Employment Type"
                      placeholder="Type or select employment type"
                      data={dynamicEmploymentTypes}
                      leftSection={<IconClock size={16} color="#64748B" />}
                      value={formData.employmentType}
                      onChange={(val) => setFormData({ ...formData, employmentType: val })}
                      styles={normalInputStyles}
                      maxDropdownHeight={220}
                    />

                    {/* 7. Work Location */}
                    <Autocomplete
                      label="Work Location"
                      placeholder="Type or select branch / city"
                      data={dynamicLocations}
                      leftSection={<IconMapPin size={16} color="#64748B" />}
                      value={formData.workLocation}
                      onChange={(val) => setFormData({ ...formData, workLocation: val })}
                      styles={normalInputStyles}
                      maxDropdownHeight={220}
                    />

                    {/* 8. Employee Status */}
                    <Autocomplete
                      label="Employee Status"
                      placeholder="Type or select employee status"
                      data={dynamicStatuses}
                      leftSection={<IconActivity size={16} color="#64748B" />}
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val })}
                      styles={normalInputStyles}
                      maxDropdownHeight={220}
                    />
                  </SimpleGrid>
                </Stack>
              </Paper>

              {/* Bottom Action Buttons */}
              <Group justify="flex-end" gap="sm" mt="sm">
                <Button
                  variant="default"
                  size="sm"
                  radius="md"
                  onClick={onBack}
                  style={{
                    fontWeight: 600,
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                    color: isDark ? '#CBD5E1' : '#475569',
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  radius="md"
                  loading={loading}
                  leftSection={<IconCheck size={16} />}
                  style={{
                    background: isDark ? '#3B82F6' : '#0F172A',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    minWidth: 150,
                    boxShadow: isDark ? '0 4px 14px rgba(59, 130, 246, 0.35)' : undefined,
                  }}
                >
                  {isEditing ? 'Save Changes' : 'Add Employee'}
                </Button>
              </Group>
            </Stack>
          </Box>
        </form>
    </Box>
  );
};

export default AddEmployeePage;
