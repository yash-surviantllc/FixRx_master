/**
 * Performance Service
 * Handles app performance optimization, caching, and monitoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { Platform } from 'react-native';

interface CacheItem {
  data: any;
  timestamp: number;
  expiry: number;
}

interface PerformanceMetrics {
  appLaunchTime: number;
  apiResponseTimes: { [endpoint: string]: number[] };
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
  errorCount: number;
}

interface OfflineQueueItem {
  id: string;
  method: string;
  url: string;
  data?: any;
  headers?: any;
  timestamp: number;
  retryCount: number;
}

class PerformanceService {
  private cache: Map<string, CacheItem> = new Map();
  private metrics: PerformanceMetrics = {
    appLaunchTime: 0,
    apiResponseTimes: {},
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0,
    errorCount: 0,
  };
  private offlineQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = true;
  private performanceObserver: any = null;

  constructor() {
    this.initializePerformanceMonitoring();
    this.setupNetworkListener();
    this.loadOfflineQueue();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Record app launch time
    this.metrics.appLaunchTime = Date.now();

    // Set up performance observer for React Native
    if (Platform.OS === 'ios' && global.PerformanceObserver) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            console.log('Navigation performance:', entry);
          }
        });
      });
      this.performanceObserver.observe({ entryTypes: ['navigation', 'measure'] });
    }

    // Monitor memory usage periodically
    setInterval(() => {
      this.updateMemoryUsage();
    }, 30000); // Every 30 seconds
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        // Back online - process offline queue
        this.processOfflineQueue();
      }
    });
  }

  /**
   * Cache Management
   */
  
  /**
   * Set cache item with expiry
   */
  setCache(key: string, data: any, ttlMinutes: number = 30): void {
    const expiry = Date.now() + (ttlMinutes * 60 * 1000);
    const cacheItem: CacheItem = {
      data,
      timestamp: Date.now(),
      expiry,
    };
    
    this.cache.set(key, cacheItem);
    
    // Also store in AsyncStorage for persistence
    AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem)).catch(console.error);
  }

  /**
   * Get cache item
   */
  async getCache(key: string): Promise<any | null> {
    // Check in-memory cache first
    let cacheItem = this.cache.get(key);
    
    // If not in memory, check AsyncStorage
    if (!cacheItem) {
      try {
        const stored = await AsyncStorage.getItem(`cache_${key}`);
        if (stored) {
          cacheItem = JSON.parse(stored);
          // Restore to in-memory cache
          if (cacheItem) {
            this.cache.set(key, cacheItem);
          }
        }
      } catch (error) {
        console.error('Failed to load cache from storage:', error);
      }
    }

    if (!cacheItem) {
      return null;
    }

    // Check if expired
    if (Date.now() > cacheItem.expiry) {
      this.cache.delete(key);
      AsyncStorage.removeItem(`cache_${key}`).catch(console.error);
      return null;
    }

    // Update cache hit rate
    this.updateCacheHitRate(true);
    return cacheItem.data;
  }

  /**
   * Clear cache
   */
  async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      // Clear specific pattern
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        AsyncStorage.removeItem(`cache_${key}`).catch(console.error);
      });
    } else {
      // Clear all cache
      this.cache.clear();
      
      // Clear AsyncStorage cache items
      try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith('cache_'));
        await AsyncStorage.multiRemove(cacheKeys);
      } catch (error) {
        console.error('Failed to clear cache from storage:', error);
      }
    }
  }

  /**
   * Offline Queue Management
   */
  
  /**
   * Add request to offline queue
   */
  addToOfflineQueue(method: string, url: string, data?: any, headers?: any): string {
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queueItem: OfflineQueueItem = {
      id,
      method,
      url,
      data,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.offlineQueue.push(queueItem);
    this.saveOfflineQueue();
    
    return id;
  }

  /**
   * Process offline queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.offlineQueue.length} offline requests...`);

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        // Attempt to replay the request
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.data ? JSON.stringify(item.data) : undefined,
        });

        if (response.ok) {
          console.log(`Successfully processed offline request: ${item.id}`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`Failed to process offline request ${item.id}:`, error);
        
        // Retry logic
        if (item.retryCount < 3) {
          item.retryCount++;
          this.offlineQueue.push(item);
        } else {
          console.error(`Giving up on offline request ${item.id} after 3 retries`);
        }
      }
    }

    this.saveOfflineQueue();
  }

  /**
   * Load offline queue from storage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offline_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Save offline queue to storage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Performance Monitoring
   */
  
  /**
   * Track API response time
   */
  trackApiResponseTime(endpoint: string, responseTime: number): void {
    if (!this.metrics.apiResponseTimes[endpoint]) {
      this.metrics.apiResponseTimes[endpoint] = [];
    }
    
    this.metrics.apiResponseTimes[endpoint].push(responseTime);
    
    // Keep only last 100 measurements per endpoint
    if (this.metrics.apiResponseTimes[endpoint].length > 100) {
      this.metrics.apiResponseTimes[endpoint] = 
        this.metrics.apiResponseTimes[endpoint].slice(-100);
    }
    
    this.metrics.networkRequests++;
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: string): void {
    this.metrics.errorCount++;
    
    console.error('Performance Service - Error tracked:', {
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update memory usage
   */
  private updateMemoryUsage(): void {
    if (Platform.OS === 'ios' && global.performance?.memory) {
      this.metrics.memoryUsage = global.performance.memory.usedJSHeapSize;
    }
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(hit: boolean): void {
    // Simple moving average calculation
    const currentRate = this.metrics.cacheHitRate;
    const newRate = hit ? 1 : 0;
    this.metrics.cacheHitRate = (currentRate * 0.9) + (newRate * 0.1);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      appLaunchTime: Date.now() - this.metrics.appLaunchTime,
    };
  }

  /**
   * Get average API response time
   */
  getAverageResponseTime(endpoint?: string): number {
    if (endpoint) {
      const times = this.metrics.apiResponseTimes[endpoint];
      if (!times || times.length === 0) return 0;
      return times.reduce((sum, time) => sum + time, 0) / times.length;
    }

    // Overall average
    let totalTime = 0;
    let totalRequests = 0;
    
    Object.values(this.metrics.apiResponseTimes).forEach(times => {
      totalTime += times.reduce((sum, time) => sum + time, 0);
      totalRequests += times.length;
    });
    
    return totalRequests > 0 ? totalTime / totalRequests : 0;
  }

  /**
   * Image Optimization
   */
  
  /**
   * Get optimized image URI
   */
  getOptimizedImageUri(originalUri: string, width: number, height: number, quality: number = 80): string {
    // For production, you might use a CDN service like Cloudinary or ImageKit
    // This is a placeholder implementation
    
    if (originalUri.includes('picsum.photos')) {
      return `${originalUri}?w=${width}&h=${height}&q=${quality}`;
    }
    
    // For other images, return original URI
    // In production, implement proper image optimization
    return originalUri;
  }

  /**
   * Preload critical resources
   */
  async preloadCriticalResources(): Promise<void> {
    try {
      // Preload user profile data
      const userProfile = await this.getCache('user_profile');
      if (!userProfile) {
        // Fetch and cache user profile
        console.log('Preloading user profile...');
      }

      // Preload frequently accessed data
      const recentVendors = await this.getCache('recent_vendors');
      if (!recentVendors) {
        console.log('Preloading recent vendors...');
      }

    } catch (error) {
      console.error('Failed to preload critical resources:', error);
    }
  }

  /**
   * Bundle size optimization helpers
   */
  
  /**
   * Lazy load component
   */
  lazyLoadComponent(componentLoader: () => Promise<any>): Promise<any> {
    return componentLoader().catch(error => {
      console.error('Failed to lazy load component:', error);
      this.trackError(error, 'lazy_load');
      throw error;
    });
  }

  /**
   * Debounce function for performance
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Throttle function for performance
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.cache.clear();
    this.offlineQueue = [];
  }

  /**
   * Get network status
   */
  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get offline queue size
   */
  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
export default performanceService;
