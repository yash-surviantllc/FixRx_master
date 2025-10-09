/**
 * Main FixRx Backend Server
 * Unified server with all features: authentication, vendors, consumers, ratings, invitations
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', generalLimiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:19006', 
    'http://localhost:8081', 
    'http://localhost:3000',
    'http://127.0.0.1:19006',
    'exp://localhost:19000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Main FixRx Backend is running!',
    timestamp: new Date().toISOString(),
    version: '3.0.0-main',
    features: {
      authentication: 'enhanced',
      vendors: 'active',
      consumers: 'active',
      ratings: 'active',
      invitations: 'active',
      contacts: 'active',
      security: 'active'
    }
  });
});

// Enhanced Authentication endpoints
app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, firstName, lastName, userType, phone, metroArea } = req.body;
  
  console.log('Registration request:', { email, firstName, lastName, userType });
  
  // Enhanced validation
  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Valid email is required'
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: 'user_' + Date.now(),
        email,
        firstName,
        lastName,
        userType,
        phone,
        metroArea,
        isVerified: true,
        isActive: true,
        provider: 'local',
        createdAt: new Date().toISOString()
      },
      token: 'jwt_token_' + Date.now(),
      refreshToken: 'refresh_token_' + Date.now()
    }
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login request:', { email });
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 'user_123',
        email,
        firstName: 'John',
        lastName: 'Doe',
        userType: 'CONSUMER',
        isVerified: true,
        createdAt: new Date().toISOString()
      },
      token: 'mock_jwt_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now()
    }
  });
});

app.delete('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Mock Consumer Dashboard endpoint
app.get('/api/v1/consumers/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        profileImage: 'https://i.pravatar.cc/100?img=1'
      },
      stats: {
        totalConnections: 5,
        activeProjects: 2,
        completedProjects: 8
      },
      recentActivity: [
        {
          id: 'activity_1',
          type: 'connection',
          description: 'Connected with Mike Rodriguez',
          createdAt: new Date().toISOString()
        }
      ],
      recommendedVendors: [
        {
          id: 'vendor_1',
          firstName: 'Mike',
          lastName: 'Rodriguez',
          businessName: 'Rodriguez Plumbing',
          services: ['Plumbing', 'Pipe Repair'],
          rating: 4.9,
          reviewCount: 15,
          profileImage: 'https://i.pravatar.cc/100?img=8',
          distance: 2.5,
          isOnline: true
        },
        {
          id: 'vendor_2',
          firstName: 'Jennifer',
          lastName: 'Chen',
          businessName: 'Chen Electric',
          services: ['Electrical', 'Wiring'],
          rating: 4.8,
          reviewCount: 22,
          profileImage: 'https://i.pravatar.cc/100?img=5',
          distance: 1.8,
          isOnline: true
        }
      ],
      recentServices: [
        {
          id: 'service_1',
          vendorName: 'Mike Rodriguez',
          service: 'Plumbing repair',
          status: 'completed',
          rating: null,
          completedAt: new Date().toISOString()
        }
      ]
    }
  });
});

// Mock Consumer Recommendations endpoint
app.get('/api/v1/consumers/recommendations', (req, res) => {
  res.json({
    success: true,
    data: {
      vendors: [
        {
          id: 'vendor_3',
          firstName: 'David',
          lastName: 'Kim',
          businessName: 'Kim Handyman Services',
          services: ['Handyman', 'Repairs'],
          rating: 4.7,
          reviewCount: 18,
          profileImage: 'https://i.pravatar.cc/100?img=12',
          metroArea: 'San Francisco',
          isVerified: true,
          recommendationReason: 'Highly rated in your area'
        }
      ],
      total: 1
    }
  });
});

// Mock User Profile endpoint
app.get('/api/v1/users/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'user_123',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userType: 'CONSUMER',
      phone: '+1234567890',
      profileImage: 'https://i.pravatar.cc/100?img=1',
      isVerified: true,
      metroArea: 'San Francisco',
      createdAt: new Date().toISOString()
    }
  });
});

// Vendor Search Endpoint
app.get('/api/v1/vendors/search', (req, res) => {
  const { query, category, location, latitude, longitude, radius } = req.query;
  
  console.log('Vendor search:', { query, category, location });
  
  res.json({
    success: true,
    data: {
      vendors: [
        {
          id: 'vendor_1',
          firstName: 'Mike',
          lastName: 'Rodriguez',
          businessName: 'Rodriguez Plumbing',
          category: 'Plumbing',
          services: ['Plumbing', 'Pipe Repair', 'Emergency Service'],
          rating: 4.9,
          reviewCount: 15,
          profileImage: 'https://i.pravatar.cc/100?img=8',
          location: 'San Francisco, CA',
          distance: 2.5,
          isOnline: true,
          isVerified: true,
          hourlyRate: 85,
          availability: 'Available Now'
        },
        {
          id: 'vendor_2',
          firstName: 'Jennifer',
          lastName: 'Chen',
          businessName: 'Chen Electric',
          category: 'Electrical',
          services: ['Electrical', 'Wiring', 'Panel Upgrades'],
          rating: 4.8,
          reviewCount: 22,
          profileImage: 'https://i.pravatar.cc/100?img=5',
          location: 'Oakland, CA',
          distance: 1.8,
          isOnline: true,
          isVerified: true,
          hourlyRate: 95,
          availability: 'Available Today'
        }
      ],
      total: 2
    }
  });
});

// Rating Endpoints
app.post('/api/v1/ratings', (req, res) => {
  const { vendorId, consumerId, serviceId, ratings, comment } = req.body;
  
  console.log('Rating creation:', { vendorId, ratings });
  
  res.status(201).json({
    success: true,
    message: 'Rating submitted successfully',
    data: {
      id: 'rating_' + Date.now(),
      vendorId,
      consumerId,
      serviceId,
      ratings: {
        cost: ratings.cost || 5,
        quality: ratings.quality || 5,
        timeliness: ratings.timeliness || 5,
        professionalism: ratings.professionalism || 5
      },
      overallRating: ((ratings.cost + ratings.quality + ratings.timeliness + ratings.professionalism) / 4).toFixed(1),
      comment,
      createdAt: new Date().toISOString()
    }
  });
});

app.get('/api/v1/ratings', (req, res) => {
  const { vendorId, consumerId } = req.query;
  
  res.json({
    success: true,
    data: {
      ratings: [
        {
          id: 'rating_1',
          vendorId: vendorId || 'vendor_1',
          consumerName: 'John Doe',
          ratings: {
            cost: 5,
            quality: 4,
            timeliness: 5,
            professionalism: 5
          },
          overallRating: 4.8,
          comment: 'Excellent service, very professional',
          createdAt: new Date().toISOString()
        }
      ],
      averageRating: 4.8,
      totalRatings: 15
    }
  });
});

// ============================================================================
// ENHANCED RATING & REVIEW SYSTEM
// ============================================================================

// Update Rating (Edit existing rating)
app.put('/api/v1/ratings/:ratingId', (req, res) => {
  const { ratingId } = req.params;
  const { ratings, comment } = req.body;
  
  console.log('Updating rating:', { ratingId, ratings });
  
  const updatedRating = {
    id: ratingId,
    ratings: {
      cost: ratings.cost || 5,
      quality: ratings.quality || 5,
      timeliness: ratings.timeliness || 5,
      professionalism: ratings.professionalism || 5
    },
    overallRating: ((ratings.cost + ratings.quality + ratings.timeliness + ratings.professionalism) / 4).toFixed(1),
    comment,
    updatedAt: new Date().toISOString(),
    isEdited: true
  };
  
  res.json({
    success: true,
    message: 'Rating updated successfully',
    data: {
      rating: updatedRating
    }
  });
});

// Delete Rating
app.delete('/api/v1/ratings/:ratingId', (req, res) => {
  const { ratingId } = req.params;
  
  console.log('Deleting rating:', ratingId);
  
  res.json({
    success: true,
    message: 'Rating deleted successfully',
    data: {
      ratingId,
      deletedAt: new Date().toISOString()
    }
  });
});

// Get Detailed Rating Analytics
app.get('/api/v1/ratings/:vendorId/analytics', (req, res) => {
  const { vendorId } = req.params;
  const { period = '30d' } = req.query;
  
  console.log('Getting rating analytics:', { vendorId, period });
  
  const ratingAnalytics = {
    vendorId,
    period,
    summary: {
      totalRatings: 127,
      averageOverallRating: 4.8,
      ratingDistribution: {
        5: 89,  // 70%
        4: 28,  // 22%
        3: 8,   // 6%
        2: 2,   // 2%
        1: 0    // 0%
      }
    },
    categoryBreakdown: {
      cost: {
        average: 4.6,
        distribution: { 5: 75, 4: 35, 3: 12, 2: 5, 1: 0 },
        trend: 'up',
        change: 0.2
      },
      quality: {
        average: 4.9,
        distribution: { 5: 95, 4: 25, 3: 5, 2: 2, 1: 0 },
        trend: 'up',
        change: 0.1
      },
      timeliness: {
        average: 4.7,
        distribution: { 5: 82, 4: 30, 3: 10, 2: 5, 1: 0 },
        trend: 'stable',
        change: 0.0
      },
      professionalism: {
        average: 4.9,
        distribution: { 5: 98, 4: 22, 3: 5, 2: 2, 1: 0 },
        trend: 'up',
        change: 0.3
      }
    },
    trends: {
      last30Days: [4.6, 4.7, 4.8, 4.8, 4.9, 4.8, 4.8],
      ratingVolume: [12, 15, 18, 22, 19, 25, 16],
      responseRate: 95.5 // percentage of jobs that get rated
    },
    insights: [
      {
        type: 'strength',
        category: 'professionalism',
        message: 'Consistently high professionalism ratings (4.9/5)',
        impact: 'positive'
      },
      {
        type: 'improvement',
        category: 'cost',
        message: 'Cost ratings slightly below average (4.6/5)',
        impact: 'neutral'
      },
      {
        type: 'trend',
        category: 'overall',
        message: 'Rating trend is positive over last 30 days',
        impact: 'positive'
      }
    ]
  };
  
  res.json({
    success: true,
    data: ratingAnalytics
  });
});

// Get Reviews with Advanced Filtering and Sorting
app.get('/api/v1/reviews', (req, res) => {
  const { 
    vendorId, 
    consumerId, 
    minRating = 1, 
    maxRating = 5,
    hasComment = null,
    sortBy = 'newest',
    limit = 20,
    offset = 0,
    category = null
  } = req.query;
  
  console.log('Getting reviews:', { vendorId, sortBy, limit, offset });
  
  const mockReviews = [
    {
      id: 'review_1',
      vendorId: vendorId || 'vendor_1',
      consumerId: 'consumer_1',
      consumerName: 'John Doe',
      consumerAvatar: 'https://i.pravatar.cc/100?img=1',
      serviceId: 'service_1',
      serviceType: 'Plumbing Repair',
      ratings: {
        cost: 5,
        quality: 5,
        timeliness: 4,
        professionalism: 5
      },
      overallRating: 4.8,
      comment: 'Excellent service! Mike was very professional and fixed our plumbing issue quickly. The pricing was fair and he cleaned up after himself. Highly recommend!',
      images: ['https://picsum.photos/300/200?random=1', 'https://picsum.photos/300/200?random=2'],
      isVerified: true,
      helpfulCount: 12,
      createdAt: '2024-10-01T14:30:00.000Z',
      updatedAt: null,
      isEdited: false,
      moderationStatus: 'approved',
      vendorResponse: {
        message: 'Thank you for the kind words, John! It was a pleasure working with you.',
        respondedAt: '2024-10-01T16:45:00.000Z'
      }
    },
    {
      id: 'review_2',
      vendorId: vendorId || 'vendor_1',
      consumerId: 'consumer_2',
      consumerName: 'Sarah Johnson',
      consumerAvatar: 'https://i.pravatar.cc/100?img=2',
      serviceId: 'service_2',
      serviceType: 'Emergency Plumbing',
      ratings: {
        cost: 4,
        quality: 5,
        timeliness: 5,
        professionalism: 5
      },
      overallRating: 4.8,
      comment: 'Quick response for emergency service. Arrived within 30 minutes and resolved the issue efficiently.',
      images: [],
      isVerified: true,
      helpfulCount: 8,
      createdAt: '2024-09-28T09:15:00.000Z',
      updatedAt: null,
      isEdited: false,
      moderationStatus: 'approved',
      vendorResponse: null
    },
    {
      id: 'review_3',
      vendorId: vendorId || 'vendor_1',
      consumerId: 'consumer_3',
      consumerName: 'Mike Chen',
      consumerAvatar: 'https://i.pravatar.cc/100?img=3',
      serviceId: 'service_3',
      serviceType: 'Bathroom Renovation',
      ratings: {
        cost: 4,
        quality: 4,
        timeliness: 3,
        professionalism: 4
      },
      overallRating: 3.8,
      comment: 'Good work overall, but took longer than expected. Quality was good though.',
      images: ['https://picsum.photos/300/200?random=3'],
      isVerified: true,
      helpfulCount: 3,
      createdAt: '2024-09-25T11:20:00.000Z',
      updatedAt: '2024-09-25T15:30:00.000Z',
      isEdited: true,
      moderationStatus: 'approved',
      vendorResponse: {
        message: 'Thank you for the feedback. We apologize for the delay and will work to improve our timing.',
        respondedAt: '2024-09-26T08:30:00.000Z'
      }
    }
  ];
  
  // Apply filters
  let filteredReviews = mockReviews;
  
  if (minRating) {
    filteredReviews = filteredReviews.filter(r => r.overallRating >= parseFloat(minRating));
  }
  
  if (maxRating) {
    filteredReviews = filteredReviews.filter(r => r.overallRating <= parseFloat(maxRating));
  }
  
  if (hasComment !== null) {
    const hasCommentBool = hasComment === 'true';
    filteredReviews = filteredReviews.filter(r => 
      hasCommentBool ? (r.comment && r.comment.length > 0) : (!r.comment || r.comment.length === 0)
    );
  }
  
  if (category) {
    filteredReviews = filteredReviews.filter(r => 
      r.serviceType.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'newest':
      filteredReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'oldest':
      filteredReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'highest_rating':
      filteredReviews.sort((a, b) => b.overallRating - a.overallRating);
      break;
    case 'lowest_rating':
      filteredReviews.sort((a, b) => a.overallRating - b.overallRating);
      break;
    case 'most_helpful':
      filteredReviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
      break;
  }
  
  // Apply pagination
  const paginatedReviews = filteredReviews.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      reviews: paginatedReviews,
      total: filteredReviews.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (offset + parseInt(limit)) < filteredReviews.length,
      filters: {
        minRating: parseFloat(minRating),
        maxRating: parseFloat(maxRating),
        hasComment,
        category,
        sortBy
      },
      summary: {
        averageRating: filteredReviews.reduce((sum, r) => sum + r.overallRating, 0) / filteredReviews.length,
        totalReviews: filteredReviews.length,
        verifiedReviews: filteredReviews.filter(r => r.isVerified).length,
        reviewsWithComments: filteredReviews.filter(r => r.comment && r.comment.length > 0).length
      }
    }
  });
});

// Mark Review as Helpful
app.post('/api/v1/reviews/:reviewId/helpful', (req, res) => {
  const { reviewId } = req.params;
  const { userId } = req.body;
  
  console.log('Marking review as helpful:', { reviewId, userId });
  
  res.json({
    success: true,
    message: 'Review marked as helpful',
    data: {
      reviewId,
      userId,
      helpfulCount: Math.floor(Math.random() * 20) + 1,
      markedAt: new Date().toISOString()
    }
  });
});

// Vendor Response to Review
app.post('/api/v1/reviews/:reviewId/response', (req, res) => {
  const { reviewId } = req.params;
  const { vendorId, message } = req.body;
  
  console.log('Vendor responding to review:', { reviewId, vendorId });
  
  res.status(201).json({
    success: true,
    message: 'Response added successfully',
    data: {
      reviewId,
      vendorId,
      response: {
        message,
        respondedAt: new Date().toISOString()
      }
    }
  });
});

// Review Moderation Endpoints
app.get('/api/v1/reviews/moderation/pending', (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  
  console.log('Getting pending reviews for moderation');
  
  const pendingReviews = [
    {
      id: 'review_pending_1',
      vendorId: 'vendor_1',
      consumerId: 'consumer_4',
      consumerName: 'Anonymous User',
      ratings: {
        cost: 2,
        quality: 1,
        timeliness: 1,
        professionalism: 2
      },
      overallRating: 1.5,
      comment: 'This review contains inappropriate language and needs moderation.',
      flaggedReasons: ['inappropriate_language', 'spam'],
      flaggedBy: ['user_1', 'user_2'],
      flaggedAt: '2024-10-02T10:30:00.000Z',
      moderationStatus: 'pending',
      createdAt: '2024-10-02T09:15:00.000Z'
    },
    {
      id: 'review_pending_2',
      vendorId: 'vendor_2',
      consumerId: 'consumer_5',
      consumerName: 'Suspicious Account',
      ratings: {
        cost: 5,
        quality: 5,
        timeliness: 5,
        professionalism: 5
      },
      overallRating: 5.0,
      comment: 'Suspiciously positive review that may be fake.',
      flaggedReasons: ['fake_review', 'suspicious_account'],
      flaggedBy: ['system'],
      flaggedAt: '2024-10-02T11:45:00.000Z',
      moderationStatus: 'pending',
      createdAt: '2024-10-02T11:30:00.000Z'
    }
  ];
  
  const paginatedReviews = pendingReviews.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      reviews: paginatedReviews,
      total: pendingReviews.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (offset + parseInt(limit)) < pendingReviews.length
    }
  });
});

// Moderate Review (Approve/Reject)
app.put('/api/v1/reviews/:reviewId/moderate', (req, res) => {
  const { reviewId } = req.params;
  const { action, reason, moderatorId } = req.body; // action: 'approve', 'reject', 'edit'
  
  console.log('Moderating review:', { reviewId, action, reason });
  
  res.json({
    success: true,
    message: `Review ${action}ed successfully`,
    data: {
      reviewId,
      action,
      reason,
      moderatorId,
      moderatedAt: new Date().toISOString(),
      newStatus: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'edited'
    }
  });
});

// Flag Review for Moderation
app.post('/api/v1/reviews/:reviewId/flag', (req, res) => {
  const { reviewId } = req.params;
  const { userId, reason, description } = req.body;
  
  console.log('Flagging review:', { reviewId, userId, reason });
  
  res.status(201).json({
    success: true,
    message: 'Review flagged for moderation',
    data: {
      reviewId,
      userId,
      flag: {
        reason,
        description,
        flaggedAt: new Date().toISOString()
      }
    }
  });
});

// Historical Rating Trends
app.get('/api/v1/ratings/:vendorId/trends', (req, res) => {
  const { vendorId } = req.params;
  const { period = '12m', granularity = 'month' } = req.query;
  
  console.log('Getting rating trends:', { vendorId, period, granularity });
  
  const trendData = {
    vendorId,
    period,
    granularity,
    trends: {
      overall: [
        { period: '2024-01', average: 4.2, count: 8 },
        { period: '2024-02', average: 4.4, count: 12 },
        { period: '2024-03', average: 4.6, count: 15 },
        { period: '2024-04', average: 4.5, count: 18 },
        { period: '2024-05', average: 4.7, count: 22 },
        { period: '2024-06', average: 4.8, count: 25 },
        { period: '2024-07', average: 4.9, count: 28 },
        { period: '2024-08', average: 4.8, count: 24 },
        { period: '2024-09', average: 4.9, count: 31 },
        { period: '2024-10', average: 4.8, count: 12 }
      ],
      categories: {
        cost: [
          { period: '2024-01', average: 4.0 },
          { period: '2024-02', average: 4.2 },
          { period: '2024-03', average: 4.4 },
          { period: '2024-04', average: 4.3 },
          { period: '2024-05', average: 4.5 },
          { period: '2024-06', average: 4.6 },
          { period: '2024-07', average: 4.7 },
          { period: '2024-08', average: 4.6 },
          { period: '2024-09', average: 4.7 },
          { period: '2024-10', average: 4.6 }
        ],
        quality: [
          { period: '2024-01', average: 4.3 },
          { period: '2024-02', average: 4.5 },
          { period: '2024-03', average: 4.7 },
          { period: '2024-04', average: 4.6 },
          { period: '2024-05', average: 4.8 },
          { period: '2024-06', average: 4.9 },
          { period: '2024-07', average: 5.0 },
          { period: '2024-08', average: 4.9 },
          { period: '2024-09', average: 5.0 },
          { period: '2024-10', average: 4.9 }
        ],
        timeliness: [
          { period: '2024-01', average: 4.1 },
          { period: '2024-02', average: 4.3 },
          { period: '2024-03', average: 4.5 },
          { period: '2024-04', average: 4.4 },
          { period: '2024-05', average: 4.6 },
          { period: '2024-06', average: 4.7 },
          { period: '2024-07', average: 4.8 },
          { period: '2024-08', average: 4.7 },
          { period: '2024-09', average: 4.8 },
          { period: '2024-10', average: 4.7 }
        ],
        professionalism: [
          { period: '2024-01', average: 4.4 },
          { period: '2024-02', average: 4.6 },
          { period: '2024-03', average: 4.8 },
          { period: '2024-04', average: 4.7 },
          { period: '2024-05', average: 4.9 },
          { period: '2024-06', average: 5.0 },
          { period: '2024-07', average: 5.0 },
          { period: '2024-08', average: 4.9 },
          { period: '2024-09', average: 5.0 },
          { period: '2024-10', average: 4.9 }
        ]
      }
    },
    insights: {
      bestMonth: { period: '2024-07', average: 4.9, improvement: '+0.1' },
      worstMonth: { period: '2024-01', average: 4.2, note: 'Early period with fewer reviews' },
      trendDirection: 'upward',
      overallImprovement: '+0.6 points over 10 months',
      strongestCategory: 'professionalism',
      improvementArea: 'cost'
    },
    milestones: [
      {
        date: '2024-03-15',
        type: 'rating_milestone',
        description: 'Reached 4.5+ average rating',
        rating: 4.5
      },
      {
        date: '2024-06-20',
        type: 'review_milestone',
        description: 'Received 100th review',
        count: 100
      },
      {
        date: '2024-07-10',
        type: 'rating_milestone',
        description: 'Achieved highest monthly rating',
        rating: 4.9
      }
    ]
  };
  
  res.json({
    success: true,
    data: trendData
  });
});

// Rating Aggregation and Statistics
app.get('/api/v1/ratings/:vendorId/aggregation', (req, res) => {
  const { vendorId } = req.params;
  
  console.log('Getting rating aggregation:', vendorId);
  
  const aggregationData = {
    vendorId,
    overall: {
      averageRating: 4.8,
      totalRatings: 127,
      ratingDistribution: {
        5: { count: 89, percentage: 70.1 },
        4: { count: 28, percentage: 22.0 },
        3: { count: 8, percentage: 6.3 },
        2: { count: 2, percentage: 1.6 },
        1: { count: 0, percentage: 0.0 }
      }
    },
    categories: {
      cost: {
        average: 4.6,
        total: 127,
        distribution: {
          5: { count: 75, percentage: 59.1 },
          4: { count: 35, percentage: 27.6 },
          3: { count: 12, percentage: 9.4 },
          2: { count: 5, percentage: 3.9 },
          1: { count: 0, percentage: 0.0 }
        }
      },
      quality: {
        average: 4.9,
        total: 127,
        distribution: {
          5: { count: 95, percentage: 74.8 },
          4: { count: 25, percentage: 19.7 },
          3: { count: 5, percentage: 3.9 },
          2: { count: 2, percentage: 1.6 },
          1: { count: 0, percentage: 0.0 }
        }
      },
      timeliness: {
        average: 4.7,
        total: 127,
        distribution: {
          5: { count: 82, percentage: 64.6 },
          4: { count: 30, percentage: 23.6 },
          3: { count: 10, percentage: 7.9 },
          2: { count: 5, percentage: 3.9 },
          1: { count: 0, percentage: 0.0 }
        }
      },
      professionalism: {
        average: 4.9,
        total: 127,
        distribution: {
          5: { count: 98, percentage: 77.2 },
          4: { count: 22, percentage: 17.3 },
          3: { count: 5, percentage: 3.9 },
          2: { count: 2, percentage: 1.6 },
          1: { count: 0, percentage: 0.0 }
        }
      }
    },
    recentTrend: {
      last30Days: {
        averageRating: 4.9,
        totalRatings: 16,
        change: '+0.1'
      },
      last7Days: {
        averageRating: 4.8,
        totalRatings: 4,
        change: '0.0'
      }
    },
    benchmarks: {
      categoryAverage: 4.6,
      platformAverage: 4.4,
      percentileRank: 85,
      competitorComparison: {
        betterThan: 78,
        totalCompetitors: 92
      }
    }
  };
  
  res.json({
    success: true,
    data: aggregationData
  });
});

// Invitation Endpoints
app.post('/api/v1/invitations/send', (req, res) => {
  const { recipientEmail, recipientPhone, message, invitationType } = req.body;
  
  console.log('Invitation sent:', { recipientEmail, invitationType });
  
  res.status(201).json({
    success: true,
    message: 'Invitation sent successfully',
    data: {
      id: 'invitation_' + Date.now(),
      recipientEmail,
      recipientPhone,
      message,
      invitationType,
      status: 'sent',
      sentAt: new Date().toISOString()
    }
  });
});

app.post('/api/v1/invitations/bulk', (req, res) => {
  const { recipients, message, invitationType } = req.body;
  
  console.log('Bulk invitations:', { count: recipients.length, invitationType });
  
  res.status(201).json({
    success: true,
    message: `${recipients.length} invitations sent successfully`,
    data: {
      batchId: 'batch_' + Date.now(),
      totalSent: recipients.length,
      successful: recipients.length,
      failed: 0,
      sentAt: new Date().toISOString()
    }
  });
});

// ============================================================================
// ENHANCED COMMUNICATION & INVITATION SYSTEM
// ============================================================================

// SMS Integration with Twilio
app.post('/api/v1/sms/send', (req, res) => {
  const { to, message, templateId, variables } = req.body;
  
  console.log('Sending SMS:', { to, templateId });
  
  // Simulate phone type detection
  const phoneType = detectPhoneType(to);
  
  const smsResponse = {
    id: `sms_${Date.now()}`,
    to,
    message,
    templateId,
    phoneType,
    status: 'sent',
    deliveryStatus: 'pending',
    cost: 0.0075, // USD
    segments: 1,
    sentAt: new Date().toISOString(),
    twilioSid: `SM${Math.random().toString(36).substring(2, 15)}`
  };
  
  res.status(201).json({
    success: true,
    message: 'SMS sent successfully',
    data: smsResponse
  });
});

// Phone Type Detection
function detectPhoneType(phoneNumber) {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.startsWith('1')) {
    return { country: 'US', type: 'mobile', carrier: 'Verizon' };
  }
  return { country: 'Unknown', type: 'mobile', carrier: 'Unknown' };
}

// SMS Delivery Tracking
app.get('/api/v1/sms/:smsId/status', (req, res) => {
  const { smsId } = req.params;
  
  const deliveryStatus = {
    id: smsId,
    status: 'delivered',
    deliveredAt: new Date().toISOString(),
    errorCode: null,
    errorMessage: null,
    priceUnit: 'USD',
    price: '0.0075'
  };
  
  res.json({
    success: true,
    data: deliveryStatus
  });
});

// SMS Template Management
app.get('/api/v1/sms/templates', (req, res) => {
  const templates = [
    {
      id: 'welcome_sms',
      name: 'Welcome SMS',
      content: 'Welcome to FixRx! Your account is ready. Download the app: {{app_link}}',
      variables: ['app_link'],
      category: 'onboarding'
    },
    {
      id: 'invitation_sms',
      name: 'Service Invitation',
      content: 'Hi {{name}}! {{sender}} invited you to FixRx for {{service}}. Join: {{link}}',
      variables: ['name', 'sender', 'service', 'link'],
      category: 'invitation'
    }
  ];
  
  res.json({
    success: true,
    data: { templates }
  });
});

// Email Integration with SendGrid
app.post('/api/v1/email/send', (req, res) => {
  const { to, subject, templateId, variables, attachments } = req.body;
  
  console.log('Sending email:', { to, subject, templateId });
  
  const emailResponse = {
    id: `email_${Date.now()}`,
    to,
    subject,
    templateId,
    status: 'sent',
    deliveryStatus: 'pending',
    sentAt: new Date().toISOString(),
    sendgridId: `SG${Math.random().toString(36).substring(2, 15)}`
  };
  
  res.status(201).json({
    success: true,
    message: 'Email sent successfully',
    data: emailResponse
  });
});

// Email Template Management
app.get('/api/v1/email/templates', (req, res) => {
  const templates = [
    {
      id: 'welcome_email',
      name: 'Welcome Email',
      subject: 'Welcome to FixRx - Your Home Service Platform',
      htmlContent: '<h1>Welcome {{name}}!</h1><p>Your FixRx account is ready.</p>',
      variables: ['name'],
      category: 'onboarding'
    },
    {
      id: 'invitation_email',
      name: 'Service Invitation',
      subject: 'You\'re invited to join FixRx',
      htmlContent: '<h1>Hi {{name}}!</h1><p>{{sender}} invited you to FixRx.</p>',
      variables: ['name', 'sender'],
      category: 'invitation'
    }
  ];
  
  res.json({
    success: true,
    data: { templates }
  });
});

// Enhanced Invitation Management
app.get('/api/v1/invitations', (req, res) => {
  const { status, type, limit = 20, offset = 0 } = req.query;
  
  const invitations = [
    {
      id: 'inv_1',
      recipientEmail: 'john@example.com',
      recipientPhone: '+1234567890',
      senderName: 'Mike Rodriguez',
      invitationType: 'service_request',
      status: 'sent',
      deliveryMethod: 'both',
      sentAt: '2024-10-03T10:00:00Z',
      acceptedAt: null,
      expiresAt: '2024-10-10T10:00:00Z'
    }
  ];
  
  res.json({
    success: true,
    data: { invitations, total: 1 }
  });
});

// Resend Invitation
app.post('/api/v1/invitations/:invitationId/resend', (req, res) => {
  const { invitationId } = req.params;
  const { method } = req.body; // 'sms', 'email', 'both'
  
  res.json({
    success: true,
    message: 'Invitation resent successfully',
    data: {
      invitationId,
      method,
      resentAt: new Date().toISOString()
    }
  });
});

// Invitation Acceptance
app.post('/api/v1/invitations/:invitationId/accept', (req, res) => {
  const { invitationId } = req.params;
  
  res.json({
    success: true,
    message: 'Invitation accepted successfully',
    data: {
      invitationId,
      acceptedAt: new Date().toISOString(),
      status: 'accepted'
    }
  });
});

// Email Delivery Tracking and Analytics
app.get('/api/v1/email/:emailId/status', (req, res) => {
  const { emailId } = req.params;
  
  const deliveryStatus = {
    id: emailId,
    status: 'delivered',
    deliveredAt: new Date().toISOString(),
    openedAt: new Date(Date.now() + 300000).toISOString(), // 5 min later
    clickedAt: null,
    bounced: false,
    spam: false
  };
  
  res.json({
    success: true,
    data: deliveryStatus
  });
});

// Email Analytics Dashboard
app.get('/api/v1/email/analytics', (req, res) => {
  const { period = '30d' } = req.query;
  
  const analytics = {
    period,
    totalSent: 1250,
    delivered: 1198,
    opened: 856,
    clicked: 234,
    bounced: 32,
    spam: 20,
    deliveryRate: 95.8,
    openRate: 71.4,
    clickRate: 19.5,
    bounceRate: 2.6,
    spamRate: 1.6
  };
  
  res.json({
    success: true,
    data: analytics
  });
});

// Automated Email Workflows
app.post('/api/v1/email/workflows', (req, res) => {
  const { name, trigger, steps } = req.body;
  
  const workflow = {
    id: `workflow_${Date.now()}`,
    name,
    trigger,
    steps,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'Email workflow created successfully',
    data: workflow
  });
});

// Get Email Workflows
app.get('/api/v1/email/workflows', (req, res) => {
  const workflows = [
    {
      id: 'workflow_1',
      name: 'Welcome Series',
      trigger: 'user_registration',
      steps: [
        { delay: 0, templateId: 'welcome_email' },
        { delay: 86400, templateId: 'getting_started' },
        { delay: 259200, templateId: 'tips_and_tricks' }
      ],
      status: 'active'
    }
  ];
  
  res.json({
    success: true,
    data: { workflows }
  });
});

// Invitation History and Logs
app.get('/api/v1/invitations/:invitationId/history', (req, res) => {
  const { invitationId } = req.params;
  
  const history = [
    {
      id: 'log_1',
      action: 'created',
      timestamp: '2024-10-03T10:00:00Z',
      details: { method: 'email', recipient: 'john@example.com' }
    },
    {
      id: 'log_2',
      action: 'sent',
      timestamp: '2024-10-03T10:01:00Z',
      details: { deliveryId: 'email_123', status: 'delivered' }
    },
    {
      id: 'log_3',
      action: 'opened',
      timestamp: '2024-10-03T10:15:00Z',
      details: { userAgent: 'Mozilla/5.0...', ip: '192.168.1.1' }
    }
  ];
  
  res.json({
    success: true,
    data: { invitationId, history }
  });
});

// Invitation Status Monitoring
app.get('/api/v1/invitations/status/summary', (req, res) => {
  const summary = {
    total: 1250,
    sent: 1200,
    delivered: 1150,
    opened: 890,
    accepted: 456,
    expired: 78,
    failed: 50,
    pending: 744
  };
  
  res.json({
    success: true,
    data: summary
  });
});

// Bulk Invitation Status Update
app.put('/api/v1/invitations/bulk/status', (req, res) => {
  const { invitationIds, status, reason } = req.body;
  
  res.json({
    success: true,
    message: `${invitationIds.length} invitations updated to ${status}`,
    data: {
      updated: invitationIds.length,
      status,
      reason,
      updatedAt: new Date().toISOString()
    }
  });
});

// Communication Preferences
app.get('/api/v1/users/:userId/communication-preferences', (req, res) => {
  const { userId } = req.params;
  
  const preferences = {
    userId,
    email: {
      enabled: true,
      marketing: true,
      notifications: true,
      frequency: 'daily'
    },
    sms: {
      enabled: true,
      marketing: false,
      notifications: true,
      frequency: 'immediate'
    },
    push: {
      enabled: true,
      marketing: true,
      notifications: true
    }
  };
  
  res.json({
    success: true,
    data: preferences
  });
});

// Update Communication Preferences
app.put('/api/v1/users/:userId/communication-preferences', (req, res) => {
  const { userId } = req.params;
  const preferences = req.body;
  
  res.json({
    success: true,
    message: 'Communication preferences updated successfully',
    data: {
      userId,
      preferences,
      updatedAt: new Date().toISOString()
    }
  });
});

// ============================================================================
// MOBILE APPLICATION BACKEND FEATURES
// ============================================================================

// Firebase Push Notifications Integration
app.post('/api/v1/notifications/push/send', (req, res) => {
  const { userId, title, body, data, priority, badge } = req.body;
  
  console.log('Sending push notification:', { userId, title });
  
  const notification = {
    id: `push_${Date.now()}`,
    userId,
    title,
    body,
    data: data || {},
    priority: priority || 'normal',
    badge,
    status: 'sent',
    sentAt: new Date().toISOString(),
    firebaseMessageId: `fcm_${Math.random().toString(36).substring(2, 15)}`
  };
  
  res.status(201).json({
    success: true,
    message: 'Push notification sent successfully',
    data: notification
  });
});

// Register Device for Push Notifications
app.post('/api/v1/notifications/devices/register', (req, res) => {
  const { userId, deviceToken, platform, appVersion, deviceInfo } = req.body;
  
  console.log('Registering device for push notifications:', { userId, platform });
  
  const deviceRegistration = {
    id: `device_${Date.now()}`,
    userId,
    deviceToken,
    platform, // 'ios' or 'android'
    appVersion,
    deviceInfo: {
      model: deviceInfo?.model || 'Unknown',
      osVersion: deviceInfo?.osVersion || 'Unknown',
      appBuild: deviceInfo?.appBuild || '1.0.0'
    },
    isActive: true,
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'Device registered successfully',
    data: deviceRegistration
  });
});

// Get Notification Preferences
app.get('/api/v1/notifications/preferences/:userId', (req, res) => {
  const { userId } = req.params;
  
  const preferences = {
    userId,
    pushNotifications: {
      enabled: true,
      serviceUpdates: true,
      messages: true,
      marketing: false,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      }
    },
    categories: {
      serviceRequests: { enabled: true, sound: true, vibration: true },
      messages: { enabled: true, sound: true, vibration: false },
      ratings: { enabled: true, sound: false, vibration: true },
      marketing: { enabled: false, sound: false, vibration: false },
      system: { enabled: true, sound: true, vibration: true }
    },
    delivery: {
      immediate: ['serviceRequests', 'messages'],
      batched: ['ratings', 'system'],
      disabled: ['marketing']
    }
  };
  
  res.json({
    success: true,
    data: preferences
  });
});

// Update Notification Preferences
app.put('/api/v1/notifications/preferences/:userId', (req, res) => {
  const { userId } = req.params;
  const preferences = req.body;
  
  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: {
      userId,
      preferences,
      updatedAt: new Date().toISOString()
    }
  });
});

// Notification History
app.get('/api/v1/notifications/history/:userId', (req, res) => {
  const { userId } = req.params;
  const { limit = 20, offset = 0, category, status } = req.query;
  
  const notifications = [
    {
      id: 'notif_1',
      userId,
      title: 'Service Request Accepted',
      body: 'Mike Rodriguez accepted your plumbing service request',
      category: 'serviceRequests',
      status: 'delivered',
      isRead: false,
      sentAt: '2024-10-03T10:00:00Z',
      deliveredAt: '2024-10-03T10:00:05Z',
      readAt: null,
      data: { serviceId: 'service_123', vendorId: 'vendor_1' }
    },
    {
      id: 'notif_2',
      userId,
      title: 'New Message',
      body: 'You have a new message from Sarah Johnson',
      category: 'messages',
      status: 'delivered',
      isRead: true,
      sentAt: '2024-10-03T09:30:00Z',
      deliveredAt: '2024-10-03T09:30:03Z',
      readAt: '2024-10-03T09:35:00Z',
      data: { messageId: 'msg_456', senderId: 'user_789' }
    }
  ];
  
  // Apply filters
  let filteredNotifications = notifications;
  if (category) {
    filteredNotifications = filteredNotifications.filter(n => n.category === category);
  }
  if (status) {
    filteredNotifications = filteredNotifications.filter(n => n.status === status);
  }
  
  // Apply pagination
  const paginatedNotifications = filteredNotifications.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      notifications: paginatedNotifications,
      total: filteredNotifications.length,
      unreadCount: filteredNotifications.filter(n => !n.isRead).length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (offset + parseInt(limit)) < filteredNotifications.length
    }
  });
});

// Mark Notification as Read
app.put('/api/v1/notifications/:notificationId/read', (req, res) => {
  const { notificationId } = req.params;
  
  res.json({
    success: true,
    message: 'Notification marked as read',
    data: {
      notificationId,
      readAt: new Date().toISOString()
    }
  });
});

// Push Notification Analytics
app.get('/api/v1/notifications/analytics', (req, res) => {
  const { period = '30d', userId } = req.query;
  
  const analytics = {
    period,
    userId,
    summary: {
      totalSent: 1250,
      delivered: 1198,
      opened: 856,
      clicked: 234,
      deliveryRate: 95.8,
      openRate: 71.4,
      clickRate: 19.5
    },
    byCategory: {
      serviceRequests: { sent: 450, opened: 398, clickRate: 88.4 },
      messages: { sent: 320, opened: 289, clickRate: 90.3 },
      ratings: { sent: 280, opened: 169, clickRate: 60.4 },
      system: { sent: 200, opened: 180, clickRate: 90.0 }
    },
    byPlatform: {
      ios: { sent: 720, delivered: 698, openRate: 74.2 },
      android: { sent: 530, delivered: 500, openRate: 67.8 }
    },
    trends: {
      daily: [45, 52, 48, 61, 58, 55, 49],
      openRates: [72.1, 73.5, 71.8, 74.2, 73.9, 72.6, 71.4]
    }
  };
  
  res.json({
    success: true,
    data: analytics
  });
});

// App Performance Metrics
app.get('/api/v1/mobile/performance/metrics', (req, res) => {
  const { userId, platform, appVersion } = req.query;
  
  const metrics = {
    userId,
    platform,
    appVersion,
    performance: {
      appLaunchTime: 2.1, // seconds
      apiResponseTime: 245, // milliseconds
      crashRate: 0.02, // percentage
      memoryUsage: 85.6, // MB
      batteryImpact: 'low'
    },
    caching: {
      hitRate: 87.3, // percentage
      cacheSize: 45.2, // MB
      lastSync: new Date().toISOString(),
      offlineCapability: true
    },
    network: {
      requestsPerSession: 23,
      dataUsage: 2.1, // MB per session
      offlineRequests: 3,
      syncPending: 0
    }
  };
  
  res.json({
    success: true,
    data: metrics
  });
});

// Offline Data Synchronization
app.post('/api/v1/mobile/sync', (req, res) => {
  const { userId, deviceId, lastSyncTime, pendingActions } = req.body;
  
  console.log('Mobile data sync:', { userId, deviceId, pendingActions: pendingActions?.length });
  
  const syncResult = {
    syncId: `sync_${Date.now()}`,
    userId,
    deviceId,
    syncTime: new Date().toISOString(),
    lastSyncTime,
    processed: {
      pendingActions: pendingActions?.length || 0,
      successful: pendingActions?.length || 0,
      failed: 0
    },
    updates: {
      vendors: 5,
      ratings: 2,
      messages: 3,
      notifications: 8
    },
    nextSyncTime: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
  };
  
  res.json({
    success: true,
    message: 'Data synchronized successfully',
    data: syncResult
  });
});

// Cache Management
app.get('/api/v1/mobile/cache/status/:userId', (req, res) => {
  const { userId } = req.params;
  
  const cacheStatus = {
    userId,
    cache: {
      totalSize: 45.2, // MB
      maxSize: 100, // MB
      hitRate: 87.3, // percentage
      lastCleanup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      categories: {
        images: { size: 25.1, count: 156 },
        apiResponses: { size: 12.3, count: 89 },
        userProfiles: { size: 4.2, count: 23 },
        vendorData: { size: 3.6, count: 45 }
      }
    },
    recommendations: [
      {
        type: 'cleanup',
        message: 'Consider clearing old cached images',
        priority: 'low'
      }
    ]
  };
  
  res.json({
    success: true,
    data: cacheStatus
  });
});

// Clear Cache
app.delete('/api/v1/mobile/cache/:userId', (req, res) => {
  const { userId } = req.params;
  const { category } = req.query; // 'all', 'images', 'api', 'profiles'
  
  res.json({
    success: true,
    message: `Cache cleared successfully`,
    data: {
      userId,
      category: category || 'all',
      clearedSize: 15.3, // MB
      clearedAt: new Date().toISOString()
    }
  });
});

// App Configuration for Mobile
app.get('/api/v1/mobile/config', (req, res) => {
  const { platform, appVersion } = req.query;
  
  const config = {
    platform,
    appVersion,
    features: {
      offlineMode: true,
      pushNotifications: true,
      biometricAuth: platform === 'ios' ? true : false,
      darkMode: true,
      locationServices: true
    },
    performance: {
      maxCacheSize: 100, // MB
      syncInterval: 300, // seconds
      maxRetries: 3,
      requestTimeout: 30000 // milliseconds
    },
    api: {
      baseUrl: 'http://localhost:3000/api/v1',
      timeout: 30000,
      retryAttempts: 3,
      rateLimiting: {
        requests: 100,
        window: 60 // seconds
      }
    },
    notifications: {
      maxBadgeCount: 99,
      quietHoursDefault: { start: '22:00', end: '08:00' },
      categories: ['serviceRequests', 'messages', 'ratings', 'system', 'marketing']
    }
  };
  
  res.json({
    success: true,
    data: config
  });
});

// ============================================================================
// BACKEND INFRASTRUCTURE & ENTERPRISE FEATURES
// ============================================================================

// System Health and Monitoring
app.get('/api/v1/system/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: 'connected',
        responseTime: 15, // ms
        connections: {
          active: 8,
          idle: 12,
          total: 20
        }
      },
      redis: {
        status: 'connected',
        responseTime: 2, // ms
        memory: '45.2MB',
        hitRate: 87.3
      },
      twilio: {
        status: 'operational',
        lastCheck: new Date().toISOString(),
        messagesSent: 1250,
        deliveryRate: 98.5
      },
      sendgrid: {
        status: 'operational',
        lastCheck: new Date().toISOString(),
        emailsSent: 2340,
        deliveryRate: 96.8
      },
      firebase: {
        status: 'operational',
        lastCheck: new Date().toISOString(),
        notificationsSent: 5670,
        deliveryRate: 94.2
      }
    },
    performance: {
      cpuUsage: 23.5, // percentage
      memoryUsage: {
        used: 156.7, // MB
        total: 512, // MB
        percentage: 30.6
      },
      activeConnections: 45,
      requestsPerMinute: 234,
      averageResponseTime: 245 // ms
    }
  };
  
  res.json({
    success: true,
    data: healthCheck
  });
});

// System Metrics and Analytics
app.get('/api/v1/system/metrics', (req, res) => {
  const { period = '1h' } = req.query;
  
  const metrics = {
    period,
    timestamp: new Date().toISOString(),
    api: {
      totalRequests: 15420,
      successfulRequests: 14987,
      failedRequests: 433,
      successRate: 97.2,
      averageResponseTime: 245,
      p95ResponseTime: 450,
      p99ResponseTime: 890,
      requestsPerSecond: 12.5
    },
    database: {
      queries: {
        total: 8945,
        successful: 8901,
        failed: 44,
        averageTime: 15.3
      },
      connections: {
        active: 8,
        idle: 12,
        waiting: 0,
        maxUsed: 15
      },
      performance: {
        slowQueries: 3,
        cacheHitRate: 89.2,
        indexUsage: 94.7
      }
    },
    system: {
      uptime: process.uptime(),
      cpuUsage: 23.5,
      memoryUsage: 156.7,
      diskUsage: 67.3,
      networkIO: {
        bytesIn: 2340000,
        bytesOut: 1890000
      }
    },
    users: {
      activeUsers: 234,
      concurrentUsers: 45,
      peakConcurrentUsers: 89,
      newRegistrations: 12,
      authenticatedSessions: 156
    }
  };
  
  res.json({
    success: true,
    data: metrics
  });
});

// Database Management and Monitoring
app.get('/api/v1/system/database/status', (req, res) => {
  const dbStatus = {
    status: 'connected',
    type: 'PostgreSQL',
    version: '14.9',
    host: 'localhost',
    port: 5432,
    database: 'fixrx_production',
    connections: {
      active: 8,
      idle: 12,
      total: 20,
      maxConnections: 100
    },
    performance: {
      averageQueryTime: 15.3, // ms
      slowQueries: 3,
      cacheHitRate: 89.2,
      indexUsage: 94.7,
      tableStats: {
        users: { rows: 1250, size: '2.3MB' },
        vendors: { rows: 890, size: '4.1MB' },
        ratings: { rows: 3420, size: '1.8MB' },
        notifications: { rows: 8950, size: '5.2MB' }
      }
    },
    backup: {
      lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      nextBackup: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      backupSize: '45.7MB',
      retentionDays: 30
    }
  };
  
  res.json({
    success: true,
    data: dbStatus
  });
});

// Backup and Recovery Management
app.post('/api/v1/system/backup/create', (req, res) => {
  const { type = 'full', description } = req.body;
  
  console.log('Creating backup:', { type, description });
  
  const backup = {
    id: `backup_${Date.now()}`,
    type, // 'full', 'incremental', 'differential'
    description,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    estimatedSize: '45.7MB',
    estimatedDuration: 120 // seconds
  };
  
  // Simulate backup completion after 2 seconds
  setTimeout(() => {
    backup.status = 'completed';
    backup.completedAt = new Date().toISOString();
    backup.actualSize = '47.2MB';
    backup.duration = 118;
  }, 2000);
  
  res.status(201).json({
    success: true,
    message: 'Backup initiated successfully',
    data: backup
  });
});

// Get Backup History
app.get('/api/v1/system/backup/history', (req, res) => {
  const { limit = 10, type } = req.query;
  
  const backups = [
    {
      id: 'backup_1',
      type: 'full',
      description: 'Daily automated backup',
      status: 'completed',
      startedAt: '2024-10-03T06:00:00Z',
      completedAt: '2024-10-03T06:02:15Z',
      size: '47.2MB',
      duration: 135
    },
    {
      id: 'backup_2',
      type: 'incremental',
      description: 'Hourly incremental backup',
      status: 'completed',
      startedAt: '2024-10-03T12:00:00Z',
      completedAt: '2024-10-03T12:00:45Z',
      size: '2.1MB',
      duration: 45
    }
  ];
  
  let filteredBackups = backups;
  if (type) {
    filteredBackups = backups.filter(b => b.type === type);
  }
  
  res.json({
    success: true,
    data: {
      backups: filteredBackups.slice(0, parseInt(limit)),
      total: filteredBackups.length
    }
  });
});

// OAuth Provider Integration
app.post('/api/v1/auth/oauth/:provider', (req, res) => {
  const { provider } = req.params;
  const { code, state, redirectUri } = req.body;
  
  console.log('OAuth authentication:', { provider, state });
  
  // Simulate OAuth token exchange
  const oauthResult = {
    provider,
    accessToken: `oauth_token_${Math.random().toString(36).substring(2, 15)}`,
    refreshToken: `refresh_token_${Math.random().toString(36).substring(2, 15)}`,
    expiresIn: 3600,
    tokenType: 'Bearer',
    scope: 'profile email',
    userInfo: {
      id: `${provider}_${Math.random().toString(36).substring(2, 10)}`,
      email: 'user@example.com',
      name: 'John Doe',
      picture: 'https://example.com/avatar.jpg',
      provider
    }
  };
  
  res.json({
    success: true,
    message: `${provider} OAuth authentication successful`,
    data: oauthResult
  });
});

// Social Media Login Integration
app.get('/api/v1/auth/social/providers', (req, res) => {
  const providers = [
    {
      name: 'google',
      displayName: 'Google',
      clientId: process.env.GOOGLE_CLIENT_ID || 'google_client_id',
      authUrl: 'https://accounts.google.com/oauth/authorize',
      scopes: ['profile', 'email'],
      enabled: true
    },
    {
      name: 'facebook',
      displayName: 'Facebook',
      clientId: process.env.FACEBOOK_CLIENT_ID || 'facebook_client_id',
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      scopes: ['email', 'public_profile'],
      enabled: true
    },
    {
      name: 'github',
      displayName: 'GitHub',
      clientId: process.env.GITHUB_CLIENT_ID || 'github_client_id',
      authUrl: 'https://github.com/login/oauth/authorize',
      scopes: ['user:email'],
      enabled: true
    },
    {
      name: 'linkedin',
      displayName: 'LinkedIn',
      clientId: process.env.LINKEDIN_CLIENT_ID || 'linkedin_client_id',
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      scopes: ['r_liteprofile', 'r_emailaddress'],
      enabled: true
    }
  ];
  
  res.json({
    success: true,
    data: { providers }
  });
});

// Load Balancer Health Check
app.get('/api/v1/system/load-balancer/health', (req, res) => {
  const health = {
    status: 'healthy',
    serverId: process.env.SERVER_ID || 'server-1',
    timestamp: new Date().toISOString(),
    load: {
      cpu: 23.5,
      memory: 30.6,
      connections: 45,
      requestsPerSecond: 12.5
    },
    capacity: {
      maxConnections: 1000,
      maxRequestsPerSecond: 100,
      utilizationPercentage: 4.5
    }
  };
  
  res.json(health);
});

// Scalability Monitoring
app.get('/api/v1/system/scalability/metrics', (req, res) => {
  const scalabilityMetrics = {
    currentCapacity: {
      concurrentUsers: 45,
      maxConcurrentUsers: 1000,
      utilizationPercentage: 4.5
    },
    performance: {
      averageResponseTime: 245, // ms (target: <500ms)
      p95ResponseTime: 450,
      p99ResponseTime: 890,
      throughput: 12.5, // requests per second
      errorRate: 0.8 // percentage
    },
    resources: {
      cpu: {
        usage: 23.5,
        cores: 4,
        loadAverage: [1.2, 1.5, 1.8]
      },
      memory: {
        used: 156.7, // MB
        total: 512, // MB
        percentage: 30.6
      },
      network: {
        bandwidth: '1Gbps',
        utilization: 15.3, // percentage
        latency: 2.1 // ms
      }
    },
    scaling: {
      autoScalingEnabled: true,
      scaleUpThreshold: 70, // percentage
      scaleDownThreshold: 30, // percentage
      minInstances: 2,
      maxInstances: 10,
      currentInstances: 3
    }
  };
  
  res.json({
    success: true,
    data: scalabilityMetrics
  });
});

// API Rate Limiting Status
app.get('/api/v1/system/rate-limiting/status', (req, res) => {
  const { clientId } = req.query;
  
  const rateLimitStatus = {
    clientId: clientId || 'anonymous',
    limits: {
      general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        currentRequests: 23,
        resetTime: new Date(Date.now() + 12 * 60 * 1000).toISOString()
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
        currentRequests: 1,
        resetTime: new Date(Date.now() + 12 * 60 * 1000).toISOString()
      },
      api: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60,
        currentRequests: 12,
        resetTime: new Date(Date.now() + 48 * 1000).toISOString()
      }
    },
    blocked: false,
    warnings: []
  };
  
  res.json({
    success: true,
    data: rateLimitStatus
  });
});

// ============================================================================
// ACCESS CONTROL & SECURITY SYSTEM
// ============================================================================

// Mock JWT verification middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      error: { code: 'UNAUTHORIZED', details: 'No valid token provided' }
    });
  }
  
  const token = authHeader.substring(7);
  
  // Mock token verification (in production, use proper JWT verification)
  if (token === 'invalid_token') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: { code: 'TOKEN_INVALID', details: 'Token verification failed' }
    });
  }
  
  // Mock user data extraction from token
  req.user = {
    id: 'user_123',
    email: 'user@example.com',
    role: token.includes('admin') ? 'admin' : token.includes('vendor') ? 'vendor' : 'consumer',
    permissions: getPermissionsForRole(token.includes('admin') ? 'admin' : token.includes('vendor') ? 'vendor' : 'consumer')
  };
  
  // Log access attempt
  logDataAccess(req.user.id, req.method, req.path, 'SUCCESS', req.ip);
  
  next();
}

// Role-Based Access Control (RBAC)
function getPermissionsForRole(role) {
  const rolePermissions = {
    admin: [
      'users:read', 'users:write', 'users:delete',
      'vendors:read', 'vendors:write', 'vendors:delete', 'vendors:approve',
      'consumers:read', 'consumers:write', 'consumers:delete',
      'ratings:read', 'ratings:write', 'ratings:delete', 'ratings:moderate',
      'system:read', 'system:write', 'system:backup', 'system:monitor',
      'notifications:read', 'notifications:write', 'notifications:send',
      'analytics:read', 'analytics:export',
      'audit:read', 'audit:export'
    ],
    vendor: [
      'profile:read', 'profile:write',
      'portfolio:read', 'portfolio:write',
      'services:read', 'services:write', 'services:accept',
      'ratings:read', 'ratings:respond',
      'notifications:read',
      'analytics:read:own',
      'messages:read', 'messages:write'
    ],
    consumer: [
      'profile:read', 'profile:write',
      'vendors:read', 'vendors:search',
      'services:read', 'services:write', 'services:request',
      'ratings:read', 'ratings:write:own',
      'notifications:read',
      'messages:read', 'messages:write',
      'invitations:send'
    ],
    guest: [
      'vendors:read:public',
      'ratings:read:public'
    ]
  };
  
  return rolePermissions[role] || rolePermissions.guest;
}

// Permission checking middleware
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: { code: 'UNAUTHORIZED', details: 'User not authenticated' }
      });
    }
    
    if (!req.user.permissions.includes(permission)) {
      logDataAccess(req.user.id, req.method, req.path, 'FORBIDDEN', req.ip, `Missing permission: ${permission}`);
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: { 
          code: 'FORBIDDEN', 
          details: `Required permission: ${permission}`,
          userRole: req.user.role,
          userPermissions: req.user.permissions
        }
      });
    }
    
    next();
  };
}

// Role checking middleware
function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: { code: 'UNAUTHORIZED', details: 'User not authenticated' }
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logDataAccess(req.user.id, req.method, req.path, 'FORBIDDEN', req.ip, `Role not allowed: ${req.user.role}`);
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient role privileges',
        error: { 
          code: 'ROLE_FORBIDDEN', 
          details: `Required roles: ${allowedRoles.join(', ')}`,
          userRole: req.user.role
        }
      });
    }
    
    next();
  };
}

// Data access logging
const accessLogs = [];

function logDataAccess(userId, method, path, status, ipAddress, details = null) {
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    userId,
    method,
    path,
    status, // SUCCESS, FORBIDDEN, ERROR
    ipAddress,
    userAgent: 'Mock User Agent',
    details,
    sessionId: `session_${userId}_${Date.now()}`
  };
  
  accessLogs.push(logEntry);
  
  // Keep only last 1000 logs in memory
  if (accessLogs.length > 1000) {
    accessLogs.shift();
  }
  
  console.log(`[ACCESS LOG] ${status}: ${userId} ${method} ${path} from ${ipAddress}`);
}

// Access Control Management Endpoints

// Get user roles and permissions
app.get('/api/v1/access/user/permissions', verifyToken, (req, res) => {
  const userPermissions = {
    userId: req.user.id,
    email: req.user.email,
    role: req.user.role,
    permissions: req.user.permissions,
    lastLogin: new Date().toISOString(),
    accountStatus: 'active'
  };
  
  res.json({
    success: true,
    data: userPermissions
  });
});

// Get all available roles and their permissions
app.get('/api/v1/access/roles', verifyToken, requirePermission('system:read'), (req, res) => {
  const roles = {
    admin: {
      name: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: getPermissionsForRole('admin'),
      level: 100
    },
    vendor: {
      name: 'Service Vendor',
      description: 'Service provider with business management capabilities',
      permissions: getPermissionsForRole('vendor'),
      level: 50
    },
    consumer: {
      name: 'Service Consumer',
      description: 'Service requester with basic platform access',
      permissions: getPermissionsForRole('consumer'),
      level: 10
    },
    guest: {
      name: 'Guest User',
      description: 'Limited read-only access to public content',
      permissions: getPermissionsForRole('guest'),
      level: 1
    }
  };
  
  res.json({
    success: true,
    data: { roles }
  });
});

// Update user role (admin only)
app.put('/api/v1/access/users/:userId/role', verifyToken, requireRole('admin'), (req, res) => {
  const { userId } = req.params;
  const { role, reason } = req.body;
  
  const validRoles = ['admin', 'vendor', 'consumer', 'guest'];
  
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified',
      error: { code: 'INVALID_ROLE', details: `Valid roles: ${validRoles.join(', ')}` }
    });
  }
  
  // Log role change
  logDataAccess(req.user.id, 'PUT', `/api/v1/access/users/${userId}/role`, 'SUCCESS', req.ip, 
    `Role changed from unknown to ${role}. Reason: ${reason || 'No reason provided'}`);
  
  const roleUpdate = {
    userId,
    previousRole: 'consumer', // Mock previous role
    newRole: role,
    updatedBy: req.user.id,
    updatedAt: new Date().toISOString(),
    reason: reason || 'Administrative action',
    permissions: getPermissionsForRole(role)
  };
  
  res.json({
    success: true,
    message: 'User role updated successfully',
    data: roleUpdate
  });
});

// Get access logs (admin only)
app.get('/api/v1/access/logs', verifyToken, requirePermission('audit:read'), (req, res) => {
  const { userId, method, status, limit = 50, offset = 0 } = req.query;
  
  let filteredLogs = [...accessLogs];
  
  // Apply filters
  if (userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === userId);
  }
  if (method) {
    filteredLogs = filteredLogs.filter(log => log.method === method);
  }
  if (status) {
    filteredLogs = filteredLogs.filter(log => log.status === status);
  }
  
  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply pagination
  const paginatedLogs = filteredLogs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      logs: paginatedLogs,
      total: filteredLogs.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < filteredLogs.length
    }
  });
});

// Get access analytics (admin only)
app.get('/api/v1/access/analytics', verifyToken, requirePermission('analytics:read'), (req, res) => {
  const { period = '24h' } = req.query;
  
  const now = new Date();
  const periodHours = period === '1h' ? 1 : period === '24h' ? 24 : period === '7d' ? 168 : 720; // 30d
  const startTime = new Date(now.getTime() - periodHours * 60 * 60 * 1000);
  
  const recentLogs = accessLogs.filter(log => new Date(log.timestamp) >= startTime);
  
  const analytics = {
    period,
    totalRequests: recentLogs.length,
    successfulRequests: recentLogs.filter(log => log.status === 'SUCCESS').length,
    forbiddenRequests: recentLogs.filter(log => log.status === 'FORBIDDEN').length,
    errorRequests: recentLogs.filter(log => log.status === 'ERROR').length,
    uniqueUsers: [...new Set(recentLogs.map(log => log.userId))].length,
    topUsers: getTopUsers(recentLogs),
    topEndpoints: getTopEndpoints(recentLogs),
    accessByRole: getAccessByRole(recentLogs),
    securityEvents: getSecurityEvents(recentLogs)
  };
  
  res.json({
    success: true,
    data: analytics
  });
});

// Helper functions for analytics
function getTopUsers(logs) {
  const userCounts = {};
  logs.forEach(log => {
    userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
  });
  
  return Object.entries(userCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, requestCount: count }));
}

function getTopEndpoints(logs) {
  const endpointCounts = {};
  logs.forEach(log => {
    const endpoint = `${log.method} ${log.path}`;
    endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
  });
  
  return Object.entries(endpointCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, requestCount: count }));
}

function getAccessByRole(logs) {
  // Mock role detection from logs (in production, this would be stored in logs)
  return {
    admin: logs.filter(log => log.userId.includes('admin')).length,
    vendor: logs.filter(log => log.userId.includes('vendor')).length,
    consumer: logs.filter(log => !log.userId.includes('admin') && !log.userId.includes('vendor')).length
  };
}

function getSecurityEvents(logs) {
  const securityEvents = logs.filter(log => 
    log.status === 'FORBIDDEN' || 
    (log.details && log.details.includes('permission'))
  );
  
  return {
    totalEvents: securityEvents.length,
    forbiddenAccess: securityEvents.filter(log => log.status === 'FORBIDDEN').length,
    permissionDenied: securityEvents.filter(log => log.details && log.details.includes('permission')).length,
    recentEvents: securityEvents.slice(-5).map(event => ({
      timestamp: event.timestamp,
      userId: event.userId,
      action: `${event.method} ${event.path}`,
      reason: event.details || 'Access denied'
    }))
  };
}

// Permission management endpoints
app.get('/api/v1/access/permissions', verifyToken, requirePermission('system:read'), (req, res) => {
  const permissionCategories = {
    users: {
      name: 'User Management',
      permissions: [
        { name: 'users:read', description: 'View user information' },
        { name: 'users:write', description: 'Create and update users' },
        { name: 'users:delete', description: 'Delete user accounts' }
      ]
    },
    vendors: {
      name: 'Vendor Management',
      permissions: [
        { name: 'vendors:read', description: 'View vendor profiles' },
        { name: 'vendors:write', description: 'Create and update vendor profiles' },
        { name: 'vendors:delete', description: 'Delete vendor accounts' },
        { name: 'vendors:approve', description: 'Approve vendor applications' }
      ]
    },
    consumers: {
      name: 'Consumer Management',
      permissions: [
        { name: 'consumers:read', description: 'View consumer profiles' },
        { name: 'consumers:write', description: 'Create and update consumer profiles' },
        { name: 'consumers:delete', description: 'Delete consumer accounts' }
      ]
    },
    ratings: {
      name: 'Rating & Review System',
      permissions: [
        { name: 'ratings:read', description: 'View ratings and reviews' },
        { name: 'ratings:write', description: 'Create and update ratings' },
        { name: 'ratings:delete', description: 'Delete ratings and reviews' },
        { name: 'ratings:moderate', description: 'Moderate and flag inappropriate content' }
      ]
    },
    system: {
      name: 'System Administration',
      permissions: [
        { name: 'system:read', description: 'View system status and metrics' },
        { name: 'system:write', description: 'Modify system configuration' },
        { name: 'system:backup', description: 'Create and manage backups' },
        { name: 'system:monitor', description: 'Access monitoring and alerting' }
      ]
    },
    analytics: {
      name: 'Analytics & Reporting',
      permissions: [
        { name: 'analytics:read', description: 'View analytics and reports' },
        { name: 'analytics:export', description: 'Export analytics data' }
      ]
    },
    audit: {
      name: 'Audit & Compliance',
      permissions: [
        { name: 'audit:read', description: 'View audit logs and access records' },
        { name: 'audit:export', description: 'Export audit data' }
      ]
    }
  };
  
  res.json({
    success: true,
    data: { permissionCategories }
  });
});

// Secure endpoint examples with different access levels

// Public endpoint (no authentication required)
app.get('/api/v1/public/vendors/featured', (req, res) => {
  logDataAccess('anonymous', 'GET', '/api/v1/public/vendors/featured', 'SUCCESS', req.ip);
  
  const featuredVendors = [
    {
      id: 'vendor_1',
      businessName: 'Rodriguez Plumbing Services',
      rating: 4.8,
      totalReviews: 127,
      services: ['plumbing', 'emergency_repair'],
      verified: true
    }
  ];
  
  res.json({
    success: true,
    data: { vendors: featuredVendors }
  });
});

// Consumer-only endpoint
app.get('/api/v1/consumer/dashboard', verifyToken, requireRole('consumer'), (req, res) => {
  const dashboard = {
    userId: req.user.id,
    activeServices: 2,
    completedServices: 15,
    savedVendors: 8,
    recentActivity: [
      {
        type: 'service_completed',
        description: 'Plumbing service completed by Rodriguez Plumbing',
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  res.json({
    success: true,
    data: dashboard
  });
});

// Vendor-only endpoint
app.get('/api/v1/vendor/dashboard', verifyToken, requireRole('vendor'), (req, res) => {
  const dashboard = {
    vendorId: req.user.id,
    activeJobs: 3,
    completedJobs: 45,
    averageRating: 4.7,
    monthlyEarnings: 2850.00,
    recentBookings: [
      {
        serviceType: 'plumbing',
        customerName: 'John Doe',
        scheduledDate: '2024-10-04T10:00:00Z',
        status: 'confirmed'
      }
    ]
  };
  
  res.json({
    success: true,
    data: dashboard
  });
});

// Admin-only endpoint
app.get('/api/v1/admin/system/overview', verifyToken, requireRole('admin'), (req, res) => {
  const systemOverview = {
    totalUsers: 1250,
    totalVendors: 890,
    totalConsumers: 360,
    activeServices: 45,
    systemHealth: 'healthy',
    uptime: process.uptime(),
    lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    securityAlerts: 0
  };
  
  res.json({
    success: true,
    data: systemOverview
  });
});

// Multi-role endpoint (vendor or admin)
app.get('/api/v1/vendor/analytics/:vendorId', verifyToken, requireRole(['vendor', 'admin']), (req, res) => {
  const { vendorId } = req.params;
  
  // Additional check: vendors can only access their own analytics
  if (req.user.role === 'vendor' && req.user.id !== vendorId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Can only view your own analytics',
      error: { code: 'FORBIDDEN', details: 'Insufficient permissions for this resource' }
    });
  }
  
  const analytics = {
    vendorId,
    period: '30d',
    totalServices: 45,
    averageRating: 4.7,
    revenue: 12500.00,
    customerSatisfaction: 94.2,
    responseTime: '2.3 hours',
    completionRate: 98.5
  };
  
  res.json({
    success: true,
    data: analytics
  });
});

// Permission-based endpoint
app.delete('/api/v1/ratings/:ratingId', verifyToken, requirePermission('ratings:delete'), (req, res) => {
  const { ratingId } = req.params;
  const { reason } = req.body;
  
  logDataAccess(req.user.id, 'DELETE', `/api/v1/ratings/${ratingId}`, 'SUCCESS', req.ip, 
    `Rating deleted. Reason: ${reason || 'No reason provided'}`);
  
  res.json({
    success: true,
    message: 'Rating deleted successfully',
    data: {
      ratingId,
      deletedBy: req.user.id,
      deletedAt: new Date().toISOString(),
      reason: reason || 'Administrative action'
    }
  });
});

// ============================================================================
// COMMENT & REVIEW FUNCTIONALITY
// ============================================================================

// Mock data storage
const reviews = [];
const reviewComments = [];

// Add Comment to Review
app.post('/api/v1/reviews/:reviewId/comments', verifyToken, (req, res) => {
  const { reviewId } = req.params;
  const { content, parentCommentId = null } = req.body;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Comment content is required'
    });
  }
  
  const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  const comment = {
    id: commentId,
    reviewId,
    parentCommentId,
    content: content.trim(),
    authorId: req.user.id,
    authorName: 'User Name', // In production, get from user profile
    authorAvatar: 'https://i.pravatar.cc/100?img=1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEdited: false,
    likes: 0,
    replies: [],
    isModerated: false,
    moderationStatus: 'approved'
  };
  
  reviewComments.push(comment);
  
  // If this is a reply, add to parent's replies
  if (parentCommentId) {
    const parentComment = reviewComments.find(c => c.id === parentCommentId);
    if (parentComment) {
      parentComment.replies.push(commentId);
    }
  }
  
  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: comment
  });
});

// Get Comments for Review
app.get('/api/v1/reviews/:reviewId/comments', (req, res) => {
  const { reviewId } = req.params;
  const { limit = 20, offset = 0, sortBy = 'newest' } = req.query;
  
  let comments = reviewComments.filter(comment => 
    comment.reviewId === reviewId && !comment.parentCommentId
  );
  
  // Sort comments
  if (sortBy === 'newest') {
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'oldest') {
    comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortBy === 'likes') {
    comments.sort((a, b) => b.likes - a.likes);
  }
  
  // Add replies to each comment
  comments = comments.map(comment => ({
    ...comment,
    replies: comment.replies.map(replyId => 
      reviewComments.find(c => c.id === replyId)
    ).filter(Boolean)
  }));
  
  // Apply pagination
  const paginatedComments = comments.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      comments: paginatedComments,
      total: comments.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < comments.length
    }
  });
});

// Update Comment
app.put('/api/v1/comments/:commentId', verifyToken, (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  
  const comment = reviewComments.find(c => c.id === commentId);
  
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }
  
  if (comment.authorId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own comments'
    });
  }
  
  comment.content = content.trim();
  comment.updatedAt = new Date().toISOString();
  comment.isEdited = true;
  
  res.json({
    success: true,
    message: 'Comment updated successfully',
    data: comment
  });
});

// Delete Comment
app.delete('/api/v1/comments/:commentId', verifyToken, (req, res) => {
  const { commentId } = req.params;
  
  const commentIndex = reviewComments.findIndex(c => c.id === commentId);
  
  if (commentIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }
  
  const comment = reviewComments[commentIndex];
  
  if (comment.authorId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own comments'
    });
  }
  
  // Remove comment and its replies
  reviewComments.splice(commentIndex, 1);
  
  // Remove replies
  comment.replies.forEach(replyId => {
    const replyIndex = reviewComments.findIndex(c => c.id === replyId);
    if (replyIndex !== -1) {
      reviewComments.splice(replyIndex, 1);
    }
  });
  
  res.json({
    success: true,
    message: 'Comment deleted successfully',
    data: {
      commentId,
      deletedAt: new Date().toISOString()
    }
  });
});

// Like/Unlike Comment
app.post('/api/v1/comments/:commentId/like', verifyToken, (req, res) => {
  const { commentId } = req.params;
  
  const comment = reviewComments.find(c => c.id === commentId);
  
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }
  
  // Toggle like (simplified - in production, track individual user likes)
  comment.likes = (comment.likes || 0) + 1;
  
  res.json({
    success: true,
    message: 'Comment liked successfully',
    data: {
      commentId,
      likes: comment.likes,
      likedAt: new Date().toISOString()
    }
  });
});

// Enhanced Review Creation with Comments Support
app.post('/api/v1/reviews', verifyToken, (req, res) => {
  const { 
    vendorId, 
    serviceId, 
    ratings, 
    title, 
    content, 
    images = [],
    isAnonymous = false 
  } = req.body;
  
  const reviewId = `review_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  const review = {
    id: reviewId,
    vendorId,
    serviceId,
    consumerId: req.user.id,
    consumerName: isAnonymous ? 'Anonymous User' : 'John Doe',
    consumerAvatar: isAnonymous ? null : 'https://i.pravatar.cc/100?img=1',
    title: title || '',
    content: content || '',
    ratings: {
      cost: ratings.cost || 5,
      quality: ratings.quality || 5,
      timeliness: ratings.timeliness || 5,
      professionalism: ratings.professionalism || 5
    },
    overallRating: ((ratings.cost + ratings.quality + ratings.timeliness + ratings.professionalism) / 4).toFixed(1),
    images,
    isAnonymous,
    isVerified: true,
    helpfulCount: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'published',
    moderationStatus: 'approved'
  };
  
  reviews.push(review);
  
  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review
  });
});

// Get Reviews with Comments Count
app.get('/api/v1/reviews', (req, res) => {
  const { 
    vendorId, 
    consumerId, 
    minRating = 1, 
    maxRating = 5,
    hasComments = null,
    sortBy = 'newest',
    limit = 20,
    offset = 0
  } = req.query;
  
  let filteredReviews = [...reviews];
  
  // Apply filters
  if (vendorId) {
    filteredReviews = filteredReviews.filter(r => r.vendorId === vendorId);
  }
  if (consumerId) {
    filteredReviews = filteredReviews.filter(r => r.consumerId === consumerId);
  }
  
  // Add comment counts
  filteredReviews = filteredReviews.map(review => ({
    ...review,
    commentCount: reviewComments.filter(c => c.reviewId === review.id).length
  }));
  
  // Filter by comment presence
  if (hasComments !== null) {
    const hasCommentsFilter = hasComments === 'true';
    filteredReviews = filteredReviews.filter(r => 
      hasCommentsFilter ? r.commentCount > 0 : r.commentCount === 0
    );
  }
  
  // Sort reviews
  if (sortBy === 'newest') {
    filteredReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'oldest') {
    filteredReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortBy === 'rating_high') {
    filteredReviews.sort((a, b) => b.overallRating - a.overallRating);
  } else if (sortBy === 'rating_low') {
    filteredReviews.sort((a, b) => a.overallRating - b.overallRating);
  } else if (sortBy === 'helpful') {
    filteredReviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
  }
  
  // Apply pagination
  const paginatedReviews = filteredReviews.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      reviews: paginatedReviews,
      total: filteredReviews.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < filteredReviews.length,
      averageRating: filteredReviews.length > 0 
        ? (filteredReviews.reduce((sum, r) => sum + parseFloat(r.overallRating), 0) / filteredReviews.length).toFixed(1)
        : 0
    }
  });
});

// Mark Review as Helpful
app.post('/api/v1/reviews/:reviewId/helpful', verifyToken, (req, res) => {
  const { reviewId } = req.params;
  
  const review = reviews.find(r => r.id === reviewId);
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }
  
  review.helpfulCount = (review.helpfulCount || 0) + 1;
  
  res.json({
    success: true,
    message: 'Review marked as helpful',
    data: {
      reviewId,
      helpfulCount: review.helpfulCount,
      markedAt: new Date().toISOString()
    }
  });
});

// Review Moderation (Admin only)
app.put('/api/v1/reviews/:reviewId/moderate', verifyToken, requireRole('admin'), (req, res) => {
  const { reviewId } = req.params;
  const { action, reason } = req.body; // action: 'approve', 'reject', 'flag'
  
  const review = reviews.find(r => r.id === reviewId);
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }
  
  review.moderationStatus = action;
  review.moderationReason = reason || null;
  review.moderatedBy = req.user.id;
  review.moderatedAt = new Date().toISOString();
  
  if (action === 'reject') {
    review.status = 'rejected';
  } else if (action === 'approve') {
    review.status = 'published';
  }
  
  res.json({
    success: true,
    message: `Review ${action}ed successfully`,
    data: {
      reviewId,
      moderationStatus: review.moderationStatus,
      moderatedAt: review.moderatedAt,
      reason
    }
  });
});

// ============================================================================
// ENHANCED CONTACT MANAGEMENT & COMMUNICATION SYSTEM
// ============================================================================

// Phone directory and contact management
const phoneContacts = [];
const deviceSyncData = {};
const smsTemplates = {};
const emailTemplates = {};

// Phone Directory Access and Integration
app.post('/api/v1/contacts/phone-directory/access', verifyToken, (req, res) => {
  const { deviceId, platform, permissions } = req.body;
  
  // Mock phone directory access (in production, this would interface with device APIs)
  const mockContacts = [
    {
      id: 'contact_1',
      name: 'John Smith',
      phoneNumbers: [
        { type: 'mobile', number: '+1234567890', primary: true },
        { type: 'work', number: '+1234567891', primary: false }
      ],
      emails: ['john.smith@email.com'],
      lastUpdated: new Date().toISOString(),
      source: 'phone_directory'
    },
    {
      id: 'contact_2', 
      name: 'Sarah Johnson',
      phoneNumbers: [
        { type: 'mobile', number: '+1234567892', primary: true }
      ],
      emails: ['sarah.j@email.com'],
      lastUpdated: new Date().toISOString(),
      source: 'phone_directory'
    }
  ];
  
  // Store contacts for this user
  phoneContacts.push(...mockContacts.map(contact => ({
    ...contact,
    userId: req.user.id,
    deviceId,
    platform,
    syncedAt: new Date().toISOString()
  })));
  
  res.json({
    success: true,
    message: 'Phone directory accessed successfully',
    data: {
      contactsFound: mockContacts.length,
      contacts: mockContacts,
      accessGranted: true,
      permissions: permissions || ['read_contacts'],
      deviceId,
      platform
    }
  });
});

// Contact Synchronization Across Devices
app.post('/api/v1/contacts/sync/devices', verifyToken, (req, res) => {
  const { deviceId, platform, lastSyncTime, contactsHash } = req.body;
  
  const userId = req.user.id;
  const currentTime = new Date().toISOString();
  
  // Get user's contacts from all devices
  const userContacts = phoneContacts.filter(contact => contact.userId === userId);
  
  // Determine sync strategy
  const syncData = {
    userId,
    deviceId,
    platform,
    lastSyncTime: lastSyncTime || null,
    currentSyncTime: currentTime,
    contactsToSync: [],
    conflictsResolved: 0,
    newContacts: 0,
    updatedContacts: 0
  };
  
  if (!lastSyncTime) {
    // First sync - send all contacts
    syncData.contactsToSync = userContacts;
    syncData.newContacts = userContacts.length;
  } else {
    // Incremental sync - only changed contacts
    const changedContacts = userContacts.filter(contact => 
      new Date(contact.lastUpdated) > new Date(lastSyncTime)
    );
    syncData.contactsToSync = changedContacts;
    syncData.updatedContacts = changedContacts.length;
  }
  
  // Store sync metadata
  if (!deviceSyncData[userId]) {
    deviceSyncData[userId] = {};
  }
  deviceSyncData[userId][deviceId] = {
    platform,
    lastSyncTime: currentTime,
    contactCount: userContacts.length,
    syncHistory: (deviceSyncData[userId][deviceId]?.syncHistory || []).concat([{
      timestamp: currentTime,
      contactsCount: syncData.contactsToSync.length,
      syncType: lastSyncTime ? 'incremental' : 'full'
    }]).slice(-10) // Keep last 10 sync records
  };
  
  res.json({
    success: true,
    message: 'Contact synchronization completed',
    data: syncData
  });
});

// Automatic Phone Type Detection
app.post('/api/v1/contacts/phone/detect-type', (req, res) => {
  const { phoneNumber, countryCode = 'US' } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }
  
  // Phone type detection logic
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  let detectedType = 'unknown';
  let carrier = 'unknown';
  let isValid = false;
  
  // Mock detection logic (in production, use services like Twilio Lookup API)
  if (cleanNumber.length === 10 || (cleanNumber.length === 11 && cleanNumber.startsWith('1'))) {
    isValid = true;
    
    // Mock carrier detection based on area code patterns
    const areaCode = cleanNumber.slice(-10, -7);
    const carrierMap = {
      '555': { carrier: 'Verizon', type: 'mobile' },
      '123': { carrier: 'AT&T', type: 'mobile' },
      '456': { carrier: 'T-Mobile', type: 'mobile' },
      '789': { carrier: 'Sprint', type: 'mobile' },
      '800': { carrier: 'Toll-Free', type: 'landline' },
      '888': { carrier: 'Toll-Free', type: 'landline' }
    };
    
    const detection = carrierMap[areaCode] || { carrier: 'Unknown Carrier', type: 'mobile' };
    carrier = detection.carrier;
    detectedType = detection.type;
  }
  
  const result = {
    phoneNumber,
    cleanNumber,
    countryCode,
    isValid,
    type: detectedType,
    carrier,
    canReceiveSMS: detectedType === 'mobile',
    canReceiveCalls: true,
    detectedAt: new Date().toISOString(),
    confidence: isValid ? 0.95 : 0.1
  };
  
  res.json({
    success: true,
    message: 'Phone type detection completed',
    data: result
  });
});

// SMS Template Management
app.post('/api/v1/templates/sms/create', verifyToken, (req, res) => {
  const { name, content, category, variables, isDefault } = req.body;
  
  const templateId = `sms_template_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  const template = {
    id: templateId,
    name,
    content,
    category: category || 'general',
    variables: variables || [],
    isDefault: isDefault || false,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    isActive: true
  };
  
  smsTemplates[templateId] = template;
  
  res.status(201).json({
    success: true,
    message: 'SMS template created successfully',
    data: template
  });
});

app.get('/api/v1/templates/sms', verifyToken, (req, res) => {
  const { category, isActive = true } = req.query;
  
  let templates = Object.values(smsTemplates);
  
  if (category) {
    templates = templates.filter(t => t.category === category);
  }
  
  if (isActive !== undefined) {
    templates = templates.filter(t => t.isActive === (isActive === 'true'));
  }
  
  const templateCategories = {
    invitation: {
      name: 'Invitation Templates',
      templates: templates.filter(t => t.category === 'invitation')
    },
    reminder: {
      name: 'Reminder Templates', 
      templates: templates.filter(t => t.category === 'reminder')
    },
    notification: {
      name: 'Notification Templates',
      templates: templates.filter(t => t.category === 'notification')
    },
    general: {
      name: 'General Templates',
      templates: templates.filter(t => t.category === 'general')
    }
  };
  
  res.json({
    success: true,
    data: {
      templates,
      categories: templateCategories,
      totalCount: templates.length
    }
  });
});

// Email Template Customization
app.post('/api/v1/templates/email/create', verifyToken, (req, res) => {
  const { 
    name, 
    subject, 
    htmlContent, 
    textContent, 
    category, 
    variables, 
    isDefault,
    previewImage 
  } = req.body;
  
  const templateId = `email_template_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  const template = {
    id: templateId,
    name,
    subject,
    htmlContent,
    textContent: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    category: category || 'general',
    variables: variables || [],
    isDefault: isDefault || false,
    previewImage: previewImage || null,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    isActive: true,
    styling: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px'
    }
  };
  
  emailTemplates[templateId] = template;
  
  res.status(201).json({
    success: true,
    message: 'Email template created successfully',
    data: template
  });
});

app.get('/api/v1/templates/email', verifyToken, (req, res) => {
  const { category, isActive = true } = req.query;
  
  let templates = Object.values(emailTemplates);
  
  if (category) {
    templates = templates.filter(t => t.category === category);
  }
  
  if (isActive !== undefined) {
    templates = templates.filter(t => t.isActive === (isActive === 'true'));
  }
  
  res.json({
    success: true,
    data: {
      templates,
      totalCount: templates.length,
      categories: ['invitation', 'welcome', 'notification', 'reminder', 'marketing', 'general']
    }
  });
});

// Template Preview and Testing
app.post('/api/v1/templates/:type/:templateId/preview', verifyToken, (req, res) => {
  const { type, templateId } = req.params;
  const { variables = {} } = req.body;
  
  const templates = type === 'sms' ? smsTemplates : emailTemplates;
  const template = templates[templateId];
  
  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }
  
  // Replace variables in template content
  let processedContent = template.content || template.htmlContent;
  let processedSubject = template.subject || '';
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedContent = processedContent.replace(regex, value);
    processedSubject = processedSubject.replace(regex, value);
  });
  
  const preview = {
    templateId,
    type,
    processedContent,
    processedSubject: type === 'email' ? processedSubject : undefined,
    variables,
    previewGeneratedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Template preview generated',
    data: preview
  });
});

// ============================================================================
// COMPREHENSIVE VENDOR MANAGEMENT SYSTEM
// ============================================================================

// Vendor Profile Creation and Setup
app.post('/api/v1/vendors/profile', (req, res) => {
  const { 
    firstName, 
    lastName, 
    businessName, 
    email, 
    phone, 
    category, 
    services, 
    description,
    location,
    hourlyRate,
    availability,
    portfolio,
    certifications,
    insurance
  } = req.body;
  
  console.log('Creating vendor profile:', { businessName, category, services });
  
  // Simulate profile creation with validation
  const vendorProfile = {
    id: `vendor_${Date.now()}`,
    firstName,
    lastName,
    businessName,
    email,
    phone,
    category,
    services: services || [],
    description,
    location,
    hourlyRate: hourlyRate || 0,
    availability: availability || 'Available',
    portfolio: portfolio || [],
    certifications: certifications || [],
    insurance: insurance || {},
    profileImage: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 20)}`,
    rating: 0,
    reviewCount: 0,
    isVerified: false,
    isOnline: true,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    onboardingStatus: 'profile_created',
    performanceMetrics: {
      completedJobs: 0,
      responseTime: 0,
      customerSatisfaction: 0,
      reliability: 0
    }
  };
  
  res.status(201).json({
    success: true,
    message: 'Vendor profile created successfully',
    data: {
      vendor: vendorProfile,
      nextSteps: [
        'Complete business verification',
        'Upload portfolio images',
        'Add service descriptions',
        'Set availability schedule'
      ]
    }
  });
});

// Get Vendor Profile
app.get('/api/v1/vendors/:vendorId/profile', (req, res) => {
  const { vendorId } = req.params;
  
  console.log('Getting vendor profile:', vendorId);
  
  // Mock vendor profile data
  const vendorProfile = {
    id: vendorId,
    firstName: 'Mike',
    lastName: 'Rodriguez',
    businessName: 'Rodriguez Plumbing Services',
    email: 'mike@rodriguezplumbing.com',
    phone: '+1234567890',
    category: 'Plumbing',
    services: ['Plumbing', 'Pipe Repair', 'Emergency Service', 'Bathroom Renovation'],
    description: 'Professional plumbing services with over 10 years of experience. Licensed and insured.',
    location: 'San Francisco, CA',
    hourlyRate: 85,
    availability: 'Available Now',
    portfolio: [
      {
        id: 'portfolio_1',
        title: 'Bathroom Renovation',
        description: 'Complete bathroom renovation including plumbing fixtures',
        images: ['https://picsum.photos/400/300?random=1', 'https://picsum.photos/400/300?random=2'],
        completedAt: '2024-09-15'
      },
      {
        id: 'portfolio_2',
        title: 'Kitchen Plumbing Installation',
        description: 'New kitchen plumbing installation with modern fixtures',
        images: ['https://picsum.photos/400/300?random=3', 'https://picsum.photos/400/300?random=4'],
        completedAt: '2024-08-20'
      }
    ],
    certifications: [
      {
        id: 'cert_1',
        name: 'Licensed Plumber',
        issuer: 'California State Board',
        number: 'PL-12345',
        expiresAt: '2025-12-31'
      },
      {
        id: 'cert_2',
        name: 'Backflow Prevention Certification',
        issuer: 'AWWA',
        number: 'BP-67890',
        expiresAt: '2025-06-30'
      }
    ],
    insurance: {
      liability: {
        provider: 'State Farm',
        policyNumber: 'SF-123456',
        coverage: 1000000,
        expiresAt: '2025-03-15'
      },
      bonded: {
        provider: 'Surety Bonds Co',
        bondNumber: 'SB-789012',
        amount: 50000,
        expiresAt: '2025-03-15'
      }
    },
    profileImage: 'https://i.pravatar.cc/100?img=8',
    rating: 4.9,
    reviewCount: 15,
    isVerified: true,
    isOnline: true,
    tags: ['licensed', 'insured', 'emergency-service', 'experienced'],
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: new Date().toISOString(),
    onboardingStatus: 'completed',
    performanceMetrics: {
      completedJobs: 127,
      responseTime: 15, // minutes
      customerSatisfaction: 4.9,
      reliability: 98.5 // percentage
    }
  };
  
  res.json({
    success: true,
    data: {
      vendor: vendorProfile
    }
  });
});

// Update Vendor Profile
app.put('/api/v1/vendors/:vendorId/profile', (req, res) => {
  const { vendorId } = req.params;
  const updateData = req.body;
  
  console.log('Updating vendor profile:', vendorId, Object.keys(updateData));
  
  res.json({
    success: true,
    message: 'Vendor profile updated successfully',
    data: {
      vendorId,
      updatedFields: Object.keys(updateData),
      updatedAt: new Date().toISOString()
    }
  });
});

// Vendor Portfolio Management
app.post('/api/v1/vendors/:vendorId/portfolio', (req, res) => {
  const { vendorId } = req.params;
  const { title, description, images, serviceCategory, completedAt } = req.body;
  
  console.log('Adding portfolio item:', { vendorId, title, serviceCategory });
  
  const portfolioItem = {
    id: `portfolio_${Date.now()}`,
    vendorId,
    title,
    description,
    images: images || [],
    serviceCategory,
    completedAt: completedAt || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'Portfolio item added successfully',
    data: {
      portfolioItem
    }
  });
});

// Get Vendor Portfolio
app.get('/api/v1/vendors/:vendorId/portfolio', (req, res) => {
  const { vendorId } = req.params;
  const { category, limit = 10, offset = 0 } = req.query;
  
  console.log('Getting vendor portfolio:', { vendorId, category, limit, offset });
  
  const portfolioItems = [
    {
      id: 'portfolio_1',
      vendorId,
      title: 'Modern Kitchen Renovation',
      description: 'Complete kitchen renovation with modern appliances and fixtures',
      images: ['https://picsum.photos/400/300?random=1', 'https://picsum.photos/400/300?random=2'],
      serviceCategory: 'Kitchen Renovation',
      completedAt: '2024-09-15T00:00:00.000Z',
      createdAt: '2024-09-16T10:30:00.000Z'
    },
    {
      id: 'portfolio_2',
      vendorId,
      title: 'Bathroom Plumbing Upgrade',
      description: 'Upgraded bathroom plumbing with new fixtures and improved water pressure',
      images: ['https://picsum.photos/400/300?random=3', 'https://picsum.photos/400/300?random=4'],
      serviceCategory: 'Plumbing',
      completedAt: '2024-08-20T00:00:00.000Z',
      createdAt: '2024-08-21T14:15:00.000Z'
    }
  ];
  
  // Filter by category if specified
  const filteredItems = category 
    ? portfolioItems.filter(item => item.serviceCategory.toLowerCase().includes(category.toLowerCase()))
    : portfolioItems;
  
  // Apply pagination
  const paginatedItems = filteredItems.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      portfolioItems: paginatedItems,
      total: filteredItems.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (offset + parseInt(limit)) < filteredItems.length
    }
  });
});

// Automated Vendor Onboarding Workflow
app.post('/api/v1/vendors/onboarding/start', (req, res) => {
  const { email, businessName, category } = req.body;
  
  console.log('Starting vendor onboarding:', { email, businessName, category });
  
  const onboardingWorkflow = {
    id: `onboarding_${Date.now()}`,
    email,
    businessName,
    category,
    status: 'started',
    currentStep: 1,
    totalSteps: 6,
    steps: [
      {
        step: 1,
        title: 'Basic Information',
        description: 'Provide basic business information',
        status: 'in_progress',
        required: true
      },
      {
        step: 2,
        title: 'Business Verification',
        description: 'Upload business license and insurance documents',
        status: 'pending',
        required: true
      },
      {
        step: 3,
        title: 'Service Categories',
        description: 'Select your service categories and specializations',
        status: 'pending',
        required: true
      },
      {
        step: 4,
        title: 'Portfolio Setup',
        description: 'Add photos and descriptions of your work',
        status: 'pending',
        required: false
      },
      {
        step: 5,
        title: 'Pricing & Availability',
        description: 'Set your rates and availability schedule',
        status: 'pending',
        required: true
      },
      {
        step: 6,
        title: 'Profile Review',
        description: 'Review and submit your profile for approval',
        status: 'pending',
        required: true
      }
    ],
    createdAt: new Date().toISOString(),
    estimatedCompletionTime: '15-20 minutes'
  };
  
  res.status(201).json({
    success: true,
    message: 'Vendor onboarding workflow started',
    data: {
      onboarding: onboardingWorkflow,
      nextAction: 'Complete basic information form'
    }
  });
});

// Update Onboarding Step
app.put('/api/v1/vendors/onboarding/:onboardingId/step/:stepNumber', (req, res) => {
  const { onboardingId, stepNumber } = req.params;
  const stepData = req.body;
  
  console.log('Updating onboarding step:', { onboardingId, stepNumber, stepData });
  
  const updatedStep = {
    step: parseInt(stepNumber),
    status: 'completed',
    completedAt: new Date().toISOString(),
    data: stepData
  };
  
  // Determine next step
  const nextStep = parseInt(stepNumber) + 1;
  const isCompleted = nextStep > 6;
  
  res.json({
    success: true,
    message: `Onboarding step ${stepNumber} completed successfully`,
    data: {
      updatedStep,
      nextStep: isCompleted ? null : nextStep,
      isCompleted,
      completionPercentage: Math.round((parseInt(stepNumber) / 6) * 100)
    }
  });
});

// Get Onboarding Status
app.get('/api/v1/vendors/onboarding/:onboardingId', (req, res) => {
  const { onboardingId } = req.params;
  
  console.log('Getting onboarding status:', onboardingId);
  
  const onboardingStatus = {
    id: onboardingId,
    status: 'in_progress',
    currentStep: 3,
    totalSteps: 6,
    completionPercentage: 50,
    steps: [
      { step: 1, title: 'Basic Information', status: 'completed', completedAt: '2024-10-01T10:00:00.000Z' },
      { step: 2, title: 'Business Verification', status: 'completed', completedAt: '2024-10-01T11:30:00.000Z' },
      { step: 3, title: 'Service Categories', status: 'in_progress', startedAt: '2024-10-01T12:00:00.000Z' },
      { step: 4, title: 'Portfolio Setup', status: 'pending' },
      { step: 5, title: 'Pricing & Availability', status: 'pending' },
      { step: 6, title: 'Profile Review', status: 'pending' }
    ],
    estimatedTimeRemaining: '10-15 minutes'
  };
  
  res.json({
    success: true,
    data: {
      onboarding: onboardingStatus
    }
  });
});

// Vendor Categorization System
app.get('/api/v1/vendors/categories', (req, res) => {
  console.log('Getting vendor categories');
  
  const categories = [
    {
      id: 'plumbing',
      name: 'Plumbing',
      description: 'Plumbing installation, repair, and maintenance services',
      subcategories: [
        'Pipe Repair', 'Drain Cleaning', 'Water Heater', 'Bathroom Plumbing', 
        'Kitchen Plumbing', 'Emergency Plumbing', 'Sewer Line', 'Leak Detection'
      ],
      vendorCount: 45,
      averageRate: 85,
      icon: 'plumbing-icon'
    },
    {
      id: 'electrical',
      name: 'Electrical',
      description: 'Electrical installation, repair, and safety services',
      subcategories: [
        'Wiring', 'Panel Upgrades', 'Outlet Installation', 'Lighting', 
        'Electrical Repair', 'Safety Inspections', 'Smart Home', 'Generator Installation'
      ],
      vendorCount: 38,
      averageRate: 95,
      icon: 'electrical-icon'
    },
    {
      id: 'hvac',
      name: 'HVAC',
      description: 'Heating, ventilation, and air conditioning services',
      subcategories: [
        'AC Repair', 'Heating Repair', 'Installation', 'Maintenance', 
        'Duct Cleaning', 'Thermostat', 'Air Quality', 'Energy Efficiency'
      ],
      vendorCount: 32,
      averageRate: 90,
      icon: 'hvac-icon'
    },
    {
      id: 'handyman',
      name: 'Handyman',
      description: 'General repair and maintenance services',
      subcategories: [
        'General Repairs', 'Furniture Assembly', 'Painting', 'Drywall', 
        'Flooring', 'Carpentry', 'Home Maintenance', 'Small Projects'
      ],
      vendorCount: 67,
      averageRate: 65,
      icon: 'handyman-icon'
    },
    {
      id: 'landscaping',
      name: 'Landscaping',
      description: 'Outdoor and garden maintenance services',
      subcategories: [
        'Lawn Care', 'Garden Design', 'Tree Service', 'Irrigation', 
        'Hardscaping', 'Seasonal Cleanup', 'Pest Control', 'Outdoor Lighting'
      ],
      vendorCount: 29,
      averageRate: 55,
      icon: 'landscaping-icon'
    }
  ];
  
  res.json({
    success: true,
    data: {
      categories,
      totalCategories: categories.length,
      totalVendors: categories.reduce((sum, cat) => sum + cat.vendorCount, 0)
    }
  });
});

// Vendor Tagging and Labeling
app.post('/api/v1/vendors/:vendorId/tags', (req, res) => {
  const { vendorId } = req.params;
  const { tags, action = 'add' } = req.body;
  
  console.log('Managing vendor tags:', { vendorId, tags, action });
  
  res.json({
    success: true,
    message: `Tags ${action === 'add' ? 'added to' : 'removed from'} vendor successfully`,
    data: {
      vendorId,
      tags,
      action,
      updatedAt: new Date().toISOString()
    }
  });
});

// Get Available Tags
app.get('/api/v1/vendors/tags', (req, res) => {
  console.log('Getting available vendor tags');
  
  const tags = [
    { name: 'licensed', description: 'Licensed professional', count: 89 },
    { name: 'insured', description: 'Fully insured', count: 76 },
    { name: 'bonded', description: 'Bonded contractor', count: 45 },
    { name: 'emergency-service', description: 'Provides emergency services', count: 34 },
    { name: 'eco-friendly', description: 'Uses eco-friendly practices', count: 28 },
    { name: 'warranty', description: 'Offers service warranty', count: 67 },
    { name: 'experienced', description: '10+ years experience', count: 52 },
    { name: 'certified', description: 'Industry certified', count: 41 },
    { name: 'background-checked', description: 'Background verified', count: 73 },
    { name: 'top-rated', description: 'Top rated vendor', count: 23 }
  ];
  
  res.json({
    success: true,
    data: {
      tags,
      totalTags: tags.length
    }
  });
});

// Enhanced Vendor Search and Discovery
app.get('/api/v1/vendors/discover', (req, res) => {
  const { 
    category, 
    location, 
    radius = 25, 
    minRating = 0, 
    maxRate, 
    tags, 
    availability,
    sortBy = 'rating',
    limit = 20,
    offset = 0
  } = req.query;
  
  console.log('Vendor discovery:', { category, location, radius, minRating, sortBy });
  
  const discoveredVendors = [
    {
      id: 'vendor_1',
      firstName: 'Mike',
      lastName: 'Rodriguez',
      businessName: 'Rodriguez Plumbing Services',
      category: 'Plumbing',
      services: ['Plumbing', 'Pipe Repair', 'Emergency Service'],
      rating: 4.9,
      reviewCount: 15,
      profileImage: 'https://i.pravatar.cc/100?img=8',
      location: 'San Francisco, CA',
      distance: 2.5,
      hourlyRate: 85,
      availability: 'Available Now',
      tags: ['licensed', 'insured', 'emergency-service'],
      isVerified: true,
      isOnline: true,
      responseTime: 15,
      completedJobs: 127,
      matchScore: 95
    },
    {
      id: 'vendor_2',
      firstName: 'Jennifer',
      lastName: 'Chen',
      businessName: 'Chen Electric Solutions',
      category: 'Electrical',
      services: ['Electrical', 'Wiring', 'Panel Upgrades', 'Smart Home'],
      rating: 4.8,
      reviewCount: 22,
      profileImage: 'https://i.pravatar.cc/100?img=5',
      location: 'Oakland, CA',
      distance: 1.8,
      hourlyRate: 95,
      availability: 'Available Today',
      tags: ['licensed', 'certified', 'warranty'],
      isVerified: true,
      isOnline: true,
      responseTime: 12,
      completedJobs: 89,
      matchScore: 92
    },
    {
      id: 'vendor_3',
      firstName: 'David',
      lastName: 'Kim',
      businessName: 'Kim HVAC Services',
      category: 'HVAC',
      services: ['AC Repair', 'Heating', 'Installation', 'Maintenance'],
      rating: 4.7,
      reviewCount: 18,
      profileImage: 'https://i.pravatar.cc/100?img=12',
      location: 'San Jose, CA',
      distance: 3.2,
      hourlyRate: 90,
      availability: 'Available Tomorrow',
      tags: ['licensed', 'insured', 'eco-friendly'],
      isVerified: true,
      isOnline: false,
      responseTime: 20,
      completedJobs: 156,
      matchScore: 88
    }
  ];
  
  // Apply filters
  let filteredVendors = discoveredVendors;
  
  if (category) {
    filteredVendors = filteredVendors.filter(v => 
      v.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  if (minRating) {
    filteredVendors = filteredVendors.filter(v => v.rating >= parseFloat(minRating));
  }
  
  if (maxRate) {
    filteredVendors = filteredVendors.filter(v => v.hourlyRate <= parseFloat(maxRate));
  }
  
  if (tags) {
    const tagList = tags.split(',');
    filteredVendors = filteredVendors.filter(v => 
      tagList.some(tag => v.tags.includes(tag.trim()))
    );
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'rating':
      filteredVendors.sort((a, b) => b.rating - a.rating);
      break;
    case 'distance':
      filteredVendors.sort((a, b) => a.distance - b.distance);
      break;
    case 'rate':
      filteredVendors.sort((a, b) => a.hourlyRate - b.hourlyRate);
      break;
    case 'match':
      filteredVendors.sort((a, b) => b.matchScore - a.matchScore);
      break;
  }
  
  // Apply pagination
  const paginatedVendors = filteredVendors.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      vendors: paginatedVendors,
      total: filteredVendors.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (offset + parseInt(limit)) < filteredVendors.length,
      filters: {
        category,
        location,
        radius: parseInt(radius),
        minRating: parseFloat(minRating),
        maxRate: maxRate ? parseFloat(maxRate) : null,
        tags: tags ? tags.split(',') : [],
        sortBy
      }
    }
  });
});

// Vendor Performance Tracking
app.get('/api/v1/vendors/:vendorId/performance', (req, res) => {
  const { vendorId } = req.params;
  const { period = '30d' } = req.query;
  
  console.log('Getting vendor performance:', { vendorId, period });
  
  const performanceData = {
    vendorId,
    period,
    metrics: {
      completedJobs: {
        current: 12,
        previous: 8,
        change: 50,
        trend: 'up'
      },
      averageRating: {
        current: 4.8,
        previous: 4.6,
        change: 4.3,
        trend: 'up'
      },
      responseTime: {
        current: 15, // minutes
        previous: 22,
        change: -31.8,
        trend: 'down' // lower is better
      },
      customerSatisfaction: {
        current: 96.5, // percentage
        previous: 94.2,
        change: 2.4,
        trend: 'up'
      },
      reliability: {
        current: 98.5, // percentage
        previous: 97.1,
        change: 1.4,
        trend: 'up'
      },
      earnings: {
        current: 3420, // dollars
        previous: 2890,
        change: 18.3,
        trend: 'up'
      }
    },
    jobHistory: [
      {
        date: '2024-10-01',
        jobsCompleted: 2,
        averageRating: 4.9,
        earnings: 340
      },
      {
        date: '2024-09-30',
        jobsCompleted: 1,
        averageRating: 4.8,
        earnings: 170
      },
      {
        date: '2024-09-29',
        jobsCompleted: 3,
        averageRating: 4.7,
        earnings: 510
      }
    ],
    rankings: {
      categoryRank: 3,
      totalInCategory: 45,
      overallRank: 12,
      totalVendors: 211,
      topPercentile: 5.7
    },
    achievements: [
      {
        id: 'quick_responder',
        title: 'Quick Responder',
        description: 'Responds to requests within 15 minutes',
        earnedAt: '2024-09-15'
      },
      {
        id: 'customer_favorite',
        title: 'Customer Favorite',
        description: 'Maintains 4.8+ rating with 15+ reviews',
        earnedAt: '2024-08-20'
      }
    ]
  };
  
  res.json({
    success: true,
    data: performanceData
  });
});

// Vendor Analytics Dashboard
app.get('/api/v1/vendors/:vendorId/analytics', (req, res) => {
  const { vendorId } = req.params;
  const { timeframe = '7d' } = req.query;
  
  console.log('Getting vendor analytics:', { vendorId, timeframe });
  
  const analyticsData = {
    vendorId,
    timeframe,
    overview: {
      profileViews: 156,
      contactRequests: 23,
      jobInquiries: 18,
      conversionRate: 78.3 // percentage
    },
    trends: {
      profileViews: [12, 15, 18, 22, 19, 25, 28],
      inquiries: [2, 3, 2, 4, 3, 2, 4],
      bookings: [1, 2, 1, 3, 2, 1, 3]
    },
    demographics: {
      customerTypes: [
        { type: 'Homeowner', percentage: 65 },
        { type: 'Property Manager', percentage: 25 },
        { type: 'Business Owner', percentage: 10 }
      ],
      serviceAreas: [
        { area: 'San Francisco', percentage: 45 },
        { area: 'Oakland', percentage: 30 },
        { area: 'San Jose', percentage: 25 }
      ]
    },
    recommendations: [
      {
        type: 'profile_optimization',
        title: 'Add More Portfolio Images',
        description: 'Vendors with 5+ portfolio images get 40% more inquiries',
        priority: 'high'
      },
      {
        type: 'pricing_optimization',
        title: 'Consider Competitive Pricing',
        description: 'Your rates are 15% above category average',
        priority: 'medium'
      }
    ]
  };
  
  res.json({
    success: true,
    data: analyticsData
  });
});

// Enhanced Contact Management Endpoints
app.post('/api/v1/contacts/import', (req, res) => {
  const { contacts, source, syncId } = req.body;
  
  console.log('Contact import:', { count: contacts.length, source, syncId });
  
  // Simulate processing with detailed results
  const imported = [];
  const duplicates = [];
  const errors = [];
  
  contacts.forEach((contact, index) => {
    if (contact.phone && contact.phone.length > 5) {
      // Check for duplicates (simulate)
      const isDuplicate = Math.random() < 0.1; // 10% chance of duplicate
      
      if (isDuplicate) {
        duplicates.push({
          ...contact,
          reason: 'Phone number already exists'
        });
      } else {
        imported.push({
          id: `contact_${Date.now()}_${index}`,
          ...contact,
          isRegistered: Math.random() < 0.3, // 30% chance user is registered
          importedAt: new Date().toISOString(),
          syncId
        });
      }
    } else {
      errors.push({
        ...contact,
        reason: 'Invalid phone number'
      });
    }
  });
  
  res.status(201).json({
    success: true,
    message: `Contacts processed: ${imported.length} imported, ${duplicates.length} duplicates, ${errors.length} errors`,
    data: {
      imported: imported.length,
      duplicates: duplicates.length,
      errors: errors.length,
      importedContacts: imported,
      duplicateContacts: duplicates,
      errorContacts: errors,
      syncId,
      importedAt: new Date().toISOString()
    }
  });
});

app.get('/api/v1/contacts/search', (req, res) => {
  const { query, limit = 20, offset = 0, filter } = req.query;
  
  // Mock contact database
  const allContacts = [
    {
      id: 'contact_1',
      firstName: 'Mike',
      lastName: 'Rodriguez',
      displayName: 'Mike Rodriguez',
      email: 'mike@example.com',
      phone: '+1234567890',
      isRegistered: true,
      userType: 'vendor',
      avatar: 'https://i.pravatar.cc/100?img=8',
      lastSync: new Date().toISOString(),
      tags: ['plumber', 'contractor']
    },
    {
      id: 'contact_2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      displayName: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1987654321',
      isRegistered: true,
      userType: 'consumer',
      avatar: 'https://i.pravatar.cc/100?img=5',
      lastSync: new Date().toISOString(),
      tags: ['friend']
    },
    {
      id: 'contact_3',
      firstName: 'John',
      lastName: 'Smith',
      displayName: 'John Smith',
      email: 'john@example.com',
      phone: '+1555555555',
      isRegistered: false,
      userType: null,
      avatar: null,
      lastSync: new Date().toISOString(),
      tags: ['family']
    }
  ];
  
  // Filter contacts based on query
  let filteredContacts = allContacts;
  
  if (query) {
    const searchTerm = query.toLowerCase();
    filteredContacts = allContacts.filter(contact => 
      contact.firstName.toLowerCase().includes(searchTerm) ||
      contact.lastName.toLowerCase().includes(searchTerm) ||
      contact.email.toLowerCase().includes(searchTerm) ||
      contact.phone.includes(searchTerm)
    );
  }
  
  if (filter === 'registered') {
    filteredContacts = filteredContacts.filter(contact => contact.isRegistered);
  } else if (filter === 'unregistered') {
    filteredContacts = filteredContacts.filter(contact => !contact.isRegistered);
  }
  
  // Apply pagination
  const paginatedContacts = filteredContacts.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      contacts: paginatedContacts,
      total: filteredContacts.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (offset + parseInt(limit)) < filteredContacts.length
    }
  });
});

// Contact Synchronization
app.post('/api/v1/contacts/sync', (req, res) => {
  const { deviceId, lastSyncTime, contacts } = req.body;
  
  console.log('Contact sync:', { deviceId, lastSyncTime, contactCount: contacts?.length || 0 });
  
  // Simulate sync process
  const syncTime = new Date().toISOString();
  const syncId = `sync_${Date.now()}`;
  
  res.json({
    success: true,
    message: 'Contacts synchronized successfully',
    data: {
      syncId,
      syncTime,
      deviceId,
      contactsUpdated: contacts?.length || 0,
      contactsReceived: 2, // Simulate receiving updates from server
      updatedContacts: [
        {
          id: 'contact_1',
          firstName: 'Mike',
          lastName: 'Rodriguez',
          phone: '+1234567890',
          isRegistered: true,
          lastUpdated: syncTime
        }
      ],
      nextSyncTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }
  });
});

// Export Contacts
app.get('/api/v1/contacts/export', (req, res) => {
  const { format = 'json', filter } = req.query;
  
  console.log('Contact export:', { format, filter });
  
  const contacts = [
    {
      firstName: 'Mike',
      lastName: 'Rodriguez',
      email: 'mike@example.com',
      phone: '+1234567890',
      isRegistered: true
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@example.com',
      phone: '+1987654321',
      isRegistered: true
    }
  ];
  
  if (format === 'csv') {
    const csvHeader = 'First Name,Last Name,Email,Phone,Registered\n';
    const csvData = contacts.map(contact => 
      `${contact.firstName},${contact.lastName},${contact.email},${contact.phone},${contact.isRegistered}`
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    res.send(csvHeader + csvData);
  } else {
    res.json({
      success: true,
      data: {
        contacts,
        exportedAt: new Date().toISOString(),
        format,
        total: contacts.length
      }
    });
  }
});

// Bulk Contact Operations
app.post('/api/v1/contacts/bulk/delete', (req, res) => {
  const { contactIds } = req.body;
  
  console.log('Bulk contact deletion:', { count: contactIds.length });
  
  res.json({
    success: true,
    message: `${contactIds.length} contacts deleted successfully`,
    data: {
      deletedCount: contactIds.length,
      deletedIds: contactIds,
      deletedAt: new Date().toISOString()
    }
  });
});

app.post('/api/v1/contacts/bulk/update', (req, res) => {
  const { contactIds, updateData } = req.body;
  
  console.log('Bulk contact update:', { count: contactIds.length, updateData });
  
  res.json({
    success: true,
    message: `${contactIds.length} contacts updated successfully`,
    data: {
      updatedCount: contactIds.length,
      updatedIds: contactIds,
      updateData,
      updatedAt: new Date().toISOString()
    }
  });
});

app.post('/api/v1/contacts/bulk/tag', (req, res) => {
  const { contactIds, tags, action = 'add' } = req.body;
  
  console.log('Bulk contact tagging:', { count: contactIds.length, tags, action });
  
  res.json({
    success: true,
    message: `Tags ${action === 'add' ? 'added to' : 'removed from'} ${contactIds.length} contacts`,
    data: {
      contactCount: contactIds.length,
      tags,
      action,
      processedAt: new Date().toISOString()
    }
  });
});

// Contact Groups Management
app.get('/api/v1/contacts/groups', (req, res) => {
  res.json({
    success: true,
    data: {
      groups: [
        {
          id: 'group_1',
          name: 'Contractors',
          description: 'All contractor contacts',
          contactCount: 15,
          createdAt: new Date().toISOString()
        },
        {
          id: 'group_2',
          name: 'Friends',
          description: 'Personal friends',
          contactCount: 8,
          createdAt: new Date().toISOString()
        },
        {
          id: 'group_3',
          name: 'Family',
          description: 'Family members',
          contactCount: 5,
          createdAt: new Date().toISOString()
        }
      ]
    }
  });
});

app.post('/api/v1/contacts/groups', (req, res) => {
  const { name, description, contactIds } = req.body;
  
  console.log('Create contact group:', { name, description, contactCount: contactIds?.length || 0 });
  
  res.status(201).json({
    success: true,
    message: 'Contact group created successfully',
    data: {
      id: `group_${Date.now()}`,
      name,
      description,
      contactCount: contactIds?.length || 0,
      createdAt: new Date().toISOString()
    }
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/v1/health',
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/login',
      'DELETE /api/v1/auth/logout',
      'GET /api/v1/users/profile',
      'GET /api/v1/consumers/dashboard',
      'GET /api/v1/consumers/recommendations',
      'GET /api/v1/vendors/search',
      'POST /api/v1/vendors/profile',
      'GET /api/v1/vendors/:vendorId/profile',
      'PUT /api/v1/vendors/:vendorId/profile',
      'POST /api/v1/vendors/:vendorId/portfolio',
      'GET /api/v1/vendors/:vendorId/portfolio',
      'POST /api/v1/vendors/onboarding/start',
      'PUT /api/v1/vendors/onboarding/:onboardingId/step/:stepNumber',
      'GET /api/v1/vendors/onboarding/:onboardingId',
      'GET /api/v1/vendors/categories',
      'POST /api/v1/vendors/:vendorId/tags',
      'GET /api/v1/vendors/tags',
      'GET /api/v1/vendors/discover',
      'GET /api/v1/vendors/:vendorId/performance',
      'GET /api/v1/vendors/:vendorId/analytics',
      'POST /api/v1/ratings',
      'GET /api/v1/ratings',
      'PUT /api/v1/ratings/:ratingId',
      'DELETE /api/v1/ratings/:ratingId',
      'GET /api/v1/ratings/:vendorId/analytics',
      'GET /api/v1/reviews',
      'POST /api/v1/reviews/:reviewId/helpful',
      'POST /api/v1/reviews/:reviewId/response',
      'GET /api/v1/reviews/moderation/pending',
      'PUT /api/v1/reviews/:reviewId/moderate',
      'POST /api/v1/reviews/:reviewId/flag',
      'GET /api/v1/ratings/:vendorId/trends',
      'GET /api/v1/ratings/:vendorId/aggregation',
      'POST /api/v1/invitations/send',
      'POST /api/v1/invitations/bulk',
      'POST /api/v1/sms/send',
      'GET /api/v1/sms/:smsId/status',
      'GET /api/v1/sms/templates',
      'POST /api/v1/email/send',
      'GET /api/v1/email/templates',
      'GET /api/v1/email/:emailId/status',
      'GET /api/v1/email/analytics',
      'POST /api/v1/email/workflows',
      'GET /api/v1/email/workflows',
      'GET /api/v1/invitations',
      'POST /api/v1/invitations/:invitationId/resend',
      'POST /api/v1/invitations/:invitationId/accept',
      'GET /api/v1/invitations/:invitationId/history',
      'GET /api/v1/invitations/status/summary',
      'PUT /api/v1/invitations/bulk/status',
      'GET /api/v1/users/:userId/communication-preferences',
      'PUT /api/v1/users/:userId/communication-preferences',
      'POST /api/v1/notifications/push/send',
      'POST /api/v1/notifications/devices/register',
      'GET /api/v1/notifications/preferences/:userId',
      'PUT /api/v1/notifications/preferences/:userId',
      'GET /api/v1/notifications/history/:userId',
      'PUT /api/v1/notifications/:notificationId/read',
      'GET /api/v1/notifications/analytics',
      'GET /api/v1/mobile/performance/metrics',
      'POST /api/v1/mobile/sync',
      'GET /api/v1/mobile/cache/status/:userId',
      'DELETE /api/v1/mobile/cache/:userId',
      'GET /api/v1/mobile/config',
      'GET /api/v1/system/health',
      'GET /api/v1/system/metrics',
      'GET /api/v1/system/database/status',
      'POST /api/v1/system/backup/create',
      'GET /api/v1/system/backup/history',
      'POST /api/v1/auth/oauth/:provider',
      'GET /api/v1/auth/social/providers',
      'GET /api/v1/system/load-balancer/health',
      'GET /api/v1/system/scalability/metrics',
      'GET /api/v1/system/rate-limiting/status',
      'GET /api/v1/access/user/permissions',
      'GET /api/v1/access/roles',
      'PUT /api/v1/access/users/:userId/role',
      'GET /api/v1/access/logs',
      'GET /api/v1/access/analytics',
      'GET /api/v1/access/permissions',
      'GET /api/v1/public/vendors/featured',
      'GET /api/v1/consumer/dashboard',
      'GET /api/v1/vendor/dashboard',
      'GET /api/v1/admin/system/overview',
      'GET /api/v1/vendor/analytics/:vendorId',
      'DELETE /api/v1/ratings/:ratingId',
      'POST /api/v1/reviews/:reviewId/comments',
      'GET /api/v1/reviews/:reviewId/comments',
      'PUT /api/v1/comments/:commentId',
      'DELETE /api/v1/comments/:commentId',
      'POST /api/v1/comments/:commentId/like',
      'POST /api/v1/reviews',
      'GET /api/v1/reviews',
      'POST /api/v1/reviews/:reviewId/helpful',
      'PUT /api/v1/reviews/:reviewId/moderate',
      'POST /api/v1/contacts/phone-directory/access',
      'POST /api/v1/contacts/sync/devices',
      'POST /api/v1/contacts/phone/detect-type',
      'POST /api/v1/templates/sms/create',
      'GET /api/v1/templates/sms',
      'POST /api/v1/templates/email/create',
      'GET /api/v1/templates/email',
      'POST /api/v1/templates/:type/:templateId/preview',
      'POST /api/v1/contacts/import',
      'GET /api/v1/contacts/search',
      'POST /api/v1/contacts/sync',
      'GET /api/v1/contacts/export',
      'POST /api/v1/contacts/bulk/delete',
      'POST /api/v1/contacts/bulk/update',
      'POST /api/v1/contacts/bulk/tag',
      'GET /api/v1/contacts/groups',
      'POST /api/v1/contacts/groups'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Main FixRx Backend Server Started');
  console.log('=' .repeat(60));
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/v1/health`);
  console.log('=' .repeat(60));
  console.log('✨ All Features Available:');
  console.log('   • Enhanced Authentication System');
  console.log('   • Consumer Dashboard & Management');
  console.log('   • Vendor Search & Profiles');
  console.log('   • 4-Category Rating System');
  console.log('   • Invitation System (Single & Bulk)');
  console.log('   • Contact Management');
  console.log('   • Rate Limiting & Security');
  console.log('   • CORS & Error Handling');
  console.log('=' .repeat(60));
  console.log('🎯 Ready for Frontend Integration!');
});

module.exports = app;
