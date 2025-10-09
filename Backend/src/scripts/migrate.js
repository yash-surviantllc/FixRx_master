require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'fixrx_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const statements = [
  'CREATE EXTENSION IF NOT EXISTS "pgcrypto"',
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM ('consumer','vendor','admin');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN
        CREATE TYPE user_status_enum AS ENUM ('active','inactive','suspended','deleted');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status_enum') THEN
        CREATE TYPE service_status_enum AS ENUM ('requested','quoted','accepted','in_progress','completed','cancelled','disputed');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_enum') THEN
        CREATE TYPE priority_enum AS ENUM ('low','normal','high','urgent');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_method_enum') THEN
        CREATE TYPE contact_method_enum AS ENUM ('email','phone','sms','push');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_enum') THEN
        CREATE TYPE verification_status_enum AS ENUM ('pending','in_review','approved','rejected');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_category_enum') THEN
        CREATE TYPE notification_category_enum AS ENUM ('service_requests','messages','ratings','system','marketing');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
        CREATE TYPE notification_type_enum AS ENUM ('push','email','sms','in_app');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status_enum') THEN
        CREATE TYPE notification_status_enum AS ENUM ('pending','sent','delivered','failed','cancelled');
      END IF;
    END $$;`,
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_type user_type_enum NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    status user_status_enum DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
  )`,
  `CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_description TEXT,
    business_license VARCHAR(100),
    insurance_info JSONB,
    service_categories TEXT[] NOT NULL,
    service_areas JSONB,
    pricing_info JSONB,
    availability_schedule JSONB,
    verification_status verification_status_enum DEFAULT 'pending',
    verification_documents JSONB,
    business_address JSONB NOT NULL,
    website_url TEXT,
    social_media JSONB,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    status user_status_enum DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS consumers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_contact_method contact_method_enum DEFAULT 'email',
    service_preferences JSONB,
    location_preferences JSONB,
    budget_preferences JSONB,
    notification_preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    service_address JSONB NOT NULL,
    scheduled_date TIMESTAMPTZ,
    estimated_duration INTEGER,
    estimated_cost NUMERIC(10,2),
    actual_cost NUMERIC(10,2),
    status service_status_enum DEFAULT 'requested',
    priority priority_enum DEFAULT 'normal',
    images TEXT[],
    requirements JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  )`,
  `CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    cost_rating INTEGER CHECK (cost_rating BETWEEN 1 AND 5),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    timeliness_rating INTEGER CHECK (timeliness_rating BETWEEN 1 AND 5),
    professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
    overall_rating NUMERIC(3,2) GENERATED ALWAYS AS ((cost_rating + quality_rating + timeliness_rating + professionalism_rating) / 4.0) STORED,
    comment TEXT,
    images TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (service_id, consumer_id)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    category notification_category_enum NOT NULL,
    type notification_type_enum NOT NULL,
    data JSONB,
    status notification_status_enum DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    external_id VARCHAR(255),
    delivery_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  'CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type)',
  'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
  'CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_vendors_service_categories ON vendors USING GIN (service_categories)',
  'CREATE INDEX IF NOT EXISTS idx_vendors_business_name ON vendors(business_name)',
  'CREATE INDEX IF NOT EXISTS idx_vendors_verification_status ON vendors(verification_status)',
  'CREATE INDEX IF NOT EXISTS idx_vendors_location_bbox ON vendors(latitude, longitude)',
  'CREATE INDEX IF NOT EXISTS idx_consumers_user_id ON consumers(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_services_consumer_id ON services(consumer_id)',
  'CREATE INDEX IF NOT EXISTS idx_services_vendor_id ON services(vendor_id)',
  'CREATE INDEX IF NOT EXISTS idx_services_status ON services(status)',
  'CREATE INDEX IF NOT EXISTS idx_services_service_type ON services(service_type)',
  'CREATE INDEX IF NOT EXISTS idx_ratings_vendor_id ON ratings(vendor_id)',
  'CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)'
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting FixRx database migration...');

    for (const statement of statements) {
      const start = Date.now();
      try {
        await client.query(statement);
        const duration = Date.now() - start;
        console.log(`✅ Executed: ${statement.split('\n')[0]} (${duration} ms)`);
      } catch (error) {
        console.error(`❌ Failed statement: ${statement.split('\n')[0]}`);
        throw error;
      }
    }

    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
