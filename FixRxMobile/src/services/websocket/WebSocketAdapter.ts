/**
 * WebSocket Adapter for FixRx Mobile
 * Provides compatibility layer between different WebSocket implementations
 * Allows seamless switching between original and enhanced WebSocket services
 */

import { enhancedWebSocketManager } from './WebSocketManager';
import { websocketService } from '../websocketService';

export type WebSocketImplementation = 'original' | 'enhanced';

interface WebSocketAdapter {
  connect(token?: string): Promise<boolean>;
  disconnect(): void;
  on(event: string, callback: (data: any) => void): () => void;
  emit(event: string, data: any): void;
  getStatus(): any;
  forceReconnect(token?: string): Promise<boolean>;
}

class WebSocketAdapterService {
  private currentImplementation: WebSocketImplementation = 'enhanced';
  private adapter: WebSocketAdapter;

  constructor() {
    this.adapter = this.createAdapter(this.currentImplementation);
  }

  private createAdapter(implementation: WebSocketImplementation): WebSocketAdapter {
    switch (implementation) {
      case 'enhanced':
        return {
          connect: (token?: string) => enhancedWebSocketManager.connect(token),
          disconnect: () => enhancedWebSocketManager.disconnect(),
          on: (event: string, callback: (data: any) => void) => enhancedWebSocketManager.on(event as any, callback),
          emit: (event: string, data: any) => enhancedWebSocketManager.emit(event, data),
          getStatus: () => enhancedWebSocketManager.getStatus(),
          forceReconnect: (token?: string) => enhancedWebSocketManager.forceReconnect(token),
        };

      case 'original':
        return {
          connect: (token?: string) => websocketService.connect(token),
          disconnect: () => websocketService.disconnect(),
          on: (event: string, callback: (data: any) => void) => websocketService.on(event as any, callback),
          emit: (event: string, data: any) => {
            console.warn('Emit not available in original implementation');
          },
          getStatus: () => ({
            connected: false, // Will be updated when original service adds getStatus method
            reconnecting: false,
            disabled: false,
            failures: 0,
            maxFailures: 3,
            url: 'original-websocket-service'
          }),
          forceReconnect: async (token?: string) => {
            websocketService.disconnect();
            await new Promise(resolve => setTimeout(resolve, 1000));
            return websocketService.connect(token);
          },
        };

      default:
        throw new Error(`Unknown WebSocket implementation: ${implementation}`);
    }
  }

  public switchImplementation(implementation: WebSocketImplementation): void {
    console.log(`[WebSocketAdapter] Switching to ${implementation} implementation`);
    
    // Disconnect current implementation
    this.adapter.disconnect();
    
    // Switch to new implementation
    this.currentImplementation = implementation;
    this.adapter = this.createAdapter(implementation);
    
    console.log(`[WebSocketAdapter] Switched to ${implementation} implementation`);
  }

  public getCurrentImplementation(): WebSocketImplementation {
    return this.currentImplementation;
  }

  // Proxy methods to current adapter
  public async connect(token?: string): Promise<boolean> {
    return this.adapter.connect(token);
  }

  public disconnect(): void {
    this.adapter.disconnect();
  }

  public on(event: string, callback: (data: any) => void): () => void {
    return this.adapter.on(event, callback);
  }

  public emit(event: string, data: any): void {
    this.adapter.emit(event, data);
  }

  public getStatus(): any {
    return {
      ...this.adapter.getStatus(),
      implementation: this.currentImplementation
    };
  }

  public async forceReconnect(token?: string): Promise<boolean> {
    return this.adapter.forceReconnect(token);
  }

  // Development helper methods
  public testBothImplementations = async (token?: string): Promise<void> => {
    if (!__DEV__) return;

    console.log('[WebSocketAdapter] Testing both implementations...');

    // Test enhanced implementation
    this.switchImplementation('enhanced');
    const enhancedResult = await this.connect(token);
    console.log(`Enhanced implementation: ${enhancedResult ? 'SUCCESS' : 'FAILED'}`);
    this.disconnect();

    // Test original implementation (if available)
    try {
      this.switchImplementation('original');
      const originalResult = await this.connect(token);
      console.log(`Original implementation: ${originalResult ? 'SUCCESS' : 'FAILED'}`);
      this.disconnect();
    } catch (error) {
      console.log('Original implementation: NOT AVAILABLE');
    }

    // Switch back to enhanced
    this.switchImplementation('enhanced');
  };
}

// Export singleton instance
export const webSocketAdapter = new WebSocketAdapterService();
export default webSocketAdapter;
