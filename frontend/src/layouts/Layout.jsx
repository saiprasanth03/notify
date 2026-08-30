import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bell, LayoutDashboard, Settings, History, LogOut } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Bell className="h-6 w-6 text-primary mr-2" />
          <span className="text-xl font-bold text-gray-900">WatchMyWeb</span>
        </div>
        <div className="flex-1 px-4 py-6 space-y-2">
          <Link to="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
            <LayoutDashboard className="h-5 w-5 mr-3 text-gray-500" />
            Dashboard
          </Link>
          <Link to="/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
            <Settings className="h-5 w-5 mr-3 text-gray-500" />
            Settings
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <div className="md:hidden flex items-center">
             <Bell className="h-6 w-6 text-primary mr-2" />
             <span className="text-xl font-bold text-gray-900">WatchMyWeb</span>
          </div>
          <div className="hidden md:block"></div>
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-4">Welcome, {user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center text-sm text-red-600 hover:text-red-800"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
