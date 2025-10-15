/**
 * Environment Setup Helper for FixRx Mobile
 * Helps configure .env file with correct local IP address
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

function createEnvFile() {
  const localIP = getLocalIPAddress();
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  console.log('🔧 FixRx Mobile Environment Setup\n');
  console.log(`📍 Detected local IP address: ${localIP}\n`);
  
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    console.log('   Please update it manually or delete it to regenerate.\n');
    console.log(`   Your local IP address is: ${localIP}`);
    console.log(`   Update EXPO_PUBLIC_API_BASE_URL to: http://${localIP}:3000/api/v1\n`);
    return;
  }
  
  // Read .env.example
  if (!fs.existsSync(envExamplePath)) {
    console.log('❌ .env.example file not found!');
    console.log('   Please ensure .env.example exists in the project root.\n');
    return;
  }
  
  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // Replace localhost with actual IP
  envContent = envContent.replace(
    'EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1',
    `EXPO_PUBLIC_API_BASE_URL=http://${localIP}:3000/api/v1`
  );
  
  // Write .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env file created successfully!\n');
  console.log('📝 Configuration:');
  console.log(`   API Base URL: http://${localIP}:3000/api/v1`);
  console.log(`   App Scheme: fixrx`);
  console.log(`   App Domain: fixrx.com\n`);
  
  console.log('📱 Next Steps:');
  console.log('   1. Ensure backend server is running on port 3000');
  console.log('   2. Ensure your mobile device is on the same network');
  console.log('   3. Run: npm start');
  console.log('   4. Scan QR code with Expo Go app\n');
  
  console.log('🔗 Deep Linking:');
  console.log('   - Magic links will use: fixrx://magic-link');
  console.log('   - Ensure backend .env has: FRONTEND_URL=fixrx://\n');
}

// Run the setup
try {
  createEnvFile();
} catch (error) {
  console.error('❌ Error during setup:', error.message);
  process.exit(1);
}
