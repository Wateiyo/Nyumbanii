import React, { useState } from 'react';
import { Home, User, Mail, Lock, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Register = ({ onNavigateHome }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('landlord');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      // Fallback: navigate to root path
      window.location.href = '/';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email');
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

    console.log('User registered:', formData.email);
    console.log('Selected role:', selectedRole);
    
    setTimeout(() => {
      alert(`Account created successfully! Role: ${selectedRole}`);
      setLoading(false);
    }, 1000);
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError('');

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }

    console.log('Google sign-in initiated');
    setTimeout(() => {
      alert(`Signed in with Google! Role: ${selectedRole}`);
      setLoading(false);
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-800 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-800 rounded-full opacity-30 translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="max-w-6xl w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
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

            <div className="bg-white/15 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20 max-h-[600px] overflow-y-auto">
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border-l-4 border-red-400 rounded-lg backdrop-blur-sm">
                  <p className="text-white text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    I am a:
                  </label>
                  <div className="grid grid-cols-2 gap-4">
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

                    <button
                      type="button"
                      onClick={() => !loading && setSelectedRole('tenant')}
                      disabled={loading}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedRole === 'tenant'
                          ? 'border-white bg-white/20'
                          : 'border-white/20 hover:border-white/40'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <User className={`w-8 h-8 mx-auto mb-2 ${
                        selectedRole === 'tenant' ? 'text-white' : 'text-blue-200'
                      }`} />
                      <div className={`font-semibold ${
                        selectedRole === 'tenant' ? 'text-white' : 'text-blue-200'
                      }`}>
                        Tenant
                      </div>
                    </button>
                  </div>
                </div>

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
                      className="w-full pl-12 pr-4 py-3 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none transition-all bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                      placeholder="john@example.com"
                      disabled={loading}
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
                  />
                  <label className="ml-2 text-sm text-white">
                    I agree to the <span className="text-blue-200 hover:text-white underline cursor-pointer">Terms of Service</span> and <span className="text-blue-200 hover:text-white underline cursor-pointer">Privacy Policy</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
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

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-blue-100 font-medium">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
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
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-white">
                  Already have an account?{' '}
                  <button 
                    onClick={() => !loading && alert('Navigate to login')}
                    className={`text-blue-900 hover:text-blue-800 font-bold transition-colors ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:underline'}`}
                    disabled={loading}
                  >
                    Login here
                  </button>
                </p>
              </div>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={handleNavigateHome}
                className="text-white hover:text-blue-200 font-semibold transition-colors flex items-center gap-2 mx-auto"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Home
              </button>
            </div>
          </div>

         {/* Right Side - Image placeholder */}
          <div className="hidden lg:block">
            <div className="relative">
              <img 
                src="/images/register.png" 
                alt="Property Management" 
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              <div className="mt-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-4"></h2>
                <p className="text-transparent text-sm">Access your dashboard, track rent payments, and communicate with tenants all in one place.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;