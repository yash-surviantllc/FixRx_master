/**
 * Vendor Service for FixRx Mobile
 * Non-intrusive vendor service with fallback to mock data
 */

import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface VendorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  businessName?: string;
  services: string[];
  metroArea?: string;
  profileImage?: string;
  portfolio?: any[];
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  isOnline?: boolean;
}

export interface VendorStats {
  totalConnections: number;
  activeProjects: number;
  completedProjects: number;
  averageRating: number;
  totalReviews: number;
}

export interface Connection {
  id: string;
  consumerName: string;
  consumerImage?: string;
  service: string;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
  lastActivity?: string;
}

export interface VendorDashboardData {
  user: VendorProfile;
  stats: VendorStats;
  recentConnections: Connection[];
  pendingRequests: Connection[];
}

class VendorService {
  // Check if backend is available, fallback to mock if not
  private async useBackendOrMock<T>(
    backendCall: () => Promise<ApiResponse<T>>,
    mockData: T
  ): Promise<ApiResponse<T>> {
    try {
      const isAvailable = await apiClient.isBackendAvailable();
      if (isAvailable) {
        return await backendCall();
      }
    } catch (error) {
      console.log('Backend not available, using mock data');
    }

    // Return mock data if backend is not available
    return {
      success: true,
      data: mockData,
      message: 'Using mock data (backend not available)',
    };
  }

  // Get vendor dashboard data
  async getDashboard(): Promise<ApiResponse<VendorDashboardData>> {
    const backendCall = () => apiClient.get(API_ENDPOINTS.VENDOR.DASHBOARD);
    
    const mockData: VendorDashboardData = {
      user: {
        id: 'vendor_123',
        firstName: 'Mike',
        lastName: 'Rodriguez',
        email: 'mike@rodriguezplumbing.com',
        phone: '+1234567890',
        businessName: 'Rodriguez Plumbing',
        services: ['Plumbing', 'Pipe Repair', 'Emergency Services'],
        metroArea: 'San Francisco',
        profileImage: 'https://i.pravatar.cc/100?img=8',
        portfolio: [],
        rating: 4.9,
        reviewCount: 15,
        isVerified: true,
        isOnline: true,
      },
      stats: {
        totalConnections: 12,
        activeProjects: 3,
        completedProjects: 25,
        averageRating: 4.9,
        totalReviews: 15,
      },
      recentConnections: [
        {
          id: 'conn_1',
          consumerName: 'John Doe',
          consumerImage: 'https://i.pravatar.cc/100?img=1',
          service: 'Plumbing repair',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        },
        {
          id: 'conn_2',
          consumerName: 'Jane Smith',
          consumerImage: 'https://i.pravatar.cc/100?img=2',
          service: 'Pipe installation',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      pendingRequests: [
        {
          id: 'req_1',
          consumerName: 'Bob Johnson',
          consumerImage: 'https://i.pravatar.cc/100?img=3',
          service: 'Emergency plumbing',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Get vendor profile
  async getProfile(): Promise<ApiResponse<VendorProfile>> {
    const backendCall = () => apiClient.get(API_ENDPOINTS.VENDOR.PROFILE);
    
    const mockData: VendorProfile = {
      id: 'vendor_123',
      firstName: 'Mike',
      lastName: 'Rodriguez',
      email: 'mike@rodriguezplumbing.com',
      phone: '+1234567890',
      businessName: 'Rodriguez Plumbing',
      services: ['Plumbing', 'Pipe Repair', 'Emergency Services'],
      metroArea: 'San Francisco',
      profileImage: 'https://i.pravatar.cc/100?img=8',
      portfolio: [],
      rating: 4.9,
      reviewCount: 15,
      isVerified: true,
      isOnline: true,
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Update vendor profile
  async updateProfile(profileData: Partial<VendorProfile>): Promise<ApiResponse<VendorProfile>> {
    const backendCall = () => apiClient.put(API_ENDPOINTS.VENDOR.PROFILE, profileData);
    
    const mockData: VendorProfile = {
      id: 'vendor_123',
      firstName: profileData.firstName || 'Mike',
      lastName: profileData.lastName || 'Rodriguez',
      email: profileData.email || 'mike@rodriguezplumbing.com',
      phone: profileData.phone || '+1234567890',
      businessName: profileData.businessName || 'Rodriguez Plumbing',
      services: profileData.services || ['Plumbing', 'Pipe Repair', 'Emergency Services'],
      metroArea: profileData.metroArea || 'San Francisco',
      profileImage: profileData.profileImage || 'https://i.pravatar.cc/100?img=8',
      portfolio: profileData.portfolio || [],
      rating: 4.9,
      reviewCount: 15,
      isVerified: true,
      isOnline: true,
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Search vendors (for vendor-to-vendor connections)
  async searchVendors(query: string, filters?: {
    service?: string;
    location?: string;
    rating?: number;
  }): Promise<ApiResponse<{ vendors: VendorProfile[]; total: number }>> {
    const backendCall = () => {
      const params = new URLSearchParams({
        q: query,
        ...(filters?.service && { service: filters.service }),
        ...(filters?.location && { location: filters.location }),
        ...(filters?.rating && { rating: filters.rating.toString() }),
      });
      
      return apiClient.get(`${API_ENDPOINTS.VENDOR.SEARCH}?${params}`);
    };
    
    // Mock search results
    const allVendors: VendorProfile[] = [
      {
        id: 'vendor_2',
        firstName: 'Jennifer',
        lastName: 'Chen',
        email: 'jennifer@chenelectric.com',
        businessName: 'Chen Electric',
        services: ['Electrical', 'Wiring'],
        rating: 4.8,
        reviewCount: 22,
        profileImage: 'https://i.pravatar.cc/100?img=5',
        metroArea: 'San Francisco',
        isVerified: true,
        isOnline: true,
      },
      {
        id: 'vendor_3',
        firstName: 'David',
        lastName: 'Kim',
        email: 'david@kimhandyman.com',
        businessName: 'Kim Handyman Services',
        services: ['Handyman', 'Repairs'],
        rating: 4.7,
        reviewCount: 18,
        profileImage: 'https://i.pravatar.cc/100?img=12',
        metroArea: 'San Francisco',
        isVerified: true,
        isOnline: false,
      },
    ];

    // Simple mock filtering
    const filteredVendors = allVendors.filter(vendor => {
      const matchesQuery = query === '' || 
        vendor.firstName.toLowerCase().includes(query.toLowerCase()) ||
        vendor.lastName.toLowerCase().includes(query.toLowerCase()) ||
        vendor.services.some(service => service.toLowerCase().includes(query.toLowerCase()));
      
      const matchesRating = !filters?.rating || (vendor.rating && vendor.rating >= filters.rating);
      
      return matchesQuery && matchesRating;
    });

    const mockData = {
      vendors: filteredVendors,
      total: filteredVendors.length,
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Get vendor connections
  async getConnections(): Promise<ApiResponse<Connection[]>> {
    const backendCall = () => apiClient.get(`${API_ENDPOINTS.VENDOR.PROFILE}/connections`);
    
    const mockData: Connection[] = [
      {
        id: 'conn_1',
        consumerName: 'John Doe',
        consumerImage: 'https://i.pravatar.cc/100?img=1',
        service: 'Plumbing repair',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      },
      {
        id: 'conn_2',
        consumerName: 'Jane Smith',
        consumerImage: 'https://i.pravatar.cc/100?img=2',
        service: 'Pipe installation',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'conn_3',
        consumerName: 'Bob Johnson',
        consumerImage: 'https://i.pravatar.cc/100?img=3',
        service: 'Emergency plumbing',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Accept connection request
  async acceptConnection(connectionId: string): Promise<ApiResponse<Connection>> {
    const backendCall = () => apiClient.put(`${API_ENDPOINTS.VENDOR.PROFILE}/connections/${connectionId}/accept`);
    
    const mockData: Connection = {
      id: connectionId,
      consumerName: 'Bob Johnson',
      consumerImage: 'https://i.pravatar.cc/100?img=3',
      service: 'Emergency plumbing',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Decline connection request
  async declineConnection(connectionId: string): Promise<ApiResponse> {
    const backendCall = () => apiClient.put(`${API_ENDPOINTS.VENDOR.PROFILE}/connections/${connectionId}/decline`);
    
    return this.useBackendOrMock(backendCall, { message: 'Connection declined successfully' });
  }
}

// Export singleton instance
export const vendorService = new VendorService();
export default vendorService;
