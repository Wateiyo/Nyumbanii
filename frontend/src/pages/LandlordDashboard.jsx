import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  DollarSign, 
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
  Square
} from 'lucide-react';

const LandlordDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedViewing, setSelectedViewing] = useState(null);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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
    revenue: ''
  });
  
  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    phone: '',
    property: '',
    unit: '',
    rent: '',
    leaseStart: '',
    leaseEnd: ''
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
    method: ''
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
  
  const [properties, setProperties] = useState([
    { id: 1, name: 'Sunset Apartments', location: 'Westlands, Nairobi', units: 12, occupied: 10, revenue: 120000 },
    { id: 2, name: 'Garden View', location: 'Kilimani, Nairobi', units: 8, occupied: 8, revenue: 96000 },
    { id: 3, name: 'Riverside Towers', location: 'Parklands, Nairobi', units: 16, occupied: 14, revenue: 168000 },
  ]);

  const [tenants, setTenants] = useState([
    { id: 1, name: 'John Doe', email: 'john@email.com', phone: '+254 712 345 678', property: 'Sunset Apartments', unit: '4A', rent: 45000, leaseStart: '2024-01-15', leaseEnd: '2025-01-14', status: 'active', lastPayment: '2025-10-01' },
    { id: 2, name: 'Jane Smith', email: 'jane@email.com', phone: '+254 723 456 789', property: 'Garden View', unit: '2B', rent: 38000, leaseStart: '2024-03-01', leaseEnd: '2025-02-28', status: 'active', lastPayment: '2025-10-01' },
    { id: 3, name: 'Peter Kamau', email: 'peter@email.com', phone: '+254 734 567 890', property: 'Riverside Towers', unit: '8C', rent: 52000, leaseStart: '2024-06-01', leaseEnd: '2025-05-31', status: 'active', lastPayment: '2025-09-28' },
    { id: 4, name: 'Grace Njeri', email: 'grace@email.com', phone: '+254 745 678 901', property: 'Sunset Apartments', unit: '2A', rent: 42000, leaseStart: '2023-11-01', leaseEnd: '2024-10-31', status: 'active', lastPayment: '2025-10-02' }
  ]);

  const [payments, setPayments] = useState([
    { id: 1, tenant: 'John Doe', property: 'Sunset Apartments', unit: '4A', amount: 45000, dueDate: '2025-10-01', paidDate: '2025-10-01', status: 'paid', method: 'M-Pesa' },
    { id: 2, tenant: 'Jane Smith', property: 'Garden View', unit: '2B', amount: 38000, dueDate: '2025-10-01', paidDate: null, status: 'overdue', method: null },
    { id: 3, tenant: 'Peter Kamau', property: 'Riverside Towers', unit: '8C', amount: 52000, dueDate: '2025-10-01', paidDate: '2025-09-28', status: 'paid', method: 'Bank Transfer' },
    { id: 4, tenant: 'Grace Njeri', property: 'Sunset Apartments', unit: '2A', amount: 42000, dueDate: '2025-10-01', paidDate: '2025-10-02', status: 'paid', method: 'M-Pesa' }
  ]);

  const [viewingBookings, setViewingBookings] = useState([
    { id: 1, prospectName: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+254 734 567 890', property: 'Sunset Apartments', date: '2025-10-07', time: '10:00', status: 'pending', notes: 'Interested in 2-bedroom unit', bookedAt: '2025-10-03 14:30' },
    { id: 2, prospectName: 'Michael Ochieng', email: 'mochieng@email.com', phone: '+254 745 678 901', property: 'Sunset Apartments', date: '2025-10-08', time: '14:00', status: 'confirmed', notes: 'Looking for studio apartment', bookedAt: '2025-10-02 09:15' },
  ]);

  const [maintenanceRequests, setMaintenanceRequests] = useState([
    { id: 1, property: 'Sunset Apartments', unit: '2B', issue: 'Leaking faucet', status: 'pending', date: '2025-10-07', scheduledTime: '09:00', priority: 'medium', tenant: 'John Doe' },
    { id: 2, property: 'Garden View', unit: '4A', issue: 'Broken AC', status: 'in-progress', date: '2025-10-08', scheduledTime: '14:00', priority: 'high', tenant: 'Jane Smith' },
    { id: 3, property: 'Riverside Towers', unit: '8C', issue: 'Faulty door lock', status: 'pending', date: '2025-10-09', scheduledTime: '10:00', priority: 'high', tenant: 'Peter Kamau' },
    { id: 4, property: 'Sunset Apartments', unit: '5D', issue: 'Water heater not working', status: 'completed', date: '2025-10-02', scheduledTime: '11:00', priority: 'medium', tenant: 'Grace Njeri' }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New viewing request from Sarah Johnson', time: '1 hour ago', read: false, type: 'viewing' },
    { id: 2, message: 'Maintenance request completed for Unit 5D', time: '3 hours ago', read: false, type: 'maintenance' }
  ]);

  const [memos, setMemos] = useState([
    { id: 1, title: 'Water Maintenance Notice', message: 'Water will be shut off on Sunday, October 13th from 8 AM to 2 PM for routine maintenance. Please plan accordingly.', priority: 'high', targetAudience: 'all', sentBy: 'Tom Doe', sentAt: '2025-10-04 10:30', recipients: 18 },
    { id: 2, title: 'Rent Payment Reminder', message: 'Friendly reminder that rent for October is due by the 5th. Please ensure timely payment to avoid late fees.', priority: 'normal', targetAudience: 'all', sentBy: 'Tom Doe', sentAt: '2025-10-01 09:00', recipients: 18 }
  ]);

  const [listings, setListings] = useState([
    { 
      id: 1, 
      property: 'Sunset Apartments', 
      unit: '3B',
      bedrooms: 2, 
      bathrooms: 2, 
      area: 85, 
      rent: 45000,
      deposit: 45000,
      description: 'Beautiful 2-bedroom apartment with modern finishes and great natural light.',
      amenities: ['Parking', 'Security', 'Water', 'Backup Generator'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=800'
      ],
      status: 'available',
      postedDate: '2025-10-01'
    },
    { 
      id: 2, 
      property: 'Garden View', 
      unit: '5A',
      bedrooms: 3, 
      bathrooms: 2, 
      area: 110, 
      rent: 52000,
      deposit: 52000,
      description: 'Spacious 3-bedroom unit with garden view and modern kitchen.',
      amenities: ['Gym', 'Swimming Pool', 'Parking', 'Security'],
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800'
      ],
      status: 'available',
      postedDate: '2025-09-28'
    }
  ]);

  const [profileSettings, setProfileSettings] = useState({
    name: 'Tom Doe',
    email: 'tom@nyumbanii.co.ke',
    phone: '+254 712 345 678',
    company: 'Doe Properties Ltd',
    address: 'Westlands, Nairobi',
    notifications: {
      email: true,
      sms: true,
      push: true,
      paymentAlerts: true,
      maintenanceAlerts: true,
      viewingAlerts: true
    }
  });

  const stats = [
    { label: 'Total Properties', value: properties.length, icon: Home, color: 'bg-blue-100 text-blue-900' },
    { label: 'Active Tenants', value: tenants.filter(t => t.status === 'active').length, icon: Users, color: 'bg-green-100 text-green-900' },
    { label: 'Monthly Revenue', value: `KES ${Math.round(properties.reduce((sum, p) => sum + p.revenue, 0) / 1000)}K`, icon: DollarSign, color: 'bg-purple-100 text-purple-900' },
    { label: 'Pending Viewings', value: viewingBookings.filter(v => v.status === 'pending').length, icon: CalendarCheck, color: 'bg-orange-100 text-orange-900' }
  ];

  const handleUpdateViewingStatus = (id, status) => {
    setViewingBookings(viewingBookings.map(booking => 
      booking.id === id ? { ...booking, status } : booking
    ));
    if (status === 'confirmed') {
      alert('Viewing confirmed! Notification sent to prospect.');
    }
  };

  const calendarEvents = [
    ...viewingBookings.map(v => ({ id: `viewing-${v.id}`, title: `Viewing: ${v.prospectName}`, date: v.date, time: v.time, type: 'viewing', details: v })),
    ...maintenanceRequests.filter(m => m.status !== 'completed').map(m => ({ id: `maintenance-${m.id}`, title: `Maintenance: ${m.issue}`, date: m.date, time: m.scheduledTime, type: 'maintenance', details: m }))
  ];

  const getDaysInMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek, month, year };
  };

  const getEventsForDate = (day) => {
    const { month, year } = getDaysInMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter(event => event.date === dateStr);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const handleSendMemo = () => {
    if (newMemo.title && newMemo.message) {
      const memo = {
        id: memos.length + 1,
        title: newMemo.title,
        message: newMemo.message,
        priority: newMemo.priority,
        targetAudience: newMemo.targetAudience,
        sentBy: profileSettings.name,
        sentAt: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
        recipients: newMemo.targetAudience === 'all' ? tenants.length : properties.find(p => p.name === newMemo.targetAudience)?.occupied || 0
      };
      setMemos([memo, ...memos]);
      setNewMemo({ title: '', message: '', priority: 'normal', targetAudience: 'all' });
      setShowMemoModal(false);
      alert('Memo sent successfully to all recipients!');
    }
  };

  const handleDeleteMemo = (id) => {
    if (window.confirm('Are you sure you want to delete this memo?')) {
      setMemos(memos.filter(m => m.id !== id));
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

  const handleAddProperty = () => {
    if (newProperty.name && newProperty.location && newProperty.units) {
      const property = {
        id: properties.length + 1,
        name: newProperty.name,
        location: newProperty.location,
        units: parseInt(newProperty.units),
        occupied: parseInt(newProperty.occupied) || 0,
        revenue: parseInt(newProperty.revenue) || 0
      };
      setProperties([...properties, property]);
      setNewProperty({ name: '', location: '', units: '', occupied: '', revenue: '' });
      setShowPropertyModal(false);
      alert('Property added successfully!');
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleDeleteProperty = (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      setProperties(properties.filter(p => p.id !== id));
      alert('Property deleted successfully!');
    }
  };

  const handleAddTenant = () => {
    if (newTenant.name && newTenant.email && newTenant.property && newTenant.unit && newTenant.rent) {
      const tenant = {
        id: tenants.length + 1,
        ...newTenant,
        rent: parseInt(newTenant.rent),
        status: 'active',
        lastPayment: null
      };
      setTenants([...tenants, tenant]);
      setNewTenant({ name: '', email: '', phone: '', property: '', unit: '', rent: '', leaseStart: '', leaseEnd: '' });
      setShowTenantModal(false);
      alert('Tenant added successfully!');
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleAddMaintenance = () => {
    if (newMaintenance.property && newMaintenance.unit && newMaintenance.issue && newMaintenance.tenant) {
      const request = {
        id: maintenanceRequests.length + 1,
        ...newMaintenance,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00'
      };
      setMaintenanceRequests([...maintenanceRequests, request]);
      setNewMaintenance({ property: '', unit: '', issue: '', priority: 'medium', tenant: '' });
      setShowMaintenanceModal(false);
      alert('Maintenance request added successfully!');
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleAddPayment = () => {
    if (newPayment.tenant && newPayment.amount && newPayment.dueDate) {
      const payment = {
        id: payments.length + 1,
        tenant: newPayment.tenant,
        property: newPayment.property,
        unit: newPayment.unit,
        amount: parseInt(newPayment.amount),
        dueDate: newPayment.dueDate,
        paidDate: null,
        status: 'pending',
        method: newPayment.method || null
      };
      setPayments([...payments, payment]);
      setNewPayment({ tenant: '', property: '', unit: '', amount: '', dueDate: '', method: '' });
      setShowPaymentModal(false);
      alert('Payment record added successfully!');
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleAddListing = () => {
    if (newListing.property && newListing.unit && newListing.bedrooms && newListing.rent) {
      const listing = {
        id: listings.length + 1,
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
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
        ],
        status: 'available',
        postedDate: new Date().toISOString().split('T')[0]
      };
      setListings([...listings, listing]);
      setNewListing({ property: '', unit: '', bedrooms: '', bathrooms: '', area: '', rent: '', deposit: '', description: '', amenities: '', images: [] });
      setShowListingModal(false);
      alert('Listing published successfully!');
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleDeleteListing = (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      setListings(listings.filter(l => l.id !== id));
      alert('Listing deleted successfully!');
    }
  };

  const handleImageUrlAdd = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setNewListing({...newListing, images: [...newListing.images, url]});
    }
  };

  const handleRemoveImage = (index) => {
    setNewListing({...newListing, images: newListing.images.filter((_, i) => i !== index)});
  };

  const handleRecordPayment = (paymentId) => {
    const today = new Date().toISOString().split('T')[0];
    setPayments(payments.map(payment => 
      payment.id === paymentId ? { ...payment, status: 'paid', paidDate: today, method: payment.method || 'M-Pesa' } : payment
    ));
    alert('Payment recorded successfully!');
  };

  const handleUpdateMaintenanceStatus = (id, status) => {
    setMaintenanceRequests(maintenanceRequests.map(req => 
      req.id === id ? { ...req, status } : req
    ));
    alert(`Maintenance request ${status === 'in-progress' ? 'started' : 'marked as ' + status}!`);
  };

  const paymentStats = {
    expected: payments.reduce((sum, p) => sum + p.amount, 0),
    received: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#003366] text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
            <svg width="40" height="40" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="#ffffff"/>
              <g transform="translate(50, 50)">
                <path d="M -12 -5 L 0 -15 L 12 -5 L 12 0 L 10 0 L 0 -8 L -10 0 L -12 0 Z" fill="#003366"/>
                <rect x="-10" y="0" width="20" height="15" fill="#003366" rx="1"/>
                <rect x="-3" y="6" width="6" height="9" fill="white" rx="0.5"/>
                <rect x="-8" y="3" width="3" height="3" fill="white" rx="0.3"/>
                <rect x="5" y="3" width="3" height="3" fill="white" rx="0.3"/>
              </g>
            </svg>
            {sidebarOpen && <span className="text-xl font-bold">Nyumbanii</span>}
          </a>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {['dashboard', 'properties', 'listings', 'viewings', 'calendar', 'maintenance', 'tenants', 'payments', 'memos', 'settings'].map((view) => {
            const icons = { 
              dashboard: Home, 
              properties: Building, 
              listings: Eye,
              viewings: CalendarCheck, 
              calendar: Calendar, 
              maintenance: Wrench, 
              tenants: Users, 
              payments: DollarSign, 
              memos: Mail, 
              settings: Settings 
            };
            const Icon = icons[view];
            const labels = {
              listings: 'Browse Listings',
              memos: 'Updates & Memos'
            };
            return (
              <button key={view} onClick={() => setCurrentView(view)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === view ? 'bg-[#002244]' : 'hover:bg-[#002244]'}`}>
                <Icon className="w-5 h-5" />
                {sidebarOpen && <span className="capitalize">{labels[view] || view}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#002244]">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#002244] transition text-red-300">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{currentView}</h1>
              <p className="text-gray-600">Welcome back, {profileSettings.name.split(' ')[0]}!</p>
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

        <div className="p-6 flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Viewings</h2>
                  <div className="space-y-3">
                    {viewingBookings.slice(0, 3).map((viewing) => (
                      <div key={viewing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{viewing.prospectName}</p>
                          <p className="text-sm text-gray-600">{viewing.property}</p>
                          <p className="text-xs text-gray-500">{viewing.date} at {viewing.time}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${viewing.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {viewing.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Maintenance Overview</h2>
                  <div className="space-y-3">
                    {maintenanceRequests.filter(r => r.status !== 'completed').slice(0, 3).map(request => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{request.property} - {request.unit}</p>
                          <p className="text-sm text-gray-600">{request.issue}</p>
                          <p className="text-xs text-gray-500">{request.date} at {request.scheduledTime}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {currentView === 'viewings' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Property Viewing Bookings</h2>
                <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition">
                  <Download className="w-5 h-5" />Export
                </button>
              </div>

              <div className="grid gap-4">
                {viewingBookings.map(viewing => (
                  <div key={viewing.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold">
                          {viewing.prospectName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{viewing.prospectName}</h3>
                          <p className="text-gray-600">{viewing.property}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1"><Mail className="w-4 h-4" />{viewing.email}</div>
                            <div className="flex items-center gap-1"><Phone className="w-4 h-4" />{viewing.phone}</div>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        viewing.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        viewing.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        viewing.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {viewing.status}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Scheduled Date & Time</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#003366]" />
                          <p className="font-semibold text-gray-900">{viewing.date} at {viewing.time}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Booked At</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#003366]" />
                          <p className="text-gray-700">{viewing.bookedAt}</p>
                        </div>
                      </div>
                    </div>

                    {viewing.notes && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Notes:</p>
                        <p className="text-gray-900">{viewing.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {viewing.status === 'pending' && (
                        <>
                          <button onClick={() => handleUpdateViewingStatus(viewing.id, 'confirmed')} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
                            <CheckCircle className="w-4 h-4" />Confirm
                          </button>
                          <button onClick={() => handleUpdateViewingStatus(viewing.id, 'cancelled')} className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition">
                            <X className="w-4 h-4" />Cancel
                          </button>
                        </>
                      )}
                      {viewing.status === 'confirmed' && (
                        <button onClick={() => handleUpdateViewingStatus(viewing.id, 'completed')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
                          <CheckCircle className="w-4 h-4" />Mark Completed
                        </button>
                      )}
                      <button onClick={() => setSelectedViewing(viewing)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition">
                        <Eye className="w-4 h-4" />View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'listings' && (
                      <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">Property Listings</h2>
                            <p className="text-sm text-gray-600">Manage your available units for rent</p>
                          </div>
                          <button onClick={() => setShowListingModal(true)} className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition">
                            <Plus className="w-5 h-5" />Add Listing
                          </button>
                        </div>
          
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {listings.map(listing => (
                            <div key={listing.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition">
                              <div className="relative h-48 bg-gray-200">
                                {listing.images && listing.images.length > 0 ? (
                                  <img src={listing.images[0]} alt={`${listing.property} - ${listing.unit}`} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                    <Home className="w-16 h-16 text-[#003366] opacity-50" />
                                  </div>
                                )}
                                <div className="absolute top-3 right-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${listing.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {listing.status}
                                  </span>
                                </div>
                              </div>
                              <div className="p-5">
                                <h3 className="font-bold text-gray-900 text-lg mb-1">{listing.property}</h3>
                                <p className="text-sm text-gray-600 mb-3">Unit {listing.unit}</p>
                                
                                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Bed className="w-4 h-4" /><span>{listing.bedrooms} bed</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Bath className="w-4 h-4" /><span>{listing.bathrooms} bath</span>
                                  </div>
                                  {listing.area > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Square className="w-4 h-4" /><span>{listing.area} m²</span>
                                    </div>
                                  )}
                                </div>
          
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {listing.amenities.slice(0, 3).map((amenity, idx) => (
                                    <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{amenity}</span>
                                  ))}
                                  {listing.amenities.length > 3 && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">+{listing.amenities.length - 3} more</span>
                                  )}
                                </div>
          
                                <div className="mb-4">
                                  <p className="text-sm text-gray-600">Monthly Rent</p>
                                  <p className="text-2xl font-bold text-[#003366]">KES {listing.rent.toLocaleString()}</p>
                                </div>
          
                                <div className="flex gap-2">
                                  <button onClick={() => { setSelectedListing(listing); setCurrentImageIndex(0); }} className="flex-1 px-3 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition text-sm">
                                    View Details
                                  </button>
                                  <button onClick={() => handleDeleteListing(listing.id)} className="p-2 border border-red-600 text-red-600 hover:bg-red-50 rounded-lg transition">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
          
                        {listings.length === 0 && (
                          <div className="text-center py-12">
                            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No listings yet. Create your first listing to attract tenants!</p>
                            <button onClick={() => setShowListingModal(true)} className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-6 py-3 rounded-lg font-semibold transition">
                              <Plus className="w-5 h-5" />Add Your First Listing
                            </button>
                          </div>
                        )}
                      </div>
                    )}
          

          {currentView === 'calendar' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Schedule Calendar</h2>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Viewings</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span>Maintenance</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">{day}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7">
                  {(() => {
                    const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
                    const cells = [];
                    
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      cells.push(<div key={`empty-${i}`} className="min-h-24 p-2 border-r border-b border-gray-200 bg-gray-50"></div>);
                    }
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      const events = getEventsForDate(day);
                      const today = new Date().getDate();
                      const isToday = day === today;
                      
                      cells.push(
                        <div key={day} className={`min-h-24 p-2 border-r border-b border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
                          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-900' : 'text-gray-700'}`}>{day}</div>
                          <div className="space-y-1">
                            {events.map(event => (
                              <div key={event.id} className={`text-xs p-1 rounded ${event.type === 'viewing' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                <div className="font-medium truncate">{event.time}</div>
                                <div className="truncate">{event.title}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    return cells;
                  })()}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                <div className="space-y-3">
                  {calendarEvents.slice(0, 5).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${event.type === 'viewing' ? 'bg-blue-100 text-blue-900' : 'bg-orange-100 text-orange-900'}`}>
                          {event.type === 'viewing' ? <Eye className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${event.type === 'viewing' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                        {event.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'properties' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Your Properties</h2>
                <button onClick={() => setShowPropertyModal(true)} className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition">
                  <Building className="w-5 h-5" />Add Property
                </button>
              </div>

              <div className="grid gap-4">
                {properties.map(property => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{property.name}</h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />{property.location}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteProperty(property.id)} className="p-2 hover:bg-red-50 rounded-lg transition text-red-600">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Units</p>
                        <p className="text-2xl font-bold text-gray-900">{property.units}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Occupied</p>
                        <p className="text-2xl font-bold text-green-600">{property.occupied}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Vacant</p>
                        <p className="text-2xl font-bold text-orange-600">{property.units - property.occupied}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-[#003366]">KES {(property.revenue / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">View Units</button>
                      <button className="px-4 py-2 border-2 border-[#003366] text-[#003366] hover:bg-blue-50 rounded-lg font-semibold transition">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'maintenance' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Maintenance Requests</h2>
                <button onClick={() => setShowMaintenanceModal(true)} className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition">
                  <Wrench className="w-5 h-5" />Add Request
                </button>
              </div>

              <div className="grid gap-4">
                {maintenanceRequests.map(request => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{request.issue}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.priority === 'high' ? 'bg-red-100 text-red-800' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>{request.priority}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1"><Building className="w-4 h-4" />{request.property} - Unit {request.unit}</div>
                          <div className="flex items-center gap-1"><Users className="w-4 h-4" />{request.tenant}</div>
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{request.date} at {request.scheduledTime}</div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{request.status}</span>
                    </div>

                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <button onClick={() => handleUpdateMaintenanceStatus(request.id, 'in-progress')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">Start Work</button>
                      )}
                      {request.status === 'in-progress' && (
                        <button onClick={() => handleUpdateMaintenanceStatus(request.id, 'completed')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">Mark Complete</button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Contact Tenant</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'tenants' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Tenant Directory</h2>
                <button onClick={() => setShowTenantModal(true)} className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition">
                  <Users className="w-5 h-5" />Add Tenant
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {tenants.map(tenant => (
                  <div key={tenant.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold">
                        {tenant.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{tenant.name}</h3>
                        <p className="text-sm text-gray-600">{tenant.property} - Unit {tenant.unit}</p>
                        <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-sm text-gray-700"><Mail className="w-4 h-4 mr-2 text-[#003366]" />{tenant.email}</div>
                      <div className="flex items-center text-sm text-gray-700"><Phone className="w-4 h-4 mr-2 text-[#003366]" />{tenant.phone}</div>
                      <div className="flex items-center text-sm text-gray-700"><DollarSign className="w-4 h-4 mr-2 text-[#003366]" />KES {tenant.rent.toLocaleString()}/month</div>
                      <div className="flex items-center text-sm text-gray-700"><Calendar className="w-4 h-4 mr-2 text-[#003366]" />Lease: {tenant.leaseStart} to {tenant.leaseEnd}</div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition text-sm">View Details</button>
                      <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition text-sm">Message</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'payments' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm mb-1">Total Expected</p>
                  <p className="text-2xl font-bold text-gray-900">KES {(paymentStats.expected / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm mb-1">Received</p>
                  <p className="text-2xl font-bold text-green-600">KES {(paymentStats.received / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">KES {(paymentStats.pending / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <p className="text-gray-600 text-sm mb-1">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">KES {(paymentStats.overdue / 1000).toFixed(0)}K</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Payment Tracking</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition">
                      <DollarSign className="w-5 h-5" />Record Payment
                    </button>
                    <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition">
                      <Download className="w-5 h-5" />Export
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Tenant</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Property/Unit</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Amount</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Due Date</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4 font-semibold text-gray-900">{payment.tenant}</td>
                          <td className="p-4 text-gray-600">{payment.property} - {payment.unit}</td>
                          <td className="p-4 text-gray-900 font-semibold">KES {payment.amount.toLocaleString()}</td>
                          <td className="p-4 text-gray-600">{payment.dueDate}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>{payment.status}</span>
                          </td>
                          <td className="p-4">
                            {payment.status === 'paid' ? (
                              <span className="text-sm text-gray-500">Paid on {payment.paidDate}</span>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => handleRecordPayment(payment.id)} className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition" title="Record Payment">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition" title="Send Reminder">
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
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

          {currentView === 'memos' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Updates & Memos</h2>
                  <p className="text-sm text-gray-600">Broadcast messages to your tenants</p>
                </div>
                <button onClick={() => setShowMemoModal(true)} className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition">
                  <Mail className="w-5 h-5" />New Memo
                </button>
              </div>

              <div className="grid gap-4">
                {memos.map(memo => (
                  <div key={memo.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{memo.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            memo.priority === 'high' ? 'bg-red-100 text-red-800' :
                            memo.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>{memo.priority}</span>
                        </div>
                        <p className="text-gray-700 mb-3">{memo.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>{memo.recipients} recipients</span></div>
                          <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>Sent: {memo.sentAt}</span></div>
                          <div className="flex items-center gap-1"><Building className="w-4 h-4" /><span>{memo.targetAudience === 'all' ? 'All Properties' : memo.targetAudience}</span></div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteMemo(memo.id)} className="p-2 hover:bg-red-50 rounded-lg transition text-red-600">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="max-w-4xl space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input type="text" value={profileSettings.company} onChange={(e) => setProfileSettings({...profileSettings, company: e.target.value})} disabled={!editingProfile} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" value={profileSettings.address} onChange={(e) => setProfileSettings({...profileSettings, address: e.target.value})} disabled={!editingProfile} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
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
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive updates via email</p>
                    </div>
                    <button onClick={() => handleUpdateNotifications('email')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileSettings.notifications.email ? 'bg-[#003366]' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profileSettings.notifications.email ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
                      <p className="text-sm text-gray-600">Receive updates via text message</p>
                    </div>
                    <button onClick={() => handleUpdateNotifications('sms')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileSettings.notifications.sms ? 'bg-[#003366]' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profileSettings.notifications.sms ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                      <p className="text-sm text-gray-600">Receive browser push notifications</p>
                    </div>
                    <button onClick={() => handleUpdateNotifications('push')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileSettings.notifications.push ? 'bg-[#003366]' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profileSettings.notifications.push ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Alert Types</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Payment Alerts</span>
                        <button onClick={() => handleUpdateNotifications('paymentAlerts')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileSettings.notifications.paymentAlerts ? 'bg-[#003366]' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profileSettings.notifications.paymentAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Maintenance Requests</span>
                        <button onClick={() => handleUpdateNotifications('maintenanceAlerts')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileSettings.notifications.maintenanceAlerts ? 'bg-[#003366]' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profileSettings.notifications.maintenanceAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Viewing Bookings</span>
                        <button onClick={() => handleUpdateNotifications('viewingAlerts')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileSettings.notifications.viewingAlerts ? 'bg-[#003366]' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profileSettings.notifications.viewingAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-200">
                <h2 className="text-xl font-bold text-red-600 mb-6">Danger Zone</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <h3 className="font-semibold text-gray-900">Deactivate Account</h3>
                      <p className="text-sm text-gray-600">Temporarily disable your account</p>
                    </div>
                    <button className="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition">Deactivate</button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <h3 className="font-semibold text-gray-900">Delete Account</h3>
                      <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                    </div>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">Delete Account</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showMemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Send New Memo</h3>
              <button onClick={() => setShowMemoModal(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Memo Title</label>
                <input type="text" value={newMemo.title} onChange={(e) => setNewMemo({...newMemo, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., Water Maintenance Notice" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={newMemo.message} onChange={(e) => setNewMemo({...newMemo, message: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="Enter your message to tenants..." rows={6} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={newMemo.priority} onChange={(e) => setNewMemo({...newMemo, priority: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select value={newMemo.targetAudience} onChange={(e) => setNewMemo({...newMemo, targetAudience: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                    <option value="all">All Tenants</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name} ({prop.occupied} tenants)</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900"><strong>Note:</strong> This memo will be sent to {newMemo.targetAudience === 'all' ? `all ${tenants.length} tenants` : `${properties.find(p => p.name === newMemo.targetAudience)?.occupied || 0} tenants at ${newMemo.targetAudience}`} via email and will appear in their tenant dashboard.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowMemoModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
              <button onClick={handleSendMemo} className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />Send Memo
              </button>
            </div>
          </div>
        </div>
      )}

      {showTenantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Tenant</h3>
              <button onClick={() => setShowTenantModal(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={newTenant.name} onChange={(e) => setNewTenant({...newTenant, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={newTenant.email} onChange={(e) => setNewTenant({...newTenant, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="john@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={newTenant.phone} onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="+254 712 345 678" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                  <select value={newTenant.property} onChange={(e) => setNewTenant({...newTenant, property: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                    <option value="">Select Property</option>
                    {properties.map(prop => (<option key={prop.id} value={prop.name}>{prop.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                  <input type="text" value={newTenant.unit} onChange={(e) => setNewTenant({...newTenant, unit: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., 4A" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (KES) *</label>
                <input type="number" value={newTenant.rent} onChange={(e) => setNewTenant({...newTenant, rent: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., 45000" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start Date</label>
                  <input type="date" value={newTenant.leaseStart} onChange={(e) => setNewTenant({...newTenant, leaseStart: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease End Date</label>
                  <input type="date" value={newTenant.leaseEnd} onChange={(e) => setNewTenant({...newTenant, leaseEnd: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTenantModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
              <button onClick={handleAddTenant} className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">Add Tenant</button>
            </div>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Maintenance Request</h3>
              <button onClick={() => setShowMaintenanceModal(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                <select value={newMaintenance.property} onChange={(e) => setNewMaintenance({...newMaintenance, property: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                  <option value="">Select Property</option>
                  {properties.map(prop => (<option key={prop.id} value={prop.name}>{prop.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                <input type="text" value={newMaintenance.unit} onChange={(e) => setNewMaintenance({...newMaintenance, unit: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., 2B" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name *</label>
                <select value={newMaintenance.tenant} onChange={(e) => setNewMaintenance({...newMaintenance, tenant: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                  <option value="">Select Tenant</option>
                  {tenants.map(tenant => (<option key={tenant.id} value={tenant.name}>{tenant.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description *</label>
                <textarea value={newMaintenance.issue} onChange={(e) => setNewMaintenance({...newMaintenance, issue: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="Describe the maintenance issue..." rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={newMaintenance.priority} onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowMaintenanceModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
              <button onClick={handleAddMaintenance} className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">Add Request</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
                <select value={newPayment.tenant} onChange={(e) => {
                  const tenant = tenants.find(t => t.name === e.target.value);
                  if (tenant) {
                    setNewPayment({...newPayment, tenant: tenant.name, property: tenant.property, unit: tenant.unit, amount: tenant.rent.toString()});
                  }
                }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                  <option value="">Select Tenant</option>
                  {tenants.map(tenant => (<option key={tenant.id} value={tenant.name}>{tenant.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property/Unit</label>
                <input type="text" value={newPayment.property && newPayment.unit ? `${newPayment.property} - ${newPayment.unit}` : ''} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" placeholder="Auto-filled from tenant" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                <input type="number" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., 45000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input type="date" value={newPayment.dueDate} onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={newPayment.method} onChange={(e) => setNewPayment({...newPayment, method: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                  <option value="">Not specified</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
              <button onClick={handleAddPayment} className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">Add Payment</button>
            </div>
          </div>
        </div>
      )}

      {showPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Property</h3>
              <button onClick={() => setShowPropertyModal(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
                <input type="text" value={newProperty.name} onChange={(e) => setNewProperty({...newProperty, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., Sunset Apartments" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input type="text" value={newProperty.location} onChange={(e) => setNewProperty({...newProperty, location: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., Westlands, Nairobi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Units *</label>
                <input type="number" value={newProperty.units} onChange={(e) => setNewProperty({...newProperty, units: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., 12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupied Units</label>
                <input type="number" value={newProperty.occupied} onChange={(e) => setNewProperty({...newProperty, occupied: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., 10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue (KES)</label>
                <input type="number" value={newProperty.revenue} onChange={(e) => setNewProperty({...newProperty, revenue: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., 120000" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPropertyModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
              <button onClick={handleAddProperty} className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">Add Property</button>
            </div>
          </div>
        </div>
      )}
      
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
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

      {selectedViewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Viewing Details</h3>
              <button onClick={() => setSelectedViewing(null)}><X className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <div className="w-16 h-16 bg-[#003366] rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {selectedViewing.prospectName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{selectedViewing.prospectName}</h4>
                <p className="text-gray-600">{selectedViewing.property}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Contact Information</h5>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700"><Mail className="w-5 h-5 mr-2 text-[#003366]" />{selectedViewing.email}</div>
                  <div className="flex items-center text-gray-700"><Phone className="w-5 h-5 mr-2 text-[#003366]" />{selectedViewing.phone}</div>
                </div>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Appointment Details</h5>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700"><Calendar className="w-5 h-5 mr-2 text-[#003366]" />{selectedViewing.date} at {selectedViewing.time}</div>
                  <div className="flex items-center text-gray-700"><Clock className="w-5 h-5 mr-2 text-[#003366]" />Booked: {selectedViewing.bookedAt}</div>
                </div>
              </div>
            </div>
            {selectedViewing.notes && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-2">Notes</h5>
                <p className="text-gray-700">{selectedViewing.notes}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">
                <Mail className="w-5 h-5" />Send Message
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">
                <Phone className="w-5 h-5" />Call
              </button>
            </div>
          </div>
        </div>
      )}
      {showListingModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Add New Listing</h3>
                    <button onClick={() => setShowListingModal(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                        <select value={newListing.property} onChange={(e) => setNewListing({...newListing, property: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none">
                          <option value="">Select Property</option>
                          {properties.map(prop => (<option key={prop.id} value={prop.name}>{prop.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                        <input type="text" value={newListing.unit} onChange={(e) => setNewListing({...newListing, unit: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="e.g., 4A" />
                      </div>
                    </div>
      
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms *</label>
                        <input type="number" value={newListing.bedrooms} onChange={(e) => setNewListing({...newListing, bedrooms: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                        <input type="number" value={newListing.bathrooms} onChange={(e) => setNewListing({...newListing, bathrooms: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
                        <input type="number" value={newListing.area} onChange={(e) => setNewListing({...newListing, area: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="85" />
                      </div>
                    </div>
      
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (KES) *</label>
                        <input type="number" value={newListing.rent} onChange={(e) => setNewListing({...newListing, rent: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="45000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (KES)</label>
                        <input type="number" value={newListing.deposit} onChange={(e) => setNewListing({...newListing, deposit: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="45000" />
                      </div>
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={newListing.description} onChange={(e) => setNewListing({...newListing, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="Describe the unit features and highlights..." rows={3} />
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
                      <input type="text" value={newListing.amenities} onChange={(e) => setNewListing({...newListing, amenities: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none" placeholder="Parking, Security, Water, Backup Generator" />
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                      <div className="space-y-2">
                        {newListing.images.map((img, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <img src={img} alt={`Preview ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                            <p className="flex-1 text-sm text-gray-600 truncate">{img}</p>
                            <button onClick={() => handleRemoveImage(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button onClick={handleImageUrlAdd} className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#003366] hover:bg-blue-50 transition text-gray-600 hover:text-[#003366] font-semibold">
                          + Add Image URL
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowListingModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">Cancel</button>
                    <button onClick={handleAddListing} className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition">Publish Listing</button>
                  </div>
                </div>
              </div>
            )}
      
            {selectedListing && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedListing.property} - Unit {selectedListing.unit}</h3>
                    <button onClick={() => setSelectedListing(null)}><X className="w-6 h-6 text-gray-500" /></button>
                  </div>
      
                  <div className="mb-6">
                    <div className="relative h-96 bg-gray-200 rounded-xl overflow-hidden mb-4">
                      {selectedListing.images && selectedListing.images.length > 0 ? (
                        <>
                          <img src={selectedListing.images[currentImageIndex]} alt={`${selectedListing.property}`} className="w-full h-full object-cover" />
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
      
                    {selectedListing.description && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700">{selectedListing.description}</p>
                      </div>
                    )}
      
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedListing.amenities.map((amenity, idx) => (
                          <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">{amenity}</span>
                        ))}
                      </div>
                    </div>
      
                    <div className="border-t border-gray-200 pt-6">
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-gray-600 mb-1">Monthly Rent</p>
                          <p className="text-4xl font-bold text-[#003366]">KES {selectedListing.rent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Security Deposit</p>
                          <p className="text-2xl font-bold text-gray-900">KES {selectedListing.deposit.toLocaleString()}</p>
                        </div>
                      </div>
      
                      <div className="flex gap-3">
                        <button className="flex-1 px-4 py-3 border-2 border-[#003366] text-[#003366] hover:bg-blue-50 rounded-lg font-semibold transition">Edit Listing</button>
                        <button onClick={() => handleDeleteListing(selectedListing.id)} className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">Delete Listing</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
};

export default LandlordDashboard;