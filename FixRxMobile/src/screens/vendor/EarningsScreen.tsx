import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  customerName: string;
  service: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
}

const EarningsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  const darkMode = theme === 'dark';
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const handleGoBack = React.useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const stats = {
    totalEarnings: 4235,
    thisMonth: 1245,
    pending: 320,
    lastPayout: 890,
  };

  const transactions: Transaction[] = [
    {
      id: '1',
      customerName: 'John Smith',
      service: 'AC Repair',
      date: 'Dec 20, 2024',
      amount: 120,
      status: 'completed',
    },
    {
      id: '2',
      customerName: 'Sarah Johnson',
      service: 'AC Maintenance',
      date: 'Dec 19, 2024',
      amount: 89,
      status: 'completed',
    },
    {
      id: '3',
      customerName: 'Michael Brown',
      service: 'Plumbing Repair',
      date: 'Dec 18, 2024',
      amount: 150,
      status: 'processing',
    },
    {
      id: '4',
      customerName: 'Emily Davis',
      service: 'Electrical Work',
      date: 'Dec 17, 2024',
      amount: 200,
      status: 'pending',
    },
  ];

  const periods = [
    { key: 'week' as const, label: 'Week' },
    { key: 'month' as const, label: 'Month' },
    { key: 'year' as const, label: 'Year' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#D4EDDA', text: '#155724' };
      case 'pending':
        return { bg: '#FFF3CD', text: '#856404' };
      case 'processing':
        return { bg: '#D1ECF1', text: '#0C5460' };
      default:
        return { bg: '#E9ECEF', text: '#495057' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Earnings</Text>
        <TouchableOpacity>
          <MaterialIcons name="file-download" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total Earnings Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalHeader}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <View style={styles.periodSelector}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.key && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      selectedPeriod === period.key && styles.periodTextActive,
                    ]}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Text style={styles.totalAmount}>${stats.totalEarnings.toLocaleString()}</Text>
          <Text style={styles.totalSubtext}>
            +12.5% from last {selectedPeriod}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E7F5FF' }]}>
              <MaterialIcons name="trending-up" size={24} color="#0D6EFD" />
            </View>
            <Text style={styles.statValue}>${stats.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3CD' }]}>
              <MaterialIcons name="schedule" size={24} color="#FFC107" />
            </View>
            <Text style={styles.statValue}>${stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D4EDDA' }]}>
              <MaterialIcons name="account-balance-wallet" size={24} color="#28A745" />
            </View>
            <Text style={styles.statValue}>${stats.lastPayout}</Text>
            <Text style={styles.statLabel}>Last Payout</Text>
          </View>
        </View>

        {/* Payout Button */}
        <TouchableOpacity 
          style={styles.payoutButton}
          onPress={() => Alert.alert('Request Payout', `Request payout of $${stats.pending}?`)}
        >
          <MaterialIcons name="payments" size={20} color="#FFFFFF" />
          <Text style={styles.payoutButtonText}>Request Payout</Text>
        </TouchableOpacity>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => Alert.alert('All Transactions', 'View all transaction history')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {transactions.map((transaction) => {
            const statusColors = getStatusColor(transaction.status);
            
            return (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionIcon}>
                    <MaterialIcons name="receipt" size={20} color="#0D6EFD" />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionCustomer}>
                      {transaction.customerName}
                    </Text>
                    <Text style={styles.transactionService}>{transaction.service}</Text>
                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>
                    +${transaction.amount}
                  </Text>
                  <View
                    style={[
                      styles.transactionStatus,
                      { backgroundColor: statusColors.bg },
                    ]}
                  >
                    <Text style={[styles.transactionStatusText, { color: statusColors.text }]}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Chart Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
          <View style={styles.chartPlaceholder}>
            <MaterialIcons name="show-chart" size={48} color="#ADB5BD" />
            <Text style={styles.chartPlaceholderText}>
              Chart visualization coming soon
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
  },
  totalCard: {
    backgroundColor: '#0D6EFD',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  periodTextActive: {
    color: '#0D6EFD',
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28A745',
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0D6EFD',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E7F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  transactionService: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28A745',
    marginBottom: 4,
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  transactionStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginTop: 12,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
  },
});

export default EarningsScreen;
