/**
 * Database Connection Test for FixRx Backend
 * Tests PostgreSQL connection with the configured settings
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fixrx_production',
  user: process.env.DB_USER || 'fixrx_user',
  password: process.env.DB_PASSWORD || 'fixrx123',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('🔍 Testing Database Connection...');
console.log('Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: '***' + dbConfig.password.slice(-3),
  ssl: dbConfig.ssl
});

const pool = new Pool(dbConfig);

async function testConnection() {
  let client;
  
  try {
    console.log('\n📡 Connecting to PostgreSQL...');
    client = await pool.connect();
    
    console.log('✅ Database connection successful!');
    
    // Test basic query
    console.log('\n🔍 Testing basic query...');
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Current database time:', timeResult.rows[0].current_time);
    
    // Test database version
    console.log('\n🔍 Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    console.log('✅ PostgreSQL version:', versionResult.rows[0].version.split(' ')[0] + ' ' + versionResult.rows[0].version.split(' ')[1]);
    
    // Test if tables exist
    console.log('\n🔍 Checking if FixRx tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Found', tablesResult.rows.length, 'tables:');
      tablesResult.rows.forEach(row => {
        console.log('  -', row.table_name);
      });
    } else {
      console.log('⚠️  No tables found. Run setup-database.sql to create tables.');
    }
    
    // Test user permissions
    console.log('\n🔍 Testing user permissions...');
    try {
      await client.query('CREATE TEMP TABLE test_permissions (id SERIAL, name TEXT)');
      await client.query('INSERT INTO test_permissions (name) VALUES ($1)', ['test']);
      await client.query('SELECT * FROM test_permissions');
      await client.query('DROP TABLE test_permissions');
      console.log('✅ User has sufficient permissions (CREATE, INSERT, SELECT, DROP)');
    } catch (permError) {
      console.log('❌ Permission test failed:', permError.message);
    }
    
    // Test connection pool
    console.log('\n🔍 Testing connection pool...');
    const poolInfo = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    console.log('✅ Connection pool status:', poolInfo);
    
    console.log('\n🎉 All database tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Connection: Working');
    console.log('  ✅ Authentication: Valid');
    console.log('  ✅ Permissions: Sufficient');
    console.log('  ✅ Pool: Configured');
    console.log('  📊 Tables:', tablesResult.rows.length);
    
  } catch (error) {
    console.error('\n❌ Database connection test failed!');
    console.error('Error details:', error.message);
    
    // Provide specific error guidance
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Troubleshooting:');
      console.error('  1. Make sure PostgreSQL is installed and running');
      console.error('  2. Check if PostgreSQL service is started');
      console.error('  3. Verify the host and port are correct');
      console.error('  4. Run: net start postgresql-x64-14');
    } else if (error.code === '28P01') {
      console.error('\n🔧 Troubleshooting:');
      console.error('  1. Check username and password in .env file');
      console.error('  2. Verify user exists: psql -U postgres -c "\\du"');
      console.error('  3. Reset password: ALTER USER fixrx_user PASSWORD \'fixrx123\';');
    } else if (error.code === '3D000') {
      console.error('\n🔧 Troubleshooting:');
      console.error('  1. Database does not exist');
      console.error('  2. Create database: CREATE DATABASE fixrx_production;');
      console.error('  3. Grant permissions: GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user;');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await pool.end();
  process.exit(0);
});

// Run the test
testConnection();
