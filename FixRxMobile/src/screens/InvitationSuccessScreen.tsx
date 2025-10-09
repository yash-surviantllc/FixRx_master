import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Share
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';

type InvitationSuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InvitationSuccess'>;
type InvitationSuccessScreenRouteProp = RouteProp<RootStackParamList, 'InvitationSuccess'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Confetti component
const ConfettiPiece: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const horizontalValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateValue, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(horizontalValue, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(horizontalValue, {
              toValue: -1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(horizontalValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, SCREEN_HEIGHT + 100],
  });

  const translateX = horizontalValue.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-30, 0, 30],
  });

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate },
          ],
          opacity,
          left: Math.random() * SCREEN_WIDTH,
        },
      ]}
    />
  );
};

const InvitationSuccessScreen: React.FC = () => {
  const navigation = useNavigation<InvitationSuccessScreenNavigationProp>();
  const route = useRoute<InvitationSuccessScreenRouteProp>();
  const { colors, isDarkMode } = useTheme();
  const [showWhatHappens, setShowWhatHappens] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const { invitationCount = 1, inviteType = 'contractor' } = route.params || {};

  const confettiColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2000,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
  }));

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just invited ${invitationCount} ${inviteType === 'contractor' ? 'contractors' : 'friends'} to join FixRx! Join me in finding trusted home service professionals through friend recommendations. Use my code: MIKE2024`,
        title: 'Join me on FixRx',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBackToDashboard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleInviteMore = () => {
    navigation.navigate('ContactSelection', { inviteType });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Confetti Animation */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {confettiPieces.map((piece) => (
          <ConfettiPiece key={piece.id} delay={piece.delay} color={piece.color} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Header */}
        <View style={[styles.successHeader, { backgroundColor: '#D1FAE5' }]}>
          <View style={[styles.successIcon, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.messageSection}>
          <Text style={[styles.title, { color: colors.primaryText }]}>
            Invitations sent!
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            {invitationCount} invitation{invitationCount !== 1 ? 's' : ''} sent successfully
          </Text>
          <Text style={[styles.timestamp, { color: colors.secondaryText }]}>
            Sent on {currentDate} at {currentTime}
          </Text>
        </View>

        {/* Referral Rewards Card */}
        <View style={[styles.rewardCard, { backgroundColor: '#D1FAE5' }]}>
          <View style={styles.rewardHeader}>
            <View style={[styles.rewardIcon, { backgroundColor: '#10B981' }]}>
              <Text style={styles.dollarSign}>$</Text>
            </View>
            <View style={styles.rewardTextContainer}>
              <Text style={[styles.rewardTitle, { color: '#065F46' }]}>
                Referral Rewards
              </Text>
              <Text style={[styles.rewardDescription, { color: '#047857' }]}>
                Earn $50 for each contractor who joins and completes 3 services
              </Text>
            </View>
          </View>
          
          <View style={styles.earningsContainer}>
            <View style={styles.earningsRow}>
              <Text style={[styles.earningsLabel, { color: '#065F46' }]}>
                Potential earnings:
              </Text>
              <Text style={[styles.earningsAmount, { color: '#10B981' }]}>
                ${invitationCount * 50}
              </Text>
            </View>
            <Text style={[styles.earningsSubtext, { color: '#047857' }]}>
              From these {invitationCount} invitation{invitationCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleBackToDashboard}
        >
          <Text style={styles.primaryButtonText}>Back to dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleInviteMore}
        >
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
            Invite more
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color={colors.secondaryText} />
          <Text style={[styles.shareButtonText, { color: colors.secondaryText }]}>
            Share
          </Text>
        </TouchableOpacity>

        {/* Expandable Sections */}
        <View style={[styles.expandableSection, { borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.expandableHeader}
            onPress={() => setShowWhatHappens(!showWhatHappens)}
          >
            <Text style={[styles.expandableTitle, { color: colors.primaryText }]}>
              What happens next?
            </Text>
            <Ionicons 
              name={showWhatHappens ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.secondaryText} 
            />
          </TouchableOpacity>
          
          {showWhatHappens && (
            <View style={styles.expandableContent}>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.stepNumberText, { color: colors.primary }]}>1</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.secondaryText }]}>
                  Your contacts will receive an SMS invitation with your referral code
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.stepNumberText, { color: colors.primary }]}>2</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.secondaryText }]}>
                  They can download the app and sign up using your code
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.stepNumberText, { color: colors.primary }]}>3</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.secondaryText }]}>
                  You'll earn rewards when they complete qualifying activities
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.expandableSection, { borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.expandableHeader}
            onPress={() => setShowShareOptions(!showShareOptions)}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.secondaryText} />
            <Text style={[styles.expandableTitle, { color: colors.primaryText }]}>
              Share on social media
            </Text>
            <Ionicons 
              name={showShareOptions ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.secondaryText} 
            />
          </TouchableOpacity>
          
          {showShareOptions && (
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#1877F2' }]}>
                <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#1DA1F2' }]}>
                <Ionicons name="logo-twitter" size={24} color="#FFFFFF" />
                <Text style={styles.socialButtonText}>Twitter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
                <Text style={styles.socialButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  successHeader: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
  },
  rewardCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  rewardHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dollarSign: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  rewardTextContainer: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  earningsContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  earningsSubtext: {
    fontSize: 14,
  },
  primaryButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 24,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
  },
  expandableSection: {
    borderTopWidth: 1,
    marginTop: 16,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  expandableTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  expandableContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  socialButtonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InvitationSuccessScreen;
