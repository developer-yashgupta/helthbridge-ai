/**
 * Database Migration Runner
 * Runs voice assistant migrations for HealthBridge AI
 * 
 * Usage:
 *   node database/migrations/run-migration.js [options]
 * 
 * Options:
 *   --up          Apply migrations (default)
 *   --down        Rollback migrations
 *   --seed        Include seed data (only with --up)
 *   --verify      Verify migration success
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'healthbridge',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  up: !args.includes('--down'),
  down: args.includes('--down'),
  seed: args.includes('--seed'),
  verify: args.includes('--verify')
};

/**
 * Read SQL file
 */
function readSQLFile(filename) {
  const filePath = path.join(__dirname, filename);
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Run migration up (apply changes)
 */
async function runMigrationUp(client, includeSeed = false) {
  console.log('📦 Applying voice assistant migrations...');
  
  try {
    // Apply main migration
    console.log('  ➜ Creating tables and indexes...');
    const migration = readSQLFile('001_voice_assistant_tables.sql');
    await client.query(migration);
    console.log('  ✓ Tables created successfully');
    
    // Apply seed data if requested
    if (includeSeed) {
      console.log('  ➜ Inserting seed data...');
      const seedData = readSQLFile('001_voice_assistant_seed_data.sql');
      await client.query(seedData);
      console.log('  ✓ Seed data inserted successfully');
    }
    
    return true;
  } catch (error) {
    console.error('  ✗ Migration failed:', error.message);
    throw error;
  }
}

/**
 * Run migration down (rollback changes)
 */
async function runMigrationDown(client) {
  console.log('🔄 Rolling back voice assistant migrations...');
  
  try {
    const rollback = readSQLFile('001_voice_assistant_rollback.sql');
    await client.query(rollback);
    console.log('  ✓ Rollback completed successfully');
    return true;
  } catch (error) {
    console.error('  ✗ Rollback failed:', error.message);
    throw error;
  }
}

/**
 * Verify migration success
 */
async function verifyMigration(client) {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check if tables exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'conversation_messages', 'routing_decisions', 'worker_notifications')
      ORDER BY table_name
    `);
    
    console.log(`  ➜ Found ${tableCheck.rows.length} tables:`);
    tableCheck.rows.forEach(row => {
      console.log(`    - ${row.table_name}`);
    });
    
    if (tableCheck.rows.length !== 4) {
      console.warn('  ⚠ Warning: Expected 4 tables, found', tableCheck.rows.length);
      return false;
    }
    
    // Check row counts
    const countCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM conversation_messages) as messages,
        (SELECT COUNT(*) FROM routing_decisions) as routing_decisions,
        (SELECT COUNT(*) FROM worker_notifications) as notifications
    `);
    
    const counts = countCheck.rows[0];
    console.log('  ➜ Row counts:');
    console.log(`    - conversations: ${counts.conversations}`);
    console.log(`    - conversation_messages: ${counts.messages}`);
    console.log(`    - routing_decisions: ${counts.routing_decisions}`);
    console.log(`    - worker_notifications: ${counts.notifications}`);
    
    // Check indexes
    const indexCheck = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('conversations', 'conversation_messages', 'routing_decisions', 'worker_notifications')
      ORDER BY tablename, indexname
    `);
    
    console.log(`  ➜ Found ${indexCheck.rows.length} indexes`);
    
    // Check triggers
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND event_object_table IN ('conversation_messages', 'worker_notifications')
    `);
    
    console.log(`  ➜ Found ${triggerCheck.rows.length} triggers:`);
    triggerCheck.rows.forEach(row => {
      console.log(`    - ${row.trigger_name} on ${row.event_object_table}`);
    });
    
    console.log('  ✓ Verification completed successfully');
    return true;
  } catch (error) {
    console.error('  ✗ Verification failed:', error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Voice Healthcare Assistant Migration Runner\n');
  console.log('Database:', process.env.DB_NAME || 'healthbridge');
  console.log('Host:', process.env.DB_HOST || 'localhost');
  console.log('Options:', options, '\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    if (options.down) {
      // Rollback migration
      await runMigrationDown(client);
    } else {
      // Apply migration
      await runMigrationUp(client, options.seed);
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Migration transaction committed');
    
    // Verify if requested
    if (options.verify && !options.down) {
      console.log('');
      await verifyMigration(client);
    }
    
    console.log('\n🎉 Migration completed successfully!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed and was rolled back');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runMigrationUp, runMigrationDown, verifyMigration };
