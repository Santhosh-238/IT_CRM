import React from 'react';
import { Paper, Stack, Text, ThemeIcon, Button, Group } from '@mantine/core';
import { IconShieldLock, IconArrowLeft } from '@tabler/icons-react';
import { usePermissions } from '../../context/AccessControlContext';
import { PermissionAction } from '../../types/accessControl';
import { useCRM } from '../../context/CRMContext';

interface PermissionGuardProps {
  module: string;
  action?: PermissionAction;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action = 'view',
  fallback,
  children,
}) => {
  const { can } = usePermissions();
  const { setActiveNav } = useCRM();

  const isAllowed = can(module, action);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <Paper
      p="xl"
      radius="24px"
      style={{
        maxWidth: 540,
        margin: '60px auto',
        textAlign: 'center',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        background: 'rgba(239, 68, 68, 0.03)',
      }}
    >
      <Stack align="center" gap="md">
        <ThemeIcon size={64} radius="100px" color="red" variant="light">
          <IconShieldLock size={32} />
        </ThemeIcon>

        <div>
          <Text fw={800} size="xl" style={{ letterSpacing: '-0.02em' }}>
            Access Restricted (403)
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            Your assigned role does not have <Text span fw={700} c="red">{action.toUpperCase()}</Text> permissions for the <Text span fw={700}>{module.toUpperCase()}</Text> module.
          </Text>
        </div>

        <Text size="xs" c="dimmed">
          Please contact your System Administrator to request elevated access credentials.
        </Text>

        <Group mt="sm">
          <Button
            variant="default"
            radius="100px"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => setActiveNav('dashboard')}
          >
            Back to Dashboard
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};

export default PermissionGuard;
