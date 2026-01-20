import React, { useState } from 'react';
import { X, Download, FileText, CheckCircle, Mail } from 'lucide-react';
import { downloadPropertyManagementEbook } from '../utils/propertyManagementEbookGenerator';
import { downloadRentCollectionChecklist } from '../utils/rentCollectionChecklistGenerator';
import { downloadMaintenanceGuidePDF } from '../utils/maintenanceGuideGenerator';

const LeadMagnetModal = ({ isOpen, onClose, resourceType }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyCount: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const resources = {
    ebook: {
      title: 'The Complete Property Management Guide',
      description: 'A comprehensive 50-page guide covering everything from tenant screening to maintenance management',
      filename: 'nyumbanii-property-management-guide.pdf',
      icon: '📚',
      features: [
        'Tenant screening best practices',
        'Lease agreement templates',
        'Maintenance scheduling systems',
        'Financial management tips',
        'Legal compliance checklist',
        'Scaling your property portfolio'
      ]
    },
    checklist: {
      title: 'Rent Collection Checklist',
      description: 'A step-by-step checklist to ensure you never miss rent payments and maintain healthy cash flow',
      filename: 'nyumbanii-rent-collection-checklist.pdf',
      icon: '✅',
      features: [
        'Pre-collection preparation steps',
        'Automated reminder templates',
        'Late payment handling process',
        'Payment tracking system',
        'Legal eviction procedures',
        'Tenant communication scripts'
      ]
    },
    maintenance: {
      title: 'Property Maintenance Guide',
      description: 'Master the art of property maintenance with proven strategies to reduce costs and improve tenant satisfaction',
      filename: 'nyumbanii-maintenance-guide.pdf',
      icon: '🔧',
      features: [
        'Preventive maintenance schedules',
        'Emergency response protocols',
        'Vendor management strategies',
        'Cost estimation frameworks',
        'Maintenance request workflows',
        'Quality control checklists'
      ]
    }
  };

  const currentResource = resources[resourceType] || resources.ebook;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsDownloading(true);

    try {
      // Log form data for lead tracking
      console.log('Lead magnet form submitted:', formData);

      // TODO: Send form data to your backend/email service
      // await axios.post('/api/lead-magnets', {
      //   ...formData,
      //   resourceType: resourceType,
      //   downloadedAt: new Date().toISOString()
      // });

      // Trigger the actual PDF download based on resource type
      setTimeout(() => {
        try {
          if (resourceType === 'ebook') {
            downloadPropertyManagementEbook();
          } else if (resourceType === 'checklist') {
            downloadRentCollectionChecklist();
          } else if (resourceType === 'maintenance') {
            downloadMaintenanceGuidePDF();
          }
        } catch (downloadError) {
          console.error('Error generating PDF:', downloadError);
        }

        setIsDownloading(false);
        setIsSubmitted(true);
      }, 1500);
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-6xl mb-3">{currentResource.icon}</div>
          <h2 className="text-3xl font-bold mb-2">{currentResource.title}</h2>
          <p className="text-blue-100">{currentResource.description}</p>
        </div>

        {!isSubmitted ? (
          <div className="p-6">
            {/* What's Inside */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What's Inside:</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {currentResource.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium flex items-start gap-2">
                  <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Enter your details below to get instant access to this free resource. We'll also send you property management tips.</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+254 700 000 000"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How many properties do you manage?
                </label>
                <select
                  name="propertyCount"
                  value={formData.propertyCount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-900 focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="1-5">1-5 properties</option>
                  <option value="6-20">6-20 properties</option>
                  <option value="21-50">21-50 properties</option>
                  <option value="50+">50+ properties</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isDownloading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-lg font-bold text-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Preparing Download...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download Free Guide
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By downloading, you agree to receive emails from Nyumbanii. Unsubscribe anytime.
              </p>
            </form>
          </div>
        ) : (
          // Success State
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Success! Check Your Email
            </h3>
            <p className="text-gray-600 mb-6">
              We've sent <strong>{currentResource.title}</strong> to <strong>{formData.email}</strong>.
              Check your inbox (and spam folder) for the download link.
            </p>

            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h4 className="font-bold text-gray-900 mb-3">While you're here...</h4>
              <p className="text-gray-700 mb-4">
                Why not try Nyumbanii for free? See how our platform can transform your property management.
              </p>
              <button
                onClick={() => window.location.href = '/register'}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Start Your 14-Day Free Trial
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadMagnetModal;
