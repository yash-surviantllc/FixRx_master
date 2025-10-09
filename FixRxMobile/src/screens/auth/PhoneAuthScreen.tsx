import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import CountryCodeDropdown from '../../components/CountryCodeDropdown';

type PhoneAuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhoneAuth'>;

const PhoneAuthScreen = () => {
  const [countryCode, setCountryCode] = useState('+1');
  const [countryFlag, setCountryFlag] = useState('🇺🇸');
  const [countryName, setCountryName] = useState('United States');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirm, setConfirm] = useState<any>(null);
  const navigation = useNavigation<PhoneAuthScreenNavigationProp>();

  const handleCountrySelect = (code: string, flag: string, country: string) => {
    setCountryCode(code);
    setCountryFlag(flag);
    setCountryName(country);
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    
    try {
      // TODO: Implement phone number verification logic here
      // Example with Firebase Auth:
      // const confirmation = await auth().signInWithPhoneNumber(fullPhoneNumber);
      // setConfirm(confirmation);
      Alert.alert('Success', `Verification code sent to ${fullPhoneNumber}`);
      setConfirm(true); // Temporary for demo
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send verification code');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      // TODO: Implement verification code confirmation
      // Example with Firebase Auth:
      // await confirm.confirm(verificationCode);
      // User is now authenticated
      navigation.navigate('UserType');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Invalid verification code');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Phone Verification</Text>
      
      {!confirm ? (
        <>
          <Text style={styles.subtitle}>Enter your phone number to receive a verification code</Text>
          
          <View style={styles.phoneInputContainer}>
            {/* Country Code Dropdown */}
            <CountryCodeDropdown
              value={countryCode}
              flag={countryFlag}
              onSelect={handleCountrySelect}
            />

            {/* Phone Number Input */}
            <TextInput
              style={styles.phoneInput}
              placeholder="555 123 4567"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSendCode}>
            <Text style={styles.buttonText}>Send Verification Code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Enter the verification code sent to {countryCode} {phoneNumber}
          </Text>
          <TextInput
            style={styles.verificationInput}
            placeholder="123456"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
            <Text style={styles.buttonText}>Verify Code</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resendButton}
            onPress={handleSendCode}
          >
            <Text style={styles.resendText}>Resend Code</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  verificationInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 18,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  resendText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PhoneAuthScreen;
