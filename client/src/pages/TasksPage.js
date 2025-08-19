import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  UserIcon,
  PlayIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    assigned_to: '',
    event_id: ''
  });
  const [addingQuick, setAddingQuick] = useState(false);
  const { user } = useAuth();

  // Fetch data on component mount
  useEffect(() => {
    fetchTasks();
    fetchEvents();
    fetchUsers();
  }, [statusFilter, priorityFilter, eventFilter]);

  useEffect(() => {
    // Client-side search filtering
    if (searchTerm) {
      const filtered = tasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.event_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setTasks(filtered);
    } else {
      fetchTasks();
    }
  }, [searchTerm]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (eventFilter !== 'all') params.append('event_id', eventFilter);

      const response = await fetch(`/api/tasks?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
      } else {
        console.error('Failed to fetch tasks:', data.message);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addTask = async (taskData) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(taskData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTasks(); // Refresh the list
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (taskData) => {
    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(taskData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTasks(); // Refresh the list
        setShowEditModal(false);
        setSelectedTask(null);
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTasks(); // Refresh the list
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTasks(tasks.filter(task => task.id !== taskId));
        setShowDropdown(null);
      } else {
        console.error('Failed to delete task:', data.message);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddData.title.trim()) {
      alert('Task title is required');
      return;
    }
    if (!quickAddData.event_id) {
      alert('Event association is required');
      return;
    }

    setAddingQuick(true);
    try {
      await addTask(quickAddData);
      setQuickAddData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        assigned_to: '',
        event_id: ''
      });
      setShowQuickAdd(false);
    } catch (error) {
      alert('Failed to add task: ' + error.message);
    } finally {
      setAddingQuick(false);
    }
  };

  const cancelQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickAddData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      due_date: '',
      assigned_to: '',
      event_id: ''
    });
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return FireIcon;
      case 'high': return ExclamationTriangleIcon;
      case 'medium': return ClockIcon;
      default: return ClockIcon;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'in_progress': return PlayIcon;
      case 'pending': return ClockIcon;
      case 'cancelled': return XMarkIcon;
      default: return ClockIcon;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600">Manage event-related tasks and assignments</p>
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
            Create Task
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks by title, description, or event..."
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Event Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-sm text-gray-600">
          Showing {tasks.length} tasks
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                  {/* Task */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Task title *"
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
                    </div>
                  </td>

                  {/* Event */}
                  <td className="px-6 py-4">
                    <select
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={quickAddData.event_id}
                      onChange={(e) => setQuickAddData({...quickAddData, event_id: e.target.value})}
                    >
                      <option value="">Select Event *</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>{event.title}</option>
                      ))}
                    </select>
                  </td>

                  {/* Assigned To */}
                  <td className="px-6 py-4">
                    <select
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={quickAddData.assigned_to}
                      onChange={(e) => setQuickAddData({...quickAddData, assigned_to: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Due Date */}
                  <td className="px-6 py-4">
                    <input
                      type="date"
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={quickAddData.due_date}
                      onChange={(e) => setQuickAddData({...quickAddData, due_date: e.target.value})}
                    />
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-4">
                    <select
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={quickAddData.priority}
                      onChange={(e) => setQuickAddData({...quickAddData, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <select
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={quickAddData.status}
                      onChange={(e) => setQuickAddData({...quickAddData, status: e.target.value})}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                    </select>
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

              {tasks.map((task) => {
                const StatusIcon = getStatusIcon(task.status);
                const PriorityIcon = getPriorityIcon(task.priority);
                const overdue = isOverdue(task.due_date, task.status);
                
                return (
                  <tr key={task.id} className={`hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}>
                    {/* Task */}
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${overdue ? 'bg-red-100' : 'bg-gray-100'}`}>
                            <StatusIcon className={`h-4 w-4 ${overdue ? 'text-red-600' : 'text-gray-600'}`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                            {overdue && <span className="text-red-600 ml-2">(Overdue)</span>}
                          </div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Event */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {task.event_title || 'No Event'}
                      </div>
                    </td>

                    {/* Assigned To */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {task.assigned_to_first_name ? 
                          `${task.assigned_to_first_name} ${task.assigned_to_last_name}` : 
                          'Unassigned'
                        }
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="px-6 py-4">
                      <div className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {formatDate(task.due_date)}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <PriorityIcon className="h-4 w-4 mr-1 text-gray-400" />
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Last Modified */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : '-'}
                      </div>
                      {task.modified_by_first_name && (
                        <div className="text-xs text-gray-400">
                          by {task.modified_by_first_name} {task.modified_by_last_name}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {/* Quick Status Change Buttons */}
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="text-green-600 hover:text-green-500"
                            title="Mark as completed"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {task.status === 'pending' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="text-blue-600 hover:text-blue-500"
                            title="Start task"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        <div className="relative">
                          <button
                            className="text-gray-400 hover:text-gray-600 p-1"
                            onClick={() => setShowDropdown(showDropdown === task.id ? null : task.id)}
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </button>
                          
                          {showDropdown === task.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                              <div className="py-1">
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowEditModal(true);
                                    setShowDropdown(null);
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4 inline mr-2" />
                                  Edit Task
                                </button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  onClick={() => deleteTask(task.id)}
                                >
                                  <TrashIcon className="h-4 w-4 inline mr-2" />
                                  Delete Task
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || eventFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first task.'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && eventFilter === 'all' && (
            <div className="mt-6">
              <button
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Task
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Creation Modal */}
      {showAddModal && (
        <TaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={addTask}
          events={events}
          users={users}
          title="Create New Task"
        />
      )}

      {/* Task Edit Modal */}
      {showEditModal && selectedTask && (
        <TaskModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTask(null);
          }}
          onSave={updateTask}
          task={selectedTask}
          events={events}
          users={users}
          title="Edit Task"
        />
      )}
    </div>
  );
};

// Task Modal Component
const TaskModal = ({ isOpen, onClose, onSave, task, events, users, title }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    assigned_to: '',
    event_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : '',
        assigned_to: task.assigned_to || '',
        event_id: task.event_id || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        assigned_to: '',
        event_id: ''
      });
    }
    setErrors({});
  }, [task]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.event_id) {
      newErrors.event_id = 'Event association is required';
    }

    if (formData.due_date && new Date(formData.due_date) < new Date().setHours(0, 0, 0, 0)) {
      newErrors.due_date = 'Due date cannot be in the past';
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
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null
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
      <div className="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter task title"
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
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event *
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.event_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.event_id}
                  onChange={(e) => handleInputChange('event_id', e.target.value)}
                >
                  <option value="">Select Event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </select>
                {errors.event_id && <p className="text-xs text-red-600 mt-1">{errors.event_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.assigned_to}
                  onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
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
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.due_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                />
                {errors.due_date && <p className="text-xs text-red-600 mt-1">{errors.due_date}</p>}
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
                  {task ? 'Update Task' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;