import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface TimeSlot {
  time: string;
  status: string;
  client?: string;
}

const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  const darkMode = theme === 'dark';
  const [selectedDate, setSelectedDate] = useState(20);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  
  const months = [
    'December 2024',
    'January 2025',
    'February 2025',
    'March 2025',
    'April 2025',
    'May 2025',
  ];
  
  const currentMonth = months[currentMonthIndex];

  const handleDateSelect = React.useCallback((date: number) => {
    setSelectedDate(date);
  }, []);

  const handleGoBack = React.useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const dates = Array.from({ length: 7 }, (_, i) => ({
    day: 20 + i,
    dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  }));

  // Different time slots for different days
  const getTimeSlotsForDate = (date: number): TimeSlot[] => {
    const baseSlots: TimeSlot[] = [
      { time: '8:00 AM', status: 'available' },
      { time: '9:00 AM', status: 'available' },
      { time: '10:00 AM', status: 'available' },
      { time: '11:00 AM', status: 'available' },
      { time: '12:00 PM', status: 'break' },
      { time: '1:00 PM', status: 'available' },
      { time: '2:00 PM', status: 'available' },
      { time: '3:00 PM', status: 'available' },
      { time: '4:00 PM', status: 'available' },
      { time: '5:00 PM', status: 'available' },
      { time: '6:00 PM', status: 'available' },
      { time: '7:00 PM', status: 'available' },
      { time: '8:00 PM', status: 'available' },
    ];

    // Add some booked slots for specific dates
    if (date === 20) {
      baseSlots[1] = { time: '10:00 AM', status: 'booked', client: 'John Smith' };
      baseSlots[5] = { time: '2:00 PM', status: 'booked', client: 'Sarah Johnson' };
      baseSlots[7] = { time: '4:00 PM', status: 'booked', client: 'Michael Brown' };
    } else if (date === 21) {
      baseSlots[2] = { time: '11:00 AM', status: 'booked', client: 'Emily Davis' };
      baseSlots[6] = { time: '3:00 PM', status: 'booked', client: 'Robert Wilson' };
    } else if (date === 22) {
      baseSlots[0] = { time: '9:00 AM', status: 'booked', client: 'Lisa Anderson' };
      baseSlots[4] = { time: '1:00 PM', status: 'booked', client: 'David Lee' };
    }

    return baseSlots;
  };

  const timeSlots = getTimeSlotsForDate(selectedDate);

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'booked':
        return { bg: '#0D6EFD', text: '#FFFFFF' };
      case 'break':
        return { bg: '#FFC107', text: '#FFFFFF' };
      default:
        return { bg: '#F8F9FA', text: '#495057' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.secondary }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Schedule</Text>
        <TouchableOpacity>
          <MaterialIcons name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.monthHeader, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          onPress={() => setCurrentMonthIndex(prev => Math.max(0, prev - 1))}
          disabled={currentMonthIndex === 0}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name="chevron-left" 
            size={28} 
            color={currentMonthIndex === 0 ? (darkMode ? '#4B5563' : '#CCC') : colors.text} 
          />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: colors.text }]}>{currentMonth}</Text>
        <TouchableOpacity 
          onPress={() => setCurrentMonthIndex(prev => Math.min(months.length - 1, prev + 1))}
          disabled={currentMonthIndex === months.length - 1}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name="chevron-right" 
            size={28} 
            color={currentMonthIndex === months.length - 1 ? (darkMode ? '#4B5563' : '#CCC') : colors.text} 
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.datesContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dates.map((date) => (
            <TouchableOpacity
              key={date.day}
              style={[
                styles.dateCard,
                { backgroundColor: colors.secondary },
                selectedDate === date.day && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleDateSelect(date.day)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: darkMode ? '#9CA3AF' : '#6C757D' },
                  selectedDate === date.day && styles.dayNameActive,
                ]}
              >
                {date.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  { color: colors.text },
                  selectedDate === date.day && styles.dayNumberActive,
                ]}
              >
                {date.day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statBox}>
          <MaterialIcons name="event-available" size={24} color="#28A745" />
          <View style={styles.statTextBox}>
            <Text style={[styles.statValue, { color: colors.text }]}>6</Text>
            <Text style={[styles.statLabel, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>Available</Text>
          </View>
        </View>
        <View style={styles.statBox}>
          <MaterialIcons name="event-busy" size={24} color={colors.primary} />
          <View style={styles.statTextBox}>
            <Text style={[styles.statValue, { color: colors.text }]}>3</Text>
            <Text style={[styles.statLabel, { color: darkMode ? '#9CA3AF' : '#6C757D' }]}>Booked</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Time Slots</Text>
        {timeSlots.map((slot, index) => {
          const slotColors = getSlotColor(slot.status);
          return (
            <TouchableOpacity
              key={index}
              style={[styles.timeSlot, { backgroundColor: slotColors.bg }]}
            >
              <View style={styles.timeSlotLeft}>
                <Text style={[styles.timeText, { color: slotColors.text }]}>
                  {slot.time}
                </Text>
                {slot.status === 'booked' && (
                  <View style={styles.clientInfo}>
                    <MaterialIcons name="person" size={16} color="#FFFFFF" />
                    <Text style={styles.clientName}>{slot.client}</Text>
                  </View>
                )}
                {slot.status === 'break' && (
                  <Text style={styles.breakText}>Lunch Break</Text>
                )}
              </View>
              {slot.status === 'available' && (
                <TouchableOpacity 
                  style={[styles.bookButton, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Block Time', `Block ${slot.time}?`)}
                >
                  <Text style={styles.bookButtonText}>Block</Text>
                </TouchableOpacity>
              )}
              {slot.status === 'booked' && (
                <TouchableOpacity onPress={() => Alert.alert('Appointment', `View details for ${slot.client}`)}>
                  <MaterialIcons name="more-vert" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => Alert.alert('Add Slot', 'Add new time slot or appointment')}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  datesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  dateCard: {
    width: 60,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  dateCardActive: {
    backgroundColor: '#0D6EFD',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6C757D',
    marginBottom: 4,
  },
  dayNameActive: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  dayNumberActive: {
    color: '#FFFFFF',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTextBox: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  timeSlotLeft: {
    flex: 1,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  breakText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
  },
  bookButton: {
    backgroundColor: '#0D6EFD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D6EFD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ScheduleScreen;
