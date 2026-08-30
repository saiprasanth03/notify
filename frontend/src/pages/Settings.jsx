import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Send, CheckCircle, XCircle } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectTelegram = async () => {
    try {
      const { data } = await axios.get('/api/telegram/token', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Replace YOUR_BOT_USERNAME with the actual bot username provided via env in real app
      // For local demo, we assume the user knows the bot username, or we can hardcode for demo purposes
      const botUsername = 'WatchMyWebNotifierBot'; // Mock username for UX
      window.open(`https://t.me/${botUsername}?start=${data.token}`, '_blank');
      
      // In a real app we'd poll or use a websocket to detect when they connect
      alert('Opened Telegram! Please click START. Then refresh this page to see your connected status.');
    } catch (error) {
      alert('Failed to generate connection token');
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!window.confirm('Disconnect Telegram? You will no longer receive Telegram notifications.')) return;
    
    try {
      await axios.post('/api/telegram/disconnect', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchProfile();
    } catch (error) {
      alert('Failed to disconnect Telegram');
    }
  };

  const handleTestNotification = async () => {
    setTestStatus('Sending...');
    try {
      await axios.post('/api/auth/telegram/test', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTestStatus('✓ Test notification sent');
      setTimeout(() => setTestStatus(''), 3000);
    } catch (error) {
      setTestStatus('Unable to send Telegram notification. Please reconnect your Telegram account.');
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-gray-900">{profile?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Telegram Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Send className="text-blue-500 w-6 h-6" />
          <h2 className="text-xl font-semibold">Telegram</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-md">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Status: Connected via Login</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              Connected as <span className="font-semibold">@{profile?.telegramUsername || profile?.name}</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-4 pt-4">
            <button
              onClick={handleTestNotification}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Send Test Notification
            </button>
          </div>
          {testStatus && (
            <p className={`text-sm mt-2 ${testStatus.includes('Unable') ? 'text-red-600' : 'text-green-600'}`}>
              {testStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
