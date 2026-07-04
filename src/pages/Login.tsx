import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { authService } from '../services';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'otp'>('email');
  const [resetOTP, setResetOTP] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { login, error: authError, isLoggedIn } = useUserAuth();
  const [formError, setFormError] = useState('');

  useEffect(() => {
    console.log('Login page isLoggedIn:', isLoggedIn);
    if (isLoggedIn) {
      // Get the redirect path from URL params or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || localStorage.getItem('redirectAfterLogin') || '/dashboard';
      
      // Clear the stored redirect path
      localStorage.removeItem('redirectAfterLogin');
      
      navigate(redirectTo);
    }
  }, [isLoggedIn, navigate]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'string') {
      return err;
    }
    if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    if (typeof err === 'object' && err !== null && 'error' in err && typeof (err as { error?: unknown }).error === 'string') {
      return (err as { error: string }).error;
    }
    return 'An error occurred';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    console.log('Login attempt:', email);

    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setFormError('Invalid email format');
      return;
    }

    if (!password.trim()) {
      setFormError('Password is required');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      console.log('Login result:', login);
      // Navigation will be handled by useEffect below
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      
      // Check if this is an unverified account error
      if (errorMessage.includes('Account not verified') || errorMessage.includes('OTP')) {
        // Redirect to OTP verification page with the email
        console.log('Account not verified, redirecting to OTP verification...');
        navigate('/verify-otp', { state: { email: email } });
        return;
      }
      
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (resetStep === 'email') {
      if (!resetEmail.trim()) {
        setResetError('Email is required');
        return;
      }

      if (!validateEmail(resetEmail)) {
        setResetError('Invalid email format');
        return;
      }

      try {
        const response = await authService.sendOTP(resetEmail, true);
        if (!response.success) {
          throw new Error(response.error || 'Failed to send reset email');
        }
        setResetSuccess('Password reset OTP sent to your email.');
        setResetStep('otp');
      } catch (err: unknown) {
        setResetError(getErrorMessage(err));
      }
    } else if (resetStep === 'otp') {
      if (!resetOTP.trim()) {
        setResetError('OTP is required');
        return;
      }

      if (!resetNewPassword.trim()) {
        setResetError('New password is required');
        return;
      }

      if (resetNewPassword !== resetConfirmPassword) {
        setResetError('Passwords do not match');
        return;
      }

      try {
        const response = await authService.resetPassword({
          email: resetEmail,
          otp: resetOTP,
          newPassword: resetNewPassword
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to reset password');
        }

        setResetSuccess(response.message || 'Password reset successful! You can now log in.');
        setTimeout(() => setShowReset(false), 1500);
      } catch (err: unknown) {
        setResetError(getErrorMessage(err));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {!showReset ? (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Sign in to your account
              </h2>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {formError && <div className="text-red-600 mb-2">{formError}</div>}
              {authError && <div className="text-red-600 mb-2">{authError}</div>}
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/register"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Don't have an account? Register
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset Password
            </h2>
            <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
              {resetError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{resetError}</div>
                </div>
              )}
              {resetSuccess && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">{resetSuccess}</div>
                </div>
              )}

              {resetStep === 'email' ? (
                <div>
                  <label htmlFor="reset-email" className="sr-only">Email address</label>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="otp" className="sr-only">OTP</label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Enter OTP"
                      value={resetOTP}
                      onChange={(e) => setResetOTP(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="sr-only">New Password</label>
                    <input
                      id="new-password"
                      name="new-password"
                      type="password"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="New Password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Confirm Password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {resetStep === 'email' ? 'Send Reset Link' : 'Reset Password'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
