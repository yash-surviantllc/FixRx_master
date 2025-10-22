const Joi = require('joi');
const { dbManager } = require('../config/database');
const { logger } = require('../utils/logger');

class UserController {
  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
          code: 'UNAUTHORIZED'
        });
      }

      // Simplified query without profiles table
      const result = await dbManager.query(`
        SELECT 
          id, email, phone, first_name, last_name,
          user_type, phone_verified_at, email_verified_at, 
          created_at, updated_at, last_login_at,
          is_verified, profile_completed, metro_area
        FROM users
        WHERE id = $1
      `, [userId]);

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = result.rows[0];
      
      // Simplified response without profile data
      const userProfile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        userType: user.user_type?.toUpperCase(),
        phone: user.phone || null,
        phoneVerified: !!user.phone_verified_at,
        emailVerified: !!user.email_verified_at,
        isVerified: user.is_verified || false,
        profileCompleted: user.profile_completed || false,
        metroArea: user.metro_area || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at
      };

      return res.json({
        success: true,
        data: { user: userProfile }
      });
    } catch (error) {
      logger.error('Error getting user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
          code: 'UNAUTHORIZED'
        });
      }

      // LOG INCOMING DATA
      console.log('========================================');
      console.log('UPDATE PROFILE REQUEST');
      console.log('========================================');
      console.log('User ID:', userId);
      console.log('Request Body:', JSON.stringify(req.body, null, 2));
      console.log('========================================');

      const schema = Joi.object({
        firstName: Joi.string().min(1).max(100).optional(),
        lastName: Joi.string().min(1).max(100).optional(),
        email: Joi.string().email().optional(),
        phone: Joi.string().optional().allow(null, ''),
        userType: Joi.string().valid('consumer', 'vendor', 'CONSUMER', 'VENDOR').optional(),
        profileCompleted: Joi.boolean().optional(),
        metroArea: Joi.string().optional().allow(null, '')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      if (value.firstName !== undefined) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(value.firstName);
      }
      if (value.lastName !== undefined) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(value.lastName);
      }
      if (value.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(value.email);
      }
      if (value.phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(value.phone);
      }
      if (value.userType !== undefined) {
        updates.push(`user_type = $${paramIndex++}`);
        values.push(value.userType.toLowerCase());
      }
      if (value.profileCompleted !== undefined) {
        updates.push(`profile_completed = $${paramIndex++}`);
        values.push(value.profileCompleted);
      }
      if (value.metroArea !== undefined) {
        updates.push(`metro_area = $${paramIndex++}`);
        values.push(value.metroArea);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update',
          code: 'NO_UPDATES'
        });
      }

      updates.push(`updated_at = NOW()`);
      values.push(userId);

      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, first_name, last_name, user_type, phone, 
                  phone_verified, phone_verified_at, email_verified, 
                  profile_completed, metro_area, created_at, updated_at, last_login_at
      `;

      console.log('Executing SQL:', query);
      console.log('With values:', values);
      console.log('Looking for user ID:', userId);
      
      const result = await dbManager.query(query, values);

      console.log('Query result rows:', result.rows.length);
      
      if (!result.rows.length) {
        console.log('❌ USER NOT FOUND IN DATABASE!');
        console.log('User ID from JWT:', userId);
        console.log('Query:', query);
        console.log('Values:', values);
        
        // Check if user exists at all
        const checkUser = await dbManager.query('SELECT id, email FROM users WHERE id = $1', [userId]);
        console.log('User exists check:', checkUser.rows.length > 0 ? 'YES' : 'NO');
        if (checkUser.rows.length > 0) {
          console.log('User found:', checkUser.rows[0]);
        }
        
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = result.rows[0];
      console.log('Updated user:', JSON.stringify(user, null, 2));
      console.log('========================================');
      
      // Transform to match frontend expectations
      const userProfile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type?.toUpperCase(),
        phone: user.phone,
        phoneVerified: user.phone_verified,
        phoneVerifiedAt: user.phone_verified_at,
        emailVerified: user.email_verified,
        profileCompleted: user.profile_completed,
        metroArea: user.metro_area,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at
      };

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: userProfile }
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user profile',
        code: 'SERVER_ERROR'
      });
    }
  }
}

module.exports = new UserController();
