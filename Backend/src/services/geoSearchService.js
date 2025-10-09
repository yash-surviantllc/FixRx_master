/**
 * Geographic Search Service
 * Architecture: Bounding box calculation with PostGIS future enhancement
 */

const { dbManager } = require('../config/database');

class GeoSearchService {
  constructor() {
    this.earthRadiusKm = 6371;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Create spatial indexes if they don't exist
      await this.createSpatialIndexes();
      
      this.isInitialized = true;
      console.log('✅ Geographic Search Service Initialized');

      return {
        initialized: true,
        earthRadius: this.earthRadiusKm,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Geographic Search Service Initialization Failed:', error);
      throw error;
    }
  }

  async createSpatialIndexes() {
    try {
      // Create compound index for lat/lng bounding box queries
      await dbManager.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_location_bbox 
        ON vendors (latitude, longitude) 
        WHERE status = 'active'
      `);

      // Create GIN index for service categories array
      await dbManager.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_service_categories 
        ON vendors USING GIN (service_categories)
      `);

      // Create partial index for active vendors only
      await dbManager.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_active_location 
        ON vendors (latitude, longitude, created_at) 
        WHERE status = 'active' AND latitude IS NOT NULL AND longitude IS NOT NULL
      `);

      console.log('✅ Spatial indexes created/verified');

    } catch (error) {
      console.error('❌ Spatial Index Creation Failed:', error);
      // Don't throw - indexes might already exist
    }
  }

  // Phase 1: Bounding Box Calculation
  calculateBoundingBox(lat, lng, radiusKm) {
    const latDelta = (radiusKm / this.earthRadiusKm) * (180 / Math.PI);
    const lngDelta = (radiusKm / this.earthRadiusKm) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta,
      centerLat: lat,
      centerLng: lng,
      radiusKm
    };
  }

  // Haversine distance calculation for precise distance
  calculateDistance(lat1, lng1, lat2, lng2) {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return this.earthRadiusKm * c;
  }

  // Main vendor search with geographic filtering
  async searchVendors(searchParams) {
    const {
      lat,
      lng,
      radiusKm = 25,
      serviceCategories = [],
      minRating = 0,
      maxResults = 50,
      sortBy = 'distance',
      priceRange = null,
      availability = null,
      verified = null
    } = searchParams;

    try {
      // Check cache first
      const cacheKey = `geo_search:${lat}:${lng}:${radiusKm}:${serviceCategories.join(',')}:${minRating}`;
      let cachedResults = await dbManager.getCache(cacheKey);
      
      if (cachedResults) {
        console.log('📊 Cache Hit: Geographic search results');
        return this.processCachedResults(cachedResults, searchParams);
      }

      // Calculate bounding box
      const bbox = this.calculateBoundingBox(lat, lng, radiusKm);

      // Build dynamic query
      let query = `
        SELECT 
          v.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.profile_image,
          vp.business_name,
          vp.business_description,
          vp.business_phone,
          vp.business_email,
          vp.business_address,
          vp.website_url,
          vp.years_experience,
          vp.license_number,
          vp.insurance_info,
          vp.service_radius,
          vp.hourly_rate_min,
          vp.hourly_rate_max,
          vp.availability_schedule,
          vp.portfolio_images,
          -- Calculate approximate distance for initial filtering
          ABS(v.latitude - $1) + ABS(v.longitude - $2) as distance_approx,
          -- Calculate precise distance
          (
            6371 * acos(
              cos(radians($1)) * cos(radians(v.latitude)) * 
              cos(radians(v.longitude) - radians($2)) + 
              sin(radians($1)) * sin(radians(v.latitude))
            )
          ) as distance_km,
          -- Get average rating
          COALESCE(
            (SELECT AVG((r.cost_rating + r.quality_rating + r.timeliness_rating + r.professionalism_rating) / 4.0)
             FROM ratings r WHERE r.vendor_id = v.id), 0
          ) as avg_rating,
          -- Get total ratings count
          (SELECT COUNT(*) FROM ratings r WHERE r.vendor_id = v.id) as total_ratings
        FROM vendors v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN vendor_profiles vp ON v.id = vp.vendor_id
        WHERE v.latitude BETWEEN $3 AND $4
          AND v.longitude BETWEEN $5 AND $6
          AND v.status = 'active'
          AND u.status = 'active'
      `;

      const params = [lat, lng, bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng];
      let paramIndex = 6;

      // Add service category filter
      if (serviceCategories.length > 0) {
        query += ` AND v.service_categories && $${paramIndex + 1}`;
        params.push(serviceCategories);
        paramIndex++;
      }

      // Add minimum rating filter
      if (minRating > 0) {
        query += ` AND (
          SELECT AVG((r.cost_rating + r.quality_rating + r.timeliness_rating + r.professionalism_rating) / 4.0)
          FROM ratings r WHERE r.vendor_id = v.id
        ) >= $${paramIndex + 1}`;
        params.push(minRating);
        paramIndex++;
      }

      // Add verification filter
      if (verified !== null) {
        query += ` AND vp.is_verified = $${paramIndex + 1}`;
        params.push(verified);
        paramIndex++;
      }

      // Add price range filter
      if (priceRange) {
        query += ` AND (
          (vp.hourly_rate_min IS NULL OR vp.hourly_rate_min <= $${paramIndex + 1}) AND
          (vp.hourly_rate_max IS NULL OR vp.hourly_rate_max >= $${paramIndex + 2})
        )`;
        params.push(priceRange.max, priceRange.min);
        paramIndex += 2;
      }

      // Filter by actual radius (precise distance)
      query += ` 
        HAVING (
          6371 * acos(
            cos(radians($1)) * cos(radians(v.latitude)) * 
            cos(radians(v.longitude) - radians($2)) + 
            sin(radians($1)) * sin(radians(v.latitude))
          )
        ) <= $${paramIndex + 1}
      `;
      params.push(radiusKm);

      // Add sorting
      switch (sortBy) {
        case 'distance':
          query += ' ORDER BY distance_km ASC';
          break;
        case 'rating':
          query += ' ORDER BY avg_rating DESC, distance_km ASC';
          break;
        case 'price_low':
          query += ' ORDER BY vp.hourly_rate_min ASC, distance_km ASC';
          break;
        case 'price_high':
          query += ' ORDER BY vp.hourly_rate_max DESC, distance_km ASC';
          break;
        case 'newest':
          query += ' ORDER BY v.created_at DESC, distance_km ASC';
          break;
        default:
          query += ' ORDER BY distance_km ASC';
      }

      query += ` LIMIT ${maxResults}`;

      console.log('📊 Executing geographic search query:', {
        bbox,
        serviceCategories,
        minRating,
        sortBy,
        paramCount: params.length
      });

      // Execute query
      const result = await dbManager.query(query, params);

      // Process results
      const vendors = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        businessName: row.business_name || `${row.first_name} ${row.last_name}`,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        businessPhone: row.business_phone,
        businessEmail: row.business_email,
        profileImage: row.profile_image,
        location: {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          address: row.business_address,
          distance: parseFloat(row.distance_km).toFixed(2)
        },
        services: {
          categories: row.service_categories || [],
          description: row.business_description,
          radius: row.service_radius,
          yearsExperience: row.years_experience
        },
        pricing: {
          hourlyRateMin: row.hourly_rate_min,
          hourlyRateMax: row.hourly_rate_max,
          currency: 'USD'
        },
        ratings: {
          average: parseFloat(row.avg_rating || 0).toFixed(1),
          total: parseInt(row.total_ratings || 0)
        },
        verification: {
          isVerified: row.is_verified || false,
          licenseNumber: row.license_number,
          hasInsurance: !!row.insurance_info
        },
        availability: row.availability_schedule,
        portfolio: {
          images: row.portfolio_images || [],
          websiteUrl: row.website_url
        },
        searchMeta: {
          distanceKm: parseFloat(row.distance_km),
          matchScore: this.calculateMatchScore(row, searchParams)
        }
      }));

      // Cache results for 5 minutes
      await dbManager.setCache(cacheKey, vendors, 300);

      console.log('✅ Geographic search completed:', {
        found: vendors.length,
        searchRadius: radiusKm,
        avgDistance: vendors.length > 0 ? 
          (vendors.reduce((sum, v) => sum + parseFloat(v.location.distance), 0) / vendors.length).toFixed(2) : 0
      });

      return {
        vendors,
        searchParams: {
          center: { lat, lng },
          radiusKm,
          serviceCategories,
          resultsCount: vendors.length,
          maxResults
        },
        performance: {
          cached: false,
          queryTime: Date.now() - Date.now() // Will be calculated in actual implementation
        }
      };

    } catch (error) {
      console.error('❌ Geographic Search Failed:', error);
      throw error;
    }
  }

  // Calculate match score for ranking
  calculateMatchScore(vendor, searchParams) {
    let score = 100;

    // Distance factor (closer = higher score)
    const distanceKm = parseFloat(vendor.distance_km);
    const maxDistance = searchParams.radiusKm;
    const distanceScore = Math.max(0, 100 - (distanceKm / maxDistance) * 50);
    
    // Rating factor
    const ratingScore = parseFloat(vendor.avg_rating || 0) * 20;
    
    // Service category match
    const categoryMatch = searchParams.serviceCategories.length > 0 ?
      (vendor.service_categories?.filter(cat => searchParams.serviceCategories.includes(cat)).length || 0) /
      searchParams.serviceCategories.length * 30 : 30;

    // Verification bonus
    const verificationBonus = vendor.is_verified ? 10 : 0;

    score = distanceScore * 0.4 + ratingScore * 0.3 + categoryMatch * 0.2 + verificationBonus * 0.1;

    return Math.round(score);
  }

  // Process cached results with additional filtering
  processCachedResults(cachedResults, searchParams) {
    let vendors = [...cachedResults];

    // Apply additional filters that might not have been cached
    if (searchParams.availability) {
      vendors = vendors.filter(v => this.checkAvailability(v, searchParams.availability));
    }

    // Re-sort if needed
    if (searchParams.sortBy === 'rating') {
      vendors.sort((a, b) => parseFloat(b.ratings.average) - parseFloat(a.ratings.average));
    }

    return {
      vendors: vendors.slice(0, searchParams.maxResults || 50),
      searchParams: {
        center: { lat: searchParams.lat, lng: searchParams.lng },
        radiusKm: searchParams.radiusKm,
        serviceCategories: searchParams.serviceCategories,
        resultsCount: vendors.length
      },
      performance: {
        cached: true,
        queryTime: 0
      }
    };
  }

  // Check vendor availability
  checkAvailability(vendor, availabilityFilter) {
    if (!vendor.availability || !availabilityFilter) return true;

    // Mock availability checking logic
    const schedule = vendor.availability;
    const requestedTime = availabilityFilter.datetime;
    
    // Simple availability check (in production, this would be more complex)
    return true; // Placeholder
  }

  // Nearby search with caching
  async findNearbyVendors(lat, lng, radiusKm = 10, limit = 20) {
    try {
      const cacheKey = `nearby:${lat}:${lng}:${radiusKm}:${limit}`;
      let vendors = await dbManager.getCache(cacheKey);

      if (!vendors) {
        const searchResult = await this.searchVendors({
          lat,
          lng,
          radiusKm,
          maxResults: limit,
          sortBy: 'distance'
        });

        vendors = searchResult.vendors;
        
        // Cache for 10 minutes
        await dbManager.setCache(cacheKey, vendors, 600);
      }

      return vendors;

    } catch (error) {
      console.error('❌ Nearby Search Failed:', error);
      throw error;
    }
  }

  // Service category search
  async searchByCategory(category, lat, lng, radiusKm = 25) {
    return await this.searchVendors({
      lat,
      lng,
      radiusKm,
      serviceCategories: [category],
      sortBy: 'rating'
    });
  }

  // Advanced search with multiple filters
  async advancedSearch(filters) {
    const {
      location,
      services,
      pricing,
      ratings,
      availability,
      verification,
      sorting
    } = filters;

    const searchParams = {
      lat: location.lat,
      lng: location.lng,
      radiusKm: location.radius || 25,
      serviceCategories: services?.categories || [],
      minRating: ratings?.minimum || 0,
      priceRange: pricing ? {
        min: pricing.minHourly,
        max: pricing.maxHourly
      } : null,
      verified: verification?.required || null,
      availability: availability,
      sortBy: sorting?.by || 'distance',
      maxResults: sorting?.limit || 50
    };

    return await this.searchVendors(searchParams);
  }

  // Geographic statistics
  async getSearchStats(lat, lng, radiusKm = 25) {
    try {
      const bbox = this.calculateBoundingBox(lat, lng, radiusKm);

      const statsQuery = `
        SELECT 
          COUNT(*) as total_vendors,
          COUNT(CASE WHEN vp.is_verified = true THEN 1 END) as verified_vendors,
          AVG(
            (SELECT AVG((r.cost_rating + r.quality_rating + r.timeliness_rating + r.professionalism_rating) / 4.0)
             FROM ratings r WHERE r.vendor_id = v.id)
          ) as avg_rating,
          array_agg(DISTINCT unnest(v.service_categories)) as all_categories
        FROM vendors v
        LEFT JOIN vendor_profiles vp ON v.id = vp.vendor_id
        WHERE v.latitude BETWEEN $1 AND $2
          AND v.longitude BETWEEN $3 AND $4
          AND v.status = 'active'
      `;

      const result = await dbManager.query(statsQuery, [
        bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng
      ]);

      const stats = result.rows[0];

      return {
        area: {
          center: { lat, lng },
          radiusKm,
          boundingBox: bbox
        },
        vendors: {
          total: parseInt(stats.total_vendors || 0),
          verified: parseInt(stats.verified_vendors || 0),
          averageRating: parseFloat(stats.avg_rating || 0).toFixed(1)
        },
        services: {
          categories: stats.all_categories?.filter(Boolean) || []
        }
      };

    } catch (error) {
      console.error('❌ Search Stats Failed:', error);
      throw error;
    }
  }

  // Health check
  getStatus() {
    return {
      initialized: this.isInitialized,
      earthRadius: this.earthRadiusKm,
      features: {
        boundingBoxSearch: true,
        preciseDistance: true,
        spatialIndexes: true,
        caching: true
      }
    };
  }
}

// Singleton instance
const geoSearchService = new GeoSearchService();

module.exports = {
  GeoSearchService,
  geoSearchService
};
