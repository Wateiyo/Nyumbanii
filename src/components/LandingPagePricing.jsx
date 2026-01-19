import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, ArrowRight } from 'lucide-react';
import { SUBSCRIPTION_TIERS, formatPrice } from '../services/paystackService';

const LandingPagePricing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const tiers = Object.values(SUBSCRIPTION_TIERS).filter(tier => tier.id !== 'free');

  const handleFreeTrial = () => {
    // Direct to registration with free trial
    navigate('/register?plan=free-trial');
  };

  const handleSelectPaidPlan = (tier) => {
    // Check if this is a contact pricing plan
    if (tier.contactForPricing || tier.price === null) {
      window.location.href = 'mailto:support@nyumbanii.com?subject=Enterprise Plan Inquiry';
      return;
    }

    // Store selected plan details for post-registration upgrade
    const displayPrice = billingCycle === 'annual' ? tier.annualPrice : tier.price;

    sessionStorage.setItem('pendingUpgrade', JSON.stringify({
      planId: tier.id,
      planName: tier.name,
      billingCycle: billingCycle,
      price: displayPrice,
      timestamp: Date.now()
    }));

    // Redirect to registration
    navigate(`/register?plan=${tier.id}&billing=${billingCycle}`);
  };

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect plan for your property management needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-[#003366]' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#003366] focus:ring-offset-2"
              style={{ backgroundColor: billingCycle === 'annual' ? '#003366' : '#e5e7eb' }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-[#003366]' : 'text-gray-500'}`}>
              Annual
              <span className="ml-1 text-xs text-green-600 font-semibold">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Free Trial Option */}
        <div className="max-w-4xl mx-auto mb-12 bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-4">
              Start with a 14-Day Free Trial
            </p>
            <p className="text-gray-700 mb-6">
              Try Nyumbanii free for 14 days. No credit card required. Cancel anytime.
            </p>
            <button
              onClick={handleFreeTrial}
              className="px-8 py-4 bg-[#003366] text-white rounded-lg font-semibold hover:bg-[#002244] transition-colors inline-flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="text-sm text-gray-600 mt-4">
              After trial, choose a plan that fits your needs
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {tiers.map((tier) => {
            const displayPrice = billingCycle === 'annual' ? tier.annualPrice : tier.price;
            const isContactPricing = tier.contactForPricing || displayPrice === null;

            return (
              <div
                key={tier.id}
                onClick={() => handleSelectPaidPlan(tier)}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl cursor-pointer ${
                  tier.popular ? 'ring-2 ring-[#003366] scale-105' : ''
                } hover:scale-110`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-[#003366] text-white px-4 py-1 rounded-bl-lg font-semibold text-sm flex items-center gap-1">
                    <Crown className="h-4 w-4" />
                    Most Popular
                  </div>
                )}

                <div className="p-8">
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </p>

                  <div className="mb-6">
                    {isContactPricing ? (
                      <div className="text-2xl font-bold text-[#003366] py-3">
                        Contact for Pricing
                      </div>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-[#003366]">
                          {formatPrice(displayPrice)}
                        </span>
                        <span className="text-gray-600 ml-2">
                          /{billingCycle === 'annual' ? 'year' : 'month'}
                        </span>
                        {billingCycle === 'annual' && (
                          <div className="text-sm text-green-600 font-medium mt-2">
                            Save {formatPrice(tier.price * 12 - tier.annualPrice)}/year
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectPaidPlan(tier)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors mb-6 flex items-center justify-center gap-2 ${
                      tier.popular
                        ? 'bg-[#003366] text-white hover:bg-[#002244]'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {isContactPricing ? (
                      <>
                        Contact Us
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 text-sm mb-4">
            Trusted by property managers across Kenya
          </p>
          <div className="flex items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm">No Hidden Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm">Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPagePricing;
