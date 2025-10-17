require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { dbManager } = require('../../src/config/database');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node testMagicLinkVerify.js <email>');
    process.exit(1);
  }

  try {
    await dbManager.initialize();

    const { rows } = await dbManager.query(
      `SELECT token, email, expires_at, is_used, created_at
       FROM magic_links
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      console.error('No magic link found for', email);
      process.exit(1);
    }

    const link = rows[0];
    console.log('Latest magic link:', link);

    const response = await fetch('http://192.168.1.5:3000/api/v1/auth/magic-link/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: link.token, email: link.email })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error testing magic link verification:', error);
  } finally {
    process.exit(0);
  }
}

main();
