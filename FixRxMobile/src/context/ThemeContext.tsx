import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  primaryText: string;
  secondaryText: string;
  border: string;
  inputBackground: string;
  cardBackground: string;
  headerBackground: string;
  tabBarBackground: string;
  tabBarBorder: string;
  success: string;
  warning: string;
  error: string;
  notification: string;
}

interface Theme {
  dark: boolean;
  colors: ThemeColors;
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    primary: '#3B82F6',
    primaryText: '#1F2937',
    secondaryText: '#6B7280',
    border: '#E5E7EB',
    inputBackground: '#F3F4F6',
    cardBackground: '#FFFFFF',
    headerBackground: '#FFFFFF',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    notification: '#EF4444',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#0F172A',
    surface: '#1E293B',
    primary: '#3B82F6',
    primaryText: '#F1F5F9',
    secondaryText: '#94A3B8',
    border: '#334155',
    inputBackground: '#1E293B',
    cardBackground: '#1E293B',
    headerBackground: '#0F172A',
    tabBarBackground: '#0F172A',
    tabBarBorder: '#334155',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    notification: '#EF4444',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        isDarkMode, 
        toggleTheme,
        colors: theme.colors 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
