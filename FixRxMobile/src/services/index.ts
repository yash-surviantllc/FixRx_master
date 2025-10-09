/**
 * Services Index for FixRx Mobile
 * Central export point for all services
 */

// Import services for initialization
import authService from './authService';
import integrationBridge from './integrationBridge';

// Export all services
export { default as apiClient } from './apiClient';
export { default as authService } from './authService';
export { default as consumerService } from './consumerService';
export { default as vendorService } from './vendorService';
export { default as ratingService } from './ratingService';
export { default as invitationService } from './invitationService';
export { default as integrationBridge } from './integrationBridge';

// Export types
export type { ApiResponse, ApiError } from './apiClient';
export type { AuthUser, AuthTokens, LoginCredentials, RegisterData } from './authService';
export type { Vendor, ConsumerStats, DashboardData, RecentActivity, RecentService } from './consumerService';
export type { VendorProfile, VendorStats, Connection, VendorDashboardData } from './vendorService';
export type { Rating, RatingData, RatingStats } from './ratingService';
export type { Contact, Invitation, InvitationData, BulkInvitationResult } from './invitationService';
export type { IntegrationStatus } from './integrationBridge';

// Service initialization helper
export const initializeServices = async () => {
  try {
    // Initialize auth service (loads stored tokens)
    await authService.initialize();
    
    // Initialize integration bridge
    await integrationBridge.initialize();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
  }
};
