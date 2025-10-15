import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  onSnapshot,
  query, 
  where,
  updateDoc
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
  Clock
} from 'lucide-react';

const PropertyManagerDashboard = ({ teamMember, onLogout }) => {
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
      collection(db, 'viewingBookings'),
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
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#003366] text-white transition-transform duration-300 flex flex-col`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Home className="w-8 h-8" />
            <div>
              <span className="text-xl font-bold">Nyumbanii</span>
              <p className="text-xs text-gray-300">Property Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {['dashboard', 'properties', 'viewings', 'tenants', 'maintenance', 'calendar'].map((view) => {
            const icons = { dashboard: Home, properties: Building, viewings: CalendarCheck, tenants: Users, maintenance: Wrench, calendar: Calendar };
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

        <div className="p-4 border-t border-[#002244]">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#002244] transition text-red-300">
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {currentView === 'maintenance' && (
            <div className="grid gap-4">
              {maintenanceRequests.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                  <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No maintenance requests</p>
                </div>
              ) : (
                maintenanceRequests.map(request => (
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
                    </div>
                  </div>
                ))
              )}
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
  );
};

export default PropertyManagerDashboard;