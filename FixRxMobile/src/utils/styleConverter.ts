/**
 * Utility to convert Tailwind classes to React Native styles
 */

import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

type Style = ViewStyle & TextStyle & ImageStyle;

// Color palette matching Tailwind
export const colors = {
  // Primary colors
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  
  // Grays
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Background
  background: '#ffffff',
  foreground: '#111827',
  muted: '#f3f4f6',
  mutedForeground: '#6b7280',
  
  // Borders
  border: '#e5e7eb',
  input: '#e5e7eb',
  ring: '#3b82f6',
  
  // Destructive
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
};

// Spacing scale
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
};

// Font sizes
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Font weights
export const fontWeight = {
  thin: '100' as const,
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

/**
 * Convert Tailwind-like class names to React Native styles
 */
export function tw(classNames: string): Style {
  // @ts-ignore - We'll handle the type merging manually
  const styles: Style = {};
  const classes = classNames.split(' ').filter(Boolean);

  classes.forEach(className => {
    // Padding
    if (className.startsWith('p-')) {
      const value = className.replace('p-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.padding = spacingValue;
      }
    }
    if (className.startsWith('px-')) {
      const value = className.replace('px-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.paddingHorizontal = spacingValue;
      }
    }
    if (className.startsWith('py-')) {
      const value = className.replace('py-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.paddingVertical = spacingValue;
      }
    }
    if (className.startsWith('pt-')) {
      const value = className.replace('pt-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.paddingTop = spacingValue;
      }
    }
    if (className.startsWith('pb-')) {
      const value = className.replace('pb-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.paddingBottom = spacingValue;
      }
    }
    if (className.startsWith('pl-')) {
      const value = className.replace('pl-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.paddingLeft = spacingValue;
      }
    }
    if (className.startsWith('pr-')) {
      const value = className.replace('pr-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.paddingRight = spacingValue;
      }
    }

    // Margin
    if (className.startsWith('m-')) {
      const value = className.replace('m-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.margin = spacingValue;
      }
    }
    if (className.startsWith('mx-')) {
      const value = className.replace('mx-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.marginHorizontal = spacingValue;
      }
    }
    if (className.startsWith('my-')) {
      const value = className.replace('my-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.marginVertical = spacingValue;
      }
    }
    if (className.startsWith('mt-')) {
      const value = className.replace('mt-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.marginTop = spacingValue;
      }
    }
    if (className.startsWith('mb-')) {
      const value = className.replace('mb-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.marginBottom = spacingValue;
      }
    }
    if (className.startsWith('ml-')) {
      const value = className.replace('ml-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.marginLeft = spacingValue;
      }
    }
    if (className.startsWith('mr-')) {
      const value = className.replace('mr-', '');
      const spacingValue = (spacing as any)[value];
      if (spacingValue !== undefined) {
        styles.marginRight = spacingValue;
      }
    }

    // Flexbox
    if (className === 'flex') {
      styles.display = 'flex';
    }
    if (className === 'flex-1') {
      styles.flex = 1;
    }
    if (className === 'flex-row') {
      styles.flexDirection = 'row';
    }
    if (className === 'flex-col') {
      styles.flexDirection = 'column';
    }
    if (className === 'items-center') {
      styles.alignItems = 'center';
    }
    if (className === 'items-start') {
      styles.alignItems = 'flex-start';
    }
    if (className === 'items-end') {
      styles.alignItems = 'flex-end';
    }
    if (className === 'justify-center') {
      styles.justifyContent = 'center';
    }
    if (className === 'justify-start') {
      styles.justifyContent = 'flex-start';
    }
    if (className === 'justify-end') {
      styles.justifyContent = 'flex-end';
    }
    if (className === 'justify-between') {
      styles.justifyContent = 'space-between';
    }
    if (className === 'justify-around') {
      styles.justifyContent = 'space-around';
    }

    // Typography
    if (className.startsWith('text-')) {
      const value = className.replace('text-', '');
      
      // Font size
      if (fontSize[value as keyof typeof fontSize]) {
        (styles as TextStyle).fontSize = fontSize[value as keyof typeof fontSize];
      }
      
      // Text color
      if (value === 'white') {
        (styles as TextStyle).color = '#ffffff';
      } else if (value === 'black') {
        (styles as TextStyle).color = '#000000';
      } else if (value.startsWith('gray-')) {
        const grayLevel = value.replace('gray-', '');
        const colorKey = `gray${grayLevel}` as keyof typeof colors;
        if (colors[colorKey]) {
          (styles as TextStyle).color = colors[colorKey];
        }
      }
      
      // Text alignment
      if (value === 'center') {
        (styles as TextStyle).textAlign = 'center';
      }
      if (value === 'left') {
        (styles as TextStyle).textAlign = 'left';
      }
      if (value === 'right') {
        (styles as TextStyle).textAlign = 'right';
      }
    }

    // Font weight
    if (className.startsWith('font-')) {
      const value = className.replace('font-', '');
      if (fontWeight[value as keyof typeof fontWeight]) {
        (styles as TextStyle).fontWeight = fontWeight[value as keyof typeof fontWeight];
      }
    }

    // Background color
    if (className.startsWith('bg-')) {
      const value = className.replace('bg-', '');
      if (value === 'white') {
        styles.backgroundColor = '#ffffff';
      } else if (value === 'black') {
        styles.backgroundColor = '#000000';
      } else if (value === 'primary') {
        styles.backgroundColor = colors.primary;
      } else if (value.startsWith('gray-')) {
        const grayLevel = value.replace('gray-', '');
        const colorKey = `gray${grayLevel}` as keyof typeof colors;
        if (colors[colorKey]) {
          styles.backgroundColor = colors[colorKey];
        }
      }
    }

    // Border
    if (className === 'border') {
      styles.borderWidth = 1;
      styles.borderColor = colors.border;
    }
    if (className.startsWith('border-')) {
      const value = className.replace('border-', '');
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        styles.borderWidth = numValue;
      }
    }
    if (className.startsWith('rounded-')) {
      const value = className.replace('rounded-', '');
      if (borderRadius[value as keyof typeof borderRadius] !== undefined) {
        styles.borderRadius = borderRadius[value as keyof typeof borderRadius];
      }
    }
    if (className === 'rounded') {
      styles.borderRadius = borderRadius.DEFAULT;
    }

    // Width and Height
    if (className === 'w-full') {
      styles.width = '100%';
    }
    if (className === 'h-full') {
      styles.height = '100%';
    }
    if (className.startsWith('w-')) {
      const value = className.replace('w-', '');
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        styles.width = numValue * 4; // Assuming 1 unit = 4px
      }
    }
    if (className.startsWith('h-')) {
      const value = className.replace('h-', '');
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        styles.height = numValue * 4; // Assuming 1 unit = 4px
      }
    }

    // Position
    if (className === 'absolute') {
      styles.position = 'absolute';
    }
    if (className === 'relative') {
      styles.position = 'relative';
    }

    // Opacity
    if (className.startsWith('opacity-')) {
      const value = className.replace('opacity-', '');
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        styles.opacity = numValue / 100;
      }
    }

    // Shadow
    if (className === 'shadow') {
      Object.assign(styles, {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
      });
    }
    if (className === 'shadow-lg') {
      Object.assign(styles, {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      });
    }
  });

  return styles;
}

/**
 * Combine multiple style objects
 */
export function combineStyles(...styles: (Style | undefined | false)[]): Style {
  return Object.assign({}, ...styles.filter(Boolean));
}
