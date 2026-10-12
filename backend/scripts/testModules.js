import prisma from '../src/config/prisma.js';
import * as projectService from '../src/services/project.service.js';

async function run() {
  const p = await prisma.project.findFirst();
  console.log('Project:', p.name);
  const detail = await projectService.getProjectByIdService(p.id);
  console.log('Modules length:', detail.data.modules.length);
  console.log('Modules:', detail.data.modules);
  
  const updateRes = await projectService.updateProjectModulesService(p.id, [
    ...detail.data.modules,
    { id: 'mod-new', name: 'Deployment & CI/CD', progress: 10, deadline: '25-11-2026', status: 'In Progress', assignedTo: 'Santhosh' }
  ]);
  console.log('After add module, count:', updateRes.data.modules.length, 'overall progress:', updateRes.data.progress);
}

run().catch(console.error).finally(() => prisma.$disconnect());
