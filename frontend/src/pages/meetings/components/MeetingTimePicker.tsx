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
import { IconClock } from '@tabler/icons-react';

interface MeetingTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const MeetingTimePicker: React.FC<MeetingTimePickerProps> = ({
  value,
  onChange,
  label = 'Meeting Time',
  placeholder = '11:00 AM',
  required = true,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [opened, setOpened] = useState(false);
  const [hours, setHours] = useState('11');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [exactMinInput, setExactMinInput] = useState('0');

  // Sync internal state when external value changes
  useEffect(() => {
    if (!value) return;
    const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (match) {
      const hNum = parseInt(match[1], 10);
      const mNum = parseInt(match[2], 10);
      if (hNum >= 1 && hNum <= 12 && mNum >= 0 && mNum <= 59) {
        const hStr = hNum < 10 ? `0${hNum}` : `${hNum}`;
        const mStr = mNum < 10 ? `0${mNum}` : `${mNum}`;
        const pStr = match[3] ? match[3].toUpperCase() : 'AM';
        setHours(hStr);
        setMinutes(mStr);
        setPeriod(pStr);
        setExactMinInput(mNum.toString());
      }
    }
  }, [value]);

  const updateFromParts = (h: string, m: string, p: string) => {
    const formattedH = h ? (h.length === 1 ? `0${h}` : h) : '11';
    const formattedM = m ? (m.length === 1 ? `0${m}` : m) : '00';
    setHours(formattedH);
    setMinutes(formattedM);
    setPeriod(p);
    onChange(`${formattedH}:${formattedM} ${p}`);
  };

  const handlePeriodSelect = (p: string) => {
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
    onChange('12:00 AM');
  };

  const handleManualTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    const match = val.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (match) {
      const hNum = parseInt(match[1], 10);
      const mNum = parseInt(match[2], 10);
      if (hNum >= 1 && hNum <= 12 && mNum >= 0 && mNum <= 59) {
        const hStr = hNum < 10 ? `0${hNum}` : `${hNum}`;
        const mStr = mNum < 10 ? `0${mNum}` : `${mNum}`;
        const pStr = match[3] ? match[3].toUpperCase() : period;
        setHours(hStr);
        setMinutes(mStr);
        setPeriod(pStr);
        setExactMinInput(mNum.toString());
      }
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
        zIndex={1000}
      >
        <Popover.Target>
          <TextInput
            label={label}
            placeholder={placeholder}
            required={required}
            withAsterisk={required}
            value={value}
            onChange={handleManualTimeChange}
            onClick={() => setOpened(true)}
            leftSection={<IconClock size={16} color="#64748B" />}
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
                <IconClock size={16} />
              </ActionIcon>
            }
          />
        </Popover.Target>

        <Popover.Dropdown p="sm">
          {/* Header */}
          <Group justify="space-between" align="center" mb={8}>
            <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: '0.05em' }}>
              12-HOUR TIME
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
              {value || '11:00 AM'}
            </Badge>
          </Group>
          <Divider mb={8} />

          {/* Period (AM / PM) */}
          <Text size="xs" fw={700} c="dimmed" mb={4} style={{ letterSpacing: '0.03em' }}>
            PERIOD (AM / PM)
          </Text>
          <SimpleGrid cols={2} spacing={6} mb={10}>
            {['AM', 'PM'].map((p) => (
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
