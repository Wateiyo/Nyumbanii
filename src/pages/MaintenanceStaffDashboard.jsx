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
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import {
  Home,
  Building,
  Wrench,
  Bell,
  LogOut,
  Calendar,
  Menu,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  MessageSquare,
  Trash2,
  Plus,
  Send,
  Search,
  ChevronLeft,
  User,
  Check,
  CheckCheck,
  X
} from 'lucide-react';
import MessageModal from '../components/MessageModal';

const MaintenanceStaffDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [teamMember, setTeamMember] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [messages, setMessages] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isComposingNewMessage, setIsComposingNewMessage] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Conversation-based messaging states
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationFilter, setConversationFilter] = useState('all'); // all, tenant, landlord, property_manager
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newConversationMessage, setNewConversationMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const conversationMessagesEndRef = useRef(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);

  // Cost estimation states
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [selectedRequestForEstimate, setSelectedRequestForEstimate] = useState(null);
  const [estimateData, setEstimateData] = useState({
    estimatedCost: '',
    estimateNotes: '',
    estimatedDuration: '',
    costBreakdown: [{ item: '', quantity: 1, unitCost: '', total: 0 }]
  });

  // Complete work states
  const [showCompleteWorkModal, setShowCompleteWorkModal] = useState(false);
  const [selectedRequestForCompletion, setSelectedRequestForCompletion] = useState(null);
  const [completionData, setCompletionData] = useState({
    actualCost: '',
    completionNotes: '',
    actualDuration: '',
    actualCostBreakdown: [{ item: '', quantity: 1, unitCost: '', total: 0 }]
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
          where('role', '==', 'maintenance')
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const memberData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setTeamMember(memberData);
          console.log('Team member data loaded:', memberData);
        } else {
          console.error('No team member record found for user');
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

    // Debug logging for properties
    setTimeout(() => {
      console.log('🏢 Assigned Properties:', properties.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location
      })));
    }, 1000);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [teamMember, properties]);

  // Fetch maintenance requests assigned to this staff member or unassigned
  useEffect(() => {
    if (!teamMember?.id || !teamMember?.landlordId) return;

    // Fetch ALL maintenance requests for this landlord
    // We'll filter client-side to show assigned and unassigned requests
    const q = query(
      collection(db, 'maintenanceRequests'),
      where('landlordId', '==', teamMember.landlordId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter to show:
      // 1. Requests assigned to this maintenance staff
      // 2. Unassigned requests (no assignedTo field or null)
      const filteredRequests = requestsData.filter(request =>
        request.assignedTo === teamMember.id || !request.assignedTo
      );

      setMaintenanceRequests(filteredRequests);

      // Debug logging
      console.log('🔧 Maintenance Requests:', filteredRequests.map(r => ({
        id: r.id,
        property: r.property,
        propertyId: r.propertyId,
        status: r.status,
        assignedTo: r.assignedTo
      })));
    });

    return unsubscribe;
  }, [teamMember]);

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

  // Fetch all messages for maintenance staff
  useEffect(() => {
    if (!currentUser?.uid) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by timestamp, newest first
      allMessages.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeB - timeA;
      });

      setMessages(allMessages);
    }, (error) => {
      console.error('Error fetching messages:', error);
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

  // Process messages into conversations
  const processConversations = (messages, type) => {
    console.log(`📨 Processing ${messages.length} ${type} messages into conversations`);
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

    console.log('🗂️ Created', conversationMap.size, 'conversation entries');

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
      return sorted;
    });
  };

  // Fetch conversations for Messages view
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'messages'),
      where('senderId', '==', currentUser.uid)
    );

    const q2 = query(
      collection(db, 'messages'),
      where('recipientId', '==', currentUser.uid)
    );

    // Combine both queries to get all conversations
    const unsubscribe1 = onSnapshot(q, (snapshot) => {
      const sentMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      processConversations(sentMessages, 'sent');
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const receivedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      processConversations(receivedMessages, 'received');
    });

    return () => {
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
        console.log('🔔 Maintenance Staff Notifications:', notificationsData.length, 'notifications');
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
        senderName: teamMember?.name || userProfile?.displayName || 'Maintenance Staff',
        senderRole: 'maintenance',
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
        title: 'New Message from Maintenance Staff',
        message: `You have a new message: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
        read: false,
        timestamp: serverTimestamp(),
        senderId: currentUser.uid,
        senderName: teamMember?.name || userProfile?.displayName || 'Maintenance Staff'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setNewConversationMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleComposeNewMessage = () => {
    setSelectedTenant(null);
    setIsComposingNewMessage(true);
    setIsMessageModalOpen(true);
  };

  const handleCloseMessageModal = () => {
    setIsMessageModalOpen(false);
    setSelectedTenant(null);
    setIsComposingNewMessage(false);
  };

  // Long press handlers for conversation deletion
  const handleLongPressStart = (conversation) => {
    setIsLongPress(false);
    const timer = setTimeout(() => {
      setIsLongPress(true);
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
    // Reset long press flag after a short delay to prevent click
    setTimeout(() => setIsLongPress(false), 100);
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
            otherUserRole: notification.senderRole || 'landlord',
            propertyName: '',
            unit: ''
          });
        }
      }, 100);
    } else if (notification.type === 'maintenance' || notification.type === 'maintenance_assigned' || notification.type === 'maintenance_completed') {
      setCurrentView('dashboard'); // Show maintenance requests
    }
  };

  const handleSelfAssign = async (requestId, request) => {
    try {
      await updateDoc(doc(db, 'maintenanceRequests', requestId), {
        assignedTo: teamMember.id,
        assignedToName: teamMember.name,
        assignedAt: serverTimestamp()
      });

      // Send notification to landlord
      if (teamMember?.landlordId) {
        await addDoc(collection(db, 'notifications'), {
          userId: teamMember.landlordId,
          type: 'maintenance_assigned',
          title: 'Maintenance Request Assigned',
          message: `${teamMember.name} has taken responsibility for: ${request.issue} at ${request.property} - Unit ${request.unit}`,
          maintenanceRequestId: requestId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      alert('Request assigned to you successfully!');
    } catch (error) {
      console.error('Error assigning request:', error);
      alert('Error assigning request. Please try again.');
    }
  };

  const handleUpdateStatus = async (id, status, request) => {
    try {
      const updateData = {
        status,
        ...(status === 'in-progress' && { startedAt: serverTimestamp() }),
        ...(status === 'completed' && { completedAt: serverTimestamp() })
      };

      await updateDoc(doc(db, 'maintenanceRequests', id), updateData);

      // Send notification to property manager and landlord
      if (status === 'completed') {
        // Get the request data to find landlord
        const notifications = [];

        // Notify landlord if available
        if (teamMember?.landlordId) {
          notifications.push(
            addDoc(collection(db, 'notifications'), {
              userId: teamMember.landlordId,
              type: 'maintenance_completed',
              title: 'Maintenance Work Completed',
              message: `${teamMember.name} has completed: ${request.issue} at ${request.property} - Unit ${request.unit}`,
              maintenanceRequestId: id,
              read: false,
              createdAt: serverTimestamp()
            })
          );
        }

        await Promise.all(notifications);
        alert('Work completed! Notifications sent.');
      } else {
        alert(`Request ${status === 'in-progress' ? 'started' : 'marked as ' + status}!`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status.');
    }
  };

  // Cost estimation handlers
  const handleOpenEstimateModal = (request) => {
    setSelectedRequestForEstimate(request);
    setShowEstimateModal(true);
    // Reset estimate data
    setEstimateData({
      estimatedCost: '',
      estimateNotes: '',
      estimatedDuration: '',
      costBreakdown: [{ item: '', quantity: 1, unitCost: '', total: 0 }]
    });
  };

  const handleCloseEstimateModal = () => {
    setShowEstimateModal(false);
    setSelectedRequestForEstimate(null);
  };

  const handleAddBreakdownItem = () => {
    setEstimateData({
      ...estimateData,
      costBreakdown: [...estimateData.costBreakdown, { item: '', quantity: 1, unitCost: '', total: 0 }]
    });
  };

  const handleRemoveBreakdownItem = (index) => {
    const newBreakdown = estimateData.costBreakdown.filter((_, i) => i !== index);
    setEstimateData({ ...estimateData, costBreakdown: newBreakdown });
  };

  const handleBreakdownChange = (index, field, value) => {
    const newBreakdown = [...estimateData.costBreakdown];
    newBreakdown[index][field] = value;

    // Calculate total for this item
    if (field === 'quantity' || field === 'unitCost') {
      const quantity = parseFloat(newBreakdown[index].quantity) || 0;
      const unitCost = parseFloat(newBreakdown[index].unitCost) || 0;
      newBreakdown[index].total = quantity * unitCost;
    }

    setEstimateData({ ...estimateData, costBreakdown: newBreakdown });

    // Update total estimated cost
    const totalCost = newBreakdown.reduce((sum, item) => sum + (item.total || 0), 0);
    setEstimateData(prev => ({ ...prev, estimatedCost: totalCost.toString() }));
  };

  const handleSubmitEstimate = async () => {
    if (!selectedRequestForEstimate) return;

    const totalCost = estimateData.costBreakdown.reduce((sum, item) => sum + (item.total || 0), 0);

    if (totalCost === 0) {
      alert('Please add at least one cost item');
      return;
    }

    try {
      const estimateUpdate = {
        estimatedCost: totalCost,
        estimateNotes: estimateData.estimateNotes,
        estimatedDuration: estimateData.estimatedDuration,
        costBreakdown: estimateData.costBreakdown.filter(item => item.item && item.total > 0),
        estimatedBy: teamMember?.name || currentUser.email,
        estimatedById: currentUser.uid,
        estimatedAt: serverTimestamp(),
        status: 'estimated', // Update status to show estimate is provided
        requiresApproval: true // All estimates require landlord approval
      };

      await updateDoc(doc(db, 'maintenanceRequests', selectedRequestForEstimate.id), estimateUpdate);

      // Send notification to landlord
      if (teamMember?.landlordId) {
        await addDoc(collection(db, 'notifications'), {
          userId: teamMember.landlordId,
          type: 'maintenance',
          title: 'Cost Estimate Provided',
          message: `${teamMember.name} provided an estimate of KSH ${totalCost.toLocaleString()} for: ${selectedRequestForEstimate.issue}`,
          maintenanceRequestId: selectedRequestForEstimate.id,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      alert('Cost estimate submitted successfully!');
      handleCloseEstimateModal();
    } catch (error) {
      console.error('Error submitting estimate:', error);
      alert('Error submitting estimate. Please try again.');
    }
  };

  // COMPLETE WORK HANDLERS
  const handleOpenCompleteWorkModal = (request) => {
    setSelectedRequestForCompletion(request);

    // Pre-fill with estimated data if available
    setCompletionData({
      actualCost: request.estimatedCost?.toString() || '',
      completionNotes: '',
      actualDuration: request.estimatedDuration || '',
      actualCostBreakdown: request.costBreakdown || [{ item: '', quantity: 1, unitCost: '', total: 0 }]
    });

    setShowCompleteWorkModal(true);
  };

  const handleCloseCompleteWorkModal = () => {
    setShowCompleteWorkModal(false);
    setSelectedRequestForCompletion(null);
    setCompletionData({
      actualCost: '',
      completionNotes: '',
      actualDuration: '',
      actualCostBreakdown: [{ item: '', quantity: 1, unitCost: '', total: 0 }]
    });
  };

  const handleAddCompletionBreakdownItem = () => {
    setCompletionData({
      ...completionData,
      actualCostBreakdown: [...completionData.actualCostBreakdown, { item: '', quantity: 1, unitCost: '', total: 0 }]
    });
  };

  const handleRemoveCompletionBreakdownItem = (index) => {
    const newBreakdown = completionData.actualCostBreakdown.filter((_, i) => i !== index);
    setCompletionData({ ...completionData, actualCostBreakdown: newBreakdown });
  };

  const handleCompletionBreakdownChange = (index, field, value) => {
    const newBreakdown = [...completionData.actualCostBreakdown];
    newBreakdown[index][field] = value;

    if (field === 'quantity' || field === 'unitCost') {
      const quantity = parseFloat(newBreakdown[index].quantity) || 0;
      const unitCost = parseFloat(newBreakdown[index].unitCost) || 0;
      newBreakdown[index].total = quantity * unitCost;
    }

    setCompletionData({ ...completionData, actualCostBreakdown: newBreakdown });

    const totalCost = newBreakdown.reduce((sum, item) => sum + (item.total || 0), 0);
    setCompletionData(prev => ({ ...prev, actualCost: totalCost.toString() }));
  };

  const handleSubmitCompletion = async () => {
    if (!selectedRequestForCompletion) return;

    if (!completionData.actualCost) {
      alert('Please enter the actual cost.');
      return;
    }

    try {
      const requestRef = doc(db, 'maintenanceRequests', selectedRequestForCompletion.id);

      await updateDoc(requestRef, {
        status: 'completed',
        actualCost: parseFloat(completionData.actualCost),
        completionNotes: completionData.completionNotes,
        actualDuration: completionData.actualDuration,
        actualCostBreakdown: completionData.actualCostBreakdown,
        completedAt: serverTimestamp(),
        completedBy: currentUser.uid
      });

      // Create notification for landlord
      await addDoc(collection(db, 'notifications'), {
        type: 'maintenance_completed',
        userId: selectedRequestForCompletion.landlordId,
        title: 'Maintenance Work Completed',
        message: `Work completed for "${selectedRequestForCompletion.issue}" at ${selectedRequestForCompletion.property}, Unit ${selectedRequestForCompletion.unit}. Final cost: KSH ${parseFloat(completionData.actualCost).toLocaleString()}`,
        read: false,
        createdAt: serverTimestamp(),
        maintenanceRequestId: selectedRequestForCompletion.id
      });

      alert('Work marked as completed successfully!');
      handleCloseCompleteWorkModal();
    } catch (error) {
      console.error('Error completing work:', error);
      alert('Error completing work. Please try again.');
    }
  };

  const stats = [
    { label: 'Assigned Properties', value: properties.length, icon: Building, color: 'bg-blue-100 text-blue-900', view: 'properties' },
    { label: 'Open Requests', value: maintenanceRequests.filter(r => {
      const status = r.status?.toLowerCase();
      return status === 'pending' || !status; // Include pending and requests without status
    }).length, icon: AlertCircle, color: 'bg-red-100 text-red-900', view: 'maintenance' },
    { label: 'In Progress', value: maintenanceRequests.filter(r => r.status?.toLowerCase() === 'in-progress').length, icon: Clock, color: 'bg-yellow-100 text-yellow-900', view: 'maintenance' },
    { label: 'Completed', value: maintenanceRequests.filter(r => r.status?.toLowerCase() === 'completed').length, icon: CheckCircle, color: 'bg-green-100 text-green-900', view: 'maintenance' }
  ];

  const filteredRequests = maintenanceRequests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status?.toLowerCase() === statusFilter;
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
              <p className="text-xs text-gray-300">Maintenance Staff</p>
            </div>
          </a>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {['dashboard', 'requests', 'properties', 'messages', 'calendar'].map((view) => {
            const icons = { dashboard: Home, requests: Wrench, properties: Building, messages: MessageSquare, calendar: Calendar };
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

        <div className="p-4 border-t border-white/10">
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

              <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Urgent Requests
                </h3>
                {maintenanceRequests.filter(r => r.priority?.toLowerCase() === 'high' && r.status?.toLowerCase() !== 'completed').length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No urgent requests</p>
                ) : (
                  maintenanceRequests.filter(r => r.priority?.toLowerCase() === 'high' && r.status?.toLowerCase() !== 'completed').map(request => (
                    <div key={request.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{request.issue}</p>
                        <p className="text-xs text-gray-600">{request.property} - Unit {request.unit}</p>
                        {!request.assignedTo && (
                          <span className="inline-flex px-2 py-0.5 mt-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            Unassigned
                          </span>
                        )}
                      </div>
                      {!request.assignedTo && (
                        <button
                          onClick={() => handleSelfAssign(request.id, request)}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
                        >
                          Assign to Me
                        </button>
                      )}
                      {request.assignedTo === teamMember.id && request.status?.toLowerCase() === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'in-progress', request)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                        >
                          Start Work
                        </button>
                      )}
                      {request.assignedTo === teamMember.id && request.status?.toLowerCase() === 'in-progress' && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'completed', request)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#003366]" />
                  In Progress
                </h3>
                {maintenanceRequests.filter(r => r.status?.toLowerCase() === 'in-progress').length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No work in progress</p>
                ) : (
                  maintenanceRequests.filter(r => r.status?.toLowerCase() === 'in-progress').map(request => (
                    <div key={request.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{request.issue}</p>
                        <p className="text-xs text-gray-600">{request.property} - Unit {request.unit}</p>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus(request.id, 'completed', request)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                      >
                        Complete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {currentView === 'requests' && (
            <>
              <div className="flex gap-2 mb-6 overflow-x-auto">
                {['all', 'pending', 'in-progress', 'completed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      statusFilter === filter ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
              
              <div className="grid gap-4">
                {filteredRequests.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                    <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No maintenance requests</p>
                  </div>
                ) : (
                  filteredRequests.map(request => (
                    <div key={request.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">{request.issue}</h3>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-gray-700 font-medium">
                                  <span className="text-gray-500">Tenant:</span> {request.tenant}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="text-gray-500">Location:</span> {request.property} - Unit {request.unit}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              request.priority === 'high' ? 'bg-red-100 text-red-800' :
                              request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {request.priority} priority
                            </span>
                          </div>
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
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              request.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                              request.status?.toLowerCase() === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                            {!request.assignedTo && (
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {!request.assignedTo && (
                            <button
                              onClick={() => handleSelfAssign(request.id, request)}
                              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm whitespace-nowrap"
                            >
                              Assign to Me
                            </button>
                          )}
                          {/* Add Estimate Button - Show for assigned requests that don't have an estimate yet */}
                          {request.assignedTo === teamMember.id && !request.estimatedCost && request.status?.toLowerCase() !== 'completed' && (
                            <button
                              onClick={() => handleOpenEstimateModal(request)}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm whitespace-nowrap flex items-center justify-center gap-2"
                            >
                              <span>💰</span> Add Estimate
                            </button>
                          )}
                          {/* Show estimate if provided */}
                          {request.estimatedCost && (
                            <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                              <div className="font-semibold text-green-800">Estimate: KSH {request.estimatedCost.toLocaleString()}</div>
                              {request.status === 'estimated' && (
                                <div className="text-xs text-green-600 mt-1">⏳ Awaiting approval</div>
                              )}
                              {request.status === 'approved' && (
                                <div className="text-xs text-green-600 mt-1">✅ Approved</div>
                              )}
                            </div>
                          )}
                          {request.assignedTo === teamMember.id && request.status?.toLowerCase() === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(request.id, 'in-progress', request)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            >
                              Start Work
                            </button>
                          )}
                          {request.assignedTo === teamMember.id && request.status?.toLowerCase() === 'in-progress' && (
                            <button
                              onClick={() => handleOpenCompleteWorkModal(request)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Complete Work
                            </button>
                          )}
                          {request.assignedTo === teamMember.id && request.status?.toLowerCase() === 'approved' && (
                            <button
                              onClick={() => handleOpenCompleteWorkModal(request)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Complete Work
                            </button>
                          )}
                          {request.status?.toLowerCase() === 'completed' && (
                            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-center">
                              Completed ✓
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
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Open Requests</span>
                          <span className="font-semibold text-[#003366]">
                            {(() => {
                              const openRequests = maintenanceRequests.filter(r => {
                                // Match by property name or property ID
                                const matchByName = r.property === property.name;
                                const matchById = r.propertyId === property.id;
                                // Open requests are pending or without status (not in-progress or completed)
                                const status = r.status?.toLowerCase();
                                const isOpen = status === 'pending' || !status;
                                const matches = (matchByName || matchById) && isOpen;

                                // Debug logging for this property
                                if (property.name === properties[0]?.name) {
                                  console.log(`🔍 Request check for ${property.name}:`, {
                                    requestProperty: r.property,
                                    requestPropertyId: r.propertyId,
                                    propertyName: property.name,
                                    propertyId: property.id,
                                    matchByName,
                                    matchById,
                                    status,
                                    isOpen,
                                    matches
                                  });
                                }

                                return matches;
                              });
                              return openRequests.length;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {currentView === 'calendar' && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Scheduled Maintenance</h2>
              <div className="space-y-4">
                {maintenanceRequests.filter(r => r.status?.toLowerCase() !== 'completed').length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No scheduled maintenance</p>
                ) : (
                  maintenanceRequests.filter(r => r.status?.toLowerCase() !== 'completed').map(request => (
                    <div key={request.id} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-blue-600 font-medium">
                          {new Date(request.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-2xl font-bold text-blue-900">
                          {new Date(request.date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{request.issue}</h3>
                        <p className="text-sm text-gray-700 font-medium mt-1">
                          <span className="text-gray-500">Tenant:</span> {request.tenant}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="text-gray-500">Location:</span> {request.property} - Unit {request.unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{request.scheduledTime}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.priority === 'high' ? 'bg-red-100 text-red-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
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
                        onClick={() => setShowNewMessageModal(true)}
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
                        { value: 'property_manager', label: 'Managers' }
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
                            if (!isLongPress) {
                              console.log('👆 Clicked conversation:', conversation);
                              setSelectedConversation(conversation);
                            }
                          }}
                          onMouseDown={() => handleLongPressStart(conversation)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart(conversation)}
                          onTouchEnd={handleLongPressEnd}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setConversationToDelete(conversation);
                            setShowDeleteConfirm(true);
                          }}
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
                                  conversation.otherUserRole === 'property_manager' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {conversation.otherUserRole === 'tenant' ? 'Tenant' :
                                   conversation.otherUserRole === 'landlord' ? 'Landlord' :
                                   conversation.otherUserRole === 'property_manager' ? 'Property Manager' : conversation.otherUserRole}
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
                          Start a conversation by messaging landlords, property managers, or tenants
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
        </div>
      </div>
    </div>

    {/* New Message Modal */}
    {showNewMessageModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">New Message</h3>
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-6">Select who you'd like to message</p>

            {/* Message Landlord Option */}
            {teamMember?.landlordId && (
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  // Start a new conversation with landlord
                  setSelectedConversation({
                    conversationId: `${currentUser.uid}_${teamMember.landlordId}`,
                    otherUserId: teamMember.landlordId,
                    otherUserName: 'Landlord',
                    otherUserRole: 'landlord'
                  });
                }}
                className="w-full px-4 py-4 mb-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-medium flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Message Landlord
              </button>
            )}

            {/* Message Property Manager Option */}
            <button
              onClick={() => {
                setShowNewMessageModal(false);
                alert('Property Manager messaging will be available soon. Please use the conversations list to continue existing chats.');
              }}
              className="w-full px-4 py-4 mb-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Message Property Manager
            </button>

            {/* Message Tenant Option */}
            <button
              onClick={() => {
                setShowNewMessageModal(false);
                alert('Tenant messaging will be available soon. Please use the conversations list to continue existing chats.');
              }}
              className="w-full px-4 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Message Tenant
            </button>
          </div>
        </div>
      </div>
    )}

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

    {/* Cost Estimate Modal */}
    {showEstimateModal && selectedRequestForEstimate && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Cost Estimate</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedRequestForEstimate.issue} - {selectedRequestForEstimate.property}
                </p>
              </div>
              <button
                onClick={handleCloseEstimateModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Cost Breakdown Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                  Cost Breakdown
                </label>
                <button
                  onClick={handleAddBreakdownItem}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {estimateData.costBreakdown.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Item description"
                        value={item.item}
                        onChange={(e) => handleBreakdownChange(index, 'item', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleBreakdownChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                        min="1"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Unit Cost"
                        value={item.unitCost}
                        onChange={(e) => handleBreakdownChange(index, 'unitCost', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                        min="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={`KSH ${item.total.toLocaleString()}`}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      {estimateData.costBreakdown.length > 1 && (
                        <button
                          onClick={() => handleRemoveBreakdownItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Cost Display */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Estimated Cost:</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    KSH {estimateData.costBreakdown.reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Estimated Duration
              </label>
              <input
                type="text"
                placeholder="e.g., 2 hours, 1 day, 3-4 hours"
                value={estimateData.estimatedDuration}
                onChange={(e) => setEstimateData({ ...estimateData, estimatedDuration: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Notes & Details
              </label>
              <textarea
                placeholder="Provide details about the work required, materials needed, etc."
                value={estimateData.estimateNotes}
                onChange={(e) => setEstimateData({ ...estimateData, estimateNotes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              onClick={handleCloseEstimateModal}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitEstimate}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Submit Estimate
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Complete Work Modal */}
    {showCompleteWorkModal && selectedRequestForCompletion && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl p-6 my-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Complete Work</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedRequestForCompletion.issue} - {selectedRequestForCompletion.property}, Unit {selectedRequestForCompletion.unit}
              </p>
            </div>
            <button
              onClick={handleCloseCompleteWorkModal}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Show Original Estimate if Available */}
          {selectedRequestForCompletion.estimatedCost && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                <span>📋</span> Original Estimate
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Estimated Cost:</span>
                  <span className="font-semibold ml-2 text-blue-900 dark:text-blue-200">
                    KSH {selectedRequestForCompletion.estimatedCost.toLocaleString()}
                  </span>
                </div>
                {selectedRequestForCompletion.estimatedDuration && (
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">Estimated Duration:</span>
                    <span className="font-semibold ml-2 text-blue-900 dark:text-blue-200">
                      {selectedRequestForCompletion.estimatedDuration}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actual Cost Breakdown */}
          <div className="space-y-6 mb-6">
            <div>
              <label className="block font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>💰</span> Actual Cost Breakdown
              </label>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Item</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Unit Cost</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {completionData.actualCostBreakdown.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.item}
                            onChange={(e) => handleCompletionBreakdownChange(index, 'item', e.target.value)}
                            placeholder="Item name"
                            className="w-full px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleCompletionBreakdownChange(index, 'quantity', e.target.value)}
                            min="1"
                            className="w-20 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => handleCompletionBreakdownChange(index, 'unitCost', e.target.value)}
                            placeholder="0"
                            className="w-28 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm text-right focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-200">
                          KSH {(item.total || 0).toLocaleString()}
                        </td>
                        <td className="px-2 py-3">
                          {completionData.actualCostBreakdown.length > 1 && (
                            <button
                              onClick={() => handleRemoveCompletionBreakdownItem(index)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                        Total Actual Cost:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400 text-lg">
                        KSH {(parseFloat(completionData.actualCost) || 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button
                onClick={handleAddCompletionBreakdownItem}
                className="mt-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            {/* Actual Duration */}
            <div>
              <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                Actual Duration
              </label>
              <input
                type="text"
                value={completionData.actualDuration}
                onChange={(e) => setCompletionData({ ...completionData, actualDuration: e.target.value })}
                placeholder="e.g., 3 hours, 2 days"
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Completion Notes */}
            <div>
              <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                Completion Notes
              </label>
              <textarea
                value={completionData.completionNotes}
                onChange={(e) => setCompletionData({ ...completionData, completionNotes: e.target.value })}
                placeholder="Describe the work completed, any issues encountered, and recommendations..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                rows="4"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCloseCompleteWorkModal}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitCompletion}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Submit Completion
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
      senderRole="maintenance"
    />
  </>
  );
};

export default MaintenanceStaffDashboard;