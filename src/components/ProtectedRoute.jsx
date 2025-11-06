import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
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

  return children;
};

export default ProtectedRoute;