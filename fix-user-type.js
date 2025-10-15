/**
 * Fix User Type Script
 * Updates the user type for phone number 6391091202 from consumer to vendor
 */

const { Client } = require('pg');
require('dotenv').config({ path: './Backend/.env' });

async function fixUserType() {
  console.log('🔧 Fixing user type for phone number 6391091202...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // First, check the current user
    const currentUser = await client.query(
      `SELECT id, phone, user_type, first_name, last_name, email 
       FROM users 
       WHERE phone LIKE '%6391091202%'`
    );

    if (currentUser.rows.length === 0) {
      console.log('❌ No user found with phone number 6391091202');
      return;
    }

    const user = currentUser.rows[0];
    console.log('📋 Current user details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Type: ${user.user_type}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Email: ${user.email}`);

    if (user.user_type === 'vendor') {
      console.log('✅ User is already a vendor. No changes needed.');
      return;
    }

    // Update user type to vendor
    const updateResult = await client.query(
      `UPDATE users 
       SET user_type = 'vendor', 
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [user.id]
    );

    if (updateResult.rows.length > 0) {
      const updatedUser = updateResult.rows[0];
      console.log('\n🎉 User type updated successfully!');
      console.log('📋 Updated user details:');
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Phone: ${updatedUser.phone}`);
      console.log(`   Type: ${updatedUser.user_type}`);
      console.log(`   Name: ${updatedUser.first_name} ${updatedUser.last_name}`);
      console.log(`   Updated: ${updatedUser.updated_at}`);
    }

    console.log('\n✅ User type fix completed!');
    console.log('📱 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Try logging in with +916391091202 again');
    console.log('   3. You should now be redirected to vendor profile');
    console.log('   4. Chat functionality will work correctly with vendor role');

  } catch (error) {
    console.error('❌ Error fixing user type:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure DATABASE_URL is correct in Backend/.env');
    console.log('   2. Ensure PostgreSQL is running');
    console.log('   3. Check database connection permissions');
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
fixUserType();
