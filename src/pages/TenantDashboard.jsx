import React, { useState } from 'react';
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

const TenantDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      name: 'Riverside Towers', 
      location: 'Parklands, Nairobi', 
      rent: 52000, 
      bedrooms: 3, 
      bathrooms: 2, 
      area: 110, 
      amenities: ['Gym', 'Swimming Pool', 'Parking'],
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800'
      ]
    },
    { 
      id: 3, 
      name: 'Palm Court', 
      location: 'Karen, Nairobi', 
      rent: 65000, 
      bedrooms: 3, 
      bathrooms: 3, 
      area: 140, 
      amenities: ['Garden', 'Parking', 'Security', 'Backup Generator'],
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
      ]
    }
  ];

  const propertyInfo = {
    name: 'Sunset Apartments',
    unit: 'Unit 4A',
    address: 'Westlands, Nairobi',
    rent: 35000,
    dueDate: '5th of each month',
    leaseStart: '2024-01-15',
    leaseEnd: '2025-01-14',
    landlord: 'Tom Doe',
    landlordPhone: '+254 712 345 678',
    landlordEmail: 'tom@nyumbanii.co.ke'
  };

  const stats = [
    { label: 'Rent Due', value: `KES ${(propertyInfo.rent / 1000).toFixed(0)}K`, icon: DollarSign, color: 'bg-red-100 text-red-900', status: 'Due in 3 days' },
    { label: 'Maintenance Requests', value: maintenanceRequests.filter(r => r.status !== 'Resolved').length, icon: Wrench, color: 'bg-blue-100 text-blue-900', status: 'Active' },
    { label: 'Payments Made', value: payments.filter(p => p.status === 'Paid').length, icon: CheckCircle, color: 'bg-green-100 text-green-900', status: 'This year' }
  ];

  const handleSubmitPayment = () => {
    if (newPayment.amount && newPayment.method && newPayment.reference) {
      const payment = {
        id: payments.length + 1,
        month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        amount: parseInt(newPayment.amount),
        date: newPayment.date,
        status: 'Paid',
        method: newPayment.method,
        reference: newPayment.reference
      };
      setPayments([payment, ...payments]);
      setNewPayment({ amount: '35000', method: 'M-Pesa', reference: '', date: new Date().toISOString().split('T')[0] });
      setShowPaymentModal(false);
      alert('Payment submitted successfully! Your landlord will verify and confirm.');
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleSubmitMaintenance = () => {
    if (newMaintenance.issue && newMaintenance.description) {
      const request = {
        id: maintenanceRequests.length + 1,
        issue: newMaintenance.issue,
        description: newMaintenance.description,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        priority: newMaintenance.priority,
        location: newMaintenance.location
      };
      setMaintenanceRequests([request, ...maintenanceRequests]);
      setNewMaintenance({ issue: '', description: '', priority: 'Medium', location: '' });
      setShowMaintenanceModal(false);
      alert('Maintenance request submitted! Your landlord will respond shortly.');
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleSendMessage = () => {
    if (newMessage.subject && newMessage.message) {
      const message = {
        id: messages.length + 1,
        from: 'You',
        to: newMessage.to,
        subject: newMessage.subject,
        message: newMessage.message,
        date: new Date().toISOString().split('T')[0],
        read: true
      };
      setMessages([message, ...messages]);
      setNewMessage({ to: 'Property Manager', subject: '', message: '' });
      setShowMessageModal(false);
      alert('Message sent successfully!');
    } else {
      alert('Please fill in all required fields');
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

  const markNotificationRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const filteredListings = availableListings.filter(listing =>
    listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
{sidebarOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
)}

<aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#003366] text-white transition-transform duration-300 flex flex-col`}>
        <div className="p-6">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo-light.svg" alt="Nyumbanii Logo" className="h-10 w-auto" />
            </div>
            {sidebarOpen && <span className="text-xl font-bold">Nyumbanii</span>}
          </a>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
  { id: 'dashboard', icon: Home, label: 'Dashboard' },
  { id: 'listings', icon: Search, label: 'Browse Listings' },
  { id: 'payments', icon: DollarSign, label: 'Payments' },
  { id: 'maintenance', icon: Wrench, label: 'Maintenance' },
  { id: 'documents', icon: FileText, label: 'Documents' },
  { id: 'messages', icon: MessageSquare, label: 'Messages' },
  { id: 'settings', icon: Settings, label: 'Settings' }
].map((item) => (
  <button key={item.id} onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === item.id ? 'bg-[#002244]' : 'hover:bg-[#002244]'}`}>
    <item.icon className="w-5 h-5" />
    <span className="text-sm">{item.label}</span>
  </button>
))}
        </nav>

        <div className="p-4 border-t border-[#002244]">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#002244] transition text-red-300">
           <LogOut className="w-5 h-5" />
           <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
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
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                  <Bell className="w-6 h-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)}><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div key={notif.id} onClick={() => markNotificationRead(notif.id)} className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}>
                          <p className="text-sm text-gray-900">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      ))}
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

        <div className="p-4 lg:p-6 flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <>
              <div className="bg-[#003366] text-white rounded-xl p-4 lg:p-6 mb-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                  <h2 className="text-xl lg:text-2xl font-bold mb-2">{propertyInfo.name}</h2>
                    <p className="text-blue-100 mb-4">{propertyInfo.unit} • {propertyInfo.address}</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-blue-200 text-sm">Monthly Rent</p>
                        <p className="text-2xl font-bold">KES {propertyInfo.rent.toLocaleString()}</p>
                      </div>
                      <div className="h-10 w-px bg-blue-400"></div>
                      <div>
                        <p className="text-blue-200 text-sm">Due Date</p>
                        <p className="font-semibold">{propertyInfo.dueDate}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowPaymentModal(true)} className="w-full sm:w-auto bg-white text-[#003366] px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5" />Pay Now
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm text-gray-500">{stat.status}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Payments</h2>
                    <button onClick={() => setCurrentView('payments')} className="text-[#003366] hover:underline text-sm font-semibold">View All</button>
                  </div>
                  <div className="space-y-4">
                    {payments.slice(0, 4).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === 'Paid' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            <CheckCircle className={`w-5 h-5 ${payment.status === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{payment.month}</p>
                            <p className="text-sm text-gray-500">{payment.date || `Due: ${payment.dueDate}`}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">KES {payment.amount.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{payment.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Maintenance Requests</h2>
                    <button onClick={() => setShowMaintenanceModal(true)} className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition text-sm">
                      <Plus className="w-4 h-4" />New Request
                    </button>
                  </div>
                  <div className="space-y-4">
                    {maintenanceRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:border-[#003366] transition">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-900">{request.issue}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            request.priority === 'High' ? 'bg-red-100 text-red-800' :
                            request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>{request.priority}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">{request.date}</p>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            request.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                            request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>{request.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button onClick={() => setShowPaymentModal(true)} className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#003366] hover:bg-blue-50 transition group">
                    <CreditCard className="w-8 h-8 text-gray-400 group-hover:text-[#003366] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-[#003366]">Pay Rent</p>
                  </button>
                  <button onClick={() => setShowMaintenanceModal(true)} className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#003366] hover:bg-blue-50 transition group">
                    <Wrench className="w-8 h-8 text-gray-400 group-hover:text-[#003366] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-[#003366]">Request Repair</p>
                  </button>
                  <button onClick={() => setShowMessageModal(true)} className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#003366] hover:bg-blue-50 transition group">
                    <MessageSquare className="w-8 h-8 text-gray-400 group-hover:text-[#003366] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-[#003366]">Contact Landlord</p>
                  </button>
                  <button onClick={() => setCurrentView('documents')} className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#003366] hover:bg-blue-50 transition group">
                    <FileText className="w-8 h-8 text-gray-400 group-hover:text-[#003366] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-[#003366]">View Lease</p>
                  </button>
                </div>
              </div>
            </>
          )}

          {currentView === 'listings' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Available Properties</h2>
                <p className="text-gray-600">Browse other available properties in Nairobi</p>
              </div>

              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Search by name or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <div key={listing.id} onClick={() => { setSelectedListing(listing); setCurrentImageIndex(0); }} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer">
                    <div className="relative h-48 bg-gray-200">
                      {listing.images && listing.images.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <Home className="w-16 h-16 text-[#003366] opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{listing.name}</h3>
                      <div className="flex items-center text-gray-600 text-sm mb-4">
                        <MapPin className="w-4 h-4 mr-1" />{listing.location}
                      </div>
                      
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1"><Bed className="w-4 h-4" /><span>{listing.bedrooms} bed</span></div>
                        <div className="flex items-center gap-1"><Bath className="w-4 h-4" /><span>{listing.bathrooms} bath</span></div>
                        <div className="flex items-center gap-1"><Square className="w-4 h-4" /><span>{listing.area} m²</span></div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {listing.amenities.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{amenity}</span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Starting from</p>
                          <p className="text-2xl font-bold text-[#003366]">KES {(listing.rent / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-gray-500">per month</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedListing(listing); setCurrentImageIndex(0); }} className="bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2">
                          <Eye className="w-4 h-4" />View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button onClick={() => window.location.href = '/listings'} className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-6 py-3 rounded-lg font-semibold transition">
                  <Search className="w-5 h-5" />View All Listings on Marketplace
                </button>
              </div>
            </div>
          )}

{currentView === 'payments' && (
  <>
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
        <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition">
          <Plus className="w-5 h-5" />Submit Payment
        </button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800"><strong>Current Rent:</strong> KES {propertyInfo.rent.toLocaleString()}/month | <strong>Due Date:</strong> {propertyInfo.dueDate}</p>
      </div>

      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${payment.status === 'Paid' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {payment.status === 'Paid' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{payment.month}</p>
                  <p className="text-sm text-gray-500">{payment.status === 'Paid' ? `Paid on ${payment.date}` : `Due: ${payment.dueDate}`}</p>
                  {payment.method && <p className="text-xs text-gray-500">via {payment.method}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">KES {payment.amount.toLocaleString()}</p>
                <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{payment.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
)}

{currentView === 'maintenance' && (
  <>
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Maintenance Requests</h2>
        <button onClick={() => setShowMaintenanceModal(true)} className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition">
          <Plus className="w-5 h-5" />New Request
        </button>
      </div>

      <div className="space-y-4">
        {maintenanceRequests.map((request) => (
          <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Wrench className="w-5 h-5 text-[#003366]" />
                  <h3 className="font-semibold text-gray-900 text-lg">{request.issue}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                <p className="text-xs text-gray-500">Submitted on {request.date}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  request.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                  request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>{request.status}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  request.priority === 'High' ? 'bg-red-100 text-red-800' :
                  request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>{request.priority}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
)}

  {currentView === 'documents' && (
  <>
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">My Documents</h2>
        <button className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition">
          <Upload className="w-5 h-5" />Upload Document
        </button>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#003366]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{doc.name}</p>
                <p className="text-sm text-gray-500">{doc.type} • {doc.size} • {doc.date}</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-[#003366] hover:text-[#002244] font-semibold">
              <Download className="w-5 h-5" />Download
            </button>
          </div>
        ))}
      </div>
    </div>
  </>
)}

  {currentView === 'messages' && (
    <>
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        <button onClick={() => setShowMessageModal(true)} className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition">
          <Plus className="w-5 h-5" />New Message
        </button>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`p-4 border rounded-lg cursor-pointer transition ${message.read ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'} hover:shadow-md`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold">
                  {message.from.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{message.from}</p>
                  <p className="text-sm text-gray-500">{message.date}</p>
                </div>
              </div>
              {!message.read && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
            </div>
            <p className="font-semibold text-gray-800 mb-1">{message.subject}</p>
            <p className="text-sm text-gray-600">{message.preview}</p>
          </div>
        ))}
      </div>
    </div>
  </>
)}

          {currentView === 'settings' && (
  <>
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
        {!editingProfile ? (
          <button onClick={() => setEditingProfile(true)} className="px-4 py-2 border border-[#003366] text-[#003366] hover:bg-blue-50 rounded-lg font-semibold transition">Edit Profile</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditingProfile(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
            <button onClick={handleUpdateProfile} className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">Save Changes</button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6 mb-6 pb-6 border-b">
        <div className="w-24 h-24 bg-[#003366] rounded-full flex items-center justify-center text-white text-3xl font-semibold">
          {profileSettings.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{profileSettings.name}</h3>
          <p className="text-gray-600">{profileSettings.email}</p>
          <button className="mt-2 flex items-center gap-2 text-[#003366] hover:text-[#002244] font-semibold transition">
            <Camera className="w-4 h-4" />Change Photo
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" value={profileSettings.name} onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})} disabled={!editingProfile} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={profileSettings.email} onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})} disabled={!editingProfile} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input type="tel" value={profileSettings.phone} onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})} disabled={!editingProfile} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
          <input type="text" value={profileSettings.idNumber} onChange={(e) => setProfileSettings({...profileSettings, idNumber: e.target.value})} disabled={!editingProfile} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
          <input type="tel" value={profileSettings.emergencyContact} onChange={(e) => setProfileSettings({...profileSettings, emergencyContact: e.target.value})} disabled={!editingProfile} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600" />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Lease Information</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Property</p>
          <p className="font-semibold text-gray-900">{propertyInfo.name} - {propertyInfo.unit}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Monthly Rent</p>
          <p className="font-semibold text-gray-900">KES {propertyInfo.rent.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Lease Start</p>
          <p className="font-semibold text-gray-900">{propertyInfo.leaseStart}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Lease End</p>
          <p className="font-semibold text-gray-900">{propertyInfo.leaseEnd}</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Security</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Password</h3>
            <p className="text-sm text-gray-600">Last changed 3 months ago</p>
          </div>
          <button onClick={() => setShowPasswordModal(true)} className="px-4 py-2 border border-[#003366] text-[#003366] hover:bg-blue-50 rounded-lg font-semibold transition">Change Password</button>
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <button className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">Enable</button>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
      <div className="space-y-4">
        {Object.entries({
          email: 'Email Notifications',
          sms: 'SMS Notifications',
          push: 'Push Notifications',
          rentReminders: 'Rent Reminders',
          maintenanceUpdates: 'Maintenance Updates',
          messageAlerts: 'Message Alerts'
        }).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <span className="font-medium text-gray-900">{label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={profileSettings.notifications[key]} onChange={() => handleUpdateNotifications(key)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  </>
)}
        </div>
      </div>

      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{selectedListing.name}</h3>
              <button onClick={() => setSelectedListing(null)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>

            <div className="mb-6">
              <div className="relative h-96 bg-gray-200 rounded-xl overflow-hidden mb-4">
                {selectedListing.images && selectedListing.images.length > 0 ? (
                  <>
                    <img src={selectedListing.images[currentImageIndex]} alt={selectedListing.name} className="w-full h-full object-cover" />
                    {selectedListing.images.length > 1 && (
                      <>
                        <button onClick={() => setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : selectedListing.images.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full flex items-center justify-center transition">
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button onClick={() => setCurrentImageIndex(currentImageIndex < selectedListing.images.length - 1 ? currentImageIndex + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full flex items-center justify-center transition">
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {selectedListing.images.map((_, idx) => (
                            <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-2 h-2 rounded-full transition ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white bg-opacity-50'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Home className="w-24 h-24 text-[#003366] opacity-50" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {selectedListing.images && selectedListing.images.slice(0, 4).map((img, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`h-20 rounded-lg overflow-hidden border-2 ${idx === currentImageIndex ? 'border-[#003366]' : 'border-transparent'}`}>
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2 text-[#003366]" />
                <span className="text-lg">{selectedListing.location}</span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bed className="w-5 h-5 text-[#003366]" />
                    <span className="font-semibold text-gray-900">Bedrooms</span>
                  </div>
                  <p className="text-2xl font-bold text-[#003366]">{selectedListing.bedrooms}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bath className="w-5 h-5 text-[#003366]" />
                    <span className="font-semibold text-gray-900">Bathrooms</span>
                  </div>
                  <p className="text-2xl font-bold text-[#003366]">{selectedListing.bathrooms}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Square className="w-5 h-5 text-[#003366]" />
                    <span className="font-semibold text-gray-900">Area</span>
                  </div>
                  <p className="text-2xl font-bold text-[#003366]">{selectedListing.area} m²</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.amenities.map((amenity, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">{amenity}</span>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-gray-600 mb-1">Monthly Rent</p>
                    <p className="text-4xl font-bold text-[#003366]">KES {selectedListing.rent.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <button onClick={() => { setSelectedListing(null); setShowMessageModal(true); }} className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" />Contact Landlord
                  </button>
                  <button onClick={() => window.location.href = '/listings'} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5" />Book Site Visit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Submit Payment</h3>
              <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">Submit your payment details for verification. Your landlord will confirm receipt.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                <input type="number" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="35000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={newPayment.method} onChange={(e) => setNewPayment({...newPayment, method: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
                <input type="text" value={newPayment.reference} onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., QH12345678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input type="date" value={newPayment.date} onChange={(e) => setNewPayment({...newPayment, date: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
              <button onClick={handleSubmitPayment} className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">Submit Payment</button>
            </div>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">New Maintenance Request</h3>
              <button onClick={() => setShowMaintenanceModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
                <input type="text" value={newMaintenance.issue} onChange={(e) => setNewMaintenance({...newMaintenance, issue: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., Leaking faucet" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={newMaintenance.location} onChange={(e) => setNewMaintenance({...newMaintenance, location: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., Kitchen, Bathroom" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={newMaintenance.description} onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="Provide detailed description of the issue..." rows={4} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={newMaintenance.priority} onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowMaintenanceModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
              <button onClick={handleSubmitMaintenance} className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Send Message</h3>
              <button onClick={() => setShowMessageModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select value={newMessage.to} onChange={(e) => setNewMessage({...newMessage, to: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                  <option value="Property Manager">Property Manager</option>
                  <option value="Landlord">Landlord</option>
                  <option value="Maintenance Team">Maintenance Team</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" value={newMessage.subject} onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="Message subject" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={newMessage.message} onChange={(e) => setNewMessage({...newMessage, message: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="Type your message here..." rows={5} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowMessageModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
              <button onClick={handleSendMessage} className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" value={passwordData.current} onChange={(e) => setPasswordData({...passwordData, current: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={passwordData.new} onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="Enter new password" />
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="Confirm new password" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
              <button onClick={handleChangePassword} className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">Change Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;