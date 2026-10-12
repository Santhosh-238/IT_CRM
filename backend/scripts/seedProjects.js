import prisma from '../src/config/prisma.js';

const sampleProjects = [
  {
    projectId: 'P001',
    name: 'E-commerce Website',
    clientName: 'ABC Technologies',
    clientEmail: 'contact@abctech.com',
    clientPhone: '9876543210',
    projectType: 'Fixed Price',
    category: 'Full-Stack Web Development',
    projectManagerName: 'Santhosh C',
    teamMembers: ['Santhosh C', 'Priya S', 'Rahul K'],
    status: 'In Progress',
    priority: 'High',
    progress: 75,
    estimatedBudget: 450000,
    actualCost: 320000,
    startDate: '10-09-2025',
    targetEndDate: '15-10-2025',
    githubUrl: 'https://github.com/oneassist/ecommerce-platform',
    figmaUrl: 'https://figma.com/file/ecommerce-ui',
    liveUrl: 'https://demo-ecommerce.abctech.com',
  },
  {
    projectId: 'P002',
    name: 'Mobile App',
    clientName: 'XYZ Solutions',
    clientEmail: 'info@xyzsolutions.com',
    clientPhone: '9876543211',
    projectType: 'Dedicated Team',
    category: 'Mobile App Development (Flutter/React Native)',
    projectManagerName: 'Priya S',
    teamMembers: ['Priya S', 'Arjun M', 'Sneha R'],
    status: 'Planning',
    priority: 'Medium',
    progress: 45,
    estimatedBudget: 600000,
    actualCost: 210000,
    startDate: '08-09-2025',
    targetEndDate: '20-10-2025',
    githubUrl: 'https://github.com/oneassist/xyz-mobile-app',
    figmaUrl: 'https://figma.com/file/xyz-mobile-design',
    liveUrl: 'https://testflight.apple.com/xyz',
  },
  {
    projectId: 'P003',
    name: 'CRM Integration',
    clientName: 'TechCorp',
    clientEmail: 'admin@techcorp.io',
    clientPhone: '9876543212',
    projectType: 'Time & Material',
    category: 'Enterprise CRM & API Integration',
    projectManagerName: 'Rahul K',
    teamMembers: ['Rahul K', 'Santhosh C', 'Vikram S'],
    status: 'In Progress',
    priority: 'High',
    progress: 20,
    estimatedBudget: 350000,
    actualCost: 95000,
    startDate: '12-09-2025',
    targetEndDate: '25-10-2025',
    githubUrl: 'https://github.com/oneassist/techcorp-crm-sync',
    figmaUrl: 'https://figma.com/file/crm-architecture',
    liveUrl: 'https://crm.techcorp.io',
  },
  {
    projectId: 'P004',
    name: 'Website Redesign',
    clientName: 'Digital Plus',
    clientEmail: 'hello@digitalplus.agency',
    clientPhone: '9876543213',
    projectType: 'Fixed Price',
    category: 'UI/UX & Modern Frontend',
    projectManagerName: 'Sneha R',
    teamMembers: ['Sneha R', 'Priya S', 'Arjun M'],
    status: 'On Hold',
    priority: 'Medium',
    progress: 20,
    estimatedBudget: 220000,
    actualCost: 75000,
    startDate: '06-09-2025',
    targetEndDate: '30-10-2025',
    githubUrl: 'https://github.com/oneassist/digital-plus-redesign',
    figmaUrl: 'https://figma.com/file/digitalplus-redesign-v2',
    liveUrl: 'https://staging.digitalplus.agency',
  },
  {
    projectId: 'P005',
    name: 'ERP Module',
    clientName: 'GlobalSoft',
    clientEmail: 'erp@globalsoft.com',
    clientPhone: '9876543214',
    projectType: 'Fixed Price',
    category: 'Cloud ERP & Database Architecture',
    projectManagerName: 'Arjun M',
    teamMembers: ['Arjun M', 'Rahul K', 'Vikram S'],
    status: 'Not Started',
    priority: 'Urgent',
    progress: 10,
    estimatedBudget: 850000,
    actualCost: 50000,
    startDate: '08-09-2025',
    targetEndDate: '01-11-2025',
    githubUrl: 'https://github.com/oneassist/globalsoft-erp',
    figmaUrl: 'https://figma.com/file/erp-wireframes',
    liveUrl: '',
  },
  {
    projectId: 'P006',
    name: 'AI Chatbot',
    clientName: 'NextGen',
    clientEmail: 'ai@nextgen.ai',
    clientPhone: '9876543215',
    projectType: 'Time & Material',
    category: 'AI/ML Solutions & LLM Agents',
    projectManagerName: 'Vikram S',
    teamMembers: ['Vikram S', 'Santhosh C', 'Sneha R'],
    status: 'Not Started',
    priority: 'Medium',
    progress: 0,
    estimatedBudget: 400000,
    actualCost: 15000,
    startDate: '15-09-2025',
    targetEndDate: '10-11-2025',
    githubUrl: 'https://github.com/oneassist/nextgen-ai-agent',
    figmaUrl: 'https://figma.com/file/ai-bot-flow',
    liveUrl: '',
  },
];

async function seed() {
  console.log('🌱 Checking existing projects...');
  const count = await prisma.project.count();
  if (count === 0) {
    console.log('🌱 Seeding initial 6 projects from mock-up...');
    for (const proj of sampleProjects) {
      await prisma.project.create({ data: proj });
    }
    console.log('✅ Successfully seeded 6 projects matching screenshot mockup!');
  } else {
    console.log(`ℹ️ Projects already exist (Total: ${count}). Skipping seed.`);
  }
}

seed()
  .catch((err) => {
    console.error('❌ Error seeding projects:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
