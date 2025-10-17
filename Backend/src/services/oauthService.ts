/**
 * OAuth Service for FixRx
 * Handles Google, Facebook, and other OAuth provider integrations
 */

import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import crypto from 'crypto';

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  verified: boolean;
  provider: string;
}

export interface OAuthConfig {
  google?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  facebook?: {
    appId: string;
    appSecret: string;
    redirectUri: string;
  };
  github?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  linkedin?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

class OAuthService {
  private googleClient: OAuth2Client | null = null;
  private config: OAuthConfig;

  constructor() {
    this.config = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
      },
      facebook: {
        appId: process.env.FACEBOOK_APP_ID || '',
        appSecret: process.env.FACEBOOK_APP_SECRET || '',
        redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/auth/facebook/callback'
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback'
      },
      linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID || '',
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
        redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/auth/linkedin/callback'
      }
    };

    this.initializeGoogleClient();
  }

  private initializeGoogleClient(): void {
    if (this.config.google?.clientId) {
      this.googleClient = new OAuth2Client(
        this.config.google.clientId,
        this.config.google.clientSecret,
        this.config.google.redirectUri
      );
    }
  }

  // Google OAuth Implementation
  async getGoogleAuthUrl(state?: string): Promise<string> {
    if (!this.googleClient) {
      throw new Error('Google OAuth not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state || crypto.randomBytes(16).toString('hex'),
      prompt: 'consent'
    });

    return authUrl;
  }

  async verifyGoogleToken(token: string): Promise<OAuthUserInfo> {
    if (!this.googleClient) {
      throw new Error('Google OAuth not configured');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.config.google?.clientId
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token payload');
      }

      return {
        id: payload.sub,
        email: payload.email || '',
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        avatar: payload.picture,
        verified: payload.email_verified || false,
        provider: 'google'
      };
    } catch (error) {
      console.error('Google token verification error:', error);
      throw new Error('Invalid Google token');
    }
  }

  async exchangeGoogleCode(code: string): Promise<OAuthUserInfo> {
    if (!this.googleClient) {
      throw new Error('Google OAuth not configured');
    }

    try {
      const { tokens } = await this.googleClient.getToken(code);
      
      if (!tokens.id_token) {
        throw new Error('No ID token received from Google');
      }

      return await this.verifyGoogleToken(tokens.id_token);
    } catch (error) {
      console.error('Google code exchange error:', error);
      throw new Error('Failed to exchange Google authorization code');
    }
  }

  // Facebook OAuth Implementation
  async getFacebookAuthUrl(state?: string): Promise<string> {
    if (!this.config.facebook?.appId) {
      throw new Error('Facebook OAuth not configured');
    }

    const params = new URLSearchParams({
      client_id: this.config.facebook.appId,
      redirect_uri: this.config.facebook.redirectUri,
      scope: 'email,public_profile',
      response_type: 'code',
      state: state || crypto.randomBytes(16).toString('hex')
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeFacebookCode(code: string): Promise<OAuthUserInfo> {
    if (!this.config.facebook?.appId || !this.config.facebook?.appSecret) {
      throw new Error('Facebook OAuth not configured');
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: this.config.facebook.appId,
          client_secret: this.config.facebook.appSecret,
          redirect_uri: this.config.facebook.redirectUri,
          code
        }
      });

      const accessToken = tokenResponse.data.access_token;

      // Get user info
      const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: {
          fields: 'id,email,first_name,last_name,picture.type(large)',
          access_token: accessToken
        }
      });

      const user = userResponse.data;

      return {
        id: user.id,
        email: user.email || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        avatar: user.picture?.data?.url,
        verified: true, // Facebook emails are verified
        provider: 'facebook'
      };
    } catch (error) {
      console.error('Facebook code exchange error:', error);
      throw new Error('Failed to exchange Facebook authorization code');
    }
  }

  // GitHub OAuth Implementation
  async getGitHubAuthUrl(state?: string): Promise<string> {
    if (!this.config.github?.clientId) {
      throw new Error('GitHub OAuth not configured');
    }

    const params = new URLSearchParams({
      client_id: this.config.github.clientId,
      redirect_uri: this.config.github.redirectUri,
      scope: 'user:email',
      state: state || crypto.randomBytes(16).toString('hex')
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeGitHubCode(code: string): Promise<OAuthUserInfo> {
    if (!this.config.github?.clientId || !this.config.github?.clientSecret) {
      throw new Error('GitHub OAuth not configured');
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: this.config.github.clientId,
        client_secret: this.config.github.clientSecret,
        code
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      const accessToken = tokenResponse.data.access_token;

      // Get user info
      const [userResponse, emailResponse] = await Promise.all([
        axios.get('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }),
        axios.get('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
      ]);

      const user = userResponse.data;
      const emails = emailResponse.data;
      const primaryEmail = emails.find((email: any) => email.primary) || emails[0];

      return {
        id: user.id.toString(),
        email: primaryEmail?.email || '',
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        avatar: user.avatar_url,
        verified: primaryEmail?.verified || false,
        provider: 'github'
      };
    } catch (error) {
      console.error('GitHub code exchange error:', error);
      throw new Error('Failed to exchange GitHub authorization code');
    }
  }

  // LinkedIn OAuth Implementation
  async getLinkedInAuthUrl(state?: string): Promise<string> {
    if (!this.config.linkedin?.clientId) {
      throw new Error('LinkedIn OAuth not configured');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.linkedin.clientId,
      redirect_uri: this.config.linkedin.redirectUri,
      scope: 'r_liteprofile r_emailaddress',
      state: state || crypto.randomBytes(16).toString('hex')
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeLinkedInCode(code: string): Promise<OAuthUserInfo> {
    if (!this.config.linkedin?.clientId || !this.config.linkedin?.clientSecret) {
      throw new Error('LinkedIn OAuth not configured');
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.linkedin.redirectUri,
        client_id: this.config.linkedin.clientId,
        client_secret: this.config.linkedin.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const accessToken = tokenResponse.data.access_token;

      // Get user info
      const [profileResponse, emailResponse] = await Promise.all([
        axios.get('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }),
        axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      ]);

      const profile = profileResponse.data;
      const emailData = emailResponse.data;
      const email = emailData.elements?.[0]?.['handle~']?.emailAddress || '';

      return {
        id: profile.id,
        email,
        firstName: profile.firstName?.localized?.en_US || '',
        lastName: profile.lastName?.localized?.en_US || '',
        avatar: profile.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier,
        verified: true, // LinkedIn emails are verified
        provider: 'linkedin'
      };
    } catch (error) {
      console.error('LinkedIn code exchange error:', error);
      throw new Error('Failed to exchange LinkedIn authorization code');
    }
  }

  // Generic OAuth URL generator
  async getAuthUrl(provider: string, state?: string): Promise<string> {
    switch (provider.toLowerCase()) {
      case 'google':
        return this.getGoogleAuthUrl(state);
      case 'facebook':
        return this.getFacebookAuthUrl(state);
      case 'github':
        return this.getGitHubAuthUrl(state);
      case 'linkedin':
        return this.getLinkedInAuthUrl(state);
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  // Generic code exchange
  async exchangeCode(provider: string, code: string): Promise<OAuthUserInfo> {
    switch (provider.toLowerCase()) {
      case 'google':
        return this.exchangeGoogleCode(code);
      case 'facebook':
        return this.exchangeFacebookCode(code);
      case 'github':
        return this.exchangeGitHubCode(code);
      case 'linkedin':
        return this.exchangeLinkedInCode(code);
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  // Validate OAuth state parameter
  validateState(receivedState: string, expectedState: string): boolean {
    return receivedState === expectedState;
  }

  // Generate secure state parameter
  generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Get supported providers
  getSupportedProviders(): string[] {
    const providers: string[] = [];
    
    if (this.config.google?.clientId) providers.push('google');
    if (this.config.facebook?.appId) providers.push('facebook');
    if (this.config.github?.clientId) providers.push('github');
    if (this.config.linkedin?.clientId) providers.push('linkedin');
    
    return providers;
  }

  // Check if provider is configured
  isProviderConfigured(provider: string): boolean {
    switch (provider.toLowerCase()) {
      case 'google':
        return !!(this.config.google?.clientId && this.config.google?.clientSecret);
      case 'facebook':
        return !!(this.config.facebook?.appId && this.config.facebook?.appSecret);
      case 'github':
        return !!(this.config.github?.clientId && this.config.github?.clientSecret);
      case 'linkedin':
        return !!(this.config.linkedin?.clientId && this.config.linkedin?.clientSecret);
      default:
        return false;
    }
  }
}

export const oauthService = new OAuthService();
export default oauthService;
