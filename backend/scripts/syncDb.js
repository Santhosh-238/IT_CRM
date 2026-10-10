import { execSync } from 'child_process';

/**
 * Pure SQL Table Creation & Synchronization Script
 * Only creates and syncs PostgreSQL tables with Prisma Schema (No dummy seed data).
 */
async function main() {
  console.log('🚀 [DB Sync] Creating and syncing PostgreSQL SQL tables...');

  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
    });
    console.log('\n✅ [SUCCESS] All PostgreSQL SQL tables created & synced successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [ERROR] Failed to create database tables:', err.message || err);
    process.exit(1);
  }
}

main();
