import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLandlordSubscription } from '../services/firestoreService';
import { isSubscriptionActive } from '../services/paystackService';
import SubscriptionModal from './SubscriptionModal';

const ProtectedRoute = ({ children, requiredRole, requiresSubscription = false }) => {
  const { currentUser, userRole, loading } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (currentUser && userRole === 'landlord' && requiresSubscription) {
        try {
          const subscriptionData = await getLandlordSubscription(currentUser.uid);
          setSubscription(subscriptionData);

          // Check if subscription is inactive or expired
          if (!subscriptionData || !isSubscriptionActive(subscriptionData)) {
            // Show subscription modal for landlords without active subscription
            setShowSubscriptionModal(true);
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
      setSubscriptionLoading(false);
    };

    if (!loading) {
      checkSubscription();
    }
  }, [currentUser, userRole, loading, requiresSubscription]);

  if (loading || (requiresSubscription && userRole === 'landlord' && subscriptionLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#003366] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to correct dashboard based on user's role
    if (userRole === 'landlord') {
      return <Navigate to="/landlord/dashboard" replace />;
    } else if (userRole === 'tenant') {
      return <Navigate to="/tenant/dashboard" replace />;
    } else if (userRole === 'property_manager') {
      return <Navigate to="/property-manager/dashboard" replace />;
    } else if (userRole === 'maintenance') {
      return <Navigate to="/maintenance/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // For landlords requiring subscription, show modal if not active
  if (requiresSubscription && userRole === 'landlord' && showSubscriptionModal) {
    return (
      <>
        {children}
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
        />
      </>
    );
  }

  return children;
};

export default ProtectedRoute;