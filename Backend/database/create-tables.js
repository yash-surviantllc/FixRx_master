/**
 * Create Database Tables
 * Simplified table creation script
 */

const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fixrx_production',
  user: process.env.DB_USER || 'fixrx_user',
  password: process.env.DB_PASSWORD || 'fixrx123',
};

async function createTables() {
  console.log('🏗️ Creating FixRx Database Tables...');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

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

    // Create indexes for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_connection_requests_consumer_id ON connection_requests(consumer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_connection_requests_vendor_id ON connection_requests(vendor_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id)');
    console.log('✅ Indexes created');

    // Insert sample service categories
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
    console.log('✅ Sample service categories inserted');

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

    console.log('\n🎉 Database tables created successfully!');
    console.log('📊 Summary:');
    console.log('  ✅ 8 core tables created');
    console.log('  ✅ Indexes added for performance');
    console.log('  ✅ Sample data inserted');
    console.log('  ✅ Foreign key constraints configured');
    console.log('  ✅ UUID primary keys enabled');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  }
}

createTables();
