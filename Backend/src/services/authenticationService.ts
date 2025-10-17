/**
 * Enhanced Authentication Service for FixRx
 * Implements comprehensive user management and security features
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'CONSUMER' | 'VENDOR';
  phone?: string;
  metroArea?: string;
  provider?: 'local' | 'google' | 'facebook' | 'oauth';
  providerId?: string;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  token?: string;
  refreshToken?: string;
  message?: string;
  requiresVerification?: boolean;
  requires2FA?: boolean;
}

export interface PasswordResetData {
  email: string;
  resetToken?: string;
  newPassword?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  metroArea?: string;
  avatar?: string;
  bio?: string;
  preferences?: any;
}

export interface SecuritySettings {
  enable2FA: boolean;
  passwordChangeRequired: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
}

class AuthenticationService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  private readonly PASSWORD_SALT_ROUNDS = 12;
  private readonly TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  // Enhanced User Registration
  async registerUser(userData: UserRegistrationData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User already exists with this email'
        };
      }

      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: `Password requirements not met: ${passwordValidation.errors.join(', ')}`
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.PASSWORD_SALT_ROUNDS);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          userType: userData.userType,
          phone: userData.phone,
          metroArea: userData.metroArea,
          provider: userData.provider || 'local',
          providerId: userData.providerId,
          isVerified: false,
          verificationToken,
          verificationExpiry,
          securitySettings: {
            enable2FA: false,
            passwordChangeRequired: false,
            sessionTimeout: 30, // 30 minutes
            loginNotifications: true
          }
        }
      });

      // Generate tokens
      const token = this.generateAccessToken(user.id, user.email, user.userType);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token
      await this.storeRefreshToken(user.id, refreshToken);

      // Remove sensitive data
      const { password, verificationToken: _, ...safeUser } = user;

      return {
        success: true,
        user: safeUser,
        token,
        refreshToken,
        requiresVerification: true,
        message: 'User registered successfully. Please verify your email.'
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  // Enhanced User Login
  async loginUser(email: string, password: string, ipAddress?: string): Promise<AuthResult> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { loginAttempts: true }
      });

      if (!user) {
        await this.logFailedAttempt(email, ipAddress);
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check account lockout
      const isLocked = await this.isAccountLocked(user.id);
      if (isLocked) {
        return {
          success: false,
          message: 'Account temporarily locked due to multiple failed attempts'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await this.logFailedAttempt(email, ipAddress, user.id);
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check if email is verified
      if (!user.isVerified) {
        return {
          success: false,
          message: 'Please verify your email before logging in',
          requiresVerification: true
        };
      }

      // Check 2FA requirement
      const securitySettings = user.securitySettings as SecuritySettings;
      if (securitySettings?.enable2FA) {
        // Generate and send 2FA code
        const twoFACode = await this.generate2FACode(user.id);
        await this.send2FACode(user.email, twoFACode);
        
        return {
          success: false,
          message: '2FA code sent to your email',
          requires2FA: true
        };
      }

      // Clear failed attempts
      await this.clearFailedAttempts(user.id);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLoginAt: new Date(),
          lastLoginIP: ipAddress
        }
      });

      // Generate tokens
      const token = this.generateAccessToken(user.id, user.email, user.userType);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token
      await this.storeRefreshToken(user.id, refreshToken);

      // Remove sensitive data
      const { password: _, verificationToken, ...safeUser } = user;

      return {
        success: true,
        user: safeUser,
        token,
        refreshToken,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  // OAuth Login/Registration
  async oauthLogin(provider: string, providerId: string, email: string, firstName: string, lastName: string): Promise<AuthResult> {
    try {
      // Check if user exists
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { AND: [{ provider }, { providerId }] }
          ]
        }
      });

      if (!user) {
        // Create new user from OAuth
        user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            provider,
            providerId,
            userType: 'CONSUMER', // Default type
            isVerified: true, // OAuth accounts are pre-verified
            securitySettings: {
              enable2FA: false,
              passwordChangeRequired: false,
              sessionTimeout: 30,
              loginNotifications: true
            }
          }
        });
      } else {
        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
      }

      // Generate tokens
      const token = this.generateAccessToken(user.id, user.email, user.userType);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token
      await this.storeRefreshToken(user.id, refreshToken);

      // Remove sensitive data
      const { password, verificationToken, ...safeUser } = user;

      return {
        success: true,
        user: safeUser,
        token,
        refreshToken,
        message: 'OAuth login successful'
      };

    } catch (error) {
      console.error('OAuth login error:', error);
      return {
        success: false,
        message: 'OAuth login failed. Please try again.'
      };
    }
  }

  // Email Verification
  async verifyEmail(token: string): Promise<AuthResult> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          verificationToken: token,
          verificationExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired verification token'
        };
      }

      // Update user as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
          verificationExpiry: null
        }
      });

      return {
        success: true,
        message: 'Email verified successfully'
      };

    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: 'Email verification failed'
      };
    }
  }

  // Password Reset Request
  async requestPasswordReset(email: string): Promise<AuthResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if email exists
        return {
          success: true,
          message: 'If the email exists, a reset link has been sent'
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiry: resetExpiry
        }
      });

      // TODO: Send reset email
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return {
        success: true,
        message: 'Password reset link sent to your email'
      };

    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: 'Password reset request failed'
      };
    }
  }

  // Reset Password
  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: `Password requirements not met: ${passwordValidation.errors.join(', ')}`
        };
      }

      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.PASSWORD_SALT_ROUNDS);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiry: null,
          passwordChangedAt: new Date()
        }
      });

      // Invalidate all existing sessions
      await this.invalidateAllSessions(user.id);

      return {
        success: true,
        message: 'Password reset successfully'
      };

    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Password reset failed'
      };
    }
  }

  // Update User Profile
  async updateProfile(userId: string, profileData: ProfileUpdateData): Promise<AuthResult> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...profileData,
          updatedAt: new Date()
        }
      });

      // Remove sensitive data
      const { password, verificationToken, passwordResetToken, ...safeUser } = updatedUser;

      return {
        success: true,
        user: safeUser,
        message: 'Profile updated successfully'
      };

    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        message: 'Profile update failed'
      };
    }
  }

  // Update Security Settings
  async updateSecuritySettings(userId: string, settings: Partial<SecuritySettings>): Promise<AuthResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const currentSettings = user.securitySettings as SecuritySettings;
      const updatedSettings = { ...currentSettings, ...settings };

      await prisma.user.update({
        where: { id: userId },
        data: {
          securitySettings: updatedSettings
        }
      });

      return {
        success: true,
        message: 'Security settings updated successfully'
      };

    } catch (error) {
      console.error('Security settings update error:', error);
      return {
        success: false,
        message: 'Security settings update failed'
      };
    }
  }

  // Helper Methods
  private validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private generateAccessToken(userId: string, email: string, userType: string): string {
    return jwt.sign(
      { userId, email, userType },
      this.JWT_SECRET,
      { expiresIn: this.TOKEN_EXPIRY }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt
      }
    });
  }

  private async logFailedAttempt(email: string, ipAddress?: string, userId?: string): Promise<void> {
    await prisma.loginAttempt.create({
      data: {
        email,
        ipAddress,
        userId,
        success: false,
        attemptedAt: new Date()
      }
    });
  }

  private async isAccountLocked(userId: string): Promise<boolean> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const recentFailedAttempts = await prisma.loginAttempt.count({
      where: {
        userId,
        success: false,
        attemptedAt: {
          gte: fifteenMinutesAgo
        }
      }
    });

    return recentFailedAttempts >= 5;
  }

  private async clearFailedAttempts(userId: string): Promise<void> {
    await prisma.loginAttempt.deleteMany({
      where: {
        userId,
        success: false
      }
    });
  }

  private async generate2FACode(userId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.twoFactorCode.create({
      data: {
        userId,
        code,
        expiresAt
      }
    });

    return code;
  }

  private async send2FACode(email: string, code: string): Promise<void> {
    // TODO: Implement email sending
    console.log(`2FA code for ${email}: ${code}`);
  }

  private async invalidateAllSessions(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }
}

export const authenticationService = new AuthenticationService();
export default authenticationService;
