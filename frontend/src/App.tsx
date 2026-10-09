import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { theme } from './theme';
import { CRMProvider } from './context/CRMContext';
import { EmployeeProvider } from './context/EmployeeContext';
import { ContactProvider } from './context/ContactContext';
import { AccessControlProvider } from './context/AccessControlContext';
import { AppLayout } from './components/layout/AppLayout';

export const App: React.FC = () => {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" zIndex={2000} />
      <ModalsProvider>
        <CRMProvider>
          <AccessControlProvider>
            <EmployeeProvider>
              <ContactProvider>
                <AppLayout />
              </ContactProvider>
            </EmployeeProvider>
          </AccessControlProvider>
        </CRMProvider>
      </ModalsProvider>
    </MantineProvider>
  );
};

export default App;
