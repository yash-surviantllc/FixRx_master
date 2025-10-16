/**
 * Generate Fresh Magic Link for Testing
 * Creates a new magic link and displays it for immediate testing
 * 
 * Usage: node generate-fresh-link.js test@example.com REGISTRATION
 */

const magicLinkService = require('./src/services/magicLinkService');
const { logger } = require('./src/utils/logger');

async function generateFreshLink() {
  try {
    const email = process.argv[2];
    const purpose = process.argv[3] || 'REGISTRATION';

    if (!email) {
      console.error('❌ Error: Email address is required');
      console.log('Usage: node generate-fresh-link.js <email> [PURPOSE]');
      console.log('Example: node generate-fresh-link.js test@example.com REGISTRATION');
      process.exit(1);
    }

    if (!['LOGIN', 'REGISTRATION'].includes(purpose.toUpperCase())) {
      console.error('❌ Error: Purpose must be LOGIN or REGISTRATION');
      process.exit(1);
    }

    console.log('🔗 Generating fresh magic link...');
    console.log(`   Email: ${email}`);
    console.log(`   Purpose: ${purpose.toUpperCase()}`);
    console.log('');

    // Reset user first (if in development)
    if (process.env.NODE_ENV === 'development') {
      try {
        await magicLinkService.autoResetUserForTesting(email.toLowerCase().trim(), purpose.toUpperCase());
        console.log('✅ User reset completed');
      } catch (resetError) {
        console.log('⚠️  Reset failed, continuing anyway...');
      }
    }

    // Generate new magic link
    const result = await magicLinkService.sendMagicLink(
      email.toLowerCase().trim(),
      purpose.toUpperCase(),
      'test-script',
      '127.0.0.1'
    );

    if (result.success) {
      console.log('✅ Magic link generated successfully!');
      console.log('');
      console.log('📧 Check your email for the magic link');
      console.log(`⏰ Link expires in: ${result.expiresIn} seconds (${Math.round(result.expiresIn / 60)} minutes)`);
      console.log('');
      console.log('🔗 For testing, you can also use the deep link format:');
      console.log(`   fixrx://magic-link?token=<TOKEN>&email=${encodeURIComponent(email)}`);
      console.log('');
      console.log('💡 Tip: The token will be in the email or backend logs');
    } else {
      console.error('❌ Failed to generate magic link:', result.message);
      if (result.code) {
        console.error(`   Error code: ${result.code}`);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error generating magic link:', error.message);
    logger.error('Generate fresh link error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Generation cancelled by user');
  process.exit(0);
});

// Run the generator
generateFreshLink()
  .then(() => {
    console.log('🎉 Magic link generation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Generation failed:', error.message);
    process.exit(1);
  });
