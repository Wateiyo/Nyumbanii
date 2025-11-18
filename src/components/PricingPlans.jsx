import React, { useState } from 'react';
import { Check, Crown } from 'lucide-react';
import { SUBSCRIPTION_TIERS, formatPrice } from '../services/paystackService';

const PricingPlans = ({ onSelectPlan, currentPlan = null, loading = false }) => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
  const tiers = Object.values(SUBSCRIPTION_TIERS).filter(tier => tier.id !== 'free');

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Select the perfect plan for your property management needs
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-[#003366] dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              style={{ backgroundColor: billingCycle === 'annual' ? '#003366' : undefined }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-[#003366] dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Annual
              <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-semibold">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tiers.map((tier) => {
            const displayPrice = billingCycle === 'annual' ? tier.annualPrice : tier.price;
            const displayInterval = billingCycle === 'annual' ? '/year' : '/month';
            const isContactPricing = tier.contactForPricing || displayPrice === null;

            return (
            <div
              key={tier.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl border border-gray-200 dark:border-gray-700 ${
                tier.popular ? 'ring-2 ring-[#003366] dark:ring-blue-500 scale-105' : ''
              } ${currentPlan === tier.id ? 'ring-2 ring-green-600 dark:ring-green-500' : ''}`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-[#003366] dark:bg-blue-600 text-white px-4 py-1 rounded-bl-lg font-semibold text-sm flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  Most Popular
                </div>
              )}

              {currentPlan === tier.id && (
                <div className="absolute top-0 left-0 bg-green-600 dark:bg-green-500 text-white px-4 py-1 rounded-br-lg font-semibold text-sm">
                  Current Plan
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {tier.name}
                </h3>

                <div className="mb-6">
                  {isContactPricing ? (
                    <div className="text-2xl font-bold text-[#003366] dark:text-blue-400">
                      Contact for Pricing
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-[#003366] dark:text-blue-400">
                        {formatPrice(displayPrice)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2 text-sm">{displayInterval}</span>
                      {billingCycle === 'annual' && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                          Save {formatPrice(tier.price * 12 - tier.annualPrice)}/year
                        </div>
                      )}
                    </>
                  )}
                </div>

                <button
                  onClick={() => isContactPricing ? window.location.href = 'mailto:support@nyumbanii.com?subject=Enterprise Plan Inquiry' : onSelectPlan({ ...tier, interval: billingCycle, price: displayPrice })}
                  disabled={loading || currentPlan === tier.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors mb-6 ${
                    tier.popular
                      ? 'bg-[#003366] dark:bg-blue-600 text-white hover:bg-[#002244] dark:hover:bg-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  } ${
                    currentPlan === tier.id
                      ? 'bg-green-600 dark:bg-green-500 text-white cursor-not-allowed'
                      : ''
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading
                    ? 'Processing...'
                    : currentPlan === tier.id
                    ? 'Current Plan'
                    : isContactPricing
                    ? 'Contact Us'
                    : 'Get Started'}
                </button>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Features:
                  </p>
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {tier.propertyLimit !== -1 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Property Limit: {tier.propertyLimit}
                    </p>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            All plans include secure payment processing and data encryption.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Cancel or upgrade anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
