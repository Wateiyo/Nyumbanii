import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Plus,
  Filter
} from 'lucide-react';
import {
  generateICalCalendar,
  downloadICalFile,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  rentDueToCalendarEvent,
  maintenanceToCalendarEvent,
  leaseExpiryToCalendarEvent
} from '../utils/calendarUtils';

const EnhancedCalendar = ({
  tenants = [],
  maintenanceRequests = [],
  showRentDue = true,
  showMaintenance = true,
  showLeaseExpiry = true,
  onEventClick = null
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, rent, maintenance, lease

  // Get calendar data
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate events
  const getEventsForDate = (day) => {
    const events = [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

    // Rent due events
    if (showRentDue && (filterType === 'all' || filterType === 'rent')) {
      tenants.forEach(tenant => {
        const rentDueDay = tenant.rentDueDay || 5;
        if (day === rentDueDay) {
          events.push({
            type: 'rent',
            title: `Rent Due - ${tenant.name}`,
            tenant,
            color: 'bg-blue-500',
            icon: '💰'
          });
        }
      });
    }

    // Maintenance events
    if (showMaintenance && (filterType === 'all' || filterType === 'maintenance')) {
      maintenanceRequests.forEach(request => {
        if (request.scheduledDate) {
          const scheduledDate = request.scheduledDate.toDate
            ? request.scheduledDate.toDate()
            : new Date(request.scheduledDate);

          if (
            scheduledDate.getDate() === day &&
            scheduledDate.getMonth() === currentDate.getMonth() &&
            scheduledDate.getFullYear() === currentDate.getFullYear()
          ) {
            events.push({
              type: 'maintenance',
              title: request.issue,
              request,
              color: request.status === 'completed' ? 'bg-green-500' : 'bg-orange-500',
              icon: '🔧'
            });
          }
        }
      });
    }

    // Lease expiry reminders (30 days before)
    if (showLeaseExpiry && (filterType === 'all' || filterType === 'lease')) {
      tenants.forEach(tenant => {
        if (tenant.leaseEndDate) {
          const leaseEnd = tenant.leaseEndDate.toDate
            ? tenant.leaseEndDate.toDate()
            : new Date(tenant.leaseEndDate);

          const reminderDate = new Date(leaseEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

          if (
            reminderDate.getDate() === day &&
            reminderDate.getMonth() === currentDate.getMonth() &&
            reminderDate.getFullYear() === currentDate.getFullYear()
          ) {
            events.push({
              type: 'lease',
              title: `Lease Expiry - ${tenant.name}`,
              tenant,
              color: 'bg-red-500',
              icon: '📋'
            });
          }
        }
      });
    }

    return events;
  };

  // Export functions
  const exportAllEvents = () => {
    const allEvents = [];

    // Add rent due events
    if (showRentDue) {
      tenants.forEach(tenant => {
        allEvents.push(rentDueToCalendarEvent(tenant));
      });
    }

    // Add maintenance events
    if (showMaintenance) {
      maintenanceRequests
        .filter(req => req.scheduledDate)
        .forEach(request => {
          allEvents.push(maintenanceToCalendarEvent(request));
        });
    }

    // Add lease expiry events
    if (showLeaseExpiry) {
      tenants
        .filter(tenant => tenant.leaseEndDate)
        .forEach(tenant => {
          allEvents.push(leaseExpiryToCalendarEvent(tenant));
        });
    }

    const icsContent = generateICalCalendar(allEvents, 'Nyumbanii Calendar');
    downloadICalFile(icsContent, 'nyumbanii-calendar');
    setShowExportMenu(false);
  };

  const exportMonthEvents = () => {
    const monthEvents = [];
    const daysInMonth = getDaysInMonth(currentDate);

    for (let day = 1; day <= daysInMonth; day++) {
      const events = getEventsForDate(day);

      events.forEach(event => {
        if (event.type === 'rent' && event.tenant) {
          monthEvents.push(rentDueToCalendarEvent(event.tenant));
        } else if (event.type === 'maintenance' && event.request) {
          monthEvents.push(maintenanceToCalendarEvent(event.request));
        } else if (event.type === 'lease' && event.tenant) {
          monthEvents.push(leaseExpiryToCalendarEvent(event.tenant));
        }
      });
    }

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const icsContent = generateICalCalendar(monthEvents, `Nyumbanii - ${monthName}`);
    downloadICalFile(icsContent, `nyumbanii-${monthName.replace(' ', '-').toLowerCase()}`);
    setShowExportMenu(false);
  };

  const addToGoogleCalendar = (event) => {
    let calendarEvent;

    if (event.type === 'rent' && event.tenant) {
      calendarEvent = rentDueToCalendarEvent(event.tenant);
    } else if (event.type === 'maintenance' && event.request) {
      calendarEvent = maintenanceToCalendarEvent(event.request);
    } else if (event.type === 'lease' && event.tenant) {
      calendarEvent = leaseExpiryToCalendarEvent(event.tenant);
    }

    if (calendarEvent) {
      const url = generateGoogleCalendarUrl(calendarEvent);
      window.open(url, '_blank');
    }
  };

  const addToOutlookCalendar = (event) => {
    let calendarEvent;

    if (event.type === 'rent' && event.tenant) {
      calendarEvent = rentDueToCalendarEvent(event.tenant);
    } else if (event.type === 'maintenance' && event.request) {
      calendarEvent = maintenanceToCalendarEvent(event.request);
    } else if (event.type === 'lease' && event.tenant) {
      calendarEvent = leaseExpiryToCalendarEvent(event.tenant);
    }

    if (calendarEvent) {
      const url = generateOutlookCalendarUrl(calendarEvent);
      window.open(url, '_blank');
    }
  };

  // Render calendar
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() &&
                         today.getFullYear() === currentDate.getFullYear();

  const calendarDays = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const events = getEventsForDate(day);
    const isToday = isCurrentMonth && day === today.getDate();
    const isSelected = selectedDate?.getDate() === day &&
                      selectedDate?.getMonth() === currentDate.getMonth() &&
                      selectedDate?.getFullYear() === currentDate.getFullYear();

    calendarDays.push(
      <div
        key={day}
        onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
        className={`h-24 border border-gray-200 p-2 cursor-pointer transition-colors hover:bg-blue-50 ${
          isToday ? 'bg-blue-100 ring-2 ring-blue-500' : ''
        } ${isSelected ? 'bg-blue-50' : ''}`}
      >
        <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
          {day}
        </div>
        <div className="space-y-1 overflow-y-auto max-h-16">
          {events.slice(0, 2).map((event, idx) => (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                if (onEventClick) onEventClick(event);
              }}
              className={`text-xs ${event.color} text-white px-1 py-0.5 rounded truncate hover:opacity-80 transition`}
              title={event.title}
            >
              <span className="mr-1">{event.icon}</span>
              {event.title}
            </div>
          ))}
          {events.length > 2 && (
            <div className="text-xs text-gray-500 font-medium">
              +{events.length - 2} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-[#003366] to-[#004488] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Calendar & Events
          </h3>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm appearance-none pr-8 cursor-pointer hover:bg-white/20 transition"
              >
                <option value="all" className="text-gray-900">All Events</option>
                <option value="rent" className="text-gray-900">Rent Only</option>
                <option value="maintenance" className="text-gray-900">Maintenance Only</option>
                <option value="lease" className="text-gray-900">Lease Expiry</option>
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
            </div>

            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm hover:bg-white/20 transition flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-56 z-10">
                  <button
                    onClick={exportAllEvents}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download All Events (.ics)
                  </button>
                  <button
                    onClick={exportMonthEvents}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download This Month (.ics)
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-4 py-1 text-xs text-gray-500 font-semibold">
                    Import .ics file to:
                  </div>
                  <div className="px-4 py-1 text-xs text-gray-600">
                    • Google Calendar<br />
                    • Apple Calendar<br />
                    • Outlook<br />
                    • Any calendar app
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={getPreviousMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3">
            <h4 className="text-lg font-semibold text-white">{monthName}</h4>
            <button
              onClick={goToToday}
              className="px-3 py-1 bg-white/10 border border-white/20 text-white rounded-lg text-sm hover:bg-white/20 transition"
            >
              Today
            </button>
          </div>

          <button
            onClick={getNextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-700">Rent Due</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-gray-700">Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-700">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-700">Lease Expiry</span>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="py-2 text-center text-sm font-semibold text-gray-700 bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <h5 className="font-semibold text-gray-900 mb-3">
            Events on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h5>
          {getEventsForDate(selectedDate.getDate()).length === 0 ? (
            <p className="text-sm text-gray-600">No events scheduled</p>
          ) : (
            <div className="space-y-2">
              {getEventsForDate(selectedDate.getDate()).map((event, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{event.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{event.title}</div>
                      <div className="text-xs text-gray-600 capitalize">{event.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => addToGoogleCalendar(event)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Add to Google Calendar"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => addToOutlookCalendar(event)}
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition"
                      title="Add to Outlook"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedCalendar;
