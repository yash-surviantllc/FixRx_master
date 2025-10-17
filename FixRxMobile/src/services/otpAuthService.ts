import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { ApiResponse } from './apiClient';

export interface OtpSendRequest {
  phone: string;
  purpose?: 'LOGIN' | 'REGISTRATION';
  userType?: 'CONSUMER' | 'VENDOR';
}

export interface OtpVerifyRequest {
  phone: string;
  code: string;
  userType?: 'CONSUMER' | 'VENDOR';
}

export interface OtpResponseData {
  phone?: string;
  expiresIn?: number;
  deliveryMethod?: 'twilio' | 'mock';
  devCode?: string;
  otpVerificationId?: string;
  user?: any;
  token?: string;
  refreshToken?: string;
  sessionToken?: string;
  isNewUser?: boolean;
  retryAfterSeconds?: number;
  description?: string;
}

export interface OtpResponse extends ApiResponse<OtpResponseData> {
  code?: string;
  retryAfterSeconds?: number;
}

class OtpAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private buildUrl(path: string) {
    return `${this.baseUrl}${path}`;
  }

  async sendCode(request: OtpSendRequest): Promise<OtpResponse> {
    try {
      const response = await fetch(this.buildUrl(API_ENDPOINTS.AUTH.OTP.SEND), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: request.phone,
          purpose: request.purpose || 'LOGIN',
          userType: request.userType || 'CONSUMER'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to send verification code',
          code: data.code,
          retryAfterSeconds: data.retryAfterSeconds
        };
      }

      return {
        success: data.success,
        message: data.message,
        data: data.data,
        code: data.code
      };
    } catch (error) {
      console.error('OTP send error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
        code: 'NETWORK_ERROR'
      };
    }
  }

  async verifyCode(request: OtpVerifyRequest): Promise<OtpResponse> {
    try {
      const response = await fetch(this.buildUrl(API_ENDPOINTS.AUTH.OTP.VERIFY), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: request.phone,
          code: request.code,
          userType: request.userType || 'CONSUMER'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to verify code',
          code: data.code,
          retryAfterSeconds: data.retryAfterSeconds
        };
      }

      return {
        success: data.success,
        message: data.message,
        data: data.data
      };
    } catch (error) {
      console.error('OTP verify error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
        code: 'NETWORK_ERROR'
      };
    }
  }

  async resendCode(phone: string, purpose: 'LOGIN' | 'REGISTRATION' = 'LOGIN'): Promise<OtpResponse> {
    return this.sendCode({ phone, purpose });
  }

}

export const otpAuthService = new OtpAuthService();
export default otpAuthService;
