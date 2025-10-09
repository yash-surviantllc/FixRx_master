import React, { useState, useEffect } from 'react';
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
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type ChatListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatList'>;

// Mock data for chat conversations
const MOCK_CONVERSATIONS = [
  {
    id: '1',
    userId: 'user1',
    userName: 'John Smith',
    userImage: 'https://randomuser.me/api/portraits/men/1.jpg',
    lastMessage: 'Hi there! I was wondering about the availability for next week...',
    time: '2h ago',
    unreadCount: 2,
    isOnline: true,
    lastActive: '2h ago'
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Sarah Johnson',
    userImage: 'https://randomuser.me/api/portraits/women/2.jpg',
    lastMessage: 'Thanks for the great service!',
    time: '1d ago',
    unreadCount: 0,
    isOnline: false,
    lastActive: '5h ago'
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Michael Brown',
    userImage: 'https://randomuser.me/api/portraits/men/3.jpg',
    lastMessage: 'Can we reschedule our appointment?',
    time: '2d ago',
    unreadCount: 1,
    isOnline: true,
    lastActive: '30m ago'
  },
  {
    id: '4',
    userId: 'user4',
    userName: 'Emily Davis',
    userImage: 'https://randomuser.me/api/portraits/women/4.jpg',
    lastMessage: 'I\'ve sent the payment. Please confirm once received.',
    time: '3d ago',
    unreadCount: 0,
    isOnline: false,
    lastActive: '1d ago'
  },
  {
    id: '5',
    userId: 'user5',
    userName: 'David Wilson',
    userImage: 'https://randomuser.me/api/portraits/men/5.jpg',
    lastMessage: 'The work looks great, thank you!',
    time: '1w ago',
    unreadCount: 0,
    isOnline: true,
    lastActive: '2h ago'
  },
];

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<ChatListScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<typeof MOCK_CONVERSATIONS>([]);

  // Simulate loading conversations
  useEffect(() => {
    const timer = setTimeout(() => {
      setConversations(MOCK_CONVERSATIONS);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => 
    conversation.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render each conversation item
  const renderConversation = ({ item }: { item: typeof MOCK_CONVERSATIONS[0] }) => (
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
      ) : filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
