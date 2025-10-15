// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Import pages
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import LandlordDashboard from './pages/LandlordDashboard';
import TenantDashboard from './pages/TenantDashboard';
import PropertyManagerDashboard from './pages/PropertyManagerDashboard';
import MaintenanceStaffDashboard from './pages/MaintenanceStaffDashboard';
import PropertyListings from './pages/Listings';

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
          
          {/* Protected Dashboard Routes */}
          <Route path="/landlord/dashboard" element={<LandlordDashboard />} />
          <Route path="/tenant/dashboard" element={<TenantDashboard />} />
          <Route path="/property-manager/dashboard" element={<PropertyManagerDashboard />} />
          <Route path="/maintenance/dashboard" element={<MaintenanceStaffDashboard />} />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App