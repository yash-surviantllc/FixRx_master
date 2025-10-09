import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

const SERVICE_CATEGORIES = {
  popular: [
    { id: 'plumbing', name: 'Plumbing', icon: '🔧', demand: 'High demand', color: '#3B82F6' },
    { id: 'electrical', name: 'Electrical', icon: '⚡', demand: 'High demand', color: '#F59E0B' },
    { id: 'hvac', name: 'HVAC', icon: '❄️', demand: 'Peak season: Nov-Mar', color: '#10B981' },
    { id: 'carpentry', name: 'Carpentry', icon: '🔨', demand: '⭐⭐⭐', color: '#8B5CF6' },
  ],
  homeMaintenance: [
    { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
    { id: 'handyman', name: 'Handyman Services', icon: '🔨' },
    { id: 'landscaping', name: 'Landscaping', icon: '🌿' },
    { id: 'houseCleaning', name: 'House Cleaning', icon: '🔵' },
  ],
  repairs: [
    { id: 'roofing', name: 'Roofing', icon: '💎' },
    { id: 'appliance', name: 'Appliance Repair', icon: '🟠' },
  ],
  installation: [
    { id: 'electrical', name: 'Electrical', icon: '⚡' },
    { id: 'hvac', name: 'HVAC', icon: '❄️' },
    { id: 'flooring', name: 'Flooring', icon: '▬' },
  ],
  remodeling: [
    { id: 'carpentry', name: 'Carpentry', icon: '🔨' },
    { id: 'painting', name: 'Painting', icon: '🔴' },
  ],
  emergency: [
    { id: 'locksmith', name: 'Locksmith', icon: '🔒' },
  ],
};

type ServiceSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VendorServiceSelection'>;

const VendorServiceSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ServiceSelectionScreenNavigationProp>();
  const { userProfile, setUserProfile } = useAppContext();
  const { theme, colors } = useTheme();
  const darkMode = theme === 'dark';
  
  const [selectedServices, setSelectedServices] = useState<string[]>(userProfile?.services || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllServices, setShowAllServices] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  // Map Popular chips to actual service IDs in our categories
  const handlePopularTagPress = (tag: string) => {
    const tagMapping: { [key: string]: string[] } = {
      Handyman: ['handyman'],
      Remodeling: ['carpentry', 'painting'],
      Repair: ['roofing', 'appliance'],
    };

    const serviceIdsToAdd = tagMapping[tag as keyof typeof tagMapping];
    if (!serviceIdsToAdd) return;

    setSelectedServices(prev => {
      const next = new Set(prev);
      serviceIdsToAdd.forEach(id => next.add(id));
      return Array.from(next);
    });
  };


  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Select Services', 'Please select at least one service you offer');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update user profile in context
      setUserProfile({
        ...userProfile,
        services: selectedServices,
      } as any);
      
      navigation.navigate('VendorPortfolioUpload');
    } catch (error) {
      console.error('Error saving services:', error);
      Alert.alert('Error', 'Failed to save services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPopularService = (service: any) => {
    const isSelected = selectedServices.includes(service.id);
    
    return (
      <TouchableOpacity
        key={service.id}
        style={[styles.popularServiceCard, isSelected && styles.popularServiceCardSelected]}
        onPress={() => toggleService(service.id)}
        activeOpacity={0.7}
      >
        <View style={styles.popularServiceHeader}>
          <Text style={styles.popularServiceIcon}>{service.icon}</Text>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
          </View>
        </View>
        <Text style={styles.popularServiceName}>{service.name}</Text>
        <Text style={[styles.popularServiceDemand, { color: service.color }]}>
          {service.demand}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryService = (service: any) => {
    const isSelected = selectedServices.includes(service.id);
    
    return (
      <TouchableOpacity
        key={service.id}
        style={styles.categoryServiceItem}
        onPress={() => toggleService(service.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryServiceIcon}>{service.icon}</Text>
        <Text style={styles.categoryServiceName}>{service.name}</Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }] 
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.stepInfo}>
              <Text style={styles.stepText}>Step 2 of 3</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '67%' }]} />
              </View>
              <Text style={styles.progressText}>67%</Text>
            </View>
          </View>

          <Text style={styles.title}>What services do you offer?</Text>
          <Text style={styles.subtitle}>Select all services you provide</Text>
          
          {/* Popular Services Grid */}
          <View style={styles.popularServicesGrid}>
            {SERVICE_CATEGORIES.popular.map(service => renderPopularService(service))}
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for more services..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          {/* Popular Tags */}
          <View style={styles.popularTags}>
            <Text style={styles.popularLabel}>Popular:</Text>
            {['Handyman', 'Remodeling', 'Repair'].map(tag => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                activeOpacity={0.7}
                onPress={() => handlePopularTagPress(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* View All Services Collapsible */}
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => setShowAllServices(!showAllServices)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View all services</Text>
            <MaterialIcons 
              name={showAllServices ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color="#3B82F6" 
            />
          </TouchableOpacity>
          
          {/* All Services Categories */}
          {showAllServices && (
            <View style={styles.allServicesContainer}>
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Home Maintenance</Text>
                {SERVICE_CATEGORIES.homeMaintenance.map(service => renderCategoryService(service))}
              </View>
              
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Repairs</Text>
                {SERVICE_CATEGORIES.repairs.map(service => renderCategoryService(service))}
              </View>
              
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Installation</Text>
                {SERVICE_CATEGORIES.installation.map(service => renderCategoryService(service))}
              </View>
              
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Remodeling</Text>
                {SERVICE_CATEGORIES.remodeling.map(service => renderCategoryService(service))}
              </View>
              
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Emergency</Text>
                {SERVICE_CATEGORIES.emergency.map(service => renderCategoryService(service))}
              </View>
            </View>
          )}
          
          {/* Continue Button */}
          <TouchableOpacity 
            style={[
              styles.button, 
              selectedServices.length === 0 && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={selectedServices.length === 0 || isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Saving...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  stepInfo: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  popularServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  popularServiceCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  popularServiceCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  popularServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  popularServiceIcon: {
    fontSize: 32,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  popularServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  popularServiceDemand: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  popularTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  popularLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  allServicesContainer: {
    marginBottom: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryServiceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryServiceName: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VendorServiceSelectionScreen;
