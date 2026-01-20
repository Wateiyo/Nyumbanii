// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MessageModal from './components/MessageModal';

// Import pages
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import LandlordDashboard from './pages/LandlordDashboard';
import TenantDashboard from './pages/TenantDashboard';
import PropertyManagerDashboard from './pages/PropertyManagerDashboard';
import MaintenanceStaffDashboard from './pages/MaintenanceStaffDashboard';
import PropertyListings from './pages/Listings';
import ChecklistDownload from './components/ChecklistDownload';
import MaintenanceGuideDownload from './components/MaintenanceGuideDownload';
import EbookDownload from './components/EbookDownload';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/listings" element={<PropertyListings />} />
          <Route path="/resources/rent-collection-checklist" element={<ChecklistDownload />} />
          <Route path="/resources/maintenance-guide" element={<MaintenanceGuideDownload />} />
          <Route path="/resources/property-management-ebook" element={<EbookDownload />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/landlord/dashboard"
            element={
              <ProtectedRoute requiredRole="landlord" requiresSubscription={true}>
                <LandlordDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenant/dashboard"
            element={
              <ProtectedRoute requiredRole="tenant">
                <TenantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property-manager/dashboard"
            element={
              <ProtectedRoute requiredRole="property_manager">
                <PropertyManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance/dashboard"
            element={
              <ProtectedRoute requiredRole="maintenance">
                <MaintenanceStaffDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App