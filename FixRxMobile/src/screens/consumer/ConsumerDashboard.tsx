import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  SafeAreaView,
  StatusBar,
  Switch
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';

type ConsumerDashboardNavigationProp = NavigationProp<RootStackParamList>;

const ConsumerDashboard: React.FC = () => {
  const navigation = useNavigation<ConsumerDashboardNavigationProp>();
  const { userProfile } = useAppContext();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Available now');

  const filters = ['Available now', 'Highly rated', 'Close by'];

  // Mock data for recent service
  const recentService = {
    type: 'Plumbing service',
    contractor: 'Mike Rodriguez',
    status: 'complete',
    rating: 0, // Not rated yet
  };

  // Mock data for recommended contractors
  // Filter recommended contractors based on search
  const allRecommendedContractors = [
    {
      id: '1',
      name: 'Mike Rodriguez',
      service: 'Plumbing',
      rating: 4.9,
      recommendedBy: 3,
      available: true,
      image: 'https://i.pravatar.cc/100?img=8',
    },
    {
      id: '2',
      name: 'Jennifer Chen',
      service: 'Electrical',
      rating: 4.8,
      recommendedBy: 7,
      available: true,
      image: 'https://i.pravatar.cc/100?img=5',
    },
    {
      id: '3',
      name: 'David Kim',
      service: 'Handyman',
      rating: 4.7,
      recommendedBy: 2,
      available: true,
      image: 'https://i.pravatar.cc/100?img=12',
    },
    {
      id: '4',
      name: 'Carlos Martinez',
      service: 'Construction',
      rating: 4.9,
      recommendedBy: 5,
      available: false,
      image: 'https://i.pravatar.cc/100?img=15',
    },
  ];

  const recommendedContractors = allRecommendedContractors.filter(contractor => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = contractor.name.toLowerCase().includes(query) ||
                           contractor.service.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (selectedFilter === 'Available now') {
      return contractor.available;
    } else if (selectedFilter === 'Highly rated') {
      return contractor.rating >= 4.8;
    } else if (selectedFilter === 'Close by') {
      // For "Close by", we could add distance logic later
      // For now, just return true to show all
      return true;
    }
    
    return true;
  });

  const getRecommendationText = (count: number) => {
    return `Recommended by ${count} mutual friend${count !== 1 ? 's' : ''}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.primaryText }]}>Hello {userProfile?.firstName || 'John'}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-sharp" size={14} color={colors.secondaryText} />
              <Text style={[styles.location, { color: colors.secondaryText }]}>San Francisco</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.darkModeToggle}>
              <Ionicons 
                name={isDarkMode ? "moon" : "sunny"} 
                size={20} 
                color={isDarkMode ? "#FFC107" : "#F59E0B"} 
              />
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#D1D5DB', true: '#4B5563' }}
                thumbColor={isDarkMode ? '#FFC107' : '#F59E0B'}
                style={styles.switch}
              />
            </View>
            <Text style={[styles.weather, { color: colors.secondaryText }]}>Cloudy, 72°F</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications' as any)}
          >
                <Ionicons name="notifications-outline" size={24} color={colors.primaryText} />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>1</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileButton}>
                <Image 
                  source={{ uri: 'https://i.pravatar.cc/100?img=12' }} 
                  style={styles.profileImage}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 12 }}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for services or contractors"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              // Navigate to ContactSelection screen in the root stack
              navigation.navigate('ContactSelection', { inviteType: 'contractor' });
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Contractors</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => {
              // Navigate to ContactSelection screen in the root stack
              navigation.navigate('ContactSelection', { inviteType: 'friend' });
            }}
          >
            <Ionicons name="people-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Invite Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                selectedFilter === filter && styles.filterPillActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent Service Complete */}
        <View style={[styles.recentServiceCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.recentServiceTitle, { color: colors.primaryText }]}>Recent Service Complete</Text>
          <Text style={[styles.recentServiceDescription, { color: colors.secondaryText }]}>
            {recentService.type} with {recentService.contractor}
          </Text>
          <View style={styles.ratingSection}>
            <TouchableOpacity 
              style={styles.rateServiceButton}
              onPress={() => navigation.navigate('Rating' as any)}
            >
              <Text style={styles.rateServiceText}>Rate Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recommended Contractors */}
        <View style={styles.recommendedSection}>
          <View style={styles.recommendedHeader}>
            <Text style={[styles.recommendedTitle, { color: colors.primaryText }]}>Recommended Contractors</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Contractors' as any)}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See all →</Text>
            </TouchableOpacity>
          </View>
          
          {recommendedContractors.map((contractor) => (
            <TouchableOpacity 
              key={contractor.id} 
              style={[styles.contractorItem, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('ContractorProfile' as any, { contractor })}
            >
              <View style={styles.contractorLeft}>
                <View style={styles.contractorImageContainer}>
                  <Image 
                    source={{ uri: contractor.image }} 
                    style={styles.contractorImage}
                  />
                </View>
                <View style={styles.contractorInfo}>
                  <Text style={[styles.contractorName, { color: colors.primaryText }]}>{contractor.name}</Text>
                  <Text style={[styles.contractorService, { color: colors.secondaryText }]}>{contractor.service}</Text>
                  <View style={styles.contractorMeta}>
                    <Ionicons name="star" size={14} color="#FFC107" />
                    <Text style={[styles.contractorRating, { color: colors.primaryText }]}>{contractor.rating}</Text>
                    <Text style={[
                      styles.availabilityText,
                      { color: contractor.available ? colors.success : colors.secondaryText }
                    ]}>
                      {contractor.available ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                  <View style={styles.recommendationBadge}>
                    <Ionicons name="people" size={14} color="#3B82F6" />
                    <Text style={[styles.recommendationText, { color: colors.secondaryText }]}>
                      {getRecommendationText(contractor.recommendedBy)}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.checkButton}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  darkModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  switch: {
    marginLeft: 8,
    transform: [{ scale: 0.8 }],
  },
  weather: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    marginRight: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  addContractorButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addContractorText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  inviteFriendsButton: {
    flex: 1,
    backgroundColor: '#A855F7',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteFriendsText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#1F2937',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  recentServiceCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  recentServiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  recentServiceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  ratingSection: {
    alignItems: 'flex-start',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  star: {
    marginRight: 4,
  },
  rateServiceButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rateServiceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  recommendedSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  contractorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contractorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contractorImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  contractorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  ratingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  ratingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contractorInfo: {
    flex: 1,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  contractorService: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  contractorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contractorRating: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  availabilityText: {
    fontSize: 13,
    marginLeft: 8,
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  recommendationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkButton: {
    padding: 8,
  },
});

export default ConsumerDashboard;
