import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';

type HelpCenterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HelpCenter'>;

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How do I book a service?',
    answer: 'To book a service, go to the Services tab, select the service you need, choose your preferred provider, and confirm your booking. You can track the status in the Bookings section.'
  },
  {
    id: '2',
    question: 'How do I pay for a service?',
    answer: 'We accept various payment methods including credit/debit cards, mobile wallets, and UPI. Payment is processed securely through our platform once the service is completed.'
  },
  {
    id: '3',
    question: 'What is your cancellation policy?',
    answer: 'You can cancel your booking up to 2 hours before the scheduled time without any charges. Cancellations made after this period may be subject to a cancellation fee.'
  },
  {
    id: '4',
    question: 'How do I contact customer support?',
    answer: 'You can reach our 24/7 customer support through the Help Center, or email us at support@fixrx.com. Average response time is under 30 minutes.'
  },
  {
    id: '5',
    question: 'How do I rate a service provider?',
    answer: 'After service completion, you\'ll receive a notification to rate your experience. You can also rate later from the Bookings section by selecting the completed service.'
  },
];

const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation<HelpCenterScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Help Center</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: colors.primaryText }]}>Frequently Asked Questions</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Find answers to common questions about our services</Text>
        
        <View style={styles.faqContainer}>
          {FAQ_DATA.map((item) => (
            <View 
              key={item.id} 
              style={[
                styles.faqItem, 
                { 
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.05)',
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.faqHeader}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.question, { color: colors.primaryText }]}>{item.question}</Text>
                <MaterialIcons 
                  name={expandedId === item.id ? 'keyboard-arrow-up' : 'keyboard-arrow-right'} 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
              
              {expandedId === item.id && (
                <View style={styles.answerContainer}>
                  <Text style={[styles.answer, { color: colors.secondaryText }]}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.contactCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.contactTitle, { color: colors.primaryText }]}>Still need help?</Text>
          <Text style={[styles.contactText, { color: colors.secondaryText }]}>Our support team is available 24/7 to assist you with any questions or concerns.</Text>
          <TouchableOpacity style={[styles.contactButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  faqContainer: {
    marginBottom: 24,
  },
  faqItem: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
  },
  answerContainer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default HelpCenterScreen;
