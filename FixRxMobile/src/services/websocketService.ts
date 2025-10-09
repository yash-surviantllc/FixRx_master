/**
 * WebSocket Service for Real-Time Communication
 * Handles real-time updates for messages, notifications, and live data
 */

import { RealTimeEvent, WebSocketEvents } from '../types/api';

type EventCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private isConnecting = false;
  private authToken: string | null = null;

  // Configuration
  private config = {
    url: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000',
    heartbeatInterval: 30000, // 30 seconds
    reconnectMultiplier: 1.5,
  };

  // Connect to WebSocket server
  connect(authToken?: string) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.authToken = authToken || this.authToken;

    try {
      const wsUrl = this.authToken 
        ? `${this.config.url}?token=${this.authToken}`
        : this.config.url;

      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  // Setup WebSocket event listeners
  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emit('connected', null);
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data: RealTimeEvent = JSON.parse(event.data);
        this.handleIncomingMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.emit('disconnected', { code: event.code, reason: event.reason });
      
      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  // Handle incoming real-time messages
  private handleIncomingMessage(event: RealTimeEvent) {
    switch (event.type) {
      case 'message':
        this.emit('message:new', event.data);
        break;
      case 'request_update':
        this.emit('request:updated', event.data);
        break;
      case 'appointment_update':
        this.emit('appointment:updated', event.data);
        break;
      case 'notification':
        this.emit('notification:new', event.data);
        break;
      default:
        console.log('Unknown WebSocket event type:', event.type);
    }
  }

  // Send message through WebSocket
  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
      this.ws.send(message);
    } else {
      console.warn('WebSocket not connected. Cannot send message:', type);
    }
  }

  // Subscribe to events
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback as EventCallback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Emit events to listeners
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  // Handle reconnection logic
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect:failed', null);
      return;
    }

    const delay = this.reconnectInterval * Math.pow(this.config.reconnectMultiplier, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    }, delay);
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat() {
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  // Convenience methods for common actions
  joinRoom(roomId: string) {
    this.send('join:room', { roomId });
  }

  leaveRoom(roomId: string) {
    this.send('leave:room', { roomId });
  }

  startTyping(conversationId: string) {
    this.send('typing:start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.send('typing:stop', { conversationId });
  }

  // Get connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// React Hook for WebSocket connection
export const useWebSocket = () => {
  const connect = (authToken?: string) => websocketService.connect(authToken);
  const disconnect = () => websocketService.disconnect();
  const send = (type: string, data: any) => websocketService.send(type, data);
  const on = <K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) => 
    websocketService.on(event, callback);

  return {
    connect,
    disconnect,
    send,
    on,
    isConnected: websocketService.isConnected,
    connectionState: websocketService.connectionState,
    joinRoom: websocketService.joinRoom.bind(websocketService),
    leaveRoom: websocketService.leaveRoom.bind(websocketService),
    startTyping: websocketService.startTyping.bind(websocketService),
    stopTyping: websocketService.stopTyping.bind(websocketService),
  };
};
