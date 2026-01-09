/**
 * Calendar utilities for generating iCalendar (.ics) files
 * Compatible with Google Calendar, Apple Calendar, Outlook, etc.
 */

/**
 * Format date for iCalendar (YYYYMMDDTHHMMSSZ)
 * @param {Date} date - JavaScript Date object
 * @returns {string} - Formatted date string
 */
const formatICalDate = (date) => {
  const pad = (num) => String(num).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

/**
 * Generate unique identifier for calendar event
 * @returns {string} - Unique ID
 */
const generateEventId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@nyumbanii.com`;
};

/**
 * Escape special characters for iCalendar format
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
const escapeICalText = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generate iCalendar (.ics) file content for a single event
 * @param {Object} event - Event object
 * @param {string} event.title - Event title
 * @param {string} event.description - Event description
 * @param {Date} event.startDate - Start date
 * @param {Date} event.endDate - End date (optional, defaults to 1 hour after start)
 * @param {string} event.location - Event location (optional)
 * @param {string} event.status - Event status (optional)
 * @returns {string} - iCalendar file content
 */
export const generateICalEvent = (event) => {
  const {
    title,
    description = '',
    startDate,
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000), // Default: 1 hour duration
    location = '',
    status = 'CONFIRMED'
  } = event;

  const now = new Date();
  const eventId = generateEventId();

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nyumbanii//Property Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${eventId}`,
    `DTSTAMP:${formatICalDate(now)}`,
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${escapeICalText(title)}`,
    `DESCRIPTION:${escapeICalText(description)}`,
    location ? `LOCATION:${escapeICalText(location)}` : '',
    `STATUS:${status}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICalText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line).join('\r\n');
};

/**
 * Generate iCalendar (.ics) file content for multiple events
 * @param {Array} events - Array of event objects
 * @param {string} calendarName - Name of the calendar
 * @returns {string} - iCalendar file content
 */
export const generateICalCalendar = (events, calendarName = 'Nyumbanii Calendar') => {
  const now = new Date();

  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nyumbanii//Property Management//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    'X-WR-TIMEZONE:Africa/Nairobi',
    'METHOD:PUBLISH'
  ].join('\r\n');

  const eventStrings = events.map(event => {
    const {
      title,
      description = '',
      startDate,
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000),
      location = '',
      status = 'CONFIRMED'
    } = event;

    const eventId = generateEventId();

    return [
      'BEGIN:VEVENT',
      `UID:${eventId}`,
      `DTSTAMP:${formatICalDate(now)}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${escapeICalText(title)}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      location ? `LOCATION:${escapeICalText(location)}` : '',
      `STATUS:${status}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICalText(title)}`,
      'END:VALARM',
      'END:VEVENT'
    ].filter(line => line).join('\r\n');
  });

  return [
    header,
    ...eventStrings,
    'END:VCALENDAR'
  ].join('\r\n');
};

/**
 * Download iCalendar file
 * @param {string} content - iCalendar content
 * @param {string} filename - Filename without extension
 */
export const downloadICalFile = (content, filename = 'event') => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Generate Google Calendar URL
 * @param {Object} event - Event object
 * @returns {string} - Google Calendar add event URL
 */
export const generateGoogleCalendarUrl = (event) => {
  const {
    title,
    description = '',
    startDate,
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000),
    location = ''
  } = event;

  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    location: location,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook/Office 365 Calendar URL
 * @param {Object} event - Event object
 * @returns {string} - Outlook add event URL
 */
export const generateOutlookCalendarUrl = (event) => {
  const {
    title,
    description = '',
    startDate,
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000),
    location = ''
  } = event;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    body: description,
    location: location,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString()
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Convert rent due date to calendar event
 * @param {Object} tenant - Tenant object
 * @returns {Object} - Calendar event object
 */
export const rentDueToCalendarEvent = (tenant) => {
  const dueDay = tenant.rentDueDay || 5;
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

  // If due date has passed this month, use next month
  if (dueDate < now) {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  return {
    title: `Rent Due - ${tenant.name}`,
    description: `Rent payment due for ${tenant.name}\nProperty: ${tenant.property || 'N/A'}\nAmount: KSH ${tenant.rent?.toLocaleString() || 0}`,
    startDate: new Date(dueDate.setHours(9, 0, 0, 0)),
    endDate: new Date(dueDate.setHours(10, 0, 0, 0)),
    location: tenant.property || '',
    status: 'CONFIRMED'
  };
};

/**
 * Convert maintenance request to calendar event
 * @param {Object} request - Maintenance request object
 * @returns {Object} - Calendar event object
 */
export const maintenanceToCalendarEvent = (request) => {
  const scheduledDate = request.scheduledDate?.toDate
    ? request.scheduledDate.toDate()
    : new Date();

  const duration = request.estimatedDuration || '2 hours';
  const durationHours = parseInt(duration) || 2;

  return {
    title: `Maintenance: ${request.issue}`,
    description: `${request.description || request.issue}\n\nProperty: ${request.property || 'N/A'}\nStatus: ${request.status || 'pending'}\nReported by: ${request.tenantName || 'N/A'}${request.estimatedCost ? `\nEstimated Cost: KSH ${request.estimatedCost.toLocaleString()}` : ''}`,
    startDate: scheduledDate,
    endDate: new Date(scheduledDate.getTime() + durationHours * 60 * 60 * 1000),
    location: request.property || '',
    status: request.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'
  };
};

/**
 * Convert viewing to calendar event
 * @param {Object} viewing - Viewing object
 * @returns {Object} - Calendar event object
 */
export const viewingToCalendarEvent = (viewing) => {
  const viewingDate = viewing.date?.toDate
    ? viewing.date.toDate()
    : new Date();

  // Parse time if available, otherwise default to 10:00
  const timeStr = viewing.time || '10:00';
  const [hours, minutes] = timeStr.split(':').map(Number);

  const startDate = new Date(viewingDate);
  startDate.setHours(hours || 10, minutes || 0, 0, 0);

  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  return {
    title: `Property Viewing - ${viewing.property}`,
    description: `Property viewing at ${viewing.property}\nProspect: ${viewing.prospectName || viewing.name || 'N/A'}\nStatus: ${viewing.status || 'pending'}\nContact: ${viewing.prospectPhone || viewing.phone || 'N/A'}`,
    startDate,
    endDate,
    location: viewing.property || '',
    status: viewing.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'
  };
};

/**
 * Convert lease expiry to calendar event
 * @param {Object} tenant - Tenant object
 * @returns {Object} - Calendar event object
 */
export const leaseExpiryToCalendarEvent = (tenant) => {
  const leaseEnd = tenant.leaseEndDate?.toDate
    ? tenant.leaseEndDate.toDate()
    : new Date();

  // Set reminder 30 days before lease expiry
  const reminderDate = new Date(leaseEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    title: `Lease Expiry Reminder - ${tenant.name}`,
    description: `Lease expiring for ${tenant.name}\nProperty: ${tenant.property || 'N/A'}\nLease End Date: ${leaseEnd.toLocaleDateString()}\n\nAction required: Contact tenant regarding lease renewal`,
    startDate: new Date(reminderDate.setHours(9, 0, 0, 0)),
    endDate: new Date(reminderDate.setHours(10, 0, 0, 0)),
    location: tenant.property || '',
    status: 'CONFIRMED'
  };
};

export default {
  generateICalEvent,
  generateICalCalendar,
  downloadICalFile,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  rentDueToCalendarEvent,
  maintenanceToCalendarEvent,
  viewingToCalendarEvent,
  leaseExpiryToCalendarEvent
};
