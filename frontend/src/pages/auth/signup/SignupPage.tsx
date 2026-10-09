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
  IconUser,
  IconMail,
  IconPhone,
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

interface SignupPageProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { setActiveNav } = useCRM();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [loading, setLoading] = useState(false);

  // Form States (Clean & Empty)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Error State
  const [errorMsg, setErrorMsg] = useState('');

  const handleReturnToDashboard = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveNav('dashboard');
    }
  };

  const handleGoToLogin = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      setActiveNav('login');
    }
  };

  const toggleColorScheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your Full Name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid Email Address');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your Phone Number');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter a Password (minimum 6 characters)');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match! Please check again.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg('Please agree to the Terms & Conditions to proceed.');
      return;
    }

    setLoading(true);
    try {
      const res = await crmApi.register({
        name,
        email,
        phone,
        password,
        confirmPassword,
      });

      if (res.success && res.user) {
        notifications.show({
          title: 'Account Created Successfully!',
          message: `Account created for ${res.user.name}. Please sign in to your workspace.`,
          color: 'teal',
          icon: <IconShieldCheck size={18} />,
        });
        // Automatically move to login screen
        handleGoToLogin();
      } else {
        setErrorMsg(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account. Please try again.');
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
              title="Enterprise CRM & Agile IT Platform"
              subtitle="Manage client proposals, developer bench staffing, sprint milestones & real-time SLAs in one unified suite."
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
                {/* Top Navigation Bar: Return Link, Dark/Light Mode Toggle, Sign In Link */}
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
                      onClick={handleGoToLogin}
                    >
                      Have an account? Sign In →
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
                    <Badge size="xs" color="blue" variant="light">
                      v2.4
                    </Badge>
                  </Group>
                </Box>

                {/* Header Title */}
                <Box mb="md">
                  <Text fw={800} size="22px" style={{ color: textColor, letterSpacing: '-0.02em' }}>
                    Create Your Account
                  </Text>
                  <Text size="xs" style={{ color: subtextColor }}>
                    Set up your administrator profile to access the CRM platform.
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

                {/* Signup Form */}
                <form onSubmit={handleSignup}>
                  <Stack gap="xs">
                    {/* Row 1: Name & Phone (2 Columns on tablet+, 1 Column on small mobile) */}
                    <Grid gutter="xs">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label={<Text size="xs" fw={700} style={{ color: textColor }}>Full Name</Text>}
                          placeholder="Enter a name"
                          value={name}
                          onChange={(e) => setName(e.currentTarget.value)}
                          leftSection={<IconUser size={15} color={subtextColor} />}
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
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label={<Text size="xs" fw={700} style={{ color: textColor }}>Phone Number</Text>}
                          placeholder="Enter phone number"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.currentTarget.value)}
                          leftSection={<IconPhone size={15} color={subtextColor} />}
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
                      </Grid.Col>
                    </Grid>

                    {/* Row 2: Email (Full Width) */}
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

                    {/* Row 3: Password & Confirm Password (2 Columns on tablet+, 1 Column on small mobile) */}
                    <Grid gutter="xs">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <PasswordInput
                          label={<Text size="xs" fw={700} style={{ color: textColor }}>Password</Text>}
                          placeholder="Create password"
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
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <PasswordInput
                          label={<Text size="xs" fw={700} style={{ color: textColor }}>Confirm Password</Text>}
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
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
                      </Grid.Col>
                    </Grid>

                    {/* Checkbox */}
                    <Checkbox
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.currentTarget.checked)}
                      label={
                        <Text size="xs" style={{ color: subtextColor }}>
                          I agree to the{' '}
                          <Anchor size="xs" fw={600} style={{ color: isDark ? '#38BDF8' : CRM_COLORS.primary }}>
                            Terms & Conditions
                          </Anchor>
                        </Text>
                      }
                      mt={4}
                      radius="xs"
                      size="xs"
                    />

                    {/* Submit Button */}
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
                        height: 40,
                        boxShadow: isDark
                          ? '0 8px 20px rgba(56, 189, 248, 0.3)'
                          : '0 8px 18px rgba(20, 24, 31, 0.18)',
                      }}
                    >
                      Create Account
                    </Button>
                  </Stack>
                </form>
              </Box>

              {/* Footer Switch */}
              <Group justify="center" mt="md" pt="xs" style={{ borderTop: `1px solid ${cardBorder}` }}>
                <Text size="xs" style={{ color: subtextColor }}>
                  Already registered?
                </Text>
                <Anchor
                  size="xs"
                  fw={700}
                  style={{ color: isDark ? '#38BDF8' : CRM_COLORS.primary, cursor: 'pointer' }}
                  onClick={handleGoToLogin}
                >
                  Sign in here
                </Anchor>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignupPage;
