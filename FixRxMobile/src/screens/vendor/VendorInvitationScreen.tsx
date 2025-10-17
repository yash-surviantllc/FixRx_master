import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type VendorInvitationNavigationProp = StackNavigationProp<RootStackParamList, 'VendorInvitation'>;

interface Contact {
  id: string;
  name: string;
  phone: string;
}

const VendorInvitationScreen: React.FC = () => {
  const navigation = useNavigation<VendorInvitationNavigationProp>();
  const { theme, colors } = useTheme();
  const darkMode = theme === 'dark';
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const contacts: Contact[] = [
    { id: '1', name: 'Mike Johnson', phone: '(555) 123-4567' },
    { id: '2', name: 'Sarah Williams', phone: '(555) 234-5678' },
    { id: '3', name: 'David Brown', phone: '(555) 345-6789' },
    { id: '4', name: 'Lisa Anderson', phone: '(555) 456-7890' },
    { id: '5', name: 'Robert Wilson', phone: '(555) 567-8901' },
  ];

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSelection = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      return newSelection;
    });
  };

  const handleSendInvites = () => {
    
    if (selectedContacts.length === 0) {
      Alert.alert(
        'Select Contacts First', 
        'Please select at least one contact to send invitations to.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    // Get selected contact details
    const selectedContactDetails = contacts.filter(c => selectedContacts.includes(c.id));
    const selectedNames = selectedContactDetails.map(c => c.name).join(', ');

    // Simulate sending SMS to each selected contact
    selectedContactDetails.forEach(contact => {
      const inviteMessage = `Hi ${contact.name.split(' ')[0]}! 👋\n\nI'm using FixRx to manage my service business and it's been amazing! They're offering a special bonus for new service providers.\n\nJoin using my referral code: VENDOR2024\n\nDownload the app: https://fixrx.app/invite\n\nYou'll get:\n✅ More customers\n✅ Easy scheduling\n✅ Fast payments\n✅ Special signup bonus\n\nLet me know if you have any questions!`;
      
      // In a real app, you would use a library like react-native-sms or Linking API
      // For now, we're simulating the SMS send
    });

    const totalEarnings = selectedContacts.length * 30; // $30 per referral

    Alert.alert(
      'Invitations Sent Successfully! 🎉',
      `✅ SMS invitations sent to: ${selectedNames}\n\n💰 Potential earnings: $${totalEarnings}\n\n📱 Each contact received a personalized invitation with your referral code: VENDOR2024\n\nYou'll earn $30 for each person who joins and completes their first job!`,
      [
        {
          text: 'Great!',
          onPress: () => {
            // Clear selections and go back to dashboard
            setSelectedContacts([]);
            // Try different navigation approaches
            try {
              navigation.goBack();
            } catch (error) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'VendorDashboard' as never }],
              });
            }
          },
        },
      ]
    );
  };

  const handleSkip = () => {
    // Navigate back to the main vendor dashboard
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' as never }],
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Invite Service Providers</Text>
        <Text style={[styles.subtitle, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>
          Know other contractors or service providers? Invite them to join FixRx!
        </Text>
      </View>

      {/* Stats Card */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <MaterialIcons name="people" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{selectedContacts.length}</Text>
          <Text style={[styles.statLabel, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>Selected</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <MaterialIcons name="attach-money" size={32} color="#10B981" />
          <Text style={[styles.statValue, { color: colors.text }]}>$30</Text>
          <Text style={[styles.statLabel, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>Per Referral</Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: darkMode ? '#1E3A8A' : '#E7F5FF' }]}>
        <MaterialIcons name="info" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: darkMode ? '#D1D5DB' : '#0D6EFD' }]}>
          Earn $30 for each service provider who joins and completes their first job!
        </Text>
      </View>

      {/* Contacts List */}
      <ScrollView style={styles.contactsList} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Contacts</Text>
        {contacts.map(contact => {
          const isSelected = selectedContacts.includes(contact.id);
          return (
            <TouchableOpacity
              key={contact.id}
              style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }, isSelected && { borderColor: colors.primary, backgroundColor: darkMode ? '#1E3A8A' : '#F0F7FF' }]}
              onPress={() => toggleContact(contact.id)}
              activeOpacity={0.7}
            >
              <View style={styles.contactLeft}>
                <View style={[styles.contactAvatar, { backgroundColor: colors.secondary }, isSelected && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.contactAvatarText, { color: darkMode ? '#9CA3AF' : '#6C757D' }, isSelected && { color: '#FFFFFF' }]}>
                    {contact.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                  <Text style={[styles.contactPhone, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>{contact.phone}</Text>
                </View>
              </View>
              <View style={[styles.checkbox, { borderColor: darkMode ? '#6B7280' : '#ADB5BD' }, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {isSelected && <MaterialIcons name="check" size={18} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSendInvites}
          activeOpacity={0.8}
        >
          <MaterialIcons name="send" size={20} color="#FFFFFF" />
          <Text style={styles.buttonPrimaryText}>
            Send Invites ({selectedContacts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonSecondaryText, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E7F5FF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0D6EFD',
    marginLeft: 8,
    lineHeight: 18,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  contactCardSelected: {
    borderColor: '#0D6EFD',
    backgroundColor: '#F0F7FF',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarSelected: {
    backgroundColor: '#0D6EFD',
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C757D',
  },
  contactAvatarTextSelected: {
    color: '#FFFFFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    color: '#6C757D',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ADB5BD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0D6EFD',
    borderColor: '#0D6EFD',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonPrimary: {
    backgroundColor: '#0D6EFD',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
  },
  buttonSecondaryText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default VendorInvitationScreen;
