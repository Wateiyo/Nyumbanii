import React, { useState, useEffect } from 'react';
import { auth, storage } from '../firebase';
import { db } from '../firebase';
import MessageModal from './MessageModal';
import { useAuth } from '../contexts/AuthContext';
import { 
  useProperties, 
  useTenants, 
  usePayments, 
  useMaintenanceRequests,
  useNotifications 
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
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  Square, 
  Menu,
  Upload,
  Image as ImageIcon,
  Filter,
  Search
} from 'lucide-react';

const LandlordDashboard = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [tenantFilter, setTenantFilter] = useState('all');
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [viewingFilter, setViewingFilter] = useState('all');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedTenantForMessage, setSelectedTenantForMessage] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({}); 
  
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
    images: []
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
  
  // Use Auth Context and Real-time Hooks
  const { currentUser, userProfile } = useAuth();
  
  // Real-time data with custom hooks
  const { properties, loading: loadingProps } = useProperties(currentUser?.uid);
  const { tenants, loading: loadingTenants } = useTenants(currentUser?.uid);
  const { payments, loading: loadingPayments } = usePayments(currentUser?.uid, 'landlord');
  const { requests: maintenanceRequests, loading: loadingMaintenance } = useMaintenanceRequests(currentUser?.uid, 'landlord');
  // Local state for data not in custom hooks yet
  const [viewingBookings, setViewingBookings] = useState([]);
  const [memos, setMemos] = useState([]);
  const [listings, setListings] = useState([]);
  
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
const displayViewings = viewingBookings.length > 0 ? viewingBookings : mockViewings;

// Mock memos
const mockMemos = [
  {
    id: 'memo1',
    title: 'Water Maintenance Notice',
    message: 'Water will be shut off on Sunday, October 13th from 8 AM to 2 PM for routine maintenance. Please plan accordingly.',
    priority: 'high',
    targetAudience: 'all',
    sentBy: 'Tom Doe',
    sentAt: '2025-10-04T10:30:00',
    recipients: 18,
    landlordId: currentUser?.uid
  },
  {
    id: 'memo2',
    title: 'Rent Payment Reminder',
    message: 'Friendly reminder that rent for October is due by the 5th. Please ensure timely payment to avoid late fees.',
    priority: 'normal',
    targetAudience: 'all',
    sentBy: 'Tom Doe',
    sentAt: '2025-10-01T09:00:00',
    recipients: 18,
    landlordId: currentUser?.uid
  }
];

// Use real or mock memos
const displayMemos = memos.length > 0 ? memos : mockMemos;

// Mock tenants
const mockTenants = [
  {
    id: 'tenant1',
    name: 'John Doe',
    email: 'john@email.com',
    phone: '+254 712 345 678',
    property: 'Sunset Apartments',
    unit: '4A',
    rent: 45000,
    leaseStart: '2024-01-15',
    leaseEnd: '2025-01-14',
    status: 'active'
  },
  {
    id: 'tenant2',
    name: 'Grace Njeri',
    email: 'grace@email.com',
    phone: '+254 745 678 901',
    property: 'Sunset Apartments',
    unit: '2A',
    rent: 42000,
    leaseStart: '2023-11-01',
    leaseEnd: '2024-10-31',
    status: 'active'
  },
  {
    id: 'tenant3',
    name: 'Jane Smith',
    email: 'jane@email.com',
    phone: '+254 723 456 789',
    property: 'Garden View',
    unit: '2B',
    rent: 38000,
    leaseStart: '2024-03-01',
    leaseEnd: '2025-02-28',
    status: 'active'
  },
  {
    id: 'tenant4',
    name: 'Peter Kamau',
    email: 'peter@email.com',
    phone: '+254 734 567 890',
    property: 'Riverside Towers',
    unit: '8C',
    rent: 52000,
    leaseStart: '2024-06-01',
    leaseEnd: '2025-05-31',
    status: 'active'
  }
];

// Use real or mock tenants
const displayTenants = tenants.length > 0 ? tenants : mockTenants;

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
const displayViewingBookings = viewingBookings.length > 0 ? viewingBookings : mockViewingBookings;
const displayCalendarEvents = [...displayViewingBookings.map(v => ({...v, type: 'viewing'})), ...(maintenanceRequests.length > 0 ? maintenanceRequests : mockCalendarMaintenance).map(m => ({...m, type: 'maintenance'}))];
  
  

  const [profileSettings, setProfileSettings] = useState({
    name: userProfile?.displayName || 'Tom Doe',
    email: userProfile?.email || 'tom@nyumbanii.co.ke',
    phone: userProfile?.phone || '+254 712 345 678',
    company: userProfile?.companyName || 'Doe Properties Ltd',
    address: userProfile?.address || 'Westlands, Nairobi',
    notifications: {
      email: true,
      sms: true,
      push: true,
      paymentAlerts: true,
      maintenanceAlerts: true,
      viewingAlerts: true
    }
  });

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

  // Fetch Viewing Bookings (keep this one as-is since it's not in hooks yet)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'viewingBookings'),
      where('landlordId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const viewingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setViewingBookings(viewingsData);
    });

    return unsubscribe;
  }, [currentUser]);

  // Fetch Listings (keep this one as-is)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'listings'),
      where('landlordId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setListings(listingsData);
    });

    return unsubscribe;
  }, [currentUser]);

  // Fetch Memos (keep this one as-is)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'memos'),
      where('landlordId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMemos(memosData);
    });

    return unsubscribe;
  }, [currentUser]);

  // Fetch Team Members (keep this one as-is)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'teamMembers'),
      where('landlordId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeamMembers(teamData);
    });

    return unsubscribe;
  }, [currentUser]);

  // Track unread messages
useEffect(() => {
  if (!currentUser) return;

  const q = query(
    collection(db, 'messages'),
    where('recipientId', '==', currentUser.uid),
    where('read', '==', false)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const unreadCounts = {};
    snapshot.docs.forEach(doc => {
      const message = doc.data();
      unreadCounts[message.senderId] = (unreadCounts[message.senderId] || 0) + 1;
    });
    setUnreadMessages(unreadCounts);
  });

  return unsubscribe;
}, [currentUser]);

  // Image upload handler
  const handleImageUpload = async (files, type = 'property') => {
    if (!files || files.length === 0) return [];
    
    setUploadingImages(true);
    const imageUrls = [];

    try {
      for (const file of Array.from(files)) {
        const storageRef = ref(storage, `${type}Images/${currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images. Please try again.');
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

  // ADD PROPERTY with images
  const handleAddProperty = async () => {
    if (newProperty.name && newProperty.location && newProperty.units) {
      try {
        await addDoc(collection(db, 'properties'), {
          name: newProperty.name,
          location: newProperty.location,
          units: parseInt(newProperty.units),
          occupied: parseInt(newProperty.occupied) || 0,
          revenue: parseInt(newProperty.revenue) || 0,
          images: newProperty.images || [],
          landlordId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        setNewProperty({ name: '', location: '', units: '', occupied: '', revenue: '', images: [] });
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
        images: editingProperty.images || []
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

  // ADD TENANT
  const handleAddTenant = async () => {
    if (newTenant.name && newTenant.email && newTenant.property && newTenant.unit && newTenant.rent) {
      try {
        await addDoc(collection(db, 'tenants'), {
          name: newTenant.name,
          email: newTenant.email,
          phone: newTenant.phone,
          property: newTenant.property,
          unit: newTenant.unit,
          rent: parseInt(newTenant.rent),
          leaseStart: newTenant.leaseStart,
          leaseEnd: newTenant.leaseEnd,
          status: 'active',
          lastPayment: null,
          landlordId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        setNewTenant({ name: '', email: '', phone: '', property: '', unit: '', rent: '', leaseStart: '', leaseEnd: '' });
        setShowTenantModal(false);
        alert('Tenant added successfully!');
      } catch (error) {
        console.error('Error adding tenant:', error);
        alert('Error adding tenant. Please try again.');
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  // ADD PAYMENT
  const handleAddPayment = async () => {
    if (newPayment.tenant && newPayment.amount && newPayment.dueDate) {
      try {
        await addDoc(collection(db, 'payments'), {
          tenant: newPayment.tenant,
          property: newPayment.property,
          unit: newPayment.unit,
          amount: parseInt(newPayment.amount),
          dueDate: newPayment.dueDate,
          paidDate: null,
          status: 'pending',
          method: newPayment.method || null,
          landlordId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        setNewPayment({ tenant: '', property: '', unit: '', amount: '', dueDate: '', method: '' });
        setShowPaymentModal(false);
        alert('Payment record added successfully!');
      } catch (error) {
        console.error('Error adding payment:', error);
        alert('Error adding payment. Please try again.');
      }
    } else {
      alert('Please fill in all required fields');
    }
  };


  // RECORD PAYMENT
  const handleRecordPayment = async (paymentId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const paymentRef = doc(db, 'payments', paymentId);
      
      await updateDoc(paymentRef, {
        status: 'paid',
        paidDate: today,
        method: 'M-Pesa'
      });
      
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment. Please try again.');
    }
  };

  // ADD MAINTENANCE REQUEST
  const handleAddMaintenance = async () => {
    if (newMaintenance.property && newMaintenance.unit && newMaintenance.issue && newMaintenance.tenant) {
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
    } else {
      alert('Please fill in all required fields');
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
        await addDoc(collection(db, 'memos'), {
          title: newMemo.title,
          message: newMemo.message,
          priority: newMemo.priority,
          targetAudience: newMemo.targetAudience,
          sentBy: profileSettings.name,
          sentAt: new Date().toISOString(),
          recipients: newMemo.targetAudience === 'all' ? tenants.length : properties.find(p => p.name === newMemo.targetAudience)?.occupied || 0,
          landlordId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        setNewMemo({ title: '', message: '', priority: 'normal', targetAudience: 'all' });
        setShowMemoModal(false);
        alert('Memo sent successfully to all recipients!');
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
      const viewingRef = doc(db, 'viewingBookings', id);
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

  const markNotificationRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Add team member handler
const handleAddTeamMember = async () => {
  if (!newTeamMember.name || !newTeamMember.email || !newTeamMember.phone) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    await addDoc(collection(db, 'teamMembers'), {
      name: newTeamMember.name,
      email: newTeamMember.email,
      phone: newTeamMember.phone,
      role: newTeamMember.role,
      assignedProperties: newTeamMember.assignedProperties,
      landlordId: currentUser.uid,
      status: 'pending', // pending, active, inactive
      invitedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    alert(`Invitation sent to ${newTeamMember.email}! They will receive an email to create their account.`);
    
    setNewTeamMember({
      name: '',
      email: '',
      phone: '',
      role: 'property_manager',
      assignedProperties: []
    });
    setShowTeamModal(false);
  } catch (error) {
    console.error('Error adding team member:', error);
    alert('Error adding team member. Please try again.');
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
const handleDeleteTeamMember = async (memberId) => {
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
  } catch (error) {
    console.error('Error assigning property:', error);
    alert('Error assigning property. Please try again.');
  }
};
// Handle opening message modal
const handleMessageTenant = (tenant) => {
  setSelectedTenantForMessage(tenant);
  setShowMessageModal(true);
};


  // Stats calculations
  const stats = [
    { 
      label: 'Total Properties', 
      value: properties.length, 
      icon: Home, 
      color: 'bg-blue-100 text-blue-900' 
    },
    { 
      label: 'Active Tenants', 
      value: tenants.filter(t => t.status === 'active').length, 
      icon: Users, 
      color: 'bg-green-100 text-green-900' 
    },
    { 
      label: 'Monthly Revenue', 
      value: `KES ${Math.round(properties.reduce((sum, p) => sum + (p.revenue || 0), 0) / 1000)}K`, 
      icon: DollarSign, 
      color: 'bg-purple-100 text-purple-900' 
    },
    { 
      label: 'Pending Viewings', 
      value: viewingBookings.filter(v => v.status === 'pending').length, 
      icon: CalendarCheck, 
      color: 'bg-orange-100 text-orange-900' 
    }
  ];

  const paymentStats = {
    expected: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    received: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0)
  };


  // Filter viewings
  const filteredViewings = viewingBookings.filter(viewing => {
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#003366] text-white transition-transform duration-300 flex flex-col`}>
        <div className="p-6">
          <div onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
          <Home className="w-8 h-8" />
            <span className="text-xl font-bold">Nyumbanii</span>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {['dashboard', 'properties', 'listings', 'viewings', 'calendar', 'maintenance', 'tenants', 'payments', 'team', 'memos', 'settings'].map((view) => {
            const icons = { 
              dashboard: Home, 
              properties: Building, 
              listings: Eye,
              viewings: CalendarCheck, 
              calendar: Calendar, 
              maintenance: Wrench, 
              tenants: Users, 
              payments: DollarSign,
              team: Users, 
              memos: Mail, 
              settings: Settings 
            };
            const Icon = icons[view];
            const labels = {
              listings: 'Browse Listings',
              memos: 'Updates & Memos',
              team: 'Team Management'
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
                {/* Recent Viewings */}
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
                </div>

                {/* Payment Summary */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#003366]" />
                    Payment Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expected This Month</span>
                      <span className="font-semibold text-gray-900">KES {paymentStats.expected.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Received</span>
                      <span className="font-semibold text-green-600">KES {paymentStats.received.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending</span>
                      <span className="font-semibold text-yellow-600">KES {paymentStats.pending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Overdue</span>
                      <span className="font-semibold text-red-600">KES {paymentStats.overdue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Collection Rate</span>
                      <span className="font-bold text-[#003366]">
                        {paymentStats.expected > 0 ? Math.round((paymentStats.received / paymentStats.expected) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Maintenance Overview */}
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
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowPropertyModal(true)} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-center">
                      <Building className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <span className="text-xs font-medium text-gray-900">Add Property</span>
                    </button>
                    <button onClick={() => setShowTenantModal(true)} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition text-center">
                      <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <span className="text-xs font-medium text-gray-900">Add Tenant</span>
                    </button>
                    <button onClick={() => setShowListingModal(true)} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-center">
                      <Eye className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <span className="text-xs font-medium text-gray-900">Create Listing</span>
                    </button>
                    <button onClick={() => setShowMemoModal(true)} className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition text-center">
                      <Mail className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <span className="text-xs font-medium text-gray-900">Send Memo</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Properties View */}
          {currentView === 'properties' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Properties</h2>
                <button onClick={() => setShowPropertyModal(true)} className="w-full sm:w-auto px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Property
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map(property => (
                  <div key={property.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                    {/* Property Image */}
                    <div className="relative h-48 bg-gray-200">
                      {property.images && property.images.length > 0 ? (
                        <img 
                          src={property.images[0]} 
                          alt={property.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#003366] to-[#002244]">
                          <Building className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                      {property.images && property.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
                          +{property.images.length - 1} photos
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{property.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {property.location}
                          </p>
                        </div>
                        <div className="flex gap-2">
  <button 
    onClick={() => {
      setEditingProperty(property);
      setShowEditPropertyModal(true);
    }}
    className="text-blue-500 hover:text-blue-700"
    title="Edit Property"
  >
    <Settings className="w-5 h-5" />
  </button>
  <button 
    onClick={() => handleDeleteProperty(property.id)} 
    className="text-red-500 hover:text-red-700"
    title="Delete Property"
  >
    <Trash2 className="w-5 h-5" />
  </button>
</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600">Total Units</p>
                          <p className="text-lg font-semibold text-gray-900">{property.units}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Occupied</p>
                          <p className="text-lg font-semibold text-green-600">{property.occupied}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-1">Occupancy Rate</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#003366] h-2 rounded-full transition-all" 
                            style={{ width: `${(property.occupied / property.units) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{Math.round((property.occupied / property.units) * 100)}% occupied</p>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Monthly Revenue</span>
                          <span className="font-semibold text-[#003366]">KES {property.revenue?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

         {/* Listings View */}
{currentView === 'listings' && (
  <>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Property Listings</h2>
        <p className="text-sm text-gray-600">Manage your available units for rent</p>
      </div>
      <button onClick={() => setShowListingModal(true)} className="w-full sm:w-auto px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        Add Listing
      </button>
    </div>
    
    {listings.length === 0 ? (
      <div className="bg-white p-12 rounded-xl shadow-sm text-center">
        <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No listings yet. Create your first listing to attract tenants!</p>
        <button onClick={() => setShowListingModal(true)} className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
          Create First Listing
        </button>
      </div>
    ) : (
      <div className="grid md:grid-cols-2 gap-6">
        {listings.map(listing => (
          <div key={listing.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition">
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
                  <h3 className="font-bold text-gray-900 text-lg">{listing.property}</h3>
                  <p className="text-sm text-gray-600">Unit {listing.unit}</p>
                </div>
                <button 
                  onClick={() => handleDeleteListing(listing.id)} 
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                  title="Delete listing"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              {/* Property Stats */}
              <div className="flex gap-4 mb-4 text-sm text-gray-600">
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
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{listing.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Pricing */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Rent</span>
                  <span className="font-bold text-[#003366] text-lg">KES {listing.rent?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Deposit: KES {listing.deposit?.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">Posted: {listing.postedDate}</span>
                </div>
              </div>
              
              {/* Action Button */}
              <button 
                onClick={() => setSelectedListing(listing)}
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

          {/* Viewings View */}
          {currentView === 'viewings' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Viewing Requests</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewingFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      viewingFilter === 'all' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setViewingFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      viewingFilter === 'pending' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pending
                  </button>
                  <button 
                    onClick={() => setViewingFilter('confirmed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      viewingFilter === 'confirmed' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Confirmed
                  </button>
                </div>
              </div>
              
              <div className="grid gap-4">
                {displayViewings.filter(v => viewingFilter === 'all' || v.status === viewingFilter).map(viewing => (
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
                            viewing.status === 'completed' ? 'bg-blue-100 text-blue-800' :
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
                            <p className="text-xs text-gray-600 mb-1">Viewing Date & Time</p>
                            <p className="font-medium text-gray-900">{viewing.date} at {viewing.time}</p>
                          </div>
                        </div>
                        
                        {viewing.credibilityScore && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-600 mb-2">Credibility Score</p>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    viewing.credibilityScore >= 80 ? 'bg-green-500' :
                                    viewing.credibilityScore >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${viewing.credibilityScore}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-gray-900 text-sm">{viewing.credibilityScore}/100</span>
                            </div>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => setSelectedViewing(viewing)}
                          className="text-[#003366] hover:text-[#002244] text-sm font-medium"
                        >
                          View Full Details →
                        </button>
                      </div>
                      
                      {viewing.status === 'pending' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateViewingStatus(viewing.id, 'confirmed')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
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
                ))}
              </div>
            </>
          )}

          {/* Tenants View */}
          {currentView === 'tenants' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Tenant Directory</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tenants..."
                      value={tenantSearchQuery}
                      onChange={(e) => setTenantSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent w-full"
                    />
                  </div>
                  <select
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="all">All Properties</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name}</option>
                    ))}
                  </select>
                  <button onClick={() => setShowTenantModal(true)} className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition whitespace-nowrap flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Add Tenant
                  </button>
                </div>
              </div>
              
              {/* Group tenants by property */}
              {properties
                .filter(property => {
                  // Filter by selected property if not "all"
                  if (tenantFilter !== 'all' && property.name !== tenantFilter) return false;
                  // Check if property has any tenants matching search
                  const propertyTenants = displayTenants.filter(t => t.property === property.name);
                  if (tenantSearchQuery) {
                    return propertyTenants.some(t => 
                      t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) || 
                      t.email.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                    );
                  }
                  return propertyTenants.length > 0;
                })
                .map(property => {
                  const propertyTenants = displayTenants
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
                        <h3 className="text-lg font-bold text-gray-900">{property.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{property.location}</span>
                          <span className="ml-4 text-[#003366] font-semibold">
                            {propertyTenants.length} {propertyTenants.length === 1 ? 'Tenant' : 'Tenants'}
                          </span>
                        </div>
                      </div>

                      {/* Tenants Grid */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {propertyTenants.map(tenant => (
                          <div key={tenant.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                {tenant.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900">{tenant.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                                    tenant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {tenant.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">Unit {tenant.unit}</p>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{tenant.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span>{tenant.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 flex-shrink-0" />
                                <span className="font-semibold text-gray-900">KES {tenant.rent?.toLocaleString()}/month</span>
                              </div>
                              {tenant.leaseEnd && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 flex-shrink-0" />
                                  <span>Lease: {tenant.leaseStart} to {tenant.leaseEnd}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm">
                                View Details
                              </button>
                              <button 
                                onClick={() => handleMessageTenant(tenant)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm relative">
                                Message
                                 {unreadMessages[tenant.id] > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                 {unreadMessages[tenant.id]}
                                </span>
                                  )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* No results message */}
              {properties.filter(property => {
                const propertyTenants = displayTenants.filter(t => t.property === property.name);
                if (tenantFilter !== 'all' && property.name !== tenantFilter) return false;
                if (tenantSearchQuery) {
                  return propertyTenants.some(t => 
                    t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) || 
                    t.email.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                  );
                }
                return propertyTenants.length > 0;
              }).length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tenants found</p>
                </div>
              )}
            </>
          )}

         {/* Payments View */}
{currentView === 'payments' && (
  <>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 className="text-xl font-bold text-gray-900">Payment Tracking</h2>
      <button onClick={() => setShowPaymentModal(true)} className="w-full sm:w-auto px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
        Record Payment
      </button>
    </div>
    
    {/* Payment Stats Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Expected</p>
        <p className="text-lg sm:text-2xl font-bold text-gray-900">KES {paymentStats.expected.toLocaleString()}</p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <p className="text-xs sm:text-sm text-gray-600 mb-1">Received</p>
        <p className="text-lg sm:text-2xl font-bold text-green-600">KES {paymentStats.received.toLocaleString()}</p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending</p>
        <p className="text-lg sm:text-2xl font-bold text-yellow-600">KES {paymentStats.pending.toLocaleString()}</p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <p className="text-xs sm:text-sm text-gray-600 mb-1">Overdue</p>
        <p className="text-lg sm:text-2xl font-bold text-red-600">KES {paymentStats.overdue.toLocaleString()}</p>
      </div>
    </div>
    
    {/* Mobile-Optimized Payment Cards (Hidden on Desktop) */}
    <div className="lg:hidden space-y-4">
      {payments.map(payment => (
        <div key={payment.id} className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{payment.tenant}</h3>
              <p className="text-sm text-gray-600">{payment.property}</p>
              <p className="text-xs text-gray-500">Unit {payment.unit}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              payment.status === 'paid' ? 'bg-green-100 text-green-800' :
              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {payment.status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500">Amount</p>
              <p className="font-semibold text-gray-900">KES {payment.amount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Due Date</p>
              <p className="font-medium text-gray-700">{payment.dueDate}</p>
            </div>
          </div>
          
          {payment.status === 'pending' && (
            <button 
              onClick={() => handleRecordPayment(payment.id)}
              className="w-full px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm"
            >
              Mark as Paid
            </button>
          )}
          {payment.status === 'paid' && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Paid on {payment.paidDate}</span>
            </div>
          )}
        </div>
      ))}
    </div>
    
    {/* Desktop Table (Hidden on Mobile) */}
    <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map(payment => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{payment.tenant}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{payment.property}</div>
                  <div className="text-xs text-gray-500">Unit {payment.unit}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">KES {payment.amount?.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{payment.dueDate}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {payment.status === 'pending' && (
                    <button 
                      onClick={() => handleRecordPayment(payment.id)}
                      className="text-[#003366] hover:text-[#002244] font-medium"
                    >
                      Mark Paid
                    </button>
                  )}
                  {payment.status === 'paid' && (
                    <button className="text-gray-400 hover:text-gray-600">
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        Add Request
      </button>
    </div>
    
    <div className="grid gap-4">
      {displayMaintenanceRequests.map(request => (
        <div key={request.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{request.issue}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.priority === 'high' ? 'bg-red-100 text-red-800' :
                      request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {request.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {request.property} - Unit {request.unit}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {request.tenant}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {request.date} at {request.scheduledTime}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  request.status === 'completed' ? 'bg-green-100 text-green-800' :
                  request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {request.status}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {request.status === 'pending' && (
                <button 
                  onClick={() => handleUpdateMaintenanceStatus(request.id, 'in-progress')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Start Work
                </button>
              )}
              {request.status === 'in-progress' && (
                <button 
                  onClick={() => handleUpdateMaintenanceStatus(request.id, 'completed')}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
              {request.status === 'completed' && (
                <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </span>
              )}
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                Contact Tenant
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
)}

          {/* Memos View */}
          {currentView === 'memos' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Updates & Memos</h2>
                <button onClick={() => setShowMemoModal(true)} className="w-full sm:w-auto px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Memo
                </button>
              </div>
              
              <div className="grid gap-4">
                {displayMemos.map(memo => (
                  <div key={memo.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{memo.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            memo.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            memo.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {memo.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{memo.message}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>Sent by: {memo.sentBy}</span>
                          <span>Date: {new Date(memo.sentAt).toLocaleDateString()}</span>
                          <span>Recipients: {memo.recipients} tenant{memo.recipients !== 1 ? 's' : ''}</span>
                          <span>Target: {memo.targetAudience === 'all' ? 'All Properties' : memo.targetAudience}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteMemo(memo.id)} className="text-red-500 hover:text-red-700 ml-4">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

         {/* Calendar View */}
{currentView === 'calendar' && (
  <div className="space-y-6">
    {/* Calendar Grid */}
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Schedule Calendar</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Viewings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-600">Maintenance</span>
          </div>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }, (_, i) => {
          const currentDate = new Date(2025, 9, 1); // October 2025
          const firstDay = currentDate.getDay();
          const dayNumber = i - firstDay + 1;
          const isValidDay = dayNumber > 0 && dayNumber <= 31;
          
          // Find events for this day
          const dayEvents = isValidDay ? displayCalendarEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === dayNumber;
          }) : [];

          return (
            <div
              key={i}
              className={`min-h-[80px] p-2 border border-gray-200 rounded-lg ${
                isValidDay ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
              } ${dayNumber === 15 ? 'border-2 border-[#003366]' : ''}`}
            >
              {isValidDay && (
                <>
                  <div className="text-sm font-medium text-gray-900 mb-1">{dayNumber}</div>
                  <div className="space-y-1">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate ${
                          event.type === 'viewing' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}
                        title={event.type === 'viewing' ? `Viewing: ${event.prospectName}` : `Maintenance: ${event.issue}`}
                      >
                        {event.time || event.scheduledTime} {event.type === 'viewing' ? 'Viewing' : 'Maintenance'}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* Upcoming Events List */}
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
      
      <div className="space-y-4">
        {displayCalendarEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming events scheduled</p>
          </div>
        ) : (
          displayCalendarEvents.map(event => (
            <div key={event.id} className={`flex items-center gap-4 p-4 rounded-lg ${event.type === 'viewing' ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <div className="w-16 h-16 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm">
                <span className={`text-xs font-medium ${event.type === 'viewing' ? 'text-blue-600' : 'text-orange-600'}`}>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className={`text-2xl font-bold ${event.type === 'viewing' ? 'text-blue-900' : 'text-orange-900'}`}>
                  {new Date(event.date).getDate()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {event.type === 'viewing' ? 'Property Viewing' : 'Maintenance'}
                </h3>
                <p className="text-sm text-gray-600">
                  {event.type === 'viewing' 
                    ? `${event.prospectName} - ${event.property}` 
                    : `${event.issue} - ${event.property}`}
                </p>
                <p className="text-xs text-gray-500">{event.time || event.scheduledTime}</p>
              </div>
              {event.type === 'viewing' ? (
                <CalendarCheck className="w-6 h-6 text-blue-600" />
              ) : (
                <Wrench className="w-6 h-6 text-orange-600" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}

          {/* Team View */}
{currentView === 'team' && (
  <>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 className="text-xl font-bold text-gray-900">Team Management</h2>
      <button onClick={() => setShowTeamModal(true)} className="w-full sm:w-auto px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center justify-center gap-2">
        <Users className="w-5 h-5" />
        Add Team Member
      </button>
    </div>

    {/* Team Stats */}
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <p className="text-sm text-gray-600 mb-1">Total Team Members</p>
        <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <p className="text-sm text-gray-600 mb-1">Property Managers</p>
        <p className="text-2xl font-bold text-blue-600">
          {teamMembers.filter(m => m.role === 'property_manager').length}
        </p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <p className="text-sm text-gray-600 mb-1">Maintenance Staff</p>
        <p className="text-2xl font-bold text-orange-600">
          {teamMembers.filter(m => m.role === 'maintenance').length}
        </p>
      </div>
    </div>

    {/* Team Members List */}
    {teamMembers.length === 0 ? (
      <div className="bg-white p-12 rounded-xl shadow-sm text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No team members yet</p>
        <button onClick={() => setShowTeamModal(true)} className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
          Add First Team Member
        </button>
      </div>
    ) : (
      <div className="grid gap-4">
        {teamMembers.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{member.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'property_manager' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {member.role === 'property_manager' ? 'Property Manager' : 'Maintenance'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-green-100 text-green-800' :
                      member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {member.phone}
                    </span>
                  </div>
                  
                  {/* Assigned Properties */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Assigned Properties ({member.assignedProperties?.length || 0})</p>
                    {member.assignedProperties && member.assignedProperties.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {member.assignedProperties.map(propId => {
                          const property = properties.find(p => p.id === propId);
                          return property ? (
                            <span key={propId} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {property.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No properties assigned</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setSelectedTeamMember(member);
                    setShowAssignTeamModal(true);
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm"
                >
                  Assign Properties
                </button>
                <button 
                  onClick={() => handleDeleteTeamMember(member.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                >
                  Remove
                </button>
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
  <div className="max-w-4xl mx-auto space-y-6">
    {/* Profile Settings */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
        <button 
          onClick={() => setEditingProfile(!editingProfile)}
          className="px-4 py-2 bg-[#003366] text-white text-sm rounded-lg hover:bg-[#002244] transition"
        >
          {editingProfile ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>
      
      {/* Profile Photo */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b">
        <div className="w-20 h-20 bg-[#003366] rounded-full flex items-center justify-center text-white text-2xl font-semibold">
          {profileSettings.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{profileSettings.name}</h4>
          <p className="text-sm text-gray-600">{profileSettings.email}</p>
          <button className="text-[#003366] text-sm mt-1 hover:underline flex items-center gap-1">
            <Camera className="w-4 h-4" />
            Change Photo
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid md:grid-cols-2 gap-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            type="text"
            value={profileSettings.company}
            onChange={(e) => setProfileSettings({...profileSettings, company: e.target.value})}
            disabled={!editingProfile}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={profileSettings.address}
            onChange={(e) => setProfileSettings({...profileSettings, address: e.target.value})}
            disabled={!editingProfile}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
      </div>

      {editingProfile && (
        <div className="mt-6 pt-6 border-t">
          <button 
            onClick={handleUpdateProfile}
            className="w-full px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>

    {/* Security */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Security</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="font-medium text-gray-900">Password</p>
            <p className="text-sm text-gray-500">Last changed 3 months ago</p>
          </div>
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 border border-[#003366] text-[#003366] rounded-lg hover:bg-[#003366] hover:text-white transition"
          >
            Change Password
          </button>
        </div>
        
        <div className="flex items-center justify-between py-3">
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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-gray-900">Email Notifications</p>
            <p className="text-sm text-gray-500">Receive updates via email</p>
          </div>
          <button
            onClick={() => handleUpdateNotifications('email')}
            className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.email ? 'bg-[#003366]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.email ? 'translate-x-6' : 'translate-x-0'}`}></span>
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-gray-900">SMS Notifications</p>
            <p className="text-sm text-gray-500">Receive updates via text message</p>
          </div>
          <button
            onClick={() => handleUpdateNotifications('sms')}
            className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.sms ? 'bg-[#003366]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.sms ? 'translate-x-6' : 'translate-x-0'}`}></span>
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-gray-900">Push Notifications</p>
            <p className="text-sm text-gray-500">Receive browser push notifications</p>
          </div>
          <button
            onClick={() => handleUpdateNotifications('push')}
            className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.push ? 'bg-[#003366]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.push ? 'translate-x-6' : 'translate-x-0'}`}></span>
          </button>
        </div>
      </div>

      {/* Alert Types */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-medium text-gray-900 mb-4">Alert Types</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Payment Alerts</span>
            <button
              onClick={() => handleUpdateNotifications('paymentAlerts')}
              className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.paymentAlerts ? 'bg-[#003366]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.paymentAlerts ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Maintenance Requests</span>
            <button
              onClick={() => handleUpdateNotifications('maintenanceAlerts')}
              className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.maintenanceAlerts ? 'bg-[#003366]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.maintenanceAlerts ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Viewing Bookings</span>
            <button
              onClick={() => handleUpdateNotifications('viewingAlerts')}
              className={`relative w-12 h-6 rounded-full transition ${profileSettings.notifications.viewingAlerts ? 'bg-[#003366]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${profileSettings.notifications.viewingAlerts ? 'translate-x-6' : 'translate-x-0'}`}></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Danger Zone */}
    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-200">
      <h3 className="text-lg font-semibold text-red-600 mb-6">Danger Zone</h3>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b">
          <div>
            <p className="font-medium text-gray-900">Deactivate Account</p>
            <p className="text-sm text-gray-500">Temporarily disable your account</p>
          </div>
          <button className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition whitespace-nowrap">
            Deactivate
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
          <div>
            <p className="font-medium text-gray-900">Delete Account</p>
            <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
          </div>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition whitespace-nowrap">
            Delete Account
          </button>
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Add New Property</h2>
              <button onClick={() => setShowPropertyModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
                <input
                  type="text"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="e.g., Sunset Apartments"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  value={newProperty.location}
                  onChange={(e) => setNewProperty({...newProperty, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="e.g., Westlands, Nairobi"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Units *</label>
                  <input
                    type="number"
                    value={newProperty.units}
                    onChange={(e) => setNewProperty({...newProperty, units: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupied Units</label>
                  <input
                    type="number"
                    value={newProperty.occupied}
                    onChange={(e) => setNewProperty({...newProperty, occupied: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue</label>
                <input
                  type="number"
                  value={newProperty.revenue}
                  onChange={(e) => setNewProperty({...newProperty, revenue: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="240000"
                />
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
                      <div className="text-[#003366]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-2"></div>
                        <p>Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload property images</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
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
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
        <h2 className="text-xl font-bold text-gray-900">Edit Property</h2>
        <button onClick={() => {
          setShowEditPropertyModal(false);
          setEditingProperty(null);
        }}><X className="w-6 h-6 text-gray-500" /></button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
          <input
            type="text"
            value={editingProperty.name}
            onChange={(e) => setEditingProperty({...editingProperty, name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="e.g., Sunset Apartments"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <input
            type="text"
            value={editingProperty.location}
            onChange={(e) => setEditingProperty({...editingProperty, location: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="e.g., Westlands, Nairobi"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Units *</label>
            <input
              type="number"
              value={editingProperty.units}
              onChange={(e) => setEditingProperty({...editingProperty, units: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Occupied Units</label>
            <input
              type="number"
              value={editingProperty.occupied}
              onChange={(e) => setEditingProperty({...editingProperty, occupied: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="8"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue</label>
          <input
            type="number"
            value={editingProperty.revenue}
            onChange={(e) => setEditingProperty({...editingProperty, revenue: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="240000"
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
                const urls = await handleImageUpload(e.target.files, 'property');
                setEditingProperty({...editingProperty, images: [...(editingProperty.images || []), ...urls]});
              }}
              className="hidden"
              id="edit-property-images"
            />
            <label htmlFor="edit-property-images" className="cursor-pointer">
              {uploadingImages ? (
                <div className="text-[#003366]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-2"></div>
                  <p>Uploading...</p>
                </div>
              ) : (
                <>
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload property images</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Add New Tenant</h2>
              <button onClick={() => setShowTenantModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="+254 712 345 678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                  <select
                    value={newTenant.property}
                    onChange={(e) => setNewTenant({...newTenant, property: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                  <input
                    type="text"
                    value={newTenant.unit}
                    onChange={(e) => setNewTenant({...newTenant, unit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="A12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (KES) *</label>
                <input
                  type="number"
                  value={newTenant.rent}
                  onChange={(e) => setNewTenant({...newTenant, rent: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="30000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start Date</label>
                  <input
                    type="date"
                    value={newTenant.leaseStart}
                    onChange={(e) => setNewTenant({...newTenant, leaseStart: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease End Date</label>
                  <input
                    type="date"
                    value={newTenant.leaseEnd}
                    onChange={(e) => setNewTenant({...newTenant, leaseEnd: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowTenantModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
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
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Create Property Listing</h2>
              <button onClick={() => setShowListingModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                  <select
                    value={newListing.property}
                    onChange={(e) => setNewListing({...newListing, property: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                  <input
                    type="text"
                    value={newListing.unit}
                    onChange={(e) => setNewListing({...newListing, unit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="A12"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms *</label>
                  <input
                    type="number"
                    value={newListing.bedrooms}
                    onChange={(e) => setNewListing({...newListing, bedrooms: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={newListing.bathrooms}
                    onChange={(e) => setNewListing({...newListing, bathrooms: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
                  <input
                    type="number"
                    value={newListing.area}
                    onChange={(e) => setNewListing({...newListing, area: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="80"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (KES) *</label>
                  <input
                    type="number"
                    value={newListing.rent}
                    onChange={(e) => setNewListing({...newListing, rent: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="30000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (KES)</label>
                  <input
                    type="number"
                    value={newListing.deposit}
                    onChange={(e) => setNewListing({...newListing, deposit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="30000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newListing.description}
                  onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Describe the property..."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={newListing.amenities}
                  onChange={(e) => setNewListing({...newListing, amenities: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
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
                      <div className="text-[#003366]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-2"></div>
                        <p>Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload listing images</p>
                        <p className="text-xs text-gray-500 mt-1">Add multiple photos to showcase the property</p>
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

      {/* Send Memo Modal */}
      {showMemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Send Memo to Tenants</h2>
              <button onClick={() => setShowMemoModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newMemo.title}
                  onChange={(e) => setNewMemo({...newMemo, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="e.g., Water Maintenance Notice"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={newMemo.message}
                  onChange={(e) => setNewMemo({...newMemo, message: e.target.value})}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Type your message here..."
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newMemo.priority}
                    onChange={(e) => setNewMemo({...newMemo, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
                  <select
                    value={newMemo.targetAudience}
                    onChange={(e) => setNewMemo({...newMemo, targetAudience: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Add Maintenance Request</h2>
              <button onClick={() => setShowMaintenanceModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                  <select
                    value={newMaintenance.property}
                    onChange={(e) => setNewMaintenance({...newMaintenance, property: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.name}>{prop.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    value={newMaintenance.unit}
                    onChange={(e) => setNewMaintenance({...newMaintenance, unit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="A12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
                <select
                  value={newMaintenance.tenant}
                  onChange={(e) => setNewMaintenance({...newMaintenance, tenant: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="">Select Tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.name}>{tenant.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description *</label>
                <textarea
                  value={newMaintenance.issue}
                  onChange={(e) => setNewMaintenance({...newMaintenance, issue: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Describe the maintenance issue..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newMaintenance.priority}
                  onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
                <select
                  value={newPayment.tenant}
                  onChange={(e) => {
                    const selectedTenant = tenants.find(t => t.name === e.target.value);
                    setNewPayment({
                      ...newPayment,
                      tenant: e.target.value,
                      property: selectedTenant?.property || '',
                      unit: selectedTenant?.unit || '',
                      amount: selectedTenant?.rent || ''
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="">Select Tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.name}>{tenant.name} - {tenant.property}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                  <input
                    type="text"
                    value={newPayment.property}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newPayment.unit}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    placeholder="30000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={newPayment.dueDate}
                    onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="">Not paid yet</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
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

      {/* Viewing Details Modal */}
      {selectedViewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Viewing Request Details</h2>
              <button onClick={() => setSelectedViewing(null)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Prospect Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#003366]" />
                  Prospect Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">{selectedViewing.prospectName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedViewing.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{selectedViewing.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedViewing.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        selectedViewing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedViewing.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property & Viewing Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#003366]" />
                  Property & Viewing Details
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Property</p>
                      <p className="font-medium text-gray-900">{selectedViewing.property}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Viewing Date</p>
                      <p className="font-medium text-gray-900">{selectedViewing.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Preferred Time</p>
                      <p className="font-medium text-gray-900">{selectedViewing.time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Submitted</p>
                      <p className="font-medium text-gray-900">{selectedViewing.submittedDate || 'Today'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credibility Score */}
              {selectedViewing.credibilityScore && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Credibility Assessment</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">Overall Score</span>
                      <span className={`text-2xl font-bold ${
                        selectedViewing.credibilityScore >= 80 ? 'text-green-600' :
                        selectedViewing.credibilityScore >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {selectedViewing.credibilityScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
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
                        <span className="text-gray-700">Email & Phone Verified</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">Employment Information Provided</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">Detailed Motivation Submitted</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Employment Info */}
              {selectedViewing.employment && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Employment Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Status</p>
                        <p className="font-medium text-gray-900">{selectedViewing.employment}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Income Range</p>
                        <p className="font-medium text-gray-900">{selectedViewing.incomeRange || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Motivation */}
              {selectedViewing.motivation && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Why They're Interested</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 text-sm leading-relaxed">{selectedViewing.motivation}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedViewing.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
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

      {/* Listing Image Gallery Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="max-w-5xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-xl font-semibold">
                {selectedListing.property} - Unit {selectedListing.unit}
              </h2>
              <button onClick={() => setSelectedListing(null)} className="text-white hover:text-gray-300">
                <X className="w-8 h-8" />
              </button>
            </div>
            
            {selectedListing.images && selectedListing.images.length > 0 && (
              <div className="relative">
                <img 
                  src={selectedListing.images[currentImageIndex]} 
                  alt={`View ${currentImageIndex + 1}`}
                  className="w-full h-[70vh] object-contain rounded-lg"
                />
                
                {selectedListing.images.length > 1 && (
                  <>
                    <button 
                      onClick={() => setCurrentImageIndex((currentImageIndex - 1 + selectedListing.images.length) % selectedListing.images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-900" />
                    </button>
                    <button 
                      onClick={() => setCurrentImageIndex((currentImageIndex + 1) % selectedListing.images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-900" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black bg-opacity-70 text-white rounded-full text-sm">
                      {currentImageIndex + 1} / {selectedListing.images.length}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {selectedListing.images && selectedListing.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {selectedListing.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      idx === currentImageIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Add Team Member Modal */}
{showTeamModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
        <h2 className="text-xl font-bold text-gray-900">Add Team Member</h2>
        <button onClick={() => setShowTeamModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
      </div>
      <div className="p-6 space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> The team member will receive an email invitation to create their account and access the platform.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            value={newTeamMember.name}
            onChange={(e) => setNewTeamMember({...newTeamMember, name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={newTeamMember.email}
            onChange={(e) => setNewTeamMember({...newTeamMember, email: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            type="tel"
            value={newTeamMember.phone}
            onChange={(e) => setNewTeamMember({...newTeamMember, phone: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            placeholder="+254 712 345 678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <select
            value={newTeamMember.role}
            onChange={(e) => setNewTeamMember({...newTeamMember, role: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          >
            <option value="property_manager">Property Manager</option>
            <option value="maintenance">Maintenance Staff</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {newTeamMember.role === 'property_manager' 
              ? 'Can manage properties, tenants, and view reports' 
              : 'Can view and update maintenance requests'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Properties (Optional)</label>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {properties.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No properties available</p>
            ) : (
              properties.map(property => (
                <label key={property.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
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
                    className="w-4 h-4 text-[#003366] border-gray-300 rounded focus:ring-[#003366]"
                  />
                  <span className="text-sm text-gray-700">{property.name} - {property.location}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-gray-200 flex gap-3">
        <button onClick={() => setShowTeamModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
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
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
        <h2 className="text-xl font-bold text-gray-900">Assign Properties to {selectedTeamMember.name}</h2>
        <button onClick={() => setShowAssignTeamModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-4">Select which properties this team member can access:</p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {properties.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No properties available</p>
          ) : (
            properties.map(property => (
              <label key={property.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedTeamMember.assignedProperties?.includes(property.id) || false}
                  onChange={() => handleAssignToProperty(selectedTeamMember.id, property.id)}
                  className="w-5 h-5 text-[#003366] border-gray-300 rounded focus:ring-[#003366] mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{property.name}</p>
                  <p className="text-sm text-gray-600">{property.location}</p>
                  <p className="text-xs text-gray-500 mt-1">{property.units} units • {property.occupied} occupied</p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>
      <div className="p-6 border-t border-gray-200">
        <button onClick={() => setShowAssignTeamModal(false)} className="w-full px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition">
          Done
        </button>
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
  />
)}
    </div>
  );
};

export default LandlordDashboard;
                        