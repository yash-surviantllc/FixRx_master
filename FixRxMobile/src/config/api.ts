const API_CONFIG = {
  BASE_URL: 'http://192.168.1.4:3000',
  
  endpoints: {
    AUTH: {
      REGISTER: '/api/v1/auth/register',
      LOGIN: '/api/v1/auth/login',
      LOGOUT: '/api/v1/auth/logout',
      MAGIC_LINK: '/api/v1/auth/magic-link/send',
      VERIFY_OTP: '/api/v1/auth/verify-otp',
    },

    USERS: {
      PROFILE: '/api/v1/users/profile',
      UPDATE: '/api/v1/users/profile',
    },

    CONNECTIONS: {
      REQUEST: '/api/v1/connections/request',
      LIST: '/api/v1/connections/requests',
    },

    MESSAGES: {
      SEND: '/api/v1/messages/send',
      LIST: '/api/v1/messages',
    },
  },
};

export default API_CONFIG;
