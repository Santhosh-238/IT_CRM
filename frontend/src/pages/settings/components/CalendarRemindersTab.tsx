import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Stack,
  Group,
  Text,
  Button,
  Badge,
  TextInput,
  Textarea,
  Select,
  Modal,
  LoadingOverlay,
  ActionIcon,
  UnstyledButton,
  Divider,
  Checkbox,
  ThemeIcon,
  Menu,
  Tooltip,
  Avatar,
  ScrollArea,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconCalendar,
  IconClock,
  IconPlus,
  IconPencil,
  IconTrash,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconLock,
  IconShieldLock,
  IconUser,
  IconUsers,
  IconX,
  IconCalendarEvent,
  IconBellRinging,
  IconFilter,
  IconNotes,
  IconTag,
  IconArrowRight,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useCRM } from '../../../context/CRMContext';
import { usePermissions } from '../../../context/AccessControlContext';
import { ReminderItem, ReminderFormData } from '../../../types/settings';
import { Employee } from '../../../types/employee';
import { settingsService } from '../../../services/settingsService';
import { fetchEmployeesApi } from '../../../services/employeeService';

const TIME_OPTIONS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '12:00 PM',
  '01:30 PM',
  '02:00 PM',
  '03:30 PM',
  '04:00 PM',
  '05:00 PM',
  '06:30 PM',
  '08:00 PM',
];

const PRIORITY_OPTIONS = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

const CATEGORY_OPTIONS = [
  'Client Follow-up',
  'Project Milestone',
  'Executive Review',
  'Internal Task',
  'Personal',
  'Other',
];

const STANDARD_CATEGORIES = ['Client Follow-up', 'Project Milestone', 'Executive Review', 'Internal Task', 'Personal'];

export const CalendarRemindersTab: React.FC = () => {
  const { currentUser } = useCRM();
  const { isSuperAdmin } = usePermissions();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    try {
      const cached = sessionStorage.getItem('crm_cached_reminders');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('crm_cached_reminders');
    } catch {
      return false;
    }
  });
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const cached = sessionStorage.getItem('crm_cached_calendar_employees');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Date Helpers
  const getLocalDateIso = (d: Date = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    try {
      const stored = sessionStorage.getItem('crm_selected_reminder_date');
      if (stored) {
        sessionStorage.removeItem('crm_selected_reminder_date');
        return stored;
      }
    } catch {}
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  // Form State - No pre-selected default values, user selects explicitly
  const todayIso = getLocalDateIso();
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    date: todayIso,
    time: '',
    priority: '',
    category: '',
    notes: '',
    assignedToName: 'Super Administrator',
  });
  const [customCategory, setCustomCategory] = useState('');

  // Standard category list reference
  const standardCategories = STANDARD_CATEGORIES;

  // Web Audio Synth chime for alerts
  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext unavailable
    }
  };

  // Load reminders from backend
  const loadReminders = async (showLoadingOverlay = true) => {
    if (showLoadingOverlay && reminders.length === 0) setLoading(true);
    try {
      const res = await settingsService.getReminders();
      if (res.success && Array.isArray(res.data)) {
        setReminders(res.data);
        try {
          sessionStorage.setItem('crm_cached_reminders', JSON.stringify(res.data));
        } catch {}
      }
    } catch (err: any) {
      if (showLoadingOverlay && reminders.length === 0) {
        notifications.show({
          title: 'Error Loading Reminders',
          message: err.message || 'Could not fetch your reminders',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load employees from backend API for calendar employee filtering
  const loadEmployees = async () => {
    if (employees.length === 0) setLoadingEmployees(true);
    try {
      const res = await fetchEmployeesApi();
      if (res && Array.isArray(res.data)) {
        setEmployees(res.data);
        try {
          sessionStorage.setItem('crm_cached_calendar_employees', JSON.stringify(res.data));
        } catch {}
        // Check if there was a saved employee filter in sessionStorage (Super Admin only)
        if (isSuperAdmin) {
          try {
            const savedEmpId = sessionStorage.getItem('crm_selected_reminder_emp_id');
            if (savedEmpId) {
              const found = res.data.find((e) => e.id === savedEmpId);
              if (found) {
                setSelectedEmployee(found);
                return;
              }
            }
          } catch {}
        } else {
          // If current logged-in user is an employee (not Super Admin), auto-select and lock to their profile
          const myEmp = res.data.find(
            (e) =>
              (currentUser.email && e.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
              (currentUser.name && e.name?.toLowerCase() === currentUser.name.toLowerCase())
          );
          if (myEmp) {
            setSelectedEmployee(myEmp);
          } else {
            setSelectedEmployee({
              id: currentUser.id || 'me',
              name: currentUser.name || 'My Reminders',
              email: currentUser.email || '',
              role: currentUser.role || 'Employee',
              designation: currentUser.department || 'Employee',
              empCode: 'EMP-ME',
              department: currentUser.department || 'Engineering',
            } as any);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load employees for calendar:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    loadReminders(true);
    loadEmployees();

    const handleRemindersUpdated = () => {
      loadReminders(false);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crm_reminder_broadcast') {
        loadReminders(false);
      }
    };

    const handleOpenCalendarDate = (e: any) => {
      const targetDate = e?.detail?.date;
      if (targetDate) {
        setSelectedDateStr(targetDate);
        const parts = targetDate.split('-');
        if (parts.length === 3) {
          setCurrentDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
        }
      }
    };

    window.addEventListener('crm_reminders_updated', handleRemindersUpdated);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('crm_open_calendar_date', handleOpenCalendarDate);

    // Auto-poll reminders every 12 seconds so updates from other sessions appear dynamically
    const pollInterval = setInterval(() => {
      loadReminders(false);
    }, 12000);

    return () => {
      window.removeEventListener('crm_reminders_updated', handleRemindersUpdated);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('crm_open_calendar_date', handleOpenCalendarDate);
      clearInterval(pollInterval);
    };
  }, [currentUser, isSuperAdmin]);

  const handleSelectEmployee = (emp: Employee) => {
    if (!isSuperAdmin) return;
    setSelectedEmployee(emp);
    try {
      sessionStorage.setItem('crm_selected_reminder_emp_id', emp.id);
    } catch {}
  };

  const handleClearEmployeeFilter = () => {
    if (!isSuperAdmin) return;
    setSelectedEmployee(null);
    try {
      sessionStorage.removeItem('crm_selected_reminder_emp_id');
    } catch {}
  };

  // Open modal for new reminder (fresh empty fields, no pre-selects)
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      date: selectedDateStr || todayIso,
      time: '',
      priority: '',
      category: '',
      notes: '',
      assignedToName: selectedEmployee ? selectedEmployee.name : 'Super Administrator',
    });
    setCustomCategory('');
    setModalOpened(true);
  };

  // Open modal for editing existing reminder
  const handleOpenEdit = (rem: ReminderItem) => {
    setEditingId(rem.id);
    const isStandard = standardCategories.includes(rem.category);
    setFormData({
      title: rem.title,
      date: rem.date,
      time: rem.time || '',
      priority: rem.priority,
      category: isStandard ? rem.category : 'Other',
      notes: rem.notes || '',
      assignedToName: rem.assignedToName || 'Super Administrator',
    });
    setCustomCategory(isStandard ? '' : rem.category);
    setModalOpened(true);
  };

  // Save Reminder (Create or Update)
  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      notifications.show({ title: 'Validation Error', message: 'Please enter a reminder title', color: 'red' });
      return;
    }
    if (!formData.date) {
      notifications.show({ title: 'Validation Error', message: 'Please select a scheduled date', color: 'red' });
      return;
    }
    if (!formData.time) {
      notifications.show({ title: 'Validation Error', message: 'Please select a scheduled time', color: 'red' });
      return;
    }
    if (!formData.priority) {
      notifications.show({ title: 'Validation Error', message: 'Please select a priority (High, Medium, or Low)', color: 'red' });
      return;
    }
    if (!formData.category) {
      notifications.show({ title: 'Validation Error', message: 'Please select a category', color: 'red' });
      return;
    }
    if (formData.category === 'Other' && !customCategory.trim()) {
      notifications.show({ title: 'Validation Error', message: 'Please type your custom category name', color: 'red' });
      return;
    }

    const finalCategory = formData.category === 'Other' ? customCategory.trim() : formData.category;
    const assignedEmp = employees.find((e) => e.name === formData.assignedToName);
    const submissionData = {
      ...formData,
      priority: formData.priority as 'High' | 'Medium' | 'Low',
      category: finalCategory,
      assignedToId: assignedEmp ? assignedEmp.id : undefined,
      assignedEmployeeId: assignedEmp ? assignedEmp.id : undefined,
      assignedToEmail: assignedEmp?.email || undefined,
      assignedToName: formData.assignedToName || 'Super Administrator',
    };

    setSaving(true);
    try {
      if (editingId) {
        const res = await settingsService.updateReminder(editingId, submissionData);
        if (res.success && res.data) {
          setReminders((prev) => prev.map((r) => (r.id === editingId ? res.data : r)));
          setSelectedDateStr(submissionData.date);
          notifications.show({
            title: 'Reminder Updated',
            message: `Confidential reminder updated for ${submissionData.assignedToName || 'Super Admin'}.`,
            color: 'teal',
            icon: <IconCheck size={18} />,
          });

          // Broadcast real-time update across all tabs and components
          window.dispatchEvent(new CustomEvent('crm_reminders_updated', { detail: res.data }));
          try {
            localStorage.setItem(
              'crm_reminder_broadcast',
              JSON.stringify({ reminder: res.data, action: 'update', timestamp: Date.now() })
            );
          } catch {}
        }
      } else {
        const res = await settingsService.createReminder(submissionData);
        if (res.success && res.data) {
          setReminders((prev) => [res.data, ...prev]);
          setSelectedDateStr(submissionData.date);
          const parts = submissionData.date.split('-');
          if (parts.length === 3) {
            setCurrentDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
          }
          notifications.show({
            title: 'Reminder Scheduled',
            message: `Reminder added for ${submissionData.assignedToName || 'Super Admin'}. Alert will notify dynamically!`,
            color: 'teal',
            icon: <IconCheck size={18} />,
          });
          playAlertChime();

          // Broadcast real-time update across all tabs and components
          window.dispatchEvent(new CustomEvent('crm_reminders_updated', { detail: res.data }));
          try {
            localStorage.setItem(
              'crm_reminder_broadcast',
              JSON.stringify({ reminder: res.data, action: 'create', timestamp: Date.now() })
            );
          } catch {}
        }
      }
      setModalOpened(false);
    } catch (err: any) {
      notifications.show({
        title: 'Save Failed',
        message: err.message || 'Failed to save reminder',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle complete status
  const handleToggleComplete = async (rem: ReminderItem) => {
    const updatedStatus = !rem.completed;
    try {
      const res = await settingsService.updateReminder(rem.id, { completed: updatedStatus });
      if (res.success) {
        setReminders((prev) => prev.map((r) => (r.id === rem.id ? { ...r, completed: updatedStatus } : r)));
        notifications.show({
          title: updatedStatus ? 'Completed' : 'Reopened',
          message: updatedStatus ? `Marked "${rem.title}" as completed` : `Reopened "${rem.title}"`,
          color: updatedStatus ? 'teal' : 'blue',
          icon: <IconCheck size={16} />,
        });

        // Broadcast real-time update
        window.dispatchEvent(new CustomEvent('crm_reminders_updated', { detail: res.data }));
        try {
          localStorage.setItem(
            'crm_reminder_broadcast',
            JSON.stringify({ reminder: res.data, action: 'toggle', timestamp: Date.now() })
          );
        } catch {}
      }
    } catch (err: any) {
      notifications.show({ title: 'Update Error', message: err.message, color: 'red' });
    }
  };

  // Delete reminder
  const handleDeleteReminder = async (id: string, title: string) => {
    try {
      const res = await settingsService.deleteReminder(id);
      if (res.success) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
        notifications.show({
          title: 'Deleted',
          message: `Removed "${title}" from schedule.`,
          color: 'gray',
        });

        // Broadcast real-time update
        window.dispatchEvent(new CustomEvent('crm_reminders_updated', { detail: { id } }));
        try {
          localStorage.setItem(
            'crm_reminder_broadcast',
            JSON.stringify({ id, action: 'delete', timestamp: Date.now() })
          );
        } catch {}
      }
    } catch (err: any) {
      notifications.show({ title: 'Delete Error', message: err.message, color: 'red' });
    }
  };

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(getLocalDateIso(now));
  };

  // Format date for Agenda header: "21 Oct 2026"
  const formatAgendaDate = (dateStr?: string) => {
    try {
      if (!dateStr || typeof dateStr !== 'string') return '';
      const [y, m, d] = dateStr.split('-');
      if (!y || !m || !d) return dateStr || '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
    } catch {
      return dateStr || '';
    }
  };

  // Filter reminders based on selected employee
  const filteredReminders = useMemo(() => {
    if (!Array.isArray(reminders)) return [];

    if (selectedEmployee) {
      const empId = selectedEmployee.id?.toLowerCase().trim();
      const empCode = selectedEmployee.empCode?.toLowerCase().trim();
      const empName = selectedEmployee.name?.toLowerCase().trim();
      const empEmail = selectedEmployee.email?.toLowerCase().trim();

      return reminders.filter((r) => {
        if (!r) return false;
        const rCreatedById = (r.createdById || '').toLowerCase().trim();
        const rCreatedByName = (r.createdByName || '').toLowerCase().trim();
        const rCreatedByEmail = (r.createdByEmail || '').toLowerCase().trim();
        const rAssignedToId = (r.assignedToId || '').toLowerCase().trim();
        const rAssignedUserId = (r.assignedUserId || '').toLowerCase().trim();
        const rAssignedEmpId = (r.assignedEmployeeId || '').toLowerCase().trim();
        const rAssignedToName = (r.assignedToName || '').toLowerCase().trim();
        const rAssignedToEmail = (r.assignedToEmail || '').toLowerCase().trim();

        // Check if reminder was added/created by this employee:
        const isCreatedBy =
          (empId && (rCreatedById === empId || rCreatedById === empCode)) ||
          (empEmail && rCreatedByEmail === empEmail) ||
          (empName && rCreatedByName === empName);

        // Or assigned to this employee:
        const isAssignedTo =
          (empId && (rAssignedToId === empId || rAssignedEmpId === empId || rAssignedUserId === empId)) ||
          (empEmail && rAssignedToEmail === empEmail) ||
          (empName && rAssignedToName === empName);

        return isCreatedBy || isAssignedTo;
      });
    }

    return reminders.filter(Boolean);
  }, [reminders, selectedEmployee]);

  // Map reminders by date
  const remindersByDate = useMemo(() => {
    const map: Record<string, ReminderItem[]> = {};
    filteredReminders.forEach((r) => {
      if (r && r.date) {
        if (!map[r.date]) map[r.date] = [];
        map[r.date].push(r);
      }
    });
    return map;
  }, [filteredReminders]);

  // Reminders for currently selected date
  const selectedDateReminders = useMemo(() => {
    return (selectedDateStr && remindersByDate[selectedDateStr]) || [];
  }, [remindersByDate, selectedDateStr]);

  const cardStyle = {
    backgroundColor: isDark ? '#111827' : '#FFFFFF',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECF0',
    borderRadius: '16px',
    boxShadow: isDark ? 'none' : '0 1px 3px rgba(16, 24, 40, 0.05)',
  };

  const userRoleDisplay = currentUser?.role === 'SUPER_ADMIN' ? 'Admin' : currentUser?.role || 'Admin';

  return (
    <Box style={{ width: '100%', maxWidth: 1160 }}>
      {/* 1. Header Bar matching screenshot */}
      <Group justify="space-between" align="center" mb="xl" wrap="wrap" gap="md">
        <Group gap="md" align="center">
          <Box
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.28)',
            }}
          >
            <IconCalendar size={24} stroke={2} />
          </Box>
          <Box>
            <Text
              fw={800}
              size="24px"
              style={{
                color: isDark ? '#F8FAFC' : '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Calendar & Reminders
            </Text>
            <Text size="13px" c={isDark ? '#94A3B8' : '#64748B'} mt={3}>
              View dynamic shop follow-ups and schedule custom reminders
            </Text>
          </Box>
        </Group>

        <Group gap="sm">
          {/* Employee Filter: Full dropdown ONLY for Super Admin; Personal Name Pill for other employees */}
          {isSuperAdmin ? (
            <Menu shadow="md" width={280} position="bottom-end" radius="md" withArrow>
              <Menu.Target>
                <UnstyledButton
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #EAECF0',
                    borderRadius: 100,
                    padding: '7px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: isDark ? 'none' : '0 1px 2px rgba(16, 24, 40, 0.04)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F8FAFC';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF';
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#EAECF0';
                  }}
                >
                  {selectedEmployee ? (
                    <Group gap={6} align="center">
                      <Avatar
                        size={22}
                        radius="xl"
                        color="indigo"
                        styles={{ placeholder: { fontSize: 10, fontWeight: 700 } }}
                      >
                        {selectedEmployee.name.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#1E1B4B' }}>
                        {selectedEmployee.name}
                      </Text>
                      <Badge size="xs" variant="light" color="indigo" radius="sm">
                        {selectedEmployee.role || 'Employee'}
                      </Badge>
                    </Group>
                  ) : (
                    <Group gap={6} align="center">
                      <IconUsers size={16} color={isDark ? '#94A3B8' : '#4F46E5'} />
                      <Text size="13px" fw={600} style={{ color: isDark ? '#F8FAFC' : '#334155' }}>
                        All Employees
                      </Text>
                    </Group>
                  )}
                  <IconChevronDown size={14} color="#94A3B8" />
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown style={{ maxHeight: 420, overflowY: 'auto' }}>
                <Menu.Label>Filter by Employee</Menu.Label>

                <Menu.Item
                  leftSection={<IconUsers size={16} color="#4F46E5" />}
                  rightSection={!selectedEmployee ? <IconCheck size={14} color="#4F46E5" /> : null}
                  onClick={() => handleClearEmployeeFilter()}
                  style={{
                    backgroundColor: !selectedEmployee
                      ? isDark
                        ? 'rgba(99, 102, 241, 0.16)'
                        : '#EEF2FF'
                      : undefined,
                  }}
                >
                  <div>
                    <Text size="13px" fw={600} style={{ color: !selectedEmployee ? '#4F46E5' : undefined }}>
                      All Employees
                    </Text>
                    <Text size="11px" c="dimmed">
                      View reminders for all team members
                    </Text>
                  </div>
                </Menu.Item>

                <Menu.Divider />

                {/* Dynamic Employee List */}
                <Menu.Label>Team Members</Menu.Label>
                {employees.length === 0 ? (
                  <Box px="sm" py={6}>
                    <Text size="xs" c="dimmed">
                      {loadingEmployees ? 'Loading team members...' : 'No employees found'}
                    </Text>
                  </Box>
                ) : (
                  employees.map((emp) => {
                    const isEmpSelected = selectedEmployee?.id === emp.id;
                    const initials = emp.name
                      ? emp.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'EM';

                    // Count reminders created by or assigned to this employee
                    const empReminderCount = reminders.filter((r) => {
                      if (!r) return false;
                      const rId = (r.createdById || '').toLowerCase();
                      const rName = (r.createdByName || '').toLowerCase().trim();
                      const rEmail = (r.createdByEmail || '').toLowerCase().trim();
                      const eId = emp.id?.toLowerCase();
                      const eCode = emp.empCode?.toLowerCase();
                      const eName = emp.name?.toLowerCase().trim();
                      const eEmail = emp.email?.toLowerCase().trim();
                      return (
                        (eId && rId === eId) ||
                        (eCode && rId === eCode) ||
                        (eEmail && rEmail === eEmail) ||
                        (eName && rName === eName)
                      );
                    }).length;

                    return (
                      <Menu.Item
                        key={emp.id}
                        leftSection={
                          <Avatar
                            size={24}
                            radius="xl"
                            color="indigo"
                            styles={{ placeholder: { fontSize: 10, fontWeight: 700 } }}
                          >
                            {initials}
                          </Avatar>
                        }
                        rightSection={
                          <Group gap={6}>
                            {empReminderCount > 0 && (
                              <Badge size="xs" variant="light" color={isEmpSelected ? 'indigo' : 'gray'}>
                                {empReminderCount}
                              </Badge>
                            )}
                            {isEmpSelected ? <IconCheck size={14} color="#4F46E5" /> : null}
                          </Group>
                        }
                        onClick={() => handleSelectEmployee(emp)}
                        style={{
                          backgroundColor: isEmpSelected
                            ? isDark
                              ? 'rgba(99, 102, 241, 0.16)'
                              : '#EEF2FF'
                            : undefined,
                        }}
                      >
                        <div>
                          <Text size="13px" fw={600} style={{ color: isEmpSelected ? '#4F46E5' : undefined }}>
                            {emp.name}
                          </Text>
                          <Text size="11px" c="dimmed">
                            {emp.designation || emp.role} • {emp.empCode}
                          </Text>
                        </div>
                      </Menu.Item>
                    );
                  })
                )}

                <Menu.Divider />

                <Menu.Item
                  leftSection={<IconPlus size={16} color="#4F46E5" />}
                  onClick={handleOpenAdd}
                >
                  <Text size="13px" fw={600} c="indigo">
                    + Schedule New Reminder
                  </Text>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            /* Non-Super Admin: Display their own name badge only */
            <Box
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #EAECF0',
                borderRadius: 100,
                padding: '7px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: isDark ? 'none' : '0 1px 2px rgba(16, 24, 40, 0.04)',
              }}
            >
              <Avatar
                size={22}
                radius="xl"
                color="indigo"
                styles={{ placeholder: { fontSize: 10, fontWeight: 700 } }}
              >
                {(selectedEmployee?.name || currentUser?.name || 'ME').slice(0, 2).toUpperCase()}
              </Avatar>
              <Text size="13px" fw={700} style={{ color: isDark ? '#F8FAFC' : '#1E1B4B' }}>
                {selectedEmployee?.name || currentUser?.name || 'My Reminders'}
              </Text>
              <Badge size="xs" variant="light" color="indigo" radius="sm">
                {selectedEmployee?.role || selectedEmployee?.designation || currentUser?.role || 'Employee'}
              </Badge>
            </Box>
          )}

          {/* + Add Reminder Button */}
          <Button
            color="indigo"
            radius="md"
            leftSection={<IconPlus size={16} />}
            onClick={handleOpenAdd}
            style={{
              backgroundColor: '#4F46E5',
              fontWeight: 600,
              height: 40,
              padding: '0 20px',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              cursor: 'pointer',
            }}
          >
            Add Reminder
          </Button>
        </Group>
      </Group>

      {/* 2. Main 2-Column Workspace matching screenshot */}
      <Box
        pos="relative"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ blur: 1 }} />
        {/* LEFT COLUMN: MONTHLY CALENDAR GRID */}
        <Paper p="xl" style={cardStyle}>
          {/* Calendar Card Header: Month + Today Pill + Nav arrows */}
          <Group justify="space-between" align="center" mb="lg">
            <Group gap="xs" align="center">
              <Text fw={800} size="20px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
                {monthNames[month]} {year}
              </Text>
              <UnstyledButton
                onClick={goToToday}
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                  color: isDark ? '#CBD5E1' : '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 14px',
                  borderRadius: 100,
                  transition: 'all 0.15s ease',
                }}
              >
                Today
              </UnstyledButton>
            </Group>

            <Group
              gap={0}
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECF0',
                borderRadius: 100,
                padding: '2px 4px',
              }}
            >
              <ActionIcon variant="subtle" color="gray" size="sm" radius="xl" onClick={prevMonth} aria-label="Previous month">
                <IconChevronLeft size={16} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="gray" size="sm" radius="xl" onClick={nextMonth} aria-label="Next month">
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>
          </Group>

          {/* Weekday Row Header (SUN, MON, TUE, WED, THU, FRI, SAT) */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <Text key={d} size="11px" fw={700} c="#94A3B8" style={{ letterSpacing: '0.05em' }}>
                {d}
              </Text>
            ))}
          </Box>

          {/* Calendar Month Day Cells */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 10,
            }}
          >
            {/* Empty leading cells */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <Box
                key={`empty-${i}`}
                style={{
                  height: 74,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.015)' : '#FAFAFA',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.03)' : '1px solid #F8FAFC',
                }}
              />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDateStr === dateKey;
              const isToday = dateKey === todayIso;
              const dayReminders = remindersByDate[dateKey] || [];
              const hasReminders = dayReminders.length > 0;

              return (
                <Box
                  key={dateKey}
                  onClick={() => setSelectedDateStr(dateKey)}
                  style={{
                    height: 74,
                    borderRadius: 14,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    position: 'relative',
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(99, 102, 241, 0.16)'
                        : '#F5F3FF'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.02)'
                      : '#FFFFFF',
                    border: isSelected
                      ? '1.5px solid #818CF8'
                      : isDark
                      ? '1px solid rgba(255, 255, 255, 0.06)'
                      : '1px solid #F1F5F9',
                    boxShadow: isSelected
                      ? '0 0 0 1px #818CF8'
                      : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.18)' : '#CBD5E1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
                    }
                  }}
                >
                  {/* Top Day Number */}
                  <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    {isSelected ? (
                      <Box
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: '#4F46E5',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {dayNum}
                      </Box>
                    ) : (
                      <Text
                        size="12px"
                        fw={600}
                        style={{
                          color: isToday ? '#4F46E5' : isDark ? '#E2E8F0' : '#334155',
                        }}
                      >
                        {dayNum}
                      </Text>
                    )}
                  </Box>

                  {/* Day Reminders Indicator (Max 3 dots + sleek overflow count badge) */}
                  {hasReminders && (
                    <Box style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'nowrap' }}>
                      {dayReminders.slice(0, 3).map((r, rIdx) => (
                        <Box
                          key={rIdx}
                          style={{
                            width: 5.5,
                            height: 5.5,
                            borderRadius: '50%',
                            backgroundColor:
                              r.priority === 'High' ? '#EF4444' : r.priority === 'Medium' ? '#F59E0B' : '#6366F1',
                            flexShrink: 0,
                          }}
                        />
                      ))}
                      {dayReminders.length > 3 && (
                        <Text
                          size="9px"
                          fw={750}
                          style={{
                            color: isSelected ? '#4F46E5' : isDark ? '#94A3B8' : '#64748B',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                            padding: '1px 4px',
                            borderRadius: 6,
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                            flexShrink: 0,
                          }}
                        >
                          +{dayReminders.length - 3}
                        </Text>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* RIGHT COLUMN: AGENDA PANEL */}
        <Paper
          p="xl"
          style={{
            ...cardStyle,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: 640,
            minHeight: 520,
            overflow: 'hidden',
          }}
        >
          {/* Header: Agenda for Date / Subtitle / Modern Add Reminder Button */}
          <Group
            justify="space-between"
            align="center"
            pb="md"
            style={{
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9',
              flexShrink: 0,
            }}
          >
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Group gap={8} align="center" wrap="nowrap">
                <Text
                  fw={750}
                  size="16px"
                  style={{
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3,
                  }}
                >
                  Agenda • {formatAgendaDate(selectedDateStr)}
                </Text>
                {selectedEmployee && isSuperAdmin && (
                  <Badge
                    size="sm"
                    variant="light"
                    color="indigo"
                    radius="xl"
                    rightSection={
                      <ActionIcon
                        size="xs"
                        color="indigo"
                        radius="xl"
                        variant="transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearEmployeeFilter();
                        }}
                        aria-label="Clear employee filter"
                      >
                        <IconX size={10} />
                      </ActionIcon>
                    }
                  >
                    {selectedEmployee.name}
                  </Badge>
                )}
              </Group>
              <Text size="12px" c="#94A3B8" mt={2} fw={500}>
                {selectedDateReminders.length === 0
                  ? 'No scheduled events'
                  : `${selectedDateReminders.length} reminder${selectedDateReminders.length > 1 ? 's' : ''} scheduled`}
                {selectedEmployee && isSuperAdmin ? ` for ${selectedEmployee.name}` : ''}
              </Text>
            </Box>

            <Button
              size="xs"
              variant="light"
              color="indigo"
              radius="md"
              leftSection={<IconPlus size={14} stroke={2.5} />}
              onClick={handleOpenAdd}
              style={{ fontWeight: 650, flexShrink: 0 }}
            >
              Add Reminder
            </Button>
          </Group>

          {/* Agenda Body */}
          {selectedDateReminders.length === 0 ? (
            /* Empty state */
            <Box
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 16px',
                textAlign: 'center',
              }}
            >
              <Box
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#94A3B8' : '#64748B',
                }}
              >
                <IconCalendarEvent size={28} stroke={1.5} />
              </Box>
              <Text fw={700} size="14px" c={isDark ? '#E2E8F0' : '#334155'} mt="md">
                {isSuperAdmin && selectedEmployee
                  ? `No reminders for ${selectedEmployee.name}`
                  : 'No reminders for this date'}
              </Text>
              <Text size="12px" c="#94A3B8" mt={4} style={{ maxWidth: 260 }}>
                {isSuperAdmin
                  ? 'Keep your team in sync by scheduling a follow-up or task for this day.'
                  : 'Schedule your personal task, follow-up or reminder for this day.'}
              </Text>
              <Button
                size="xs"
                variant="light"
                color="indigo"
                leftSection={<IconPlus size={14} stroke={2} />}
                mt="md"
                radius="md"
                onClick={handleOpenAdd}
              >
                Schedule Reminder
              </Button>
            </Box>
          ) : (
            /* Active reminders list - Scrollable container */
            <ScrollArea
              style={{ flex: 1, minHeight: 0 }}
              type="auto"
              offsetScrollbars
              scrollbarSize={6}
              mt="md"
            >
              <Stack gap="xs" pr={4} pb="xs">
                {selectedDateReminders.map((rem) => {
                  const isHigh = rem.priority === 'High';
                  const isMedium = rem.priority === 'Medium';
                  const priorityColor = isHigh ? 'red' : isMedium ? 'orange' : 'indigo';

                  return (
                    <Paper
                      key={rem.id}
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        border: isDark
                          ? '1px solid rgba(255, 255, 255, 0.08)'
                          : '1px solid #EAECF0',
                        borderRadius: 10,
                        padding: '9px 12px',
                        boxShadow: isDark
                          ? '0 1px 3px rgba(0, 0, 0, 0.2)'
                          : '0 1px 2px rgba(16, 24, 40, 0.03)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(99, 102, 241, 0.4)' : '#C7D2FE';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#EAECF0';
                      }}
                    >
                      {/* Line 1: Title + Time + Priority + Actions */}
                      <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                        {/* Title */}
                        <Text
                          fw={650}
                          size="13px"
                          truncate
                          style={{
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          {rem.title}
                        </Text>

                        {/* Right: Time + Priority + Action Buttons */}
                        <Group gap={6} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
                          {rem.time && (
                            <Text size="11px" fw={600} c="dimmed">
                              {rem.time}
                            </Text>
                          )}
                          <Badge
                            size="xs"
                            variant="light"
                            color={priorityColor}
                            radius="sm"
                            styles={{ label: { textTransform: 'capitalize', fontWeight: 700, fontSize: 10 } }}
                          >
                            {rem.priority}
                          </Badge>
                          <Tooltip label="Edit" withArrow position="top">
                            <ActionIcon
                              variant="subtle"
                              size="xs"
                              color="gray"
                              radius="sm"
                              onClick={() => handleOpenEdit(rem)}
                            >
                              <IconPencil size={13} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete" withArrow position="top">
                            <ActionIcon
                              variant="subtle"
                              size="xs"
                              color="red"
                              radius="sm"
                              onClick={() => handleDeleteReminder(rem.id, rem.title)}
                            >
                              <IconTrash size={13} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>

                      {/* Line 2: Compact Meta (Category • Assigned / Created • Note preview) */}
                      {(rem.category || rem.assignedToName || rem.notes) && (
                        <Group
                          gap={6}
                          align="center"
                          wrap="nowrap"
                          mt={4}
                          style={{ minWidth: 0, overflow: 'hidden' }}
                        >
                          {rem.category && (
                            <Text size="11px" c="dimmed" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {rem.category}
                            </Text>
                          )}

                          {rem.assignedToName && rem.assignedToName !== 'Super Administrator' && (
                            <>
                              <Text size="10px" c="dimmed" style={{ flexShrink: 0 }}>•</Text>
                              <Text size="11px" c="indigo" fw={500} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                To: {rem.assignedToName}
                              </Text>
                            </>
                          )}

                          {rem.createdByName && rem.assignedToName !== rem.createdByName && (
                            <>
                              <Text size="10px" c="dimmed" style={{ flexShrink: 0 }}>•</Text>
                              <Text size="11px" c="dimmed" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                By: {rem.createdByName}
                              </Text>
                            </>
                          )}

                          {rem.notes && (
                            <>
                              <Text size="10px" c="dimmed" style={{ flexShrink: 0 }}>•</Text>
                              <Text
                                size="11px"
                                c="dimmed"
                                truncate
                                style={{ fontStyle: 'italic', minWidth: 0 }}
                              >
                                "{rem.notes}"
                              </Text>
                            </>
                          )}
                        </Group>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            </ScrollArea>
          )}
        </Paper>
      </Box>

      {/* ADD / EDIT REMINDER MODAL */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        centered
        zIndex={1000}
        title={
          <Group gap="xs">
            <ThemeIcon size={34} radius="md" color="indigo" variant="light">
              <IconCalendar size={18} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="16px">
                {editingId ? 'Edit Confidential Reminder' : 'Schedule Confidential Reminder'}
              </Text>
              <Text size="xs" c="dimmed">
                Visible strictly to You and Super Administrators
              </Text>
            </div>
          </Group>
        }
        radius="lg"
        size="md"
      >
        <form onSubmit={handleSaveReminder}>
          <Stack gap="md" mt="xs">
            <TextInput
              label="Reminder Title"
              placeholder="e.g. Executive Proposal Review with Stakeholders"
              required
              value={formData.title}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, title: val }));
              }}
            />

            <Group grow align="flex-start">
              <TextInput
                label="Scheduled Date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, date: val }));
                }}
              />
              <Select
                label="Scheduled Time"
                placeholder="Select time"
                clearable
                required
                allowDeselect={false}
                comboboxProps={{ withinPortal: true, zIndex: 1100 }}
                data={TIME_OPTIONS}
                value={formData.time || null}
                onChange={(val) => setFormData((prev) => ({ ...prev, time: val || '' }))}
              />
            </Group>

            <Group grow align="flex-start">
              <Select
                label="Priority"
                placeholder="Select priority"
                clearable
                required
                allowDeselect={false}
                comboboxProps={{ withinPortal: true, zIndex: 1100 }}
                data={PRIORITY_OPTIONS}
                value={formData.priority || null}
                onChange={(val) => setFormData((prev) => ({ ...prev, priority: (val as any) || '' }))}
              />
              <Select
                label="Category"
                placeholder="Select category"
                clearable
                required
                allowDeselect={false}
                comboboxProps={{ withinPortal: true, zIndex: 1100 }}
                data={CATEGORY_OPTIONS}
                value={formData.category || null}
                onChange={(val) => {
                  const newCat = val || '';
                  setFormData((prev) => ({ ...prev, category: newCat }));
                  if (newCat !== 'Other') {
                    setCustomCategory('');
                  }
                }}
              />
            </Group>

            {/* Manual text type input for Custom Category when 'Other' is selected */}
            {formData.category === 'Other' && (
              <TextInput
                label="Specify Category (Manual Type)"
                placeholder="Type custom category name (e.g. Vendor Payment, Client Dinner, Review)..."
                required
                autoFocus
                value={customCategory}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomCategory(val);
                }}
              />
            )}

            <Textarea
              label="Description / Meeting Notes (Optional)"
              placeholder="Add key talking points, meeting links, or deliverables..."
              rows={3}
              value={formData.notes}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, notes: val }));
              }}
            />

            <Select
              label="Share With / Team Member"
              placeholder="Select Super Admin or Team Member"
              comboboxProps={{ withinPortal: true, zIndex: 1100 }}
              data={[
                { value: 'Super Administrator', label: 'Super Administrator (Super Admin)' },
                ...employees
                  .filter((e) => e.name !== 'Super Administrator')
                  .map((e) => ({
                    value: e.name,
                    label: `${e.name} (${e.designation || e.role || 'Employee'})`,
                  })),
              ]}
              value={formData.assignedToName || 'Super Administrator'}
              onChange={(val) => setFormData((prev) => ({ ...prev, assignedToName: val || 'Super Administrator' }))}
            />

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setModalOpened(false)} disabled={saving} radius="md">
                Cancel
              </Button>
              <Button type="submit" color="indigo" loading={saving} radius="md">
                {editingId
                  ? 'Save Changes'
                  : formData.assignedToName && formData.assignedToName !== 'Super Administrator'
                  ? `Schedule & Notify ${formData.assignedToName}`
                  : 'Schedule & Notify Super Admin'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Box>
  );
};

export default CalendarRemindersTab;
