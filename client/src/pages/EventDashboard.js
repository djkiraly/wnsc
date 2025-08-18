import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const EventDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [bulkTasksInput, setBulkTasksInput] = useState('');

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: ''
  });

  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    note_type: 'general'
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    role: '',
    organization: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    contact_type: 'general',
    is_primary: false
  });

  useEffect(() => {
    fetchEventDetails();
    fetchUsers();
  }, [id]);

  useEffect(() => {
    if (event) {
      if (activeTab === 'tasks') {
        fetchTasks();
      } else if (activeTab === 'notes') {
        fetchNotes();
      } else if (activeTab === 'contacts') {
        fetchContacts();
      }
    }
  }, [activeTab, event]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setEvent(data.event);
      } else {
        toast.error('Failed to load event details');
        navigate('/events');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Error loading event');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/assignable', {
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

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?event_id=${id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/events/${id}/notes`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.notes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/events/${id}/contacts`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...taskForm,
          event_id: parseInt(id)
        })
      });

      const data = await response.json();
      console.log('Task creation response:', { status: response.status, data });
      if (data.success) {
        toast.success('Task added successfully');
        fetchTasks();
        setShowAddModal(false);
        setTaskForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
      } else {
        console.error('Failed to add task:', data);
        toast.error(data.message || 'Failed to add task');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Error adding task');
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/tasks/${editItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(taskForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Task updated successfully');
        fetchTasks();
        setShowEditModal(false);
        setEditItem(null);
        setTaskForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
      } else {
        console.error('Failed to update task:', data);
        toast.error(data.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error updating task');
    }
  };

  const handleBulkAddTasks = async (e) => {
    e.preventDefault();
    const taskLines = bulkTasksInput.split('\n').filter(line => line.trim());
    
    if (taskLines.length === 0) {
      toast.error('Please enter at least one task');
      return;
    }

    try {
      const promises = taskLines.map(async (line) => {
        const taskTitle = line.trim();
        return fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            title: taskTitle,
            description: '',
            priority: 'medium',
            event_id: parseInt(id)
          })
        });
      });

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.ok).length;
      
      if (successful === taskLines.length) {
        toast.success(`${successful} tasks created successfully`);
      } else {
        toast.success(`${successful} of ${taskLines.length} tasks created`);
      }
      
      fetchTasks();
      setShowBulkModal(false);
      setBulkTasksInput('');
    } catch (error) {
      console.error('Error bulk adding tasks:', error);
      toast.error('Error adding tasks');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Task status updated');
        fetchTasks();
      } else {
        toast.error(data.message || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Error updating task status');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Task deleted successfully');
        fetchTasks();
      } else {
        toast.error(data.message || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error deleting task');
    }
  };

  const startEditTask = (task) => {
    setEditItem(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      assigned_to: task.assigned_to || '',
      status: task.status
    });
    setShowEditModal(true);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/events/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(noteForm)
      });

      const data = await response.json();
      console.log('Note creation response:', { status: response.status, data });
      if (data.success) {
        toast.success('Note added successfully');
        fetchNotes();
        setShowAddModal(false);
        setNoteForm({ title: '', content: '', note_type: 'general' });
      } else {
        console.error('Failed to add note:', data);
        toast.error(data.message || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Error adding note');
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/events/${id}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(contactForm)
      });

      const data = await response.json();
      console.log('Contact creation response:', { status: response.status, data });
      if (data.success) {
        if (data.isNewDirectoryEntry) {
          toast.success('Contact added successfully and added to directory');
        } else {
          toast.success('Contact added successfully and linked to existing directory entry');
        }
        fetchContacts();
        setShowAddModal(false);
        setContactForm({
          name: '', role: '', organization: '', email: '', phone: '',
          address: '', notes: '', contact_type: 'general', is_primary: false
        });
      } else {
        console.error('Failed to add contact:', data);
        toast.error(data.message || 'Failed to add contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Error adding contact');
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/events/${id}/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Note deleted successfully');
        fetchNotes();
      } else {
        toast.error(data.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error deleting note');
    }
  };

  const deleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`/api/events/${id}/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Contact deleted successfully');
        fetchContacts();
      } else {
        toast.error(data.message || 'Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Error deleting contact');
    }
  };

  const getNoteTypeIcon = (type) => {
    switch (type) {
      case 'important': return ExclamationCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'reminder': return LightBulbIcon;
      default: return InformationCircleIcon;
    }
  };

  const getNoteTypeColor = (type) => {
    switch (type) {
      case 'important': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reminder': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getContactTypeColor = (type) => {
    const colors = {
      organizer: 'bg-purple-100 text-purple-800',
      venue: 'bg-green-100 text-green-800',
      sponsor: 'bg-yellow-100 text-yellow-800',
      vendor: 'bg-blue-100 text-blue-800',
      volunteer: 'bg-pink-100 text-pink-800',
      participant: 'bg-indigo-100 text-indigo-800',
      media: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.general;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading event...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Event not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The event you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/events')}
            className="btn-primary"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => navigate('/events')}
              className="mt-1 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event.status === 'published' ? 'bg-green-100 text-green-800' :
                  event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event.status}
                </span>
              </div>
              {event.description && (
                <p className="mt-1 text-gray-600">{event.description}</p>
              )}
              <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                {event.start_date && (
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    {new Date(event.start_date).toLocaleDateString()}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {event.location}
                  </div>
                )}
                {event.max_participants && (
                  <div className="flex items-center">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    {event.current_participants || 0} / {event.max_participants}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/events/${id}/edit`)}
            className="btn-secondary flex items-center"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Event
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClipboardDocumentListIcon className="h-5 w-5 inline mr-2" />
              Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Contacts ({contacts.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Add Button */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add {activeTab === 'tasks' ? 'Task' : activeTab === 'notes' ? 'Note' : 'Contact'}
              </button>
              
              {activeTab === 'tasks' && (
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="btn-secondary flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Bulk Add Tasks
                </button>
              )}
            </div>
            
            {activeTab === 'tasks' && selectedTasks.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{selectedTasks.length} selected</span>
                <button
                  onClick={() => {
                    selectedTasks.forEach(taskId => updateTaskStatus(taskId, 'completed'));
                    setSelectedTasks([]);
                  }}
                  className="btn-secondary text-sm"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => {
                    selectedTasks.forEach(taskId => deleteTask(taskId));
                    setSelectedTasks([]);
                  }}
                  className="btn-secondary text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first task for this event.
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks([...selectedTasks, task.id]);
                            } else {
                              setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            {task.assigned_to_first_name && (
                              <span>👤 {task.assigned_to_first_name} {task.assigned_to_last_name}</span>
                            )}
                            {task.due_date && (
                              <span>📅 {new Date(task.due_date).toLocaleDateString()}</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.priority} priority
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className={`text-xs border-0 rounded-full px-3 py-1 font-medium focus:ring-2 focus:ring-blue-500 ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => startEditTask(task)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {notes.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notes yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add notes to keep track of important information about this event.
                  </p>
                </div>
              ) : (
                notes.map((note) => {
                  const IconComponent = getNoteTypeIcon(note.note_type);
                  return (
                    <div key={note.id} className={`p-4 rounded-lg border-l-4 ${getNoteTypeColor(note.note_type)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium">{note.title}</h4>
                            {note.content && (
                              <p className="text-sm mt-1 whitespace-pre-wrap">{note.content}</p>
                            )}
                            <div className="text-xs mt-2 opacity-75">
                              By {note.created_by_first_name} {note.created_by_last_name} • {new Date(note.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-red-600 hover:text-red-800 ml-4"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              {contacts.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add contacts to keep track of people involved with this event.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{contact.name}</h4>
                            {contact.is_primary && (
                              <StarIcon className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getContactTypeColor(contact.contact_type)}`}>
                              {contact.contact_type}
                            </span>
                          </div>
                          {contact.role && (
                            <p className="text-sm text-gray-600">{contact.role}</p>
                          )}
                          {contact.organization && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                              {contact.organization}
                            </p>
                          )}
                          <div className="mt-2 space-y-1">
                            {contact.email && (
                              <p className="text-sm text-gray-600 flex items-center">
                                <EnvelopeIcon className="h-3 w-3 mr-1" />
                                {contact.email}
                              </p>
                            )}
                            {contact.phone && (
                              <p className="text-sm text-gray-600 flex items-center">
                                <PhoneIcon className="h-3 w-3 mr-1" />
                                {contact.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg bg-white rounded-lg shadow-lg">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add {activeTab === 'tasks' ? 'Task' : activeTab === 'notes' ? 'Note' : 'Contact'}
              </h3>
              
              {activeTab === 'tasks' ? (
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title *</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input
                        type="datetime-local"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={taskForm.due_date}
                        onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assign To</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={taskForm.assigned_to}
                      onChange={(e) => setTaskForm({...taskForm, assigned_to: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} - {user.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setTaskForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Add Task
                    </button>
                  </div>
                </form>
              ) : activeTab === 'notes' ? (
                <form onSubmit={handleAddNote} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={noteForm.note_type}
                      onChange={(e) => setNoteForm({...noteForm, note_type: e.target.value})}
                    >
                      <option value="general">General</option>
                      <option value="important">Important</option>
                      <option value="reminder">Reminder</option>
                      <option value="warning">Warning</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <textarea
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={noteForm.content}
                      onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setNoteForm({ title: '', content: '', note_type: 'general' });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Add Note
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contactForm.role}
                        onChange={(e) => setContactForm({...contactForm, role: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contactForm.contact_type}
                        onChange={(e) => setContactForm({...contactForm, contact_type: e.target.value})}
                      >
                        <option value="general">General</option>
                        <option value="organizer">Organizer</option>
                        <option value="venue">Venue</option>
                        <option value="sponsor">Sponsor</option>
                        <option value="vendor">Vendor</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="participant">Participant</option>
                        <option value="media">Media</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={contactForm.organization}
                      onChange={(e) => setContactForm({...contactForm, organization: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={contactForm.is_primary}
                        onChange={(e) => setContactForm({...contactForm, is_primary: e.target.checked})}
                      />
                      <span className="text-sm font-medium text-gray-700">Primary contact for this type</span>
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setContactForm({
                          name: '', role: '', organization: '', email: '', phone: '',
                          address: '', notes: '', contact_type: 'general', is_primary: false
                        });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Add Contact
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && activeTab === 'tasks' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg bg-white rounded-lg shadow-lg">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Task</h3>
              <form onSubmit={handleEditTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assign To</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={taskForm.assigned_to}
                    onChange={(e) => setTaskForm({...taskForm, assigned_to: e.target.value})}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} - {user.role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditItem(null);
                      setTaskForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Tasks Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg bg-white rounded-lg shadow-lg">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Add Tasks</h3>
              <form onSubmit={handleBulkAddTasks} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Titles (one per line)
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Set up registration table&#10;Prepare welcome packets&#10;Contact vendors&#10;Review schedule with staff"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={bulkTasksInput}
                    onChange={(e) => setBulkTasksInput(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter each task on a new line. Tasks will be created with medium priority and no assignment.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkTasksInput('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Tasks
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDashboard;