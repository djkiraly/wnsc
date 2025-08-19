import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CalendarDaysIcon, 
  CheckCircleIcon, 
  UserGroupIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { user } = useAuth();
  const [showEventModal, setShowEventModal] = useState(false);

  const addEvent = async (eventData) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(eventData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEventModal(false);
        // Show success message or redirect to events page
        window.location.href = '/events';
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

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
            <button 
              className="btn-primary text-left p-4"
              onClick={() => setShowEventModal(true)}
            >
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

      {/* Event Creation Modal */}
      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onSave={addEvent}
          title="Create New Event"
        />
      )}
    </div>
  );
};

// Event Modal Component (reused from EventsPage)
const EventModal = ({ isOpen, onClose, onSave, event, title }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'general',
    location: '',
    venue_details: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    max_participants: '',
    status: 'draft'
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || 'general',
        location: event.location || '',
        venue_details: event.venue_details || '',
        start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '',
        end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
        registration_deadline: event.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : '',
        max_participants: event.max_participants || '',
        status: event.status || 'draft'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        event_type: 'general',
        location: '',
        venue_details: '',
        start_date: '',
        end_date: '',
        registration_deadline: '',
        max_participants: '',
        status: 'draft'
      });
    }
    setErrors({});
  }, [event]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.event_type) {
      newErrors.event_type = 'Event type is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (formData.start_date && formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.registration_deadline && formData.start_date && new Date(formData.registration_deadline) > new Date(formData.start_date)) {
      newErrors.registration_deadline = 'Registration deadline must be before start date';
    }

    if (formData.max_participants && (isNaN(formData.max_participants) || formData.max_participants < 1)) {
      newErrors.max_participants = 'Max participants must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        ...formData,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null
      };
      await onSave(dataToSend);
      onClose();
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={onClose}
              disabled={saving}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                />
                {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter event description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.event_type ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.event_type}
                  onChange={(e) => handleInputChange('event_type', e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="tournament">Tournament</option>
                  <option value="meeting">Meeting</option>
                  <option value="training">Training</option>
                  <option value="social">Social</option>
                </select>
                {errors.event_type && <p className="text-xs text-red-600 mt-1">{errors.event_type}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Event Details</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter event location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Details
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  value={formData.venue_details}
                  onChange={(e) => handleInputChange('venue_details', e.target.value)}
                  placeholder="Additional venue information"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.start_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />
                {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.end_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />
                {errors.end_date && <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.registration_deadline ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.registration_deadline}
                  onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                />
                {errors.registration_deadline && <p className="text-xs text-red-600 mt-1">{errors.registration_deadline}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Participants
                </label>
                <input
                  type="number"
                  min="1"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.max_participants ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.max_participants}
                  onChange={(e) => handleInputChange('max_participants', e.target.value)}
                  placeholder="Leave empty for unlimited"
                />
                {errors.max_participants && <p className="text-xs text-red-600 mt-1">{errors.max_participants}</p>}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn-primary flex items-center"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {event ? 'Update Event' : 'Create Event'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;