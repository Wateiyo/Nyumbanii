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
  Send
} from 'lucide-react';

const TenantDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

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
    { id: 3, name: 'Property Inspection Report', type: 'PDF', date: '2024-01-20', size: '1.8 MB' }
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
    priority: 'medium',
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
      image: '',
      amenities: ['Parking', 'Security', 'Water']
    },
    { 
      id: 2, 
      name: 'Riverside Towers', 
      location: 'Parklands, Nairobi',
      rent: 52000,
      bedrooms: 3,
      bathrooms: 2,
      area: 110,
      image: '',
      amenities: ['Gym', 'Swimming Pool', 'Parking']
    },
    { 
      id: 3, 
      name: 'Palm Court', 
      location: 'Karen, Nairobi',
      rent: 65000,
      bedrooms: 3,
      bathrooms: 3,
      area: 140,
      image: '',
      amenities: ['Garden', 'Parking', 'Security', 'Backup Generator']
    }
  ];

  const propertyInfo = {
    name: 'Sunset Apartments',
    unit: 'Unit 4A',
    address: 'Westlands, Nairobi',
    rent: 35000,
    dueDate: '5th of each month',
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
        priority: newMaintenance.priority
      };
      setMaintenanceRequests([request, ...maintenanceRequests]);
      setNewMaintenance({ issue: '', description: '', priority: 'medium', location: '' });
      setShowMaintenanceModal(false);
      alert('Maintenance request submitted! Your landlord will respond shortly.');
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
    }
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
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-blue-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
            <svg width="40" height="40" viewBox="0 0 100 100">
              <path d="M 25 45 Q 25 35 35 35 Q 35 25 50 25 Q 65 25 65 35 Q 75 35 75 45 Q 75 55 65 55 L 35 55 Q 25 55 25 45 Z" 
                    fill="white" stroke="#ffffff" strokeWidth="3.5" />
            </svg>
            {sidebarOpen && <span className="text-xl font-bold">Nyumbanii</span>}
          </div>
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
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                currentView === item.id ? 'bg-blue-800' : 'hover:bg-blue-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition text-red-300">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{currentView}</h1>
              <p className="text-gray-600">Welcome back, Sarah!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <Bell className="w-6 h-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)}>
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}
                        >
                          <p className="text-sm text-gray-900">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-semibold">
                SK
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <>
              {/* Property Info Card */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl p-6 mb-6 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{propertyInfo.name}</h2>
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
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Pay Now
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
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
                {/* Payment History */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Payments</h2>
                    <button 
                      onClick={() => setCurrentView('payments')}
                      className="text-blue-900 hover:underline text-sm font-semibold"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {payments.slice(0, 4).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            payment.status === 'Paid' ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            <CheckCircle className={`w-5 h-5 ${
                              payment.status === 'Paid' ? 'text-green-600' : 'text-yellow-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{payment.month}</p>
                            <p className="text-sm text-gray-500">{payment.date || `Due: ${payment.dueDate}`}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">KES {payment.amount.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Maintenance Requests */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Maintenance Requests</h2>
                    <button 
                      onClick={() => setShowMaintenanceModal(true)}
                      className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      New Request
                    </button>
                  </div>
                  <div className="space-y-4">
                    {maintenanceRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-900">{request.issue}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            request.priority === 'High' ? 'bg-red-100 text-red-800' :
                            request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.priority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">{request.date}</p>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            request.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                            request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-900 hover:bg-blue-50 transition group"
                  >
                    <CreditCard className="w-8 h-8 text-gray-400 group-hover:text-blue-900 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-900">Pay Rent</p>
                  </button>
                  <button 
                    onClick={() => setShowMaintenanceModal(true)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-900 hover:bg-blue-50 transition group"
                  >
                    <Wrench className="w-8 h-8 text-gray-400 group-hover:text-blue-900 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-900">Request Repair</p>
                  </button>
                  <button 
                    onClick={() => setShowMessageModal(true)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-900 hover:bg-blue-50 transition group"
                  >
                    <MessageSquare className="w-8 h-8 text-gray-400 group-hover:text-blue-900 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-900">Contact Landlord</p>
                  </button>
                  <button 
                    onClick={() => setCurrentView('documents')}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-900 hover:bg-blue-50 transition group"
                  >
                    <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-900 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-900">View Lease</p>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Browse Listings View */}
          {currentView === 'listings' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Available Properties</h2>
                <p className="text-gray-600">Browse other available properties in Nairobi</p>
              </div>

              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <div 
                    key={listing.id} 
                    onClick={() => setSelectedListing(listing)}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer"
                  >
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Home className="w-16 h-16 text-blue-900 opacity-50" />
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{listing.name}</h3>
                      <div className="flex items-center text-gray-600 text-sm mb-4">
                        <MapPin className="w-4 h-4 mr-1" />
                        {listing.location}
                      </div>
                      
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span>{listing.bedrooms} bed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          <span>{listing.bathrooms} bath</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Square className="w-4 h-4" />
                          <span>{listing.area} m²</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {listing.amenities.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {amenity}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Starting from</p>
                          <p className="text-2xl font-bold text-blue-900">KES {(listing.rent / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-gray-500">per month</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedListing(listing);
                          }}
                          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => window.location.href = '/listings'}
                  className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  <Search className="w-5 h-5" />
                  View All Listings on Marketplace
                </button>
              </div>
            </div>
          )}

          {/* Payments View */}
          {currentView === 'payments' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  <Plus className="w-5 h-5" />
                  Submit Payment
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Current Rent:</strong> KES {propertyInfo.rent.toLocaleString()}/month | <strong>Due Date:</strong> {propertyInfo.dueDate}
                </p>
              </div>

              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          payment.status === 'Paid' ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                          {payment.status === 'Paid' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <DollarSign className="w-6 h-6 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{payment.month}</p>
                          <p className="text-sm text-gray-500">
                            {payment.status === 'Paid' ? `Paid on ${payment.date}` : `Due: ${payment.dueDate}`}
                          </p>
                          {payment.method && (
                            <p className="text-xs text-gray-500">via {payment.method}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">KES {payment.amount.toLocaleString()}</p>
                        <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${
                          payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance View */}
          {currentView === 'maintenance' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Maintenance Requests</h2>
                <button 
                  onClick={() => setShowMaintenanceModal(true)}
                  className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  <Plus className="w-5 h-5" />
                  New Request
                </button>
              </div>

              <div className="space-y-4">
                {maintenanceRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{request.issue}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            request.priority === 'High' ? 'bg-red-100 text-red-800' :
                            request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.priority} Priority
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{request.description}</p>
                        <p className="text-sm text-gray-500">Submitted on {request.date}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-lg font-medium ${
                        request.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents View */}
          {currentView === 'documents' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Documents</h2>
                <button className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition">
                  <Upload className="w-5 h-5" />
                  Upload Document
                </button>
              </div>

              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-900" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.type} • {doc.size} • {doc.date}</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 text-blue-900 hover:text-blue-700 font-semibold">
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages View */}
          {currentView === 'messages' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                <button 
                  onClick={() => setShowMessageModal(true)}
                  className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  <Plus className="w-5 h-5" />
                  New Message
                </button>
              </div>

              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      message.read ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'
                    } hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-semibold">
                          {message.from.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{message.from}</p>
                          <p className="text-sm text-gray-500">{message.date}</p>
                        </div>
                      </div>
                      {!message.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800 mb-1">{message.subject}</p>
                    <p className="text-sm text-gray-600">{message.preview}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings View */}
          {currentView === 'settings' && (
            <div className="max-w-4xl">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-24 h-24 bg-blue-900 rounded-full flex items-center justify-center text-white text-3xl font-semibold">
                    SK
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <Upload className="w-5 h-5" />
                    Change Photo
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      defaultValue="Sarah Kimani"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue="sarah@email.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      defaultValue="+254 722 123 456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <button className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold transition">
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Landlord Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-900" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{propertyInfo.landlordPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-900" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{propertyInfo.landlordEmail}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{selectedListing.name}</h3>
              <button onClick={() => setSelectedListing(null)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <div className="h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
                <Home className="w-24 h-24 text-blue-900 opacity-50" />
              </div>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2 text-blue-900" />
                <span className="text-lg">{selectedListing.location}</span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bed className="w-5 h-5 text-blue-900" />
                    <span className="font-semibold text-gray-900">Bedrooms</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{selectedListing.bedrooms}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bath className="w-5 h-5 text-blue-900" />
                    <span className="font-semibold text-gray-900">Bathrooms</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{selectedListing.bathrooms}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Square className="w-5 h-5 text-blue-900" />
                    <span className="font-semibold text-gray-900">Area</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{selectedListing.area} m²</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.amenities.map((amenity, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-gray-600 mb-1">Monthly Rent</p>
                    <p className="text-4xl font-bold text-blue-900">KES {selectedListing.rent.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setSelectedListing(null);
                      setShowMessageModal(true);
                    }}
                    className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Contact Landlord
                  </button>
                  <button 
                    onClick={() => window.location.href = '/listings'}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Book Site Visit
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
              <button onClick={() => setShowPaymentModal(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                Submit your payment details for verification. Your landlord will confirm receipt.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                  placeholder="35000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                >
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                  placeholder="e.g., QH12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                className="flex-1 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold transition"
              >
                Submit Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">New Maintenance Request</h3>
              <button onClick={() => setShowMaintenanceModal(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
                <input
                  type="text"
                  value={newMaintenance.issue}
                  onChange={(e) => setNewMaintenance({...newMaintenance, issue: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                  placeholder="e.g., Leaking faucet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newMaintenance.location}
                  onChange={(e) => setNewMaintenance({...newMaintenance, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                  placeholder="e.g., Kitchen, Bathroom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newMaintenance.description}
                  onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                  placeholder="Provide detailed description of the issue..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newMaintenance.priority}
                  onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMaintenance}
                className="flex-1 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold transition"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Send Message</h3>
              <button onClick={() => setShowMessageModal(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select
                  value={newMessage.to}
                  onChange={(e) => setNewMessage({...newMessage, to: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                >
                  <option value="Property Manager">Property Manager</option>
                  <option value="Landlord">Landlord</option>
                  <option value="Maintenance Team">Maintenance Team</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                  placeholder="Message subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
                  placeholder="Type your message here..."
                  rows={5}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="flex-1 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;