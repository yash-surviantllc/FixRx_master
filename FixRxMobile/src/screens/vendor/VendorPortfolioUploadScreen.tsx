import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  FlatList,
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

type PortfolioUploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VendorPortfolioUpload'>;

const VendorPortfolioUploadScreen: React.FC = () => {
  const navigation = useNavigation<PortfolioUploadScreenNavigationProp>();
  const { userProfile, setUserProfile, setUserType } = useAppContext();
  const { theme, colors } = useTheme();
  const darkMode = theme === 'dark';
  
  const [portfolioItems, setPortfolioItems] = useState<Array<{ id: string; uri: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showTips, setShowTips] = useState(false);

  
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const newItem = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
        };
        setPortfolioItems(prev => [...prev, newItem]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (id: string) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (portfolioItems.length === 0) {
      Alert.alert('Portfolio Required', 'Please add at least one image to your portfolio');
      return;
    }
    
    setIsUploading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Ensure userType is set before navigation
      setUserType('vendor');

      // Update user profile in context
      setUserProfile({
        ...userProfile,
        portfolio: portfolioItems,
        onboardingComplete: true,
      } as any);
      // Reset navigation stack to MainTabs to avoid back-navigation to onboarding
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.error('Error uploading portfolio:', error);
      Alert.alert('Error', 'Failed to upload portfolio. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderPortfolioItem = ({ item }: { item: { id: string; uri: string } }) => (
    <View style={styles.portfolioItem}>
      <Image 
        source={{ uri: item.uri }} 
        style={styles.portfolioImage}
        resizeMode="cover"
      />
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeImage(item.id)}
      >
        <MaterialIcons name="close" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.stepInfo}>
          <Text style={[styles.stepText, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>Step 3 of 3</Text>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.secondary }]}>
            <View style={[styles.progressBar, { width: '100%', backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.text }]}>100%</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
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
          <Text style={[styles.title, { color: colors.text }]}>Showcase your work</Text>
          <Text style={[styles.subtitle, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>Add photos of your best projects</Text>
          <Text style={[styles.benefitText, { color: colors.primary }]}>
            <MaterialIcons name="star" size={14} color={colors.primary} /> Contractors with portfolios get 5x more contacts
          </Text>
          
          <View style={styles.portfolioContainer}>
            
            {portfolioItems.length > 0 ? (
              <FlatList
                data={portfolioItems}
                renderItem={renderPortfolioItem}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={styles.portfolioGrid}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="photo-library" size={48} color={darkMode ? '#6B7280' : '#D1D5DB'} />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>No photos added yet</Text>
                <Text style={[styles.emptyStateSubtext, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>Add photos to showcase your work</Text>
              </View>
            )}
            
            {portfolioItems.length < 10 && (
              <TouchableOpacity 
                style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={pickImage}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <MaterialIcons name="cloud-upload" size={48} color={colors.primary} />
                <Text style={[styles.uploadTitle, { color: colors.text }]}>Add your best project photo</Text>
                <Text style={[styles.uploadSubtext, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>Tap to take photo or choose from gallery</Text>
                <Text style={[styles.uploadFormat, { color: darkMode ? '#6B7280' : '#9CA3AF' }]}>JPG, PNG up to 10MB each</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Tips Section */}
          <TouchableOpacity 
            style={styles.tipsButton}
            onPress={() => setShowTips(!showTips)}
            activeOpacity={0.7}
          >
            <View style={styles.tipsHeader}>
              <MaterialIcons name="lightbulb-outline" size={20} color="#3B82F6" />
              <Text style={styles.tipsButtonText}>Tips for great photos</Text>
            </View>
            <MaterialIcons 
              name={showTips ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color="#3B82F6" 
            />
          </TouchableOpacity>
          
          {showTips && (
            <View style={styles.tipsContainer}>
              <View style={styles.tipsSection}>
                <View style={styles.tipsSectionHeader}>
                  <MaterialIcons name="photo-camera" size={20} color="#1F2937" />
                  <Text style={styles.tipsSectionTitle}>Photography Guidelines</Text>
                </View>
                <Text style={styles.tipText}>• Use natural lighting when possible - avoid harsh shadows</Text>
                <Text style={styles.tipText}>• Take photos from multiple angles to show the full scope of work</Text>
                <Text style={styles.tipText}>• Include before/after shots when available</Text>
                <Text style={styles.tipText}>• Keep photos clean and professional looking</Text>
              </View>
              
              <View style={styles.tipsSection}>
                <View style={styles.tipsSectionHeader}>
                  <MaterialIcons name="lock" size={20} color="#1F2937" />
                  <Text style={styles.tipsSectionTitle}>Privacy & Permission</Text>
                </View>
                <Text style={styles.tipText}>• Always get client permission before taking photos</Text>
                <Text style={styles.tipText}>• Blur or crop out faces and personal information</Text>
                <Text style={styles.tipText}>• Avoid showing house numbers or identifying features</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
      
      {/* Fixed Bottom Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.completeButton,
            { backgroundColor: colors.primary },
            (portfolioItems.length === 0 || isUploading) && { backgroundColor: darkMode ? '#374151' : '#9CA3AF', opacity: 0.5 }
          ]}
          onPress={handleSubmit}
          disabled={portfolioItems.length === 0 || isUploading}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.completeButtonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.skipButton, { backgroundColor: colors.secondary }]}
          onPress={() => {
            // Ensure userType is set before navigation
            setUserType('vendor');
            setUserProfile({
              ...userProfile,
              portfolio: [],
            } as any);
            (navigation as any).reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          }}
          disabled={isUploading}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipButtonText, { color: darkMode ? '#D1D5DB' : '#6B7280' }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 180,
  },
  content: {
    flex: 1,
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
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 24,
  },
  portfolioContainer: {
    flex: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  portfolioGrid: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  portfolioItem: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
  },
  uploadTitle: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  uploadSubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  uploadFormat: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  tipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipsButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 24,
  },
  tipsSection: {
    marginBottom: 16,
  },
  tipsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    paddingBottom: 34,
  },
  completeButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default VendorPortfolioUploadScreen;
