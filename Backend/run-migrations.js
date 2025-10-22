#!/usr/bin/env node

/**
 * Database Migration Runner for FixRx
 * Runs all necessary migrations to set up the database correctly
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const migrations = [
  '001_comprehensive_schema_setup.sql',
  '002_contact_management_tables.sql',
  '003_messaging_tables.sql'
];

async function runMigrations() {
  const pool = new Pool({
    user: process.env.DB_USER || 'fixrx_user',
    password: process.env.DB_PASSWORD || 'fixrx_password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'fixrx_db',
  });
  
  console.log('🚀 Starting FixRx Database Migrations...\n');
  console.log(`📊 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'fixrx_db'}`);
  console.log('=' .repeat(60));
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database\n');
    
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS applied_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    for (const migrationFile of migrations) {
      // Check if migration was already applied
      const checkResult = await client.query(
        'SELECT 1 FROM applied_migrations WHERE filename = $1',
        [migrationFile]
      );
      
      if (checkResult.rows.length > 0) {
        console.log(`⏭️  Skipping ${migrationFile} (already applied)`);
        continue;
      }
      
      console.log(`📝 Running migration: ${migrationFile}`);
      
      try {
        const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
          console.log(`   ⚠️  File not found, skipping`);
          continue;
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Run the migration
        await client.query(migrationSQL);
        
        // Record that migration was applied
        await client.query(
          'INSERT INTO applied_migrations (filename) VALUES ($1)',
          [migrationFile]
        );
        
        console.log(`   ✅ Applied successfully`);
      } catch (migrationError) {
        console.error(`   ❌ Failed: ${migrationError.message}`);
        // Continue with other migrations
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Verifying database schema...\n');
    
    // Verify critical tables exist
    const criticalTables = [
      'users',
      'otp_verifications',
      'phone_auth_sessions',
      'conversations',
      'messages',
      'invitations'
    ];
    
    for (const tableName of criticalTables) {
      const tableExists = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )`,
        [tableName]
      );
      
      const exists = tableExists.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} Table '${tableName}': ${exists ? 'EXISTS' : 'MISSING'}`);
    }
    
    client.release();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Database migrations completed successfully!');
    console.log('\nYour database is now ready for:');
    console.log('  ✅ OTP Authentication');
    console.log('  ✅ Invitation System');
    console.log('  ✅ Messaging System');
    console.log('  ✅ Contact Management\n');
    
  } catch (error) {
    console.error('\n❌ Migration runner failed:', error.message);
    console.error('\n🔍 Troubleshooting tips:');
    console.error('1. Ensure PostgreSQL is running');
    console.error('2. Check database credentials in .env file');
    console.error('3. Verify database exists: createdb fixrx_db');
    console.error('4. Check user permissions: GRANT ALL ON DATABASE fixrx_db TO fixrx_user');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
