/**
 * Contact Management API Test Suite
 * Tests all contact and invitation endpoints
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';
let testContactId = '';
let testInvitationId = '';

// Mock JWT token for testing (replace with actual login)
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJ1c2VyVHlwZSI6ImNvbnN1bWVyIiwiaWF0IjoxNzI4NDQ5NDAwfQ.test-signature';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${MOCK_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

class ContactAPITester {
  static async runAllTests() {
    console.log('🧪 Starting Contact Management API Tests...\n');
    
    const tests = [
      { name: 'Contact CRUD Operations', fn: this.testContactCRUD },
      { name: 'Contact Search & Filtering', fn: this.testContactSearch },
      { name: 'Contact Statistics', fn: this.testContactStats },
      { name: 'Bulk Contact Operations', fn: this.testBulkContacts },
      { name: 'Contact Import/Export', fn: this.testContactImportExport },
      { name: 'Invitation Management', fn: this.testInvitations },
      { name: 'Bulk Invitations', fn: this.testBulkInvitations },
      { name: 'Invitation Analytics', fn: this.testInvitationAnalytics }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        console.log(`🔄 Testing: ${test.name}`);
        await test.fn.call(this);
        console.log(`✅ ${test.name}: PASSED\n`);
        passed++;
      } catch (error) {
        console.log(`❌ ${test.name}: FAILED`);
        console.log(`   Error: ${error.message}\n`);
        failed++;
      }
    }

    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Contact Management API is ready for production.');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the implementation.');
    }
  }

  // Test Contact CRUD Operations
  static async testContactCRUD() {
    // Create Contact
    const createResponse = await apiClient.post('/contacts', {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      email: 'john.doe@test.com',
      company: 'Test Corp',
      jobTitle: 'Manager',
      tags: ['test', 'api'],
      notes: 'Test contact for API validation',
      isFavorite: false
    });

    if (!createResponse.data.success) {
      throw new Error('Failed to create contact');
    }

    testContactId = createResponse.data.data.id;
    console.log('   ✓ Contact created successfully');

    // Read Contact
    const readResponse = await apiClient.get(`/contacts/${testContactId}`);
    if (!readResponse.data.success || readResponse.data.data.first_name !== 'John') {
      throw new Error('Failed to read contact');
    }
    console.log('   ✓ Contact retrieved successfully');

    // Update Contact
    const updateResponse = await apiClient.put(`/contacts/${testContactId}`, {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567890',
      email: 'jane.smith@test.com',
      isFavorite: true
    });

    if (!updateResponse.data.success || updateResponse.data.data.first_name !== 'Jane') {
      throw new Error('Failed to update contact');
    }
    console.log('   ✓ Contact updated successfully');

    // List Contacts
    const listResponse = await apiClient.get('/contacts?limit=10');
    if (!listResponse.data.success || !Array.isArray(listResponse.data.data)) {
      throw new Error('Failed to list contacts');
    }
    console.log('   ✓ Contacts listed successfully');
  }

  // Test Contact Search & Filtering
  static async testContactSearch() {
    // Search by name
    const nameSearch = await apiClient.get('/contacts?search=Jane');
    if (!nameSearch.data.success) {
      throw new Error('Failed to search contacts by name');
    }
    console.log('   ✓ Name search working');

    // Filter by favorites
    const favoriteSearch = await apiClient.get('/contacts?favorites=true');
    if (!favoriteSearch.data.success) {
      throw new Error('Failed to filter by favorites');
    }
    console.log('   ✓ Favorite filtering working');

    // Search by identifier
    const identifierSearch = await apiClient.get('/contacts/search/jane.smith@test.com');
    if (!identifierSearch.data.success) {
      throw new Error('Failed to search by identifier');
    }
    console.log('   ✓ Identifier search working');
  }

  // Test Contact Statistics
  static async testContactStats() {
    const statsResponse = await apiClient.get('/contacts/stats');
    if (!statsResponse.data.success || !statsResponse.data.data.total_contacts) {
      throw new Error('Failed to get contact statistics');
    }
    console.log('   ✓ Contact statistics retrieved');
  }

  // Test Bulk Contact Operations
  static async testBulkContacts() {
    const bulkContacts = [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+1111111111',
        email: 'alice@test.com'
      },
      {
        firstName: 'Bob',
        lastName: 'Wilson',
        phone: '+2222222222',
        email: 'bob@test.com'
      }
    ];

    const bulkResponse = await apiClient.post('/contacts/bulk', {
      contacts: bulkContacts,
      batchName: 'API Test Batch'
    });

    if (!bulkResponse.data.success || bulkResponse.data.data.successful < 1) {
      throw new Error('Failed to create bulk contacts');
    }
    console.log('   ✓ Bulk contact creation working');

    // Test contact sync
    const syncResponse = await apiClient.post('/contacts/sync', {
      deviceContacts: [
        {
          firstName: 'Device',
          lastName: 'Contact',
          phone: '+3333333333',
          email: 'device@test.com'
        }
      ]
    });

    if (!syncResponse.data.success) {
      throw new Error('Failed to sync contacts');
    }
    console.log('   ✓ Contact synchronization working');
  }

  // Test Contact Import/Export
  static async testContactImportExport() {
    // Create test CSV file
    const csvContent = `First Name,Last Name,Phone,Email,Company
Import,Test,+4444444444,import@test.com,Import Corp
Another,Import,+5555555555,another@test.com,Test Inc`;

    const csvPath = path.join(__dirname, 'test-contacts.csv');
    fs.writeFileSync(csvPath, csvContent);

    try {
      // Test export (should work without import first)
      const exportResponse = await apiClient.get('/contacts/export', {
        responseType: 'text'
      });
      
      if (!exportResponse.data || !exportResponse.data.includes('First Name')) {
        throw new Error('Failed to export contacts');
      }
      console.log('   ✓ Contact export working');

      // Get import batches
      const batchesResponse = await apiClient.get('/contacts/import-batches');
      if (!batchesResponse.data.success) {
        throw new Error('Failed to get import batches');
      }
      console.log('   ✓ Import batch tracking working');

    } finally {
      // Clean up test file
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
    }
  }

  // Test Invitation Management
  static async testInvitations() {
    // Create invitation
    const createInvitation = await apiClient.post('/invitations', {
      recipientEmail: 'invite@test.com',
      recipientName: 'Test Invitee',
      message: 'Join our platform for testing!',
      invitationType: 'vendor_invite',
      deliveryMethod: 'email',
      expiresIn: 7
    });

    if (!createInvitation.data.success) {
      throw new Error('Failed to create invitation');
    }

    testInvitationId = createInvitation.data.data.id;
    console.log('   ✓ Invitation created successfully');

    // Get invitations
    const getInvitations = await apiClient.get('/invitations');
    if (!getInvitations.data.success) {
      throw new Error('Failed to get invitations');
    }
    console.log('   ✓ Invitations retrieved successfully');

    // Resend invitation
    const resendResponse = await apiClient.post(`/invitations/${testInvitationId}/resend`, {
      deliveryMethod: 'email',
      newMessage: 'Updated invitation message'
    });

    if (!resendResponse.data.success) {
      throw new Error('Failed to resend invitation');
    }
    console.log('   ✓ Invitation resent successfully');

    // Get invitation history
    const historyResponse = await apiClient.get(`/invitations/${testInvitationId}/history`);
    if (!historyResponse.data.success) {
      throw new Error('Failed to get invitation history');
    }
    console.log('   ✓ Invitation history retrieved');
  }

  // Test Bulk Invitations
  static async testBulkInvitations() {
    const bulkInvitations = [
      {
        recipientEmail: 'bulk1@test.com',
        recipientName: 'Bulk Test 1'
      },
      {
        recipientEmail: 'bulk2@test.com',
        recipientName: 'Bulk Test 2'
      }
    ];

    const bulkResponse = await apiClient.post('/invitations/bulk', {
      invitations: bulkInvitations,
      options: {
        batchName: 'API Test Bulk Invitations',
        deliveryMethod: 'email',
        invitationType: 'vendor_invite',
        message: 'Bulk invitation test message'
      }
    });

    if (!bulkResponse.data.success || bulkResponse.data.data.summary.successful < 1) {
      throw new Error('Failed to create bulk invitations');
    }
    console.log('   ✓ Bulk invitations created successfully');

    // Get bulk batches
    const batchesResponse = await apiClient.get('/invitations/batches');
    if (!batchesResponse.data.success) {
      throw new Error('Failed to get invitation batches');
    }
    console.log('   ✓ Invitation batches retrieved');
  }

  // Test Invitation Analytics
  static async testInvitationAnalytics() {
    const analyticsResponse = await apiClient.get('/invitations/analytics');
    if (!analyticsResponse.data.success || typeof analyticsResponse.data.data.totalInvitations === 'undefined') {
      throw new Error('Failed to get invitation analytics');
    }
    console.log('   ✓ Invitation analytics retrieved');
  }

  // Cleanup test data
  static async cleanup() {
    try {
      if (testContactId) {
        await apiClient.delete(`/contacts/${testContactId}`);
        console.log('✓ Test contact cleaned up');
      }
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  ContactAPITester.runAllTests()
    .then(() => ContactAPITester.cleanup())
    .catch(console.error);
}

module.exports = ContactAPITester;
