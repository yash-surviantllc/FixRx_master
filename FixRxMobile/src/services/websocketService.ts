import { io, Socket } from 'socket.io-client';
import messagingService from './messagingService';
import { Conversation, Message } from '../types/messaging';
import { authService } from './authService';

type WebsocketEventName =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'reconnect:failed'
  | 'message:new'
  | 'conversation:created'
  | 'conversation:read'
  | 'conversation:typing'
  // Service Events
  | 'service:created'
  | 'service:updated'
  | 'service:accepted'
  | 'service:rejected'
  | 'service:completed'
  // Booking Events
  | 'booking:confirmed'
  | 'booking:status_changed'
  | 'booking:cancelled'
  // Payment Events
  | 'payment:completed'
  | 'payment:failed'
  // Location Events
  | 'location:update';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private authToken: string | null = null;
  private reconnecting = false;
  private connected = false;
  private connectionFailures = 0;
  private maxFailures = 3;
  private disabled = false;

  private config = {
    url: process.env.EXPO_PUBLIC_WS_URL || process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://192.168.0.230:3000',
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    maxReconnectDelay: 10000,
    timeout: 15000,
  };

  connect = async (token?: string): Promise<boolean> => {
    // Skip if already connected or disabled
    if (this.connected || this.disabled) {
      return this.connected;
    }

    // Skip if too many failures
    if (this.connectionFailures >= this.maxFailures) {
      console.warn('WebSocket disabled after too many connection failures. App will work in offline mode.');
      this.disabled = true;
      return false;
    }

    // Skip if already trying to connect
    if (this.reconnecting) {
      console.log('WebSocket connection already in progress...');
      return false;
    }

    this.reconnecting = true;
    
    try {
      // Get auth token
      this.authToken = token || this.authToken || (await authService.getStoredToken());

      // In development, allow connection without token
      if (!this.authToken) {
        if (__DEV__) {
          console.log('WebSocket connecting in development mode without token');
        } else {
          console.warn('WebSocket connection skipped: no auth token available');
          this.reconnecting = false;
          return false;
        }
      }

      console.log(`Attempting WebSocket connection to: ${this.config.url} (attempt ${this.connectionFailures + 1}/${this.maxFailures})`);

      // Create socket with robust configuration
      this.socket = io(this.config.url, {
        transports: ['websocket', 'polling'],
        auth: this.authToken ? { token: this.authToken } : {},
        reconnection: false, // We'll handle reconnection manually
        timeout: this.config.timeout,
        forceNew: true,
        autoConnect: false,
        upgrade: true,
        rememberUpgrade: false,
      });

      // Register event listeners before connecting
      this.registerListeners();
      
      // Connect with promise-based timeout
      const connected = await this.attemptConnection();
      
      if (connected) {
        this.connectionFailures = 0; // Reset on successful connection
        this.reconnecting = false;
        return true;
      } else {
        throw new Error('Connection failed');
      }
      
    } catch (error) {
      console.error('WebSocket connection failed:', {
        error: error instanceof Error ? error.message : String(error),
        url: this.config.url,
        attempt: this.connectionFailures + 1,
        maxAttempts: this.maxFailures
      });
      
      this.connectionFailures++;
      this.reconnecting = false;
      
      // Clean up failed connection
      this.cleanupConnection();
      
      // Schedule retry if not at max failures
      if (this.connectionFailures < this.maxFailures) {
        this.scheduleReconnect();
      }
      
      return false;
    }
  };

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
        this.connected = true;
        this.safeEmit('connected', null);
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

  private cleanupConnection() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
  }

  private scheduleReconnect() {
    const delay = Math.min(
      this.config.reconnectionDelay * Math.pow(2, this.connectionFailures - 1),
      this.config.maxReconnectDelay
    );
    
    console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.connectionFailures}/${this.maxFailures})`);
    
    setTimeout(() => {
      if (!this.connected && !this.disabled) {
        this.connect();
      }
    }, delay);
  }

  disconnect = () => {
    console.log('Disconnecting WebSocket...');
    this.cleanupConnection();
    this.reconnecting = false;
    this.disabled = false; // Allow reconnection later
    this.connectionFailures = 0; // Reset failure count
  };

  // Initialize WebSocket with optional connection
  initialize = async (token?: string, autoConnect: boolean = true): Promise<void> => {
    console.log('Initializing WebSocket service...', { 
      url: this.config.url, 
      autoConnect,
      hasToken: !!token 
    });

    if (autoConnect) {
      // Try to connect, but don't block if it fails
      try {
        await this.connect(token);
      } catch (error) {
        console.warn('Initial WebSocket connection failed, will retry later:', error);
      }
    }
  };

  // Get connection status
  getStatus = () => ({
    connected: this.connected,
    reconnecting: this.reconnecting,
    disabled: this.disabled,
    failures: this.connectionFailures,
    maxFailures: this.maxFailures,
    url: this.config.url
  });

  // Enable WebSocket (reset disabled state)
  enable = () => {
    console.log('WebSocket service enabled');
    this.disabled = false;
    this.connectionFailures = 0;
  };

  // Force reconnect (useful for testing)
  forceReconnect = async (token?: string): Promise<boolean> => {
    console.log('Force reconnecting WebSocket...');
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    return await this.connect(token);
  };

  private registerListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      this.connected = true;
      this.reconnecting = false;
      this.connectionFailures = 0; // Reset failure count on successful connection
      this.safeEmit('connected', null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connected = false;
      this.safeEmit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', {
        message: error.message,
        description: error.description || 'No description',
        context: error.context || 'No context',
        type: error.type || 'Unknown type',
        url: this.config.url,
        failures: this.connectionFailures + 1
      });
      this.connectionFailures++;
      this.reconnecting = false;
      this.safeEmit('error', error);
    });

    // Message handlers with error protection
    this.socket.on('message:new', (message: Message) => {
      try {
        this.safeEmit('message:new', message);
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    });

    this.socket.on('conversation:created', (conversation: Conversation) => {
      try {
        this.safeEmit('conversation:created', conversation);
      } catch (error) {
        console.error('Error handling conversation created:', error);
      }
    });

    this.socket.on('conversation:read', (payload) => {
      try {
        this.safeEmit('conversation:read', payload);
      } catch (error) {
        console.error('Error handling conversation read:', error);
      }
    });

    this.socket.on('conversation:typing', (payload) => {
      try {
        this.safeEmit('conversation:typing', payload);
      } catch (error) {
        console.error('Error handling conversation typing:', error);
      }
    });

    this.socket.io.on('reconnect_failed', () => {
      this.emit('reconnect:failed', null);
    });
  }

  private safeEmit(event: WebsocketEventName, data: any) {
    try {
      this.emit(event, data);
    } catch (error) {
      console.error(`Error emitting WebSocket event '${event}':`, error);
    }
  }

  private emit(event: WebsocketEventName, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('WebSocket event callback error:', error);
        }
      });
    }
  }

  on(event: WebsocketEventName, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event)!.push(callback);

    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  joinConversation(conversationId: string) {
    if (!this.socket) return;
    this.socket.emit('join:conversation', { conversationId });
  }

  leaveConversation(conversationId: string) {
    if (!this.socket) return;
    this.socket.emit('leave:conversation', { conversationId });
  }

  async ensureConnection(authToken?: string) {
    if (!this.connected && !this.reconnecting) {
      await this.connect(authToken);
    }
  }

  async refreshToken(token: string) {
    this.authToken = token;
    if (this.socket) {
      this.socket.auth = { token };
      this.socket.connect();
    }
  }

  async preloadConversations() {
    const result = await messagingService.listConversations();
    if (result.success) {
      result.data?.conversations?.forEach((conversation) => {
        this.joinConversation(conversation.id);
      });
    }
  }

  startTyping(conversationId: string) {
    if (!this.socket) return;
    this.socket.emit('conversation:typing', { conversationId, isTyping: true });
  }

  stopTyping(conversationId: string) {
    if (!this.socket) return;
    this.socket.emit('conversation:typing', { conversationId, isTyping: false });
  }

  get isConnected() {
    return this.connected;
  }

  get connectionState() {
    if (this.connected) return 'connected';
    if (this.reconnecting) return 'connecting';
    return 'disconnected';
  }
}

export const websocketService = new WebSocketService();

export const useWebSocket = () => {
  const connect = (authToken?: string) => websocketService.connect(authToken);
  const disconnect = () => websocketService.disconnect();
  const on = (event: WebsocketEventName, callback: EventCallback) => websocketService.on(event, callback);
  const joinConversation = (conversationId: string) => websocketService.joinConversation(conversationId);
  const leaveConversation = (conversationId: string) => websocketService.leaveConversation(conversationId);
  const startTyping = (conversationId: string) => websocketService.startTyping(conversationId);
  const stopTyping = (conversationId: string) => websocketService.stopTyping(conversationId);

  return {
    connect,
    disconnect,
    on,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    isConnected: websocketService.isConnected,
    connectionState: websocketService.connectionState,
  };
};
