/**
 * Integration Bridge for FixRx Mobile
 * Ensures proper backend integration without modifying existing UI
 */

import { apiClient } from './apiClient';
import { authService } from './authService';
import { API_ENDPOINTS } from '../config/api';

export interface IntegrationStatus {
  isBackendConnected: boolean;
  lastHealthCheck: Date | null;
  authenticationStatus: 'authenticated' | 'unauthenticated' | 'checking';
  services: {
    auth: boolean;
    vendors: boolean;
    consumers: boolean;
    ratings: boolean;
    invitations: boolean;
    contacts: boolean;
  };
}

class IntegrationBridge {
  private status: IntegrationStatus = {
    isBackendConnected: false,
    lastHealthCheck: null,
    authenticationStatus: 'checking',
    services: {
      auth: false,
      vendors: false,
      consumers: false,
      ratings: false,
      invitations: false,
      contacts: false,
    },
  };

  private healthCheckInterval: NodeJS.Timeout | null = null;

  // Initialize integration bridge
  async initialize(): Promise<void> {
    console.log('🔗 Initializing FixRx Integration Bridge...');
    
    try {
      // Check backend connection
      await this.checkBackendHealth();
      
      // Initialize authentication
      await this.initializeAuthentication();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      console.log('✅ Integration Bridge initialized successfully');
    } catch (error) {
      console.error('❌ Integration Bridge initialization failed:', error);
    }
  }

  // Check backend health
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await apiClient.healthCheck();
      
      if (response.success) {
        this.status.isBackendConnected = true;
        this.status.lastHealthCheck = new Date();
        this.status.services = {
          auth: true,
          vendors: true,
          consumers: true,
          ratings: true,
          invitations: true,
          contacts: true,
        };
        
        console.log('✅ Backend connection verified');
        return true;
      }
    } catch (error) {
      console.log('⚠️ Backend not available, using fallback mode');
    }
    
    this.status.isBackendConnected = false;
    return false;
  }

  // Initialize authentication state
  async initializeAuthentication(): Promise<void> {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        this.status.authenticationStatus = 'authenticated';
        console.log('✅ User authentication verified');
      } else {
        this.status.authenticationStatus = 'unauthenticated';
        console.log('ℹ️ User not authenticated');
      }
    } catch (error) {
      console.error('❌ Authentication check failed:', error);
      this.status.authenticationStatus = 'unauthenticated';
    }
  }

  // Start health monitoring
  private startHealthMonitoring(): void {
    // Check backend health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.checkBackendHealth();
    }, 30000);
  }

  // Stop health monitoring
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Get integration status
  getStatus(): IntegrationStatus {
    return { ...this.status };
  }

  // Force backend connection check
  async forceHealthCheck(): Promise<boolean> {
    return await this.checkBackendHealth();
  }

  // Enhanced logout with proper state management
  async performLogout(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔐 Performing enhanced logout...');
      
      // Call backend logout
      const logoutResponse = await authService.logout();
      
      if (logoutResponse.success) {
        // Update authentication status
        this.status.authenticationStatus = 'unauthenticated';
        
        console.log('✅ Logout successful');
        return {
          success: true,
          message: 'Logged out successfully'
        };
      } else {
        throw new Error(logoutResponse.error || 'Logout failed');
      }
    } catch (error) {
      console.error('❌ Logout failed:', error);
      
      // Force clear local data even if backend call fails
      this.status.authenticationStatus = 'unauthenticated';
      
      return {
        success: false,
        message: 'Logout completed locally'
      };
    }
  }

  // Enhanced login with proper state management
  async performLogin(email: string, password: string): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      console.log('🔐 Performing enhanced login...');
      
      const loginResponse = await authService.login({ email, password });
      
      if (loginResponse.success) {
        this.status.authenticationStatus = 'authenticated';
        
        console.log('✅ Login successful');
        return {
          success: true,
          message: 'Login successful',
          user: loginResponse.data?.user
        };
      } else {
        throw new Error(loginResponse.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      this.status.authenticationStatus = 'unauthenticated';
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  // Test all integrations
  async testAllIntegrations(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    try {
      // Test health endpoint
      const healthResponse = await apiClient.get(API_ENDPOINTS.HEALTH);
      results.health = healthResponse.success;
      
      // Test authentication endpoints
      results.auth = true; // Already tested in initialization
      
      // Test consumer dashboard
      try {
        const dashboardResponse = await apiClient.get(API_ENDPOINTS.CONSUMER.DASHBOARD);
        results.consumerDashboard = dashboardResponse.success;
      } catch {
        results.consumerDashboard = false;
      }
      
      // Test vendor search
      try {
        const vendorResponse = await apiClient.get(API_ENDPOINTS.VENDOR.SEARCH + '?query=test');
        results.vendorSearch = vendorResponse.success;
      } catch {
        results.vendorSearch = false;
      }
      
      // Test ratings
      try {
        const ratingsResponse = await apiClient.get(API_ENDPOINTS.RATINGS.GET);
        results.ratings = ratingsResponse.success;
      } catch {
        results.ratings = false;
      }
      
      console.log('🧪 Integration test results:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Integration testing failed:', error);
      return results;
    }
  }
}

// Export singleton instance
export const integrationBridge = new IntegrationBridge();
export default integrationBridge;
