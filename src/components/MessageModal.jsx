import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  or,
  and
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
    return `${ids[0]}_${ids[1]}`;
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
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
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
      
      await addDoc(collection(db, 'messages'), {
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
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setNewMessage(messageText); // Restore message if failed
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold">
              {tenant.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
              <p className="text-xs text-gray-600">{tenant.property} - Unit {tenant.unit}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
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
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
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
                            ? 'bg-[#003366] text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className={`text-xs ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </span>
                            {isOwnMessage && (
                              <span className="text-blue-100">
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
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || loading}
              className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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