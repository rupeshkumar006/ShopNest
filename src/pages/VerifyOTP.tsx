import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state && (location.state as any).email) || '';
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 1); // Only one digit
    const newOtp = [...otpDigits];
    newOtp[idx] = value;
    setOtpDigits(newOtp);
    // Move to next input if filled
    if (value && idx < 5) {
      const next = document.getElementById(`otp-input-${idx + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
  };
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      const prev = document.getElementById(`otp-input-${idx - 1}`);
      if (prev) (prev as HTMLInputElement).focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const otp = otpDigits.join('');
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.verifyOTP({ email, otp });
      if (response.success) {
        setSuccess('OTP verified! You can now log in.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(response.error || 'Invalid or expired OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);
    try {
      const response = await authService.sendOTP(email);
      if (response.success) {
        setSuccess('OTP resent to your email.');
      } else {
        setError(response.error || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the OTP sent to your email address.<br />
            <span className="font-semibold">{email}</span>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}
          <div className="flex justify-center gap-2 mb-4">
            {[0,1,2,3,4,5].map((i) => (
              <input
                key={i}
                id={`otp-input-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="w-10 h-10 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                value={otpDigits[i]}
                onChange={e => handleOtpChange(e, i)}
                onKeyDown={e => handleOtpKeyDown(e, i)}
                autoFocus={i === 0}
                disabled={loading}
              />
            ))}
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
            >
              {resendLoading ? 'Resending...' : 'Resend OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP; 