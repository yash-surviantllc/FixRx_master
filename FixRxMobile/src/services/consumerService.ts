/**
 * Consumer Service for FixRx Mobile
 * Non-intrusive consumer service with fallback to mock data
 */

import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface Vendor {
  id: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  services: string[];
  rating: number;
  reviewCount: number;
  profileImage?: string;
  distance?: number;
  isOnline?: boolean;
  metroArea?: string;
  isVerified?: boolean;
  recommendationReason?: string;
  recommendedBy?: number;
  available?: boolean;
}

export interface ConsumerStats {
  totalConnections: number;
  activeProjects: number;
  completedProjects: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface RecentService {
  id: string;
  vendorName: string;
  service: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  rating?: number;
  completedAt?: string;
}

export interface DashboardData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  stats: ConsumerStats;
  recentActivity: RecentActivity[];
  recommendedVendors: Vendor[];
  recentServices: RecentService[];
}

class ConsumerService {
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

  // Get consumer dashboard data
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    const backendCall = () => apiClient.get(API_ENDPOINTS.CONSUMER.DASHBOARD);
    
    const mockData: DashboardData = {
      user: {
        id: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        profileImage: 'https://i.pravatar.cc/100?img=1',
      },
      stats: {
        totalConnections: 5,
        activeProjects: 2,
        completedProjects: 8,
      },
      recentActivity: [
        {
          id: 'activity_1',
          type: 'connection',
          description: 'Connected with Mike Rodriguez',
          createdAt: new Date().toISOString(),
        },
      ],
      recommendedVendors: [
        {
          id: '1',
          firstName: 'Mike',
          lastName: 'Rodriguez',
          businessName: 'Rodriguez Plumbing',
          services: ['Plumbing'],
          rating: 4.9,
          reviewCount: 15,
          profileImage: 'https://i.pravatar.cc/100?img=8',
          distance: 2.5,
          isOnline: true,
          recommendedBy: 3,
          available: true,
        },
        {
          id: '2',
          firstName: 'Jennifer',
          lastName: 'Chen',
          businessName: 'Chen Electric',
          services: ['Electrical'],
          rating: 4.8,
          reviewCount: 22,
          profileImage: 'https://i.pravatar.cc/100?img=5',
          distance: 1.8,
          isOnline: true,
          recommendedBy: 7,
          available: true,
        },
        {
          id: '3',
          firstName: 'David',
          lastName: 'Kim',
          businessName: 'Kim Handyman Services',
          services: ['Handyman'],
          rating: 4.7,
          reviewCount: 18,
          profileImage: 'https://i.pravatar.cc/100?img=12',
          distance: 3.2,
          isOnline: false,
          recommendedBy: 2,
          available: true,
        },
        {
          id: '4',
          firstName: 'Carlos',
          lastName: 'Martinez',
          businessName: 'Martinez Construction',
          services: ['Construction'],
          rating: 4.9,
          reviewCount: 31,
          profileImage: 'https://i.pravatar.cc/100?img=15',
          distance: 4.1,
          isOnline: true,
          recommendedBy: 5,
          available: false,
        },
      ],
      recentServices: [
        {
          id: 'service_1',
          vendorName: 'Mike Rodriguez',
          service: 'Plumbing repair',
          status: 'completed',
          rating: null,
          completedAt: new Date().toISOString(),
        },
      ],
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Get recommended vendors
  async getRecommendations(): Promise<ApiResponse<{ vendors: Vendor[]; total: number }>> {
    const backendCall = () => apiClient.get(API_ENDPOINTS.CONSUMER.RECOMMENDATIONS);
    
    const mockData = {
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
          recommendationReason: 'Highly rated in your area',
        },
      ],
      total: 1,
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Search vendors
  async searchVendors(query: string, filters?: {
    service?: string;
    location?: string;
    rating?: number;
    availability?: boolean;
  }): Promise<ApiResponse<{ vendors: Vendor[]; total: number }>> {
    const backendCall = () => {
      const params = new URLSearchParams({
        q: query,
        ...(filters?.service && { service: filters.service }),
        ...(filters?.location && { location: filters.location }),
        ...(filters?.rating && { rating: filters.rating.toString() }),
        ...(filters?.availability && { availability: filters.availability.toString() }),
      });
      
      return apiClient.get(`${API_ENDPOINTS.VENDOR.SEARCH}?${params}`);
    };
    
    // Mock search results based on query
    const allVendors: Vendor[] = [
      {
        id: '1',
        firstName: 'Mike',
        lastName: 'Rodriguez',
        businessName: 'Rodriguez Plumbing',
        services: ['Plumbing', 'Pipe Repair'],
        rating: 4.9,
        reviewCount: 15,
        profileImage: 'https://i.pravatar.cc/100?img=8',
        available: true,
      },
      {
        id: '2',
        firstName: 'Jennifer',
        lastName: 'Chen',
        businessName: 'Chen Electric',
        services: ['Electrical', 'Wiring'],
        rating: 4.8,
        reviewCount: 22,
        profileImage: 'https://i.pravatar.cc/100?img=5',
        available: true,
      },
      {
        id: '3',
        firstName: 'David',
        lastName: 'Kim',
        businessName: 'Kim Handyman Services',
        services: ['Handyman', 'Repairs'],
        rating: 4.7,
        reviewCount: 18,
        profileImage: 'https://i.pravatar.cc/100?img=12',
        available: true,
      },
    ];

    // Simple mock filtering
    const filteredVendors = allVendors.filter(vendor => {
      const matchesQuery = query === '' || 
        vendor.firstName.toLowerCase().includes(query.toLowerCase()) ||
        vendor.lastName.toLowerCase().includes(query.toLowerCase()) ||
        vendor.services.some(service => service.toLowerCase().includes(query.toLowerCase()));
      
      const matchesAvailability = !filters?.availability || vendor.available === filters.availability;
      const matchesRating = !filters?.rating || vendor.rating >= filters.rating;
      
      return matchesQuery && matchesAvailability && matchesRating;
    });

    const mockData = {
      vendors: filteredVendors,
      total: filteredVendors.length,
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Get vendor profile
  async getVendorProfile(vendorId: string): Promise<ApiResponse<Vendor>> {
    const backendCall = () => apiClient.get(`${API_ENDPOINTS.VENDOR.PROFILE}/${vendorId}`);
    
    const mockData: Vendor = {
      id: vendorId,
      firstName: 'Mike',
      lastName: 'Rodriguez',
      businessName: 'Rodriguez Plumbing',
      services: ['Plumbing', 'Pipe Repair', 'Emergency Services'],
      rating: 4.9,
      reviewCount: 15,
      profileImage: 'https://i.pravatar.cc/100?img=8',
      distance: 2.5,
      isOnline: true,
      metroArea: 'San Francisco',
      isVerified: true,
      recommendationReason: 'Highly recommended by mutual connections',
    };

    return this.useBackendOrMock(backendCall, mockData);
  }
}

// Export singleton instance
export const consumerService = new ConsumerService();
export default consumerService;
