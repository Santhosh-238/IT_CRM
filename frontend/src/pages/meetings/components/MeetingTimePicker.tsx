import React, { useState, useEffect } from 'react';
import {
  Box,
  Popover,
  TextInput,
  ActionIcon,
  Group,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  Button,
  Select,
  useComputedColorScheme,
} from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

interface MeetingTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  zIndex?: number;
  styles?: any;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  error?: React.ReactNode;
  hideQuickSelect?: boolean;
}

const STANDARD_TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM',
];

const QUICK_TIME_PRESETS = [
  '10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM', '05:30 PM',
];

interface ParsedTimeResult {
  hours: string; // "01" - "12"
  minutes: string; // "00" - "59"
  period: 'AM' | 'PM';
  formatted: string; // "HH:MM AM"
}

const parseFlexibleTime = (str: string, currentPeriod = 'AM'): ParsedTimeResult | null => {
  if (!str) return null;
  const trimmed = str.trim().toLowerCase();

  // 1. HH:MM or HH.MM with optional AM/PM
  const colonMatch = trimmed.match(/^(\d{1,2})[:.](\d{1,2})(?:\s*(am|pm))?$/i);
  if (colonMatch) {
    let h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    const meridiem = colonMatch[3] ? (colonMatch[3].toUpperCase() as 'AM' | 'PM') : null;

    if (m < 0 || m > 59) return null;

    if (meridiem) {
      if (h === 0) h = 12;
      else if (h > 12 && h < 24) h = h - 12;
      else if (h > 12) return null;
      const hStr = String(h).padStart(2, '0');
      const mStr = String(m).padStart(2, '0');
      return { hours: hStr, minutes: mStr, period: meridiem, formatted: `${hStr}:${mStr} ${meridiem}` };
    } else {
      // 24-hour vs 12-hour
      if (h >= 13 && h <= 23) {
        const h12 = h - 12;
        const hStr = String(h12).padStart(2, '0');
        const mStr = String(m).padStart(2, '0');
        return { hours: hStr, minutes: mStr, period: 'PM', formatted: `${hStr}:${mStr} PM` };
      } else if (h === 0) {
        const hStr = '12';
        const mStr = String(m).padStart(2, '0');
        return { hours: hStr, minutes: mStr, period: 'AM', formatted: `${hStr}:${mStr} AM` };
      } else if (h === 12) {
        const hStr = '12';
        const mStr = String(m).padStart(2, '0');
        const p = (currentPeriod === 'PM' ? 'PM' : 'AM') as 'AM' | 'PM';
        return { hours: hStr, minutes: mStr, period: p, formatted: `${hStr}:${mStr} ${p}` };
      } else if (h >= 1 && h <= 11) {
        const hStr = String(h).padStart(2, '0');
        const mStr = String(m).padStart(2, '0');
        const p = (currentPeriod === 'PM' ? 'PM' : 'AM') as 'AM' | 'PM';
        return { hours: hStr, minutes: mStr, period: p, formatted: `${hStr}:${mStr} ${p}` };
      }
    }
  }

  // 2. Hour with AM/PM (e.g. '2pm', '11am', '2 pm')
  const hourAmPmMatch = trimmed.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (hourAmPmMatch) {
    let h = parseInt(hourAmPmMatch[1], 10);
    const meridiem = hourAmPmMatch[2].toUpperCase() as 'AM' | 'PM';
    if (h >= 1 && h <= 12) {
      const hStr = String(h).padStart(2, '0');
      return { hours: hStr, minutes: '00', period: meridiem, formatted: `${hStr}:00 ${meridiem}` };
    }
  }

  // 3. Lone hour (e.g. '2', '14', '9')
  const loneHourMatch = trimmed.match(/^(\d{1,2})$/);
  if (loneHourMatch) {
    const h = parseInt(loneHourMatch[1], 10);
    if (h >= 13 && h <= 23) {
      const hStr = String(h - 12).padStart(2, '0');
      return { hours: hStr, minutes: '00', period: 'PM', formatted: `${hStr}:00 PM` };
    } else if (h >= 1 && h <= 12) {
      const hStr = String(h).padStart(2, '0');
      const p = (currentPeriod || (h >= 8 && h <= 11 ? 'AM' : 'PM')) as 'AM' | 'PM';
      return { hours: hStr, minutes: '00', period: p, formatted: `${hStr}:00 ${p}` };
    } else if (h === 0) {
      return { hours: '12', minutes: '00', period: 'AM', formatted: '12:00 AM' };
    }
  }

  return null;
};

export const MeetingTimePicker: React.FC<MeetingTimePickerProps> = ({
  value,
  onChange,
  label = 'Meeting Time',
  placeholder = 'hh:mm',
  required = true,
  zIndex = 3000,
  styles,
  leftSection,
  rightSection,
  error,
  hideQuickSelect = false,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [opened, setOpened] = useState(false);
  const [inputText, setInputText] = useState<string>(value || '');
  const [hours, setHours] = useState('11');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [exactMinInput, setExactMinInput] = useState('0');

  // Sync internal state when external value changes
  useEffect(() => {
    if (!value) {
      setInputText('');
      return;
    }
    const parsed = parseFlexibleTime(value, period);
    if (parsed) {
      setHours(parsed.hours);
      setMinutes(parsed.minutes);
      setPeriod(parsed.period);
      setExactMinInput(parseInt(parsed.minutes, 10).toString());
      const currentParsed = parseFlexibleTime(inputText, period);
      if (!currentParsed || currentParsed.formatted !== parsed.formatted) {
        setInputText(value);
      }
    }
  }, [value]);

  const updateFromParts = (h: string, m: string, p: 'AM' | 'PM') => {
    const formattedH = h ? (h.length === 1 ? `0${h}` : h) : '11';
    const formattedM = m ? (m.length === 1 ? `0${m}` : m) : '00';
    setHours(formattedH);
    setMinutes(formattedM);
    setPeriod(p);
    const newFormatted = `${formattedH}:${formattedM} ${p}`;
    setInputText(newFormatted);
    onChange(newFormatted);
  };

  const handlePeriodSelect = (p: 'AM' | 'PM') => {
    setPeriod(p);
    updateFromParts(hours, minutes, p);
  };

  const handleHourSelect = (h: string) => {
    setHours(h);
    updateFromParts(h, minutes, period);
  };

  const handleMinuteSelect = (m: string) => {
    setMinutes(m);
    setExactMinInput(parseInt(m, 10).toString());
    updateFromParts(hours, m, period);
  };

  const handleExactMinChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setExactMinInput(clean);
    if (clean !== '') {
      const num = parseInt(clean, 10);
      if (num <= 59) {
        const padded = clean.length === 1 ? `0${clean}` : clean;
        setMinutes(padded);
        updateFromParts(hours, padded, period);
      }
    }
  };

  const handleClearTime = () => {
    setHours('12');
    setMinutes('00');
    setPeriod('AM');
    setExactMinInput('0');
    setInputText('');
    onChange('');
  };

  const handleSelectSlot = (slot: string) => {
    const parsed = parseFlexibleTime(slot);
    if (parsed) {
      setHours(parsed.hours);
      setMinutes(parsed.minutes);
      setPeriod(parsed.period);
      setExactMinInput(parseInt(parsed.minutes, 10).toString());
      setInputText(parsed.formatted);
      onChange(parsed.formatted);
    }
  };

  const handleManualTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);

    const parsed = parseFlexibleTime(raw, period);
    if (parsed) {
      setHours(parsed.hours);
      setMinutes(parsed.minutes);
      setPeriod(parsed.period);
      setExactMinInput(parseInt(parsed.minutes, 10).toString());
      onChange(parsed.formatted);
    }
  };

  const handleBlur = () => {
    const parsed = parseFlexibleTime(inputText, period);
    if (parsed) {
      setInputText(parsed.formatted);
      onChange(parsed.formatted);
    } else if (inputText.trim() === '') {
      setInputText('');
      onChange('');
    } else {
      if (value) {
        setInputText(value);
      } else {
        setInputText('');
        onChange('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
      setOpened(false);
    } else if (e.key === 'Escape') {
      setOpened(false);
    }
  };

  return (
    <Box>
      <Popover
        opened={opened}
        onChange={setOpened}
        position="bottom-start"
        shadow="xl"
        radius="md"
        width={310}
        withArrow
        withinPortal
        zIndex={zIndex}
      >
        <Popover.Target>
          <TextInput
            label={label}
            placeholder={placeholder}
            required={required}
            withAsterisk={required}
            value={inputText}
            onChange={handleManualTimeChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={() => setOpened(true)}
            styles={styles || {
              label: { fontWeight: 600, fontSize: 13, color: isDark ? '#E2E8F0' : '#374151', marginBottom: 6 },
              input: {
                height: 44,
                borderRadius: 10,
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                fontSize: 14,
                color: isDark ? '#F8FAFC' : '#1E293B',
              },
            }}
            radius="md"
            leftSection={leftSection !== undefined ? leftSection : <IconClock size={16} />}
            error={error}
            rightSection={rightSection}
          />
        </Popover.Target>

        <Popover.Dropdown p="sm">
          {/* Header */}
          <Group justify="space-between" align="center" mb={8}>
            <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: '0.05em' }}>
              TIME (HH:MM A)
            </Text>
            <Badge
              size="md"
              radius="sm"
              variant="outline"
              styles={{
                root: {
                  borderColor: isDark ? '#475569' : '#D1D5DB',
                  color: isDark ? '#F1F5F9' : '#1F2937',
                  fontWeight: 700,
                  backgroundColor: isDark ? '#1E293B' : '#F3F4F6',
                },
              }}
            >
              {value || inputText || '11:00 AM'}
            </Badge>
          </Group>

          {/* Quick Select Buttons */}
          {!hideQuickSelect && (
            <>
              <Text size="xs" fw={700} c="dimmed" mb={4} style={{ letterSpacing: '0.03em' }}>
                QUICK SELECT
              </Text>
              <SimpleGrid cols={3} spacing={6} mb={8}>
                {QUICK_TIME_PRESETS.map((slot) => (
                  <Button
                    key={slot}
                    size="xs"
                    radius="md"
                    variant={inputText === slot ? 'filled' : 'light'}
                    color={inputText === slot ? 'orange' : 'gray'}
                    onClick={() => handleSelectSlot(slot)}
                    style={{
                      fontWeight: 600,
                      height: 28,
                      fontSize: 11,
                    }}
                  >
                    {slot}
                  </Button>
                ))}
              </SimpleGrid>

              {/* Standard Interval Select Dropdown */}
              <Select
                size="xs"
                placeholder="Select standard time slot..."
                data={STANDARD_TIME_SLOTS}
                value={STANDARD_TIME_SLOTS.includes(inputText) ? inputText : null}
                onChange={(val) => {
                  if (val) handleSelectSlot(val);
                }}
                searchable
                clearable
                radius="md"
                mb={8}
                styles={{
                  input: {
                    fontSize: 12,
                    fontWeight: 600,
                  },
                }}
              />
              <Divider mb={8} />
            </>
          )}

          {/* Period (AM / PM) */}
          <Text size="xs" fw={700} c="dimmed" mb={4} style={{ letterSpacing: '0.03em' }}>
            PERIOD (AM / PM)
          </Text>
          <SimpleGrid cols={2} spacing={6} mb={10}>
            {(['AM', 'PM'] as const).map((p) => (
              <Button
                key={p}
                size="xs"
                radius="md"
                onClick={() => handlePeriodSelect(p)}
                style={{
                  backgroundColor: period === p ? '#4B5563' : isDark ? '#1E293B' : '#F3F4F6',
                  color: period === p ? '#FFFFFF' : isDark ? '#94A3B8' : '#4B5563',
                  fontWeight: 700,
                  height: 30,
                  border: period === p ? 'none' : isDark ? '1px solid #334155' : '1px solid #E5E7EB',
                  transition: 'all 150ms ease',
                }}
              >
                {p}
              </Button>
            ))}
          </SimpleGrid>

          {/* Hour (01 - 12) */}
          <Text size="xs" fw={700} c="dimmed" mb={4} style={{ letterSpacing: '0.03em' }}>
            HOUR (01 – 12)
          </Text>
          <SimpleGrid cols={6} spacing={4} mb={10}>
            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((hr) => (
              <Button
                key={hr}
                size="xs"
                radius="sm"
                p={0}
                onClick={() => handleHourSelect(hr)}
                style={{
                  backgroundColor: hours === hr ? '#4B5563' : isDark ? '#1E293B' : '#FFFFFF',
                  color: hours === hr ? '#FFFFFF' : isDark ? '#F1F5F9' : '#1F2937',
                  height: 28,
                  fontSize: 12,
                  fontWeight: hours === hr ? 700 : 500,
                  border: hours === hr ? 'none' : isDark ? '1px solid #334155' : '1px solid #E5E7EB',
                  transition: 'all 150ms ease',
                }}
              >
                {hr}
              </Button>
            ))}
          </SimpleGrid>

          {/* Minute */}
          <Group justify="space-between" align="center" mb={4}>
            <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: '0.03em' }}>
              MINUTE
            </Text>
            <Text size="xs" c="dimmed" fw={600}>
              :{minutes}
            </Text>
          </Group>
          <SimpleGrid cols={6} spacing={4} mb={10}>
            {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((min) => (
              <Button
                key={min}
                size="xs"
                radius="sm"
                p={0}
                onClick={() => handleMinuteSelect(min)}
                style={{
                  backgroundColor: minutes === min ? '#4B5563' : isDark ? '#1E293B' : '#FFFFFF',
                  color: minutes === min ? '#FFFFFF' : isDark ? '#F1F5F9' : '#1F2937',
                  height: 28,
                  fontSize: 12,
                  fontWeight: minutes === min ? 700 : 500,
                  border: minutes === min ? 'none' : isDark ? '1px solid #334155' : '1px solid #E5E7EB',
                  transition: 'all 150ms ease',
                }}
              >
                {min}
              </Button>
            ))}
          </SimpleGrid>

          <Divider my={8} />

          {/* Footer */}
          <Group justify="space-between" align="center">
            <Button
              variant="subtle"
              size="xs"
              p={0}
              onClick={handleClearTime}
              style={{
                color: '#0078D4',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Clear Time
            </Button>

            <Group gap={4} align="center">
              <Text size="xs" c="dimmed" fw={500}>
                Exact Min:
              </Text>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={exactMinInput}
                onChange={(e) => handleExactMinChange(e.target.value)}
                placeholder="0"
                style={{
                  width: 38,
                  height: 26,
                  borderRadius: 4,
                  border: isDark ? '1px solid #374151' : '1px solid #D1D5DB',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  color: isDark ? '#FFFFFF' : '#1F2937',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </Group>

            <Button
              size="xs"
              radius="sm"
              onClick={() => setOpened(false)}
              style={{
                backgroundColor: '#374151',
                color: '#FFFFFF',
                fontWeight: 700,
                height: 26,
                padding: '0 14px',
              }}
            >
              Done
            </Button>
          </Group>
        </Popover.Dropdown>
      </Popover>
    </Box>
  );
};
