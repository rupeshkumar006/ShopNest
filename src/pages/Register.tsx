import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services';
import { useUserAuth } from '../context/UserAuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn } = useUserAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    // Only 10 digits
    return /^\d{10}$/.test(phone);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Only allow digits, max 10
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: digits });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  function getErrorMessage(err: unknown): string {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') return (err as { message: string }).message;
    return 'An error occurred';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('=== REGISTRATION START ===');
    console.log('Form data:', formData);

    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone ? `+91${formData.phone}` : undefined
      });

      // Debug log to verify response
      console.log('=== REGISTRATION RESPONSE ===');
      console.log('Register response:', response);
      console.log('Register response (data):', response.data);
      console.log('Response success:', response.success);
      console.log('Response redirect:', response.redirect);
      console.log('Response data redirect:', response.data?.redirect);
      console.log('Response keys:', Object.keys(response));
      console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data');
      console.log('Response type:', typeof response);
      console.log('Response data type:', typeof response.data);
      console.log('Full response structure:', JSON.stringify(response, null, 2));

      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }

      // Check both response.redirect and response.data.redirect
      const redirect = response.redirect || (response.data && response.data.redirect);
      console.log('=== REDIRECT LOGIC ===');
      console.log('Final redirect value:', redirect);
      console.log('Redirect type:', typeof redirect);
      console.log('Redirect === "otp":', redirect === 'otp');
      console.log('Navigate function:', typeof navigate);

      if (redirect === 'otp') {
        console.log('Redirecting to OTP verification...');
        console.log('Email to pass:', formData.email);
        try {
          navigate('/verify-otp', { state: { email: formData.email } });
          console.log('Navigation successful');
        } catch (navError) {
          console.error('Navigation error:', navError);
        }
        setLoading(false);
        return;
      }

      console.log('No OTP redirect, going to login page');
      // Check for stored redirect path
      const storedRedirect = localStorage.getItem('redirectAfterLogin');
      if (storedRedirect) {
        navigate(`/login?redirect=${encodeURIComponent(storedRedirect)}`);
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
      console.log('=== REGISTRATION END ===');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          {/* Test button removed */}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{getErrorMessage(error)}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">
                Phone Number (Optional)
              </label>
              <div className="flex items-center">
                <span className="px-2 py-2 bg-gray-200 border border-r-0 border-gray-300 rounded-l">+91</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="appearance-none rounded-none rounded-r relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Phone Number (Optional)"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={10}
                  pattern="\d{10}"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
