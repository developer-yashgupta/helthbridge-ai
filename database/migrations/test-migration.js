/**
 * Migration Test Script
 * Tests the voice assistant migration files for syntax and structure
 * 
 * Usage:
 *   node database/migrations/test-migration.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Voice Assistant Migration Files\n');

const files = [
  '001_voice_assistant_tables.sql',
  '001_voice_assistant_seed_data.sql',
  '001_voice_assistant_rollback.sql'
];

let allTestsPassed = true;

files.forEach(filename => {
  console.log(`Testing ${filename}...`);
  const filePath = path.join(__dirname, filename);
  
  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      console.error(`  ✗ File not found: ${filename}`);
      allTestsPassed = false;
      return;
    }
    console.log('  ✓ File exists');
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check file is not empty
    if (content.trim().length === 0) {
      console.error(`  ✗ File is empty: ${filename}`);
      allTestsPassed = false;
      return;
    }
    console.log('  ✓ File has content');
    
    // Check for SQL syntax basics
    if (filename.includes('tables')) {
      // Main migration should have CREATE TABLE statements
      const tableCount = (content.match(/CREATE TABLE/gi) || []).length;
      console.log(`  ✓ Found ${tableCount} CREATE TABLE statements`);
      
      if (tableCount !== 4) {
        console.warn(`  ⚠ Expected 4 tables, found ${tableCount}`);
      }
      
      // Check for indexes
      const indexCount = (content.match(/CREATE INDEX/gi) || []).length;
      console.log(`  ✓ Found ${indexCount} CREATE INDEX statements`);
      
      // Check for triggers
      const triggerCount = (content.match(/CREATE TRIGGER/gi) || []).length;
      console.log(`  ✓ Found ${triggerCount} CREATE TRIGGER statements`);
      
      // Check for functions
      const functionCount = (content.match(/CREATE OR REPLACE FUNCTION/gi) || []).length;
      console.log(`  ✓ Found ${functionCount} CREATE FUNCTION statements`);
      
      // Verify expected tables
      const expectedTables = [
        'conversations',
        'conversation_messages',
        'routing_decisions',
        'worker_notifications'
      ];
      
      expectedTables.forEach(table => {
        if (content.includes(table)) {
          console.log(`  ✓ Table '${table}' defined`);
        } else {
          console.error(`  ✗ Table '${table}' not found`);
          allTestsPassed = false;
        }
      });
    }
    
    if (filename.includes('seed')) {
      // Seed data should have INSERT statements
      const insertCount = (content.match(/INSERT INTO/gi) || []).length;
      console.log(`  ✓ Found ${insertCount} INSERT INTO statements`);
      
      if (insertCount === 0) {
        console.error(`  ✗ No INSERT statements found in seed data`);
        allTestsPassed = false;
      }
    }
    
    if (filename.includes('rollback')) {
      // Rollback should have DROP statements
      const dropCount = (content.match(/DROP TABLE/gi) || []).length;
      console.log(`  ✓ Found ${dropCount} DROP TABLE statements`);
      
      if (dropCount === 0) {
        console.error(`  ✗ No DROP statements found in rollback`);
        allTestsPassed = false;
      }
    }
    
    // Check for common SQL syntax errors
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      console.error(`  ✗ Mismatched parentheses: ${openParens} open, ${closeParens} close`);
      allTestsPassed = false;
    } else {
      console.log(`  ✓ Parentheses balanced (${openParens} pairs)`);
    }
    
    console.log(`  ✅ ${filename} passed all tests\n`);
    
  } catch (error) {
    console.error(`  ✗ Error testing ${filename}:`, error.message);
    allTestsPassed = false;
  }
});

// Test migration runner script
console.log('Testing run-migration.js...');
const runnerPath = path.join(__dirname, 'run-migration.js');
try {
  if (!fs.existsSync(runnerPath)) {
    console.error('  ✗ run-migration.js not found');
    allTestsPassed = false;
  } else {
    console.log('  ✓ run-migration.js exists');
    const runnerContent = fs.readFileSync(runnerPath, 'utf8');
    
    // Check for required functions
    const requiredFunctions = ['runMigrationUp', 'runMigrationDown', 'verifyMigration'];
    requiredFunctions.forEach(func => {
      if (runnerContent.includes(func)) {
        console.log(`  ✓ Function '${func}' defined`);
      } else {
        console.error(`  ✗ Function '${func}' not found`);
        allTestsPassed = false;
      }
    });
    
    console.log('  ✅ run-migration.js passed all tests\n');
  }
} catch (error) {
  console.error('  ✗ Error testing run-migration.js:', error.message);
  allTestsPassed = false;
}

// Summary
console.log('═'.repeat(50));
if (allTestsPassed) {
  console.log('✅ All migration tests passed!');
  console.log('\nNext steps:');
  console.log('1. Ensure PostgreSQL is running');
  console.log('2. Configure environment variables in backend/.env');
  console.log('3. Run: npm run migrate:up:seed (from backend directory)');
  console.log('4. Verify: npm run migrate:verify');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the errors above.');
  process.exit(1);
}
