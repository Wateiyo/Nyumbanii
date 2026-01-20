import React, { useState } from 'react';
import { Download, CheckCircle, Mail, User, Wrench, ArrowRight } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { downloadMaintenanceGuidePDF } from '../utils/maintenanceGuideGenerator';

const MaintenanceGuideDownload = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyCount: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'leads'), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        propertyCount: formData.propertyCount || '',
        source: 'maintenance-guide',
        downloadedAt: serverTimestamp(),
        status: 'new',
        followUpRequired: true
      });

      downloadMaintenanceGuidePDF();
      setSubmitted(true);

    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Success! Your Guide is Ready
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Your <strong>Property Maintenance Guide</strong> has been downloaded.
              Check your email for additional resources!
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                What's Next?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Implement the seasonal maintenance checklist</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Build your vendor network using our tips</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Start preventive maintenance to save costs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Try Nyumbanii to automate your workflow!</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </a>

              <button
                onClick={() => downloadMaintenanceGuidePDF()}
                className="block mx-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                Download Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-[#003366] dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Wrench className="w-4 h-4" />
            Free Download - No Credit Card Required
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Property Maintenance<br />Guide
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Reduce costs, improve tenant satisfaction, and protect your investment with
            proven maintenance strategies for Kenyan property owners.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Benefits */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              What's Inside:
            </h2>

            <div className="space-y-4 mb-8">
              {[
                'Monthly, quarterly & annual maintenance checklists',
                'Emergency response protocols & solutions',
                'Vendor management & cost-saving strategies',
                'Seasonal maintenance for Kenyan climate',
                'Tenant communication best practices',
                'Record-keeping & compliance guidelines',
                'Preventive maintenance schedules',
                'Common repair scenarios & solutions'
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Why This Guide?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Based on industry best practices and adapted for Kenya's unique climate and
                market conditions. Save up to 40% on maintenance costs with preventive strategies.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#003366] dark:text-blue-400">6</div>
                  <div className="text-gray-600 dark:text-gray-400">Pages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#003366] dark:text-blue-400">50+</div>
                  <div className="text-gray-600 dark:text-gray-400">Tips</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#003366] dark:text-blue-400">100%</div>
                  <div className="text-gray-600 dark:text-gray-400">Free</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 lg:sticky lg:top-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#003366] rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Get Your Free Guide
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter your details to download instantly
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="+254 700 000 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Properties (Optional)
                </label>
                <select
                  value={formData.propertyCount}
                  onChange={(e) => setFormData({ ...formData, propertyCount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="1">1 property</option>
                  <option value="2-5">2-5 properties</option>
                  <option value="6-10">6-10 properties</option>
                  <option value="11-20">11-20 properties</option>
                  <option value="20+">20+ properties</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download Guide Now
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                By downloading, you agree to receive occasional emails with tips.
                Unsubscribe anytime.
              </p>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Want to automate everything?
              </p>
              <a
                href="/signup"
                className="text-[#003366] dark:text-blue-400 font-medium hover:underline"
              >
                Try Nyumbanii Free →
              </a>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Trusted by landlords managing over 1,000 properties across Kenya
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#003366] dark:text-blue-400">40%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cost Savings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#003366] dark:text-blue-400">30%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Better Retention</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#003366] dark:text-blue-400">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Request Tracking</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceGuideDownload;
