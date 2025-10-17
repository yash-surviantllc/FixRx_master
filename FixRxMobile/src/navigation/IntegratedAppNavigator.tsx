/**
 * Integrated App Navigator for FixRx Mobile
 * Enhanced navigation with backend integration
 * Preserves all original screens and navigation flow
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useIntegratedAppContext } from '../context/IntegratedAppContext';
import { IntegratedScreenWrapper } from '../components/IntegratedScreenWrapper';

// Import all original screens (preserved)
import WelcomeScreen from '../screens/WelcomeScreen';
import UserTypeSelectionScreen from '../screens/auth/UserTypeSelectionScreen';
import EmailAuthScreen from '../screens/auth/EmailAuthScreen';
import EmailConfirmationScreen from '../screens/auth/EmailConfirmationScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import ConsumerProfileSetupScreen from '../screens/consumer/ConsumerProfileSetupScreen';
import VendorProfileSetupScreen from '../screens/vendor/VendorProfileSetupScreen';
import VendorServiceSelectionScreen from '../screens/vendor/VendorServiceSelectionScreen';
import VendorPortfolioUploadScreen from '../screens/vendor/VendorPortfolioUploadScreen';
import MainTabs from './MainTabs';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AllRecommendationsScreen from '../screens/AllRecommendationsScreen';
import ContractorsScreen from '../screens/consumer/ContractorsScreen';
import ContactSelectionScreen from '../screens/ContactSelectionScreen';
import MessagePreviewScreen from '../screens/MessagePreviewScreen';
import InvitationSuccessScreen from '../screens/InvitationSuccessScreen';
import MessagingScreen from '../screens/MessagingScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import RatingScreen from '../screens/RatingScreen';
import ContractorProfileScreen from '../screens/ContractorProfileScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Enhanced screen components with integration
const IntegratedEmailAuthScreen = () => (
  <IntegratedScreenWrapper screenName="EmailAuth" requiresAuth={false}>
    <EmailAuthScreen />
  </IntegratedScreenWrapper>
);

const IntegratedMainTabs = () => (
  <IntegratedScreenWrapper 
    screenName="MainTabs" 
    requiresAuth={true} 
    requiresData="both"
  >
    <MainTabs />
  </IntegratedScreenWrapper>
);

const IntegratedProfileScreen = () => (
  <IntegratedScreenWrapper 
    screenName="Profile" 
    requiresAuth={true}
  >
    <ProfileScreen />
  </IntegratedScreenWrapper>
);

const IntegratedContractorsScreen = () => (
  <IntegratedScreenWrapper 
    screenName="Contractors" 
    requiresAuth={true}
    requiresData="consumer"
  >
    <ContractorsScreen />
  </IntegratedScreenWrapper>
);

const IntegratedAllRecommendationsScreen = () => (
  <IntegratedScreenWrapper 
    screenName="AllRecommendations" 
    requiresAuth={true}
    requiresData="consumer"
  >
    <AllRecommendationsScreen />
  </IntegratedScreenWrapper>
);

const IntegratedRatingScreen = () => (
  <IntegratedScreenWrapper 
    screenName="Rating" 
    requiresAuth={true}
  >
    <RatingScreen />
  </IntegratedScreenWrapper>
);

const IntegratedChatListScreen = () => (
  <IntegratedScreenWrapper 
    screenName="ChatList" 
    requiresAuth={true}
  >
    <ChatListScreen />
  </IntegratedScreenWrapper>
);

function IntegratedAppNavigator() {
  const { isAuthenticated, isLoading } = useIntegratedAppContext();

  // Show loading screen during initialization
  if (isLoading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={PlaceholderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Authentication Flow (preserved)
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="UserType" component={UserTypeSelectionScreen} />
            <Stack.Screen name="EmailAuth" component={IntegratedEmailAuthScreen} />
            <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
            <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
            <Stack.Screen name="ConsumerProfile" component={ConsumerProfileSetupScreen} />
            <Stack.Screen name="VendorProfileSetup" component={VendorProfileSetupScreen} />
            <Stack.Screen name="VendorServiceSelection" component={VendorServiceSelectionScreen} />
            <Stack.Screen name="VendorPortfolioUpload" component={VendorPortfolioUploadScreen} />
          </>
        ) : (
          // Authenticated Flow (enhanced with integration)
          <>
            <Stack.Screen name="MainTabs" component={IntegratedMainTabs} />
            <Stack.Screen name="ContactSelection" component={ContactSelectionScreen} />
            <Stack.Screen name="MessagePreview" component={MessagePreviewScreen} />
            <Stack.Screen name="InvitationSuccess" component={InvitationSuccessScreen} />
            <Stack.Screen name="ChatList" component={IntegratedChatListScreen} />
            <Stack.Screen name="AllRecommendations" component={IntegratedAllRecommendationsScreen} />
            <Stack.Screen name="Contractors" component={IntegratedContractorsScreen} />
            <Stack.Screen name="Profile" component={IntegratedProfileScreen} />
            <Stack.Screen name="Messaging" component={MessagingScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <Stack.Screen name="Rating" component={IntegratedRatingScreen} />
            <Stack.Screen name="ContractorProfile" component={ContractorProfileScreen} />
            <Stack.Screen 
              name="HelpCenter" 
              component={HelpCenterScreen} 
              options={{
                headerShown: true,
                title: 'Help Center',
                headerBackTitle: 'Back',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default IntegratedAppNavigator;
