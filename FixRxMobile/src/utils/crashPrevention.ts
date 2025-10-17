/**
 * Crash Prevention Utilities for FixRx Mobile
 * Provides safe wrappers and error handling for critical app functions
 */

import { Alert } from 'react-native';
import { sessionManager } from './sessionManager';

export class CrashPrevention {
  private static instance: CrashPrevention;

  private constructor() {}

  public static getInstance(): CrashPrevention {
    if (!CrashPrevention.instance) {
      CrashPrevention.instance = new CrashPrevention();
    }
    return CrashPrevention.instance;
  }

  /**
   * Safe async function wrapper that catches and logs errors
   */
  static async safeAsync<T>(
    fn: () => Promise<T>,
    fallback?: T,
    errorMessage?: string
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      console.error('SafeAsync error:', error);
      
      if (__DEV__ && errorMessage) {
        console.error(`Context: ${errorMessage}`);
      }
      
      return fallback;
    }
  }

  /**
   * Safe synchronous function wrapper
   */
  static safe<T>(
    fn: () => T,
    fallback?: T,
    errorMessage?: string
  ): T | undefined {
    try {
      return fn();
    } catch (error) {
      console.error('Safe error:', error);
      
      if (__DEV__ && errorMessage) {
        console.error(`Context: ${errorMessage}`);
      }
      
      return fallback;
    }
  }

  /**
   * Safe navigation wrapper
   */
  static safeNavigate(
    navigationFn: () => void,
    fallbackRoute?: string,
    navigationRef?: any
  ): void {
    try {
      navigationFn();
    } catch (error) {
      console.error('Navigation error:', error);
      
      // Try fallback navigation
      if (fallbackRoute && navigationRef?.current?.isReady()) {
        try {
          navigationRef.current.navigate(fallbackRoute);
        } catch (fallbackError) {
          console.error('Fallback navigation also failed:', fallbackError);
        }
      }
    }
  }

  /**
   * Safe magic link verification with comprehensive error handling
   */
  static async safeMagicLinkVerification(
    verificationFn: () => Promise<any>,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ): Promise<boolean> {
    try {
      console.log('🔐 Starting safe magic link verification...');
      
      const result = await verificationFn();
      
      if (result?.success) {
        console.log('✅ Magic link verification successful');
        onSuccess?.(result);
        return true;
      } else {
        console.log('❌ Magic link verification failed:', result?.message);
        onError?.(result);
        return false;
      }
    } catch (error) {
      console.error('🚨 Critical error in magic link verification:', error);
      
      // Don't show error alerts for expected errors
      const errorMessage = (error as any)?.message || '';
      const isExpectedError = 
        errorMessage.includes('already been used') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('Invalid');
      
      if (!isExpectedError && __DEV__) {
        Alert.alert(
          'Verification Error',
          'An unexpected error occurred during verification. Please try again.',
          [{ text: 'OK' }]
        );
      }
      
      onError?.(error);
      return false;
    }
  }

  /**
   * Safe storage operations
   */
  static async safeStorageOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      console.error(`Storage operation '${operationName}' failed:`, error);
      return fallback;
    }
  }

  /**
   * Safe network request wrapper
   */
  static async safeNetworkRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = 2,
    delay: number = 1000
  ): Promise<T | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        console.error(`Network request attempt ${attempt + 1} failed:`, error);
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    }
    
    return null;
  }

  /**
   * Safe app state recovery
   */
  static async recoverAppState(): Promise<boolean> {
    try {
      console.log('🔄 Attempting app state recovery...');
      
      // Check if user is authenticated
      const isAuthenticated = await CrashPrevention.safeAsync(
        () => sessionManager.isAuthenticated(),
        false,
        'Checking authentication status'
      );
      
      if (!isAuthenticated) {
        console.log('User not authenticated, clearing any stale session data');
        await CrashPrevention.safeAsync(
          () => sessionManager.clearAllSessions(),
          undefined,
          'Clearing stale sessions'
        );
      }
      
      console.log('✅ App state recovery completed');
      return true;
    } catch (error) {
      console.error('❌ App state recovery failed:', error);
      return false;
    }
  }

  /**
   * Initialize crash prevention systems
   */
  static initialize(): void {
    try {
      // Global error handler for unhandled promise rejections
      const globalAny = global as any;
      
      if (typeof globalAny !== 'undefined' && globalAny.ErrorUtils) {
        const originalHandler = globalAny.ErrorUtils.getGlobalHandler?.();
        
        globalAny.ErrorUtils.setGlobalHandler?.((error: any, isFatal: boolean) => {
          console.error('Global error caught:', {
            error: error?.message || error,
            isFatal,
            stack: error?.stack
          });
          
          // Call original handler if it exists
          if (originalHandler) {
            originalHandler(error, isFatal);
          }
          
          // In development, don't crash the app for non-fatal errors
          if (__DEV__ && !isFatal) {
            console.log('Non-fatal error in development, continuing...');
            return;
          }
        });
      }

      // Handle unhandled promise rejections (Hermes specific)
      if (typeof globalAny !== 'undefined' && globalAny.HermesInternal) {
        const hasTracker = globalAny.HermesInternal.hasPromiseRejectionTracker?.();
        
        if (!hasTracker && globalAny.HermesInternal.enablePromiseRejectionTracker) {
          globalAny.HermesInternal.enablePromiseRejectionTracker({
            allRejections: true,
            onUnhandled: (id: number, rejection: any) => {
              console.error('Unhandled promise rejection:', {
                id,
                rejection: rejection?.message || rejection,
                stack: rejection?.stack
              });
            },
            onHandled: (id: number) => {
              console.log('Promise rejection handled:', id);
            }
          });
        }
      }

      // console.log('Crash prevention systems initialized');
    } catch (error) {
      console.error('Error initializing crash prevention:', error);
    }
  }
}

// Export singleton instance and static methods
export const crashPrevention = CrashPrevention.getInstance();
export default CrashPrevention;
