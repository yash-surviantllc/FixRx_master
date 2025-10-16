import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserType } from '../types/navigation';
import { authService } from '../services/authService';
import deepLinkHandler, { DeepLinkParams } from '../utils/deepLinkHandler';
import { resetTo } from '../navigation/navigationRef';

interface AppContextType {
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
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isAuthLoading: boolean;
  authenticateUser: (
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      userType?: string | null;
      phone?: string;
      profileImage?: string;
      avatar?: string;
      metroArea?: string;
    },
    options?: { isNewUser?: boolean }
  ) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userEmail, setUserEmail] = useState('');
  const [userType, setUserType] = useState<UserType>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [invitationType, setInvitationType] = useState<'contractors' | 'friends' | null>(null);
  const [hasContactedContractor, setHasContactedContractor] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const hydrateUserProfile = (profile: Partial<UserProfile> & { email: string; id: string }) => {
    setUserProfile((prev) => ({
      id: profile.id,
      firstName: profile.firstName || prev?.firstName || '',
      lastName: profile.lastName || prev?.lastName || '',
      email: profile.email,
      phone: profile.phone || prev?.phone,
      userType: (profile.userType as UserType) ?? prev?.userType ?? null,
      avatar: profile.avatar || prev?.avatar,
      profileImage: profile.profileImage || prev?.profileImage,
      businessName: profile.businessName || prev?.businessName,
      metroArea: profile.metroArea || prev?.metroArea,
      services: profile.services || prev?.services,
      portfolio: profile.portfolio || prev?.portfolio,
    }));
  };

  const handleAuthenticatedUser = async (
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      userType?: string | null;
      phone?: string;
      profileImage?: string;
      avatar?: string;
      metroArea?: string;
    },
    options?: { isNewUser?: boolean }
  ) => {
    const normalizedUserType = user.userType ? (user.userType.toLowerCase() as UserType) : null;
    setUserEmail(user.email);
    setUserType(options?.isNewUser ? null : normalizedUserType);
    hydrateUserProfile({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: options?.isNewUser ? null : normalizedUserType,
      phone: user.phone,
      profileImage: user.profileImage,
      avatar: user.avatar,
      metroArea: user.metroArea,
    });
    setIsAuthenticated(true);

    if (options?.isNewUser || !normalizedUserType) {
      resetTo('UserType');
    } else {
      resetTo('MainTabs');
    }
  };

  useEffect(() => {
    let removeListener: (() => void) | undefined;
    let cleanupLinking: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        setIsAuthLoading(true);
        await authService.initialize();
        const authed = await authService.isAuthenticated();
        if (authed) {
          const profileResponse = await authService.getProfile();
          if (profileResponse.success && profileResponse.data) {
            await handleAuthenticatedUser(profileResponse.data, { isNewUser: false });
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    // Deep link verification is now handled by deepLinkHandler itself
    // No need for additional listener here
    
    initializeAuth();
    cleanupLinking = deepLinkHandler.initialize();

    return () => {
      cleanupLinking?.();
    };
  }, []);

  const logout = async () => {
    try {
      setIsAuthLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUserEmail('');
      setUserType(null);
      setUserProfile(null);
      setSelectedContacts([]);
      setInvitationType(null);
      setHasContactedContractor(false);
      setNotificationPermissionGranted(false);
      setSelectedRequestId('');
      setIsAuthenticated(false);
      setIsAuthLoading(false);
      resetTo('Welcome');
    }
  };

  return (
    <AppContext.Provider
      value={{
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
        logout,
        isAuthenticated,
        setIsAuthenticated,
        isAuthLoading,
        authenticateUser: handleAuthenticatedUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
