/**
 * WebSocket Testing Utility for FixRx Mobile
 */

import { websocketService } from '../services/websocketService';
import { sessionManager } from './sessionManager';

export class WebSocketTester {
  static async testConnection(): Promise<boolean> {
    console.log('Testing WebSocket connection...');
    
    try {
      // Get current status
      const initialStatus = websocketService.getStatus();
      console.log('Initial WebSocket status:', initialStatus);

      // Try to connect
      const connected = await websocketService.connect();
      
      if (connected) {
        console.log('WebSocket connection test PASSED');
        
        // Test basic functionality
        setTimeout(() => {
          console.log('WebSocket connection is active and ready');
        }, 1000);
        
        return true;
      } else {
        console.log('WebSocket connection test FAILED');
        return false;
      }
    } catch (error) {
      console.error('WebSocket test error:', error);
      return false;
    }
  }

  static async testWithAuth(): Promise<boolean> {
    console.log('Testing WebSocket with authentication...');
    
    try {
      // Check if we have auth data
      const sessionData = await sessionManager.getCurrentSessionData();
      const token = sessionData.auth_token;
      
      if (!token) {
        console.warn('No auth token available for WebSocket test');
        return false;
      }

      // Test connection with token
      const connected = await websocketService.connect(token);
      
      if (connected) {
        console.log('Authenticated WebSocket connection test PASSED');
        return true;
      } else {
        console.log('Authenticated WebSocket connection test FAILED');
        return false;
      }
    } catch (error) {
      console.error('Authenticated WebSocket test error:', error);
      return false;
    }
  }

  static logStatus(): void {
    const status = websocketService.getStatus();
    console.log('WebSocket Status Report:', {
      connected: status.connected ? 'Connected' : 'Disconnected',
      reconnecting: status.reconnecting ? 'Reconnecting' : 'Idle',
      disabled: status.disabled ? 'Disabled' : 'Enabled',
      failures: `${status.failures}/${status.maxFailures}`,
      url: status.url
    });
  }

  static async forceReconnect(): Promise<boolean> {
    console.log('Force reconnecting WebSocket...');
    
    try {
      const sessionData = await sessionManager.getCurrentSessionData();
      const token = sessionData.auth_token;
      
      const connected = await websocketService.forceReconnect(token);
      
      if (connected) {
        console.log('Force reconnect SUCCESSFUL');
      } else {
        console.log('Force reconnect FAILED');
      }
      
      return connected;
    } catch (error) {
      console.error('Force reconnect error:', error);
      return false;
    }
  }

  static enable(): void {
    console.log('Enabling WebSocket service...');
    websocketService.enable();
    this.logStatus();
  }

  static disconnect(): void {
    console.log('Disconnecting WebSocket...');
    websocketService.disconnect();
    this.logStatus();
  }

  // Development helper - adds WebSocket test methods to global scope
  static enableDevTools(): void {
    if (__DEV__) {
      (global as any).wsTest = {
        test: () => WebSocketTester.testConnection(),
        testAuth: () => WebSocketTester.testWithAuth(),
        status: () => WebSocketTester.logStatus(),
        reconnect: () => WebSocketTester.forceReconnect(),
        enable: () => WebSocketTester.enable(),
        disconnect: () => WebSocketTester.disconnect(),
      };
      
      console.log('WebSocket dev tools enabled! Use:');
      console.log('   wsTest.test() - Test basic connection');
      console.log('   wsTest.testAuth() - Test with authentication');
      console.log('   wsTest.status() - Show current status');
      console.log('   wsTest.reconnect() - Force reconnect');
      console.log('   wsTest.enable() - Enable WebSocket');
      console.log('   wsTest.disconnect() - Disconnect WebSocket');
    }
  }
}

export default WebSocketTester;
