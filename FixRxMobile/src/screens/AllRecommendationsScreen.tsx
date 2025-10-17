import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type AllRecommendationsNavigationProp = StackNavigationProp<RootStackParamList, 'AllRecommendations'>;

// Mock data for recommended contractors
const RECOMMENDED_CONTRACTORS = [
  {
    id: '1',
    name: 'Elite Plumbing',
    category: 'Plumbing',
    rating: 4.8,
    reviews: 124,
    price: '$$',
    distance: '2.3 mi',
    image: 'https://example.com/plumber.jpg',
    services: ['Leak Repair', 'Pipe Installation', 'Drain Cleaning'],
    description: 'Professional plumbing services with 10+ years of experience. Available 24/7 for emergencies.'
  },
  {
    id: '2',
    name: 'Bright Electric',
    category: 'Electrical',
    rating: 4.9,
    reviews: 89,
    price: '$$$',
    distance: '1.7 mi',
    image: 'https://example.com/electrician.jpg',
    services: ['Wiring', 'Panel Upgrades', 'Lighting Installation'],
    description: 'Licensed electricians providing quality electrical services for homes and businesses.'
  },
  {
    id: '3',
    name: 'Cool Breeze HVAC',
    category: 'HVAC',
    rating: 4.7,
    reviews: 156,
    price: '$$',
    distance: '3.1 mi',
    image: 'https://example.com/hvac.jpg',
    services: ['AC Repair', 'Heating Installation', 'Maintenance'],
    description: 'Expert HVAC services to keep your home comfortable year-round.'
  },
  {
    id: '4',
    name: 'Pro Painters',
    category: 'Painting',
    rating: 4.6,
    reviews: 72,
    price: '$$',
    distance: '4.2 mi',
    image: 'https://example.com/painter.jpg',
    services: ['Interior Painting', 'Exterior Painting', 'Wallpaper Removal'],
    description: 'Transforming homes with quality painting services and attention to detail.'
  },
  {
    id: '5',
    name: 'Green Thumb Landscaping',
    category: 'Landscaping',
    rating: 4.5,
    reviews: 63,
    price: '$$$',
    distance: '2.8 mi',
    image: 'https://example.com/landscaping.jpg',
    services: ['Lawn Care', 'Garden Design', 'Irrigation'],
    description: 'Creating beautiful outdoor spaces that enhance your property.'
  },
];

// Categories for filtering
const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'hvac', name: 'HVAC' },
  { id: 'painting', name: 'Painting' },
  { id: 'landscaping', name: 'Landscaping' },
  { id: 'cleaning', name: 'Cleaning' },
  { id: 'handyman', name: 'Handyman' },
];

const AllRecommendationsScreen: React.FC = () => {
  const navigation = useNavigation<AllRecommendationsNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter contractors based on search and filters
  const filteredContractors = RECOMMENDED_CONTRACTORS.filter(contractor => {
    // Filter by search query
    const matchesSearch = contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractor.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = selectedCategory === 'all' || 
      contractor.category.toLowerCase() === selectedCategory.toLowerCase();
    
    // Filter by price range
    const matchesPrice = !priceRange || 
      (priceRange === '$' && contractor.price === '$') ||
      (priceRange === '$$' && contractor.price === '$$') ||
      (priceRange === '$$$' && contractor.price === '$$$');
    
    // Filter by rating
    const matchesRating = !ratingFilter || contractor.rating >= ratingFilter;
    
    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  // Render each contractor item
  const renderContractorItem = ({ item }: { item: typeof RECOMMENDED_CONTRACTORS[0] }) => (
    <TouchableOpacity 
      style={styles.contractorCard}
      onPress={() => {
        // Navigate to contractor detail screen
        navigation.navigate('ServiceRequestDetail', { requestId: item.id });
      }}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.contractorImage}
        defaultSource={{ uri: 'https://via.placeholder.com/100' }}
      />
      <View style={styles.contractorInfo}>
        <View style={styles.contractorHeader}>
          <Text style={styles.contractorName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
        </View>
        
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>★ {item.rating}</Text>
          <Text style={styles.reviewsText}>({item.reviews} reviews)</Text>
          <Text style={styles.distanceText}>• {item.distance}</Text>
        </View>
        
        <Text style={styles.contractorCategory}>{item.category}</Text>
        
        <View style={styles.servicesContainer}>
          {item.services.slice(0, 3).map((service, index) => (
            <View key={index} style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>{service}</Text>
            </View>
          ))}
          {item.services.length > 3 && (
            <View style={styles.moreTag}>
              <Text style={styles.moreTagText}>+{item.services.length - 3} more</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.contractorDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => {
              // Navigate to chat
              navigation.navigate('Messaging', { 
                conversationId: `convo_${item.id}`,
                userName: item.name,
                userImage: item.image || 'https://via.placeholder.com/50',
                isOnline: true, // Default to online for contractors
              });
            }}
          >
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => {
              // Navigate to booking
              // navigation.navigate('BookService', { contractorId: item.id });
            }}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render category filter chips
  const renderCategoryChip = (category: { id: string; name: string }) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryChip,
        selectedCategory === category.id && styles.categoryChipSelected,
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === category.id && styles.categoryChipTextSelected,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for services or contractors..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>
      
      {/* Category Chips */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map(renderCategoryChip)}
        </ScrollView>
      </View>
      
      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filtersTitle}>Filters</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              {['$', '$$', '$$$'].map(price => (
                <TouchableOpacity
                  key={price}
                  style={[
                    styles.priceButton,
                    priceRange === price && styles.priceButtonSelected,
                  ]}
                  onPress={() => setPriceRange(priceRange === price ? null : price)}
                >
                  <Text 
                    style={[
                      styles.priceButtonText,
                      priceRange === price && styles.priceButtonTextSelected,
                    ]}
                  >
                    {price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Minimum Rating</Text>
            <View style={styles.ratingContainer}>
              {[4, 3, 2].map(rating => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    ratingFilter === rating && styles.ratingButtonSelected,
                  ]}
                  onPress={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                >
                  <Text 
                    style={[
                      styles.ratingButtonText,
                      ratingFilter === rating && styles.ratingButtonTextSelected,
                    ]}
                  >
                    {rating}+ ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                setPriceRange(null);
                setRatingFilter(null);
              }}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredContractors.length} {filteredContractors.length === 1 ? 'result' : 'results'} found
        </Text>
        <TouchableOpacity>
          <Text style={styles.sortText}>Sort by: Recommended</Text>
        </TouchableOpacity>
      </View>
      
      {/* Contractors List */}
      <FlatList
        data={filteredContractors}
        renderItem={renderContractorItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No contractors found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212529',
  },
  filterButton: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F1F3F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  categoryChipSelected: {
    backgroundColor: '#E7F1FF',
    borderColor: '#0D6EFD',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#495057',
  },
  categoryChipTextSelected: {
    color: '#0D6EFD',
    fontWeight: '500',
  },
  filtersPanel: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  priceRangeContainer: {
    flexDirection: 'row',
  },
  priceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginRight: 8,
  },
  priceButtonSelected: {
    backgroundColor: '#E7F1FF',
    borderColor: '#0D6EFD',
  },
  priceButtonText: {
    fontSize: 14,
    color: '#495057',
  },
  priceButtonTextSelected: {
    color: '#0D6EFD',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginRight: 8,
  },
  ratingButtonSelected: {
    backgroundColor: '#E7F1FF',
    borderColor: '#0D6EFD',
  },
  ratingButtonText: {
    fontSize: 14,
    color: '#495057',
  },
  ratingButtonTextSelected: {
    color: '#0D6EFD',
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resetButton: {
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  applyButton: {
    padding: 12,
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#0D6EFD',
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  resultsText: {
    fontSize: 14,
    color: '#6C757D',
  },
  sortText: {
    fontSize: 14,
    color: '#0D6EFD',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  contractorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  contractorImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F1F3F5',
  },
  contractorInfo: {
    padding: 16,
  },
  contractorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contractorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  priceBadge: {
    backgroundColor: '#E7F1FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceText: {
    fontSize: 12,
    color: '#0D6EFD',
    fontWeight: '600',
  },
  ratingText: {
    fontSize: 14,
    color: '#FFC107',
    fontWeight: 'bold',
    marginRight: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#6C757D',
    marginRight: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#6C757D',
  },
  contractorCategory: {
    fontSize: 14,
    color: '#495057',
    marginTop: 4,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 12,
  },
  serviceTag: {
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  serviceTagText: {
    fontSize: 12,
    color: '#495057',
  },
  moreTag: {
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  moreTagText: {
    fontSize: 12,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  contractorDescription: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0D6EFD',
    alignItems: 'center',
    marginRight: 8,
  },
  messageButtonText: {
    color: '#0D6EFD',
    fontSize: 14,
    fontWeight: '500',
  },
  bookButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#0D6EFD',
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
});

export default AllRecommendationsScreen;
