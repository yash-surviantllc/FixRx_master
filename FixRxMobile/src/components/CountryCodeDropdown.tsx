import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

// Common country codes
const COUNTRY_CODES = [
  { id: '1', code: '+1', country: 'United States', flag: '🇺🇸' },
  { id: '2', code: '+1', country: 'Canada', flag: '🇨🇦' },
  { id: '3', code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { id: '4', code: '+91', country: 'India', flag: '🇮🇳' },
  { id: '5', code: '+86', country: 'China', flag: '🇨🇳' },
  { id: '6', code: '+81', country: 'Japan', flag: '🇯🇵' },
  { id: '7', code: '+49', country: 'Germany', flag: '🇩🇪' },
  { id: '8', code: '+33', country: 'France', flag: '🇫🇷' },
  { id: '9', code: '+39', country: 'Italy', flag: '🇮🇹' },
  { id: '10', code: '+34', country: 'Spain', flag: '🇪🇸' },
  { id: '11', code: '+61', country: 'Australia', flag: '🇦🇺' },
  { id: '12', code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { id: '13', code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { id: '14', code: '+7', country: 'Russia', flag: '🇷🇺' },
  { id: '15', code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { id: '16', code: '+971', country: 'UAE', flag: '🇦🇪' },
  { id: '17', code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { id: '18', code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { id: '19', code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { id: '20', code: '+64', country: 'New Zealand', flag: '🇳🇿' },
];

interface CountryCodeDropdownProps {
  value: string;
  flag: string;
  onSelect: (code: string, flag: string, country: string) => void;
}

const CountryCodeDropdown: React.FC<CountryCodeDropdownProps> = ({
  value,
  flag,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRY_CODES.filter((country) =>
    country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.includes(searchQuery)
  );

  const handleSelect = (code: string, flag: string, country: string) => {
    onSelect(code, flag, country);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{flag}</Text>
        <Text style={styles.codeText}>{value}</Text>
        <Ionicons name="chevron-down" size={16} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            {/* List */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => handleSelect(item.code, item.flag, item.country)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.listItemFlag}>{item.flag}</Text>
                  <Text style={styles.listItemName}>{item.country}</Text>
                  <Text style={styles.listItemCode}>{item.code}</Text>
                  {value === item.code && flag === item.flag && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container for the dropdown button
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
  },
  flag: {
    fontSize: 24,
  },
  codeText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.75,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  listItemFlag: {
    fontSize: 24,
  },
  listItemName: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  listItemCode: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});

export default CountryCodeDropdown;
