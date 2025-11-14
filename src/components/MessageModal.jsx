import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { X, Send, Check, CheckCheck, User, ChevronDown, Search } from 'lucide-react';

const MessageModal = ({ tenant, currentUser, userProfile, isOpen, onClose, senderRole = 'landlord' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const [recipientType, setRecipientType] = useState('tenant');
  const [recipientList, setRecipientList] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(tenant);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Initialize selected recipient when modal opens
  useEffect(() => {
    if (tenant) {
      setSelectedRecipient(tenant);
    }
  }, [tenant]);

  // Fetch available recipients based on type
  useEffect(() => {
    // Only fetch recipients if property manager/maintenance AND no pre-selected tenant
    if (!isOpen || !currentUser || (senderRole !== 'property_manager' && senderRole !== 'maintenance') || tenant) return;

    const fetchRecipients = async () => {
      try {
        let recipientsData = [];

        if (recipientType === 'tenant') {
          const tenantsQuery = query(collection(db, 'tenants'));
          const snapshot = await getDocs(tenantsQuery);
          recipientsData = snapshot.docs.map(doc => {
            const data = doc.data();
            // Try multiple ways to get the user ID
            const userId = data.userId || data.uid || data.id || doc.id;
            return {
              id: userId,
              tenantDocId: doc.id,
              ...data,
              type: 'tenant',
              displayName: data.name || data.displayName || 'Tenant',
              role: 'tenant'
            };
          }).filter(r => r.id); // Filter out any without valid ID
        } else if (recipientType === 'landlord') {
          const usersQuery = query(collection(db, 'users'), where('role', '==', 'landlord'));
          const snapshot = await getDocs(usersQuery);
          recipientsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const userId = data.uid || data.userId || doc.id;
            return {
              id: userId,
              ...data,
              type: 'landlord',
              displayName: data.displayName || data.name || data.email || 'Landlord',
              role: 'landlord'
            };
          }).filter(r => r.id);
        } else if (recipientType === 'property_manager') {
          const teamQuery = query(collection(db, 'teamMembers'), where('role', '==', 'property_manager'));
          const snapshot = await getDocs(teamQuery);
          recipientsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const userId = data.userId || data.uid || data.id || doc.id;
            return {
              id: userId,
              teamMemberDocId: doc.id,
              ...data,
              type: 'property_manager',
              displayName: data.name || data.displayName || 'Property Manager',
              role: 'property_manager'
            };
          }).filter(r => r.id);
        } else if (recipientType === 'maintenance') {
          const teamQuery = query(collection(db, 'teamMembers'), where('role', '==', 'maintenance'));
          const snapshot = await getDocs(teamQuery);
          recipientsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const userId = data.userId || data.uid || data.id || doc.id;
            return {
              id: userId,
              teamMemberDocId: doc.id,
              ...data,
              type: 'maintenance',
              displayName: data.name || data.displayName || 'Maintenance',
              role: 'maintenance'
            };
          }).filter(r => r.id);
        }

        setRecipientList(recipientsData);

        // Auto-select first recipient if available
        if (recipientsData.length > 0) {
          setSelectedRecipient(recipientsData[0]);
        }
      } catch (error) {
        console.error('Error fetching recipients:', error);
      }
    };

    fetchRecipients();
  }, [isOpen, recipientType, currentUser, senderRole, tenant]);

  // Reset search query when recipient type changes
  useEffect(() => {
    setSearchQuery('');
  }, [recipientType]);

  // Create unique conversation ID
  const getConversationId = () => {
    if (!currentUser || !selectedRecipient) return null;
    const ids = [currentUser.uid, selectedRecipient.id].sort();
    const conversationId = `${ids[0]}_${ids[1]}`;
    console.log('🔑 ConversationId generated:', conversationId, {
      currentUserId: currentUser.uid,
      recipientId: selectedRecipient.id
    });
    return conversationId;
  };

  // Fetch messages
  useEffect(() => {
    if (!isOpen || !selectedRecipient || !currentUser) return;

    const conversationId = getConversationId();
    if (!conversationId) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
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

      // Mark unread messages as read when viewing the conversation
      const unreadMessages = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.recipientId === currentUser.uid && data.read === false;
      });

      if (unreadMessages.length > 0) {
        console.log(`📖 Marking ${unreadMessages.length} messages as read`);
        const updatePromises = unreadMessages.map(messageDoc =>
          updateDoc(doc(db, 'messages', messageDoc.id), { read: true })
        );
        await Promise.all(updatePromises);
      }
    });

    return () => unsubscribe();
  }, [isOpen, selectedRecipient, currentUser]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading || !selectedRecipient) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      const conversationId = getConversationId();
      const recipientRole = selectedRecipient.role || selectedRecipient.type || 'tenant';
      const recipientName = selectedRecipient.displayName || selectedRecipient.name || 'Unknown';

      console.log('📤 Sending message:', {
        conversationId,
        text: messageText,
        senderId: currentUser.uid,
        recipientId: selectedRecipient.id,
        senderRole,
        recipientRole
      });

      const messageDoc = await addDoc(collection(db, 'messages'), {
        conversationId: conversationId,
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || userProfile?.name || 'User',
        senderRole: senderRole,
        recipientId: selectedRecipient.id,
        recipientName: recipientName,
        recipientRole: recipientRole,
        text: messageText,
        timestamp: serverTimestamp(),
        read: false,
        propertyName: selectedRecipient.property || '',
        unit: selectedRecipient.unit || '',
        participants: [currentUser.uid, selectedRecipient.id] // Add participants array for queries
      });

      console.log('✅ Message saved to Firestore:', messageDoc.id);

      // Create or update conversation document for easy access
      await addDoc(collection(db, 'conversations'), {
        conversationId: conversationId,
        participants: [currentUser.uid, selectedRecipient.id],
        participantNames: {
          [currentUser.uid]: userProfile?.displayName || userProfile?.name || 'User',
          [selectedRecipient.id]: recipientName
        },
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: currentUser.uid,
        unreadCount: {
          [currentUser.uid]: 0,
          [selectedRecipient.id]: 1
        },
        propertyName: selectedRecipient.property || '',
        unit: selectedRecipient.unit || ''
      });

      // Create notification for the recipient
      const senderTitle = senderRole === 'landlord' ? 'Landlord' :
                         senderRole === 'property_manager' ? 'Property Manager' :
                         senderRole === 'maintenance' ? 'Maintenance Team' : 'User';

      await addDoc(collection(db, 'notifications'), {
        userId: selectedRecipient.id,
        type: 'message',
        title: `New Message from ${senderTitle}`,
        message: `You have a new message: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
        read: false,
        timestamp: serverTimestamp(),
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || userProfile?.name || senderTitle,
        senderRole: senderRole,
        conversationId: conversationId
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#003366] dark:bg-[#004080] rounded-full flex items-center justify-center text-white font-semibold">
                {selectedRecipient?.name?.split(' ').map(n => n[0]).join('') || selectedRecipient?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{selectedRecipient?.displayName || selectedRecipient?.name || 'Select Recipient'}</h3>
                {selectedRecipient?.property && selectedRecipient?.unit && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">{selectedRecipient.property} - Unit {selectedRecipient.unit}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Recipient Type Selector - Only for Property Managers/Maintenance composing NEW messages (no pre-selected tenant) */}
          {(senderRole === 'property_manager' || senderRole === 'maintenance') && !tenant && (
            <div className="flex gap-2">
              <button
                onClick={() => setRecipientType('tenant')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  recipientType === 'tenant'
                    ? 'bg-[#003366] dark:bg-[#004080] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tenant
              </button>
              <button
                onClick={() => setRecipientType('landlord')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  recipientType === 'landlord'
                    ? 'bg-[#003366] dark:bg-[#004080] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Landlord
              </button>
              {senderRole === 'maintenance' && (
                <button
                  onClick={() => setRecipientType('property_manager')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    recipientType === 'property_manager'
                      ? 'bg-[#003366] dark:bg-[#004080] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  PM
                </button>
              )}
              {senderRole === 'property_manager' && (
                <button
                  onClick={() => setRecipientType('maintenance')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    recipientType === 'maintenance'
                      ? 'bg-[#003366] dark:bg-[#004080] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Maintenance
                </button>
              )}
            </div>
          )}

          {/* Recipient Selector Dropdown - Only for Property Managers/Maintenance composing NEW messages */}
          {(senderRole === 'property_manager' || senderRole === 'maintenance') && !tenant && recipientList.length > 0 && (
            <div className="mt-2 relative">
              <button
                onClick={() => {
                  setShowRecipientDropdown(!showRecipientDropdown);
                  if (!showRecipientDropdown) {
                    setSearchQuery('');
                  }
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <span className="text-gray-900 dark:text-white">
                  {selectedRecipient?.displayName || selectedRecipient?.name || 'Select a recipient'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showRecipientDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search recipients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>
                  {/* Recipients List */}
                  <div className="max-h-48 overflow-y-auto">
                    {recipientList
                      .filter((recipient) => {
                        const name = (recipient.displayName || recipient.name || '').toLowerCase();
                        const property = (recipient.property || '').toLowerCase();
                        const unit = (recipient.unit || '').toLowerCase();
                        const search = searchQuery.toLowerCase();
                        return name.includes(search) || property.includes(search) || unit.includes(search);
                      })
                      .map((recipient) => (
                        <button
                          key={recipient.id}
                          onClick={() => {
                            setSelectedRecipient(recipient);
                            setShowRecipientDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition"
                        >
                          {recipient.displayName || recipient.name}
                          {recipient.property && recipient.unit && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              ({recipient.property} - Unit {recipient.unit})
                            </span>
                          )}
                        </button>
                      ))}
                    {recipientList.filter((recipient) => {
                      const name = (recipient.displayName || recipient.name || '').toLowerCase();
                      const property = (recipient.property || '').toLowerCase();
                      const unit = (recipient.unit || '').toLowerCase();
                      const search = searchQuery.toLowerCase();
                      return name.includes(search) || property.includes(search) || unit.includes(search);
                    }).length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        No recipients found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <User className="w-16 h-16 mb-4 opacity-50" />
              <p>No messages yet</p>
              {selectedRecipient && (
                <p className="text-sm mt-1">Start a conversation with {selectedRecipient.displayName || selectedRecipient.name}</p>
              )}
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