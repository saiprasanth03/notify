import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      const { data } = await axios.get('/api/monitors', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMonitors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this monitor?')) {
      try {
        await axios.delete(`/api/monitors/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchMonitors();
      } catch (err) {
        console.error('Failed to delete', err);
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus === 'ACTIVE' ? 'pause' : 'resume';
    try {
      await axios.post(`/api/monitors/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchMonitors();
    } catch (err) {
      console.error(`Failed to ${action}`, err);
    }
  };

  const summary = {
    active: monitors.filter(m => m.status === 'ACTIVE').length,
    waiting: monitors.filter(m => m.status === 'PAUSED').length,
    triggered: monitors.filter(m => m.status === 'TRIGGERED').length
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your monitors...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/create" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm">
          <Plus className="h-5 w-5 mr-2" />
          Create New Monitor
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Active Monitors</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.active}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Paused</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.waiting}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-t-4 border-t-green-500">
          <h3 className="text-gray-500 text-sm font-medium">Triggered</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{summary.triggered}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">MY MONITORS</h2>
      {monitors.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 mb-4">You haven't created any monitors yet.</p>
          <Link to="/create" className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium">
            <Plus className="w-4 h-4 mr-1" /> Add your first monitor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {monitors.map((monitor) => (
            <div key={monitor._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{monitor.name}</h3>
                {monitor.identifier && (
                  <p className="text-sm font-medium text-blue-700 mb-1">
                    {monitor.type === 'IPO / Allotment Result' ? 'PAN' : 'ID Number'}: {monitor.identifier}
                  </p>
                )}
                <p className="text-sm text-gray-600 mb-2">{monitor.description || monitor.url}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`flex items-center px-2 py-1 rounded-full ${
                    monitor.status === 'ACTIVE' ? 'text-green-600 bg-green-50' : 
                    monitor.status === 'TRIGGERED' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-100'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      monitor.status === 'ACTIVE' ? 'bg-green-500' : 
                      monitor.status === 'TRIGGERED' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}></span>
                    {monitor.status}
                  </span>
                  <span className="text-gray-500">Last checked: {monitor.lastCheckedAt ? new Date(monitor.lastCheckedAt).toLocaleTimeString() : 'Never'}</span>
                </div>
                
                {monitor.allotmentResults && monitor.allotmentResults.length > 0 && (
                  <div className="mt-4 border rounded-md overflow-hidden bg-gray-50">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-gray-700 uppercase">
                        <tr>
                          <th className="px-3 py-2 font-medium">{monitor.type === 'IPO / Allotment Result' ? 'PAN' : 'ID'}</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium">{monitor.type === 'IPO / Allotment Result' ? 'Name' : 'Result'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monitor.allotmentResults.map((res, i) => (
                          <tr key={i} className="border-t border-gray-200 bg-white">
                            <td className="px-3 py-2 font-mono text-gray-700">{res.pan}</td>
                            <td className={`px-3 py-2 font-medium ${res.status === 'Allotted' ? 'text-green-600' : res.status === 'Not Allotted' ? 'text-red-600' : 'text-gray-600'}`}>
                              {res.status}
                            </td>
                            <td className="px-3 py-2 text-gray-600 truncate max-w-[150px]" title={res.name}>{res.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col space-y-2 items-end">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleToggleStatus(monitor._id, monitor.status)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                    title={monitor.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                  >
                    {monitor.status === 'ACTIVE' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <button 
                    onClick={() => handleDelete(monitor._id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
                {monitor.identifier && (monitor.url.includes('kfintech') || monitor.url.includes('mufg') || monitor.url.includes('vishnu.edu')) && (
                  <button 
                    className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md mt-2 flex items-center gap-2"
                    onClick={async (e) => {
                      e.target.disabled = true;
                      e.target.innerText = 'Fetching...';
                      try {
                        await axios.post(`/api/monitors/${monitor._id}/scrape`, {}, {
                          headers: { Authorization: `Bearer ${user.token}` }
                        });
                        fetchMonitors();
                      } catch(err) {
                        alert('Scraping failed or unsupported');
                      } finally {
                        e.target.disabled = false;
                        e.target.innerText = 'Fetch Results';
                      }
                    }}
                  >
                    Fetch Results
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
