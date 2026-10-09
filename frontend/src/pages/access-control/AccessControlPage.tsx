import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  TextInput,
  Select,
  Modal,
  Textarea,
  Avatar,
  Collapse,
  Switch,
  UnstyledButton,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconShield,
  IconShieldLock,
  IconUsers,
  IconSitemap,
  IconPlus,
  IconSearch,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconLock,
  IconWorld,
  IconMail,
  IconPhone,
  IconLayoutGrid,
  IconUser,
  IconBuildingStore,
  IconCalendar,
  IconClipboardList,
  IconSettings,
  IconClockCheck,
  IconClock,
  IconChartBar,
  IconCalendarOff,
  IconAddressBook,
  IconBuilding,
  IconFlame,
  IconBriefcase,
  IconFolders,
  IconMapPin,
  IconFileText,
  IconRoute,
  IconHistory,
} from '@tabler/icons-react';
import { useAccessControl } from '../../context/AccessControlContext';
import { Role, RolePermission, UserWithRole, AppType } from '../../types/accessControl';

interface TreeNodeData {
  role: Role;
  children: TreeNodeData[];
  level: number;
}

interface DynamicTreeNodeProps {
  node: TreeNodeData;
  users: UserWithRole[];
  onSelectRole: (role: Role) => void;
  isDark: boolean;
}

const DynamicTreeNode: React.FC<DynamicTreeNodeProps> = ({
  node,
  users,
  onSelectRole,
  isDark,
}) => {
  const { role, children, level } = node;
  const memberCount = users.filter((u) => u.roleId === role.id || u.role?.toUpperCase() === role.slug.toUpperCase()).length;

  // Dynamic gradient based on hierarchy level and role attributes
  const getGradientByLevel = (lvl: number, appType: string, slug: string) => {
    if (lvl === 0 || slug === 'admin' || slug === 'super_admin') {
      return {
        bg: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', // Deep Indigo / Purple
        shadow: '0 10px 25px rgba(99, 102, 241, 0.35)',
      };
    }
    if (lvl === 1 || appType === 'manager') {
      return {
        bg: 'linear-gradient(135deg, #0D9488 0%, #059669 100%)', // Emerald / Teal
        shadow: '0 10px 25px rgba(13, 148, 136, 0.35)',
      };
    }
    if (slug.includes('madurai') || slug.includes('orange') || slug.includes('east') || slug.includes('south')) {
      return {
        bg: 'linear-gradient(135deg, #D97706 0%, #EA580C 100%)', // Vibrant Amber / Orange
        shadow: '0 8px 24px rgba(234, 88, 12, 0.35)',
      };
    }
    return {
      bg: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', // Teal / Cyan
      shadow: '0 8px 20px rgba(13, 148, 136, 0.3)',
    };
  };

  const styleConfig = getGradientByLevel(level, role.appType, role.slug);
  const lineColor = isDark ? '#475569' : '#CBD5E1';

  return (
    <Stack align="center" gap={0} style={{ position: 'relative' }}>
      {/* Node Card */}
      <Paper
        p="md"
        radius="16px"
        onClick={() => onSelectRole(role)}
        style={{
          background: styleConfig.bg,
          color: '#FFFFFF',
          textAlign: 'center',
          minWidth: 175,
          cursor: 'pointer',
          boxShadow: styleConfig.shadow,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          userSelect: 'none',
          zIndex: 3,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        <Text fw={800} size={level === 0 ? '14px' : '13px'} tt="uppercase" style={{ letterSpacing: '0.04em' }}>
          {role.name}
        </Text>
        <Text size="11px" style={{ opacity: 0.88, marginTop: 2 }}>
          {memberCount} member{memberCount === 1 ? '' : 's'}
        </Text>
      </Paper>

      {/* Children branches if any */}
      {children.length > 0 && (
        <>
          {/* Vertical line down from parent */}
          <Box style={{ width: 2, height: 28, background: lineColor, flexShrink: 0 }} />

          {children.length === 1 ? (
            // Single child: Direct vertical connection
            <DynamicTreeNode
              node={children[0]}
              users={users}
              onSelectRole={onSelectRole}
              isDark={isDark}
            />
          ) : (
            // Multiple children: Horizontal connector bar and branch drops
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <Box
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: '40px',
                  position: 'relative',
                  paddingTop: 18,
                }}
              >
                {children.map((child, idx) => (
                  <Box
                    key={child.role.id}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    {/* Vertical drop into this child */}
                    <Box
                      style={{
                        position: 'absolute',
                        top: -18,
                        width: 2,
                        height: 18,
                        background: lineColor,
                      }}
                    />

                    {/* Horizontal branch line segments */}
                    {idx === 0 && (
                      <Box
                        style={{
                          position: 'absolute',
                          top: -18,
                          left: '50%',
                          right: '-20px',
                          height: 2,
                          background: lineColor,
                        }}
                      />
                    )}
                    {idx === children.length - 1 && (
                      <Box
                        style={{
                          position: 'absolute',
                          top: -18,
                          right: '50%',
                          left: '-20px',
                          height: 2,
                          background: lineColor,
                        }}
                      />
                    )}
                    {idx > 0 && idx < children.length - 1 && (
                      <Box
                        style={{
                          position: 'absolute',
                          top: -18,
                          left: '-20px',
                          right: '-20px',
                          height: 2,
                          background: lineColor,
                        }}
                      />
                    )}

                    <DynamicTreeNode
                      node={child}
                      users={users}
                      onSelectRole={onSelectRole}
                      isDark={isDark}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </>
      )}
    </Stack>
  );
};

export const AccessControlPage: React.FC = () => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const {
    roles,
    selectedRole,
    setSelectedRole,
    systemModules,
    users,
    loading,
    saving,
    fetchRoles,
    fetchUsers,
    createRole,
    updateRole,
    assignUserRole,
  } = useAccessControl();

  // Active top tab: 'perms' | 'team' | 'tree'
  const [activeTab, setActiveTab] = useState<'perms' | 'team' | 'tree'>('perms');

  // Search in Perms Sidebar
  const [roleSearch, setRoleSearch] = useState('');

  // Team Filter Tab ('all' | 'assigned' | 'unassigned') & Search
  const [teamFilter, setTeamFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [teamSearch, setTeamSearch] = useState('');

  // Collapsed categories state (CategoryName -> boolean)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Local permissions state for live optimistic switches
  const [localPermissions, setLocalPermissions] = useState<Record<string, RolePermission>>({});

  // Add Role Modal
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleAppType, setNewRoleAppType] = useState<AppType>('manager');
  const [newRoleParentId, setNewRoleParentId] = useState<string>('');
  const [templateRoleId, setTemplateRoleId] = useState<string>('');

  // Synchronize selectedRole permissions to local state
  useEffect(() => {
    if (selectedRole && selectedRole.permissions) {
      const map: Record<string, RolePermission> = {};
      selectedRole.permissions.forEach((p) => {
        map[p.moduleId] = { ...p };
      });
      // Ensure all system modules exist in map
      systemModules.forEach((m) => {
        if (!map[m.id]) {
          map[m.id] = {
            moduleId: m.id,
            moduleName: m.name,
            category: m.category,
            canView: selectedRole.slug === 'admin',
            canCreate: selectedRole.slug === 'admin',
            canEdit: selectedRole.slug === 'admin',
            canDelete: selectedRole.slug === 'admin',
            canExport: selectedRole.slug === 'admin',
            canApprove: selectedRole.slug === 'admin',
          };
        }
      });
      setLocalPermissions(map);
    }
  }, [selectedRole, systemModules]);

  // Group system modules dynamically by Category
  const categories = useMemo(() => {
    const map = new Map<string, typeof systemModules>();
    systemModules.forEach((mod) => {
      const cat = mod.category || 'Core';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(mod);
    });
    return Array.from(map.entries());
  }, [systemModules]);

  // Filtered roles in Perms tab
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [roles, roleSearch]);

  // Live toggle of module permission switch
  const handleToggleModule = async (moduleId: string) => {
    if (!selectedRole) return;

    const current = localPermissions[moduleId] || {
      moduleId,
      moduleName: moduleId,
      category: 'Core',
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
      canApprove: false,
    };

    const nextState = !current.canView;

    const updatedPerm: RolePermission = {
      ...current,
      canView: nextState,
      canCreate: nextState,
      canEdit: nextState,
      canDelete: nextState && selectedRole.appType === 'admin',
      canExport: nextState,
      canApprove: nextState && ['admin', 'manager'].includes(selectedRole.appType),
    };

    // Optimistic local update
    const updatedMap = {
      ...localPermissions,
      [moduleId]: updatedPerm,
    };
    setLocalPermissions(updatedMap);

    // Save directly to backend
    const permissionsArray = Object.values(updatedMap);
    await updateRole(selectedRole.id, { permissions: permissionsArray });
  };

  // Toggle category collapse
  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  // Create new role submit
  const handleCreateRoleSubmit = async () => {
    if (!newRoleName.trim()) return;

    let initialPerms: RolePermission[] | undefined;
    if (templateRoleId) {
      const tpl = roles.find((r) => r.id === templateRoleId);
      if (tpl && tpl.permissions) {
        initialPerms = tpl.permissions;
      }
    }

    const res = await createRole({
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
      appType: newRoleAppType,
      parentRoleId: newRoleParentId || null,
      permissions: initialPerms,
    });

    if (res.success) {
      setAddRoleModalOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRoleParentId('');
      setTemplateRoleId('');
    }
  };

  // Quick initial avatar letter
  const getRoleInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'R';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Dynamic user counts & filter
  const totalAssignedCount = users.filter((u) => u.roleId || u.role).length;
  const totalUnassignedCount = users.filter((u) => !u.roleId && !u.role).length;

  // Filtered users for Team tab
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Filter tab
      if (teamFilter === 'assigned' && !u.roleId && !u.role) return false;
      if (teamFilter === 'unassigned' && (u.roleId || u.role)) return false;

      // Search query
      if (!teamSearch.trim()) return true;
      const q = teamSearch.toLowerCase();
      const roleName = u.roleRelation?.name || u.role || '';
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        roleName.toLowerCase().includes(q)
      );
    });
  }, [users, teamFilter, teamSearch]);

  // Group filtered users by Role dynamically
  const usersGroupedByRole = useMemo(() => {
    const map = new Map<string, { role: Role | null; roleName: string; users: UserWithRole[] }>();

    // Initialize all existing roles so they appear in order
    roles.forEach((r) => {
      map.set(r.id, { role: r, roleName: r.name, users: [] });
    });

    const unassignedUsers: UserWithRole[] = [];

    filteredUsers.forEach((u) => {
      const rId = u.roleId || (roles.find((r) => r.slug.toUpperCase() === u.role?.toUpperCase())?.id);
      if (rId && map.has(rId)) {
        map.get(rId)!.users.push(u);
      } else {
        unassignedUsers.push(u);
      }
    });

    const list = Array.from(map.values()).filter((g) => g.users.length > 0 || !teamSearch);
    if (unassignedUsers.length > 0) {
      list.push({ role: null, roleName: 'Unassigned Members', users: unassignedUsers });
    }
    return list;
  }, [roles, filteredUsers, teamSearch]);

  // 100% Dynamic Hierarchical Role Tree Data Builder
  const roleTree = useMemo(() => {
    if (roles.length === 0) return [];

    const nodeMap = new Map<string, TreeNodeData>();
    roles.forEach((r) => {
      nodeMap.set(r.id, { role: r, children: [], level: 0 });
    });

    const roots: TreeNodeData[] = [];

    roles.forEach((r) => {
      const node = nodeMap.get(r.id)!;
      if (r.parentRoleId && nodeMap.has(r.parentRoleId)) {
        const parent = nodeMap.get(r.parentRoleId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Recursively assign hierarchy depth levels
    const assignLevels = (node: TreeNodeData, currentLevel: number) => {
      node.level = currentLevel;
      node.children.forEach((c) => assignLevels(c, currentLevel + 1));
    };

    // Sort roots: Admin / System roles first
    roots.sort((a, b) => {
      if (a.role.slug === 'admin' || a.role.slug === 'super_admin') return -1;
      if (b.role.slug === 'admin' || b.role.slug === 'super_admin') return 1;
      return (b.role.isSystem ? 1 : 0) - (a.role.isSystem ? 1 : 0);
    });

    roots.forEach((root) => assignLevels(root, 0));
    return roots;
  }, [roles]);

  // Colors based on theme
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0';
  const headingColor = isDark ? '#F8FAFC' : '#0F172A';
  const subtitleColor = isDark ? '#94A3B8' : '#64748B';

  // Module Icon mapper
  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'dashboard':
        return <IconLayoutGrid size={18} color="#4F46E5" />;
      case 'employee_dashboard':
        return <IconUser size={18} color="#4F46E5" />;
      case 'distributor_dashboard':
        return <IconBuildingStore size={18} color="#4F46E5" />;
      case 'calendar':
        return <IconCalendar size={18} color="#4F46E5" />;
      case 'daily_working_plan':
        return <IconClipboardList size={18} color="#4F46E5" />;
      case 'access_control':
        return <IconShieldLock size={18} color="#4F46E5" />;
      case 'settings':
        return <IconSettings size={18} color="#4F46E5" />;
      case 'audit_logs':
        return <IconHistory size={18} color="#4F46E5" />;
      case 'employee_management':
        return <IconUsers size={18} color="#4F46E5" />;
      case 'attendance':
        return <IconClockCheck size={18} color="#4F46E5" />;
      case 'shift_details':
        return <IconClock size={18} color="#4F46E5" />;
      case 'area_dashboard':
        return <IconChartBar size={18} color="#4F46E5" />;
      case 'leave_management':
        return <IconCalendarOff size={18} color="#4F46E5" />;
      case 'contacts':
        return <IconAddressBook size={18} color="#4F46E5" />;
      case 'companies':
        return <IconBuilding size={18} color="#4F46E5" />;
      case 'leads':
        return <IconFlame size={18} color="#4F46E5" />;
      case 'deals':
        return <IconBriefcase size={18} color="#4F46E5" />;
      case 'projects':
        return <IconFolders size={18} color="#4F46E5" />;
      case 'client_visits':
        return <IconMapPin size={18} color="#4F46E5" />;
      case 'daily_reports':
        return <IconFileText size={18} color="#4F46E5" />;
      case 'beat_planning':
        return <IconRoute size={18} color="#4F46E5" />;
      default:
        return <IconLayoutGrid size={18} color="#4F46E5" />;
    }
  };

  // Avatar color palette for Team list
  const userAvatarColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];

  return (
    <Box p={{ base: 'md', md: 'xl' }} style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* 1. Top Header Bar */}
      <Group justify="space-between" align="center" mb="xl" wrap="wrap" gap="md">
        <div>
          <Text fw={800} size="28px" style={{ letterSpacing: '-0.02em', color: headingColor }}>
            Access Control
          </Text>
          <Text size="sm" c="dimmed">
            Manage roles, permissions & user assignments
          </Text>
        </div>

        <Group gap="sm">
          {/* Segmented Pill Tabs */}
          <Paper
            p={4}
            radius="100px"
            style={{
              background: isDark ? '#1E293B' : '#F1F5F9',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
              display: 'inline-flex',
              gap: 4,
            }}
          >
            <UnstyledButton
              onClick={() => setActiveTab('perms')}
              style={{
                padding: '8px 18px',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'perms' ? (isDark ? '#334155' : '#FFFFFF') : 'transparent',
                color: activeTab === 'perms' ? (isDark ? '#FFFFFF' : '#0F172A') : subtitleColor,
                boxShadow: activeTab === 'perms' ? '0 2px 8px rgba(0,0,0,0.08)' : undefined,
                transition: 'all 0.15s ease',
              }}
            >
              <IconShield size={16} stroke={2} />
              Perms
            </UnstyledButton>

            <UnstyledButton
              onClick={() => setActiveTab('team')}
              style={{
                padding: '8px 18px',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'team' ? (isDark ? '#334155' : '#FFFFFF') : 'transparent',
                color: activeTab === 'team' ? (isDark ? '#FFFFFF' : '#0F172A') : subtitleColor,
                boxShadow: activeTab === 'team' ? '0 2px 8px rgba(0,0,0,0.08)' : undefined,
                transition: 'all 0.15s ease',
              }}
            >
              <IconUsers size={16} stroke={2} />
              Team{' '}
              <Badge size="xs" variant="filled" color="blue" radius="xl" style={{ marginLeft: 2, height: 18, padding: '0 6px' }}>
                {users.length}
              </Badge>
            </UnstyledButton>

            <UnstyledButton
              onClick={() => setActiveTab('tree')}
              style={{
                padding: '8px 18px',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'tree' ? (isDark ? '#334155' : '#FFFFFF') : 'transparent',
                color: activeTab === 'tree' ? (isDark ? '#FFFFFF' : '#0F172A') : subtitleColor,
                boxShadow: activeTab === 'tree' ? '0 2px 8px rgba(0,0,0,0.08)' : undefined,
                transition: 'all 0.15s ease',
              }}
            >
              <IconSitemap size={16} stroke={2} />
              Tree
            </UnstyledButton>
          </Paper>

          {/* + Add Role Button */}
          <Button
            radius="100px"
            leftSection={<IconPlus size={16} />}
            onClick={() => setAddRoleModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              padding: '0 22px',
              height: 40,
            }}
          >
            + Add Role
          </Button>
        </Group>
      </Group>

      {/* 2. TAB 1: PERMS (Two-Column Master-Detail) */}
      {activeTab === 'perms' && (
        <Box style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Sidebar: Roles List */}
          <Stack gap="sm">
            <TextInput
              placeholder="Search roles & users..."
              leftSection={<IconSearch size={16} color="gray" />}
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              radius="100px"
              styles={{
                input: {
                  backgroundColor: cardBg,
                  border: cardBorder,
                  height: 42,
                },
              }}
            />

            <Stack gap={10} mt={4}>
              {filteredRoles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                const memberCount = role.userCount !== undefined ? role.userCount : users.filter((u) => u.roleId === role.id || u.role?.toUpperCase() === role.slug.toUpperCase()).length;

                return (
                  <Paper
                    key={role.id}
                    p="md"
                    radius="18px"
                    onClick={() => setSelectedRole(role)}
                    style={{
                      background: cardBg,
                      border: isSelected
                        ? `2px solid ${isDark ? '#60A5FA' : '#3B82F6'}`
                        : cardBorder,
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? '0 6px 20px rgba(59, 130, 246, 0.15)'
                        : '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <IconChevronRight
                      size={16}
                      color={isSelected ? (isDark ? '#60A5FA' : '#3B82F6') : '#94A3B8'}
                      stroke={2.5}
                    />

                    <Avatar
                      size={36}
                      radius="100px"
                      style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    >
                      {getRoleInitials(role.name)}
                    </Avatar>

                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={700} size="sm" style={{ color: headingColor }} lineClamp={1}>
                        {role.name}
                      </Text>
                      <Text size="11px" fw={500} style={{ color: isDark ? '#93C5FD' : '#2563EB' }}>
                        {memberCount} member{memberCount === 1 ? '' : 's'}
                      </Text>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>

          {/* Right Panel: Role Details & Collapsible Switches Grid */}
          {selectedRole && (
            <Paper p="xl" radius="24px" style={{ background: cardBg, border: cardBorder }}>
              {/* Role Header Banner */}
              <Box mb="xl">
                <Text fw={800} size="24px" style={{ color: headingColor }}>
                  {selectedRole.name}
                </Text>
                <Text size="xs" c="dimmed" mt={2} mb="xs">
                  {selectedRole.description || 'Configured permissions and module access.'}
                </Text>

                <Group gap="xs" mt={6} mb={4}>
                  <Badge
                    size="md"
                    radius="100px"
                    variant="light"
                    color="blue"
                    leftSection={<IconWorld size={13} style={{ marginRight: 4 }} />}
                    style={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Web Only / Unassigned
                  </Badge>
                </Group>

                {(() => {
                  const enabledCount = systemModules.filter((m) => localPermissions[m.id]?.canView).length;
                  return (
                    <Text size="xs" c="dimmed" mt={4}>
                      {enabledCount} of {systemModules.length} modules enabled
                    </Text>
                  );
                })()}
              </Box>

              {/* Module Categories List */}
              <Stack gap="lg">
                {categories.map(([categoryName, modules]) => {
                  const enabledInCat = modules.filter((m) => localPermissions[m.id]?.canView).length;
                  const isCollapsed = Boolean(collapsedCategories[categoryName]);

                  return (
                    <Box key={categoryName}>
                      {/* Category Header */}
                      <Group
                        justify="space-between"
                        align="center"
                        py="xs"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => toggleCategoryCollapse(categoryName)}
                      >
                        <Group gap="xs">
                          <Text fw={800} size="sm" style={{ color: headingColor }}>
                            {categoryName}
                          </Text>
                          <Badge
                            size="sm"
                            radius="100px"
                            variant="light"
                            color="green"
                            style={{ fontWeight: 700, fontSize: '11px', height: 20, padding: '0 8px' }}
                          >
                            {enabledInCat}/{modules.length}
                          </Badge>
                        </Group>

                        {isCollapsed ? (
                          <IconChevronDown size={16} color="#94A3B8" />
                        ) : (
                          <IconChevronUp size={16} color="#94A3B8" />
                        )}
                      </Group>

                      {/* Modules 4-Column Grid */}
                      <Collapse in={!isCollapsed}>
                        <Box
                          mt="sm"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: '16px',
                          }}
                        >
                          {modules.map((mod) => {
                            const isEnabled = Boolean(localPermissions[mod.id]?.canView);
                            const isLocked = mod.id === 'access_control' && selectedRole.slug !== 'admin';

                            return (
                              <Paper
                                key={mod.id}
                                p="sm"
                                radius="14px"
                                style={{
                                  background: isDark ? '#1E293B' : '#F8FAFC',
                                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '10px',
                                }}
                              >
                                <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                                  {getModuleIcon(mod.id)}
                                  <Text
                                    fw={600}
                                    size="13px"
                                    style={{ color: headingColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    title={mod.name}
                                  >
                                    {mod.name}
                                  </Text>
                                  {isLocked && <IconLock size={14} color="#F59E0B" />}
                                </Group>

                                <Switch
                                  checked={isEnabled}
                                  disabled={selectedRole.slug === 'admin' && mod.id === 'access_control'}
                                  color="indigo"
                                  size="md"
                                  onChange={() => handleToggleModule(mod.id)}
                                  styles={{
                                    track: { cursor: 'pointer' },
                                  }}
                                />
                              </Paper>
                            );
                          })}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          )}
        </Box>
      )}

      {/* 3. TAB 2: TEAM (User Role Assignments Grouped by Role) */}
      {activeTab === 'team' && (
        <Stack gap="lg">
          {/* Filter & Search Bar */}
          <Paper p="md" radius="18px" style={{ background: cardBg, border: cardBorder }}>
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              <Group gap="sm">
                {/* Segmented Filter Pills */}
                <Paper
                  p={3}
                  radius="100px"
                  style={{
                    background: isDark ? '#1E293B' : '#F1F5F9',
                    border: cardBorder,
                    display: 'inline-flex',
                  }}
                >
                  <UnstyledButton
                    onClick={() => setTeamFilter('all')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: teamFilter === 'all' ? (isDark ? '#334155' : '#FFFFFF') : 'transparent',
                      color: teamFilter === 'all' ? (isDark ? '#FFFFFF' : '#0F172A') : subtitleColor,
                      boxShadow: teamFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.08)' : undefined,
                    }}
                  >
                    All
                  </UnstyledButton>
                  <UnstyledButton
                    onClick={() => setTeamFilter('assigned')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: teamFilter === 'assigned' ? (isDark ? '#334155' : '#FFFFFF') : 'transparent',
                      color: teamFilter === 'assigned' ? (isDark ? '#FFFFFF' : '#0F172A') : subtitleColor,
                      boxShadow: teamFilter === 'assigned' ? '0 2px 6px rgba(0,0,0,0.08)' : undefined,
                    }}
                  >
                    Assigned
                  </UnstyledButton>
                  <UnstyledButton
                    onClick={() => setTeamFilter('unassigned')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: teamFilter === 'unassigned' ? (isDark ? '#334155' : '#FFFFFF') : 'transparent',
                      color: teamFilter === 'unassigned' ? (isDark ? '#FFFFFF' : '#0F172A') : subtitleColor,
                      boxShadow: teamFilter === 'unassigned' ? '0 2px 6px rgba(0,0,0,0.08)' : undefined,
                    }}
                  >
                    Unassigned
                  </UnstyledButton>
                </Paper>

                <TextInput
                  placeholder="Search by name, email, or role..."
                  leftSection={<IconSearch size={16} color="gray" />}
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  radius="100px"
                  style={{ width: 340 }}
                  styles={{
                    input: {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      height: 38,
                    },
                  }}
                />
              </Group>

              <Group gap="md">
                <Text size="xs" fw={700} c="dimmed">
                  👥 {totalAssignedCount} assigned
                </Text>
                <Text size="xs" fw={700} c="dimmed">
                  👤 {totalUnassignedCount} unassigned
                </Text>
              </Group>
            </Group>
          </Paper>

          {/* User Cards Grouped by Role */}
          <Stack gap="md">
            {usersGroupedByRole.map((group, groupIdx) => {
              const roleInfo = group.role;
              const parentRoleName = roleInfo?.parentRole?.name || null;

              return (
                <Paper key={group.roleName} p="xl" radius="24px" style={{ background: cardBg, border: cardBorder }}>
                  {/* Role Header */}
                  <Group justify="space-between" align="center" mb="lg">
                    <Group gap="sm">
                      <Avatar
                        size={32}
                        radius="100px"
                        style={{
                          background: '#0F172A',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '11px',
                        }}
                      >
                        {getRoleInitials(group.roleName)}
                      </Avatar>
                      <Text fw={800} size="md" style={{ color: headingColor }}>
                        {group.roleName}
                      </Text>
                    </Group>

                    <Badge size="sm" variant="light" color="gray" radius="100px">
                      {group.users.length} member{group.users.length === 1 ? '' : 's'}
                    </Badge>
                  </Group>

                  {/* Users List */}
                  <Stack gap="sm">
                    {group.users.map((user, uIdx) => {
                      const avatarColor = userAvatarColors[(groupIdx * 3 + uIdx) % userAvatarColors.length];
                      const currentRoleId = user.roleId || (roles.find((r) => r.slug.toUpperCase() === user.role?.toUpperCase())?.id) || '';
                      
                      // Dynamic reporting manager text
                      const reportingText = parentRoleName
                        ? `Reports to ${parentRoleName}`
                        : group.roleName === 'Admin' || group.roleName === 'Super Admin'
                        ? 'Reports to Direct Board'
                        : 'Reports to Management';

                      return (
                        <Paper
                          key={user.id}
                          p="md"
                          radius="16px"
                          style={{
                            background: isDark ? '#1E293B' : '#F8FAFC',
                            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* User Identity */}
                          <Group gap="md" style={{ flex: 1, minWidth: 260 }}>
                            <Avatar
                              size={38}
                              radius="100px"
                              style={{
                                background: avatarColor,
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '12px',
                              }}
                            >
                              {getRoleInitials(user.name)}
                            </Avatar>

                            <div>
                              <Text fw={700} size="14px" style={{ color: headingColor }}>
                                {user.name}
                              </Text>
                              <Group gap="md" mt={2}>
                                <Group gap={4}>
                                  <IconMail size={13} color="gray" />
                                  <Text size="11px" c="dimmed">
                                    {user.email}
                                  </Text>
                                </Group>
                                {user.phone && (
                                  <Group gap={4}>
                                    <IconPhone size={13} color="gray" />
                                    <Text size="11px" c="dimmed">
                                      {user.phone}
                                    </Text>
                                  </Group>
                                )}
                              </Group>
                            </div>
                          </Group>

                          {/* Dynamic Reporting line & Role selector */}
                          <Group gap="md">
                            <Text size="xs" c="dimmed">
                              {reportingText}
                            </Text>

                            <Select
                              data={roles.map((r) => ({ value: r.id, label: r.name }))}
                              value={currentRoleId}
                              onChange={(val) => {
                                if (val) assignUserRole(user.id, val);
                              }}
                              radius="100px"
                              size="xs"
                              style={{ width: 140 }}
                              styles={{
                                input: {
                                  backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                                  fontWeight: 600,
                                  textAlign: 'left',
                                },
                              }}
                            />
                          </Group>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Stack>
      )}

      {/* 4. TAB 3: TREE (100% Dynamic Organization Role Structure Canvas) */}
      {activeTab === 'tree' && (
        <Paper
          p="xl"
          radius="24px"
          style={{
            background: isDark ? '#111827' : '#FFFFFF',
            border: cardBorder,
            minHeight: 640,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Dot Grid Background */}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: isDark
                ? 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)'
                : 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)',
              backgroundSize: '24px 24px',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />

          {/* Canvas Header */}
          <Group gap="sm" mb="xl" style={{ position: 'relative', zIndex: 2 }}>
            <Box
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#818CF8' : '#6366F1',
              }}
            >
              <IconSitemap size={20} />
            </Box>
            <div>
              <Text fw={800} size="md" style={{ color: headingColor }}>
                Organization Role Structure
              </Text>
              <Text size="xs" c="dimmed">
                Visualize and manage the organization role structure
              </Text>
            </div>
          </Group>

          {/* 100% Dynamic Recursive Hierarchy Tree Container */}
          <Box
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 20,
              paddingBottom: 40,
              overflowX: 'auto',
            }}
          >
            {roleTree.length > 0 ? (
              <Group align="flex-start" justify="center" gap={60} style={{ width: '100%' }}>
                {roleTree.map((rootNode) => (
                  <DynamicTreeNode
                    key={rootNode.role.id}
                    node={rootNode}
                    users={users}
                    onSelectRole={(r) => {
                      setSelectedRole(r);
                      setActiveTab('perms');
                    }}
                    isDark={isDark}
                  />
                ))}
              </Group>
            ) : (
              <Text size="sm" c="dimmed" mt="xl">
                No organizational roles found. Click "+ Add Role" to create one.
              </Text>
            )}
          </Box>
        </Paper>
      )}

      {/* 5. ADD ROLE MODAL */}
      <Modal
        opened={addRoleModalOpen}
        onClose={() => setAddRoleModalOpen(false)}
        title={
          <Group gap="xs">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <IconPlus size={18} />
            </Box>
            <Text fw={800} size="md">
              Create New Role
            </Text>
          </Group>
        }
        radius="20px"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Role Name"
            placeholder="e.g. Regional Manager - South"
            required
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            radius="md"
          />

          <Textarea
            label="Role Description"
            placeholder="Outline territory oversight and team privileges..."
            minRows={2}
            value={newRoleDesc}
            onChange={(e) => setNewRoleDesc(e.target.value)}
            radius="md"
          />

          <Select
            label="Application Tier"
            data={[
              { value: 'admin', label: 'Admin (Full Access)' },
              { value: 'manager', label: 'Management / Approval' },
              { value: 'sales_employee', label: 'Field Sales / Officer' },
              { value: 'support', label: 'Support & Operations' },
            ]}
            value={newRoleAppType}
            onChange={(val) => setNewRoleAppType((val as AppType) || 'manager')}
            radius="md"
          />

          <Select
            label="Parent Role in Hierarchy Tree"
            placeholder="Select Parent Role..."
            data={[
              { value: '', label: 'Root Level (Direct to Board)' },
              ...roles.map((r) => ({ value: r.id, label: r.name })),
            ]}
            value={newRoleParentId}
            onChange={(val) => setNewRoleParentId(val || '')}
            radius="md"
          />

          <Select
            label="Copy Initial Permissions Template (Optional)"
            placeholder="Copy from existing role..."
            data={[
              { value: '', label: 'Blank Permissions' },
              ...roles.map((r) => ({ value: r.id, label: r.name })),
            ]}
            value={templateRoleId}
            onChange={(val) => setTemplateRoleId(val || '')}
            radius="md"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" radius="100px" onClick={() => setAddRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              radius="100px"
              loading={saving}
              onClick={handleCreateRoleSubmit}
              disabled={!newRoleName.trim()}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                color: '#FFFFFF',
              }}
            >
              + Create Role
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default AccessControlPage;
