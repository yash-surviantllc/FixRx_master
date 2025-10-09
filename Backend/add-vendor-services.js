/**
 * Add Vendor Services to Database
 * Links vendors to their services for search functionality
 */

const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fixrx_production',
  user: process.env.DB_USER || 'fixrx_user',
  password: process.env.DB_PASSWORD || 'fixrx123',
};

async function addVendorServices() {
  console.log('🔧 Adding Vendor Services...');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // First, let's add some services to the services table
    console.log('📋 Adding services to categories...');
    
    // Get category IDs
    const categoriesResult = await client.query('SELECT id, name FROM service_categories ORDER BY name');
    const categories = {};
    categoriesResult.rows.forEach(cat => {
      categories[cat.name.toLowerCase()] = cat.id;
    });
    
    // Add services for each category
    const servicesToAdd = [
      // Plumbing services
      { category: 'plumbing', name: 'Leak Repair', description: 'Fix leaking pipes, faucets, and fixtures' },
      { category: 'plumbing', name: 'Drain Cleaning', description: 'Clear clogged drains and pipes' },
      { category: 'plumbing', name: 'Toilet Repair', description: 'Fix toilet issues and installations' },
      
      // Electrical services
      { category: 'electrical', name: 'Outlet Installation', description: 'Install new electrical outlets' },
      { category: 'electrical', name: 'Light Fixture Installation', description: 'Install ceiling fans and light fixtures' },
      { category: 'electrical', name: 'Electrical Repair', description: 'Fix electrical issues and wiring' },
      
      // HVAC services
      { category: 'hvac', name: 'AC Repair', description: 'Air conditioning repair and maintenance' },
      { category: 'hvac', name: 'Heating Repair', description: 'Furnace and heating system repair' },
      
      // Carpentry services
      { category: 'carpentry', name: 'Cabinet Installation', description: 'Install kitchen and bathroom cabinets' },
      { category: 'carpentry', name: 'Deck Building', description: 'Build outdoor decks and patios' },
      
      // Painting services
      { category: 'painting', name: 'Interior Painting', description: 'Paint interior walls and rooms' },
      { category: 'painting', name: 'Exterior Painting', description: 'Paint house exterior and trim' },
      
      // Cleaning services
      { category: 'cleaning', name: 'House Cleaning', description: 'Regular house cleaning service' },
      { category: 'cleaning', name: 'Deep Cleaning', description: 'Thorough deep cleaning service' },
      
      // Handyman services
      { category: 'handyman', name: 'General Repairs', description: 'Various household repairs' },
      { category: 'handyman', name: 'Furniture Assembly', description: 'Assemble furniture and fixtures' }
    ];
    
    for (const service of servicesToAdd) {
      const categoryId = categories[service.category];
      if (categoryId) {
        await client.query(`
          INSERT INTO services (category_id, name, description)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [categoryId, service.name, service.description]);
      }
    }
    
    console.log(`✅ Added ${servicesToAdd.length} services`);
    
    // Now get all users and services
    const usersResult = await client.query("SELECT id, first_name, last_name, email FROM users WHERE user_type = 'VENDOR'");
    const servicesResult = await client.query(`
      SELECT s.id, s.name, sc.name as category_name 
      FROM services s 
      JOIN service_categories sc ON s.category_id = sc.id
    `);
    
    console.log('👥 Linking vendors to services...');
    
    // Link vendors to services based on their specialties
    const vendorServiceMappings = [
      {
        email: 'bob.plumber@example.com',
        services: ['Leak Repair', 'Drain Cleaning', 'Toilet Repair'],
        priceMin: 75,
        priceMax: 150
      },
      {
        email: 'alice.electrician@example.com',
        services: ['Outlet Installation', 'Light Fixture Installation', 'Electrical Repair'],
        priceMin: 80,
        priceMax: 200
      },
      {
        email: 'carlos.painter@example.com',
        services: ['Interior Painting', 'Exterior Painting'],
        priceMin: 40,
        priceMax: 80
      }
    ];
    
    for (const mapping of vendorServiceMappings) {
      const vendor = usersResult.rows.find(u => u.email === mapping.email);
      if (vendor) {
        for (const serviceName of mapping.services) {
          const service = servicesResult.rows.find(s => s.name === serviceName);
          if (service) {
            await client.query(`
              INSERT INTO vendor_services (vendor_id, service_id, price_range_min, price_range_max, description)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (vendor_id, service_id) DO NOTHING
            `, [
              vendor.id, 
              service.id, 
              mapping.priceMin, 
              mapping.priceMax,
              `Professional ${serviceName.toLowerCase()} service by ${vendor.first_name} ${vendor.last_name}`
            ]);
            
            console.log(`✅ Linked ${vendor.first_name} ${vendor.last_name} to ${serviceName}`);
          }
        }
      }
    }
    
    // Add some sample ratings
    console.log('⭐ Adding sample ratings...');
    
    const vendors = usersResult.rows;
    const consumers = await client.query("SELECT id FROM users WHERE user_type = 'CONSUMER'");
    
    if (consumers.rows.length > 0 && vendors.length > 0) {
      const sampleRatings = [
        { vendorEmail: 'bob.plumber@example.com', rating: 5, review: 'Excellent plumbing work! Fixed my leak quickly.' },
        { vendorEmail: 'bob.plumber@example.com', rating: 4, review: 'Good service, arrived on time.' },
        { vendorEmail: 'alice.electrician@example.com', rating: 5, review: 'Professional electrical work, highly recommend!' },
        { vendorEmail: 'alice.electrician@example.com', rating: 5, review: 'Great job installing new outlets.' },
        { vendorEmail: 'carlos.painter@example.com', rating: 4, review: 'Nice paint job, clean work.' }
      ];
      
      for (const rating of sampleRatings) {
        const vendor = vendors.find(v => v.email === rating.vendorEmail);
        const consumer = consumers.rows[0]; // Use first consumer for all ratings
        
        if (vendor && consumer) {
          await client.query(`
            INSERT INTO ratings (rater_id, rated_id, overall_rating, quality_rating, professionalism_rating, review_text)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            consumer.id,
            vendor.id,
            rating.rating,
            rating.rating,
            rating.rating,
            rating.review
          ]);
        }
      }
      
      console.log(`✅ Added ${sampleRatings.length} sample ratings`);
    }
    
    await client.end();
    
    console.log('\n🎉 Vendor services setup complete!');
    console.log('📊 Summary:');
    console.log('   ✅ Services added to categories');
    console.log('   ✅ Vendors linked to their specialties');
    console.log('   ✅ Sample ratings added');
    console.log('   ✅ Search endpoints now have data to return');
    
  } catch (error) {
    console.error('❌ Error adding vendor services:', error.message);
    process.exit(1);
  }
}

addVendorServices();
