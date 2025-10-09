/**
 * Push Notification Service
 * Firebase Cloud Messaging integration for FixRx Mobile App
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  enabled: boolean;
  invitations: boolean;
  messages: boolean;
  ratings: boolean;
  vendorUpdates: boolean;
  systemAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: string;
  read: boolean;
  category: 'invitation' | 'message' | 'rating' | 'vendor_update' | 'system';
  priority: 'low' | 'normal' | 'high';
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private preferences: NotificationPreferences | null = null;
  private notificationHistory: PushNotification[] = [];

  /**
   * Initialize push notification service
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing Push Notification Service...');

      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return false;
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });

      this.expoPushToken = token.data;
      console.log('✅ Expo Push Token:', this.expoPushToken);

      // Configure notification channels (Android)
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Load preferences and history
      await this.loadPreferences();
      await this.loadNotificationHistory();

      // Register token with backend
      await this.registerTokenWithBackend();

      // Set up notification listeners
      this.setupNotificationListeners();

      console.log('✅ Push Notification Service Initialized');
      return true;

    } catch (error) {
      console.error('❌ Push Notification Service Initialization Failed:', error);
      return false;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('invitations', {
      name: 'Invitations',
      description: 'Vendor invitation notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      description: 'Chat and messaging notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#34C759',
    });

    await Notifications.setNotificationChannelAsync('ratings', {
      name: 'Ratings & Reviews',
      description: 'Rating and review notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#FF9500',
    });

    await Notifications.setNotificationChannelAsync('vendor_updates', {
      name: 'Vendor Updates',
      description: 'Vendor profile and service updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#5856D6',
    });

    await Notifications.setNotificationChannelAsync('system', {
      name: 'System Alerts',
      description: 'System maintenance and important alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF3B30',
    });
  }

  /**
   * Setup notification event listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📱 Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationTapped(response);
    });
  }

  /**
   * Handle notification received
   */
  private async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    const pushNotification: PushNotification = {
      id: notification.request.identifier,
      title: notification.request.content.title || '',
      body: notification.request.content.body || '',
      data: notification.request.content.data,
      timestamp: new Date().toISOString(),
      read: false,
      category: notification.request.content.data?.category || 'system',
      priority: notification.request.content.data?.priority || 'normal',
    };

    // Add to history
    this.notificationHistory.unshift(pushNotification);
    await this.saveNotificationHistory();

    // Update badge count
    await this.updateBadgeCount();
  }

  /**
   * Handle notification tapped
   */
  private handleNotificationTapped(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    // Mark as read
    this.markAsRead(response.notification.request.identifier);

    // Handle navigation based on notification type
    if (data?.category === 'invitation' && data?.invitationId) {
      // Navigate to invitation details
      console.log('Navigate to invitation:', data.invitationId);
    } else if (data?.category === 'message' && data?.conversationId) {
      // Navigate to conversation
      console.log('Navigate to conversation:', data.conversationId);
    } else if (data?.category === 'rating' && data?.vendorId) {
      // Navigate to vendor profile
      console.log('Navigate to vendor profile:', data.vendorId);
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(): Promise<void> {
    try {
      if (!this.expoPushToken) return;

      await apiService.post('/notifications/register-token', {
        token: this.expoPushToken,
        platform: Platform.OS,
        deviceInfo: {
          brand: Device.brand,
          modelName: Device.modelName,
          osName: Device.osName,
          osVersion: Device.osVersion,
        },
      });

      console.log('✅ Push token registered with backend');
    } catch (error) {
      console.error('❌ Failed to register push token:', error);
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    if (!this.preferences) {
      await this.loadPreferences();
    }
    return this.preferences!;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    const currentPreferences = await this.getPreferences();
    this.preferences = { ...currentPreferences, ...preferences };
    
    await AsyncStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    
    // Update backend preferences
    try {
      await apiService.put('/notifications/preferences', this.preferences);
    } catch (error) {
      console.error('Failed to update preferences on backend:', error);
    }
  }

  /**
   * Load preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_preferences');
      if (stored) {
        this.preferences = JSON.parse(stored);
      } else {
        // Default preferences
        this.preferences = {
          enabled: true,
          invitations: true,
          messages: true,
          ratings: true,
          vendorUpdates: true,
          systemAlerts: true,
          soundEnabled: true,
          vibrationEnabled: true,
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00',
          },
        };
        await AsyncStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(): Promise<PushNotification[]> {
    return this.notificationHistory;
  }

  /**
   * Load notification history from storage
   */
  private async loadNotificationHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_history');
      if (stored) {
        this.notificationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  }

  /**
   * Save notification history to storage
   */
  private async saveNotificationHistory(): Promise<void> {
    try {
      // Keep only last 100 notifications
      const historyToSave = this.notificationHistory.slice(0, 100);
      await AsyncStorage.setItem('notification_history', JSON.stringify(historyToSave));
    } catch (error) {
      console.error('Failed to save notification history:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notificationHistory.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotificationHistory();
      await this.updateBadgeCount();
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    this.notificationHistory.forEach(notification => {
      notification.read = true;
    });
    await this.saveNotificationHistory();
    await this.updateBadgeCount();
  }

  /**
   * Clear notification history
   */
  async clearHistory(): Promise<void> {
    this.notificationHistory = [];
    await AsyncStorage.removeItem('notification_history');
    await this.updateBadgeCount();
  }

  /**
   * Update app badge count
   */
  private async updateBadgeCount(): Promise<void> {
    const unreadCount = this.notificationHistory.filter(n => !n.read).length;
    await Notifications.setBadgeCountAsync(unreadCount);
  }

  /**
   * Send local notification (for testing)
   */
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    trigger: Date,
    data?: any
  ): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: {
        date: trigger,
      },
    });

    return identifier;
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    return this.notificationHistory.filter(n => !n.read).length;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
