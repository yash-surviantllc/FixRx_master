/**
 * Auth0 Integration Service
 * Architecture: JWT token management with Auth0 + local database sync
 */

const jwt = require('jsonwebtoken');
const { ManagementClient, AuthenticationClient } = require('auth0');
const { dbManager } = require('../config/database');

class Auth0Service {
  constructor() {
    this.managementClient = null;
    this.authClient = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Auth0 Management API Client
      this.managementClient = new ManagementClient({
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        scope: 'read:users update:users create:users delete:users read:user_metadata update:user_metadata'
      });

      // Auth0 Authentication API Client
      this.authClient = new AuthenticationClient({
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET
      });

      this.isInitialized = true;
      console.log('✅ Auth0 Service Initialized:', {
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID?.substring(0, 8) + '...'
      });

      return {
        initialized: true,
        domain: process.env.AUTH0_DOMAIN,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Auth0 Service Initialization Failed:', error);
      throw error;
    }
  }

  // JWT Token Validation and Management
  async validateToken(token) {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');
      
      // Verify JWT token
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'your-secret-key');
      
      // Check if token is in cache (for logout/revocation)
      const cacheKey = `token_blacklist:${cleanToken}`;
      const isBlacklisted = await dbManager.getCache(cacheKey);
      
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      // Get user from database
      const user = await this.getUserById(decoded.sub);
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        valid: true,
        user: {
          id: user.id,
          auth0Id: user.auth0_id,
          email: user.email,
          role: user.role,
          permissions: this.getRolePermissions(user.role)
        },
        decoded
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async refreshToken(refreshToken) {
    try {
      const response = await this.authClient.refreshToken({
        refresh_token: refreshToken
      });

      return {
        access_token: response.access_token,
        id_token: response.id_token,
        expires_in: response.expires_in,
        token_type: response.token_type
      };

    } catch (error) {
      console.error('❌ Token Refresh Failed:', error);
      throw error;
    }
  }

  async revokeToken(token) {
    try {
      // Add token to blacklist cache
      const cacheKey = `token_blacklist:${token}`;
      await dbManager.setCache(cacheKey, true, 86400); // 24 hours

      return { revoked: true };

    } catch (error) {
      console.error('❌ Token Revocation Failed:', error);
      throw error;
    }
  }

  // User Management with Auth0 Sync
  async createUser(userData) {
    try {
      // Create user in Auth0
      const auth0User = await this.managementClient.createUser({
        connection: 'Username-Password-Authentication',
        email: userData.email,
        password: userData.password,
        name: `${userData.firstName} ${userData.lastName}`,
        user_metadata: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          userType: userData.userType,
          phone: userData.phone,
          metroArea: userData.metroArea
        },
        app_metadata: {
          role: userData.userType || 'consumer',
          created_via: 'fixrx_app'
        }
      });

      // Create user in local database
      const localUser = await this.createLocalUser({
        auth0_id: auth0User.user_id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.userType || 'consumer',
        phone: userData.phone,
        metro_area: userData.metroArea,
        profile_image: auth0User.picture
      });

      return {
        auth0User,
        localUser,
        synced: true
      };

    } catch (error) {
      console.error('❌ User Creation Failed:', error);
      throw error;
    }
  }

  async syncUserProfile(auth0Id, updates) {
    try {
      // Update Auth0 user
      await this.managementClient.updateUser(
        { id: auth0Id },
        {
          user_metadata: updates.metadata,
          app_metadata: updates.appMetadata
        }
      );

      // Update local database
      await this.updateLocalUser(auth0Id, updates.localData);

      return { synced: true };

    } catch (error) {
      console.error('❌ User Profile Sync Failed:', error);
      throw error;
    }
  }

  async getUserByAuth0Id(auth0Id) {
    try {
      // Check cache first
      const cacheKey = `user:auth0:${auth0Id}`;
      let user = await dbManager.getCache(cacheKey);

      if (!user) {
        // Get from database
        const result = await dbManager.query(
          'SELECT * FROM users WHERE auth0_id = $1',
          [auth0Id]
        );

        if (result.rows.length > 0) {
          user = result.rows[0];
          // Cache for 1 hour
          await dbManager.setCache(cacheKey, user, 3600);
        }
      }

      return user;

    } catch (error) {
      console.error('❌ Get User by Auth0 ID Failed:', error);
      return null;
    }
  }

  async getUserById(userId) {
    try {
      // Check cache first
      const cacheKey = `user:id:${userId}`;
      let user = await dbManager.getCache(cacheKey);

      if (!user) {
        // Get from database
        const result = await dbManager.query(
          'SELECT * FROM users WHERE id = $1',
          [userId]
        );

        if (result.rows.length > 0) {
          user = result.rows[0];
          // Cache for 1 hour
          await dbManager.setCache(cacheKey, user, 3600);
        }
      }

      return user;

    } catch (error) {
      console.error('❌ Get User by ID Failed:', error);
      return null;
    }
  }

  // Social Login Integration
  async handleSocialLogin(provider, socialData) {
    try {
      // Check if user exists by email
      let user = await this.getUserByEmail(socialData.email);

      if (!user) {
        // Create new user from social login
        user = await this.createUser({
          email: socialData.email,
          firstName: socialData.given_name || socialData.name?.split(' ')[0] || 'User',
          lastName: socialData.family_name || socialData.name?.split(' ')[1] || '',
          userType: 'consumer',
          password: null // Social login, no password needed
        });
      }

      // Update social provider info
      await this.updateSocialProvider(user.localUser.id, provider, socialData);

      return user;

    } catch (error) {
      console.error('❌ Social Login Failed:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const result = await dbManager.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      return result.rows.length > 0 ? result.rows[0] : null;

    } catch (error) {
      console.error('❌ Get User by Email Failed:', error);
      return null;
    }
  }

  // Role-Based Access Control
  getRolePermissions(role) {
    const rolePermissions = {
      admin: [
        'users:read', 'users:write', 'users:delete',
        'vendors:read', 'vendors:write', 'vendors:delete', 'vendors:approve',
        'consumers:read', 'consumers:write', 'consumers:delete',
        'ratings:read', 'ratings:write', 'ratings:delete', 'ratings:moderate',
        'system:read', 'system:write', 'system:backup', 'system:monitor',
        'analytics:read', 'analytics:export',
        'audit:read', 'audit:export'
      ],
      vendor: [
        'profile:read', 'profile:write',
        'portfolio:read', 'portfolio:write',
        'services:read', 'services:write', 'services:accept',
        'ratings:read', 'ratings:respond',
        'notifications:read',
        'analytics:read:own',
        'messages:read', 'messages:write'
      ],
      consumer: [
        'profile:read', 'profile:write',
        'vendors:read', 'vendors:search',
        'services:read', 'services:write', 'services:request',
        'ratings:read', 'ratings:write:own',
        'notifications:read',
        'messages:read', 'messages:write',
        'invitations:send'
      ],
      guest: [
        'vendors:read:public',
        'ratings:read:public'
      ]
    };

    return rolePermissions[role] || rolePermissions.guest;
  }

  // Database Operations (Mock implementations)
  async createLocalUser(userData) {
    try {
      const result = await dbManager.query(`
        INSERT INTO users (auth0_id, email, first_name, last_name, role, phone, metro_area, profile_image, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `, [
        userData.auth0_id,
        userData.email,
        userData.first_name,
        userData.last_name,
        userData.role,
        userData.phone,
        userData.metro_area,
        userData.profile_image
      ]);

      return result.rows[0];

    } catch (error) {
      console.error('❌ Create Local User Failed:', error);
      throw error;
    }
  }

  async updateLocalUser(auth0Id, updates) {
    try {
      const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
      const values = [auth0Id, ...Object.values(updates)];

      const result = await dbManager.query(`
        UPDATE users SET ${setClause}, updated_at = NOW()
        WHERE auth0_id = $1
        RETURNING *
      `, values);

      // Clear cache
      if (result.rows.length > 0) {
        const user = result.rows[0];
        await dbManager.deleteCache(`user:auth0:${auth0Id}`);
        await dbManager.deleteCache(`user:id:${user.id}`);
      }

      return result.rows[0];

    } catch (error) {
      console.error('❌ Update Local User Failed:', error);
      throw error;
    }
  }

  async updateSocialProvider(userId, provider, socialData) {
    try {
      await dbManager.query(`
        INSERT INTO user_social_providers (user_id, provider, provider_id, profile_data, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, provider) 
        DO UPDATE SET profile_data = $4, updated_at = NOW()
      `, [userId, provider, socialData.sub || socialData.id, JSON.stringify(socialData)]);

    } catch (error) {
      console.error('❌ Update Social Provider Failed:', error);
    }
  }

  // Session Management
  async createSession(userId, deviceInfo) {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      const sessionData = {
        userId,
        deviceInfo,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      // Store session in Redis with 24 hour expiry
      await dbManager.setCache(`session:${sessionId}`, sessionData, 86400);

      return sessionId;

    } catch (error) {
      console.error('❌ Create Session Failed:', error);
      throw error;
    }
  }

  async validateSession(sessionId) {
    try {
      const session = await dbManager.getCache(`session:${sessionId}`);
      
      if (!session) {
        return { valid: false, error: 'Session not found' };
      }

      // Update last activity
      session.lastActivity = new Date().toISOString();
      await dbManager.setCache(`session:${sessionId}`, session, 86400);

      return { valid: true, session };

    } catch (error) {
      console.error('❌ Validate Session Failed:', error);
      return { valid: false, error: error.message };
    }
  }

  async destroySession(sessionId) {
    try {
      await dbManager.deleteCache(`session:${sessionId}`);
      return { destroyed: true };

    } catch (error) {
      console.error('❌ Destroy Session Failed:', error);
      return { destroyed: false, error: error.message };
    }
  }

  // Health Check
  getStatus() {
    return {
      initialized: this.isInitialized,
      domain: process.env.AUTH0_DOMAIN,
      clientConfigured: !!process.env.AUTH0_CLIENT_ID,
      secretConfigured: !!process.env.AUTH0_CLIENT_SECRET
    };
  }
}

// Singleton instance
const auth0Service = new Auth0Service();

module.exports = {
  Auth0Service,
  auth0Service
};
