import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import {
  Home,
  Users,
  Building,
  Wrench,
  Bell,
  LogOut,
  X,
  Calendar,
  Mail,
  Phone,
  CalendarCheck,
  MapPin,
  Menu,
  DollarSign,
  Clock,
  MessageSquare,
  Trash2,
  Plus,
  Send,
  Search,
  ChevronLeft,
  User,
  Check,
  CheckCheck
} from 'lucide-react';
import MessageModal from '../components/MessageModal';

const PropertyManagerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [teamMember, setTeamMember] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [viewingBookings, setViewingBookings] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedViewing, setSelectedViewing] = useState(null);
  const [viewingFilter, setViewingFilter] = useState('all');
  const [maintenanceStaff, setMaintenanceStaff] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isComposingNewMessage, setIsComposingNewMessage] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Conversation-based messaging states
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationFilter, setConversationFilter] = useState('all'); // all, tenant, landlord, maintenance
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newConversationMessage, setNewConversationMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const conversationMessagesEndRef = useRef(null);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    property: '',
    unit: '',
    issue: '',
    description: '',
    priority: 'medium',
    scheduledDate: '',
    scheduledTime: ''
  });

  // Fetch team member data for the current user
  useEffect(() => {
    if (!currentUser?.uid) {
      navigate('/login');
      return;
    }

    const fetchTeamMember = async () => {
      try {
        const q = query(
          collection(db, 'teamMembers'),
          where('userId', '==', currentUser.uid),
          where('role', '==', 'property_manager')
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const memberData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setTeamMember(memberData);
          console.log('Team member data loaded:', memberData);
        } else {
          console.error('No team member record found for user');
          // User might not have completed registration properly
          alert('Your account is not properly set up. Please contact your landlord.');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching team member:', error);
        alert('Error loading your profile. Please try again.');
        navigate('/login');
      }
    };

    fetchTeamMember();
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out. Please try again.');
    }
  };

  // Fetch user profile for messaging
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('uid', '==', currentUser.uid))
        );
        if (!userDoc.empty) {
          setUserProfile(userDoc.docs[0].data());
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleOpenMessageModal = (tenant) => {
    setSelectedTenant(tenant);
    setIsMessageModalOpen(true);
    setIsComposingNewMessage(false);
  };

  const handleComposeNewMessage = () => {
    setSelectedTenant(null); // Clear selected tenant to trigger recipient selection
    setIsComposingNewMessage(true);
    setIsMessageModalOpen(true);
  };

  const handleCloseMessageModal = () => {
    setIsMessageModalOpen(false);
    setSelectedTenant(null);
    setIsComposingNewMessage(false);
  };

  // Long press handlers
  const handleLongPressStart = (conversation) => {
    const timer = setTimeout(() => {
      setConversationToDelete(conversation);
      setShowDeleteConfirm(true);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      // Delete all messages in this conversation
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationToDelete.conversationId)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the conversation document itself
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('conversationId', '==', conversationToDelete.conversationId)
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);
      const conversationDeletePromises = conversationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(conversationDeletePromises);

      // Clear selected conversation if it was deleted
      if (selectedConversation?.conversationId === conversationToDelete.conversationId) {
        setSelectedConversation(null);
      }

      setShowDeleteConfirm(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          readAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Close notifications dropdown
    setShowNotifications(false);

    // Navigate based on notification type
    if (notification.type === 'message' && notification.conversationId) {
      // Navigate to messages view
      setCurrentView('messages');

      // Find and open the conversation
      setTimeout(() => {
        const conversation = conversations.find(c => c.conversationId === notification.conversationId);
        if (conversation) {
          setSelectedConversation(conversation);
        } else {
          // If conversation not found in list, create it from notification data
          setSelectedConversation({
            conversationId: notification.conversationId,
            otherUserId: notification.senderId,
            otherUserName: notification.senderName || 'User',
            otherUserRole: notification.senderRole || 'tenant',
            propertyName: '',
            unit: ''
          });
        }
      }, 100);
    } else if (notification.type === 'maintenance') {
      setCurrentView('maintenance');
    } else if (notification.type === 'viewing') {
      setCurrentView('viewings');
    } else if (notification.type === 'payment') {
      setCurrentView('payments');
    }
  };

  const handleDeleteMessage = async (message) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      console.log('Attempting to delete message:', message.id);
      const messageRef = doc(db, 'messages', message.id);
      await deleteDoc(messageRef);
      console.log('✅ Message deleted successfully');
      alert('Message deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert(`Failed to delete message: ${error.message}`);
    }
  };

  const handleDeleteConversation = async (conversationId, conversationIdString, e) => {
    e.stopPropagation(); // Prevent opening the conversation

    if (!window.confirm('Are you sure you want to delete this conversation? This will delete all messages in this thread.')) {
      return;
    }

    try {
      // Delete all messages in the conversation
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationIdString)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete all conversation documents
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('conversationId', '==', conversationIdString)
      );

      const conversationsSnapshot = await getDocs(conversationsQuery);
      const conversationDeletePromises = conversationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(conversationDeletePromises);

      console.log('✅ Conversation deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleMaintenanceFormChange = (e) => {
    const { name, value } = e.target;
    setMaintenanceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitMaintenanceRequest = async (e) => {
    e.preventDefault();

    if (!maintenanceForm.property || !maintenanceForm.unit || !maintenanceForm.issue || !maintenanceForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'maintenanceRequests'), {
        property: maintenanceForm.property,
        unit: maintenanceForm.unit,
        issue: maintenanceForm.issue,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        date: maintenanceForm.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: maintenanceForm.scheduledTime || 'TBD',
        status: 'pending',
        requestedBy: teamMember.name,
        requestedByRole: 'property_manager',
        requestedById: currentUser.uid,
        landlordId: teamMember.landlordId,
        createdAt: serverTimestamp()
      });

      // Create notification for landlord
      await addDoc(collection(db, 'notifications'), {
        userId: teamMember.landlordId,
        type: 'maintenance_request',
        title: 'New Maintenance Request',
        message: `${teamMember.name} created a maintenance request: ${maintenanceForm.issue} at ${maintenanceForm.property} - Unit ${maintenanceForm.unit}`,
        read: false,
        createdAt: serverTimestamp()
      });

      alert('Maintenance request created successfully!');
      setShowMaintenanceForm(false);
      setMaintenanceForm({
        property: '',
        unit: '',
        issue: '',
        description: '',
        priority: 'medium',
        scheduledDate: '',
        scheduledTime: ''
      });
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      alert('Failed to create maintenance request. Please try again.');
    }
  };

  // ASSIGN MAINTENANCE REQUEST TO STAFF
  const handleAssignMaintenance = async (requestId, staffId, request) => {
    try {
      const staff = maintenanceStaff.find(m => m.id === staffId);
      if (!staff) {
        alert('Staff member not found');
        return;
      }

      await updateDoc(doc(db, 'maintenanceRequests', requestId), {
        assignedTo: staffId,
        assignedToName: staff.name,
        assignedAt: serverTimestamp()
      });

      // Send notification to the assigned staff member
      if (staff.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: staff.userId,
          type: 'maintenance_assigned',
          title: 'New Maintenance Request Assigned',
          message: `You have been assigned: ${request.issue} at ${request.property} - Unit ${request.unit}`,
          maintenanceRequestId: requestId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      alert(`Request assigned to ${staff.name} successfully!`);
    } catch (error) {
      console.error('Error assigning maintenance request:', error);
      alert('Error assigning request. Please try again.');
    }
  };

  // Fetch assigned properties
  useEffect(() => {
    if (!teamMember?.assignedProperties || teamMember.assignedProperties.length === 0) {
      setLoading(false);
      return;
    }

    const unsubscribes = teamMember.assignedProperties.map(propertyId => {
      const propertyRef = doc(db, 'properties', propertyId);
      return onSnapshot(propertyRef, (snapshot) => {
        if (snapshot.exists()) {
          setProperties(prev => {
            const filtered = prev.filter(p => p.id !== propertyId);
            return [...filtered, { id: snapshot.id, ...snapshot.data() }];
          });
        }
      });
    });

    setLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());
  }, [teamMember]);

  // Fetch tenants for assigned properties
  useEffect(() => {
    if (!properties.length) return;

    const propertyNames = properties.map(p => p.name);
    const q = query(
      collection(db, 'tenants'),
      where('property', 'in', propertyNames.slice(0, 10)) // Firestore limit
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tenantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTenants(tenantsData);
    });

    return unsubscribe;
  }, [properties]);

  // Fetch payments for assigned properties
  useEffect(() => {
    if (!properties.length) return;

    const propertyNames = properties.map(p => p.name);
    const q = query(
      collection(db, 'payments'),
      where('property', 'in', propertyNames.slice(0, 10))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);
    });

    return unsubscribe;
  }, [properties]);

  // Fetch viewing bookings
  useEffect(() => {
    if (!properties.length) return;

    const propertyNames = properties.map(p => p.name);
    const q = query(
      collection(db, 'viewings'),
      where('property', 'in', propertyNames.slice(0, 10)),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const viewingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📅 Fetched viewing bookings:', viewingsData.length, 'for properties:', propertyNames);
      setViewingBookings(viewingsData);
    });

    return unsubscribe;
  }, [properties]);

  // Fetch maintenance requests for the landlord
  useEffect(() => {
    if (!teamMember?.landlordId) return;

    const q = query(
      collection(db, 'maintenanceRequests'),
      where('landlordId', '==', teamMember.landlordId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('🔧 Fetched maintenance requests for property manager:', requestsData.length);
      setMaintenanceRequests(requestsData);
    });

    return unsubscribe;
  }, [teamMember]);

  // Fetch maintenance staff for the landlord
  useEffect(() => {
    if (!teamMember?.landlordId) return;

    const q = query(
      collection(db, 'teamMembers'),
      where('landlordId', '==', teamMember.landlordId),
      where('role', '==', 'maintenance')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaintenanceStaff(staffData);
    });

    return unsubscribe;
  }, [teamMember]);

  // Fetch conversations for property manager - DISABLED (using message-based approach instead)
  // useEffect(() => {
  //   if (!currentUser?.uid) return;

  //   const q = query(
  //     collection(db, 'conversations'),
  //     where('participants', 'array-contains', currentUser.uid)
  //   );

  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     const conversationsData = snapshot.docs.map(doc => ({
  //       id: doc.id,
  //       ...doc.data()
  //     }));
  //     // Sort by last message time
  //     conversationsData.sort((a, b) => {
  //       const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
  //       const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
  //       return timeB - timeA;
  //     });
  //     setConversations(conversationsData);
  //   });

  //   return unsubscribe;
  // }, [currentUser]);

  // Fetch all messages for property manager
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Use participants array for better querying
    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by timestamp, newest first
      messagesData.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeB - timeA;
      });

      console.log('💬 Fetched messages for property manager:', messagesData.length);
      setMessages(messagesData);
    }, (error) => {
      console.error('❌ Error fetching messages:', error);
    });

    return unsubscribe;
  }, [currentUser]);

  // Helper function to format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Format time for messages
  const formatMessageTime = (timestamp) => {
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

  // Fetch conversations for Messages view
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('🚫 No current user, skipping message fetch');
      return;
    }

    console.log('📡 Setting up message listeners for property manager:', currentUser.uid);

    const q = query(
      collection(db, 'messages'),
      where('senderId', '==', currentUser.uid)
    );

    const q2 = query(
      collection(db, 'messages'),
      where('recipientId', '==', currentUser.uid)
    );

    // Process messages into conversations
    const processConversations = (messages, type) => {
      console.log(`📨 Processing ${messages.length} ${type} messages into conversations`);
      console.log('Current user ID:', currentUser?.uid);
      if (messages.length > 0) {
        console.log('Sample message:', messages[0]);
      }

      const conversationMap = new Map();

      messages.forEach(message => {
        const conversationId = message.conversationId;
        if (!conversationId) {
          console.log('⚠️ Message missing conversationId:', message.id);
          return;
        }

        const existingConv = conversationMap.get(conversationId);

        if (!existingConv || (message.timestamp && message.timestamp > existingConv.lastMessageTime)) {
          const otherUserId = message.senderId === currentUser?.uid ? message.recipientId : message.senderId;
          const otherUserName = message.senderId === currentUser?.uid ? message.recipientName : message.senderName;
          const otherUserRole = message.senderId === currentUser?.uid ? message.recipientRole : message.senderRole;

          console.log(`Creating conversation entry: ${conversationId}`, {
            otherUserId,
            otherUserName,
            otherUserRole
          });

          conversationMap.set(conversationId, {
            conversationId,
            otherUserId,
            otherUserName,
            otherUserRole,
            lastMessage: message.text,
            lastMessageTime: message.timestamp,
            unread: type === 'received' && !message.read,
            propertyName: message.propertyName,
            unit: message.unit
          });
        }
      });

      console.log('🗂️ Created', conversationMap.size, 'conversation entries from', type, 'messages');

      setConversations(prev => {
        const merged = new Map(prev.map(c => [c.conversationId, c]));
        conversationMap.forEach((value, key) => {
          merged.set(key, value);
        });
        const sorted = Array.from(merged.values()).sort((a, b) => {
          const aTime = a.lastMessageTime?.toDate?.() || new Date(0);
          const bTime = b.lastMessageTime?.toDate?.() || new Date(0);
          return bTime - aTime;
        });
        console.log('💾 Total conversations after merge:', sorted.length);
        if (sorted.length > 0) {
          console.log('Conversations:', sorted);
        }
        return sorted;
      });
    };

    // Combine both queries to get all conversations
    const unsubscribe1 = onSnapshot(q, (snapshot) => {
      console.log('📤 Received sent messages snapshot:', snapshot.size, 'messages');
      const sentMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      processConversations(sentMessages, 'sent');
    }, (error) => {
      console.error('❌ Error fetching sent messages:', error);
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      console.log('📥 Received incoming messages snapshot:', snapshot.size, 'messages');
      const receivedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      processConversations(receivedMessages, 'received');
    }, (error) => {
      console.error('❌ Error fetching received messages:', error);
    });

    return () => {
      console.log('🧹 Cleaning up message listeners');
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser]);

  // Fetch notifications
  useEffect(() => {
    if (!currentUser?.uid) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery,
      (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('🔔 Property Manager Notifications:', notificationsData.length, 'notifications');
        setNotifications(notificationsData);
      },
      (error) => {
        console.error('❌ Error fetching notifications:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          userId: currentUser.uid
        });
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.conversationId) {
      console.log('🚫 No selected conversation');
      setConversationMessages([]);
      return;
    }

    console.log('💬 Loading conversation:', selectedConversation.conversationId);

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', selectedConversation.conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('📬 Loaded', snapshot.size, 'messages for conversation');
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversationMessages(msgs);

      // Auto-mark unread messages as read when conversation is opened
      const unreadMessages = msgs.filter(msg =>
        msg.recipientId === currentUser?.uid && !msg.read
      );

      if (unreadMessages.length > 0) {
        console.log('📖 Marking', unreadMessages.length, 'messages as read');
        const markAsReadPromises = unreadMessages.map(msg =>
          updateDoc(doc(db, 'messages', msg.id), {
            read: true,
            readAt: serverTimestamp()
          })
        );

        try {
          await Promise.all(markAsReadPromises);
          console.log('✅ Messages marked as read');
        } catch (error) {
          console.error('❌ Error marking messages as read:', error);
        }
      }

      // Scroll to bottom when messages change
      setTimeout(() => {
        conversationMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      console.error('❌ Error loading conversation messages:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        conversationId: selectedConversation.conversationId
      });
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // Send message in conversation
  const handleSendConversationMessage = async () => {
    if (!newConversationMessage.trim() || sendingMessage || !selectedConversation) return;

    const messageText = newConversationMessage.trim();
    setNewConversationMessage('');
    setSendingMessage(true);

    try {
      await addDoc(collection(db, 'messages'), {
        conversationId: selectedConversation.conversationId,
        senderId: currentUser.uid,
        senderName: teamMember?.name || userProfile?.displayName || 'Property Manager',
        senderRole: 'property_manager',
        recipientId: selectedConversation.otherUserId,
        recipientName: selectedConversation.otherUserName,
        recipientRole: selectedConversation.otherUserRole,
        text: messageText,
        timestamp: serverTimestamp(),
        read: false,
        propertyName: selectedConversation.propertyName || '',
        unit: selectedConversation.unit || '',
        participants: [currentUser.uid, selectedConversation.otherUserId]
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        userId: selectedConversation.otherUserId,
        type: 'message',
        title: 'New Message from Property Manager',
        message: `You have a new message: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
        read: false,
        timestamp: serverTimestamp(),
        senderId: currentUser.uid,
        senderName: teamMember?.name || userProfile?.displayName || 'Property Manager',
        senderRole: 'property_manager',
        conversationId: selectedConversation.conversationId
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setNewConversationMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateViewingStatus = async (id, status) => {
    try {
      console.log('📝 Updating viewing status:', { id, status });
      await updateDoc(doc(db, 'viewings', id), { status });
      console.log('✅ Viewing status updated successfully');
      if (status === 'confirmed') {
        alert('Viewing confirmed!');
      } else if (status === 'declined') {
        alert('Viewing declined.');
      }
    } catch (error) {
      console.error('❌ Error updating viewing:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        id: id
      });
      alert(`Error updating viewing status: ${error.message}`);
    }
  };

  const handleAssignStaff = async (requestId, staffId) => {
    try {
      const staff = maintenanceStaff.find(s => s.id === staffId);
      await updateDoc(doc(db, 'maintenanceRequests', requestId), {
        assignedTo: staffId,
        assignedToName: staff?.name || '',
        assignedAt: serverTimestamp()
      });
      alert('Maintenance staff assigned successfully!');
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('Error assigning maintenance staff.');
    }
  };

  const handleStartWork = async (requestId, request) => {
    try {
      // Update status to in-progress
      await updateDoc(doc(db, 'maintenanceRequests', requestId), {
        status: 'in-progress',
        startedAt: serverTimestamp()
      });

      // Send notification to assigned maintenance staff
      if (request.assignedTo) {
        await addDoc(collection(db, 'notifications'), {
          userId: request.assignedTo,
          type: 'maintenance_started',
          title: 'Maintenance Work Started',
          message: `Work has been started on: ${request.issue} at ${request.property} - Unit ${request.unit}`,
          maintenanceRequestId: requestId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      alert('Work started! Notification sent to maintenance staff.');
    } catch (error) {
      console.error('Error starting work:', error);
      alert('Error starting work.');
    }
  };

  const stats = [
    { label: 'My Properties', value: properties.length, icon: Home, color: 'bg-blue-100 text-blue-900', view: 'properties' },
    { label: 'Active Tenants', value: tenants.filter(t => t.status === 'active').length, icon: Users, color: 'bg-green-100 text-green-900', view: 'tenants' },
    { label: 'Pending Viewings', value: viewingBookings.filter(v => v.status === 'pending').length, icon: CalendarCheck, color: 'bg-orange-100 text-orange-900', view: 'viewings' },
    { label: 'Open Maintenance', value: maintenanceRequests.filter(m => m.status !== 'completed').length, icon: Wrench, color: 'bg-red-100 text-red-900', view: 'maintenance' }
  ];

  const filteredViewings = viewingBookings.filter(viewing => {
    if (viewingFilter === 'all') return true;
    return viewing.status === viewingFilter;
  });

  // Show loading screen while fetching team member data or other data
  if (!teamMember || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#003366] text-white transition-transform duration-300 flex flex-col`}>
        <div className="p-6">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo-light.svg" alt="Nyumbanii Logo" className="h-10 w-auto" />
            </div>
            <div>
              <span className="text-xl font-bold">Nyumbanii</span>
              <p className="text-xs text-gray-300">Property Manager</p>
            </div>
          </a>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {['dashboard', 'properties', 'viewings', 'tenants', 'maintenance', 'messages', 'calendar'].map((view) => {
            const icons = { dashboard: Home, properties: Building, viewings: CalendarCheck, tenants: Users, maintenance: Wrench, messages: MessageSquare, calendar: Calendar };
            const Icon = icons[view];
            return (
              <button
                key={view}
                onClick={() => { setCurrentView(view); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === view ? 'bg-[#002244]' : 'hover:bg-[#002244]'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="capitalize text-sm">{view}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm p-4 lg:p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 capitalize">{currentView}</h1>
                <p className="text-sm text-gray-600">Welcome back, {teamMember.name}!</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const timestamp = notification.timestamp?.toDate?.();
                          const timeAgo = timestamp ? formatRelativeTime(timestamp) : 'Just now';

                          return (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                                !notification.read ? 'bg-blue-50' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  {notification.title && (
                                    <p className="font-semibold text-sm text-gray-900 mb-1">{notification.title}</p>
                                  )}
                                  <p className="text-sm text-gray-700">{notification.message}</p>
                                  {notification.senderName && (
                                    <p className="text-xs text-gray-500 mt-1">From: {notification.senderName}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                                </div>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold">
                {teamMember.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentView(stat.view)}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer hover:scale-105 transform"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-xs sm:text-sm mb-1">{stat.label}</p>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-[#003366]" />
                    Recent Viewing Requests
                  </h3>
                  {viewingBookings.slice(0, 5).map(viewing => (
                    <div key={viewing.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{viewing.prospectName}</p>
                        <p className="text-xs text-gray-600">{viewing.property} - {viewing.date}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        viewing.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        viewing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {viewing.status}
                      </span>
                    </div>
                  ))}
                  {viewingBookings.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No viewing requests yet</p>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-[#003366]" />
                    Maintenance Requests
                  </h3>
                  {maintenanceRequests.slice(0, 5).map(request => (
                    <div key={request.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{request.issue}</p>
                        <p className="text-xs text-gray-600">{request.property} - Unit {request.unit}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.priority === 'high' ? 'bg-red-100 text-red-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.priority}
                      </span>
                    </div>
                  ))}
                  {maintenanceRequests.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No maintenance requests</p>
                  )}
                </div>
              </div>
            </>
          )}

          {currentView === 'properties' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.length === 0 ? (
                <div className="col-span-full bg-white p-12 rounded-xl shadow-sm text-center">
                  <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No properties assigned to you yet</p>
                </div>
              ) : (
                properties.map(property => (
                  <div key={property.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                    <div className="relative h-48 bg-gray-200">
                      {property.images?.[0] ? (
                        <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#003366] to-[#002244]">
                          <Building className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">{property.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-4">
                        <MapPin className="w-4 h-4" />
                        {property.location}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Total Units</p>
                          <p className="text-lg font-semibold text-gray-900">{property.units}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Occupied</p>
                          <p className="text-lg font-semibold text-green-600">{property.occupied}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {currentView === 'viewings' && (
            <>
              <div className="flex gap-2 mb-6">
                {['all', 'pending', 'confirmed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setViewingFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      viewingFilter === filter ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="grid gap-4">
                {filteredViewings.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                    <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No viewing requests</p>
                  </div>
                ) : (
                  filteredViewings.map(viewing => (
                    <div key={viewing.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">{viewing.prospectName}</h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {viewing.phone}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {viewing.email}
                                </span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              viewing.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              viewing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {viewing.status}
                            </span>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Property</p>
                              <p className="font-medium text-gray-900">{viewing.property}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Date & Time</p>
                              <p className="font-medium text-gray-900">{viewing.date} at {viewing.time}</p>
                            </div>
                          </div>
                        </div>
                        {viewing.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateViewingStatus(viewing.id, 'confirmed')}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleUpdateViewingStatus(viewing.id, 'declined')}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {currentView === 'tenants' && (
            <div className="grid gap-4">
              {tenants.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tenants in your assigned properties</p>
                </div>
              ) : (
                tenants.map(tenant => (
                  <div key={tenant.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {tenant.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{tenant.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {tenant.status}
                          </span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {tenant.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {tenant.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {tenant.property} - Unit {tenant.unit}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            KES {tenant.rent?.toLocaleString()}/mo
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenMessageModal(tenant)}
                        className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {currentView === 'maintenance' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Maintenance Requests</h2>
                <button
                  onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                  className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  {showMaintenanceForm ? 'Cancel' : 'Create Request'}
                </button>
              </div>

              {showMaintenanceForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">New Maintenance Request</h3>
                  <form onSubmit={handleSubmitMaintenanceRequest} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Property *</label>
                        <select
                          name="property"
                          value={maintenanceForm.property}
                          onChange={handleMaintenanceFormChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        >
                          <option value="">Select property</option>
                          {properties.map(prop => (
                            <option key={prop.id} value={prop.name}>{prop.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit Number *</label>
                        <input
                          type="text"
                          name="unit"
                          value={maintenanceForm.unit}
                          onChange={handleMaintenanceFormChange}
                          required
                          placeholder="e.g., A101"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Issue Title *</label>
                      <input
                        type="text"
                        name="issue"
                        value={maintenanceForm.issue}
                        onChange={handleMaintenanceFormChange}
                        required
                        placeholder="e.g., Leaking faucet"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        name="description"
                        value={maintenanceForm.description}
                        onChange={handleMaintenanceFormChange}
                        required
                        rows="3"
                        placeholder="Describe the issue in detail..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          name="priority"
                          value={maintenanceForm.priority}
                          onChange={handleMaintenanceFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                        <input
                          type="date"
                          name="scheduledDate"
                          value={maintenanceForm.scheduledDate}
                          onChange={handleMaintenanceFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Time</label>
                        <input
                          type="time"
                          name="scheduledTime"
                          value={maintenanceForm.scheduledTime}
                          onChange={handleMaintenanceFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-medium"
                      >
                        Submit Request
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMaintenanceForm(false)}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid gap-4">
                {maintenanceRequests.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                    <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No maintenance requests</p>
                  </div>
                ) : (
                  maintenanceRequests.map(request => (
                  <div key={request.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{request.issue}</h3>
                            <p className="text-sm text-gray-600 mt-1">{request.property} - Unit {request.unit}</p>
                            <p className="text-sm text-gray-600">Tenant: {request.tenant}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.priority === 'high' ? 'bg-red-100 text-red-800' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.priority} priority
                          </span>
                        </div>

                        {/* Assignment Section */}
                        <div className="mb-3">
                          {request.assignedTo ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm">
                              <Users className="w-4 h-4" />
                              <span>Assigned to: <strong>{request.assignedToName}</strong></span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700">Assign to:</label>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignMaintenance(request.id, e.target.value, request);
                                  }
                                }}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                defaultValue=""
                              >
                                <option value="">Select staff...</option>
                                {maintenanceStaff.filter(m => m.role === 'maintenance').map(staff => (
                                  <option key={staff.id} value={staff.id}>
                                    {staff.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Cost Summary Section */}
                        {(request.estimatedCost || request.actualCost) && (
                          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">💰</span>
                              <h4 className="font-semibold text-gray-900 text-sm">Cost Information</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {request.estimatedCost && (
                                <div>
                                  <span className="text-gray-600">Estimated:</span>
                                  <div className="font-semibold text-gray-900">
                                    KSH {request.estimatedCost.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              {request.actualCost && (
                                <div>
                                  <span className="text-gray-600">Actual:</span>
                                  <div className="font-semibold text-green-600">
                                    KSH {request.actualCost.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              {request.estimatedCost && request.actualCost && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">Variance:</span>
                                  <div className={`font-semibold ${
                                    request.actualCost > request.estimatedCost
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                  }`}>
                                    KSH {Math.abs(request.actualCost - request.estimatedCost).toLocaleString()}
                                    {request.actualCost > request.estimatedCost ? ' over' : ' under'}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {request.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {request.scheduledTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === 'completed' ? 'bg-green-100 text-green-800' :
                            request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                          {request.assignedToName && (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Assigned to: {request.assignedToName}
                            </span>
                          )}
                        </div>

                        {/* Assignment Section */}
                        {request.status === 'pending' && maintenanceStaff.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <label className="text-sm text-gray-600 font-medium">Assign to:</label>
                            <select
                              value={request.assignedTo || ''}
                              onChange={(e) => handleAssignStaff(request.id, e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                            >
                              <option value="">Select staff...</option>
                              {maintenanceStaff.map(staff => (
                                <option key={staff.id} value={staff.id}>
                                  {staff.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        {request.status === 'pending' && request.assignedTo && (
                          <button
                            onClick={() => handleStartWork(request.id, request)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm whitespace-nowrap"
                          >
                            Start Work
                          </button>
                        )}
                        {request.status === 'pending' && !request.assignedTo && maintenanceStaff.length === 0 && (
                          <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm text-center">
                            No staff available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            </>
          )}

          {currentView === 'messages' && (
            <div className="h-full flex flex-col bg-gray-50">
              {/* Encrypted Banner */}
              <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-center gap-2 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium">Your messages are end-to-end encrypted</span>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Conversations List */}
                <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} lg:w-1/3 w-full flex-col border-r border-gray-200 bg-white`}>
                  {/* Search and Filter Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                      <button
                        onClick={() => handleComposeNewMessage()}
                        className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center gap-2 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        New Message
                      </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search conversations..."
                          value={conversationSearchQuery}
                          onChange={(e) => setConversationSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {[
                        { value: 'all', label: 'All' },
                        { value: 'tenant', label: 'Tenants' },
                        { value: 'landlord', label: 'Landlord' },
                        { value: 'maintenance', label: 'Maintenance' }
                      ].map(filter => (
                        <button
                          key={filter.value}
                          onClick={() => setConversationFilter(filter.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                            conversationFilter === filter.value
                              ? 'bg-[#003366] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conversations List */}
                  <div className="flex-1 overflow-y-auto">
                    {conversations
                      .filter(conv => {
                        if (conversationFilter !== 'all' && conv.otherUserRole !== conversationFilter) {
                          return false;
                        }
                        if (conversationSearchQuery && !conv.otherUserName.toLowerCase().includes(conversationSearchQuery.toLowerCase())) {
                          return false;
                        }
                        return true;
                      })
                      .map(conversation => (
                        <div
                          key={conversation.conversationId}
                          onClick={() => {
                            console.log('👆 Clicked conversation:', conversation);
                            setSelectedConversation(conversation);
                          }}
                          onMouseDown={() => handleLongPressStart(conversation)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart(conversation)}
                          onTouchEnd={handleLongPressEnd}
                          className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition ${
                            selectedConversation?.conversationId === conversation.conversationId ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {conversation.otherUserName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {conversation.otherUserName}
                                </h3>
                                {conversation.lastMessageTime && (
                                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                    {formatRelativeTime(conversation.lastMessageTime.toDate ? conversation.lastMessageTime.toDate() : new Date(conversation.lastMessageTime))}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  conversation.otherUserRole === 'tenant' ? 'bg-green-100 text-green-800' :
                                  conversation.otherUserRole === 'landlord' ? 'bg-purple-100 text-purple-800' :
                                  conversation.otherUserRole === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {conversation.otherUserRole === 'tenant' ? 'Tenant' :
                                   conversation.otherUserRole === 'landlord' ? 'Landlord' :
                                   conversation.otherUserRole === 'maintenance' ? 'Maintenance' : conversation.otherUserRole}
                                </span>
                                {conversation.propertyName && (
                                  <span className="text-xs text-gray-500 truncate">
                                    {conversation.propertyName} {conversation.unit && `- ${conversation.unit}`}
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-gray-600 truncate">
                                {conversation.lastMessage}
                              </p>
                            </div>

                            {conversation.unread && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                        </div>
                      ))}

                    {conversations.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                        <p className="text-sm text-gray-500">
                          Start a conversation by messaging tenants, landlords, or maintenance staff
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message View */}
                <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white`}>
                  {selectedConversation ? (
                    <>
                      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedConversation(null)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                          <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold">
                            {selectedConversation.otherUserName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{selectedConversation.otherUserName}</h3>
                            <p className="text-xs text-gray-600">
                              {selectedConversation.propertyName && `${selectedConversation.propertyName}${selectedConversation.unit ? ` - Unit ${selectedConversation.unit}` : ''}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {conversationMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <User className="w-16 h-16 mb-4 opacity-50" />
                            <p>No messages yet</p>
                            <p className="text-sm mt-1">Start a conversation with {selectedConversation.otherUserName}</p>
                          </div>
                        ) : (
                          <>
                            {conversationMessages.map((message, index) => {
                              const isOwnMessage = message.senderId === currentUser?.uid;
                              const showDate = index === 0 ||
                                (message.timestamp && conversationMessages[index - 1].timestamp &&
                                 new Date(message.timestamp.toDate ? message.timestamp.toDate() : message.timestamp).toDateString() !==
                                 new Date(conversationMessages[index - 1].timestamp.toDate ? conversationMessages[index - 1].timestamp.toDate() : conversationMessages[index - 1].timestamp).toDateString());

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
                                            {formatMessageTime(message.timestamp)}
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
                            <div ref={conversationMessagesEndRef} />
                          </>
                        )}
                      </div>

                      <div className="p-4 border-t border-gray-200 bg-white">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newConversationMessage}
                            onChange={(e) => setNewConversationMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendConversationMessage();
                              }
                            }}
                            placeholder="Type a message..."
                            disabled={sendingMessage}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:opacity-50"
                          />
                          <button
                            onClick={handleSendConversationMessage}
                            disabled={!newConversationMessage.trim() || sendingMessage}
                            className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Send
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="hidden lg:flex flex-1 items-center justify-center p-8 text-center">
                      <div>
                        <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                        <p className="text-gray-500">
                          Choose a conversation from the list to view messages
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === 'calendar' && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Schedule</h2>
              <div className="space-y-4">
                {viewingBookings.filter(v => v.status === 'confirmed').map(viewing => (
                  <div key={viewing.id} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-xs text-blue-600 font-medium">
                        {new Date(viewing.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold text-blue-900">
                        {new Date(viewing.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Property Viewing</h3>
                      <p className="text-sm text-gray-600">{viewing.prospectName} - {viewing.property}</p>
                      <p className="text-xs text-gray-500">{viewing.time}</p>
                    </div>
                    <CalendarCheck className="w-6 h-6 text-blue-600" />
                  </div>
                ))}
                
                {maintenanceRequests.filter(m => m.status !== 'completed').map(request => (
                  <div key={request.id} className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                    <div className="w-16 h-16 bg-orange-100 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-xs text-orange-600 font-medium">
                        {new Date(request.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold text-orange-900">
                        {new Date(request.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Maintenance</h3>
                      <p className="text-sm text-gray-600">{request.issue} - {request.property}</p>
                      <p className="text-xs text-gray-500">{request.scheduledTime}</p>
                    </div>
                    <Wrench className="w-6 h-6 text-orange-600" />
                  </div>
                ))}

                {viewingBookings.filter(v => v.status === 'confirmed').length === 0 && 
                 maintenanceRequests.filter(m => m.status !== 'completed').length === 0 && (
                  <p className="text-gray-500 text-center py-8">No upcoming events</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Delete Conversation Confirmation Modal */}
    {showDeleteConfirm && conversationToDelete && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Conversation?</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this conversation with <strong>{conversationToDelete.otherUserName}</strong>?
            This will permanently delete all messages in this thread.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setConversationToDelete(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteConversation}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Message Modal */}
    <MessageModal
      tenant={selectedTenant}
      currentUser={currentUser}
      userProfile={userProfile}
      isOpen={isMessageModalOpen}
      onClose={handleCloseMessageModal}
      senderRole="property_manager"
    />
  </>
  );
};

export default PropertyManagerDashboard;