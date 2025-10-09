import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Linking,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';

type ContractorProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ContractorProfile'>;
type ContractorProfileScreenRouteProp = RouteProp<RootStackParamList, 'ContractorProfile'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Review {
  id: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  comment: string;
  timeAgo: string;
}

interface Service {
  id: string;
  name: string;
}

// Mock data for the contractor
const CONTRACTOR_DATA = {
  id: '1',
  name: 'Rodriguez Plumbing Services',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  experience: 8,
  location: 'Downtown & Midtown',
  distance: '2.3 miles away',
  rating: 4.9,
  reviewCount: 127,
  isVerified: true,
  recommendedBy: 3,
  mutualFriends: [
    { id: '1', name: 'John D.', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { id: '2', name: 'Sarah M.', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    { id: '3', name: 'Mike R.', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
  ],
  services: [
    { id: '1', name: 'Emergency Repairs' },
    { id: '2', name: 'Bathroom Remodeling' },
    { id: '3', name: 'Kitchen Plumbing' },
    { id: '4', name: 'Pipe Installation' },
    { id: '5', name: 'Water Heater Service' },
    { id: '6', name: 'Drain Cleaning' },
    { id: '7', name: 'Leak Detection' },
  ],
  portfolio: [
    { id: '1', image: 'https://via.placeholder.com/150' },
    { id: '2', image: 'https://via.placeholder.com/150' },
    { id: '3', image: 'https://via.placeholder.com/150' },
    { id: '4', image: 'https://via.placeholder.com/150' },
  ],
  reviews: [
    {
      id: '1',
      customerName: 'Sarah M.',
      customerAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      rating: 5,
      comment: 'Great work on our kitchen sink! Professional and clean work.',
      timeAgo: '2 weeks ago',
    },
    {
      id: '2',
      customerName: 'Mike D.',
      customerAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      rating: 5,
      comment: 'Fixed our emergency leak quickly. Very reliable and fair pricing.',
      timeAgo: '1 month ago',
    },
    {
      id: '3',
      customerName: 'Lisa K.',
      customerAvatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      rating: 5,
      comment: 'Complete bathroom renovation exceeded our expectations. Highly recommend!',
      timeAgo: '2 months ago',
    },
  ],
  phoneNumber: '+1 (555) 123-4567',
};

const ContractorProfileScreen: React.FC = () => {
  const navigation = useNavigation<ContractorProfileScreenNavigationProp>();
  const route = useRoute<ContractorProfileScreenRouteProp>();
  const { colors, isDarkMode } = useTheme();
  const [showAllServices, setShowAllServices] = useState(false);

  // Map the contractor data from the list to the profile format
  const passedContractor = route.params?.contractor;
  const contractor = passedContractor ? {
    id: passedContractor.id || '1',
    name: passedContractor.name || 'Unknown Contractor',
    avatar: passedContractor.image || 'https://randomuser.me/api/portraits/men/32.jpg',
    experience: passedContractor.experience || 5,
    location: passedContractor.location || 'Local Area',
    distance: passedContractor.distance || '2 miles away',
    rating: passedContractor.rating || 4.5,
    reviewCount: passedContractor.reviewCount || 0,
    isVerified: passedContractor.isVerified || false,
    recommendedBy: passedContractor.ratingCount || 0,
    mutualFriends: passedContractor.mutualFriends || CONTRACTOR_DATA.mutualFriends,
    services: passedContractor.services || [
      { id: '1', name: passedContractor.service || 'General Service' }
    ],
    portfolio: passedContractor.portfolio || CONTRACTOR_DATA.portfolio,
    reviews: passedContractor.reviews || CONTRACTOR_DATA.reviews,
    phoneNumber: passedContractor.phoneNumber || CONTRACTOR_DATA.phoneNumber,
  } : CONTRACTOR_DATA;

  const handleStartConversation = () => {
    navigation.navigate('Messaging' as any, { 
      conversationId: contractor.id,
      contractorName: contractor.name 
    });
  };

  const handleQuickCall = () => {
    Linking.openURL(`tel:${contractor.phoneNumber}`);
  };

  const handleSeeAllRecommendations = () => {
    navigation.navigate('AllRecommendations' as any, {
      contractorId: contractor.id,
      contractorName: contractor.name,
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? "star" : "star-outline"}
        size={16}
        color="#F59E0B"
      />
    ));
  };

  const renderService = (service: Service, index: number) => {
    const visibleServices = showAllServices ? contractor.services : contractor.services.slice(0, 6);
    if (!showAllServices && index >= 6) return null;
    
    return (
      <View 
        key={service.id} 
        style={[styles.serviceChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.serviceText, { color: colors.primaryText }]}>
          {service.name}
        </Text>
      </View>
    );
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={[styles.reviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: item.customerAvatar }} style={styles.reviewerAvatar} />
        <View style={styles.reviewerInfo}>
          <Text style={[styles.reviewerName, { color: colors.primaryText }]}>
            {item.customerName}
          </Text>
          <View style={styles.reviewMeta}>
            <View style={styles.ratingContainer}>
              {renderStars(item.rating)}
            </View>
            <Text style={[styles.reviewTime, { color: colors.secondaryText }]}>
              {item.timeAgo}
            </Text>
          </View>
        </View>
      </View>
      <Text style={[styles.reviewComment, { color: colors.secondaryText }]}>
        "{item.comment}"
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>
          Contractor Profile
        </Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <Image source={{ uri: contractor.avatar }} style={styles.profileImage} />
              {contractor.isVerified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.contractorName, { color: colors.primaryText }]}>
                {contractor.name}
              </Text>
              
              <View style={styles.metaInfo}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.secondaryText} />
                  <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                    {contractor.experience} years experience
                  </Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={colors.secondaryText} />
                  <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                    Serving {contractor.location}
                  </Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Text style={[styles.distanceText, { color: colors.primary }]}>
                    {contractor.distance}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <View style={styles.ratingMain}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: colors.primaryText }]}>
                {contractor.rating}
              </Text>
              <Text style={[styles.reviewCount, { color: colors.secondaryText }]}>
                ({contractor.reviewCount} reviews)
              </Text>
            </View>
          </View>

          {/* Mutual Friends */}
          <View style={[styles.recommendationSection, { borderTopColor: colors.border }]}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={[styles.recommendationText, { color: colors.primaryText }]}>
                Recommended by {contractor.recommendedBy} mutual friends
              </Text>
            </View>
            
            <View style={styles.mutualFriendsContainer}>
              <View style={styles.mutualFriends}>
                {contractor.mutualFriends && contractor.mutualFriends.length > 0 && contractor.mutualFriends.map((friend: any, index: number) => (
                  <Image
                    key={friend.id}
                    source={{ uri: friend.avatar }}
                    style={[
                      styles.friendAvatar,
                      { marginLeft: index > 0 ? -10 : 0, zIndex: contractor.mutualFriends.length - index }
                    ]}
                  />
                ))}
              </View>
              
              <TouchableOpacity onPress={handleSeeAllRecommendations}>
                <Text style={[styles.seeAllLink, { color: colors.primary }]}>
                  See all recommendations →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Services Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
            Services
          </Text>
          <View style={styles.servicesGrid}>
            {contractor.services && contractor.services.slice(0, showAllServices ? undefined : 6).map((service: any, index: number) => (
              <View 
                key={service.id} 
                style={[styles.serviceChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.serviceText, { color: colors.primaryText }]}>
                  {service.name}
                </Text>
              </View>
            ))}
          </View>
          {contractor.services.length > 6 && (
            <TouchableOpacity onPress={() => setShowAllServices(!showAllServices)}>
              <Text style={[styles.showMoreText, { color: colors.primary }]}>
                {showAllServices ? 'Show less' : `Show all ${contractor.services.length} services`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Portfolio Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
            Recent Work
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.portfolioContainer}>
              {contractor.portfolio && contractor.portfolio.map((item: any) => (
                <TouchableOpacity key={item.id} style={styles.portfolioItem}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={[styles.portfolioImage, { backgroundColor: colors.surface }]} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Reviews Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
            What customers say
          </Text>
          {contractor.reviews && contractor.reviews.map((review: any) => (
            <View key={review.id} style={styles.reviewItem}>
              {renderReview({ item: review })}
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={[styles.bottomActions, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleStartConversation}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Start Conversation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.secondaryButton, { backgroundColor: colors.background, borderColor: colors.primary }]}
          onPress={handleQuickCall}
        >
          <Ionicons name="call-outline" size={20} color={colors.primary} />
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
            Quick Call
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileSection: {
    padding: 20,
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  contractorName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  metaInfo: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingSection: {
    marginBottom: 16,
  },
  ratingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 14,
  },
  recommendationSection: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mutualFriendsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mutualFriends: {
    flexDirection: 'row',
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  portfolioContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  portfolioItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  reviewTime: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContractorProfileScreen;
