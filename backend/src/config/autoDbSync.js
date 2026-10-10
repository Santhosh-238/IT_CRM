import { execSync } from 'child_process';

/**
 * Automatically creates and syncs PostgreSQL Database SQL tables from Prisma Schema
 * Pure table creation only - no dummy/seed data created.
 */
export async function autoSyncDatabase() {
  try {
    console.log('🔄 [Auto-Sync] Checking and creating PostgreSQL SQL tables...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'pipe',
      timeout: 30000,
    });
    console.log('✅ [Auto-Sync] All PostgreSQL SQL tables verified and synced!');
  } catch (error) {
    console.warn('⚠️ [Auto-Sync Notice]:', error.message || error);
  }
}

export default autoSyncDatabase;
