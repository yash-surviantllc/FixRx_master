import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  showClearButton?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  containerStyle,
  inputStyle,
  showClearButton = true,
  autoFocus = false,
  onFocus,
  onBlur,
}) => {
  const { colors, isDarkMode } = useTheme();

  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? colors.surface : '#F3F4F6',
          borderColor: isDarkMode ? colors.border : '#E5E7EB',
        },
        containerStyle,
      ]}
    >
      <Ionicons 
        name="search-outline" 
        size={20} 
        color={colors.secondaryText} 
        style={styles.searchIcon}
      />
      
      <TextInput
        style={[
          styles.input,
          { color: colors.primaryText },
          inputStyle,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      
      {showClearButton && value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons 
            name="close-circle" 
            size={20} 
            color={colors.secondaryText} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default SearchBar;
