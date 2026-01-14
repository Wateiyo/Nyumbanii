import React, { useState, useEffect, useRef } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, getDocs, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  DollarSign,
  Wrench,
  FileText,
  Bell,
  Settings,
  LogOut,
  CreditCard,
  Calendar,
  CheckCircle,
  MessageSquare,
  X,
  Plus,
  Eye,
  Search,
  MapPin,
  Bed,
  Bath,
  Square,
  Phone,
  Mail,
  Download,
  Upload,
  Send,
  Camera,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  Trash2,
  Check,
  CheckCheck,
  User,
  Megaphone,
  Clipboard,
  Moon,
  Sun,
  AlertTriangle,
  FileSignature,
  DoorOpen
} from 'lucide-react';
import LocationPreferences from '../components/LocationPreferences';
import PowerOutagesList from '../components/PowerOutagesList';
import SignaturePad from '../components/SignaturePad';
import jsPDF from 'jspdf';
import { generatePaymentReceiptPDF, generateLegalNoticePDF, downloadPDF, pdfToBlob } from '../utils/pdfGenerator';

// Initialize Firebase services
const functions = getFunctions();
const db = getFirestore();
const storage = getStorage();

const TenantDashboard = () => {
  // ============ AUTH & NAVIGATION ============
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // ============ STATE MANAGEMENT ============
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showMoveOutModal, setShowMoveOutModal] = useState(false);
  const [submittingMoveOutNotice, setSubmittingMoveOutNotice] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const profilePhotoInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Loading states for Firebase operations
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  // Real-time data states
  const [tenantData, setTenantData] = useState(null);
  const [availableListings, setAvailableListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [landlordSettings, setLandlordSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [propertyData, setPropertyData] = useState(null);

  // Navbar scroll state
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [profileSettings, setProfileSettings] = useState({
    name: 'Sarah Kimani',
    email: 'sarah@email.com',
    phone: '+254 722 123 456',
    idNumber: '12345678',
    emergencyContact: '+254 711 987 654',
    preferredAreas: [], // Areas for power outage notifications
    notifications: {
      email: true,
      sms: true,
      push: true,
      rentReminders: true,
      maintenanceUpdates: true,
      messageAlerts: true
    }
  });

  // Preferences State - Load from localStorage
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('tenantPreferences');
    return saved ? JSON.parse(saved) : {
      darkMode: false,
      autoPayReminders: true,
      language: 'English',
      currency: 'KES (Kenyan Shilling)',
      dateFormat: 'DD/MM/YYYY',
      shareUsageData: true
    };
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tenantPreferences', JSON.stringify(preferences));
    console.log('Preferences saved:', preferences);
  }, [preferences]);

  // Apply dark mode class to document root
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  // BASIC BOOKING DATA FOR LOGGED-IN TENANTS
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    name: profileSettings.name,
    email: profileSettings.email,
    phone: profileSettings.phone,
    message: '',
    emailVerified: false
  });

  const [verificationCodes, setVerificationCodes] = useState({
    email: ''
  });

  const [verificationSent, setVerificationSent] = useState({
    email: false
  });

  const [payments, setPayments] = useState([
    { id: 1, month: 'November 2024', amount: 35000, date: '2024-11-03', status: 'Paid', method: 'M-Pesa' },
    { id: 2, month: 'October 2024', amount: 35000, date: '2024-10-05', status: 'Paid', method: 'M-Pesa' },
    { id: 3, month: 'September 2024', amount: 35000, date: '2024-09-04', status: 'Paid', method: 'Bank Transfer' },
    { id: 4, month: 'December 2024', amount: 35000, dueDate: '2024-12-05', status: 'Pending', method: null }
  ]);

  const [maintenanceRequests, setMaintenanceRequests] = useState([
    { id: 1, issue: 'Leaking faucet in kitchen', status: 'In Progress', date: '2024-11-28', priority: 'Medium', description: 'Kitchen sink faucet drips constantly' },
    { id: 2, issue: 'Broken window lock', status: 'Pending', date: '2024-11-25', priority: 'High', description: 'Bedroom window lock is broken' },
    { id: 3, issue: 'AC not cooling properly', status: 'Resolved', date: '2024-11-15', priority: 'Low', description: 'Air conditioning system needs servicing' }
  ]);

  const [documents, setDocuments] = useState([]);

  const [moveOutNotices, setMoveOutNotices] = useState([]);

  const [messages, setMessages] = useState([]);

  // Conversation-based messaging states
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationFilter, setConversationFilter] = useState('all'); // all, landlord, property_manager, maintenance
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newConversationMessage, setNewConversationMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const conversationMessagesEndRef = useRef(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  const [notifications, setNotifications] = useState([]);

  // Context menu states for memos and updates
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, itemId: null, itemType: null });
  const [longPressTimerMemo, setLongPressTimerMemo] = useState(null);

  const [newPayment, setNewPayment] = useState({
    amount: '35000',
    method: 'M-Pesa',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0]
  });

  const [newMaintenance, setNewMaintenance] = useState({
    issue: '',
    description: '',
    priority: 'Medium',
    location: ''
  });

  const [newMessage, setNewMessage] = useState({
    to: 'Property Manager',
    subject: '',
    message: ''
  });

  const [newDocument, setNewDocument] = useState({
    name: '',
    file: null
  });

  // Move-out notice data
  const [moveOutData, setMoveOutData] = useState({
    moveOutDate: '',
    noticePeriod: 60, // Default to 60 days
    reason: 'Relocation',
    additionalNotes: '',
    agreedToTerms: false
  });

  // Lease management states
  const [leases, setLeases] = useState([]);
  const [loadingLeases, setLoadingLeases] = useState(true);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSigningLease, setCurrentSigningLease] = useState(null);

  // Updates and Memos data
  const [updates, setUpdates] = useState([]);
  const [memos, setMemos] = useState([]);

  // Property Manager and Maintenance Staff data
  const [propertyManager, setPropertyManager] = useState(null);
  const [maintenanceStaff, setMaintenanceStaff] = useState(null);

  // Unread messages counter
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Documents tab state
  const [documentsTab, setDocumentsTab] = useState('uploaded'); // 'uploaded', 'leases', 'move-out'

  // ============ FIREBASE REALTIME DATA ============

  // Fetch tenant data to get their landlordId
  useEffect(() => {
    if (!currentUser) {
      console.log('No current user');
      return;
    }

    console.log('Fetching tenant data for user:', currentUser.uid);

    const tenantsQuery = query(
      collection(db, 'tenants'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(tenantsQuery, (snapshot) => {
      console.log('Tenant query returned:', snapshot.size, 'documents');
      if (!snapshot.empty) {
        const tenantDoc = snapshot.docs[0];
        const data = { id: tenantDoc.id, ...tenantDoc.data() };
        console.log('Tenant data found:', data);
        setTenantData(data);
      } else {
        console.log('No tenant data found for userId:', currentUser.uid);
        // Fallback: Try querying by email for backward compatibility
        const emailQuery = query(
          collection(db, 'tenants'),
          where('email', '==', currentUser.email.toLowerCase())
        );
        onSnapshot(emailQuery, (emailSnapshot) => {
          if (!emailSnapshot.empty) {
            const tenantDoc = emailSnapshot.docs[0];
            const data = { id: tenantDoc.id, ...tenantDoc.data() };
            console.log('Tenant data found by email:', data);
            setTenantData(data);
            // Update the document with userId for future queries
            updateDoc(doc(db, 'tenants', tenantDoc.id), {
              userId: currentUser.uid
            }).catch(err => console.error('Error updating tenant with userId:', err));
          } else {
            console.log('No tenant data found for email either:', currentUser.email.toLowerCase());
          }
        });
      }
    }, (error) => {
      console.error('Error fetching tenant data:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Update profile settings when tenant data is loaded
  useEffect(() => {
    if (tenantData) {
      setProfileSettings(prev => ({
        ...prev,
        name: tenantData.name || 'N/A',
        email: tenantData.email || 'N/A',
        phone: tenantData.phone || 'N/A',
        idNumber: tenantData.idNumber || 'N/A',
        emergencyContact: tenantData.emergencyContact || 'N/A'
      }));
    }
  }, [tenantData]);

  // Fetch leases for the current tenant
  useEffect(() => {
    if (!tenantData?.id) {
      setLoadingLeases(false);
      return;
    }

    console.log('Fetching leases for tenant:', tenantData.id);
    setLoadingLeases(true);

    const leasesQuery = query(
      collection(db, 'leases'),
      where('tenantId', '==', tenantData.id)
    );

    const unsubscribe = onSnapshot(leasesQuery, (snapshot) => {
      console.log('Leases query returned:', snapshot.size, 'documents');
      const leasesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeases(leasesData);
      setLoadingLeases(false);
    }, (error) => {
      console.error('Error fetching leases:', error);
      setLoadingLeases(false);
    });

    return () => unsubscribe();
  }, [tenantData?.id]);

  // Permission check helpers
  const canAccessPortal = () => {
    if (!landlordSettings) return true; // Allow access while loading
    return landlordSettings.communicationPrefs?.tenantPortalEnabled !== false;
  };

  const canUseSelfService = () => {
    if (!landlordSettings) return true; // Allow access while loading
    return landlordSettings.communicationPrefs?.allowTenantSelfService !== false;
  };

  // Fetch landlord settings to enforce permissions
  useEffect(() => {
    if (!tenantData?.landlordId) {
      setLoadingSettings(false);
      return;
    }

    const fetchLandlordSettings = async () => {
      try {
        setLoadingSettings(true);
        const settingsRef = doc(db, 'landlordSettings', tenantData.landlordId);

        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(settingsRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const settings = docSnapshot.data();
            console.log('Landlord settings loaded:', settings);
            setLandlordSettings(settings);
          } else {
            console.log('No landlord settings found, using defaults');
            // Set defaults if no settings found
            setLandlordSettings({
              communicationPrefs: {
                tenantPortalEnabled: true,
                allowTenantSelfService: true
              }
            });
          }
          setLoadingSettings(false);
        }, (error) => {
          console.error('Error fetching landlord settings:', error);
          // On error, allow access (fail open)
          setLandlordSettings({
            communicationPrefs: {
              tenantPortalEnabled: true,
              allowTenantSelfService: true
            }
          });
          setLoadingSettings(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up landlord settings listener:', error);
        setLoadingSettings(false);
      }
    };

    fetchLandlordSettings();
  }, [tenantData?.landlordId]);

  // Fetch listings filtered by tenant's landlordId
  useEffect(() => {
    if (!tenantData?.landlordId) {
      console.log('No landlordId found in tenant data');
      setLoadingListings(false);
      return;
    }

    console.log('Fetching listings for landlordId:', tenantData.landlordId);

    const listingsQuery = query(
      collection(db, 'listings'),
      where('landlordId', '==', tenantData.landlordId),
      where('status', '==', 'available')
    );

    const unsubscribe = onSnapshot(listingsQuery, (snapshot) => {
      const listingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Listings found:', listingsData.length, listingsData);
      setAvailableListings(listingsData);
      setLoadingListings(false);
    }, (error) => {
      console.error('Error fetching listings:', error);
      setLoadingListings(false);
    });

    return () => unsubscribe();
  }, [tenantData]);

  // Fetch maintenance requests from Firebase
  useEffect(() => {
    if (!tenantData?.id) return;

    const maintenanceQuery = query(
      collection(db, 'maintenance'),
      where('tenantId', '==', tenantData.id)
    );

    const unsubscribe = onSnapshot(maintenanceQuery, (snapshot) => {
      const maintenanceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaintenanceRequests(maintenanceData);
    }, (error) => {
      console.error('Error fetching maintenance requests:', error);
    });

    return () => unsubscribe();
  }, [tenantData]);

  // Fetch property data for WhatsApp group link
  useEffect(() => {
    if (!tenantData?.propertyId) return;

    const fetchPropertyData = async () => {
      try {
        const propertyRef = doc(db, 'properties', tenantData.propertyId);
        const propertySnap = await getDoc(propertyRef);
        if (propertySnap.exists()) {
          setPropertyData({ id: propertySnap.id, ...propertySnap.data() });
        }
      } catch (error) {
        console.error('Error fetching property data:', error);
      }
    };

    fetchPropertyData();
  }, [tenantData?.propertyId]);

  // Fetch payments from Firebase
  useEffect(() => {
    if (!tenantData?.id) return;

    console.log('💵 Tenant querying payments with tenantId:', tenantData.id);
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('tenantId', '==', tenantData.id)
    );

    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      console.log('💵 Tenant payments query returned:', snapshot.size, 'documents');
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('💵 Tenant payments data:', paymentsData);
      setPayments(paymentsData);
    }, (error) => {
      console.error('Error fetching payments:', error);
    });

    return () => unsubscribe();
  }, [tenantData]);

  // Fetch messages from Firebase - fetch all messages for this user
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('🚫 No currentUser.uid for message fetching');
      return;
    }

    console.log('📩 Starting message fetch for tenant with UID:', currentUser.uid);

    // Query messages where this user is the recipient
    const receivedQuery = query(
      collection(db, 'messages'),
      where('recipientId', '==', currentUser.uid)
    );

    // Query messages where this user is the sender
    const sentQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', currentUser.uid)
    );

    let allReceivedMessages = [];
    let allSentMessages = [];

    const unsubscribe1 = onSnapshot(receivedQuery, (snapshot) => {
      console.log('📬 Received messages found:', snapshot.size);
      allReceivedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      updateAllMessages();
    }, (error) => {
      console.error('❌ Error fetching received messages:', error);
    });

    const unsubscribe2 = onSnapshot(sentQuery, (snapshot) => {
      console.log('📤 Sent messages found:', snapshot.size);
      allSentMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      updateAllMessages();
    }, (error) => {
      console.error('❌ Error fetching sent messages:', error);
    });

    const updateAllMessages = () => {
      const combined = [...allReceivedMessages, ...allSentMessages];

      // Sort by timestamp, newest first
      combined.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeB - timeA;
      });

      const unreadCount = allReceivedMessages.filter(m => !m.read).length;
      console.log('💬 Total messages for tenant:', combined.length);
      console.log('📊 Unread messages:', unreadCount);
      setMessages(combined);
    };

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser]);

  // Fetch documents from Firebase
  useEffect(() => {
    if (!tenantData?.id) return;

    const documentsQuery = query(
      collection(db, 'documents'),
      where('tenantId', '==', tenantData.id)
    );

    const unsubscribe = onSnapshot(documentsQuery, (snapshot) => {
      const documentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDocuments(documentsData);
    }, (error) => {
      console.error('Error fetching documents:', error);
    });

    return () => unsubscribe();
  }, [tenantData]);

  // Fetch move-out notices from Firebase
  useEffect(() => {
    if (!tenantData?.id) return;

    const moveOutNoticesQuery = query(
      collection(db, 'moveOutNotices'),
      where('tenantId', '==', tenantData.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(moveOutNoticesQuery, (snapshot) => {
      const noticesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMoveOutNotices(noticesData);
      console.log('📋 Move-out notices loaded:', noticesData.length);
    }, (error) => {
      console.error('Error fetching move-out notices:', error);
    });

    return () => unsubscribe();
  }, [tenantData]);

  // Fetch notifications from Firebase
  useEffect(() => {
    if (!currentUser?.uid) return;

    console.log('📬 Setting up notification listener for tenant:', currentUser.uid);

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid), // Use currentUser.uid, not tenantData.id
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📬 Received', notificationsData.length, 'notifications for tenant');
      setNotifications(notificationsData);
    }, (error) => {
      console.error('❌ Error fetching notifications:', error);
    });

    return () => unsubscribe();
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

  // Fetch conversations for Messages tab
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('🚫 No currentUser.uid for conversation fetching');
      return;
    }

    console.log('📡 Setting up conversation listeners for tenant:', currentUser.uid);

    const q = query(
      collection(db, 'messages'),
      where('senderId', '==', currentUser.uid)
    );

    const q2 = query(
      collection(db, 'messages'),
      where('recipientId', '==', currentUser.uid)
    );

    // Process messages into conversations - MUST be inside useEffect to access current user
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
      console.log('🧹 Cleaning up conversation listeners');
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser]);

  // Real-time unread messages counter
  useEffect(() => {
    if (!currentUser?.uid) {
      setUnreadMessagesCount(0);
      return;
    }

    console.log('📊 Setting up unread messages counter for:', currentUser.uid);

    const unreadQuery = query(
      collection(db, 'messages'),
      where('recipientId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      const count = snapshot.size;
      console.log('💬 Unread messages count updated:', count);
      setUnreadMessagesCount(count);
    }, (error) => {
      console.error('❌ Error fetching unread messages count:', error);
    });

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📬 Loaded', snapshot.size, 'messages for conversation');
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversationMessages(messages);

      // Mark unread messages from this conversation as read
      const unreadMessages = messages.filter(msg =>
        msg.recipientId === currentUser?.uid && !msg.read
      );

      if (unreadMessages.length > 0) {
        console.log(`📖 Marking ${unreadMessages.length} messages as read`);
        unreadMessages.forEach(async (msg) => {
          try {
            const messageRef = doc(db, 'messages', msg.id);
            await updateDoc(messageRef, { read: true });
          } catch (error) {
            console.error('Error marking message as read:', error);
          }
        });
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
  }, [selectedConversation, currentUser]);

  // Long press handlers for conversation deletion
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
        senderName: tenantData?.name || currentUser.displayName || 'Tenant',
        senderRole: 'tenant',
        recipientId: selectedConversation.otherUserId,
        recipientName: selectedConversation.otherUserName,
        recipientRole: selectedConversation.otherUserRole,
        text: messageText,
        timestamp: serverTimestamp(),
        read: false,
        propertyName: selectedConversation.propertyName || tenantData?.property || '',
        unit: selectedConversation.unit || tenantData?.unit || '',
        participants: [currentUser.uid, selectedConversation.otherUserId]
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        userId: selectedConversation.otherUserId,
        type: 'message',
        title: 'New Message from Tenant',
        message: `You have a new message: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
        read: false,
        timestamp: serverTimestamp(),
        senderId: currentUser.uid,
        senderName: tenantData?.name || currentUser.displayName || 'Tenant',
        senderRole: 'tenant',
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

  // Handle navbar auto-hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        // At the top, always show navbar
        setShowNavbar(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down, hide navbar
        setShowNavbar(false);
      } else {
        // Scrolling up, show navbar
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Prevent accidental back navigation from dashboard
  useEffect(() => {
    // Push a dummy state when component mounts
    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = (e) => {
      // Prevent going back by pushing forward again
      window.history.pushState(null, '', window.location.pathname);

      // Optionally show a confirmation dialog
      const confirmLeave = window.confirm('Are you sure you want to leave the dashboard?');
      if (confirmLeave) {
        // If user confirms, navigate to home or logout
        navigate('/');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // Fetch Updates from Firestore
  useEffect(() => {
    if (!tenantData?.landlordId) return;

    const updatesQuery = query(
      collection(db, 'updates'),
      where('landlordId', '==', tenantData.landlordId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(updatesQuery, (snapshot) => {
      const updatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUpdates(updatesData);
    }, (error) => {
      console.error('Error fetching updates:', error);
    });

    return unsubscribe;
  }, [tenantData]);

  // Fetch Memos from Firestore
  useEffect(() => {
    if (!tenantData?.landlordId) return;

    const memosQuery = query(
      collection(db, 'memos'),
      where('landlordId', '==', tenantData.landlordId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(memosQuery, (snapshot) => {
      const memosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMemos(memosData);
    }, (error) => {
      console.error('Error fetching memos:', error);
    });

    return unsubscribe;
  }, [tenantData]);

  // Fetch Property Manager and Maintenance Staff assigned to tenant's landlord
  useEffect(() => {
    if (!tenantData?.landlordId) {
      console.log('⚠️ Missing landlordId for fetching team members');
      return;
    }

    console.log('👥 Fetching team members for landlord:', tenantData.landlordId);
    console.log('📋 Tenant propertyId:', tenantData.propertyId);

    // Fetch Property Managers
    const pmQuery = query(
      collection(db, 'teamMembers'),
      where('landlordId', '==', tenantData.landlordId),
      where('role', '==', 'property_manager'),
      where('status', '==', 'active')
    );

    const unsubscribePM = onSnapshot(pmQuery, (snapshot) => {
      console.log(`📊 Found ${snapshot.size} property managers for landlord`);

      let selectedPM = null;

      // If tenant has propertyId, find PM assigned to that property
      if (tenantData.propertyId) {
        const assignedPMs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(pm =>
            pm.assignedProperties &&
            pm.assignedProperties.includes(tenantData.propertyId)
          );

        if (assignedPMs.length > 0) {
          selectedPM = assignedPMs[0];
          console.log('✅ Found property manager assigned to property:', selectedPM.name);
        }
      }

      // Fallback: If no property-specific PM found, use first available PM
      if (!selectedPM && snapshot.size > 0) {
        selectedPM = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        console.log('✅ Using first available property manager:', selectedPM.name);
      }

      setPropertyManager(selectedPM);

      if (!selectedPM) {
        console.log('⚠️ No property manager found for this landlord');
      }
    }, (error) => {
      console.error('Error fetching property managers:', error);
    });

    // Fetch Maintenance Staff
    const maintenanceQuery = query(
      collection(db, 'teamMembers'),
      where('landlordId', '==', tenantData.landlordId),
      where('role', '==', 'maintenance'),
      where('status', '==', 'active')
    );

    const unsubscribeMaintenance = onSnapshot(maintenanceQuery, (snapshot) => {
      console.log(`📊 Found ${snapshot.size} maintenance staff for landlord`);

      let selectedMS = null;

      // If tenant has propertyId, find maintenance staff assigned to that property
      if (tenantData.propertyId) {
        const assignedMS = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(ms =>
            ms.assignedProperties &&
            ms.assignedProperties.includes(tenantData.propertyId)
          );

        if (assignedMS.length > 0) {
          selectedMS = assignedMS[0];
          console.log('✅ Found maintenance staff assigned to property:', selectedMS.name);
        }
      }

      // Fallback: If no property-specific maintenance found, use first available
      if (!selectedMS && snapshot.size > 0) {
        selectedMS = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        console.log('✅ Using first available maintenance staff:', selectedMS.name);
      }

      setMaintenanceStaff(selectedMS);

      if (!selectedMS) {
        console.log('⚠️ No maintenance staff found for this landlord');
      }
    }, (error) => {
      console.error('Error fetching maintenance staff:', error);
    });

    return () => {
      unsubscribePM();
      unsubscribeMaintenance();
    };
  }, [tenantData]);

  // ============ FIREBASE FUNCTIONS ============
  
  // Email Verification Function
  const sendEmailVerificationCode = async () => {
    if (!bookingData.email) {
      alert('Please enter your email address first');
      return false;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setIsSendingVerification(true);
    
    try {
      const sendVerification = httpsCallable(functions, 'sendEmailVerificationCode');
      const result = await sendVerification({
        email: bookingData.email,
        name: bookingData.name,
        code: code
      });
      
      if (result.data.success) {
        // Store code for verification
        setVerificationCodes({...verificationCodes, email: code});
        setVerificationSent({...verificationSent, email: true});
        alert(`✅ Verification code sent to ${bookingData.email}!\n\nCheck your email inbox (and spam folder).`);
        return true;
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      alert('❌ Failed to send verification email. Please check your email address and try again.');
      return false;
    } finally {
      setIsSendingVerification(false);
    }
  };

  // Email Verification Check
  const verifyEmailCode = (inputCode) => {
    if (inputCode === verificationCodes.email) {
      setBookingData({...bookingData, emailVerified: true});
      alert('✅ Email verified successfully!');
      return true;
    } else {
      alert('❌ Invalid verification code. Please try again.');
      return false;
    }
  };

  // Calculate Credibility Score
  const calculateCredibilityScore = () => {
    let score = 0;

    // Email verified (25%)
    if (bookingData.emailVerified) score += 25;

    // Employment info (25%)
    if (bookingData.employmentStatus && bookingData.employerName) score += 25;

    // Motivation provided (25%)
    if (bookingData.motivation && bookingData.motivation.length >= 50) score += 25;

    // Additional info (25%)
    let additionalScore = 0;
    if (bookingData.moveInDate) additionalScore += 8;
    if (bookingData.currentResidence) additionalScore += 8;
    if (bookingData.references) additionalScore += 9;
    score += additionalScore;

    return Math.min(score, 100);
  };

  // Submit Booking to Firebase
  const handleBookViewing = async () => {
    // Validation
    if (!bookingData.date || !bookingData.time) {
      alert('Please select a date and time for the viewing');
      return;
    }

    const credibilityScore = calculateCredibilityScore();

    setIsSubmittingBooking(true);

    try {
      // Save to Firestore with proper null checks
      const propertyName = selectedListing?.property || selectedListing?.name || 'Property';
      const unitInfo = selectedListing?.unit ? ` - ${selectedListing.unit}` : '';
      const fullPropertyName = `${propertyName}${unitInfo}`;

      // Ensure we have landlordId from listing or tenant data
      const landlordId = selectedListing?.landlordId || tenantData?.landlordId || '';

      console.log('📝 Creating viewing request with landlordId:', landlordId);
      console.log('Selected listing:', selectedListing);
      console.log('Tenant data:', tenantData);

      if (!landlordId) {
        throw new Error('Landlord ID not found. Please try again or contact support.');
      }

      const bookingRef = await addDoc(collection(db, 'viewingRequests'), {
        propertyId: selectedListing?.id || '',
        propertyName: fullPropertyName,
        location: selectedListing?.location || selectedListing?.address || propertyName,
        rent: selectedListing?.rent || 0,
        landlordId: landlordId, // Add landlordId for landlord to fetch their viewing requests
        viewingDate: bookingData.date,
        viewingTime: bookingData.time,
        tenantInfo: {
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          emailVerified: bookingData.emailVerified
        },
        employmentInfo: {
          status: bookingData.employmentStatus || '',
          employerName: bookingData.employerName || '',
          employerPhone: bookingData.employerPhone || '',
          occupation: bookingData.occupation || '',
          monthlyIncome: bookingData.monthlyIncome || ''
        },
        additionalInfo: {
          motivation: bookingData.motivation || '',
          moveInDate: bookingData.moveInDate || '',
          currentResidence: bookingData.currentResidence || '',
          references: bookingData.references || '',
          message: bookingData.message || ''
        },
        credibilityScore: credibilityScore,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Viewing request created successfully:', bookingRef.id);

      // Send notification email to landlord
      try {
        const sendNotification = httpsCallable(functions, 'sendViewingNotification');
        await sendNotification({
          bookingId: bookingRef.id,
          propertyName: fullPropertyName,
          tenantName: bookingData.name,
          tenantEmail: bookingData.email,
          viewingDate: bookingData.date,
          viewingTime: bookingData.time,
          credibilityScore: credibilityScore
        });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // Continue even if email fails
      }

      alert('✅ Viewing request submitted successfully!\n\nThe property manager will contact you shortly to confirm your viewing appointment.');
      
      // Reset form and close modal
      setShowBookingModal(false);
      setSelectedListing(null);
      setBookingData({
        date: '',
        time: '',
        name: profileSettings.name,
        email: profileSettings.email,
        phone: profileSettings.phone,
        message: '',
        emailVerified: false,
        employmentStatus: '',
        employerName: '',
        employerPhone: '',
        monthlyIncome: '',
        occupation: '',
        motivation: '',
        moveInDate: '',
        currentResidence: '',
        references: ''
      });
      setVerificationCodes({ email: '' });
      setVerificationSent({ email: false });

    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('❌ Failed to submit viewing request. Please try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // ============ OTHER HANDLERS ============
  
  const handleAddPayment = async () => {
    // Validate required fields
    if (!newPayment.amount || !newPayment.method) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate amount is a positive number
    const amount = parseInt(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Amount must be a positive number');
      return;
    }

    // Validate date if provided
    if (newPayment.date) {
      const paidDate = new Date(newPayment.date);
      if (isNaN(paidDate.getTime())) {
        alert('Invalid payment date');
        return;
      }
    }

    if (!tenantData) {
      alert('Unable to submit payment. Please try logging in again.');
      return;
    }

    try {
      // Calculate the month for this payment
      const paymentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Check for existing payments for this month
      const existingPaymentsForMonth = payments.filter(p => p.month === paymentMonth);

      // If there's already a payment for this month, show warning
      if (existingPaymentsForMonth.length > 0) {
        const existingStatus = existingPaymentsForMonth.map(p => p.status).join(', ');
        const confirmSubmit = window.confirm(
          `⚠️ WARNING: A payment for ${paymentMonth} already exists (Status: ${existingStatus}).\n\n` +
          `This could be:\n` +
          `• A payment you already submitted\n` +
          `• A payment record created by your landlord\n\n` +
          `Are you sure you want to submit another payment for the same month?`
        );

        if (!confirmSubmit) {
          console.log('Payment submission cancelled by user (duplicate detected)');
          return;
        }
      }

      const paymentData = {
        month: paymentMonth,
        amount: parseInt(newPayment.amount),
        paidDate: newPayment.date,
        dueDate: newPayment.dueDate,
        status: 'pending',
        method: newPayment.method,
        referenceNumber: newPayment.reference || '',
        createdAt: serverTimestamp(),
        tenantId: tenantData.id,
        tenantName: tenantData.name,
        tenant: tenantData.name,
        propertyId: tenantData.propertyId || '',
        propertyName: tenantData.property || tenantData.propertyName || '',
        property: tenantData.property || tenantData.propertyName || '',
        unitNumber: tenantData.unit || '',
        unit: tenantData.unit || '',
        landlordId: tenantData.landlordId
      };

      await addDoc(collection(db, 'payments'), paymentData);

      setShowPaymentModal(false);
      setNewPayment({ amount: '35000', method: 'M-Pesa', reference: '', date: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0] });
      alert('Payment submitted for verification!');
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment. Please try again.');
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        alert('Payment not found');
        return;
      }

      // Prepare payment data with additional details
      const paymentData = {
        ...payment,
        id: paymentId
      };

      // Prepare tenant data
      const tenant = {
        name: tenantData?.name || payment.tenantName || 'Tenant',
        idNumber: tenantData?.idNumber || null
      };

      // Prepare landlord data
      const landlord = {
        name: tenantData?.landlordName || 'Landlord',
        email: tenantData?.landlordEmail || null,
        phone: tenantData?.landlordPhone || null
      };

      // Generate PDF using utility function
      const doc = generatePaymentReceiptPDF(paymentData, tenant, landlord);

      // Download PDF
      const filename = `Receipt_${payment.month || 'Payment'}_${paymentId.substring(0, 8)}.pdf`;
      downloadPDF(doc, filename);

    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Error generating receipt. Please try again.');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'payments', paymentId));
      alert('Payment record deleted successfully!');
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment. Please try again.');
    }
  };

  // Move-out notice handler
  const handleSubmitMoveOutNotice = async () => {
    // Validation
    if (!moveOutData.moveOutDate) {
      alert('Please select a move-out date');
      return;
    }

    if (!moveOutData.agreedToTerms) {
      alert('Please confirm that you understand this notice is binding');
      return;
    }

    if (!tenantData) {
      alert('Unable to submit notice. Please try logging in again.');
      return;
    }

    // Check 30-day minimum notice
    const selectedDate = new Date(moveOutData.moveOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDifference = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));

    const minimumDays = moveOutData.noticePeriod || 60;
    if (daysDifference < minimumDays) {
      alert(`Move-out notice must be at least ${minimumDays} days in advance as per your tenancy agreement.`);
      return;
    }

    setSubmittingMoveOutNotice(true);

    try {
      // Generate unique reference number
      const timestamp = Date.now();
      const referenceNumber = `MVN-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${timestamp.toString().slice(-5)}`;

      // Prepare notice data
      const noticeData = {
        initiatedBy: 'tenant',
        tenantId: tenantData.id || currentUser.uid,
        tenantName: tenantData.name || currentUser.displayName,
        tenantEmail: tenantData.email || currentUser.email,
        tenantPhone: tenantData.phone || '',
        tenantIdNumber: tenantData.idNumber || '',
        propertyId: tenantData.propertyId || '',
        propertyName: tenantData.property || tenantData.propertyName || '',
        unit: tenantData.unit || '',
        landlordId: tenantData.landlordId || '',
        landlordName: tenantData.landlordName || '',
        landlordEmail: tenantData.landlordEmail || '',
        intendedMoveOutDate: new Date(moveOutData.moveOutDate),
        noticeSubmittedDate: new Date(),
        noticePeriod: moveOutData.noticePeriod || 60,
        reason: moveOutData.reason,
        additionalNotes: moveOutData.additionalNotes || '',
        status: 'submitted',
        legalNoticeGenerated: false,
        legalNoticeURL: '',
        referenceNumber: referenceNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Generate legal notice PDF
      const pdfDoc = generateLegalNoticePDF({
        ...noticeData,
        id: referenceNumber
      });

      // Convert PDF to blob
      const pdfBlob = pdfToBlob(pdfDoc);

      // Upload PDF to Firebase Storage
      const storageRef = ref(storage, `legal-notices/${referenceNumber}.pdf`);
      await uploadBytes(storageRef, pdfBlob);

      // Get download URL
      const pdfURL = await getDownloadURL(storageRef);

      // Update notice data with PDF info
      noticeData.legalNoticeGenerated = true;
      noticeData.legalNoticeURL = pdfURL;

      // Save to Firestore with timestamp fields
      const firestoreNoticeData = {
        ...noticeData,
        intendedMoveOutDate: serverTimestamp(),
        noticeSubmittedDate: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'moveOutNotices'), firestoreNoticeData);

      // Send notification to landlord
      if (tenantData.landlordId) {
        await addDoc(collection(db, 'notifications'), {
          userId: tenantData.landlordId,
          title: 'Move-Out Notice Submitted',
          message: `${tenantData.name} has submitted a move-out notice for ${tenantData.unit} on ${moveOutData.moveOutDate}`,
          type: 'move_out_notice',
          relatedId: docRef.id,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Log activity
      await addDoc(collection(db, 'activityLog'), {
        userId: tenantData.id || currentUser.uid,
        userName: tenantData.name || currentUser.displayName,
        userRole: 'tenant',
        propertyId: tenantData.propertyId || '',
        unit: tenantData.unit || '',
        landlordId: tenantData.landlordId || '',
        actionType: 'move_out_notice',
        actionDescription: `Move-out notice submitted for ${moveOutData.moveOutDate}`,
        metadata: {
          noticeId: docRef.id,
          moveOutDate: moveOutData.moveOutDate,
          noticePeriod: moveOutData.noticePeriod || 60,
          reason: moveOutData.reason
        },
        relatedDocumentId: docRef.id,
        createdAt: serverTimestamp()
      });

      // Reset form and close modal
      setMoveOutData({
        moveOutDate: '',
        noticePeriod: 60,
        reason: 'Relocation',
        additionalNotes: '',
        agreedToTerms: false
      });
      setShowMoveOutModal(false);

      alert(`Move-out notice submitted successfully!\n\nReference Number: ${referenceNumber}\n\nYour landlord has been notified and will acknowledge your notice soon.\n\nA legal notice PDF has been generated and is available in your dashboard.`);
    } catch (error) {
      console.error('Error submitting move-out notice:', error);
      alert('Failed to submit move-out notice. Please try again.');
    } finally {
      setSubmittingMoveOutNotice(false);
    }
  };

  // Lease management handlers
  const handleSignLease = (lease) => {
    setCurrentSigningLease(lease);
    setShowSignaturePad(true);
  };

  const handleSaveSignature = async (signatureData) => {
    try {
      const leaseRef = doc(db, 'leases', currentSigningLease.id);

      const updateData = {
        tenantSignature: signatureData,
        tenantSignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Check if landlord has already signed
      if (currentSigningLease.landlordSignature) {
        // Both signatures now present - activate lease
        updateData.status = 'active';
      } else {
        // Only tenant signature - mark as pending
        updateData.status = 'pending_signature';
      }

      await updateDoc(leaseRef, updateData);

      // Create notification for landlord
      await addDoc(collection(db, 'notifications'), {
        type: 'lease_signed',
        recipientId: currentSigningLease.landlordId,
        recipientRole: 'landlord',
        title: 'Tenant Signed Lease Agreement',
        message: `${tenantData.name} has signed the lease agreement for ${currentSigningLease.propertyName} - ${currentSigningLease.unit}`,
        leaseId: currentSigningLease.id,
        read: false,
        createdAt: serverTimestamp()
      });

      setShowSignaturePad(false);
      setCurrentSigningLease(null);

      alert('Lease signed successfully! Your landlord has been notified.');
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Failed to save signature. Please try again.');
    }
  };

  const handleDownloadLeasePDF = (lease) => {
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RESIDENTIAL LEASE AGREEMENT', 105, 20, { align: 'center' });

      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);

      let yPos = 35;

      // Property Details Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROPERTY DETAILS', 20, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Property: ${lease.propertyName}`, 20, yPos);
      yPos += 6;
      doc.text(`Unit: ${lease.unit}`, 20, yPos);
      yPos += 6;
      doc.text(`Address: ${lease.propertyAddress || 'N/A'}`, 20, yPos);
      yPos += 10;

      // Parties Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PARTIES', 20, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Landlord: ${lease.landlordName}`, 20, yPos);
      yPos += 6;
      doc.text(`Tenant: ${lease.tenantName}`, 20, yPos);
      yPos += 10;

      // Lease Terms Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LEASE TERMS', 20, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Start Date: ${new Date(lease.startDate).toLocaleDateString()}`, 20, yPos);
      yPos += 6;
      doc.text(`End Date: ${new Date(lease.endDate).toLocaleDateString()}`, 20, yPos);
      yPos += 6;
      doc.text(`Monthly Rent: KES ${Number(lease.monthlyRent).toLocaleString()}`, 20, yPos);
      yPos += 6;
      doc.text(`Security Deposit: KES ${Number(lease.securityDeposit).toLocaleString()}`, 20, yPos);
      yPos += 6;
      doc.text(`Late Fee: ${lease.lateFeePercentage}% after ${lease.lateFeeDays} days`, 20, yPos);
      yPos += 10;

      // Utilities Section
      if (lease.utilitiesIncluded && lease.utilitiesIncluded.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('UTILITIES INCLUDED', 20, yPos);
        yPos += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        lease.utilitiesIncluded.forEach(utility => {
          doc.text(`• ${utility}`, 20, yPos);
          yPos += 6;
        });
        yPos += 4;
      }

      // Special Terms Section
      if (lease.specialTerms) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SPECIAL TERMS', 20, yPos);
        yPos += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(lease.specialTerms, 170);
        doc.text(splitText, 20, yPos);
        yPos += splitText.length * 6 + 10;
      }

      // Signatures Section
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SIGNATURES', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Landlord Signature
      if (lease.landlordSignature) {
        doc.text('Landlord Signature:', 20, yPos);
        yPos += 6;
        doc.addImage(lease.landlordSignature, 'PNG', 20, yPos, 60, 20);
        yPos += 22;
        if (lease.landlordSignedAt) {
          doc.text(`Signed: ${new Date(lease.landlordSignedAt.seconds * 1000).toLocaleDateString()}`, 20, yPos);
        }
        yPos += 10;
      } else {
        doc.text('Landlord Signature: ____________________', 20, yPos);
        yPos += 10;
      }

      // Tenant Signature
      if (lease.tenantSignature) {
        doc.text('Tenant Signature:', 20, yPos);
        yPos += 6;
        doc.addImage(lease.tenantSignature, 'PNG', 20, yPos, 60, 20);
        yPos += 22;
        if (lease.tenantSignedAt) {
          doc.text(`Signed: ${new Date(lease.tenantSignedAt.seconds * 1000).toLocaleDateString()}`, 20, yPos);
        }
      } else {
        doc.text('Tenant Signature: ____________________', 20, yPos);
      }

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Generated via Nyumbanii Property Management', 105, 285, { align: 'center' });
      doc.text('www.nyumbanii.co.ke', 105, 290, { align: 'center' });

      // Download
      const filename = `Lease_${lease.propertyName}_${lease.unit}_${lease.id.substring(0, 8)}.pdf`;
      doc.save(filename);

    } catch (error) {
      console.error('Error generating lease PDF:', error);
      alert('Error generating lease PDF. Please try again.');
    }
  };

  // Context menu handlers for memos and updates
  const handleMemoUpdateContextMenu = (e, itemId, itemType) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      itemId,
      itemType
    });
  };

  const handleMemoUpdateLongPressStart = (itemId, itemType) => {
    const timer = setTimeout(() => {
      setContextMenu({
        visible: true,
        x: window.innerWidth / 2 - 50,
        y: window.innerHeight / 2,
        itemId,
        itemType
      });
    }, 500); // 500ms long press
    setLongPressTimerMemo(timer);
  };

  const handleMemoUpdateLongPressEnd = () => {
    if (longPressTimerMemo) {
      clearTimeout(longPressTimerMemo);
      setLongPressTimerMemo(null);
    }
  };

  const handleDeleteMemo = async (memoId) => {
    if (!window.confirm('Are you sure you want to delete this memo?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'memos', memoId));
      setContextMenu({ visible: false, x: 0, y: 0, itemId: null, itemType: null });
      alert('Memo deleted successfully!');
    } catch (error) {
      console.error('Error deleting memo:', error);
      alert('Failed to delete memo. Please try again.');
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    if (!window.confirm('Are you sure you want to delete this update?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'updates', updateId));
      setContextMenu({ visible: false, x: 0, y: 0, itemId: null, itemType: null });
      alert('Update deleted successfully!');
    } catch (error) {
      console.error('Error deleting update:', error);
      alert('Failed to delete update. Please try again.');
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, itemId: null, itemType: null });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible]);

  const handleAddMaintenanceRequest = async () => {
    if (!newMaintenance.issue || !newMaintenance.description) {
      alert('Please fill in all required fields');
      return;
    }

    if (!tenantData) {
      alert('Unable to submit request. Please try logging in again.');
      return;
    }

    try {
      const maintenanceData = {
        issue: newMaintenance.issue,
        description: newMaintenance.description,
        priority: newMaintenance.priority,
        location: newMaintenance.location || 'Not specified',
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        tenantId: tenantData.id,
        tenantName: tenantData.name,
        tenantEmail: tenantData.email,
        tenantPhone: tenantData.phone,
        propertyId: tenantData.propertyId || '',
        propertyName: tenantData.property || tenantData.propertyName || '',
        unitNumber: tenantData.unit || '',
        landlordId: tenantData.landlordId
      };

      // Save maintenance request
      await addDoc(collection(db, 'maintenance'), maintenanceData);

      // Also save to maintenanceRequests collection for compatibility
      await addDoc(collection(db, 'maintenanceRequests'), {
        ...maintenanceData,
        property: tenantData.property || tenantData.propertyName || '',
        unit: tenantData.unit || ''
      });

      // Create notification for landlord
      if (tenantData.landlordId) {
        await addDoc(collection(db, 'notifications'), {
          userId: tenantData.landlordId,
          title: 'New Maintenance Request',
          message: `${tenantData.name} has submitted a ${newMaintenance.priority} priority maintenance request: ${newMaintenance.issue} at ${tenantData.property || tenantData.propertyName} (Unit: ${tenantData.unit})`,
          type: 'maintenance',
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Find property managers assigned to this property and notify them
      if (tenantData.propertyId && tenantData.landlordId) {
        const teamMembersQuery = query(
          collection(db, 'teamMembers'),
          where('landlordId', '==', tenantData.landlordId),
          where('role', '==', 'property_manager')
        );

        const teamMembersSnapshot = await getDocs(teamMembersQuery);

        // Create notifications for property managers assigned to this property
        const notificationPromises = [];
        teamMembersSnapshot.forEach((doc) => {
          const teamMemberData = doc.data();
          if (teamMemberData.assignedProperties && teamMemberData.assignedProperties.includes(tenantData.propertyId)) {
            // This property manager is assigned to this property
            if (teamMemberData.userId) {
              notificationPromises.push(
                addDoc(collection(db, 'notifications'), {
                  userId: teamMemberData.userId,
                  title: 'New Maintenance Request',
                  message: `${tenantData.name} has submitted a ${newMaintenance.priority} priority maintenance request: ${newMaintenance.issue} at ${tenantData.property || tenantData.propertyName} (Unit: ${tenantData.unit})`,
                  type: 'maintenance',
                  read: false,
                  createdAt: serverTimestamp()
                })
              );
            }
          }
        });

        await Promise.all(notificationPromises);
      }

      setShowMaintenanceModal(false);
      setNewMaintenance({ issue: '', description: '', priority: 'Medium', location: '' });
      alert('Maintenance request submitted successfully!');
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      alert('Failed to submit maintenance request. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.subject || !newMessage.message) {
      alert('Please fill in all fields');
      return;
    }

    if (!tenantData) {
      alert('Unable to send message. Please try logging in again.');
      return;
    }

    if (!tenantData.landlordId) {
      alert('Unable to send message. Landlord information not found.');
      return;
    }

    try {
      // Create conversation ID (sorted user IDs)
      const conversationId = [currentUser.uid, tenantData.landlordId].sort().join('_');

      // Get landlord name (fallback if not in tenantData)
      const landlordName = tenantData.landlordName || 'Your Landlord';

      const messageData = {
        // New schema fields
        senderId: currentUser.uid,
        senderName: tenantData.name || currentUser.displayName || 'Tenant',
        senderRole: 'tenant',
        recipientId: tenantData.landlordId,
        recipientName: landlordName,
        recipientRole: 'landlord',
        conversationId: conversationId,
        text: `Subject: ${newMessage.subject}\n\n${newMessage.message}`,
        timestamp: serverTimestamp(),
        read: false,
        // Property context
        propertyName: tenantData.property || '',
        unit: tenantData.unit || '',
        // Keep legacy fields for backward compatibility
        from: tenantData.name,
        fromEmail: tenantData.email,
        to: newMessage.to,
        subject: newMessage.subject,
        message: newMessage.message,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        tenantId: tenantData.id,
        landlordId: tenantData.landlordId,
        // Participants array for queries
        participants: [currentUser.uid, tenantData.landlordId]
      };

      console.log('📤 Sending message:', messageData);
      await addDoc(collection(db, 'messages'), messageData);

      setShowMessageModal(false);
      setNewMessage({ to: 'Property Manager', subject: '', message: '' });
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleUploadDocument = async () => {
    if (!newDocument.file) {
      alert('Please select a file to upload');
      return;
    }

    if (!currentUser) {
      alert('You must be logged in to upload documents');
      return;
    }

    if (!tenantData?.id) {
      alert('Unable to upload: Tenant data not found');
      return;
    }

    setUploadingDocument(true);
    console.log('Starting document upload for tenant:', tenantData.id);
    console.log('Current user:', currentUser.uid);

    try {
      // Create a storage reference
      const fileRef = ref(storage, `documents/${tenantData.id}/${Date.now()}_${newDocument.file.name}`);
      console.log('Uploading to storage path:', fileRef.fullPath);

      // Upload the file
      await uploadBytes(fileRef, newDocument.file);
      console.log('File uploaded to storage successfully');

      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);
      console.log('Got download URL:', downloadURL);

      // Add document to Firestore
      const documentData = {
        name: newDocument.name || newDocument.file.name,
        type: newDocument.file.type.includes('pdf') ? 'PDF' : newDocument.file.type.toUpperCase(),
        date: new Date().toISOString().split('T')[0],
        size: `${(newDocument.file.size / 1024 / 1024).toFixed(2)} MB`,
        url: downloadURL,
        tenantId: tenantData.id,
        uploadedAt: serverTimestamp(),
        uploadedBy: currentUser.uid
      };

      console.log('Adding document to Firestore:', documentData);
      await addDoc(collection(db, 'documents'), documentData);
      console.log('Document added to Firestore successfully');

      setShowDocumentUploadModal(false);
      setNewDocument({ name: '', file: null });
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error);
      alert(`Failed to upload document: ${error.message}`);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = (doc) => {
    if (doc.url) {
      // If document has a URL (uploaded documents), download from Firebase Storage
      window.open(doc.url, '_blank');
    } else {
      // For demo documents without URLs, show an alert
      alert(`Download functionality for "${doc.name}" - In production, this would download from Firebase Storage.`);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      return;
    }

    try {
      const { deleteDoc, doc: docRef } = await import('firebase/firestore');
      const { ref: storageRef, deleteObject } = await import('firebase/storage');

      // Delete from Firestore
      await deleteDoc(docRef(db, 'documents', doc.id));

      // If document has a storage URL, delete from storage
      if (doc.url) {
        try {
          const fileRef = storageRef(storage, doc.url);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.error('Error deleting file from storage:', storageError);
        }
      }

      alert('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Failed to delete document: ${error.message}`);
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

  const handleDeleteMaintenanceRequest = async (request) => {
    if (!window.confirm(`Are you sure you want to delete this maintenance request for "${request.issue}"?`)) {
      return;
    }

    console.log('Attempting to delete maintenance request:', request.id);

    try {
      // Delete from maintenance collection (primary collection for tenant dashboard)
      console.log('Deleting from maintenance collection...');
      await deleteDoc(doc(db, 'maintenance', request.id));
      console.log('Successfully deleted from maintenance collection');

      // Also try to delete from maintenanceRequests collection (for compatibility)
      // This might not exist for older requests, so we catch errors silently
      try {
        console.log('Attempting to delete from maintenanceRequests collection...');
        await deleteDoc(doc(db, 'maintenanceRequests', request.id));
        console.log('Successfully deleted from maintenanceRequests collection');
      } catch (compatError) {
        console.log('Note: Request not found in maintenanceRequests collection (this is okay for older requests)', compatError);
      }

      console.log('Deletion complete');
      alert('Maintenance request deleted successfully!');
    } catch (error) {
      console.error('Error deleting maintenance request:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert(`Failed to delete maintenance request: ${error.message}`);
    }
  };

  // Helper function to get time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        navigate('/');
      } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
      }
    }
  };

  // Profile Settings Save Handler
  const handleSaveProfile = async () => {
    if (!tenantData?.id) {
      alert('Unable to save: Tenant data not found');
      return;
    }

    try {
      const tenantRef = doc(db, 'tenants', tenantData.id);
      await updateDoc(tenantRef, {
        name: profileSettings.name,
        email: profileSettings.email,
        phone: profileSettings.phone,
        idNumber: profileSettings.idNumber,
        emergencyContact: profileSettings.emergencyContact,
        updatedAt: serverTimestamp()
      });

      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  // Password Change Handler
  const handlePasswordChange = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      alert('Please fill in all password fields');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordData.new.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.current
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwordData.new);

      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        alert('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        alert('New password is too weak');
      } else {
        alert(`Failed to change password: ${error.message}`);
      }
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    if (!tenantData?.id) {
      alert('Unable to upload: Tenant data not found');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Upload to Firebase Storage using authenticated user's UID
      const fileRef = ref(storage, `profilePhotos/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      // Update tenant profile with photo URL
      const tenantRef = doc(db, 'tenants', tenantData.id);
      await updateDoc(tenantRef, {
        photoURL: downloadURL,
        updatedAt: serverTimestamp()
      });

      setProfileSettings({ ...profileSettings, photoURL: downloadURL });
      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(`Failed to upload photo: ${error.message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Data Export Handler
  const handleDataExport = async () => {
    if (!tenantData?.id) {
      alert('Unable to export: Tenant data not found');
      return;
    }

    try {
      // Gather all user data
      const exportData = {
        profile: profileSettings,
        tenantData: tenantData,
        preferences: preferences,
        exportDate: new Date().toISOString()
      };

      // Convert to JSON and create download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `tenant-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert(`Failed to export data: ${error.message}`);
    }
  };

  // Account Deactivation Handler
  const handleDeactivateAccount = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account? You can reactivate it by logging in again.')) {
      return;
    }

    if (!tenantData?.id) {
      alert('Unable to deactivate: Tenant data not found');
      return;
    }

    try {
      const tenantRef = doc(db, 'tenants', tenantData.id);
      await updateDoc(tenantRef, {
        accountStatus: 'deactivated',
        deactivatedAt: serverTimestamp()
      });

      alert('Account deactivated successfully. You will be logged out.');
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error deactivating account:', error);
      alert(`Failed to deactivate account: ${error.message}`);
    }
  };

  // Account Deletion Handler
  // PROFILE PHOTO UPLOAD
  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingProfilePhoto(true);

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profilePhotos/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update user profile in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        photoURL: photoURL,
        updatedAt: new Date().toISOString()
      });

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        photoURL: photoURL
      });

      // Reload the current user to get updated photoURL
      await currentUser.reload();

      alert('Profile photo updated successfully!');
      window.location.reload(); // Refresh to show new photo
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      alert('Failed to upload profile photo. Please try again.');
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Are you sure you want to permanently delete your account? This action cannot be undone.\n\nType "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') {
      if (confirmation !== null) {
        alert('Account deletion cancelled. You must type "DELETE" to confirm.');
      }
      return;
    }

    if (!tenantData?.id) {
      alert('Unable to delete: Tenant data not found');
      return;
    }

    try {
      // Delete tenant document from Firestore
      const tenantRef = doc(db, 'tenants', tenantData.id);
      await deleteDoc(tenantRef);

      // Delete user's documents
      // Note: In production, you might want to use a Cloud Function to handle cascading deletes

      // Delete Firebase Auth user
      await deleteUser(currentUser);

      alert('Account deleted successfully.');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('For security, please log out and log back in before deleting your account.');
      } else {
        alert(`Failed to delete account: ${error.message}`);
      }
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      if (!id || typeof id !== 'string') {
        console.error('Invalid notification ID:', id);
        return;
      }

      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, {
        read: true
      });
      console.log('✅ Marked notification as read:', id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      console.error('Notification ID:', id);
    }
  };

  const handleNotificationClick = async (notification) => {
    console.log('🔔 Notification clicked:', notification);

    // Mark as read
    if (notification?.id) {
      await markNotificationAsRead(notification.id);
    } else {
      console.warn('⚠️ Notification missing ID:', notification);
    }

    // Close notifications dropdown
    setShowNotifications(false);

    // Handle different notification types
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
            propertyName: tenantData?.propertyName || '',
            unit: tenantData?.unit || ''
          });
        }
      }, 100);
    } else if (notification.type === 'payment') {
      // Navigate to payments view
      setCurrentView('payments');
    } else if (notification.type === 'maintenance') {
      // Navigate to maintenance view
      setCurrentView('maintenance');
    } else if (notification.type === 'document') {
      // Navigate to documents view
      setCurrentView('documents');
    }
    // Add more notification types as needed
  };

  const filteredListings = availableListings.filter(listing =>
    (listing.property && listing.property.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (listing.unit && listing.unit.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (listing.description && listing.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex overflow-hidden transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#003366] text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="p-6">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo-light.svg" alt="Nyumbanii Logo" className="h-10 w-auto" />
            </div>
            {sidebarOpen && <span className="text-xl font-bold">Nyumbanii</span>}
          </a>
        </div>
        
        <nav className="p-4 space-y-2">
          {[
            { name: 'Dashboard', icon: Home, view: 'dashboard' },
            { name: 'Payments', icon: DollarSign, view: 'payments' },
            { name: 'Maintenance', icon: Wrench, view: 'maintenance' },
            { name: 'Documents', icon: FileText, view: 'documents' },
            { name: 'Messages', icon: MessageSquare, view: 'messages' },
            { name: 'Updates & Memos', icon: Megaphone, view: 'updates' },
            { name: 'Available Listings', icon: Search, view: 'listings' },
            { name: 'Settings', icon: Settings, view: 'settings' }
          ].map((item) => (
            <button
              key={item.view}
              onClick={() => { setCurrentView(item.view); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                currentView === item.view ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-white/10 space-y-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setPreferences({...preferences, darkMode: !preferences.darkMode})}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition"
          >
            {preferences.darkMode ? (
              <>
                <Sun className="w-5 h-5" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 w-full max-w-full overflow-x-hidden">
        {/* Top Navigation */}
        <header className={`bg-gray-50 dark:bg-gray-900 sticky top-0 z-40 transition-all duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-700 dark:text-gray-300">
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </h2>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600 dark:text-gray-300" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    {/* Mobile backdrop */}
                    <div
                      className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                      onClick={() => setShowNotifications(false)}
                    />

                    {/* Notification panel */}
                    <div className="fixed lg:absolute top-16 lg:top-auto right-0 lg:right-0 left-0 lg:left-auto lg:mt-2 w-full lg:w-80 bg-white dark:bg-gray-800 lg:rounded-lg shadow-lg border-t lg:border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-4rem)] lg:max-h-96 overflow-y-auto z-50">
                      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Notifications</h3>
                          <div className="flex items-center gap-2">
                            {notifications.filter(n => !n.read).length > 0 && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  // Mark all notifications as read
                                  const unreadNotifications = notifications.filter(n => !n.read);
                                  for (const notification of unreadNotifications) {
                                    await markNotificationAsRead(notification.id);
                                  }
                                }}
                                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                              >
                                Mark all read
                              </button>
                            )}
                            <button
                              onClick={() => setShowNotifications(false)}
                              className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => {
                            const timestamp = notification.timestamp?.toDate?.();
                            const timeAgo = timestamp ? getTimeAgo(timestamp) : '';

                            return (
                              <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    {notification.title && (
                                      <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white mb-1 truncate">{notification.title}</p>
                                    )}
                                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{notification.message}</p>
                                    {notification.senderName && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From: {notification.senderName}</p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo}</p>
                                  </div>
                                  {!notification.read && (
                                    <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0 mt-1"></span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 pl-2 lg:pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{profileSettings.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tenant</p>
                </div>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold text-sm lg:text-base flex-shrink-0">
                  {profileSettings.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="w-full max-w-full py-4 lg:py-6 overflow-x-hidden">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="space-y-6 w-full max-w-full px-4 lg:px-6">
              {/* No Tenant Data Warning */}
              {!tenantData && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                  <div className="flex flex-col items-center text-center gap-4 lg:flex-row lg:items-start lg:text-left">
                    <Bell className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tenant Profile Not Found</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        We couldn't find your tenant profile. This usually happens if:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-4">
                        <li>You haven't been added to a property by your landlord yet</li>
                        <li>You registered with a different email than the one your landlord used</li>
                        <li>Your landlord invitation is still pending</li>
                      </ul>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>What to do:</strong> Contact your landlord and ask them to send you an invitation link.
                        Make sure to register using the exact email address they have on file.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Portal Access Denied Message */}
              {!canAccessPortal() && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
                  <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Portal Access Disabled
                  </h3>
                  <p className="text-red-700 dark:text-red-400">
                    Your landlord has temporarily disabled tenant portal access. Please contact your landlord for assistance or to regain access to your tenant portal.
                  </p>
                </div>
              )}

              {/* Personalized Welcome Card */}
              {tenantData && canAccessPortal() && (
                <div className="bg-gradient-to-br from-[#003366] to-[#002244] rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Property Image */}
                      <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=500&h=500&fit=crop"
                          alt="Beautiful Home"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Tenant Info */}
                      <div className="flex-1 text-white">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome Home, {profileSettings.name?.split(' ')[0] || 'Tenant'}!</h2>
                        <p className="text-blue-100 mb-4">We're glad to have you back</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <Home className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-blue-200">Property</p>
                              <p className="font-semibold">{tenantData.property || tenantData.propertyName || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-blue-200">Unit Number</p>
                              <p className="font-semibold">{tenantData.unit || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Blue Banner */}
              {tenantData && canAccessPortal() && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Quick Overview</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Here's what's happening with your tenancy</p>
                  </div>
                </div>
              )}

              {/* Stats Cards - 2 columns matching landlord dashboard */}
              {canAccessPortal() && (
              <>
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                <div
                  onClick={() => setCurrentView('payments')}
                  className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transform"
                >
                  {/* Icon at the top */}
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 rounded-lg flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 lg:w-7 lg:h-7" />
                  </div>

                  {/* Label */}
                  <p className="text-gray-600 dark:text-gray-400 text-xs lg:text-sm mb-2">Next Payment Due</p>

                  {/* Value */}
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {tenantData?.rentDueDate ? new Date(tenantData.rentDueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Not set'}
                  </p>

                  {/* Subtitle */}
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                    KES {tenantData?.rent ? tenantData.rent.toLocaleString() : '0'}
                  </p>
                </div>

                <div
                  onClick={() => setCurrentView('documents')}
                  className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transform"
                >
                  {/* Icon at the top */}
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 lg:w-7 lg:h-7" />
                  </div>

                  {/* Label */}
                  <p className="text-gray-600 dark:text-gray-400 text-xs lg:text-sm mb-2">Lease Expires</p>

                  {/* Value */}
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {tenantData?.leaseEnd ? new Date(tenantData.leaseEnd).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Not set'}
                  </p>

                  {/* Subtitle */}
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                    {tenantData?.leaseEnd ? (() => {
                      const today = new Date();
                      const leaseEndDate = new Date(tenantData.leaseEnd);
                      const diffTime = Math.abs(leaseEndDate - today);
                      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
                      return `${diffMonths} months left`;
                    })() : 'N/A'}
                  </p>
                </div>

                <div
                  onClick={() => setCurrentView('maintenance')}
                  className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transform"
                >
                  {/* Icon at the top */}
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-300 rounded-lg flex items-center justify-center mb-3">
                    <Wrench className="w-6 h-6 lg:w-7 lg:h-7" />
                  </div>

                  {/* Label */}
                  <p className="text-gray-600 dark:text-gray-400 text-xs lg:text-sm mb-2">Maintenance</p>

                  {/* Value */}
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">2 Open</p>

                  {/* Subtitle */}
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">1 in progress</p>
                </div>

                <div
                  onClick={() => setCurrentView('messages')}
                  className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transform"
                >
                  {/* Icon at the top */}
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-300 rounded-lg flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 lg:w-7 lg:h-7" />
                  </div>

                  {/* Label */}
                  <p className="text-gray-600 dark:text-gray-400 text-xs lg:text-sm mb-2">Messages</p>

                  {/* Value */}
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {unreadMessagesCount}
                  </p>

                  {/* Subtitle */}
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                    {unreadMessagesCount === 1 ? 'Unread message' : 'Unread messages'}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4 text-sm lg:text-base">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2 lg:gap-3">
                  {canUseSelfService() ? (
                    <button
                      onClick={() => setShowMaintenanceModal(true)}
                      className="p-3 lg:p-4 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg transition text-center"
                    >
                      <Wrench className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600 dark:text-orange-400 mx-auto mb-1 lg:mb-2" />
                      <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-gray-100 block">Add Maintenance Request</span>
                    </button>
                  ) : (
                    <div className="p-3 lg:p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center opacity-50 cursor-not-allowed">
                      <Wrench className="w-5 h-5 lg:w-6 lg:h-6 text-gray-500 dark:text-gray-400 mx-auto mb-1 lg:mb-2" />
                      <span className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 block">Disabled by Landlord</span>
                    </div>
                  )}

                  <button
                    onClick={() => setCurrentView('documents')}
                    className="p-3 lg:p-4 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition text-center"
                  >
                    <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400 mx-auto mb-1 lg:mb-2" />
                    <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-gray-100 block">View Documents</span>
                  </button>

                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="p-3 lg:p-4 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition text-center"
                  >
                    <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1 lg:mb-2" />
                    <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-gray-100 block">Pay Rent</span>
                  </button>

                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="p-3 lg:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-center"
                  >
                    <MessageSquare className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 mx-auto mb-1 lg:mb-2" />
                    <span className="text-xs lg:text-sm font-medium text-gray-900 block">Message Landlord</span>
                  </button>

                  {propertyData?.whatsappGroupLink && (
                    <a
                      href={propertyData.whatsappGroupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 lg:p-4 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition text-center block"
                    >
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400 mx-auto mb-1 lg:mb-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-gray-100 block">Join WhatsApp Group</span>
                    </a>
                  )}
                </div>
              </div>

              {/* KPLC Power Outages Section - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <PowerOutagesList userAreas={profileSettings.preferredAreas || []} />
                <LocationPreferences userId={currentUser?.uid} />
              </div>

              {/* Updates & Notifications Section */}
              {updates.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-[#003366] dark:text-blue-400" />
                      Important Updates
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Recent announcements and alerts</p>
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {updates.slice(0, 3).map((update) => {
                        const isPowerInterruption = update.category === 'power_interruption';
                        const isSystemAlert = update.category === 'system_alert';

                        return (
                          <div
                            key={update.id}
                            className={`border rounded-lg p-4 hover:shadow-md transition ${
                              isPowerInterruption
                                ? 'border-yellow-400 dark:border-yellow-600 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
                                : isSystemAlert
                                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {isPowerInterruption && (
                                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center">
                                  <Bell className="w-4 h-4 text-white" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className={`font-semibold text-sm ${
                                    isPowerInterruption ? 'text-yellow-900 dark:text-yellow-100' : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {update.title}
                                  </h4>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {update.date}
                                  </span>
                                </div>
                                <p className={`text-sm line-clamp-2 ${
                                  isPowerInterruption ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {update.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {updates.length > 3 && (
                      <button
                        onClick={() => setCurrentView('updates')}
                        className="mt-4 w-full py-2 text-sm text-[#003366] dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition font-medium"
                      >
                        View All Updates ({updates.length})
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-base lg:text-lg text-gray-900 dark:text-white mb-4">Recent Payments</h4>
                  <div className="space-y-3">
                    {payments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white">{payment.month}</p>
                          <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{payment.date || `Due: ${payment.dueDate}`}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white">KES {payment.amount.toLocaleString()}</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            payment.status === 'Paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-base lg:text-lg text-gray-900 dark:text-white mb-4">Maintenance Requests</h4>
                  <div className="space-y-3">
                    {maintenanceRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm lg:text-base text-gray-900 dark:text-white">{request.issue}</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs flex-shrink-0 ml-2 ${
                            request.status === 'Resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                            request.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{request.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </>
              )}
            </div>
          )}

          {/* Payments View */}
          {currentView === 'payments' && (
            <div className="space-y-6 w-full max-w-full px-4 lg:px-6">
              {!canUseSelfService() ? (
                // Access restricted message
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Access Restricted</h3>
                  <p className="text-yellow-700 dark:text-yellow-400">
                    Your landlord has restricted access to payment history. Please contact your landlord to view payment information.
                  </p>
                </div>
              ) : (
                <>
                  {/* Blue Banner */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Payment History</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Track your rent payments and receipts</p>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Record Payment
                    </button>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm font-medium text-gray-900 dark:text-white">{payment.month}</td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900 dark:text-white">KES {payment.amount.toLocaleString()}</td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 dark:text-gray-400">{payment.paidDate || payment.date || (payment.dueDate ? `Due: ${payment.dueDate}` : '-')}</td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 dark:text-gray-400">{payment.method || '-'}</td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === 'paid' || payment.status === 'verified' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                              payment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                              payment.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                              'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                            }`}>
                              {payment.status === 'paid' ? 'Paid' : payment.status === 'verified' ? 'Verified' : payment.status === 'pending' ? 'Pending' : payment.status === 'overdue' ? 'Overdue' : payment.status}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {(payment.status === 'paid' || payment.status === 'verified') && (
                                <button
                                  onClick={() => handleDownloadReceipt(payment.id)}
                                  className="text-[#003366] dark:text-blue-400 hover:text-[#002244] dark:hover:text-blue-300 flex items-center gap-1 text-xs lg:text-sm"
                                >
                                  <Download className="w-4 h-4" />
                                  Receipt
                                </button>
                              )}
                              {payment.status === 'pending' && (
                                <button
                                  onClick={() => handleDeletePayment(payment.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1 text-xs lg:text-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* Maintenance View */}
          {currentView === 'maintenance' && (
            <div className="space-y-6 w-full max-w-full px-4 lg:px-6">
              {/* Access denied message if self-service is disabled */}
              {!canUseSelfService() && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Access Restricted</h3>
                  <p className="text-yellow-700 dark:text-yellow-400">
                    Your landlord has restricted the ability to submit maintenance requests through the portal. Please contact your landlord directly to report maintenance issues.
                  </p>
                </div>
              )}

              {/* Blue Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Maintenance Requests</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Report and track maintenance issues</p>
                </div>
                {canUseSelfService() ? (
                  <button
                    onClick={() => setShowMaintenanceModal(true)}
                    className="px-6 py-3 bg-[#003366] dark:bg-blue-600 text-white rounded-lg hover:bg-[#002244] dark:hover:bg-blue-700 transition font-semibold whitespace-nowrap flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    New Request
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed font-semibold whitespace-nowrap flex items-center gap-2 opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                    New Request
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {maintenanceRequests.map((request) => (
                  <div key={request.id} className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-semibold text-base lg:text-lg text-gray-900 dark:text-white">{request.issue}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.priority === 'High' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                            request.priority === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          }`}>
                            {request.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.status === 'Resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                            request.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{request.description}</p>
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Reported on {request.date}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMaintenanceRequest(request)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex-shrink-0"
                        title="Delete maintenance request"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* Documents View */}
          {currentView === 'documents' && (
            <div className="space-y-6 w-full max-w-full px-4 lg:px-6">
              {/* Header */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Documents</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Access your uploaded documents, lease agreements, and move-out notices</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                  onClick={() => setDocumentsTab('uploaded')}
                  className={`px-3 sm:px-6 py-3 font-semibold transition whitespace-nowrap text-sm sm:text-base ${
                    documentsTab === 'uploaded'
                      ? 'border-b-2 border-[#003366] text-[#003366] dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Uploaded</span> Documents
                  </div>
                </button>
                <button
                  onClick={() => setDocumentsTab('leases')}
                  className={`px-3 sm:px-6 py-3 font-semibold transition whitespace-nowrap text-sm sm:text-base ${
                    documentsTab === 'leases'
                      ? 'border-b-2 border-[#003366] text-[#003366] dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <FileSignature className="w-3 h-3 sm:w-4 sm:h-4" />
                    Lease<span className="hidden xs:inline"> Agreements</span>
                  </div>
                </button>
                <button
                  onClick={() => setDocumentsTab('move-out')}
                  className={`px-3 sm:px-6 py-3 font-semibold transition whitespace-nowrap text-sm sm:text-base ${
                    documentsTab === 'move-out'
                      ? 'border-b-2 border-[#003366] text-[#003366] dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <DoorOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    Move-Out<span className="hidden xs:inline"> Notices</span>
                  </div>
                </button>
              </div>

              {/* Uploaded Documents Tab */}
              {documentsTab === 'uploaded' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowDocumentUploadModal(true)}
                      className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Document
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Documents Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Upload your first document to get started</p>
                      <button
                        onClick={() => setShowDocumentUploadModal(true)}
                        className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold inline-flex items-center gap-2"
                      >
                        <Upload className="w-5 h-5" />
                        Upload Document
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      {documents.map((doc) => (
                        <div key={doc.id} className="bg-white dark:bg-gray-800 p-6 lg:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition flex items-center gap-4 lg:gap-6 min-h-[120px] lg:min-h-[140px]">
                          <FileText className="w-12 h-12 lg:w-14 lg:h-14 text-[#003366] dark:text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className="font-semibold text-base lg:text-lg text-gray-900 dark:text-white truncate">{doc.name}</h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{doc.type}</span>
                                <button
                                  onClick={() => handleDeleteDocument(doc)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                  title="Delete document"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{doc.date}</span>
                              <span>{doc.size}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#003366] dark:border-blue-400 text-[#003366] dark:text-blue-400 rounded-lg hover:bg-[#003366] dark:hover:bg-blue-400 hover:text-white dark:hover:text-white transition text-sm font-medium flex-shrink-0"
                          >
                            <Eye className="w-4 h-4" />
                            View Document
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Lease Agreements Tab - Content moved here from separate view */}
              {documentsTab === 'leases' && (
                <div className="space-y-4">
                  {/* Loading State */}
                  {loadingLeases && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto"></div>
                      <p className="text-gray-600 dark:text-gray-400 mt-4">Loading lease agreements...</p>
                    </div>
                  )}

                  {/* No Leases State */}
                  {!loadingLeases && leases.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                      <FileSignature className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Lease Agreement Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Your landlord hasn't created a lease agreement for you yet. <br />
                        Contact your landlord if you need a lease agreement.
                      </p>
                    </div>
                  )}

                  {/* Leases List - Full implementation from leases view will go here */}
                  {!loadingLeases && leases.length > 0 && leases.map((lease) => (
                    <div key={lease.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* This is a placeholder - the full lease rendering code will be moved here */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{lease.propertyName} - Unit {lease.unit}</h3>
                        <p className="text-gray-600 dark:text-gray-400">View full lease details in the Lease Agreement section</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Move-Out Notices Tab - Content moved here from separate view */}
              {documentsTab === 'move-out' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-3 flex-1 mr-4">
                      <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">Legal Requirements</h4>
                        <p className="text-xs text-blue-800 dark:text-blue-400">
                          Under Kenyan law, you must provide written notice: 30 days for standard/uncontrolled tenancies, or 60 days (2 months) for controlled areas.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMoveOutModal(true)}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold whitespace-nowrap flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Submit Notice
                    </button>
                  </div>

                  {moveOutNotices.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <DoorOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Move-Out Notices</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't submitted any move-out notices yet</p>
                      <button
                        onClick={() => setShowMoveOutModal(true)}
                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold inline-flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Submit Move-Out Notice
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {moveOutNotices.map((notice) => (
                        <div key={notice.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                notice.status === 'submitted' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                notice.status === 'acknowledged' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                notice.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' :
                                'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                <DoorOpen className={`w-6 h-6 ${
                                  notice.status === 'submitted' ? 'text-yellow-600 dark:text-yellow-400' :
                                  notice.status === 'acknowledged' ? 'text-blue-600 dark:text-blue-400' :
                                  notice.status === 'approved' ? 'text-green-600 dark:text-green-400' :
                                  'text-red-600 dark:text-red-400'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                                  Move-Out Notice
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Reference: {notice.referenceNumber}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              notice.status === 'submitted' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                              notice.status === 'acknowledged' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                              notice.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                              {notice.status === 'submitted' ? 'Pending' :
                               notice.status === 'acknowledged' ? 'Acknowledged' :
                               notice.status === 'approved' ? 'Approved' :
                               notice.status}
                            </span>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Property</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{notice.propertyName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Unit</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{notice.unit}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Move-Out Date</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notice.intendedMoveOutDate?.toDate ?
                                  notice.intendedMoveOutDate.toDate().toLocaleDateString() :
                                  new Date(notice.intendedMoveOutDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notice Submitted</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notice.noticeSubmittedDate?.toDate ?
                                  notice.noticeSubmittedDate.toDate().toLocaleDateString() :
                                  new Date(notice.noticeSubmittedDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{notice.reason}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notice Period</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{notice.noticePeriod} days</p>
                            </div>
                          </div>

                          {/* Additional Notes */}
                          {notice.additionalNotes && (
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Additional Notes</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{notice.additionalNotes}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {notice.legalNoticeURL && (
                              <a
                                href={notice.legalNoticeURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 border border-orange-600 dark:border-orange-400 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition text-sm font-medium"
                              >
                                <Download className="w-4 h-4" />
                                Download Legal Notice
                              </a>
                            )}
                            {notice.status === 'submitted' && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>Awaiting landlord acknowledgment</span>
                              </div>
                            )}
                            {notice.status === 'acknowledged' && (
                              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                <CheckCircle className="w-4 h-4" />
                                <span>Acknowledged by landlord on {notice.acknowledgedAt?.toDate ?
                                  notice.acknowledgedAt.toDate().toLocaleDateString() :
                                  new Date(notice.acknowledgedAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Move-Out Notice View */}
          {currentView === 'move-out' && (
            <div className="space-y-6 w-full max-w-full px-4 lg:px-6">
              {/* Blue Banner */}
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <DoorOpen className="w-5 h-5 text-orange-600" />
                    Move-Out Notices
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Submit and track your move-out notices (30-day legal requirement)</p>
                </div>
                <button
                  onClick={() => setShowMoveOutModal(true)}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold whitespace-nowrap flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Submit Notice
                </button>
              </div>

              {/* Legal Notice Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">Legal Requirements</h4>
                  <p className="text-xs text-blue-800 dark:text-blue-400">
                    Under Kenyan law, you must provide written notice: 30 days for rent under KES 2,500/month, or 60 days (2 months) for standard tenancies. This notice is legally binding once submitted.
                  </p>
                </div>
              </div>

              {moveOutNotices.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <DoorOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Move-Out Notices</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't submitted any move-out notices yet</p>
                  <button
                    onClick={() => setShowMoveOutModal(true)}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Submit Move-Out Notice
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {moveOutNotices.map((notice) => (
                    <div key={notice.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notice.status === 'submitted' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            notice.status === 'acknowledged' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            notice.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' :
                            'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            <DoorOpen className={`w-6 h-6 ${
                              notice.status === 'submitted' ? 'text-yellow-600 dark:text-yellow-400' :
                              notice.status === 'acknowledged' ? 'text-blue-600 dark:text-blue-400' :
                              notice.status === 'approved' ? 'text-green-600 dark:text-green-400' :
                              'text-red-600 dark:text-red-400'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                              Move-Out Notice
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Reference: {notice.referenceNumber}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          notice.status === 'submitted' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          notice.status === 'acknowledged' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                          notice.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {notice.status === 'submitted' ? 'Pending' :
                           notice.status === 'acknowledged' ? 'Acknowledged' :
                           notice.status === 'approved' ? 'Approved' :
                           notice.status}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Property</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notice.propertyName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Unit</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notice.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Move-Out Date</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notice.intendedMoveOutDate?.toDate ?
                              notice.intendedMoveOutDate.toDate().toLocaleDateString() :
                              new Date(notice.intendedMoveOutDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notice Submitted</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notice.noticeSubmittedDate?.toDate ?
                              notice.noticeSubmittedDate.toDate().toLocaleDateString() :
                              new Date(notice.noticeSubmittedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notice.reason}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notice Period</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notice.noticePeriod} days</p>
                        </div>
                      </div>

                      {/* Additional Notes */}
                      {notice.additionalNotes && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Additional Notes</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{notice.additionalNotes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {notice.legalNoticeURL && (
                          <a
                            href={notice.legalNoticeURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 border border-orange-600 dark:border-orange-400 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            Download Legal Notice
                          </a>
                        )}
                        {notice.status === 'submitted' && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>Awaiting landlord acknowledgment</span>
                          </div>
                        )}
                        {notice.status === 'acknowledged' && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <CheckCircle className="w-4 h-4" />
                            <span>Acknowledged by landlord on {notice.acknowledgedAt?.toDate ?
                              notice.acknowledgedAt.toDate().toLocaleDateString() :
                              new Date(notice.acknowledgedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages View */}
          {currentView === 'messages' && (
            <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
              {/* Encrypted Banner */}
              <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-center gap-2 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium">Your messages are end-to-end encrypted</span>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Conversations List */}
                <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} lg:w-1/3 w-full flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
                  {/* Search and Filter Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
                      <button
                        onClick={() => setShowNewMessageModal(true)}
                        className="px-4 py-2 bg-[#003366] dark:bg-[#004080] text-white rounded-lg hover:bg-[#002244] dark:hover:bg-[#003366] transition flex items-center gap-2 text-sm font-medium"
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#003366] dark:focus:ring-[#004080] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {[
                        { value: 'all', label: 'All' },
                        { value: 'landlord', label: 'Landlord' },
                        { value: 'property_manager', label: 'Managers' },
                        { value: 'maintenance', label: 'Maintenance' }
                      ].map(filter => (
                        <button
                          key={filter.value}
                          onClick={() => setConversationFilter(filter.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                            conversationFilter === filter.value
                              ? 'bg-[#003366] dark:bg-[#004080] text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                        // Filter by role
                        if (conversationFilter !== 'all' && conv.otherUserRole !== conversationFilter) {
                          return false;
                        }
                        // Filter by search query
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
                          className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                            selectedConversation?.conversationId === conversation.conversationId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-[#003366] dark:bg-[#004080] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {conversation.otherUserName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>

                            {/* Conversation Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {conversation.otherUserName}
                                </h3>
                                {conversation.lastMessageTime && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                                    {formatRelativeTime(conversation.lastMessageTime.toDate ? conversation.lastMessageTime.toDate() : new Date(conversation.lastMessageTime))}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  conversation.otherUserRole === 'landlord' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                                  conversation.otherUserRole === 'property_manager' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                  conversation.otherUserRole === 'maintenance' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                }`}>
                                  {conversation.otherUserRole === 'property_manager' ? 'Property Manager' :
                                   conversation.otherUserRole === 'maintenance' ? 'Maintenance' :
                                   conversation.otherUserRole === 'landlord' ? 'Landlord' : conversation.otherUserRole}
                                </span>
                                {conversation.propertyName && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {conversation.propertyName} {conversation.unit && `- ${conversation.unit}`}
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {conversation.lastMessage}
                              </p>
                            </div>

                            {/* Unread Indicator */}
                            {conversation.unread && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                        </div>
                      ))}

                    {conversations.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No conversations yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Start a conversation by sending a message to your landlord or property manager
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message View */}
                <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white dark:bg-gray-800`}>
                  {selectedConversation ? (
                    <>
                      {/* Conversation Header */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedConversation(null)}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </button>
                          <div className="w-10 h-10 bg-[#003366] dark:bg-[#004080] rounded-full flex items-center justify-center text-white font-semibold">
                            {selectedConversation.otherUserName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{selectedConversation.otherUserName}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {selectedConversation.propertyName && `${selectedConversation.propertyName}${selectedConversation.unit ? ` - Unit ${selectedConversation.unit}` : ''}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Messages Area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                        {conversationMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
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
                                            {formatMessageTime(message.timestamp)}
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
                            <div ref={conversationMessagesEndRef} />
                          </>
                        )}
                      </div>

                      {/* Input Area */}
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#003366] dark:focus:ring-[#004080] focus:border-transparent disabled:opacity-50"
                          />
                          <button
                            onClick={handleSendConversationMessage}
                            disabled={!newConversationMessage.trim() || sendingMessage}
                            className="px-4 py-2 bg-[#003366] dark:bg-[#004080] text-white rounded-lg hover:bg-[#002244] dark:hover:bg-[#003366] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                        <MessageSquare className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a conversation</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Choose a conversation from the list to view messages
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Available Listings View */}
          {currentView === 'listings' && (
            <div className="space-y-6 w-full max-w-full px-4 lg:px-6">
              {/* Button to Full Listings Page */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Looking for Properties in Other Areas?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Browse all available properties from different locations</p>
            </div>
            <button
           onClick={() => navigate('/listings')}
            className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
             >
            <Search className="w-5 h-5" />
            Browse All Properties
            </button>
            </div>
              <div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Properties</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or location..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {loadingListings ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                  <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Listings Available</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchTerm
                      ? "No listings match your search. Try different keywords."
                      : "Your landlord hasn't posted any available listings yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 pb-8">
                  {filteredListings.map((listing) => (
                  <div key={listing.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition group">
                    <div className="relative h-48 lg:h-56 overflow-hidden">
                      <img
                        src={listing.images?.[0] || '/images/placeholder.jpg'}
                        alt={listing.property}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-md border border-gray-200 dark:border-gray-600">
                        <span className="font-bold text-[#003366] dark:text-blue-400 text-sm lg:text-base">KES {listing.rent?.toLocaleString()}/mo</span>
                      </div>
                    </div>

                    <div className="p-4 lg:p-6">
                      <h4 className="font-bold text-base lg:text-lg text-gray-900 dark:text-white mb-2">{listing.property} - {listing.unit}</h4>
                      <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{listing.description}</p>

                      <div className="flex items-center gap-4 mb-4 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span className="text-xs lg:text-sm">{listing.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          <span className="text-xs lg:text-sm">{listing.bathrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Square className="w-4 h-4" />
                          <span className="text-xs lg:text-sm">{listing.area}m²</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {listing.amenities?.map((amenity, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                            {amenity}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedListing(listing);
                            setCurrentImageIndex(0);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedListing(listing);
                            setShowBookingModal(true);
                            setBookingData({
                              ...bookingData,
                              name: profileSettings.name,
                              email: profileSettings.email,
                              phone: profileSettings.phone
                            });
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#003366] dark:bg-blue-600 text-white rounded-lg hover:bg-[#002244] dark:hover:bg-blue-700 transition text-sm"
                        >
                          <Calendar className="w-4 h-4" />
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}

          {/* Updates & Memos View */}
          {currentView === 'updates' && (
            <div className="space-y-6 w-full max-w-full px-4 lg:px-6">
              {/* KPLC Power Outages Section - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <PowerOutagesList userAreas={profileSettings.preferredAreas || []} />
                <LocationPreferences userId={currentUser?.uid} />
              </div>

              {/* Updates Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-[#003366] dark:text-blue-400" />
                    Updates & Announcements
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Important updates including power interruptions</p>
                </div>

                <div className="p-4 sm:p-6">
                  {updates.length === 0 ? (
                    <div className="text-center py-12">
                      <Megaphone className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No updates available</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later for announcements</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {updates.map((update) => {
                        const isPowerInterruption = update.category === 'power_interruption';
                        const isSystemAlert = update.category === 'system_alert';

                        return (
                          <div
                            key={update.id}
                            className={`border rounded-lg p-4 hover:shadow-md transition cursor-pointer ${
                              isPowerInterruption
                                ? 'border-yellow-400 dark:border-yellow-600 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 shadow-sm'
                                : isSystemAlert
                                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                            }`}
                            onContextMenu={(e) => handleMemoUpdateContextMenu(e, update.id, 'update')}
                            onTouchStart={() => handleMemoUpdateLongPressStart(update.id, 'update')}
                            onTouchEnd={handleMemoUpdateLongPressEnd}
                            onMouseLeave={handleMemoUpdateLongPressEnd}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon Badge */}
                              {isPowerInterruption && (
                                <div className="flex-shrink-0 w-10 h-10 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center animate-pulse">
                                  <Bell className="w-5 h-5 text-white" />
                                </div>
                              )}

                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h3 className={`font-semibold text-lg ${
                                    isPowerInterruption ? 'text-yellow-900 dark:text-yellow-100' : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {update.title}
                                  </h3>

                                  {/* Category Badge */}
                                  <div className="flex gap-2 flex-wrap">
                                    {isPowerInterruption && (
                                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                                        ⚡ POWER
                                      </span>
                                    )}
                                    {update.type === 'automated' && (
                                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                                        Auto
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <p className={`text-sm mb-3 ${
                                  isPowerInterruption ? 'text-yellow-900 dark:text-yellow-100' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {update.content}
                                </p>

                                {/* Metadata */}
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {update.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}
                                  </span>

                                  {update.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {update.location}
                                    </span>
                                  )}

                                  {update.dateText && (
                                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                                      {update.dateText}
                                    </span>
                                  )}
                                </div>

                                {/* Source Link */}
                                {update.sourceUrl && (
                                  <a
                                    href={update.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    View on {update.source || 'source'} →
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Memos Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clipboard className="w-6 h-6 text-[#003366] dark:text-blue-400" />
                    Memos & Notices
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Important memos and notices from your landlord</p>
                </div>

                <div className="p-4 sm:p-6">
                  {memos.length === 0 ? (
                    <div className="text-center py-12">
                      <Clipboard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No memos available</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later for important notices</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {memos.map((memo) => (
                        <div
                          key={memo.id}
                          className={`border rounded-lg p-4 hover:shadow-md transition cursor-pointer ${
                            memo.priority === 'high'
                              ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                              : memo.priority === 'medium'
                              ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                          }`}
                          onContextMenu={(e) => handleMemoUpdateContextMenu(e, memo.id, 'memo')}
                          onTouchStart={() => handleMemoUpdateLongPressStart(memo.id, 'memo')}
                          onTouchEnd={handleMemoUpdateLongPressEnd}
                          onMouseLeave={handleMemoUpdateLongPressEnd}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{memo.title}</h3>
                                {memo.priority && (
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                      memo.priority === 'high'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                        : memo.priority === 'medium'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                                    }`}
                                  >
                                    {memo.priority}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{memo.content}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {memo.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}
                                </span>
                                {memo.expiryDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Expires: {new Date(memo.expiryDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Leases View */}
          {currentView === 'leases' && (
            <div className="space-y-6 w-full max-w-full px-4 lg:px-6">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lease Agreement</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">View and sign your lease agreement</p>
                  </div>
                  <FileSignature className="w-12 h-12 text-[#003366]" />
                </div>
              </div>

              {/* Loading State */}
              {loadingLeases && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading lease agreements...</p>
                </div>
              )}

              {/* No Leases State */}
              {!loadingLeases && leases.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                  <FileSignature className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Lease Agreement Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your landlord hasn't created a lease agreement for you yet. <br />
                    Contact your landlord if you need a lease agreement.
                  </p>
                </div>
              )}

              {/* Leases List */}
              {!loadingLeases && leases.length > 0 && (
                <div className="space-y-6">
                  {leases.map((lease) => (
                    <div
                      key={lease.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      {/* Lease Header */}
                      <div className="bg-gradient-to-r from-[#003366] to-[#004488] p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold">{lease.propertyName}</h3>
                            <p className="text-blue-100 mt-1">Unit: {lease.unit}</p>
                          </div>
                          <div className="text-right">
                            {lease.status === 'active' && (
                              <span className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                <CheckCircle className="w-4 h-4" />
                                Active
                              </span>
                            )}
                            {lease.status === 'pending_signature' && (
                              <span className="inline-flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                <Clock className="w-4 h-4" />
                                Pending Signature
                              </span>
                            )}
                            {lease.status === 'draft' && (
                              <span className="inline-flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                <FileText className="w-4 h-4" />
                                Draft
                              </span>
                            )}
                            {lease.status === 'expired' && (
                              <span className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                <AlertCircle className="w-4 h-4" />
                                Expired
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lease Details */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {/* Lease Period */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Lease Period</h4>
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                              <Calendar className="w-5 h-5 text-[#003366]" />
                              <span className="font-semibold">
                                {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Monthly Rent */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Monthly Rent</h4>
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                              <DollarSign className="w-5 h-5 text-[#003366]" />
                              <span className="text-2xl font-bold">KES {Number(lease.monthlyRent).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Security Deposit */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Security Deposit</h4>
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                              <DollarSign className="w-5 h-5 text-[#003366]" />
                              <span className="font-semibold">KES {Number(lease.securityDeposit).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Late Fee */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Late Fee Policy</h4>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {lease.lateFeePercentage}% after {lease.lateFeeDays} days
                            </p>
                          </div>
                        </div>

                        {/* Utilities Included */}
                        {lease.utilitiesIncluded && lease.utilitiesIncluded.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Utilities Included</h4>
                            <div className="flex flex-wrap gap-2">
                              {lease.utilitiesIncluded.map((utility, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  {utility}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Special Terms */}
                        {lease.specialTerms && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Special Terms</h4>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{lease.specialTerms}</p>
                            </div>
                          </div>
                        )}

                        {/* Signatures Section */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Signatures</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Landlord Signature */}
                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                              <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Landlord</h5>
                              <p className="font-semibold text-gray-900 dark:text-white mb-3">{lease.landlordName}</p>
                              {lease.landlordSignature ? (
                                <div>
                                  <img
                                    src={lease.landlordSignature}
                                    alt="Landlord Signature"
                                    className="h-20 border border-gray-200 dark:border-gray-600 rounded bg-white p-2"
                                  />
                                  {lease.landlordSignedAt && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                      Signed: {new Date(lease.landlordSignedAt.seconds * 1000).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center">
                                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting landlord signature</p>
                                </div>
                              )}
                            </div>

                            {/* Tenant Signature */}
                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                              <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tenant</h5>
                              <p className="font-semibold text-gray-900 dark:text-white mb-3">{lease.tenantName}</p>
                              {lease.tenantSignature ? (
                                <div>
                                  <img
                                    src={lease.tenantSignature}
                                    alt="Tenant Signature"
                                    className="h-20 border border-gray-200 dark:border-gray-600 rounded bg-white p-2"
                                  />
                                  {lease.tenantSignedAt && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                      Signed: {new Date(lease.tenantSignedAt.seconds * 1000).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-4 text-center">
                                  <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                                  <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-2">
                                    Signature Required
                                  </p>
                                  <button
                                    onClick={() => handleSignLease(lease)}
                                    className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                  >
                                    <FileSignature className="w-4 h-4" />
                                    Sign Lease
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6 flex gap-3">
                          <button
                            onClick={() => handleDownloadLeasePDF(lease)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-medium transition"
                          >
                            <Download className="w-5 h-5" />
                            Download PDF
                          </button>
                          {!lease.tenantSignature && (
                            <button
                              onClick={() => handleSignLease(lease)}
                              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                            >
                              <FileSignature className="w-5 h-5" />
                              Sign Lease
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings View */}

{currentView === 'settings' && (
  <div className="space-y-6 w-full max-w-full px-4 lg:px-6">
        {/* Blue Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Account Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your profile, security, and preferences</p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-6 py-3 bg-[#003366] dark:bg-blue-600 text-white rounded-lg hover:bg-[#002244] dark:hover:bg-blue-700 transition font-semibold whitespace-nowrap flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Change Password
          </button>
        </div>
        {/* Profile Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto w-full">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
            <button
              onClick={() => {
                if (editingProfile) {
                  handleSaveProfile();
                } else {
                  setEditingProfile(true);
                }
              }}
              className="px-4 py-2 sm:px-6 sm:py-2.5 bg-[#003366] dark:bg-blue-600 text-white rounded-lg hover:bg-[#002244] dark:hover:bg-blue-700 transition font-medium text-sm sm:text-base"
            >
              {editingProfile ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Profile Photo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
              <div className="relative">
                {profileSettings.photoURL ? (
                  <img
                    src={profileSettings.photoURL}
                    alt="Profile"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#003366] dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                    {profileSettings.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                )}
                {editingProfile && (
                  <label htmlFor="photo-upload" className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-[#003366] dark:bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-[#002244] dark:hover:bg-blue-700 transition cursor-pointer">
                    <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{profileSettings.name}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{profileSettings.email}</p>
                {editingProfile && (
                  <label htmlFor="photo-upload-text" className="text-[#003366] dark:text-blue-400 text-sm mt-1 hover:underline font-medium flex items-center gap-1 cursor-pointer">
                    <Camera className="w-4 h-4" />
                    Change Photo
                    <input
                      id="photo-upload-text"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileSettings.name}
                  onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={profileSettings.email}
                  onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profileSettings.phone}
                  onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Number</label>
                <input
                  type="text"
                  value={profileSettings.idNumber}
                  onChange={(e) => setProfileSettings({...profileSettings, idNumber: e.target.value})}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact</label>
                <input
                  type="tel"
                  value={profileSettings.emergencyContact}
                  onChange={(e) => setProfileSettings({...profileSettings, emergencyContact: e.target.value})}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto w-full">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Password */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last changed 3 months ago</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition font-medium whitespace-nowrap text-sm sm:text-base"
              >
                Change Password
              </button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {twoFactorEnabled ? 'Two-factor authentication is active' : 'Add an extra layer of security to your account'}
                </p>
              </div>
              <button
                onClick={() => twoFactorEnabled ? setTwoFactorEnabled(false) : setShow2FAModal(true)}
                className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg transition font-medium text-sm sm:text-base ${
                  twoFactorEnabled
                    ? 'border border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'bg-[#003366] dark:bg-blue-600 text-white hover:bg-[#002244] dark:hover:bg-blue-700'
                }`}
              >
                {twoFactorEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto w-full">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Email Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Receive updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileSettings.notifications.email}
                  onChange={(e) => setProfileSettings({
                    ...profileSettings,
                    notifications: {...profileSettings.notifications, email: e.target.checked}
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Push Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Receive browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileSettings.notifications.push}
                  onChange={(e) => setProfileSettings({
                    ...profileSettings,
                    notifications: {...profileSettings.notifications, push: e.target.checked}
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Alert Types Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto w-full">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Alert Types</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Rent Reminders</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get notified about upcoming rent payments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profileSettings.notifications.rentReminders}
                  onChange={(e) => setProfileSettings({
                    ...profileSettings,
                    notifications: {...profileSettings.notifications, rentReminders: e.target.checked}
                  })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Maintenance Updates</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Updates on your maintenance requests</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profileSettings.notifications.maintenanceUpdates}
                  onChange={(e) => setProfileSettings({
                    ...profileSettings,
                    notifications: {...profileSettings.notifications, maintenanceUpdates: e.target.checked}
                  })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Message Alerts</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get notified of new messages from landlord</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profileSettings.notifications.messageAlerts}
                  onChange={(e) => setProfileSettings({
                    ...profileSettings,
                    notifications: {...profileSettings.notifications, messageAlerts: e.target.checked}
                  })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto w-full">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preferences</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Dark Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Switch to dark theme for better viewing at night</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.darkMode}
                  onChange={(e) => setPreferences({...preferences, darkMode: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Auto-Pay Reminders</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Remind me 3 days before rent is due</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.autoPayReminders}
                  onChange={(e) => setPreferences({...preferences, autoPayReminders: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-600"></div>
              </label>
            </div>

          </div>
        </div>

        {/* Language & Region Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto w-full">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Language & Region</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option>English</option>
                <option>Swahili</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({...preferences, currency: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option>KES (Kenyan Shilling)</option>
                <option>USD (US Dollar)</option>
                <option>EUR (Euro)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({...preferences, dateFormat: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy & Data Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto w-full">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacy & Data</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Share Usage Data</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Help us improve by sharing anonymous usage data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.shareUsageData}
                  onChange={(e) => setPreferences({...preferences, shareUsageData: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366] dark:peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex-1 mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Download Your Data</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get a copy of all your data stored with us</p>
              </div>
              <button
                onClick={handleDataExport}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition font-medium text-sm"
              >
                Request Data Export
              </button>
            </div>
          </div>
        </div>

        {/* Move-Out Notice Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900">
          <div className="p-4 sm:p-6 border-b border-orange-200 dark:border-orange-900">
            <h2 className="text-xl font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
              <FileSignature className="w-6 h-6" />
              Move-Out Notice
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Submit Move-Out Notice</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Planning to move out? Submit your notice here (30 or 60 days required).
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>30 days (standard tenancies) or 60 days (controlled areas)</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Legal notice will be generated automatically</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Landlord will be notified immediately</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setShowMoveOutModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-800 transition font-medium whitespace-nowrap text-sm sm:text-base flex items-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                Submit Notice
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900">
          <div className="p-4 sm:p-6 border-b border-red-200 dark:border-red-900">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Deactivate Account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Deactivate Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Temporarily disable your account</p>
              </div>
              <button
                onClick={handleDeactivateAccount}
                className="px-4 py-2 sm:px-6 sm:py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition font-medium whitespace-nowrap text-sm sm:text-base"
              >
                Deactivate
              </button>
            </div>

            {/* Delete Account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Delete Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition font-medium text-sm sm:text-base"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
  </div>
)}
        </main>
      </div>

      {/* ============ MODALS ============ */}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                <select
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm lg:text-base"
                >
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})}
                  placeholder="e.g., M-Pesa code"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newPayment.dueDate}
                  onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm lg:text-base"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm lg:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  className="flex-1 px-4 py-2 bg-[#003366] dark:bg-blue-600 text-white rounded-lg hover:bg-[#002244] dark:hover:bg-blue-700 transition text-sm lg:text-base"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">New Maintenance Request</h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Title *</label>
                <input
                  type="text"
                  value={newMaintenance.issue}
                  onChange={(e) => setNewMaintenance({...newMaintenance, issue: e.target.value})}
                  placeholder="e.g., Leaking faucet"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea
                  value={newMaintenance.description}
                  onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})}
                  rows="4"
                  placeholder="Provide details about the issue..."
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={newMaintenance.priority}
                  onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm lg:text-base"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  value={newMaintenance.location}
                  onChange={(e) => setNewMaintenance({...newMaintenance, location: e.target.value})}
                  placeholder="e.g., Kitchen, Bedroom 1"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm lg:text-base"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm lg:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMaintenanceRequest}
                  className="flex-1 px-4 py-2 bg-[#003366] dark:bg-blue-600 text-white rounded-lg hover:bg-[#002244] dark:hover:bg-blue-700 transition text-sm lg:text-base"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">New Message</h3>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                <select
                  value={newMessage.to}
                  onChange={(e) => setNewMessage({...newMessage, to: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm lg:text-base"
                >
                  <option value="Property Manager">Property Manager</option>
                  <option value="Maintenance Team">Maintenance Team</option>
                  <option value="Landlord">Landlord</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  placeholder="Message subject"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  rows="6"
                  placeholder="Type your message..."
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm lg:text-base"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm lg:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="flex-1 px-4 py-2 bg-[#003366] dark:bg-blue-600 text-white rounded-lg hover:bg-[#002244] dark:hover:bg-blue-700 transition text-sm lg:text-base"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Upload Document</h3>
              <button onClick={() => setShowDocumentUploadModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name (Optional)</label>
                <input
                  type="text"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                  placeholder="e.g., Payment Receipt - Dec 2024"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                <input
                  type="file"
                  onChange={(e) => setNewDocument({...newDocument, file: e.target.files[0]})}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#003366] file:text-white hover:file:bg-[#002244]"
                />
                <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
              </div>
              {newDocument.file && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Selected file:</span> {newDocument.file.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Size: {(newDocument.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDocumentUploadModal(false);
                    setNewDocument({ name: '', file: null });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm lg:text-base"
                  disabled={uploadingDocument}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadDocument}
                  disabled={uploadingDocument}
                  className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm lg:text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploadingDocument ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Enable Two-Factor Authentication</h3>
              <button onClick={() => setShow2FAModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">How it works</h4>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Scan the QR code with your authenticator app</li>
                  <li>Enter the 6-digit code from your app</li>
                  <li>Keep your backup codes in a safe place</li>
                </ol>
              </div>

              {/* QR Code Placeholder */}
              <div className="flex justify-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-48 h-48 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center border-2 border-gray-300 dark:border-gray-500">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="w-32 h-32 bg-gray-200 dark:bg-gray-500 mx-auto mb-2"></div>
                    <p className="text-xs">QR Code</p>
                  </div>
                </div>
              </div>

              {/* Manual Setup Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Or enter this key manually:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value="ABCD EFGH IJKL MNOP"
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("ABCDEFGHIJKLMNOP");
                      alert("Copied to clipboard!");
                    }}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Verification Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter 6-digit code from authenticator app:
                </label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShow2FAModal(false)}
                className="flex-1 px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setTwoFactorEnabled(true);
                  setShow2FAModal(false);
                  alert("Two-factor authentication enabled successfully! In production, this would verify the code and save to your account.");
                }}
                className="flex-1 px-6 py-2.5 bg-[#003366] dark:bg-blue-600 text-white rounded-lg hover:bg-[#002244] dark:hover:bg-blue-700 transition font-medium"
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-4 lg:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm lg:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm lg:text-base"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move-Out Notice Modal */}
      {showMoveOutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileSignature className="w-6 h-6 text-orange-600" />
                Submit Move-Out Notice
              </h3>
              <button onClick={() => setShowMoveOutModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>

            <div className="p-4 lg:p-6 space-y-4">
              {/* Warning Banner */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-300 text-sm mb-1">Important Notice</h4>
                  <p className="text-xs text-orange-800 dark:text-orange-400">
                    Kenyan law requires a minimum notice period: 30 days for standard/uncontrolled tenancies, or 60 days (2 months) for controlled areas. This notice is legally binding once submitted.
                  </p>
                </div>
              </div>

              {/* Notice Period Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notice Period <span className="text-red-500">*</span>
                </label>
                <select
                  value={moveOutData.noticePeriod}
                  onChange={(e) => setMoveOutData({...moveOutData, noticePeriod: parseInt(e.target.value)})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm lg:text-base"
                >
                  <option value={30}>30 Days (1 Month) - Standard/uncontrolled tenancies</option>
                  <option value={60}>60 Days (2 Months) - Controlled areas</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select based on your tenancy type and agreement
                </p>
              </div>

              {/* Move-Out Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intended Move-Out Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={moveOutData.moveOutDate}
                  min={new Date(Date.now() + (moveOutData.noticePeriod || 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  onChange={(e) => setMoveOutData({...moveOutData, moveOutDate: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm lg:text-base"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum {moveOutData.noticePeriod || 60} days from today
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Moving <span className="text-red-500">*</span>
                </label>
                <select
                  value={moveOutData.reason}
                  onChange={(e) => setMoveOutData({...moveOutData, reason: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm lg:text-base"
                >
                  <option value="Relocation">Relocation</option>
                  <option value="Financial">Financial Reasons</option>
                  <option value="Property Issues">Property Issues</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={moveOutData.additionalNotes}
                  onChange={(e) => setMoveOutData({...moveOutData, additionalNotes: e.target.value})}
                  rows={3}
                  placeholder="Any additional information..."
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm lg:text-base"
                ></textarea>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={moveOutData.agreedToTerms}
                  onChange={(e) => setMoveOutData({...moveOutData, agreedToTerms: e.target.checked})}
                  className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="agreeTerms" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  I understand that this notice is binding and follows the {moveOutData.noticePeriod || 60}-day legal requirement. My landlord will be notified immediately, and I agree to vacate the premises by the specified date.
                </label>
              </div>

              {/* What Happens Next */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">What happens next?</h4>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">1.</span>
                    <span>Your landlord will be notified immediately via email and in-app notification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">2.</span>
                    <span>A legal notice will be generated with a unique reference number</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">3.</span>
                    <span>Your landlord will acknowledge the notice within 7 days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">4.</span>
                    <span>Property inspection will be scheduled before your move-out date</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMoveOutModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm lg:text-base"
                  disabled={submittingMoveOutNotice}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitMoveOutNotice}
                  disabled={submittingMoveOutNotice}
                  className="flex-1 px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-800 transition text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingMoveOutNotice ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Notice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Detail View Modal */}
      {selectedListing && !showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                {selectedListing.property}{selectedListing.unit && ` - ${selectedListing.unit}`}
              </h3>
              <button onClick={() => setSelectedListing(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>

            <div className="p-4 lg:p-6">
              <div className="relative mb-6">
                <img 
                  src={selectedListing.images[currentImageIndex]} 
                  alt={selectedListing.property || 'Property'}
                  className="w-full h-64 lg:h-96 object-cover rounded-lg"
                />
                {selectedListing.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((currentImageIndex - 1 + selectedListing.images.length) % selectedListing.images.length)}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full hover:bg-white dark:hover:bg-gray-800 transition"
                    >
                      <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((currentImageIndex + 1) % selectedListing.images.length)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full hover:bg-white dark:hover:bg-gray-800 transition"
                    >
                      <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-gray-900 dark:text-white" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {selectedListing.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white">KES {selectedListing.rent.toLocaleString()}<span className="text-base font-normal text-gray-500 dark:text-gray-400">/month</span></h4>
                    <button
                      onClick={() => {
                        setShowBookingModal(true);
                        setBookingData({
                          ...bookingData,
                          name: profileSettings.name,
                          email: profileSettings.email,
                          phone: profileSettings.phone,
                          emailVerified: currentUser?.emailVerified || false
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#003366] dark:bg-blue-600 text-white rounded-lg hover:bg-[#002244] dark:hover:bg-blue-700 transition"
                    >
                      <Calendar className="w-5 h-5" />
                      Book Viewing
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
                    <MapPin className="w-5 h-5" />
                    <span>{selectedListing.location}</span>
                  </div>

                  <div className="flex items-center gap-6 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Bed className="w-5 h-5" />
                      <span>{selectedListing.bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="w-5 h-5" />
                      <span>{selectedListing.bathrooms} Bathrooms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Square className="w-5 h-5" />
                      <span>{selectedListing.area}m²</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">Amenities</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.amenities.map((amenity, index) => (
                      <span key={index} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BASIC BOOKING MODAL FOR LOGGED-IN TENANTS */}
      {showBookingModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Book a Viewing</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedListing.property}{selectedListing.unit && ` - ${selectedListing.unit}`}
                    {selectedListing.location && ` • ${selectedListing.location}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedListing(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

            </div>

            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Viewing Date *</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Viewing Time *</label>
                <select
                  value={bookingData.time}
                  onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Time</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message (Optional)</label>
                <textarea
                  value={bookingData.message}
                  onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Any specific questions or requests?"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedListing(null);
                }}
                disabled={isSubmittingBooking}
                className="flex-1 px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleBookViewing}
                disabled={isSubmittingBooking}
                className="flex-1 px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingBooking ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Submitting...
                  </>
                ) : (
                  'Submit Viewing Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">New Message</h3>
                <button
                  onClick={() => setShowNewMessageModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Select who you'd like to message</p>

              {/* Message Landlord Option */}
              {tenantData?.landlordId && (
                <button
                  onClick={() => {
                    setShowNewMessageModal(false);
                    // Start a new conversation with landlord
                    setSelectedConversation({
                      conversationId: `${currentUser.uid}_${tenantData.landlordId}`,
                      otherUserId: tenantData.landlordId,
                      otherUserName: 'Landlord',
                      otherUserRole: 'landlord',
                      propertyName: tenantData.property || tenantData.propertyName || '',
                      unit: tenantData.unit || ''
                    });
                  }}
                  className="w-full px-4 py-4 mb-3 bg-[#003366] dark:bg-[#004080] text-white rounded-lg hover:bg-[#002244] dark:hover:bg-[#003366] transition font-medium flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Message Landlord
                </button>
              )}

              {/* Message Property Manager Option */}
              {propertyManager?.userId && (
                <button
                  onClick={() => {
                    setShowNewMessageModal(false);
                    setCurrentView('messages');
                    // Start a new conversation with property manager
                    setSelectedConversation({
                      conversationId: `${currentUser.uid}_${propertyManager.userId}`,
                      otherUserId: propertyManager.userId,
                      otherUserName: propertyManager.name || 'Property Manager',
                      otherUserRole: 'property_manager',
                      propertyName: tenantData.property || tenantData.propertyName || '',
                      unit: tenantData.unit || ''
                    });
                  }}
                  className="w-full px-4 py-4 mb-3 bg-[#003366] dark:bg-[#004080] text-white rounded-lg hover:bg-[#002244] dark:hover:bg-[#003366] transition font-medium flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Message Property Manager
                </button>
              )}

              {/* Message Maintenance Option */}
              {maintenanceStaff?.userId && (
                <button
                  onClick={() => {
                    setShowNewMessageModal(false);
                    setCurrentView('messages');
                    // Start a new conversation with maintenance
                    setSelectedConversation({
                      conversationId: `${currentUser.uid}_${maintenanceStaff.userId}`,
                      otherUserId: maintenanceStaff.userId,
                      otherUserName: maintenanceStaff.name || 'Maintenance Team',
                      otherUserRole: 'maintenance',
                      propertyName: tenantData.property || tenantData.propertyName || '',
                      unit: tenantData.unit || ''
                    });
                  }}
                  className="w-full px-4 py-4 bg-[#003366] dark:bg-[#004080] text-white rounded-lg hover:bg-[#002244] dark:hover:bg-[#003366] transition font-medium flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Message Maintenance
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Conversation Confirmation Modal */}
      {showDeleteConfirm && conversationToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Conversation?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this conversation with <strong>{conversationToDelete.otherUserName}</strong>?
              This will permanently delete all messages in this thread.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConversationToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
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

      {/* Context Menu for Memos and Updates */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              if (contextMenu.itemType === 'memo') {
                handleDeleteMemo(contextMenu.itemId);
              } else if (contextMenu.itemType === 'update') {
                handleDeleteUpdate(contextMenu.itemId);
              }
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete {contextMenu.itemType === 'memo' ? 'Memo' : 'Update'}
          </button>
        </div>
      )}

      {/* Signature Pad Modal */}
      {showSignaturePad && currentSigningLease && (
        <SignaturePad
          onSave={handleSaveSignature}
          onCancel={() => {
            setShowSignaturePad(false);
            setCurrentSigningLease(null);
          }}
          signerName={tenantData?.name || 'Tenant'}
          title="Tenant Signature"
        />
      )}

    </div>
  );
};

export default TenantDashboard;

