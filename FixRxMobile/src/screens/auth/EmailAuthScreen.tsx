import React, { useState, useEffect, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { useAppContext } from '../../context/AppContext';
import { authService } from '../../services/authService';

type EmailAuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EmailAuth'>;

const EmailAuthScreen: React.FC = () => {
  const navigation = useNavigation<EmailAuthScreenNavigationProp>();
  const { setUserEmail } = useAppContext();
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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
    setHasError(email.length > 0 && !valid);
  }, [email]);

  const handleSendLink = async () => {
    if (!isValid || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      const response = await authService.sendMagicLink(email, 'REGISTRATION');

      if (!response.success) {
        console.error('Magic link send failed:', response.error);
        setHasError(true);
        return;
      }

      console.log('Magic link sent to:', email);
      setUserEmail(email);
      navigation.navigate('EmailConfirmation', { email } as { email: string });

    } catch (error) {
      console.error('Magic link send error:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getInputBorderColor = () => {
    if (hasError) return '#DC2626';
    if (isFocused) return '#007AFF';
    return '#E5E7EB';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#1D1D1F" />
          </TouchableOpacity>

          {/* Screen Title */}
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            What's your email?
          </Animated.Text>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.inputContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: getInputBorderColor(),
                  borderWidth: 1,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSendLink}
            />

            {email.length > 0 && (
              <View style={styles.validationIcon}>
                {isValid ? (
                  <Check size={20} color="#10B981" />
                ) : (
                  <X size={20} color="#DC2626" />
                )}
              </View>
            )}

            {hasError && (
              <Text style={styles.errorText}>
                Please enter a valid email address
              </Text>
            )}
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
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
                <Text style={styles.buttonText}>Send Magic Link</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EmailAuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  validationIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
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
