/**
 * Complete Setup Script for FixRx Contact Management System
 * Verifies all components are working correctly
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

class SetupVerifier {
  static async verifyComplete() {
    console.log('🔍 Verifying FixRx Contact Management Setup...\n');

    const checks = [
      { name: 'Database Connection', fn: this.checkDatabase },
      { name: 'Database Tables', fn: this.checkTables },
      { name: 'Environment Variables', fn: this.checkEnvironment },
      { name: 'Required Files', fn: this.checkFiles },
      { name: 'API Routes', fn: this.checkRoutes },
      { name: 'Frontend Service', fn: this.checkFrontendService }
    ];

    let passed = 0;
    let failed = 0;

    for (const check of checks) {
      try {
        console.log(`🔄 Checking: ${check.name}`);
        await check.fn.call(this);
        console.log(`✅ ${check.name}: PASSED\n`);
        passed++;
      } catch (error) {
        console.log(`❌ ${check.name}: FAILED`);
        console.log(`   Error: ${error.message}\n`);
        failed++;
      }
    }

    console.log('📊 Setup Verification Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 Setup Complete! Your Contact Management System is ready.');
      console.log('\n📋 Next Steps:');
      console.log('1. Update Twilio credentials in .env file');
      console.log('2. Start backend: npm run dev');
      console.log('3. Start frontend: npx expo start');
      console.log('4. Test API endpoints using the test suite');
    } else {
      console.log('\n⚠️ Setup incomplete. Please resolve the failed checks above.');
    }
  }

  static async checkDatabase() {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      console.log('   ✓ Database connection successful');
    } finally {
      await client.end();
    }
  }

  static async checkTables() {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      
      const expectedTables = [
        'contacts',
        'contact_import_batches',
        'sms_messages',
        'sms_bulk_batches',
        'invitations',
        'invitation_bulk_batches',
        'invitation_logs',
        'sms_templates',
        'contact_sync_sessions'
      ];

      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = ANY($1)
      `, [expectedTables]);

      const existingTables = result.rows.map(row => row.table_name);
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));

      if (missingTables.length > 0) {
        throw new Error(`Missing tables: ${missingTables.join(', ')}`);
      }

      console.log(`   ✓ All ${expectedTables.length} tables exist`);
    } finally {
      await client.end();
    }
  }

  static async checkEnvironment() {
    const requiredVars = [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'JWT_SECRET',
      'SENDGRID_API_KEY',
      'SENDGRID_FROM_EMAIL',
      'FRONTEND_URL'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Check Twilio vars (optional but recommended)
    const twilioVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    const missingTwilio = twilioVars.filter(varName => !process.env[varName] || process.env[varName].includes('your_'));
    
    if (missingTwilio.length > 0) {
      console.log(`   ⚠️ Twilio not configured: ${missingTwilio.join(', ')}`);
    }

    console.log(`   ✓ Required environment variables present`);
  }

  static async checkFiles() {
    const requiredFiles = [
      'src/models/contactModel.js',
      'src/services/contactService.js',
      'src/controllers/contactController.js',
      'src/services/invitationService.js',
      'src/controllers/invitationController.js',
      'src/services/twilioService.js',
      'src/routes/contactRoutes.js',
      'src/routes/invitationRoutes.js',
      'src/database/migrations/002_contact_management_tables.sql',
      'docs/CONTACT_MANAGEMENT_API.md'
    ];

    const missingFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      throw new Error(`Missing files: ${missingFiles.join(', ')}`);
    }

    console.log(`   ✓ All ${requiredFiles.length} required files exist`);
  }

  static async checkRoutes() {
    const appPath = path.join(__dirname, 'src/app.js');
    
    if (!fs.existsSync(appPath)) {
      throw new Error('app.js not found');
    }

    const appContent = fs.readFileSync(appPath, 'utf8');
    
    const requiredRoutes = [
      'setupContactRoutes',
      'setupInvitationRoutes',
      'contactRoutes',
      'invitationRoutes'
    ];

    const missingRoutes = requiredRoutes.filter(route => !appContent.includes(route));
    
    if (missingRoutes.length > 0) {
      throw new Error(`Missing route setup: ${missingRoutes.join(', ')}`);
    }

    console.log('   ✓ Contact and invitation routes configured');
  }

  static async checkFrontendService() {
    const frontendServicePath = path.join(__dirname, '../FixRxMobile/src/services/contactService.ts');
    
    if (!fs.existsSync(frontendServicePath)) {
      throw new Error('Frontend contactService.ts not found');
    }

    const serviceContent = fs.readFileSync(frontendServicePath, 'utf8');
    
    const requiredMethods = [
      'getContacts',
      'createContact',
      'updateContact',
      'deleteContact',
      'bulkCreateContacts',
      'syncDeviceContacts'
    ];

    const missingMethods = requiredMethods.filter(method => !serviceContent.includes(method));
    
    if (missingMethods.length > 0) {
      throw new Error(`Missing frontend methods: ${missingMethods.join(', ')}`);
    }

    console.log('   ✓ Frontend contact service ready');
  }
}

// Run verification if called directly
if (require.main === module) {
  SetupVerifier.verifyComplete().catch(console.error);
}

module.exports = SetupVerifier;
