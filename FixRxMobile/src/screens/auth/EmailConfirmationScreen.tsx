import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { useAppContext } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { resetTo } from '../../navigation/navigationRef';
import { UserType, UserProfile } from '../../types/navigation';

type EmailConfirmationScreenRouteProp = RouteProp<RootStackParamList, 'EmailConfirmation'>;

const POLL_INTERVAL_MS = 4000;
const RESEND_INTERVAL_SECONDS = 30;

const EmailConfirmationScreen: React.FC = () => {
  const route = useRoute<EmailConfirmationScreenRouteProp>();
  const email = route.params?.email || '';
  const {
    setUserEmail,
    setUserProfile,
    setUserType,
    setIsAuthenticated,
    userType,
    isAuthenticated,
  } = useAppContext();
  
  // Safety check - if no email, this screen shouldn't be shown
  if (!email) {
    console.error('EmailConfirmationScreen: No email provided');
  }
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const [statusMessage, setStatusMessage] = useState('Waiting for magic link verification...');
  const [isChecking, setIsChecking] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_INTERVAL_SECONDS);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Set the email in context
    setUserEmail(email);
    
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [email, fadeAnim, scaleAnim, setUserEmail]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setResendCountdown((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const navigateAfterVerification = (resolvedUserType: UserType | null) => {
    if (hasNavigated) return;
    setHasNavigated(true);

    if (resolvedUserType) {
      resetTo('MainTabs');
    } else {
      resetTo('UserType');
    }
  };

  const checkVerificationStatus = async (triggeredManually = false) => {
    if (isChecking || hasNavigated) return;

    try {
      setIsChecking(true);

      const authed = await authService.isAuthenticated();

      if (!authed) {
        if (triggeredManually) {
          setStatusMessage('Magic link not verified yet. Please click the link in your email.');
        }
        return;
      }

      const profileResponse = await authService.getProfile();

      if (profileResponse.success && profileResponse.data) {
        const data = profileResponse.data;
        const normalizedUserType = data.userType
          ? (data.userType.toLowerCase() as UserType)
          : null;

        const normalizedProfile: UserProfile = {
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          userType: normalizedUserType,
          phone: data.phone,
          profileImage: data.profileImage,
        };

        setUserEmail(data.email);
        setUserProfile(normalizedProfile);
        setUserType(normalizedUserType);
        setIsAuthenticated(true);
        setStatusMessage('Magic link verified! Redirecting...');
        navigateAfterVerification(normalizedUserType);
      }

    } catch (error) {
      console.error('Magic link verification check failed:', error);
      setStatusMessage('Could not verify magic link. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && userType !== undefined) {
      navigateAfterVerification(userType);
      return;
    }

    const interval = setInterval(() => {
      checkVerificationStatus(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, userType]);

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;

    try {
      setIsResending(true);
      setStatusMessage('Sending a new magic link...');
      const result = await authService.sendMagicLink(email, 'REGISTRATION');
      if (result.success) {
        setStatusMessage('Magic link resent. Please check your inbox.');
        setResendCountdown(RESEND_INTERVAL_SECONDS);
      } else {
        setStatusMessage(result.message || 'Unable to resend magic link.');
      }
    } catch (error) {
      console.error('Resend magic link failed:', error);
      setStatusMessage('Failed to resend magic link. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('../../../assets/email-sent.png')} 
            style={styles.emailIcon}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>Check Your Email</Text>
        
        <Text style={styles.subtitle}>
          We've sent a magic link to 
          <Text style={styles.emailText}> {email}</Text>
        </Text>
        
        <Text style={styles.instruction}>
          Click the link in the email to sign in. The link will expire shortly.
        </Text>
        
        <View style={styles.statusContainer}>
          {(isChecking || isAuthenticated) && <ActivityIndicator size="small" color="#3B82F6" />}
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryButton, isChecking && styles.disabledButton]}
            onPress={() => checkVerificationStatus(true)}
            activeOpacity={0.8}
            disabled={isChecking}
          >
            <Text style={styles.secondaryButtonText}>I clicked the magic link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, (resendCountdown > 0 || isResending) && styles.disabledButton]}
            onPress={handleResend}
            activeOpacity={0.8}
            disabled={resendCountdown > 0 || isResending}
          >
            <Text style={styles.buttonText}>
              {resendCountdown > 0 ? `Resend Email (${resendCountdown}s)` : 'Resend Magic Link'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Didn't receive an email?</Text>
          <Text style={styles.footerHint}>Check your spam folder or resend the link.</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  emailIcon: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
    marginRight: 4,
  },
  footerHint: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EmailConfirmationScreen;
