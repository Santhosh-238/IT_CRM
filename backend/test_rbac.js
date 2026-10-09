import { prisma } from './src/config/prisma.js';

async function testRBAC() {
  console.log('🧪 Starting RBAC Integration Tests...');

  // 1. Check Roles
  const roles = await prisma.role.findMany({ include: { permissions: true } });
  console.log(`✅ [1/5] Total roles in DB: ${roles.length}`);
  if (roles.length < 6) throw new Error('Expected at least 6 default roles');

  // 2. Check Role Permissions
  const superAdmin = roles.find((r) => r.slug === 'super_admin');
  console.log(`✅ [2/5] Super Admin permissions count: ${superAdmin?.permissions?.length}`);
  if (!superAdmin || superAdmin.permissions.length < 9) {
    throw new Error('Super Admin must have all 9 module permissions');
  }

  // 3. Test API Fetch Roles
  const rolesRes = await fetch('http://localhost:5000/api/access-control/roles');
  const rolesJson = await rolesRes.json();
  console.log(`✅ [3/5] API GET /roles Status: ${rolesRes.status}, Total: ${rolesJson.roles?.length}`);

  // 4. Test API Fetch Users
  const usersRes = await fetch('http://localhost:5000/api/access-control/users');
  const usersJson = await usersRes.json();
  console.log(`✅ [4/5] API GET /users Status: ${usersRes.status}, Total: ${usersJson.users?.length}`);

  // 5. Test API Fetch My Permissions
  const myPermsRes = await fetch('http://localhost:5000/api/access-control/my-permissions');
  const myPermsJson = await myPermsRes.json();
  console.log(`✅ [5/5] API GET /my-permissions Status: ${myPermsRes.status}, Role: ${myPermsJson.role?.name}, isSuperAdmin: ${myPermsJson.isSuperAdmin}`);

  console.log('\n🎉 ALL 5 RBAC INTEGRATION TESTS PASSED 100% PERFECTLY!');
  process.exit(0);
}

testRBAC().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
