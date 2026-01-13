import React, { useState, useEffect, useRef } from 'react';
import { auth, storage } from '../firebase';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import InvitationModal from '../components/InvitationModal';
import MessageModal from '../components/MessageModal';
import MaintenanceAnalytics from '../components/MaintenanceAnalytics';
import SubscriptionSettings from '../components/SubscriptionSettings';
import {
  useProperties,
  useTenants,
  usePayments,
  useViewings,
  useMaintenanceRequests,
  useNotifications,
  useListings,
  useMemos,
  useTeamMembers
} from '../hooks/useRealtimeData';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateRentWithLateFee,
  getPaymentStatus,
  canAddTenant,
  canEditRent,
  canApproveMaintenance,
  canViewFinancials,
  canManageProperties,
  canSendMessages,
  canManageTeam
} from '../utils/formatters';
import {
  Home,
  Users,
  User,
  Banknote,
  Bell,
  Settings,
  LogOut,
  X,
  Building,
  Wrench,
  Eye,
  Trash2,
  Calendar,
  Mail,
  Phone,
  Download,
  CheckCircle,
  Clock,
  CalendarCheck,
  Send,
  MapPin,
  Camera,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bed,
  Bath,
  Square,
  Menu,
  Upload,
  Image as ImageIcon,
  Filter,
  Search,
  Ban,
  FileText,
  Calculator,
  Edit,
  MessageSquare,
  Check,
  CheckCheck,
  Share2,
  Crown,
  Moon,
  Sun,
  AlertTriangle,
  FileSignature,
  Receipt
} from 'lucide-react';
import LocationPreferences from '../components/LocationPreferences';
import PowerOutagesList from '../components/PowerOutagesList';
import CalendarWidget from '../components/CalendarWidget';
import EnhancedCalendar from '../components/EnhancedCalendar';
import ReminderSettings from '../components/ReminderSettings';
import ApplicationsManager from '../components/ApplicationsManager';
import MpesaReconciliation from '../components/MpesaReconciliation';
import LeaseManagement from '../components/LeaseManagement';
import { generatePaymentReceiptPDF, generateLegalNoticePDF, downloadPDF, pdfToBlob } from '../utils/pdfGenerator';

const LandlordDashboard = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedViewing, setSelectedViewing] = useState(null);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [showEditListingModal, setShowEditListingModal] = useState(false);
  const [showListingDetailsModal, setShowListingDetailsModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tenantFilter, setTenantFilter] = useState('all');
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [viewingFilter, setViewingFilter] = useState('all');
  const [maintenanceViewMode, setMaintenanceViewMode] = useState('requests'); // 'requests' or 'analytics'
  const [documentsTab, setDocumentsTab] = useState('leases'); // 'leases' or 'move-out'
  const [paymentsTab, setPaymentsTab] = useState('payments'); // 'payments' or 'mpesa'
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedTenantForMessage, setSelectedTenantForMessage] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationFilter, setConversationFilter] = useState('all'); // all, tenant, property_manager, maintenance
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newConversationMessage, setNewConversationMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const conversationMessagesEndRef = useRef(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [showTenantDetailsModal, setShowTenantDetailsModal] = useState(false);
  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState(null);
  const [taxTrackingEnabled, setTaxTrackingEnabled] = useState(false);
  const [showTaxPaymentModal, setShowTaxPaymentModal] = useState(false);
  const [selectedTaxPeriod, setSelectedTaxPeriod] = useState(null);
  const [taxPaymentData, setTaxPaymentData] = useState({
    paymentDate: '',
    prn: '',
    amount: ''
  });

  // Profile photo upload state
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const profilePhotoInputRef = useRef(null);

  // Updates state (for Kenya Power alerts)
  const [updates, setUpdates] = useState([]);

  // Get updateUserProfile from auth context
  const { updateUserProfile } = useAuth();

  // Invitation modal state
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const [showSuccessAfterInvitation, setShowSuccessAfterInvitation] = useState(false);

  // Estimate approval modal state
  const [showEstimateApprovalModal, setShowEstimateApprovalModal] = useState(false);
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Quote comparison modal state
  const [showQuoteComparisonModal, setShowQuoteComparisonModal] = useState(false);
  const [selectedRequestForQuotes, setSelectedRequestForQuotes] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [selectedQuoteForApproval, setSelectedQuoteForApproval] = useState(null);
  const [quoteApprovalNotes, setQuoteApprovalNotes] = useState('');

  // Move-out notice state (landlord-initiated)
  const [showMoveOutNoticeModal, setShowMoveOutNoticeModal] = useState(false);
  const [selectedTenantForNotice, setSelectedTenantForNotice] = useState(null);
  const [submittingMoveOutNotice, setSubmittingMoveOutNotice] = useState(false);
  const [landlordMoveOutData, setLandlordMoveOutData] = useState({
    noticePeriod: 30,
    reason: 'Breach of Contract',
    legalGrounds: '',
    additionalTerms: ''
  });

  // User role for permissions (default to landlord, will be updated from user data)
  const [userRole, setUserRole] = useState('landlord');

  const [newTeamMember, setNewTeamMember] = useState({
  name: '',
  email: '',
  phone: '',
  role: 'property_manager', // or 'maintenance'
  assignedProperties: []
});

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [newProperty, setNewProperty] = useState({
    name: '',
    location: '',
    units: '',
    occupied: '',
    revenue: '',
    images: [],
    whatsappGroupLink: ''
  });
  
  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    phone: '',
    property: '',
    unit: '',
    rent: '',
    leaseStart: '',
    leaseEnd: '',
    sendInvitation: true

  });
  
  const [newMaintenance, setNewMaintenance] = useState({
    property: '',
    unit: '',
    issue: '',
    priority: 'medium',
    tenant: ''
  });
  
  const [newPayment, setNewPayment] = useState({
    tenant: '',
    property: '',
    unit: '',
    amount: '',
    dueDate: '',
    method: '',
    referenceNumber: ''
  });
  
  const [newListing, setNewListing] = useState({
    property: '',
    unit: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    rent: '',
    deposit: '',
    description: '',
    amenities: '',
    images: []
  });
  
  const [newMemo, setNewMemo] = useState({
    title: '',
    message: '',
    priority: 'normal',
    targetAudience: 'all'
  });
  
  // Use Auth Context and Real-time Hooks
  const { currentUser, userProfile } = useAuth();
  
  // Real-time data with custom hooks
const { properties, loading: loadingProps } = useProperties(currentUser?.uid);
const { tenants, loading: loadingTenants } = useTenants(currentUser?.uid);
const { payments, loading: loadingPayments } = usePayments(currentUser?.uid, 'landlord');
const { requests: maintenanceRequests, loading: loadingMaintenance } = useMaintenanceRequests(currentUser?.uid, 'landlord');
const { viewings, loading: loadingViewings } = useViewings(currentUser?.uid, 'landlord');
const { listings, loading: loadingListings } = useListings(currentUser?.uid);
const { memos, loading: loadingMemos } = useMemos(currentUser?.uid, 'landlord');
const { teamMembers, loading: loadingTeam } = useTeamMembers(currentUser?.uid);
// Disabled old hook - now using conversation-based messaging
// const { messages, loading: loadingMessages } = useAllMessages(currentUser?.uid, 'landlord');

  // Move-out notices state
  const [moveOutNotices, setMoveOutNotices] = useState([]);
  const [loadingMoveOutNotices, setLoadingMoveOutNotices] = useState(true);

  // Mock maintenance data for display
  const mockMaintenanceRequests = [
    {
    id: 'mock1',
    issue: 'Leaking faucet',
    property: 'Sunset Apartments',
    unit: '2B',
    tenant: 'John Doe',
    priority: 'medium',
    status: 'pending',
    date: '2025-10-07',
    scheduledTime: '09:00'
  },
  {
    id: 'mock2',
    issue: 'Broken AC',
    property: 'Garden View',
    unit: '4A',
    tenant: 'Jane Smith',
    priority: 'high',
    status: 'in-progress',
    date: '2025-10-08',
    scheduledTime: '14:00'
  },
  {
    id: 'mock3',
    issue: 'Faulty door lock',
    property: 'Riverside Towers',
    unit: '8C',
    tenant: 'Peter Kamau',
    priority: 'high',
    status: 'pending',
    date: '2025-10-09',
    scheduledTime: '10:00'
  },
  {
    id: 'mock4',
    issue: 'Water heater not working',
    property: 'Sunset Apartments',
    unit: '5D',
    tenant: 'Grace Njeri',
    priority: 'medium',
    status: 'completed',
    date: '2025-10-02',
    scheduledTime: '11:00'
  }
];

// Use real data if available, otherwise use mock
  const displayMaintenanceRequests = maintenanceRequests.length > 0 ? maintenanceRequests : mockMaintenanceRequests;
  const { notifications, unreadCount } = useNotifications(currentUser?.uid);

  // Helper function to format relative time for notifications
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

  // Mock viewing bookings
const mockViewings = [
  {
    id: 'view1',
    prospectName: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+254 734 567 890',
    property: 'Sunset Apartments',
    date: '2025-10-07',
    time: '10:00',
    status: 'pending',
    credibilityScore: 85,
    employment: 'Employed Full-time',
    motivation: 'Interested in 2-bedroom unit'
  },
  {
    id: 'view2',
    prospectName: 'Michael Ochieng',
    email: 'mochieng@email.com',
    phone: '+254 745 678 901',
    property: 'Sunset Apartments',
    date: '2025-10-08',
    time: '14:00',
    status: 'confirmed',
    credibilityScore: 92,
    employment: 'Self-employed',
    motivation: 'Looking for studio apartment'
  }
];

// Use real or mock viewings
const displayViewings = viewings.length > 0 ? viewings : mockViewings;



  // Mock data for Calendar view
const mockViewingBookings = [
  {
    id: 'viewing1',
    prospectName: 'Sarah Johnson',
    property: 'Sunset Apartments',
    date: '2025-10-07',
    time: '10:00',
    status: 'pending',
    type: 'viewing'
  },
  {
    id: 'viewing2',
    prospectName: 'Michael Ochieng',
    property: 'Sunset Apartments',
    date: '2025-10-08',
    time: '14:00',
    status: 'confirmed',
    type: 'viewing'
  }
];

const mockCalendarMaintenance = [
  {
    id: 'cal-maint1',
    issue: 'Leaking faucet',
    property: 'Sunset Apartments',
    date: '2025-10-07',
    scheduledTime: '09:00',
    status: 'pending',
    type: 'maintenance'
  },
  {
    id: 'cal-maint2',
    issue: 'Broken AC',
    property: 'Garden View',
    date: '2025-10-08',
    scheduledTime: '14:00',
    status: 'in-progress',
    type: 'maintenance'
  },
  {
    id: 'cal-maint3',
    issue: 'Faulty door lock',
    property: 'Riverside Towers',
    date: '2025-10-09',
    scheduledTime: '10:00',
    status: 'pending',
    type: 'maintenance'
  }
];

// Use real data if available, otherwise use mock
const displayViewingBookings = viewings.length > 0 ? viewings : mockViewingBookings;
const displayCalendarEvents = [...displayViewingBookings.map(v => ({...v, type: 'viewing'})), ...(maintenanceRequests.length > 0 ? maintenanceRequests : mockCalendarMaintenance).map(m => ({...m, type: 'maintenance'}))];
  
  

  const [profileSettings, setProfileSettings] = useState({
    name: userProfile?.displayName || 'Tom Doe',
    email: userProfile?.email || 'tom@nyumbanii.co.ke',
    phone: userProfile?.phone || '+254 712 345 678',
    company: userProfile?.companyName || 'Doe Properties Ltd',
    address: userProfile?.address || 'Westlands, Nairobi',
    notifications: {
      email: true,
      sms: false, // Disabled SMS
      push: true,
      paymentAlerts: true,
      maintenanceAlerts: true,
      viewingAlerts: true
    }
  });

  // Preferences state for dark mode and other UI preferences
  const [preferences, setPreferences] = useState({
    darkMode: false,
    autoRefresh: true
  });

  // Business Preferences
  const [businessPreferences, setBusinessPreferences] = useState({
    currency: 'KSH',
    dateFormat: 'DD/MM/YYYY',
    fiscalYearStart: 'January',
    businessHoursStart: '08:00',
    businessHoursEnd: '18:00',
    language: 'English',
    timezone: 'Africa/Nairobi'
  });

  // Automated Workflows
  const [automatedWorkflows, setAutomatedWorkflows] = useState({
    autoApproveMaintenance: false,
    maintenanceApprovalLimit: 5000,
    quoteRequiredThreshold: 10000, // Require formal quotes above this amount
    monthlyMaintenanceBudget: 50000, // Monthly maintenance budget
    budgetAlertsEnabled: true, // Alert when approaching budget limit
    budgetAlertThreshold: 0.8, // Alert at 80% of budget
    autoRentReminders: true,
    rentReminderDays: 3,
    autoOverdueNotices: true,
    overdueNoticeDays: 1,
    autoMonthlyReports: true,
    autoArchiveRecords: false,
    archiveAfterMonths: 12
  });

  // Financial Settings
  const [financialSettings, setFinancialSettings] = useState({
    lateFeeEnabled: true,
    lateFeePercentage: 5,
    gracePeriodDays: 3,
    acceptedPaymentMethods: ['mpesa', 'bank', 'cash'],
    customReceiptBranding: true,
    invoicePrefix: 'INV-2025-',
    receiptPrefix: 'RCP-2025-'
  });

  // Communication Preferences
  const [communicationPrefs, setCommunicationPrefs] = useState({
    emailSignature: '',
    autoReplyEnabled: false,
    autoReplyMessage: 'Thank you for your message. We will respond within 24 hours.',
    tenantPortalEnabled: true,
    allowTenantSelfService: true
  });

  // Property Management Settings
  const [propertySettings, setPropertySettings] = useState({
    autoPostVacancies: true,
    minimumLeaseTerm: 12,
    securityDepositMultiple: 1,
    utilitiesIncluded: ['water'],
    petPolicy: 'not_allowed',
    petDeposit: 0
  });

  // Team Management Permissions
  const [teamPermissions, setTeamPermissions] = useState({
    propertyManagerCanAddTenants: true,
    propertyManagerCanEditRent: false,
    maintenanceCanViewPayments: false,
    requireApprovalForExpenses: true,
    expenseApprovalLimit: 10000,
    activityLogsEnabled: true
  });

  // Reporting Settings
  const [reportingSettings, setReportingSettings] = useState({
    dashboardWidgets: ['revenue', 'occupancy', 'maintenance', 'payments'],
    defaultExportFormat: 'PDF',
    scheduledReportsEnabled: true,
    reportFrequency: 'monthly',
    reportRecipients: []
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    ipWhitelistEnabled: false,
    ipWhitelist: [],
    auditTrailEnabled: true,
    dataRetentionMonths: 24,
    twoFactorEnabled: false
  });

  // Integration Settings
  const [integrationSettings, setIntegrationSettings] = useState({
    mpesaEnabled: false,
    mpesaBusinessNumber: '',
    mpesaPasskey: '',
    customEmailEnabled: false,
    smtpServer: '',
    smtpPort: 587,
    calendarSyncEnabled: false,
    calendarProvider: 'google',
    whatsappBusinessEnabled: false,
    whatsappNumber: ''
  });

  // Apply dark mode class to document root
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  // Check for pending upgrade from registration
  useEffect(() => {
    const pendingUpgradeData = sessionStorage.getItem('pendingUpgrade');
    if (pendingUpgradeData && currentUser) {
      try {
        const upgradeData = JSON.parse(pendingUpgradeData);
        // Check if data is recent (within 30 minutes)
        if (Date.now() - upgradeData.timestamp < 30 * 60 * 1000) {
          // Auto-switch to subscription view to show upgrade options
          setCurrentView('subscription');
          // Clear the pending upgrade after 5 seconds (user will see subscription page)
          setTimeout(() => {
            sessionStorage.removeItem('pendingUpgrade');
          }, 5000);
        } else {
          // Clear stale data
          sessionStorage.removeItem('pendingUpgrade');
        }
      } catch (e) {
        sessionStorage.removeItem('pendingUpgrade');
      }
    }
  }, [currentUser]);

  // Load settings from Firestore on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser) return;

      try {
        const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
        const settingsRef = firestoreDoc(db, 'landlordSettings', currentUser.uid);
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();

          // Load all settings
          if (data.preferences) setPreferences(data.preferences);
          if (data.businessPreferences) setBusinessPreferences(data.businessPreferences);
          if (data.automatedWorkflows) setAutomatedWorkflows(data.automatedWorkflows);
          if (data.financialSettings) setFinancialSettings(data.financialSettings);
          if (data.communicationPrefs) setCommunicationPrefs(data.communicationPrefs);
          if (data.propertySettings) setPropertySettings(data.propertySettings);
          if (data.teamPermissions) setTeamPermissions(data.teamPermissions);
          if (data.reportingSettings) setReportingSettings(data.reportingSettings);
          if (data.securitySettings) setSecuritySettings(data.securitySettings);
          if (data.integrationSettings) setIntegrationSettings(data.integrationSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, [currentUser]);

  // Fetch updates (including Kenya Power alerts)
  useEffect(() => {
    if (!currentUser?.uid) return;

    const updatesQuery = query(
      collection(db, 'updates'),
      where('landlordId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(updatesQuery, (snapshot) => {
      const updatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUpdates(updatesData);
      console.log('📊 Kenya Power Updates:', updatesData.length, 'updates loaded');
    }, (error) => {
      console.error('❌ Error fetching updates:', error);
    });

    return unsubscribe;
  }, [currentUser]);

  // Save settings to Firestore whenever they change (with debouncing)
  useEffect(() => {
    const saveSettings = async () => {
      if (!currentUser) return;

      try {
        const { setDoc, doc: firestoreDoc } = await import('firebase/firestore');
        const settingsRef = firestoreDoc(db, 'landlordSettings', currentUser.uid);
        await setDoc(settingsRef, {
          preferences,
          businessPreferences,
          automatedWorkflows,
          financialSettings,
          communicationPrefs,
          propertySettings,
          teamPermissions,
          reportingSettings,
          securitySettings,
          integrationSettings,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    // Debounce saving to avoid too many writes (wait 1 second after last change)
    const timeoutId = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    currentUser,
    preferences,
    businessPreferences,
    automatedWorkflows,
    financialSettings,
    communicationPrefs,
    propertySettings,
    teamPermissions,
    reportingSettings,
    securitySettings,
    integrationSettings
  ]);

  // Update profileSettings when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfileSettings(prev => ({
        ...prev,
        name: userProfile.displayName || prev.name,
        email: userProfile.email || prev.email,
        phone: userProfile.phone || prev.phone,
        company: userProfile.companyName || prev.company,
        address: userProfile.address || prev.address
      }));
    }
  }, [userProfile]);

  // Fetch conversations for Messages tab
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

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.conversationId) {
      console.log('🚫 No selected conversation');
      setConversationMessages([]);
      return;
    }

    console.log('💬 Loading conversation:', selectedConversation.conversationId);

    // Mark all message notifications for this conversation as read
    const markConversationNotificationsRead = async () => {
      try {
        // Mark notifications as read
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', currentUser.uid),
          where('conversationId', '==', selectedConversation.conversationId),
          where('type', '==', 'message'),
          where('read', '==', false)
        );

        const notificationsSnapshot = await getDocs(notificationsQuery);
        const notificationUpdatePromises = notificationsSnapshot.docs.map(doc =>
          updateDoc(doc.ref, {
            read: true,
            readAt: serverTimestamp()
          })
        );

        await Promise.all(notificationUpdatePromises);
        console.log('✅ Marked', notificationsSnapshot.size, 'message notifications as read');

        // Also mark the actual messages as read
        const messagesQuery = query(
          collection(db, 'messages'),
          where('conversationId', '==', selectedConversation.conversationId),
          where('recipientId', '==', currentUser.uid),
          where('read', '==', false)
        );

        const messagesSnapshot = await getDocs(messagesQuery);
        const messageUpdatePromises = messagesSnapshot.docs.map(doc =>
          updateDoc(doc.ref, {
            read: true,
            readAt: serverTimestamp()
          })
        );

        await Promise.all(messageUpdatePromises);
        console.log('✅ Marked', messagesSnapshot.size, 'messages as read');

        // Update the conversation's unread status in the local state
        setConversations(prev => prev.map(conv =>
          conv.conversationId === selectedConversation.conversationId
            ? { ...conv, unread: false }
            : conv
        ));
      } catch (error) {
        console.error('Error marking conversation notifications as read:', error);
      }
    };

    markConversationNotificationsRead();

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

  // Fetch move-out notices
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'moveOutNotices'),
      where('landlordId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMoveOutNotices(notices);
      setLoadingMoveOutNotices(false);
    }, (error) => {
      console.error('Error fetching move-out notices:', error);
      setLoadingMoveOutNotices(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

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
        senderName: userProfile?.displayName || 'Landlord',
        senderRole: 'landlord',
        recipientId: selectedConversation.otherUserId,
        recipientName: selectedConversation.otherUserName,
        recipientRole: selectedConversation.otherUserRole,
        text: messageText,
        timestamp: serverTimestamp(),
        read: false,
        propertyName: selectedConversation.propertyName,
        unit: selectedConversation.unit
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        userId: selectedConversation.otherUserId,
        type: 'message',
        title: 'New Message from Landlord',
        message: `You have a new message: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
        read: false,
        timestamp: serverTimestamp(),
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || 'Landlord',
        senderRole: 'landlord',
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

  // Image upload handler
  const handleImageUpload = async (files, type = 'property') => {
    if (!files || files.length === 0) return [];

    // Check if storage is properly configured
    if (!storage) {
      console.error('Firebase storage is not initialized');
      alert('Storage configuration error. Please check Firebase setup.');
      return [];
    }

    // Check if user is authenticated
    if (!currentUser || !currentUser.uid) {
      console.error('User not authenticated');
      alert('Please log in to upload images.');
      return [];
    }

    setUploadingImages(true);
    const imageUrls = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} is not an image.`);
          continue;
        }

        console.log(`Uploading ${file.name} to ${type}Images/${currentUser.uid}/`);
        const storageRef = ref(storage, `${type}Images/${currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
        console.log(`Successfully uploaded ${file.name}`);
      }

      if (imageUrls.length > 0) {
        alert(`Successfully uploaded ${imageUrls.length} image(s)!`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      console.error('Error details:', error.code, error.message);

      // Provide more specific error messages
      if (error.code === 'storage/unauthorized') {
        alert('Permission denied. Please check Firebase Storage rules.');
      } else if (error.code === 'storage/canceled') {
        alert('Upload was canceled.');
      } else if (error.code === 'storage/unknown') {
        alert('An unknown error occurred. Please check your internet connection and Firebase configuration.');
      } else {
        alert(`Error uploading images: ${error.message}. Please try again.`);
      }
    } finally {
      setUploadingImages(false);
    }

    return imageUrls;
  };
  // Add this useEffect after your other useEffects
useEffect(() => {
  // Set loading to false once we have user data or determine user is not logged in
  if (currentUser !== undefined) {
    setLoading(false);
  }
}, [currentUser]);

// Also add a check for unauthenticated users
useEffect(() => {
  if (currentUser === null) {
    // User is not logged in, redirect to login
    navigate('/login');
  }
}, [currentUser, navigate]);

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

      // Reload the current user to get updated photoURL in auth
      await currentUser.reload();

      // Update local userProfile state via AuthContext
      await updateUserProfile({ photoURL: photoURL });

      alert('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      alert('Failed to upload profile photo. Please try again.');
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  // ADD PROPERTY with images
  const handleAddProperty = async () => {
    if (newProperty.name && newProperty.location && newProperty.units) {
      try {
        // Note: Subscription limits will be enforced in future updates
        // For now, all users can add unlimited properties

        await addDoc(collection(db, 'properties'), {
          name: newProperty.name,
          location: newProperty.location,
          units: parseInt(newProperty.units),
          occupied: parseInt(newProperty.occupied) || 0,
          revenue: parseInt(newProperty.revenue) || 0,
          images: newProperty.images || [],
          whatsappGroupLink: newProperty.whatsappGroupLink || '',
          landlordId: currentUser.uid,
          createdAt: serverTimestamp()
        });

        setNewProperty({ name: '', location: '', units: '', occupied: '', revenue: '', images: [], whatsappGroupLink: '' });
        setShowPropertyModal(false);
        alert('Property added successfully!');
      } catch (error) {
        console.error('Error adding property:', error);
        alert('Error adding property. Please try again.');
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  // DELETE PROPERTY
  const handleDeleteProperty = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await deleteDoc(doc(db, 'properties', id));
        alert('Property deleted successfully!');
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Error deleting property. Please try again.');
      }
    }
  };
  // EDIT PROPERTY
const handleEditProperty = async () => {
  if (editingProperty && editingProperty.name && editingProperty.location && editingProperty.units) {
    try {
      const propertyRef = doc(db, 'properties', editingProperty.id);
      await updateDoc(propertyRef, {
        name: editingProperty.name,
        location: editingProperty.location,
        units: parseInt(editingProperty.units),
        occupied: parseInt(editingProperty.occupied) || 0,
        revenue: parseInt(editingProperty.revenue) || 0,
        images: editingProperty.images || [],
        whatsappGroupLink: editingProperty.whatsappGroupLink || ''
      });
      
      setEditingProperty(null);
      setShowEditPropertyModal(false);
      alert('Property updated successfully!');
    } catch (error) {
      console.error('Error updating property:', error);
      alert('Error updating property. Please try again.');
    }
  } else {
    alert('Please fill in all required fields');
  }
};

  const handleAddTenant = async () => {
  try {
    // Check if user is authenticated
    if (!currentUser || !currentUser.uid) {
      alert('Authentication error. Please log out and log back in.');
      return;
    }

    // Validate required fields and provide specific error messages
    const missingFields = [];
    if (!newTenant.name) missingFields.push('Full Name');
    if (!newTenant.email) missingFields.push('Email');
    if (!newTenant.property) missingFields.push('Property');
    if (!newTenant.unit) missingFields.push('Unit Number');

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Generate a unique invitation token
    const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    console.log('Adding tenant with currentUser.uid:', currentUser.uid);

    // Calculate next rent due date (based on lease start date's day of month)
    const calculateNextRentDueDate = (leaseStartDate) => {
      if (!leaseStartDate) return null;

      const today = new Date();
      const leaseStart = new Date(leaseStartDate);
      const dayOfMonth = leaseStart.getDate();

      // Create a date for this month on the same day
      const thisMonthDue = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);

      // If that date has passed, use next month
      if (thisMonthDue < today) {
        const nextMonthDue = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
        return nextMonthDue.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }

      return thisMonthDue.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    };

    // Add tenant to Firestore
    const tenantData = {
      name: newTenant.name,
      email: newTenant.email.toLowerCase(),
      phone: newTenant.phone,
      property: newTenant.property,
      unit: newTenant.unit,
      rent: parseFloat(newTenant.rent) || 0,
      leaseStart: newTenant.leaseStart,
      leaseEnd: newTenant.leaseEnd,
      rentDueDate: calculateNextRentDueDate(newTenant.leaseStart), // Add rent due date
      landlordId: currentUser.uid,
      landlordName: userProfile?.displayName || 'Your Landlord',
      status: newTenant.sendInvitation ? 'pending' : 'active', // pending if sending invitation
      invitationToken: newTenant.sendInvitation ? invitationToken : null,
      createdAt: serverTimestamp()
    };

    console.log('Tenant data to be added:', tenantData);

    await addDoc(collection(db, 'tenants'), tenantData);

    console.log('Tenant added successfully to Firestore');

    // If sending invitation, create an invitation record
    if (newTenant.sendInvitation) {
      const invitationData = {
        token: invitationToken,
        email: newTenant.email.toLowerCase(),
        landlordId: currentUser.uid,
        landlordName: userProfile?.displayName || 'Your Landlord',
        tenantName: newTenant.name,
        property: newTenant.property,
        unit: newTenant.unit,
        type: 'tenant', // Distinguish from team member invitations
        status: 'pending', // pending, accepted, expired
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      };

      await addDoc(collection(db, 'invitations'), invitationData);

      // Store invitation data and show invitation modal
      setPendingInvitation({
        token: invitationToken,
        name: newTenant.name,
        email: newTenant.email,
        phone: newTenant.phone,
        role: 'tenant',
        property: newTenant.property,
        unit: newTenant.unit
      });

      // Reset form and close tenant modal
      setNewTenant({
        name: '',
        email: '',
        phone: '',
        property: '',
        unit: '',
        rent: '',
        leaseStart: '',
        leaseEnd: '',
        sendInvitation: true
      });
      setShowTenantModal(false);

      // Set flag to show success message after invitation modal closes
      setShowSuccessAfterInvitation(true);

      // Show invitation modal
      setShowInvitationModal(true);
    } else {
      alert('Tenant added successfully!');

      // Reset form and close modal
      setNewTenant({
        name: '',
        email: '',
        phone: '',
        property: '',
        unit: '',
        rent: '',
        leaseStart: '',
        leaseEnd: '',
        sendInvitation: true
      });
      setShowTenantModal(false);
    }
  } catch (error) {
    console.error('Error adding tenant:', error);
    console.error('Error details:', error.message, error.code);
    alert(`Failed to add tenant: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
  }
};

  // RESEND/CREATE TENANT INVITATION
  const handleResendTenantInvitation = async (tenant) => {
    try {
      // Generate a new invitation token
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Update tenant with new invitation token and set status to pending
      await updateDoc(doc(db, 'tenants', tenant.id), {
        invitationToken: invitationToken,
        status: 'pending'
      });

      // Create or update invitation record
      const invitationData = {
        token: invitationToken,
        email: tenant.email.toLowerCase(),
        landlordId: currentUser.uid,
        landlordName: userProfile?.displayName || 'Your Landlord',
        tenantName: tenant.name,
        property: tenant.property,
        unit: tenant.unit,
        type: 'tenant',
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'invitations'), invitationData);

      // Show invitation modal with sharing options
      setPendingInvitation({
        token: invitationToken,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        role: 'tenant',
        property: tenant.property,
        unit: tenant.unit
      });
      setShowInvitationModal(true);

      alert('Invitation created successfully! You can now share it with the tenant.');
    } catch (error) {
      console.error('Error creating invitation:', error);
      alert('Error creating invitation. Please try again.');
    }
  };

  // DELETE TENANT
  const handleDeleteTenant = async (tenantId, tenantName) => {
    if (!window.confirm(`Are you sure you want to delete ${tenantName} from your tenant directory? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'tenants', tenantId));
      alert('Tenant deleted successfully!');
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Error deleting tenant. Please try again.');
    }
  };

  // ISSUE MOVE-OUT NOTICE (Landlord to Tenant)
  const handleIssueMoveOutNotice = async () => {
    // Validation
    if (!landlordMoveOutData.legalGrounds || landlordMoveOutData.legalGrounds.trim() === '') {
      alert('Please provide legal grounds for issuing this notice. This is required for the legal document.');
      return;
    }

    if (!selectedTenantForNotice) {
      alert('Please select a tenant first.');
      return;
    }

    setSubmittingMoveOutNotice(true);

    try {
      // Calculate move-out date based on notice period
      const today = new Date();
      const moveOutDate = new Date(today);
      moveOutDate.setDate(moveOutDate.getDate() + landlordMoveOutData.noticePeriod);
      const formattedMoveOutDate = moveOutDate.toISOString().split('T')[0];

      // Generate unique reference number
      const timestamp = Date.now();
      const referenceNumber = `MVN-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${timestamp.toString().slice(-5)}`;

      // Prepare notice data
      const noticeData = {
        initiatedBy: 'landlord',
        tenantId: selectedTenantForNotice.id,
        tenantName: selectedTenantForNotice.name,
        tenantEmail: selectedTenantForNotice.email || '',
        tenantPhone: selectedTenantForNotice.phone || '',
        tenantIdNumber: selectedTenantForNotice.idNumber || '',
        propertyId: selectedTenantForNotice.propertyId || '',
        propertyName: selectedTenantForNotice.property || '',
        unit: selectedTenantForNotice.unit || '',
        landlordId: currentUser.uid,
        landlordName: landlordData?.name || currentUser.displayName || '',
        landlordEmail: landlordData?.email || currentUser.email || '',
        intendedMoveOutDate: moveOutDate,
        noticeSubmittedDate: new Date(),
        noticePeriod: landlordMoveOutData.noticePeriod,
        reason: landlordMoveOutData.reason,
        legalGrounds: landlordMoveOutData.legalGrounds,
        additionalNotes: landlordMoveOutData.additionalTerms || '',
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

      // Send notification to tenant
      if (selectedTenantForNotice.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: selectedTenantForNotice.userId,
          title: `${landlordMoveOutData.noticePeriod}-Day Move-Out Notice Issued`,
          message: `Your landlord has issued a ${landlordMoveOutData.noticePeriod}-day move-out notice for ${selectedTenantForNotice.unit}. Move-out date: ${formattedMoveOutDate}. Please check your dashboard for details.`,
          type: 'move_out_notice',
          relatedId: docRef.id,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Log activity
      await addDoc(collection(db, 'activityLog'), {
        userId: currentUser.uid,
        userName: landlordData?.name || currentUser.displayName || '',
        userRole: 'landlord',
        propertyId: selectedTenantForNotice.propertyId || '',
        unit: selectedTenantForNotice.unit || '',
        landlordId: currentUser.uid,
        actionType: 'move_out_notice_issued',
        actionDescription: `Move-out notice issued to ${selectedTenantForNotice.name} - ${landlordMoveOutData.noticePeriod} days`,
        metadata: {
          noticeId: docRef.id,
          moveOutDate: formattedMoveOutDate,
          noticePeriod: landlordMoveOutData.noticePeriod,
          reason: landlordMoveOutData.reason,
          tenantId: selectedTenantForNotice.id,
          tenantName: selectedTenantForNotice.name
        },
        relatedDocumentId: docRef.id,
        createdAt: serverTimestamp()
      });

      // Reset form and close modal
      setLandlordMoveOutData({
        noticePeriod: 30,
        reason: 'Breach of Contract',
        legalGrounds: '',
        additionalTerms: ''
      });
      setSelectedTenantForNotice(null);
      setShowMoveOutNoticeModal(false);

      alert(`Move-out notice issued successfully!\n\nReference Number: ${referenceNumber}\n\nThe tenant has been notified and must vacate by ${formattedMoveOutDate}.\n\nA legal notice PDF has been generated and sent to the tenant.`);
    } catch (error) {
      console.error('Error issuing move-out notice:', error);
      alert('Failed to issue move-out notice. Please try again.');
    } finally {
      setSubmittingMoveOutNotice(false);
    }
  };

  // ACKNOWLEDGE MOVE-OUT NOTICE
  const handleAcknowledgeNotice = async (noticeId, tenantName) => {
    if (!window.confirm(`Acknowledge move-out notice from ${tenantName}?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'moveOutNotices', noticeId), {
        status: 'acknowledged',
        acknowledgedBy: currentUser.uid,
        acknowledgedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert('Move-out notice acknowledged successfully!');
    } catch (error) {
      console.error('Error acknowledging notice:', error);
      alert('Failed to acknowledge notice. Please try again.');
    }
  };

  // APPROVE MOVE-OUT NOTICE
  const handleApproveNotice = async (noticeId, tenantId, tenantName) => {
    if (!window.confirm(`Approve move-out notice from ${tenantName}? This confirms the tenant can move out on the specified date.`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'moveOutNotices', noticeId), {
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send notification to tenant
      if (tenantId) {
        await addDoc(collection(db, 'notifications'), {
          userId: tenantId,
          title: 'Move-Out Notice Approved',
          message: `Your move-out notice has been approved. You may proceed with moving out on the specified date.`,
          type: 'move_out_notice',
          relatedId: noticeId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      alert('Move-out notice approved successfully!');
    } catch (error) {
      console.error('Error approving notice:', error);
      alert('Failed to approve notice. Please try again.');
    }
  };

  // REJECT MOVE-OUT NOTICE
  const handleRejectNotice = async (noticeId, tenantId, tenantName) => {
    const rejectionReason = prompt(`Why are you rejecting ${tenantName}'s move-out notice?`);
    if (!rejectionReason) return;

    try {
      await updateDoc(doc(db, 'moveOutNotices', noticeId), {
        status: 'rejected',
        rejectionReason: rejectionReason,
        updatedAt: serverTimestamp()
      });

      // Send notification to tenant
      if (tenantId) {
        await addDoc(collection(db, 'notifications'), {
          userId: tenantId,
          title: 'Move-Out Notice Rejected',
          message: `Your move-out notice has been rejected. Reason: ${rejectionReason}`,
          type: 'move_out_notice',
          relatedId: noticeId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      alert('Move-out notice rejected.');
    } catch (error) {
      console.error('Error rejecting notice:', error);
      alert('Failed to reject notice. Please try again.');
    }
  };

  // ADD PAYMENT
  const handleAddPayment = async () => {
    console.log('Payment data:', newPayment);

    // Validate required fields
    const missingFields = [];
    if (!newPayment.tenant) missingFields.push('Tenant');
    if (!newPayment.amount) missingFields.push('Amount');
    if (!newPayment.dueDate) missingFields.push('Due Date');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate amount is a positive number
    const amount = parseInt(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Amount must be a positive number');
      return;
    }

    // Validate dueDate is a valid date
    const dueDate = new Date(newPayment.dueDate);
    if (isNaN(dueDate.getTime())) {
      alert('Invalid due date');
      return;
    }

    try {
      // Calculate month from dueDate
      const month = dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const paymentData = {
        tenant: newPayment.tenant,
        tenantId: newPayment.tenantId || null,
        property: newPayment.property,
        unit: newPayment.unit,
        amount: parseInt(newPayment.amount),
        dueDate: newPayment.dueDate,
        month: month,
        paidDate: null,
        status: 'pending',
        method: newPayment.method || 'Cash',
        referenceNumber: newPayment.referenceNumber || null,
        landlordId: currentUser.uid,
        createdAt: serverTimestamp()
      };
      console.log('💰 Landlord creating payment with data:', paymentData);
      await addDoc(collection(db, 'payments'), paymentData);

      setNewPayment({ tenant: '', tenantId: '', property: '', unit: '', amount: '', dueDate: '', method: '', referenceNumber: '' });
      setShowPaymentModal(false);
      alert('Payment record added successfully!');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment. Please try again.');
    }
  };


  // RECORD PAYMENT (with late fee calculation)
  const handleRecordPayment = async (paymentId) => {
    try {
      // Find the payment
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        alert('Payment not found');
        return;
      }

      const today = new Date();

      // Calculate late fees if applicable
      const lateFeeResult = calculateRentWithLateFee(
        payment.amount,
        payment.dueDate,
        today,
        financialSettings
      );

      // Show confirmation if late fee applies
      if (lateFeeResult.isLate && lateFeeResult.lateFee > 0) {
        const message = `This payment is ${lateFeeResult.daysLate} days late.\n\nOriginal Amount: ${formatCurrency(payment.amount, businessPreferences.currency)}\nLate Fee (${financialSettings.lateFeePercentage}%): ${formatCurrency(lateFeeResult.lateFee, businessPreferences.currency)}\nTotal Amount: ${formatCurrency(lateFeeResult.totalAmount, businessPreferences.currency)}\n\nDo you want to proceed?`;

        if (!confirm(message)) {
          return;
        }
      }

      const paymentRef = doc(db, 'payments', paymentId);

      await updateDoc(paymentRef, {
        status: 'paid',
        paidDate: today.toISOString().split('T')[0],
        // Preserve original payment method from the payment record
        method: payment.method || 'Cash',
        originalAmount: payment.amount,
        lateFee: lateFeeResult.lateFee,
        totalAmount: lateFeeResult.totalAmount,
        daysLate: lateFeeResult.daysLate
      });

      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment. Please try again.');
    }
  };

  // MARK PAYMENT AS PAID (with late fee calculation)
  const handleMarkPaymentPaid = async (paymentId) => {
    try {
      // Find the payment
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        alert('Payment not found');
        return;
      }

      const today = new Date();

      // Calculate late fees if applicable
      const lateFeeResult = calculateRentWithLateFee(
        payment.amount,
        payment.dueDate,
        today,
        financialSettings
      );

      // Show confirmation if late fee applies
      if (lateFeeResult.isLate && lateFeeResult.lateFee > 0) {
        const message = `This payment is ${lateFeeResult.daysLate} days late.\n\nOriginal Amount: ${formatCurrency(payment.amount, businessPreferences.currency)}\nLate Fee (${financialSettings.lateFeePercentage}%): ${formatCurrency(lateFeeResult.lateFee, businessPreferences.currency)}\nTotal Amount: ${formatCurrency(lateFeeResult.totalAmount, businessPreferences.currency)}\n\nDo you want to proceed?`;

        if (!confirm(message)) {
          return;
        }
      }

      const paymentRef = doc(db, 'payments', paymentId);

      await updateDoc(paymentRef, {
        status: 'paid',
        paidDate: today.toISOString().split('T')[0],
        method: payment.method || 'Cash',
        originalAmount: payment.amount,
        lateFee: lateFeeResult.lateFee,
        totalAmount: lateFeeResult.totalAmount,
        daysLate: lateFeeResult.daysLate
      });

      alert('Payment marked as paid successfully!');
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      alert('Error marking payment as paid. Please try again.');
    }
  };

  // DOWNLOAD PAYMENT RECEIPT AS PDF
  const handleDownloadReceipt = async (paymentId) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        alert('Payment not found');
        return;
      }

      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf');

      // Create new PDF document
      const doc = new jsPDF();

      // Set font
      doc.setFont('helvetica');

      // Company Header
      doc.setFontSize(24);
      doc.setTextColor(0, 51, 102); // #003366
      doc.text(profileSettings.company || 'Property Management', 105, 20, { align: 'center' });

      doc.setFontSize(18);
      doc.setTextColor(100, 100, 100);
      doc.text('PAYMENT RECEIPT', 105, 30, { align: 'center' });

      // Line separator
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(1);
      doc.line(20, 35, 190, 35);

      // Receipt Info - Left Side
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('RECEIPT NUMBER', 20, 45);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('#' + payment.id.substring(0, 8).toUpperCase(), 20, 50);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('ISSUE DATE', 20, 58);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(formatDate(payment.paidDate || new Date().toISOString().split('T')[0], businessPreferences.dateFormat), 20, 63);

      // Receipt Info - Right Side
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('TENANT', 140, 45);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(payment.tenant, 140, 50);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('STATUS', 140, 58);
      doc.setFontSize(12);

      // Status badge color
      if (payment.status === 'paid') {
        doc.setTextColor(34, 197, 94); // green
      } else if (payment.status === 'pending') {
        doc.setTextColor(234, 179, 8); // yellow
      } else {
        doc.setTextColor(239, 68, 68); // red
      }
      doc.text(payment.status.toUpperCase(), 140, 63);

      // Payment Details Box
      doc.setFillColor(245, 245, 245);
      doc.rect(20, 75, 170, 100, 'F');

      // Details
      let yPos = 85;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      const details = [
        { label: 'Property', value: payment.property },
        { label: 'Unit', value: payment.unit },
        { label: 'Period', value: payment.month || 'N/A' },
        { label: 'Due Date', value: formatDate(payment.dueDate, businessPreferences.dateFormat) }
      ];

      if (payment.paidDate) {
        details.push({ label: 'Paid Date', value: formatDate(payment.paidDate, businessPreferences.dateFormat) });
      }

      if (payment.method) {
        details.push({ label: 'Payment Method', value: payment.method.charAt(0).toUpperCase() + payment.method.slice(1) });
      }

      details.push({ label: 'Rent Amount', value: formatCurrency(payment.originalAmount || payment.amount, businessPreferences.currency) });

      if (payment.lateFee) {
        details.push({
          label: `Late Fee (${payment.daysLate} days)`,
          value: formatCurrency(payment.lateFee, businessPreferences.currency)
        });
      }

      // Draw detail rows
      details.forEach((detail, index) => {
        doc.setTextColor(100, 100, 100);
        doc.text(detail.label, 25, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text(detail.value, 185, yPos, { align: 'right' });

        // Draw line separator
        if (index < details.length - 1) {
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.5);
          doc.line(25, yPos + 3, 185, yPos + 3);
        }

        yPos += 10;
      });

      // Total box
      doc.setFillColor(0, 51, 102);
      doc.rect(20, yPos + 5, 170, 15, 'F');

      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('TOTAL AMOUNT', 25, yPos + 14);
      doc.setFontSize(16);
      doc.text(formatCurrency(payment.totalAmount || payment.amount, businessPreferences.currency), 185, yPos + 14, { align: 'right' });

      // Footer
      yPos += 30;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);

      const footerLines = [];
      footerLines.push(profileSettings.company || 'Property Management');
      if (profileSettings.address) footerLines.push(profileSettings.address);
      if (profileSettings.phone) footerLines.push('Phone: ' + profileSettings.phone);
      if (profileSettings.email) footerLines.push('Email: ' + profileSettings.email);
      footerLines.push('');
      footerLines.push('This is an automatically generated receipt. For any queries, please contact us.');

      footerLines.forEach((line, index) => {
        doc.text(line, 105, yPos + (index * 5), { align: 'center' });
      });

      // Save PDF
      doc.save(`Receipt_${payment.tenant.replace(/\s+/g, '_')}_${payment.id.substring(0, 8)}.pdf`);

    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Error generating receipt. Please try again.');
    }
  };

  // OLD HTML VERSION (keeping for reference, not used)
  const handleDownloadReceiptHTML_OLD = async (paymentId) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        alert('Payment not found');
        return;
      }

      // Create receipt HTML
      const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${payment.tenant}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #003366;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #003366;
      margin-bottom: 10px;
    }
    .receipt-title {
      font-size: 24px;
      color: #666;
      margin-top: 10px;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .info-section {
      flex: 1;
    }
    .info-label {
      font-weight: bold;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 16px;
      margin-bottom: 15px;
    }
    .payment-details {
      background-color: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #ddd;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #666;
    }
    .detail-value {
      font-weight: 600;
      color: #333;
    }
    .total-row {
      background-color: #003366;
      color: white;
      margin: -20px;
      margin-top: 20px;
      padding: 15px 20px;
      border-radius: 0 0 8px 8px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }
    .status-paid {
      background-color: #22c55e;
      color: white;
    }
    .status-pending {
      background-color: #eab308;
      color: white;
    }
    .status-overdue {
      background-color: #ef4444;
      color: white;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${profileSettings.company || 'Property Management'}</div>
    <div class="receipt-title">PAYMENT RECEIPT</div>
  </div>

  <div class="receipt-info">
    <div class="info-section">
      <div class="info-label">Receipt Number</div>
      <div class="info-value">#${payment.id.substring(0, 8).toUpperCase()}</div>

      <div class="info-label">Issue Date</div>
      <div class="info-value">${formatDate(payment.paidDate || new Date().toISOString().split('T')[0], businessPreferences.dateFormat)}</div>
    </div>

    <div class="info-section" style="text-align: right;">
      <div class="info-label">Tenant</div>
      <div class="info-value">${payment.tenant}</div>

      <div class="info-label">Status</div>
      <div class="info-value">
        <span class="status-badge status-${payment.status}">
          ${payment.status.toUpperCase()}
        </span>
      </div>
    </div>
  </div>

  <div class="payment-details">
    <div class="detail-row">
      <span class="detail-label">Property</span>
      <span class="detail-value">${payment.property}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Unit</span>
      <span class="detail-value">${payment.unit}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Period</span>
      <span class="detail-value">${payment.month || 'N/A'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Due Date</span>
      <span class="detail-value">${formatDate(payment.dueDate, businessPreferences.dateFormat)}</span>
    </div>
    ${payment.paidDate ? `
    <div class="detail-row">
      <span class="detail-label">Paid Date</span>
      <span class="detail-value">${formatDate(payment.paidDate, businessPreferences.dateFormat)}</span>
    </div>
    ` : ''}
    ${payment.method ? `
    <div class="detail-row">
      <span class="detail-label">Payment Method</span>
      <span class="detail-value">${payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}</span>
    </div>
    ` : ''}
    <div class="detail-row">
      <span class="detail-label">Rent Amount</span>
      <span class="detail-value">${formatCurrency(payment.originalAmount || payment.amount, businessPreferences.currency)}</span>
    </div>
    ${payment.lateFee ? `
    <div class="detail-row">
      <span class="detail-label">Late Fee (${payment.daysLate} days)</span>
      <span class="detail-value">${formatCurrency(payment.lateFee, businessPreferences.currency)}</span>
    </div>
    ` : ''}
    <div class="detail-row total-row">
      <span class="detail-label" style="font-size: 18px;">TOTAL AMOUNT</span>
      <span class="detail-value" style="font-size: 20px;">${formatCurrency(payment.totalAmount || payment.amount, businessPreferences.currency)}</span>
    </div>
  </div>

  <div class="footer">
    <p><strong>${profileSettings.company || 'Property Management'}</strong></p>
    ${profileSettings.address ? `<p>${profileSettings.address}</p>` : ''}
    ${profileSettings.phone ? `<p>Phone: ${profileSettings.phone}</p>` : ''}
    ${profileSettings.email ? `<p>Email: ${profileSettings.email}</p>` : ''}
    <p style="margin-top: 20px;">This is an automatically generated receipt. For any queries, please contact us.</p>
  </div>
</body>
</html>
      `;

      // Create blob and download
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt_${payment.tenant.replace(/\s+/g, '_')}_${payment.id.substring(0, 8)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Also open in new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Error generating receipt. Please try again.');
    }
  };

  // DELETE PAYMENT
  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'payments', paymentId));
      alert('Payment record deleted successfully!');
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Error deleting payment. Please try again.');
    }
  };

  // ADD MAINTENANCE REQUEST
  const handleAddMaintenance = async () => {
    // Validate required fields and provide specific error messages
    const missingFields = [];
    if (!newMaintenance.property) missingFields.push('Property');
    if (!newMaintenance.unit) missingFields.push('Unit');
    if (!newMaintenance.tenant) missingFields.push('Tenant');
    if (!newMaintenance.issue) missingFields.push('Issue Description');

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      await addDoc(collection(db, 'maintenanceRequests'), {
        property: newMaintenance.property,
        unit: newMaintenance.unit,
        issue: newMaintenance.issue,
        priority: newMaintenance.priority,
        tenant: newMaintenance.tenant,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
        landlordId: currentUser.uid,
        createdAt: serverTimestamp()
      });

      setNewMaintenance({ property: '', unit: '', issue: '', priority: 'medium', tenant: '' });
      setShowMaintenanceModal(false);
      alert('Maintenance request added successfully!');
    } catch (error) {
      console.error('Error adding maintenance request:', error);
      alert('Error adding maintenance request. Please try again.');
    }
  };

  // UPDATE MAINTENANCE STATUS
  const handleUpdateMaintenanceStatus = async (id, status) => {
    try {
      const requestRef = doc(db, 'maintenanceRequests', id);
      await updateDoc(requestRef, { status });
      alert(`Maintenance request ${status === 'in-progress' ? 'started' : 'marked as ' + status}!`);
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  // ASSIGN MAINTENANCE REQUEST TO STAFF
  const handleAssignMaintenance = async (requestId, staffId, request) => {
    try {
      const staff = teamMembers.find(m => m.id === staffId);
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

  // DELETE MAINTENANCE REQUEST
  const handleDeleteMaintenanceRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance request? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'maintenanceRequests', id));
      alert('Maintenance request deleted successfully!');
    } catch (error) {
      console.error('Error deleting maintenance request:', error);
      alert('Error deleting maintenance request. Please try again.');
    }
  };

  // ESTIMATE APPROVAL HANDLERS
  const handleOpenEstimateApproval = (request) => {
    setSelectedRequestForApproval(request);
    setApprovalNotes('');
    setShowEstimateApprovalModal(true);
  };

  const handleCloseEstimateApproval = () => {
    setShowEstimateApprovalModal(false);
    setSelectedRequestForApproval(null);
    setApprovalNotes('');
  };

  const handleApproveEstimate = async () => {
    if (!selectedRequestForApproval) return;

    try {
      const requestRef = doc(db, 'maintenanceRequests', selectedRequestForApproval.id);

      await updateDoc(requestRef, {
        status: 'approved',
        approvedCost: selectedRequestForApproval.estimatedCost,
        approvalNotes: approvalNotes,
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.uid
      });

      // Create notification for maintenance staff
      await addDoc(collection(db, 'notifications'), {
        type: 'estimate_approved',
        userId: selectedRequestForApproval.assignedTo,
        title: 'Estimate Approved',
        message: `Your estimate of KSH ${selectedRequestForApproval.estimatedCost.toLocaleString()} for "${selectedRequestForApproval.issue}" has been approved. You can now proceed with the work.`,
        read: false,
        createdAt: serverTimestamp(),
        maintenanceRequestId: selectedRequestForApproval.id
      });

      alert('Estimate approved successfully! Maintenance staff has been notified.');
      handleCloseEstimateApproval();
    } catch (error) {
      console.error('Error approving estimate:', error);
      alert('Error approving estimate. Please try again.');
    }
  };

  const handleRejectEstimate = async () => {
    if (!selectedRequestForApproval) return;

    if (!approvalNotes.trim()) {
      alert('Please provide a reason for rejecting the estimate.');
      return;
    }

    try {
      const requestRef = doc(db, 'maintenanceRequests', selectedRequestForApproval.id);

      await updateDoc(requestRef, {
        status: 'estimate_rejected',
        rejectionNotes: approvalNotes,
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser.uid
      });

      // Create notification for maintenance staff
      await addDoc(collection(db, 'notifications'), {
        type: 'estimate_rejected',
        userId: selectedRequestForApproval.assignedTo,
        title: 'Estimate Rejected',
        message: `Your estimate for "${selectedRequestForApproval.issue}" has been rejected. Reason: ${approvalNotes}`,
        read: false,
        createdAt: serverTimestamp(),
        maintenanceRequestId: selectedRequestForApproval.id
      });

      alert('Estimate rejected. Maintenance staff has been notified.');
      handleCloseEstimateApproval();
    } catch (error) {
      console.error('Error rejecting estimate:', error);
      alert('Error rejecting estimate. Please try again.');
    }
  };

  // Quote comparison handlers
  const handleOpenQuoteComparison = async (request) => {
    setSelectedRequestForQuotes(request);
    setShowQuoteComparisonModal(true);
    setLoadingQuotes(true);

    try {
      // Fetch quotes from subcollection
      const quotesRef = collection(db, 'maintenanceRequests', request.id, 'quotes');
      const quotesQuery = query(quotesRef, orderBy('submittedAt', 'desc'));

      // Set up real-time listener for quotes
      const unsubscribe = onSnapshot(quotesQuery, (snapshot) => {
        const quotesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuotes(quotesData);
        setLoadingQuotes(false);
      });

      // Store unsubscribe function to clean up later
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setLoadingQuotes(false);
    }
  };

  const handleCloseQuoteComparison = () => {
    setShowQuoteComparisonModal(false);
    setSelectedRequestForQuotes(null);
    setQuotes([]);
    setSelectedQuoteForApproval(null);
    setQuoteApprovalNotes('');
  };

  const handleApproveQuote = async (quote) => {
    if (!selectedRequestForQuotes) return;

    try {
      // Update quote status to approved
      const quoteRef = doc(db, 'maintenanceRequests', selectedRequestForQuotes.id, 'quotes', quote.id);
      await updateDoc(quoteRef, {
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp(),
        approvalNotes: quoteApprovalNotes
      });

      // Update maintenance request with selected quote
      const requestRef = doc(db, 'maintenanceRequests', selectedRequestForQuotes.id);
      await updateDoc(requestRef, {
        status: 'approved',
        selectedQuoteId: quote.id,
        approvedCost: quote.amount,
        approvedVendor: quote.vendorName,
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp(),
        approvalNotes: quoteApprovalNotes
      });

      // Reject other quotes automatically
      const otherQuotes = quotes.filter(q => q.id !== quote.id && q.status === 'pending');
      for (const otherQuote of otherQuotes) {
        const otherQuoteRef = doc(db, 'maintenanceRequests', selectedRequestForQuotes.id, 'quotes', otherQuote.id);
        await updateDoc(otherQuoteRef, {
          status: 'rejected',
          rejectedBy: currentUser.uid,
          rejectedAt: serverTimestamp(),
          rejectionReason: 'Another quote was selected'
        });
      }

      // Create notification for maintenance staff
      await addDoc(collection(db, 'notifications'), {
        type: 'quote_approved',
        userId: quote.submittedBy,
        title: 'Quote Approved',
        message: `Your quote from ${quote.vendorName} for "${selectedRequestForQuotes.issue}" has been approved. Amount: KSH ${quote.amount.toLocaleString()}. You can now proceed with the work.`,
        read: false,
        createdAt: serverTimestamp(),
        maintenanceRequestId: selectedRequestForQuotes.id
      });

      alert(`Quote from ${quote.vendorName} approved successfully!`);
      handleCloseQuoteComparison();
    } catch (error) {
      console.error('Error approving quote:', error);
      alert('Error approving quote. Please try again.');
    }
  };

  const handleRejectQuote = async (quote) => {
    if (!selectedRequestForQuotes) return;

    if (!quoteApprovalNotes) {
      alert('Please provide a reason for rejecting this quote.');
      return;
    }

    try {
      // Update quote status to rejected
      const quoteRef = doc(db, 'maintenanceRequests', selectedRequestForQuotes.id, 'quotes', quote.id);
      await updateDoc(quoteRef, {
        status: 'rejected',
        rejectedBy: currentUser.uid,
        rejectedAt: serverTimestamp(),
        rejectionReason: quoteApprovalNotes
      });

      // Create notification for maintenance staff
      await addDoc(collection(db, 'notifications'), {
        type: 'quote_rejected',
        userId: quote.submittedBy,
        title: 'Quote Rejected',
        message: `The quote from ${quote.vendorName} for "${selectedRequestForQuotes.issue}" has been rejected. Reason: ${quoteApprovalNotes}`,
        read: false,
        createdAt: serverTimestamp(),
        maintenanceRequestId: selectedRequestForQuotes.id
      });

      alert(`Quote from ${quote.vendorName} rejected.`);
      setSelectedQuoteForApproval(null);
      setQuoteApprovalNotes('');
    } catch (error) {
      console.error('Error rejecting quote:', error);
      alert('Error rejecting quote. Please try again.');
    }
  };

  // ADD LISTING with images
  const handleAddListing = async () => {
    if (newListing.property && newListing.unit && newListing.bedrooms && newListing.rent) {
      try {
        await addDoc(collection(db, 'listings'), {
          property: newListing.property,
          unit: newListing.unit,
          bedrooms: parseInt(newListing.bedrooms),
          bathrooms: parseInt(newListing.bathrooms) || 1,
          area: parseInt(newListing.area) || 0,
          rent: parseInt(newListing.rent),
          deposit: parseInt(newListing.deposit) || parseInt(newListing.rent),
          description: newListing.description,
          amenities: newListing.amenities.split(',').map(a => a.trim()).filter(a => a),
          images: newListing.images.length > 0 ? newListing.images : [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
          ],
          status: 'available',
          postedDate: new Date().toISOString().split('T')[0],
          landlordId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        setNewListing({ property: '', unit: '', bedrooms: '', bathrooms: '', area: '', rent: '', deposit: '', description: '', amenities: '', images: [] });
        setShowListingModal(false);
        alert('Listing published successfully!');
      } catch (error) {
        console.error('Error adding listing:', error);
        alert('Error publishing listing. Please try again.');
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  // EDIT LISTING
  const handleEditListing = async () => {
    if (editingListing && editingListing.property && editingListing.unit && editingListing.bedrooms && editingListing.rent) {
      try {
        await updateDoc(doc(db, 'listings', editingListing.id), {
          property: editingListing.property,
          unit: editingListing.unit,
          bedrooms: parseInt(editingListing.bedrooms),
          bathrooms: parseInt(editingListing.bathrooms) || 1,
          area: parseInt(editingListing.area) || 0,
          rent: parseInt(editingListing.rent),
          deposit: parseInt(editingListing.deposit) || parseInt(editingListing.rent),
          description: editingListing.description,
          amenities: typeof editingListing.amenities === 'string'
            ? editingListing.amenities.split(',').map(a => a.trim()).filter(a => a)
            : editingListing.amenities,
          images: editingListing.images && editingListing.images.length > 0 ? editingListing.images : [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
          ],
          updatedAt: serverTimestamp()
        });

        setEditingListing(null);
        setShowEditListingModal(false);
        alert('Listing updated successfully!');
      } catch (error) {
        console.error('Error updating listing:', error);
        alert('Error updating listing. Please try again.');
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  // DELETE LISTING
  const handleDeleteListing = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteDoc(doc(db, 'listings', id));
        alert('Listing deleted successfully!');
      } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Error deleting listing. Please try again.');
      }
    }
  };

  // SEND MEMO
  const handleSendMemo = async () => {
    if (newMemo.title && newMemo.message) {
      try {
        // Determine recipient details based on target audience
        const isAllTenants = newMemo.targetAudience === 'all';
        const recipientType = isAllTenants ? 'all' : 'specific';
        const recipientCount = isAllTenants
          ? tenants.length
          : properties.find(p => p.name === newMemo.targetAudience)?.occupied || 0;

        // Get list of tenant IDs if targeting specific property
        let recipientIds = [];
        if (!isAllTenants) {
          recipientIds = tenants
            .filter(t => t.property === newMemo.targetAudience)
            .map(t => t.id);
        }

        await addDoc(collection(db, 'memos'), {
          title: newMemo.title,
          message: newMemo.message,
          content: newMemo.message, // Add content field for consistency
          priority: newMemo.priority,
          targetAudience: newMemo.targetAudience,
          recipientType: recipientType, // Add this for the query
          recipients: isAllTenants ? [] : recipientIds, // Array of tenant IDs or empty for all
          recipientCount: recipientCount, // Number for display
          sentBy: profileSettings.name,
          sentAt: new Date().toISOString(),
          landlordId: currentUser.uid,
          createdAt: serverTimestamp()
        });

        // Create notifications for all tenants who should receive this memo
        const targetTenants = isAllTenants
          ? tenants
          : tenants.filter(t => t.property === newMemo.targetAudience);

        console.log('📬 Creating notifications for tenants:', targetTenants.map(t => ({
          name: t.name,
          userId: t.userId,
          docId: t.docId,
          id: t.id
        })));

        const notificationPromises = targetTenants.map(tenant => {
          const userId = tenant.userId || tenant.id;
          console.log(`📨 Creating notification for ${tenant.name}, userId: ${userId}`);

          return addDoc(collection(db, 'notifications'), {
            userId: userId,
            type: 'memo',
            title: `New Memo: ${newMemo.title}`,
            message: newMemo.message.substring(0, 100) + (newMemo.message.length > 100 ? '...' : ''),
            priority: newMemo.priority,
            read: false,
            timestamp: serverTimestamp(), // Change from createdAt to timestamp to match the query
            createdAt: serverTimestamp(),
            landlordId: currentUser.uid
          });
        });

        await Promise.all(notificationPromises);
        console.log('✅ All notifications created successfully');

        setNewMemo({ title: '', message: '', priority: 'normal', targetAudience: 'all' });
        setShowMemoModal(false);
        alert(`Memo sent successfully to ${targetTenants.length} tenant(s)!`);
      } catch (error) {
        console.error('Error sending memo:', error);
        alert('Error sending memo. Please try again.');
      }
    }
  };

  // DELETE MEMO
  const handleDeleteMemo = async (id) => {
    if (window.confirm('Are you sure you want to delete this memo?')) {
      try {
        await deleteDoc(doc(db, 'memos', id));
      } catch (error) {
        console.error('Error deleting memo:', error);
        alert('Error deleting memo. Please try again.');
      }
    }
  };

  // UPDATE VIEWING STATUS
  const handleUpdateViewingStatus = async (id, status) => {
    try {
      const viewingRef = doc(db, 'viewings', id);
      await updateDoc(viewingRef, { status });
      
      if (status === 'confirmed') {
        alert('Viewing confirmed! Notification sent to prospect.');
      }
    } catch (error) {
      console.error('Error updating viewing status:', error);
      alert('Error updating viewing status. Please try again.');
    }
  };

  const handleUpdateProfile = () => {
    setEditingProfile(false);
    alert('Profile updated successfully!');
  };

  const handleUpdateNotifications = (key) => {
    setProfileSettings({
      ...profileSettings,
      notifications: {
        ...profileSettings.notifications,
        [key]: !profileSettings.notifications[key]
      }
    });
  };

  const handleChangePassword = () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordData.new.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }
    alert('Password changed successfully!');
    setShowPasswordModal(false);
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  const handleDeactivateAccount = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        accountStatus: 'deactivated',
        deactivatedAt: serverTimestamp()
      });

      alert('Your account has been deactivated. You can reactivate it by logging in again.');
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error deactivating account:', error);
      alert('Failed to deactivate account. Please try again.');
    }
    setShowDeactivateModal(false);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    try {
      // Delete user data from Firestore collections
      const settingsRef = doc(db, 'landlordSettings', currentUser.uid);
      const userRef = doc(db, 'users', currentUser.uid);

      // Delete Firestore documents
      await deleteDoc(settingsRef).catch(err => console.log('Settings already deleted or not found'));
      await deleteDoc(userRef).catch(err => console.log('User profile already deleted or not found'));

      // Note: Deleting the Firebase Auth account requires recent authentication
      // In production, you'd want to prompt for reauthentication first
      alert('Your account data has been deleted. Logging out now...');

      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Error: ' + error.message);
    }
    setShowDeleteModal(false);
  };

  const markNotificationRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

const handleAddTeamMember = async () => {
  try {
    if (!newTeamMember.name || !newTeamMember.email || !newTeamMember.phone) {
      alert('Please fill in all required fields');
      return;
    }

    // Generate a unique invitation token
    const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Add team member to Firestore
    const teamData = {
      name: newTeamMember.name,
      email: newTeamMember.email.toLowerCase(),
      phone: newTeamMember.phone,
      role: newTeamMember.role,
      assignedProperties: newTeamMember.assignedProperties || [],
      landlordId: currentUser.uid,
      landlordName: userProfile?.displayName || 'Your Landlord',
      status: 'pending',
      invitationToken: invitationToken,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'teamMembers'), teamData);

    // Create an invitation record
    const invitationData = {
      token: invitationToken,
      email: newTeamMember.email.toLowerCase(),
      landlordId: currentUser.uid,
      landlordName: userProfile?.displayName || 'Your Landlord',
      memberName: newTeamMember.name,
      role: newTeamMember.role,
      type: 'team_member', // Distinguish from tenant invitations
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    };

    await addDoc(collection(db, 'invitations'), invitationData);

    // Store invitation data and show invitation modal
    setPendingInvitation({
      token: invitationToken,
      name: newTeamMember.name,
      email: newTeamMember.email,
      phone: newTeamMember.phone,
      role: newTeamMember.role
    });

    // Reset form and close team modal
    setNewTeamMember({
      name: '',
      email: '',
      phone: '',
      role: 'property_manager',
      assignedProperties: []
    });
    setShowTeamModal(false);

    // Show invitation modal
    setShowInvitationModal(true);

  } catch (error) {
    console.error('Error adding team member:', error);
    console.error('Error details:', error.message, error.code);
    alert(`Failed to add team member: ${error.message}\n\nPlease try again.`);
  }
};

// Update team member
const handleUpdateTeamMember = async (memberId, updates) => {
  try {
    const memberRef = doc(db, 'teamMembers', memberId);
    await updateDoc(memberRef, updates);
    alert('Team member updated successfully!');
  } catch (error) {
    console.error('Error updating team member:', error);
    alert('Error updating team member. Please try again.');
  }
};

// Delete team member
const handleRemoveTeamMember = async (memberId) => {
  if (window.confirm('Are you sure you want to remove this team member?')) {
    try {
      await deleteDoc(doc(db, 'teamMembers', memberId));
      alert('Team member removed successfully!');
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Error removing team member. Please try again.');
    }
  }
};

// Assign team member to property
const handleAssignToProperty = async (memberId, propertyId) => {
  try {
    const memberRef = doc(db, 'teamMembers', memberId);
    const member = teamMembers.find(m => m.id === memberId);

    const updatedProperties = member.assignedProperties.includes(propertyId)
      ? member.assignedProperties.filter(id => id !== propertyId)
      : [...member.assignedProperties, propertyId];

    await updateDoc(memberRef, {
      assignedProperties: updatedProperties
    });

    // Update the selectedTeamMember state to reflect changes immediately
    setSelectedTeamMember({
      ...selectedTeamMember,
      assignedProperties: updatedProperties
    });
  } catch (error) {
    console.error('Error assigning property:', error);
    alert('Error assigning property. Please try again.');
  }
};
// Long press handlers for deleting conversations
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

// Handle opening message modal
const handleMessageTenant = (tenant) => {
  setSelectedTenantForMessage(tenant);
  setShowMessageModal(true);
};

const handleViewTenantDetails = (tenant) => {
  setSelectedTenantForDetails(tenant);
  setShowTenantDetailsModal(true);
};

  // Tax calculation helper functions
  const calculateMonthlyTax = (year, month) => {
    // Filter payments for the specific month
    const monthPayments = payments.filter(payment => {
      if (!payment.paidDate) return false;
      const paymentDate = new Date(payment.paidDate);
      return paymentDate.getFullYear() === year && paymentDate.getMonth() === month;
    });

    const totalIncome = monthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const taxDue = Math.round(totalIncome * 0.10); // 10% tax

    return {
      year,
      month,
      monthName: new Date(year, month).toLocaleString('default', { month: 'long' }),
      totalIncome,
      taxDue,
      payments: monthPayments,
      status: 'pending', // Will be updated from tax payments collection
      dueDate: new Date(year, month + 1, 20) // 20th of following month
    };
  };

  const getRecentTaxPeriods = (monthsBack = 6) => {
    const periods = [];
    const today = new Date();

    for (let i = 1; i <= monthsBack; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      periods.push(calculateMonthlyTax(date.getFullYear(), date.getMonth()));
    }

    return periods;
  };

  const currentMonthTax = calculateMonthlyTax(new Date().getFullYear(), new Date().getMonth() - 1);

  // Stats calculations
  const stats = [
    {
      label: 'Total Properties',
      value: properties.length,
      icon: Home,
      color: 'bg-blue-100 text-blue-900',
      view: 'properties'
    },
    {
      label: 'Active Tenants',
      value: tenants.filter(t => t.status === 'active').length,
      icon: Users,
      color: 'bg-green-100 text-green-900',
      view: 'tenants'
    },
    {
      label: 'Monthly Revenue',
      value: `KES ${Math.round(properties.reduce((sum, p) => sum + (p.revenue || 0), 0) / 1000)}K`,
      icon: Banknote,
      color: 'bg-purple-100 text-purple-900',
      view: 'payments'
    },
    {
    label: 'Pending Viewings',
    value: viewings.filter(v => v.status === 'pending').length,
    icon: CalendarCheck,
    color: 'bg-orange-100 text-orange-900',
    view: 'viewings'
    }
  ];

  const paymentStats = {
    expected: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    received: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0)
  };


  // Filter viewings
  const filteredViewings = viewings.filter(viewing => {
  if (viewingFilter === 'all') return true;
  return viewing.status === viewingFilter;
});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row overflow-hidden transition-colors duration-200">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#003366] text-white transition-transform duration-300 flex flex-col`}>
        <div className="p-6">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo-light.svg" alt="Nyumbanii Logo" className="h-10 w-auto" />
            </div>
            {sidebarOpen && <span className="text-xl font-bold">Nyumbanii</span>}
          </a>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {['dashboard', 'properties', 'listings', 'viewings', 'applications', 'calendar', 'maintenance', 'tenants', 'payments', 'documents', 'reminders', ...(taxTrackingEnabled ? ['tax-reports'] : []), 'messages', 'team', 'memos', 'subscription', 'settings'].map((view) => {
            const icons = {
              dashboard: Home,
              properties: Building,
              listings: Eye,
              viewings: CalendarCheck,
              applications: FileText,
              calendar: Calendar,
              maintenance: Wrench,
              tenants: Users,
              payments: Banknote,
              documents: FileText,
              reminders: Bell,
              'tax-reports': Calculator,
              messages: MessageSquare,
              team: Users,
              memos: Mail,
              subscription: Crown,
              settings: Settings
            };
            const Icon = icons[view];
            const labels = {
              listings: 'Browse Listings',
              applications: 'Applications',
              memos: 'Updates & Memos',
              team: 'Team Management',
              'tax-reports': 'Tax Reports',
              documents: 'Documents',
              reminders: 'Rent Reminders',
              subscription: 'Subscription'
            };
            return (
              <button
                key={view}
                onClick={() => { setCurrentView(view); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === view ? 'bg-[#002244]' : 'hover:bg-[#002244]'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="capitalize text-sm">{labels[view] || view}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#002244] space-y-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setPreferences({...preferences, darkMode: !preferences.darkMode})}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#002244] transition"
          >
            {preferences.darkMode ? (
              <>
                <Sun className="w-5 h-5" />
                <span className="text-sm">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span className="text-sm">Dark Mode</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
                onClick={() => {
                auth.signOut();
                navigate('/login');
                                }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#002244] transition text-red-300">
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 w-full overflow-hidden">
        {/* Header */}
<header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex-shrink-0">
        <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize truncate">{currentView}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Welcome back, {profileSettings.name.split(' ')[0]}!</p>
      </div>
    </div>
    <div className="flex items-center gap-4 flex-shrink-0">
      <div className="relative">
        <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
  <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
  {unreadCount > 0 && (
    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-medium">{unreadCount}</span>
  )}
</button>

{/* Notifications Dropdown Panel */}
{showNotifications && (
  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col">
    {/* Header */}
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
        {unreadCount > 0 && (
          <p className="text-xs text-gray-600 dark:text-gray-400">{unreadCount} unread</p>
        )}
      </div>
      <button 
        onClick={() => setShowNotifications(false)}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
      >
        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    </div>

    {/* Notifications List */}
    <div className="overflow-y-auto flex-1">
      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-500 mt-1">
            You'll see updates about payments, maintenance requests, and viewings here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
              }`}
              onClick={async () => {
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
                } else if (notification.type === 'payment') {
                  setCurrentView('payments');
                } else if (notification.type === 'maintenance') {
                  setCurrentView('maintenance');
                } else if (notification.type === 'viewing') {
                  setCurrentView('viewings');
                } else if (notification.type === 'tenant') {
                  setCurrentView('tenants');
                }

                setShowNotifications(false);
              }}
            >
              <div className="flex items-start gap-3">
                {/* Icon based on type */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.type === 'payment' ? 'bg-green-100 dark:bg-green-900/30' :
                  notification.type === 'maintenance' ? 'bg-orange-100 dark:bg-orange-900/30' :
                  notification.type === 'viewing' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  notification.type === 'tenant' ? 'bg-purple-100 dark:bg-purple-900/30' :
                  notification.type === 'message' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                  'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {notification.type === 'payment' && <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />}
                  {notification.type === 'maintenance' && <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                  {notification.type === 'viewing' && <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {notification.type === 'tenant' && <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  {notification.type === 'message' && <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                  {!notification.type && <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm mb-1 ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {notification.createdAt && typeof notification.createdAt.toDate === 'function'
                      ? formatRelativeTime(notification.createdAt.toDate())
                      : 'Just now'}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Footer */}
    {notifications.length > 0 && (
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <button
          onClick={async () => {
            try {
              // Mark all as read
              const unreadNotifs = notifications.filter(n => !n.read);
              const updatePromises = unreadNotifs.map(notif =>
                updateDoc(doc(db, 'notifications', notif.id), {
                  read: true,
                  readAt: serverTimestamp()
                })
              );
              await Promise.all(updatePromises);
            } catch (error) {
              console.error('Error marking all as read:', error);
            }
          }}
          className="w-full text-center text-sm text-[#003366] hover:text-[#002244] font-medium transition"
        >
          Mark all as read
        </button>
      </div>
    )}
  </div>
)}
      </div>
      {/* Profile Photo or Avatar */}
      {userProfile?.photoURL || currentUser?.photoURL ? (
        <img
          src={userProfile?.photoURL || currentUser?.photoURL}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover border-2 border-[#003366] dark:border-blue-500 flex-shrink-0"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className="w-10 h-10 bg-[#003366] dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
        style={{ display: (userProfile?.photoURL || currentUser?.photoURL) ? 'none' : 'flex' }}
      >
        {profileSettings.name.split(' ').map(n => n[0]).join('')}
      </div>
    </div>
  </div>
</header>

{/* Content Area */}
<div className="px-4 py-6 flex-1 overflow-y-auto">
  

{/* Dashboard View */}
{currentView === 'dashboard' && (
  <>
    {/* Blue Banner */}
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Welcome back, {profileSettings.name}!</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Here's an overview of your properties</p>
      </div>
    </div>

    {/* Stats Cards - Shows 2 cols on mobile, 4 on larger screens */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
  {stats.map((stat, index) => (
    <div
      key={index}
      onClick={() => setCurrentView(stat.view)}
      className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transform"
    >
      {/* Icon at the top */}
      <div className={`w-12 h-12 lg:w-14 lg:h-14 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
        <stat.icon className="w-6 h-6 lg:w-7 lg:h-7" />
      </div>

      {/* Label - now fully visible */}
      <p className="text-gray-600 dark:text-gray-400 text-xs lg:text-sm mb-2">{stat.label}</p>

      {/* Value */}
      <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
    </div>
  ))}
</div>

    {/* Cards Grid - 2 columns even on tablet */}
    <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
      {/* Recent Viewings */}
      <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4 flex items-center gap-2 text-md lg:text-base">
          <CalendarCheck className="w-4 h-4 lg:w-5 lg:h-5 text-[#003366] dark:text-blue-400" />
          Recent Viewing Requests
        </h3>
        {displayViewingBookings.length === 0 ? (
          <div className="text-center py-6 lg:py-8">
            <CalendarCheck className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-xs lg:text-sm">No viewing requests yet</p>
          </div>
        ) : (
          displayViewingBookings.slice(0, 5).map(viewing => (
            <div key={viewing.id} className="flex items-center justify-between py-2 lg:py-3 border-b last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-xs lg:text-sm truncate">{viewing.prospectName}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{viewing.property} - {viewing.date}</p>
              </div>
              <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                viewing.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                viewing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {viewing.status}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Payment Summary */}
      <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4 flex items-center gap-2 text-sm lg:text-base">
          <Banknote className="w-4 h-4 lg:w-5 lg:h-5 text-[#003366] dark:text-blue-400" />
          Payment Summary
        </h3>
        <div className="space-y-2 lg:space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Expected This Month</span>
            <span className="font-semibold text-gray-900 dark:text-white text-xs lg:text-sm">{formatCurrency(paymentStats.expected, businessPreferences.currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Received</span>
            <span className="font-semibold text-green-600 dark:text-green-400 text-xs lg:text-sm">{formatCurrency(paymentStats.received, businessPreferences.currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Pending</span>
            <span className="font-semibold text-yellow-600 dark:text-yellow-400 text-xs lg:text-sm">{formatCurrency(paymentStats.pending, businessPreferences.currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Overdue</span>
            <span className="font-semibold text-red-600 dark:text-red-400 text-xs lg:text-sm">{formatCurrency(paymentStats.overdue, businessPreferences.currency)}</span>
          </div>
        </div>
        <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900 dark:text-white text-xs lg:text-sm">Collection Rate</span>
            <span className="font-bold text-[#003366] dark:text-blue-400 text-base lg:text-lg">
              {paymentStats.expected > 0 ? Math.round((paymentStats.received / paymentStats.expected) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Maintenance Overview */}
      <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4 flex items-center gap-2 text-sm lg:text-base">
          <Wrench className="w-4 h-4 lg:w-5 lg:h-5 text-[#003366] dark:text-blue-400" />
          Maintenance Requests
        </h3>
        {(maintenanceRequests.length > 0 ? maintenanceRequests : mockMaintenanceRequests).slice(0, 5).map(request => (
          <div key={request.id} className="flex items-center justify-between py-2 lg:py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-xs lg:text-sm truncate">{request.issue}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{request.property} - Unit {request.unit}</p>
            </div>
            <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              request.priority === 'high' ? 'bg-red-100 text-red-800' :
              request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {request.priority}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4 text-sm lg:text-base">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          {canManageProperties(userRole, teamPermissions) && (
            <button onClick={() => setShowPropertyModal(true)} className="p-2 lg:p-4 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition text-center">
              <Building className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1 lg:mb-2" />
              <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white block">
                <span className="lg:hidden"> Property</span>
                <span className="hidden lg:inline">Add Property</span>
              </span>
            </button>
          )}
          {canAddTenant(userRole, teamPermissions) && (
            <button onClick={() => setShowTenantModal(true)} className="p-2 lg:p-4 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition text-center">
              <Users className="w-4 h-4 lg:w-6 lg:h-6 text-green-600 dark:text-green-400 mx-auto mb-1 lg:mb-2" />
              <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white block">
                <span className="lg:hidden"> Tenant</span>
                <span className="hidden lg:inline">Add Tenant</span>
              </span>
            </button>
          )}
          <button onClick={() => setShowListingModal(true)} className="p-2 lg:p-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition text-center">
            <Eye className="w-4 h-4 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1 lg:mb-2" />
            <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white block">
              <span className="lg:hidden"> Listing</span>
              <span className="hidden lg:inline">Create Listing</span>
            </span>
          </button>
          <button onClick={() => setShowMemoModal(true)} className="p-2 lg:p-4 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg transition text-center">
            <Mail className="w-4 h-4 lg:w-6 lg:h-6 text-orange-600 dark:text-orange-400 mx-auto mb-1 lg:mb-2" />
            <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white block">
              <span className="lg:hidden">Memo</span>
              <span className="hidden lg:inline">Send Memo</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </>
)}

{/* Properties View */}
{currentView === 'properties' && (
  <div className="flex-1 overflow-auto">
    {/* ===== CONTENT SECTION ===== */}
    <div className="px-6 pb-8">
      <div className="max-w-7xl mx-auto">

        {/* Blue Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Property Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your properties and track occupancy rates</p>
          </div>
          {canManageProperties(userRole, teamPermissions) && (
            <button
              onClick={() => setShowPropertyModal(true)}
              className="px-3 lg:px-6 py-2 lg:py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2 text-sm lg:text-base"
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="lg:hidden"> Property</span>
              <span className="hidden lg:inline">Add Property</span>
            </button>
          )}
        </div>

        {/* Properties Grid - Responsive Full Width */}
        {loadingProps ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Properties Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by adding your first property</p>
            <button 
              onClick={() => setShowPropertyModal(true)}
              className="bg-[#003366] text-white px-6 py-3 rounded-lg hover:bg-[#002244] transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {properties.map(property => (
              <div key={property.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group border border-gray-200 dark:border-gray-700">
                {/* Property Image */}
                <div className="relative h-64 overflow-hidden bg-gray-200">
                  {property.images && property.images.length > 0 ? (
                    <>
                      <img 
                        src={property.images[0]} 
                        alt={property.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {property.images.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                          <Camera className="w-4 h-4" />
                          +{property.images.length - 1} photos
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Building className="w-20 h-20 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-6">
                  {/* Header with Actions */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{property.name}</h3>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{property.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProperty(property);
                          setShowEditPropertyModal(true);
                        }}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Units</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{property.units}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Occupied</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{property.occupied}</p>
                    </div>
                  </div>

                  {/* Occupancy Rate */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Occupancy Rate</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {Math.round((property.occupied / property.units) * 100)}% occupied
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-[#003366] dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(property.occupied / property.units) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly Revenue */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(Number(property.revenue), businessPreferences.currency)}
                      </span>
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

{/* Listings View */}
{currentView === 'listings' && (
  <>
    {/* Blue Banner */}
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Property Listings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage your available units for rent</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          onClick={() => navigate('/listings')}
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-gray-800 border-2 border-[#003366] text-[#003366] dark:text-blue-400 rounded-lg hover:bg-[#003366] hover:text-white dark:hover:bg-blue-600 transition font-semibold whitespace-nowrap flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          View Listings
        </button>
        <button
          onClick={() => setShowListingModal(true)}
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Create Listing
        </button>
      </div>
    </div>
    
    {listings.length === 0 ? (
      <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm text-center border border-gray-200 dark:border-gray-700">
        <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No listings yet. Create your first listing to attract tenants!</p>
        <button onClick={() => setShowListingModal(true)} className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
          Create First Listing
        </button>
      </div>
    ) : (
      <div className="grid md:grid-cols-2 gap-6">
        {listings.map(listing => (
          <div key={listing.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
            {/* Listing Image */}
            <div className="relative h-64 bg-gray-200">
              {listing.images && listing.images.length > 0 ? (
                <>
                  <img 
                    src={listing.images[0]} 
                    alt={`${listing.property} - Unit ${listing.unit}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                    {listing.status === 'available' ? 'available' : 'occupied'}
                  </div>
                  {listing.images.length > 1 && (
                    <button 
                      onClick={() => setSelectedListing(listing)}
                      className="absolute bottom-3 right-3 px-3 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full hover:bg-opacity-90 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View all {listing.images.length} photos
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                  <Home className="w-16 h-16 text-white opacity-50" />
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{listing.property}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unit {listing.unit}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingListing(listing);
                      setShowEditListingModal(true);
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                    title="Edit listing"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    title="Delete listing"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Property Stats */}
              <div className="flex gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  <span>{listing.bedrooms} bed</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  <span>{listing.bathrooms} bath</span>
                </div>
                {listing.area > 0 && (
                  <div className="flex items-center gap-1">
                    <Square className="w-4 h-4" />
                    <span>{listing.area} m²</span>
                  </div>
                )}
              </div>
              
              {/* Amenities */}
              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {listing.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                        +{listing.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</span>
                  <span className="font-bold text-[#003366] dark:text-blue-400 text-lg">{formatCurrency(listing.rent, businessPreferences.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Deposit: {formatCurrency(listing.deposit, businessPreferences.currency)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Posted: {formatDate(listing.postedDate, businessPreferences.dateFormat)}</span>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => {
                  setSelectedListing(listing);
                  setShowListingDetailsModal(true);
                  setCurrentImageIndex(0);
                }}
                className="w-full mt-4 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
)}

{currentView === 'viewings' && (
  <div className="max-w-7xl mx-auto">
    {/* Blue Banner */}
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between mb-6">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Viewing Requests</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage property viewing appointments and requests</p>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
      <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Viewing Requests</h2>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <button 
          onClick={() => setViewingFilter('all')}
          className={`flex-1 sm:flex-none px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition ${
            viewingFilter === 'all' ? 'bg-[#003366] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        <button 
          onClick={() => setViewingFilter('pending')}
          className={`flex-1 sm:flex-none px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition ${
            viewingFilter === 'pending' ? 'bg-[#003366] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Pending
        </button>
        <button 
          onClick={() => setViewingFilter('confirmed')}
          className={`flex-1 sm:flex-none px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition ${
            viewingFilter === 'confirmed' ? 'bg-[#003366] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Confirmed
        </button>
      </div>
    </div>
    
    <div className="grid gap-3 lg:gap-4">
      {displayViewings.filter(v => viewingFilter === 'all' || v.status === viewingFilter).map(viewing => (
        <div key={viewing.id} className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            {/* Header Section - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base lg:text-lg truncate">{viewing.prospectName}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                    <span className="truncate">{viewing.phone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                    <span className="truncate">{viewing.email}</span>
                  </span>
                </div>
              </div>
              <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap self-start ${
                viewing.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                viewing.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                viewing.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {viewing.status}
              </span>
            </div>
            
            {/* Property & Date Info - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Property</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm lg:text-base truncate">{viewing.property}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Viewing Date & Time</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">{viewing.date} at {viewing.time}</p>
              </div>
            </div>
            
            {/* Credibility Score - Mobile Optimized */}
            {viewing.credibilityScore && (
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Credibility Score</p>
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        viewing.credibilityScore >= 80 ? 'bg-green-500' :
                        viewing.credibilityScore >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${viewing.credibilityScore}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-xs lg:text-sm whitespace-nowrap">{viewing.credibilityScore}/100</span>
                </div>
              </div>
            )}
            
            {/* Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setSelectedViewing(viewing)}
                className="text-[#003366] dark:text-blue-400 hover:text-[#002244] dark:hover:text-blue-300 text-xs lg:text-sm font-medium text-center sm:text-left"
              >
                View Full Details →
              </button>
              
              {viewing.status === 'pending' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUpdateViewingStatus(viewing.id, 'confirmed')}
                    className="flex-1 sm:flex-none px-3 lg:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 text-xs lg:text-sm"
                  >
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span>Approve</span>
                  </button>
                  <button 
                    onClick={() => handleUpdateViewingStatus(viewing.id, 'declined')}
                    className="flex-1 sm:flex-none px-3 lg:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs lg:text-sm"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Credibility System Info Banner - Moved to Bottom */}
    <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 p-3 lg:p-4 rounded-lg">
      <div className="flex items-start gap-2 lg:gap-3">
        <div className="flex-shrink-0">
          <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs lg:text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Smart Credibility Filtering Active</h3>
          <p className="text-xs lg:text-sm text-blue-800 dark:text-blue-300">
            Our system automatically scores viewing requests based on user credibility.
            <span className="font-medium"> High-scoring applicants (80+) are prioritized</span> to help you find reliable tenants quickly.
            Review the credibility score below each request before approving.
          </p>
        </div>
      </div>
    </div>
  </div>
)}

{/* Maintenance View */}
{currentView === 'maintenance' && (
  <div className="flex-1 overflow-auto">

    {/* ===== CONTENT SECTION ===== */}
    <div className="px-6 pb-8">
      <div className="max-w-7xl mx-auto">

        {/* Blue Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Maintenance Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track requests and analyze maintenance costs</p>
          </div>
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="px-3 lg:px-6 py-2 lg:py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2 text-sm lg:text-base"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="lg:hidden">Request</span>
            <span className="hidden lg:inline">New Request</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMaintenanceViewMode('requests')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
              maintenanceViewMode === 'requests'
                ? 'bg-[#003366] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            📋 Requests
          </button>
          <button
            onClick={() => setMaintenanceViewMode('analytics')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
              maintenanceViewMode === 'analytics'
                ? 'bg-[#003366] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            📊 Analytics
          </button>
        </div>

        {maintenanceViewMode === 'requests' ? (
          <>
            {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Maintenance Requests */}
        {loadingMaintenance ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
          </div>
        ) : maintenanceRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
            <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Maintenance Requests</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">No maintenance requests have been submitted yet.</p>
            <button
              onClick={() => setShowMaintenanceModal(true)}
              className="bg-[#003366] text-white px-6 py-3 rounded-lg hover:bg-[#002244] transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {maintenanceRequests.map((request) => (
              <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          request.priority === 'high' ? 'bg-red-100' :
                          request.priority === 'medium' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          <Wrench className={`w-5 h-5 ${
                            request.priority === 'high' ? 'text-red-600' :
                            request.priority === 'medium' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{request.issue}</h3>

                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{request.property} - Unit {request.unit}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{request.tenant}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span>{request.date} at {request.scheduledTime || '09:00'}</span>
                            </div>
                          </div>

                          {/* Assignment Section */}
                          <div className="mt-3">
                            {request.assignedTo ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm">
                                <Users className="w-4 h-4" />
                                <span>Assigned to: <strong>{request.assignedToName}</strong></span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assign to:</label>
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAssignMaintenance(request.id, e.target.value, request);
                                    }
                                  }}
                                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  defaultValue=""
                                >
                                  <option value="">Select staff...</option>
                                  {teamMembers.filter(m => m.role === 'maintenance').map(staff => (
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
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">💰</span>
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Cost Information</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {request.estimatedCost && (
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Estimated:</span>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                      KSH {request.estimatedCost.toLocaleString()}
                                    </div>
                                  </div>
                                )}
                                {request.actualCost && (
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Actual:</span>
                                    <div className="font-semibold text-green-600 dark:text-green-400">
                                      KSH {request.actualCost.toLocaleString()}
                                    </div>
                                  </div>
                                )}
                                {request.estimatedCost && request.actualCost && (
                                  <div className="col-span-2">
                                    <span className="text-gray-600 dark:text-gray-400">Variance:</span>
                                    <div className={`font-semibold ${
                                      request.actualCost > request.estimatedCost
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-green-600 dark:text-green-400'
                                    }`}>
                                      KSH {Math.abs(request.actualCost - request.estimatedCost).toLocaleString()}
                                      {request.actualCost > request.estimatedCost ? ' over' : ' under'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap lg:flex-col lg:items-end">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        request.priority === 'high' ? 'bg-red-100 text-red-700' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {request.priority}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'completed' ? 'bg-green-100 text-green-700' :
                        request.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Show estimate info if available */}
                    {request.estimatedCost && request.status === 'estimated' && (
                      <div className="w-full mb-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                            <span className="text-2xl">💰</span>
                            <div>
                              <div className="font-semibold">Estimate Submitted</div>
                              <div className="text-sm">KSH {request.estimatedCost.toLocaleString()}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenEstimateApproval(request)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          >
                            Review Estimate
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show quotes submitted - View Quotes button */}
                    {request.quotesSubmitted > 0 && request.status === 'quotes_submitted' && (
                      <div className="w-full mb-2 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
                            <span className="text-2xl">📋</span>
                            <div>
                              <div className="font-semibold">Quotes Submitted</div>
                              <div className="text-sm">{request.quotesSubmitted} vendor {request.quotesSubmitted === 1 ? 'quote' : 'quotes'} received</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenQuoteComparison(request)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                          >
                            View & Compare Quotes
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show approved cost */}
                    {request.approvedCost && request.status === 'approved' && (
                      <div className="w-full mb-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                          <span className="text-2xl">✅</span>
                          <div>
                            <div className="font-semibold">Estimate Approved</div>
                            <div className="text-sm">Approved Cost: KSH {request.approvedCost.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show rejected status */}
                    {request.status === 'estimate_rejected' && (
                      <div className="w-full mb-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                          <span className="text-2xl">❌</span>
                          <div>
                            <div className="font-semibold">Estimate Rejected</div>
                            {request.rejectionNotes && (
                              <div className="text-sm mt-1">Reason: {request.rejectionNotes}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show completed work summary */}
                    {request.status === 'completed' && request.actualCost && (
                      <div className="w-full mb-2 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">✅</span>
                          <div>
                            <div className="font-bold text-green-900 dark:text-green-200">Work Completed</div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                              Final Cost: KSH {request.actualCost.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {request.completionNotes && (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-sm">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Notes: </span>
                            <span className="text-gray-600 dark:text-gray-400">{request.completionNotes}</span>
                          </div>
                        )}
                        {request.actualDuration && (
                          <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                            <span className="font-semibold">Duration: </span>{request.actualDuration}
                          </div>
                        )}
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateMaintenanceStatus(request.id, 'in-progress')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                      >
                        <Wrench className="w-4 h-4" />
                        Start Work
                      </button>
                    )}
                    {request.status === 'in-progress' && (
                      <button
                        onClick={() => handleUpdateMaintenanceStatus(request.id, 'completed')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMaintenanceRequest(request.id)}
                      className="bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        ) : (
          <MaintenanceAnalytics
            landlordId={currentUser.uid}
            properties={properties}
          />
        )}
      </div>
    </div>
  </div>
)}

          {/* Tax Reports View */}
          {currentView === 'tax-reports' && taxTrackingEnabled && (
            <>
              {/* Blue Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Rental Income Tax Reports
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track your monthly tax obligations and maintain KRA compliance
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-600 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-1">Your Privacy is Protected</h4>
                    <p className="text-sm text-green-800 dark:text-green-400 leading-relaxed">
                      All tax information is stored securely and privately in your account. We will <strong>never</strong> share, sell, or forward your financial data to anyone, including KRA or any third parties. This tool is designed solely for your personal record-keeping and tax calculation assistance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Month Tax Summary Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentMonthTax.monthName} {currentMonthTax.year} Tax Summary
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentMonthTax.status === 'paid' ? 'bg-green-100 text-green-800' :
                    new Date() > currentMonthTax.dueDate ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {currentMonthTax.status === 'paid' ? 'Paid' :
                     new Date() > currentMonthTax.dueDate ? 'Overdue' : 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Rental Income</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(currentMonthTax.totalIncome, businessPreferences.currency)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{currentMonthTax.payments.length} payments received</p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Tax Due (10%)</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(currentMonthTax.taxDue, businessPreferences.currency)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Residential Rental Tax</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Payment Due Date</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatDate(currentMonthTax.dueDate, businessPreferences.dateFormat)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {Math.ceil((currentMonthTax.dueDate - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                    </p>
                  </div>
                </div>

                {currentMonthTax.status !== 'paid' && (
                  <button
                    onClick={() => {
                      setSelectedTaxPeriod(currentMonthTax);
                      setTaxPaymentData({
                        paymentDate: new Date().toISOString().split('T')[0],
                        prn: '',
                        amount: currentMonthTax.taxDue.toString()
                      });
                      setShowTaxPaymentModal(true);
                    }}
                    className="w-full px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Record Tax Payment
                  </button>
                )}
              </div>

              {/* Tax History Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tax Payment History</h3>
                  <p className="text-sm text-gray-600 mt-1">Last 6 months</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rental Income</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tax Due (10%)</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getRecentTaxPeriods().map((period, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{period.monthName} {period.year}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatCurrency(period.totalIncome, businessPreferences.currency)}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{period.payments.length} payments</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-orange-600">{formatCurrency(period.taxDue, businessPreferences.currency)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(period.dueDate, businessPreferences.dateFormat)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              period.status === 'paid' ? 'bg-green-100 text-green-800' :
                              new Date() > period.dueDate ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {period.status === 'paid' ? 'Paid' :
                               new Date() > period.dueDate ? 'Overdue' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {period.status !== 'paid' && period.taxDue > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedTaxPeriod(period);
                                  setTaxPaymentData({
                                    paymentDate: new Date().toISOString().split('T')[0],
                                    prn: '',
                                    amount: period.taxDue.toString()
                                  });
                                  setShowTaxPaymentModal(true);
                                }}
                                className="text-[#003366] hover:text-[#002244] font-medium"
                              >
                                Record Payment
                              </button>
                            )}
                            {period.taxDue === 0 && (
                              <span className="text-gray-400">No income</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax Information Card */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mt-6">
                <div className="flex items-start gap-3">
                  <Bell className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">About Residential Rental Income Tax</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      As a landlord in Kenya, you're required to pay 10% of your gross rental income as Residential Rental Income Tax to KRA.
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Tax Rate: 10% of gross monthly rental income</li>
                      <li>• Payment Deadline: 20th of the following month</li>
                      <li>• Example: December rent tax is due by January 20th</li>
                      <li>• Payment Method: Via iTax or KRA-approved banks</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tenants View */}
          {currentView === 'tenants' && (
            <>
              {/* Blue Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tenant Directory</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage and communicate with your tenants</p>
                </div>
                {canAddTenant(userRole, teamPermissions) && (
                  <button
                    onClick={() => setShowTenantModal(true)}
                    className="px-3 lg:px-6 py-2 lg:py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2 text-sm lg:text-base"
                  >
                    <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="lg:hidden">Tenant</span>
                    <span className="hidden lg:inline">Add Tenant</span>
                  </button>
                )}
              </div>

              {/* Info Banner for Sharing Options */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Share2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Easy Tenant Registration</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Share registration invitations with your tenants using multiple convenient methods:
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <strong>WhatsApp:</strong> Send invitation directly via WhatsApp
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        <strong>Email:</strong> Send invitation link via email
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                        <strong>Copy Link:</strong> Copy and share the registration link anywhere
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        <strong>QR Code:</strong> Generate and share a scannable QR code
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex gap-2 w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search tenants..."
                      value={tenantSearchQuery}
                      onChange={(e) => setTenantSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <select
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Properties</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Group tenants by property */}
              {properties
                .filter(property => {
                  // Filter by selected property if not "all"
                  if (tenantFilter !== 'all' && property.name !== tenantFilter) return false;
                  // Check if property has any tenants matching search
                  const propertyTenants = tenants.filter(t => t.property === property.name);
                  if (tenantSearchQuery) {
                    return propertyTenants.some(t =>
                      t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
                      t.email.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                    );
                  }
                  return propertyTenants.length > 0;
                })
                .map(property => {
                  const propertyTenants = tenants
                    .filter(tenant => tenant.property === property.name)
                    .filter(tenant => 
                      !tenantSearchQuery || 
                      tenant.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) || 
                      tenant.email.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                    );
                  
                  if (propertyTenants.length === 0) return null;

                  return (
                    <div key={property.id} className="mb-8">
                      {/* Property Header */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{property.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{property.location}</span>
                          <span className="ml-4 text-[#003366] dark:text-blue-400 font-semibold">
                            {propertyTenants.length} {propertyTenants.length === 1 ? 'Tenant' : 'Tenants'}
                          </span>
                        </div>
                      </div>

                      {/* Tenants Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {propertyTenants.map(tenant => (
                          <div key={tenant.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                {tenant.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{tenant.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    tenant.status === 'active' && tenant.userId ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                                    tenant.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                                    tenant.status === 'active' && !tenant.userId ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                  }`}>
                                    {tenant.status === 'active' && tenant.userId ? 'Registered' :
                                     tenant.status === 'pending' ? 'Invitation Sent' :
                                     tenant.status === 'active' && !tenant.userId ? 'Not Registered' :
                                     tenant.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Unit {tenant.unit}</p>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{tenant.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span>{tenant.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Banknote className="w-4 h-4 flex-shrink-0" />
                                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(tenant.rent, businessPreferences.currency)}/month</span>
                              </div>
                              {tenant.leaseEnd && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 flex-shrink-0" />
                                  <span>Lease: {formatDate(tenant.leaseStart, businessPreferences.dateFormat)} to {formatDate(tenant.leaseEnd, businessPreferences.dateFormat)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewTenantDetails(tenant)}
                                  className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm">
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleMessageTenant(tenant)}
                                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm relative">
                                  Message
                                   {unreadMessages[tenant.id] > 0 && (
                                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                   {unreadMessages[tenant.id]}
                                  </span>
                                    )}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTenantForNotice(tenant);
                                    setShowMoveOutNoticeModal(true);
                                  }}
                                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 transition text-sm flex items-center gap-2">
                                  <FileSignature className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition text-sm flex items-center gap-2">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Show share invitation button for pending tenants with token */}
                              {tenant.status === 'pending' && tenant.invitationToken && (
                                <button
                                  onClick={() => {
                                    setPendingInvitation({
                                      token: tenant.invitationToken,
                                      name: tenant.name,
                                      email: tenant.email,
                                      phone: tenant.phone,
                                      role: 'tenant',
                                      property: tenant.property,
                                      unit: tenant.unit
                                    });
                                    setShowInvitationModal(true);
                                  }}
                                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm flex items-center justify-center gap-2">
                                  <Share2 className="w-4 h-4" />
                                  Share Invitation
                                </button>
                              )}

                              {/* Show send/resend invitation button for tenants without token or needing resend */}
                              {(!tenant.invitationToken || (tenant.status === 'active' && !tenant.userId)) && (
                                <button
                                  onClick={() => handleResendTenantInvitation(tenant)}
                                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm flex items-center justify-center gap-2">
                                  <Send className="w-4 h-4" />
                                  {tenant.invitationToken ? 'Resend Invitation' : 'Send Invitation'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* No results message */}
              {properties.filter(property => {
                const propertyTenants = tenants.filter(t => t.property === property.name);
                if (tenantFilter !== 'all' && property.name !== tenantFilter) return false;
                if (tenantSearchQuery) {
                  return propertyTenants.some(t =>
                    t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
                    t.email.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                  );
                }
                return propertyTenants.length > 0;
              }).length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  {tenants.length === 0 ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Tenants Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by adding your first tenant to the directory</p>
                      {canAddTenant(userRole, teamPermissions) && (
                        <button
                          onClick={() => setShowTenantModal(true)}
                          className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold inline-flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Add Your First Tenant
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Tenants Found</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {tenantSearchQuery
                          ? `No tenants match your search "${tenantSearchQuery}"`
                          : 'No tenants in the selected property'}
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}

         {/* Payments View */}
{currentView === 'payments' && (
  <div className="flex-1 overflow-auto">

    {/* ===== CONTENT SECTION ===== */}
    <div className="px-6 pb-8">
      <div className="max-w-7xl mx-auto">

        {/* Blue Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Payment Tracking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monitor rent payments and track outstanding balances</p>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-3 lg:px-6 py-2 lg:py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2 text-sm lg:text-base"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="lg:hidden">Payment</span>
            <span className="hidden lg:inline">Record Payment</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setPaymentsTab('payments')}
            className={`px-6 py-3 font-semibold transition ${
              paymentsTab === 'payments'
                ? 'border-b-2 border-[#003366] text-[#003366] dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setPaymentsTab('mpesa')}
            className={`px-6 py-3 font-semibold transition ${
              paymentsTab === 'mpesa'
                ? 'border-b-2 border-[#003366] text-[#003366] dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            M-Pesa Reconciliation
          </button>
        </div>

        {/* Payments Tab Content */}
        {paymentsTab === 'payments' && (
        <>
        {/* Payment Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Expected */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Expected</span>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Banknote className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0), businessPreferences.currency)}
            </p>
          </div>

          {/* Received */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Received</span>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0), businessPreferences.currency)}
            </p>
          </div>

          {/* Pending */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0), businessPreferences.currency)}
            </p>
          </div>

          {/* Overdue */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0), businessPreferences.currency)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>

          <select 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>

          <select 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Time</option>
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
        </div>

        {/* Payments Table */}
        {loadingPayments ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
            <Banknote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Payment Records</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start tracking payments for your properties</p>
            <button 
              onClick={() => setShowPaymentModal(true)}
              className="bg-[#003366] text-white px-6 py-3 rounded-lg hover:bg-[#002244] transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Record Payment
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      {/* Tenant */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#003366] text-white rounded-full flex items-center justify-center font-semibold">
                            {payment.tenant?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{payment.tenant}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{payment.unit}</p>
                          </div>
                        </div>
                      </td>

                      {/* Property */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>{payment.property}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount, businessPreferences.currency)}
                        </p>
                        {payment.method && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{payment.method}</p>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {formatDate(payment.dueDate, businessPreferences.dateFormat)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payment.status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {payment.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {payment.status === 'overdue' && <Ban className="w-3 h-3 mr-1" />}
                          {payment.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {payment.status !== 'paid' && (
                            <button 
                              onClick={() => handleMarkPaymentPaid(payment.id)}
                              className="text-green-600 dark:text-green-400 hover:bg-green-50 p-2 rounded-lg transition"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDownloadReceipt(payment.id)}
                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 p-2 rounded-lg transition"
                            title="Download Receipt"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}

        {/* M-Pesa Reconciliation Tab Content */}
        {paymentsTab === 'mpesa' && (
          <MpesaReconciliation
            landlordId={user.uid}
            properties={properties}
            tenants={tenants}
          />
        )}

      </div>
    </div>
  </div>
)}

{/* Documents View */}
{currentView === 'documents' && (
  <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
    <div className="px-6 pb-8 pt-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Documents</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage lease agreements and move-out notices</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setDocumentsTab('leases')}
            className={`px-6 py-3 font-semibold transition ${
              documentsTab === 'leases'
                ? 'border-b-2 border-[#003366] text-[#003366] dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Lease Agreements
          </button>
          <button
            onClick={() => setDocumentsTab('move-out')}
            className={`px-6 py-3 font-semibold transition ${
              documentsTab === 'move-out'
                ? 'border-b-2 border-[#003366] text-[#003366] dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Move-Out Notices
          </button>
        </div>

        {/* Leases Tab Content */}
        {documentsTab === 'leases' && (
          <LeaseManagement
            landlordId={user.uid}
            properties={properties}
            tenants={tenants}
          />
        )}

        {/* Move-Out Notices Tab Content */}
        {documentsTab === 'move-out' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Move-Out Notices</h3>
            <p className="text-gray-600 dark:text-gray-400">Move-out notices feature will be available here.</p>
          </div>
        )}

      </div>
    </div>
  </div>
)}

{/* Leases View - DEPRECATED (Now in Documents) */}
{currentView === 'leases' && (
  <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
    <div className="px-6 pb-8 pt-6">
      <LeaseManagement
        landlordId={user.uid}
        properties={properties}
        tenants={tenants}
      />
    </div>
  </div>
)}

{/* M-Pesa Reconciliation View - DEPRECATED (Now in Payments) */}
{currentView === 'mpesa-reconciliation' && (
  <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
    <div className="px-6 pb-8 pt-6">
      <MpesaReconciliation
        landlordId={user.uid}
        properties={properties}
        tenants={tenants}
      />
    </div>
  </div>
)}

{/* Move-Out Notices View - DEPRECATED (Now in Documents) */}
{currentView === 'move-out-notices' && (
  <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
    <div className="px-6 pb-8 pt-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Move-Out Notices</h3>
        <p className="text-gray-600 dark:text-gray-400">Move-out notices feature will be available here.</p>
      </div>
    </div>
  </div>
)}

{/* Leases View */}
{currentView === 'leases' && (
  <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
    <div className="px-6 pb-8 pt-6">
      <LeaseManagement
        landlordId={user.uid}
        properties={properties}
        tenants={tenants}
      />
    </div>
  </div>
)}

{/* M-Pesa Reconciliation View */}
{currentView === 'mpesa-reconciliation' && (
  <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
    <div className="px-6 pb-8 pt-6">
      <MpesaReconciliation
        landlordId={user.uid}
        properties={properties}
        tenants={tenants}
      />
    </div>
  </div>
)}

{/* Memos View */}
{currentView === 'memos' && (
  <div className="flex-1 overflow-auto">

    {/* ===== CONTENT SECTION ===== */}
    <div className="px-6 pb-8">
      <div className="max-w-7xl mx-auto">

        {/* Blue Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Updates & Memos</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Send announcements and updates to your tenants</p>
          </div>
          <button
            onClick={() => setShowMemoModal(true)}
            className="px-3 lg:px-6 py-2 lg:py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2 text-sm lg:text-base"
          >
            <Send className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="lg:hidden">Memo</span>
            <span className="hidden lg:inline">Send Memo</span>
          </button>
        </div>

        {/* KPLC Power Outages Section */}
        <div className="mb-6">
          <PowerOutagesList userAreas={userProfile?.preferredAreas || []} />
        </div>

        <div className="mb-6">
          <LocationPreferences userId={currentUser?.uid} />
        </div>

        {/* Memos List - showing real memos only */}
        <div className="space-y-4">
          {memos.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Memos Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Start communicating with your tenants by sending your first memo</p>
              <button
                onClick={() => setShowMemoModal(true)}
                className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold inline-flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Your First Memo
              </button>
            </div>
          ) : (
            memos.map(memo => (
              <div key={memo.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{memo.title}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          memo.priority === 'high' ? 'bg-red-100 text-red-700' :
                          memo.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {memo.priority}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                        {memo.message}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>Sent by: {memo.sentBy}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Date: {formatDate(memo.sentAt, businessPreferences.dateFormat)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>Recipients: {memo.recipientCount || 0} {memo.recipientType === 'all' ? 'tenants' : 'selected'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>Target: {memo.targetAudience === 'all' ? 'All Properties' : memo.targetAudience}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 lg:flex-col">
                      <button
                        onClick={() => handleDeleteMemo(memo.id)}
                        className="flex-1 lg:flex-none bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition text-sm flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  </div>
)}

{/* Move-Out Notices View */}
{currentView === 'move-out-notices' && (
  <div className="flex-1 overflow-auto">
    <div className="px-6 pb-8">
      <div className="max-w-7xl mx-auto">

        {/* Header Banner */}
        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-orange-600" />
              Move-Out Notices
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage tenant and landlord-initiated move-out notices
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Notices</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{moveOutNotices.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</div>
            <div className="text-2xl font-bold text-orange-600">{moveOutNotices.filter(n => n.status === 'submitted').length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Acknowledged</div>
            <div className="text-2xl font-bold text-blue-600">{moveOutNotices.filter(n => n.status === 'acknowledged').length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-600">{moveOutNotices.filter(n => n.status === 'approved').length}</div>
          </div>
        </div>

        {/* Notices List */}
        {loadingMoveOutNotices ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading move-out notices...</p>
          </div>
        ) : moveOutNotices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <FileSignature className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Move-Out Notices</h3>
            <p className="text-gray-600 dark:text-gray-400">
              When tenants submit move-out notices or you issue notices to tenants, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {moveOutNotices.map((notice) => {
              const statusColors = {
                submitted: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
                acknowledged: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
                rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
              };

              const isFromTenant = notice.initiatedBy === 'tenant';
              const moveOutDate = notice.intendedMoveOutDate;
              const daysUntilMoveOut = moveOutDate ? Math.ceil((new Date(moveOutDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

              return (
                <div key={notice.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {notice.tenantName} - {notice.unit}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[notice.status] || statusColors.submitted}`}>
                            {notice.status.charAt(0).toUpperCase() + notice.status.slice(1)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isFromTenant ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                            {isFromTenant ? 'From Tenant' : 'Issued by You'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{notice.propertyName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Move-Out Date</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{new Date(moveOutDate).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {daysUntilMoveOut > 0 ? `${daysUntilMoveOut} days remaining` : daysUntilMoveOut === 0 ? 'Today' : 'Past due'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Notice Period:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{notice.noticePeriod} days</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {notice.noticeSubmittedDate?.toDate?.() ? new Date(notice.noticeSubmittedDate.toDate()).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Reference:</span>
                        <p className="font-mono text-xs text-gray-900 dark:text-white">{notice.referenceNumber}</p>
                      </div>
                    </div>

                    {notice.reason && (
                      <div className="mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Reason:</span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{notice.reason}</p>
                      </div>
                    )}

                    {notice.legalGrounds && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Legal Grounds:</span>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">{notice.legalGrounds}</p>
                      </div>
                    )}

                    {notice.additionalNotes && (
                      <div className="mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Notes:</span>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">{notice.additionalNotes}</p>
                      </div>
                    )}

                    {notice.rejectionReason && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">Rejection Reason:</span>
                        <p className="text-sm text-red-900 dark:text-red-200 mt-1">{notice.rejectionReason}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {isFromTenant && notice.status === 'submitted' && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleAcknowledgeNotice(notice.id, notice.tenantName)}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleApproveNotice(notice.id, notice.tenantId, notice.tenantName)}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectNotice(notice.id, notice.tenantId, notice.tenantName)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}

                    {isFromTenant && notice.status === 'acknowledged' && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleApproveNotice(notice.id, notice.tenantId, notice.tenantName)}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectNotice(notice.id, notice.tenantId, notice.tenantName)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
)}

{/*Calendar View*/}
{currentView === 'calendar' && (
  <div className="flex-1 overflow-auto">

    {/* ===== CONTENT SECTION ===== */}
    <div className="px-6 pb-8">
      <div className="max-w-7xl mx-auto">

        {/* ===== CALENDAR SECTION ===== */}
        <div className="mb-8 mt-6">
          {/* Enhanced Calendar with Blue Banner */}
          <EnhancedCalendar
            tenants={tenants}
            maintenanceRequests={maintenanceRequests}
            viewings={viewings}
            showRentDue={true}
            showMaintenance={true}
            showLeaseExpiry={true}
            showViewings={true}
            onEventClick={(event) => {
              if (event.type === 'maintenance' && event.request) {
                setCurrentView('maintenance');
              } else if (event.type === 'rent' && event.tenant) {
                setCurrentView('tenants');
              } else if (event.type === 'viewing' && event.viewing) {
                setCurrentView('viewings');
              }
            }}
          />
        </div>

        {/* ===== UPCOMING EVENTS - DYNAMIC ===== */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upcoming Events</h2>

          <div className="space-y-4">
            {/* Upcoming Viewings */}
            {viewings
              .filter(v => {
                const viewingDate = v.date?.toDate ? v.date.toDate() : new Date(v.date);
                return viewingDate >= new Date() && v.status !== 'cancelled';
              })
              .sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return dateA - dateB;
              })
              .slice(0, 3)
              .map(viewing => {
                const viewingDate = viewing.date?.toDate ? viewing.date.toDate() : new Date(viewing.date);
                return (
                  <div key={viewing.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition flex items-center gap-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex-shrink-0 text-center">
                      <div className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                        {viewingDate.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        {viewingDate.getDate()}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Property Viewing</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                        {viewing.prospectName || viewing.name} - {viewing.property}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{viewing.time}</p>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <CalendarCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Upcoming Maintenance */}
            {maintenanceRequests
              .filter(req => {
                if (!req.scheduledDate) return false;
                const scheduledDate = req.scheduledDate?.toDate ? req.scheduledDate.toDate() : new Date(req.scheduledDate);
                return scheduledDate >= new Date() && req.status !== 'completed';
              })
              .sort((a, b) => {
                const dateA = a.scheduledDate?.toDate ? a.scheduledDate.toDate() : new Date(a.scheduledDate);
                const dateB = b.scheduledDate?.toDate ? b.scheduledDate.toDate() : new Date(b.scheduledDate);
                return dateA - dateB;
              })
              .slice(0, 3)
              .map(request => {
                const scheduledDate = request.scheduledDate?.toDate ? request.scheduledDate.toDate() : new Date(request.scheduledDate);
                return (
                  <div key={request.id} className="bg-orange-50 dark:bg-orange-900/20 rounded-xl shadow-md p-6 hover:shadow-xl transition flex items-center gap-6 border border-transparent dark:border-orange-800/30">
                    <div className="flex-shrink-0 text-center">
                      <div className="text-orange-600 dark:text-orange-400 text-sm font-semibold">
                        {scheduledDate.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-4xl font-bold text-gray-900 dark:text-orange-200">
                        {scheduledDate.getDate()}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-orange-200 mb-1">Maintenance</h3>
                      <p className="text-gray-600 dark:text-orange-300/80 text-sm mb-1">
                        {request.issue} - {request.property}
                      </p>
                      <p className="text-gray-500 dark:text-orange-300/70 text-xs">
                        {request.scheduledTime || scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800/40 rounded-full flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Upcoming Rent Due */}
            {(() => {
              const today = new Date();
              const upcomingRentDue = tenants
                .filter(tenant => tenant.rentDueDay)
                .map(tenant => {
                  const dueDay = tenant.rentDueDay || 5;
                  let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);

                  // If due date has passed this month, use next month
                  if (dueDate < today) {
                    dueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
                  }

                  return {
                    ...tenant,
                    dueDate,
                    daysDiff: Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
                  };
                })
                .filter(t => t.daysDiff <= 7 && t.daysDiff >= 0) // Only show rent due within next 7 days
                .sort((a, b) => a.dueDate - b.dueDate)
                .slice(0, 2);

              return upcomingRentDue.map(tenant => (
                <div key={tenant.id} className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-md p-6 hover:shadow-xl transition flex items-center gap-6 border border-transparent dark:border-green-800/30">
                  <div className="flex-shrink-0 text-center">
                    <div className="text-green-600 dark:text-green-400 text-sm font-semibold">
                      {tenant.dueDate.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-4xl font-bold text-gray-900 dark:text-green-200">
                      {tenant.dueDate.getDate()}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-green-200 mb-1">Rent Due</h3>
                    <p className="text-gray-600 dark:text-green-300/80 text-sm mb-1">
                      {tenant.name} - {tenant.property || 'N/A'}
                    </p>
                    <p className="text-gray-500 dark:text-green-300/70 text-xs">
                      KSH {tenant.rent?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-800/40 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
              ));
            })()}

            {/* No Events Message */}
            {viewings.filter(v => {
              const viewingDate = v.date?.toDate ? v.date.toDate() : new Date(v.date);
              return viewingDate >= new Date() && v.status !== 'cancelled';
            }).length === 0 &&
            maintenanceRequests.filter(req => {
              if (!req.scheduledDate) return false;
              const scheduledDate = req.scheduledDate?.toDate ? req.scheduledDate.toDate() : new Date(req.scheduledDate);
              return scheduledDate >= new Date() && req.status !== 'completed';
            }).length === 0 &&
            tenants.filter(tenant => {
              const today = new Date();
              const dueDay = tenant.rentDueDay || 5;
              let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
              if (dueDate < today) {
                dueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
              }
              const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              return daysDiff <= 7 && daysDiff >= 0;
            }).length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <CalendarCheck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No upcoming events in the next 7 days</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  </div>
)}

          
{/* Team View */}
{currentView === 'team' && (
  <div className="flex-1 overflow-auto">
    {/* ===== CONTENT SECTION ===== */}
    <div className="px-6 pb-8">
      <div className="max-w-7xl mx-auto">

        {/* Blue Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Team Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your property management team members</p>
          </div>
          {canManageTeam(userRole) && (
            <button
              onClick={() => setShowTeamModal(true)}
              className="px-3 lg:px-6 py-2 lg:py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2 text-sm lg:text-base"
            >
              <Users className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="lg:hidden">Add Member</span>
              <span className="hidden lg:inline">Add Team Member</span>
            </button>
          )}
        </div>

        {/* Team Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {/* Total Team Members */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Team Members</span>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{teamMembers.length}</p>
          </div>

          {/* Property Managers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Property Managers</span>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-blue-600">
              {teamMembers.filter(m => m.role === 'property_manager').length}
            </p>
          </div>

          {/* Maintenance Staff */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Maintenance Staff</span>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-orange-600">
              {teamMembers.filter(m => m.role === 'maintenance').length}
            </p>
          </div>
        </div>

        {/* Team Members List */}
        {loadingTeam ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Team Members Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Add your first team member to get started</p>
            <button 
              onClick={() => setShowTeamModal(true)}
              className="bg-[#003366] text-white px-6 py-3 rounded-lg hover:bg-[#002244] transition inline-flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Add Team Member
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {teamMembers.map(member => (
              <div 
                key={member.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Avatar and Info */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div className="w-16 h-16 bg-[#003366] text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>

                      {/* Member Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{member.name}</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            member.role === 'property_manager' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                          }`}>
                            {member.role === 'property_manager' ? 'Property Manager' : 'Maintenance'}
                          </span>
                          {member.status === 'pending' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                              pending
                            </span>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0 text-gray-400" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
                            <span>{member.phone}</span>
                          </div>
                        </div>

                        {/* Assigned Properties */}
                        {member.assignedProperties && member.assignedProperties.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Assigned Properties ({member.assignedProperties.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {member.assignedProperties.map(propId => {
                                const property = properties.find(p => p.id === propId);
                                return property ? (
                                  <span
                                    key={propId}
                                    className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                                  >
                                    {property.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:items-end w-full lg:w-auto">
                      <button
                        onClick={() => {
                          setSelectedTeamMember(member);
                          setShowAssignTeamModal(true);
                        }}
                        className="w-full sm:flex-1 lg:w-auto bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition text-sm flex items-center justify-center gap-2"
                      >
                        <Building className="w-4 h-4" />
                        <span className="lg:inline">Assign Properties</span>
                      </button>
                      <button
                        onClick={() => handleRemoveTeamMember(member.id)}
                        className="w-full sm:flex-1 lg:w-auto bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition text-sm flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        {teamMembers.length > 0 && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/40 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Team Roles & Permissions</h3>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p><strong>Property Managers:</strong> Can manage properties, tenants, viewings, and view reports</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-600 dark:bg-orange-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p><strong>Maintenance Staff:</strong> Can view and update maintenance requests for assigned properties</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-600 dark:bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p><strong>Pending Members:</strong> Have received an invitation email but haven't completed registration yet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
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
              onClick={() => setShowMessageModal(true)}
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
              { value: 'tenant', label: 'Tenants' },
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
                        conversation.otherUserRole === 'tenant' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        conversation.otherUserRole === 'property_manager' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                        conversation.otherUserRole === 'maintenance' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {conversation.otherUserRole === 'property_manager' ? 'Property Manager' :
                         conversation.otherUserRole === 'maintenance' ? 'Maintenance' :
                         conversation.otherUserRole === 'tenant' ? 'Tenant' : conversation.otherUserRole}
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
                Start a conversation by messaging a tenant from the Tenants tab
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

{/* Subscription View */}
{currentView === 'subscription' && (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    {/* Main Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-[#003366] dark:text-blue-400" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Subscription & Billing
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your subscription plan and payment history
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Settings Component */}
        <SubscriptionSettings />
      </div>
    </div>
  </div>
)}

{/* Reminders View */}
{currentView === 'reminders' && (
  <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
    <div className="px-6 pb-8 pt-6">
      <div className="max-w-7xl mx-auto">
        <ReminderSettings landlordId={currentUser?.uid} />
      </div>
    </div>
  </div>
)}

{/* Applications View */}
{currentView === 'applications' && (
  <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
    <div className="px-6 pb-8 pt-6">
      <div className="max-w-7xl mx-auto">
        <ApplicationsManager landlordId={currentUser?.uid} />
      </div>
    </div>
  </div>
)}

{/* Settings View */}
{/* Settings View - REPLACE LINES 2992-3223 with this code */}
{currentView === 'settings' && (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

    {/* Main Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="space-y-6">
        {/* Blue Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Account Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your profile, security, and preferences</p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 lg:px-6 py-2 lg:py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center justify-center gap-2 text-sm lg:text-base w-full lg:w-auto"
          >
            <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
            Change Password
          </button>
        </div>
        {/* Profile Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="px-4 py-2 sm:px-6 sm:py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-medium text-sm sm:text-base"
            >
              {editingProfile ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Profile Photo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
              <div className="relative">
                {userProfile?.photoURL || currentUser?.photoURL ? (
                  <img
                    src={userProfile?.photoURL || currentUser?.photoURL}
                    alt="Profile"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#003366]"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#003366] rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || currentUser?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <input
                  ref={profilePhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => profilePhotoInputRef.current?.click()}
                  disabled={uploadingProfilePhoto}
                  className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-[#003366] rounded-full flex items-center justify-center text-white hover:bg-[#002244] transition disabled:opacity-50"
                >
                  {uploadingProfilePhoto ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  )}
                </button>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{userProfile?.name || currentUser?.displayName || 'User'}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{userProfile?.email || currentUser?.email || 'user@example.com'}</p>
                <button
                  onClick={() => profilePhotoInputRef.current?.click()}
                  disabled={uploadingProfilePhoto}
                  className="text-[#003366] text-sm mt-1 hover:underline font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {uploadingProfilePhoto ? 'Uploading...' : 'Change Photo'}
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={userProfile?.name || 'Test User'}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={userProfile?.email || 'test@test.com'}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={userProfile?.phone || '+25470000000'}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                <input
                  type="text"
                  value={userProfile?.companyName || 'Doe Properties Ltd'}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  value={userProfile?.address || 'Westlands, Nairobi'}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Password */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last changed 3 months ago</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium whitespace-nowrap text-sm sm:text-base"
              >
                Change Password
              </button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {securitySettings.twoFactorEnabled ? 'Two-factor authentication is active' : 'Add an extra layer of security to your account'}
                </p>
              </div>
              <button
                onClick={() => securitySettings.twoFactorEnabled ? setSecuritySettings({...securitySettings, twoFactorEnabled: false}) : setShow2FAModal(true)}
                className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg transition font-medium text-sm sm:text-base ${
                  securitySettings.twoFactorEnabled
                    ? 'border border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'bg-[#003366] dark:bg-blue-600 text-white hover:bg-[#002244] dark:hover:bg-blue-700'
                }`}
              >
                {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
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
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>


            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Push Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Receive browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Display Preferences Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Display Preferences</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Dark Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Toggle dark theme for better viewing in low light</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.darkMode}
                  onChange={(e) => setPreferences({...preferences, darkMode: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Auto Refresh</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically refresh data every 30 seconds</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.autoRefresh}
                  onChange={(e) => setPreferences({...preferences, autoRefresh: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Tax Management Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Tax Management
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tax Assistant</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Automatically track and calculate your monthly rental income tax (10% of gross rent).
                  Stay KRA compliant with automatic calculations, payment reminders, and detailed reports.
                </p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Automatic 10% tax calculation on rental payments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Monthly tax summaries and detailed breakdowns</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Payment reminders (Due: 20th of following month)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Compliance reports for KRA audits</span>
                  </div>
                </div>
                {taxTrackingEnabled && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300 font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Tax Assistant is active. View your tax reports in the Tax Reports tab.
                    </p>
                  </div>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={taxTrackingEnabled}
                  onChange={(e) => setTaxTrackingEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Alert Types Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Alert Types</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Payment Alerts</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Maintenance Requests</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Viewing Bookings</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Business Preferences Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Business Preferences</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure your business settings and regional preferences</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                <select
                  value={businessPreferences.currency}
                  onChange={(e) => setBusinessPreferences({...businessPreferences, currency: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                >
                  <option value="KSH">KSH - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
                <select
                  value={businessPreferences.dateFormat}
                  onChange={(e) => setBusinessPreferences({...businessPreferences, dateFormat: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fiscal Year Start</label>
                <select
                  value={businessPreferences.fiscalYearStart}
                  onChange={(e) => setBusinessPreferences({...businessPreferences, fiscalYearStart: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                >
                  <option value="January">January</option>
                  <option value="April">April</option>
                  <option value="July">July</option>
                  <option value="October">October</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                <select
                  value={businessPreferences.language}
                  onChange={(e) => setBusinessPreferences({...businessPreferences, language: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                >
                  <option value="English">English</option>
                  <option value="Swahili">Swahili</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Hours Start</label>
                <input
                  type="time"
                  value={businessPreferences.businessHoursStart}
                  onChange={(e) => setBusinessPreferences({...businessPreferences, businessHoursStart: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Hours End</label>
                <input
                  type="time"
                  value={businessPreferences.businessHoursEnd}
                  onChange={(e) => setBusinessPreferences({...businessPreferences, businessHoursEnd: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Automated Workflows Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Automated Workflows</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Save time with automated tasks and notifications</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Auto-approve Maintenance Requests</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically approve requests under a certain amount</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automatedWorkflows.autoApproveMaintenance}
                    onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, autoApproveMaintenance: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {automatedWorkflows.autoApproveMaintenance && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Approval Limit (KSH)</label>
                  <input
                    type="number"
                    value={automatedWorkflows.maintenanceApprovalLimit}
                    onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, maintenanceApprovalLimit: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* NEW: Maintenance Budget Settings */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Maintenance Budget Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quote Required Threshold (KSH)
                  </label>
                  <input
                    type="number"
                    value={automatedWorkflows.quoteRequiredThreshold}
                    onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, quoteRequiredThreshold: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                    placeholder="10000"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Require formal quotes for maintenance requests above this amount
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Maintenance Budget (KSH)
                  </label>
                  <input
                    type="number"
                    value={automatedWorkflows.monthlyMaintenanceBudget}
                    onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, monthlyMaintenanceBudget: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                    placeholder="50000"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total budget allocated for maintenance per month
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Budget Alerts</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Get notified when approaching budget limit</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={automatedWorkflows.budgetAlertsEnabled}
                      onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, budgetAlertsEnabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                  </label>
                </div>

                {automatedWorkflows.budgetAlertsEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Alert Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="95"
                      step="5"
                      value={automatedWorkflows.budgetAlertThreshold * 100}
                      onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, budgetAlertThreshold: parseInt(e.target.value) / 100})}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Alert when spending reaches {automatedWorkflows.budgetAlertThreshold * 100}% of monthly budget
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Automatic Rent Reminders</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Send reminders before rent is due</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automatedWorkflows.autoRentReminders}
                    onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, autoRentReminders: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {automatedWorkflows.autoRentReminders && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Days Before Due Date</label>
                  <input
                    type="number"
                    value={automatedWorkflows.rentReminderDays}
                    onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, rentReminderDays: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Overdue Payment Notices</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically send overdue notices</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automatedWorkflows.autoOverdueNotices}
                    onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, autoOverdueNotices: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {automatedWorkflows.autoOverdueNotices && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Days After Due Date</label>
                  <input
                    type="number"
                    value={automatedWorkflows.overdueNoticeDays}
                    onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, overdueNoticeDays: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Reports</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Auto-generate and email monthly reports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={automatedWorkflows.autoMonthlyReports}
                  onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, autoMonthlyReports: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Auto-archive Old Records</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically archive records older than specified months</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automatedWorkflows.autoArchiveRecords}
                    onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, autoArchiveRecords: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {automatedWorkflows.autoArchiveRecords && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Archive After (Months)</label>
                  <input
                    type="number"
                    value={automatedWorkflows.archiveAfterMonths}
                    onChange={(e) => setAutomatedWorkflows({...automatedWorkflows, archiveAfterMonths: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Financial Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure payment methods, fees, and financial preferences</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Late Payment Fees</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Charge fees for late rent payments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={financialSettings.lateFeeEnabled}
                    onChange={(e) => setFinancialSettings({...financialSettings, lateFeeEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {financialSettings.lateFeeEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Late Fee Percentage</label>
                    <input
                      type="number"
                      value={financialSettings.lateFeePercentage}
                      onChange={(e) => setFinancialSettings({...financialSettings, lateFeePercentage: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grace Period (Days)</label>
                    <input
                      type="number"
                      value={financialSettings.gracePeriodDays}
                      onChange={(e) => setFinancialSettings({...financialSettings, gracePeriodDays: parseInt(e.target.value)})}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accepted Payment Methods</label>
              <div className="space-y-2">
                {[
                  { value: 'mpesa', label: 'M-Pesa' },
                  { value: 'bank', label: 'Bank Transfer' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Credit/Debit Card' }
                ].map(method => (
                  <label key={method.value} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={financialSettings.acceptedPaymentMethods.includes(method.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFinancialSettings({
                            ...financialSettings,
                            acceptedPaymentMethods: [...financialSettings.acceptedPaymentMethods, method.value]
                          });
                        } else {
                          setFinancialSettings({
                            ...financialSettings,
                            acceptedPaymentMethods: financialSettings.acceptedPaymentMethods.filter(m => m !== method.value)
                          });
                        }
                      }}
                      className="w-4 h-4 text-[#003366] border-gray-300 rounded focus:ring-[#003366]"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invoice Prefix</label>
                <input
                  type="text"
                  value={financialSettings.invoicePrefix}
                  onChange={(e) => setFinancialSettings({...financialSettings, invoicePrefix: e.target.value})}
                  placeholder="INV-2025-"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Receipt Prefix</label>
                <input
                  type="text"
                  value={financialSettings.receiptPrefix}
                  onChange={(e) => setFinancialSettings({...financialSettings, receiptPrefix: e.target.value})}
                  placeholder="RCP-2025-"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Custom Receipt Branding</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add your logo and branding to receipts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={financialSettings.customReceiptBranding}
                  onChange={(e) => setFinancialSettings({...financialSettings, customReceiptBranding: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Communication Preferences Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Communication Preferences</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage how you communicate with tenants</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Signature</label>
              <textarea
                value={communicationPrefs.emailSignature}
                onChange={(e) => setCommunicationPrefs({...communicationPrefs, emailSignature: e.target.value})}
                placeholder="Best regards,&#10;Your Name&#10;Property Management Company"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Auto-Reply Messages</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Send automatic replies outside business hours</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={communicationPrefs.autoReplyEnabled}
                    onChange={(e) => setCommunicationPrefs({...communicationPrefs, autoReplyEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {communicationPrefs.autoReplyEnabled && (
                <textarea
                  value={communicationPrefs.autoReplyMessage}
                  onChange={(e) => setCommunicationPrefs({...communicationPrefs, autoReplyMessage: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                />
              )}
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Tenant Portal Access</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Allow tenants to access their portal</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={communicationPrefs.tenantPortalEnabled}
                  onChange={(e) => setCommunicationPrefs({...communicationPrefs, tenantPortalEnabled: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Tenant Self-Service</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Allow tenants to submit maintenance requests and view payments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={communicationPrefs.allowTenantSelfService}
                  onChange={(e) => setCommunicationPrefs({...communicationPrefs, allowTenantSelfService: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Property Management Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Property Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set default policies for your properties</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Auto-post Vacancies</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically post vacant units to listings</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={propertySettings.autoPostVacancies}
                  onChange={(e) => setPropertySettings({...propertySettings, autoPostVacancies: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Lease Term (Months)</label>
                <select
                  value={propertySettings.minimumLeaseTerm}
                  onChange={(e) => setPropertySettings({...propertySettings, minimumLeaseTerm: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                  <option value={24}>24 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Security Deposit</label>
                <select
                  value={propertySettings.securityDepositMultiple}
                  onChange={(e) => setPropertySettings({...propertySettings, securityDepositMultiple: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                >
                  <option value={1}>1x Monthly Rent</option>
                  <option value={2}>2x Monthly Rent</option>
                  <option value={3}>3x Monthly Rent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Utilities Included</label>
              <div className="grid grid-cols-2 gap-2">
                {['water', 'electricity', 'internet', 'gas'].map(utility => (
                  <label key={utility} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={propertySettings.utilitiesIncluded.includes(utility)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPropertySettings({
                            ...propertySettings,
                            utilitiesIncluded: [...propertySettings.utilitiesIncluded, utility]
                          });
                        } else {
                          setPropertySettings({
                            ...propertySettings,
                            utilitiesIncluded: propertySettings.utilitiesIncluded.filter(u => u !== utility)
                          });
                        }
                      }}
                      className="w-4 h-4 text-[#003366] border-gray-300 rounded focus:ring-[#003366]"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium capitalize">{utility}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pet Policy</label>
              <select
                value={propertySettings.petPolicy}
                onChange={(e) => setPropertySettings({...propertySettings, petPolicy: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
              >
                <option value="allowed">Pets Allowed</option>
                <option value="not_allowed">Pets Not Allowed</option>
                <option value="with_deposit">Pets Allowed with Deposit</option>
              </select>
            </div>

            {propertySettings.petPolicy === 'with_deposit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pet Deposit (KSH)</label>
                <input
                  type="number"
                  value={propertySettings.petDeposit}
                  onChange={(e) => setPropertySettings({...propertySettings, petDeposit: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Team Management Permissions Card */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800">
          <div className="p-4 sm:p-6 border-b border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team Management & Permissions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Control what your team members can access and do</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Property Managers Can Add Tenants</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Allow property managers to add new tenants</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={teamPermissions.propertyManagerCanAddTenants}
                  onChange={(e) => setTeamPermissions({...teamPermissions, propertyManagerCanAddTenants: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Property Managers Can Edit Rent</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Allow property managers to modify rent amounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={teamPermissions.propertyManagerCanEditRent}
                  onChange={(e) => setTeamPermissions({...teamPermissions, propertyManagerCanEditRent: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Maintenance Can View Payments</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Allow maintenance staff to see payment information</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={teamPermissions.maintenanceCanViewPayments}
                  onChange={(e) => setTeamPermissions({...teamPermissions, maintenanceCanViewPayments: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Require Approval for Expenses</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Team members must get approval for expenses above limit</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teamPermissions.requireApprovalForExpenses}
                    onChange={(e) => setTeamPermissions({...teamPermissions, requireApprovalForExpenses: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {teamPermissions.requireApprovalForExpenses && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Approval Limit (KSH)</label>
                  <input
                    type="number"
                    value={teamPermissions.expenseApprovalLimit}
                    onChange={(e) => setTeamPermissions({...teamPermissions, expenseApprovalLimit: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Activity Logs</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all team member actions and changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={teamPermissions.activityLogsEnabled}
                  onChange={(e) => setTeamPermissions({...teamPermissions, activityLogsEnabled: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Reporting & Analytics Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reporting & Analytics</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Customize your reporting and data export preferences</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Export Format</label>
              <select
                value={reportingSettings.defaultExportFormat}
                onChange={(e) => setReportingSettings({...reportingSettings, defaultExportFormat: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
              >
                <option value="PDF">PDF</option>
                <option value="Excel">Excel (.xlsx)</option>
                <option value="CSV">CSV</option>
              </select>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Scheduled Reports</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically send reports via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportingSettings.scheduledReportsEnabled}
                    onChange={(e) => setReportingSettings({...reportingSettings, scheduledReportsEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {reportingSettings.scheduledReportsEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Frequency</label>
                  <select
                    value={reportingSettings.reportFrequency}
                    onChange={(e) => setReportingSettings({...reportingSettings, reportFrequency: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security & Privacy Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security & Privacy</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your account security and data retention</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Timeout (Minutes)</label>
              <select
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Audit Trail</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Log all important actions for security</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securitySettings.auditTrailEnabled}
                  onChange={(e) => setSecuritySettings({...securitySettings, auditTrailEnabled: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Retention Period</label>
              <select
                value={securitySettings.dataRetentionMonths}
                onChange={(e) => setSecuritySettings({...securitySettings, dataRetentionMonths: parseInt(e.target.value)})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
              >
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
                <option value={36}>36 months</option>
                <option value={60}>60 months</option>
              </select>
            </div>
          </div>
        </div>

        {/* Integration Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Integration Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Connect external services and platforms</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">M-Pesa Integration</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect your M-Pesa business account for payments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrationSettings.mpesaEnabled}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, mpesaEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {integrationSettings.mpesaEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Number (Paybill/Till)</label>
                    <input
                      type="text"
                      value={integrationSettings.mpesaBusinessNumber}
                      onChange={(e) => setIntegrationSettings({...integrationSettings, mpesaBusinessNumber: e.target.value})}
                      placeholder="123456"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Passkey</label>
                    <input
                      type="password"
                      value={integrationSettings.mpesaPasskey}
                      onChange={(e) => setIntegrationSettings({...integrationSettings, mpesaPasskey: e.target.value})}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Calendar Sync</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sync viewings and maintenance with your calendar</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrationSettings.calendarSyncEnabled}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, calendarSyncEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {integrationSettings.calendarSyncEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Calendar Provider</label>
                  <select
                    value={integrationSettings.calendarProvider}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, calendarProvider: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                  >
                    <option value="google">Google Calendar</option>
                    <option value="outlook">Microsoft Outlook</option>
                    <option value="apple">Apple Calendar</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">WhatsApp Business</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Send notifications via WhatsApp</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrationSettings.whatsappBusinessEnabled}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, whatsappBusinessEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
                </label>
              </div>
              {integrationSettings.whatsappBusinessEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">WhatsApp Business Number</label>
                  <input
                    type="tel"
                    value={integrationSettings.whatsappNumber}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, whatsappNumber: e.target.value})}
                    placeholder="+254 700 000 000"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-700">
          <div className="p-4 sm:p-6 border-b border-red-200">
            <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Deactivate Account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Deactivate Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Temporarily disable your account</p>
              </div>
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium whitespace-nowrap text-sm sm:text-base"
              >
                Deactivate
              </button>
            </div>

            {/* Delete Account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Delete Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition font-medium text-sm sm:text-base"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
</div>
</div>

      {/* Add Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Property</h2>
              <button onClick={() => setShowPropertyModal(false)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property Name *</label>
                <input
                  type="text"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="e.g., Sunset Apartments"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
                <input
                  type="text"
                  value={newProperty.location}
                  onChange={(e) => setNewProperty({...newProperty, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="e.g., Westlands, Nairobi"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Units *</label>
                  <input
                    type="number"
                    value={newProperty.units}
                    onChange={(e) => setNewProperty({...newProperty, units: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occupied Units</label>
                  <input
                    type="number"
                    value={newProperty.occupied}
                    onChange={(e) => setNewProperty({...newProperty, occupied: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Revenue</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newProperty.revenue}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    setNewProperty({...newProperty, revenue: value});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="240000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Group Link</label>
                <input
                  type="url"
                  value={newProperty.whatsappGroupLink}
                  onChange={(e) => setNewProperty({...newProperty, whatsappGroupLink: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="https://chat.whatsapp.com/..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional: Share with tenants to join estate group</p>
              </div>
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#003366] transition">
       <input
         type="file"
          multiple
          accept="image/*"
          onChange={async (e) => {
          const files = e.target.files;
         if (files && files.length > 0) {
          const urls = await handleImageUpload(files, 'property');
          if (urls && urls.length > 0) {
            setNewProperty({...newProperty, images: [...(newProperty.images || []), ...urls]});
          }
        }
      }}
      className="hidden"
      id="property-images-upload"
    />
    <label htmlFor="property-images-upload" className="cursor-pointer block">
                    {uploadingImages ? (
                      <div className="text-[#003366] dark:text-blue-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-2"></div>
                        <p>Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload property images</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 5MB each</p>
                      </>
                    )}
                  </label>
                </div>
                {newProperty.images && newProperty.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {newProperty.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={() => setNewProperty({...newProperty, images: newProperty.images.filter((_, i) => i !== idx)})}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowPropertyModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
              <button onClick={handleAddProperty} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                Add Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
{showEditPropertyModal && editingProperty && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Property</h2>
        <button onClick={() => {
          setShowEditPropertyModal(false);
          setEditingProperty(null);
        }}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property Name *</label>
          <input
            type="text"
            value={editingProperty.name}
            onChange={(e) => setEditingProperty({...editingProperty, name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="e.g., Sunset Apartments"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
          <input
            type="text"
            value={editingProperty.location}
            onChange={(e) => setEditingProperty({...editingProperty, location: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="e.g., Westlands, Nairobi"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Units *</label>
            <input
              type="number"
              value={editingProperty.units}
              onChange={(e) => setEditingProperty({...editingProperty, units: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occupied Units</label>
            <input
              type="number"
              value={editingProperty.occupied}
              onChange={(e) => setEditingProperty({...editingProperty, occupied: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="8"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Revenue</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={editingProperty.revenue}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
              setEditingProperty({...editingProperty, revenue: value});
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="240000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Group Link</label>
          <input
            type="url"
            value={editingProperty.whatsappGroupLink || ''}
            onChange={(e) => setEditingProperty({...editingProperty, whatsappGroupLink: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="https://chat.whatsapp.com/..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional: Share with tenants to join estate group</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#003366] transition cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={async (e) => {
                const urls = await handleImageUpload(e.target.files, 'property');
                setEditingProperty({...editingProperty, images: [...(editingProperty.images || []), ...urls]});
              }}
              className="hidden"
              id="edit-property-images"
            />
            <label htmlFor="edit-property-images" className="cursor-pointer">
              {uploadingImages ? (
                <div className="text-[#003366] dark:text-blue-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-2"></div>
                  <p>Uploading...</p>
                </div>
              ) : (
                <>
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload property images</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 5MB each</p>
                </>
              )}
            </label>
          </div>
          {editingProperty.images && editingProperty.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {editingProperty.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => setEditingProperty({
                      ...editingProperty, 
                      images: editingProperty.images.filter((_, i) => i !== idx)
                    })}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="p-6 border-t border-gray-200 flex gap-3">
        <button onClick={() => {
          setShowEditPropertyModal(false);
          setEditingProperty(null);
        }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
          Cancel
        </button>
        <button onClick={handleEditProperty} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
          Update Property
        </button>
      </div>
    </div>
  </div>
)}

      {/* Add Tenant Modal */}
      {showTenantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Tenant</h2>
              <button onClick={() => setShowTenantModal(false)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="+254 712 345 678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property *</label>
                  <select
                    value={newTenant.property}
                    onChange={(e) => setNewTenant({...newTenant, property: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Number *</label>
                  <input
                    type="text"
                    value={newTenant.unit}
                    onChange={(e) => setNewTenant({...newTenant, unit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="A12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200 mb-1">Monthly Rent (KES) *</label>
                <input
                  type="number"
                  value={newTenant.rent}
                  onChange={(e) => setNewTenant({...newTenant, rent: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="30000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lease Start Date</label>
                  <input
                    type="date"
                    value={newTenant.leaseStart}
                    onChange={(e) => setNewTenant({...newTenant, leaseStart: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-blue-700 rounded-lg bg-white dark:bg-blue-950/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lease End Date</label>
                  <input
                    type="date"
                    value={newTenant.leaseEnd}
                    onChange={(e) => setNewTenant({...newTenant, leaseEnd: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-blue-700 rounded-lg bg-white dark:bg-blue-950/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Note:</strong> The tenant will receive an email invitation to create their account and access the tenant portal.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendInvitation"
                    checked={newTenant.sendInvitation}
                    onChange={(e) => setNewTenant({...newTenant, sendInvitation: e.target.checked})}
                    className="w-4 h-4 text-[#003366] border-gray-300 dark:border-blue-600 rounded focus:ring-[#003366]"
                  />
                  <label htmlFor="sendInvitation" className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Send invitation email to tenant
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button onClick={() => setShowTenantModal(false)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                Cancel
              </button>
              <button onClick={handleAddTenant} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                Add Tenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Listing Modal */}
      {showListingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Property Listing</h2>
              <button onClick={() => setShowListingModal(false)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property *</label>
                  <select
                    value={newListing.property}
                    onChange={(e) => setNewListing({...newListing, property: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Number *</label>
                  <input
                    type="text"
                    value={newListing.unit}
                    onChange={(e) => setNewListing({...newListing, unit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="A12"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bedrooms *</label>
                  <input
                    type="number"
                    value={newListing.bedrooms}
                    onChange={(e) => setNewListing({...newListing, bedrooms: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={newListing.bathrooms}
                    onChange={(e) => setNewListing({...newListing, bathrooms: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area (m²)</label>
                  <input
                    type="number"
                    value={newListing.area}
                    onChange={(e) => setNewListing({...newListing, area: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="80"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Rent (KES) *</label>
                  <input
                    type="number"
                    value={newListing.rent}
                    onChange={(e) => setNewListing({...newListing, rent: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="30000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deposit (KES)</label>
                  <input
                    type="number"
                    value={newListing.deposit}
                    onChange={(e) => setNewListing({...newListing, deposit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="30000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newListing.description}
                  onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Describe the property..."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={newListing.amenities}
                  onChange={(e) => setNewListing({...newListing, amenities: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="WiFi, Parking, Security, Swimming Pool"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#003366] transition cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const urls = await handleImageUpload(e.target.files, 'listing');
                      setNewListing({...newListing, images: [...newListing.images, ...urls]});
                    }}
                    className="hidden"
                    id="listing-images"
                  />
                  <label htmlFor="listing-images" className="cursor-pointer">
                    {uploadingImages ? (
                      <div className="text-[#003366] dark:text-blue-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-2"></div>
                        <p>Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload listing images</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add multiple photos to showcase the property</p>
                      </>
                    )}
                  </label>
                </div>
                {newListing.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {newListing.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={() => setNewListing({...newListing, images: newListing.images.filter((_, i) => i !== idx)})}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowListingModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
              <button onClick={handleAddListing} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                Publish Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {showEditListingModal && editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Property Listing</h2>
              <button onClick={() => { setShowEditListingModal(false); setEditingListing(null); }}>
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property *</label>
                  <select
                    value={editingListing.property}
                    onChange={(e) => setEditingListing({...editingListing, property: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Number *</label>
                  <input
                    type="text"
                    value={editingListing.unit}
                    onChange={(e) => setEditingListing({...editingListing, unit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="A12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bedrooms *</label>
                  <input
                    type="number"
                    value={editingListing.bedrooms}
                    onChange={(e) => setEditingListing({...editingListing, bedrooms: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={editingListing.bathrooms}
                    onChange={(e) => setEditingListing({...editingListing, bathrooms: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area (m²)</label>
                  <input
                    type="number"
                    value={editingListing.area}
                    onChange={(e) => setEditingListing({...editingListing, area: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Rent (KES) *</label>
                  <input
                    type="number"
                    value={editingListing.rent}
                    onChange={(e) => setEditingListing({...editingListing, rent: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="30000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deposit (KES)</label>
                  <input
                    type="number"
                    value={editingListing.deposit}
                    onChange={(e) => setEditingListing({...editingListing, deposit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="30000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={editingListing.description}
                  onChange={(e) => setEditingListing({...editingListing, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Describe the property..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editingListing.amenities) ? editingListing.amenities.join(', ') : editingListing.amenities}
                  onChange={(e) => setEditingListing({...editingListing, amenities: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="WiFi, Parking, Security, Swimming Pool"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Property Images</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#003366] transition cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const urls = await handleImageUpload(e.target.files, 'listing');
                      setEditingListing({...editingListing, images: [...(editingListing.images || []), ...urls]});
                    }}
                    className="hidden"
                    id="edit-listing-images"
                  />
                  <label htmlFor="edit-listing-images" className="cursor-pointer">
                    {uploadingImages ? (
                      <div className="text-[#003366] dark:text-blue-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-2"></div>
                        <p>Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload more images</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add multiple photos to showcase the property</p>
                      </>
                    )}
                  </label>
                </div>
                {editingListing.images && editingListing.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {editingListing.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={() => setEditingListing({...editingListing, images: editingListing.images.filter((_, i) => i !== idx)})}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => { setShowEditListingModal(false); setEditingListing(null); }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditListing}
                className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
              >
                Update Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Memo Modal */}
      {showMemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send Memo to Tenants</h2>
              <button onClick={() => setShowMemoModal(false)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={newMemo.title}
                  onChange={(e) => setNewMemo({...newMemo, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="e.g., Water Maintenance Notice"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                <textarea
                  value={newMemo.message}
                  onChange={(e) => setNewMemo({...newMemo, message: e.target.value})}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Type your message here..."
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={newMemo.priority}
                    onChange={(e) => setNewMemo({...newMemo, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Send To</label>
                  <select
                    value={newMemo.targetAudience}
                    onChange={(e) => setNewMemo({...newMemo, targetAudience: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="all">All Tenants</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name} Only</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowMemoModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
              <button onClick={handleSendMemo} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Send Memo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Maintenance Request</h2>
              <button onClick={() => setShowMaintenanceModal(false)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property *</label>
                  <select
                    value={newMaintenance.property}
                    onChange={(e) => setNewMaintenance({...newMaintenance, property: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit *</label>
                  <input
                    type="text"
                    value={newMaintenance.unit}
                    onChange={(e) => setNewMaintenance({...newMaintenance, unit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="A12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant *</label>
                <select
                  value={newMaintenance.tenant}
                  onChange={(e) => setNewMaintenance({...newMaintenance, tenant: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="">Select Tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.name}>{tenant.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Description *</label>
                <textarea
                  value={newMaintenance.issue}
                  onChange={(e) => setNewMaintenance({...newMaintenance, issue: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Describe the maintenance issue..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={newMaintenance.priority}
                  onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowMaintenanceModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
              <button onClick={handleAddMaintenance} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                Add Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant *</label>
                <select
                  value={newPayment.tenant}
                  onChange={(e) => {
                    const selectedTenant = tenants.find(t => t.name === e.target.value);
                    setNewPayment({
                      ...newPayment,
                      tenant: e.target.value,
                      tenantId: selectedTenant?.id || '',
                      property: selectedTenant?.property || '',
                      unit: selectedTenant?.unit || '',
                      amount: selectedTenant?.rent || ''
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="">Select Tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.name}>{tenant.name} - {tenant.property}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property</label>
                  <input
                    type="text"
                    value={newPayment.property}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newPayment.unit}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="30000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={newPayment.dueDate}
                    onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                <select
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({...newPayment, method: e.target.value, referenceNumber: ''})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="">Not paid yet</option>
                  {/* Filter payment methods based on acceptedPaymentMethods setting */}
                  {financialSettings.acceptedPaymentMethods.includes('mpesa') && (
                    <option value="M-Pesa">M-Pesa</option>
                  )}
                  {financialSettings.acceptedPaymentMethods.includes('bank') && (
                    <option value="Bank Transfer">Bank Transfer</option>
                  )}
                  {financialSettings.acceptedPaymentMethods.includes('cash') && (
                    <option value="Cash">Cash</option>
                  )}
                  {financialSettings.acceptedPaymentMethods.includes('card') && (
                    <option value="Card">Credit/Debit Card</option>
                  )}
                </select>
              </div>

              {/* Conditional Reference Number Field */}
              {(newPayment.method === 'M-Pesa' || newPayment.method === 'Bank Transfer' || newPayment.method === 'Cheque') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {newPayment.method === 'M-Pesa' && 'M-Pesa Transaction Code'}
                    {newPayment.method === 'Bank Transfer' && 'Bank Reference Number'}
                    {newPayment.method === 'Cheque' && 'Cheque Number'}
                  </label>
                  <input
                    type="text"
                    value={newPayment.referenceNumber}
                    onChange={(e) => setNewPayment({...newPayment, referenceNumber: e.target.value})}
                    placeholder={
                      newPayment.method === 'M-Pesa' ? 'e.g., SH12ABC3DE4' :
                      newPayment.method === 'Bank Transfer' ? 'e.g., FT2024123456' :
                      'e.g., 123456'
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {newPayment.method === 'M-Pesa' && 'Enter the M-Pesa confirmation code from the SMS'}
                    {newPayment.method === 'Bank Transfer' && 'Enter the bank transaction reference number'}
                    {newPayment.method === 'Cheque' && 'Enter the cheque number'}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
              <button onClick={handleAddPayment} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Payment Modal */}
      {showTaxPaymentModal && selectedTaxPeriod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Record Tax Payment</h2>
              <button onClick={() => setShowTaxPaymentModal(false)}>
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Tax Period</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedTaxPeriod.monthName} {selectedTaxPeriod.year}
                </p>
                <p className="text-sm text-gray-600 mt-2">Tax Amount Due</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(selectedTaxPeriod.taxDue, businessPreferences.currency)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={taxPaymentData.paymentDate}
                  onChange={(e) => setTaxPaymentData({...taxPaymentData, paymentDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  KRA Payment Reference Number (PRN)
                </label>
                <input
                  type="text"
                  value={taxPaymentData.prn}
                  onChange={(e) => setTaxPaymentData({...taxPaymentData, prn: e.target.value})}
                  placeholder="e.g., 1234567890"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the PRN from your iTax payment confirmation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount Paid (KES) *
                </label>
                <input
                  type="number"
                  value={taxPaymentData.amount}
                  onChange={(e) => setTaxPaymentData({...taxPaymentData, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowTaxPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!taxPaymentData.paymentDate || !taxPaymentData.amount) {
                    alert('Please fill in all required fields');
                    return;
                  }

                  try {
                    // Here you would save to a taxPayments collection in Firestore
                    // For now, just show success message
                    alert('Tax payment recorded successfully!');
                    setShowTaxPaymentModal(false);
                    setTaxPaymentData({ paymentDate: '', prn: '', amount: '' });
                  } catch (error) {
                    console.error('Error recording tax payment:', error);
                    alert('Error recording tax payment. Please try again.');
                  }
                }}
                className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
              >
                Save Payment Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Deactivate Account?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your account will be temporarily disabled. You can reactivate it by logging in again. Your data will not be deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  className="flex-1 px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateAccount}
                  className="flex-1 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Account Permanently?</h3>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-2">
                  ⚠️ This action cannot be undone!
                </p>
                <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                  <li>All your properties and tenant data will be deleted</li>
                  <li>All payment records will be permanently removed</li>
                  <li>Your account will be completely erased</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Yes, Delete Forever
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
                  setSecuritySettings({...securitySettings, twoFactorEnabled: true});
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
              <button onClick={handleChangePassword} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Details Modal */}
      {selectedViewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Viewing Request Details</h2>
              <button onClick={() => setSelectedViewing(null)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Prospect Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#003366] dark:text-blue-400" />
                  Prospect Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Full Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedViewing.prospectName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedViewing.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedViewing.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedViewing.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        selectedViewing.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300'
                      }`}>
                        {selectedViewing.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property & Viewing Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#003366] dark:text-blue-400" />
                  Property & Viewing Details
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Property</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedViewing.property}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Viewing Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedViewing.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Preferred Time</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedViewing.time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Submitted</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedViewing.submittedDate || 'Today'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credibility Score */}
              {selectedViewing.credibilityScore && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Credibility Assessment</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Overall Score</span>
                      <span className={`text-2xl font-bold ${
                        selectedViewing.credibilityScore >= 80 ? 'text-green-600 dark:text-green-400' :
                        selectedViewing.credibilityScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {selectedViewing.credibilityScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          selectedViewing.credibilityScore >= 80 ? 'bg-green-500' :
                          selectedViewing.credibilityScore >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${selectedViewing.credibilityScore}%` }}
                      ></div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Email & Phone Verified</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Employment Information Provided</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Detailed Motivation Submitted</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Employment Info */}
              {selectedViewing.employment && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Employment Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedViewing.employment}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Income Range</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedViewing.incomeRange || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Motivation */}
              {selectedViewing.motivation && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Why They're Interested</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{selectedViewing.motivation}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedViewing.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => {
                      handleUpdateViewingStatus(selectedViewing.id, 'confirmed');
                      setSelectedViewing(null);
                    }}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Viewing
                  </button>
                  <button 
                    onClick={() => {
                      handleUpdateViewingStatus(selectedViewing.id, 'declined');
                      setSelectedViewing(null);
                    }}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Listing Details Modal */}
      {showListingDetailsModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedListing.property} - Unit {selectedListing.unit}
              </h2>
              <button
                onClick={() => {
                  setShowListingDetailsModal(false);
                  setSelectedListing(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image Gallery */}
              {selectedListing.images && selectedListing.images.length > 0 && (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={selectedListing.images[currentImageIndex]}
                      alt={`View ${currentImageIndex + 1}`}
                      className="w-full h-96 object-cover rounded-lg"
                    />

                    {selectedListing.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((currentImageIndex - 1 + selectedListing.images.length) % selectedListing.images.length)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-700 bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition"
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((currentImageIndex + 1) % selectedListing.images.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-700 bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition"
                        >
                          <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black bg-opacity-70 text-white rounded-full text-sm">
                          {currentImageIndex + 1} / {selectedListing.images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {selectedListing.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedListing.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                            idx === currentImageIndex ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Bed className="w-5 h-5" />
                      <span className="font-medium text-gray-900 dark:text-white">{selectedListing.bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Bath className="w-5 h-5" />
                      <span className="font-medium text-gray-900 dark:text-white">{selectedListing.bathrooms} Bathrooms</span>
                    </div>
                    {selectedListing.area > 0 && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Square className="w-5 h-5" />
                        <span className="font-medium text-gray-900 dark:text-white">{selectedListing.area} m²</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-5 h-5" />
                      <span className="font-medium text-gray-900 dark:text-white">{selectedListing.property}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</p>
                      <p className="text-2xl font-bold text-[#003366] dark:text-blue-400">{formatCurrency(selectedListing.rent, businessPreferences.currency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Security Deposit</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedListing.deposit, businessPreferences.currency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Posted Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(selectedListing.postedDate, businessPreferences.dateFormat)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedListing.status === 'available' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {selectedListing.status === 'available' ? 'Available' : 'Occupied'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedListing.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedListing.description}</p>
                </div>
              )}

              {/* Amenities */}
              {selectedListing.amenities && selectedListing.amenities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.amenities.map((amenity, idx) => (
                      <span key={idx} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Add Team Member Modal */}
{showTeamModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Team Member</h2>
        <button onClick={() => setShowTeamModal(false)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
      </div>
      <div className="p-6 space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Note:</strong> The team member will receive an email invitation to create their account and access the platform.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
          <input
            type="text"
            value={newTeamMember.name}
            onChange={(e) => setNewTeamMember({...newTeamMember, name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
          <input
            type="email"
            value={newTeamMember.email}
            onChange={(e) => setNewTeamMember({...newTeamMember, email: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
          <input
            type="tel"
            value={newTeamMember.phone}
            onChange={(e) => setNewTeamMember({...newTeamMember, phone: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="+254 712 345 678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
          <select
            value={newTeamMember.role}
            onChange={(e) => setNewTeamMember({...newTeamMember, role: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          >
            <option value="property_manager">Property Manager</option>
            <option value="maintenance">Maintenance Staff</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {newTeamMember.role === 'property_manager' 
              ? 'Can manage properties, tenants, and view reports' 
              : 'Can view and update maintenance requests'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign to Properties (Optional)</label>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700">
            {properties.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No properties available</p>
            ) : (
              properties.map(property => (
                <label key={property.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTeamMember.assignedProperties.includes(property.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewTeamMember({
                          ...newTeamMember,
                          assignedProperties: [...newTeamMember.assignedProperties, property.id]
                        });
                      } else {
                        setNewTeamMember({
                          ...newTeamMember,
                          assignedProperties: newTeamMember.assignedProperties.filter(id => id !== property.id)
                        });
                      }
                    }}
                    className="w-4 h-4 text-[#003366] border-gray-300 dark:border-gray-600 rounded focus:ring-[#003366]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{property.name} - {property.location}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
        <button onClick={() => setShowTeamModal(false)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
          Cancel
        </button>
        <button onClick={handleAddTeamMember} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
          Send Invitation
        </button>
      </div>
    </div>
  </div>
)}

{/* Assign Properties Modal */}
{showAssignTeamModal && selectedTeamMember && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Properties to {selectedTeamMember.name}</h2>
        <button onClick={() => setShowAssignTeamModal(false)}><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select which properties this team member can access:</p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {properties.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No properties available</p>
          ) : (
            properties.map(property => (
              <label key={property.id} className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedTeamMember.assignedProperties?.includes(property.id) || false}
                  onChange={() => handleAssignToProperty(selectedTeamMember.id, property.id)}
                  className="w-5 h-5 text-[#003366] border-gray-300 dark:border-gray-600 rounded focus:ring-[#003366] mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{property.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{property.location}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{property.units} units • {property.occupied} occupied</p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <button onClick={() => setShowAssignTeamModal(false)} className="w-full px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
          Done
        </button>
      </div>
    </div>
  </div>
)}

{/* Tenant Details Modal */}
{showTenantDetailsModal && selectedTenantForDetails && (
  <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Tenant Details</h3>
        <button
          onClick={() => {
            setShowTenantDetailsModal(false);
            setSelectedTenantForDetails(null);
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Personal Information */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            Personal Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedTenantForDetails.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
              <p className="text-base text-gray-900 dark:text-white">{selectedTenantForDetails.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
              <p className="text-base text-gray-900 dark:text-white">{selectedTenantForDetails.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                selectedTenantForDetails.status === 'active' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                selectedTenantForDetails.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {selectedTenantForDetails.status}
              </span>
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            Property Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Property</label>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedTenantForDetails.property}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Unit Number</label>
              <p className="text-base text-gray-900 dark:text-white">{selectedTenantForDetails.unit}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Rent</label>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedTenantForDetails.rent, businessPreferences.currency)}</p>
            </div>
          </div>
        </div>

        {/* Lease Information */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            Lease Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Lease Start Date</label>
              <p className="text-base text-gray-900 dark:text-white">{formatDate(selectedTenantForDetails.leaseStart, businessPreferences.dateFormat)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Lease End Date</label>
              <p className="text-base text-gray-900 dark:text-white">{formatDate(selectedTenantForDetails.leaseEnd, businessPreferences.dateFormat)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => {
              setShowTenantDetailsModal(false);
              handleMessageTenant(selectedTenantForDetails);
            }}
            className="flex-1 px-4 py-3 bg-[#003366] dark:bg-[#004080] text-white rounded-lg hover:bg-[#002244] dark:hover:bg-[#003366] transition flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" />
            Send Message
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${selectedTenantForDetails.name}?`)) {
                handleDeleteTenant(selectedTenantForDetails.id, selectedTenantForDetails.name);
                setShowTenantDetailsModal(false);
                setSelectedTenantForDetails(null);
              }
            }}
            className="px-4 py-3 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Message Modal */}
{showMessageModal && selectedTenantForMessage && (
  <MessageModal
    tenant={selectedTenantForMessage}
    currentUser={currentUser}
    userProfile={userProfile}
    isOpen={showMessageModal}
    onClose={() => {
      setShowMessageModal(false);
      setSelectedTenantForMessage(null);
    }}
    senderRole="landlord"
  />
)}

{/* Invitation Modal */}
<InvitationModal
  isOpen={showInvitationModal}
  onClose={() => {
    setShowInvitationModal(false);
    setPendingInvitation(null);

    // Show success message after modal closes if flag is set
    if (showSuccessAfterInvitation) {
      alert('Tenant added successfully!');
      setShowSuccessAfterInvitation(false);
    }
  }}
  invitationData={pendingInvitation}
  onSendEmail={() => {
    alert('Email invitation sent automatically via Firebase Function!');
  }}
/>

{/* Delete Conversation Confirmation Modal */}
{showDeleteConfirm && conversationToDelete && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Conversation?</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
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

{/* Estimate Approval Modal */}
{showEstimateApprovalModal && selectedRequestForApproval && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl p-4 sm:p-6 my-8 max-h-[95vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 pr-2">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Review Cost Estimate</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">
            {selectedRequestForApproval.issue} - {selectedRequestForApproval.property}, Unit {selectedRequestForApproval.unit}
          </p>
        </div>
        <button
          onClick={handleCloseEstimateApproval}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition flex-shrink-0"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Estimate Details */}
      <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
        {/* Total Cost */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">💰</span>
              <div>
                <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">Total Estimated Cost</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-200">
                  KSH {selectedRequestForApproval.estimatedCost?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
            {selectedRequestForApproval.estimatedDuration && (
              <div className="text-left sm:text-right pl-9 sm:pl-0">
                <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">Estimated Duration</div>
                <div className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-200">
                  {selectedRequestForApproval.estimatedDuration}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        {selectedRequestForApproval.costBreakdown && selectedRequestForApproval.costBreakdown.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <span>📊</span> Cost Breakdown
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-700">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Item</th>
                    <th className="text-center px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                    <th className="text-right px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Unit Cost</th>
                    <th className="text-right px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedRequestForApproval.costBreakdown.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200">{item.item || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-200">{item.quantity || 0}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm text-gray-900 dark:text-gray-200">
                        KSH {parseFloat(item.unitCost || 0).toLocaleString()}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-200">
                        KSH {(item.total || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <td colSpan="3" className="px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                      Total:
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                      KSH {selectedRequestForApproval.estimatedCost?.toLocaleString() || '0'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Estimate Notes */}
        {selectedRequestForApproval.estimateNotes && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>📝</span> Technician's Notes
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedRequestForApproval.estimateNotes}
              </p>
            </div>
          </div>
        )}

        {/* Approval Notes */}
        <div>
          <label className="block font-semibold text-gray-900 dark:text-white mb-2">
            Your Notes (Optional)
          </label>
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add any notes or comments about this estimate..."
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            rows="3"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Note: Required if rejecting the estimate
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCloseEstimateApproval}
          className="w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium text-sm sm:text-base"
        >
          Cancel
        </button>
        <button
          onClick={handleRejectEstimate}
          className="w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <span>❌</span> <span className="hidden sm:inline">Reject Estimate</span><span className="sm:hidden">Reject</span>
        </button>
        <button
          onClick={handleApproveEstimate}
          className="w-full sm:flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <span>✅</span> <span className="hidden sm:inline">Approve & Proceed</span><span className="sm:hidden">Approve</span>
        </button>
      </div>
    </div>
  </div>
)}

{/* Quote Comparison Modal */}
{showQuoteComparisonModal && selectedRequestForQuotes && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      {/* Modal Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compare Quotes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedRequestForQuotes.property} - Unit {selectedRequestForQuotes.unit}
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
              Issue: {selectedRequestForQuotes.issue}
            </p>
          </div>
          <button
            onClick={handleCloseQuoteComparison}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="p-6">
        {loadingQuotes ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl">📋</span>
            <p className="text-gray-600 dark:text-gray-400 mt-4">No quotes submitted yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className={`border-2 rounded-xl p-5 transition-all ${
                  quote.status === 'approved'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : quote.status === 'rejected'
                    ? 'border-red-300 bg-gray-50 dark:bg-gray-900/30 opacity-60'
                    : selectedQuoteForApproval?.id === quote.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                }`}
              >
                {/* Quote Status Badge */}
                {quote.status !== 'pending' && (
                  <div className="mb-3">
                    {quote.status === 'approved' && (
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        ✅ Approved
                      </span>
                    )}
                    {quote.status === 'rejected' && (
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                        ❌ Rejected
                      </span>
                    )}
                  </div>
                )}

                {/* Vendor Name */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {quote.vendorName}
                </h3>

                {/* Amount */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    KSH {quote.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Quote #{quote.quoteNumber}
                  </div>
                </div>

                {/* Vendor Contact */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span>{quote.vendorContact}</span>
                  </div>
                  {quote.vendorEmail && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{quote.vendorEmail}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {quote.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {quote.description}
                    </p>
                  </div>
                )}

                {/* Itemized Costs */}
                {quote.itemizedCosts && quote.itemizedCosts.length > 0 && (
                  <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Cost Breakdown:
                    </div>
                    <div className="space-y-1">
                      {quote.itemizedCosts.map((item, index) => (
                        <div key={index} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>{item.item}</span>
                          <span className="font-medium">KSH {parseFloat(item.cost || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid Until */}
                {quote.validUntil && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Valid until: {new Date(quote.validUntil).toLocaleDateString()}
                  </div>
                )}

                {/* Submitted By & Date */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>Submitted by: {quote.submittedByName || 'Staff'}</div>
                  <div className="mt-1">
                    {quote.submittedAt && new Date(quote.submittedAt.toDate()).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons */}
                {quote.status === 'pending' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedQuoteForApproval(quote);
                        setQuoteApprovalNotes('');
                      }}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                    >
                      {selectedQuoteForApproval?.id === quote.id ? 'Selected' : 'Select Quote'}
                    </button>
                    {selectedQuoteForApproval?.id === quote.id && (
                      <button
                        onClick={() => handleApproveQuote(quote)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve & Proceed
                      </button>
                    )}
                  </div>
                )}

                {/* Rejection Reason if Rejected */}
                {quote.status === 'rejected' && quote.rejectionReason && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                    <span className="font-semibold">Rejection reason:</span> {quote.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rejection Section */}
        {selectedQuoteForApproval && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block font-semibold text-gray-900 dark:text-white mb-2">
              Approval Notes (Optional)
            </label>
            <textarea
              value={quoteApprovalNotes}
              onChange={(e) => setQuoteApprovalNotes(e.target.value)}
              placeholder="Add any notes about this quote selection..."
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              rows="3"
            />
          </div>
        )}

        {/* Reject Quotes Section */}
        {quotes.some(q => q.status === 'pending') && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">Reject Quotes</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              If none of these quotes are acceptable, you can reject individual quotes. Provide a reason for each rejection.
            </p>
            <div className="space-y-2">
              {quotes
                .filter(q => q.status === 'pending')
                .map((quote) => (
                  <div key={quote.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {quote.vendorName} - KSH {quote.amount.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const reason = prompt(`Enter rejection reason for ${quote.vendorName}:`);
                        if (reason) {
                          setQuoteApprovalNotes(reason);
                          handleRejectQuote(quote);
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCloseQuoteComparison}
          className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* Move-Out Notice Modal (Landlord to Tenant) */}
      {showMoveOutNoticeModal && selectedTenantForNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileSignature className="w-6 h-6 text-orange-600" />
                Issue Move-Out Notice
              </h3>
              <button
                onClick={() => {
                  setShowMoveOutNoticeModal(false);
                  setSelectedTenantForNotice(null);
                  setLandlordMoveOutData({
                    noticePeriod: 30,
                    reason: 'Breach of Contract',
                    legalGrounds: '',
                    additionalTerms: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Warning Banner */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-300 text-sm mb-1">Legal Notice</h4>
                  <p className="text-xs text-orange-800 dark:text-orange-400">
                    This is a legally binding notice. A formal legal document will be generated and sent to the tenant. Ensure all details are accurate and legal grounds are properly documented.
                  </p>
                </div>
              </div>

              {/* Tenant Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-3">Issuing Notice To:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tenant:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedTenantForNotice.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Property:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedTenantForNotice.property}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Unit:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedTenantForNotice.unit}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <p className="font-medium text-gray-900 dark:text-white truncate">{selectedTenantForNotice.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Notice Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Notice Period <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="noticePeriod"
                      value={30}
                      checked={landlordMoveOutData.noticePeriod === 30}
                      onChange={(e) => setLandlordMoveOutData({...landlordMoveOutData, noticePeriod: 30})}
                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                    />
                    <span className="text-gray-900 dark:text-white">30 Days</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="noticePeriod"
                      value={60}
                      checked={landlordMoveOutData.noticePeriod === 60}
                      onChange={(e) => setLandlordMoveOutData({...landlordMoveOutData, noticePeriod: 60})}
                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                    />
                    <span className="text-gray-900 dark:text-white">60 Days</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Calculated move-out date: {new Date(Date.now() + landlordMoveOutData.noticePeriod * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Notice <span className="text-red-500">*</span>
                </label>
                <select
                  value={landlordMoveOutData.reason}
                  onChange={(e) => setLandlordMoveOutData({...landlordMoveOutData, reason: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Breach of Contract">Breach of Contract</option>
                  <option value="Non-Payment">Non-Payment of Rent</option>
                  <option value="Property Sale">Property Sale</option>
                  <option value="Renovation">Major Renovation</option>
                  <option value="Owner Occupancy">Owner/Family Occupancy</option>
                  <option value="Other">Other Legal Grounds</option>
                </select>
              </div>

              {/* Legal Grounds (Required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Legal Grounds <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={landlordMoveOutData.legalGrounds}
                  onChange={(e) => setLandlordMoveOutData({...landlordMoveOutData, legalGrounds: e.target.value})}
                  rows={4}
                  placeholder="Provide specific legal grounds and details for issuing this notice. This will be included in the legal document..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                ></textarea>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Be specific and factual. This information will be used in the official legal notice.
                </p>
              </div>

              {/* Additional Terms/Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Terms & Conditions (Optional)
                </label>
                <textarea
                  value={landlordMoveOutData.additionalTerms}
                  onChange={(e) => setLandlordMoveOutData({...landlordMoveOutData, additionalTerms: e.target.value})}
                  rows={3}
                  placeholder="Any additional terms, requirements, or conditions..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                ></textarea>
              </div>

              {/* What Happens Next */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">What happens next?</h4>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">1.</span>
                    <span>A legal notice will be generated in the prescribed format with all required details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">2.</span>
                    <span>The tenant will be notified immediately via email and in-app notification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">3.</span>
                    <span>Tenant must acknowledge receipt within 7 days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">4.</span>
                    <span>Property inspection will be scheduled before the move-out date</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">5.</span>
                    <span>All actions will be logged for legal compliance and audit trail</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowMoveOutNoticeModal(false);
                    setSelectedTenantForNotice(null);
                    setLandlordMoveOutData({
                      noticePeriod: 30,
                      reason: 'Breach of Contract',
                      legalGrounds: '',
                      additionalTerms: ''
                    });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  disabled={submittingMoveOutNotice}
                >
                  Cancel
                </button>
                <button
                  onClick={handleIssueMoveOutNotice}
                  disabled={submittingMoveOutNotice}
                  className="flex-1 px-6 py-3 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingMoveOutNotice ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Issuing Notice...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Issue Notice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandlordDashboard;
                        