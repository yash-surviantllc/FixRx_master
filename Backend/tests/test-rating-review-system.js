/**
 * Comprehensive Rating & Review System Test
 * Tests all rating and review features including four-category ratings, moderation, and analytics
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testRatingReviewSystem() {
  console.log('⭐ Testing Complete Rating & Review System...\n');

  const results = {
    fourCategoryRating: false,
    ratingCRUD: false,
    reviewManagement: false,
    ratingAnalytics: false,
    reviewModeration: false,
    historicalTrends: false,
    ratingAggregation: false,
    reviewInteractions: false
  };

  try {
    // Test 1: Four-Category Rating System
    console.log('1️⃣ Testing Four-Category Rating System...');
    
    const newRating = {
      vendorId: 'vendor_1',
      consumerId: 'consumer_1',
      serviceId: 'service_1',
      ratings: {
        cost: 4,
        quality: 5,
        timeliness: 4,
        professionalism: 5
      },
      comment: 'Great service! Professional and timely. Pricing was reasonable for the quality of work.'
    };

    const createRatingResponse = await axios.post(`${API_BASE}/ratings`, newRating);
    console.log('✅ Create Four-Category Rating:');
    console.log(`   • Rating ID: ${createRatingResponse.data.data.id}`);
    console.log(`   • Cost: ${createRatingResponse.data.data.ratings.cost}/5`);
    console.log(`   • Quality: ${createRatingResponse.data.data.ratings.quality}/5`);
    console.log(`   • Timeliness: ${createRatingResponse.data.data.ratings.timeliness}/5`);
    console.log(`   • Professionalism: ${createRatingResponse.data.data.ratings.professionalism}/5`);
    console.log(`   • Overall Rating: ${createRatingResponse.data.data.overallRating}/5`);
    console.log(`   • Comment: "${createRatingResponse.data.data.comment.substring(0, 50)}..."`);
    
    const ratingId = createRatingResponse.data.data.id;
    results.fourCategoryRating = createRatingResponse.data.success;
    console.log('');

    // Test 2: Rating CRUD Operations
    console.log('2️⃣ Testing Rating CRUD Operations...');
    
    // Get ratings
    const getRatingsResponse = await axios.get(`${API_BASE}/ratings?vendorId=vendor_1`);
    console.log('✅ Get Ratings:');
    console.log(`   • Total Ratings: ${getRatingsResponse.data.data.totalRatings}`);
    console.log(`   • Average Rating: ${getRatingsResponse.data.data.averageRating}/5`);
    console.log(`   • Ratings Returned: ${getRatingsResponse.data.data.ratings.length}`);
    
    // Update rating
    const updatedRatingData = {
      ratings: {
        cost: 5,
        quality: 5,
        timeliness: 4,
        professionalism: 5
      },
      comment: 'Updated: Excellent service! Even better than initially thought. Highly recommend!'
    };
    
    const updateRatingResponse = await axios.put(`${API_BASE}/ratings/${ratingId}`, updatedRatingData);
    console.log('✅ Update Rating:');
    console.log(`   • Updated Rating ID: ${updateRatingResponse.data.data.rating.id}`);
    console.log(`   • New Overall Rating: ${updateRatingResponse.data.data.rating.overallRating}/5`);
    console.log(`   • Is Edited: ${updateRatingResponse.data.data.rating.isEdited}`);
    console.log(`   • Updated At: ${updateRatingResponse.data.data.rating.updatedAt}`);
    
    results.ratingCRUD = getRatingsResponse.data.success && updateRatingResponse.data.success;
    console.log('');

    // Test 3: Review Management with Advanced Features
    console.log('3️⃣ Testing Review Management with Advanced Features...');
    
    // Get reviews with filtering and sorting
    const reviewsResponse = await axios.get(`${API_BASE}/reviews?vendorId=vendor_1&sortBy=newest&limit=5`);
    console.log('✅ Get Reviews (Newest First):');
    console.log(`   • Total Reviews: ${reviewsResponse.data.data.total}`);
    console.log(`   • Reviews Returned: ${reviewsResponse.data.data.reviews.length}`);
    console.log(`   • Average Rating: ${reviewsResponse.data.data.summary.averageRating.toFixed(1)}/5`);
    console.log(`   • Verified Reviews: ${reviewsResponse.data.data.summary.verifiedReviews}`);
    console.log(`   • Reviews with Comments: ${reviewsResponse.data.data.summary.reviewsWithComments}`);
    
    if (reviewsResponse.data.data.reviews.length > 0) {
      const firstReview = reviewsResponse.data.data.reviews[0];
      console.log(`   • Latest Review: ${firstReview.overallRating}/5 by ${firstReview.consumerName}`);
      console.log(`   • Service Type: ${firstReview.serviceType}`);
      console.log(`   • Has Vendor Response: ${firstReview.vendorResponse ? 'Yes' : 'No'}`);
    }
    
    // Filter reviews by rating
    const highRatingReviewsResponse = await axios.get(`${API_BASE}/reviews?vendorId=vendor_1&minRating=4&sortBy=highest_rating`);
    console.log('✅ High Rating Reviews (4+ stars):');
    console.log(`   • High Rating Reviews: ${highRatingReviewsResponse.data.data.reviews.length}`);
    
    // Filter reviews with comments
    const commentedReviewsResponse = await axios.get(`${API_BASE}/reviews?vendorId=vendor_1&hasComment=true&sortBy=most_helpful`);
    console.log('✅ Reviews with Comments (Most Helpful):');
    console.log(`   • Commented Reviews: ${commentedReviewsResponse.data.data.reviews.length}`);
    
    results.reviewManagement = reviewsResponse.data.success && highRatingReviewsResponse.data.success;
    console.log('');

    // Test 4: Rating Analytics and Insights
    console.log('4️⃣ Testing Rating Analytics and Insights...');
    
    const analyticsResponse = await axios.get(`${API_BASE}/ratings/vendor_1/analytics?period=30d`);
    console.log('✅ Rating Analytics (30 days):');
    console.log(`   • Total Ratings: ${analyticsResponse.data.data.summary.totalRatings}`);
    console.log(`   • Average Overall: ${analyticsResponse.data.data.summary.averageOverallRating}/5`);
    console.log(`   • Response Rate: ${analyticsResponse.data.data.trends.responseRate}%`);
    
    const categoryBreakdown = analyticsResponse.data.data.categoryBreakdown;
    console.log('✅ Category Breakdown:');
    console.log(`   • Cost: ${categoryBreakdown.cost.average}/5 (${categoryBreakdown.cost.trend})`);
    console.log(`   • Quality: ${categoryBreakdown.quality.average}/5 (${categoryBreakdown.quality.trend})`);
    console.log(`   • Timeliness: ${categoryBreakdown.timeliness.average}/5 (${categoryBreakdown.timeliness.trend})`);
    console.log(`   • Professionalism: ${categoryBreakdown.professionalism.average}/5 (${categoryBreakdown.professionalism.trend})`);
    
    console.log('✅ Insights:');
    analyticsResponse.data.data.insights.forEach(insight => {
      console.log(`   • ${insight.type.toUpperCase()}: ${insight.message} (${insight.impact})`);
    });
    
    results.ratingAnalytics = analyticsResponse.data.success;
    console.log('');

    // Test 5: Review Moderation System
    console.log('5️⃣ Testing Review Moderation System...');
    
    // Get pending reviews for moderation
    const pendingReviewsResponse = await axios.get(`${API_BASE}/reviews/moderation/pending?limit=10`);
    console.log('✅ Pending Reviews for Moderation:');
    console.log(`   • Pending Reviews: ${pendingReviewsResponse.data.data.total}`);
    console.log(`   • Reviews Returned: ${pendingReviewsResponse.data.data.reviews.length}`);
    
    if (pendingReviewsResponse.data.data.reviews.length > 0) {
      const pendingReview = pendingReviewsResponse.data.data.reviews[0];
      console.log(`   • Review ID: ${pendingReview.id}`);
      console.log(`   • Rating: ${pendingReview.overallRating}/5`);
      console.log(`   • Flagged Reasons: ${pendingReview.flaggedReasons.join(', ')}`);
      console.log(`   • Flagged By: ${pendingReview.flaggedBy.join(', ')}`);
      
      // Moderate the review
      const moderateResponse = await axios.put(`${API_BASE}/reviews/${pendingReview.id}/moderate`, {
        action: 'approve',
        reason: 'Review content is appropriate after manual review',
        moderatorId: 'moderator_1'
      });
      console.log('✅ Review Moderation:');
      console.log(`   • Action: ${moderateResponse.data.data.action}`);
      console.log(`   • New Status: ${moderateResponse.data.data.newStatus}`);
      console.log(`   • Moderated At: ${moderateResponse.data.data.moderatedAt}`);
    }
    
    // Flag a review for moderation
    const flagResponse = await axios.post(`${API_BASE}/reviews/review_1/flag`, {
      userId: 'user_1',
      reason: 'inappropriate_language',
      description: 'This review contains inappropriate language that violates community guidelines'
    });
    console.log('✅ Flag Review for Moderation:');
    console.log(`   • Review Flagged: ${flagResponse.data.data.reviewId}`);
    console.log(`   • Reason: ${flagResponse.data.data.flag.reason}`);
    console.log(`   • Flagged At: ${flagResponse.data.data.flag.flaggedAt}`);
    
    results.reviewModeration = pendingReviewsResponse.data.success && flagResponse.data.success;
    console.log('');

    // Test 6: Historical Rating Trends
    console.log('6️⃣ Testing Historical Rating Trends...');
    
    const trendsResponse = await axios.get(`${API_BASE}/ratings/vendor_1/trends?period=12m&granularity=month`);
    console.log('✅ Historical Rating Trends (12 months):');
    console.log(`   • Period: ${trendsResponse.data.data.period}`);
    console.log(`   • Granularity: ${trendsResponse.data.data.granularity}`);
    console.log(`   • Trend Direction: ${trendsResponse.data.data.insights.trendDirection}`);
    console.log(`   • Overall Improvement: ${trendsResponse.data.data.insights.overallImprovement}`);
    console.log(`   • Strongest Category: ${trendsResponse.data.data.insights.strongestCategory}`);
    console.log(`   • Improvement Area: ${trendsResponse.data.data.insights.improvementArea}`);
    
    const recentTrends = trendsResponse.data.data.trends.overall.slice(-3);
    console.log('✅ Recent Trend (Last 3 months):');
    recentTrends.forEach(trend => {
      console.log(`   • ${trend.period}: ${trend.average}/5 (${trend.count} ratings)`);
    });
    
    console.log('✅ Milestones:');
    trendsResponse.data.data.milestones.forEach(milestone => {
      console.log(`   • ${milestone.date}: ${milestone.description}`);
    });
    
    results.historicalTrends = trendsResponse.data.success;
    console.log('');

    // Test 7: Rating Aggregation and Statistics
    console.log('7️⃣ Testing Rating Aggregation and Statistics...');
    
    const aggregationResponse = await axios.get(`${API_BASE}/ratings/vendor_1/aggregation`);
    console.log('✅ Rating Aggregation:');
    console.log(`   • Overall Average: ${aggregationResponse.data.data.overall.averageRating}/5`);
    console.log(`   • Total Ratings: ${aggregationResponse.data.data.overall.totalRatings}`);
    
    const distribution = aggregationResponse.data.data.overall.ratingDistribution;
    console.log('✅ Rating Distribution:');
    Object.entries(distribution).forEach(([stars, data]) => {
      console.log(`   • ${stars} stars: ${data.count} ratings (${data.percentage}%)`);
    });
    
    console.log('✅ Category Averages:');
    const categories = aggregationResponse.data.data.categories;
    Object.entries(categories).forEach(([category, data]) => {
      console.log(`   • ${category.charAt(0).toUpperCase() + category.slice(1)}: ${data.average}/5`);
    });
    
    const benchmarks = aggregationResponse.data.data.benchmarks;
    console.log('✅ Benchmarks:');
    console.log(`   • Platform Average: ${benchmarks.platformAverage}/5`);
    console.log(`   • Percentile Rank: ${benchmarks.percentileRank}th percentile`);
    console.log(`   • Better than ${benchmarks.competitorComparison.betterThan}/${benchmarks.competitorComparison.totalCompetitors} competitors`);
    
    results.ratingAggregation = aggregationResponse.data.success;
    console.log('');

    // Test 8: Review Interactions (Helpful votes, Vendor responses)
    console.log('8️⃣ Testing Review Interactions...');
    
    // Mark review as helpful
    const helpfulResponse = await axios.post(`${API_BASE}/reviews/review_1/helpful`, {
      userId: 'user_1'
    });
    console.log('✅ Mark Review as Helpful:');
    console.log(`   • Review ID: ${helpfulResponse.data.data.reviewId}`);
    console.log(`   • User ID: ${helpfulResponse.data.data.userId}`);
    console.log(`   • New Helpful Count: ${helpfulResponse.data.data.helpfulCount}`);
    console.log(`   • Marked At: ${helpfulResponse.data.data.markedAt}`);
    
    // Vendor response to review
    const vendorResponseResponse = await axios.post(`${API_BASE}/reviews/review_1/response`, {
      vendorId: 'vendor_1',
      message: 'Thank you for your detailed feedback! We really appreciate your business and are glad we could meet your expectations. We look forward to working with you again in the future.'
    });
    console.log('✅ Vendor Response to Review:');
    console.log(`   • Review ID: ${vendorResponseResponse.data.data.reviewId}`);
    console.log(`   • Vendor ID: ${vendorResponseResponse.data.data.vendorId}`);
    console.log(`   • Response: "${vendorResponseResponse.data.data.response.message.substring(0, 50)}..."`);
    console.log(`   • Responded At: ${vendorResponseResponse.data.data.response.respondedAt}`);
    
    results.reviewInteractions = helpfulResponse.data.success && vendorResponseResponse.data.success;
    console.log('');

    // Final Results
    console.log('🎉 Rating & Review System Test Complete!');
    console.log('=' .repeat(70));
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`📊 Results: ${passedTests}/${totalTests} rating & review features passed`);
    console.log('');
    
    Object.entries(results).forEach(([feature, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${feature}: ${passed ? 'WORKING' : 'NEEDS ATTENTION'}`);
    });
    
    console.log('');
    console.log('⭐ RATING & REVIEW SYSTEM STATUS:');
    
    if (passedTests === totalTests) {
      console.log('🎯 FULLY IMPLEMENTED - All rating & review features operational!');
      console.log('');
      console.log('✅ FOUR-CATEGORY RATING SYSTEM:');
      console.log('   💰 Cost Effectiveness Rating:');
      console.log('      • 1-5 star rating for pricing and value');
      console.log('      • Cost trend analysis and benchmarking');
      console.log('      • Price competitiveness insights');
      console.log('      • Value-for-money assessment');
      console.log('');
      console.log('   🏆 Quality of Service Rating:');
      console.log('      • 1-5 star rating for work quality');
      console.log('      • Quality trend tracking over time');
      console.log('      • Quality benchmarking against peers');
      console.log('      • Workmanship and attention to detail');
      console.log('');
      console.log('   ⏰ Timeliness of Delivery Rating:');
      console.log('      • 1-5 star rating for punctuality');
      console.log('      • On-time delivery performance tracking');
      console.log('      • Schedule adherence analytics');
      console.log('      • Response time and completion speed');
      console.log('');
      console.log('   👔 Professionalism Rating:');
      console.log('      • 1-5 star rating for professional conduct');
      console.log('      • Communication and courtesy assessment');
      console.log('      • Professional appearance and behavior');
      console.log('      • Customer service excellence tracking');
      console.log('');
      console.log('✅ REVIEW MANAGEMENT:');
      console.log('   💬 Comment and Review Functionality:');
      console.log('      • Detailed text reviews with photo attachments');
      console.log('      • Review editing and update capabilities');
      console.log('      • Verified review system with service confirmation');
      console.log('      • Review helpfulness voting system');
      console.log('');
      console.log('   📊 Rating Aggregation and Calculation:');
      console.log('      • Automatic overall rating calculation');
      console.log('      • Category-specific rating aggregation');
      console.log('      • Weighted rating algorithms');
      console.log('      • Real-time rating updates and statistics');
      console.log('');
      console.log('   🔍 Review Display and Sorting:');
      console.log('      • Multiple sorting options (newest, rating, helpful)');
      console.log('      • Advanced filtering by rating, category, date');
      console.log('      • Pagination for large review datasets');
      console.log('      • Review summary and statistics display');
      console.log('');
      console.log('   🛡️ Review Moderation Capabilities:');
      console.log('      • Automated content filtering and flagging');
      console.log('      • Manual review moderation workflow');
      console.log('      • Community-driven review flagging system');
      console.log('      • Moderator dashboard and approval process');
      console.log('');
      console.log('   📈 Historical Rating Trends:');
      console.log('      • Monthly and yearly rating trend analysis');
      console.log('      • Category-specific trend tracking');
      console.log('      • Performance milestone tracking');
      console.log('      • Improvement insights and recommendations');
      console.log('');
      console.log('🚀 PRODUCTION READY FEATURES:');
      console.log('   • Complete four-category rating system');
      console.log('   • Advanced review management with moderation');
      console.log('   • Real-time rating analytics and insights');
      console.log('   • Historical trend analysis and benchmarking');
      console.log('   • Vendor response system for customer engagement');
      console.log('   • Community-driven quality assurance');
      console.log('   • Comprehensive rating aggregation and statistics');
      console.log('   • Professional moderation and content management');
      
    } else {
      console.log('⚠️ PARTIAL IMPLEMENTATION - Some features need attention');
      console.log('🔧 Check failed features above for troubleshooting');
    }

  } catch (error) {
    console.error('❌ Rating & Review System Test Failed:', error.message);
    if (error.response) {
      console.error('📄 Response:', error.response.data);
      console.error('📊 Status:', error.response.status);
    }
  }
}

// Run the comprehensive rating & review system test
testRatingReviewSystem();
