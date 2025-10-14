import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import messagingService from '../services/messagingService';
import { Message as ConversationMessage, Conversation } from '../types/messaging';
import { useWebSocket } from '../services/websocketService';
import { useAppContext } from '../context/AppContext';

type MessagingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Messaging'>;
type MessagingScreenRouteProp = RouteProp<RootStackParamList, 'Messaging'>;

interface Message {
  id: string;
  type: 'text' | 'image' | 'appointment' | 'quote' | 'payment';
  content?: string | null;
  sender: 'user' | 'other';
  timestamp: string;
  createdAt: string;
  imageUrl?: string;
  appointmentData?: {
    date: string;
    time: string;
    service: string;
  };
  paymentData?: {
    amount: number;
    description: string;
    status: 'pending' | 'paid' | 'failed';
  };
  quotedMessage?: {
    sender: string;
    content: string;
  };
  serviceMessageId?: string;
}

// Placeholder messages for demo
const MessagingScreen: React.FC = () => {
  const navigation = useNavigation<MessagingScreenNavigationProp>();
  const route = useRoute<MessagingScreenRouteProp>();
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const { userProfile } = useAppContext();
  const currentUserId = userProfile?.id;
  const {
    connect,
    joinConversation,
    leaveConversation,
    on,
    startTyping,
    stopTyping,
    connectionState,
  } = useWebSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const lastReadMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const [isManualFallback, setIsManualFallback] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const conversationId = route.params?.conversationId;
  const fallbackName = route.params?.userName || 'Conversation';
  const fallbackImage = route.params?.userImage || 'https://via.placeholder.com/100';
  const fallbackOnline = route.params?.isOnline ?? false;

  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    surface: isDark ? '#1C1C1E' : '#F9FAFB',
    primary: '#2563EB',
    text: isDark ? '#FFFFFF' : '#1F2937',
    secondaryText: isDark ? '#9CA3AF' : '#6B7280',
    border: isDark ? '#38383A' : '#E5E7EB',
    userBubble: '#2563EB',
    otherBubble: isDark ? '#1C1C1E' : '#F3F4F6',
    inputBackground: isDark ? '#1C1C1E' : '#F9FAFB',
  };

  const formatTimestamp = useCallback((isoDate?: string) => {
    if (!isoDate) {
      return '';
    }

    try {
      return new Date(isoDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const isBackendMessageId = useCallback((maybeId?: string | null) => {
    if (!maybeId) {
      return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(maybeId);
  }, []);

  const markConversationAsRead = useCallback(
    async (lastMessageId?: string | null) => {
      if (
        !conversationId ||
        !lastMessageId ||
        lastReadMessageIdRef.current === lastMessageId ||
        !isBackendMessageId(lastMessageId)
      ) {
        return;
      }

      lastReadMessageIdRef.current = lastMessageId;

      try {
        await messagingService.markConversationRead(conversationId, { lastMessageId });
        setConversation((prev) =>
          prev
            ? {
                ...prev,
                unreadCount: 0,
              }
            : prev
        );
      } catch (serviceError) {
        console.error('Failed to mark conversation read:', serviceError);
      }
    },
    [conversationId, isBackendMessageId]
  );

  const mapServiceMessage = useCallback(
    (serviceMessage: ConversationMessage): Message => {
      let type: Message['type'] = 'text';
      if (serviceMessage.messageType === 'image') {
        type = 'image';
      } else if (serviceMessage.messageType === 'system') {
        type = 'text';
      }

      const mapped: Message = {
        id: `msg-${serviceMessage.id}`,
        serviceMessageId: serviceMessage.id,
        type,
        content: serviceMessage.content ?? '',
        sender: serviceMessage.senderId === currentUserId ? 'user' : 'other',
        timestamp: formatTimestamp(serviceMessage.createdAt),
        createdAt: serviceMessage.createdAt,
      };

      if (type === 'image') {
        const attachmentCandidate = Array.isArray(serviceMessage.attachments)
          ? serviceMessage.attachments[0]
          : undefined;

        mapped.imageUrl =
          (serviceMessage.metadata && serviceMessage.metadata.imageUrl) ||
          (attachmentCandidate && (attachmentCandidate.url || attachmentCandidate.uri));
      }

      return mapped;
    },
    [currentUserId, formatTimestamp]
  );

  const setMessagesFromService = useCallback(
    (serviceMessages: ConversationMessage[] = []) => {
      const mapped = serviceMessages.map(mapServiceMessage);
      mapped.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(mapped);

      if (mapped.length > 0) {
        const lastMessage = mapped[mapped.length - 1];
        markConversationAsRead(lastMessage.serviceMessageId || lastMessage.id);
        scrollToBottom();
      }
    },
    [mapServiceMessage, markConversationAsRead, scrollToBottom]
  );

  const loadMessages = useCallback(
    async (opts: { showLoader?: boolean; params?: { limit?: number; before?: string } } = {}) => {
      if (!conversationId) {
        return;
      }

      const { showLoader = false, params } = opts;

      if (showLoader) {
        setIsLoading(true);
      }

      const response = await messagingService.getMessages(conversationId, params);
      if (response.success && response.data?.messages) {
        setMessagesFromService(response.data.messages);
      } else if (!response.success) {
        setError(response.error || 'Unable to load messages');
      }

      if (showLoader) {
        setIsLoading(false);
      }
    },
    [conversationId, setMessagesFromService]
  );

  const loadConversation = useCallback(async () => {
    if (!conversationId) {
      setError('Conversation not found');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await connect();

      const [conversationResponse, messagesResponse] = await Promise.all([
        messagingService.getConversation(conversationId),
        messagingService.getMessages(conversationId),
      ]);

      if (conversationResponse.success && conversationResponse.data) {
        setConversation(conversationResponse.data);
      } else {
        setIsManualFallback(true);
      }

      if (messagesResponse.success && messagesResponse.data?.messages) {
        setMessagesFromService(messagesResponse.data.messages);
      } else if (!messagesResponse.success) {
        setError(messagesResponse.error || 'Unable to load messages');
      }

      if (conversationId) {
        joinConversation(conversationId);
      }
    } catch (serviceError) {
      console.error('Failed to load conversation:', serviceError);
      setError('Unable to load conversation');
    } finally {
      setIsLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [connect, conversationId, joinConversation, setMessagesFromService]);

  const handleRefresh = useCallback(async () => {
    if (!conversationId) {
      return;
    }

    setIsRefreshing(true);
    await loadMessages({ showLoader: false });
    setIsRefreshing(false);
  }, [conversationId, loadMessages]);

  const stopTypingWithDelay = useCallback(
    (conversationIdentifier: string) => {
      if (!conversationIdentifier) {
        return;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (connectionState === 'connected') {
          stopTyping(conversationIdentifier);
        } else if (!isManualFallback) {
          messagingService.setTyping(conversationIdentifier, false).catch((serviceError) => {
            console.error('Failed to update typing (REST fallback):', serviceError);
          });
        }
        isTypingRef.current = false;
        typingTimeoutRef.current = null;
      }, 2000);
    },
    [connectionState, isManualFallback, stopTyping]
  );

  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);

      if (!conversationId) {
        return;
      }

      if (!isTypingRef.current) {
        if (connectionState === 'connected') {
          startTyping(conversationId);
        } else if (!isManualFallback) {
          messagingService.setTyping(conversationId, true).catch((serviceError) => {
            console.error('Failed to update typing (REST fallback):', serviceError);
          });
        }
        isTypingRef.current = true;
      }

      stopTypingWithDelay(conversationId);
    },
    [connectionState, conversationId, isManualFallback, startTyping, stopTypingWithDelay]
  );

  const handleSend = useCallback(async () => {
    if (!conversationId || !inputText.trim()) {
      return;
    }

    const trimmed = inputText.trim();
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      serviceMessageId: optimisticId,
      type: 'text',
      content: trimmed,
      sender: 'user',
      timestamp: formatTimestamp(new Date().toISOString()),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');
    scrollToBottom();
    if (connectionState === 'connected') {
      stopTyping(conversationId);
    } else if (!isManualFallback) {
      messagingService.setTyping(conversationId, false).catch((serviceError) => {
        console.error('Failed to update typing (REST fallback):', serviceError);
      });
    }
    isTypingRef.current = false;

    setIsSending(true);

    try {
      const response = await messagingService.sendMessage(conversationId, {
        content: trimmed,
        messageType: 'text',
      });

      if (response.success && response.data?.message) {
        const mapped = mapServiceMessage(response.data.message);
        setMessages((prev) => {
          const next = prev.filter((msg) => msg.id !== optimisticId);
          next.push(mapped);
          next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return next;
        });
        setConversation((prev) =>
          prev
            ? {
                ...prev,
                lastMessage: response.data!.message,
                updatedAt: response.data!.message.createdAt,
              }
            : prev
        );
        markConversationAsRead(response.data.message.id);
      } else {
        setError(response.error || 'Failed to send message');
        setIsManualFallback(true);
      }
    } catch (serviceError) {
      console.error('Failed to send message:', serviceError);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [conversationId, inputText, formatTimestamp, mapServiceMessage, markConversationAsRead, scrollToBottom, stopTyping]);

  const handleIncomingMessage = useCallback(
    (serviceMessage: ConversationMessage) => {
      if (!serviceMessage || serviceMessage.conversationId !== conversationId) {
        return;
      }

      const mapped = mapServiceMessage(serviceMessage);

      setMessages((prev) => {
        const existingIndex = prev.findIndex(
          (msg) =>
            msg.serviceMessageId === mapped.serviceMessageId ||
            msg.id === mapped.id
        );

        if (existingIndex !== -1) {
          const next = [...prev];
          next[existingIndex] = mapped;
          return next;
        }

        const next = [...prev, mapped];
        next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return next;
      });

      setConversation((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: serviceMessage,
              updatedAt: serviceMessage.createdAt,
            }
          : prev
      );

      if (!currentUserId || serviceMessage.senderId !== currentUserId) {
        markConversationAsRead(serviceMessage.id);
      }

      setTimeout(() => scrollToBottom(), 0);
    },
    [conversationId, currentUserId, mapServiceMessage, markConversationAsRead, scrollToBottom]
  );

  const headerParticipant = useMemo(() => {
    if (!conversation || !conversation.participants || !currentUserId) {
      return null;
    }

    return conversation.participants.find((participant) => participant.userId !== currentUserId) || null;
  }, [conversation, currentUserId]);

  const headerName = useMemo(() => {
    if (headerParticipant) {
      const first = headerParticipant.firstName || '';
      const last = headerParticipant.lastName || '';
      const combined = `${first} ${last}`.trim();
      if (combined.length > 0) {
        return combined;
      }
      if (headerParticipant.email) {
        return headerParticipant.email;
      }
    }

    return conversation?.title || fallbackName;
  }, [conversation?.title, fallbackName, headerParticipant]);

  const headerImage = useMemo(() => {
    if (headerParticipant?.avatarUrl) {
      return headerParticipant.avatarUrl;
    }

    return fallbackImage;
  }, [fallbackImage, headerParticipant?.avatarUrl]);

  const headerOnline = useMemo(() => {
    if (typeof conversation?.metadata?.isOnline === 'boolean') {
      return conversation.metadata.isOnline;
    }

    return fallbackOnline;
  }, [conversation?.metadata, fallbackOnline]);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversation();

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }

        if (conversationId) {
          leaveConversation(conversationId);
          stopTyping(conversationId);
        }

        isTypingRef.current = false;
        setOtherTyping(false);
      };
    }, [conversationId, leaveConversation, loadConversation, stopTyping])
  );

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const unsubscribeMessage = on('message:new', (incoming: ConversationMessage) => {
      if (!incoming) {
        return;
      }
      handleIncomingMessage(incoming);
    });

    const unsubscribeTyping = on('conversation:typing', (payload) => {
      if (!payload || payload.conversationId !== conversationId) {
        return;
      }
      if (payload.userId && payload.userId === currentUserId) {
        return;
      }
      setOtherTyping(Boolean(payload.isTyping));
    });

    const unsubscribeRead = on('conversation:read', (payload) => {
      if (!payload || payload.conversationId !== conversationId) {
        return;
      }
      if (payload.userId && payload.userId !== currentUserId) {
        return;
      }
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              unreadCount: 0,
            }
          : prev
      );
    });

    return () => {
      unsubscribeMessage?.();
      unsubscribeTyping?.();
      unsubscribeRead?.();
    };
  }, [conversationId, currentUserId, handleIncomingMessage, on]);

  const renderTextMessage = (message: Message) => (
    <View
      style={[
        styles.messageBubble,
        message.sender === 'user'
          ? [styles.userBubble, { backgroundColor: colors.userBubble }]
          : [styles.otherBubble, { backgroundColor: colors.otherBubble }],
      ]}
    >
      <Text
        style={[
          styles.messageText,
          {
            color: message.sender === 'user' ? '#FFFFFF' : colors.text,
          },
        ]}
      >
        {message.content}
      </Text>
      <Text
        style={[
          styles.timestamp,
          {
            color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.secondaryText,
          },
        ]}
      >
        {message.timestamp}
      </Text>
    </View>
  );

  const renderImageMessage = (message: Message) => (
    <View
      style={[
        styles.messageBubble,
        message.sender === 'user' ? styles.userBubble : styles.otherBubble,
      ]}
    >
      <Image
        source={{ uri: message.imageUrl || 'https://via.placeholder.com/300x200' }}
        style={styles.messageImage}
        resizeMode="cover"
      />
      {message.content && (
        <Text
          style={[
            styles.messageText,
            {
              color: message.sender === 'user' ? '#FFFFFF' : colors.text,
              marginTop: 8,
            },
          ]}
        >
          {message.content}
        </Text>
      )}
      <Text
        style={[
          styles.timestamp,
          {
            color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.secondaryText,
          },
        ]}
      >
        {message.timestamp}
      </Text>
    </View>
  );

  const renderAppointmentMessage = (message: Message) => (
    <View style={[styles.messageContainer, message.sender === 'user' ? styles.userMessage : styles.otherMessage]}>
      <View
        style={[
          styles.appointmentCard,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.appointmentHeader}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.appointmentTitle, { color: colors.text }]}>Appointment</Text>
        </View>
        <Text style={[styles.appointmentDate, { color: colors.text }]}>
          {message.appointmentData?.date}
        </Text>
        <Text style={[styles.appointmentTime, { color: colors.secondaryText }]}>
          {message.appointmentData?.time}
        </Text>
        <Text style={[styles.appointmentService, { color: colors.secondaryText }]}>
          {message.appointmentData?.service}
        </Text>
      </View>
      <Text style={[styles.timestamp, styles.appointmentTimestamp, { color: colors.secondaryText }]}>
        {message.timestamp}
      </Text>
    </View>
  );

  const renderPaymentMessage = (message: Message) => (
    <View style={[styles.messageContainer, message.sender === 'user' ? styles.userMessage : styles.otherMessage]}>
      <View
        style={[
          styles.paymentCard,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.paymentHeader}>
          <View style={[styles.paymentIconContainer, { backgroundColor: '#10B981' }]}>
            <Ionicons name="card-outline" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={[styles.paymentTitle, { color: colors.text }]}>Payment Request</Text>
            <Text style={[styles.paymentDescription, { color: colors.secondaryText }]}>
              {message.paymentData?.description}
            </Text>
          </View>
        </View>
        
        <View style={styles.paymentAmount}>
          <Text style={[styles.amountLabel, { color: colors.secondaryText }]}>Amount</Text>
          <Text style={[styles.amountValue, { color: colors.text }]}>
            ${message.paymentData?.amount.toFixed(2)}
          </Text>
        </View>

        {message.paymentData?.status === 'pending' ? (
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert('Payment', 'Payment processing would happen here')}
          >
            <Ionicons name="card" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.paidBadge, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.paidText}>Paid</Text>
          </View>
        )}
      </View>
      <Text style={[styles.timestamp, styles.appointmentTimestamp, { color: colors.secondaryText }]}>
        {message.timestamp}
      </Text>
    </View>
  );

  const renderQuoteMessage = (message: Message) => (
    <View
      style={[
        styles.messageBubble,
        message.sender === 'user'
          ? [styles.userBubble, { backgroundColor: colors.userBubble }]
          : [styles.otherBubble, { backgroundColor: colors.otherBubble }],
      ]}
    >
      {message.quotedMessage && (
        <View
          style={[
            styles.quotedMessage,
            {
              backgroundColor: message.sender === 'user' ? 'rgba(255,255,255,0.2)' : colors.surface,
              borderLeftColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.quotedSender,
              {
                color: message.sender === 'user' ? 'rgba(255,255,255,0.9)' : colors.primary,
              },
            ]}
          >
            {message.quotedMessage.sender}
          </Text>
          <Text
            style={[
              styles.quotedText,
              {
                color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.secondaryText,
              },
            ]}
            numberOfLines={2}
          >
            {message.quotedMessage.content}
          </Text>
        </View>
      )}
      <Text
        style={[
          styles.messageText,
          {
            color: message.sender === 'user' ? '#FFFFFF' : colors.text,
          },
        ]}
      >
        {message.content}
      </Text>
      <Text
        style={[
          styles.timestamp,
          {
            color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.secondaryText,
          },
        ]}
      >
        {message.timestamp}
      </Text>
    </View>
  );

  const handleAttachment = (type: 'image' | 'video' | 'camera') => {
    setShowAttachmentMenu(false);
    Alert.alert('Attachment', `${type} picker would open here`);
    // TODO: Implement image/video picker
    // Example with expo-image-picker:
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   quality: 1,
    // });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const messageContent = () => {
      switch (item.type) {
        case 'text':
          return renderTextMessage(item);
        case 'image':
          return renderImageMessage(item);
        case 'appointment':
          return renderAppointmentMessage(item);
        case 'quote':
          return renderQuoteMessage(item);
        case 'payment':
          return renderPaymentMessage(item);
        default:
          return renderTextMessage(item);
      }
    };

    return (
      <View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessage : styles.otherMessage]}>
        {messageContent()}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Image
            source={{ uri: headerImage }}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={[styles.headerName, { color: colors.text }]}>{headerName}</Text>
            <View style={styles.statusContainer}>
              {headerOnline && <View style={styles.onlineIndicator} />}
              <Text style={[styles.headerStatus, { color: colors.secondaryText }]}>
                {otherTyping ? 'Typing…' : headerOnline ? 'Available' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <TouchableOpacity
          style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2', borderColor: isDark ? 'rgba(239,68,68,0.35)' : '#FCA5A5' }]}
          activeOpacity={0.8}
          onPress={dismissError}
        >
          <Ionicons name="warning" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={[styles.errorText, { color: isDark ? '#FEE2E2' : '#B91C1C' }]}>{error}</Text>
          <Ionicons name="close" size={18} color={isDark ? '#FEE2E2' : '#B91C1C'} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )}

      {/* Status Tabs */}
      <View style={[styles.statusTabs, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.statusTab}>
          <View style={[styles.statusIcon, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.statusLabel, { color: colors.text }]}>Quoted</Text>
          <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.statusTab}>
          <View style={[styles.statusIcon, { backgroundColor: colors.primary }]}>
            <View style={styles.statusDot} />
          </View>
          <Text style={[styles.statusLabel, { color: colors.text }]}>Scheduled</Text>
          <View style={[styles.statusIndicator, { backgroundColor: colors.primary }]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.statusTab}>
          <View style={[styles.statusIcon, { backgroundColor: colors.border }]}>
            <View style={styles.statusDot} />
          </View>
          <Text style={[styles.statusLabel, { color: colors.secondaryText }]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={() => setShowAttachmentMenu(true)}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.secondaryText}
            value={inputText}
            onChangeText={handleInputChange}
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Menu Modal */}
      <Modal
        visible={showAttachmentMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <TouchableOpacity 
          style={styles.attachmentModalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachmentMenu(false)}
        >
          <View style={[styles.attachmentMenu, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => handleAttachment('camera')}
            >
              <View style={[styles.attachmentIconContainer, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.attachmentOptionText, { color: colors.text }]}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => handleAttachment('image')}
            >
              <View style={[styles.attachmentIconContainer, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="image" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.attachmentOptionText, { color: colors.text }]}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => handleAttachment('video')}
            >
              <View style={[styles.attachmentIconContainer, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="videocam" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.attachmentOptionText, { color: colors.text }]}>Video</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  headerStatus: {
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  statusTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statusTab: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 60,
    height: 3,
    borderRadius: 1.5,
    marginTop: 4,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  messageImage: {
    width: 250,
    height: 180,
    borderRadius: 12,
  },
  appointmentCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minWidth: 250,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  appointmentTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentDate: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 15,
    marginBottom: 8,
  },
  appointmentService: {
    fontSize: 14,
  },
  appointmentTimestamp: {
    marginTop: 4,
    marginLeft: 4,
  },
  quotedMessage: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  quotedSender: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  quotedText: {
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Payment Card Styles
  paymentCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minWidth: 280,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  paymentAmount: {
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  paidText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Attachment Menu Styles
  attachmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  attachmentMenu: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 16,
  },
  attachmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MessagingScreen;
