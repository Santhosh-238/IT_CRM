import React, { useState } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Group,
  Stack,
  Text,
  Box,
  Container,
  Grid,
  Anchor,
  Tooltip,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  ThemeIcon,
  Badge,
} from '@mantine/core';
import {
  IconMail,
  IconLock,
  IconShieldCheck,
  IconArrowRight,
  IconArrowLeft,
  IconSun,
  IconMoon,
  IconTerminal2,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useCRM } from '../../../context/CRMContext';
import { crmApi } from '../../../services/api';
import { CRM_COLORS } from '../../../theme/colors';
import { AuthShowcasePanel } from '../components/AuthShowcasePanel';

interface LoginPageProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  defaultEmail?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onSwitchToSignup, defaultEmail = '' }) => {
  const { setCurrentUser, setActiveNav } = useCRM();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [loading, setLoading] = useState(false);

  // Form States (Clean & Empty)
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Error State
  const [errorMsg, setErrorMsg] = useState('');

  const handleReturnToDashboard = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveNav('dashboard');
    }
  };

  const handleGoToSignup = () => {
    if (onSwitchToSignup) {
      onSwitchToSignup();
    } else {
      setActiveNav('signup');
    }
  };

  const toggleColorScheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid Email Address');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your Password');
      return;
    }

    setLoading(true);
    try {
      const res = await crmApi.login({ email, password });
      if (res.success && res.user) {
        setCurrentUser(res.user);
        notifications.show({
          title: 'Welcome Back!',
          message: `Signed in as ${res.user.name}. Redis session active.`,
          color: 'teal',
          icon: <IconShieldCheck size={18} />,
        });
        handleReturnToDashboard();
      } else {
        setErrorMsg(res.message || 'Invalid email or password');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password. Please check.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Theme Colors
  const pageBg = isDark
    ? 'radial-gradient(circle at 15% 15%, rgba(14, 165, 233, 0.12) 0%, #0B0F19 60%, rgba(168, 85, 247, 0.08) 100%)'
    : 'radial-gradient(circle at 15% 15%, rgba(201, 228, 254, 0.5) 0%, #EDF3F7 60%, rgba(226, 214, 254, 0.4) 100%)';

  const cardBg = isDark ? '#131B2E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : CRM_COLORS.borderLight;
  const textColor = isDark ? '#F8FAFC' : CRM_COLORS.textPrimary;
  const subtextColor = isDark ? '#94A3B8' : CRM_COLORS.textSecondary;
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : undefined;
  const inputTextColor = isDark ? '#F8FAFC' : undefined;

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 12px',
        fontFamily: "'Outfit', sans-serif",
        transition: 'background 0.3s ease',
      }}
    >
      <Container size="lg" p={0} style={{ width: '100%', maxWidth: 1040 }}>
        <Paper
          radius="28px"
          style={{
            overflow: 'hidden',
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: isDark
              ? '0 24px 60px -12px rgba(0, 0, 0, 0.6)'
              : '0 24px 60px -12px rgba(20, 24, 31, 0.12), 0 8px 24px -4px rgba(20, 24, 31, 0.06)',
            transition: 'all 0.3s ease',
          }}
        >
          <Grid gutter={0} style={{ minHeight: 560, alignItems: 'stretch' }}>
            {/* Left Showcase Side (Desktop only: visibleFrom="md") */}
            <AuthShowcasePanel
              title="Welcome Back to Your Workspace"
              subtitle="Access your active pipeline, sprint milestones, client contracts & financial forecasts."
            />

            {/* Right Form Side (Full width on mobile) */}
            <Grid.Col
              span={{ base: 12, md: 7 }}
              p={{ base: 'lg', sm: 'xl', md: 36 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: cardBg,
              }}
            >
              <Box>
                {/* Top Navigation Bar */}
                <Group justify="space-between" align="center" mb="md">
                  <Tooltip label="Return to CRM Dashboard">
                    <Button
                      variant="subtle"
                      size="xs"
                      radius="100px"
                      leftSection={<IconArrowLeft size={14} />}
                      style={{ color: subtextColor, fontWeight: 600 }}
                      onClick={handleReturnToDashboard}
                    >
                      Return to CRM
                    </Button>
                  </Tooltip>

                  <Group gap="xs">
                    <Tooltip label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                      <ActionIcon
                        variant="light"
                        radius="100px"
                        size="md"
                        color={isDark ? 'yellow' : 'gray'}
                        onClick={toggleColorScheme}
                      >
                        {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
                      </ActionIcon>
                    </Tooltip>

                    <Anchor
                      size="xs"
                      fw={700}
                      style={{ color: isDark ? '#38BDF8' : CRM_COLORS.primary, cursor: 'pointer' }}
                      onClick={handleGoToSignup}
                    >
                      Need an account? Create Account →
                    </Anchor>
                  </Group>
                </Group>

                {/* Mobile-Only Compact Brand Header */}
                <Box hiddenFrom="md" mb="md" pb="xs" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="8px" style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)', color: '#FFFFFF' }}>
                      <IconTerminal2 size={14} stroke={2.5} />
                    </ThemeIcon>
                    <Text fw={800} size="sm" style={{ color: textColor }}>
                      IT CRM
                    </Text>
                  </Group>
                </Box>

                {/* Header Title */}
                <Box mb="md">
                  <Text fw={800} size="22px" style={{ color: textColor, letterSpacing: '-0.02em' }}>
                    Sign In to Your Workspace
                  </Text>
                  <Text size="xs" style={{ color: subtextColor }}>
                    Enter your verified credentials to access your sales & project pipeline.
                  </Text>
                </Box>

                {/* Error Banner */}
                {errorMsg && (
                  <Box
                    p="8px 12px"
                    mb="sm"
                    style={{
                      background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 183, 180, 0.25)',
                      border: `1px solid ${isDark ? '#EF4444' : CRM_COLORS.pastelCoral}`,
                      borderRadius: '12px',
                    }}
                  >
                    <Text size="xs" fw={700} style={{ color: isDark ? '#FCA5A5' : '#9B1C1C' }}>
                      {errorMsg}
                    </Text>
                  </Box>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin}>
                  <Stack gap="md">
                    <TextInput
                      label={<Text size="xs" fw={700} style={{ color: textColor }}>Email Address</Text>}
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.currentTarget.value)}
                      leftSection={<IconMail size={15} color={subtextColor} />}
                      radius="10px"
                      size="sm"
                      styles={{
                        input: {
                          background: inputBg,
                          borderColor: inputBorder,
                          color: inputTextColor,
                        },
                      }}
                      required
                    />

                    <PasswordInput
                      label={<Text size="xs" fw={700} style={{ color: textColor }}>Password</Text>}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.currentTarget.value)}
                      leftSection={<IconLock size={15} color={subtextColor} />}
                      radius="10px"
                      size="sm"
                      styles={{
                        input: {
                          background: inputBg,
                          borderColor: inputBorder,
                          color: inputTextColor,
                        },
                      }}
                      required
                    />

                    <Group justify="space-between" align="center">
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.currentTarget.checked)}
                        label={<Text size="xs" style={{ color: subtextColor }}>Remember this session</Text>}
                        radius="xs"
                        size="xs"
                      />
                      <Anchor size="xs" fw={600} style={{ color: isDark ? '#38BDF8' : CRM_COLORS.primary }}>
                        Forgot password?
                      </Anchor>
                    </Group>

                    <Button
                      type="submit"
                      loading={loading}
                      size="sm"
                      radius="100px"
                      mt="xs"
                      rightSection={<IconArrowRight size={15} />}
                      style={{
                        background: isDark ? '#38BDF8' : CRM_COLORS.primary,
                        color: isDark ? '#0F172A' : CRM_COLORS.textOnPrimary,
                        fontWeight: 700,
                        height: 42,
                        boxShadow: isDark
                          ? '0 8px 20px rgba(56, 189, 248, 0.3)'
                          : '0 8px 18px rgba(20, 24, 31, 0.18)',
                      }}
                    >
                      Sign In to Workspace
                    </Button>
                  </Stack>
                </form>
              </Box>

              {/* Footer Switch */}
              <Group justify="center" mt="md" pt="xs" style={{ borderTop: `1px solid ${cardBorder}` }}>
                <Text size="xs" style={{ color: subtextColor }}>
                  Need a new account?
                </Text>
                <Anchor
                  size="xs"
                  fw={700}
                  style={{ color: isDark ? '#38BDF8' : CRM_COLORS.primary, cursor: 'pointer' }}
                  onClick={handleGoToSignup}
                >
                  Create an Account
                </Anchor>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
