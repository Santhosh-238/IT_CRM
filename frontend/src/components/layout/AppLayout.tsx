import { Box, Container, Drawer } from '@mantine/core';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useCRM } from '../../context/CRMContext';
import { usePermissions } from '../../context/AccessControlContext';
import { DashboardPage } from '../../pages/DashboardPage';
import { EmployeesPage, AddEmployeePage } from '../../pages/employees';
import { ContactsPage, AddContactPage, ContactDetailsPage, ContactQualificationPage } from '../../pages/contacts';
import { AccessControlPage } from '../../pages/access-control/AccessControlPage';
import { AuthPage, SignupPage, LoginPage } from '../../pages/auth';
import { useContact } from '../../context/ContactContext';

export const AppLayout: React.FC = () => {
  const { activeNav, setActiveNav, sidebarMobileOpened, setSidebarMobileOpened } = useCRM();
  const { selectedContact, deleteContact } = useContact();
  const { isSuperAdmin } = usePermissions();

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
        if (!isSuperAdmin) {
          return <DashboardPage onNavigate={(nav) => setActiveNav(nav)} />;
        }
        return <EmployeesPage />;
      case 'add-employee':
      case 'add':
      case 'onboard-employee':
      case 'onboard': {
        if (!isSuperAdmin) {
          return <DashboardPage onNavigate={(nav) => setActiveNav(nav)} />;
        }
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
      case 'contacts':
        return <ContactsPage />;
      case 'add-contact':
      case 'contacts/add': {
        let editData = null;
        try {
          const savedEdit = typeof window !== 'undefined' ? sessionStorage.getItem('crm_editing_contact') : null;
          if (savedEdit) editData = JSON.parse(savedEdit);
        } catch (e) {}

        return (
          <AddContactPage
            onBack={() => {
              if (typeof window !== 'undefined') sessionStorage.removeItem('crm_editing_contact');
              setActiveNav('contacts');
            }}
            initialData={editData}
          />
        );
      }
      case 'contact-details': {
        if (selectedContact) {
          return (
            <ContactDetailsPage
              contact={selectedContact}
              onBack={() => setActiveNav('contacts')}
              onEdit={(c) => {
                if (typeof window !== 'undefined') sessionStorage.setItem('crm_editing_contact', JSON.stringify(c));
                setActiveNav('add-contact');
              }}
              onDelete={async (c) => {
                await deleteContact(c.id);
                setActiveNav('contacts');
              }}
            />
          );
        }
        return <ContactsPage />;
      }
      case 'contact-qualification':
      case 'contacts/qualification':
      case 'contacts/qualify':
      case 'qualification': {
        let qualifyContact = selectedContact;
        if (!qualifyContact && typeof window !== 'undefined') {
          try {
            const saved = sessionStorage.getItem('crm_qualifying_contact');
            if (saved) qualifyContact = JSON.parse(saved);
          } catch (e) {}
        }
        return (
          <ContactQualificationPage
            contact={qualifyContact}
            onBack={() => setActiveNav('contacts')}
            onSuccess={() => setActiveNav('contacts')}
          />
        );
      }
      case 'access-control':
      case 'access-control-matrix':
      case 'rbac':
        return <AccessControlPage />;
      default:
        return <DashboardPage onNavigate={(nav) => setActiveNav(nav)} />;
    }
  };

  return (
    <Box style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'transparent' }}>
      {/* 1. Desktop Left Fixed Sidebar (Hidden on Mobile) */}
      <Box visibleFrom="md" style={{ flexShrink: 0 }}>
        <Sidebar onSelectNav={(nav) => setActiveNav(nav)} />
      </Box>

      {/* Mobile Drawer Navigation (Hidden on Desktop) */}
      <Drawer
        opened={sidebarMobileOpened}
        onClose={() => setSidebarMobileOpened(false)}
        size={280}
        padding={0}
        withCloseButton={false}
        hiddenFrom="md"
        styles={{
          body: { height: '100%', padding: 0 },
        }}
      >
        <Sidebar onSelectNav={(nav) => setActiveNav(nav)} isMobile />
      </Drawer>

      {/* 2. Right Main Area */}
      <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header Bar (64px) */}
        <Header />

        {/* Main Content Workspace */}
        <Box style={{ flex: 1, paddingBottom: 40 }}>
          <Container fluid px={{ base: 'xs', sm: 'md', md: 'xl' }} py="lg" style={{ maxWidth: 1600 }}>
            {renderActiveScreen()}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
