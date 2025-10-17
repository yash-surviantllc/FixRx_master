import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { useAppContext } from '../../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';

const { width } = Dimensions.get('window');

type UserTypeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserType'>;

const UserTypeSelectionScreen: React.FC = () => {
  const navigation = useNavigation<UserTypeScreenNavigationProp>();
  const { setUserType } = useAppContext();
  const [loading, setLoading] = useState(false);

  const handleUserTypeSelect = async (type: 'consumer' | 'vendor') => {
    console.log('User selected role:', type);
    setLoading(true);
    
    try {
      // Save to context
      setUserType(type);
      
      // Save to backend
      console.log('Saving user type to backend:', type.toUpperCase());
      await authService.updateProfile({ 
        userType: type.toUpperCase() as 'CONSUMER' | 'VENDOR'
      });
      console.log('✅ User type saved to backend successfully');
      
      // Navigate to profile setup
      if (type === 'consumer') {
        navigation.navigate('ConsumerProfile');
      } else {
        navigation.navigate('VendorProfileSetup');
      }
    } catch (error) {
      console.error('❌ Failed to save user type:', error);
      Alert.alert(
        'Error',
        'Failed to save your selection. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Pagination dots */}
        <View style={styles.paginationContainer}>
          <View style={[styles.paginationDot, styles.paginationDotActive]} />
          <View style={[styles.paginationDot, styles.paginationDotActive]} />
          <View style={[styles.paginationDot, styles.paginationDotActive]} />
          <View style={styles.paginationDot} />
        </View>
        
        {/* Title */}
        <Text style={styles.title}>How will you use FixRx?</Text>
        <Text style={styles.subtitle}>Choose the option that best describes you</Text>
        
        {/* Option Cards */}
        <View style={styles.optionsContainer}>
          {/* I need services card */}
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => handleUserTypeSelect('consumer')}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="home-outline" size={32} color="#3B82F6" />
            </View>
            <Text style={styles.optionTitle}>I need services</Text>
            <Text style={styles.optionDescription}>
              Find trusted contractors through friends
            </Text>
          </TouchableOpacity>
          
          {/* I provide services card */}
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => handleUserTypeSelect('vendor')}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="hammer-outline" size={32} color="#F97316" />
            </View>
            <Text style={styles.optionTitle}>I provide services</Text>
            <Text style={styles.optionDescription}>
              Connect with homeowners who need help
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    backgroundColor: '#3B82F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 50,
  },
  optionsContainer: {
    flex: 1,
    gap: 20,
  },
  optionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default UserTypeSelectionScreen;
