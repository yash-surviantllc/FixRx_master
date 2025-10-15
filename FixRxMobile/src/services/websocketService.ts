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
  | 'conversation:typing';

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
    url: process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:3000',
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  };

  connect = async (token?: string) => {
    if (this.connected || this.reconnecting || this.disabled) {
      return;
    }

    if (this.connectionFailures >= this.maxFailures) {
      console.warn('🚫 WebSocket disabled after too many connection failures. App will work in offline mode.');
      this.disabled = true;
      return;
    }

    this.reconnecting = true;
    this.authToken = token || this.authToken || (await authService.getStoredToken());

    if (!this.authToken) {
      console.warn('⚠️ WebSocket connection skipped: no auth token available');
      this.reconnecting = false;
      return;
    }

    console.log(`🔌 Attempting WebSocket connection to: ${this.config.url} (attempt ${this.connectionFailures + 1}/${this.maxFailures})`);

    try {
      this.socket = io(this.config.url, {
        transports: ['websocket', 'polling'], // Allow fallback to polling
        auth: { token: this.authToken },
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        timeout: 10000, // 10 second timeout
        forceNew: true, // Force new connection
      });

      this.registerListeners();
    } catch (error) {
      console.error('🔴 Failed to create WebSocket connection:', error);
      this.connectionFailures++;
      this.reconnecting = false;
    }
  };

  disconnect = () => {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.reconnecting = false;
  };

  private registerListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      this.connected = true;
      this.reconnecting = false;
      this.connectionFailures = 0; // Reset failure count on successful connection
      this.emit('connected', null);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('🔴 WebSocket connection error:', {
        message: error.message,
        description: error.description || 'No description',
        context: error.context || 'No context',
        type: error.type || 'Unknown type',
        url: this.config.url,
        failures: this.connectionFailures + 1
      });
      this.connectionFailures++;
      this.reconnecting = false;
      this.emit('error', error);
    });

    this.socket.on('message:new', (message: Message) => {
      this.emit('message:new', message);
    });

    this.socket.on('conversation:created', (conversation: Conversation) => {
      this.emit('conversation:created', conversation);
    });

    this.socket.on('conversation:read', (payload) => {
      this.emit('conversation:read', payload);
    });

    this.socket.on('conversation:typing', (payload) => {
      this.emit('conversation:typing', payload);
    });

    this.socket.io.on('reconnect_failed', () => {
      this.emit('reconnect:failed', null);
    });
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
