import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
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
const storage = getStorage();

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
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  
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

  const [newDocument, setNewDocument] = useState({
    name: '',
    file: null
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
      name: 'Sunset Heights', 
      location: 'Westlands, Nairobi', 
      rent: 45000, 
      bedrooms: 3, 
      bathrooms: 2, 
      area: 95, 
      amenities: ['Gym', 'Pool', 'Security'],
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
      ]
    },
    { 
      id: 3, 
      name: 'Riverside Residences', 
      location: 'Karen, Nairobi', 
      rent: 52000, 
      bedrooms: 3, 
      bathrooms: 3, 
      area: 110, 
      amenities: ['Garden', 'Parking', 'Security', 'Pool'],
      images: [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
      ]
    }
  ];

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
    if (bookingData.motivation.length >= 50) score += 25;
    
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

    if (!bookingData.emailVerified) {
      alert('Please verify your email before submitting the booking request');
      return;
    }

    const credibilityScore = calculateCredibilityScore();

    setIsSubmittingBooking(true);

    try {
      // Save to Firestore
      const bookingRef = await addDoc(collection(db, 'viewingRequests'), {
        propertyId: selectedListing.id,
        propertyName: selectedListing.name,
        location: selectedListing.location,
        rent: selectedListing.rent,
        viewingDate: bookingData.date,
        viewingTime: bookingData.time,
        tenantInfo: {
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          emailVerified: bookingData.emailVerified
        },
        employmentInfo: {
          status: bookingData.employmentStatus,
          employerName: bookingData.employerName,
          employerPhone: bookingData.employerPhone,
          occupation: bookingData.occupation,
          monthlyIncome: bookingData.monthlyIncome
        },
        additionalInfo: {
          motivation: bookingData.motivation,
          moveInDate: bookingData.moveInDate,
          currentResidence: bookingData.currentResidence,
          references: bookingData.references,
          message: bookingData.message
        },
        credibilityScore: credibilityScore,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send notification email to landlord
      try {
        const sendNotification = httpsCallable(functions, 'sendViewingNotification');
        await sendNotification({
          bookingId: bookingRef.id,
          propertyName: selectedListing.name,
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
  
  const handleAddPayment = () => {
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
    setNewPayment({ amount: '35000', method: 'M-Pesa', reference: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleAddMaintenanceRequest = () => {
    if (!newMaintenance.issue || !newMaintenance.description) {
      alert('Please fill in all required fields');
      return;
    }
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
    setNewMaintenance({ issue: '', description: '', priority: 'Medium', location: '' });
  };

  const handleSendMessage = () => {
    if (!newMessage.subject || !newMessage.message) {
      alert('Please fill in all fields');
      return;
    }
    const message = {
      id: messages.length + 1,
      from: 'Me',
      to: newMessage.to,
      subject: newMessage.subject,
      date: new Date().toISOString().split('T')[0],
      read: true,
      preview: newMessage.message.substring(0, 50) + '...'
    };
    setMessages([message, ...messages]);
    setShowMessageModal(false);
    setNewMessage({ to: 'Property Manager', subject: '', message: '' });
  };

  const handleUploadDocument = async () => {
    if (!newDocument.file) {
      alert('Please select a file to upload');
      return;
    }

    setUploadingDocument(true);
    try {
      // Create a storage reference
      const fileRef = ref(storage, `documents/${Date.now()}_${newDocument.file.name}`);

      // Upload the file
      await uploadBytes(fileRef, newDocument.file);

      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);

      // Add document to the list
      const document = {
        id: documents.length + 1,
        name: newDocument.name || newDocument.file.name,
        type: newDocument.file.type.includes('pdf') ? 'PDF' : newDocument.file.type.toUpperCase(),
        date: new Date().toISOString().split('T')[0],
        size: `${(newDocument.file.size / 1024 / 1024).toFixed(2)} MB`,
        url: downloadURL
      };

      setDocuments([document, ...documents]);
      setShowDocumentUploadModal(false);
      setNewDocument({ name: '', file: null });
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
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

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      console.log('Logging out...');
    }
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
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

        <div className="absolute bottom-0 w-full p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </h2>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
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
                  <div className="absolute right-0 mt-2 w-72 lg:w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markNotificationAsRead(notification.id)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                        >
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 pl-2 lg:pl-4 border-l border-gray-200">
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-medium text-gray-900">{profileSettings.name}</p>
                  <p className="text-xs text-gray-500">Tenant</p>
                </div>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold text-sm lg:text-base flex-shrink-0">
                  {profileSettings.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 lg:p-8">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Blue Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Welcome back, {profileSettings.name}!</h3>
                  <p className="text-sm text-gray-600">Here's an overview of your tenancy</p>
                </div>
                <button
                  onClick={() => setCurrentView('listings')}
                  className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Browse Properties
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs lg:text-sm font-medium text-gray-600">Next Payment Due</h4>
                    <Calendar className="w-5 h-5 text-[#003366]" />
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">Dec 5, 2024</p>
                  <p className="text-xs lg:text-sm text-gray-500 mt-1">KES 35,000</p>
                </div>

                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs lg:text-sm font-medium text-gray-600">Lease Expires</h4>
                    <FileText className="w-5 h-5 text-[#003366]" />
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">Jan 15, 2026</p>
                  <p className="text-xs lg:text-sm text-gray-500 mt-1">14 months left</p>
                </div>

                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs lg:text-sm font-medium text-gray-600">Maintenance</h4>
                    <Wrench className="w-5 h-5 text-[#003366]" />
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">2 Open</p>
                  <p className="text-xs lg:text-sm text-gray-500 mt-1">1 in progress</p>
                </div>

                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs lg:text-sm font-medium text-gray-600">Messages</h4>
                    <MessageSquare className="w-5 h-5 text-[#003366]" />
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{messages.filter(m => !m.read).length}</p>
                  <p className="text-xs lg:text-sm text-gray-500 mt-1">Unread</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-base lg:text-lg text-gray-900 mb-4">Recent Payments</h4>
                  <div className="space-y-3">
                    {payments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm lg:text-base text-gray-900">{payment.month}</p>
                          <p className="text-xs lg:text-sm text-gray-500">{payment.date || `Due: ${payment.dueDate}`}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm lg:text-base text-gray-900">KES {payment.amount.toLocaleString()}</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-base lg:text-lg text-gray-900 mb-4">Maintenance Requests</h4>
                  <div className="space-y-3">
                    {maintenanceRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm lg:text-base text-gray-900">{request.issue}</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs flex-shrink-0 ml-2 ${
                            request.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                            request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-xs lg:text-sm text-gray-500">{request.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments View */}
          {currentView === 'payments' && (
            <div className="space-y-6">
              {/* Blue Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Payment History</h3>
                  <p className="text-sm text-gray-600">Track your rent payments and receipts</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Record Payment
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm font-medium text-gray-900">{payment.month}</td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">KES {payment.amount.toLocaleString()}</td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">{payment.date || `Due: ${payment.dueDate}`}</td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">{payment.method || '-'}</td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            {payment.status === 'Paid' && (
                              <button className="text-[#003366] hover:text-[#002244] flex items-center gap-1 text-xs lg:text-sm">
                                <Download className="w-4 h-4" />
                                Receipt
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

      {/* Maintenance View */}
      {currentView === 'maintenance' && (
    <div className="space-y-6">
      {/* Blue Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Maintenance Requests</h3>
          <p className="text-sm text-gray-600">Report and track maintenance issues</p>
        </div>
        <button
          onClick={() => setShowMaintenanceModal(true)}
          className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Request
        </button>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {maintenanceRequests.map((request) => (
        <div key={request.id} className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h4 className="font-semibold text-base lg:text-lg text-gray-900">{request.issue}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  request.priority === 'High' ? 'bg-red-100 text-red-800' :
                  request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {request.priority}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  request.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                  request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {request.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{request.description}</p>
              <p className="text-xs lg:text-sm text-gray-500">Reported on {request.date}</p>
            </div>
            <button className="self-end lg:self-center text-[#003366] hover:text-[#002244] text-xs lg:text-sm font-medium whitespace-nowrap">
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}



          {/* Documents View */}
          {currentView === 'documents' && (
            <div className="space-y-6">
              {/* Blue Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Documents</h3>
                  <p className="text-sm text-gray-600">Access your lease agreements and receipts</p>
                </div>
                <button
                  onClick={() => setShowDocumentUploadModal(true)}
                  className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Document
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="w-8 h-8 lg:w-10 lg:h-10 text-[#003366] flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-500">{doc.type}</span>
                    </div>
                    <h4 className="font-semibold text-sm lg:text-base text-gray-900 mb-2">{doc.name}</h4>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{doc.date}</span>
                      <span>{doc.size}</span>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 border border-[#003366] text-[#003366] rounded-lg hover:bg-[#003366] hover:text-white transition text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

    {/* Messages View */}
    {currentView === 'messages' && (
      <div className="space-y-6">
        {/* Blue Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Messages</h3>
            <p className="text-sm text-gray-600">Communicate with your property manager</p>
          </div>
          <button
            onClick={() => setShowMessageModal(true)}
            className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            New Message
          </button>
        </div>

    {/* Each message as individual card - like Documents */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {messages.map((message) => (
        <div key={message.id} className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm lg:text-base text-gray-900">{message.subject}</h4>
                {!message.read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                )}
              </div>
              <p className="text-xs lg:text-sm text-gray-600 mb-2">{message.from}</p>
              <p className="text-xs lg:text-sm text-gray-500">{message.preview}</p>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">{message.date}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

          {/* Available Listings View */}
          {currentView === 'listings' && (
            <div className="space-y-6">
              {/* Button to Full Listings Page */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div>
            <h3 className="font-semibold text-gray-900 mb-1">Looking for More Properties?</h3>
              <p className="text-sm text-gray-600">Browse our complete catalog with advanced filters</p>
            </div>
            <button
           onClick={() => navigate('/listings')}
            className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
             >
            <Search className="w-5 h-5" />
            View All Listings
            </button>
            </div>
              <div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Available Properties</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or location..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {filteredListings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition group">
                    <div className="relative h-48 lg:h-56 overflow-hidden">
                      <img 
                        src={listing.images[0]} 
                        alt={listing.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full shadow-md">
                        <span className="font-bold text-[#003366] text-sm lg:text-base">KES {listing.rent.toLocaleString()}/mo</span>
                      </div>
                    </div>
                    
                    <div className="p-4 lg:p-6">
                      <h4 className="font-bold text-base lg:text-lg text-gray-900 mb-2">{listing.name}</h4>
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs lg:text-sm">{listing.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-4 text-gray-600">
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
                        {listing.amenities.map((amenity, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
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
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
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
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm"
                        >
                          <Calendar className="w-4 h-4" />
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings View */}
          
{currentView === 'settings' && (
  <div className="space-y-6">
        {/* Blue Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Account Settings</h3>
            <p className="text-sm text-gray-600">Manage your profile, security, and preferences</p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Change Password
          </button>
        </div>
        {/* Profile Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
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
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#003366] rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                  {profileSettings.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                {editingProfile && (
                  <button className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-[#003366] rounded-full flex items-center justify-center text-white hover:bg-[#002244] transition">
                    <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{profileSettings.name}</h3>
                <p className="text-sm sm:text-base text-gray-600">{profileSettings.email}</p>
                {editingProfile && (
                  <button className="text-[#003366] text-sm mt-1 hover:underline font-medium flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    Change Photo
                  </button>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileSettings.name}
                  onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileSettings.email}
                  onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profileSettings.phone}
                  onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                <input
                  type="text"
                  value={profileSettings.idNumber}
                  onChange={(e) => setProfileSettings({...profileSettings, idNumber: e.target.value})}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input
                  type="tel"
                  value={profileSettings.emergencyContact}
                  onChange={(e) => setProfileSettings({...profileSettings, emergencyContact: e.target.value})}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Security</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Password */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Password</h3>
                <p className="text-sm text-gray-500 mt-1">Last changed 3 months ago</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium whitespace-nowrap text-sm sm:text-base"
              >
                Change Password
              </button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
              </div>
              <button className="px-4 py-2 sm:px-6 sm:py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-medium text-sm sm:text-base">
                Enable
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500 mt-1">Receive updates via email</p>
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-500 mt-1">Receive updates via text message</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profileSettings.notifications.sms}
                  onChange={(e) => setProfileSettings({
                    ...profileSettings,
                    notifications: {...profileSettings.notifications, sms: e.target.checked}
                  })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-500 mt-1">Receive browser push notifications</p>
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Alert Types Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Alert Types</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Rent Reminders</h3>
                <p className="text-sm text-gray-500 mt-1">Get notified about upcoming rent payments</p>
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Maintenance Updates</h3>
                <p className="text-sm text-gray-500 mt-1">Updates on your maintenance requests</p>
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Message Alerts</h3>
                <p className="text-sm text-gray-500 mt-1">Get notified of new messages from landlord</p>
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone Card */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200">
          <div className="p-4 sm:p-6 border-b border-red-200">
            <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Deactivate Account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Deactivate Account</h3>
                <p className="text-sm text-gray-500 mt-1">Temporarily disable your account</p>
              </div>
              <button className="px-4 py-2 sm:px-6 sm:py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-medium whitespace-nowrap text-sm sm:text-base">
                Deactivate
              </button>
            </div>

            {/* Delete Account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-500 mt-1">Permanently delete your account and all data</p>
              </div>
              <button className="px-4 py-2 sm:px-6 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm sm:text-base">
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
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                >
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})}
                  placeholder="e.g., M-Pesa code"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm lg:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm lg:text-base"
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
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900">New Maintenance Request</h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title *</label>
                <input
                  type="text"
                  value={newMaintenance.issue}
                  onChange={(e) => setNewMaintenance({...newMaintenance, issue: e.target.value})}
                  placeholder="e.g., Leaking faucet"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newMaintenance.description}
                  onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})}
                  rows="4"
                  placeholder="Provide details about the issue..."
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newMaintenance.priority}
                  onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newMaintenance.location}
                  onChange={(e) => setNewMaintenance({...newMaintenance, location: e.target.value})}
                  placeholder="e.g., Kitchen, Bedroom 1"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm lg:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMaintenanceRequest}
                  className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm lg:text-base"
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
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900">New Message</h3>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select
                  value={newMessage.to}
                  onChange={(e) => setNewMessage({...newMessage, to: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
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
                  placeholder="Message subject"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  rows="6"
                  placeholder="Type your message..."
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm lg:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm lg:text-base"
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
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Upload Document</h3>
              <button onClick={() => setShowDocumentUploadModal(false)} className="text-gray-500 hover:text-gray-700">
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
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                <input
                  type="file"
                  onChange={(e) => setNewDocument({...newDocument, file: e.target.files[0]})}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#003366] file:text-white hover:file:bg-[#002244]"
                />
                <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
              </div>
              {newDocument.file && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
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

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-4 lg:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-700">
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
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm lg:text-base"
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
                  onClick={() => {
                    if (passwordData.new === passwordData.confirm) {
                      alert('Password updated successfully!');
                      setShowPasswordModal(false);
                      setPasswordData({ current: '', new: '', confirm: '' });
                    } else {
                      alert('Passwords do not match!');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm lg:text-base"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Detail View Modal */}
      {selectedListing && !showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900">{selectedListing.name}</h3>
              <button onClick={() => setSelectedListing(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>

            <div className="p-4 lg:p-6">
              <div className="relative mb-6">
                <img 
                  src={selectedListing.images[currentImageIndex]} 
                  alt={selectedListing.name}
                  className="w-full h-64 lg:h-96 object-cover rounded-lg"
                />
                {selectedListing.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((currentImageIndex - 1 + selectedListing.images.length) % selectedListing.images.length)}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white transition"
                    >
                      <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((currentImageIndex + 1) % selectedListing.images.length)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white transition"
                    >
                      <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
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
                    <h4 className="text-2xl font-bold text-gray-900">KES {selectedListing.rent.toLocaleString()}<span className="text-base font-normal text-gray-500">/month</span></h4>
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
                      className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
                    >
                      <Calendar className="w-5 h-5" />
                      Book Viewing
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <MapPin className="w-5 h-5" />
                    <span>{selectedListing.location}</span>
                  </div>

                  <div className="flex items-center gap-6 text-gray-700">
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
                  <h5 className="font-semibold text-lg text-gray-900 mb-3">Amenities</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.amenities.map((amenity, index) => (
                      <span key={index} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg">
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

      {/* ENHANCED BOOKING MODAL WITH EMAIL VERIFICATION */}
      {showBookingModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-4 rounded-t-xl z-10">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-1">Book a Viewing</h3>
                  <p className="text-xs lg:text-sm text-gray-600 truncate">{selectedListing.name} - {selectedListing.location}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedListing(null);
                  }} 
                  className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  <X className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
              </div>

              {/* Credibility Score Indicator */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs lg:text-sm font-medium text-gray-700">Application Strength</span>
                  <span className={`text-sm lg:text-base font-bold ${
                    calculateCredibilityScore() >= 75 ? 'text-green-600' :
                    calculateCredibilityScore() >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {calculateCredibilityScore()}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      calculateCredibilityScore() >= 75 ? 'bg-green-600' :
                      calculateCredibilityScore() >= 50 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${calculateCredibilityScore()}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className={`flex items-center gap-2 ${bookingData.emailVerified ? 'text-green-700' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${bookingData.emailVerified ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Email Verified</span>
                  </div>
                  <div className={`flex items-center gap-2 ${(bookingData.employmentStatus && bookingData.employerName) ? 'text-green-700' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${(bookingData.employmentStatus && bookingData.employerName) ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Employment Info</span>
                  </div>
                  <div className={`flex items-center gap-2 ${bookingData.motivation.length >= 50 ? 'text-green-700' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${bookingData.motivation.length >= 50 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Motivation Provided</span>
                  </div>
                  <div className={`flex items-center gap-2 ${bookingData.references ? 'text-green-700' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${bookingData.references ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>References</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 lg:px-6 py-6 max-h-[calc(90vh-180px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Section 1: Contact & Verification */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm lg:text-base">
                    <span className="w-6 h-6 bg-[#003366] text-white rounded-full flex items-center justify-center text-xs lg:text-sm flex-shrink-0">1</span>
                    Contact Information & Email Verification
                    <span className="text-xs text-gray-500 font-normal">(Required - 25%)</span>
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={bookingData.name}
                          onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                          className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
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

                    {/* EMAIL VERIFICATION SECTION */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">Email Verification Required</h5>
                          <p className="text-xs lg:text-sm text-gray-600 mb-3">Verify your email to increase your application strength by 25%</p>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                              <div className="flex gap-2">
                                <input
                                  type="email"
                                  value={bookingData.email}
                                  onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                                  disabled={bookingData.emailVerified}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-100"
                                  placeholder="your.email@example.com"
                                />
                                {!bookingData.emailVerified && !verificationSent.email && (
                                  <button
                                    onClick={sendEmailVerificationCode}
                                    disabled={isSendingVerification || !bookingData.email}
                                    className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isSendingVerification ? 'Sending...' : 'Send Code'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {verificationSent.email && !bookingData.emailVerified && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Enter 6-Digit Code</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    maxLength="6"
                                    placeholder="000000"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                                    onInput={(e) => {
                                      const code = e.target.value;
                                      if (code.length === 6) {
                                        verifyEmailCode(code);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={sendEmailVerificationCode}
                                    disabled={isSendingVerification}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium whitespace-nowrap"
                                  >
                                    {isSendingVerification ? 'Sending...' : 'Resend'}
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Check your email inbox (and spam folder)</p>
                              </div>
                            )}

                            {bookingData.emailVerified && (
                              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium">Email verified successfully!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

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
                        <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Viewing Time *</label>
                        <input
                          type="time"
                          value={bookingData.time}
                          onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                          className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Employment Information */}
                <div className="border-t pt-6">
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
      )}

    </div>
  );
};

export default TenantDashboard;

