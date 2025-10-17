/**
 * API Configuration for FixRx Mobile
 * PERMANENT FIX: Hardcoded IP for Expo Go on physical device
 * This bypasses Expo's environment variable caching issues
 */

import { Platform } from 'react-native';

// CONFIGURATION: Change this IP to match your computer's IP address
// To find your IP: Run 'ipconfig' in terminal and look for IPv4 Address
const YOUR_COMPUTER_IP = '192.168.1.6';

const DEFAULT_API_PORT = '3000';
const DEFAULT_API_PATH = '/api/v1';

const resolveBaseUrl = (): string => {
  // PERMANENT FIX: Use hardcoded IP for Expo Go
  // This solves the Expo environment variable caching issue
  const baseUrl = `http://${YOUR_COMPUTER_IP}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
  
  console.log('API Configuration:');
  console.log('  Platform:', Platform.OS);
  console.log('  Base URL:', baseUrl);
  console.log('  Computer IP:', YOUR_COMPUTER_IP);
  
  return baseUrl;
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: resolveBaseUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',
  
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/users/profile',
    OAUTH: {
      GOOGLE_VERIFY: '/auth/oauth/google/verify',
    },
    MAGIC_LINK: {
      SEND: '/auth/magic-link/send',
      VERIFY: '/auth/magic-link/verify',
      HEALTH: '/auth/magic-link/health',
    },
    OTP: {
      SEND: '/auth/otp/send',
      RESEND: '/auth/otp/resend',
      VERIFY: '/auth/otp/verify',
      HEALTH: '/auth/otp/health',
    },
  },
  
  // Consumer
  CONSUMER: {
    DASHBOARD: '/consumers/dashboard',
    RECOMMENDATIONS: '/consumers/recommendations',
    PROFILE: '/consumers/profile',
  },
  
  // Vendor
  VENDOR: {
    DASHBOARD: '/vendors/dashboard',
    PROFILE: '/vendors/profile',
    SEARCH: '/vendors/search',
  },
  
  // Ratings
  RATINGS: {
    CREATE: '/ratings',
    GET: '/ratings',
    UPDATE: '/ratings',
  },
  
  // Invitations
  INVITATIONS: {
    SEND: '/invitations/send',
    BULK: '/invitations/bulk',
    RECEIVED: '/invitations/received',
    SENT: '/invitations/sent',
  },
  
  // Contacts
  CONTACTS: {
    IMPORT: '/contacts/import',
    SYNC: '/contacts/sync',
    SEARCH: '/contacts/search',
  },

  // Messaging
  MESSAGING: {
    CONVERSATIONS: '/messages',
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};
