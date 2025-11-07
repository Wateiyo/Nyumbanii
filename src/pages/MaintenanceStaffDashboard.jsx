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
  Building,
  Wrench,
  LogOut,
  Calendar,
  Menu,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin
} from 'lucide-react';

const MaintenanceStaffDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [teamMember, setTeamMember] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

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
          where('role', '==', 'maintenance')
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const memberData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setTeamMember(memberData);
          console.log('Team member data loaded:', memberData);
        } else {
          console.error('No team member record found for user');
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

  // Fetch maintenance requests assigned to this staff member
  useEffect(() => {
    if (!teamMember?.id) return;

    // Fetch requests assigned to this maintenance staff
    const q = query(
      collection(db, 'maintenanceRequests'),
      where('assignedTo', '==', teamMember.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMaintenanceRequests(requestsData);
    });

    return unsubscribe;
  }, [teamMember]);

  const handleUpdateStatus = async (id, status, request) => {
    try {
      const updateData = {
        status,
        ...(status === 'in-progress' && { startedAt: serverTimestamp() }),
        ...(status === 'completed' && { completedAt: serverTimestamp() })
      };

      await updateDoc(doc(db, 'maintenanceRequests', id), updateData);

      // Send notification to property manager and landlord
      if (status === 'completed') {
        // Get the request data to find landlord
        const notifications = [];

        // Notify landlord if available
        if (teamMember?.landlordId) {
          notifications.push(
            addDoc(collection(db, 'notifications'), {
              userId: teamMember.landlordId,
              type: 'maintenance_completed',
              title: 'Maintenance Work Completed',
              message: `${teamMember.name} has completed: ${request.issue} at ${request.property} - Unit ${request.unit}`,
              maintenanceRequestId: id,
              read: false,
              createdAt: serverTimestamp()
            })
          );
        }

        await Promise.all(notifications);
        alert('Work completed! Notifications sent.');
      } else {
        alert(`Request ${status === 'in-progress' ? 'started' : 'marked as ' + status}!`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status.');
    }
  };

  const stats = [
    { label: 'Assigned Properties', value: properties.length, icon: Building, color: 'bg-blue-100 text-blue-900' },
    { label: 'Open Requests', value: maintenanceRequests.filter(r => r.status === 'pending').length, icon: AlertCircle, color: 'bg-red-100 text-red-900' },
    { label: 'In Progress', value: maintenanceRequests.filter(r => r.status === 'in-progress').length, icon: Clock, color: 'bg-yellow-100 text-yellow-900' },
    { label: 'Completed', value: maintenanceRequests.filter(r => r.status === 'completed').length, icon: CheckCircle, color: 'bg-green-100 text-green-900' }
  ];

  const filteredRequests = maintenanceRequests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  // Show loading screen while fetching team member data or other data
  if (!teamMember || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-orange-600 text-white transition-transform duration-300 flex flex-col`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8" />
            <div>
              <span className="text-xl font-bold">Nyumbanii</span>
              <p className="text-xs text-orange-100">Maintenance Staff</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {['dashboard', 'requests', 'properties', 'calendar'].map((view) => {
            const icons = { dashboard: Home, requests: Wrench, properties: Building, calendar: Calendar };
            const Icon = icons[view];
            return (
              <button 
                key={view} 
                onClick={() => { setCurrentView(view); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === view ? 'bg-orange-700' : 'hover:bg-orange-700'}`}
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
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
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

              <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Urgent Requests
                </h3>
                {maintenanceRequests.filter(r => r.priority === 'high' && r.status !== 'completed').length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No urgent requests</p>
                ) : (
                  maintenanceRequests.filter(r => r.priority === 'high' && r.status !== 'completed').map(request => (
                    <div key={request.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{request.issue}</p>
                        <p className="text-xs text-gray-600">{request.property} - Unit {request.unit}</p>
                      </div>
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'in-progress', request)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                        >
                          Start Work
                        </button>
                      )}
                      {request.status === 'in-progress' && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'completed', request)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  In Progress
                </h3>
                {maintenanceRequests.filter(r => r.status === 'in-progress').length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No work in progress</p>
                ) : (
                  maintenanceRequests.filter(r => r.status === 'in-progress').map(request => (
                    <div key={request.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{request.issue}</p>
                        <p className="text-xs text-gray-600">{request.property} - Unit {request.unit}</p>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus(request.id, 'completed', request)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                      >
                        Complete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {currentView === 'requests' && (
            <>
              <div className="flex gap-2 mb-6 overflow-x-auto">
                {['all', 'pending', 'in-progress', 'completed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      statusFilter === filter ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
              
              <div className="grid gap-4">
                {filteredRequests.length === 0 ? (
                  <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                    <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No maintenance requests</p>
                  </div>
                ) : (
                  filteredRequests.map(request => (
                    <div key={request.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === 'completed' ? 'bg-green-100 text-green-800' :
                            request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(request.id, 'in-progress', request)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            >
                              Start Work
                            </button>
                          )}
                          {request.status === 'in-progress' && (
                            <button
                              onClick={() => handleUpdateStatus(request.id, 'completed', request)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                            >
                              Mark Complete
                            </button>
                          )}
                          {request.status === 'completed' && (
                            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                              Completed ✓
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
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-700">
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
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Open Requests</span>
                          <span className="font-semibold text-orange-600">
                            {maintenanceRequests.filter(r => r.property === property.name && r.status !== 'completed').length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {currentView === 'calendar' && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Scheduled Maintenance</h2>
              <div className="space-y-4">
                {maintenanceRequests.filter(r => r.status !== 'completed').length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No scheduled maintenance</p>
                ) : (
                  maintenanceRequests.filter(r => r.status !== 'completed').map(request => (
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
                        <h3 className="font-semibold text-gray-900">{request.issue}</h3>
                        <p className="text-sm text-gray-600">{request.property} - Unit {request.unit}</p>
                        <p className="text-xs text-gray-500">{request.scheduledTime}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.priority === 'high' ? 'bg-red-100 text-red-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceStaffDashboard;