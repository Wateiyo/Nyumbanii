import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { X, Send, Check, CheckCheck, User } from 'lucide-react';

const MessageModal = ({ tenant, currentUser, userProfile, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isOpen]);

  // Create unique conversation ID
  const getConversationId = () => {
    if (!currentUser || !tenant) return null;
    const ids = [currentUser.uid, tenant.id].sort();
    const conversationId = `${ids[0]}_${ids[1]}`;
    console.log('🔑 ConversationId generated:', conversationId, {
      currentUserId: currentUser.uid,
      tenantId: tenant.id
    });
    return conversationId;
  };

  // Fetch messages
  useEffect(() => {
    if (!isOpen || !tenant || !currentUser) return;

    const conversationId = getConversationId();
    if (!conversationId) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      console.log('📨 Messages snapshot received:', {
        conversationId,
        numMessages: snapshot.docs.length,
        messages: snapshot.docs.map(doc => ({
          id: doc.id,
          text: doc.data().text,
          senderId: doc.data().senderId,
          timestamp: doc.data().timestamp
        }))
      });
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
      console.log('✅ Messages state updated:', messagesData.length, 'messages');
    });

    return () => unsubscribe();
  }, [isOpen, tenant, currentUser]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      const conversationId = getConversationId();
      console.log('📤 Sending message:', {
        conversationId,
        text: messageText,
        senderId: currentUser.uid,
        recipientId: tenant.id
      });

      const messageDoc = await addDoc(collection(db, 'messages'), {
        conversationId: conversationId,
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || 'Landlord',
        senderRole: 'landlord',
        recipientId: tenant.id,
        recipientName: tenant.name,
        recipientRole: 'tenant',
        text: messageText,
        timestamp: serverTimestamp(),
        read: false,
        propertyName: tenant.property,
        unit: tenant.unit
      });

      console.log('✅ Message saved to Firestore:', messageDoc.id);

      // Create or update conversation document for easy access
      await addDoc(collection(db, 'conversations'), {
        conversationId: conversationId,
        participants: [currentUser.uid, tenant.id],
        participantNames: {
          [currentUser.uid]: userProfile?.displayName || 'Landlord',
          [tenant.id]: tenant.name
        },
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: currentUser.uid,
        unreadCount: {
          [currentUser.uid]: 0,
          [tenant.id]: 1
        },
        propertyName: tenant.property,
        unit: tenant.unit
      });

      // Optionally create a notification for the tenant
      await addDoc(collection(db, 'notifications'), {
        userId: tenant.id,
        type: 'message',
        title: 'New Message from Landlord',
        message: `You have a new message: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
        read: false,
        timestamp: serverTimestamp(),
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || 'Landlord'
      });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        conversationId: getConversationId()
      });
      alert('Failed to send message. Please try again.');
      setNewMessage(messageText); // Restore message if failed
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (isYesterday) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#003366] dark:bg-[#004080] rounded-full flex items-center justify-center text-white font-semibold">
              {tenant.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{tenant.name}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{tenant.property} - Unit {tenant.unit}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <User className="w-16 h-16 mb-4 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start a conversation with {tenant.name}</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwnMessage = message.senderId === currentUser?.uid;
                const showDate = index === 0 || 
                  (message.timestamp && messages[index - 1].timestamp &&
                   new Date(message.timestamp.toDate ? message.timestamp.toDate() : message.timestamp).toDateString() !== 
                   new Date(messages[index - 1].timestamp.toDate ? messages[index - 1].timestamp.toDate() : messages[index - 1].timestamp).toDateString());

                return (
                  <React.Fragment key={message.id}>
                    {showDate && (
                      <div className="flex justify-center my-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                          {message.timestamp && new Date(message.timestamp.toDate ? message.timestamp.toDate() : message.timestamp).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-[#003366] dark:bg-[#004080] text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className={`text-xs ${
                              isOwnMessage ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatTime(message.timestamp)}
                            </span>
                            {isOwnMessage && (
                              <span className="text-blue-100 dark:text-blue-200">
                                {message.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#003366] dark:focus:ring-[#004080] focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || loading}
              className="px-4 py-2 bg-[#003366] dark:bg-[#004080] text-white rounded-lg hover:bg-[#002244] dark:hover:bg-[#003366] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;