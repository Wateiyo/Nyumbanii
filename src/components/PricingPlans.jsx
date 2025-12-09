import React from 'react';
import { Check, Crown } from 'lucide-react';
import { SUBSCRIPTION_TIERS, formatPrice } from '../services/paystackService';

const PricingPlans = ({ onSelectPlan, currentPlan = null, loading = false }) => {
  const tiers = Object.values(SUBSCRIPTION_TIERS).filter(tier => tier.id !== 'free');

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-600">
            Select the perfect plan for your property management needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                tier.popular ? 'ring-2 ring-orange-500 scale-105' : ''
              } ${currentPlan === tier.id ? 'ring-2 ring-green-500' : ''}`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 rounded-bl-lg font-semibold text-sm flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  Most Popular
                </div>
              )}

              {currentPlan === tier.id && (
                <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 rounded-br-lg font-semibold text-sm">
                  Current Plan
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {tier.name}
                </h3>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(tier.price)}
                  </span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>

                <button
                  onClick={() => onSelectPlan(tier)}
                  disabled={loading || currentPlan === tier.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors mb-6 ${
                    tier.popular
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } ${
                    currentPlan === tier.id
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : ''
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading
                    ? 'Processing...'
                    : currentPlan === tier.id
                    ? 'Current Plan'
                    : 'Get Started'}
                </button>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Features:
                  </p>
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {tier.propertyLimit !== -1 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Property Limit: {tier.propertyLimit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm">
            All plans include secure payment processing and data encryption.
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Cancel or upgrade anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
