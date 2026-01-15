import React from 'react';
import {
  Home,
  Building,
  Users,
  Banknote,
  Wrench,
  Bell,
  Settings,
  MessageSquare,
  Calendar,
  FileText
} from 'lucide-react';

/**
 * Onboarding steps configuration for different user roles
 */

export const landlordOnboardingSteps = [
  {
    title: 'Welcome to Your Landlord Dashboard!',
    description: 'Let\'s take a quick tour of the powerful features that will help you manage your properties efficiently. This will only take 2 minutes.',
    icon: <Home className="w-8 h-8" />,
    features: [
      'Manage multiple properties and tenants',
      'Track rent payments automatically',
      'Handle maintenance requests',
      'Generate reports and receipts'
    ],
    tip: 'You can access this tour anytime from Settings > Help & Support'
  },
  {
    title: 'Property Management',
    description: 'Start by adding your properties! Each property can have multiple units, and you can track occupancy, rent amounts, and more.',
    icon: <Building className="w-8 h-8" />,
    features: [
      'Add properties with detailed information',
      'Manage units and their availability',
      'Set rent amounts and deposit requirements',
      'Upload property photos and documents'
    ],
    tip: 'Click on "Properties" in the sidebar to add your first property'
  },
  {
    title: 'Tenant Management',
    description: 'Keep track of all your tenants in one place. Add tenant details, assign them to units, and monitor their payment history.',
    icon: <Users className="w-8 h-8" />,
    features: [
      'Add and manage tenant profiles',
      'Track lease agreements and move-in dates',
      'View tenant payment history',
      'Send move-out notices when needed'
    ],
    tip: 'Navigate to "Tenants" to add your current tenants to the system'
  },
  {
    title: 'Payment Tracking',
    description: 'Never miss a payment! Track rent payments, send reminders, and generate receipts automatically.',
    icon: <Banknote className="w-8 h-8" />,
    features: [
      'Record M-Pesa and bank payments',
      'Auto-generate payment receipts',
      'Track late fees and payment history',
      'Send automated rent reminders via email'
    ],
    tip: 'Check "Payments" to see all transactions and record new payments'
  },
  {
    title: 'Maintenance Requests',
    description: 'Handle property maintenance efficiently. Receive requests from tenants, track progress, and approve estimates.',
    icon: <Wrench className="w-8 h-8" />,
    features: [
      'Receive maintenance requests from tenants',
      'Assign requests to maintenance staff',
      'Approve estimates and track costs',
      'View analytics on maintenance trends'
    ],
    tip: 'Go to "Maintenance" to see pending requests and their status'
  },
  {
    title: 'Communication & Notifications',
    description: 'Stay connected with your tenants and team. Send messages, receive notifications, and keep everyone informed.',
    icon: <MessageSquare className="w-8 h-8" />,
    features: [
      'Message tenants and team members',
      'Receive real-time notifications',
      'Share important announcements',
      'Track conversation history'
    ],
    tip: 'Use "Messages" to communicate directly with tenants and staff'
  },
  {
    title: 'You\'re All Set!',
    description: 'You now know the key features of your dashboard. Start adding properties and tenants to get the most out of Nyumbanii!',
    icon: <Settings className="w-8 h-8" />,
    features: [
      'Customize settings for your preferences',
      'Set up email notifications and reminders',
      'Manage your subscription plan',
      'Access help and support anytime'
    ],
    tip: 'Visit "Settings" to personalize your dashboard experience'
  }
];

export const tenantOnboardingSteps = [
  {
    title: 'Welcome to Your Tenant Dashboard!',
    description: 'We\'re excited to have you here! Let\'s explore the features that will make renting easier for you.',
    icon: <Home className="w-8 h-8" />,
    features: [
      'View your property and lease details',
      'Submit rent payments online',
      'Request maintenance services',
      'Communicate with your landlord'
    ],
    tip: 'This tour will help you navigate your dashboard in just a few minutes'
  },
  {
    title: 'Dashboard Overview',
    description: 'Your dashboard shows everything at a glance - upcoming payments, recent activity, and important announcements from your landlord.',
    icon: <Home className="w-8 h-8" />,
    features: [
      'See your current rent balance',
      'Check upcoming payment due dates',
      'View recent announcements',
      'Quick access to all features'
    ],
    tip: 'The dashboard is your home base - check it regularly for updates'
  },
  {
    title: 'Making Payments',
    description: 'Easily submit your rent payments and keep track of your payment history. Download receipts anytime you need them.',
    icon: <Banknote className="w-8 h-8" />,
    features: [
      'Submit M-Pesa or bank payment details',
      'View complete payment history',
      'Download payment receipts instantly',
      'Track late fees (if any)'
    ],
    tip: 'Go to "Payments" to submit your rent payment with transaction details'
  },
  {
    title: 'Maintenance Requests',
    description: 'Something broken? Submit maintenance requests directly through the app and track their progress in real-time.',
    icon: <Wrench className="w-8 h-8" />,
    features: [
      'Submit detailed maintenance requests',
      'Upload photos of the issue',
      'Track request status and updates',
      'Receive notifications on progress'
    ],
    tip: 'Use "Maintenance" to report issues - your landlord will be notified immediately'
  },
  {
    title: 'Documents & Notifications',
    description: 'Access your lease agreement, receipts, and important documents. Stay updated with notifications.',
    icon: <FileText className="w-8 h-8" />,
    features: [
      'View and download your lease agreement',
      'Access all payment receipts',
      'Receive important notifications',
      'Download documents anytime'
    ],
    tip: 'Check "Documents" for your lease and other important files'
  },
  {
    title: 'Messaging & Support',
    description: 'Need to reach your landlord? Use the messaging feature to communicate directly and get quick responses.',
    icon: <MessageSquare className="w-8 h-8" />,
    features: [
      'Send messages to your landlord',
      'Receive timely responses',
      'View conversation history',
      'Share concerns or questions'
    ],
    tip: 'Navigate to "Messages" to start a conversation with your landlord'
  },
  {
    title: 'Ready to Go!',
    description: 'You\'re all set to use your tenant dashboard! Explore the features and enjoy a seamless renting experience.',
    icon: <Settings className="w-8 h-8" />,
    features: [
      'Update your profile information',
      'Manage notification preferences',
      'Submit move-out notices when needed',
      'Access help and support'
    ],
    tip: 'Visit "Settings" to customize your experience and manage your profile'
  }
];

export const propertyManagerOnboardingSteps = [
  {
    title: 'Welcome, Property Manager!',
    description: 'Your dashboard is designed to help you efficiently manage properties on behalf of landlords. Let\'s explore the key features.',
    icon: <Building className="w-8 h-8" />,
    features: [
      'Manage multiple properties',
      'Oversee tenant relationships',
      'Handle maintenance coordination',
      'Track payments and reports'
    ],
    tip: 'This quick tour will help you get started in just a few minutes'
  },
  {
    title: 'Properties Under Management',
    description: 'View and manage all properties assigned to you. Add new properties and keep track of occupancy and performance.',
    icon: <Building className="w-8 h-8" />,
    features: [
      'View assigned properties',
      'Monitor occupancy rates',
      'Update property information',
      'Generate property reports'
    ],
    tip: 'Go to "Properties" to see all properties you\'re managing'
  },
  {
    title: 'Tenant Management',
    description: 'Manage tenant relationships, handle move-ins and move-outs, and keep tenant information up to date.',
    icon: <Users className="w-8 h-8" />,
    features: [
      'Add and manage tenant profiles',
      'Process tenant applications',
      'Handle lease renewals',
      'Coordinate move-in/move-out inspections'
    ],
    tip: 'Check "Tenants" to manage all tenant-related activities'
  },
  {
    title: 'Payment Oversight',
    description: 'Monitor rent payments, record transactions, and ensure timely collection from all tenants.',
    icon: <Banknote className="w-8 h-8" />,
    features: [
      'Track rent payments for all properties',
      'Record payment transactions',
      'Generate payment reports',
      'Send payment reminders'
    ],
    tip: 'Navigate to "Payments" to monitor all financial transactions'
  },
  {
    title: 'Maintenance Coordination',
    description: 'Coordinate maintenance requests, assign tasks to staff, and ensure timely resolution of issues.',
    icon: <Wrench className="w-8 h-8" />,
    features: [
      'Review maintenance requests',
      'Assign tasks to maintenance staff',
      'Approve estimates and work orders',
      'Track completion status'
    ],
    tip: 'Use "Maintenance" to manage all property maintenance activities'
  },
  {
    title: 'Communication Hub',
    description: 'Stay connected with landlords, tenants, and maintenance staff. Keep everyone informed and coordinated.',
    icon: <MessageSquare className="w-8 h-8" />,
    features: [
      'Message landlords and tenants',
      'Coordinate with maintenance staff',
      'Send property announcements',
      'Track all conversations'
    ],
    tip: 'Visit "Messages" to communicate with all stakeholders'
  },
  {
    title: 'You\'re Ready to Manage!',
    description: 'You now have a complete overview of your property management tools. Start exploring and managing properties efficiently!',
    icon: <Settings className="w-8 h-8" />,
    features: [
      'Customize your preferences',
      'Set notification settings',
      'Access reports and analytics',
      'Get help when needed'
    ],
    tip: 'Check "Settings" to personalize your management experience'
  }
];

export const maintenanceStaffOnboardingSteps = [
  {
    title: 'Welcome, Maintenance Staff!',
    description: 'Your dashboard helps you handle maintenance requests efficiently. Let\'s walk through the key features.',
    icon: <Wrench className="w-8 h-8" />,
    features: [
      'View assigned maintenance requests',
      'Update request status in real-time',
      'Submit work estimates',
      'Track your completed work'
    ],
    tip: 'This quick tour will get you up and running in minutes'
  },
  {
    title: 'Maintenance Requests',
    description: 'See all maintenance requests assigned to you. View details, photos, and tenant contact information.',
    icon: <FileText className="w-8 h-8" />,
    features: [
      'View pending maintenance requests',
      'See request details and priority',
      'Access property and tenant info',
      'View attached photos of issues'
    ],
    tip: 'Your dashboard shows all assigned requests - start here each day'
  },
  {
    title: 'Submitting Estimates',
    description: 'Before starting work, submit cost estimates for landlord or property manager approval.',
    icon: <Banknote className="w-8 h-8" />,
    features: [
      'Create detailed cost estimates',
      'Break down materials and labor',
      'Upload supporting photos',
      'Track estimate approval status'
    ],
    tip: 'Always submit an estimate before beginning work on major repairs'
  },
  {
    title: 'Updating Work Status',
    description: 'Keep everyone informed by updating the status of your work - from in progress to completed.',
    icon: <Calendar className="w-8 h-8" />,
    features: [
      'Mark requests as "In Progress"',
      'Update with work notes',
      'Upload before/after photos',
      'Mark as completed when done'
    ],
    tip: 'Regular updates help landlords and tenants stay informed'
  },
  {
    title: 'Communication',
    description: 'Message landlords, property managers, and tenants to coordinate work and ask questions.',
    icon: <MessageSquare className="w-8 h-8" />,
    features: [
      'Contact landlords for clarifications',
      'Message tenants about appointments',
      'Share work updates',
      'Request additional resources'
    ],
    tip: 'Use "Messages" to coordinate schedules and get quick answers'
  },
  {
    title: 'Ready to Start!',
    description: 'You\'re all set to manage maintenance requests efficiently. Check your dashboard regularly for new assignments!',
    icon: <Settings className="w-8 h-8" />,
    features: [
      'Update your profile information',
      'Set notification preferences',
      'View your work history',
      'Access help if needed'
    ],
    tip: 'Visit "Settings" to manage your profile and preferences'
  }
];

/**
 * Get onboarding steps for a specific role
 * @param {string} role - User role (landlord, tenant, property_manager, maintenance)
 * @returns {Array} - Array of onboarding step objects
 */
export const getOnboardingStepsForRole = (role) => {
  switch (role) {
    case 'landlord':
      return landlordOnboardingSteps;
    case 'tenant':
      return tenantOnboardingSteps;
    case 'property_manager':
      return propertyManagerOnboardingSteps;
    case 'maintenance':
      return maintenanceStaffOnboardingSteps;
    default:
      return [];
  }
};
