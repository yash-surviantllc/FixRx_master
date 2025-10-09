import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Easing } from 'react-native';

type RatingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Rating'>;
type RatingScreenRouteProp = RouteProp<RootStackParamList, 'Rating'>;

const RatingScreen: React.FC = () => {
  const navigation = useNavigation<RatingScreenNavigationProp>();
  const route = useRoute<RatingScreenRouteProp>();
  const { colors, isDarkMode } = useTheme();

  const [qualityOfWork, setQualityOfWork] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [timeliness, setTimeliness] = useState(3);
  const [professionalism, setProfessionalism] = useState(3);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const overallRating = ((qualityOfWork + communication + timeliness + professionalism) / 4).toFixed(1);

  const getSliderColor = (value: number) => {
    if (value <= 2) return '#EF4444'; // Red
    if (value <= 3) return '#F59E0B'; // Orange
    if (value <= 4) return '#10B981'; // Green
    return '#059669'; // Dark Green
  };

  const getEmojiForRating = (value: number) => {
    if (value <= 1.5) return '😞';
    if (value <= 2.5) return '😕';
    if (value <= 3.5) return '😐';
    if (value <= 4.5) return '🙂';
    return '😍';
  };

  const handleAddPhoto = () => {
    Alert.alert('Add Photo', 'Photo picker functionality would be implemented here');
  };

  const handleSubmitReview = () => {
    console.log('Submit button pressed!');
    
    // Show confetti animation
    setShowConfetti(true);
    
    // Show immediate feedback
    Alert.alert(
      'Review Submitted! 🎉',
      'Thank you for your feedback!',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowConfetti(false);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderRatingSlider = (
    label: string,
    value: number,
    setValue: (value: number) => void,
    emoji: string
  ) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: colors.primaryText }]}>{label}</Text>
        <View style={styles.ratingDisplay}>
          <Text style={styles.ratingEmoji}>{emoji}</Text>
          <Text style={[styles.ratingValue, { color: colors.primaryText }]}>
            {value.toFixed(1)}
          </Text>
        </View>
      </View>
      <View style={styles.sliderTrack}>
        <View 
          style={[
            styles.sliderFill, 
            { 
              width: `${((value - 1) / 4) * 100}%`,
              backgroundColor: getSliderColor(value)
            }
          ]} 
        />
        <View style={styles.sliderSteps}>
          {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((step) => (
            <TouchableOpacity
              key={step}
              style={styles.sliderStep}
              onPress={() => setValue(step)}
            >
              <View 
                style={[
                  styles.sliderDot,
                  { backgroundColor: value >= step ? getSliderColor(value) : (isDarkMode ? '#374151' : '#E5E7EB') }
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.sliderLabels}>
        <Text style={[styles.sliderLabelText, { color: colors.secondaryText }]}>Poor</Text>
        <Text style={[styles.sliderLabelText, { color: colors.secondaryText }]}>Excellent</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Service Completed</Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
            Plumbing service with Mike Rodriguez
          </Text>
          <Text style={[styles.headerDate, { color: colors.secondaryText }]}>
            Completed on October 1, 2025
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: colors.primaryText }]}>
            How was your experience?
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Your honest feedback helps our community
          </Text>
        </View>

        {/* Rating Sliders */}
        {renderRatingSlider('Quality of Work', qualityOfWork, setQualityOfWork, getEmojiForRating(qualityOfWork))}
        {renderRatingSlider('Communication', communication, setCommunication, getEmojiForRating(communication))}
        {renderRatingSlider('Timeliness', timeliness, setTimeliness, getEmojiForRating(timeliness))}
        {renderRatingSlider('Professionalism', professionalism, setProfessionalism, getEmojiForRating(professionalism))}

        {/* Overall Rating Card */}
        <View style={[styles.overallCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.overallLabel, { color: colors.secondaryText }]}>Overall Rating</Text>
          <View style={styles.overallRatingContainer}>
            <Text style={styles.overallRatingEmoji}>{getEmojiForRating(parseFloat(overallRating))}</Text>
            <Text style={[styles.overallRating, { color: colors.primaryText }]}>{overallRating}</Text>
            <Text style={[styles.outOf, { color: colors.secondaryText }]}>/ 5.0</Text>
          </View>
        </View>

        {/* Photo Upload */}
        <View style={styles.photoSection}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
            Share photos of completed work <Text style={{ color: colors.secondaryText }}>(Optional)</Text>
          </Text>
          <TouchableOpacity
            style={[styles.photoUploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleAddPhoto}
          >
            <Ionicons name="camera-outline" size={32} color={colors.secondaryText} />
            <Ionicons name="images-outline" size={32} color={colors.secondaryText} style={{ marginLeft: 16 }} />
            <Text style={[styles.photoUploadText, { color: colors.secondaryText }]}>Add photos</Text>
          </TouchableOpacity>
        </View>

        {/* Review Text */}
        <View style={styles.reviewSection}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
            Tell others about your experience <Text style={{ color: colors.secondaryText }}>(Optional but encouraged)</Text>
          </Text>
          <TextInput
            style={[
              styles.reviewInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.primaryText,
              },
            ]}
            placeholder="Describe the service, quality, and your overall satisfaction..."
            placeholderTextColor={colors.secondaryText}
            multiline
            maxLength={500}
            value={reviewText}
            onChangeText={setReviewText}
            textAlignVertical="top"
          />
          <Text style={[styles.characterCount, { color: colors.secondaryText }]}>
            {reviewText.length}/500 characters
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              console.log('Button pressed directly!');
              Alert.alert('Test', 'Button is working!');
              handleSubmitReview();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.skipButton, { borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.skipButtonText, { color: colors.secondaryText }]}>Skip review</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confetti Animation */}
      {showConfetti && (
        <View style={styles.confettiContainer} pointerEvents="none">
          {[...Array(30)].map((_, i) => {
            const randomLeft = Math.random() * 100;
            const randomSize = 20 + Math.random() * 20;
            const confettiEmojis = ['🎉', '🎊', '⭐', '✨', '🌟', '💫'];
            const randomEmoji = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
            
            return (
              <Text
                key={i}
                style={[
                  styles.confettiEmoji,
                  {
                    left: `${randomLeft}%`,
                    fontSize: randomSize,
                  },
                ]}
              >
                {randomEmoji}
              </Text>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginBottom: 12,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 16,
  },
  headerDate: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  sliderContainer: {
    marginBottom: 32,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingEmoji: {
    fontSize: 24,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  sliderTrack: {
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    position: 'relative',
    marginVertical: 12,
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 16,
  },
  sliderSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    width: '100%',
    paddingHorizontal: 4,
  },
  sliderStep: {
    padding: 4,
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 12,
  },
  overallCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 32,
  },
  overallLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  overallRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overallRatingEmoji: {
    fontSize: 40,
  },
  overallRating: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  outOf: {
    fontSize: 24,
    marginTop: 12,
  },
  photoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  photoUploadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  photoUploadText: {
    fontSize: 16,
    marginLeft: 12,
  },
  reviewSection: {
    marginBottom: 32,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  buttonContainer: {
    gap: 12,
    paddingBottom: 32,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 16,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiEmoji: {
    position: 'absolute',
    top: -50,
    opacity: 0.9,
  },
});

export default RatingScreen;
