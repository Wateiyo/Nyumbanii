import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../config/firebase';
import { signOut } from 'firebase/auth';
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
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Home, 
  DollarSign, 
  Bell, 
  Settings, 
  LogOut,
  X,
  Wrench,
  Mail,
  Phone,
  Download,
  CheckCircle,
  Clock,
  Calendar,
  Upload,
  Camera,
  FileText,
  CreditCard,
  Building,
  User,
  Menu,
  AlertCircle,
  Receipt,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';

const TenantDashboard = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [newMaintenance, setNewMaintenance] = useState({
    issue: '',
    description: '',
    priority: 'medium',
    preferredDate: '',
    preferredTime: '',
    images: []
  });
  
  const [paymentProof, setPaymentProof] = useState({
    paymentId: '',
    method: 'mpesa',
    transactionId: '',
    amount: '',
    paymentDate: '',
    proofImage: null
  });
  
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [memos, setMemos] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const [profileSettings, setProfileSettings] = useState({
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+254 712 345 678',
    emergencyContact: {
      name: 'John Doe',
      phone: '+254 700 000 000',
      relationship: 'Spouse'
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      paymentReminders: true,
      maintenanceUpdates: true,
      memos: true
    }
  });

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
      
      if (!user) {
        navigate('/login');
      }
    });
    return unsubscribe;
  }, [navigate]);

  // Fetch Tenant's Lease
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'leases'),
      where('tenantId', '==', currentUser.uid),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const leaseData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        };
        setLease(leaseData);
      }
    });

    return unsubscribe;
  }, [currentUser]);

  // Fetch Payments
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'payments'),
      where('tenantId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);
      
      // Separate payment history (paid)
      setPaymentHistory(paymentsData.filter(p => p.status === 'paid'));
    });

    return unsubscribe;
  }, [currentUser]);

  // Fetch Maintenance Requests
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'maintenanceRequests'),
      where('tenantId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaintenanceRequests(requestsData);
    });

    return unsubscribe;
  }, [currentUser]);

  // Fetch Memos
  useEffect(() => {
    if (!currentUser || !lease) return;

    const q = query(
      collection(db, 'memos'),
      where('landlordId', '==', lease.landlordId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(memo => 
        memo.targetAudience === 'all' || 
        memo.targetAudience === lease.property
      );
      setMemos(memosData);
    });

    return unsubscribe;
  }, [currentUser, lease]);

  // LOGOUT FUNCTION
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out. Please try again.');
    }
  };

  // Image upload handler
  const handleImageUpload = async (file) => {
    if (!file) return null;
    
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `maintenanceImages/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // SUBMIT MAINTENANCE REQUEST
  const handleSubmitMaintenance = async () => {
    if (!newMaintenance.issue || !newMaintenance.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'maintenanceRequests'), {
        tenantId: currentUser.uid,
        tenant: profileSettings.name,
        landlordId: lease?.landlordId || '',
        property: lease?.property || '',
        unit: lease?.unit || '',
        issue: newMaintenance.issue,
        description: newMaintenance.description,
        priority: newMaintenance.priority,
        preferredDate: newMaintenance.preferredDate,
        preferredTime: newMaintenance.preferredTime,
        images: newMaintenance.images,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        scheduledTime: newMaintenance.preferredTime || '09:00',
        createdAt: serverTimestamp()
      });
      
      setNewMaintenance({ 
        issue: '', 
        description: '', 
        priority: 'medium', 
        preferredDate: '', 
        preferredTime: '', 
        images: [] 
      });
      setShowMaintenanceModal(false);
      alert('Maintenance request submitted successfully!');
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      alert('Error submitting request. Please try again.');
    }
  };

  // SUBMIT PAYMENT PROOF
  const handleSubmitPaymentProof = async () => {
    if (!paymentProof.transactionId || !paymentProof.amount || !paymentProof.paymentDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Upload proof image if provided
      let proofImageUrl = null;
      if (paymentProof.proofImage) {
        const storageRef = ref(storage, `paymentProofs/${currentUser.uid}/${Date.now()}_${paymentProof.proofImage.name}`);
        await uploadBytes(storageRef, paymentProof.proofImage);
        proofImageUrl = await getDownloadURL(storageRef);
      }

      // Update payment record
      if (selectedPayment) {
        const paymentRef = doc(db, 'payments', selectedPayment.id);
        await updateDoc(paymentRef, {
          status: 'pending-verification',
          method: paymentProof.method,
          transactionId: paymentProof.transactionId,
          paidAmount: parseInt(paymentProof.amount),
          paidDate: paymentProof.paymentDate,
          proofImage: proofImageUrl,
          submittedAt: serverTimestamp()
        });
      } else {
        // Create new payment record
        await addDoc(collection(db, 'payments'), {
          tenantId: currentUser.uid,
          tenant: profileSettings.name,
          landlordId: lease?.landlordId || '',
          property: lease?.property || '',
          unit: lease?.unit || '',
          amount: parseInt(paymentProof.amount),
          method: paymentProof.method,
          transactionId: paymentProof.transactionId,
          paidAmount: parseInt(paymentProof.amount),
          paidDate: paymentProof.paymentDate,
          proofImage: proofImageUrl,
          status: 'pending-verification',
          createdAt: serverTimestamp()
        });
      }
      
      setPaymentProof({
        paymentId: '',
        method: 'mpesa',
        transactionId: '',
        amount: '',
        paymentDate: '',
        proofImage: null
      });
      setSelectedPayment(null);
      setShowPaymentProofModal(false);
      alert('Payment proof submitted successfully! Waiting for landlord verification.');
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      alert('Error submitting payment proof. Please try again.');
    }
  };

  // DOWNLOAD LEASE DOCUMENT
  const handleDownloadLease = () => {
    if (lease?.leaseDocument) {
      window.open(lease.leaseDocument, '_blank');
    } else {
      alert('Lease document not available. Please contact your landlord.');
    }
  };

  // DOWNLOAD RECEIPT
  const handleDownloadReceipt = (payment) => {
    // In a real app, this would generate a PDF receipt
    alert(`Downloading receipt for payment of KES ${payment.amount?.toLocaleString()}`);
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

  const markNotificationRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  // Stats calculations
  const upcomingPayment = payments.find(p => p.status === 'pending');
  const pendingMaintenance = maintenanceRequests.filter(m => m.status === 'pending').length;
  const unreadMemos = memos.filter(m => !m.read).length;
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const stats = [
    { 
      label: 'Next Rent Due', 
      value: upcomingPayment ? `${upcomingPayment.dueDate}` : 'All paid', 
      subValue: upcomingPayment ? `KES ${upcomingPayment.amount?.toLocaleString()}` : null,
      icon: DollarSign, 
      color: 'bg-purple-100 text-purple-900' 
    },
    { 
      label: 'Lease Expires', 
      value: lease?.leaseEnd || 'N/A', 
      icon: Calendar, 
      color: 'bg-blue-100 text-blue-900' 
    },
    { 
      label: 'Maintenance Requests', 
      value: pendingMaintenance, 
      icon: Wrench, 
      color: 'bg-orange-100 text-orange-900' 
    },
    { 
      label: 'New Updates', 
      value: unreadMemos, 
      icon: Mail, 
      color: 'bg-green-100 text-green-900' 
    }
  ];

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#003366] text-white transition-transform duration-300 flex flex-col`}>
        <div className="p-6">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
            <Home className="w-8 h-8" />
            <span className="text-xl font-bold">Nyumbanii</span>
          </a>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {['dashboard', 'payments', 'maintenance', 'lease', 'memos', 'settings'].map((view) => {
            const icons = { 
              dashboard: Home, 
              payments: DollarSign, 
              maintenance: Wrench, 
              lease: FileText,
              memos: Mail, 
              settings: Settings 
            };
            const Icon = icons[view];
            const labels = {
              memos: 'Updates & Notices',
              lease: 'My Lease'
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

        <div className="p-4 border-t border-[#002244]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#002244] transition text-red-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 lg:p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 capitalize">{currentView}</h1>
                <p className="text-sm lg:text-base text-gray-600 hidden sm:block">Welcome back, {profileSettings.name.split(' ')[0]}!</p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                  <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 rounded-full text-white text-[10px] lg:text-xs flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)}><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} onClick={() => markNotificationRead(notif.id)} className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}>
                            <p className="text-sm text-gray-900">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold">
                {profileSettings.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-6 flex-1 overflow-y-auto">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-gray-600 text-xs sm:text-sm mb-1">{stat.label}</p>
                        <p className="text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                        {stat.subValue && (
                          <p className="text-sm text-gray-600 mt-1">{stat.subValue}</p>
                        )}
                      </div>
                      <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lease Information */}
              {lease && (
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-[#003366]" />
                    Current Lease
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600">Property</p>
                          <p className="font-medium text-gray-900">{lease.property}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Unit Number</p>
                          <p className="font-medium text-gray-900">{lease.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Monthly Rent</p>
                          <p className="font-semibold text-[#003366] text-lg">KES {lease.rent?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600">Lease Start</p>
                          <p className="font-medium text-gray-900">{lease.leaseStart}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Lease End</p>
                          <p className="font-medium text-gray-900">{lease.leaseEnd}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Landlord</p>
                          <p className="font-medium text-gray-900">{lease.landlordName || 'Contact via platform'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Upcoming Payment */}
                {upcomingPayment && (
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#003366]" />
                      Upcoming Payment
                    </h3>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 mb-1">Amount Due</p>
                      <p className="text-3xl font-bold text-gray-900 mb-2">KES {upcomingPayment.amount?.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Due: {upcomingPayment.dueDate}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedPayment(upcomingPayment);
                        setPaymentProof({
                          ...paymentProof,
                          amount: upcomingPayment.amount?.toString() || '',
                          paymentDate: new Date().toISOString().split('T')[0]
                        });
                        setShowPaymentProofModal(true);
                      }}
                      className="w-full px-4 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
                    >
                      Submit Payment
                    </button>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowMaintenanceModal(true)} className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition text-center">
                      <Wrench className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <span className="text-xs font-medium text-gray-900">Request Maintenance</span>
                    </button>
                    <button onClick={() => setCurrentView('payments')} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition text-center">
                      <Receipt className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <span className="text-xs font-medium text-gray-900">Payment History</span>
                    </button>
                    <button onClick={() => setCurrentView('lease')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-center">
                      <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <span className="text-xs font-medium text-gray-900">View Lease</span>
                    </button>
                    <button onClick={() => setCurrentView('memos')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-center">
                      <Mail className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <span className="text-xs font-medium text-gray-900">View Updates</span>
                    </button>
                  </div>
                </div>

                {/* Recent Maintenance */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-[#003366]" />
                    Recent Maintenance Requests
                  </h3>
                  {maintenanceRequests.slice(0, 3).length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No maintenance requests yet</p>
                  ) : (
                    maintenanceRequests.slice(0, 3).map(request => (
                      <div key={request.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{request.issue}</p>
                          <p className="text-xs text-gray-600">{request.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Recent Updates */}
<div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#003366]" />
                    Recent Updates
                  </h3>
                  {memos.slice(0, 3).length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No updates yet</p>
                  ) : (
                    memos.slice(0, 3).map(memo => (
                      <div key={memo.id} onClick={() => setSelectedMemo(memo)} className="py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 text-sm">{memo.title}</p>
                              {memo.priority === 'urgent' && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Urgent</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{memo.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(memo.sentAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Payments View */}
          {currentView === 'payments' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Payment Management</h2>
                <button onClick={() => setShowPaymentProofModal(true)} className="w-full sm:w-auto px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Submit Payment
                </button>
              </div>

              {/* Payment Instructions */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-6 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Payment Instructions
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Option 1: M-Pesa Direct</p>
                    <p className="text-gray-600">Pay directly to landlord's M-Pesa: <span className="font-semibold">{lease?.landlordMpesa || '+254 712 345 678'}</span></p>
                    <p className="text-gray-600">Reference: {profileSettings.name} - Unit {lease?.unit}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Option 2: Bank Transfer</p>
                    <p className="text-gray-600">Bank: {lease?.landlordBank || 'KCB Bank'}</p>
                    <p className="text-gray-600">Account: {lease?.landlordAccount || '1234567890'}</p>
                    <p className="text-gray-600">Reference: {profileSettings.name} - Unit {lease?.unit}</p>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <p className="text-sm text-gray-600">After payment, upload proof here for verification</p>
                  </div>
                </div>
              </div>

              {/* Pending Payments */}
              {payments.filter(p => p.status === 'pending' || p.status === 'pending-verification').length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Pending Payments</h3>
                  <div className="grid gap-4">
                    {payments.filter(p => p.status === 'pending' || p.status === 'pending-verification').map(payment => (
                      <div key={payment.id} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-gray-900 text-lg">KES {payment.amount?.toLocaleString()}</p>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                payment.status === 'pending-verification' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.status === 'pending-verification' ? 'Awaiting Verification' : 'Unpaid'}
                              </span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                              <p>Due Date: {payment.dueDate}</p>
                              <p>Property: {payment.property} - Unit {payment.unit}</p>
                              {payment.transactionId && (
                                <p className="sm:col-span-2">Transaction ID: {payment.transactionId}</p>
                              )}
                            </div>
                          </div>
                          {payment.status === 'pending' && (
                            <button 
                              onClick={() => {
                                setSelectedPayment(payment);
                                setPaymentProof({
                                  ...paymentProof,
                                  amount: payment.amount?.toString() || '',
                                  paymentDate: new Date().toISOString().split('T')[0]
                                });
                                setShowPaymentProofModal(true);
                              }}
                              className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
                            >
                              Submit Payment
                            </button>
                          )}
                          {payment.status === 'pending-verification' && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Clock className="w-5 h-5" />
                              <span className="text-sm">Verifying...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Payment History</h3>
                {paymentHistory.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                    <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No payment history yet</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Paid</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paymentHistory.map(payment => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {payment.paidDate || payment.dueDate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                KES {payment.amount?.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {payment.method || 'M-Pesa'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Paid
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button 
                                  onClick={() => handleDownloadReceipt(payment)}
                                  className="text-[#003366] hover:text-[#002244]"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Maintenance View */}
          {currentView === 'maintenance' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Maintenance Requests</h2>
                <button onClick={() => setShowMaintenanceModal(true)} className="w-full sm:w-auto px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center justify-center gap-2">
                  <Wrench className="w-5 h-5" />
                  New Request
                </button>
              </div>
              
              {maintenanceRequests.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                  <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No maintenance requests yet</p>
                  <button onClick={() => setShowMaintenanceModal(true)} className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                    Submit First Request
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {maintenanceRequests.map(request => (
                    <div key={request.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">{request.issue}</h3>
                              <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              request.priority === 'high' ? 'bg-red-100 text-red-800' :
                              request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {request.priority} priority
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Submitted: {request.date}
                            </span>
                            {request.preferredDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Preferred: {request.preferredDate} at {request.preferredTime}
                              </span>
                            )}
                          </div>

                          {request.images && request.images.length > 0 && (
                            <div className="flex gap-2 mb-3">
                              {request.images.map((img, idx) => (
                                <img key={idx} src={img} alt={`Issue ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === 'completed' ? 'bg-green-100 text-green-800' :
                              request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status === 'in-progress' ? 'In Progress' : request.status}
                            </span>
                            {request.status === 'completed' && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Lease View - IMPROVED WITH CLEAR FUNCTIONALITY */}
          {currentView === 'lease' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6">My Lease Agreement</h2>
              
              {!lease ? (
                <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active lease found</p>
                </div>
              ) : (
                <>
                  <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{lease.property}</h3>
                        <p className="text-gray-600">Unit {lease.unit}</p>
                      </div>
                      <button 
                        onClick={handleDownloadLease}
                        className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download Lease
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Lease Details</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Start Date:</span>
                            <span className="font-medium text-gray-900">{lease.leaseStart}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">End Date:</span>
                            <span className="font-medium text-gray-900">{lease.leaseEnd}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium text-gray-900">
                              {Math.round((new Date(lease.leaseEnd) - new Date(lease.leaseStart)) / (1000 * 60 * 60 * 24 * 30))} months
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Financial Information</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Monthly Rent:</span>
                            <span className="font-semibold text-gray-900">KES {lease.rent?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Security Deposit:</span>
                            <span className="font-medium text-gray-900">KES {lease.deposit?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Due:</span>
                            <span className="font-medium text-gray-900">1st of each month</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {lease.amenities && lease.amenities.length > 0 && (
                      <div className="border-t pt-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Property Amenities</h4>
                        <div className="flex flex-wrap gap-2">
                          {lease.amenities.map((amenity, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lease Terms */}
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4">Important Terms & Conditions</h4>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p>Rent must be paid by the 1st of each month. Late payments may incur a penalty.</p>
                      </div>
                      <div className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p>Tenant is responsible for minor repairs and maintenance within the unit.</p>
                      </div>
                      <div className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p>24-hour notice required for landlord inspections except in emergencies.</p>
                      </div>
                      <div className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p>Security deposit will be refunded within 30 days of lease termination, minus any damages.</p>
                      </div>
                      <div className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p>Tenant must provide 30 days notice before lease termination or renewal.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Memos View */}
          {currentView === 'memos' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Updates & Notices</h2>
              
              {memos.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No updates yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {memos.map(memo => (
                    <div key={memo.id} onClick={() => setSelectedMemo(memo)} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg">{memo.title}</h3>
                            {memo.priority === 'urgent' && (
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                Urgent
                              </span>
                            )}
                            {memo.priority === 'high' && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                High Priority
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{memo.message}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <span>From: {memo.sentBy}</span>
                            <span>Date: {new Date(memo.sentAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Settings View */}
          {currentView === 'settings' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Profile Settings */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileSettings.name}
                      onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                      disabled={!editingProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profileSettings.email}
                      onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                      disabled={!editingProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profileSettings.phone}
                      onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                      disabled={!editingProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingProfile ? (
                      <>
                        <button onClick={handleUpdateProfile} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                          Save Changes
                        </button>
                        <button onClick={() => setEditingProfile(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setEditingProfile(true)} className="w-full px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={profileSettings.emergencyContact.name}
                      onChange={(e) => setProfileSettings({
                        ...profileSettings,
                        emergencyContact: {...profileSettings.emergencyContact, name: e.target.value}
                      })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={profileSettings.emergencyContact.phone}
                      onChange={(e) => setProfileSettings({
                        ...profileSettings,
                        emergencyContact: {...profileSettings.emergencyContact, phone: e.target.value}
                      })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={profileSettings.emergencyContact.relationship}
                      onChange={(e) => setProfileSettings({
                        ...profileSettings,
                        emergencyContact: {...profileSettings.emergencyContact, relationship: e.target.value}
                      })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive updates via email</p>
                    </div>
                    <button
                      onClick={() => handleUpdateNotifications('email')}
                      className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.email ? 'bg-[#003366]' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.email ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Receive updates via SMS</p>
                    </div>
                    <button
                      onClick={() => handleUpdateNotifications('sms')}
                      className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.sms ? 'bg-[#003366]' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.sms ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Payment Reminders</p>
                      <p className="text-sm text-gray-600">Rent due reminders</p>
                    </div>
                    <button
                      onClick={() => handleUpdateNotifications('paymentReminders')}
                      className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.paymentReminders ? 'bg-[#003366]' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.paymentReminders ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Maintenance Updates</p>
                      <p className="text-sm text-gray-600">Request status updates</p>
                    </div>
                    <button
                      onClick={() => handleUpdateNotifications('maintenanceUpdates')}
                      className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.maintenanceUpdates ? 'bg-[#003366]' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.maintenanceUpdates ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Landlord Updates</p>
                      <p className="text-sm text-gray-600">Important notices</p>
                    </div>
                    <button
                      onClick={() => handleUpdateNotifications('memos')}
                      className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.memos ? 'bg-[#003366]' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.memos ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Security</h3>
                <button onClick={() => setShowPasswordModal(true)} className="w-full px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                  Change Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Maintenance Request Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Submit Maintenance Request</h2>
              <button onClick={() => setShowMaintenanceModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title *</label>
                <input
                  type="text"
                  value={newMaintenance.issue}
                  onChange={(e) => setNewMaintenance({...newMaintenance, issue: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="e.g., Leaking faucet in bathroom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newMaintenance.description}
                  onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Provide detailed description of the issue..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newMaintenance.priority}
                  onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="low">Low - Can wait a few days</option>
                  <option value="medium">Medium - Needs attention soon</option>
                  <option value="high">High - Urgent, affects daily living</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={newMaintenance.preferredDate}
                    onChange={(e) => setNewMaintenance({...newMaintenance, preferredDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                  <select
                    value={newMaintenance.preferredTime}
                    onChange={(e) => setNewMaintenance({...newMaintenance, preferredTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="">Any time</option>
                    <option value="09:00">9:00 AM - 12:00 PM</option>
                    <option value="12:00">12:00 PM - 3:00 PM</option>
                    <option value="15:00">3:00 PM - 6:00 PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#003366] transition cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      const uploadPromises = files.map(file => handleImageUpload(file));
                      const urls = await Promise.all(uploadPromises);
                      setNewMaintenance({
                        ...newMaintenance,
                        images: [...newMaintenance.images, ...urls.filter(url => url !== null)]
                      });
                    }}
                    className="hidden"
                    id="maintenance-images"
                  />
                  <label htmlFor="maintenance-images" className="cursor-pointer">
                    {uploadingImage ? (
                      <div className="text-[#003366]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-2"></div>
                        <p>Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload photos of the issue</p>
                        <p className="text-xs text-gray-500 mt-1">This helps us understand the problem better</p>
                      </>
                    )}
                  </label>
                </div>
                {newMaintenance.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {newMaintenance.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img src={img} alt={`Issue ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={() => setNewMaintenance({
                            ...newMaintenance,
                            images: newMaintenance.images.filter((_, i) => i !== idx)
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
              <button onClick={() => setShowMaintenanceModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
              <button onClick={handleSubmitMaintenance} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Payment Proof Modal */}
      {showPaymentProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Submit Payment Proof</h2>
              <button onClick={() => setShowPaymentProofModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Payment Instructions:</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Pay via M-Pesa to: <strong>{lease?.landlordMpesa || '+254 712 345 678'}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Reference: <strong>{profileSettings.name} - Unit {lease?.unit}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={paymentProof.method}
                  onChange={(e) => setPaymentProof({...paymentProof, method: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {paymentProof.method === 'mpesa' ? 'M-Pesa Transaction ID *' : 
                   paymentProof.method === 'bank' ? 'Bank Reference Number *' : 
                   'Receipt Number *'}
                </label>
                <input
                  type="text"
                  value={paymentProof.transactionId}
                  onChange={(e) => setPaymentProof({...paymentProof, transactionId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder={paymentProof.method === 'mpesa' ? 'e.g., QAB1CD2EFG' : 'Reference number'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (KES) *</label>
                  <input
                    type="number"
                    value={paymentProof.amount}
                    onChange={(e) => setPaymentProof({...paymentProof, amount: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="30000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentProof.paymentDate}
                    onChange={(e) => setPaymentProof({...paymentProof, paymentDate: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Payment Proof {paymentProof.method === 'mpesa' ? '(M-Pesa Screenshot)' : '(Receipt/Screenshot)'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#003366] transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setPaymentProof({...paymentProof, proofImage: file});
                      }
                    }}
                    className="hidden"
                    id="payment-proof"
                  />
                  <label htmlFor="payment-proof" className="cursor-pointer">
                    {paymentProof.proofImage ? (
                      <div className="text-green-600">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">File selected: {paymentProof.proofImage.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Click to change</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload proof of payment</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Your payment will be verified by the landlord. You'll receive a notification once verified.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowPaymentProofModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
              <button onClick={handleSubmitPaymentProof} className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                Submit Proof
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
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

      {/* Memo Detail Modal */}
      {selectedMemo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{selectedMemo.title}</h2>
                {selectedMemo.priority === 'urgent' && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    Urgent
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedMemo(null)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">From: {selectedMemo.sentBy}</p>
                <p className="text-sm text-gray-600">Date: {new Date(selectedMemo.sentAt).toLocaleString()}</p>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedMemo.message}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button onClick={() => setSelectedMemo(null)} className="w-full px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;