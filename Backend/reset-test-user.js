/**
 * Reset Test User Utility for FixRx Backend
 * Allows manual reset of a test user for development/testing
 * 
 * Usage:
 * node reset-test-user.js test@example.com REGISTRATION
 * node reset-test-user.js test@example.com LOGIN
 */

const magicLinkService = require('./src/services/magicLinkService');
const { logger } = require('./src/utils/logger');

async function resetTestUser() {
  try {
    // Get email and purpose from command line arguments
    const email = process.argv[2];
    const purpose = process.argv[3] || 'REGISTRATION';

    if (!email) {
      console.error('❌ Error: Email address is required');
      console.log('Usage: node reset-test-user.js <email> [PURPOSE]');
      console.log('Example: node reset-test-user.js test@example.com REGISTRATION');
      process.exit(1);
    }

    if (!['LOGIN', 'REGISTRATION'].includes(purpose.toUpperCase())) {
      console.error('❌ Error: Purpose must be LOGIN or REGISTRATION');
      process.exit(1);
    }

    // Check if we're in development mode
    if (process.env.NODE_ENV !== 'development') {
      console.error('❌ Error: This utility only works in development mode');
      console.log('Set NODE_ENV=development in your .env file');
      process.exit(1);
    }

    console.log('🔄 Resetting test user...');
    console.log(`   Email: ${email}`);
    console.log(`   Purpose: ${purpose.toUpperCase()}`);
    console.log('');

    // Reset the user
    const result = await magicLinkService.autoResetUserForTesting(
      email.toLowerCase().trim(),
      purpose.toUpperCase()
    );

    if (result.success) {
      console.log('✅ Test user reset successfully!');
      console.log('');
      console.log('You can now:');
      if (purpose.toUpperCase() === 'REGISTRATION') {
        console.log('   - Use this email for registration testing');
        console.log('   - The email will be treated as a new user');
      } else {
        console.log('   - Use this email for login testing');
        console.log('   - A test user has been created if none existed');
      }
      console.log('');
    } else {
      console.error('❌ Failed to reset test user');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error resetting test user:', error.message);
    logger.error('Reset test user error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Reset cancelled by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Reset terminated');
  process.exit(0);
});

// Run the reset
resetTestUser()
  .then(() => {
    console.log('🎉 Reset completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Reset failed:', error.message);
    process.exit(1);
  });
