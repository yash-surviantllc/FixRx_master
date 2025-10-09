import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Animated,
  Alert,
  Image,
  Modal,
  FlatList
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

type VendorProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VendorProfileSetup'>;

// US Metropolitan Areas
const US_METRO_AREAS = [
  'Atlanta, GA',
  'Austin, TX',
  'Boston, MA',
  'Charlotte, NC',
  'Chicago, IL',
  'Dallas, TX',
  'Denver, CO',
  'Detroit, MI',
  'Houston, TX',
  'Las Vegas, NV',
  'Los Angeles, CA',
  'Miami, FL',
  'Minneapolis, MN',
  'New York, NY',
  'Orlando, FL',
  'Philadelphia, PA',
  'Phoenix, AZ',
  'Portland, OR',
  'San Antonio, TX',
  'San Diego, CA',
  'San Francisco, CA',
  'San Jose, CA',
  'Seattle, WA',
  'Tampa, FL',
  'Washington, DC',
];

const VendorProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<VendorProfileScreenNavigationProp>();
  const route = useRoute();
  const params = route.params as { email?: string } | undefined;
  const { userProfile, setUserProfile } = useAppContext();
  const { theme, colors } = useTheme();
  const darkMode = theme === 'dark';
  
  const [currentStep, setCurrentStep] = useState(1); // 1 = Profile & Business & Credentials, 2 = Services, 3 = Portfolio
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: params?.email || userProfile?.email || '',
    businessName: '',
    professionalLicense: '',
    serviceArea: '',
    serviceRadius: 15,
    yearsExperience: 5,
    hasLiabilityInsurance: false,
    isBonded: false,
    useCurrentLocation: false,
  });

  
  const [showMetroDropdown, setShowMetroDropdown] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    // Entry animations with native driver (now properly configured)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true, // opacity is supported by native driver
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true, // transform is supported by native driver
      }),
    ]).start();
  }, [fadeAnim, slideUpAnim]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Phone number validation and formatting
    if (field === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [field]: digitsOnly
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      // Step 1: Personal details + service area required (credentials optional)
      if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.serviceArea) {
        return false;
      }
      
      // Phone must be 10 digits
      if (formData.phone.length !== 10) {
        return false;
      }
      
      // Email must be valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return false;
      }
      
      return true;
    } else {
      // Step 2 & 3: No required fields
      return true;
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      // Save profile data and go to service selection
      handleSubmit();
    } else if (currentStep === 2) {
      // Go to portfolio upload
      navigation.navigate('VendorPortfolioUpload');
    } else {
      // Final step - go to main tabs
      navigation.navigate('MainTabs');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      setUserProfile({
        ...userProfile,
        ...formData,
        userType: 'vendor' as const,
        profileImage: profileImage || undefined,
      } as any);
      
      navigation.navigate('VendorServiceSelection');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLater = () => {
    Alert.alert(
      'Save Progress',
      'Your progress will be saved. You can continue later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: () => {
            // Save to context or local storage
            navigation.goBack();
          }
        },
      ]
    );
  };

  const renderStepIndicator = () => {
    const progressPercentage = currentStep === 1 ? 33 : currentStep === 2 ? 67 : 100;
    
    return (
      <View style={styles.stepIndicator}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.stepInfo}>
          <Text style={styles.stepText}>Step {currentStep} of 3</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPercentage}%</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderStepIndicator()}
      
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
          <Text style={styles.title}>
            {currentStep === 1 && 'Tell us about your business'}
            {currentStep === 2 && 'What services do you offer?'}
            {currentStep === 3 && 'Showcase your work'}
          </Text>
          <Text style={styles.subtitle}>
            {currentStep === 1 && 'This helps customers find and trust you'}
            {currentStep === 2 && 'Select the services you provide'}
            {currentStep === 3 && 'Upload photos of your best work'}
          </Text>
          
          <View style={styles.form}>
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <>
                <Text style={styles.sectionTitle}>Personal Details</Text>
                
                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      value={formData.firstName}
                      onChangeText={(text) => handleInputChange('firstName', text)}
                      placeholder="John"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      value={formData.lastName}
                      onChangeText={(text) => handleInputChange('lastName', text)}
                      placeholder="Smith"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={formatPhoneNumber(formData.phone)}
                    onChangeText={(text) => handleInputChange('phone', text)}
                    placeholder="(231) 312-3123"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    maxLength={14}
                  />
                  <Text style={styles.helperText}>We'll use this to verify your identity and for important updates</Text>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    placeholder="john@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                {/* Business Information - now in Step 1 */}
                <Text style={styles.sectionTitle}>Business Information</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Business or Trading Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.businessName}
                    onChangeText={(text) => handleInputChange('businessName', text)}
                    placeholder="e.g., Rodriguez Plumbing Services"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.linkText}>Leave blank if you work under your personal name</Text>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Professional License</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.professionalLicense}
                    onChangeText={(text) => handleInputChange('professionalLicense', text)}
                    placeholder="License number"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.linkText}>Licensed contractors receive 3x more contacts</Text>
                </View>
                
                <Text style={styles.sectionTitle}>Service Area</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Metropolitan Area <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowMetroDropdown(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownText, !formData.serviceArea && styles.placeholderText]}>
                      {formData.serviceArea || 'Select your metro area'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Service Radius: {formData.serviceRadius} miles</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={5}
                    maximumValue={50}
                    step={5}
                    value={formData.serviceRadius}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, serviceRadius: value }))}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor="#3B82F6"
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>5 miles</Text>
                    <Text style={styles.sliderLabel}>50 miles</Text>
                  </View>
                </View>
                
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setFormData(prev => ({ ...prev, useCurrentLocation: !prev.useCurrentLocation }))}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkboxBox, formData.useCurrentLocation && styles.checkboxChecked]}>
                      {formData.useCurrentLocation && (
                        <MaterialIcons name="check" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <MaterialIcons name="location-on" size={20} color="#6B7280" style={styles.locationIcon} />
                  <Text style={styles.checkboxLabel}>Use current location</Text>
                </View>
                
                {/* Professional Credentials - now in Step 1 */}
                <Text style={styles.sectionTitle}>Professional Credentials (Optional)</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Years of Experience: {formData.yearsExperience}+ years</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={20}
                    step={1}
                    value={formData.yearsExperience}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, yearsExperience: value }))}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor="#3B82F6"
                  />
                </View>
                
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>I carry liability insurance</Text>
                  <TouchableOpacity
                    style={[styles.toggle, formData.hasLiabilityInsurance && styles.toggleActive]}
                    onPress={() => setFormData(prev => ({ ...prev, hasLiabilityInsurance: !prev.hasLiabilityInsurance }))}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.toggleThumb, formData.hasLiabilityInsurance && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>I am bonded</Text>
                  <TouchableOpacity
                    style={[styles.toggle, formData.isBonded && styles.toggleActive]}
                    onPress={() => setFormData(prev => ({ ...prev, isBonded: !prev.isBonded }))}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.toggleThumb, formData.isBonded && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Step 2: Service Selection - handled by VendorServiceSelection screen */}
            {currentStep === 2 && (
              <>
                <Text style={styles.sectionTitle}>This step is handled in the next screen</Text>
                <Text style={styles.helperText}>Click Continue to select your services</Text>
              </>
            )}
            
            {/* Step 3: Portfolio - handled by VendorPortfolioUpload screen */}
            {currentStep === 3 && (
              <>
                <Text style={styles.sectionTitle}>This step is handled in the next screen</Text>
                <Text style={styles.helperText}>Click Continue to upload your portfolio</Text>
              </>
            )}
            
            <TouchableOpacity 
              style={[
                styles.continueButton,
                !isStepValid() && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              disabled={isLoading || !isStepValid()}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? 'Saving...' : currentStep === 3 ? 'Continue' : 'Continue'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveLater}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>Save & Continue Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Metro Area Dropdown Modal */}
      <Modal
        visible={showMetroDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMetroDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Metropolitan Area</Text>
              <TouchableOpacity onPress={() => setShowMetroDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={US_METRO_AREAS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, serviceArea: item }));
                    setShowMetroDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.serviceArea === item && styles.modalItemTextSelected
                  ]}>
                    {item}
                  </Text>
                  {formData.serviceArea === item && (
                    <MaterialIcons name="check" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
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
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
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
    marginBottom: 32,
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  linkText: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 6,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 14,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  locationIcon: {
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#374151',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalItemTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default VendorProfileSetupScreen;
