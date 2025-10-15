const { Pool } = require('pg');

const pool = new Pool({
  user: 'fixrx_user',
  host: 'localhost',
  database: 'fixrx_db',
  password: 'fixrx_password',
  port: 5432
});

async function fixTables() {
  const client = await pool.connect();
  try {
    console.log('Adding missing columns...');
    
    // Fix users table
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE');
    console.log('✅ Added referral_code to users');
    
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