/**
 * Database Migration Runner for Contact Management Tables
 * Run this script to create all necessary tables for the contact management system
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Read migration file
    const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', '002_contact_management_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Running contact management migration...');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Contact management tables created successfully!');
    console.log('\n📋 Created tables:');
    console.log('   - contacts');
    console.log('   - contact_import_batches');
    console.log('   - sms_messages');
    console.log('   - sms_bulk_batches');
    console.log('   - invitations');
    console.log('   - invitation_bulk_batches');
    console.log('   - invitation_logs');
    console.log('   - sms_templates');
    console.log('   - contact_sync_sessions');
    
    // Verify tables were created
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'contacts', 'contact_import_batches', 'sms_messages', 
          'sms_bulk_batches', 'invitations', 'invitation_bulk_batches',
          'invitation_logs', 'sms_templates', 'contact_sync_sessions'
        )
      ORDER BY table_name
    `);
    
    console.log('\n✅ Verified tables:');
    tableCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure PostgreSQL is running');
    console.error('2. Check DATABASE_URL in .env file');
    console.error('3. Verify database exists and user has permissions');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = runMigration;
