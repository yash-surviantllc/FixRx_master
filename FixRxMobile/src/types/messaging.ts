export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface MessageSender {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: MessageType;
  content: string | null;
  metadata?: Record<string, any>;
  attachments?: any[];
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  sender?: MessageSender;
}

export interface ConversationParticipant {
  userId: string;
  role?: string;
  joinedAt?: string;
  isMuted?: boolean;
  lastReadMessageId?: string;
  lastReadAt?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
}

export interface Conversation {
  id: string;
  title?: string | null;
  conversationType: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
}

export interface MessageListResponse {
  messages: Message[];
}

export interface SendMessagePayload {
  content?: string | null;
  messageType?: MessageType;
  metadata?: Record<string, any>;
  attachments?: any[];
}

export interface CreateConversationPayload {
  participantIds: string[];
  title?: string | null;
  conversationType?: string;
  metadata?: Record<string, any>;
}

export interface EnsureDirectConversationPayload {
  targetUserId: string;
  conversationType?: string;
  metadata?: Record<string, any>;
}

export interface MarkConversationReadPayload {
  lastMessageId?: string;
}
