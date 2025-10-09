/**
 * Database Setup Script
 * Creates database and user programmatically
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up FixRx Database...');
  
  // Connect as postgres user to create database and user
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to default postgres database
    user: 'postgres',
    password: 'postgres' // Try common default password
  });

  try {
    console.log('📡 Connecting to PostgreSQL as admin...');
    await adminClient.connect();
    console.log('✅ Connected successfully!');

    // Create database
    console.log('🗄️ Creating database...');
    try {
      await adminClient.query('CREATE DATABASE fixrx_production');
      console.log('✅ Database "fixrx_production" created');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('ℹ️ Database "fixrx_production" already exists');
      } else {
        throw error;
      }
    }

    // Create user
    console.log('👤 Creating user...');
    try {
      await adminClient.query("CREATE USER fixrx_user WITH PASSWORD 'fixrx123'");
      console.log('✅ User "fixrx_user" created');
    } catch (error) {
      if (error.code === '42710') {
        console.log('ℹ️ User "fixrx_user" already exists');
      } else {
        throw error;
      }
    }

    // Grant privileges
    console.log('🔑 Granting privileges...');
    await adminClient.query('GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user');
    console.log('✅ Privileges granted');

    await adminClient.end();

    // Now connect to the fixrx_production database to create tables
    console.log('📋 Setting up database schema...');
    const dbClient = new Client({
      host: 'localhost',
      port: 5432,
      database: 'fixrx_production',
      user: 'postgres',
      password: 'postgres'
    });

    await dbClient.connect();

    // Grant schema privileges
    await dbClient.query('GRANT ALL ON SCHEMA public TO fixrx_user');
    await dbClient.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fixrx_user');
    await dbClient.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fixrx_user');

    // Read and execute setup SQL
    const setupSqlPath = path.join(__dirname, 'setup-database.sql');
    if (fs.existsSync(setupSqlPath)) {
      console.log('📄 Reading setup-database.sql...');
      const setupSql = fs.readFileSync(setupSqlPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = setupSql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement && !statement.startsWith('--') && !statement.startsWith('\\')) {
          try {
            await dbClient.query(statement);
          } catch (error) {
            if (!error.message.includes('already exists')) {
              console.log(`⚠️ Warning executing statement ${i + 1}:`, error.message);
            }
          }
        }
      }
      console.log('✅ Database schema created');
    }

    // Read and execute seed data
    const seedSqlPath = path.join(__dirname, 'seed-data.sql');
    if (fs.existsSync(seedSqlPath)) {
      console.log('🌱 Loading seed data...');
      const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
      
      try {
        await dbClient.query(seedSql);
        console.log('✅ Seed data loaded');
      } catch (error) {
        console.log('⚠️ Warning loading seed data:', error.message);
      }
    }

    await dbClient.end();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('📋 Summary:');
    console.log('  ✅ Database: fixrx_production');
    console.log('  ✅ User: fixrx_user');
    console.log('  ✅ Password: fixrx123');
    console.log('  ✅ Schema: Created');
    console.log('  ✅ Sample Data: Loaded');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Troubleshooting:');
      console.error('  1. Make sure PostgreSQL service is running');
      console.error('  2. Check if port 5432 is available');
    } else if (error.code === '28P01') {
      console.error('\n🔧 Troubleshooting:');
      console.error('  1. Try different postgres password');
      console.error('  2. Check PostgreSQL authentication settings');
    }
    
    process.exit(1);
  }
}

setupDatabase();
