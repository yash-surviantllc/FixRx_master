import React, { Suspense } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { navigationRef } from './src/navigation/navigationRef';
import LoadingScreen from './src/components/LoadingScreen';

// Auth Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import EmailAuthScreen from './src/screens/auth/EmailAuthScreen';
import EmailConfirmationScreen from './src/screens/auth/EmailConfirmationScreen';
import UserTypeSelectionScreen from './src/screens/auth/UserTypeSelectionScreen';
import PhoneAuthScreen from './src/screens/auth/PhoneAuthScreen';

// Consumer Screens
import ConsumerProfileSetupScreen from './src/screens/consumer/ConsumerProfileSetupScreen';

// Vendor Screens
import VendorProfileSetupScreen from './src/screens/vendor/VendorProfileSetupScreen';
import VendorServiceSelectionScreen from './src/screens/vendor/VendorServiceSelectionScreen';
import VendorPortfolioUploadScreen from './src/screens/vendor/VendorPortfolioUploadScreen';

// Main App Navigation
import MainTabs from './src/navigation/MainTabs';
import ContactSelectionScreen from './src/screens/ContactSelectionScreen';
import MessagePreviewScreen from './src/screens/MessagePreviewScreen';
import InvitationSuccessScreen from './src/screens/InvitationSuccessScreen';
import ContractorProfileScreen from './src/screens/ContractorProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import MessagingScreen from './src/screens/MessagingScreen';
import RatingScreen from './src/screens/RatingScreen';
import HelpCenterScreen from './src/screens/HelpCenterScreen';
import AccountSettingsScreen from './src/screens/AccountSettingsScreen';

// Create a stack navigator
const Stack = createNativeStackNavigator();

// Main App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="auto" />
            <Stack.Navigator 
            initialRouteName="Welcome"
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}
          >
            {/* Auth Flow */}
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen} 
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen 
              name="EmailAuth" 
              component={EmailAuthScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="EmailConfirmation" 
              component={EmailConfirmationScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="PhoneAuth" 
              component={PhoneAuthScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="UserType" 
              component={UserTypeSelectionScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            
            {/* Consumer Onboarding */}
            <Stack.Screen 
              name="ConsumerProfile" 
              component={ConsumerProfileSetupScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            
            {/* Vendor Onboarding */}
            <Stack.Screen 
              name="VendorProfileSetup" 
              component={VendorProfileSetupScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="VendorServiceSelection" 
              component={VendorServiceSelectionScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="VendorPortfolioUpload" 
              component={VendorPortfolioUploadScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            
            {/* Main App */}
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs} 
              options={{
                gestureEnabled: false,
                animation: 'fade',
              }}
            />
            
            {/* Additional Screens */}
            <Stack.Screen 
              name="ContactSelection" 
              component={ContactSelectionScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="MessagePreview" 
              component={MessagePreviewScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="InvitationSuccess" 
              component={InvitationSuccessScreen} 
              options={{
                gestureEnabled: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen 
              name="ContractorProfile" 
              component={ContractorProfileScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="Messaging" 
              component={MessagingScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="Rating" 
              component={RatingScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="HelpCenter" 
              component={HelpCenterScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="AccountSettings" 
              component={AccountSettingsScreen} 
              options={{
                gestureEnabled: true,
                animation: 'slide_from_right',
              }}
            />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
