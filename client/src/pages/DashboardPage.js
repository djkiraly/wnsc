import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CalendarDaysIcon, 
  CheckCircleIcon, 
  UserGroupIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { user } = useAuth();

  // Placeholder data - in a real app, this would come from API calls
  const stats = [
    {
      name: 'Upcoming Events',
      value: '3',
      icon: CalendarDaysIcon,
      color: 'bg-blue-500',
      href: '/events'
    },
    {
      name: 'My Tasks',
      value: '7',
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      href: '/tasks'
    },
    {
      name: 'Team Members',
      value: '24',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      href: '/profile'
    },
    {
      name: 'Hours This Month',
      value: '12',
      icon: ClockIcon,
      color: 'bg-yellow-500',
      href: '/tasks'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'event',
      title: 'Basketball Tournament registration opened',
      time: '2 hours ago',
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'task',
      title: 'Completed: Reserve tournament courts',
      time: '5 hours ago',
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'event',
      title: 'New member joined: Sarah Johnson',
      time: '1 day ago',
      color: 'text-purple-600'
    },
    {
      id: 4,
      type: 'task',
      title: 'New task assigned: Order tournament trophies',
      time: '2 days ago',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-blue-100">
          Here's what's happening with the West Nebraska Sports Council today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <Link to="/events" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-gray-400 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              to="/events"
              className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">View Events</p>
                  <p className="text-sm text-gray-500">Browse upcoming events</p>
                </div>
              </div>
            </Link>
            
            <Link
              to="/tasks"
              className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">My Tasks</p>
                  <p className="text-sm text-gray-500">View assigned tasks</p>
                </div>
              </div>
            </Link>
            
            <Link
              to="/profile"
              className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Update Profile</p>
                  <p className="text-sm text-gray-500">Manage your information</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Role-specific content */}
      {(user?.role === 'admin' || user?.role === 'organizer') && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Organizer Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn-primary text-left p-4">
              <h3 className="font-medium mb-1">Create Event</h3>
              <p className="text-sm opacity-90">Schedule a new event</p>
            </button>
            <button className="btn-secondary text-left p-4">
              <h3 className="font-medium mb-1">Assign Tasks</h3>
              <p className="text-sm opacity-70">Delegate responsibilities</p>
            </button>
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn-secondary text-left p-4 block">
                <h3 className="font-medium mb-1">Admin Panel</h3>
                <p className="text-sm opacity-70">Manage users and settings</p>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;