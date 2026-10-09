import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, EmployeeStats, EmployeeStatus } from '../types/employee';
import {
  fetchEmployeesApi,
  fetchEmployeeStatsApi,
  createEmployeeApi,
  updateEmployeeApi,
  updateEmployeeStatusApi,
  deleteEmployeeApi,
} from '../services/employeeService';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconUserCheck,
  IconUserX,
  IconTrash,
  IconAlertCircle,
} from '@tabler/icons-react';

interface EmployeeContextType {
  employees: Employee[];
  employeeStats: EmployeeStats | null;
  loading: boolean;
  selectedEmployee: Employee | null;
  setSelectedEmployee: (emp: Employee | null) => void;
  fetchEmployees: (filters?: any) => Promise<void>;
  fetchEmployeeStats: () => Promise<void>;
  addEmployee: (emp: Partial<Employee>) => Promise<boolean>;
  updateEmployee: (id: string, emp: Partial<Employee>) => Promise<boolean>;
  updateEmployeeStatus: (id: string, status: EmployeeStatus) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Fetch employees from API
  const fetchEmployees = async (filters?: any) => {
    setLoading(true);
    try {
      const res = await fetchEmployeesApi(filters);
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics from API
  const fetchEmployeeStats = async () => {
    try {
      const stats = await fetchEmployeeStatsApi();
      setEmployeeStats(stats);
    } catch (err) {
      console.error('Failed to load employee stats:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchEmployeeStats();
  }, []);

  // Onboard / Add Employee
  const addEmployee = async (empData: Partial<Employee>): Promise<boolean> => {
    try {
      const result = await createEmployeeApi(empData);
      if (result.success && result.data) {
        setEmployees((prev) => [result.data!, ...prev]);
        notifications.show({
          title: 'Employee Added',
          message: `${result.data.name} (${result.data.empCode}) has been successfully added.`,
          color: 'teal',
          icon: <IconUserCheck size={18} />,
        });
        fetchEmployeeStats();
        return true;
      } else {
        notifications.show({
          title: 'Add Employee Failed',
          message: result.message || 'Could not add employee. Please try again.',
          color: 'red',
          icon: <IconAlertCircle size={18} />,
        });
        return false;
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'An unexpected error occurred.',
        color: 'red',
        icon: <IconAlertCircle size={18} />,
      });
      return false;
    }
  };

  // Update Employee
  const updateEmployee = async (id: string, empData: Partial<Employee>): Promise<boolean> => {
    try {
      const result = await updateEmployeeApi(id, empData);
      if (result.success && result.data) {
        setEmployees((prev) => prev.map((e) => (e.id === id ? result.data! : e)));
        if (selectedEmployee?.id === id) {
          setSelectedEmployee(result.data);
        }
        notifications.show({
          title: 'Profile Updated',
          message: `${result.data.name}'s details updated successfully.`,
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
        fetchEmployeeStats();
        return true;
      } else {
        notifications.show({
          title: 'Update Failed',
          message: result.message || 'Could not update employee details.',
          color: 'red',
          icon: <IconAlertCircle size={18} />,
        });
        return false;
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'An error occurred during update.',
        color: 'red',
        icon: <IconAlertCircle size={18} />,
      });
      return false;
    }
  };

  // Update Employee Status
  const updateEmployeeStatus = async (id: string, status: EmployeeStatus): Promise<boolean> => {
    try {
      const success = await updateEmployeeStatusApi(id, status);
      if (success) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status } : e))
        );
        const isInactive = (status || '').toUpperCase().includes('INACT');
        notifications.show({
          title: isInactive ? 'Employee Deactivated' : 'Employee Activated',
          message: isInactive
            ? 'Employee moved to Relieved / Inactive directory.'
            : 'Employee restored to Active directory.',
          color: isInactive ? 'orange' : 'teal',
          icon: isInactive ? <IconUserX size={18} /> : <IconUserCheck size={18} />,
        });
        fetchEmployeeStats();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  // Delete Employee
  const deleteEmployee = async (id: string): Promise<boolean> => {
    try {
      const success = await deleteEmployeeApi(id);
      if (success) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        if (selectedEmployee?.id === id) {
          setSelectedEmployee(null);
        }
        notifications.show({
          title: 'Employee Removed',
          message: 'Employee record has been deleted.',
          color: 'red',
          icon: <IconTrash size={18} />,
        });
        fetchEmployeeStats();
        return true;
      } else {
        notifications.show({
          title: 'Delete Failed',
          message: 'Could not delete employee record.',
          color: 'red',
          icon: <IconAlertCircle size={18} />,
        });
        return false;
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to remove employee.',
        color: 'red',
        icon: <IconAlertCircle size={18} />,
      });
      return false;
    }
  };

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        employeeStats,
        loading,
        selectedEmployee,
        setSelectedEmployee,
        fetchEmployees,
        fetchEmployeeStats,
        addEmployee,
        updateEmployee,
        updateEmployeeStatus,
        deleteEmployee,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = (): EmployeeContextType => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};
