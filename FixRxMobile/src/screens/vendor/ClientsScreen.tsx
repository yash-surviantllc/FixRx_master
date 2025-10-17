import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalJobs: number;
  totalSpent: number;
  lastService: string;
  rating: number;
}

const ClientsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  const darkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const handleGoBack = React.useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const clients: Client[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      totalJobs: 8,
      totalSpent: 1240,
      lastService: '2 days ago',
      rating: 5,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(555) 987-6543',
      totalJobs: 5,
      totalSpent: 890,
      lastService: '1 week ago',
      rating: 5,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Clients</Text>
        <TouchableOpacity onPress={() => Alert.alert('Add Client', 'Add a new client')}>
          <MaterialIcons name="person-add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <MaterialIcons name="search" size={20} color={darkMode ? '#9CA3AF' : '#6C757D'} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search clients..."
          placeholderTextColor={darkMode ? '#6B7280' : '#ADB5BD'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{clients.length}</Text>
          <Text style={[styles.statLabel, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>Total Clients</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>$2,130</Text>
          <Text style={[styles.statLabel, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>Total Revenue</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {clients.map((client) => (
          <View key={client.id} style={[styles.clientCard, { backgroundColor: colors.card }]}>
            <View style={styles.clientHeader}>
              <View style={[styles.clientAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.clientAvatarText, { color: '#FFFFFF' }]}>{client.name.charAt(0)}</Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={[styles.clientName, { color: colors.text }]}>{client.name}</Text>
                <Text style={[styles.clientEmail, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>{client.email}</Text>
                <Text style={[styles.clientPhone, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>{client.phone}</Text>
              </View>
            </View>

            <View style={styles.clientStats}>
              <View style={styles.clientStatItem}>
                <MaterialIcons name="work" size={16} color={darkMode ? '#9CA3AF' : '#6C757D'} />
                <Text style={[styles.clientStatText, { color: darkMode ? '#D1D5DB' : '#6C757D' }]}>{client.totalJobs} jobs</Text>
              </View>
              <View style={styles.clientStatItem}>
                <MaterialIcons name="attach-money" size={16} color={darkMode ? '#9CA3AF' : '#6C757D'} />
                <Text style={[styles.clientStatText, { color: darkMode ? '#D1D5DB' : '#6C757D' }]}>${client.totalSpent}</Text>
              </View>
            </View>

            <View style={styles.clientActions}>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                onPress={() => Alert.alert('Message', `Send message to ${client.name}`)}
              >
                <MaterialIcons name="message" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                onPress={() => Alert.alert('Call', `Call ${client.phone}`)}
              >
                <MaterialIcons name="call" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
                onPress={() => Alert.alert('Client Profile', `${client.name}\n${client.email}\nTotal Jobs: ${client.totalJobs}\nTotal Spent: $${client.totalSpent}`)}
              >
                <Text style={styles.actionBtnPrimaryText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D6EFD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clientInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 13,
    color: '#6C757D',
  },
  clientStats: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F3F5',
    marginBottom: 12,
  },
  clientStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  clientStatText: {
    fontSize: 13,
    color: '#495057',
    marginLeft: 4,
  },
  clientActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionBtnPrimary: {
    backgroundColor: '#0D6EFD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ClientsScreen;
