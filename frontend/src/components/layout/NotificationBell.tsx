import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActionIcon,
  Popover,
  Box,
  Text,
  Group,
  Badge,
  Stack,
  ScrollArea,
  Button,
  UnstyledButton,
  Tooltip,
  Indicator,
  Divider,
  Center,
  useComputedColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBell,
  IconBellRinging,
  IconCalendar,
  IconClock,
  IconAlertCircle,
  IconCheck,
  IconChevronRight,
  IconRefresh,
  IconPhone,
  IconBuilding,
  IconCalendarCheck,
  IconCalendarTime,
  IconInbox,
  IconExternalLink,
  IconX,
  IconSparkles,
} from '@tabler/icons-react';
import { contactService } from '../../services/contactService';
import { Contact } from '../../types/contact';
import { useCRM } from '../../context/CRMContext';
import { useContact } from '../../context/ContactContext';

interface NotificationItem {
  id: string;
  contact: Contact;
  title: string;
  subtitle: string;
  category: 'due_today' | 'overdue' | 'upcoming' | 'pending';
  dateStr: string;
  formattedDate: string;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  statusText: string;
  isRead: boolean;
}

export const NotificationBell: React.FC = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { setActiveNav } = useCRM();
  const { setSelectedContact, fetchContacts: refreshContactsList } = useContact();

  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('crm_read_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<'all' | 'due_today' | 'overdue' | 'followup' | 'pending'>('all');
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('crm_dismiss_notif_banner') === 'true';
    } catch {
      return false;
    }
  });

  const pillBg = isDark ? '#1E293B' : '#F5F8FA';
  const pillBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatCleanDate = (dateStr: string) => {
    if (!dateStr) return '';
    const today = getTodayStr();
    if (dateStr === today) {
      return 'Today';
    }
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
    return dateStr;
  };

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  const requestDesktopPermission = async () => {
    if (!('Notification' in window)) {
      notifications.show({
        title: 'Not Supported',
        message: 'Browser notifications are not supported in this browser.',
        color: 'orange',
      });
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setDesktopPermission(perm);
      if (perm === 'granted') {
        playNotificationSound();
        notifications.show({
          title: 'Desktop Notifications Enabled',
          message: 'You will receive alerts for scheduled follow-ups and pending contacts!',
          color: 'teal',
          icon: <IconCheck size={16} />,
        });
        try {
          new Notification('CRM Web Notifications Active', {
            body: 'You will receive timely desktop notifications when contact follow-ups are due.',
            icon: '/favicon.ico',
          });
        } catch (e) {}
      } else if (perm === 'denied') {
        notifications.show({
          title: 'Notifications Blocked',
          message: 'Browser notifications are disabled in your browser settings. Please allow notifications for this site.',
          color: 'red',
        });
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem('crm_dismiss_notif_banner', 'true');
    } catch {}
  };

  // Fetch contacts for notifications
  const fetchNotificationContacts = useCallback(async (isInitial = false) => {
    try {
      setLoading(true);
      const res = await contactService.getContacts({ limit: 150 });
      if (res && res.data) {
        setContacts(res.data);

        if (isInitial) {
          const today = getTodayStr();
          const dueTodayList = res.data.filter((c) => {
            const fDate = (c.nextFollowDate || '').trim();
            return fDate === today;
          });

          if (dueTodayList.length > 0) {
            const sessionKey = `crm_notified_today_${today}`;
            if (!sessionStorage.getItem(sessionKey)) {
              sessionStorage.setItem(sessionKey, 'true');
              playNotificationSound();

              notifications.show({
                id: 'crm-followups-due-today',
                title: 'Follow-ups Due Today!',
                message: `You have ${dueTodayList.length} contact follow-up${dueTodayList.length > 1 ? 's' : ''} scheduled for today.`,
                color: 'blue',
                autoClose: 12000,
                icon: <IconBellRinging size={18} />,
              });

              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  const names = dueTodayList.map((c) => c.name).slice(0, 3).join(', ');
                  new Notification(`CRM Reminder: ${dueTodayList.length} Follow-up${dueTodayList.length > 1 ? 's' : ''} Due Today`, {
                    body: `${names}${dueTodayList.length > 3 ? '...' : ''} - Click to view in CRM.`,
                    icon: '/favicon.ico',
                  });
                } catch (e) {}
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load contacts for notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationContacts(true);

    const handleUpdate = () => {
      fetchNotificationContacts(false);
    };
    window.addEventListener('crm_contacts_updated', handleUpdate);

    const interval = setInterval(() => {
      fetchNotificationContacts(false);
    }, 120000);

    return () => {
      window.removeEventListener('crm_contacts_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [fetchNotificationContacts]);

  // Transform contacts into clean notifications (ONLY for scheduled dates that have arrived)
  const notificationItems = useMemo<NotificationItem[]>(() => {
    const today = getTodayStr();
    const items: NotificationItem[] = [];

    contacts.forEach((c) => {
      const followDate = (c.nextFollowDate || '').trim();
      const qStatus = (c.qualificationStatus || '').trim();
      const status = (c.status || '').trim();

      // Strict User Requirement: Only notify when a scheduled date was set AND that date has arrived!
      if (!followDate) return;
      if (followDate > today) return; // Future date -> do not alert yet!

      const isPending = qStatus === 'Pending' || status === 'Pending';
      const isDueToday = followDate === today;

      if (isDueToday) {
        items.push({
          id: `due_${c.id}`,
          contact: c,
          title: c.name,
          subtitle: c.companyName || c.phone || 'Company Representative',
          category: 'due_today',
          dateStr: followDate,
          formattedDate: 'Today',
          badgeLabel: 'Due Today',
          badgeColor: 'blue',
          badgeBg: isDark ? 'rgba(59, 130, 246, 0.16)' : '#EFF6FF',
          badgeBorder: isDark ? 'rgba(59, 130, 246, 0.35)' : '#BFDBFE',
          badgeTextColor: isDark ? '#93C5FD' : '#1D4ED8',
          statusText: isPending ? 'Pending review scheduled for today' : 'Follow-up scheduled for today',
          isRead: readIds.includes(`due_${c.id}`),
        });
      } else {
        // followDate < today (Overdue)
        items.push({
          id: `overdue_${c.id}`,
          contact: c,
          title: c.name,
          subtitle: c.companyName || c.phone || 'Company Representative',
          category: 'overdue',
          dateStr: followDate,
          formattedDate: formatCleanDate(followDate),
          badgeLabel: 'Overdue',
          badgeColor: 'red',
          badgeBg: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
          badgeBorder: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
          badgeTextColor: isDark ? '#FCA5A5' : '#DC2626',
          statusText: isPending ? 'Review overdue' : 'Follow-up overdue',
          isRead: readIds.includes(`overdue_${c.id}`),
        });
      }
    });

    const priorityWeight: Record<string, number> = {
      due_today: 1,
      overdue: 2,
      pending: 3,
      upcoming: 4,
    };

    return items.sort((a, b) => {
      const pDiff = (priorityWeight[a.category] || 5) - (priorityWeight[b.category] || 5);
      if (pDiff !== 0) return pDiff;
      return a.dateStr.localeCompare(b.dateStr);
    });
  }, [contacts, readIds, isDark]);

  const unreadCount = useMemo(() => {
    return notificationItems.filter((i) => !i.isRead).length;
  }, [notificationItems]);

  const dueTodayCount = useMemo(() => {
    return notificationItems.filter((i) => i.category === 'due_today').length;
  }, [notificationItems]);

  const overdueCount = useMemo(() => {
    return notificationItems.filter((i) => i.category === 'overdue').length;
  }, [notificationItems]);

  const followUpCount = useMemo(() => {
    return notificationItems.filter(
      (i) =>
        i.contact.qualificationStatus === 'Follow-up Required' ||
        i.contact.status === 'Follow-up Required' ||
        i.category === 'overdue' ||
        (i.category === 'due_today' && i.badgeLabel === 'Due Today')
    ).length;
  }, [notificationItems]);

  const pendingCount = useMemo(() => {
    return notificationItems.filter(
      (i) =>
        i.contact.qualificationStatus === 'Pending' ||
        i.contact.status === 'Pending'
    ).length;
  }, [notificationItems]);

  const filteredItems = useMemo(() => {
    if (activeTab === 'due_today') return notificationItems.filter((i) => i.category === 'due_today');
    if (activeTab === 'overdue') return notificationItems.filter((i) => i.category === 'overdue');
    if (activeTab === 'followup') {
      return notificationItems.filter(
        (i) =>
          i.contact.qualificationStatus === 'Follow-up Required' ||
          i.contact.status === 'Follow-up Required' ||
          i.category === 'overdue' ||
          (i.category === 'due_today' && i.badgeLabel === 'Due Today')
      );
    }
    if (activeTab === 'pending') {
      return notificationItems.filter(
        (i) =>
          i.contact.qualificationStatus === 'Pending' ||
          i.contact.status === 'Pending'
      );
    }
    return notificationItems;
  }, [notificationItems, activeTab]);

  const handleMarkAllAsRead = () => {
    const allIds = notificationItems.map((i) => i.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem('crm_read_notifications', JSON.stringify(updated));
    } catch {}
  };

  const handleOpenContact = (item: NotificationItem) => {
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      try {
        localStorage.setItem('crm_read_notifications', JSON.stringify(updated));
      } catch {}
    }

    try {
      sessionStorage.setItem('crm_qualifying_contact', JSON.stringify(item.contact));
      sessionStorage.setItem('crm_selected_contact', JSON.stringify(item.contact));
    } catch {}

    setSelectedContact(item.contact);
    setOpened(false);
    setActiveNav('contact-qualification');
  };

  const handleViewAllContacts = () => {
    setOpened(false);
    try {
      sessionStorage.removeItem('crm_selected_contact');
      sessionStorage.removeItem('crm_qualifying_contact');
      sessionStorage.removeItem('crm_editing_contact');
    } catch {}
    setSelectedContact(null);
    setActiveNav('contacts');
    if (refreshContactsList) {
      refreshContactsList();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crm_contacts_updated'));
    }
    notifications.show({
      id: 'crm-nav-contacts',
      title: 'Contacts Directory',
      message: 'Viewing all contacts list',
      color: 'blue',
      autoClose: 2500,
    });
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      width={410}
      position="bottom-end"
      radius="16px"
      shadow="xl"
      withArrow
      arrowSize={12}
      transitionProps={{ transition: 'pop-top-right', duration: 180 }}
    >
      <Popover.Target>
        <Tooltip label={unreadCount > 0 ? `${unreadCount} New Notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'} withArrow position="bottom">
          <Indicator
            inline
            size={11}
            offset={4}
            color={dueTodayCount > 0 ? 'red' : 'blue'}
            disabled={unreadCount === 0}
            processing={dueTodayCount > 0}
            zIndex={10}
          >
            <ActionIcon
              variant="subtle"
              size="md"
              radius="100px"
              style={{
                background: pillBg,
                color: unreadCount > 0 ? (dueTodayCount > 0 ? '#EF4444' : '#3B82F6') : isDark ? '#E2E8F0' : '#475569',
                border: `1px solid ${pillBorder}`,
                transition: 'all 0.15s ease',
              }}
              onClick={() => setOpened((o) => !o)}
            >
              {dueTodayCount > 0 ? (
                <IconBellRinging size={17} stroke={2} />
              ) : (
                <IconBell size={17} stroke={1.8} />
              )}
            </ActionIcon>
          </Indicator>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown
        p={0}
        style={{
          background: isDark ? '#1E293B' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
          overflow: 'hidden',
          borderRadius: 16,
          boxShadow: isDark
            ? '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 20px 40px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06)',
        }}
      >
        {/* 1. HEADER */}
        <Box p="sm" px="md" style={{ borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9' }}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="xs" align="center">
              <Text fw={750} size="sm" style={{ color: textColor, letterSpacing: '-0.01em' }}>
                Notifications
              </Text>
              {unreadCount > 0 ? (
                <Badge
                  size="xs"
                  variant="filled"
                  color={dueTodayCount > 0 ? 'red' : 'blue'}
                  radius="100px"
                  style={{ fontWeight: 700, height: 19, padding: '0 8px' }}
                >
                  {unreadCount} new
                </Badge>
              ) : (
                <Badge size="xs" variant="light" color="gray" radius="100px" style={{ height: 19 }}>
                  All caught up
                </Badge>
              )}
            </Group>

            <Group gap={6}>
              <Tooltip label="Refresh" withArrow position="top">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  loading={loading}
                  onClick={() => fetchNotificationContacts(false)}
                  style={{ borderRadius: 6 }}
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              </Tooltip>
              {unreadCount > 0 && (
                <Button
                  variant="subtle"
                  size="compact-xs"
                  color="blue"
                  leftSection={<IconCheck size={12} stroke={2.5} />}
                  onClick={handleMarkAllAsRead}
                  style={{ fontSize: 11, fontWeight: 650, borderRadius: 6 }}
                >
                  Mark read
                </Button>
              )}
            </Group>
          </Group>

          {/* Web Desktop Permission Banner (Clean, Dismissible) */}
          {desktopPermission !== 'granted' && !bannerDismissed && (
            <Box
              mt={10}
              p="xs"
              style={{
                borderRadius: 10,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(99, 102, 241, 0.16) 100%)'
                  : 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE',
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap={8} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  <Box
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      flexShrink: 0,
                    }}
                  >
                    <IconBellRinging size={14} />
                  </Box>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="11px" fw={700} style={{ color: isDark ? '#93C5FD' : '#1E40AF', lineHeight: 1.2 }}>
                      Enable desktop alerts
                    </Text>
                    <Text size="10px" c="dimmed" truncate style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                      Get instant alerts when follow-ups are due
                    </Text>
                  </Box>
                </Group>

                <Group gap={4} wrap="nowrap">
                  <Button
                    size="compact-xs"
                    color="blue"
                    radius="100px"
                    onClick={requestDesktopPermission}
                    style={{ fontSize: 10, height: 22, fontWeight: 700 }}
                  >
                    Enable
                  </Button>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="gray"
                    onClick={dismissBanner}
                    style={{ borderRadius: 999 }}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Group>
              </Group>
            </Box>
          )}

          {/* 2. PILL SEGMENTED TABS */}
          <Box
            mt={10}
            p={3}
            style={{
              background: isDark ? '#0F172A' : '#F1F5F9',
              borderRadius: 100,
              display: 'flex',
              gap: 3,
            }}
          >
            {[
              { key: 'all', label: 'All', count: notificationItems.length },
              { key: 'due_today', label: 'Due Today', count: dueTodayCount, alert: dueTodayCount > 0 },
              ...(overdueCount > 0 ? [{ key: 'overdue', label: 'Overdue', count: overdueCount, alert: true }] : []),
              { key: 'followup', label: 'Follow-ups', count: followUpCount },
              { key: 'pending', label: 'Pending', count: pendingCount },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <UnstyledButton
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '5px 8px',
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive
                      ? isDark
                        ? '#FFFFFF'
                        : '#0F172A'
                      : isDark
                      ? '#94A3B8'
                      : '#64748B',
                    background: isActive ? (isDark ? '#334155' : '#FFFFFF') : 'transparent',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 100,
                      background: isActive
                        ? isDark
                          ? 'rgba(255,255,255,0.15)'
                          : 'rgba(15, 23, 42, 0.08)'
                        : isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(15, 23, 42, 0.05)',
                      color: tab.alert ? '#EF4444' : 'inherit',
                    }}
                  >
                    {tab.count}
                  </span>
                </UnstyledButton>
              );
            })}
          </Box>
        </Box>

        {/* 3. NOTIFICATION ITEMS LIST (Adaptive max-height, NO HUGE EMPTY SPACE!) */}
        <ScrollArea.Autosize mah={360} scrollbarSize={6}>
          {filteredItems.length === 0 ? (
            <Center p="xl" py={36}>
              <Stack align="center" gap={8}>
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconInbox size={24} color={subtextColor} stroke={1.5} />
                </Box>
                <Text size="xs" fw={700} style={{ color: textColor }}>
                  No notifications in this view
                </Text>
                <Text size="11px" c="dimmed" ta="center" style={{ maxWidth: 220 }}>
                  {activeTab === 'due_today'
                    ? 'No follow-up dates due today.'
                    : activeTab === 'pending'
                    ? 'No pending contacts found.'
                    : 'All contact follow-ups and reviews are up to date!'}
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap={0}>
              {filteredItems.map((item, idx) => {
                return (
                  <UnstyledButton
                    key={item.id}
                    onClick={() => handleOpenContact(item)}
                    p="xs"
                    px="md"
                    style={{
                      borderBottom:
                        idx === filteredItems.length - 1
                          ? 'none'
                          : isDark
                          ? '1px solid rgba(255, 255, 255, 0.05)'
                          : '1px solid #F1F5F9',
                      background: !item.isRead
                        ? isDark
                          ? 'rgba(59, 130, 246, 0.06)'
                          : 'rgba(59, 130, 246, 0.03)'
                        : 'transparent',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = !item.isRead
                        ? isDark
                          ? 'rgba(59, 130, 246, 0.06)'
                          : 'rgba(59, 130, 246, 0.03)'
                        : 'transparent';
                    }}
                  >
                    <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                      <Group gap="sm" align="center" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        {/* Leading Icon Squircle */}
                        <Box
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: item.badgeBg,
                            border: `1px solid ${item.badgeBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: item.badgeTextColor,
                          }}
                        >
                          {item.category === 'due_today' ? (
                            <IconCalendarCheck size={18} stroke={2.2} />
                          ) : item.category === 'overdue' ? (
                            <IconAlertCircle size={18} stroke={2.2} />
                          ) : item.category === 'pending' ? (
                            <IconClock size={18} stroke={2.2} />
                          ) : (
                            <IconCalendarTime size={18} stroke={2.2} />
                          )}
                        </Box>

                        {/* Contact details */}
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Group gap={6} align="center" wrap="nowrap" justify="space-between">
                            <Group gap={6} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
                              <Text size="xs" fw={750} truncate style={{ color: textColor }}>
                                {item.title}
                              </Text>
                              {!item.isRead && (
                                <Box
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: '#3B82F6',
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </Group>

                            {/* Badge */}
                            <Box
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: 100,
                                background: item.badgeBg,
                                color: item.badgeTextColor,
                                border: `1px solid ${item.badgeBorder}`,
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: '0.01em',
                                flexShrink: 0,
                              }}
                            >
                              {item.badgeLabel}
                            </Box>
                          </Group>

                          {/* Company Name */}
                          <Text size="11px" c="dimmed" truncate mt={1} fw={500}>
                            {item.subtitle}
                          </Text>

                          {/* Date & Context (CLEAN - NO REPEATING DATES!) */}
                          <Group gap={6} mt={3} align="center" wrap="nowrap">
                            <Group gap={3} align="center" wrap="nowrap">
                              <IconCalendar size={11} color={subtextColor} stroke={1.8} />
                              <Text size="10.5px" fw={650} style={{ color: textColor }}>
                                {item.formattedDate}
                              </Text>
                            </Group>
                            <Text size="10.5px" c="dimmed" truncate>
                              • {item.statusText}
                            </Text>
                          </Group>
                        </Box>
                      </Group>

                      {/* Right subtle arrow */}
                      <IconChevronRight size={14} color={subtextColor} style={{ flexShrink: 0, opacity: 0.6 }} />
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          )}
        </ScrollArea.Autosize>

        {/* 4. FOOTER */}
        <Box
          p="xs"
          px="md"
          style={{
            background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#F8FAFC',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap={6} align="center">
              <Box
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10B981',
                }}
              />
              <Text size="11px" fw={500} c="dimmed">
                Live sync with scheduled contacts
              </Text>
            </Group>
            <Button
              id="notif-view-contacts-btn"
              variant="subtle"
              size="compact-xs"
              rightSection={<IconExternalLink size={12} />}
              onClick={handleViewAllContacts}
              style={{ fontSize: 11, fontWeight: 650, borderRadius: 6 }}
            >
              View Contacts
            </Button>
          </Group>
        </Box>
      </Popover.Dropdown>
    </Popover>
  );
};

export default NotificationBell;
