import axios from 'axios';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;

// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    annualPrice: 0,
    currency: 'KES',
    interval: 'monthly',
    features: [
      '14 Days Free Trial',
      'Up to 2 Properties',
      'Up to 10 Tenants',
      'Basic Payment Tracking',
      'Email Support'
    ],
    propertyLimit: 2,
    tenantLimit: 10,
    durationDays: 14,
    popular: false
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 99900, // KES 999/month in kobo
    annualPrice: 959040, // KES 9,590.40/year (20% discount) in kobo
    currency: 'KES',
    interval: 'monthly',
    features: [
      'Up to 5 Properties',
      'Up to 500 Tenants',
      'Payment Tracking & Reminders',
      'Maintenance Request Management',
      '2 Team Member Accounts',
      'Basic Reports & Analytics',
      'Email Support'
    ],
    propertyLimit: 5,
    tenantLimit: 500,
    teamMemberLimit: 2,
    popular: false
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: 199900, // KES 1,999/month in kobo
    annualPrice: 1919040, // KES 19,190.40/year (20% discount) in kobo
    currency: 'KES',
    interval: 'monthly',
    features: [
      'Up to 20 Properties',
      'Up to 2,000 Tenants',
      'Advanced Payment Tracking',
      '5 Team Member Accounts',
      'Maintenance Management',
      'Advanced Analytics & Reports',
      'Bulk SMS & Email Messaging',
      'Document Management',
      'Priority Email Support'
    ],
    propertyLimit: 20,
    tenantLimit: 2000,
    teamMemberLimit: 5,
    popular: true
  },
  BUSINESS: {
    id: 'business',
    name: 'Business',
    price: 399900, // KES 3,999/month in kobo
    annualPrice: 3839040, // KES 38,390.40/year (20% discount) in kobo
    currency: 'KES',
    interval: 'monthly',
    features: [
      'Up to 50 Properties',
      'Up to 5,000 Tenants',
      'All Professional Features',
      '10 Team Member Accounts',
      'Custom Branding & Logo',
      'API Access for Integrations',
      'Advanced Team Permissions',
      'Automated Workflows',
      'Custom Report Builder',
      'Priority Phone & Email Support'
    ],
    propertyLimit: 50,
    tenantLimit: 5000,
    teamMemberLimit: 10,
    popular: false
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Contact for pricing
    annualPrice: null, // Contact for pricing
    currency: 'KES',
    interval: 'custom',
    contactForPricing: true,
    features: [
      'Unlimited Properties',
      'Unlimited Tenants',
      'All Business Features',
      'Custom Solutions & Integrations',
      'Dedicated Support',
      'Priority Email & Phone Support',
      'Advanced Analytics & Reporting',
      'Custom Training & Onboarding',
      'Flexible Contract Terms'
    ],
    propertyLimit: -1,
    tenantLimit: -1,
    popular: false
  }
};

/**
 * Load Paystack inline script dynamically
 */
export const loadPaystackScript = () => {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve(window.PaystackPop);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.body.appendChild(script);
  });
};

/**
 * Initialize Paystack payment
 * @param {Object} config - Payment configuration
 * @param {string} config.email - Customer email
 * @param {number} config.amount - Amount in kobo (smallest currency unit)
 * @param {string} config.reference - Unique transaction reference
 * @param {string} config.metadata - Additional metadata
 * @param {Function} config.onSuccess - Success callback
 * @param {Function} config.onClose - Close callback
 */
export const initializePayment = async ({
  email,
  amount,
  reference,
  metadata = {},
  onSuccess,
  onClose
}) => {
  try {
    const PaystackPop = await loadPaystackScript();

    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount,
      ref: reference,
      currency: 'KES',
      metadata: {
        custom_fields: [
          {
            display_name: 'Subscription Plan',
            variable_name: 'subscription_plan',
            value: metadata.plan || 'basic'
          },
          {
            display_name: 'User ID',
            variable_name: 'user_id',
            value: metadata.userId || ''
          }
        ],
        ...metadata
      },
      onSuccess: (transaction) => {
        console.log('Payment successful:', transaction);
        if (onSuccess) onSuccess(transaction);
      },
      onClose: () => {
        console.log('Payment popup closed');
        if (onClose) onClose();
      }
    });

    handler.openIframe();
  } catch (error) {
    console.error('Error initializing Paystack payment:', error);
    throw error;
  }
};

/**
 * Generate unique transaction reference
 * @param {string} userId - User ID
 * @param {string} planId - Subscription plan ID
 * @returns {string} Unique reference
 */
export const generateReference = (userId, planId) => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `NYM-${planId.toUpperCase()}-${userId.substring(0, 8)}-${timestamp}-${randomStr}`;
};

/**
 * Verify payment on backend
 * @param {string} reference - Transaction reference
 * @returns {Promise} Verification result
 */
export const verifyPayment = async (reference) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

/**
 * Calculate subscription end date
 * @param {string} interval - Subscription interval ('monthly' or 'yearly')
 * @returns {Date} End date
 */
export const calculateSubscriptionEndDate = (interval = 'monthly') => {
  const startDate = new Date();
  const endDate = new Date(startDate);

  if (interval === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (interval === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  return endDate;
};

/**
 * Check if subscription is active
 * @param {Object} subscription - Subscription object from Firestore
 * @returns {boolean} True if active
 */
export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;

  const { status, subscriptionEndDate } = subscription;

  if (status !== 'active') return false;

  if (!subscriptionEndDate) return false;

  const endDate = subscriptionEndDate.toDate ? subscriptionEndDate.toDate() : new Date(subscriptionEndDate);
  const now = new Date();

  return endDate > now;
};

/**
 * Get days remaining in subscription
 * @param {Object} subscription - Subscription object
 * @returns {number} Days remaining
 */
export const getDaysRemaining = (subscription) => {
  if (!subscription || !subscription.subscriptionEndDate) return 0;

  const endDate = subscription.subscriptionEndDate.toDate
    ? subscription.subscriptionEndDate.toDate()
    : new Date(subscription.subscriptionEndDate);
  const now = new Date();
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

/**
 * Format price for display
 * @param {number} amount - Amount in kobo
 * @param {string} currency - Currency code
 * @returns {string} Formatted price
 */
export const formatPrice = (amount, currency = 'KES') => {
  const price = amount / 100; // Convert from kobo to main currency
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
};

export default {
  SUBSCRIPTION_TIERS,
  loadPaystackScript,
  initializePayment,
  generateReference,
  verifyPayment,
  calculateSubscriptionEndDate,
  isSubscriptionActive,
  getDaysRemaining,
  formatPrice
};
