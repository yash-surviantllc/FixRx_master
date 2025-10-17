/**
 * Analytics Dashboard Screen
 * Comprehensive analytics and reporting for users and vendors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  userAnalytics?: any;
  vendorAnalytics?: any;
  performanceMetrics?: any;
  businessMetrics?: any;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

const AnalyticsDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [userType, setUserType] = useState<'consumer' | 'vendor'>('consumer');

  const timeRanges = [
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
  ];

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load different analytics based on user type
      const promises = [];
      
      if (userType === 'consumer') {
        promises.push(
          apiService.get(`/analytics/user?timeRange=${selectedTimeRange}`),
          apiService.get(`/analytics/business?timeRange=${selectedTimeRange}`)
        );
      } else {
        promises.push(
          apiService.get(`/analytics/vendor?timeRange=${selectedTimeRange}`),
          apiService.get(`/analytics/performance?timeRange=${selectedTimeRange}`)
        );
      }

      const results = await Promise.all(promises);
      
      setAnalyticsData({
        userAnalytics: results[0]?.data?.data,
        vendorAnalytics: userType === 'vendor' ? results[0]?.data?.data : null,
        performanceMetrics: results[1]?.data?.data,
        businessMetrics: userType === 'consumer' ? results[1]?.data?.data : null,
      });

    } catch (error) {
      console.error('Failed to load analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const renderMetricCard = (metric: MetricCard) => (
    <View key={metric.title} style={styles.metricCard}>
      <LinearGradient
        colors={[metric.color, `${metric.color}80`]}
        style={styles.metricGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.metricHeader}>
          <Ionicons name={metric.icon as any} size={24} color="#FFFFFF" />
          {metric.change !== undefined && (
            <View style={[
              styles.trendBadge,
              { backgroundColor: metric.trend === 'up' ? '#34C759' : metric.trend === 'down' ? '#FF3B30' : '#8E8E93' }
            ]}>
              <Ionicons 
                name={metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'remove'} 
                size={12} 
                color="#FFFFFF" 
              />
              <Text style={styles.trendText}>{Math.abs(metric.change)}%</Text>
            </View>
          )}
        </View>
        <Text style={styles.metricValue}>{metric.value}</Text>
        <Text style={styles.metricTitle}>{metric.title}</Text>
      </LinearGradient>
    </View>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {timeRanges.map((range) => (
        <TouchableOpacity
          key={range.value}
          style={[
            styles.timeRangeButton,
            selectedTimeRange === range.value && styles.timeRangeButtonActive
          ]}
          onPress={() => setSelectedTimeRange(range.value)}
        >
          <Text style={[
            styles.timeRangeText,
            selectedTimeRange === range.value && styles.timeRangeTextActive
          ]}>
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUserTypeSelector = () => (
    <View style={styles.userTypeContainer}>
      <TouchableOpacity
        style={[
          styles.userTypeButton,
          userType === 'consumer' && styles.userTypeButtonActive
        ]}
        onPress={() => setUserType('consumer')}
      >
        <Text style={[
          styles.userTypeText,
          userType === 'consumer' && styles.userTypeTextActive
        ]}>
          Consumer
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.userTypeButton,
          userType === 'vendor' && styles.userTypeButtonActive
        ]}
        onPress={() => setUserType('vendor')}
      >
        <Text style={[
          styles.userTypeText,
          userType === 'vendor' && styles.userTypeTextActive
        ]}>
          Vendor
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getConsumerMetrics = (): MetricCard[] => {
    const data = analyticsData.userAnalytics || {};
    const business = analyticsData.businessMetrics || {};
    
    return [
      {
        title: 'Total Sessions',
        value: data.summary?.totalSessions || 0,
        change: 12.5,
        trend: 'up',
        icon: 'time',
        color: '#007AFF'
      },
      {
        title: 'Invitations Sent',
        value: data.summary?.totalEvents || 0,
        change: -2.3,
        trend: 'down',
        icon: 'mail',
        color: '#34C759'
      },
      {
        title: 'Vendors Connected',
        value: business.summary?.daily_active_users?.current || 0,
        change: 8.7,
        trend: 'up',
        icon: 'people',
        color: '#FF9500'
      },
      {
        title: 'Avg Session Time',
        value: `${data.summary?.avgSessionDuration || 0}m`,
        change: 15.2,
        trend: 'up',
        icon: 'stopwatch',
        color: '#5856D6'
      }
    ];
  };

  const getVendorMetrics = (): MetricCard[] => {
    const data = analyticsData.vendorAnalytics || {};
    
    return [
      {
        title: 'Average Rating',
        value: data.summary?.avgRating?.toFixed(1) || '0.0',
        change: 5.2,
        trend: 'up',
        icon: 'star',
        color: '#FF9500'
      },
      {
        title: 'Total Reviews',
        value: data.summary?.totalRatings || 0,
        change: 18.3,
        trend: 'up',
        icon: 'chatbubble',
        color: '#34C759'
      },
      {
        title: 'Acceptance Rate',
        value: `${data.summary?.invitationAcceptanceRate || 0}%`,
        change: -1.2,
        trend: 'down',
        icon: 'checkmark-circle',
        color: '#007AFF'
      },
      {
        title: 'Performance Score',
        value: data.summary?.performanceScore?.toFixed(0) || '0',
        change: 7.8,
        trend: 'up',
        icon: 'trending-up',
        color: '#5856D6'
      }
    ];
  };

  const renderChartPlaceholder = (title: string, height: number = 200) => (
    <View style={[styles.chartContainer, { height }]}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartPlaceholder}>
        <Ionicons name="bar-chart" size={48} color="#C7C7CC" />
        <Text style={styles.chartPlaceholderText}>Chart visualization coming soon</Text>
      </View>
    </View>
  );

  const renderEngagementMetrics = () => {
    const data = analyticsData.userAnalytics || {};
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Engagement Overview</Text>
        <View style={styles.engagementGrid}>
          <View style={styles.engagementItem}>
            <Text style={styles.engagementValue}>{data.summary?.totalEvents || 0}</Text>
            <Text style={styles.engagementLabel}>Total Events</Text>
          </View>
          <View style={styles.engagementItem}>
            <Text style={styles.engagementValue}>{data.summary?.totalSessions || 0}</Text>
            <Text style={styles.engagementLabel}>Sessions</Text>
          </View>
          <View style={styles.engagementItem}>
            <Text style={styles.engagementValue}>{data.summary?.avgSessionDuration || 0}m</Text>
            <Text style={styles.engagementLabel}>Avg Duration</Text>
          </View>
          <View style={styles.engagementItem}>
            <Text style={styles.engagementValue}>{data.summary?.mostActiveDay || 'N/A'}</Text>
            <Text style={styles.engagementLabel}>Most Active</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const metrics = userType === 'consumer' ? getConsumerMetrics() : getVendorMetrics();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Type Selector */}
        {renderUserTypeSelector()}

        {/* Time Range Selector */}
        {renderTimeRangeSelector()}

        {/* Metric Cards */}
        <View style={styles.metricsGrid}>
          {metrics.map(renderMetricCard)}
        </View>

        {/* Engagement Metrics */}
        {userType === 'consumer' && renderEngagementMetrics()}

        {/* Charts Section */}
        <View style={styles.chartsSection}>
          {userType === 'consumer' ? (
            <>
              {renderChartPlaceholder('Activity Trends')}
              {renderChartPlaceholder('Invitation Success Rate')}
            </>
          ) : (
            <>
              {renderChartPlaceholder('Rating Trends')}
              {renderChartPlaceholder('Performance Metrics')}
            </>
          )}
        </View>

        {/* Detailed Analytics Button */}
        <TouchableOpacity
          style={styles.detailedButton}
          onPress={() => navigation.navigate('DetailedAnalytics', { userType, timeRange: selectedTimeRange })}
        >
          <Text style={styles.detailedButtonText}>View Detailed Analytics</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  userTypeContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  userTypeTextActive: {
    color: '#007AFF',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 32) / 2,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  metricGradient: {
    padding: 16,
    minHeight: 120,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  engagementItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  engagementValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  engagementLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  chartsSection: {
    paddingHorizontal: 16,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  detailedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
  },
  detailedButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
});

export default AnalyticsDashboardScreen;
