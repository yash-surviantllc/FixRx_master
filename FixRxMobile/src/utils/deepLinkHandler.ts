/**
 * Deep Link Handler for Magic Link Authentication
 * Handles magic link verification when user clicks email link
 */

import { Linking } from 'react-native';
import { magicLinkAuthService } from '../services/magicLinkAuthService';

export interface DeepLinkParams {
  token?: string;
  email?: string;
  action?: string;
}

class DeepLinkHandler {
  private listeners: Array<(params: DeepLinkParams) => void> = [];

  /**
   * Initialize deep link handling
   */
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

  /**
   * Parse and handle deep link URL
   */
  private async handleDeepLink(url: string) {
    try {
      console.log('🔗 Handling deep link:', url);

      const params = this.parseDeepLink(url);
      
      if (params.action === 'magic-link' && params.token && params.email) {
        await this.handleMagicLinkVerification(params.token, params.email);
      }

      // Notify listeners
      this.listeners.forEach(listener => listener(params));

    } catch (error) {
      console.error('❌ Deep link handling error:', error);
    }
  }

  /**
   * Parse deep link URL to extract parameters
   */
  private parseDeepLink(url: string): DeepLinkParams {
    try {
      console.log('🔍 Parsing deep link URL:', url);
      
      const [basePath, queryString = ''] = url.split('?');
      const params = this.parseQueryString(queryString);
      
      console.log('🔍 Base path:', basePath);
      console.log('🔍 Query string:', queryString);
      console.log('🔍 Parsed params:', params);

      // Handle standard web URL: https://host/.../auth/magic-link?token=...&email=...
      if (basePath.includes('/auth/magic-link')) {
        console.log('✅ Matched web URL pattern');
        return {
          action: 'magic-link',
          token: params.token,
          email: params.email,
        };
      }

      // Handle custom scheme: fixrx://magic-link?token=...&email=...
      if (basePath.startsWith('fixrx://magic-link')) {
        console.log('✅ Matched fixrx scheme pattern');
        return {
          action: 'magic-link',
          token: params.token,
          email: params.email,
        };
      }

      // Handle Expo development URL: exp://192.168.1.5:8082/--/magic-link?token=...&email=...
      if (basePath.includes('/--/magic-link') || basePath.includes('magic-link')) {
        console.log('✅ Matched Expo URL pattern');
        return {
          action: 'magic-link',
          token: params.token,
          email: params.email,
        };
      }

      console.log('❌ No pattern matched for URL:', url);
      return {};
    } catch (error) {
      console.error('❌ URL parsing error:', error);
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

  /**
   * Handle magic link verification
   */
  private async handleMagicLinkVerification(token: string, email: string) {
    try {
      console.log('🔐 Verifying magic link from deep link');

      const result = await magicLinkAuthService.verifyMagicLink({ token, email });

      if (result.success) {
        console.log('✅ Magic link verification successful');
        
        // Navigate to dashboard or appropriate screen
        // This will be handled by the navigation listener
        return {
          success: true,
          user: result.data?.user,
          isNewUser: result.data?.isNewUser,
        };
      } else {
        console.error('❌ Magic link verification failed:', result.message);
        return {
          success: false,
          error: result.message,
        };
      }

    } catch (error) {
      console.error('❌ Magic link verification error:', error);
      return {
        success: false,
        error: 'Verification failed. Please try again.',
      };
    }
  }

  /**
   * Add listener for deep link events
   */
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
    if (__DEV__) {
      return `${scheme}://magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    }
    
    // Production: Use HTTPS URL that will be handled by universal links
    return `https://${appDomain}/auth/magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  }
}

export const deepLinkHandler = new DeepLinkHandler();
export default deepLinkHandler;
