import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
  Menu
} from 'lucide-react';

// Initialize Firebase services
const functions = getFunctions();
const db = getFirestore();

const TenantDashboard = () => {
  // ============ STATE MANAGEMENT ============
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Loading states for Firebase operations
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

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
    notifications: {
      email: true,
      sms: true,
      push: true,
      rentReminders: true,
      maintenanceUpdates: true,
      messageAlerts: true
    }
  });

  // ENHANCED BOOKING DATA WITH CREDIBILITY FIELDS
  const [bookingData, setBookingData] = useState({
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

  const [documents, setDocuments] = useState([
    { id: 1, name: 'Lease Agreement', type: 'PDF', date: '2024-01-15', size: '2.4 MB' },
    { id: 2, name: 'Payment Receipt - Nov 2024', type: 'PDF', date: '2024-11-03', size: '156 KB' },
    { id: 3, name: 'Property Inspection Report', type: 'PDF', date: '2024-01-20', size: '1.8 MB' },
    { id: 4, name: 'Move-in Checklist', type: 'PDF', date: '2024-01-15', size: '890 KB' }
  ]);

  const [messages, setMessages] = useState([
    { id: 1, from: 'Property Manager', subject: 'Monthly Reminder', date: '2024-11-30', read: false, preview: 'Your rent is due on December 5th...' },
    { id: 2, from: 'Maintenance Team', subject: 'Re: Kitchen Faucet', date: '2024-11-28', read: true, preview: 'We will send a technician tomorrow...' }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Rent payment due in 3 days', time: '2 hours ago', read: false, type: 'payment' },
    { id: 2, message: 'Maintenance request updated to In Progress', time: '1 day ago', read: false, type: 'maintenance' }
  ]);

  const [newPayment, setNewPayment] = useState({
    amount: '35000',
    method: 'M-Pesa',
    reference: '',
    date: new Date().toISOString().split('T')[0]
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

  const availableListings = [
    { 
      id: 1, 
      name: 'Garden View Apartments', 
      location: 'Kilimani, Nairobi', 
      rent: 38000, 
      bedrooms: 2, 
      bathrooms: 2, 
      area: 85, 
      amenities: ['Parking', 'Security', 'Water'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=800'
      ]
    },
    { 
      id: 2, 
      name: 'Skyline Residences', 
      location: 'Westlands, Nairobi', 
      rent: 45000, 
      bedrooms: 3, 
      bathrooms: 2, 
      area: 110, 
      amenities: ['Gym', 'Pool', 'Parking', 'Security'],
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
      ]
    },
    { 
      id: 3, 
      name: 'Riverside Studios', 
      location: 'Kileleshwa, Nairobi', 
      rent: 28000, 
      bedrooms: 1, 
      bathrooms: 1, 
      area: 45, 
      amenities: ['Security', 'Water', 'Backup Generator'],
      images: [
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
      ]
    }
  ];
  // ============ HELPER FUNCTIONS ============
  
  // Calculate application strength score
  const calculateApplicationStrength = () => {
    let score = 0;
    let maxScore = 100;
    
    // Contact verification (25%)
    if (bookingData.emailVerified) score += 25;
    
    // Employment info (25%)
    const employmentFields = [
      bookingData.employmentStatus,
      bookingData.occupation,
      bookingData.employerName,
      bookingData.monthlyIncome,
      bookingData.currentResidence
    ];
    const filledEmploymentFields = employmentFields.filter(field => field && field.trim() !== '').length;
    score += (filledEmploymentFields / employmentFields.length) * 25;
    
    // Motivation (25%)
    if (bookingData.motivation.length >= 50) {
      score += 25;
    } else if (bookingData.motivation.length > 0) {
      score += (bookingData.motivation.length / 50) * 25;
    }
    
    // Additional info (25%)
    const additionalFields = [
      bookingData.moveInDate,
      bookingData.references,
      bookingData.employerPhone
    ];
    const filledAdditionalFields = additionalFields.filter(field => field && field.trim() !== '').length;
    score += (filledAdditionalFields / additionalFields.length) * 25;
    
    return Math.round(score);
  };

  const getStrengthColor = (score) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthBgColor = (score) => {
    if (score >= 75) return 'bg-green-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  // ============ EVENT HANDLERS ============
  
  const handleSendVerification = async (type) => {
    setIsSendingVerification(true);
    
    try {
      const sendVerificationCode = httpsCallable(functions, 'sendVerificationCode');
      const contact = type === 'email' ? bookingData.email : bookingData.phone;
      
      const result = await sendVerificationCode({ 
        type, 
        contact,
        name: bookingData.name 
      });
      
      if (result.data.success) {
        setVerificationSent({ ...verificationSent, [type]: true });
        alert(`Verification code sent to your ${type}!`);
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      alert(`Failed to send verification code. Please try again.`);
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleVerifyCode = (type) => {
    const code = verificationCodes[type];
    if (code && code.length === 6) {
      setBookingData({ ...bookingData, [`${type}Verified`]: true });
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} verified successfully!`);
    } else {
      alert('Please enter a valid 6-digit code');
    }
  };

  const handleBookViewing = async () => {
    if (!bookingData.date || !bookingData.time) {
      alert('Please select both date and time for your viewing');
      return;
    }

    const strength = calculateApplicationStrength();
    
    if (strength < 25) {
      alert('Please complete more fields to strengthen your application before submitting.');
      return;
    }

    setIsSubmittingBooking(true);

    try {
      const viewingRef = collection(db, 'viewings');
      await addDoc(viewingRef, {
        listingId: selectedListing.id,
        listingName: selectedListing.name,
        tenantName: bookingData.name,
        tenantEmail: bookingData.email,
        tenantPhone: bookingData.phone,
        date: bookingData.date,
        time: bookingData.time,
        message: bookingData.message,
        emailVerified: bookingData.emailVerified,
        employmentStatus: bookingData.employmentStatus,
        employerName: bookingData.employerName,
        employerPhone: bookingData.employerPhone,
        monthlyIncome: bookingData.monthlyIncome,
        occupation: bookingData.occupation,
        motivation: bookingData.motivation,
        moveInDate: bookingData.moveInDate,
        currentResidence: bookingData.currentResidence,
        references: bookingData.references,
        applicationStrength: strength,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      alert('Viewing request submitted successfully! The landlord will contact you soon.');
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
    } catch (error) {
      console.error('Error submitting viewing request:', error);
      alert('Failed to submit viewing request. Please try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleSubmitPayment = () => {
    const payment = {
      id: payments.length + 1,
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      amount: parseInt(newPayment.amount),
      date: newPayment.date,
      status: 'Pending Verification',
      method: newPayment.method,
      reference: newPayment.reference
    };
    
    setPayments([payment, ...payments]);
    setShowPaymentModal(false);
    setNewPayment({
      amount: '35000',
      method: 'M-Pesa',
      reference: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmitMaintenance = () => {
    const request = {
      id: maintenanceRequests.length + 1,
      issue: newMaintenance.issue,
      description: newMaintenance.description,
      priority: newMaintenance.priority,
      location: newMaintenance.location,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    
    setMaintenanceRequests([request, ...maintenanceRequests]);
    setShowMaintenanceModal(false);
    setNewMaintenance({
      issue: '',
      description: '',
      priority: 'Medium',
      location: ''
    });
  };

  const handleSendMessage = () => {
    const message = {
      id: messages.length + 1,
      from: 'You',
      to: newMessage.to,
      subject: newMessage.subject,
      date: new Date().toISOString().split('T')[0],
      read: true,
      preview: newMessage.message.substring(0, 50) + '...'
    };
    
    setMessages([message, ...messages]);
    setShowMessageModal(false);
    setNewMessage({
      to: 'Property Manager',
      subject: '',
      message: ''
    });
  };

  const handleProfileUpdate = () => {
    setEditingProfile(false);
    alert('Profile updated successfully!');
  };

  const handlePasswordChange = () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match!');
      return;
    }
    setShowPasswordModal(false);
    setPasswordData({ current: '', new: '', confirm: '' });
    alert('Password changed successfully!');
  };

  const handleLogout = () => {
    alert('Logging out...');
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const filteredListings = availableListings.filter(listing =>
    listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============ NAVIGATION MENU ITEMS ============
  
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'payments', icon: DollarSign, label: 'Payments' },
    { id: 'maintenance', icon: Wrench, label: 'Maintenance' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'listings', icon: Search, label: 'Available Listings' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  // ============ RENDER FUNCTIONS ============
  
  // Sidebar Component - FIXED FOR FULL HEIGHT
  const renderSidebar = () => (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - FULL HEIGHT */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[#003366] text-white
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-screen
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">RentHub</h1>
                <p className="text-xs text-white/70">Tenant Portal</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-white/10 p-1 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold">
                {profileSettings.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{profileSettings.name}</p>
              <p className="text-sm text-white/70 truncate">{profileSettings.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation - SCROLLABLE */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors duration-200
                ${currentView === item.id 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
              {item.id === 'messages' && messages.filter(m => !m.read).length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {messages.filter(m => !m.read).length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout Button - FIXED AT BOTTOM */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );

  // Top Header Component
  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between p-4 lg:px-8">
        {/* Left: Mobile Menu + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
              {menuItems.find(item => item.id === currentView)?.label || 'Dashboard'}
            </h2>
            <p className="text-sm text-gray-500 hidden sm:block">
              {currentView === 'dashboard' && `Welcome back, ${profileSettings.name.split(' ')[0]}!`}
              {currentView === 'payments' && 'Track all your rent payments'}
              {currentView === 'maintenance' && 'Report and track maintenance issues'}
              {currentView === 'documents' && 'Access your lease agreements and receipts'}
              {currentView === 'messages' && 'Communicate with your property manager'}
              {currentView === 'listings' && 'Find your perfect home'}
              {currentView === 'settings' && `Manage your account, ${profileSettings.name.split(' ')[0]}`}
            </p>
          </div>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <Bell className="w-6 h-6" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        onClick={() => markNotificationAsRead(notification.id)}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  // ============ VIEW COMPONENTS ============
  
  // Dashboard View
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Rent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">KES 35,000</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Next Payment</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">Dec 5</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {maintenanceRequests.filter(r => r.status !== 'Resolved').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Messages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {messages.filter(m => !m.read).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#003366] hover:bg-blue-50 transition group"
          >
            <CreditCard className="w-6 h-6 text-gray-600 group-hover:text-[#003366]" />
            <span className="font-medium text-gray-900">Pay Rent</span>
          </button>

          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#003366] hover:bg-blue-50 transition group"
          >
            <Wrench className="w-6 h-6 text-gray-600 group-hover:text-[#003366]" />
            <span className="font-medium text-gray-900">Report Issue</span>
          </button>

          <button
            onClick={() => setShowMessageModal(true)}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#003366] hover:bg-blue-50 transition group"
          >
            <MessageSquare className="w-6 h-6 text-gray-600 group-hover:text-[#003366]" />
            <span className="font-medium text-gray-900">Send Message</span>
          </button>

          <button
            onClick={() => setCurrentView('documents')}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#003366] hover:bg-blue-50 transition group"
          >
            <FileText className="w-6 h-6 text-gray-600 group-hover:text-[#003366]" />
            <span className="font-medium text-gray-900">View Documents</span>
          </button>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
            <button
              onClick={() => setCurrentView('payments')}
              className="text-sm text-[#003366] hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {payments.slice(0, 3).map(payment => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{payment.month}</p>
                  <p className="text-sm text-gray-500">{payment.date || payment.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">KES {payment.amount.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    payment.status === 'Paid' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Maintenance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Maintenance</h3>
            <button
              onClick={() => setCurrentView('maintenance')}
              className="text-sm text-[#003366] hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {maintenanceRequests.filter(r => r.status !== 'Resolved').slice(0, 3).map(request => (
              <div key={request.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-gray-900">{request.issue}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    request.priority === 'High' 
                      ? 'bg-red-100 text-red-700' 
                      : request.priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {request.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{request.description}</p>
                <p className="text-xs text-gray-500 mt-2">{request.date}</p>
              </div>
            ))}
            {maintenanceRequests.filter(r => r.status !== 'Resolved').length === 0 && (
              <p className="text-center text-gray-500 py-4">No active maintenance requests</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Payments View
  const renderPayments = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
        >
          <Plus className="w-5 h-5" />
          <span>Submit Payment</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KES {payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.date || payment.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.method || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Maintenance View
  const renderMaintenance = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => setShowMaintenanceModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
        >
          <Plus className="w-5 h-5" />
          <span>New Request</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {maintenanceRequests.map(request => (
          <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h4 className="text-lg font-semibold text-gray-900">{request.issue}</h4>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    request.priority === 'High' 
                      ? 'bg-red-100 text-red-700' 
                      : request.priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {request.priority}
                  </span>
                </div>
                <p className="text-gray-600">{request.description}</p>
              </div>
              <span className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap ${
                request.status === 'Resolved'
                  ? 'bg-green-100 text-green-700'
                  : request.status === 'In Progress'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {request.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Reported on {request.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Documents View
  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <FileText className="w-10 h-10 text-[#003366]" />
              <span className="text-xs text-gray-500">{doc.type}</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">{doc.name}</h4>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{doc.date}</span>
              <span>{doc.size}</span>
            </div>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Messages View
  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => setShowMessageModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
        >
          <Plus className="w-5 h-5" />
          <span>New Message</span>
        </button>
      </div>

      <div className="space-y-3">
        {messages.map(message => (
          <div
            key={message.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition ${
              !message.read ? 'bg-blue-50 border-blue-200' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h4 className="font-semibold text-gray-900">{message.subject}</h4>
                  {!message.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                  )}
                </div>
                <p className="text-sm text-gray-600">From: {message.from}</p>
              </div>
              <span className="text-sm text-gray-500 whitespace-nowrap">{message.date}</span>
            </div>
            <p className="text-gray-700">{message.preview}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Listings View
  const renderListings = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
        />
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredListings.map(listing => (
          <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition group">
            {/* Image */}
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              <img
                src={listing.images[0]}
                alt={listing.name}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              />
              <div className="absolute top-4 right-4 bg-[#003366] text-white px-3 py-1 rounded-full text-sm font-semibold">
                KES {listing.rent.toLocaleString()}/mo
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">{listing.name}</h4>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{listing.location}</span>
              </div>

              {/* Features */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  <span>{listing.bedrooms} Beds</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  <span>{listing.bathrooms} Baths</span>
                </div>
                <div className="flex items-center gap-1">
                  <Square className="w-4 h-4" />
                  <span>{listing.area} m²</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-2 mb-4">
                {listing.amenities.slice(0, 3).map((amenity, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {amenity}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedListing(listing);
                    setCurrentImageIndex(0);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Viewing</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredListings.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No properties found matching your search</p>
        </div>
      )}
    </div>
  );

  // Settings View
  const renderSettings = () => (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#003366] text-white rounded-full flex items-center justify-center text-2xl font-bold">
              {profileSettings.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{profileSettings.name}</h3>
              <p className="text-sm text-gray-500">{profileSettings.email}</p>
            </div>
          </div>
          {!editingProfile ? (
            <button
              onClick={() => setEditingProfile(true)}
              className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingProfile(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={profileSettings.name}
              onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
              disabled={!editingProfile}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profileSettings.email}
              onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
              disabled={!editingProfile}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={profileSettings.phone}
              onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
              disabled={!editingProfile}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
            <input
              type="text"
              value={profileSettings.idNumber}
              onChange={(e) => setProfileSettings({...profileSettings, idNumber: e.target.value})}
              disabled={!editingProfile}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
            <input
              type="tel"
              value={profileSettings.emergencyContact}
              onChange={(e) => setProfileSettings({...profileSettings, emergencyContact: e.target.value})}
              disabled={!editingProfile}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500">Last changed 3 months ago</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
            >
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
              Enable
            </button>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileSettings.notifications.email}
                onChange={(e) => setProfileSettings({
                  ...profileSettings,
                  notifications: { ...profileSettings.notifications, email: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-500">Receive updates via text message</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileSettings.notifications.sms}
                onChange={(e) => setProfileSettings({
                  ...profileSettings,
                  notifications: { ...profileSettings.notifications, sms: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Receive browser push notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileSettings.notifications.push}
                onChange={(e) => setProfileSettings({
                  ...profileSettings,
                  notifications: { ...profileSettings.notifications, push: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Alert Types */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Types</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Rent Reminders</p>
              <p className="text-sm text-gray-500">Get notified about upcoming rent payments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileSettings.notifications.rentReminders}
                onChange={(e) => setProfileSettings({
                  ...profileSettings,
                  notifications: { ...profileSettings.notifications, rentReminders: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Maintenance Updates</p>
              <p className="text-sm text-gray-500">Updates on your maintenance requests</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileSettings.notifications.maintenanceUpdates}
                onChange={(e) => setProfileSettings({
                  ...profileSettings,
                  notifications: { ...profileSettings.notifications, maintenanceUpdates: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Message Alerts</p>
              <p className="text-sm text-gray-500">Get notified of new messages from landlord</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profileSettings.notifications.messageAlerts}
                onChange={(e) => setProfileSettings({
                  ...profileSettings,
                  notifications: { ...profileSettings.notifications, messageAlerts: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div>
              <p className="font-medium text-gray-900">Deactivate Account</p>
              <p className="text-sm text-gray-500">Temporarily disable your account</p>
            </div>
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition">
              Deactivate
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ============ MODALS ============
  
  // Payment Modal
  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Submit Payment</h2>
          <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
            <input
              type="number"
              value={newPayment.amount}
              onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={newPayment.method}
              onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            >
              <option value="M-Pesa">M-Pesa</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
            <input
              type="text"
              value={newPayment.reference}
              onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="e.g., QBX1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <input
              type="date"
              value={newPayment.date}
              onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 rounded-b-xl">
          <button
            onClick={() => setShowPaymentModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitPayment}
            className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
          >
            Submit Payment
          </button>
        </div>
      </div>
    </div>
  );

  // Maintenance Modal
  const MaintenanceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">New Maintenance Request</h2>
          <button onClick={() => setShowMaintenanceModal(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
            <input
              type="text"
              value={newMaintenance.issue}
              onChange={(e) => setNewMaintenance({...newMaintenance, issue: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="e.g., Leaking faucet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newMaintenance.description}
              onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="Provide detailed description of the issue..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={newMaintenance.priority}
              onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location in Unit</label>
            <input
              type="text"
              value={newMaintenance.location}
              onChange={(e) => setNewMaintenance({...newMaintenance, location: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="e.g., Kitchen, Bedroom, Bathroom"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 rounded-b-xl">
          <button
            onClick={() => setShowMaintenanceModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitMaintenance}
            className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );

  // Message Modal
  const MessageModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">New Message</h2>
          <button onClick={() => setShowMessageModal(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <select
              value={newMessage.to}
              onChange={(e) => setNewMessage({...newMessage, to: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            >
              <option value="Property Manager">Property Manager</option>
              <option value="Maintenance Team">Maintenance Team</option>
              <option value="Landlord">Landlord</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={newMessage.subject}
              onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="Message subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={newMessage.message}
              onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="Type your message here..."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 rounded-b-xl">
          <button
            onClick={() => setShowMessageModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSendMessage}
            className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Message</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Password Modal
  const PasswordModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordData.current}
              onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 rounded-b-xl">
          <button
            onClick={() => setShowPasswordModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePasswordChange}
            className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );

  // Listing Detail Modal
  const ListingDetailModal = () => {
    if (!selectedListing || showBookingModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center rounded-t-xl z-10">
            <h2 className="text-xl font-bold text-gray-900">{selectedListing.name}</h2>
            <button
              onClick={() => {
                setSelectedListing(null);
                setCurrentImageIndex(0);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Image Gallery */}
            {selectedListing.images && selectedListing.images.length > 0 && (
              <div className="mb-6">
                <div className="relative">
                  <img
                    src={selectedListing.images[currentImageIndex]}
                    alt={selectedListing.name}
                    className="w-full h-[60vh] object-cover rounded-lg"
                  />
                  
                  {selectedListing.images.length > 1 && (
                    <>
                      <button 
                        onClick={() => setCurrentImageIndex((currentImageIndex - 1 + selectedListing.images.length) % selectedListing.images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-gray-900" />
                      </button>
                      <button 
                        onClick={() => setCurrentImageIndex((currentImageIndex + 1) % selectedListing.images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-gray-900" />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 lg:px-4 lg:py-2 bg-black bg-opacity-70 text-white rounded-full text-sm">
                        {currentImageIndex + 1} / {selectedListing.images.length}
                      </div>
                    </>
                  )}
                </div>
                
                {selectedListing.images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {selectedListing.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition ${
                          idx === currentImageIndex ? 'border-[#003366]' : 'border-transparent opacity-60 hover:opacity-100'
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
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{selectedListing.location}</span>
                </div>
                <div className="text-3xl font-bold text-[#003366] mb-4">
                  KES {selectedListing.rent.toLocaleString()}/month
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-gray-700">
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5" />
                  <span className="font-medium">{selectedListing.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5" />
                  <span className="font-medium">{selectedListing.bathrooms} Bathrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="w-5 h-5" />
                  <span className="font-medium">{selectedListing.area} m²</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.amenities.map((amenity, idx) => (
                    <span key={idx} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 rounded-b-xl">
            <button
              onClick={() => {
                setSelectedListing(null);
                setCurrentImageIndex(0);
              }}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowBookingModal(true);
                setBookingData({
                  ...bookingData,
                  name: profileSettings.name,
                  email: profileSettings.email,
                  phone: profileSettings.phone
                });
              }}
              className="flex-1 px-4 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-medium flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              <span>Book Viewing</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Booking Modal
  const BookingModal = () => {
    if (!showBookingModal || !selectedListing) return null;

    const applicationStrength = calculateApplicationStrength();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 lg:p-6 border-b border-gray-200 flex justify-between items-center rounded-t-xl z-10">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 truncate">Book Viewing</h2>
              <p className="text-sm text-gray-600 truncate">{selectedListing.name}</p>
            </div>
            <button
              onClick={() => {
                setShowBookingModal(false);
                setSelectedListing(null);
              }}
              className="text-gray-500 hover:text-gray-700 ml-4 flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 lg:p-6">
            {/* Application Strength Indicator */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Application Strength</h3>
                <span className={`text-xl lg:text-2xl font-bold ${getStrengthColor(applicationStrength)}`}>
                  {applicationStrength}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getStrengthBgColor(applicationStrength)}`}
                  style={{ width: `${applicationStrength}%` }}
                />
              </div>
              <p className="text-xs lg:text-sm text-gray-600">
                {applicationStrength < 50 
                  ? 'Complete more sections to strengthen your application' 
                  : applicationStrength < 75 
                  ? 'Good progress! Add more details for a stronger application' 
                  : 'Excellent! Your application looks very strong'}
              </p>
            </div>

            <div className="space-y-6">
              {/* Section 1: Contact & Viewing Details */}
              <div className="border-b pb-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm lg:text-base">
                  <span className="w-6 h-6 bg-[#003366] text-white rounded-full flex items-center justify-center text-xs lg:text-sm flex-shrink-0">1</span>
                  Contact & Viewing Details
                  <span className="text-xs text-gray-500 font-normal">(Required + 25% for verification)</span>
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Viewing Date *</label>
                      <input
                        type="date"
                        value={bookingData.date}
                        onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Preferred Time *</label>
                      <select
                        value={bookingData.time}
                        onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                        className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      >
                        <option value="">Select time</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={bookingData.name}
                        onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                        className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={bookingData.phone}
                        onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                        className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>
                  </div>

                  {/* Email Verification */}
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                      Email Address * 
                      {bookingData.emailVerified && (
                        <span className="ml-2 text-green-600 text-xs">✓ Verified</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={bookingData.email}
                        onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                        disabled={bookingData.emailVerified}
                        className="flex-1 px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-100"
                        placeholder="your@email.com"
                      />
                      {!bookingData.emailVerified && (
                        <button
                          onClick={() => handleSendVerification('email')}
                          disabled={isSendingVerification || !bookingData.email}
                          className="px-3 lg:px-4 py-2 text-xs lg:text-sm bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {verificationSent.email ? 'Resend Code' : 'Verify'}
                        </button>
                      )}
                    </div>
                    
                    {verificationSent.email && !bookingData.emailVerified && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          maxLength="6"
                          value={verificationCodes.email}
                          onChange={(e) => setVerificationCodes({...verificationCodes, email: e.target.value})}
                          className="flex-1 px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                          placeholder="Enter 6-digit code"
                        />
                        <button
                          onClick={() => handleVerifyCode('email')}
                          className="px-3 lg:px-4 py-2 text-xs lg:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition whitespace-nowrap"
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Preferred Move-in Date (Optional)</label>
                    <input
                      type="date"
                      value={bookingData.moveInDate}
                      onChange={(e) => setBookingData({...bookingData, moveInDate: e.target.value})}
                      className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Employment Information */}
              <div className="border-b pb-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm lg:text-base">
                  <span className="w-6 h-6 bg-[#003366] text-white rounded-full flex items-center justify-center text-xs lg:text-sm flex-shrink-0">2</span>
                  Employment Information
                  <span className="text-xs text-gray-500 font-normal">(Increases strength by 25%)</span>
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                      <select
                        value={bookingData.employmentStatus}
                        onChange={(e) => setBookingData({...bookingData, employmentStatus: e.target.value})}
                        className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      >
                        <option value="">Select status</option>
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self-Employed</option>
                        <option value="student">Student</option>
                        <option value="retired">Retired</option>
                        <option value="unemployed">Unemployed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Occupation/Job Title</label>
                      <input
                        type="text"
                        value={bookingData.occupation}
                        onChange={(e) => setBookingData({...bookingData, occupation: e.target.value})}
                        className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        placeholder="e.g. Software Engineer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Employer/Company Name</label>
                      <input
                        type="text"
                        value={bookingData.employerName}
                        onChange={(e) => setBookingData({...bookingData, employerName: e.target.value})}
                        className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        placeholder="Company name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Employer Phone (Optional)</label>
                      <input
                        type="tel"
                        value={bookingData.employerPhone}
                        onChange={(e) => setBookingData({...bookingData, employerPhone: e.target.value})}
                        className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Monthly Income Range</label>
                      <select
                        value={bookingData.monthlyIncome}
                        onChange={(e) => setBookingData({...bookingData, monthlyIncome: e.target.value})}
                        className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      >
                        <option value="">Select range</option>
                        <option value="0-30k">Less than KES 30,000</option>
                        <option value="30-50k">KES 30,000 - 50,000</option>
                        <option value="50-100k">KES 50,000 - 100,000</option>
                        <option value="100-200k">KES 100,000 - 200,000</option>
                        <option value="200k+">Above KES 200,000</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Current Residence</label>
                      <input
                        type="text"
                        value={bookingData.currentResidence}
                        onChange={(e) => setBookingData({...bookingData, currentResidence: e.target.value})}
                        className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        placeholder="Current area/estate"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Motivation */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm lg:text-base">
                  <span className="w-6 h-6 bg-[#003366] text-white rounded-full flex items-center justify-center text-xs lg:text-sm flex-shrink-0">3</span>
                  Why This Property?
                  <span className="text-xs text-gray-500 font-normal">(Increases strength by 25%)</span>
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                      Tell us why you're interested in this property
                      <span className="text-xs text-gray-500 ml-2">({bookingData.motivation.length}/50 min characters)</span>
                    </label>
                    <textarea
                      value={bookingData.motivation}
                      onChange={(e) => setBookingData({...bookingData, motivation: e.target.value})}
                      rows="4"
                      className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Share details about your interest, planned duration of stay, family size, pets, etc. (minimum 50 characters for full score)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">References (Optional)</label>
                    <input
                      type="text"
                      value={bookingData.references}
                      onChange={(e) => setBookingData({...bookingData, references: e.target.value})}
                      className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Previous landlord contact or character reference"
                    />
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                    <textarea
                      value={bookingData.message}
                      onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                      rows="3"
                      className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Any specific questions or requests?"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 px-4 lg:px-6 py-4 border-t flex gap-3 rounded-b-xl">
            <button
              onClick={() => {
                setShowBookingModal(false);
                setSelectedListing(null);
              }}
              disabled={isSubmittingBooking}
              className="flex-1 px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
    );
  };

  // ============ MAIN RENDER ============
  
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        {renderHeader()}

        {/* Content Area - FULL WIDTH FIX */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full h-full p-4 lg:p-8">
            <div className="max-w-[1600px] mx-auto h-full">
              {currentView === 'dashboard' && renderDashboard()}
              {currentView === 'payments' && renderPayments()}
              {currentView === 'maintenance' && renderMaintenance()}
              {currentView === 'documents' && renderDocuments()}
              {currentView === 'messages' && renderMessages()}
              {currentView === 'listings' && renderListings()}
              {currentView === 'settings' && renderSettings()}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && <PaymentModal />}
      {showMaintenanceModal && <MaintenanceModal />}
      {showMessageModal && <MessageModal />}
      {showPasswordModal && <PasswordModal />}
      {selectedListing && !showBookingModal && <ListingDetailModal />}
      {showBookingModal && <BookingModal />}
    </div>
  );
};

export default TenantDashboard;