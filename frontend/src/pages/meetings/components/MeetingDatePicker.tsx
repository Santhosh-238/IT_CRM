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
  useComputedColorScheme,
} from '@mantine/core';
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface MeetingDatePickerProps {
  value: string; // expects YYYY-MM-DD or DD-MM-YYYY
  onChange: (value: string) => void; // outputs YYYY-MM-DD
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatToYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatToDMY = (ymdStr: string): string => {
  if (!ymdStr) return '';
  const parts = ymdStr.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // already DD-MM-YYYY
    return ymdStr;
  }
  return ymdStr;
};

const parseDateString = (str: string): Date | null => {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    } else {
      // DD-MM-YYYY
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export const MeetingDatePicker: React.FC<MeetingDatePickerProps> = ({
  value,
  onChange,
  label = 'Meeting Date',
  placeholder = 'DD-MM-YYYY',
  required = true,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [opened, setOpened] = useState(false);

  // Parse current date or fallback to today
  const initialDate = parseDateString(value) || new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Sync view when external value changes
  useEffect(() => {
    const d = parseDateString(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday

  const today = new Date();
  const todayYMD = formatToYMD(today);
  const selectedYMD = value ? (parseDateString(value) ? formatToYMD(parseDateString(value)!) : value) : '';

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const chosen = new Date(viewYear, viewMonth, dayNum);
    const ymd = formatToYMD(chosen);
    onChange(ymd);
  };

  const handleQuickSelect = (daysFromToday: number) => {
    const target = new Date();
    target.setDate(today.getDate() + daysFromToday);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    onChange(formatToYMD(target));
  };

  const handleClear = () => {
    const ymd = formatToYMD(new Date());
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(ymd);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    // Allow user to type DD-MM-YYYY or YYYY-MM-DD
    const d = parseDateString(val);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      onChange(formatToYMD(d));
    } else {
      onChange(val);
    }
  };

  const displayFormattedValue = value ? formatToDMY(value) : '';

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
        zIndex={1000}
      >
        <Popover.Target>
          <TextInput
            label={label}
            placeholder={placeholder}
            required={required}
            withAsterisk={required}
            value={displayFormattedValue}
            onChange={handleManualChange}
            onClick={() => setOpened(true)}
            leftSection={<IconCalendar size={16} color="#64748B" />}
            rightSection={
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpened((o) => !o);
                }}
              >
                <IconCalendar size={16} />
              </ActionIcon>
            }
          />
        </Popover.Target>

        <Popover.Dropdown p="sm">
          {/* Header */}
          <Group justify="space-between" align="center" mb={8}>
            <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: '0.05em' }}>
              CALENDAR DATE
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
              {displayFormattedValue || formatToDMY(todayYMD)}
            </Badge>
          </Group>
          <Divider mb={8} />

          {/* Quick Select Presets */}
          <Text size="xs" fw={700} c="dimmed" mb={4} style={{ letterSpacing: '0.03em' }}>
            QUICK SELECT
          </Text>
          <SimpleGrid cols={3} spacing={6} mb={10}>
            {[
              { label: 'Today', offset: 0 },
              { label: 'Tomorrow', offset: 1 },
              { label: '+1 Week', offset: 7 },
            ].map((p) => {
              const testDate = new Date();
              testDate.setDate(today.getDate() + p.offset);
              const isMatch = selectedYMD === formatToYMD(testDate);
              return (
                <Button
                  key={p.label}
                  size="xs"
                  radius="md"
                  onClick={() => handleQuickSelect(p.offset)}
                  style={{
                    backgroundColor: isMatch ? '#4B5563' : isDark ? '#1E293B' : '#F3F4F6',
                    color: isMatch ? '#FFFFFF' : isDark ? '#94A3B8' : '#4B5563',
                    fontWeight: 700,
                    height: 28,
                    border: isMatch ? 'none' : isDark ? '1px solid #334155' : '1px solid #E5E7EB',
                    transition: 'all 150ms ease',
                  }}
                >
                  {p.label}
                </Button>
              );
            })}
          </SimpleGrid>

          {/* Month / Year Navigator */}
          <Group justify="space-between" align="center" mb={8} px={4}>
            <ActionIcon variant="subtle" size="sm" color="gray" onClick={handlePrevMonth}>
              <IconChevronLeft size={16} />
            </ActionIcon>
            <Text size="sm" fw={700} style={{ color: isDark ? '#F8FAFC' : '#1F2937' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <ActionIcon variant="subtle" size="sm" color="gray" onClick={handleNextMonth}>
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>

          {/* Day of Week Headers */}
          <SimpleGrid cols={7} spacing={2} mb={4}>
            {DAY_LABELS.map((d) => (
              <Text
                key={d}
                size="xs"
                fw={700}
                c="dimmed"
                ta="center"
                style={{ fontSize: 11 }}
              >
                {d}
              </Text>
            ))}
          </SimpleGrid>

          {/* Day Buttons Grid */}
          <SimpleGrid cols={7} spacing={2} mb={10}>
            {/* Blank placeholders for days before 1st of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <Box key={`blank-${i}`} style={{ height: 28 }} />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(viewYear, viewMonth, dayNum);
              const dateYMD = formatToYMD(dateObj);
              const isSelected = selectedYMD === dateYMD;
              const isToday = todayYMD === dateYMD;

              return (
                <Button
                  key={`day-${dayNum}`}
                  size="xs"
                  radius="sm"
                  p={0}
                  onClick={() => handleSelectDay(dayNum)}
                  style={{
                    backgroundColor: isSelected
                      ? '#4B5563'
                      : isToday
                      ? isDark ? '#14532D' : '#DCFCE7'
                      : isDark ? '#1E293B' : '#FFFFFF',
                    color: isSelected
                      ? '#FFFFFF'
                      : isToday
                      ? isDark ? '#86EFAC' : '#15803D'
                      : isDark ? '#F1F5F9' : '#1F2937',
                    height: 28,
                    fontSize: 12,
                    fontWeight: isSelected || isToday ? 700 : 500,
                    border: isSelected
                      ? 'none'
                      : isToday
                      ? '1px solid #16A34A'
                      : isDark ? '1px solid #334155' : '1px solid #E5E7EB',
                    transition: 'all 150ms ease',
                  }}
                >
                  {dayNum}
                </Button>
              );
            })}
          </SimpleGrid>

          <Divider my={8} />

          {/* Footer */}
          <Group justify="space-between" align="center">
            <Button
              variant="subtle"
              size="xs"
              p={0}
              onClick={handleClear}
              style={{
                color: '#0078D4',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Reset Today
            </Button>

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
