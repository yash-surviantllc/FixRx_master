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

// List of major US metropolitan areas
const METRO_AREAS = [
  { id: '1', name: 'Atlanta, GA' },
  { id: '2', name: 'Austin, TX' },
  { id: '3', name: 'Baltimore, MD' },
  { id: '4', name: 'Boston, MA' },
  { id: '5', name: 'Charlotte, NC' },
  { id: '6', name: 'Chicago, IL' },
  { id: '7', name: 'Dallas, TX' },
  { id: '8', name: 'Denver, CO' },
  { id: '9', name: 'Detroit, MI' },
  { id: '10', name: 'Houston, TX' },
  { id: '11', name: 'Las Vegas, NV' },
  { id: '12', name: 'Los Angeles, CA' },
  { id: '13', name: 'Miami, FL' },
  { id: '14', name: 'Minneapolis, MN' },
  { id: '15', name: 'Nashville, TN' },
  { id: '16', name: 'New York, NY' },
  { id: '17', name: 'Orlando, FL' },
  { id: '18', name: 'Philadelphia, PA' },
  { id: '19', name: 'Phoenix, AZ' },
  { id: '20', name: 'Portland, OR' },
  { id: '21', name: 'Raleigh, NC' },
  { id: '22', name: 'Sacramento, CA' },
  { id: '23', name: 'San Antonio, TX' },
  { id: '24', name: 'San Diego, CA' },
  { id: '25', name: 'San Francisco, CA' },
  { id: '26', name: 'San Jose, CA' },
  { id: '27', name: 'Seattle, WA' },
  { id: '28', name: 'Tampa, FL' },
  { id: '29', name: 'Washington, DC' },
];

interface MetroAreaDropdownProps {
  value: string;
  onSelect: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

const MetroAreaDropdown: React.FC<MetroAreaDropdownProps> = ({
  value,
  onSelect,
  label = 'Metro Area',
  required = false,
  placeholder = 'Select your metropolitan area',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAreas = METRO_AREAS.filter((area) =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (areaName: string) => {
    onSelect(areaName);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
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
              <Text style={styles.modalTitle}>Location</Text>
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
                placeholder="Search metro areas..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            {/* List */}
            <FlatList
              data={filteredAreas}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => handleSelect(item.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.listItemText}>{item.name}</Text>
                  {value === item.name && (
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  dropdown: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  listItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});

export default MetroAreaDropdown;
