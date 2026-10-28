import React from 'react';
import {
  Grid,
  Stack,
  Group,
  ThemeIcon,
  Text,
  Badge,
  Box,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconTerminal2,
  IconCode,
  IconCpu,
  IconServer,
  IconShieldLock,
  IconSparkles,
} from '@tabler/icons-react';

interface AuthShowcasePanelProps {
  title?: string;
  subtitle?: string;
}

export const AuthShowcasePanel: React.FC<AuthShowcasePanelProps> = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  return (
    <Grid.Col
      span={{ base: 12, md: 5 }}
      visibleFrom="md"
      p={{ base: 'xl', md: 36 }}
      style={{
        background: isDark
          ? 'linear-gradient(160deg, #090D16 0%, #0F172A 60%, #131D33 100%)'
          : 'linear-gradient(160deg, #0D1525 0%, #162035 60%, #1C2B47 100%)',
        color: '#FFFFFF',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
      }}
    >
      {/* Dynamic CSS Keyframe Animations */}
      <style>
        {`
          @keyframes orbitRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes reverseOrbit {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          @keyframes floatGentle {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-8px) scale(1.02); }
          }
          @keyframes glowPulse {
            0%, 100% { opacity: 0.35; filter: blur(70px); }
            50% { opacity: 0.65; filter: blur(85px); }
          }
          @keyframes liveDotPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.4; }
          }
        `}
      </style>

      {/* Ambient background light glows */}
      <Box
        style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: '#38BDF8',
          animation: 'glowPulse 6s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: '#818CF8',
          animation: 'glowPulse 7s ease-in-out infinite 1.5s',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header: Clean Brand Logo */}
      <Group justify="space-between" align="center" style={{ width: '100%', position: 'relative', zIndex: 2 }}>
        <Group gap="xs">
          <ThemeIcon
            size="lg"
            radius="12px"
            style={{
              background: 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)',
            }}
          >
            <IconTerminal2 size={20} stroke={2.5} />
          </ThemeIcon>
          <Box>
            <Text fw={800} size="18px" style={{ color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              IT CRM
            </Text>
            <Text size="10px" fw={600} style={{ color: '#38BDF8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Enterprise Platform
            </Text>
          </Box>
        </Group>
      </Group>

      {/* Central IT Animation Element */}
      <Box
        style={{
          position: 'relative',
          width: 260,
          height: 260,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          my: 'auto',
          zIndex: 2,
        }}
      >
        {/* Outer Orbit Ring with dashed border */}
        <Box
          style={{
            position: 'absolute',
            width: 240,
            height: 240,
            borderRadius: '50%',
            border: '1.5px dashed rgba(56, 189, 248, 0.35)',
            animation: 'orbitRotate 20s linear infinite',
          }}
        >
          {/* Orbital Satellite Node 1 (Code) */}
          <Box
            style={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284C7, #38BDF8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.6)',
            }}
          >
            <IconCode size={14} color="#FFFFFF" stroke={2.5} />
          </Box>

          {/* Orbital Satellite Node 2 (Server) */}
          <Box
            style={{
              position: 'absolute',
              bottom: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.6)',
            }}
          >
            <IconServer size={13} color="#FFFFFF" stroke={2.5} />
          </Box>
        </Box>

        {/* Inner Counter-Orbit Ring */}
        <Box
          style={{
            position: 'absolute',
            width: 170,
            height: 170,
            borderRadius: '50%',
            border: '1.5px dashed rgba(129, 140, 248, 0.4)',
            animation: 'reverseOrbit 14s linear infinite',
          }}
        >
          {/* Satellite Node 3 (Shield) */}
          <Box
            style={{
              position: 'absolute',
              top: '50%',
              right: -10,
              transform: 'translateY(-50%)',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)',
            }}
          >
            <IconShieldLock size={12} color="#FFFFFF" stroke={2.5} />
          </Box>

          {/* Satellite Node 4 (Sparkles) */}
          <Box
            style={{
              position: 'absolute',
              top: '50%',
              left: -10,
              transform: 'translateY(-50%)',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)',
            }}
          >
            <IconSparkles size={12} color="#FFFFFF" stroke={2.5} />
          </Box>
        </Box>

        {/* Central Floating IT Core */}
        <Box
          style={{
            width: 100,
            height: 100,
            borderRadius: '26px',
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%)',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(56, 189, 248, 0.2)',
            animation: 'floatGentle 4s ease-in-out infinite',
          }}
        >
          <Box
            style={{
              width: 60,
              height: 60,
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(14, 165, 233, 0.5)',
            }}
          >
            <IconCpu size={32} color="#FFFFFF" stroke={2.2} />
          </Box>
        </Box>
      </Box>

      {/* Bottom Live System Indicator Badge */}
      <Box
        p="6px 14px"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '100px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Group gap={8} align="center">
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#34D399',
              boxShadow: '0 0 8px #34D399',
              animation: 'liveDotPulse 2s ease-in-out infinite',
            }}
          />
          <Text size="11px" fw={700} style={{ color: '#E2E8F0', letterSpacing: '0.04em' }}>
            IT Core System Active
          </Text>
        </Group>
      </Box>
    </Grid.Col>
  );
};

export default AuthShowcasePanel;
