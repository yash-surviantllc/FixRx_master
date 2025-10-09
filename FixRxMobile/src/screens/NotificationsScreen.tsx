import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';

type NotificationsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Notifications'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Notification {
  id: string;
  type: 'service' | 'friend' | 'system' | 'quote' | 'appointment';
  title: string;
  description: string;
  timeAgo: string;
  isRead: boolean;
  icon?: string;
  iconColor?: string;
  hasAction?: boolean;
  actionType?: 'rate' | 'view' | 'confirm';
}

const NOTIFICATIONS_DATA: Notification[] = [
  {
    id: '1',
    type: 'appointment',
    title: 'Mike confirmed your plumbing appointment',
    description: 'Tomorrow at 2 PM for bathroom faucet repair',
    timeAgo: '30m ago',
    isRead: false,
    iconColor: '#3B82F6',
    hasAction: false,
  },
  {
    id: '2',
    type: 'service',
    title: 'Sarah completed your electrical work',
    description: 'Rate your experience and help others',
    timeAgo: '2h ago',
    isRead: false,
    iconColor: '#10B981',
    hasAction: true,
    actionType: 'rate',
  },
  {
    id: '3',
    type: 'quote',
    title: 'New quote received: $175',
    description: 'For bathroom faucet repair from Mike Rodriguez',
    timeAgo: '4h ago',
    isRead: false,
    iconColor: '#F59E0B',
    hasAction: true,
    actionType: 'view',
  },
  {
    id: '4',
    type: 'appointment',
    title: 'Plumbing appointment tomorrow',
    description: "Mike Rodriguez • 2:00 PM • Don't forget to be home",
    timeAgo: '6h ago',
    isRead: true,
    iconColor: '#3B82F6',
    hasAction: false,
  },
  {
    id: '5',
    type: 'friend',
    title: 'John recommended a contractor',
    description: 'Check out Rodriguez Plumbing Services',
    timeAgo: '1d ago',
    isRead: true,
    iconColor: '#10B981',
    hasAction: true,
    actionType: 'view',
  },
  {
    id: '6',
    type: 'system',
    title: 'Welcome to FixRx!',
    description: 'Complete your profile to get personalized recommendations',
    timeAgo: '3d ago',
    isRead: true,
    iconColor: '#8B5CF6',
    hasAction: true,
    actionType: 'view',
  },
];

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'all' | 'service' | 'friend' | 'system'>('all');
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DATA);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: 'all', label: 'All', icon: null, count: notifications.length },
    { id: 'service', label: 'Service Updates', icon: 'wrench', count: notifications.filter(n => n.type === 'service' || n.type === 'appointment' || n.type === 'quote').length, color: '#3B82F6' },
    { id: 'friend', label: 'Friend Activity', icon: 'people', count: notifications.filter(n => n.type === 'friend').length, color: '#10B981' },
    { id: 'system', label: 'System', icon: 'settings', count: notifications.filter(n => n.type === 'system').length, color: '#8B5CF6' },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const getFilteredNotifications = () => {
    if (selectedTab === 'all') return notifications;
    if (selectedTab === 'service') {
      return notifications.filter(n => n.type === 'service' || n.type === 'appointment' || n.type === 'quote');
    }
    return notifications.filter(n => n.type === selectedTab);
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'appointment':
        return { name: 'calendar', color: '#3B82F6' };
      case 'service':
        return { name: 'checkmark-circle', color: '#10B981' };
      case 'quote':
        return { name: 'cash', color: '#F59E0B' };
      case 'friend':
        return { name: 'people', color: '#10B981' };
      case 'system':
        return { name: 'settings', color: '#8B5CF6' };
      default:
        return { name: 'notifications', color: colors.primary };
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item);
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          { 
            backgroundColor: item.isRead ? colors.background : colors.cardBackground,
            borderLeftColor: item.isRead ? 'transparent' : icon.color,
            borderLeftWidth: item.isRead ? 0 : 4,
          }
        ]}
        onPress={() => {
          // Mark as read
          setNotifications(notifications.map(n => 
            n.id === item.id ? { ...n, isRead: true } : n
          ));
          
          // Navigate based on notification type
          if (item.actionType === 'rate') {
            // Navigate to rating screen
          } else if (item.actionType === 'view') {
            // Navigate to relevant screen
          }
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: colors.primaryText }]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationDescription, { color: colors.secondaryText }]}>
            {item.description}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.secondaryText }]}>
            {item.timeAgo}
          </Text>
        </View>

        {item.hasAction && (
          <View style={styles.actionIndicator}>
            {!item.isRead && (
              <View style={[styles.unreadDot, { backgroundColor: icon.color }]} />
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.primaryText }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadgeContainer}>
              <View style={[styles.unreadBadge, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.unreadText, { color: '#EF4444' }]}>
                {unreadCount} unread
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="filter-outline" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
              <Text style={[styles.markAllText, { color: colors.primary }]}>
                Mark all as read
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
      >
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isSelected && styles.selectedTab,
                isSelected && { backgroundColor: colors.primary + '10', borderColor: colors.primary }
              ]}
              onPress={() => setSelectedTab(tab.id as any)}
            >
              {tab.icon && (
                <View style={[styles.tabIcon, { backgroundColor: tab.color + '20' }]}>
                  <Ionicons name={tab.icon as any} size={16} color={tab.color} />
                </View>
              )}
              <Text style={[
                styles.tabLabel,
                { color: isSelected ? colors.primary : colors.secondaryText }
              ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[
                  styles.tabBadge,
                  { backgroundColor: isSelected ? colors.primary : colors.surface }
                ]}>
                  <Text style={[
                    styles.tabBadgeText,
                    { color: isSelected ? '#FFFFFF' : colors.secondaryText }
                  ]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Notifications List */}
      <FlatList
        data={getFilteredNotifications()}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.primaryText }]}>
              No notifications
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
              {selectedTab === 'all' 
                ? "You're all caught up!" 
                : `No ${selectedTab} notifications`}
            </Text>
          </View>
        }
      />

      {/* Settings Button */}
      <TouchableOpacity 
        style={[styles.settingsButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('NotificationSettings' as any)}
      >
        <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  unreadBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  markAllButton: {
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  selectedTab: {
    borderWidth: 1,
  },
  tabIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 80,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  iconContainer: {
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
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  settingsButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default NotificationsScreen;
