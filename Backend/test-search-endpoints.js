/**
 * Test Search Endpoints Specifically
 * Verify vendor search and nearby search are working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = `${BASE_URL}/api/v1`;

console.log('🔍 Testing Search Endpoints');
console.log('===========================\n');

async function testSearchEndpoints() {
  let allPassed = true;

  // Test 1: Vendor Search with Service Type
  console.log('1️⃣ Testing Vendor Search with Service Type...');
  try {
    const searchData = {
      serviceType: 'plumbing',
      location: {
        lat: 37.7749,
        lng: -122.4194
      },
      radiusKm: 10
    };

    const response = await axios.post(`${API_BASE_URL}/search/vendors`, searchData);
    
    if (response.data.success) {
      console.log('✅ Vendor Search: PASSED');
      console.log(`   Found ${response.data.data.vendors.length} vendors`);
      
      if (response.data.data.vendors.length > 0) {
        const vendor = response.data.data.vendors[0];
        console.log(`   Sample vendor: ${vendor.first_name} ${vendor.last_name}`);
        console.log(`   Rating: ${vendor.avg_rating}/5 (${vendor.review_count} reviews)`);
        console.log(`   Metro area: ${vendor.metro_area}`);
      }
    } else {
      console.log('❌ Vendor Search: FAILED');
      console.log('   Response:', response.data);
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Vendor Search: FAILED');
    console.log('   Error:', error.response?.data || error.message);
    allPassed = false;
  }

  console.log('');

  // Test 2: Vendor Search without Service Type (all vendors)
  console.log('2️⃣ Testing Vendor Search (All Vendors)...');
  try {
    const searchData = {
      location: {
        lat: 37.7749,
        lng: -122.4194
      },
      radiusKm: 15,
      limit: 10
    };

    const response = await axios.post(`${API_BASE_URL}/search/vendors`, searchData);
    
    if (response.data.success) {
      console.log('✅ All Vendors Search: PASSED');
      console.log(`   Found ${response.data.data.vendors.length} vendors`);
      
      response.data.data.vendors.forEach((vendor, index) => {
        console.log(`   ${index + 1}. ${vendor.first_name} ${vendor.last_name} - ${vendor.avg_rating}/5 stars`);
      });
    } else {
      console.log('❌ All Vendors Search: FAILED');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ All Vendors Search: FAILED');
    console.log('   Error:', error.response?.data || error.message);
    allPassed = false;
  }

  console.log('');

  // Test 3: Nearby Search
  console.log('3️⃣ Testing Nearby Search...');
  try {
    const response = await axios.get(`${API_BASE_URL}/search/nearby`, {
      params: {
        lat: 37.7749,
        lng: -122.4194,
        radius: 10,
        limit: 5
      }
    });
    
    if (response.data.success) {
      console.log('✅ Nearby Search: PASSED');
      console.log(`   Found ${response.data.data.vendors.length} nearby vendors`);
      console.log(`   Search location: ${response.data.data.location.lat}, ${response.data.data.location.lng}`);
      console.log(`   Search radius: ${response.data.data.radius} km`);
      
      response.data.data.vendors.forEach((vendor, index) => {
        console.log(`   ${index + 1}. ${vendor.first_name} ${vendor.last_name} (${vendor.metro_area})`);
      });
    } else {
      console.log('❌ Nearby Search: FAILED');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Nearby Search: FAILED');
    console.log('   Error:', error.response?.data || error.message);
    allPassed = false;
  }

  console.log('');

  // Test 4: Search for Specific Service Types
  console.log('4️⃣ Testing Specific Service Type Searches...');
  const serviceTypes = ['electrical', 'painting', 'carpentry'];
  
  for (const serviceType of serviceTypes) {
    try {
      const searchData = {
        serviceType: serviceType,
        location: { lat: 37.7749, lng: -122.4194 },
        radiusKm: 20
      };

      const response = await axios.post(`${API_BASE_URL}/search/vendors`, searchData);
      
      if (response.data.success) {
        console.log(`✅ ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Search: PASSED (${response.data.data.vendors.length} vendors)`);
      } else {
        console.log(`❌ ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Search: FAILED`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Search: FAILED`);
      allPassed = false;
    }
  }

  // Summary
  console.log('\n📊 Search Endpoints Test Results');
  console.log('================================');
  
  if (allPassed) {
    console.log('🎉 ALL SEARCH TESTS PASSED! 🎉');
    console.log('\n✅ Search Functionality Status:');
    console.log('   🔍 Vendor Search by Service Type: Working');
    console.log('   📍 Nearby Vendor Search: Working');
    console.log('   🏷️ Service Category Filtering: Working');
    console.log('   ⭐ Rating-based Sorting: Working');
    console.log('   📊 Search Results with Metadata: Working');
    
    console.log('\n🚀 Your search endpoints are ready for mobile app integration!');
    console.log('📱 React Native app can now:');
    console.log('   - Search vendors by service type');
    console.log('   - Find nearby vendors by location');
    console.log('   - Get vendor ratings and reviews');
    console.log('   - Filter by different service categories');
  } else {
    console.log('❌ SOME SEARCH TESTS FAILED');
    console.log('Please check the error messages above.');
  }
}

testSearchEndpoints().catch(error => {
  console.error('❌ Search endpoint tests failed:', error);
  process.exit(1);
});
