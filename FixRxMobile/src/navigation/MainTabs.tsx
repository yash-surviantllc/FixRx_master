import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, MessageSquare, User } from 'lucide-react-native';
import { MainTabParamList } from '../types/navigation';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

// Screens
import ConsumerDashboard from '../screens/consumer/ConsumerDashboard';
import VendorDashboard from '../screens/vendor/VendorDashboard';
import ContractorsScreen from '../screens/consumer/ContractorsScreen';
import AllRecommendationsScreen from '../screens/AllRecommendationsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { userType } = useAppContext();
  const { colors, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <Home size={size} color={color} />;
          } else if (route.name === 'Contractors') {
            return <Search size={size} color={color} />;
          } else if (route.name === 'Messages') {
            return <MessageSquare size={size} color={color} />;
          } else if (route.name === 'Profile') {
            return <User size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={userType === 'vendor' ? VendorDashboard : ConsumerDashboard} 
      />
      <Tab.Screen 
        name="Contractors" 
        component={userType === 'vendor' ? AllRecommendationsScreen : ContractorsScreen} 
      />
      <Tab.Screen 
        name="Messages" 
        component={ChatListScreen} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
      />
    </Tab.Navigator>
  );
}

export default MainTabs;
