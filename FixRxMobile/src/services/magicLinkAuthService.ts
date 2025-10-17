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
    console.log('MagicLinkAuthService initialized:', { 
      baseUrl: this.baseUrl,
      apiConfigBaseUrl: API_CONFIG.BASE_URL,
      envValue: process.env.EXPO_PUBLIC_API_BASE_URL
    });
  }

  async sendMagicLink(request: MagicLinkSendRequest): Promise<MagicLinkAuthResponse> {
    try {
      const url = `${this.baseUrl}/send`;
      console.log('Sending magic link request:', { 
        url,
        email: request.email,
        purpose: request.purpose || 'REGISTRATION'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email.toLowerCase().trim(),
          purpose: request.purpose || 'REGISTRATION',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response received:', { 
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('Response data:', data); 

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
      console.error('Network error in sendMagicLink:', { 
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
        url: `${this.baseUrl}/send`
      });
      
      // Check if it's a timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please check if the backend server is running.',
          code: 'TIMEOUT_ERROR',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please check your connection and ensure the backend is running.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  async verifyMagicLink(request: MagicLinkVerifyRequest, retryCount: number = 0): Promise<MagicLinkAuthResponse> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    try {
      console.log('Verifying magic link with backend...', { 
        url: `${this.baseUrl}/verify`,
        email: request.email,
        tokenLength: request.token?.length
      });

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

      console.log('Response status:', response.status, response.statusText); 
      const data = await response.json();
      console.log('Response data:', data); 

      if (!response.ok) {
        console.error('Verification failed:', { 
          status: response.status,
          code: data.code,
          message: data.message
        });
        
        // Auto-retry for expired tokens in development
        if ((data.code === 'TOKEN_EXPIRED' || data.message?.includes('expired')) && __DEV__ && retryCount === 0) {
          console.log('🔄 Token expired, auto-generating fresh link...');
          
          try {
            // Automatically send a new magic link
            const freshLinkResult = await this.sendMagicLink({ 
              email: request.email, 
              purpose: 'REGISTRATION' // Default to registration for testing
            });
            
            if (freshLinkResult.success) {
              return {
                success: false,
                message: 'Your link expired. A fresh magic link has been sent to your email automatically.',
                code: 'FRESH_LINK_SENT'
              };
            }
          } catch (autoRetryError) {
            console.error('Auto-retry failed:', autoRetryError);
          }
        }
        
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
      console.error('Network error during verification:', error); 
      
      // Don't retry if token is already used or invalid
      const errorMessage = (error as any)?.message || '';
      if (errorMessage.includes('already been used') || errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
        throw error;
      }
      
      if (retryCount < maxRetries && this.isNetworkError(error)) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`); 
        
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

  async handleExpiredToken(email: string, purpose: 'LOGIN' | 'REGISTRATION' = 'REGISTRATION'): Promise<MagicLinkAuthResponse> {
    try {
      console.log(' Token expired, automatically requesting new magic link...');
      
      // Automatically send a new magic link
      const newLinkResult = await this.sendMagicLink({ email, purpose });
      
      if (newLinkResult.success) {
        return {
          success: false,
          message: 'Your previous link expired. A new magic link has been sent to your email.',
          code: 'NEW_LINK_SENT'
        };
      } else {
        return {
          success: false,
          message: 'Link expired and failed to send new one. Please try again.',
          code: 'AUTO_RETRY_FAILED'
        };
      }
    } catch (error) {
      console.error('Failed to auto-send new magic link:', error);
      return {
        success: false,
        message: 'Link expired. Please request a new magic link manually.',
        code: 'TOKEN_EXPIRED'
      };
    }
  }

  private getErrorMessage(code?: string, fallback?: string): string {
    switch (code) {
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too many requests. Please wait a moment before trying again.';
      case 'USER_ALREADY_EXISTS':
        return 'An account already exists with this email. Please use the login option.';
      case 'USER_NOT_FOUND':
        return 'No account found with this email. Please register first.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
      case 'TOKEN_EXPIRED':
      case 'TOKEN_INVALID':
        return 'This magic link has expired. A new one has been sent to your email.';
      case 'TOKEN_ALREADY_USED':
        return 'This magic link has already been used. Please check your email for a new one.';
      case 'NEW_LINK_SENT':
        return 'Your previous link expired. A new magic link has been sent to your email.';
      case 'AUTO_RETRY_FAILED':
        return 'Link expired and failed to send new one. Please try again.';
      default:
        return fallback || 'An unexpected error occurred. Please try again.';
    }
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
