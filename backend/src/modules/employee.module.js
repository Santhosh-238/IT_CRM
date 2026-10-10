/**
 * Employee Module Definition & HR Schema
 */
export const EMPLOYEE_MODULE = {
  id: 'employees',
  name: 'Employees',
  category: 'Human Resources',
  description: 'Enterprise workforce directory, department allocations, employee onboarding, performance ratings, and status tracking.',
  actions: ['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport', 'canApprove'],
  defaultPermissions: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canApprove: false,
  },
  departments: [
    'Engineering',
    'Sales & Marketing',
    'Product & Design',
    'Customer Success',
    'Human Resources',
    'Finance & Legal',
    'Operations',
  ],
  roles: [
    'Developer',
    'Senior Developer',
    'Tech Lead',
    'Project Manager',
    'Sales Executive',
    'HR Specialist',
    'UI/UX Designer',
    'DevOps Engineer',
  ],
  employmentTypes: [
    'Full Time',
    'Part Time',
    'Contract',
    'Internship',
  ],
  statuses: [
    'Active',
    'Probation',
    'On Leave',
    'Terminated',
  ],
  schema: {
    fields: [
      'id',
      'empCode',
      'name',
      'email',
      'phone',
      'dob',
      'gender',
      'address',
      'department',
      'designation',
      'role',
      'employmentType',
      'status',
      'workLocation',
      'joiningDate',
      'reportingManager',
      'rating',
      'createdAt',
      'updatedAt',
    ],
  },
};

export default EMPLOYEE_MODULE;
