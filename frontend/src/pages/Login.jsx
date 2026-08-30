import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Enter OTP
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [action, setAction] = useState('');
  const [botUsername, setBotUsername] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setAction('');
    
    try {
      const res = await axios.post('/api/auth/request-otp', { identifier });
      setMessage(res.data.message);
      if (res.data.action) setAction(res.data.action);
      if (res.data.botUsername) setBotUsername(res.data.botUsername);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await axios.post('/api/auth/verify-otp', { identifier, otp });
      login(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to WatchMyWeb
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            No passwords required. We'll send an OTP to your Telegram.
          </p>
        </div>
        
        {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
        {message && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-4 rounded flex flex-col items-center">
            <p>{message}</p>
            {action === 'NEW_USER' && botUsername && (
              <a 
                href={`https://t.me/${botUsername}?start=login`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none"
              >
                Open Telegram Bot ↗
              </a>
            )}
          </div>
        )}

        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequestOtp}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="identifier" className="sr-only">Phone Number or Telegram Username</label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Phone Number or @username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Get Login OTP
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="otp" className="sr-only">Enter OTP</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center tracking-widest text-lg font-mono"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Verify & Login
              </button>
            </div>
            
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Go back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
