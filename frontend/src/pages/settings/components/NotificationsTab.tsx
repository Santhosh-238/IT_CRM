import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Stack,
  Group,
  Text,
  Switch,
  Button,
  Badge,
  Select,
  SegmentedControl,
  Divider,
  LoadingOverlay,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconMail,
  IconBell,
  IconClock,
  IconCheck,
  IconRotateClockwise2,
  IconDeviceDesktop,
  IconShieldLock,
  IconVolume,
  IconBrandTelegram,
  IconSparkles,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { NotificationSettings } from '../../../types/settings';
import { settingsService } from '../../../services/settingsService';
import { useCRM } from '../../../context/CRMContext';

export const NotificationsTab: React.FC = () => {
  const { currentUser } = useCRM();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [settings, setSettings] = useState<NotificationSettings>({
    dailyDigest: true,
    leadAssignment: true,
    projectMilestones: true,
    meetingReminders: true,
    inAppMentions: true,
    securityAlerts: true,
    soundAlerts: false,
    desktopBanners: true,
    digestTime: '09:00 AM',
    frequency: 'instant',
  });

  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');

  // Play Web Audio synthesizer chime for alerts
  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext not permitted or muted by browser
    }
  };

  // Load notification settings dynamically from database
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getNotificationSettings();
      if (res.success && res.data) {
        setSettings({
          dailyDigest: res.data.dailyDigest !== undefined ? Boolean(res.data.dailyDigest) : true,
          leadAssignment: res.data.leadAssignment !== undefined ? Boolean(res.data.leadAssignment) : true,
          projectMilestones: res.data.projectMilestones !== undefined ? Boolean(res.data.projectMilestones) : true,
          meetingReminders: res.data.meetingReminders !== undefined ? Boolean(res.data.meetingReminders) : true,
          inAppMentions: res.data.inAppMentions !== undefined ? Boolean(res.data.inAppMentions) : true,
          securityAlerts: res.data.securityAlerts !== undefined ? Boolean(res.data.securityAlerts) : true,
          soundAlerts: res.data.soundAlerts !== undefined ? Boolean(res.data.soundAlerts) : false,
          desktopBanners: res.data.desktopBanners !== undefined ? Boolean(res.data.desktopBanners) : true,
          digestTime: res.data.digestTime || '09:00 AM',
          frequency: res.data.frequency || 'instant',
        });
        setSyncStatus('synced');
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error Loading Settings',
        message: err.message || 'Could not load notification preferences',
        color: 'red',
      });
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Update single preference field with dynamic real-time auto-save to database
  const updateField = async (field: keyof NotificationSettings, value: any) => {
    const updated = { ...settings, [field]: value };
    setSettings(updated);

    // Audio chime preview when turning sound ON
    if (field === 'soundAlerts' && value === true) {
      playAlertSound();
    }

    // Request native browser desktop notification permissions if turned ON
    if (field === 'desktopBanners' && value === true && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            notifications.show({
              title: 'Desktop Alerts Enabled',
              message: 'Browser notification permission granted successfully',
              color: 'teal',
            });
          }
        });
      }
    }

    setSyncStatus('saving');
    try {
      await settingsService.updateNotificationSettings(updated);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      notifications.show({
        title: 'Sync Error',
        message: 'Could not auto-save setting to database',
        color: 'red',
      });
    }
  };

  // Trigger test notification
  const handleTestAlert = () => {
    // Play sound if enabled
    if (settings.soundAlerts) {
      playAlertSound();
    }

    // Trigger native desktop notification if enabled
    if (settings.desktopBanners && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('OneAssist CRM Alert', {
          body: 'New high-priority lead "TechCorp Solutions" assigned to your workspace.',
          icon: '/favicon.ico',
        });
      } catch {
        // Fallback
      }
    }

    notifications.show({
      title: '🔔 Live Notification Test',
      message: 'New high-priority lead "TechCorp Solutions" assigned to your workspace.',
      color: 'indigo',
      icon: <IconBell size={18} />,
      autoClose: 4000,
    });
  };

  // Save settings dynamically to PostgreSQL
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await settingsService.updateNotificationSettings(settings);
      if (res.success) {
        setSyncStatus('synced');
        notifications.show({
          title: 'Preferences Saved',
          message: 'Your notification preferences are permanently saved in PostgreSQL!',
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Save Failed',
        message: err.message || 'Failed to update preferences',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to factory defaults
  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await settingsService.resetSetting('notifications');
      if (res.success && res.data) {
        setSettings(res.data);
        setSyncStatus('synced');
        notifications.show({
          title: 'Defaults Restored',
          message: 'Notification settings reset to factory defaults',
          color: 'gray',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Reset Failed',
        message: err.message || 'Failed to reset settings',
        color: 'red',
      });
    } finally {
      setResetting(false);
    }
  };

  const cardStyle = {
    backgroundColor: isDark ? '#111827' : '#FFFFFF',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EAECF0',
    borderRadius: '16px',
    boxShadow: isDark ? 'none' : '0 1px 3px rgba(16, 24, 40, 0.05)',
  };

  return (
    <Box pos="relative" style={{ maxWidth: 940 }}>
      <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ blur: 1 }} />

      {/* Header */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <Box>
          <Group gap="xs" align="center">
            <Text fw={800} size="20px" style={{ color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
              Notifications & Alerts
            </Text>
            {syncStatus === 'saving' ? (
              <Badge size="sm" variant="light" color="blue">
                Saving to DB...
              </Badge>
            ) : syncStatus === 'synced' ? (
              <Badge size="sm" variant="light" color="teal">
                ● Live Synced (PostgreSQL)
              </Badge>
            ) : (
              <Badge size="sm" variant="light" color="red">
                Sync Error
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed" mt={2}>
            Manage how and when you receive CRM updates, project alerts, and system briefings
          </Text>
        </Box>
        <Group gap="xs">
          <Button
            variant="light"
            color="indigo"
            size="sm"
            radius="md"
            leftSection={<IconBell size={16} />}
            onClick={handleTestAlert}
          >
            Send Test Alert
          </Button>
          <Button
            variant="default"
            size="sm"
            radius="md"
            leftSection={<IconRotateClockwise2 size={16} />}
            onClick={handleReset}
            loading={resetting}
          >
            Reset
          </Button>
          <Button
            color="indigo"
            size="sm"
            radius="md"
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
            loading={saving}
          >
            Save Preferences
          </Button>
        </Group>
      </Group>

      {/* Live Channel Dispatch Status Bar */}
      <Paper
        p="sm"
        mb="md"
        style={{
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#F8FAFC',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          borderRadius: 12,
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="xs" align="center">
            <IconSparkles size={16} color="#6366F1" />
            <Text size="12px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
              Dispatch Channels:
            </Text>
          </Group>
          <Group gap="xs" wrap="wrap">
            <Badge
              size="xs"
              variant="outline"
              color={settings.dailyDigest || settings.leadAssignment || settings.projectMilestones || settings.meetingReminders ? 'indigo' : 'gray'}
              leftSection={<IconMail size={12} />}
            >
              Email {settings.dailyDigest || settings.leadAssignment || settings.projectMilestones || settings.meetingReminders ? (currentUser?.email ? `(${currentUser.email})` : 'Active') : 'Disabled'}
            </Badge>

            <Badge
              size="xs"
              variant="outline"
              color={settings.inAppMentions || settings.securityAlerts ? 'blue' : 'gray'}
              leftSection={<IconBell size={12} />}
            >
              In-App Bell {settings.inAppMentions || settings.securityAlerts ? 'Active' : 'Muted'}
            </Badge>

            <Badge
              size="xs"
              variant="outline"
              color={settings.desktopBanners ? 'teal' : 'gray'}
              leftSection={<IconDeviceDesktop size={12} />}
            >
              Desktop Push {settings.desktopBanners ? 'Enabled' : 'Disabled'}
            </Badge>

            <Badge
              size="xs"
              variant="outline"
              color={settings.soundAlerts ? 'violet' : 'gray'}
              leftSection={<IconVolume size={12} />}
            >
              Audio Chime {settings.soundAlerts ? 'Active' : 'Muted'}
            </Badge>
          </Group>
        </Group>
      </Paper>

      <Stack gap="lg">
        {/* Card 1: Email & Automated Alerts */}
        <Paper p="lg" style={cardStyle}>
          <Group gap="xs" mb="md" align="center">
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
              <IconMail size={18} />
            </Box>
            <Box>
              <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#101828' }}>
                Email & Workflow Alerts
              </Text>
              <Text size="xs" c="dimmed">
                Direct updates sent to {currentUser?.email ? <Text span fw={600} c={isDark ? 'indigo.3' : 'indigo.7'}>{currentUser.email}</Text> : 'your verified enterprise email address'}
              </Text>
            </Box>
          </Group>

          <Stack gap="md">
            {/* Daily Digest */}
            <Group justify="space-between" align="center">
              <div>
                <Text size="14px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  Daily Activity Digest
                </Text>
                <Text size="12px" c="dimmed">
                  Receive a morning briefing of meetings, new leads, and project milestones.
                </Text>
              </div>
              <Switch
                checked={settings.dailyDigest}
                onChange={(e) => updateField('dailyDigest', e.currentTarget.checked)}
                color="indigo"
              />
            </Group>

            <Divider style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

            {/* Lead & Project Assignment */}
            <Group justify="space-between" align="center">
              <div>
                <Text size="14px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  New Lead & Project Assignment
                </Text>
                <Text size="12px" c="dimmed">
                  Notify instantly via email when a contact, deal, or project is assigned to your team.
                </Text>
              </div>
              <Switch
                checked={settings.leadAssignment}
                onChange={(e) => updateField('leadAssignment', e.currentTarget.checked)}
                color="indigo"
              />
            </Group>

            <Divider style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

            {/* Project Milestones */}
            <Group justify="space-between" align="center">
              <div>
                <Text size="14px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  Project Milestones & Deadlines
                </Text>
                <Text size="12px" c="dimmed">
                  Receive priority alerts 24 hours before project deliverables and task deadlines.
                </Text>
              </div>
              <Switch
                checked={settings.projectMilestones}
                onChange={(e) => updateField('projectMilestones', e.currentTarget.checked)}
                color="indigo"
              />
            </Group>

            <Divider style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

            {/* Meeting Reminders */}
            <Group justify="space-between" align="center">
              <div>
                <Text size="14px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  Client Meeting Reminders
                </Text>
                <Text size="12px" c="dimmed">
                  Automated email notification 15 minutes before scheduled meetings and client calls.
                </Text>
              </div>
              <Switch
                checked={settings.meetingReminders}
                onChange={(e) => updateField('meetingReminders', e.currentTarget.checked)}
                color="indigo"
              />
            </Group>
          </Stack>
        </Paper>

        {/* Card 2: In-App & Realtime System Alerts */}
        <Paper p="lg" style={cardStyle}>
          <Group gap="xs" mb="md" align="center">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isDark ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
              }}
            >
              <IconBell size={18} />
            </Box>
            <Box>
              <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#101828' }}>
                In-App & Desktop Alerts
              </Text>
              <Text size="xs" c="dimmed">
                Real-time alerts displayed inside the CRM bell menu and browser banners
              </Text>
            </Box>
          </Group>

          <Stack gap="md">
            {/* Team Mentions */}
            <Group justify="space-between" align="center">
              <div>
                <Text size="14px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  Team Mentions & Task Comments
                </Text>
                <Text size="12px" c="dimmed">
                  Get notified in the top bell icon whenever a team member tags or assigns a task to you.
                </Text>
              </div>
              <Switch
                checked={settings.inAppMentions}
                onChange={(e) => updateField('inAppMentions', e.currentTarget.checked)}
                color="indigo"
              />
            </Group>

            <Divider style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

            {/* Security Alerts */}
            <Group justify="space-between" align="center">
              <div>
                <Text size="14px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  Security & Permission Alerts
                </Text>
                <Text size="12px" c="dimmed">
                  Immediate notification whenever a new sign-in is detected or your role permissions change.
                </Text>
              </div>
              <Switch
                checked={settings.securityAlerts}
                onChange={(e) => updateField('securityAlerts', e.currentTarget.checked)}
                color="indigo"
              />
            </Group>

            <Divider style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

            {/* Desktop Banners */}
            <Group justify="space-between" align="center">
              <div>
                <Text size="14px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  Browser Desktop Notifications
                </Text>
                <Text size="12px" c="dimmed">
                  Display floating notification banners on your computer even when the CRM tab is inactive.
                </Text>
              </div>
              <Switch
                checked={settings.desktopBanners}
                onChange={(e) => updateField('desktopBanners', e.currentTarget.checked)}
                color="indigo"
              />
            </Group>

            <Divider style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

            {/* Sound Alerts */}
            <Group justify="space-between" align="center">
              <div>
                <Text size="14px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  Audible Notification Sound
                </Text>
                <Text size="12px" c="dimmed">
                  Play a subtle chime sound when critical incoming alerts or assignments arrive.
                </Text>
              </div>
              <Switch
                checked={settings.soundAlerts}
                onChange={(e) => updateField('soundAlerts', e.currentTarget.checked)}
                color="indigo"
              />
            </Group>
          </Stack>
        </Paper>

        {/* Card 3: Delivery Schedule & Frequency */}
        <Paper p="lg" style={cardStyle}>
          <Group gap="xs" mb="md" align="center">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <IconClock size={18} />
            </Box>
            <Box>
              <Text fw={700} size="15px" style={{ color: isDark ? '#F8FAFC' : '#101828' }}>
                Delivery Schedule & Frequency
              </Text>
              <Text size="xs" c="dimmed">
                Control the frequency of automated digests and preferred delivery hours
              </Text>
            </Box>
          </Group>

          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Box>
                <Text size="14px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  Alert Batching Frequency
                </Text>
                <Text size="12px" c="dimmed">
                  Choose whether alerts arrive in real time or grouped together
                </Text>
              </Box>
              <SegmentedControl
                size="sm"
                value={settings.frequency}
                onChange={(val) => updateField('frequency', val)}
                data={[
                  { label: 'Instant', value: 'instant' },
                  { label: 'Hourly Batch', value: 'hourly' },
                  { label: 'Daily Summary', value: 'daily' },
                ]}
              />
            </Group>

            <Divider style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Box>
                <Text size="14px" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  Morning Briefing Time
                </Text>
                <Text size="12px" c="dimmed">
                  Selected delivery time for daily activity digest
                </Text>
              </Box>
              <Select
                size="sm"
                data={['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '06:00 PM']}
                value={settings.digestTime}
                onChange={(val) => updateField('digestTime', val || '09:00 AM')}
                style={{ width: 140 }}
              />
            </Group>
          </Stack>
        </Paper>

        {/* Bottom Save Button Bar */}
        <Group justify="flex-end" mt="xs">
          <Button
            color="indigo"
            size="md"
            radius="md"
            leftSection={<IconCheck size={18} />}
            onClick={handleSave}
            loading={saving}
          >
            Save Notification Preferences
          </Button>
        </Group>
      </Stack>
    </Box>
  );
};

export default NotificationsTab;
