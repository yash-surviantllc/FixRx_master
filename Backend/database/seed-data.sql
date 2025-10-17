-- FixRx Database Seed Data
-- Initial data for development and testing

-- =============================================================================
-- SERVICE CATEGORIES
-- =============================================================================

INSERT INTO service_categories (id, name, description, sort_order) VALUES
    (uuid_generate_v4(), 'Plumbing', 'Plumbing services including repairs, installations, and maintenance', 1),
    (uuid_generate_v4(), 'Electrical', 'Electrical services including wiring, repairs, and installations', 2),
    (uuid_generate_v4(), 'HVAC', 'Heating, ventilation, and air conditioning services', 3),
    (uuid_generate_v4(), 'Carpentry', 'Carpentry and woodworking services', 4),
    (uuid_generate_v4(), 'Painting', 'Interior and exterior painting services', 5),
    (uuid_generate_v4(), 'Flooring', 'Flooring installation and repair services', 6),
    (uuid_generate_v4(), 'Roofing', 'Roofing installation, repair, and maintenance', 7),
    (uuid_generate_v4(), 'Landscaping', 'Landscaping and garden maintenance services', 8),
    (uuid_generate_v4(), 'Cleaning', 'House cleaning and maintenance services', 9),
    (uuid_generate_v4(), 'Handyman', 'General handyman and repair services', 10);

-- =============================================================================
-- SERVICES
-- =============================================================================

-- Get category IDs for reference
DO $$
DECLARE
    plumbing_id UUID;
    electrical_id UUID;
    hvac_id UUID;
    carpentry_id UUID;
    painting_id UUID;
    flooring_id UUID;
    roofing_id UUID;
    landscaping_id UUID;
    cleaning_id UUID;
    handyman_id UUID;
BEGIN
    SELECT id INTO plumbing_id FROM service_categories WHERE name = 'Plumbing';
    SELECT id INTO electrical_id FROM service_categories WHERE name = 'Electrical';
    SELECT id INTO hvac_id FROM service_categories WHERE name = 'HVAC';
    SELECT id INTO carpentry_id FROM service_categories WHERE name = 'Carpentry';
    SELECT id INTO painting_id FROM service_categories WHERE name = 'Painting';
    SELECT id INTO flooring_id FROM service_categories WHERE name = 'Flooring';
    SELECT id INTO roofing_id FROM service_categories WHERE name = 'Roofing';
    SELECT id INTO landscaping_id FROM service_categories WHERE name = 'Landscaping';
    SELECT id INTO cleaning_id FROM service_categories WHERE name = 'Cleaning';
    SELECT id INTO handyman_id FROM service_categories WHERE name = 'Handyman';

    -- Plumbing services
    INSERT INTO services (category_id, name, description) VALUES
        (plumbing_id, 'Leak Repair', 'Fix leaking pipes, faucets, and fixtures'),
        (plumbing_id, 'Drain Cleaning', 'Clear clogged drains and pipes'),
        (plumbing_id, 'Toilet Repair', 'Repair and replace toilets'),
        (plumbing_id, 'Water Heater Service', 'Install and repair water heaters'),
        (plumbing_id, 'Pipe Installation', 'Install new plumbing pipes');

    -- Electrical services
    INSERT INTO services (category_id, name, description) VALUES
        (electrical_id, 'Outlet Installation', 'Install new electrical outlets'),
        (electrical_id, 'Light Fixture Installation', 'Install ceiling fans and light fixtures'),
        (electrical_id, 'Electrical Panel Upgrade', 'Upgrade electrical panels and breakers'),
        (electrical_id, 'Wiring Repair', 'Repair faulty electrical wiring'),
        (electrical_id, 'Generator Installation', 'Install backup generators');

    -- HVAC services
    INSERT INTO services (category_id, name, description) VALUES
        (hvac_id, 'AC Repair', 'Repair air conditioning units'),
        (hvac_id, 'Heating System Repair', 'Repair heating systems'),
        (hvac_id, 'Duct Cleaning', 'Clean air ducts and vents'),
        (hvac_id, 'HVAC Installation', 'Install new HVAC systems'),
        (hvac_id, 'Thermostat Installation', 'Install smart thermostats');

    -- Carpentry services
    INSERT INTO services (category_id, name, description) VALUES
        (carpentry_id, 'Custom Cabinets', 'Build custom kitchen and bathroom cabinets'),
        (carpentry_id, 'Deck Building', 'Build outdoor decks and patios'),
        (carpentry_id, 'Trim Work', 'Install baseboards, crown molding, and trim'),
        (carpentry_id, 'Door Installation', 'Install interior and exterior doors'),
        (carpentry_id, 'Built-in Shelving', 'Create custom built-in storage solutions');

    -- Painting services
    INSERT INTO services (category_id, name, description) VALUES
        (painting_id, 'Interior Painting', 'Paint interior walls and ceilings'),
        (painting_id, 'Exterior Painting', 'Paint exterior walls and trim'),
        (painting_id, 'Cabinet Painting', 'Paint and refinish kitchen cabinets'),
        (painting_id, 'Pressure Washing', 'Clean exterior surfaces before painting'),
        (painting_id, 'Wallpaper Installation', 'Install and remove wallpaper');

    -- Flooring services
    INSERT INTO services (category_id, name, description) VALUES
        (flooring_id, 'Hardwood Installation', 'Install hardwood flooring'),
        (flooring_id, 'Tile Installation', 'Install ceramic and stone tiles'),
        (flooring_id, 'Carpet Installation', 'Install carpeting'),
        (flooring_id, 'Laminate Installation', 'Install laminate flooring'),
        (flooring_id, 'Floor Refinishing', 'Refinish existing hardwood floors');

    -- Roofing services
    INSERT INTO services (category_id, name, description) VALUES
        (roofing_id, 'Roof Repair', 'Repair damaged roofing'),
        (roofing_id, 'Roof Replacement', 'Complete roof replacement'),
        (roofing_id, 'Gutter Installation', 'Install and repair gutters'),
        (roofing_id, 'Roof Inspection', 'Inspect roof condition'),
        (roofing_id, 'Skylight Installation', 'Install skylights');

    -- Landscaping services
    INSERT INTO services (category_id, name, description) VALUES
        (landscaping_id, 'Lawn Maintenance', 'Regular lawn care and maintenance'),
        (landscaping_id, 'Garden Design', 'Design and install gardens'),
        (landscaping_id, 'Tree Service', 'Tree trimming and removal'),
        (landscaping_id, 'Irrigation Systems', 'Install sprinkler systems'),
        (landscaping_id, 'Hardscaping', 'Install patios, walkways, and retaining walls');

    -- Cleaning services
    INSERT INTO services (category_id, name, description) VALUES
        (cleaning_id, 'House Cleaning', 'Regular house cleaning services'),
        (cleaning_id, 'Deep Cleaning', 'Thorough deep cleaning services'),
        (cleaning_id, 'Move-in/Move-out Cleaning', 'Cleaning for moving situations'),
        (cleaning_id, 'Window Cleaning', 'Interior and exterior window cleaning'),
        (cleaning_id, 'Carpet Cleaning', 'Professional carpet cleaning');

    -- Handyman services
    INSERT INTO services (category_id, name, description) VALUES
        (handyman_id, 'General Repairs', 'Various small repairs around the house'),
        (handyman_id, 'Furniture Assembly', 'Assemble furniture and fixtures'),
        (handyman_id, 'Picture Hanging', 'Hang pictures and artwork'),
        (handyman_id, 'Caulking', 'Caulk windows, doors, and bathrooms'),
        (handyman_id, 'Minor Electrical', 'Small electrical repairs and installations');
END $$;

-- =============================================================================
-- SAMPLE USERS (FOR DEVELOPMENT/TESTING)
-- =============================================================================

-- Sample consumers
INSERT INTO users (id, email, first_name, last_name, user_type, phone, metro_area, is_verified, is_active) VALUES
    (uuid_generate_v4(), 'john.consumer@example.com', 'John', 'Smith', 'CONSUMER', '+1234567890', 'San Francisco Bay Area', true, true),
    (uuid_generate_v4(), 'jane.consumer@example.com', 'Jane', 'Johnson', 'CONSUMER', '+1234567891', 'Los Angeles', true, true),
    (uuid_generate_v4(), 'mike.consumer@example.com', 'Mike', 'Davis', 'CONSUMER', '+1234567892', 'New York', true, true);

-- Sample vendors
INSERT INTO users (id, email, first_name, last_name, user_type, phone, metro_area, is_verified, is_active) VALUES
    (uuid_generate_v4(), 'bob.plumber@example.com', 'Bob', 'Wilson', 'VENDOR', '+1234567893', 'San Francisco Bay Area', true, true),
    (uuid_generate_v4(), 'alice.electrician@example.com', 'Alice', 'Brown', 'VENDOR', '+1234567894', 'San Francisco Bay Area', true, true),
    (uuid_generate_v4(), 'carlos.painter@example.com', 'Carlos', 'Rodriguez', 'VENDOR', '+1234567895', 'Los Angeles', true, true),
    (uuid_generate_v4(), 'sarah.cleaner@example.com', 'Sarah', 'Miller', 'VENDOR', '+1234567896', 'Los Angeles', true, true),
    (uuid_generate_v4(), 'david.handyman@example.com', 'David', 'Garcia', 'VENDOR', '+1234567897', 'New York', true, true);

-- =============================================================================
-- USER PROFILES
-- =============================================================================

-- Create profiles for all users
INSERT INTO user_profiles (user_id, bio, city, state, country)
SELECT 
    id,
    CASE 
        WHEN user_type = 'CONSUMER' THEN 'Looking for reliable contractors for home improvement projects.'
        WHEN user_type = 'VENDOR' THEN 'Professional contractor with years of experience providing quality services.'
    END,
    CASE 
        WHEN metro_area LIKE '%San Francisco%' THEN 'San Francisco'
        WHEN metro_area LIKE '%Los Angeles%' THEN 'Los Angeles'
        WHEN metro_area LIKE '%New York%' THEN 'New York'
        ELSE 'Unknown'
    END,
    CASE 
        WHEN metro_area LIKE '%San Francisco%' THEN 'California'
        WHEN metro_area LIKE '%Los Angeles%' THEN 'California'
        WHEN metro_area LIKE '%New York%' THEN 'New York'
        ELSE 'Unknown'
    END,
    'United States'
FROM users;

-- =============================================================================
-- VENDOR SERVICES (Link vendors to services they provide)
-- =============================================================================

DO $$
DECLARE
    bob_id UUID;
    alice_id UUID;
    carlos_id UUID;
    sarah_id UUID;
    david_id UUID;
    
    plumbing_services UUID[];
    electrical_services UUID[];
    painting_services UUID[];
    cleaning_services UUID[];
    handyman_services UUID[];
BEGIN
    -- Get vendor IDs
    SELECT id INTO bob_id FROM users WHERE email = 'bob.plumber@example.com';
    SELECT id INTO alice_id FROM users WHERE email = 'alice.electrician@example.com';
    SELECT id INTO carlos_id FROM users WHERE email = 'carlos.painter@example.com';
    SELECT id INTO sarah_id FROM users WHERE email = 'sarah.cleaner@example.com';
    SELECT id INTO david_id FROM users WHERE email = 'david.handyman@example.com';

    -- Get service IDs by category
    SELECT array_agg(s.id) INTO plumbing_services 
    FROM services s 
    JOIN service_categories sc ON s.category_id = sc.id 
    WHERE sc.name = 'Plumbing';

    SELECT array_agg(s.id) INTO electrical_services 
    FROM services s 
    JOIN service_categories sc ON s.category_id = sc.id 
    WHERE sc.name = 'Electrical';

    SELECT array_agg(s.id) INTO painting_services 
    FROM services s 
    JOIN service_categories sc ON s.category_id = sc.id 
    WHERE sc.name = 'Painting';

    SELECT array_agg(s.id) INTO cleaning_services 
    FROM services s 
    JOIN service_categories sc ON s.category_id = sc.id 
    WHERE sc.name = 'Cleaning';

    SELECT array_agg(s.id) INTO handyman_services 
    FROM services s 
    JOIN service_categories sc ON s.category_id = sc.id 
    WHERE sc.name = 'Handyman';

    -- Link Bob (plumber) to plumbing services
    INSERT INTO vendor_services (vendor_id, service_id, price_range_min, price_range_max, description)
    SELECT bob_id, service_id, 50, 200, 'Professional plumbing services with 10+ years experience'
    FROM unnest(plumbing_services) AS service_id;

    -- Link Alice (electrician) to electrical services
    INSERT INTO vendor_services (vendor_id, service_id, price_range_min, price_range_max, description)
    SELECT alice_id, service_id, 75, 300, 'Licensed electrician providing safe and reliable electrical work'
    FROM unnest(electrical_services) AS service_id;

    -- Link Carlos (painter) to painting services
    INSERT INTO vendor_services (vendor_id, service_id, price_range_min, price_range_max, description)
    SELECT carlos_id, service_id, 100, 500, 'Professional painting services for residential and commercial properties'
    FROM unnest(painting_services) AS service_id;

    -- Link Sarah (cleaner) to cleaning services
    INSERT INTO vendor_services (vendor_id, service_id, price_range_min, price_range_max, description)
    SELECT sarah_id, service_id, 80, 250, 'Thorough and reliable cleaning services for your home'
    FROM unnest(cleaning_services) AS service_id;

    -- Link David (handyman) to handyman services
    INSERT INTO vendor_services (vendor_id, service_id, price_range_min, price_range_max, description)
    SELECT david_id, service_id, 40, 150, 'Reliable handyman services for all your home repair needs'
    FROM unnest(handyman_services) AS service_id;
END $$;

-- =============================================================================
-- SAMPLE PORTFOLIO ITEMS
-- =============================================================================

DO $$
DECLARE
    bob_id UUID;
    alice_id UUID;
    carlos_id UUID;
    sarah_id UUID;
    david_id UUID;
BEGIN
    -- Get vendor IDs
    SELECT id INTO bob_id FROM users WHERE email = 'bob.plumber@example.com';
    SELECT id INTO alice_id FROM users WHERE email = 'alice.electrician@example.com';
    SELECT id INTO carlos_id FROM users WHERE email = 'carlos.painter@example.com';
    SELECT id INTO sarah_id FROM users WHERE email = 'sarah.cleaner@example.com';
    SELECT id INTO david_id FROM users WHERE email = 'david.handyman@example.com';

    -- Bob's portfolio
    INSERT INTO vendor_portfolio (vendor_id, title, description, project_date, is_featured) VALUES
        (bob_id, 'Kitchen Sink Installation', 'Installed new undermount kitchen sink with garbage disposal', '2024-09-15', true),
        (bob_id, 'Bathroom Renovation Plumbing', 'Complete plumbing work for master bathroom renovation', '2024-08-20', true),
        (bob_id, 'Water Heater Replacement', 'Replaced old water heater with energy-efficient tankless unit', '2024-07-10', false);

    -- Alice's portfolio
    INSERT INTO vendor_portfolio (vendor_id, title, description, project_date, is_featured) VALUES
        (alice_id, 'Whole House Rewiring', 'Complete electrical rewiring for 1950s home', '2024-09-01', true),
        (alice_id, 'Smart Home Installation', 'Installed smart switches, outlets, and lighting throughout home', '2024-08-15', true),
        (alice_id, 'Electrical Panel Upgrade', 'Upgraded 100A panel to 200A with modern breakers', '2024-07-25', false);

    -- Carlos's portfolio
    INSERT INTO vendor_portfolio (vendor_id, title, description, project_date, is_featured) VALUES
        (carlos_id, 'Exterior House Painting', 'Complete exterior painting of 2-story Victorian home', '2024-09-10', true),
        (carlos_id, 'Kitchen Cabinet Refinishing', 'Painted and refinished oak kitchen cabinets', '2024-08-05', true),
        (carlos_id, 'Interior Living Room Paint', 'Painted living room with custom color matching', '2024-07-20', false);

    -- Sarah's portfolio
    INSERT INTO vendor_portfolio (vendor_id, title, description, project_date, is_featured) VALUES
        (sarah_id, 'Move-out Deep Clean', 'Comprehensive deep cleaning for apartment move-out', '2024-09-20', true),
        (sarah_id, 'Post-Construction Cleanup', 'Detailed cleanup after kitchen renovation', '2024-08-30', true),
        (sarah_id, 'Regular House Cleaning', 'Weekly cleaning service for busy family', '2024-09-25', false);

    -- David's portfolio
    INSERT INTO vendor_portfolio (vendor_id, title, description, project_date, is_featured) VALUES
        (david_id, 'Deck Repair and Staining', 'Repaired loose boards and applied new stain to deck', '2024-09-12', true),
        (david_id, 'Bathroom Fixture Installation', 'Installed new towel bars, toilet paper holder, and mirror', '2024-08-18', true),
        (david_id, 'Furniture Assembly', 'Assembled IKEA furniture for new apartment', '2024-07-30', false);
END $$;

COMMIT;
