import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  DollarSign, 
  Bell, 
  Settings, 
  LogOut,
  Search,
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
  CalendarCheck
} from 'lucide-react';

const LandlordDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedViewing, setSelectedViewing] = useState(null);
  
  const [properties] = useState([
    { id: 1, name: 'Sunset Apartments', location: 'Westlands, Nairobi', units: 12, occupied: 10, revenue: 120000 },
    { id: 2, name: 'Garden View', location: 'Kilimani, Nairobi', units: 8, occupied: 8, revenue: 96000 },
  ]);

  const [viewingBookings, setViewingBookings] = useState([
    {
      id: 1,
      prospectName: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+254 734 567 890',
      property: 'Sunset Apartments',
      date: '2025-10-05',
      time: '10:00',
      status: 'pending',
      notes: 'Interested in 2-bedroom unit',
      bookedAt: '2025-10-03 14:30'
    },
    {
      id: 2,
      prospectName: 'Michael Ochieng',
      email: 'mochieng@email.com',
      phone: '+254 745 678 901',
      property: 'Sunset Apartments',
      date: '2025-10-04',
      time: '14:00',
      status: 'confirmed',
      notes: 'Looking for studio apartment',
      bookedAt: '2025-10-02 09:15'
    },
  ]);

  const [maintenanceRequests] = useState([
    { id: 1, property: 'Sunset Apartments', unit: '2B', issue: 'Leaking faucet', status: 'pending', date: '2025-10-05', scheduledTime: '09:00' },
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New viewing request from Sarah Johnson', time: '1 hour ago', read: false, type: 'viewing' }
  ]);

  const [profileSettings] = useState({
    name: 'Tom Doe',
    email: 'tom@nyumbanii.co.ke',
    phone: '+254 712 345 678'
  });

  const stats = [
    { label: 'Total Properties', value: properties.length, icon: Home, color: 'bg-blue-100 text-blue-900' },
    { label: 'Active Tenants', value: 18, icon: Users, color: 'bg-green-100 text-green-900' },
    { label: 'Monthly Revenue', value: 'KES 216K', icon: DollarSign, color: 'bg-purple-100 text-purple-900' },
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
    ...viewingBookings.map(v => ({
      id: `viewing-${v.id}`,
      title: `Viewing: ${v.prospectName}`,
      date: v.date,
      time: v.time,
      type: 'viewing',
      details: v
    })),
    ...maintenanceRequests.map(m => ({
      id: `maintenance-${m.id}`,
      title: `Maintenance: ${m.issue}`,
      date: m.date,
      time: m.scheduledTime,
      type: 'maintenance',
      details: m
    }))
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#003366] text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
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
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {['dashboard', 'properties', 'viewings', 'calendar', 'maintenance', 'tenants', 'payments', 'settings'].map((view) => {
            const icons = { 
              dashboard: Home, 
              properties: Building, 
              viewings: Eye, 
              calendar: Calendar,
              maintenance: Wrench, 
              tenants: Users, 
              payments: DollarSign, 
              settings: Settings 
            };
            const Icon = icons[view];
            return (
              <button 
                key={view}
                onClick={() => setCurrentView(view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === view ? 'bg-[#002244]' : 'hover:bg-[#002244]'}`}
              >
                <Icon className="w-5 h-5" />
                {sidebarOpen && <span className="capitalize">{view}</span>}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{currentView}</h1>
              <p className="text-gray-600">Welcome back, {profileSettings.name.split(' ')[0]}!</p>
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
              <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold">
                {profileSettings.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Dashboard View */}
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
                    {viewingBookings.map((viewing) => (
                      <div key={viewing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{viewing.prospectName}</p>
                          <p className="text-sm text-gray-600">{viewing.property}</p>
                          <p className="text-xs text-gray-500">{viewing.date} at {viewing.time}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          viewing.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {viewing.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Maintenance Overview</h2>
                  <div className="space-y-3">
                    {maintenanceRequests.map(request => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{request.property} - {request.unit}</p>
                          <p className="text-sm text-gray-600">{request.issue}</p>
                          <p className="text-xs text-gray-500">{request.date} at {request.scheduledTime}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Viewings View */}
          {currentView === 'viewings' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Property Viewing Bookings</h2>
                <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition">
                  <Download className="w-5 h-5" />
                  Export
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
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {viewing.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {viewing.phone}
                            </div>
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
                          <button 
                            onClick={() => handleUpdateViewingStatus(viewing.id, 'confirmed')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirm
                          </button>
                          <button 
                            onClick={() => handleUpdateViewingStatus(viewing.id, 'cancelled')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </>
                      )}
                      {viewing.status === 'confirmed' && (
                        <button 
                          onClick={() => handleUpdateViewingStatus(viewing.id, 'completed')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Completed
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedViewing(viewing)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar View */}
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
                    <div key={day} className="p-3 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7">
                  {(() => {
                    const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
                    const cells = [];
                    
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      cells.push(
                        <div key={`empty-${i}`} className="min-h-24 p-2 border-r border-b border-gray-200 bg-gray-50"></div>
                      );
                    }
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      const events = getEventsForDate(day);
                      const today = new Date().getDate();
                      const isToday = day === today;
                      
                      cells.push(
                        <div key={day} className={`min-h-24 p-2 border-r border-b border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
                          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-900' : 'text-gray-700'}`}>
                            {day}
                          </div>
                          <div className="space-y-1">
                            {events.map(event => (
                              <div 
                                key={event.id}
                                className={`text-xs p-1 rounded ${
                                  event.type === 'viewing' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                                }`}
                              >
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
                  {calendarEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          event.type === 'viewing' ? 'bg-blue-100 text-blue-900' : 'bg-orange-100 text-orange-900'
                        }`}>
                          {event.type === 'viewing' ? <Eye className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.type === 'viewing' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {event.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other Views Placeholder */}
          {['properties', 'maintenance', 'tenants', 'payments', 'settings'].includes(currentView) && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{currentView.charAt(0).toUpperCase() + currentView.slice(1)} View</h3>
              <p className="text-gray-600">This section will display {currentView} management features</p>
            </div>
          )}
        </div>
      </div>

      {/* Viewing Details Modal */}
      {selectedViewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Viewing Details</h3>
              <button onClick={() => setSelectedViewing(null)}>
                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
              </button>
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
                  <div className="flex items-center text-gray-700">
                    <Mail className="w-5 h-5 mr-2 text-[#003366]" />
                    {selectedViewing.email}
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Phone className="w-5 h-5 mr-2 text-[#003366]" />
                    {selectedViewing.phone}
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Appointment Details</h5>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-2 text-[#003366]" />
                    {selectedViewing.date} at {selectedViewing.time}
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Clock className="w-5 h-5 mr-2 text-[#003366]" />
                    Booked: {selectedViewing.bookedAt}
                  </div>
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
                <Mail className="w-5 h-5" />
                Send Message
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition">
                <Phone className="w-5 h-5" />
                Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
};

export default LandlordDashboard;