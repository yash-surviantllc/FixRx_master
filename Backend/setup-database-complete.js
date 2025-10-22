/**
 * Complete Database Setup Script for FixRx
 * Automates the entire database setup process
 */

const { Client } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config();

console.log('🚀 FixRx Complete Database Setup');
console.log('================================\n');

async function checkPostgreSQLInstallation() {
  console.log('1️⃣ Checking PostgreSQL Installation...');
  
  try {
    // Check if PostgreSQL service is running
    const services = execSync('powershell "Get-Service postgresql*"', { encoding: 'utf8' });
    
    if (services.includes('Running')) {
      console.log('✅ PostgreSQL service is running');
      return true;
    } else {
      console.log('⚠️ PostgreSQL service found but not running');
      
      // Try to start the service
      try {
        execSync('powershell "Start-Service postgresql-x64-14"', { encoding: 'utf8' });
        console.log('✅ PostgreSQL service started');
        return true;
      } catch (error) {
        console.log('❌ Could not start PostgreSQL service');
        return false;
      }
    }
  } catch (error) {
    console.log('❌ PostgreSQL not found or not installed');
    console.log('\n📥 To install PostgreSQL:');
    console.log('   1. Run PowerShell as Administrator');
    console.log('   2. Execute: choco install postgresql14 -y');
    console.log('   3. Or download from: https://www.postgresql.org/download/windows/');
    return false;
  }
}

async function createDatabaseAndUser() {
  console.log('\n2️⃣ Creating Database and User...');
  
  // Try different common postgres passwords
  const passwords = ['postgres', '', 'admin', '123456'];
  
  for (const password of passwords) {
    try {
      console.log(`   Trying postgres password: ${password || '(empty)'}`);
      
      const adminClient = new Client({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: password
      });

      await adminClient.connect();
      console.log('✅ Connected to PostgreSQL as admin');

      // Create database
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
      await adminClient.query('GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user');
      console.log('✅ Privileges granted to fixrx_user');

      await adminClient.end();
      return true;

    } catch (error) {
      if (error.code === '28P01') {
        console.log(`   ❌ Wrong password: ${password || '(empty)'}`);
        continue;
      } else {
        console.error(`   ❌ Error: ${error.message}`);
        continue;
      }
    }
  }

  console.log('❌ Could not connect to PostgreSQL with any common password');
  console.log('\n🔧 Manual Setup Required:');
  console.log('   1. Find your postgres password');
  console.log('   2. Run: psql -U postgres -h localhost');
  console.log('   3. Execute the SQL commands from the setup guide');
  return false;
}

async function createTables() {
  console.log('\n3️⃣ Creating Database Tables...');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'fixrx_production',
    user: 'fixrx_user',
    password: 'fixrx123'
  });

  try {
    await client.connect();
    console.log('✅ Connected to fixrx_production database');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('CONSUMER', 'VENDOR')),
        profile_image_url TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        metro_area VARCHAR(100),
        auth0_id VARCHAR(255) UNIQUE,
        google_id VARCHAR(255) UNIQUE,
        facebook_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP WITH TIME ZONE,
        email_verified_at TIMESTAMP WITH TIME ZONE,
        phone_verified_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✅ Users table created');

    // Create service_categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon_url VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Service categories table created');

    // Create services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category_id UUID NOT NULL REFERENCES service_categories(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Services table created');

    // Create vendor_services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_services (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        service_id UUID NOT NULL REFERENCES services(id),
        price_range_min DECIMAL(10,2),
        price_range_max DECIMAL(10,2),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vendor_id, service_id)
      )
    `);
    console.log('✅ Vendor services table created');

    // Create connection_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        consumer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        service_id UUID REFERENCES services(id),
        message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
        project_description TEXT,
        budget_range_min DECIMAL(10,2),
        budget_range_max DECIMAL(10,2),
        preferred_start_date DATE,
        urgency VARCHAR(20) DEFAULT 'MEDIUM' CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✅ Connection requests table created');

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        connection_request_id UUID REFERENCES connection_requests(id),
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'SYSTEM')),
        attachment_url VARCHAR(500),
        is_read BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✅ Messages table created');

    // Create ratings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        connection_request_id UUID REFERENCES connection_requests(id),
        overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
        cost_rating INTEGER CHECK (cost_rating >= 1 AND cost_rating <= 5),
        quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
        timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
        professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
        review_text TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Ratings table created');

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        related_entity_type VARCHAR(50),
        related_entity_id UUID,
        is_read BOOLEAN DEFAULT FALSE,
        is_pushed BOOLEAN DEFAULT FALSE,
        push_sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✅ Notifications table created');

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_connection_requests_consumer_id ON connection_requests(consumer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_connection_requests_vendor_id ON connection_requests(vendor_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id)');
    console.log('✅ Indexes created');

    await client.end();
    return true;

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    return false;
  }
}

async function insertSampleData() {
  console.log('\n4️⃣ Inserting Sample Data...');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'fixrx_production',
    user: 'fixrx_user',
    password: 'fixrx123'
  });

  try {
    await client.connect();

    // Insert service categories
    await client.query(`
      INSERT INTO service_categories (name, description, sort_order) VALUES
      ('Plumbing', 'Plumbing services including repairs, installations, and maintenance', 1),
      ('Electrical', 'Electrical services including wiring, repairs, and installations', 2),
      ('HVAC', 'Heating, ventilation, and air conditioning services', 3),
      ('Carpentry', 'Carpentry and woodworking services', 4),
      ('Painting', 'Interior and exterior painting services', 5),
      ('Cleaning', 'House cleaning and maintenance services', 6),
      ('Handyman', 'General handyman and repair services', 7)
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Service categories inserted');

    // Insert sample users
    await client.query(`
      INSERT INTO users (email, first_name, last_name, user_type, phone, metro_area, is_verified, is_active) VALUES
      ('john.consumer@example.com', 'John', 'Smith', 'CONSUMER', '+1234567890', 'San Francisco Bay Area', true, true),
      ('jane.consumer@example.com', 'Jane', 'Johnson', 'CONSUMER', '+1234567891', 'Los Angeles', true, true),
      ('bob.plumber@example.com', 'Bob', 'Wilson', 'VENDOR', '+1234567893', 'San Francisco Bay Area', true, true),
      ('alice.electrician@example.com', 'Alice', 'Brown', 'VENDOR', '+1234567894', 'San Francisco Bay Area', true, true),
      ('carlos.painter@example.com', 'Carlos', 'Rodriguez', 'VENDOR', '+1234567895', 'Los Angeles', true, true)
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ Sample users inserted');

    await client.end();
    return true;

  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    return false;
  }
}

async function testConnection() {
  console.log('\n5️⃣ Testing Database Connection...');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'fixrx_production',
    user: 'fixrx_user',
    password: 'fixrx123'
  });

  try {
    await client.connect();
    
    // Test basic query
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    console.log(`   Current time: ${timeResult.rows[0].current_time}`);
    
    // Test tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`✅ Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Test sample data
    const usersResult = await client.query('SELECT COUNT(*) as count, user_type FROM users GROUP BY user_type');
    console.log('✅ Sample data verification:');
    usersResult.rows.forEach(row => {
      console.log(`   - ${row.user_type}: ${row.count} users`);
    });

    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM service_categories');
    console.log(`   - Service Categories: ${categoriesResult.rows[0].count}`);

    await client.end();
    return true;

  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

async function updateEnvFile() {
  console.log('\n6️⃣ Updating Environment Configuration...');
  
  const envContent = `# FixRx Backend Environment Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
API_VERSION=v1
BASE_URL=http://localhost:3000

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://fixrx_user:fixrx123@localhost:5432/fixrx_production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fixrx_production
DB_USER=fixrx_user
DB_PASSWORD=fixrx123
DB_SSL=false
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=10000

# JWT & Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters_long_for_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_token_secret_key_also_minimum_32_characters_long
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=your_session_secret_key_for_express_sessions_minimum_32_chars

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600
`;

  const fs = require('fs');
  fs.writeFileSync('.env', envContent);
  console.log('✅ Environment file updated');
}

async function runCompleteSetup() {
  console.log('Starting complete database setup...\n');
  
  let success = true;

  // Step 1: Check PostgreSQL
  const pgInstalled = await checkPostgreSQLInstallation();
  if (!pgInstalled) {
    success = false;
  }

  // Step 2: Create database and user
  if (success) {
    const dbCreated = await createDatabaseAndUser();
    if (!dbCreated) {
      success = false;
    }
  }

  // Step 3: Create tables
  if (success) {
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      success = false;
    }
  }

  // Step 4: Insert sample data
  if (success) {
    const dataInserted = await insertSampleData();
    if (!dataInserted) {
      success = false;
    }
  }

  // Step 5: Test connection
  if (success) {
    const connectionOk = await testConnection();
    if (!connectionOk) {
      success = false;
    }
  }

  // Step 6: Update env file
  if (success) {
    await updateEnvFile();
  }

  // Final result
  console.log('\n🎯 Setup Complete!');
  console.log('==================');
  
  if (success) {
    console.log('🎉 SUCCESS! Your FixRx database is ready!');
    console.log('\n📊 Setup Summary:');
    console.log('   ✅ PostgreSQL: Running');
    console.log('   ✅ Database: fixrx_production created');
    console.log('   ✅ User: fixrx_user configured');
    console.log('   ✅ Tables: 8 tables created');
    console.log('   ✅ Sample Data: Loaded');
    console.log('   ✅ Connection: Tested');
    console.log('   ✅ Environment: Configured');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start your backend: npm run dev');
    console.log('   2. Test APIs: node test-mobile-endpoints.js');
    console.log('   3. Connect your React Native app to: http://localhost:3000');
    
    console.log('\n🔗 Database Connection Details:');
    console.log('   Host: localhost');
    console.log('   Port: 5432');
    console.log('   Database: fixrx_production');
    console.log('   User: fixrx_user');
    console.log('   Password: fixrx123');
  } else {
    console.log('❌ SETUP FAILED! Please check the errors above.');
    console.log('\n🔧 Manual Setup Options:');
    console.log('   1. Follow DATABASE_SETUP_GUIDE.md');
    console.log('   2. Run individual scripts: node database/create-tables.js');
    console.log('   3. Use pgAdmin to create database manually');
  }
}

// Run the complete setup
runCompleteSetup().catch(error => {
  console.error('❌ Setup failed with error:', error);
  process.exit(1);
});
