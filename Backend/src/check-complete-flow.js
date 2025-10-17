const { Pool } = require('pg');

const pool = new Pool({
  user: 'fixrx_user',
  host: 'localhost',
  database: 'fixrx_production',
  password: 'fixrx123',
  port: 5432
});

async function checkCompleteFlow() {
  const client = await pool.connect();
  try {
    console.log('🔍 COMPREHENSIVE MAGIC LINK FLOW CHECK\n');
    console.log('=' .repeat(60));
    
    // 1. Check users table columns
    console.log('\n1️⃣  USERS TABLE SCHEMA');
    console.log('-'.repeat(60));
    const userColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    const userCols = userColumns.rows.map(r => r.column_name);
    console.log('Columns:', userCols.join(', '));
    
    const requiredUserCols = ['id', 'email', 'first_name', 'last_name', 'user_type', 'is_verified', 'is_active', 'email_verified_at', 'phone_verified_at', 'password_hash'];
    const missingUserCols = requiredUserCols.filter(col => !userCols.includes(col));
    
    if (missingUserCols.length > 0) {
      console.log('❌ Missing columns:', missingUserCols.join(', '));
    } else {
      console.log('✅ All required columns present');
    }
    
    // 2. Check magic_links table
    console.log('\n2️⃣  MAGIC_LINKS TABLE SCHEMA');
    console.log('-'.repeat(60));
    const magicLinkColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'magic_links'
      ORDER BY ordinal_position;
    `);
    
    if (magicLinkColumns.rows.length === 0) {
      console.log('❌ magic_links table does NOT exist!');
    } else {
      const mlCols = magicLinkColumns.rows.map(r => r.column_name);
      console.log('Columns:', mlCols.join(', '));
      
      const requiredMLCols = ['id', 'email', 'token', 'user_id', 'purpose', 'expires_at', 'used_at', 'ip_address', 'user_agent'];
      const missingMLCols = requiredMLCols.filter(col => !mlCols.includes(col));
      
      if (missingMLCols.length > 0) {
        console.log('❌ Missing columns:', missingMLCols.join(', '));
      } else {
        console.log('✅ All required columns present');
      }
    }
    
    // 3. Check user_type enum
    console.log('\n3️⃣  USER_TYPE ENUM VALUES');
    console.log('-'.repeat(60));
    try {
      const enumValues = await client.query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'user_type_enum'
        );
      `);
      
      if (enumValues.rows.length > 0) {
        console.log('Allowed values:', enumValues.rows.map(r => r.enumlabel).join(', '));
        const hasConsumer = enumValues.rows.some(r => r.enumlabel.toLowerCase() === 'consumer');
        const hasVendor = enumValues.rows.some(r => r.enumlabel.toLowerCase() === 'vendor');
        
        if (!hasConsumer || !hasVendor) {
          console.log('❌ Missing required values: CONSUMER or VENDOR');
        } else {
          console.log('✅ Required values present');
        }
      } else {
        console.log('⚠️  user_type is not an enum, it\'s a VARCHAR with CHECK constraint');
      }
    } catch (err) {
      console.log('ℹ️  user_type is VARCHAR with CHECK constraint (not enum)');
    }
    
    // 4. Check field name mappings
    console.log('\n4️⃣  FIELD NAME MAPPINGS (Backend vs Mobile)');
    console.log('-'.repeat(60));
    const mappings = [
      { db: 'first_name', mobile: 'firstName', present: userCols.includes('first_name') },
      { db: 'last_name', mobile: 'lastName', present: userCols.includes('last_name') },
      { db: 'user_type', mobile: 'userType', present: userCols.includes('user_type') },
      { db: 'is_verified', mobile: 'isVerified', present: userCols.includes('is_verified') },
      { db: 'is_active', mobile: 'isActive', present: userCols.includes('is_active') },
    ];
    
    mappings.forEach(m => {
      const status = m.present ? '✅' : '❌';
      console.log(`${status} ${m.db.padEnd(20)} → ${m.mobile}`);
    });
    
    // 5. Test data insertion
    console.log('\n5️⃣  TEST DATA INSERTION (DRY RUN)');
    console.log('-'.repeat(60));
    
    const testQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('email', 'first_name', 'last_name', 'user_type', 'is_verified', 'email_verified_at', 'is_active', 'password_hash')
      ORDER BY ordinal_position;
    `;
    
    const testCols = await client.query(testQuery);
    console.log('Columns that will be inserted:');
    testCols.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // 6. Check JWT secret
    console.log('\n6️⃣  ENVIRONMENT VARIABLES');
    console.log('-'.repeat(60));
    const envVars = ['JWT_SECRET', 'JWT_EXPIRES_IN', 'API_BASE_URL', 'FRONTEND_URL'];
    envVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' : value}`);
      } else {
        console.log(`❌ ${varName}: NOT SET`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPREHENSIVE CHECK COMPLETE\n');
    
  } catch (error) {
    console.error('❌ Error during check:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCompleteFlow();
