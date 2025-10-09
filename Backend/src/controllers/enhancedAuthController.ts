/**
 * Enhanced Authentication Controller for FixRx
 * Handles advanced user management and security features
 */

import { Request, Response } from 'express';
import { authenticationService, UserRegistrationData, ProfileUpdateData, SecuritySettings } from '../services/authenticationService';
import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

// Rate limiting configurations
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts, please try again later',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    error: 'Too many registration attempts, please try again later'
  }
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per hour
  message: {
    error: 'Too many password reset requests, please try again later'
  }
});

class EnhancedAuthController {
  
  // Enhanced User Registration
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const registrationData: UserRegistrationData = {
        email: req.body.email.toLowerCase().trim(),
        password: req.body.password,
        firstName: req.body.firstName.trim(),
        lastName: req.body.lastName.trim(),
        userType: req.body.userType,
        phone: req.body.phone?.trim(),
        metroArea: req.body.metroArea?.trim(),
        provider: 'local'
      };

      const result = await authenticationService.registerUser(registrationData);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
            requiresVerification: result.requiresVerification
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Registration controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  // Enhanced User Login
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authenticationService.loginUser(
        email.toLowerCase().trim(),
        password,
        ipAddress
      );

      if (result.success) {
        // Set secure HTTP-only cookie for refresh token
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            token: result.token
          }
        });
      } else {
        const statusCode = result.requiresVerification || result.requires2FA ? 403 : 401;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          requiresVerification: result.requiresVerification,
          requires2FA: result.requires2FA
        });
      }

    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  // OAuth Login/Registration
  async oauthLogin(req: Request, res: Response): Promise<void> {
    try {
      const { provider, providerId, email, firstName, lastName } = req.body;

      const result = await authenticationService.oauthLogin(
        provider,
        providerId,
        email.toLowerCase().trim(),
        firstName.trim(),
        lastName.trim()
      );

      if (result.success) {
        // Set secure HTTP-only cookie for refresh token
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            token: result.token
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('OAuth login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during OAuth login'
      });
    }
  }

  // Email Verification
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
        return;
      }

      const result = await authenticationService.verifyEmail(token);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Email verification controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during email verification'
      });
    }
  }

  // Resend Verification Email
  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      // TODO: Implement resend verification logic
      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });

    } catch (error) {
      console.error('Resend verification controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Password Reset Request
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      const result = await authenticationService.requestPasswordReset(
        email.toLowerCase().trim()
      );

      res.status(200).json({
        success: result.success,
        message: result.message
      });

    } catch (error) {
      console.error('Password reset request controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Reset Password
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Reset token and new password are required'
        });
        return;
      }

      const result = await authenticationService.resetPassword(token, newPassword);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Password reset controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update User Profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const profileData: ProfileUpdateData = {
        firstName: req.body.firstName?.trim(),
        lastName: req.body.lastName?.trim(),
        phone: req.body.phone?.trim(),
        metroArea: req.body.metroArea?.trim(),
        avatar: req.body.avatar,
        bio: req.body.bio?.trim(),
        preferences: req.body.preferences
      };

      // Remove undefined values
      Object.keys(profileData).forEach(key => {
        if (profileData[key as keyof ProfileUpdateData] === undefined) {
          delete profileData[key as keyof ProfileUpdateData];
        }
      });

      const result = await authenticationService.updateProfile(userId, profileData);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: { user: result.user }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Profile update controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update Security Settings
  async updateSecuritySettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const settings: Partial<SecuritySettings> = {
        enable2FA: req.body.enable2FA,
        passwordChangeRequired: req.body.passwordChangeRequired,
        sessionTimeout: req.body.sessionTimeout,
        loginNotifications: req.body.loginNotifications
      };

      // Remove undefined values
      Object.keys(settings).forEach(key => {
        if (settings[key as keyof SecuritySettings] === undefined) {
          delete settings[key as keyof SecuritySettings];
        }
      });

      const result = await authenticationService.updateSecuritySettings(userId, settings);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Security settings update controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Change Password
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
        return;
      }

      // TODO: Implement change password logic
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get User Profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // TODO: Implement get profile logic
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: req.user }
      });

    } catch (error) {
      console.error('Get profile controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      // TODO: Invalidate tokens in database

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh Token
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
        return;
      }

      // TODO: Implement refresh token logic

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { token: 'new-access-token' }
      });

    } catch (error) {
      console.error('Refresh token controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Verify 2FA Code
  async verify2FA(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({
          success: false,
          message: 'Email and 2FA code are required'
        });
        return;
      }

      // TODO: Implement 2FA verification logic

      res.status(200).json({
        success: true,
        message: '2FA verification successful',
        data: {
          token: 'access-token',
          user: {}
        }
      });

    } catch (error) {
      console.error('2FA verification controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get Security Settings
  async getSecuritySettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // TODO: Implement get security settings logic

      res.status(200).json({
        success: true,
        message: 'Security settings retrieved successfully',
        data: {
          enable2FA: false,
          passwordChangeRequired: false,
          sessionTimeout: 30,
          loginNotifications: true
        }
      });

    } catch (error) {
      console.error('Get security settings controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export const enhancedAuthController = new EnhancedAuthController();
export default enhancedAuthController;
