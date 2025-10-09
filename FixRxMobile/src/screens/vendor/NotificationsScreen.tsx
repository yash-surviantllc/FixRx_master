import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

type NotificationCategory = 'all' | 'services' | 'settings';

interface Notification {
  id: string;
  category: NotificationCategory;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  hasIndicator?: boolean;
}

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      category: 'services',
      icon: 'check-circle',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      title: 'Mike confirmed your plu...',
      message: 'Tomorrow at 2 PM for bathroom faucet repair',
      time: '30m ago',
      read: false,
      hasIndicator: true,
    },
    {
      id: '2',
      category: 'services',
      icon: 'check-circle',
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
      title: 'Sarah completed your electr...',
      message: 'Rate your experience and help others',
      time: '2h ago',
      read: false,
      hasIndicator: true,
    },
    {
      id: '3',
      category: 'services',
      icon: 'attach-money',
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
      title: 'New quote received: $175',
      message: 'For bathroom faucet repair from Mike Rodriguez',
      time: '4h ago',
      read: false,
    },
    {
      id: '4',
      category: 'services',
      icon: 'event',
      iconBg: '#E0E7FF',
      iconColor: '#6366F1',
      title: 'Plumbing appointment tomor...',
      message: 'Mike Rodriguez • 2:00 PM • Don\'t forget to be home',
      time: '6h ago',
      read: false,
    },
    {
      id: '5',
      category: 'services',
      icon: 'person-add',
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
      title: 'Emma added a new contrac...',
      message: 'Johnson Roofing Services in your area',
      time: '8h ago',
      read: true,
    },
    {
      id: '6',
      category: 'services',
      icon: 'people',
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
      title: '3 friends hired contractors thi...',
      message: 'Alex, Maria, and Jake completed services',
      time: '12h ago',
      read: true,
    },
    {
      id: '7',
      category: 'services',
      icon: 'star',
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
      title: 'Michael rated a contractor 5 s...',
      message: 'Elite Plumbing Co in Downtown area',
      time: '18h ago',
      read: true,
    },
    {
      id: '8',
      category: 'settings',
      icon: 'receipt',
      iconBg: '#E0E7FF',
      iconColor: '#6366F1',
      title: 'Payment processed successf...',
      message: '$175 for plumbing service with Mike Rodriguez',
      time: '1d ago',
      read: true,
    },
    {
      id: '9',
      category: 'settings',
      icon: 'verified-user',
      iconBg: '#E0E7FF',
      iconColor: '#6366F1',
      title: 'Contractor license verification ...',
      message: 'Mike Rodriguez\'s credentials have been verified',
      time: '1d ago',
      read: true,
    },
    {
      id: '10',
      category: 'settings',
      icon: 'warning',
      iconBg: '#FEE2E2',
      iconColor: '#EF4444',
      title: 'New device login detected',
      message: 'iPhone 15 Pro from San Francisco, CA',
      time: '2d ago',
      read: true,
      hasIndicator: true,
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const filteredNotifications = selectedCategory === 'all'
    ? notifications
    : notifications.filter(n => n.category === selectedCategory);

  const unreadCount = notifications.filter(n => !n.read).length;
  const servicesCount = notifications.filter(n => n.category === 'services').length;
  const settingsCount = notifications.filter(n => n.category === 'settings').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, selectedCategory === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedCategory('all')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="build" size={20} color={selectedCategory === 'all' ? '#FFFFFF' : '#3B82F6'} />
          <View style={[styles.filterBadge, selectedCategory === 'all' && styles.filterBadgeActive]}>
            <Text style={[styles.filterBadgeText, selectedCategory === 'all' && styles.filterBadgeTextActive]}>
              {notifications.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedCategory === 'services' && styles.filterTabActive]}
          onPress={() => setSelectedCategory('services')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="people" size={20} color={selectedCategory === 'services' ? '#FFFFFF' : '#10B981'} />
          <View style={[styles.filterBadge, selectedCategory === 'services' && styles.filterBadgeActive]}>
            <Text style={[styles.filterBadgeText, selectedCategory === 'services' && styles.filterBadgeTextActive]}>
              {servicesCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedCategory === 'settings' && styles.filterTabActive]}
          onPress={() => setSelectedCategory('settings')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="settings" size={20} color={selectedCategory === 'settings' ? '#FFFFFF' : '#6366F1'} />
          <View style={[styles.filterBadge, selectedCategory === 'settings' && styles.filterBadgeActive]}>
            <Text style={[styles.filterBadgeText, selectedCategory === 'settings' && styles.filterBadgeTextActive]}>
              {settingsCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
        {filteredNotifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[styles.notificationItem, !notification.read && styles.notificationItemUnread]}
            onPress={() => markAsRead(notification.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.notificationIcon, { backgroundColor: notification.iconBg }]}>
              <MaterialIcons name={notification.icon as any} size={24} color={notification.iconColor} />
            </View>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle} numberOfLines={1}>
                  {notification.title}
                </Text>
                {notification.hasIndicator && (
                  <View style={styles.indicatorDot} />
                )}
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </View>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  filterTabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: '#1E40AF',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationItemUnread: {
    backgroundColor: '#F9FAFB',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default NotificationsScreen;
