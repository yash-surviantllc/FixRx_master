import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, UserType } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';

import { authService } from '../services/authService';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

WebBrowser.maybeCompleteAuthSession();

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const {
    setUserEmail,
    setUserType,
    setUserProfile,
    setIsAuthenticated,
  } = useAppContext();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const googleConfigured = useMemo(
    () =>
      Boolean(
        process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
          process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
          process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      ),
    []
  );

  const [googleRequest, , promptGoogle] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    responseType: 'id_token',
    prompt: AuthSession.Prompt.SelectAccount,
    scopes: ['profile', 'email'],
  });

  const handleEmailContinue = () => {
    navigation.navigate('EmailAuth');
  };

  const handleGoogleContinue = async () => {
    if (!googleConfigured) {
      Alert.alert('Google Sign-In unavailable', 'Google authentication is not configured.');
      return;
    }

    if (!googleRequest) {
      Alert.alert('Google Sign-In unavailable', 'Google authentication is still initializing.');
      return;
    }

    try {
      setIsGoogleLoading(true);
      const result = await promptGoogle({ useProxy: Platform.OS !== 'web' } as any);

      if (!result || result.type !== 'success') {
        if (result?.type === 'error') {
          Alert.alert('Google Sign-In failed', result.params?.error_description || 'Please try again.');
        }
        return;
      }

      const idToken = result.params?.id_token || result.authentication?.idToken;

      if (!idToken) {
        Alert.alert('Google Sign-In failed', 'Missing ID token from Google response.');
        return;
      }

      const loginResponse = await authService.loginWithGoogle(idToken);

      if (!loginResponse.success || !loginResponse.data) {
        Alert.alert('Login failed', loginResponse.error || loginResponse.message || 'Unable to sign in.');
        return;
      }

      const { user, isNewUser } = loginResponse.data;
      const normalizedType = (user.userType ?? null) as UserType | null;

      setUserEmail(user.email);
      setUserType(isNewUser ? null : normalizedType);
      setUserProfile({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: isNewUser ? null : normalizedType,
        phone: user.phone,
        profileImage: user.profileImage,
        metroArea: user.metroArea,
      });
      setIsAuthenticated(true);

      navigation.reset({
        index: 0,
        routes: [
          {
            name: isNewUser || !normalizedType ? 'UserType' : 'MainTabs',
            params: undefined,
          },
        ],
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Google Sign-In failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleFacebookContinue = () => {
    // TODO: Implement Facebook authentication
    console.log('Continue with Facebook');
  };

  const handlePhoneContinue = () => {
    navigation.navigate('PhoneAuth');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>F</Text>
          </View>
        </View>
        
        {/* Welcome Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome to FixRx</Text>
          <Text style={styles.subtitle}>
            Connect with trusted contractors and manage your home services with ease
          </Text>
        </View>
        
        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {/* Email Button */}
          <TouchableOpacity 
            style={styles.emailButton}
            onPress={handleEmailContinue}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </TouchableOpacity>
          
          {/* Google Button */}
          <TouchableOpacity 
            style={[
              styles.googleButton,
              (!googleConfigured || !googleRequest || isGoogleLoading) && styles.disabledButton,
            ]}
            onPress={handleGoogleContinue}
            activeOpacity={0.8}
            disabled={!googleConfigured || !googleRequest || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <ActivityIndicator color="#4285F4" />
                <Text style={[styles.googleButtonText, styles.googleLoadingText]}>Signing in...</Text>
              </>
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Facebook Button */}
          <TouchableOpacity 
            style={styles.facebookButton}
            onPress={handleFacebookContinue}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-facebook" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.facebookButtonText}>Continue with Facebook</Text>
          </TouchableOpacity>

          {/* Phone Number Button */}
          <TouchableOpacity 
            style={styles.phoneButton}
            onPress={handlePhoneContinue}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={20} color="#2563EB" style={styles.phoneButtonIcon} />
            <Text style={styles.phoneButtonText}>Login with phone number</Text>
          </TouchableOpacity>
        </View>
        
        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 340,
    marginBottom: 30,
  },
  emailButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleLoadingText: {
    marginLeft: 12,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 0,
  },
  disabledButton: {
    opacity: 0.6,
  },
  phoneButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  phoneButtonIcon: {
    marginRight: 8,
  },
  phoneButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '500',
  },
  termsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },
  termsText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  linkText: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;
