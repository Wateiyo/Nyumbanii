import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Crown, CreditCard, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import {
  getLandlordSubscription,
  getPaymentHistory
} from '../services/firestoreService';
import {
  isSubscriptionActive,
  getDaysRemaining,
  formatPrice,
  SUBSCRIPTION_TIERS
} from '../services/paystackService';
import SubscriptionModal from './SubscriptionModal';

const SubscriptionSettings = () => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadSubscriptionData();
    }
  }, [currentUser]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      // Load subscription details
      const subscriptionData = await getLandlordSubscription(currentUser.uid);
      setSubscription(subscriptionData);

      // Load payment history
      const history = await getPaymentHistory(currentUser.uid);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatus = () => {
    if (!subscription) {
      return { status: 'inactive', color: 'red', icon: XCircle };
    }

    const active = isSubscriptionActive(subscription);
    if (active) {
      return { status: 'active', color: 'green', icon: CheckCircle };
    } else {
      return { status: 'expired', color: 'red', icon: AlertCircle };
    }
  };

  const currentTier = subscription?.subscriptionTier || 'free';
  const tierDetails = SUBSCRIPTION_TIERS[currentTier.toUpperCase()] || SUBSCRIPTION_TIERS.FREE;
  const statusInfo = getSubscriptionStatus();
  const daysRemaining = subscription ? getDaysRemaining(subscription) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="h-6 w-6" />
            Current Subscription
          </h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan Details */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Plan Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-gray-900">
                    {tierDetails.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <div className="flex items-center gap-2">
                    <statusInfo.icon className={`h-5 w-5 text-${statusInfo.color}-500`} />
                    <span className={`font-semibold text-${statusInfo.color}-600 capitalize`}>
                      {statusInfo.status}
                    </span>
                  </div>
                </div>
                {subscription?.subscriptionEndDate && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valid Until</span>
                      <span className="font-medium text-gray-900">
                        {subscription.subscriptionEndDate.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Remaining</span>
                      <span className={`font-semibold ${daysRemaining < 7 ? 'text-red-600' : 'text-gray-900'}`}>
                        {daysRemaining} days
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Features Included</h4>
              <div className="space-y-2">
                {tierDetails.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full md:w-auto px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              {subscription && isSubscriptionActive(subscription)
                ? 'Upgrade Plan'
                : 'Subscribe Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Billing Information */}
      {subscription && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Amount</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(subscription.amount || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Billing Cycle</span>
              <span className="font-medium text-gray-900">Monthly</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Auto Renewal</span>
              <span className="font-medium text-gray-900">
                {subscription.autoRenew ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Payment History
        </h3>

        {paymentHistory.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No payment history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.transactionDate?.toDate
                        ? payment.transactionDate.toDate().toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {payment.plan || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatPrice(payment.amount || 0)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {payment.paystackReference?.substring(0, 20)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          loadSubscriptionData(); // Reload data when modal closes
        }}
      />
    </div>
  );
};

export default SubscriptionSettings;
