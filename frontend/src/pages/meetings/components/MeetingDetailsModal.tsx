import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Box,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  ActionIcon,
  Textarea,
  Select,
  Paper,
  SimpleGrid,
  Divider,
  Tooltip,
  useComputedColorScheme,
  ThemeIcon,
  Loader,
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconClock,
  IconMapPin,
  IconUser,
  IconBuilding,
  IconUpload,
  IconDownload,
  IconX,
  IconFileDescription,
  IconCheck,
  IconExternalLink,
  IconTarget,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ScheduledMeeting } from '../../../types/meeting';
import { updateMeetingApi } from '../../../services/meetingService';

interface MeetingDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  meeting: ScheduledMeeting | null;
  onMeetingUpdated?: (updated: ScheduledMeeting) => void;
  onNavigateToLead?: (meeting: ScheduledMeeting) => void;
}

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
  opened,
  onClose,
  meeting,
  onMeetingUpdated,
  onNavigateToLead,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [status, setStatus] = useState<string>('Scheduled');
  const [requirements, setRequirements] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getStatusColor = (val?: string) => {
    switch (val?.toLowerCase()) {
      case 'scheduled':
        return 'yellow';
      case 'in progress':
        return 'blue';
      case 'completed':
        return 'teal';
      case 'cancelled':
        return 'red';
      case 'rescheduled':
        return 'orange';
      default:
        return 'gray';
    }
  };

  // Sync state whenever selected meeting changes
  useEffect(() => {
    if (meeting) {
      setStatus(meeting.status || meeting.meetingStatus || 'Scheduled');
      setRequirements(meeting.requirements || '');
      setFileName(meeting.requirementFileName || '');
      setFileUrl(meeting.requirementFileUrl || '');
      setFileSize(meeting.requirementFileSize || '');
    }
  }, [meeting]);

  if (!meeting) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      notifications.show({
        title: 'File Too Large',
        message: 'Please upload a file smaller than 10MB.',
        color: 'red',
      });
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFileName(file.name);
      setFileUrl(dataUrl);
      setFileSize(sizeFormatted);
      notifications.show({
        title: 'File Ready to Save',
        message: `${file.name} (${sizeFormatted}) uploaded. Click "Save Details & Requirements" to persist.`,
        color: 'teal',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileUrl('');
    setFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!meeting) return;
    setSaving(true);
    try {
      const payload: Partial<ScheduledMeeting> = {
        status: status as any,
        meetingStatus: status as any,
        requirements: requirements.trim(),
        requirementFileName: fileName.trim() || undefined,
        requirementFileUrl: fileUrl || undefined,
        requirementFileSize: fileSize.trim() || undefined,
      };

      const updated = await updateMeetingApi(meeting.id, payload);

      notifications.show({
        title: 'Meeting Details Saved',
        message: 'Status and client requirements updated successfully.',
        color: 'teal',
        icon: <IconCheck size={16} />,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crm:meeting-updated', { detail: updated }));
      }

      if (onMeetingUpdated && updated) {
        onMeetingUpdated(updated);
      }
      onClose();
    } catch (err: any) {
      notifications.show({
        title: 'Save Failed',
        message: err.message || 'Could not save meeting details.',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const isVirtual = meeting.meetingType?.toLowerCase().includes('virtual') || meeting.location?.startsWith('http');
  const leadName = meeting.leadName || meeting.clientName || 'Lead Client';
  const companyName = meeting.companyName || 'Company / Organization';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="860px"
      radius="lg"
      centered
      styles={{
        content: {
          maxHeight: '92vh',
        },
        body: {
          maxHeight: 'calc(92vh - 80px)',
          overflowY: 'auto',
          paddingBottom: 24,
        },
      }}
      title={
        <Group gap="xs" align="center">
          <ThemeIcon color="teal" variant="light" size="md" radius="md">
            <IconCalendarEvent size={18} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="md">
              Meeting Details & Requirements
            </Text>
            <Text size="xs" c="dimmed">
              Review meeting schedule, update status, and record client requirements
            </Text>
          </div>
        </Group>
      }
    >
      <Stack gap="md" mt="xs">
        {/* ========================================================= */}
        {/* SECTION 1: MEETING OVERVIEW CARD                          */}
        {/* ========================================================= */}
        <Paper
          p="md"
          radius="md"
          style={{
            background: isDark ? '#1E293B' : '#F8FAFC',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
            <div>
              <Text fw={700} size="md" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                {meeting.title || meeting.purpose || 'Client Discussion'}
              </Text>
              {meeting.purpose && meeting.purpose !== meeting.title && (
                <Text size="xs" c="dimmed" mt={2}>
                  Purpose: {meeting.purpose}
                </Text>
              )}
            </div>

            <Group gap="xs">
              <Badge
                variant="light"
                color={getStatusColor(status)}
                size="sm"
                radius="sm"
              >
                {status}
              </Badge>

              <Badge
                variant="outline"
                color={isVirtual ? 'blue' : 'cyan'}
                size="sm"
                radius="sm"
              >
                {meeting.meetingType || 'Virtual'}
              </Badge>
            </Group>
          </Group>

          <Divider my="sm" />

          {/* Quick Meta Grid */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {/* Lead & Company */}
            <Group gap="xs" align="center">
              <ThemeIcon variant="light" color="blue" size="sm" radius="md">
                <IconUser size={14} />
              </ThemeIcon>
              <div>
                <Text size="xs" fw={700} style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}>
                  {leadName}
                </Text>
                <Text size="11px" c="dimmed">
                  {companyName}
                </Text>
              </div>
            </Group>

            {/* Host Rep */}
            <Group gap="xs" align="center">
              <ThemeIcon variant="light" color="teal" size="sm" radius="md">
                <IconUser size={14} />
              </ThemeIcon>
              <div>
                <Text size="xs" fw={700} style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}>
                  {meeting.employeeName || 'Assigned Host'}
                </Text>
                <Text size="11px" c="dimmed">
                  {meeting.employeeDesignation || 'CRM Host'}
                </Text>
              </div>
            </Group>

            {/* Date & Time */}
            <Group gap="xs" align="center">
              <ThemeIcon variant="light" color="orange" size="sm" radius="md">
                <IconClock size={14} />
              </ThemeIcon>
              <div>
                <Text size="xs" fw={600} style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}>
                  {meeting.meetingDate} • {meeting.startTime}
                  {meeting.endTime ? ` – ${meeting.endTime}` : ''}
                </Text>
                <Text size="11px" c="dimmed">
                  Duration: {meeting.duration || '30 Minutes'}
                </Text>
              </div>
            </Group>

            {/* Location / Meeting URL */}
            <Group gap="xs" align="center">
              <ThemeIcon variant="light" color="violet" size="sm" radius="md">
                <IconMapPin size={14} />
              </ThemeIcon>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {meeting.location ? (
                  meeting.location.startsWith('http') ? (
                    <Text
                      component="a"
                      href={meeting.location}
                      target="_blank"
                      size="xs"
                      fw={600}
                      c="blue"
                      style={{ textDecoration: 'underline' }}
                    >
                      {meeting.location.replace(/^https?:\/\//, '').slice(0, 30)}
                      {meeting.location.length > 30 ? '...' : ''}
                    </Text>
                  ) : (
                    <Text size="xs" fw={600} style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}>
                      {meeting.location}
                    </Text>
                  )
                ) : (
                  <Text size="xs" c="dimmed">
                    No location specified
                  </Text>
                )}
                <Text size="11px" c="dimmed">
                  Location / Venue
                </Text>
              </div>
            </Group>
          </SimpleGrid>
        </Paper>

        {/* ========================================================= */}
        {/* SECTION 2: MEETING STATUS UPDATE FIELD                   */}
        {/* ========================================================= */}
        <Box>
          <Group justify="space-between" align="center" mb={4}>
            <Text fw={700} size="sm" style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}>
              Meeting Status *
            </Text>
            <Badge
              variant="light"
              color={getStatusColor(status)}
              size="sm"
              radius="sm"
            >
              Current: {status}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" mb={8}>
            Update the progress or outcome for this meeting.
          </Text>
          <Select
            placeholder="Select Status"
            value={status}
            onChange={(val) => setStatus(val || 'Scheduled')}
            allowDeselect={false}
            data={[
              { value: 'Scheduled', label: 'Scheduled' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Rescheduled', label: 'Rescheduled' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
            styles={{
              input: {
                borderRadius: 10,
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#D1D5DB',
                fontSize: 13,
                fontWeight: 600,
                color: isDark ? '#F8FAFC' : '#0F172A',
              },
            }}
          />
        </Box>

        {/* ========================================================= */}
        {/* SECTION 3: REQUIREMENT ENTRY FIELD                        */}
        {/* ========================================================= */}
        <Box>
          <Text fw={700} size="sm" mb={4} style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}>
            Client Requirements / Scope of Work *
          </Text>
          <Text size="xs" c="dimmed" mb={8}>
            Enter the client’s requested features, software scope, technical stack, or discussion notes.
          </Text>
          <Textarea
            placeholder="e.g. Client needs custom CRM with WhatsApp integration, Lead pipeline, Role-based permissions, and Mobile App for 25 sales reps..."
            value={requirements}
            onChange={(e) => setRequirements(e.currentTarget.value)}
            minRows={4}
            maxRows={8}
            autosize
            styles={{
              input: {
                borderRadius: 10,
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#D1D5DB',
                fontSize: 13,
              },
            }}
          />
        </Box>

        {/* ========================================================= */}
        {/* SECTION 3: REQUIREMENT FILE UPLOAD FIELD                  */}
        {/* ========================================================= */}
        <Box>
          <Text fw={700} size="sm" mb={4} style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}>
            Requirement Document / Attachment
          </Text>
          <Text size="xs" c="dimmed" mb={8}>
            Upload requirement specification (PDF, Word DOCX, text file, wireframes, or images).
          </Text>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
          />

          {fileName && fileUrl ? (
            /* Uploaded File Preview Card */
            <Paper
              p="sm"
              radius="md"
              style={{
                background: isDark ? '#064E3B' : '#ECFDF5',
                border: isDark ? '1px solid #059669' : '1px solid #A7F3D0',
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap="sm" wrap="nowrap" style={{ overflow: 'hidden' }}>
                  <ThemeIcon color="teal" variant="light" size="lg" radius="md">
                    <IconFileDescription size={20} />
                  </ThemeIcon>
                  <div style={{ overflow: 'hidden' }}>
                    <Text fw={600} size="sm" truncate style={{ color: isDark ? '#ECFDF5' : '#065F46' }}>
                      {fileName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {fileSize || 'Attached'} • Ready to view
                    </Text>
                  </div>
                </Group>

                <Group gap="xs" wrap="nowrap">
                  {/* Download / Open File */}
                  <Tooltip label="Download / Open File" withArrow>
                    <ActionIcon
                      variant="light"
                      color="teal"
                      radius="md"
                      component="a"
                      href={fileUrl}
                      download={fileName}
                      target="_blank"
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Tooltip>

                  {/* Remove File */}
                  <Tooltip label="Remove Attachment" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      radius="md"
                      onClick={handleRemoveFile}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Paper>
          ) : (
            /* Dropzone / Upload Trigger Button */
            <Paper
              p="lg"
              radius="md"
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDark ? '2px dashed #475569' : '2px dashed #CBD5E1',
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <Stack align="center" gap={6}>
                <ThemeIcon size="lg" radius="xl" variant="light" color="blue">
                  <IconUpload size={20} />
                </ThemeIcon>
                <Text size="sm" fw={600} style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  Click to upload Requirement File
                </Text>
                <Text size="xs" c="dimmed">
                  Supports PDF, Word DOCX, TXT, Excel or Images (Max: 10MB)
                </Text>
              </Stack>
            </Paper>
          )}
        </Box>

        {/* ========================================================= */}
        {/* FOOTER ACTION BUTTONS                                     */}
        {/* ========================================================= */}
        <Group justify="space-between" mt="md">
          {onNavigateToLead ? (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<IconTarget size={14} />}
              onClick={() => {
                onClose();
                onNavigateToLead(meeting);
              }}
            >
              Go to Lead Activity Pipeline
            </Button>
          ) : (
            <div />
          )}

          <Group gap="sm">
            <Button variant="default" radius="md" onClick={onClose} disabled={saving}>
              Close
            </Button>

            <Button
              radius="md"
              loading={saving}
              onClick={handleSave}
              leftSection={<IconCheck size={16} />}
              style={{
                background: isDark ? '#22c55e' : '#0F172A',
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              Save Details & Requirements
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
