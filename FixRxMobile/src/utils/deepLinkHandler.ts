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
      const params = this.parseDeepLink(url);
      
      if (params.action === 'magic-link' && params.token && params.email) {
        await this.handleMagicLinkVerification(params.token, params.email);
      }

      this.listeners.forEach(listener => listener(params));

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
    try {
      const result = await magicLinkAuthService.verifyMagicLink({ token, email });

      if (result.success) {
        return {
          success: true,
          user: result.data?.user,
          isNewUser: result.data?.isNewUser,
        };
      } else {
        console.error('Magic link verification failed:', result.message);
        return {
          success: false,
          error: result.message,
        };
      }

    } catch (error) {
      console.error('Magic link verification error:', error);
      return {
        success: false,
        error: 'Verification failed. Please try again.',
      };
    }
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

  generateMagicLinkUrl(token: string, email: string): string {
    const baseUrl = __DEV__ 
      ? 'http://localhost:3001' 
      : 'https://your-app.com';
    
    return `${baseUrl}/auth/magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  }
}

export const deepLinkHandler = new DeepLinkHandler();
export default deepLinkHandler;
