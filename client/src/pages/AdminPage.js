import React, { useState } from 'react';
import { 
  UserGroupIcon,
  CogIcon,
  ChartBarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import UserManagement from '../components/UserManagement';

const AdminPage = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />;
      case 'settings':
        return (
          <div className="card">
            <div className="text-center py-12">
              <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
              <p className="text-gray-600">System configuration features coming soon.</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="card">
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
              <p className="text-gray-600">Analytics and reporting features coming soon.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900 ml-3">User Management</h3>
                </div>
                <p className="text-gray-600 mb-4">Manage user roles, permissions, and account status</p>
                <button 
                  className="btn-primary w-full"
                  onClick={() => setActiveSection('users')}
                >
                  Manage Users
                </button>
              </div>
              
              <div className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <CogIcon className="h-8 w-8 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900 ml-3">System Settings</h3>
                </div>
                <p className="text-gray-600 mb-4">Configure system-wide settings and preferences</p>
                <button 
                  className="btn-secondary w-full"
                  onClick={() => setActiveSection('settings')}
                >
                  Settings
                </button>
              </div>
              
              <div className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900 ml-3">Reports</h3>
                </div>
                <p className="text-gray-600 mb-4">View system analytics, usage reports, and insights</p>
                <button 
                  className="btn-secondary w-full"
                  onClick={() => setActiveSection('reports')}
                >
                  View Reports
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Users</span>
                    <span className="font-medium text-gray-900">Loading...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Events</span>
                    <span className="font-medium text-gray-900">Loading...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Tasks</span>
                    <span className="font-medium text-gray-900">Loading...</span>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <p className="text-gray-600 text-sm">Activity tracking coming soon...</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation breadcrumb */}
      {activeSection !== 'dashboard' && (
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Admin Dashboard
          </button>
        </div>
      )}
      
      {/* Main content */}
      {renderContent()}
    </div>
  );
};

export default AdminPage;