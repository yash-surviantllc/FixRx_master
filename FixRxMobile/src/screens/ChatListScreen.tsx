import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import messagingService from '../services/messagingService';
import { Conversation } from '../types/messaging';
import { useWebSocket } from '../services/websocketService';
import { useAppContext } from '../context/AppContext';

type ChatListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatList'>;

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<ChatListScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { connect, on, joinConversation, leaveConversation } = useWebSocket();
  const { userProfile } = useAppContext();
  const currentUserId = userProfile?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const joinedConversationIdsRef = useRef<Set<string>>(new Set());

  const normalizeConversation = useCallback((conversation: Conversation) => {
    const primaryParticipant = conversation.participants?.find((participant) => participant.userId !== currentUserId);

    return {
      id: conversation.id,
      userId: primaryParticipant?.userId || conversation.id,
      userName: primaryParticipant
        ? `${primaryParticipant.firstName || ''} ${primaryParticipant.lastName || ''}`.trim() || 'Conversation'
        : 'Conversation',
      userImage: primaryParticipant?.avatarUrl || 'https://via.placeholder.com/50',
      lastMessage: conversation.lastMessage?.content || 'Start a conversation',
      time: conversation.lastMessage?.createdAt
        ? new Date(conversation.lastMessage.createdAt).toLocaleString()
        : new Date(conversation.updatedAt || conversation.createdAt).toLocaleString(),
      unreadCount: conversation.unreadCount || 0,
      isOnline: false,
      lastActive: '',
    };
  }, []);

  const loadConversations = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      }

      const response = await messagingService.listConversations();
      if (response.success && response.data?.conversations) {
        setConversations(response.data.conversations);
        response.data.conversations.forEach((conversation) => {
          if (!joinedConversationIdsRef.current.has(conversation.id)) {
            joinConversation(conversation.id);
            joinedConversationIdsRef.current.add(conversation.id);
          }
        });
      }

      if (showLoading) {
        setIsLoading(false);
      }
    },
    [joinConversation]
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadConversations(false);
    setIsRefreshing(false);
  }, [loadConversations]);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    loadConversations();

    const unsubscribeMessage = on('message:new', (message) => {
      if (!message?.conversationId) {
        return;
      }
      let shouldJoinConversation = false;
      setConversations((prev) => {
        const next = [...prev];
        const conversationId = message.conversationId as string;
        const existingIndex = next.findIndex((conversation) => conversation.id === conversationId);

        const baseLastMessage: NonNullable<Conversation['lastMessage']> = {
          id: message.id,
          conversationId,
          senderId: message.senderId,
          messageType: message.messageType,
          content: message.content || '',
          metadata: message.metadata || {},
          attachments: message.attachments,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          deletedAt: message.deletedAt,
          sender: message.sender,
        };

        if (existingIndex !== -1) {
          const existing = next[existingIndex];
          const isFromOther = message.senderId && currentUserId
            ? message.senderId !== currentUserId
            : true;

          next[existingIndex] = {
            ...existing,
            lastMessage: baseLastMessage,
            unreadCount: isFromOther ? (existing.unreadCount || 0) + 1 : existing.unreadCount || 0,
            updatedAt: message.createdAt || existing.updatedAt,
          };
        } else {
          shouldJoinConversation = true;
          const now = message.createdAt || new Date().toISOString();
          const newConversation: Conversation = {
            id: conversationId,
            title: undefined,
            conversationType: 'consumer_vendor',
            createdAt: now,
            updatedAt: now,
            metadata: {},
            participants: [],
            lastMessage: baseLastMessage,
            unreadCount:
              message.senderId && currentUserId && message.senderId !== currentUserId
                ? 1
                : 0,
          };
          next.unshift(newConversation);
        }

        next.sort((a, b) => {
          const aTime = new Date(a.lastMessage?.createdAt || a.updatedAt || a.createdAt).getTime();
          const bTime = new Date(b.lastMessage?.createdAt || b.updatedAt || b.createdAt).getTime();
          return bTime - aTime;
        });

        return next;
      });

      if (shouldJoinConversation && !joinedConversationIdsRef.current.has(message.conversationId)) {
        joinConversation(message.conversationId);
        joinedConversationIdsRef.current.add(message.conversationId);
      }
    });

    const unsubscribeCreated = on('conversation:created', async (payload: Conversation) => {
      if (!payload?.id) {
        return;
      }

      let shouldJoinConversation = false;
      setConversations((prev) => {
        const exists = prev.some((item) => item.id === payload.id);
        if (exists) {
          return prev;
        }
        shouldJoinConversation = true;
        return prev;
      });

      if (!shouldJoinConversation) {
        return;
      }

      try {
        const conversationResponse = await messagingService.getConversation(payload.id);
        if (conversationResponse.success && conversationResponse.data) {
          setConversations((prev) => [conversationResponse.data!, ...prev]);
        } else {
          setConversations((prev) => [payload, ...prev]);
        }
      } catch (serviceError) {
        console.error('Failed to hydrate conversation:', serviceError);
        setConversations((prev) => [payload, ...prev]);
      }

      if (!joinedConversationIdsRef.current.has(payload.id)) {
        joinConversation(payload.id);
        joinedConversationIdsRef.current.add(payload.id);
      }
    });

    const unsubscribeRead = on('conversation:read', (payload) => {
      if (!payload?.conversationId) {
        return;
      }

      if (payload.userId === currentUserId) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === payload.conversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )
        );
      }
    });

    return () => {
      unsubscribeMessage?.();
      unsubscribeCreated?.();
      unsubscribeRead?.();
      joinedConversationIdsRef.current.forEach((id) => leaveConversation(id));
      joinedConversationIdsRef.current.clear();
    };
  }, [loadConversations, on, joinConversation, leaveConversation, currentUserId]);

  const normalizedConversations = conversations
    .map(normalizeConversation)
    .filter((conversation) =>
      conversation.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Render each conversation item
  const renderConversation = ({ item }: { item: ReturnType<typeof normalizeConversation> }) => (
    <TouchableOpacity 
      style={[styles.conversationItem, { borderBottomColor: colors.border }]}
      onPress={() => {
        navigation.navigate('Messaging', { 
          conversationId: item.id,
          userName: item.userName,
          userImage: item.userImage,
          isOnline: item.isOnline,
        });
      }}
    >
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: item.userImage }} 
          style={styles.avatar}
          defaultSource={{ uri: 'https://via.placeholder.com/50' }}
        />
        {item.isOnline && <View style={styles.onlineBadge} />}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text 
            style={[
              styles.userName,
              { color: colors.primaryText },
              item.unreadCount > 0 && styles.unreadUserName
            ]}
            numberOfLines={1}
          >
            {item.userName}
          </Text>
          <Text 
            style={[
              styles.time,
              { color: colors.secondaryText },
              item.unreadCount > 0 && styles.unreadTime
            ]}
          >
            {item.time}
          </Text>
        </View>
        
        <View style={styles.conversationFooter}>
          <Text 
            style={[
              styles.lastMessage,
              { color: colors.secondaryText },
              item.unreadCount > 0 && { color: isDarkMode ? '#FFFFFF' : '#1F2937', fontWeight: '600' }
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount > 9 ? '9+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
        
        {!item.isOnline && item.lastActive && (
          <Text style={[styles.lastSeenText, { color: colors.secondaryText }]}>
            Last active {item.lastActive}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Messages</Text>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.primaryText }]}
          placeholder="Search conversations..."
          placeholderTextColor={colors.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* New Message Button */}
      <TouchableOpacity 
        style={[styles.newMessageButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          // Navigate to new message screen
          // navigation.navigate('NewMessage');
        }}
      >
        <Ionicons name="create-outline" size={20} color="#FFFFFF" />
        <Text style={styles.newMessageButtonText}>New Message</Text>
      </TouchableOpacity>
      
      {/* Conversations List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading conversations...</Text>
        </View>
      ) : normalizedConversations.length > 0 ? (
        <FlatList
          data={normalizedConversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.secondaryText} />
          <Text style={[styles.emptyStateTitle, { color: colors.primaryText }]}>No conversations found</Text>
          <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
            {searchQuery 
              ? 'No conversations match your search.' 
              : 'Start a new conversation to get started!'
            }
          </Text>
          <TouchableOpacity 
            style={styles.startChatButton}
            onPress={() => {
              // Navigate to new message screen
              // navigation.navigate('NewMessage');
            }}
          >
            <Text style={styles.startChatButtonText}>Start a Chat</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'transparent',
    fontSize: 16,
    color: '#1F2937',
  },
  newMessageButton: {
    margin: 16,
    padding: 12,
    backgroundColor: '#0D6EFD',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMessageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  startChatButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0D6EFD',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  unreadUserName: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
  },
  unreadTime: {
    color: '#0D6EFD',
    fontWeight: '600',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  unreadMessage: {
    color: '#1F2937',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#0D6EFD',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lastSeenText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
});

export default ChatListScreen;
