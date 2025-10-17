/**
 * Deep Link Handler for Magic Link Authentication
 * Handles magic link verification when user clicks email link
 */

import { Linking, Alert } from 'react-native';
import { magicLinkAuthService } from '../services/magicLinkAuthService';
import { navigationRef } from '../navigation/navigationRef';
import CrashPrevention from './crashPrevention';

export interface DeepLinkParams {
  token?: string;
  email?: string;
  action?: string;
}

class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private lastProcessedUrl: string | null = null;
  private processingTimeout: NodeJS.Timeout | null = null;
  private listeners: Array<(params: DeepLinkParams) => void> = [];
  private isVerifying: boolean = false;

  private constructor() {}
  
  static getInstance(): DeepLinkHandler {
    if (!DeepLinkHandler.instance) {
      DeepLinkHandler.instance = new DeepLinkHandler();
    }
    return DeepLinkHandler.instance;
  }

  initialize() {
    // Handle app launch from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink(url);
      }
    });

    // Handle deep links when app is already running
    const linkingListener = Linking.addEventListener('url', (event) => {
      this.handleDeepLink(event.url);
    });

    return () => {
      linkingListener?.remove();
    };
  }

  private async handleDeepLink(url: string) {
    try {
      console.log('Deep link received:', url);
      
      // Debounce: Ignore duplicate URLs within 2 seconds
      if (this.lastProcessedUrl === url) {
        console.log('Duplicate deep link ignored (debounced)');
        return;
      }
      
      this.lastProcessedUrl = url;
      
      // Clear previous timeout
      if (this.processingTimeout) {
        clearTimeout(this.processingTimeout);
      }
      
      // Reset debounce after 2 seconds
      this.processingTimeout = setTimeout(() => {
        this.lastProcessedUrl = null;
      }, 2000);
      
      const params = this.parseDeepLink(url);
      console.log('Parsed params:', params);
      
      if (params.action === 'magic-link' && params.token && params.email) {
        console.log('Valid magic link detected, verifying...');
        await this.handleMagicLinkVerification(params.token, params.email);
      } else {
        console.log('Not a magic link or missing params');
      }

      // Notify any listeners (currently none, but kept for future extensibility)
      if (this.listeners.length > 0) {
        this.listeners.forEach(listener => listener(params));
      }

    } catch (error) {
      console.error('Deep link handling error:', error);
    }
  }

  private parseDeepLink(url: string): DeepLinkParams {
    try {
      const [basePath, queryString = ''] = url.split('?');
      const params = this.parseQueryString(queryString);

      if (basePath.includes('/auth/magic-link')) {
        return {
          action: 'magic-link',
          token: params.token,
          email: params.email,
        };
      }

      if (basePath.startsWith('fixrx://magic-link')) {
        return {
          action: 'magic-link',
          token: params.token,
          email: params.email,
        };
      }

      if (basePath.includes('/--/magic-link') || basePath.includes('magic-link')) {
        return {
          action: 'magic-link',
          token: params.token,
          email: params.email,
        };
      }

      return {};
    } catch (error) {
      console.error('URL parsing error:', error);
      return {};
    }
  }

  private parseQueryString(query: string): Record<string, string | undefined> {
    if (!query) {
      return {};
    }

    return query
      .replace(/#.*/, '') // Remove fragments
      .split('&')
      .filter(Boolean)
      .reduce<Record<string, string | undefined>>((acc, pair) => {
        const [rawKey, rawValue = ''] = pair.split('=');
        if (!rawKey) {
          return acc;
        }

        const key = decodeURIComponent(rawKey.trim());
        const value = decodeURIComponent(rawValue.replace(/\+/g, ' ').trim());
        acc[key] = value || undefined;
        return acc;
      }, {});
  }

  private async handleMagicLinkVerification(token: string, email: string) {
    // Prevent multiple simultaneous verifications
    if (this.isVerifying) {
      console.log('Verification already in progress, skipping...');
      return { success: false, error: 'Verification in progress' };
    }

    this.isVerifying = true;
    
    return await CrashPrevention.safeMagicLinkVerification(
      async () => {
        console.log('Verifying magic link...', { email });
        return await magicLinkAuthService.verifyMagicLink({ token, email });
      },
      (result) => {
        // Success callback
        console.log('Magic link verified successfully!', result.data);
        
        const user = result.data?.user;
        const isNewUser = result.data?.isNewUser;
        const profileCompleted = user?.profileCompleted;

        console.log('Navigation decision:', { isNewUser, userType: user?.userType, profileCompleted });

        // Safe navigation with crash prevention
        // Navigate to UserType if: new user OR no userType OR profile not completed
        if (isNewUser || !user?.userType || !profileCompleted) {
          console.log('→ Navigating to UserType (incomplete profile)');
          CrashPrevention.safeNavigate(
            () => {
              if (navigationRef.current?.isReady()) {
                navigationRef.current?.navigate('UserType' as never);
              } else {
                setTimeout(() => {
                  if (navigationRef.current?.isReady()) {
                    navigationRef.current?.navigate('UserType' as never);
                  }
                }, 1000);
              }
            },
            'Welcome', // Fallback route
            navigationRef
          );
        } else {
          console.log('→ Navigating to MainTabs (complete profile, userType:', user.userType + ')');
          CrashPrevention.safeNavigate(
            () => {
              if (navigationRef.current?.isReady()) {
                navigationRef.current?.navigate('MainTabs' as never);
              } else {
                setTimeout(() => {
                  if (navigationRef.current?.isReady()) {
                    navigationRef.current?.navigate('MainTabs' as never);
                  }
                }, 1000);
              }
            },
            'Welcome', // Fallback route
            navigationRef
          );
        }
      },
      async (error) => {
        // Error callback
        console.error('Magic link verification failed:', error);
        
        // Handle expired tokens with auto-retry
        if (error?.code === 'TOKEN_EXPIRED' || error?.message?.includes('expired')) {
          try {
            console.log('🔄 Attempting auto-retry for expired token...');
            const retryResult = await magicLinkAuthService.handleExpiredToken(email, 'REGISTRATION');
            
            Alert.alert(
              'Link Expired',
              retryResult.message,
              [{ text: 'OK' }]
            );
            return;
          } catch (retryError) {
            console.error('Auto-retry failed:', retryError);
          }
        }
        
        // Don't show alert for other expected errors
        const errorMessage = error?.message || '';
        const isExpectedError = 
          errorMessage.includes('already been used') ||
          errorMessage.includes('Invalid') ||
          error?.code === 'TOKEN_ALREADY_USED';
        
        if (!isExpectedError) {
          Alert.alert(
            'Verification Failed',
            error?.message || 'Failed to verify magic link. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    ).finally(() => {
      // Reset verification flag after a delay
      setTimeout(() => {
        this.isVerifying = false;
      }, 3000);
    });
  }

  addListener(listener: (params: DeepLinkParams) => void) {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Generate magic link URL for email
   * Uses custom scheme for mobile app deep linking
   */
  generateMagicLinkUrl(token: string, email: string): string {
    // Use custom scheme for mobile app
    const scheme = process.env.EXPO_PUBLIC_APP_SCHEME || 'fixrx';
    const appDomain = process.env.EXPO_PUBLIC_APP_DOMAIN || 'fixrx.com';
    
    // In development, use custom scheme directly
    // In production, use HTTPS with domain that redirects to app
    const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
    if (isDev) {
      return `${scheme}://magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    }
    
    // Production: Use HTTPS URL that will be handled by universal links
    return `https://${appDomain}/auth/magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  }
}

export const deepLinkHandler = DeepLinkHandler.getInstance();
export default deepLinkHandler;
