import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { useAppContext } from '../../context/AppContext';

type VendorDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'VendorDashboard'>;

const VendorDashboard: React.FC = () => {
  const navigation = useNavigation<VendorDashboardNavigationProp>();
  const { userProfile } = useAppContext();

  // Mock data for upcoming appointments
  const upcomingAppointments = [
    { 
      id: '1', 
      customerName: 'John Smith', 
      service: 'AC Repair', 
      date: 'Today', 
      time: '2:00 PM - 4:00 PM',
      status: 'confirmed',
      amount: 120
    },
    { 
      id: '2', 
      customerName: 'Sarah Johnson', 
      service: 'AC Maintenance', 
      date: 'Tomorrow', 
      time: '10:00 AM - 12:00 PM',
      status: 'confirmed',
      amount: 89
    },
  ];

  // Mock data for recent messages
  const recentMessages = [
    { id: '1', customerName: 'Michael Brown', message: 'Hi, I need to reschedule my appointment...', time: '2h ago', unread: true },
    { id: '2', customerName: 'Emily Davis', message: 'Thanks for the great service!', time: '1d ago', unread: false },
  ];

  // Stats data
  const stats = [
    { label: 'Today\'s Appointments', value: '3' },
    { label: 'Pending Requests', value: '2' },
    { label: 'Monthly Earnings', value: '$1,245' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back, {userProfile?.businessName || userProfile?.firstName}</Text>
          <Text style={styles.subtitle}>Here's what's happening today</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Image 
            source={{ uri: userProfile?.profileImage || 'https://via.placeholder.com/50' }} 
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingAppointments.length > 0 ? (
          upcomingAppointments.map(appointment => (
            <TouchableOpacity 
              key={appointment.id} 
              style={styles.appointmentCard}
              onPress={() => {
                // Navigate to appointment details
              }}
            >
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentService}>{appointment.service}</Text>
                <Text style={styles.appointmentCustomer}>{appointment.customerName}</Text>
                <View style={styles.appointmentTimeContainer}>
                  <Text style={styles.appointmentTime}>
                    {appointment.date} • {appointment.time}
                  </Text>
                  <View style={[
                    styles.statusBadge, 
                    appointment.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending
                  ]}>
                    <Text style={styles.statusText}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.appointmentAmount}>${appointment.amount}</Text>
              </View>
              <View style={styles.appointmentActions}>
                <TouchableOpacity style={styles.messageButton}>
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming appointments</Text>
            <Text style={styles.emptyStateSubtext}>Your upcoming appointments will appear here</Text>
          </View>
        )}
      </View>

      {/* Recent Messages */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Messages</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Messages', { conversationId: '1' })}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentMessages.length > 0 ? (
          recentMessages.map(message => (
            <TouchableOpacity 
              key={message.id} 
              style={styles.messageCard}
              onPress={() => navigation.navigate('Messages', { conversationId: message.id })}
            >
              <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>
                  {message.customerName.charAt(0)}
                </Text>
              </View>
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text 
                    style={[
                      styles.messageCustomer,
                      message.unread && styles.unreadMessage
                    ]}
                    numberOfLines={1}
                  >
                    {message.customerName}
                  </Text>
                  <Text style={styles.messageTime}>{message.time}</Text>
                </View>
                <Text 
                  style={[
                    styles.messageText,
                    message.unread && styles.unreadMessage
                  ]}
                  numberOfLines={1}
                >
                  {message.message}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent messages</Text>
            <Text style={styles.emptyStateSubtext}>Your messages will appear here</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.quickActionEmoji, { color: '#1976D2' }]}>📅</Text>
            </View>
            <Text style={styles.quickActionText}>Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.quickActionEmoji, { color: '#388E3C' }]}>💰</Text>
            </View>
            <Text style={styles.quickActionText}>Earnings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.quickActionEmoji, { color: '#F57C00' }]}>👥</Text>
            </View>
            <Text style={styles.quickActionText}>Clients</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Text style={[styles.quickActionEmoji, { color: '#8E24AA' }]}>⚙️</Text>
            </View>
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  seeAllText: {
    color: '#0D6EFD',
    fontSize: 14,
    fontWeight: '500',
  },
  appointmentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0D6EFD',
  },
  appointmentInfo: {
    marginBottom: 12,
  },
  appointmentService: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  appointmentCustomer: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  appointmentTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 12,
    color: '#6C757D',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusConfirmed: {
    backgroundColor: '#D4EDDA',
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#155724',
  },
  appointmentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 4,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  messageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0D6EFD',
    marginRight: 8,
  },
  messageButtonText: {
    color: '#0D6EFD',
    fontSize: 12,
    fontWeight: '500',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#0D6EFD',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  messageCustomer: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#212529',
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 10,
    color: '#ADB5BD',
  },
  messageText: {
    fontSize: 12,
    color: '#6C757D',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickAction: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 12,
    color: '#495057',
    textAlign: 'center',
  },
});

export default VendorDashboard;
