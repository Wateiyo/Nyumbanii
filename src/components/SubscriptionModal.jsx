import React, { useState, useEffect } from 'react';
import { X, CreditCard, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
  initializePayment,
  generateReference,
  calculateSubscriptionEndDate,
  formatPrice,
  SUBSCRIPTION_TIERS
} from '../services/paystackService';
import PricingPlans from './PricingPlans';

const SubscriptionModal = ({ isOpen, onClose, initialPlan = null }) => {
  const { currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [showPlans, setShowPlans] = useState(!initialPlan);

  useEffect(() => {
    if (currentUser && isOpen) {
      loadCurrentSubscription();
    }
  }, [currentUser, isOpen]);

  const loadCurrentSubscription = async () => {
    try {
      const settingsRef = doc(db, 'landlordSettings', currentUser.uid);
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setCurrentSubscription(data);
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowPlans(false);
    setError(null);
  };

  const handleBackToPlans = () => {
    setShowPlans(true);
    setSelectedPlan(null);
    setError(null);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const reference = generateReference(currentUser.uid, selectedPlan.id);
      const endDate = calculateSubscriptionEndDate(selectedPlan.interval);

      // Initialize Paystack payment
      await initializePayment({
        email: currentUser.email,
        amount: selectedPlan.price,
        reference,
        metadata: {
          userId: currentUser.uid,
          plan: selectedPlan.id,
          planName: selectedPlan.name,
          interval: selectedPlan.interval
        },
        onSuccess: async (transaction) => {
          try {
            // Save subscription to Firestore
            await saveSubscription(transaction, reference, endDate);

            // Show success message
            alert('Payment successful! Your subscription is now active.');

            // Close modal
            onClose();

            // Reload page to update subscription status
            window.location.reload();
          } catch (err) {
            console.error('Error saving subscription:', err);
            setError('Payment successful but failed to activate subscription. Please contact support.');
          }
        },
        onClose: () => {
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Error initializing payment:', err);
      setError('Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  };

  const saveSubscription = async (transaction, reference, endDate) => {
    const subscriptionData = {
      subscriptionStatus: 'active',
      subscriptionTier: selectedPlan.id,
      subscriptionStartDate: serverTimestamp(),
      subscriptionEndDate: endDate,
      paystackReference: reference,
      paystackTransactionId: transaction.reference,
      amount: selectedPlan.price,
      currency: selectedPlan.currency,
      interval: selectedPlan.interval,
      autoRenew: false,
      propertyLimit: selectedPlan.propertyLimit,
      tenantLimit: selectedPlan.tenantLimit,
      updatedAt: serverTimestamp()
    };

    // Update landlordSettings
    const settingsRef = doc(db, 'landlordSettings', currentUser.uid);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      await setDoc(settingsRef, subscriptionData, { merge: true });
    } else {
      await setDoc(settingsRef, {
        userId: currentUser.uid,
        ...subscriptionData,
        createdAt: serverTimestamp()
      });
    }

    // Save payment history
    const paymentHistoryRef = doc(db, 'paymentHistory', reference);
    await setDoc(paymentHistoryRef, {
      landlordId: currentUser.uid,
      paystackReference: reference,
      paystackTransactionId: transaction.reference,
      amount: selectedPlan.price,
      currency: selectedPlan.currency,
      status: 'success',
      plan: selectedPlan.id,
      planName: selectedPlan.name,
      interval: selectedPlan.interval,
      paymentMethod: transaction.channel || 'card',
      transactionDate: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {showPlans ? 'Choose Your Plan' : 'Complete Payment'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {showPlans ? (
            <PricingPlans
              onSelectPlan={handleSelectPlan}
              currentPlan={currentSubscription?.subscriptionTier}
              loading={loading}
            />
          ) : (
            <div className="max-w-2xl mx-auto">
              {/* Selected Plan Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedPlan?.name} Plan
                </h3>
                <p className="text-3xl font-bold text-[#003366] mb-4">
                  {formatPrice(selectedPlan?.price)}
                  <span className="text-lg text-gray-600"> /{selectedPlan?.interval || 'month'}</span>
                </p>
                <div className="space-y-2">
                  {selectedPlan?.features.map((feature, index) => (
                    <p key={index} className="text-gray-700 text-sm">
                      ✓ {feature}
                    </p>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-semibold text-sm">
                      Secure Payment
                    </p>
                    <p className="text-blue-800 text-sm">
                      Your payment is processed securely through Paystack. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Payment Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-gray-900">
                      {currentUser?.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan</span>
                    <span className="font-medium text-gray-900">
                      {selectedPlan?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Billing Cycle</span>
                    <span className="font-medium text-gray-900 capitalize">{selectedPlan?.interval || 'Monthly'}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-lg font-bold text-[#003366]">
                      {formatPrice(selectedPlan?.price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleBackToPlans}
                  disabled={loading}
                  className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back to Plans
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-[#003366] text-white rounded-lg font-semibold hover:bg-[#002244] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-5 w-5" />
                  {loading ? 'Processing...' : 'Pay Now'}
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-4">
                By clicking "Pay Now", you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
