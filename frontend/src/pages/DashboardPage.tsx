import React from 'react';
import { usePermissions } from '../context/AccessControlContext';
import { SuperAdminDashboard } from './dashboard/SuperAdminDashboard';
import { EmployeeDashboard } from './dashboard/EmployeeDashboard';

interface DashboardPageProps {
  onNavigate: (nav: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { isSuperAdmin } = usePermissions();

  // Directly & automatically render the appropriate dashboard according to the user's role
  // Zero manual toggle bar or debug switcher on top
  return isSuperAdmin ? (
    <SuperAdminDashboard onNavigate={onNavigate} />
  ) : (
    <EmployeeDashboard onNavigate={onNavigate} />
  );
};

export default DashboardPage;
