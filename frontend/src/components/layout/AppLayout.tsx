import React from 'react';
import { Box, Container } from '@mantine/core';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useCRM } from '../../context/CRMContext';
import { DashboardPage } from '../../pages/DashboardPage';
import { EmployeesPage, AddEmployeePage } from '../../pages/employees';
import { AuthPage, SignupPage, LoginPage } from '../../pages/auth';

export const AppLayout: React.FC = () => {
  const { activeNav, setActiveNav } = useCRM();

  if (activeNav === 'signup') {
    return (
      <SignupPage
        onSuccess={() => setActiveNav('dashboard')}
        onSwitchToLogin={() => setActiveNav('login')}
      />
    );
  }

  if (activeNav === 'login') {
    return (
      <LoginPage
        onSuccess={() => setActiveNav('dashboard')}
        onSwitchToSignup={() => setActiveNav('signup')}
      />
    );
  }

  if (activeNav === 'auth') {
    return <AuthPage onSuccess={() => setActiveNav('dashboard')} />;
  }

  const renderActiveScreen = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardPage onNavigate={(nav) => setActiveNav(nav)} />;
      case 'employees':
        return <EmployeesPage />;
      case 'add-employee':
      case 'add':
      case 'onboard-employee':
      case 'onboard': {
        let editData = null;
        try {
          const savedEdit = typeof window !== 'undefined' ? sessionStorage.getItem('crm_editing_employee') : null;
          if (savedEdit) editData = JSON.parse(savedEdit);
        } catch (e) {}

        return (
          <AddEmployeePage
            onBack={() => {
              if (typeof window !== 'undefined') sessionStorage.removeItem('crm_editing_employee');
              setActiveNav('employees');
            }}
            initialData={editData}
          />
        );
      }
      default:
        return <DashboardPage onNavigate={(nav) => setActiveNav(nav)} />;
    }
  };

  return (
    <Box style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'transparent' }}>
      {/* 1. Left Fixed Sidebar (260px width, sticky 100vh) */}
      <Sidebar onSelectNav={(nav) => setActiveNav(nav)} />

      {/* 2. Right Main Area */}
      <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header Bar (64px) */}
        <Header />

        {/* Main Content Workspace */}
        <Box style={{ flex: 1, paddingBottom: 40 }}>
          <Container fluid px="xl" py="lg" style={{ maxWidth: 1600 }}>
            {renderActiveScreen()}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
