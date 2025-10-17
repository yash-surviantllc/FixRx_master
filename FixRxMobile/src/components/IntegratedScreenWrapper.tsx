/**
 * Integrated Screen Wrapper for FixRx Mobile
 * Provides backend integration to existing screens without modification
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useIntegratedAppContext } from '../context/IntegratedAppContext';

interface IntegratedScreenWrapperProps {
  children: React.ReactNode;
  screenName: string;
  requiresAuth?: boolean;
  requiresData?: 'consumer' | 'vendor' | 'both' | 'none';
  onDataLoad?: (data: any) => void;
}

export const IntegratedScreenWrapper: React.FC<IntegratedScreenWrapperProps> = ({
  children,
  screenName,
  requiresAuth = false,
  requiresData = 'none',
  onDataLoad
}) => {
  const {
    isAuthenticated,
    isBackendConnected,
    isLoading,
    error,
    backendUser,
    consumerDashboard,
    vendorDashboard,
    refreshDashboard
  } = useIntegratedAppContext();

  const [screenLoading, setScreenLoading] = useState(false);
  const [screenData, setScreenData] = useState<any>(null);

  useEffect(() => {
    loadScreenData();
  }, [isAuthenticated, backendUser, screenName]);

  const loadScreenData = async () => {
    if (requiresAuth && !isAuthenticated) return;
    if (requiresData === 'none') return;

    try {
      setScreenLoading(true);

      let data = null;
      
      if (requiresData === 'consumer' && backendUser?.userType === 'consumer') {
        if (!consumerDashboard) {
          await refreshDashboard();
        }
        data = consumerDashboard;
      } else if (requiresData === 'vendor' && backendUser?.userType === 'vendor') {
        if (!vendorDashboard) {
          await refreshDashboard();
        }
        data = vendorDashboard;
      } else if (requiresData === 'both') {
        if (backendUser?.userType === 'consumer') {
          data = consumerDashboard;
        } else if (backendUser?.userType === 'vendor') {
          data = vendorDashboard;
        }
      }

      setScreenData(data);
      
      if (onDataLoad && data) {
        onDataLoad(data);
      }

      console.log(`✅ Screen data loaded for ${screenName}`);
    } catch (error) {
      console.error(`❌ Failed to load data for ${screenName}:`, error);
    } finally {
      setScreenLoading(false);
    }
  };

  // Show loading if screen is loading or app is loading
  if (isLoading || screenLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading {screenName}...</Text>
      </View>
    );
  }

  // Show error if there's an error
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorSubtext}>Using offline mode</Text>
        {children}
      </View>
    );
  }

  // Show connection status for debugging
  if (__DEV__ && !isBackendConnected) {
    console.log(`⚠️ ${screenName}: Backend not connected, using fallback data`);
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  errorSubtext: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
});
