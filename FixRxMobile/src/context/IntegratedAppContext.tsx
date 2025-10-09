/**
 * Integrated App Context for FixRx Mobile
 * Connects all frontend functionality with backend services
 * Preserves existing UI while adding real backend integration
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserType } from '../types/navigation';
import { 
  authService, 
  consumerService, 
  vendorService, 
  integrationBridge,
  type AuthUser,
  type DashboardData,
  type VendorDashboardData 
} from '../services';

interface IntegratedAppContextType {
  // Original context properties (preserved)
  userEmail: string;
  setUserEmail: (email: string) => void;
  userType: UserType;
  setUserType: (type: UserType) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  selectedContacts: any[];
  setSelectedContacts: (contacts: any[]) => void;
  invitationType: 'contractors' | 'friends' | null;
  setInvitationType: (type: 'contractors' | 'friends' | null) => void;
  hasContactedContractor: boolean;
  setHasContactedContractor: (value: boolean) => void;
  notificationPermissionGranted: boolean;
  setNotificationPermissionGranted: (value: boolean) => void;
  selectedRequestId: string;
  setSelectedRequestId: (id: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;

  // Enhanced backend integration properties
  backendUser: AuthUser | null;
  isBackendConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Dashboard data
  consumerDashboard: DashboardData | null;
  vendorDashboard: VendorDashboardData | null;
  
  // Enhanced methods
  performLogin: (email: string, password: string) => Promise<boolean>;
  performLogout: () => Promise<void>;
  performRegistration: (userData: any) => Promise<boolean>;
  refreshDashboard: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<boolean>;
  
  // Search and recommendations
  searchVendors: (query: string, filters?: any) => Promise<any[]>;
  getRecommendations: () => Promise<any[]>;
}

const IntegratedAppContext = createContext<IntegratedAppContextType | undefined>(undefined);

export const IntegratedAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Original state (preserved)
  const [userEmail, setUserEmail] = useState('');
  const [userType, setUserType] = useState<UserType>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [invitationType, setInvitationType] = useState<'contractors' | 'friends' | null>(null);
  const [hasContactedContractor, setHasContactedContractor] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Enhanced backend integration state
  const [backendUser, setBackendUser] = useState<AuthUser | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consumerDashboard, setConsumerDashboard] = useState<DashboardData | null>(null);
  const [vendorDashboard, setVendorDashboard] = useState<VendorDashboardData | null>(null);

  // Initialize integration on app start
  useEffect(() => {
    initializeIntegration();
  }, []);

  const initializeIntegration = async () => {
    try {
      setIsLoading(true);
      
      // Initialize integration bridge
      await integrationBridge.initialize();
      
      // Check backend connection
      const status = integrationBridge.getStatus();
      setIsBackendConnected(status.isBackendConnected);
      
      // Check if user is already authenticated
      const isUserAuthenticated = await authService.isAuthenticated();
      if (isUserAuthenticated) {
        const storedUser = await authService.getStoredUser();
        if (storedUser) {
          setBackendUser(storedUser);
          setUserEmail(storedUser.email);
          setUserType(storedUser.userType as UserType);
          setIsAuthenticated(true);
          
          // Load dashboard data
          await refreshDashboard();
        }
      }
      
      console.log('✅ Integrated App Context initialized');
    } catch (error) {
      console.error('❌ Integration initialization failed:', error);
      setError('Failed to initialize app');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced login with backend integration
  const performLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await integrationBridge.performLogin(email, password);
      
      if (result.success && result.user) {
        // Update all state
        setBackendUser(result.user);
        setUserEmail(result.user.email);
        setUserType(result.user.userType as UserType);
        setIsAuthenticated(true);
        
        // Load dashboard data
        await refreshDashboard();
        
        console.log('✅ Login successful');
        return true;
      } else {
        setError(result.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      console.error('❌ Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced logout with backend integration
  const performLogout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      await integrationBridge.performLogout();
      
      // Clear all state
      setBackendUser(null);
      setUserEmail('');
      setUserType(null);
      setUserProfile(null);
      setSelectedContacts([]);
      setInvitationType(null);
      setHasContactedContractor(false);
      setNotificationPermissionGranted(false);
      setSelectedRequestId('');
      setIsAuthenticated(false);
      setConsumerDashboard(null);
      setVendorDashboard(null);
      setError(null);
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Force logout even if backend fails
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced registration with backend integration
  const performRegistration = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        setBackendUser(response.data.user);
        setUserEmail(response.data.user.email);
        setUserType(response.data.user.userType as UserType);
        setIsAuthenticated(true);
        
        console.log('✅ Registration successful');
        return true;
      } else {
        setError(response.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      console.error('❌ Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh dashboard data
  const refreshDashboard = async (): Promise<void> => {
    if (!isAuthenticated || !backendUser) return;
    
    try {
      if (backendUser.userType === 'consumer') {
        const dashboardData = await consumerService.getDashboard();
        if (dashboardData.success) {
          setConsumerDashboard(dashboardData.data);
        }
      } else if (backendUser.userType === 'vendor') {
        const dashboardData = await vendorService.getDashboard();
        if (dashboardData.success) {
          setVendorDashboard(dashboardData.data);
        }
      }
    } catch (error) {
      console.error('❌ Failed to refresh dashboard:', error);
    }
  };

  // Update user profile
  const updateProfile = async (profileData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await authService.getProfile();
      if (response.success) {
        setBackendUser(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Search vendors with backend integration
  const searchVendors = async (query: string, filters?: any): Promise<any[]> => {
    try {
      const response = await vendorService.searchVendors({ query, ...filters });
      if (response.success) {
        return response.data?.vendors || [];
      }
      return [];
    } catch (error) {
      console.error('❌ Vendor search failed:', error);
      return [];
    }
  };

  // Get recommendations
  const getRecommendations = async (): Promise<any[]> => {
    try {
      const response = await consumerService.getRecommendations();
      if (response.success) {
        return response.data?.vendors || [];
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to get recommendations:', error);
      return [];
    }
  };

  // Original logout method (preserved for compatibility)
  const logout = () => {
    performLogout();
  };

  const value: IntegratedAppContextType = {
    // Original properties (preserved)
    userEmail,
    setUserEmail,
    userType,
    setUserType,
    userProfile,
    setUserProfile,
    selectedContacts,
    setSelectedContacts,
    invitationType,
    setInvitationType,
    hasContactedContractor,
    setHasContactedContractor,
    notificationPermissionGranted,
    setNotificationPermissionGranted,
    selectedRequestId,
    setSelectedRequestId,
    isAuthenticated,
    setIsAuthenticated,
    logout,

    // Enhanced backend integration
    backendUser,
    isBackendConnected,
    isLoading,
    error,
    consumerDashboard,
    vendorDashboard,
    performLogin,
    performLogout,
    performRegistration,
    refreshDashboard,
    updateProfile,
    searchVendors,
    getRecommendations,
  };

  return (
    <IntegratedAppContext.Provider value={value}>
      {children}
    </IntegratedAppContext.Provider>
  );
};

export const useIntegratedAppContext = () => {
  const context = useContext(IntegratedAppContext);
  if (context === undefined) {
    throw new Error('useIntegratedAppContext must be used within an IntegratedAppProvider');
  }
  return context;
};

// Export both hooks for compatibility
export const useAppContext = useIntegratedAppContext;
