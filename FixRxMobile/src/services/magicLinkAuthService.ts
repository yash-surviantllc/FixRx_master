/**
 * Magic Link Authentication Service for FixRx Mobile
 * Integrates with existing auth system without modifying UI components
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

export interface MagicLinkSendRequest {
  email: string;
  purpose?: 'LOGIN' | 'REGISTRATION';
}

export interface MagicLinkVerifyRequest {
  token: string;
  email: string;
}

export interface MagicLinkUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'CONSUMER' | 'VENDOR';
  isVerified: boolean;
}

export interface MagicLinkAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: MagicLinkUser;
    token?: string;
    isNewUser?: boolean;
    expiresIn?: number;
  };
  code?: string;
}

class MagicLinkAuthService {
  private readonly baseUrl: string;
  private readonly storageKeys = {
    token: 'auth_token',
    user: 'auth_user',
    refreshToken: 'refresh_token',
  };

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/auth/magic-link`;
  }

  /**
   * Send magic link to email address
   */
  async sendMagicLink(request: MagicLinkSendRequest): Promise<MagicLinkAuthResponse> {
    try {
      console.log('🔗 Sending magic link to:', request.email);

      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email.toLowerCase().trim(),
          purpose: request.purpose || 'REGISTRATION',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Magic link send failed:', data);
        return {
          success: false,
          message: data.message || 'Failed to send magic link',
          code: data.code,
        };
      }

      console.log('✅ Magic link sent successfully');
      return {
        success: true,
        message: data.message,
        data: data.data,
      };

    } catch (error) {
      console.error('❌ Magic link send error:', error);
      
      // Fallback for development/offline mode
      if (__DEV__) {
        console.log('🔧 Using development fallback');
        return {
          success: true,
          message: 'Magic link sent (development mode)',
          data: {
            expiresIn: 900,
          },
        };
      }

      return {
        success: false,
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Verify magic link token and authenticate user
   */
  async verifyMagicLink(request: MagicLinkVerifyRequest): Promise<MagicLinkAuthResponse> {
    try {
      console.log('🔐 Verifying magic link token');

      const response = await fetch(`${this.baseUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: request.token,
          email: request.email.toLowerCase().trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Magic link verification failed:', data);
        return {
          success: false,
          message: data.message || 'Invalid or expired magic link',
          code: data.code,
        };
      }

      // Store authentication data
      if (data.data?.token && data.data?.user) {
        await this.storeAuthData(data.data.token, data.data.user);
        console.log('✅ User authenticated via magic link');
      }

      return {
        success: true,
        message: data.message,
        data: data.data,
      };

    } catch (error) {
      console.error('❌ Magic link verification error:', error);
      
      // Fallback for development/offline mode
      if (__DEV__ && request.token === 'dev-token') {
        const mockUser: MagicLinkUser = {
          id: 'dev-user-id',
          email: request.email,
          firstName: 'Dev',
          lastName: 'User',
          userType: 'CONSUMER',
          isVerified: true,
        };

        const mockToken = 'dev-jwt-token';
        await this.storeAuthData(mockToken, mockUser);

        console.log('🔧 Using development fallback authentication');
        return {
          success: true,
          message: 'Authenticated (development mode)',
          data: {
            user: mockUser,
            token: mockToken,
            isNewUser: false,
          },
        };
      }

      return {
        success: false,
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(this.storageKeys.token);
      const user = await AsyncStorage.getItem(this.storageKeys.user);
      
      return !!(token && user);
    } catch (error) {
      console.error('❌ Auth check error:', error);
      return false;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<MagicLinkUser | null> {
    try {
      const userJson = await AsyncStorage.getItem(this.storageKeys.user);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('❌ Get user error:', error);
      return null;
    }
  }

  /**
   * Get current auth token
   */
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.storageKeys.token);
    } catch (error) {
      console.error('❌ Get token error:', error);
      return null;
    }
  }

  /**
   * Logout user (clear stored data)
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.storageKeys.token,
        this.storageKeys.user,
        this.storageKeys.refreshToken,
      ]);
      console.log('✅ User logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }

  /**
   * Store authentication data securely
   */
  private async storeAuthData(token: string, user: MagicLinkUser): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [this.storageKeys.token, token],
        [this.storageKeys.user, JSON.stringify(user)],
      ]);
    } catch (error) {
      console.error('❌ Store auth data error:', error);
      throw error;
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  /**
   * Integration with existing auth service
   * This method allows seamless integration with your existing authService
   */
  async integrateWithExistingAuth(): Promise<{
    sendMagicLink: (email: string, purpose?: string) => Promise<any>;
    verifyMagicLink: (token: string, email: string) => Promise<any>;
    isAuthenticated: () => Promise<boolean>;
    getCurrentUser: () => Promise<any>;
    logout: () => Promise<void>;
  }> {
    return {
      sendMagicLink: async (email: string, purpose: string = 'LOGIN') => {
        const result = await this.sendMagicLink({ 
          email, 
          purpose: purpose as 'LOGIN' | 'REGISTRATION' 
        });
        
        // Transform to match existing auth service format
        return {
          success: result.success,
          message: result.message,
          data: result.data,
          error: result.success ? null : { code: result.code, message: result.message },
        };
      },

      verifyMagicLink: async (token: string, email: string) => {
        const result = await this.verifyMagicLink({ token, email });
        
        // Transform to match existing auth service format
        return {
          success: result.success,
          message: result.message,
          user: result.data?.user,
          token: result.data?.token,
          isNewUser: result.data?.isNewUser,
          error: result.success ? null : { code: result.code, message: result.message },
        };
      },

      isAuthenticated: this.isAuthenticated.bind(this),
      getCurrentUser: this.getCurrentUser.bind(this),
      logout: this.logout.bind(this),
    };
  }
}

// Export singleton instance
export const magicLinkAuthService = new MagicLinkAuthService();
export default magicLinkAuthService;
