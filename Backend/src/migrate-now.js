const { Pool } = require('pg');

const pool = new Pool({
  user: 'fixrx_user',
  host: 'localhost',
  database: 'fixrx_production',
  password: 'fixrx123',
  port: 5432
});

async function fixTables() {
  const client = await pool.connect();
  try {
    console.log('Adding missing columns...');
    
    // Fix users table - add email_verified_at and phone_verified_at
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE');
    console.log('✅ Added email_verified_at to users');
    
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE');
    console.log('✅ Added phone_verified_at to users');
    
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE');
    console.log('✅ Added referral_code to users');
    
    // Update existing verified users
    await client.query('UPDATE users SET email_verified_at = created_at WHERE email_verified = true AND email_verified_at IS NULL');
    console.log('✅ Updated email_verified_at for existing users');
    
    // Fix invitations table - add missing columns one by one
    await client.query('ALTER TABLE invitations ADD COLUMN IF NOT EXISTS inviter_id UUID');
    await client.query('ALTER TABLE invitations ADD COLUMN IF NOT EXISTS custom_message TEXT');
    await client.query('ALTER TABLE invitations ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)');
    await client.query('ALTER TABLE invitations ADD COLUMN IF NOT EXISTS service_category VARCHAR(100)');
    console.log('✅ Added columns to invitations');
    
    // Fix contacts table  
    await client.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type VARCHAR(50) DEFAULT \'FRIEND\'');
    console.log('✅ Added contact_type to contacts');
    
    console.log('All columns added successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTables();