/**
 * Magic Link Authentication Test Script
 * Tests the complete magic link flow for FixRx
 */

const axios = require('axios');
const { Pool } = require('pg');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_EMAIL = 'test@fixrx.com';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fixrx_production',
  user: process.env.DB_USER || 'fixrx_user',
  password: process.env.DB_PASSWORD || 'fixrx123',
};

const pool = new Pool(dbConfig);

class MagicLinkTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Magic Link Authentication Tests...\n');

    try {
      // Setup database
      await this.setupDatabase();

      // Test 1: Send magic link for registration
      await this.testSendMagicLinkRegistration();

      // Test 2: Send magic link for login (should fail - user doesn't exist)
      await this.testSendMagicLinkLoginFail();

      // Test 3: Verify magic link and create user
      const token = await this.getLatestMagicLinkToken();
      if (token) {
        await this.testVerifyMagicLink(token);
      }

      // Test 4: Send magic link for login (should succeed now)
      await this.testSendMagicLinkLoginSuccess();

      // Test 5: Verify login magic link
      const loginToken = await this.getLatestMagicLinkToken();
      if (loginToken && loginToken !== token) {
        await this.testVerifyLoginMagicLink(loginToken);
      }

      // Test 6: Rate limiting test
      await this.testRateLimiting();

      // Test 7: Invalid token test
      await this.testInvalidToken();

      // Test 8: Expired token test
      await this.testExpiredToken();

      // Test 9: Health check
      await this.testHealthCheck();

      // Print results
      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await pool.end();
    }
  }

  async setupDatabase() {
    try {
      console.log('📋 Setting up test database...');
      
      // Create magic_links table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS magic_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          purpose VARCHAR(50) NOT NULL DEFAULT 'LOGIN',
          is_used BOOLEAN DEFAULT FALSE,
          ip_address INET,
          user_agent TEXT,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Clean up any existing test data
      await pool.query('DELETE FROM magic_links WHERE email = $1', [TEST_EMAIL]);
      await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);

      console.log('✅ Database setup complete\n');
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  async testSendMagicLinkRegistration() {
    try {
      console.log('🔗 Test 1: Send magic link for registration...');
      
      const response = await axios.post(`${API_BASE_URL}/auth/magic-link/send`, {
        email: TEST_EMAIL,
        purpose: 'REGISTRATION'
      });

      if (response.data.success) {
        this.addResult('✅ Send magic link (registration)', 'PASS', response.data.message);
      } else {
        this.addResult('❌ Send magic link (registration)', 'FAIL', response.data.message);
      }

    } catch (error) {
      this.addResult('❌ Send magic link (registration)', 'ERROR', error.response?.data?.message || error.message);
    }
  }

  async testSendMagicLinkLoginFail() {
    try {
      console.log('🔗 Test 2: Send magic link for login (should fail)...');
      
      const response = await axios.post(`${API_BASE_URL}/auth/magic-link/send`, {
        email: TEST_EMAIL,
        purpose: 'LOGIN'
      });

      // This should fail because user doesn't exist yet
      this.addResult('❌ Send magic link (login - no user)', 'UNEXPECTED_PASS', 'Should have failed');

    } catch (error) {
      if (error.response?.status === 400) {
        this.addResult('✅ Send magic link (login - no user)', 'PASS', 'Correctly rejected login for non-existent user');
      } else {
        this.addResult('❌ Send magic link (login - no user)', 'ERROR', error.response?.data?.message || error.message);
      }
    }
  }

  async testVerifyMagicLink(token) {
    try {
      console.log('🔐 Test 3: Verify magic link and create user...');
      
      const response = await axios.post(`${API_BASE_URL}/auth/magic-link/verify`, {
        token: token,
        email: TEST_EMAIL
      });

      if (response.data.success && response.data.data.isNewUser) {
        this.addResult('✅ Verify magic link (registration)', 'PASS', 'User created and authenticated');
      } else {
        this.addResult('❌ Verify magic link (registration)', 'FAIL', response.data.message);
      }

    } catch (error) {
      this.addResult('❌ Verify magic link (registration)', 'ERROR', error.response?.data?.message || error.message);
    }
  }

  async testSendMagicLinkLoginSuccess() {
    try {
      console.log('🔗 Test 4: Send magic link for login (should succeed)...');
      
      const response = await axios.post(`${API_BASE_URL}/auth/magic-link/send`, {
        email: TEST_EMAIL,
        purpose: 'LOGIN'
      });

      if (response.data.success) {
        this.addResult('✅ Send magic link (login - existing user)', 'PASS', response.data.message);
      } else {
        this.addResult('❌ Send magic link (login - existing user)', 'FAIL', response.data.message);
      }

    } catch (error) {
      this.addResult('❌ Send magic link (login - existing user)', 'ERROR', error.response?.data?.message || error.message);
    }
  }

  async testVerifyLoginMagicLink(token) {
    try {
      console.log('🔐 Test 5: Verify login magic link...');
      
      const response = await axios.post(`${API_BASE_URL}/auth/magic-link/verify`, {
        token: token,
        email: TEST_EMAIL
      });

      if (response.data.success && !response.data.data.isNewUser) {
        this.addResult('✅ Verify magic link (login)', 'PASS', 'User authenticated successfully');
      } else {
        this.addResult('❌ Verify magic link (login)', 'FAIL', response.data.message);
      }

    } catch (error) {
      this.addResult('❌ Verify magic link (login)', 'ERROR', error.response?.data?.message || error.message);
    }
  }

  async testRateLimiting() {
    try {
      console.log('⏱️ Test 6: Rate limiting...');
      
      // Send multiple requests quickly
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          axios.post(`${API_BASE_URL}/auth/magic-link/send`, {
            email: `ratetest${i}@fixrx.com`,
            purpose: 'REGISTRATION'
          }).catch(err => err.response)
        );
      }

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(res => res?.status === 429);

      if (rateLimited) {
        this.addResult('✅ Rate limiting', 'PASS', 'Rate limiting is working');
      } else {
        this.addResult('⚠️ Rate limiting', 'WARNING', 'Rate limiting may not be working properly');
      }

    } catch (error) {
      this.addResult('❌ Rate limiting', 'ERROR', error.message);
    }
  }

  async testInvalidToken() {
    try {
      console.log('🚫 Test 7: Invalid token...');
      
      const response = await axios.post(`${API_BASE_URL}/auth/magic-link/verify`, {
        token: 'invalid-token-12345',
        email: TEST_EMAIL
      });

      this.addResult('❌ Invalid token', 'UNEXPECTED_PASS', 'Should have failed with invalid token');

    } catch (error) {
      if (error.response?.status === 400) {
        this.addResult('✅ Invalid token', 'PASS', 'Correctly rejected invalid token');
      } else {
        this.addResult('❌ Invalid token', 'ERROR', error.response?.data?.message || error.message);
      }
    }
  }

  async testExpiredToken() {
    try {
      console.log('⏰ Test 8: Expired token...');
      
      // Create an expired token in the database
      const expiredToken = 'expired-token-' + Date.now();
      await pool.query(`
        INSERT INTO magic_links (email, token, purpose, expires_at)
        VALUES ($1, $2, 'LOGIN', $3)
      `, [TEST_EMAIL, expiredToken, new Date(Date.now() - 60000)]); // 1 minute ago

      const response = await axios.post(`${API_BASE_URL}/auth/magic-link/verify`, {
        token: expiredToken,
        email: TEST_EMAIL
      });

      this.addResult('❌ Expired token', 'UNEXPECTED_PASS', 'Should have failed with expired token');

    } catch (error) {
      if (error.response?.status === 400) {
        this.addResult('✅ Expired token', 'PASS', 'Correctly rejected expired token');
      } else {
        this.addResult('❌ Expired token', 'ERROR', error.response?.data?.message || error.message);
      }
    }
  }

  async testHealthCheck() {
    try {
      console.log('🏥 Test 9: Health check...');
      
      const response = await axios.get(`${API_BASE_URL}/auth/magic-link/health`);

      if (response.data.success) {
        this.addResult('✅ Health check', 'PASS', 'Magic link service is healthy');
      } else {
        this.addResult('❌ Health check', 'FAIL', 'Magic link service is unhealthy');
      }

    } catch (error) {
      this.addResult('❌ Health check', 'ERROR', error.response?.data?.message || error.message);
    }
  }

  async getLatestMagicLinkToken() {
    try {
      const result = await pool.query(`
        SELECT token FROM magic_links 
        WHERE email = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [TEST_EMAIL]);

      return result.rows[0]?.token || null;
    } catch (error) {
      console.error('Error getting magic link token:', error);
      return null;
    }
  }

  addResult(test, status, message) {
    this.testResults.push({ test, status, message });
    console.log(`${status === 'PASS' ? '✅' : status === 'WARNING' ? '⚠️' : '❌'} ${test}: ${message}\n`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const warnings = this.testResults.filter(r => r.status === 'WARNING').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🚨 Errors: ${errors}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(`📋 Total: ${this.testResults.length}`);

    if (failed > 0 || errors > 0) {
      console.log('\n❌ Failed/Error Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL' || r.status === 'ERROR')
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log(passed === this.testResults.length ? '🎉 All tests passed!' : '⚠️ Some tests failed');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MagicLinkTester();
  tester.runAllTests().catch(console.error);
}

module.exports = MagicLinkTester;
