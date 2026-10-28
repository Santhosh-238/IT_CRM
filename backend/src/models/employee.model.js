import { prisma } from '../config/prisma.js';

/**
 * Dynamic Employee Model
 * Direct interface with Prisma ORM for employee operations and dynamic metadata
 */
export class EmployeeModel {
  static async findMany(where = {}, options = {}) {
    const { skip, take, orderBy, select } = options;
    return await prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      select,
    });
  }

  static async findById(id) {
    return await prisma.employee.findFirst({
      where: {
        OR: [{ id }, { empCode: id }, { email: id }],
      },
    });
  }

  static async create(data) {
    return await prisma.employee.create({ data });
  }

  static async update(id, data) {
    return await prisma.employee.update({
      where: { id },
      data,
    });
  }

  static async delete(id) {
    return await prisma.employee.delete({
      where: { id },
    });
  }

  static async count(where = {}) {
    return await prisma.employee.count({ where });
  }

  /**
   * Fetch dynamic employee departments, designations, and statuses from DB
   */
  static async getDynamicMetadata() {
    const [dbDepts, dbDesignations, dbRoles, dbStatuses, dbEmploymentTypes] = await Promise.all([
      prisma.employee.findMany({ select: { department: true }, distinct: ['department'] }),
      prisma.employee.findMany({ select: { designation: true }, distinct: ['designation'] }),
      prisma.employee.findMany({ select: { role: true }, distinct: ['role'] }),
      prisma.employee.findMany({ select: { status: true }, distinct: ['status'] }),
      prisma.employee.findMany({ select: { employmentType: true }, distinct: ['employmentType'] }),
    ]);

    const fallbackDepts = ['Engineering', 'Sales & Marketing', 'Product & Design', 'Customer Success', 'Human Resources', 'Finance & Legal', 'Operations'];
    const fallbackDesignations = ['Employee', 'Lead', 'Manager', 'Director', 'VP', 'Executive'];
    const fallbackRoles = ['Developer', 'Senior Developer', 'Tech Lead', 'Project Manager', 'Sales Executive', 'HR Specialist', 'UI/UX Designer', 'DevOps Engineer'];
    const fallbackStatuses = ['Active', 'Probation', 'On Leave', 'Terminated'];
    const fallbackEmploymentTypes = ['Full Time', 'Part Time', 'Contract', 'Internship'];

    return {
      departments: Array.from(new Set([...dbDepts.map(d => d.department).filter(Boolean), ...fallbackDepts])),
      designations: Array.from(new Set([...dbDesignations.map(d => d.designation).filter(Boolean), ...fallbackDesignations])),
      roles: Array.from(new Set([...dbRoles.map(r => r.role).filter(Boolean), ...fallbackRoles])),
      statuses: Array.from(new Set([...dbStatuses.map(s => s.status).filter(Boolean), ...fallbackStatuses])),
      employmentTypes: Array.from(new Set([...dbEmploymentTypes.map(e => e.employmentType).filter(Boolean), ...fallbackEmploymentTypes])),
    };
  }
}

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
  getDynamicMetadata: EmployeeModel.getDynamicMetadata,
};

export default EmployeeModel;
