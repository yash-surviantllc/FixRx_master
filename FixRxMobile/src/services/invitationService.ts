/**
 * Enhanced Invitation Service for FixRx Mobile
 * Comprehensive invitation management with contact integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  isSelected?: boolean;
}

export interface Invitation {
  id: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  type: 'contractor' | 'friend';
  status: 'pending' | 'sent' | 'accepted' | 'declined' | 'failed';
  message?: string;
  createdAt: string;
  sentAt?: string;
  respondedAt?: string;
}

export interface InvitationData {
  contacts: Contact[];
  type: 'contractor' | 'friend';
  message?: string;
  method: 'sms' | 'email' | 'both';
}

export interface BulkInvitationResult {
  totalSent: number;
  successful: number;
  failed: number;
  invitations: Invitation[];
}

class InvitationService {
  // Check if backend is available, fallback to mock if not
  private async useBackendOrMock<T>(
    backendCall: () => Promise<ApiResponse<T>>,
    mockData: T
  ): Promise<ApiResponse<T>> {
    try {
      const isAvailable = await apiClient.isBackendAvailable();
      if (isAvailable) {
        return await backendCall();
      }
    } catch (error) {
      console.log('Backend not available, using mock data');
    }

    // Return mock data if backend is not available
    return {
      success: true,
      data: mockData,
      message: 'Using mock data (backend not available)',
    };
  }

  // Send single invitation
  async sendInvitation(invitationData: {
    contact: Contact;
    type: 'contractor' | 'friend';
    message?: string;
    method: 'sms' | 'email' | 'both';
  }): Promise<ApiResponse<Invitation>> {
    const backendCall = async (): Promise<ApiResponse<Invitation>> => {
      if (invitationData.type === 'contractor') {
        // Use contractor SMS endpoint
        const payload = {
          phoneNumber: invitationData.contact.phone,
          recipientName: invitationData.contact.name,
          customMessage: invitationData.message,
          serviceCategory: '' // Optional
        };
        const response = await apiClient.post('/api/v1/invitations/contractor-sms', payload);
        // Transform backend response to our Invitation format
        const responseData = response.data as any;
        return {
          success: response.success,
          message: response.message,
          data: {
            id: responseData?.invitationId || `invitation_${Date.now()}`,
            recipientName: invitationData.contact.name,
            recipientPhone: invitationData.contact.phone,
            recipientEmail: invitationData.contact.email,
            type: invitationData.type,
            status: responseData?.status === 'pending' ? 'sent' : 'sent',
            message: invitationData.message,
            createdAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
          }
        } as ApiResponse<Invitation>;
      } else {
        // Use generic invitation endpoint for friends
        const response = await apiClient.post(API_ENDPOINTS.INVITATIONS.SEND, invitationData);
        return response as ApiResponse<Invitation>;
      }
    };
    
    const mockData: Invitation = {
      id: `invitation_${Date.now()}`,
      recipientName: invitationData.contact.name,
      recipientPhone: invitationData.contact.phone,
      recipientEmail: invitationData.contact.email,
      type: invitationData.type,
      status: 'sent',
      message: invitationData.message,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Send bulk invitations
  async sendBulkInvitations(invitationData: InvitationData): Promise<ApiResponse<BulkInvitationResult>> {
    const backendCall = async (): Promise<ApiResponse<BulkInvitationResult>> => {
      if (invitationData.type === 'contractor') {
        // Send individual contractor invitations
        const results = await Promise.allSettled(
          invitationData.contacts.map(contact => 
            this.sendInvitation({
              contact,
              type: 'contractor',
              message: invitationData.message,
              method: invitationData.method
            })
          )
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        const invitations: Invitation[] = results.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value.data!;
          } else {
            return {
              id: `failed_${Date.now()}_${index}`,
              recipientName: invitationData.contacts[index].name,
              recipientPhone: invitationData.contacts[index].phone,
              type: invitationData.type,
              status: 'failed' as const,
              message: invitationData.message,
              createdAt: new Date().toISOString(),
            } as Invitation;
          }
        });

        return {
          success: true,
          data: {
            totalSent: invitationData.contacts.length,
            successful,
            failed,
            invitations
          }
        } as ApiResponse<BulkInvitationResult>;
      } else {
        // Use bulk endpoint for friends
        const response = await apiClient.post(API_ENDPOINTS.INVITATIONS.BULK, invitationData);
        return response as ApiResponse<BulkInvitationResult>;
      }
    };
    
    const mockInvitations: Invitation[] = invitationData.contacts.map((contact, index) => ({
      id: `invitation_${Date.now()}_${index}`,
      recipientName: contact.name,
      recipientPhone: contact.phone,
      recipientEmail: contact.email,
      type: invitationData.type,
      status: 'sent',
      message: invitationData.message,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    }));

    const mockData: BulkInvitationResult = {
      totalSent: invitationData.contacts.length,
      successful: invitationData.contacts.length,
      failed: 0,
      invitations: mockInvitations,
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Get sent invitations
  async getSentInvitations(): Promise<ApiResponse<Invitation[]>> {
    const backendCall = async (): Promise<ApiResponse<Invitation[]>> => {
      const response = await apiClient.get(API_ENDPOINTS.INVITATIONS.SENT);
      return response as ApiResponse<Invitation[]>;
    };
    
    const mockData: Invitation[] = [
      {
        id: 'invitation_1',
        recipientName: 'Mike Rodriguez',
        recipientPhone: '+1234567890',
        recipientEmail: 'mike@example.com',
        type: 'contractor',
        status: 'accepted',
        message: 'Join FixRx to connect with clients!',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        respondedAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 'invitation_2',
        recipientName: 'Jennifer Chen',
        recipientPhone: '+1234567891',
        recipientEmail: 'jennifer@example.com',
        type: 'contractor',
        status: 'pending',
        message: 'Join FixRx to connect with clients!',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        sentAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'invitation_3',
        recipientName: 'Sarah Johnson',
        recipientPhone: '+1234567892',
        recipientEmail: 'sarah@example.com',
        type: 'friend',
        status: 'sent',
        message: 'Check out FixRx - great for finding contractors!',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        sentAt: new Date(Date.now() - 259200000).toISOString(),
      },
    ];

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Get received invitations
  async getReceivedInvitations(): Promise<ApiResponse<Invitation[]>> {
    const backendCall = async (): Promise<ApiResponse<Invitation[]>> => {
      const response = await apiClient.get(API_ENDPOINTS.INVITATIONS.RECEIVED);
      return response as ApiResponse<Invitation[]>;
    };
    
    const mockData: Invitation[] = [
      {
        id: 'invitation_received_1',
        recipientName: 'John Doe',
        recipientPhone: '+1234567893',
        recipientEmail: 'john@example.com',
        type: 'friend',
        status: 'pending',
        message: 'Join me on FixRx!',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        sentAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Accept invitation
  async acceptInvitation(invitationId: string): Promise<ApiResponse<Invitation>> {
    const backendCall = async (): Promise<ApiResponse<Invitation>> => {
      const response = await apiClient.put(`${API_ENDPOINTS.INVITATIONS.RECEIVED}/${invitationId}/accept`);
      return response as ApiResponse<Invitation>;
    };
    
    const mockData: Invitation = {
      id: invitationId,
      recipientName: 'John Doe',
      recipientPhone: '+1234567893',
      recipientEmail: 'john@example.com',
      type: 'friend',
      status: 'accepted',
      message: 'Join me on FixRx!',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      sentAt: new Date(Date.now() - 86400000).toISOString(),
      respondedAt: new Date().toISOString(),
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Decline invitation
  async declineInvitation(invitationId: string): Promise<ApiResponse<Invitation>> {
    const backendCall = async (): Promise<ApiResponse<Invitation>> => {
      const response = await apiClient.put(`${API_ENDPOINTS.INVITATIONS.RECEIVED}/${invitationId}/decline`);
      return response as ApiResponse<Invitation>;
    };
    
    const mockData: Invitation = {
      id: invitationId,
      recipientName: 'John Doe',
      recipientPhone: '+1234567893',
      recipientEmail: 'john@example.com',
      type: 'friend',
      status: 'declined',
      message: 'Join me on FixRx!',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      sentAt: new Date(Date.now() - 86400000).toISOString(),
      respondedAt: new Date().toISOString(),
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Get invitation statistics
  async getInvitationStats(): Promise<ApiResponse<{
    totalSent: number;
    totalReceived: number;
    acceptedSent: number;
    acceptedReceived: number;
    pendingSent: number;
    pendingReceived: number;
  }>> {
    const backendCall = async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.INVITATIONS.SENT}/stats`);
      return response as ApiResponse<{
        totalSent: number;
        totalReceived: number;
        acceptedSent: number;
        acceptedReceived: number;
        pendingSent: number;
        pendingReceived: number;
      }>;
    };
    
    const mockData = {
      totalSent: 15,
      totalReceived: 3,
      acceptedSent: 8,
      acceptedReceived: 2,
      pendingSent: 5,
      pendingReceived: 1,
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Resend invitation
  async resendInvitation(invitationId: string): Promise<ApiResponse<Invitation>> {
    const backendCall = async (): Promise<ApiResponse<Invitation>> => {
      const response = await apiClient.put(`${API_ENDPOINTS.INVITATIONS.SENT}/${invitationId}/resend`);
      return response as ApiResponse<Invitation>;
    };
    
    const mockData: Invitation = {
      id: invitationId,
      recipientName: 'Jennifer Chen',
      recipientPhone: '+1234567891',
      recipientEmail: 'jennifer@example.com',
      type: 'contractor',
      status: 'sent',
      message: 'Join FixRx to connect with clients!',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      sentAt: new Date().toISOString(),
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  // Cancel invitation
  async cancelInvitation(invitationId: string): Promise<ApiResponse<any>> {
    const backendCall = async (): Promise<ApiResponse<any>> => {
      const response = await apiClient.delete(`${API_ENDPOINTS.INVITATIONS.SENT}/${invitationId}`);
      return response as ApiResponse<any>;
    };
    
    return this.useBackendOrMock(backendCall, { message: 'Invitation cancelled successfully' });
  }
}

// Export singleton instance
export const invitationService = new InvitationService();
export default invitationService;
