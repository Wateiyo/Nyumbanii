import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import {
  Home,
  Users,
  Building,
  Wrench,
  Bell,
  LogOut,
  X,
  Calendar,
  Mail,
  Phone,
  CalendarCheck,
  MapPin,
  Menu,
  DollarSign,
  Clock,
  MessageSquare
} from 'lucide-react';
import MessageModal from '../components/MessageModal';

const PropertyManagerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [teamMember, setTeamMember] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [viewingBookings, setViewingBookings] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedViewing, setSelectedViewing] = useState(null);
  const [viewingFilter, setViewingFilter] = useState('all');
  const [maintenanceStaff, setMaintenanceStaff] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    property: '',
    unit: '',
    issue: '',
    description: '',
    priority: 'medium',
    scheduledDate: '',
    scheduledTime: ''
  });

  // Fetch team member data for the current user
  useEffect(() => {
    if (!currentUser?.uid) {
      navigate('/login');
      return;
    }

    const fetchTeamMember = async () => {
      try {
        const q = query(
          collection(db, 'teamMembers'),
          where('userId', '==', currentUser.uid),
          where('role', '==', 'property_manager')
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const memberData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setTeamMember(memberData);
          console.log('Team member data loaded:', memberData);
        } else {
          console.error('No team member record found for user');
          // User might not have completed registration properly
          alert('Your account is not properly set up. Please contact your landlord.');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching team member:', error);
        alert('Error loading your profile. Please try again.');
        navigate('/login');
      }
    };

    fetchTeamMember();
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out. Please try again.');
    }
  };

  // Fetch user profile for messaging
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('uid', '==', currentUser.uid))
        );
        if (!userDoc.empty) {
          setUserProfile(userDoc.docs[0].data());
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleOpenMessageModal = (tenant) => {
    setSelectedTenant(tenant);
    setIsMessageModalOpen(true);
  };

  const handleCloseMessageModal = () => {
    setIsMessageModalOpen(false);
    setSelectedTenant(null);
  };

  const handleMaintenanceFormChange = (e) => {
    const { name, value } = e.target;
    setMaintenanceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitMaintenanceRequest = async (e) => {
    e.preventDefault();

    if (!maintenanceForm.property || !maintenanceForm.unit || !maintenanceForm.issue || !maintenanceForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'maintenanceRequests'), {
        property: maintenanceForm.property,
        unit: maintenanceForm.unit,
        issue: maintenanceForm.issue,
        description: maintenanceForm.description,
        priority: maintenanceForm.priority,
        date: maintenanceForm.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: maintenanceForm.scheduledTime || 'TBD',
        status: 'pending',
        requestedBy: teamMember.name,
        requestedByRole: 'property_manager',
        requestedById: currentUser.uid,
        landlordId: teamMember.landlordId,
        createdAt: serverTimestamp()
      });

      // Create notification for landlord
      await addDoc(collection(db, 'notifications'), {
        userId: teamMember.landlordId,
        type: 'maintenance_request',
        title: 'New Maintenance Request',
        message: `${teamMember.name} created a maintenance request: ${maintenanceForm.issue} at ${maintenanceForm.property} - Unit ${maintenanceForm.unit}`,
        read: false,
        createdAt: serverTimestamp()
      });

      alert('Maintenance request created successfully!');
      setShowMaintenanceForm(false);
      setMaintenanceForm({
        property: '',
        unit: '',
        issue: '',
        description: '',
        priority: 'medium',
        scheduledDate: '',
        scheduledTime: ''
      });
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      alert('Failed to create maintenance request. Please try again.');
    }
  };

  // Fetch assigned properties
  useEffect(() => {
    if (!teamMember?.assignedProperties || teamMember.assignedProperties.length === 0) {
      setLoading(false);
      return;
    }

    const unsubscribes = teamMember.assignedProperties.map(propertyId => {
      const propertyRef = doc(db, 'properties', propertyId);
      return onSnapshot(propertyRef, (snapshot) => {
        if (snapshot.exists()) {
          setProperties(prev => {
            const filtered = prev.filter(p => p.id !== propertyId);
            return [...filtered, { id: snapshot.id, ...snapshot.data() }];
          });
        }
      });
    });

    setLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());
  }, [teamMember]);

  // Fetch tenants for assigned properties
  useEffect(() => {
    if (!properties.length) return;

    const propertyNames = properties.map(p => p.name);
    const q = query(
      collection(db, 'tenants'),
      where('property', 'in', propertyNames.slice(0, 10)) // Firestore limit
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tenantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTenants(tenantsData);
    });

    return unsubscribe;
  }, [properties]);

  // Fetch payments for assigned properties
  useEffect(() => {
    if (!properties.length) return;

    const propertyNames = properties.map(p => p.name);
    const q = query(
      collection(db, 'payments'),
      where('property', 'in', propertyNames.slice(0, 10))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);
    });

    return unsubscribe;
  }, [properties]);

  // Fetch viewing bookings
  useEffect(() => {
    if (!properties.length) return;

    const propertyNames = properties.map(p => p.name);
    const q = query(
      collection(db, 'viewings'),
      where('property', 'in', propertyNames.slice(0, 10))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const viewingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setViewingBookings(viewingsData);
    });

    return unsubscribe;
  }, [properties]);

  // Fetch maintenance requests
  useEffect(() => {
    if (!properties.length) return;

    const propertyNames = properties.map(p => p.name);
    const q = query(
      collection(db, 'maintenanceRequests'),
      where('property', 'in', propertyNames.slice(0, 10))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaintenanceRequests(requestsData);
    });

    return unsubscribe;
  }, [properties]);

  // Fetch maintenance staff for the landlord
  useEffect(() => {
    if (!teamMember?.landlordId) return;

    const q = query(
      collection(db, 'teamMembers'),
      where('landlordId', '==', teamMember.landlordId),
      where('role', '==', 'maintenance')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaintenanceStaff(staffData);
    });

    return unsubscribe;
  }, [teamMember]);

  // Fetch conversations for property manager
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by last message time
      conversationsData.sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
        const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
        return timeB - timeA;
      });
      setConversations(conversationsData);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleUpdateViewingStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'viewingBookings', id), { status });
      if (status === 'confirmed') {
        alert('Viewing confirmed! Notification sent to prospect.');
      }
    } catch (error) {
      console.error('Error updating viewing:', error);
      alert('Error updating viewing status.');
    }
  };

  const handleAssignStaff = async (requestId, staffId) => {
    try {
      const staff = maintenanceStaff.find(s => s.id === staffId);
      await updateDoc(doc(db, 'maintenanceRequests', requestId), {
        assignedTo: staffId,
        assignedToName: staff?.name || '',
        assignedAt: serverTimestamp()
      });
      alert('Maintenance staff assigned successfully!');
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('Error assigning maintenance staff.');
    }
  };

  const handleStartWork = async (requestId, request) => {
    try {
      // Update status to in-progress
      await updateDoc(doc(db, 'maintenanceRequests', requestId), {
        status: 'in-progress',
        startedAt: serverTimestamp()
      });

      // Send notification to assigned maintenance staff
      if (request.assignedTo) {
        await addDoc(collection(db, 'notifications'), {
          userId: request.assignedTo,
          type: 'maintenance_started',
          title: 'Maintenance Work Started',
          message: `Work has been started on: ${request.issue} at ${request.property} - Unit ${request.unit}`,
          maintenanceRequestId: requestId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      alert('Work started! Notification sent to maintenance staff.');
    } catch (error) {
      console.error('Error starting work:', error);
      alert('Error starting work.');
    }
  };

  const stats = [
    { label: 'My Properties', value: properties.length, icon: Home, color: 'bg-blue-100 text-blue-900' },
    { label: 'Active Tenants', value: tenants.filter(t => t.status === 'active').length, icon: Users, color: 'bg-green-100 text-green-900' },
    { label: 'Pending Viewings', value: viewingBookings.filter(v => v.status === 'pending').length, icon: CalendarCheck, color: 'bg-orange-100 text-orange-900' },
    { label: 'Open Maintenance', value: maintenanceRequests.filter(m => m.status !== 'completed').length, icon: Wrench, color: 'bg-red-100 text-red-900' }
  ];

  const filteredViewings = viewingBookings.filter(viewing => {
    if (viewingFilter === 'all') return true;
    return viewing.status === viewingFilter;
  });

  // Show loading screen while fetching team member data or other data
  if (!teamMember || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#003366] text-white transition-transform duration-300 flex flex-col`}>
        <div className="p-6">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo-light.svg" alt="Nyumbanii Logo" className="h-10 w-auto" />
            </div>
            <div>
              <span className="text-xl font-bold">Nyumbanii</span>
              <p className="text-xs text-gray-300">Property Manager</p>
            </div>
          </a>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {['dashboard', 'properties', 'viewings', 'tenants', 'maintenance', 'messages', 'calendar'].map((view) => {
            const icons = { dashboard: Home, properties: Building, viewings: CalendarCheck, tenants: Users, maintenance: Wrench, messages: MessageSquare, calendar: Calendar };
            const Icon = icons[view];
            return (
              <button
                key={view}
                onClick={() => { setCurrentView(view); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === view ? 'bg-[#002244]' : 'hover:bg-[#002244]'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="capitalize text-sm">{view}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm p-4 lg:p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 capitalize">{currentView}</h1>
                <p className="text-sm text-gray-600">Welcome back, {teamMember.name}!</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold">
              {teamMember.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 flex-1 overflow-y-auto">
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
                  {viewingBookings.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No viewing requests yet</p>
                  )}
                </div>

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
                  {maintenanceRequests.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No maintenance requests</p>
                  )}
                </div>
              </div>
            </>
          )}

          {currentView === 'properties' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.length === 0 ? (
                <div className="col-span-full bg-white p-12 rounded-xl shadow-sm text-center">
                  <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No properties assigned to you yet</p>
                </div>
              ) : (
                properties.map(property => (
                  <div key={property.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                    <div className="relative h-48 bg-gray-200">
                      {property.images?.[0] ? (
                        <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#003366] to-[#002244]">
                          <Building className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">{property.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-4">
                        <MapPin className="w-4 h-4" />
                        {property.location}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Total Units</p>
                          <p className="text-lg font-semibold text-gray-900">{property.units}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Occupied</p>
                          <p className="text-lg font-semibold text-green-600">{property.occupied}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {currentView === 'viewings' && (
            <>
              <div className="flex gap-2 mb-6">
                {['all', 'pending', 'confirmed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setViewingFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      viewingFilter === filter ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="grid gap-4">
                {filteredViewings.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                    <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No viewing requests</p>
                  </div>
                ) : (
                  filteredViewings.map(viewing => (
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
                              <p className="text-xs text-gray-600 mb-1">Date & Time</p>
                              <p className="font-medium text-gray-900">{viewing.date} at {viewing.time}</p>
                            </div>
                          </div>
                        </div>
                        {viewing.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateViewingStatus(viewing.id, 'confirmed')}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                            >
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
                  ))
                )}
              </div>
            </>
          )}

          {currentView === 'tenants' && (
            <div className="grid gap-4">
              {tenants.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tenants in your assigned properties</p>
                </div>
              ) : (
                tenants.map(tenant => (
                  <div key={tenant.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {tenant.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{tenant.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {tenant.status}
                          </span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {tenant.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {tenant.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {tenant.property} - Unit {tenant.unit}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            KES {tenant.rent?.toLocaleString()}/mo
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenMessageModal(tenant)}
                        className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {currentView === 'maintenance' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Maintenance Requests</h2>
                <button
                  onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                  className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  {showMaintenanceForm ? 'Cancel' : 'Create Request'}
                </button>
              </div>

              {showMaintenanceForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">New Maintenance Request</h3>
                  <form onSubmit={handleSubmitMaintenanceRequest} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Property *</label>
                        <select
                          name="property"
                          value={maintenanceForm.property}
                          onChange={handleMaintenanceFormChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        >
                          <option value="">Select property</option>
                          {properties.map(prop => (
                            <option key={prop.id} value={prop.name}>{prop.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit Number *</label>
                        <input
                          type="text"
                          name="unit"
                          value={maintenanceForm.unit}
                          onChange={handleMaintenanceFormChange}
                          required
                          placeholder="e.g., A101"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Issue Title *</label>
                      <input
                        type="text"
                        name="issue"
                        value={maintenanceForm.issue}
                        onChange={handleMaintenanceFormChange}
                        required
                        placeholder="e.g., Leaking faucet"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        name="description"
                        value={maintenanceForm.description}
                        onChange={handleMaintenanceFormChange}
                        required
                        rows="3"
                        placeholder="Describe the issue in detail..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          name="priority"
                          value={maintenanceForm.priority}
                          onChange={handleMaintenanceFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                        <input
                          type="date"
                          name="scheduledDate"
                          value={maintenanceForm.scheduledDate}
                          onChange={handleMaintenanceFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Time</label>
                        <input
                          type="time"
                          name="scheduledTime"
                          value={maintenanceForm.scheduledTime}
                          onChange={handleMaintenanceFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-medium"
                      >
                        Submit Request
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMaintenanceForm(false)}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid gap-4">
                {maintenanceRequests.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                    <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No maintenance requests</p>
                  </div>
                ) : (
                  maintenanceRequests.map(request => (
                  <div key={request.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{request.issue}</h3>
                            <p className="text-sm text-gray-600 mt-1">{request.property} - Unit {request.unit}</p>
                            <p className="text-sm text-gray-600">Tenant: {request.tenant}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.priority === 'high' ? 'bg-red-100 text-red-800' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.priority} priority
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {request.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {request.scheduledTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === 'completed' ? 'bg-green-100 text-green-800' :
                            request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                          {request.assignedToName && (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Assigned to: {request.assignedToName}
                            </span>
                          )}
                        </div>

                        {/* Assignment Section */}
                        {request.status === 'pending' && maintenanceStaff.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <label className="text-sm text-gray-600 font-medium">Assign to:</label>
                            <select
                              value={request.assignedTo || ''}
                              onChange={(e) => handleAssignStaff(request.id, e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                            >
                              <option value="">Select staff...</option>
                              {maintenanceStaff.map(staff => (
                                <option key={staff.id} value={staff.id}>
                                  {staff.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        {request.status === 'pending' && request.assignedTo && (
                          <button
                            onClick={() => handleStartWork(request.id, request)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm whitespace-nowrap"
                          >
                            Start Work
                          </button>
                        )}
                        {request.status === 'pending' && !request.assignedTo && maintenanceStaff.length === 0 && (
                          <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm text-center">
                            No staff available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            </>
          )}

          {currentView === 'messages' && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                <p className="text-sm text-gray-600 mt-1">Conversations with tenants</p>
              </div>
              <div className="divide-y">
                {conversations.length === 0 ? (
                  <div className="p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No conversations yet</p>
                    <p className="text-sm text-gray-400 mt-2">Messages with tenants will appear here</p>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
                    const otherUserName = conversation.participantNames?.[otherUserId] || 'Unknown';
                    const unreadCount = conversation.unreadCount?.[currentUser.uid] || 0;

                    return (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          // Find tenant from the conversation
                          const tenant = tenants.find(t => t.id === otherUserId);
                          if (tenant) {
                            handleOpenMessageModal(tenant);
                          }
                        }}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {otherUserName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{otherUserName}</h3>
                                {conversation.propertyName && (
                                  <p className="text-xs text-gray-500">
                                    {conversation.propertyName} {conversation.unit && `- Unit ${conversation.unit}`}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-gray-500">
                                  {conversation.lastMessageTime && new Date(conversation.lastMessageTime.toDate()).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                {unreadCount > 0 && (
                                  <span className="bg-[#003366] text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              {conversation.lastMessageSender === currentUser.uid ? 'You: ' : ''}
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {currentView === 'calendar' && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Schedule</h2>
              <div className="space-y-4">
                {viewingBookings.filter(v => v.status === 'confirmed').map(viewing => (
                  <div key={viewing.id} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-xs text-blue-600 font-medium">
                        {new Date(viewing.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold text-blue-900">
                        {new Date(viewing.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Property Viewing</h3>
                      <p className="text-sm text-gray-600">{viewing.prospectName} - {viewing.property}</p>
                      <p className="text-xs text-gray-500">{viewing.time}</p>
                    </div>
                    <CalendarCheck className="w-6 h-6 text-blue-600" />
                  </div>
                ))}
                
                {maintenanceRequests.filter(m => m.status !== 'completed').map(request => (
                  <div key={request.id} className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                    <div className="w-16 h-16 bg-orange-100 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-xs text-orange-600 font-medium">
                        {new Date(request.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold text-orange-900">
                        {new Date(request.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Maintenance</h3>
                      <p className="text-sm text-gray-600">{request.issue} - {request.property}</p>
                      <p className="text-xs text-gray-500">{request.scheduledTime}</p>
                    </div>
                    <Wrench className="w-6 h-6 text-orange-600" />
                  </div>
                ))}

                {viewingBookings.filter(v => v.status === 'confirmed').length === 0 && 
                 maintenanceRequests.filter(m => m.status !== 'completed').length === 0 && (
                  <p className="text-gray-500 text-center py-8">No upcoming events</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Message Modal */}
    {selectedTenant && (
      <MessageModal
        tenant={selectedTenant}
        currentUser={currentUser}
        userProfile={userProfile}
        isOpen={isMessageModalOpen}
        onClose={handleCloseMessageModal}
      />
    )}
  </>
  );
};

export default PropertyManagerDashboard;