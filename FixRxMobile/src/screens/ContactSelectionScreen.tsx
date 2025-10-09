import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';

type ContactSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ContactSelection'>;
type ContactSelectionScreenRouteProp = RouteProp<RootStackParamList, 'ContactSelection'>;

interface Contact {
  id: string;
  name: string;
  phone: string;
  initials: string;
  lastContacted?: string;
  isVerified?: boolean;
  category?: 'potential' | 'recent' | 'favorite';
  service?: string;
}

// Mock contacts data
const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Amanda Taylor',
    phone: '(987) 682-1268',
    initials: 'AT',
    lastContacted: '71 days ago',
    isVerified: true,
    category: 'potential'
  },
  {
    id: '2',
    name: 'Andrew Jackson',
    phone: '(764) 637-2113',
    initials: 'AJ',
    lastContacted: '35 days ago',
    isVerified: true,
    category: 'recent'
  },
  {
    id: '3',
    name: 'Ashley Wilson',
    phone: '(934) 515-8342',
    initials: 'AW',
    lastContacted: '55 days ago',
    isVerified: true,
    category: 'potential'
  },
  {
    id: '4',
    name: 'Christopher Moore',
    phone: '(398) 976-2510',
    initials: 'CM',
    lastContacted: '50 days ago',
    isVerified: false,
    category: 'potential'
  },
  {
    id: '5',
    name: 'Clean Pro Services',
    phone: '(555) 789-4560',
    initials: 'CP',
    service: 'Likely contractor',
    isVerified: true,
    category: 'potential'
  },
  {
    id: '6',
    name: 'David Miller',
    phone: '(555) 123-4567',
    initials: 'DM',
    lastContacted: '10 days ago',
    category: 'favorite'
  },
  {
    id: '7',
    name: 'Emily Davis',
    phone: '(555) 234-5678',
    initials: 'ED',
    lastContacted: '5 days ago',
    category: 'recent'
  },
  {
    id: '8',
    name: 'Frank Wilson',
    phone: '(555) 345-6789',
    initials: 'FW',
    lastContacted: '15 days ago',
    category: 'recent'
  }
];

const ContactSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ContactSelectionScreenNavigationProp>();
  const route = useRoute<ContactSelectionScreenRouteProp>();
  const { colors, isDarkMode } = useTheme();
  
  const inviteType = route.params?.inviteType || 'contractor';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'potential' | 'recent' | 'favorites'>('all');
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);

  // Filter contacts based on search and tab
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.phone.includes(searchQuery);
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'potential') return matchesSearch && contact.category === 'potential';
    if (activeTab === 'recent') return matchesSearch && contact.category === 'recent';
    if (activeTab === 'favorites') return matchesSearch && contact.category === 'favorite';
    
    return matchesSearch;
  });

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      }
      return [...prev, contactId];
    });
  };

  const selectAllVisible = () => {
    const visibleIds = filteredContacts.map(c => c.id);
    setSelectedContacts(prev => {
      const newSelection = [...prev];
      visibleIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  const clearAll = () => {
    setSelectedContacts([]);
  };

  const handleSendInvitation = () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to send an invitation.');
      return;
    }

    navigation.navigate('MessagePreview', {
      selectedContacts: selectedContacts.map(id => 
        contacts.find(c => c.id === id)!
      ),
      inviteType
    });
  };

  const getTabCount = (tab: string) => {
    switch(tab) {
      case 'all': return contacts.length;
      case 'potential': return contacts.filter(c => c.category === 'potential').length;
      case 'recent': return contacts.filter(c => c.category === 'recent').length;
      case 'favorites': return contacts.filter(c => c.category === 'favorite').length;
      default: return 0;
    }
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const isSelected = selectedContacts.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.contactItem, { borderBottomColor: colors.border }]}
        onPress={() => toggleContactSelection(item.id)}
      >
        <View style={styles.contactLeft}>
          <View style={[
            styles.avatarContainer,
            { backgroundColor: isSelected ? colors.primary : colors.surface }
          ]}>
            {isSelected ? (
              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.initials,
                { color: isSelected ? '#FFFFFF' : colors.primaryText }
              ]}>
                {item.initials}
              </Text>
            )}
          </View>
          
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            </View>
          )}
        </View>

        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.primaryText }]}>
            {item.name}
          </Text>
          <View style={styles.contactMeta}>
            <Text style={[styles.contactPhone, { color: colors.secondaryText }]}>
              {item.phone}
            </Text>
            {item.service && (
              <Text style={[styles.serviceTag, { color: colors.primary }]}>
                {item.service}
              </Text>
            )}
            {item.lastContacted && (
              <>
                <Ionicons name="time-outline" size={12} color={colors.secondaryText} />
                <Text style={[styles.lastContacted, { color: colors.secondaryText }]}>
                  {item.lastContacted}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={[
          styles.selectionCircle,
          { 
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected ? colors.primary : 'transparent'
          }
        ]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>
          {inviteType === 'contractor' ? 'Add Contractors' : 'Invite Friends'}
        </Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="mic-outline" size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="search" size={20} color={colors.secondaryText} />
        <TextInput
          style={[styles.searchInput, { color: colors.primaryText }]}
          placeholder={`Search for ${inviteType === 'contractor' ? 'contractors' : 'contacts'}`}
          placeholderTextColor={colors.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && [styles.tabActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'all' ? '#FFFFFF' : colors.secondaryText }
          ]}>
            All ({getTabCount('all')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'potential' && [styles.tabActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('potential')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'potential' ? '#FFFFFF' : colors.secondaryText }
          ]}>
            Potential Contractors ({getTabCount('potential')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'recent' && [styles.tabActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'recent' ? '#FFFFFF' : colors.secondaryText }
          ]}>
            Recent ({getTabCount('recent')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'favorites' && [styles.tabActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'favorites' ? '#FFFFFF' : colors.secondaryText }
          ]}>
            Favorites ({getTabCount('favorites')})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Selection Info Bar */}
      {selectedContacts.length > 0 && (
        <View style={[styles.selectionBar, { backgroundColor: colors.surface }]}>
          <Text style={[styles.selectionText, { color: colors.primaryText }]}>
            {selectedContacts.length} {inviteType === 'contractor' ? 'contractor' : 'contact'}{selectedContacts.length !== 1 ? 's' : ''} selected
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={() => navigation.navigate('MessagePreview', {
              selectedContacts: selectedContacts.map(id => 
                contacts.find(c => c.id === id)!
              ),
              inviteType
            })}>
              <Text style={[styles.previewButton, { color: colors.primary }]}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAll}>
              <Text style={[styles.clearButton, { color: colors.secondaryText }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Select All Option */}
      <TouchableOpacity 
        style={[styles.selectAllButton]}
        onPress={selectAllVisible}
      >
        <Text style={[styles.selectAllText, { color: colors.primary }]}>
          Select all visible ({filteredContacts.length})
        </Text>
      </TouchableOpacity>

      {/* Contacts Count */}
      <Text style={[styles.contactsCount, { color: colors.secondaryText }]}>
        {filteredContacts.length} of {contacts.length} contacts
      </Text>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Send Button */}
      {selectedContacts.length > 0 && (
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          onPress={handleSendInvitation}
        >
          <Text style={styles.sendButtonText}>
            Send {selectedContacts.length} invitation{selectedContacts.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  previewButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
  },
  selectAllButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactsCount: {
    paddingHorizontal: 20,
    marginBottom: 8,
    fontSize: 12,
    textAlign: 'right',
  },
  listContent: {
    paddingBottom: 100,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactLeft: {
    position: 'relative',
    marginRight: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactPhone: {
    fontSize: 14,
  },
  serviceTag: {
    fontSize: 12,
    fontWeight: '500',
  },
  lastContacted: {
    fontSize: 12,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactSelectionScreen;
