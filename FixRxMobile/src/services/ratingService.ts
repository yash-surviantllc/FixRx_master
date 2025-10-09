/**
 * Rating Service for FixRx Mobile
 * Non-intrusive rating service with fallback to mock data
 */

import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface Rating {
  id: string;
  vendorId: string;
  consumerId: string;
  vendorName: string;
  consumerName: string;
  serviceType: string;
  cost: number;
  quality: number;
  timeliness: number;
  professionalism: number;
  overallRating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RatingData {
  vendorId: string;
  serviceType: string;
  cost: number;
  quality: number;
  timeliness: number;
  professionalism: number;
  comment?: string;
}

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  categoryAverages: {
    cost: number;
    quality: number;
    timeliness: number;
    professionalism: number;
  };
  recentRatings: Rating[];
}

class RatingService {
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

  // Create a new rating
  async createRating(ratingData: RatingData): Promise<ApiResponse<Rating>> {
    const backendCall = () => apiClient.post(API_ENDPOINTS.RATINGS.CREATE, ratingData);
    
    const overallRating = (ratingData.cost + ratingData.quality + ratingData.timeliness + ratingData.professionalism) / 4;
    
    const mockData: Rating = {
      id: `rating_${Date.now()}`,
      vendorId: ratingData.vendorId,
      consumerId: 'user_123',
      vendorName: 'Mike Rodriguez',
      consumerName: 'John Doe',
      serviceType: ratingData.serviceType,
      cost: ratingData.cost,
      quality: ratingData.quality,
      timeliness: ratingData.timeliness,
      professionalism: ratingData.professionalism,
      overallRating,
      comment: ratingData.comment,
      createdAt: new Date().toISOString(),
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Get ratings for a vendor
  async getVendorRatings(vendorId: string): Promise<ApiResponse<Rating[]>> {
    const backendCall = () => apiClient.get(`${API_ENDPOINTS.RATINGS.GET}/vendor/${vendorId}`);
    
    const mockData: Rating[] = [
      {
        id: 'rating_1',
        vendorId,
        consumerId: 'user_123',
        vendorName: 'Mike Rodriguez',
        consumerName: 'John Doe',
        serviceType: 'Plumbing repair',
        cost: 5,
        quality: 5,
        timeliness: 4,
        professionalism: 5,
        overallRating: 4.75,
        comment: 'Excellent service! Very professional and quick.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'rating_2',
        vendorId,
        consumerId: 'user_456',
        vendorName: 'Mike Rodriguez',
        consumerName: 'Jane Smith',
        serviceType: 'Pipe installation',
        cost: 4,
        quality: 5,
        timeliness: 5,
        professionalism: 5,
        overallRating: 4.75,
        comment: 'Great work, highly recommended!',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Get ratings by a consumer
  async getConsumerRatings(consumerId?: string): Promise<ApiResponse<Rating[]>> {
    const backendCall = () => apiClient.get(`${API_ENDPOINTS.RATINGS.GET}/consumer/${consumerId || 'me'}`);
    
    const mockData: Rating[] = [
      {
        id: 'rating_1',
        vendorId: 'vendor_1',
        consumerId: consumerId || 'user_123',
        vendorName: 'Mike Rodriguez',
        consumerName: 'John Doe',
        serviceType: 'Plumbing repair',
        cost: 5,
        quality: 5,
        timeliness: 4,
        professionalism: 5,
        overallRating: 4.75,
        comment: 'Excellent service! Very professional and quick.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Get rating statistics for a vendor
  async getVendorRatingStats(vendorId: string): Promise<ApiResponse<RatingStats>> {
    const backendCall = () => apiClient.get(`${API_ENDPOINTS.RATINGS.GET}/vendor/${vendorId}/stats`);
    
    const mockData: RatingStats = {
      averageRating: 4.8,
      totalRatings: 15,
      categoryAverages: {
        cost: 4.6,
        quality: 4.9,
        timeliness: 4.7,
        professionalism: 4.9,
      },
      recentRatings: [
        {
          id: 'rating_1',
          vendorId,
          consumerId: 'user_123',
          vendorName: 'Mike Rodriguez',
          consumerName: 'John Doe',
          serviceType: 'Plumbing repair',
          cost: 5,
          quality: 5,
          timeliness: 4,
          professionalism: 5,
          overallRating: 4.75,
          comment: 'Excellent service! Very professional and quick.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'rating_2',
          vendorId,
          consumerId: 'user_456',
          vendorName: 'Mike Rodriguez',
          consumerName: 'Jane Smith',
          serviceType: 'Pipe installation',
          cost: 4,
          quality: 5,
          timeliness: 5,
          professionalism: 5,
          overallRating: 4.75,
          comment: 'Great work, highly recommended!',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Update a rating
  async updateRating(ratingId: string, ratingData: Partial<RatingData>): Promise<ApiResponse<Rating>> {
    const backendCall = () => apiClient.put(`${API_ENDPOINTS.RATINGS.UPDATE}/${ratingId}`, ratingData);
    
    const mockData: Rating = {
      id: ratingId,
      vendorId: ratingData.vendorId || 'vendor_1',
      consumerId: 'user_123',
      vendorName: 'Mike Rodriguez',
      consumerName: 'John Doe',
      serviceType: ratingData.serviceType || 'Plumbing repair',
      cost: ratingData.cost || 5,
      quality: ratingData.quality || 5,
      timeliness: ratingData.timeliness || 4,
      professionalism: ratingData.professionalism || 5,
      overallRating: ((ratingData.cost || 5) + (ratingData.quality || 5) + (ratingData.timeliness || 4) + (ratingData.professionalism || 5)) / 4,
      comment: ratingData.comment,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Delete a rating
  async deleteRating(ratingId: string): Promise<ApiResponse> {
    const backendCall = () => apiClient.delete(`${API_ENDPOINTS.RATINGS.GET}/${ratingId}`);
    
    return this.useBackendOrMock(backendCall, { message: 'Rating deleted successfully' });
  }

  // Get pending ratings (services that need to be rated)
  async getPendingRatings(): Promise<ApiResponse<Array<{
    id: string;
    vendorId: string;
    vendorName: string;
    serviceType: string;
    completedAt: string;
  }>>> {
    const backendCall = () => apiClient.get(`${API_ENDPOINTS.RATINGS.GET}/pending`);
    
    const mockData = [
      {
        id: 'service_1',
        vendorId: 'vendor_1',
        vendorName: 'Mike Rodriguez',
        serviceType: 'Plumbing repair',
        completedAt: new Date().toISOString(),
      },
    ];

    return this.useBackendOrMock(backendCall, mockData);
  }
}

// Export singleton instance
export const ratingService = new RatingService();
export default ratingService;
