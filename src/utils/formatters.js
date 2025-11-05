/**
 * Utility functions for formatting currency, dates, and calculations
 * These functions use landlord settings to provide consistent formatting
 */

/**
 * Format currency based on landlord's currency preference
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (KSH, USD, EUR, GBP)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'KSH') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return currency === 'KSH' ? 'KSH 0.00' : '$0.00';
  }

  const currencySymbols = {
    'KSH': 'KSH ',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);

  return `${currencySymbols[currency] || 'KSH '}${formatted}`;
};

/**
 * Format currency for compact display (e.g., 1.5K, 2.3M)
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code
 * @returns {string} Compact formatted currency
 */
export const formatCurrencyCompact = (amount, currency = 'KSH') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return currency === 'KSH' ? 'KSH 0' : '$0';
  }

  const currencySymbols = {
    'KSH': 'KSH ',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  let formatted;
  if (amount >= 1000000) {
    formatted = (amount / 1000000).toFixed(1) + 'M';
  } else if (amount >= 1000) {
    formatted = (amount / 1000).toFixed(1) + 'K';
  } else {
    formatted = amount.toFixed(0);
  }

  return `${currencySymbols[currency] || 'KSH '}${formatted}`;
};

/**
 * Format date based on landlord's date format preference
 * @param {Date|string|number} date - The date to format
 * @param {string} format - Date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return 'N/A';

  const d = new Date(date);

  // Check if date is valid
  if (isNaN(d.getTime())) return 'Invalid Date';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

/**
 * Format date with time
 * @param {Date|string|number} date - The date to format
 * @param {string} format - Date format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, format = 'DD/MM/YYYY') => {
  if (!date) return 'N/A';

  const d = new Date(date);

  if (isNaN(d.getTime())) return 'Invalid Date';

  const dateStr = formatDate(date, format);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${dateStr} ${hours}:${minutes}`;
};

/**
 * Format date in relative terms (e.g., "2 days ago", "in 3 days")
 * @param {Date|string|number} date - The date to format
 * @returns {string} Relative date string
 */
export const formatRelativeDate = (date) => {
  if (!date) return 'N/A';

  const d = new Date(date);
  const now = new Date();

  if (isNaN(d.getTime())) return 'Invalid Date';

  const diffMs = d - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
  } else if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return absDays === 1 ? 'Yesterday' : `${absDays} days ago`;
  } else if (diffHours > 0) {
    return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffHours < 0) {
    return `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `In ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else if (diffMinutes < 0) {
    return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Calculate rent amount with late fees
 * @param {number} rentAmount - Base rent amount
 * @param {Date|string} dueDate - Rent due date
 * @param {Date|string} paidDate - Payment date (defaults to today)
 * @param {Object} settings - Financial settings object
 * @returns {Object} { totalAmount, lateFee, daysLate, isLate }
 */
export const calculateRentWithLateFee = (rentAmount, dueDate, paidDate = new Date(), settings = {}) => {
  const {
    lateFeeEnabled = false,
    lateFeePercentage = 5,
    gracePeriodDays = 3
  } = settings;

  const due = new Date(dueDate);
  const paid = new Date(paidDate);

  // Calculate days late
  const diffMs = paid - due;
  const daysLate = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Check if payment is late (beyond grace period)
  const isLate = daysLate > gracePeriodDays;

  // Calculate late fee
  let lateFee = 0;
  if (lateFeeEnabled && isLate) {
    lateFee = rentAmount * (lateFeePercentage / 100);
  }

  const totalAmount = rentAmount + lateFee;

  return {
    totalAmount,
    lateFee,
    daysLate: Math.max(0, daysLate),
    isLate,
    gracePeriodRemaining: Math.max(0, gracePeriodDays - daysLate)
  };
};

/**
 * Calculate days until rent is due
 * @param {Date|string} dueDate - Rent due date
 * @returns {number} Days until due (negative if overdue)
 */
export const calculateDaysUntilDue = (dueDate) => {
  if (!dueDate) return 0;

  const due = new Date(dueDate);
  const now = new Date();

  // Set time to midnight for accurate day calculation
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffMs = due - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Get payment status based on due date
 * @param {Date|string} dueDate - Rent due date
 * @param {boolean} isPaid - Whether rent has been paid
 * @returns {Object} { status, color, label }
 */
export const getPaymentStatus = (dueDate, isPaid = false) => {
  if (isPaid) {
    return {
      status: 'paid',
      color: 'green',
      label: 'Paid'
    };
  }

  const daysUntil = calculateDaysUntilDue(dueDate);

  if (daysUntil < 0) {
    return {
      status: 'overdue',
      color: 'red',
      label: `Overdue (${Math.abs(daysUntil)} days)`
    };
  } else if (daysUntil === 0) {
    return {
      status: 'due_today',
      color: 'orange',
      label: 'Due Today'
    };
  } else if (daysUntil <= 7) {
    return {
      status: 'due_soon',
      color: 'yellow',
      label: `Due in ${daysUntil} days`
    };
  } else {
    return {
      status: 'upcoming',
      color: 'gray',
      label: `Due in ${daysUntil} days`
    };
  }
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return 'N/A';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format for Kenyan numbers
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Calculate occupancy rate
 * @param {number} occupiedUnits - Number of occupied units
 * @param {number} totalUnits - Total number of units
 * @returns {number} Occupancy rate percentage
 */
export const calculateOccupancyRate = (occupiedUnits, totalUnits) => {
  if (!totalUnits || totalUnits === 0) return 0;
  return (occupiedUnits / totalUnits) * 100;
};

/**
 * Generate invoice number
 * @param {string} prefix - Invoice prefix from settings
 * @returns {string} Generated invoice number
 */
export const generateInvoiceNumber = (prefix = 'INV-2025-') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}-${random}`;
};

/**
 * Generate receipt number
 * @param {string} prefix - Receipt prefix from settings
 * @returns {string} Generated receipt number
 */
export const generateReceiptNumber = (prefix = 'RCP-2025-') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}-${random}`;
};

/**
 * Check if user can add tenants based on role and permissions
 * @param {string} userRole - User role (landlord, property_manager, maintenance, tenant)
 * @param {Object} teamPermissions - Team permissions settings
 * @returns {boolean} Whether user can add tenants
 */
export const canAddTenant = (userRole, teamPermissions = {}) => {
  if (userRole === 'landlord') return true;
  if (userRole === 'property_manager') {
    return teamPermissions.propertyManagerCanAddTenants || false;
  }
  return false;
};

/**
 * Check if user can edit rent amounts
 * @param {string} userRole - User role
 * @param {Object} teamPermissions - Team permissions settings
 * @returns {boolean} Whether user can edit rent
 */
export const canEditRent = (userRole, teamPermissions = {}) => {
  if (userRole === 'landlord') return true;
  if (userRole === 'property_manager') {
    return teamPermissions.propertyManagerCanEditRent || false;
  }
  return false;
};

/**
 * Check if user can approve maintenance requests
 * @param {string} userRole - User role
 * @param {Object} teamPermissions - Team permissions settings
 * @returns {boolean} Whether user can approve maintenance
 */
export const canApproveMaintenance = (userRole, teamPermissions = {}) => {
  if (userRole === 'landlord') return true;
  if (userRole === 'property_manager') {
    return teamPermissions.propertyManagerCanApproveMaintenance || false;
  }
  return false;
};

/**
 * Check if user can view financial reports
 * @param {string} userRole - User role
 * @param {Object} teamPermissions - Team permissions settings
 * @returns {boolean} Whether user can view financial reports
 */
export const canViewFinancials = (userRole, teamPermissions = {}) => {
  if (userRole === 'landlord') return true;
  if (userRole === 'property_manager') {
    return teamPermissions.propertyManagerCanViewFinancials || false;
  }
  return false;
};

/**
 * Check if user can manage properties
 * @param {string} userRole - User role
 * @param {Object} teamPermissions - Team permissions settings
 * @returns {boolean} Whether user can manage properties
 */
export const canManageProperties = (userRole, teamPermissions = {}) => {
  if (userRole === 'landlord') return true;
  if (userRole === 'property_manager') {
    return teamPermissions.propertyManagerCanManageProperties || false;
  }
  return false;
};

/**
 * Check if user can send messages to tenants
 * @param {string} userRole - User role
 * @param {Object} teamPermissions - Team permissions settings
 * @returns {boolean} Whether user can send messages
 */
export const canSendMessages = (userRole, teamPermissions = {}) => {
  if (userRole === 'landlord') return true;
  if (userRole === 'property_manager') {
    return teamPermissions.propertyManagerCanSendMessages || false;
  }
  if (userRole === 'maintenance') {
    return teamPermissions.maintenanceCanSendMessages || false;
  }
  return false;
};

/**
 * Check if user can manage team members
 * @param {string} userRole - User role
 * @returns {boolean} Whether user can manage team
 */
export const canManageTeam = (userRole) => {
  return userRole === 'landlord';
};

export default {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  calculateRentWithLateFee,
  calculateDaysUntilDue,
  getPaymentStatus,
  formatPhoneNumber,
  formatPercentage,
  calculateOccupancyRate,
  generateInvoiceNumber,
  generateReceiptNumber,
  canAddTenant,
  canEditRent,
  canApproveMaintenance,
  canViewFinancials,
  canManageProperties,
  canSendMessages,
  canManageTeam
};
