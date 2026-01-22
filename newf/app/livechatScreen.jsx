// app/livechatScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

const API_BASE_URL = 'https://healthprof.com.ng/api';

export default function LiveChatScreen() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const flatListRef = useRef(null);
  const textInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    initializeChat();
    
    // Request media library permissions
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to send images.');
      }
    })();
  }, []);

  const initializeChat = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      console.log('User ID from storage:', storedUserId);
      
      if (storedUserId) {
        setUserId(storedUserId);
        await fetchMessages(storedUserId);
      } else {
        Alert.alert('Error', 'User ID not found. Please login again.');
        router.back();
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      console.log('Fetching messages for user:', userId);
      const response = await axios.get(`${API_BASE_URL}/chat/messages/${userId}/`);
      console.log('Full API response:', response);
      
      // Handle different response formats
      if (response.data && response.data.messages) {
        setMessages(response.data.messages);
        setAdminOnline(response.data.adminOnline);
        console.log('Using new format, adminOnline:', response.data.adminOnline);
      } else if (Array.isArray(response.data)) {
        setMessages(response.data);
        const lastMessage = response.data[response.data.length - 1];
        const isAdminOnline = lastMessage && lastMessage.userId === 'admin';
        setAdminOnline(isAdminOnline);
        console.log('Using old format, guessed adminOnline:', isAdminOnline);
      } else {
        setMessages([]);
        setAdminOnline(false);
        console.log('No messages or unexpected format');
      }
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      console.log('Error details:', error.response?.data);
      setMessages([]);
      setAdminOnline(false);
    }
  };

  // Poll for new messages
  useEffect(() => {
    if (userId) {
      const interval = setInterval(() => {
        fetchMessages(userId);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [userId]);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Remove cropping
        aspect: undefined, // Remove aspect ratio constraint
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const openImageModal = (imageUri) => {
    setViewingImage(imageUri);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setViewingImage(null);
  };

  const getLastUnrepliedUserMessage = () => {
    if (messages.length === 0) return null;
    
    const userMessages = messages.filter(msg => msg.userId === userId && !msg.id.startsWith('temp-'));
    if (userMessages.length === 0) return null;
    
    const lastUserMessage = userMessages[userMessages.length - 1];
    const lastUserMessageIndex = messages.findIndex(msg => msg.id === lastUserMessage.id);
    const messagesAfter = messages.slice(lastUserMessageIndex + 1);
    const hasAdminReplyAfter = messagesAfter.some(msg => msg.userId === 'admin');
    
    return !hasAdminReplyAfter ? lastUserMessage.id : null;
  };

  const sendMessage = async () => {
    const messageText = newMessage.trim();
    const hasImage = selectedImage !== null;

    if (!messageText && !hasImage) {
      Alert.alert('Message Required', 'Please enter a message or select an image');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setSending(true);
      
      // Create temporary message for immediate UI update
      const tempMessage = {
        id: 'temp-' + Date.now().toString(),
        userId: userId,
        text: messageText,
        image: selectedImage ? selectedImage.uri : null,
        timestamp: new Date().toISOString(),
      };
      
      // Add temporary message to UI immediately
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      setSelectedImage(null);
      
      // Dismiss keyboard after sending
      Keyboard.dismiss();
      scrollToBottom();

      // Prepare form data
      const formData = new FormData();
      formData.append('userId', userId.toString());
      
      if (messageText) {
        formData.append('text', messageText);
      }
      
      if (selectedImage) {
        const imageFile = {
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: `chat_image_${Date.now()}.jpg`,
        };
        formData.append('image', imageFile);
      }

      console.log('Sending message to backend...');
      console.log('User ID:', userId);
      console.log('Message text:', messageText);
      console.log('Has image:', !!selectedImage);

      const response = await axios.post(`${API_BASE_URL}/chat/send/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 15000,
      });

      console.log('Backend response:', response.data);

      if (response.data.success) {
        console.log('Message sent successfully to backend');
        
        // Replace temporary message with real one from server
        if (response.data.message) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempMessage.id ? response.data.message : msg
            )
          );
        } else {
          // If no message returned, remove temp message and refresh
          setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
          await fetchMessages(userId);
        }
        
      } else {
        throw new Error(response.data.error || 'Failed to send message');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      console.log('Error response data:', error.response?.data);
      
      // Remove temporary message if sending failed
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      
      let errorMessage = 'Failed to send message. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = `Server error: ${error.response.data.error}`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Send Error', errorMessage);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.userId === userId;
    const isTemp = item.id.startsWith('temp-');
    const lastUnrepliedMessageId = getLastUnrepliedUserMessage();
    const showPendingReply = !adminOnline && isUser && !isTemp && item.id === lastUnrepliedMessageId;
    const hasImage = item.image || item.image_url;
    const imageUri = item.image || item.image_url;
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.adminMessage,
        isTemp && styles.tempMessage
      ]}>
        {/* Image */}
        {hasImage && imageUri && (
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={() => openImageModal(imageUri)}
            activeOpacity={0.7}
          >
            <Image 
              source={{ uri: imageUri }} 
              style={styles.messageImage}
              resizeMode="cover"
            />
            {/* Image Overlay with Send Icon */}
            <View style={styles.imageOverlay}>
              <View style={styles.sendIconContainer}>
                <Ionicons name="send" size={16} color="#fff" />
              </View>
            </View>
            {isTemp && (
              <View style={styles.imageUploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        
        {/* Text Message */}
        {item.text && (
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.adminMessageText
          ]}>
            {item.text}
            {isTemp && !hasImage && ' ⏳'}
          </Text>
        )}
        
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
          {isTemp && ' (Sending...)'}
        </Text>
        
        {/* Show pending indicator only on the last unreplied user message */}
        {showPendingReply && (
          <View style={styles.pendingIndicator}>
            <Ionicons name="time-outline" size={12} color="#94A3B8" />
            <Text style={styles.pendingText}>Pending reply</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Live Support</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator,
              adminOnline ? styles.statusOnline : styles.statusOffline
            ]} />
            <Text style={styles.statusText}>
              {adminOnline ? 'Admin Online' : 'Admin Offline'}
            </Text>
            {!adminOnline && (
              <Text style={styles.offlineNote}>
                You can still send messages. Admin will reply when available.
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContent,
          messages.length === 0 && styles.emptyMessagesContent
        ]}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              {adminOnline 
                ? 'Start a conversation with our support team' 
                : 'Admin is offline. You can still send messages and they will reply when available.'
              }
            </Text>
          </View>
        }
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.selectedImageContainer}>
          <View style={styles.selectedImageWrapper}>
            <Image 
              source={{ uri: selectedImage.uri }} 
              style={styles.selectedImage}
              resizeMode="cover"
            />
            {/* Send Icon Overlay on Selected Image */}
            <View style={styles.selectedImageOverlay}>
              <View style={styles.sendIconContainer}>
                <Ionicons name="send" size={20} color="#fff" />
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.removeImageButton}
            onPress={removeSelectedImage}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        {/* Image Picker Button */}
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={pickImage}
          disabled={sending}
        >
          <Ionicons name="image-outline" size={24} color="#6366F1" />
        </TouchableOpacity>

        <TextInput
          ref={textInputRef}
          style={[
            styles.textInput,
            !adminOnline && styles.offlineInput
          ]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={
            adminOnline 
              ? "Type your message..." 
              : "Admin is offline. Type your message and they will reply when available..."
          }
          placeholderTextColor="#94A3B8"
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          blurOnSubmit={false}
        />

        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!newMessage.trim() && !selectedImage || sending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={(!newMessage.trim() && !selectedImage) || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Admin Offline Banner */}
      {!adminOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="information-circle" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>
            Admin is offline. Your messages will be delivered and they will reply when available.
          </Text>
        </View>
      )}

      {/* Image View Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity 
            style={styles.imageModalBackground}
            onPress={closeImageModal}
            activeOpacity={1}
          >
            {viewingImage && (
              <Image 
                source={{ uri: viewingImage }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={closeImageModal}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginBottom: 35
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(255, 238, 204)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 35,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statusContainer: {
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusOnline: {
    backgroundColor: '#10B981',
  },
  statusOffline: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  offlineNote: {
    fontSize: 11,
    color: '#6366F1',
    marginTop: 2,
    fontStyle: 'italic',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyMessagesContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    position: 'relative',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  adminMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tempMessage: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  adminMessageText: {
    color: '#1E293B',
  },
  imageContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  // New image overlay styles
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  sendIconContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-end',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 9,
    color: '#94A3B8',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    color: '#1E293B',
    marginRight: 8,
  },
  offlineInput: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  sendButton: {
    backgroundColor: '#6366F1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  selectedImageContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    position: 'relative',
  },
  selectedImageWrapper: {
    position: 'relative',
    width: 120,
    height: 90,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  // Selected image overlay
  selectedImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  offlineBanner: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
  },
  offlineBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  closeModalButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
  },
});