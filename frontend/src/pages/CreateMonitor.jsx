import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Bell, ArrowLeft } from 'lucide-react';

const CreateMonitor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    url: '',
    name: '',
    description: '',
    identifier: '',
    type: 'General Website',
    frequency: 5,
    notificationMethods: {
      email: true,
      telegram: false
    }
  });

  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch profile to know telegram connection status
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [user.token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'email' || name === 'telegram') {
      setFormData(prev => ({
        ...prev,
        notificationMethods: {
          ...prev.notificationMethods,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate Telegram connection
    if (formData.notificationMethods.telegram && !profile?.telegramConnected) {
      setError('You must connect your Telegram account in Settings before enabling Telegram notifications.');
      return;
    }
    
    try {
      await axios.post('/api/monitors', formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create monitor');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-4">
        <Link to="/" className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Monitor</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6 md:p-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monitor Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monitor Name *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. ABC Industries IPO"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Website URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL *</label>
              <input
                type="url"
                name="url"
                required
                placeholder="https://example.com/results"
                value={formData.url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monitor Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary bg-white"
              >
                <option>General Website</option>
                <option>IPO / Allotment Result</option>
                <option>College / University Result</option>
                <option>Exam Result</option>
                <option>Government Notification</option>
              </select>
            </div>

            {/* Identifier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'IPO / Allotment Result' ? 'PAN Numbers' : 'ID Numbers / Identifiers'} (Optional)
              </label>
              <textarea
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                rows={3}
                placeholder={formData.type === 'IPO / Allotment Result' ? 'e.g. ABCDE1234F, XYZAB5678C (You can enter multiple PAN numbers separated by commas)' : 'e.g. Roll Number, Registration ID, etc. (Separate multiple with commas)'}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">What are you waiting for? (Description)</label>
              <textarea
                name="description"
                rows="3"
                placeholder="Notify me when 3rd Year 1st Semester results are released."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check Frequency</label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary bg-white"
              >
                <option value={1}>Every 1 minute (Fast Test)</option>
                <option value={5}>Every 5 minutes</option>
                <option value={10}>Every 10 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 1 hour</option>
              </select>
            </div>
            
            <div className="hidden md:block"></div>

            {/* Notification Methods */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">Notification Method</label>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="email"
                    name="email"
                    checked={formData.notificationMethods.email}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="email" className="ml-2 block text-sm text-gray-900">
                    Email
                  </label>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="telegram"
                      name="telegram"
                      checked={formData.notificationMethods.telegram}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="telegram" className="ml-2 block text-sm text-gray-900">
                      Telegram
                    </label>
                  </div>
                  
                  {/* Warning if selected but not connected */}
                  {formData.notificationMethods.telegram && !profile?.telegramConnected && (
                    <div className="ml-6 mt-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-sm text-yellow-800">Telegram is not connected.</p>
                      <Link to="/settings" className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
                        🔗 Connect Telegram
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end">
             <button
              type="submit"
              className="flex justify-center items-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Bell className="w-4 h-4 mr-2" />
              Start Monitoring
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default CreateMonitor;
