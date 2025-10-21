-- Create vendors table with spatial indexes for geolocation
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location GEOGRAPHY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    business_hours JSONB,
    social_media_links JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    verification_documents JSONB,
    metadata JSONB
);

-- Create indexes for better query performance
CREATE INDEX idx_vendors_location ON vendors USING GIST (location);
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_service_category_id ON vendors(service_category_id);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);
CREATE INDEX idx_vendors_verification_status ON vendors(verification_status);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add a comment to the table
COMMENT ON TABLE vendors IS 'Stores information about vendors providing services in the system';

-- Add comments to columns
COMMENT ON COLUMN vendors.location IS 'Geographic location using PostGIS for spatial queries';
COMMENT ON COLUMN vendors.business_hours IS 'JSON structure containing business hours for each day';
COMMENT ON COLUMN vendors.social_media_links IS 'JSON structure containing links to social media profiles';
COMMENT ON COLUMN vendors.verification_documents IS 'References to uploaded verification documents';
COMMENT ON COLUMN vendors.metadata IS 'Additional metadata in JSON format';
