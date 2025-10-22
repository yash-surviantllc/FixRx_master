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
  Alert,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { useAppContext } from '../../context/AppContext';
import { authService } from '../../services/authService';
import MetroAreaDropdown from '../../components/MetroAreaDropdown';

type ConsumerProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ConsumerProfile'>;

const ConsumerProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<ConsumerProfileScreenNavigationProp>();
  const { userProfile, setUserProfile } = useAppContext();
  
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    phone: userProfile?.phone || '',
    metroArea: userProfile?.metroArea || '',
  });
  
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

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 10) {
        let formatted = digitsOnly;
        if (digitsOnly.length > 3 && digitsOnly.length <= 6) {
          formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
        } else if (digitsOnly.length > 6) {
          formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
        }
        setFormData(prev => ({
          ...prev,
          [field]: formatted
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName) {
      Alert.alert('Required Field', 'Please enter your first name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Clean phone number (remove formatting)
      const cleanPhone = formData.phone.replace(/\D/g, '');
      
      // Update user profile in context
      setUserProfile({
        ...userProfile,
        ...formData,
        userType: 'consumer' as const,
      } as any);
      
      // Save to backend
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName || '',
        phone: cleanPhone || null,
        metroArea: formData.metroArea || null,
        profileCompleted: true
      };
      
      console.log('\n\n🔵🔵🔵 CONSUMER PROFILE SETUP - SAVING DATA 🔵🔵🔵');
      console.log('========================================');
      console.log('📝 FORM DATA:');
      console.log('  First Name:', formData.firstName);
      console.log('  Last Name:', formData.lastName);
      console.log('  Phone (raw):', formData.phone);
      console.log('  Phone (clean):', cleanPhone);
      console.log('  Metro Area:', formData.metroArea);
      console.log('========================================');
      console.log('📤 SENDING TO BACKEND:');
      console.log(JSON.stringify(profileData, null, 2));
      console.log('========================================\n');
      
      const response = await authService.updateProfile(profileData);
      
      console.log('\n========================================');
      console.log('📥 BACKEND RESPONSE:');
      console.log(JSON.stringify(response, null, 2));
      console.log('========================================');
      console.log('✅ Profile saved to backend successfully\n\n');
      
      // Navigate to the main app
      navigation.navigate('MainTabs');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
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
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
          
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                  placeholder="John"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                  placeholder="Doe"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="(123) 456-7890"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
            
            <MetroAreaDropdown
              value={formData.metroArea}
              onSelect={(value) => handleInputChange('metroArea', value)}
              label="Metro Area"
              placeholder="Select your metropolitan area"
            />
            
            <TouchableOpacity 
              style={[styles.button, (!formData.firstName || !formData.lastName) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!formData.firstName || !formData.lastName || isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Saving...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 40,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConsumerProfileSetupScreen;
