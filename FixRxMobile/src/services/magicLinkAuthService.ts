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
  retryAfter?: number;
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

  async sendMagicLink(request: MagicLinkSendRequest): Promise<MagicLinkAuthResponse> {
    try {

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
        return {
          success: false,
          message: data.message || 'Failed to send magic link',
          code: data.code,
        };
      }

      return {
        success: true,
        message: data.message,
        data: data.data,
      };

    } catch (error) {
      if (__DEV__) {
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

  async verifyMagicLink(request: MagicLinkVerifyRequest, retryCount: number = 0): Promise<MagicLinkAuthResponse> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    try {

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
        if (data.code === 'VERIFICATION_RATE_LIMIT_EXCEEDED' && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount);
          const retryAfter = data.retryAfter ? data.retryAfter * 1000 : delay;
          
          await new Promise(resolve => setTimeout(resolve, Math.min(delay, retryAfter)));
          return this.verifyMagicLink(request, retryCount + 1);
        }
        
        return {
          success: false,
          message: this.getErrorMessage(data.code, data.message),
          code: data.code,
          retryAfter: data.retryAfter,
        };
      }

      if (data.data?.token && data.data?.user) {
        await this.storeAuthData(data.data.token, data.data.user);
      }

      return {
        success: true,
        message: data.message,
        data: data.data,
      };

    } catch (error) {
      if (retryCount < maxRetries && this.isNetworkError(error)) {
        const delay = baseDelay * Math.pow(2, retryCount);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.verifyMagicLink(request, retryCount + 1);
      }
      
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

  private getErrorMessage(code: string, defaultMessage: string): string {
    const errorMessages: Record<string, string> = {
      'TOKEN_EXPIRED': 'This magic link has expired. Please request a new one.',
      'TOKEN_ALREADY_USED': 'This magic link has already been used. Please request a new one.',
      'INVALID_TOKEN': 'Invalid magic link. Please check your email and try again.',
      'VERIFICATION_RATE_LIMIT_EXCEEDED': 'Too many attempts. Please wait a moment before trying again.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait before requesting another magic link.',
    };
    
    return errorMessages[code] || defaultMessage;
  }

  private isNetworkError(error: any): boolean {
    return error.name === 'TypeError' || 
           error.message?.includes('fetch') || 
           error.message?.includes('network') ||
           error.code === 'NETWORK_ERROR';
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(this.storageKeys.token);
      const user = await AsyncStorage.getItem(this.storageKeys.user);
      
      return !!(token && user);
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<MagicLinkUser | null> {
    try {
      const userJson = await AsyncStorage.getItem(this.storageKeys.user);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.storageKeys.token);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.storageKeys.token,
        this.storageKeys.user,
        this.storageKeys.refreshToken,
      ]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  private async storeAuthData(token: string, user: MagicLinkUser): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [this.storageKeys.token, token],
        [this.storageKeys.user, JSON.stringify(user)],
      ]);
    } catch (error) {
      console.error('Store auth data error:', error);
      throw error;
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

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
