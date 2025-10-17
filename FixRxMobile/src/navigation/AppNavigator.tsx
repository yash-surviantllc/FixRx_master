import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAppContext } from '../context/AppContext';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import UserTypeSelectionScreen from '../screens/auth/UserTypeSelectionScreen';
import EmailAuthScreen from '../screens/auth/EmailAuthScreen';
import ConsumerProfileSetupScreen from '../screens/consumer/ConsumerProfileSetupScreen';
import VendorProfileSetupScreen from '../screens/vendor/VendorProfileSetupScreen';
import MainTabs from './MainTabs';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AllRecommendationsScreen from '../screens/AllRecommendationsScreen';
import ContactSelectionScreen from '../screens/ContactSelectionScreen';
import MessagePreviewScreen from '../screens/MessagePreviewScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isAuthenticated } = useAppContext();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="UserType" component={UserTypeSelectionScreen} />
            <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
            <Stack.Screen name="ConsumerProfile" component={ConsumerProfileSetupScreen} />
            <Stack.Screen name="VendorProfileSetup" component={VendorProfileSetupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ContactSelection" component={ContactSelectionScreen} />
            <Stack.Screen name="MessagePreview" component={MessagePreviewScreen} />
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="AllRecommendations" component={AllRecommendationsScreen} />
            <Stack.Screen 
              name="HelpCenter" 
              component={HelpCenterScreen} 
              options={{
                headerShown: true,
                title: 'Help Center',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerTintColor: '#000',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
