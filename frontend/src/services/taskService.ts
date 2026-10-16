import { ProjectTask } from '../types/project';

// Service for managing dynamic project tasks with local caching
const STORAGE_KEY = 'crm_project_tasks_v1';

export const INITIAL_DYNAMIC_TASKS: ProjectTask[] = [
  {
    id: 'tsk-101',
    taskId: 'TSK-101',
    projectId: 'PRJ-1001',
    projectName: 'Loan Eligibility & Recommendation System',
    title: 'Design high-fidelity wireframes in Figma',
    description: 'Create mobile and web responsive wireframes for credit evaluation dashboard.',
    status: 'In Progress',
    priority: 'High',
    assignedTo: 'Rahul V',
    assignedAvatar: 'RV',
    dueDate: '2026-10-25',
    estimatedHours: 24,
    tags: ['UI/UX', 'Figma'],
  },
  {
    id: 'tsk-102',
    taskId: 'TSK-102',
    projectId: 'PRJ-1001',
    projectName: 'Loan Eligibility & Recommendation System',
    title: 'Configure PostgreSQL database schema & migrations',
    description: 'Set up Prisma schemas for clients, credit scores, and financial records.',
    status: 'Completed',
    priority: 'Urgent',
    assignedTo: 'Santhosh C',
    assignedAvatar: 'SC',
    dueDate: '2026-10-18',
    estimatedHours: 16,
    tags: ['Database', 'Prisma'],
  },
  {
    id: 'tsk-103',
    taskId: 'TSK-103',
    projectId: 'PRJ-1001',
    projectName: 'Loan Eligibility & Recommendation System',
    title: 'Build Credit Scoring ML Model API integration',
    description: 'Integrate Python FastAPI scoring service with Node.js backend.',
    status: 'In Review',
    priority: 'High',
    assignedTo: 'Vikram S',
    assignedAvatar: 'VS',
    dueDate: '2026-10-28',
    estimatedHours: 32,
    tags: ['AI/ML', 'API'],
  },
  {
    id: 'tsk-104',
    taskId: 'TSK-104',
    projectId: 'PRJ-1001',
    projectName: 'Loan Eligibility & Recommendation System',
    title: 'Setup automated CI/CD pipeline on AWS ECS',
    description: 'Configure GitHub Actions workflow for staging and production deployments.',
    status: 'To Do',
    priority: 'Medium',
    assignedTo: 'Priya K',
    assignedAvatar: 'PK',
    dueDate: '2026-11-02',
    estimatedHours: 20,
    tags: ['DevOps', 'AWS'],
  },
];

const loadFromStorage = (): ProjectTask[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse tasks from storage, using defaults:', e);
  }
  return INITIAL_DYNAMIC_TASKS;
};

const saveToStorage = (tasks: ProjectTask[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Failed to save tasks to storage:', e);
  }
};

export const taskService = {
  getTasks: async (filter?: { projectId?: string }): Promise<ProjectTask[]> => {
    const tasks = loadFromStorage();
    if (filter?.projectId && filter.projectId !== 'All') {
      return tasks.filter((t) => t.projectId === filter.projectId);
    }
    return tasks;
  },

  createTask: async (taskData: Partial<ProjectTask>): Promise<ProjectTask> => {
    const tasks = loadFromStorage();
    const nextNum = tasks.length + 101;
    const newTask: ProjectTask = {
      id: `tsk-${Date.now()}`,
      taskId: `TSK-${nextNum}`,
      projectId: taskData.projectId || 'PRJ-1001',
      projectName: taskData.projectName || 'Project Task',
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      status: taskData.status || 'To Do',
      priority: taskData.priority || 'Medium',
      assignedTo: taskData.assignedTo || 'Unassigned',
      assignedAvatar: taskData.assignedAvatar || 'UA',
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      estimatedHours: taskData.estimatedHours || 8,
      tags: taskData.tags || [],
    };
    const updated = [newTask, ...tasks];
    saveToStorage(updated);
    return newTask;
  },

  updateTask: async (taskId: string, data: Partial<ProjectTask>): Promise<ProjectTask> => {
    const tasks = loadFromStorage();
    const index = tasks.findIndex((t) => t.id === taskId || t.taskId === taskId);
    if (index === -1) {
      throw new Error(`Task ${taskId} not found`);
    }
    const updatedTask = { ...tasks[index], ...data };
    tasks[index] = updatedTask;
    saveToStorage(tasks);
    return updatedTask;
  },

  deleteTask: async (taskId: string): Promise<boolean> => {
    const tasks = loadFromStorage();
    const filtered = tasks.filter((t) => t.id !== taskId && t.taskId !== taskId);
    saveToStorage(filtered);
    return true;
  },

  resetToDefault: (): ProjectTask[] => {
    saveToStorage(INITIAL_DYNAMIC_TASKS);
    return INITIAL_DYNAMIC_TASKS;
  },
};

export default taskService;
