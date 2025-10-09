import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type MessagingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Messaging'>;
type MessagingScreenRouteProp = RouteProp<RootStackParamList, 'Messaging'>;

interface Message {
  id: string;
  type: 'text' | 'image' | 'appointment' | 'quote' | 'payment';
  content: string;
  sender: 'user' | 'other';
  timestamp: string;
  imageUrl?: string;
  appointmentData?: {
    date: string;
    time: string;
    service: string;
  };
  quotedMessage?: {
    content: string;
    sender: string;
  };
  paymentData?: {
    amount: number;
    description: string;
    status: 'pending' | 'paid';
  };
}

// Placeholder messages for demo
const PLACEHOLDER_MESSAGES: Message[] = [
  {
    id: '1',
    type: 'text',
    content: 'Hi! I need help with electrical work.',
    sender: 'user',
    timestamp: '9:34 AM',
  },
  {
    id: '2',
    type: 'text',
    content: 'Sure! What kind of electrical work do you need?',
    sender: 'other',
    timestamp: '9:35 AM',
  },
  {
    id: '3',
    type: 'text',
    content: 'I need to install new outlets in my living room and fix some wiring issues.',
    sender: 'user',
    timestamp: '9:36 AM',
  },
  {
    id: '4',
    type: 'image',
    content: 'Here\'s a photo of the area',
    sender: 'user',
    timestamp: '9:37 AM',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
  },
  {
    id: '5',
    type: 'text',
    content: 'I can help with that. Let me check my schedule.',
    sender: 'other',
    timestamp: '9:40 AM',
  },
  {
    id: '6',
    type: 'appointment',
    content: 'How about this time?',
    sender: 'other',
    timestamp: '10:10 AM',
    appointmentData: {
      date: 'Tomorrow, Sep 16',
      time: '2:00 PM - 4:00 PM',
      service: 'Electrical Work Service',
    },
  },
  {
    id: '7',
    type: 'text',
    content: 'Looks good! When can you start?',
    sender: 'user',
    timestamp: '10:02 AM',
  },
  {
    id: '8',
    type: 'quote',
    content: 'I can start tomorrow at the scheduled time.',
    sender: 'other',
    timestamp: '10:15 AM',
    quotedMessage: {
      content: 'Looks good! When can you start?',
      sender: 'You',
    },
  },
  {
    id: '9',
    type: 'payment',
    content: 'Payment request for electrical work',
    sender: 'other',
    timestamp: '10:20 AM',
    paymentData: {
      amount: 350.00,
      description: 'Electrical Work Service - Outlet Installation',
      status: 'pending',
    },
  },
];

const MessagingScreen: React.FC = () => {
  const navigation = useNavigation<MessagingScreenNavigationProp>();
  const route = useRoute<MessagingScreenRouteProp>();
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;
  
  const [messages, setMessages] = useState<Message[]>(PLACEHOLDER_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const conversationId = route.params?.conversationId || 'default';
  const userName = route.params?.userName || 'User';
  const userImage = route.params?.userImage || 'https://randomuser.me/api/portraits/women/1.jpg';
  const isOnline = route.params?.isOnline ?? false;

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

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'text',
        content: inputText.trim(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

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
            source={{ uri: userImage }}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={[styles.headerName, { color: colors.text }]}>{userName}</Text>
            <View style={styles.statusContainer}>
              {isOnline && <View style={styles.onlineIndicator} />}
              <Text style={[styles.headerStatus, { color: colors.secondaryText }]}>
                {isOnline ? 'Available' : 'Offline'}
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
            onChangeText={setInputText}
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
