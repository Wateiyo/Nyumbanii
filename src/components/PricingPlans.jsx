import { Check, Crown } from 'lucide-react';
import { SUBSCRIPTION_TIERS, formatPrice } from '../services/paystackService';

const PricingPlans = ({ onSelectPlan, currentPlan = null, loading = false }) => {
  const tiers = Object.values(SUBSCRIPTION_TIERS).filter(tier => tier.id !== 'free');

  return (
    <div className="py-4 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Plan
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Select the perfect plan for your property management needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => {
                if (loading || currentPlan === tier.id) return;
                if (tier.contactForPricing) {
                  window.location.href = 'mailto:info@nyumbanii.org?subject=Custom Plan Inquiry&body=Hello, I am interested in learning more about the Custom plan for my property management needs.';
                } else {
                  onSelectPlan(tier);
                }
              }}
              className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl cursor-pointer ${
                tier.popular ? 'ring-2 ring-[#003366] dark:ring-blue-500' : ''
              } ${currentPlan === tier.id ? 'ring-2 ring-green-500 dark:ring-green-400' : ''} ${
                loading || currentPlan === tier.id ? 'cursor-not-allowed opacity-75' : 'hover:scale-105'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-[#003366] dark:bg-blue-600 text-white px-3 py-1 rounded-bl-lg font-semibold text-xs flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Popular
                </div>
              )}

              {currentPlan === tier.id && (
                <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 rounded-br-lg font-semibold text-xs">
                  Current
                </div>
              )}

              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {tier.name}
                </h3>

                <div className="mb-4">
                  {tier.contactForPricing ? (
                    <div className="text-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Contact for Pricing
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(tier.price)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">/mo</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (tier.contactForPricing) {
                      window.location.href = 'mailto:info@nyumbanii.org?subject=Custom Plan Inquiry&body=Hello, I am interested in learning more about the Custom plan for my property management needs.';
                    } else {
                      onSelectPlan(tier);
                    }
                  }}
                  disabled={loading || currentPlan === tier.id}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors mb-4 text-sm ${
                    tier.popular
                      ? 'bg-[#003366] text-white hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                  } ${
                    currentPlan === tier.id
                      ? 'bg-green-600 text-white cursor-not-allowed dark:bg-green-700'
                      : ''
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading
                    ? 'Processing...'
                    : currentPlan === tier.id
                    ? 'Current'
                    : tier.contactForPricing
                    ? 'Contact Us'
                    : 'Select'}
                </button>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                    Features:
                  </p>
                  {tier.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300 text-xs">{feature}</span>
                    </div>
                  ))}
                  {tier.features.length > 6 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      +{tier.features.length - 6} more features
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            All plans include secure payment processing and data encryption.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
            Cancel or upgrade anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
