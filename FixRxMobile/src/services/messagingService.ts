import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import {
  Conversation,
  ConversationListResponse,
  CreateConversationPayload,
  EnsureDirectConversationPayload,
  MarkConversationReadPayload,
  Message,
  MessageListResponse,
  SendMessagePayload,
} from '../types/messaging';

type BackendCall<T> = () => Promise<ApiResponse<T>>;

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'mock-conversation-1',
    title: 'Mock Vendor',
    conversationType: 'consumer_vendor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
    participants: [
      {
        userId: 'consumer-123',
        role: 'consumer',
        joinedAt: new Date().toISOString(),
        firstName: 'Consumer',
        lastName: 'User',
        email: 'consumer@example.com',
      },
      {
        userId: 'vendor-456',
        role: 'vendor',
        joinedAt: new Date().toISOString(),
        firstName: 'Vendor',
        lastName: 'Pro',
        email: 'vendor@example.com',
      },
    ],
    lastMessage: {
      id: 'mock-message-1',
      conversationId: 'mock-conversation-1',
      senderId: 'vendor-456',
      messageType: 'text',
      content: 'Welcome to FixRx messaging!',
      createdAt: new Date().toISOString(),
      metadata: {},
    },
    unreadCount: 0,
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 'mock-message-1',
    conversationId: 'mock-conversation-1',
    senderId: 'vendor-456',
    messageType: 'text',
    content: 'Welcome to FixRx messaging!',
    metadata: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-message-2',
    conversationId: 'mock-conversation-1',
    senderId: 'consumer-123',
    messageType: 'text',
    content: 'Thanks! Looking forward to working with you.',
    metadata: {},
    createdAt: new Date().toISOString(),
  },
];

class MessagingService {
  private async useBackendOrMock<T>(backendCall: BackendCall<T>, mockData: T): Promise<ApiResponse<T>> {
    try {
      const isAvailable = await apiClient.isBackendAvailable();
      if (isAvailable) {
        return await backendCall();
      }
    } catch (error) {
      console.log('Backend unavailable, using mock messaging data.', error);
    }

    return {
      success: true,
      data: mockData,
      message: 'Using mock data (backend not available)',
    };
  }

  async listConversations(): Promise<ApiResponse<ConversationListResponse>> {
    const backendCall = () =>
      apiClient.get<ConversationListResponse>(API_ENDPOINTS.MESSAGING.CONVERSATIONS);

    const mockData: ConversationListResponse = {
      conversations: MOCK_CONVERSATIONS,
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    const backendCall = () =>
      apiClient.get<Conversation>(`${API_ENDPOINTS.MESSAGING.CONVERSATIONS}/${conversationId}`);

    const mockConversation = MOCK_CONVERSATIONS.find((c) => c.id === conversationId) || MOCK_CONVERSATIONS[0];
    return this.useBackendOrMock(backendCall, mockConversation);
  }

  async getMessages(
    conversationId: string,
    params: { limit?: number; before?: string } = {}
  ): Promise<ApiResponse<MessageListResponse>> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.before) searchParams.set('before', params.before);

    const backendCall = () =>
      apiClient.get<MessageListResponse>(
        `${API_ENDPOINTS.MESSAGING.CONVERSATIONS}/${conversationId}/messages${
          searchParams.toString() ? `?${searchParams}` : ''
        }`
      );

    const mockData: MessageListResponse = {
      messages: MOCK_MESSAGES.filter((m) => m.conversationId === conversationId),
    };

    return this.useBackendOrMock(backendCall, mockData);
  }

  async sendMessage(
    conversationId: string,
    payload: SendMessagePayload
  ): Promise<ApiResponse<{ message: Message }>> {
    const backendCall = () =>
      apiClient.post<{ message: Message }>(
        `${API_ENDPOINTS.MESSAGING.CONVERSATIONS}/${conversationId}/messages`,
        payload
      );

    const mockMessage: Message = {
      id: `mock-message-${Date.now()}`,
      conversationId,
      senderId: 'consumer-123',
      messageType: payload.messageType || 'text',
      content: payload.content || null,
      metadata: payload.metadata,
      attachments: payload.attachments,
      createdAt: new Date().toISOString(),
    };

    return this.useBackendOrMock(backendCall, { message: mockMessage });
  }

  async createConversation(
    payload: CreateConversationPayload
  ): Promise<ApiResponse<{ conversation: Conversation }>> {
    const backendCall = () =>
      apiClient.post<{ conversation: Conversation }>(
        API_ENDPOINTS.MESSAGING.CONVERSATIONS,
        payload
      );

    const mockConversation: Conversation = {
      ...MOCK_CONVERSATIONS[0],
      id: `mock-conversation-${Date.now()}`,
      participants: MOCK_CONVERSATIONS[0].participants,
      lastMessage: undefined,
      unreadCount: 0,
    };

    return this.useBackendOrMock(backendCall, { conversation: mockConversation });
  }

  async ensureDirectConversation(
    payload: EnsureDirectConversationPayload
  ): Promise<ApiResponse<{ conversation: Conversation }>> {
    const backendCall = () =>
      apiClient.post<{ conversation: Conversation }>(
        `${API_ENDPOINTS.MESSAGING.CONVERSATIONS}/ensure-direct`,
        payload
      );

    const mockConversation = MOCK_CONVERSATIONS[0];
    return this.useBackendOrMock(backendCall, { conversation: mockConversation });
  }

  async markConversationRead(
    conversationId: string,
    payload: MarkConversationReadPayload
  ): Promise<ApiResponse<{ participant: any }>> {
    const backendCall = () =>
      apiClient.post<{ participant: any }>(
        `${API_ENDPOINTS.MESSAGING.CONVERSATIONS}/${conversationId}/read`,
        payload
      );

    return this.useBackendOrMock(backendCall, {
      participant: {
        userId: 'consumer-123',
        lastReadMessageId: payload.lastMessageId,
        lastReadAt: new Date().toISOString(),
      },
    });
  }

  async setTyping(conversationId: string, isTyping: boolean): Promise<ApiResponse> {
    const backendCall = () =>
      apiClient.post(
        `${API_ENDPOINTS.MESSAGING.CONVERSATIONS}/${conversationId}/typing`,
        { isTyping }
      );

    return this.useBackendOrMock(backendCall, {
      success: true,
      message: 'Typing status updated (mock)',
    } as ApiResponse);
  }
}

export const messagingService = new MessagingService();
export default messagingService;
