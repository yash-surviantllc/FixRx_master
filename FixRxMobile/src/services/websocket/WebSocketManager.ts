/**
 * Enhanced WebSocket Manager for FixRx Mobile
 */

import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config/api';

type EventCallback = (data: any) => void;
type EventType = 
  | 'connect'
  | 'disconnect' 
  | 'connect_error'
  | 'error'
  | 'reconnect_attempt'
  | 'reconnect_failed'
  | 'reconnect'
  | 'message'
  | 'notification'
  | 'typing'
  | 'user_online'
  | 'user_offline';

interface WebSocketConfig {
  url: string;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  maxReconnectDelay: number;
  timeout: number;
}

interface WebSocketStatus {
  connected: boolean;
  reconnecting: boolean;
  disabled: boolean;
  failures: number;
  maxFailures: number;
  url: string;
}

class EnhancedWebSocketManager {
  private static instance: EnhancedWebSocketManager;
  private socket: Socket | null = null;
  private eventListeners: Map<EventType, EventCallback[]> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private connectionFailures: number = 0;
  private maxFailures: number = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private disabled: boolean = false;
  private authToken: string | null = null;

  // PERMANENT FIX: Hardcoded WebSocket URL
  // Change this IP to match your computer's IP address
  private readonly WEBSOCKET_URL = 'http://192.168.1.6:3000';

  private config: WebSocketConfig = {
    url: this.WEBSOCKET_URL,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    maxReconnectDelay: 30000,
    timeout: 10000,
  };

  private constructor() {
    // Private constructor for singleton
    console.log('WebSocket Manager initialized with URL:', this.WEBSOCKET_URL);
  }

  public static getInstance(): EnhancedWebSocketManager {
    if (!EnhancedWebSocketManager.instance) {
      EnhancedWebSocketManager.instance = new EnhancedWebSocketManager();
    }
    return EnhancedWebSocketManager.instance;
  }

  private getWebSocketUrl(): string {
    // PERMANENT FIX: Always use hardcoded URL
    return this.WEBSOCKET_URL;
  }

  public async connect(token?: string): Promise<boolean> {
    // Skip if already connected or disabled
    if (this.isConnected || this.disabled) {
      return this.isConnected;
    }

    // Skip if too many failures
    if (this.connectionFailures >= this.maxFailures) {
      console.warn('WebSocket disabled after too many failures. App will work in offline mode.');
      this.disabled = true;
      return false;
    }

    try {
      // Get auth token
      this.authToken = token || await this.getStoredToken();

      if (!this.authToken) {
        if (process.env.NODE_ENV === 'development') {
          console.log('WebSocket connecting in development mode without token');
        } else {
          console.warn('WebSocket connection skipped: no auth token available');
          return false;
        }
      }

      console.log(`Connecting to ${this.config.url} (attempt ${this.connectionFailures + 1}/${this.maxFailures})`);

      this.socket = io(this.config.url, {
        transports: ['websocket', 'polling'],
        auth: this.authToken ? { token: this.authToken } : {},
        reconnection: false,
        timeout: this.config.timeout,
        forceNew: true,
        autoConnect: false,
      });

      // Set up event listeners
      this.setupEventListeners();
      
      // Attempt connection with timeout
      const connected = await this.attemptConnection();
      
      if (connected) {
        this.connectionFailures = 0;
        return true;
      } else {
        throw new Error('Connection failed');
      }
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.connectionFailures++;
      this.cleanupConnection();
      
      if (this.connectionFailures < this.maxFailures) {
        this.scheduleReconnect();
      }
      
      return false;
    }
  }

  private async attemptConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        console.warn('WebSocket connection timeout');
        resolve(false);
      }, this.config.timeout);

      const onConnect = () => {
        clearTimeout(timeout);
        console.log('WebSocket connected successfully');
        this.isConnected = true;
        this.safeEmit('connect', null);
        resolve(true);
      };

      const onError = (error: any) => {
        clearTimeout(timeout);
        console.error('WebSocket connection error:', error);
        resolve(false);
      };

      // Set up one-time listeners
      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
      this.socket.once('error', onError);

      // Start the connection
      this.socket.connect();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log(`[EnhancedWS] Disconnected: ${reason}`);
      this.isConnected = false;
      this.safeEmit('disconnect', { reason });
      this.handleDisconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[EnhancedWS] Connection error:', error);
      this.safeEmit('connect_error', error);
    });

    this.socket.on('error', (error) => {
      console.error('[EnhancedWS] Socket error:', error);
      this.safeEmit('error', error);
    });

    // Custom event handlers
    this.socket.on('message', (data) => {
      this.safeEmit('message', data);
    });

    this.socket.on('notification', (notification) => {
      this.safeEmit('notification', notification);
    });

    this.socket.on('typing', (data) => {
      this.safeEmit('typing', data);
    });

    this.socket.on('user_online', (data) => {
      this.safeEmit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.safeEmit('user_offline', data);
    });
  }

  private handleDisconnect() {
    this.isConnected = false;
    
    // Don't try to reconnect if we're already trying
    if (this.reconnectTimeout) {
      return;
    }

    // Exponential backoff for reconnection
    const delay = Math.min(
      this.config.reconnectionDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay
    );
    
    console.log(`[EnhancedWS] Will attempt to reconnect in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts <= this.config.reconnectionAttempts) {
        console.log(`[EnhancedWS] Reconnecting (attempt ${this.reconnectAttempts}/${this.config.reconnectionAttempts})`);
        this.connect();
      } else {
        console.error('[EnhancedWS] Max reconnection attempts reached');
        this.safeEmit('reconnect_failed', null);
      }
    }, delay);
  }

  private scheduleReconnect() {
    const delay = Math.min(
      this.config.reconnectionDelay * Math.pow(2, this.connectionFailures - 1),
      this.config.maxReconnectDelay
    );
    
    setTimeout(() => {
      if (!this.isConnected && !this.disabled) {
        this.connect();
      }
    }, delay);
  }

  public disconnect() {
    console.log('[EnhancedWS] Disconnecting...');
    this.cleanupConnection();
    this.disabled = false;
    this.connectionFailures = 0;
  }

  private cleanupConnection() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  public on(event: EventType, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  public emit(event: string, data: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[EnhancedWS] Cannot emit - not connected');
    }
  }

  private safeEmit(event: EventType, data: any) {
    try {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error('[EnhancedWS] Event callback error:', error);
          }
        });
      }
    } catch (error) {
      console.error(`[EnhancedWS] Error emitting event '${event}':`, error);
    }
  }

  public getStatus(): WebSocketStatus {
    return {
      connected: this.isConnected,
      reconnecting: !!this.reconnectTimeout,
      disabled: this.disabled,
      failures: this.connectionFailures,
      maxFailures: this.maxFailures,
      url: this.config.url
    };
  }

  public enable() {
    console.log('[EnhancedWS] Service enabled');
    this.disabled = false;
    this.connectionFailures = 0;
  }

  public async forceReconnect(token?: string): Promise<boolean> {
    console.log('[EnhancedWS] Force reconnecting...');
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await this.connect(token);
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('[EnhancedWS] Error getting stored token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const enhancedWebSocketManager = EnhancedWebSocketManager.getInstance();
export default enhancedWebSocketManager;
