import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Image, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const ServiceRequestDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, colors } = useTheme();
  const { serviceRequests } = useAppContext();
  const darkMode = theme === 'dark';
  const { request: passedRequest } = route.params as any;
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Try to get request from context first, fallback to passed request
  const request = passedRequest?.id ? serviceRequests.find(sr => sr.id === passedRequest.id) || passedRequest : passedRequest;
  
  // Safety check - if no request, go back
  if (!request) {
    Alert.alert('Error', 'Request not found');
    navigation.goBack();
    return null;
  }
  
  // Use photos from request data, fallback to placeholder
  const requestPhotos = request.photos || [
    'https://via.placeholder.com/300x200',
    'https://via.placeholder.com/300x200',
  ];

  const handleAccept = () => {
    Alert.alert(
      'Accept Request',
      'Are you sure you want to accept this service request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            Alert.alert('Success!', 'Request accepted! Customer will be notified.');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Declined', 'Request has been declined.');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    // @ts-ignore - Navigation typing issue, but functionality works
    navigation.navigate('Messaging', {
      conversationId: request.id,
      customerName: request.customerName,
      serviceDetails: {
        service: request.title || request.service,
        date: request.timeRange || 'TBD',
        time: request.date || 'TBD',
        status: 'pending',
        amount: request.budget,
      },
    });
  };

  const handleCall = () => {
    Alert.alert('Call Customer', `Call ${request.customerName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => {
        // In a real app, use Linking.openURL(`tel:${phoneNumber}`);
        Alert.alert('Calling...', `Calling ${request.customerName}`);
      }}
    ]);
  };
  
  const handleAcceptAndChat = () => {
    Alert.alert(
      'Accept Request',
      'Accept this request and start chatting with the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept & Chat', 
          onPress: () => {
            // Navigate to messaging with acceptance indication
            // @ts-ignore - Navigation typing issue, but functionality works
            navigation.navigate('Messaging', { 
              conversationId: request.id,
              customerName: request.customerName,
              serviceDetails: {
                service: request.title || request.service,
                date: request.timeRange || 'TBD',
                time: request.date || 'TBD',
                status: 'accepted',
                amount: request.budget,
              },
              showAcceptanceMessage: true,
            });
          }
        }
      ]
    );
  };

  const priorityColors = {
    high: { bg: '#FEE2E2', text: '#DC2626', border: '#DC2626' },
    medium: { bg: '#FEF3C7', text: '#D97706', border: '#D97706' },
    low: { bg: '#DBEAFE', text: '#2563EB', border: '#2563EB' },
  };
  const priorityColor = priorityColors[(request.priority || 'medium') as keyof typeof priorityColors];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Service Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Info Card */}
        <View style={[styles.customerCard, { backgroundColor: colors.secondary }]}>
          <View style={styles.customerHeader}>
            <View style={[styles.customerAvatar, { backgroundColor: darkMode ? '#374151' : '#E5E7EB' }]}>
              <Text style={styles.customerAvatarText}>👤</Text>
            </View>
            <View style={styles.customerInfo}>
              <View style={styles.customerNameRow}>
                <Text style={[styles.customerName, { color: colors.text }]}>{request.customerName}</Text>
                <MaterialIcons name="verified" size={20} color="#10B981" style={styles.verifiedIcon} />
              </View>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#F59E0B" />
                <Text style={[styles.ratingText, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>4.8 (23 reviews)</Text>
              </View>
              <View style={styles.metaRow}>
                <MaterialIcons name="location-on" size={14} color={darkMode ? '#9CA3AF' : '#6B7280'} />
                <Text style={[styles.metaText, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>{request.distance || '2.1 mi'} away</Text>
                <MaterialIcons name="schedule" size={14} color={darkMode ? '#9CA3AF' : '#6B7280'} style={styles.metaIcon} />
                <Text style={[styles.metaText, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>{request.date || '5 min ago'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Service Title */}
        <View style={styles.serviceHeader}>
          <Text style={[styles.serviceTitle, { color: colors.text }]}>{request.title || request.service}</Text>
          <View style={styles.asapBadge}>
            <Text style={styles.asapText}>ASAP</Text>
          </View>
        </View>
        
        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: darkMode ? '#D1D5DB' : '#374151' }]} numberOfLines={showFullDescription ? undefined : 2}>
            {request.description}
          </Text>
          <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
            <Text style={[styles.showMoreText, { color: colors.primary }]}>{showFullDescription ? 'Show less' : 'Show more'}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Budget and Time */}
        <View style={styles.infoRow}>
          <View style={[styles.infoItem, { backgroundColor: colors.secondary }]}>
            <MaterialIcons name="attach-money" size={20} color="#10B981" />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>Budget</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>${request.budget}</Text>
            </View>
          </View>
          <View style={[styles.infoItem, { backgroundColor: colors.secondary }]}>
            <MaterialIcons name="schedule" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>Preferred Time</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{request.timeRange || 'Today or tomorrow morning'}</Text>
            </View>
          </View>
        </View>
        
        {/* Location */}
        <View style={styles.section}>
          <MaterialIcons name="location-on" size={20} color="#EF4444" />
          <View style={styles.locationContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            <Text style={[styles.locationText, { color: darkMode ? '#D1D5DB' : '#374151' }]}>{request.address || '1234 Oak Street, San Francisco, CA'}</Text>
          </View>
        </View>
        
        {/* Photos */}
        <View style={styles.section}>
          <View style={styles.photosHeader}>
            <MaterialIcons name="photo-camera" size={20} color={darkMode ? '#9CA3AF' : '#6B7280'} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Photos ({requestPhotos.length})</Text>
          </View>
          <View style={styles.photosGrid}>
            {requestPhotos.map((photo: string, index: number) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
              </View>
            ))}
          </View>
        </View>
        
        {/* Contact Actions */}
        <View style={styles.contactActions}>
          <TouchableOpacity style={[styles.messageButton, { backgroundColor: colors.background, borderColor: colors.primary }]} onPress={handleMessage} activeOpacity={0.7}>
            <MaterialIcons name="message" size={20} color={colors.primary} />
            <Text style={[styles.messageButtonText, { color: colors.primary }]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.callButton, { backgroundColor: colors.card, borderColor: '#10B981' }]} onPress={handleCall} activeOpacity={0.7}>
            <MaterialIcons name="call" size={20} color="#10B981" />
            <Text style={[styles.callButtonText, { color: '#10B981' }]}>Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.declineButton, { backgroundColor: colors.secondary, borderColor: colors.border }]} onPress={handleDecline} activeOpacity={0.7}>
          <Text style={[styles.declineButtonText, { color: '#EF4444' }]}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.acceptButton, { backgroundColor: colors.primary }]} onPress={handleAcceptAndChat} activeOpacity={0.7}>
          <Text style={styles.acceptButtonText}>Accept & Chat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  customerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 32,
  },
  customerInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  metaIcon: {
    marginLeft: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  asapBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  asapText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  showMoreText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  infoContent: {
    marginLeft: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationContent: {
    marginLeft: 8,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
  },
  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 8,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  acceptButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ServiceRequestDetailScreen;
