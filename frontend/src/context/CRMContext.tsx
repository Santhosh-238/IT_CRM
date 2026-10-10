import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types/employee';
import { crmApi } from '../services/api';
import { notifications } from '@mantine/notifications';

const defaultEmptyUser: UserProfile = {
  id: '',
  name: '',
  email: '',
  role: 'SUPER_ADMIN',
  avatar: '',
  department: '',
};

interface CRMContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  setCurrentUserRole: (role: UserRole) => void;
  logoutUser: () => Promise<void>;
  activeNav: string;
  setActiveNav: (nav: string) => void;

  // Global Filter / Search
  globalSearch: string;
  setGlobalSearch: (term: string) => void;

  // Sidebar mobile toggle
  sidebarMobileOpened: boolean;
  setSidebarMobileOpened: (opened: boolean) => void;

  // Clear Database & Storage
  clearDatabase: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('crm_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && !parsed.email.includes('omnitech.io') && parsed.name !== 'Vikram Sundaram') {
          return parsed;
        }
      }
    } catch (e) {}
    return defaultEmptyUser;
  });

  const [activeNav, setActiveNavState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      if (path === 'signup') return 'signup';
      if (path === 'login' || path === 'signin' || path === 'auth') return 'login';
      if (
        path === 'employees/add' ||
        path === 'add-employee' ||
        path === 'add' ||
        path === 'employees/onboard' ||
        path === 'onboard' ||
        path === 'onboard-employee'
      ) {
        return 'add-employee';
      }
      if (path === 'contacts/add' || path === 'add-contact') {
        return 'add-contact';
      }
      if (path === 'contacts/qualification' || path === 'contacts/qualify' || path === 'qualification') {
        return 'contact-qualification';
      }
      if (path === 'contacts') return 'contacts';
      if (path === 'employees') return 'employees';
      if (path === 'access-control' || path === 'rbac') return 'access-control';
      if (path === 'dashboard') return 'dashboard';
      if (path) return path;

      const saved = localStorage.getItem('crm_active_nav');
      if (saved && saved !== 'login' && saved !== 'signup') {
        return saved === 'onboard-employee' || saved === 'onboard' ? 'add-employee' : saved;
      }
    }
    return 'dashboard';
  });

  const setActiveNav = (nav: string) => {
    const normalizedNav = nav === 'onboard-employee' || nav === 'onboard' ? 'add-employee' : nav;
    setActiveNavState(normalizedNav);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_active_nav', normalizedNav);
      let targetPath = '/';
      if (normalizedNav === 'dashboard') targetPath = '/';
      else if (normalizedNav === 'employees') targetPath = '/employees';
      else if (normalizedNav === 'add-employee') targetPath = '/employees/add';
      else if (normalizedNav === 'contacts') targetPath = '/contacts';
      else if (normalizedNav === 'add-contact') targetPath = '/contacts/add';
      else if (normalizedNav === 'contact-qualification' || normalizedNav === 'qualification') targetPath = '/contacts/qualification';
      else if (normalizedNav === 'access-control' || normalizedNav === 'rbac') targetPath = '/access-control';
      else if (normalizedNav === 'login') targetPath = '/login';
      else if (normalizedNav === 'signup') targetPath = '/signup';
      else targetPath = `/${normalizedNav}`;

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ nav: normalizedNav }, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      if (path === 'signup') {
        setActiveNavState('signup');
      } else if (path === 'login' || path === 'signin' || path === 'auth') {
        setActiveNavState('login');
      } else if (
        path === 'employees/add' ||
        path === 'add-employee' ||
        path === 'add' ||
        path === 'employees/onboard' ||
        path === 'onboard' ||
        path === 'onboard-employee'
      ) {
        setActiveNavState('add-employee');
      } else if (path === 'contacts/add' || path === 'add-contact') {
        setActiveNavState('add-contact');
      } else if (path === 'contacts/qualification' || path === 'contacts/qualify' || path === 'qualification') {
        setActiveNavState('contact-qualification');
      } else if (path === 'contacts') {
        setActiveNavState('contacts');
      } else if (path === 'employees') {
        setActiveNavState('employees');
      } else if (path === 'access-control' || path === 'rbac') {
        setActiveNavState('access-control');
      } else {
        setActiveNavState('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-sync current user session from API on load
  useEffect(() => {
    crmApi.getMe()
      .then((res) => {
        if (res?.user && res.user.name) {
          setCurrentUser((prev) => ({
            ...prev,
            ...res.user,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Sync user to localStorage
  useEffect(() => {
    localStorage.setItem('crm_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role,
      department: 
        role === 'SUPER_ADMIN' ? 'Executive Management' :
        role === 'SALES_MANAGER' ? 'Sales & Business Growth' :
        role === 'PROJECT_MANAGER' ? 'Client Delivery & PMO' :
        role === 'TECH_LEAD' ? 'Engineering & Architecture' :
        role === 'DEVELOPER' ? 'Fullstack Software Engineering' : 'Client Operations',
    }));
    notifications.show({
      title: 'Active Role Switched',
      message: `You are now interacting as: ${role}`,
      color: 'dark',
    });
  };

  // 100% Wipe / Reset Database & Flush Redis Cache
  const clearDatabase = async () => {
    try {
      await crmApi.clearDatabase();
      notifications.show({
        title: 'Database Cleared',
        message: 'All employee data and cache wiped successfully!',
        color: 'teal',
      });
    } catch (err: any) {
      notifications.show({
        title: 'Clear Error',
        message: err.message || 'Failed to clear database.',
        color: 'red',
      });
    }
  };

  const [sidebarMobileOpened, setSidebarMobileOpened] = useState<boolean>(false);

  // User Logout: Clears HttpOnly Cookie & Session
  const logoutUser = async () => {
    try {
      await crmApi.logout().catch(() => {});
      localStorage.removeItem('crm_user');
      setCurrentUser(defaultEmptyUser);
      notifications.show({
        title: 'Logged Out',
        message: 'Session closed and Redis cache purged successfully.',
        color: 'gray',
      });
      setActiveNav('login');
    } catch (err: any) {
      notifications.show({
        title: 'Logout Error',
        message: err.message || 'Failed to logout.',
        color: 'red',
      });
    }
  };

  return (
    <CRMContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        setCurrentUserRole,
        logoutUser,
        activeNav,
        setActiveNav: (nav: string) => {
          setSidebarMobileOpened(false);
          setActiveNav(nav);
        },
        globalSearch,
        setGlobalSearch,
        sidebarMobileOpened,
        setSidebarMobileOpened,
        clearDatabase,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
