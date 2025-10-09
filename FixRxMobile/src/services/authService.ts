/**
 * Authentication Service for FixRx Mobile
 * Non-intrusive auth service with fallback to mock data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { magicLinkAuthService } from './magicLinkAuthService';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'consumer' | 'vendor';
  phone?: string;
  profileImage?: string;
  isVerified?: boolean;
  metroArea?: string;
  createdAt?: string;
}

export interface AuthTokens {
  token: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'consumer' | 'vendor';
  phone?: string;
  metroArea?: string;
}

class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'auth_user';

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

  /**
   * Login user
   * @param credentials Login credentials
   * @returns Promise with authentication response
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: AuthUser; token: string }>> {
    const backendCall = () => apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    
    const mockData = {
      user: {
        id: 'user_123',
        email: credentials.email,
        firstName: 'John',
        lastName: 'Doe',
        userType: 'consumer' as const,
        phone: '+1234567890',
        profileImage: 'https://i.pravatar.cc/100?img=1',
        isVerified: true,
        metroArea: 'San Francisco',
        createdAt: new Date().toISOString(),
      } as AuthUser,
      token: `mock_token_${Date.now()}`,
    };

    const response = await this.useBackendOrMock(backendCall, mockData);

    if (response.success && response.data) {
      await this.saveAuthData(response.data.user, response.data.token);
    }

    return response;
  }

  // Login via Google OAuth using ID token
  async loginWithGoogle(
    idToken: string
  ): Promise<ApiResponse<{ user: AuthUser; token: string; isNewUser: boolean }>> {
    const backendCall = () =>
      apiClient.post<{ user: AuthUser; token: string; isNewUser: boolean }>(
        API_ENDPOINTS.AUTH.OAUTH.GOOGLE_VERIFY,
        { idToken }
      );

    const mockData = {
      user: {
        id: `google_user_${Date.now()}`,
        email: `user${Date.now()}@example.com`,
        firstName: 'Google',
        lastName: 'User',
        userType: 'consumer' as const,
        isVerified: true,
      },
      token: `mock_google_token_${Date.now()}`,
      isNewUser: true,
    };

    const response = await this.useBackendOrMock(backendCall, mockData);

    if (response.success && response.data) {
      await this.saveAuthData(response.data.user, response.data.token);
    }

    return response;
  }

  // Logout user
  async logout(): Promise<ApiResponse> {
    try {
      // Try to call backend logout if available
      const isAvailable = await apiClient.isBackendAvailable();
      if (isAvailable) {
        await apiClient.delete(API_ENDPOINTS.AUTH.LOGOUT);
      }
    } catch (error) {
      console.log('Backend logout failed, continuing with local logout');
    }

    // Always clear local data
    await this.clearAuthData();
    
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  // Get user profile
  async getProfile(): Promise<ApiResponse<AuthUser>> {
    const backendCall = () => apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
    
    const mockData = {
      id: 'user_123',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userType: 'consumer' as const,
      phone: '+1234567890',
      profileImage: 'https://i.pravatar.cc/100?img=1',
      isVerified: true,
      metroArea: 'San Francisco',
      createdAt: new Date().toISOString(),
    } as AuthUser;

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Save authentication data to storage
  private async saveAuthData(user: AuthUser, token: string, refreshToken?: string): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [AuthService.TOKEN_KEY, token],
        [AuthService.USER_KEY, JSON.stringify(user)],
        ...(refreshToken ? [[AuthService.REFRESH_TOKEN_KEY, refreshToken]] : []),
      ]);
      
      // Set token in API client
      apiClient.setAuthToken(token);
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  }

  // Clear authentication data
  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        AuthService.TOKEN_KEY,
        AuthService.REFRESH_TOKEN_KEY,
        AuthService.USER_KEY,
      ]);
      
      // Clear token from API client
      apiClient.setAuthToken(null);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  // Get stored token
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AuthService.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }

  // Get stored user
  async getStoredUser(): Promise<AuthUser | null> {
    try {
      const userJson = await AsyncStorage.getItem(AuthService.USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Failed to get stored user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    const user = await this.getStoredUser();
    
    if (token && user) {
      // Set token in API client for future requests
      apiClient.setAuthToken(token);
      return true;
    }
    
    return false;
  }

  // Initialize auth service (call on app start)
  async initialize(): Promise<void> {
    const token = await this.getStoredToken();
    if (token) {
      apiClient.setAuthToken(token);
    }
  }

  // Magic Link Authentication Methods
  // These methods integrate magic link auth with existing auth flow

  /**
   * Send magic link for passwordless login
   */
  async sendMagicLink(email: string, purpose: 'LOGIN' | 'REGISTRATION' = 'REGISTRATION'): Promise<ApiResponse<{ expiresIn: number }>> {
    try {
      const result = await magicLinkAuthService.sendMagicLink({ email, purpose });
      
      if (result.success) {
        return {
          success: true,
          message: result.message,
          data: { expiresIn: result.data?.expiresIn || 900 },
        };
      } else {
        return {
          success: false,
          message: result.message,
          error: result.message,
        };
      }
    } catch (error) {
      console.error('Magic link send error:', error);
      return {
        success: false,
        message: 'Failed to send magic link',
        error: 'Network error occurred',
      };
    }
  }

  /**
   * Verify magic link and authenticate user
   */
  async verifyMagicLink(token: string, email: string): Promise<ApiResponse<{ user: AuthUser; token: string; isNewUser: boolean }>> {
    try {
      const result = await magicLinkAuthService.verifyMagicLink({ token, email });
      
      if (result.success && result.data?.user && result.data?.token) {
        // Transform magic link user to AuthUser format
        const authUser: AuthUser = {
          id: result.data.user.id,
          email: result.data.user.email,
          firstName: result.data.user.firstName,
          lastName: result.data.user.lastName,
          userType: result.data.user.userType.toLowerCase() as 'consumer' | 'vendor',
          isVerified: result.data.user.isVerified,
        };

        // Save auth data using existing method
        await this.saveAuthData(authUser, result.data.token);

        return {
          success: true,
          message: result.message,
          data: {
            user: authUser,
            token: result.data.token,
            isNewUser: result.data.isNewUser || false,
          },
        };
      } else {
        return {
          success: false,
          message: result.message,
          error: { code: result.code || 'VERIFICATION_ERROR', message: result.message },
        };
      }
    } catch (error) {
      console.error('Magic link verification error:', error);
      return {
        success: false,
        message: 'Failed to verify magic link',
        error: { code: 'NETWORK_ERROR', message: 'Network error occurred' },
      };
    }
  }

  /**
   * Check if magic link service is available
   */
  async isMagicLinkAvailable(): Promise<boolean> {
    try {
      return await magicLinkAuthService.checkHealth();
    } catch (error) {
      console.error('Magic link health check failed:', error);
      return false;
    }
  }

  /**
   * Validate email format for magic link
   */
  validateEmailForMagicLink(email: string): boolean {
    return magicLinkAuthService.validateEmail(email);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
