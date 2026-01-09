import { useState, useEffect } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react';

const CalendarWidget = ({ events = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Get calendar data for current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get events for a specific date
  const getEventsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => {
      if (event.date) {
        // Handle Firestore timestamp
        const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
        const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
        return eventDateStr === dateStr;
      }
      return false;
    });
  };

  // Generate calendar grid
  const calendarDays = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ day: null, isEmpty: true });
  }

  // Actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    calendarDays.push({
      day,
      isEmpty: false,
      isToday: isCurrentMonth && day === todayDate,
      events: dayEvents
    });
  }

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate ICS file for calendar export
  const generateICSFile = () => {
    const icsEvents = events.map(event => {
      const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
      const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      return `BEGIN:VEVENT
UID:${event.id}@nyumbanii.org
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.type === 'viewing' ? 'Property Viewing' : 'Maintenance Request'} - ${event.property || 'Property'}
DESCRIPTION:${event.type === 'viewing' ? `Viewing with ${event.name || 'Client'}` : `Maintenance: ${event.issue || event.description || 'Issue'}`}
LOCATION:${event.property || ''}
STATUS:CONFIRMED
END:VEVENT`;
    }).join('\n');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Nyumbanii//Property Management//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Nyumbanii Schedule
X-WR-TIMEZONE:Africa/Nairobi
${icsEvents}
END:VCALENDAR`;

    return icsContent;
  };

  // Download ICS file
  const downloadICSFile = () => {
    const icsContent = generateICSFile();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nyumbanii-schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add to Google Calendar
  const addToGoogleCalendar = (event) => {
    const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
    const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0];
    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0];

    const title = encodeURIComponent(event.type === 'viewing' ? `Property Viewing - ${event.property}` : `Maintenance - ${event.property}`);
    const details = encodeURIComponent(event.type === 'viewing' ? `Viewing with ${event.name}` : `${event.issue || event.description}`);
    const location = encodeURIComponent(event.property || '');

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  // Add to Outlook Calendar
  const addToOutlookCalendar = (event) => {
    const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
    const startDate = eventDate.toISOString();
    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString();

    const title = encodeURIComponent(event.type === 'viewing' ? `Property Viewing - ${event.property}` : `Maintenance - ${event.property}`);
    const body = encodeURIComponent(event.type === 'viewing' ? `Viewing with ${event.name}` : `${event.issue || event.description}`);
    const location = encodeURIComponent(event.property || '');

    const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${body}&startdt=${startDate}&enddt=${endDate}&location=${location}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {events.length} {events.length === 1 ? 'event' : 'events'} this month
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Today
          </button>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={downloadICSFile}
            className="ml-2 px-4 py-2 text-sm font-medium text-white bg-[#003366] dark:bg-blue-600 hover:bg-[#002244] dark:hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
            title="Download calendar file (.ics) to import into any calendar app"
          >
            <Download className="w-4 h-4" />
            Export Calendar
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((dayData, index) => (
            <div
              key={index}
              onClick={() => !dayData.isEmpty && setSelectedDate(dayData.day)}
              className={`aspect-square min-h-[80px] sm:min-h-[100px] border-b border-gray-200 dark:border-gray-700 p-2 transition cursor-pointer ${
                (index % 7) !== 6 ? 'border-r' : ''
              } ${
                dayData.isEmpty
                  ? 'bg-gray-50 dark:bg-gray-900 cursor-default'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${
                dayData.isToday
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : ''
              }`}
            >
              {!dayData.isEmpty && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    dayData.isToday
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {dayData.day}
                    {dayData.isToday && (
                      <span className="ml-1 text-xs">(Today)</span>
                    )}
                  </div>

                  {dayData.events.length > 0 && (
                    <div className="space-y-1">
                      {dayData.events.slice(0, 2).map((event, idx) => (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            // You can add event details modal here
                          }}
                          className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                            event.type === 'viewing'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                          }`}
                        >
                          <CalendarCheck className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{event.property || 'Event'}</span>
                        </div>
                      ))}
                      {dayData.events.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-1.5">
                          +{dayData.events.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Integration Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Sync with Your Calendar
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add your Nyumbanii schedule to your personal calendar app
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const allEvents = events.map(event => addToGoogleCalendar(event));
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
            </svg>
            Google Calendar
          </button>

          <button
            onClick={() => {
              const allEvents = events.map(event => addToOutlookCalendar(event));
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 22h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2zm-2-2V10h14v10H5zm2-8h10v8H7v-8z"/>
            </svg>
            Outlook
          </button>

          <button
            onClick={downloadICSFile}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Download className="w-5 h-5" />
            Download .ics
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          💡 Tip: Download the .ics file to import into Apple Calendar, or any other calendar app
        </p>
      </div>
    </div>
  );
};

export default CalendarWidget;
