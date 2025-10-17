/**
 * Generate Secure JWT Secrets
 * Run this to generate new secure secrets for your .env file
 */

const crypto = require('crypto');

console.log('='.repeat(60));
console.log('SECURE JWT SECRETS GENERATOR');
console.log('='.repeat(60));
console.log('');
console.log('Copy these values to your .env file:');
console.log('');
console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('base64'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(32).toString('base64'));
console.log('');
console.log('='.repeat(60));
console.log('⚠️  IMPORTANT: Keep these secrets secure!');
console.log('   - Never commit them to git');
console.log('   - Use different secrets for production');
console.log('   - Rotate secrets periodically');
console.log('='.repeat(60));
