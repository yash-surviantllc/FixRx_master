/**
 * Magic Link Database Setup Script
 * Sets up the magic_links table and related structures
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fixrx_production',
  user: process.env.DB_USER || 'fixrx_user',
  password: process.env.DB_PASSWORD || 'fixrx123',
};

const pool = new Pool(dbConfig);

async function setupMagicLinks() {
  let client;
  
  try {
    console.log('🔧 Setting up Magic Link Authentication...');
    client = await pool.connect();
    
    // Check if magic_links table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'magic_links'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Magic links table already exists');
    } else {
      console.log('📋 Creating magic_links table...');
      
      // Create magic_links table
      await client.query(`
        CREATE TABLE magic_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          purpose VARCHAR(50) NOT NULL DEFAULT 'LOGIN' CHECK (purpose IN ('LOGIN', 'REGISTRATION', 'EMAIL_VERIFICATION')),
          is_used BOOLEAN DEFAULT FALSE,
          ip_address INET,
          user_agent TEXT,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Magic links table created');
    }
    
    // Create indexes
    console.log('📊 Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);',
      'CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);',
      'CREATE INDEX IF NOT EXISTS idx_magic_links_user_id ON magic_links(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_magic_links_expires_at ON magic_links(expires_at);',
      'CREATE INDEX IF NOT EXISTS idx_magic_links_is_used ON magic_links(is_used);',
      'CREATE INDEX IF NOT EXISTS idx_magic_links_created_at ON magic_links(created_at);'
    ];
    
    for (const indexQuery of indexes) {
      await client.query(indexQuery);
    }
    
    console.log('✅ Indexes created');
    
    // Add trigger for updated_at (if function exists)
    try {
      await client.query(`
        CREATE TRIGGER update_magic_links_updated_at 
        BEFORE UPDATE ON magic_links 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      `);
      console.log('✅ Trigger created');
    } catch (error) {
      console.log('⚠️ Trigger creation skipped (function may not exist)');
    }
    
    // Test the table
    console.log('🧪 Testing magic_links table...');
    const testResult = await client.query('SELECT COUNT(*) FROM magic_links');
    console.log(`✅ Magic links table working (${testResult.rows[0].count} records)`);
    
    console.log('\n🎉 Magic Link Authentication setup complete!');
    console.log('\nNext steps:');
    console.log('1. Configure SendGrid in your .env file');
    console.log('2. Start the server: npm run dev');
    console.log('3. Test the endpoints');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Make sure PostgreSQL is running');
      console.error('2. Check database connection settings in .env');
      console.error('3. Verify database exists: fixrx_production');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run setup
setupMagicLinks();
