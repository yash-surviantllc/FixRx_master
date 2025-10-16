/**
 * Mobile Environment Setup Script
 * Run this to create your .env file with auto-detected local IP
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Setting up Mobile .env file...\n');

// Auto-detect local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    
    return 'localhost';
}

const localIP = getLocalIPAddress();

// Environment configuration
const envConfig = `# FixRx Mobile Environment Configuration
# Auto-generated on ${new Date().toISOString()}

# =============================================================================
# API CONFIGURATION
# =============================================================================
# Your local IP: ${localIP}
# For physical device testing, use your computer's local IP
# For Android emulator, use 10.0.2.2
# For iOS simulator, use localhost
EXPO_PUBLIC_API_BASE_URL=http://${localIP}:3000/api/v1

# =============================================================================
# WEBSOCKET CONFIGURATION (for real-time chat)
# =============================================================================
EXPO_PUBLIC_WS_URL=http://${localIP}:3000

# =============================================================================
# DEEP LINKING CONFIGURATION
# =============================================================================
EXPO_PUBLIC_APP_SCHEME=fixrx
EXPO_PUBLIC_APP_DOMAIN=fixrx.com

# =============================================================================
# APP CONFIGURATION
# =============================================================================
EXPO_PUBLIC_APP_NAME=FixRx

# =============================================================================
# GOOGLE OAUTH (Optional - configure if needed)
# =============================================================================
# EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_expo_client_id
# EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
# EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
# EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
`;

const envPath = path.join(__dirname, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    console.log('Creating backup as .env.backup...');
    fs.copyFileSync(envPath, path.join(__dirname, '.env.backup'));
}

// Write .env file
fs.writeFileSync(envPath, envConfig);

console.log('✅ .env file created successfully!\n');
console.log('📋 Configuration Summary:');
console.log(`   - Local IP detected: ${localIP}`);
console.log(`   - API URL: http://${localIP}:3000/api/v1`);
console.log(`   - WebSocket URL: http://${localIP}:3000`);
console.log('   - App Scheme: fixrx://');
console.log('   - Deep linking: Configured\n');

console.log('📝 Next Steps:');
console.log('   1. Ensure Backend is running on port 3000');
console.log('   2. Connect phone to same WiFi network as computer');
console.log('   3. Run: npm start');
console.log('   4. Scan QR code with Expo Go app\n');

if (localIP === 'localhost') {
    console.log('⚠️  WARNING: Could not detect local IP address!');
    console.log('   If testing on physical device:');
    console.log('   1. Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)');
    console.log('   2. Edit FixRxMobile/.env');
    console.log('   3. Replace "localhost" with your actual IP\n');
}

console.log('💡 Tips:');
console.log('   - For Android Emulator: Change IP to 10.0.2.2');
console.log('   - For iOS Simulator: Keep as localhost');
console.log('   - For Physical Device: Use detected IP (' + localIP + ')\n');
