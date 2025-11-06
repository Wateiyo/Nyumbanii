import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // ADD THIS

const Login = () => {
  const navigate = useNavigate();
  const { login, signInWithGoogle } = useAuth(); // ADD THIS
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.email.trim()) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    try {
      // REAL Firebase login
      const { role } = await login(formData.email, formData.password);
      
      // Redirect based on role
      if (role === 'landlord') {
        navigate('/landlord/dashboard');
      } else if (role === 'tenant' || role === 'prospect') {
        navigate('/tenant/dashboard');
      } else if (role === 'property_manager') {
        navigate('/property-manager/dashboard');
      } else if (role === 'maintenance') {
        navigate('/maintenance/dashboard');
      } else {
        navigate('/'); // fallback
      }
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = 'Invalid email or password. Please try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      // For Google sign-in, we need to determine role first
      // Option 1: Show role selector modal before Google sign-in
      // Option 2: Check if user exists, use their role, or show role selector for new users
      
      // For now, let's detect from existing account or default to tenant
      const { role } = await signInWithGoogle('tenant'); // or show modal to select

      // Redirect based on role
      if (role === 'landlord') {
        navigate('/landlord/dashboard');
      } else if (role === 'tenant' || role === 'prospect') {
        navigate('/tenant/dashboard');
      } else if (role === 'property_manager') {
        navigate('/property-manager/dashboard');
      } else if (role === 'maintenance') {
        navigate('/maintenance/dashboard');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
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
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-800 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-800 rounded-full opacity-30 translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="max-w-6xl w-full relative z-10 mx-auto py-12 px-4 flex items-center min-h-screen">
        <div className="grid lg:grid-cols-2 gap-12 items-start w-full">
          {/* Left Side - Login Form */}
          <div>
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <button 
                  onClick={() => navigate('/')}
                  className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg transition-transform hover:scale-105"
                  aria-label="Go to home page"
                >
                  <img src="/images/logo-light.svg" alt="Nyumbanii Logo" className="h-16 w-auto drop-shadow-2xl" />
                </button>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-blue-200 text-lg">Login to your Nyumbanii account</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/15 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border-l-4 border-red-400 rounded-lg backdrop-blur-sm">
                  <p className="text-white text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none transition-all bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                      placeholder="john@example.com"
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
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none transition-all bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                      placeholder="••••••••"
                      disabled={loading}
                      required
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

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-900 border-white/30 rounded focus:ring-white/50 bg-white/10"
                      disabled={loading}
                    />
                    <span className="ml-2 text-sm text-white">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-white hover:text-blue-200 font-semibold transition-colors"
                    disabled={loading}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <span>Logging in...</span>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8">
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

              <div className="mt-8 text-center">
                <p className="text-white">
                  Don't have an account?{' '}
                  <button
                    onClick={() => !loading && navigate('/register')}
                    className={`text-blue-200 hover:text-white font-bold transition-colors ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:underline'}`}
                    disabled={loading}
                  >
                    Create Account
                  </button>
                </p>
              </div>

              {/* User Type Information */}
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-semibold text-lg mb-4 text-center">Logging in as:</h3>
                <div className="space-y-3 text-sm text-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-300 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <span className="font-semibold text-white">Landlord:</span> Directly sign up and access your dashboard
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-300 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <span className="font-semibold text-white">Tenant:</span> Register using the invitation link from your landlord
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-300 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <span className="font-semibold text-white">Property Manager:</span> Register using the invitation link from your landlord
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-300 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <span className="font-semibold text-white">Maintenance Staff:</span> Register using the invitation link from your landlord
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-200 mt-4 text-center italic">
                  Your account type is automatically detected based on your registration
                </p>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/')}
                className="text-white hover:text-blue-200 font-semibold transition-colors flex items-center gap-2 mx-auto"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Home
              </button>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="hidden lg:block overflow-hidden">
            <div className="relative">
              <img
                src="/images/login.png"
                alt="Property Management"
                className="w-full h-auto rounded-3xl shadow-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;