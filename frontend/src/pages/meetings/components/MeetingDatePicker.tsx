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
  zIndex?: number;
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
  const parts = ymdStr.split(/[-/. ]+/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      const d = parts[2].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[0];
      return `${d}-${m}-${y}`;
    } else {
      // DD-MM-YYYY
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${d}-${m}-${y}`;
    }
  }
  return ymdStr;
};

const parseFlexibleDate = (str: string): Date | null => {
  if (!str) return null;
  const trimmed = str.trim();

  // Check 8-digit ddmmyyyy e.g. '13102026'
  const eightDigit = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (eightDigit) {
    const day = parseInt(eightDigit[1], 10);
    const month = parseInt(eightDigit[2], 10) - 1;
    const year = parseInt(eightDigit[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year >= 1970 && year <= 2100) {
      const d = new Date(year, month, day);
      if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return d;
      }
    }
  }

  // Split on -, /, ., or space
  const parts = trimmed.split(/[-/. ]+/);
  if (parts.length === 3) {
    let day: number, month: number, year: number;

    if (parts[0].length === 4) {
      // YYYY-MM-DD format
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      // DD-MM-YYYY format
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      let yr = parseInt(parts[2], 10);
      if (yr < 100) {
        yr = yr < 50 ? 2000 + yr : 1900 + yr;
      }
      year = yr;
    }

    if (
      !isNaN(day) && !isNaN(month) && !isNaN(year) &&
      month >= 0 && month <= 11 &&
      day >= 1 && day <= 31 &&
      year >= 1970 && year <= 2100
    ) {
      const d = new Date(year, month, day);
      if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return d;
      }
    }
  }
  return null;
};

export const MeetingDatePicker: React.FC<MeetingDatePickerProps> = ({
  value,
  onChange,
  label = 'Meeting Date',
  placeholder = 'DD-MM-YYYY',
  required = true,
  zIndex = 1500,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [opened, setOpened] = useState(false);

  // Local text input state so typing is completely smooth without cursor jumps
  const [inputText, setInputText] = useState<string>(() => formatToDMY(value));

  // Calendar navigator state
  const initialDate = parseFlexibleDate(value) || new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Synchronize internal state when external value changes
  useEffect(() => {
    const parsedExt = parseFlexibleDate(value);
    if (parsedExt) {
      setViewYear(parsedExt.getFullYear());
      setViewMonth(parsedExt.getMonth());
      const dmy = formatToDMY(value);
      const currentParsed = parseFlexibleDate(inputText);
      if (!currentParsed || currentParsed.getTime() !== parsedExt.getTime()) {
        setInputText(dmy);
      }
    } else if (!value) {
      setInputText('');
    }
  }, [value]);

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday

  const today = new Date();
  const todayYMD = formatToYMD(today);
  const selectedYMD = value ? (parseFlexibleDate(value) ? formatToYMD(parseFlexibleDate(value)!) : value) : '';

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
    const dmy = formatToDMY(ymd);
    setInputText(dmy);
    onChange(ymd);
  };

  const handleQuickSelect = (daysFromToday: number) => {
    const target = new Date();
    target.setDate(today.getDate() + daysFromToday);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    const ymd = formatToYMD(target);
    const dmy = formatToDMY(ymd);
    setInputText(dmy);
    onChange(ymd);
  };

  const handleClear = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    const ymd = formatToYMD(now);
    const dmy = formatToDMY(ymd);
    setInputText(dmy);
    onChange(ymd);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);

    const parsed = parseFlexibleDate(raw);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
      onChange(formatToYMD(parsed));
    }
  };

  const handleBlur = () => {
    const parsed = parseFlexibleDate(inputText);
    if (parsed) {
      const dmy = formatToDMY(formatToYMD(parsed));
      setInputText(dmy);
      onChange(formatToYMD(parsed));
    } else if (inputText.trim() === '') {
      setInputText('');
      onChange('');
    } else {
      // If invalid or incomplete string was typed, revert to last valid value or clear
      if (value) {
        setInputText(formatToDMY(value));
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
            onChange={handleManualChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={() => setOpened(true)}
            radius="md"
            rightSection={
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpened((o) => !o);
                }}
                title="Open Calendar"
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
              {formatToDMY(value) || inputText || formatToDMY(todayYMD)}
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
