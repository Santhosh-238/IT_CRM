import { prisma } from '../config/prisma.js';

export const PROJECT_MODULE = {
  statuses: ['Planning', 'In Progress', 'In Review', 'On Hold', 'Completed', 'Cancelled'],
  priorities: ['Low', 'Medium', 'High', 'Critical'],
  projectTypes: ['Fixed Price', 'Time & Material', 'Retainer', 'Dedicated Team'],
  categories: [
    'Full-Stack Web Development',
    'Mobile App Development',
    'Cloud Migration & DevOps',
    'AI & ML Solutions',
    'Cybersecurity & Audit',
    'UI/UX Design & Prototyping',
    'Custom API & Integrations',
    'Maintenance & Support',
  ],
};

export class ProjectModel {
  static async findMany(where = {}, options = {}) {
    const { skip, take, orderBy, select } = options;
    return await prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      select,
    });
  }

  static async findById(id) {
    return await prisma.project.findFirst({
      where: {
        OR: [{ id }, { projectId: id }],
      },
    });
  }

  static async create(data) {
    return await prisma.project.create({ data });
  }

  static async update(id, data) {
    return await prisma.project.update({
      where: { id },
      data,
    });
  }

  static async delete(id) {
    return await prisma.project.delete({
      where: { id },
    });
  }

  static async count(where = {}) {
    return await prisma.project.count({ where });
  }
}

export default ProjectModel;
