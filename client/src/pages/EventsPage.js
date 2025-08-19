import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  HeartIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    title: '',
    description: '',
    event_type: 'general',
    location: '',
    start_date: '',
    end_date: '',
    max_participants: '',
    status: 'draft'
  });
  const [addingQuick, setAddingQuick] = useState(false);
  const { user } = useAuth();

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, [searchTerm, statusFilter, typeFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/events?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        let filteredEvents = data.events;
        
        // Client-side search filtering
        if (searchTerm) {
          filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setEvents(filteredEvents);
      } else {
        console.error('Failed to fetch events:', data.message);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

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
        fetchEvents(); // Refresh the list
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const updateEvent = async (eventData) => {
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(eventData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchEvents(); // Refresh the list
        setShowEditModal(false);
        setSelectedEvent(null);
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEvents(events.filter(event => event.id !== eventId));
        setShowDropdown(null);
      } else {
        console.error('Failed to delete event:', data.message);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddData.title.trim()) {
      alert('Event title is required');
      return;
    }

    setAddingQuick(true);
    try {
      await addEvent(quickAddData);
      setQuickAddData({
        title: '',
        description: '',
        event_type: 'general',
        location: '',
        start_date: '',
        end_date: '',
        max_participants: '',
        status: 'draft'
      });
      setShowQuickAdd(false);
    } catch (error) {
      alert('Failed to add event: ' + error.message);
    } finally {
      setAddingQuick(false);
    }
  };

  const cancelQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickAddData({
      title: '',
      description: '',
      event_type: 'general',
      location: '',
      start_date: '',
      end_date: '',
      max_participants: '',
      status: 'draft'
    });
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'tournament': return CalendarDaysIcon;
      case 'meeting': return BuildingOfficeIcon;
      case 'training': return AcademicCapIcon;
      case 'social': return HeartIcon;
      default: return UserGroupIcon;
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'tournament': return 'bg-red-100 text-red-800';
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'training': return 'bg-green-100 text-green-800';
      case 'social': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600">Manage sports events and tournaments</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="btn-secondary flex items-center"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Quick Add
          </button>
          <button
            className="btn-primary flex items-center"
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Event
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events by title, description, or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="tournament">Tournament</option>
              <option value="meeting">Meeting</option>
              <option value="training">Training</option>
              <option value="social">Social</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-sm text-gray-600">
          Showing {events.length} events
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Modified
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Quick Add Row */}
              {showQuickAdd && (
                <tr className="bg-blue-50 border-l-4 border-blue-500">
                  {/* Event */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Event title *"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={quickAddData.title}
                        onChange={(e) => setQuickAddData({...quickAddData, title: e.target.value})}
                      />
                      <textarea
                        placeholder="Description"
                        rows={2}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={quickAddData.description}
                        onChange={(e) => setQuickAddData({...quickAddData, description: e.target.value})}
                      />
                      <select
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={quickAddData.event_type}
                        onChange={(e) => setQuickAddData({...quickAddData, event_type: e.target.value})}
                      >
                        <option value="general">General</option>
                        <option value="tournament">Tournament</option>
                        <option value="meeting">Meeting</option>
                        <option value="training">Training</option>
                        <option value="social">Social</option>
                      </select>
                    </div>
                  </td>

                  {/* Dates & Location */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <input
                        type="datetime-local"
                        placeholder="Start date"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={quickAddData.start_date}
                        onChange={(e) => setQuickAddData({...quickAddData, start_date: e.target.value})}
                      />
                      <input
                        type="datetime-local"
                        placeholder="End date"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={quickAddData.end_date}
                        onChange={(e) => setQuickAddData({...quickAddData, end_date: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={quickAddData.location}
                        onChange={(e) => setQuickAddData({...quickAddData, location: e.target.value})}
                      />
                    </div>
                  </td>

                  {/* Participants */}
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      placeholder="Max participants"
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={quickAddData.max_participants}
                      onChange={(e) => setQuickAddData({...quickAddData, max_participants: e.target.value})}
                    />
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <select
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={quickAddData.status}
                      onChange={(e) => setQuickAddData({...quickAddData, status: e.target.value})}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </td>

                  {/* Created By */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.first_name} {user.last_name}
                  </td>

                  {/* Last Modified */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    -
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleQuickAdd}
                        disabled={addingQuick}
                        className="text-green-600 hover:text-green-500 disabled:opacity-50"
                      >
                        {addingQuick ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          <CheckCircleIcon className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={cancelQuickAdd}
                        className="text-red-600 hover:text-red-500"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {events.map((event) => {
                const TypeIcon = getEventTypeIcon(event.event_type);
                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    {/* Event */}
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <TypeIcon className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </div>
                          {event.description && (
                            <div className="text-sm text-gray-500 truncate">
                              {event.description}
                            </div>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)} mt-1`}>
                            {event.event_type}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Dates & Location */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(event.start_date)}
                        </div>
                        {event.end_date && (
                          <div className="text-sm text-gray-500">
                            to {formatDate(event.end_date)}
                          </div>
                        )}
                        {event.location && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Participants */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {event.current_participants || 0}
                        {event.max_participants && ` / ${event.max_participants}`}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </td>

                    {/* Created By */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event.created_by_first_name} {event.created_by_last_name}
                    </td>

                    {/* Last Modified */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        {event.updated_at ? new Date(event.updated_at).toLocaleDateString() : '-'}
                      </div>
                      {event.modified_by_first_name && (
                        <div className="text-xs text-gray-400">
                          by {event.modified_by_first_name} {event.modified_by_last_name}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1"
                          onClick={() => setShowDropdown(showDropdown === event.id ? null : event.id)}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                        
                        {showDropdown === event.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div className="py-1">
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  window.location.href = `/events/${event.id}/dashboard`;
                                }}
                              >
                                <ClipboardDocumentListIcon className="h-4 w-4 inline mr-2" />
                                Manage Event
                              </button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowEditModal(true);
                                  setShowDropdown(null);
                                }}
                              >
                                <PencilIcon className="h-4 w-4 inline mr-2" />
                                Edit Event
                              </button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                onClick={() => deleteEvent(event.id)}
                              >
                                <TrashIcon className="h-4 w-4 inline mr-2" />
                                Delete Event
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first event.'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
            <div className="mt-6">
              <button
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Event
              </button>
            </div>
          )}
        </div>
      )}

      {/* Event Creation Modal */}
      {showAddModal && (
        <EventModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={addEvent}
          title="Create New Event"
        />
      )}

      {/* Event Edit Modal */}
      {showEditModal && selectedEvent && (
        <EventModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          onSave={updateEvent}
          event={selectedEvent}
          title="Edit Event"
        />
      )}
    </div>
  );
};

// Event Modal Component
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

export default EventsPage;