import { SYSTEM_MODULES } from '../services/seedRBAC.js';

export const MODULE_CATEGORIES = [
  'Core',
  'Sales & CRM',
  'Human Resources',
  'Administration',
  'Communication',
  'Analytics',
];

export const getSystemModules = () => SYSTEM_MODULES;

export default {
  SYSTEM_MODULES,
  MODULE_CATEGORIES,
  getSystemModules,
};
