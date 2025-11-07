import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, User, Mail, Lock, Phone, Eye, EyeOff, ArrowRight, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const db = getFirestore();

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('landlord');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleNavigateHome = () => {
    navigate('/');
  };

  // Validate invitation token on component mount
  useEffect(() => {
    const inviteToken = searchParams.get('invite');
    const inviteType = searchParams.get('type');
    if (inviteToken) {
      validateInvitation(inviteToken, inviteType);
    }
  }, [searchParams]);

  const validateInvitation = async (token, type = null) => {
    setValidatingInvite(true);
    try {
      console.log('Validating invitation token:', token);

      const invitationsQuery = query(
        collection(db, 'invitations'),
        where('token', '==', token),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(invitationsQuery);
      console.log('Invitation query results:', snapshot.size, 'documents found');

      if (!snapshot.empty) {
        const inviteDoc = snapshot.docs[0];
        const inviteData = inviteDoc.data();
        console.log('Invitation data:', inviteData);

        // Check if invitation has expired
        let expiresAt = inviteData.expiresAt;
        // Convert Firestore Timestamp to Date if needed
        if (expiresAt && typeof expiresAt.toDate === 'function') {
          expiresAt = expiresAt.toDate();
        } else if (expiresAt && !(expiresAt instanceof Date)) {
          // If it's not a Date object or Timestamp, try to convert it
          expiresAt = new Date(expiresAt);
        }

        if (expiresAt && expiresAt < new Date()) {
          setError('This invitation has expired. Please contact your landlord for a new invitation.');
          setValidatingInvite(false);
          return false;
        }

        // Set invitation data and pre-fill form
        setInvitationData({ id: inviteDoc.id, ...inviteData });

        // Determine role based on invitation type
        if (inviteData.type === 'team_member') {
          // Team member invitation (property_manager or maintenance)
          console.log('Team member invitation detected, role:', inviteData.role);
          setSelectedRole(inviteData.role || type || 'property_manager');
          setFormData(prev => ({
            ...prev,
            fullName: inviteData.memberName || '',
            email: inviteData.email || ''
          }));
        } else {
          // Tenant invitation
          console.log('Tenant invitation detected');
          setSelectedRole('tenant');
          setFormData(prev => ({
            ...prev,
            fullName: inviteData.tenantName || '',
            email: inviteData.email || ''
          }));
        }

        setError('');
        return true;
      } else {
        console.log('No invitation found with token and pending status');
        setError('Invalid or expired invitation link. Please contact your landlord.');
        return false;
      }
    } catch (err) {
      console.error('Error validating invitation:', err);
      console.error('Error details:', err.message, err.code);
      setError(`Error validating invitation: ${err.message}. Please try again.`);
      return false;
    } finally {
      setValidatingInvite(false);
    }
  };

  const handleManualCodeEntry = async () => {
    if (!invitationCode.trim()) {
      setError('Please enter an invitation code.');
      return;
    }

    setValidatingCode(true);
    setError('');

    const isValid = await validateInvitation(invitationCode.trim());

    if (isValid) {
      setShowCodeModal(false);
      setInvitationCode('');
    }

    setValidatingCode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone,
        selectedRole
      );

      // If this is a registration with an invitation, update the records
      if (invitationData) {
        try {
          if (selectedRole === 'tenant') {
            // Find and update the tenant record with the new user UID
            const tenantsQuery = query(
              collection(db, 'tenants'),
              where('email', '==', formData.email.toLowerCase()),
              where('landlordId', '==', invitationData.landlordId)
            );

            const tenantSnapshot = await getDocs(tenantsQuery);
            if (!tenantSnapshot.empty) {
              const tenantDocRef = doc(db, 'tenants', tenantSnapshot.docs[0].id);
              await updateDoc(tenantDocRef, {
                userId: result.user.uid,
                status: 'active',
                registeredAt: new Date()
              });
            }
          } else if (selectedRole === 'property_manager' || selectedRole === 'maintenance') {
            // Find and update the team member record with the new user UID
            const teamQuery = query(
              collection(db, 'teamMembers'),
              where('email', '==', formData.email.toLowerCase()),
              where('landlordId', '==', invitationData.landlordId)
            );

            const teamSnapshot = await getDocs(teamQuery);
            if (!teamSnapshot.empty) {
              const teamDocRef = doc(db, 'teamMembers', teamSnapshot.docs[0].id);
              await updateDoc(teamDocRef, {
                userId: result.user.uid,
                status: 'active',
                registeredAt: new Date()
              });
            }
          }

          // Mark invitation as accepted
          const invitationDocRef = doc(db, 'invitations', invitationData.id);
          await updateDoc(invitationDocRef, {
            status: 'accepted',
            acceptedAt: new Date()
          });
        } catch (updateErr) {
          console.error('Error updating records:', updateErr);
          // Continue anyway - user is registered
        }
      }

      // Redirect based on role
      if (selectedRole === 'landlord') {
        navigate('/landlord/dashboard');
      } else if (selectedRole === 'tenant') {
        navigate('/tenant/dashboard');
      } else if (selectedRole === 'property_manager') {
        navigate('/property-manager/dashboard');
      } else if (selectedRole === 'maintenance') {
        navigate('/maintenance/dashboard');
      }
    } catch (err) {
      let errorMessage = 'An error occurred during registration. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }

    try {
      const { role } = await signInWithGoogle(selectedRole);

      // Redirect based on role
      if (role === 'landlord') {
        navigate('/landlord/dashboard');
      } else if (role === 'tenant') {
        navigate('/tenant/dashboard');
      } else if (role === 'property_manager') {
        navigate('/property-manager/dashboard');
      } else if (role === 'maintenance') {
        navigate('/maintenance/dashboard');
      }
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen w-full bg-blue-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-800 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-800 rounded-full opacity-30 translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="max-w-6xl w-full relative z-10 mx-auto py-12 px-4 flex items-center min-h-screen">
        <div className="grid lg:grid-cols-2 gap-12 items-start w-full">
          <div>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <button 
                  onClick={handleNavigateHome}
                  className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg transition-transform hover:scale-105"
                  aria-label="Go to home page"
                >
                  <img src="/images/logo-light.svg" alt="Nyumbanii Logo" className="h-16 w-auto drop-shadow-2xl" />
                </button>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Create Your Account</h1>
              <p className="text-blue-200 text-lg">Join Karibu Nyumbanii today</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white/15 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20 max-h-[600px] overflow-y-auto">
              {validatingInvite && (
                <div className="mb-6 p-4 bg-blue-500/20 border-l-4 border-blue-400 rounded-lg backdrop-blur-sm">
                  <p className="text-white text-sm font-medium">Validating invitation...</p>
                </div>
              )}

              {invitationData && !validatingInvite && (
                <div className="mb-6 p-4 bg-green-500/20 border-l-4 border-green-400 rounded-lg backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white text-sm font-semibold mb-1">Invitation Verified!</p>
                      <p className="text-blue-100 text-xs">
                        {invitationData.type === 'team_member' ? (
                          <>You've been invited by {invitationData.landlordName} to join as a {invitationData.role === 'property_manager' ? 'Property Manager' : 'Maintenance Staff'}.</>
                        ) : (
                          <>You've been invited by {invitationData.landlordName} to join as a tenant for {invitationData.property}, Unit {invitationData.unit}.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border-l-4 border-red-400 rounded-lg backdrop-blur-sm">
                  <p className="text-white text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                {!invitationData && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">
                        I am a:
                      </label>
                      <div className="grid grid-cols-1 gap-4">
                        <button
                          type="button"
                          onClick={() => !loading && setSelectedRole('landlord')}
                          disabled={loading}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            selectedRole === 'landlord'
                              ? 'border-white bg-white/20'
                              : 'border-white/20 hover:border-white/40'
                          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Home className={`w-8 h-8 mx-auto mb-2 ${
                            selectedRole === 'landlord' ? 'text-white' : 'text-blue-200'
                          }`} />
                          <div className={`font-semibold ${
                            selectedRole === 'landlord' ? 'text-white' : 'text-blue-200'
                          }`}>
                            Landlord
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                      <div className="flex items-start gap-3 mb-3">
                        <User className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white text-sm font-semibold mb-1">Are you a Tenant, Property Manager, or Maintenance Staff?</p>
                          <p className="text-blue-100 text-xs">
                            You can only register through a landlord invitation. Ask your landlord for an invitation link or enter your invitation code below.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCodeModal(true)}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Enter Invitation Code
                      </button>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-200 w-5 h-5 group-focus-within:text-white transition-colors" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none transition-all bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                      placeholder="John Doe"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-200 w-5 h-5 group-focus-within:text-white transition-colors" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none transition-all bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="john@example.com"
                      disabled={loading || !!invitationData}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-200 w-5 h-5 group-focus-within:text-white transition-colors" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none transition-all bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                      placeholder="+254 700 000 000"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-200 w-5 h-5 group-focus-within:text-white transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none transition-all bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                      placeholder="••••••••"
                      disabled={loading}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-200 w-5 h-5 group-focus-within:text-white transition-colors" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none transition-all bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                      placeholder="••••••••"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-900 border-white/30 rounded focus:ring-white/50 bg-white/10"
                    disabled={loading}
                    required
                  />
                  <label className="ml-2 text-sm text-white">
                    I agree to the <span className="text-blue-200 hover:text-white underline cursor-pointer">Terms of Service</span> and <span className="text-blue-200 hover:text-white underline cursor-pointer">Privacy Policy</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 bg-white/15 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-white/20">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-blue-100 font-medium">Or continue with</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-white/20 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 backdrop-blur-sm group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-semibold text-white group-hover:text-blue-100">
                  {loading ? 'Signing in...' : 'Continue with Google'}
                </span>
              </button>

              <div className="mt-6 text-center">
                <p className="text-white">
                  Already have an account?{' '}
                  <button 
                    onClick={() => !loading && navigate('/login')}
                    className={`text-blue-200 hover:text-white font-bold transition-colors ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:underline'}`}
                    disabled={loading}
                    type="button"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={handleNavigateHome}
                type="button"
                className="text-white hover:text-blue-200 font-semibold transition-colors flex items-center gap-2 mx-auto"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Home
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              <img 
                src="/images/register.png" 
                alt="Property Management" 
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Enter Invitation Code</h3>
                <button
                  onClick={() => {
                    setShowCodeModal(false);
                    setInvitationCode('');
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={validatingCode}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                Enter the invitation code provided by your landlord. This works for tenants, property managers, and maintenance staff.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Invitation Code
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.trim())}
                  placeholder="e.g., a7f3k9m2x8b4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  disabled={validatingCode}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManualCodeEntry();
                    }
                  }}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCodeModal(false);
                    setInvitationCode('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={validatingCode}
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualCodeEntry}
                  disabled={validatingCode || !invitationCode.trim()}
                  className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatingCode ? 'Validating...' : 'Verify Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;