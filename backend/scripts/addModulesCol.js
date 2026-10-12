import prisma from '../src/config/prisma.js';

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "modules" jsonb DEFAULT '[]'::jsonb;`);
  console.log('SUCCESS: modules column added to Project table in PostgreSQL');
  const res = await prisma.$queryRawUnsafe(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'modules';`);
  console.log('VERIFIED COLUMN:', res);
}

main().catch(console.error).finally(() => prisma.$disconnect());
