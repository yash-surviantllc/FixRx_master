/**
 * Notification Settings Screen
 * Allows users to configure push notification preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { pushNotificationService, NotificationPreferences } from '../services/pushNotificationService';

interface NotificationSettingsScreenProps {
  navigation: any;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await pushNotificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    try {
      await pushNotificationService.updatePreferences({ [key]: value });
    } catch (error) {
      console.error('Failed to update preference:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      // Revert the change
      setPreferences(preferences);
    }
  };

  const updateQuietHours = async (field: 'enabled' | 'startTime' | 'endTime', value: any) => {
    if (!preferences) return;

    const updatedQuietHours = { ...preferences.quietHours, [field]: value };
    const updatedPreferences = { ...preferences, quietHours: updatedQuietHours };
    setPreferences(updatedPreferences);

    try {
      await pushNotificationService.updatePreferences({ quietHours: updatedQuietHours });
    } catch (error) {
      console.error('Failed to update quiet hours:', error);
      Alert.alert('Error', 'Failed to update quiet hours settings');
      setPreferences(preferences);
    }
  };

  const showTimePickerAlert = (type: 'start' | 'end') => {
    // For simplicity, using Alert with text input
    // In production, you'd use a proper time picker component
    Alert.prompt(
      `Set ${type === 'start' ? 'Start' : 'End'} Time`,
      'Enter time in HH:MM format (24-hour)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: (time) => {
            if (time && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
              updateQuietHours(type === 'start' ? 'startTime' : 'endTime', time);
            } else {
              Alert.alert('Invalid Time', 'Please enter time in HH:MM format');
            }
          },
        },
      ],
      'plain-text',
      preferences?.quietHours[type === 'start' ? 'startTime' : 'endTime']
    );
  };

  const requestPermissions = async () => {
    const hasPermission = await pushNotificationService.areNotificationsEnabled();
    if (!hasPermission) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // Open device settings
            if (Platform.OS === 'ios') {
              // iOS settings URL
            } else {
              // Android settings intent
            }
          }},
        ]
      );
    }
  };

  if (loading || !preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Push Notifications</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications for important updates
              </Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={(value) => {
                if (value) {
                  requestPermissions();
                }
                updatePreference('enabled', value);
              }}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Notification Categories */}
        {preferences.enabled && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Notification Types</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Invitations</Text>
                <Text style={styles.settingDescription}>
                  New vendor invitations and responses
                </Text>
              </View>
              <Switch
                value={preferences.invitations}
                onValueChange={(value) => updatePreference('invitations', value)}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Messages</Text>
                <Text style={styles.settingDescription}>
                  New messages and chat notifications
                </Text>
              </View>
              <Switch
                value={preferences.messages}
                onValueChange={(value) => updatePreference('messages', value)}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Ratings & Reviews</Text>
                <Text style={styles.settingDescription}>
                  New ratings and review notifications
                </Text>
              </View>
              <Switch
                value={preferences.ratings}
                onValueChange={(value) => updatePreference('ratings', value)}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Vendor Updates</Text>
                <Text style={styles.settingDescription}>
                  Vendor profile and service updates
                </Text>
              </View>
              <Switch
                value={preferences.vendorUpdates}
                onValueChange={(value) => updatePreference('vendorUpdates', value)}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>System Alerts</Text>
                <Text style={styles.settingDescription}>
                  Important system and security alerts
                </Text>
              </View>
              <Switch
                value={preferences.systemAlerts}
                onValueChange={(value) => updatePreference('systemAlerts', value)}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}

        {/* Sound & Vibration */}
        {preferences.enabled && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="volume-high" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Sound & Vibration</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Sound</Text>
                <Text style={styles.settingDescription}>
                  Play sound for notifications
                </Text>
              </View>
              <Switch
                value={preferences.soundEnabled}
                onValueChange={(value) => updatePreference('soundEnabled', value)}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Vibration</Text>
                <Text style={styles.settingDescription}>
                  Vibrate for notifications
                </Text>
              </View>
              <Switch
                value={preferences.vibrationEnabled}
                onValueChange={(value) => updatePreference('vibrationEnabled', value)}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}

        {/* Quiet Hours */}
        {preferences.enabled && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="moon" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Quiet Hours</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
                <Text style={styles.settingDescription}>
                  Silence notifications during specified hours
                </Text>
              </View>
              <Switch
                value={preferences.quietHours.enabled}
                onValueChange={(value) => updateQuietHours('enabled', value)}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {preferences.quietHours.enabled && (
              <>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => showTimePickerAlert('start')}
                >
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Start Time</Text>
                    <Text style={styles.settingDescription}>
                      {preferences.quietHours.startTime}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => showTimePickerAlert('end')}
                >
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>End Time</Text>
                    <Text style={styles.settingDescription}>
                      {preferences.quietHours.endTime}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Test Notification */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              pushNotificationService.sendLocalNotification(
                'Test Notification',
                'This is a test notification from FixRx'
              );
            }}
          >
            <Ionicons name="send" size={20} color="#007AFF" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
});

export default NotificationSettingsScreen;
