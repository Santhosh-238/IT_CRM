import { execSync } from 'child_process';
import { ensureSystemRolesService } from '../services/accessControl.service.js';

/**
 * Automatically creates and syncs PostgreSQL Database SQL tables from Prisma Schema
 * and ensures system roles (Super Admin, Admin, Project Manager, Sales Executive) exist.
 */
export async function autoSyncDatabase() {
  try {
    console.log('🔄 [Auto-Sync] Checking and creating PostgreSQL SQL tables...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'pipe',
      timeout: 30000,
    });
    console.log('✅ [Auto-Sync] All PostgreSQL SQL tables verified and synced!');
    await ensureSystemRolesService();
    console.log('🛡️ [Auto-Sync] Default system roles verified and active!');
  } catch (error) {
    console.warn('⚠️ [Auto-Sync Notice]:', error.message || error);
  }
}

export default autoSyncDatabase;
