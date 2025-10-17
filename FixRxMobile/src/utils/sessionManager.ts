/**
 * Session Manager for FixRx Mobile
 * Handles session clearing and management for development and production
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface SessionData {
  auth_token?: string;
  refresh_token?: string;
  auth_user?: string;
  user_profile?: string;
  onboarding_completed?: string;
  [key: string]: string | undefined;
}

class SessionManager {
  private static instance: SessionManager;

  // All possible session keys that might be stored
  private readonly sessionKeys = [
    'auth_token',
    'refresh_token', 
    'auth_user',
    'user_profile',
    'onboarding_completed',
    'user_preferences',
    'app_settings',
    'cached_data',
    'notification_token',
    'device_id'
  ];

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Clear all session data (for development and logout)
   */
  async clearAllSessions(): Promise<boolean> {
    try {
      console.log('🧹 Clearing all session data...');
      
      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter to only session-related keys
      const sessionKeysToRemove = allKeys.filter(key => 
        this.sessionKeys.includes(key) || 
        key.startsWith('auth_') || 
        key.startsWith('user_') ||
        key.startsWith('session_')
      );

      if (sessionKeysToRemove.length > 0) {
        await AsyncStorage.multiRemove(sessionKeysToRemove);
        console.log(`✅ Cleared ${sessionKeysToRemove.length} session keys:`, sessionKeysToRemove);
      } else {
        console.log('ℹ️ No session data found to clear');
      }

      return true;
    } catch (error) {
      console.error('❌ Error clearing session data:', error);
      return false;
    }
  }

  /**
   * Clear specific session keys
   */
  async clearSpecificSessions(keys: string[]): Promise<boolean> {
    try {
      console.log('🧹 Clearing specific session keys:', keys);
      await AsyncStorage.multiRemove(keys);
      console.log('✅ Successfully cleared specific session keys');
      return true;
    } catch (error) {
      console.error('❌ Error clearing specific session keys:', error);
      return false;
    }
  }

  /**
   * Get current session data (for debugging)
   */
  async getCurrentSessionData(): Promise<SessionData> {
    try {
      const sessionData: SessionData = {};
      
      for (const key of this.sessionKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          sessionData[key] = value;
        }
      }

      return sessionData;
    } catch (error) {
      console.error('❌ Error getting session data:', error);
      return {};
    }
  }

  /**
   * Development helper: Clear sessions with confirmation
   */
  async clearSessionsWithConfirmation(): Promise<void> {
    if (__DEV__) {
      Alert.alert(
        'Clear Session Data',
        'This will log you out and clear all stored session data. Continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: async () => {
              const success = await this.clearAllSessions();
              if (success) {
                Alert.alert('Success', 'All session data cleared. Please restart the app.');
              } else {
                Alert.alert('Error', 'Failed to clear session data.');
              }
            }
          }
        ]
      );
    }
  }

  /**
   * Initialize session clearing for development
   * Call this in App.tsx during development
   */
  async initializeDevSessionClearing(): Promise<void> {
    if (__DEV__) {
      // console.log('Development mode: Initializing session management...');
      
      // Clear sessions on app start in development if flag is set
      const shouldClearOnStart = await AsyncStorage.getItem('dev_clear_on_start');
      
      if (shouldClearOnStart === 'true') {
        console.log('Development mode: Clearing sessions on app start');
        await this.clearAllSessions();
        await AsyncStorage.removeItem('dev_clear_on_start');
      }

      // Auto-clear old auth data that might cause conflicts
      await this.clearExpiredAuthData();
    }
  }

  /**
   * Clear potentially expired or conflicting auth data
   */
  private async clearExpiredAuthData(): Promise<void> {
    try {
      // Check if we have auth data that might be stale
      const authToken = await AsyncStorage.getItem('auth_token');
      const lastClearTime = await AsyncStorage.getItem('last_dev_clear');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      // Auto-clear auth data every hour in development to prevent conflicts
      if (authToken && (!lastClearTime || (now - parseInt(lastClearTime)) > oneHour)) {
        console.log('Auto-clearing potentially stale auth data...');
        await this.clearSpecificSessions(['auth_token', 'refresh_token', 'auth_user']);
        await AsyncStorage.setItem('last_dev_clear', now.toString());
        console.log('Stale auth data cleared');
      }
    } catch (error) {
      console.error('Error clearing expired auth data:', error);
    }
  }

  /**
   * Set flag to clear sessions on next app start (development only)
   */
  async setClearOnNextStart(): Promise<void> {
    if (__DEV__) {
      await AsyncStorage.setItem('dev_clear_on_start', 'true');
      console.log('Set flag to clear sessions on next app start');
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const user = await AsyncStorage.getItem('auth_user');
      return !!(token && user);
    } catch (error) {
      console.error('❌ Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Safe logout that clears all session data
   */
  async logout(): Promise<boolean> {
    try {
      console.log('👋 Logging out user...');
      const success = await this.clearAllSessions();
      
      if (success) {
        console.log('✅ User logged out successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error during logout:', error);
      return false;
    }
  }

  /**
   * Debug helper: Log all session data
   */
  async debugLogSessionData(): Promise<void> {
    if (__DEV__) {
      const sessionData = await this.getCurrentSessionData();
      console.log('🔍 Current session data:', sessionData);
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
export default sessionManager;
