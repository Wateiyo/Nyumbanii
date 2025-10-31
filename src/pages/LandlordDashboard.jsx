import React, { useState, useEffect } from 'react';
import { auth, storage } from '../firebase';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
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
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Home, 
  Users, 
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
  Ban
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
const { viewings, loading: loadingViewings } = useViewings(currentUser?.uid, 'landlord');
const { listings, loading: loadingListings } = useListings(currentUser?.uid);
const { memos, loading: loadingMemos } = useMemos(currentUser?.uid);
const { teamMembers, loading: loadingTeam } = useTeamMembers(currentUser?.uid);
  
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

  const handleAddTenant = async () => {
  try {
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
      landlordId: currentUser.uid,
      landlordName: userProfile?.displayName || 'Your Landlord',
      status: newTenant.sendInvitation ? 'pending' : 'active', // pending if sending invitation
      invitationToken: newTenant.sendInvitation ? invitationToken : null,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'tenants'), tenantData);

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
        status: 'pending', // pending, accepted, expired
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };

      await addDoc(collection(db, 'invitations'), invitationData);

      // Generate invitation link using the correct domain
      const invitationLink = `https://nyumbanii.web.app/register?invite=${invitationToken}`;

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(invitationLink);
        alert(`Tenant added successfully!\n\nInvitation link copied to clipboard:\n${invitationLink}\n\nShare this link with ${newTenant.name} to complete registration.`);
      } catch (err) {
        alert(`Tenant added successfully!\n\nInvitation link:\n${invitationLink}\n\nPlease share this link with ${newTenant.name}.`);
      }
    } else {
      alert('Tenant added successfully!');
    }

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
  } catch (error) {
    console.error('Error adding tenant:', error);
    console.error('Error details:', error.message, error.code);
    alert(`Failed to add tenant: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    await addDoc(collection(db, 'invitations'), invitationData);

    // Generate invitation link using the correct domain
    const invitationLink = `https://nyumbanii.web.app/register?invite=${invitationToken}&type=${newTeamMember.role}`;

    // Reset form first
    setNewTeamMember({
      name: '',
      email: '',
      phone: '',
      role: 'property_manager',
      assignedProperties: []
    });
    setShowTeamModal(false);

    // Copy to clipboard and show success message
    try {
      await navigator.clipboard.writeText(invitationLink);
      alert(`Team member added successfully!\n\nInvitation link copied to clipboard:\n${invitationLink}\n\nAn invitation email has been sent to ${newTeamMember.name}.`);
    } catch (err) {
      console.log('Clipboard error:', err);
      alert(`Team member added successfully!\n\nInvitation link:\n${invitationLink}\n\nAn invitation email has been sent to ${newTeamMember.name}.`);
    }
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
      value: displayTenants.filter(t => t.status === 'active').length,
      icon: Users, 
      color: 'bg-green-100 text-green-900' 
    },
    { 
      label: 'Monthly Revenue', 
      value: `KES ${Math.round(properties.reduce((sum, p) => sum + (p.revenue || 0), 0) / 1000)}K`, 
      icon: Banknote, 
      color: 'bg-purple-100 text-purple-900' 
    },
    { 
    label: 'Pending Viewings', 
    value: viewings.filter(v => v.status === 'pending').length, 
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
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
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
          {['dashboard', 'properties', 'listings', 'viewings', 'calendar', 'maintenance', 'tenants', 'payments', 'team', 'memos', 'settings'].map((view) => {
            const icons = { 
              dashboard: Home, 
              properties: Building, 
              listings: Eye,
              viewings: CalendarCheck, 
              calendar: Calendar, 
              maintenance: Wrench, 
              tenants: Users, 
              payments: Banknote,
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
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 w-full overflow-hidden">
        {/* Header */}
<header className="bg-gray-50 px-4 py-4">
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
        <Menu className="w-6 h-6 text-gray-600" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 capitalize truncate">{currentView}</h1>
        <p className="text-sm text-gray-600 truncate">Welcome back, {profileSettings.name.split(' ')[0]}!</p>
      </div>
    </div>
    <div className="flex items-center gap-4 flex-shrink-0">
      <div className="relative">
        <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-lg transition">
  <Bell className="w-6 h-6 text-gray-600" />
  {unreadCount > 0 && (
    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-medium">{unreadCount}</span>
  )}
</button>

{/* Notifications Dropdown Panel */}
{showNotifications && (
  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
    {/* Header */}
    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <p className="text-xs text-gray-600">{unreadCount} unread</p>
        )}
      </div>
      <button 
        onClick={() => setShowNotifications(false)}
        className="p-1 hover:bg-gray-200 rounded-lg transition"
      >
        <X className="w-5 h-5 text-gray-600" />
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
              className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                !notification.read ? 'bg-blue-50' : ''
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
                if (notification.type === 'payment') {
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
                  notification.type === 'payment' ? 'bg-green-100' :
                  notification.type === 'maintenance' ? 'bg-orange-100' :
                  notification.type === 'viewing' ? 'bg-blue-100' :
                  notification.type === 'tenant' ? 'bg-purple-100' :
                  'bg-gray-100'
                }`}>
                  {notification.type === 'payment' && <Banknote className="w-5 h-5 text-green-600" />}
                  {notification.type === 'maintenance' && <Wrench className="w-5 h-5 text-orange-600" />}
                  {notification.type === 'viewing' && <Eye className="w-5 h-5 text-blue-600" />}
                  {notification.type === 'tenant' && <Users className="w-5 h-5 text-purple-600" />}
                  {!notification.type && <Bell className="w-5 h-5 text-gray-600" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm mb-1 ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
      <div className="p-3 border-t border-gray-200 bg-gray-50">
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
      <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
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
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Welcome back, {profileSettings.name}!</h3>
        <p className="text-sm text-gray-600">Here's an overview of your properties</p>
      </div>
    </div>

    {/* Stats Cards - Shows 2 cols on mobile, 4 on larger screens */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
  {stats.map((stat, index) => (
    <div key={index} className="bg-white p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition">
      {/* Icon at the top */}
      <div className={`w-12 h-12 lg:w-14 lg:h-14 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
        <stat.icon className="w-6 h-6 lg:w-7 lg:h-7" />
      </div>
      
      {/* Label - now fully visible */}
      <p className="text-gray-600 text-xs lg:text-sm mb-2">{stat.label}</p>
      
      {/* Value */}
      <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
    </div>
  ))}
</div>

    {/* Cards Grid - 2 columns even on tablet */}
    <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
      {/* Recent Viewings */}
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center gap-2 text-md lg:text-base">
          <CalendarCheck className="w-4 h-4 lg:w-5 lg:h-5 text-[#003366]" />
          Recent Viewing Requests
        </h3>
        {displayViewingBookings.length === 0 ? (
          <div className="text-center py-6 lg:py-8">
            <CalendarCheck className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-xs lg:text-sm">No viewing requests yet</p>
          </div>
        ) : (
          displayViewingBookings.slice(0, 5).map(viewing => (
            <div key={viewing.id} className="flex items-center justify-between py-2 lg:py-3 border-b last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-xs lg:text-sm truncate">{viewing.prospectName}</p>
                <p className="text-xs text-gray-600 truncate">{viewing.property} - {viewing.date}</p>
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
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center gap-2 text-sm lg:text-base">
          <Banknote className="w-4 h-4 lg:w-5 lg:h-5 text-[#003366]" />
          Payment Summary
        </h3>
        <div className="space-y-2 lg:space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs lg:text-sm text-gray-600">Expected This Month</span>
            <span className="font-semibold text-gray-900 text-xs lg:text-sm">KES {paymentStats.expected.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs lg:text-sm text-gray-600">Received</span>
            <span className="font-semibold text-green-600 text-xs lg:text-sm">KES {paymentStats.received.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs lg:text-sm text-gray-600">Pending</span>
            <span className="font-semibold text-yellow-600 text-xs lg:text-sm">KES {paymentStats.pending.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs lg:text-sm text-gray-600">Overdue</span>
            <span className="font-semibold text-red-600 text-xs lg:text-sm">KES {paymentStats.overdue.toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900 text-xs lg:text-sm">Collection Rate</span>
            <span className="font-bold text-[#003366] text-base lg:text-lg">
              {paymentStats.expected > 0 ? Math.round((paymentStats.received / paymentStats.expected) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Maintenance Overview */}
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center gap-2 text-sm lg:text-base">
          <Wrench className="w-4 h-4 lg:w-5 lg:h-5 text-[#003366]" />
          Maintenance Requests
        </h3>
        {(maintenanceRequests.length > 0 ? maintenanceRequests : mockMaintenanceRequests).slice(0, 5).map(request => (
          <div key={request.id} className="flex items-center justify-between py-2 lg:py-3 border-b last:border-0">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-xs lg:text-sm truncate">{request.issue}</p>
              <p className="text-xs text-gray-600 truncate">{request.property} - Unit {request.unit}</p>
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
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          <button onClick={() => setShowPropertyModal(true)} className="p-3 lg:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-center">
            <Building className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 mx-auto mb-1 lg:mb-2" />
            <span className="text-xs lg:text-sm font-medium text-gray-900 block">Add Property</span>
          </button>
          <button onClick={() => setShowTenantModal(true)} className="p-3 lg:p-4 bg-green-50 hover:bg-green-100 rounded-lg transition text-center">
            <Users className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 mx-auto mb-1 lg:mb-2" />
            <span className="text-xs lg:text-sm font-medium text-gray-900 block">Add Tenant</span>
          </button>
          <button onClick={() => setShowListingModal(true)} className="p-3 lg:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-center">
            <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 mx-auto mb-1 lg:mb-2" />
            <span className="text-xs lg:text-sm font-medium text-gray-900 block">Create Listing</span>
          </button>
          <button onClick={() => setShowMemoModal(true)} className="p-3 lg:p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition text-center">
            <Mail className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600 mx-auto mb-1 lg:mb-2" />
            <span className="text-xs lg:text-sm font-medium text-gray-900 block">Send Memo</span>
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Property Management</h3>
            <p className="text-sm text-gray-600">Manage your properties and track occupancy rates</p>
          </div>
          <button
            onClick={() => setShowPropertyModal(true)}
            className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Property
          </button>
        </div>

        {/* Properties Grid - Responsive Full Width */}
        {loadingProps ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first property</p>
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
              <div key={property.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group">
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
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{property.name}</h3>
                      <div className="flex items-center gap-2 text-gray-600">
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
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProperty(property.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Units</p>
                      <p className="text-2xl font-bold text-gray-900">{property.units}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Occupied</p>
                      <p className="text-2xl font-bold text-green-600">{property.occupied}</p>
                    </div>
                  </div>

                  {/* Occupancy Rate */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Occupancy Rate</span>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round((property.occupied / property.units) * 100)}% occupied
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-[#003366] h-full rounded-full transition-all duration-500"
                        style={{ width: `${(property.occupied / property.units) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly Revenue */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monthly Revenue</span>
                      <span className="text-xl font-bold text-gray-900">
                        KES {Number(property.revenue).toLocaleString()}
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
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Property Listings</h3>
        <p className="text-sm text-gray-600">Manage your available units for rent</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/listings')}
          className="px-6 py-3 bg-white border-2 border-[#003366] text-[#003366] rounded-lg hover:bg-[#003366] hover:text-white transition font-semibold whitespace-nowrap flex items-center gap-2"
        >
          <Eye className="w-5 h-5" />
          View Listings
        </button>
        <button
          onClick={() => setShowListingModal(true)}
          className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Listing
        </button>
      </div>
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

{currentView === 'viewings' && (
  <div className="max-w-7xl mx-auto">
    {/* Blue Banner */}
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Viewing Requests</h3>
        <p className="text-sm text-gray-600">Manage property viewing appointments and requests</p>
      </div>
    </div>

    {/* Credibility System Info Banner */}
    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 lg:p-4 mb-4 lg:mb-6 rounded-lg">
      <div className="flex items-start gap-2 lg:gap-3">
        <div className="flex-shrink-0">
          <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs lg:text-sm font-semibold text-blue-900 mb-1">Smart Credibility Filtering Active</h3>
          <p className="text-xs lg:text-sm text-blue-800">
            Our system automatically scores viewing requests based on user credibility.
            <span className="font-medium"> High-scoring applicants (80+) are prioritized</span> to help you find reliable tenants quickly.
            Review the credibility score below each request before approving.
          </p>
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
      <h2 className="text-lg lg:text-xl font-bold text-gray-900">Viewing Requests</h2>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <button 
          onClick={() => setViewingFilter('all')}
          className={`flex-1 sm:flex-none px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition ${
            viewingFilter === 'all' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button 
          onClick={() => setViewingFilter('pending')}
          className={`flex-1 sm:flex-none px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition ${
            viewingFilter === 'pending' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending
        </button>
        <button 
          onClick={() => setViewingFilter('confirmed')}
          className={`flex-1 sm:flex-none px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition ${
            viewingFilter === 'confirmed' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Confirmed
        </button>
      </div>
    </div>
    
    <div className="grid gap-3 lg:gap-4">
      {displayViewings.filter(v => viewingFilter === 'all' || v.status === viewingFilter).map(viewing => (
        <div key={viewing.id} className="bg-white p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition">
          <div className="flex flex-col gap-4">
            {/* Header Section - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-base lg:text-lg truncate">{viewing.prospectName}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs lg:text-sm text-gray-600">
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
                viewing.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                viewing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                viewing.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {viewing.status}
              </span>
            </div>
            
            {/* Property & Date Info - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Property</p>
                <p className="font-medium text-gray-900 text-sm lg:text-base truncate">{viewing.property}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Viewing Date & Time</p>
                <p className="font-medium text-gray-900 text-sm lg:text-base">{viewing.date} at {viewing.time}</p>
              </div>
            </div>
            
            {/* Credibility Score - Mobile Optimized */}
            {viewing.credibilityScore && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Credibility Score</p>
                <div className="flex items-center gap-2 lg:gap-3">
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
                  <span className="font-semibold text-gray-900 text-xs lg:text-sm whitespace-nowrap">{viewing.credibilityScore}/100</span>
                </div>
              </div>
            )}
            
            {/* Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <button 
                onClick={() => setSelectedViewing(viewing)}
                className="text-[#003366] hover:text-[#002244] text-xs lg:text-sm font-medium text-center sm:text-left"
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
  </div>
)}

{/* Maintenance View */}
{currentView === 'maintenance' && (
  <div className="flex-1 overflow-auto">

    {/* ===== CONTENT SECTION ===== */}
    <div className="px-6 pb-8">
      <div className="max-w-7xl mx-auto">

        {/* Blue Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Maintenance Requests</h3>
            <p className="text-sm text-gray-600">Track and manage property maintenance issues</p>
          </div>
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Request
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm bg-white"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm bg-white"
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
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Maintenance Requests</h3>
            <p className="text-gray-600 mb-6">No maintenance requests have been submitted yet.</p>
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
              <div key={request.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
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
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{request.issue}</h3>

                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
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

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
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
                      className="bg-white border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition flex items-center gap-2 text-sm"
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
      </div>
    </div>
  </div>
)}

          {/* Tenants View */}
          {currentView === 'tenants' && (
            <>
              {/* Blue Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Tenant Directory</h3>
                  <p className="text-sm text-gray-600">Manage and communicate with your tenants</p>
                </div>
                <button
                  onClick={() => setShowTenantModal(true)}
                  className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Tenant
                </button>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex gap-2 w-full">
                  <div className="relative flex-1">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                <Banknote className="w-4 h-4 flex-shrink-0" />
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
                              <button
                                onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                                className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
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
  <div className="flex-1 overflow-auto">

    {/* ===== CONTENT SECTION ===== */}
    <div className="px-6 pb-8">
      <div className="max-w-7xl mx-auto">

        {/* Blue Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Payment Tracking</h3>
            <p className="text-sm text-gray-600">Monitor rent payments and track outstanding balances</p>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Record Payment
          </button>
        </div>

        {/* Payment Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Expected */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Expected</span>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Banknote className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              KES {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>

          {/* Received */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Received</span>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">
              KES {payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Pending</span>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              KES {payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>

          {/* Overdue */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overdue</span>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600">
              KES {payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>

          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm bg-white"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>

          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent text-sm bg-white"
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
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Banknote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payment Records</h3>
            <p className="text-gray-600 mb-6">Start tracking payments for your properties</p>
            <button 
              onClick={() => setShowPaymentModal(true)}
              className="bg-[#003366] text-white px-6 py-3 rounded-lg hover:bg-[#002244] transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Record Payment
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      {/* Tenant */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#003366] text-white rounded-full flex items-center justify-center font-semibold">
                            {payment.tenant?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{payment.tenant}</p>
                            <p className="text-sm text-gray-500">{payment.unit}</p>
                          </div>
                        </div>
                      </td>

                      {/* Property */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>{payment.property}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900">
                          KES {payment.amount?.toLocaleString()}
                        </p>
                        {payment.method && (
                          <p className="text-xs text-gray-500 capitalize">{payment.method}</p>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(payment.dueDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
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
                              className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDownloadReceipt(payment.id)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
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

      </div>
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Updates & Memos</h3>
            <p className="text-sm text-gray-600">Send announcements and updates to your tenants</p>
          </div>
          <button
            onClick={() => setShowMemoModal(true)}
            className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send Memo
          </button>
        </div>

        {/* Mock Memo - Water maintenance */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
            <div className="p-6">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="text-xl font-bold text-gray-900">Water maintenance</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      normal
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    Water will be shut off tomorrow for a few hours. Please make prior arrangements
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>Sent by: Test User</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Date: 16/10/2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>Recipients: 10 tenants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span>Target: Sunset Apartments</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 lg:flex-col">
                  <button 
                    onClick={() => handleDeleteMemo('mock1')}
                    className="flex-1 lg:flex-none bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

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
        <div className="mb-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-6">
            <h2 className="text-2xl font-bold text-gray-900">Schedule Calendar</h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Viewings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Maintenance</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Calendar Header - Days of Week */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7 auto-rows-fr">
              {/* Empty cells */}
              <div className="aspect-square min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-2 bg-gray-50"></div>
              <div className="aspect-square min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-2 bg-gray-50"></div>
              <div className="aspect-square min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-2 bg-gray-50"></div>
              
              {/* Days 1-4 */}
              {[1, 2, 3, 4].map(day => (
                <div key={day} className={`aspect-square min-h-[80px] sm:min-h-[100px] border-b border-gray-200 p-2 hover:bg-gray-50 transition cursor-pointer ${day !== 4 ? 'border-r' : ''}`}>
                  <div className="text-sm font-medium text-gray-900">{day}</div>
                </div>
              ))}

              {/* Days 5-6 */}
              {[5, 6].map(day => (
                <div key={day} className="aspect-square min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-2 hover:bg-gray-50 transition cursor-pointer">
                  <div className="text-sm font-medium text-gray-900">{day}</div>
                </div>
              ))}
              
              {/* Day 7 - With Events */}
              <div className="aspect-square min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-2 hover:bg-gray-50 transition cursor-pointer">
                <div className="text-sm font-medium text-gray-900 mb-1">7</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    <CalendarCheck className="w-3 h-3 flex-shrink-0" />
                    <span>1</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                    <Wrench className="w-3 h-3 flex-shrink-0" />
                    <span>1</span>
                  </div>
                </div>
              </div>
              
              {/* Day 8 - With Events */}
              <div className="aspect-square min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-2 hover:bg-gray-50 transition cursor-pointer">
                <div className="text-sm font-medium text-gray-900 mb-1">8</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    <CalendarCheck className="w-3 h-3 flex-shrink-0" />
                    <span>1</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                    <Wrench className="w-3 h-3 flex-shrink-0" />
                    <span>1</span>
                  </div>
                </div>
              </div>
              
              {/* Day 9 - With Event */}
              <div className="aspect-square min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-2 hover:bg-gray-50 transition cursor-pointer">
                <div className="text-sm font-medium text-gray-900 mb-1">9</div>
                <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                  <Wrench className="w-3 h-3 flex-shrink-0" />
                  <span>1</span>
                </div>
              </div>
              
              {/* Days 10-11 */}
              {[10, 11].map(day => (
                <div key={day} className={`aspect-square min-h-[80px] sm:min-h-[100px] border-b border-gray-200 p-2 hover:bg-gray-50 transition cursor-pointer ${day === 10 ? 'border-r' : ''}`}>
                  <div className="text-sm font-medium text-gray-900">{day}</div>
                </div>
              ))}

              {/* Weeks 3-5 */}
              {[12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((day, idx) => (
                <div key={day} className={`aspect-square min-h-[80px] sm:min-h-[100px] border-b border-gray-200 p-2 hover:bg-gray-50 transition cursor-pointer ${(idx + 5) % 7 !== 6 ? 'border-r' : ''}`}>
                  <div className="text-sm font-medium text-gray-900">{day}</div>
                </div>
              ))}
              <div className="aspect-square min-h-[80px] sm:min-h-[100px] p-2 bg-gray-50"></div>
            </div>
          </div>
        </div>

        {/* ===== UPCOMING EVENTS WITH MOCK DATA ===== */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
          
          <div className="space-y-4">
            {/* Mock Event 1 - Viewing */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition flex items-center gap-6">
              <div className="flex-shrink-0 text-center">
                <div className="text-blue-600 text-sm font-semibold">Oct</div>
                <div className="text-4xl font-bold text-gray-900">7</div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Property Viewing</h3>
                <p className="text-gray-600 text-sm mb-1">Sarah Johnson - Sunset Apartments</p>
                <p className="text-gray-500 text-xs">10:00</p>
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Mock Event 2 - Viewing */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition flex items-center gap-6">
              <div className="flex-shrink-0 text-center">
                <div className="text-blue-600 text-sm font-semibold">Oct</div>
                <div className="text-4xl font-bold text-gray-900">8</div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Property Viewing</h3>
                <p className="text-gray-600 text-sm mb-1">Michael Ochieng - Sunset Apartments</p>
                <p className="text-gray-500 text-xs">14:00</p>
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Mock Event 3 - Maintenance */}
            <div className="bg-orange-50 rounded-xl shadow-md p-6 hover:shadow-xl transition flex items-center gap-6">
              <div className="flex-shrink-0 text-center">
                <div className="text-orange-600 text-sm font-semibold">Oct</div>
                <div className="text-4xl font-bold text-gray-900">7</div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Maintenance</h3>
                <p className="text-gray-600 text-sm mb-1">Leaking faucet - Sunset Apartments</p>
                <p className="text-gray-500 text-xs">09:00</p>
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Mock Event 4 - Maintenance */}
            <div className="bg-orange-50 rounded-xl shadow-md p-6 hover:shadow-xl transition flex items-center gap-6">
              <div className="flex-shrink-0 text-center">
                <div className="text-orange-600 text-sm font-semibold">Oct</div>
                <div className="text-4xl font-bold text-gray-900">8</div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Maintenance</h3>
                <p className="text-gray-600 text-sm mb-1">Broken AC - Garden View</p>
                <p className="text-gray-500 text-xs">14:00</p>
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Mock Event 5 - Maintenance */}
            <div className="bg-orange-50 rounded-xl shadow-md p-6 hover:shadow-xl transition flex items-center gap-6">
              <div className="flex-shrink-0 text-center">
                <div className="text-orange-600 text-sm font-semibold">Oct</div>
                <div className="text-4xl font-bold text-gray-900">9</div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Maintenance</h3>
                <p className="text-gray-600 text-sm mb-1">Faulty door lock - Riverside Towers</p>
                <p className="text-gray-500 text-xs">10:00</p>
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Team Management</h3>
            <p className="text-sm text-gray-600">Manage your property management team members</p>
          </div>
          <button
            onClick={() => setShowTeamModal(true)}
            className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-semibold whitespace-nowrap flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Add Team Member
          </button>
        </div>

        {/* Team Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {/* Total Team Members */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Team Members</span>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{teamMembers.length}</p>
          </div>

          {/* Property Managers */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Property Managers</span>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-blue-600">
              {teamMembers.filter(m => m.role === 'property_manager').length}
            </p>
          </div>

          {/* Maintenance Staff */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Maintenance Staff</span>
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
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Team Members Yet</h3>
            <p className="text-gray-600 mb-6">Add your first team member to get started</p>
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
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
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
                          <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            member.role === 'property_manager' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {member.role === 'property_manager' ? 'Property Manager' : 'Maintenance'}
                          </span>
                          {member.status === 'pending' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              pending
                            </span>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
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
                            <p className="text-sm text-gray-600 mb-2">
                              Assigned Properties ({member.assignedProperties.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {member.assignedProperties.map(propId => {
                                const property = properties.find(p => p.id === propId);
                                return property ? (
                                  <span 
                                    key={propId}
                                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
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
                    <div className="flex gap-2 lg:flex-col lg:items-end">
                      <button 
                        onClick={() => {
                          setSelectedTeamMember(member);
                          setShowAssignTeamModal(true);
                        }}
                        className="flex-1 lg:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Building className="w-4 h-4" />
                        Assign Properties
                      </button>
                      <button 
                        onClick={() => handleRemoveTeamMember(member.id)}
                        className="flex-1 lg:flex-none bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition text-sm flex items-center justify-center gap-2 whitespace-nowrap"
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
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Roles & Permissions</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p><strong>Property Managers:</strong> Can manage properties, tenants, viewings, and view reports</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p><strong>Maintenance Staff:</strong> Can view and update maintenance requests for assigned properties</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-1.5 flex-shrink-0"></div>
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

{/* Settings View */}
{/* Settings View - REPLACE LINES 2992-3223 with this code */}
{currentView === 'settings' && (
  <div className="min-h-screen bg-gray-50">

    {/* Main Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                {editingProfile && (
                  <button className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-[#003366] rounded-full flex items-center justify-center text-white hover:bg-[#002244] transition">
                    <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{userProfile?.name || 'Test User'}</h3>
                <p className="text-sm sm:text-base text-gray-600">{userProfile?.email || 'test@test.com'}</p>
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
                  value={userProfile?.name || 'Test User'}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userProfile?.email || 'test@test.com'}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={userProfile?.phone || '+25470000000'}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={userProfile?.companyName || 'Doe Properties Ltd'}
                  disabled={!editingProfile}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={userProfile?.address || 'Westlands, Nairobi'}
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
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-500 mt-1">Receive updates via text message</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-500 mt-1">Receive browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
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
                <h3 className="font-semibold text-gray-900">Payment Alerts</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Maintenance Requests</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003366]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Viewing Bookings</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
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
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
            <input
             type="checkbox"
             id="sendInvitation"
             checked={newTenant.sendInvitation}
             onChange={(e) => setNewTenant({...newTenant, sendInvitation: e.target.checked})}
             className="w-4 h-4 text-[#003366] border-gray-300 rounded focus:ring-[#003366]"
             />
          <label htmlFor="sendInvitation" className="text-sm text-gray-700">
          Send invitation email to tenant
          </label>
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
                        