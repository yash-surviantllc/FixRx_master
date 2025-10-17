/**
 * React Native version of EmailAuthScreen
 * Migrated from TypeScript React web version
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight } from '../utils/styleConverter';

interface EmailAuthScreenProps {
  onBack: () => void;
  onEmailSent: (email: string) => void;
}

export function EmailAuthScreen({ onBack, onEmailSent }: EmailAuthScreenProps) {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const valid = emailRegex.test(email);
    setIsValid(valid);
    if (email.length > 0 && !valid) {
      setHasError(true);
    } else {
      setHasError(false);
    }
  }, [email]);

  const handleSendLink = async () => {
    if (!isValid) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      console.log('Magic link sent to:', email);
      onEmailSent(email);
    }, 2000);
  };

  const getInputBorderColor = () => {
    if (hasError) return '#DC2626';
    if (isFocused) return '#007AFF';
    return '#E5E7EB';
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
        {/* Header */}
        <View style={styles.header}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#1D1D1F" />
          </TouchableOpacity>

          {/* Screen Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>What's your email?</Text>
          </Animated.View>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          <View style={styles.inputContainer}>
            {/* Email Input Section */}
            <Animated.View
              style={[
                styles.inputWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.inputFieldContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: getInputBorderColor(),
                    },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                {/* Validation Icon */}
                {email.length > 0 && (
                  <View style={styles.validationIcon}>
                    {isValid ? (
                      <Check size={20} color="#10B981" />
                    ) : (
                      <X size={20} color="#DC2626" />
                    )}
                  </View>
                )}
              </View>

              {/* Helper Text */}
              <Text style={styles.helperText}>
                We'll send you a magic link to sign in
              </Text>

              {/* Error Message */}
              {hasError && (
                <Animated.View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    Please enter a valid email address
                  </Text>
                </Animated.View>
              )}
            </Animated.View>

            {/* Send Link Button */}
            <TouchableOpacity
              style={[
                styles.button,
                !isValid && styles.buttonDisabled,
              ]}
              onPress={handleSendLink}
              disabled={!isValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Send magic link</Text>
              )}
            </TouchableOpacity>

            {/* Alternative Options */}
            <View style={styles.alternativeOptions}>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              {/* Social Login Buttons */}
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: spacing[5],
  },
  backButton: {
    padding: spacing[2],
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  titleContainer: {
    marginTop: spacing[6],
  },
  title: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: '#1D1D1F',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[8],
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputWrapper: {
    marginBottom: spacing[4],
  },
  inputFieldContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: fontSize.base,
    color: '#1D1D1F',
    backgroundColor: '#FFFFFF',
  },
  validationIcon: {
    position: 'absolute',
    right: spacing[4],
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  helperText: {
    fontSize: fontSize.sm,
    color: '#6B7280',
    marginTop: spacing[2],
  },
  errorContainer: {
    marginTop: spacing[2],
  },
  errorText: {
    fontSize: fontSize.sm,
    color: '#DC2626',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[6],
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  alternativeOptions: {
    marginTop: spacing[8],
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: '#6B7280',
    paddingHorizontal: spacing[3],
  },
  socialButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  socialButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: '#1D1D1F',
  },
  footer: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[8],
  },
  footerText: {
    fontSize: fontSize.xs,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default EmailAuthScreen;
