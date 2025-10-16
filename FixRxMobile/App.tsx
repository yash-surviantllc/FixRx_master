import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { navigationRef } from './src/navigation/navigationRef';
import ErrorBoundary from './src/components/ErrorBoundary';
import { sessionManager } from './src/utils/sessionManager';
import CrashPrevention from './src/utils/crashPrevention';
import { useWebSocket } from './src/hooks/useWebSocket';
import WebSocketTester from './src/utils/websocketTester';
import { webSocketAdapter } from './src/services/websocket/WebSocketAdapter';

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
  // Initialize WebSocket (don't auto-connect to avoid connection issues)
  const webSocket = useWebSocket(false);

  // Initialize crash prevention and session manager
  useEffect(() => {
    // Initialize crash prevention systems
    CrashPrevention.initialize();
    
    if (__DEV__) {
      sessionManager.initializeDevSessionClearing();
      
      WebSocketTester.enableDevTools();
      
      (global as any).wsAdapter = {
        switch: (impl: 'original' | 'enhanced') => {
          webSocketAdapter.switchImplementation(impl);
          console.log(`Switched to ${impl} implementation`);
        },
        status: () => console.log('WebSocket Status:', webSocketAdapter.getStatus()),
        test: () => webSocketAdapter.connect(),
        testBoth: () => webSocketAdapter.testBothImplementations(),
      };
      
      // console.log('WebSocket Status:', webSocket.status);
    }
  }, [webSocket.status]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="auto" />
              <Stack.Navigator 
            initialRouteName="Welcome"
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
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
            />
            <Stack.Screen 
              name="EmailConfirmation" 
              component={EmailConfirmationScreen} 
            />
            <Stack.Screen 
              name="PhoneAuth" 
              component={PhoneAuthScreen} 
            />
            <Stack.Screen 
              name="UserType" 
              component={UserTypeSelectionScreen} 
            />
            
            {/* Consumer Onboarding */}
            <Stack.Screen 
              name="ConsumerProfile" 
              component={ConsumerProfileSetupScreen} 
            />
            
            {/* Vendor Onboarding */}
            <Stack.Screen 
              name="VendorProfileSetup" 
              component={VendorProfileSetupScreen} 
            />
            <Stack.Screen 
              name="VendorServiceSelection" 
              component={VendorServiceSelectionScreen} 
            />
            <Stack.Screen 
              name="VendorPortfolioUpload" 
              component={VendorPortfolioUploadScreen} 
            />
            
            {/* Main App */}
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs} 
              options={{
                gestureEnabled: false,
              }}
            />
            
            {/* Additional Screens */}
            <Stack.Screen 
              name="ContactSelection" 
              component={ContactSelectionScreen} 
            />
            <Stack.Screen 
              name="MessagePreview" 
              component={MessagePreviewScreen} 
            />
            <Stack.Screen 
              name="InvitationSuccess" 
              component={InvitationSuccessScreen} 
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="ContractorProfile" 
              component={ContractorProfileScreen} 
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen} 
            />
            <Stack.Screen 
              name="Messaging" 
              component={MessagingScreen} 
            />
            <Stack.Screen 
              name="Rating" 
              component={RatingScreen} 
            />
            <Stack.Screen 
              name="HelpCenter" 
              component={HelpCenterScreen} 
            />
            <Stack.Screen 
              name="AccountSettings" 
              component={AccountSettingsScreen} 
            />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
