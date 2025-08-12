import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  UserGroupIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        console.error('Failed to fetch users:', data.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the user in the local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        setShowDropdown(null);
      } else {
        console.error('Failed to update user role:', data.message);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the user in the local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        ));
        setShowDropdown(null);
      } else {
        console.error('Failed to update user status:', data.message);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const startEditing = (user) => {
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      organization: user.organization || '',
      bio: user.bio || ''
    });
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!editForm.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!editForm.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!editForm.email?.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (editForm.phone && editForm.phone.length > 0) {
      const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
      if (!phoneRegex.test(editForm.phone)) {
        newErrors.phone = 'Invalid phone number format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveUserDetails = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the user in the local state
        setUsers(users.map(user => 
          user.id === selectedUser.id ? data.user : user
        ));
        setSelectedUser(data.user);
        setIsEditing(false);
        setEditForm({});
        setErrors({});
      } else {
        setErrors({ general: data.message });
      }
    } catch (error) {
      console.error('Error updating user details:', error);
      setErrors({ general: 'Failed to update user details' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.organization || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return ShieldCheckIcon;
      case 'organizer': return CogIcon;
      case 'member': return UserIcon;
      default: return UserIcon;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'organizer': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserGroupIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user roles, permissions, and status</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Total: {filteredUsers.length} users
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or organization..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="organizer">Organizer</option>
              <option value="member">Member</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.profile_picture ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.profile_picture}
                            alt={`${user.first_name} ${user.last_name}`}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.first_name[0]}{user.last_name[0]}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status === 'active' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                        {user.status === 'inactive' && <XCircleIcon className="h-3 w-3 mr-1" />}
                        {user.status === 'pending' && <ClockIcon className="h-3 w-3 mr-1" />}
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.organization || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1"
                          onClick={() => setShowDropdown(showDropdown === user.id ? null : user.id)}
                          disabled={user.id === currentUser.id}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                        
                        {showDropdown === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div className="py-1">
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                  setShowDropdown(null);
                                }}
                              >
                                <PencilIcon className="h-4 w-4 inline mr-2" />
                                View Details
                              </button>
                              
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedUser(user);
                                  startEditing(user);
                                  setShowUserModal(true);
                                  setShowDropdown(null);
                                }}
                              >
                                <PencilIcon className="h-4 w-4 inline mr-2" />
                                Edit Details
                              </button>
                              
                              {user.role !== 'admin' && (
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => updateUserRole(user.id, 'admin')}
                                >
                                  Make Admin
                                </button>
                              )}
                              
                              {user.role !== 'organizer' && (
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => updateUserRole(user.id, 'organizer')}
                                >
                                  Make Organizer
                                </button>
                              )}
                              
                              {user.role !== 'member' && (
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => updateUserRole(user.id, 'member')}
                                >
                                  Make Member
                                </button>
                              )}
                              
                              <div className="border-t border-gray-100"></div>
                              
                              {user.status === 'active' ? (
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  onClick={() => updateUserStatus(user.id, 'inactive')}
                                >
                                  Deactivate User
                                </button>
                              ) : (
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                  onClick={() => updateUserStatus(user.id, 'active')}
                                >
                                  Activate User
                                </button>
                              )}
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* User Details Modal - We'll implement this next */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? 'Edit User Details' : 'User Details'}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setShowUserModal(false);
                    setIsEditing(false);
                    setEditForm({});
                    setErrors({});
                  }}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Profile Section */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-4">
                  {selectedUser.profile_picture ? (
                    <img
                      className="h-16 w-16 rounded-full"
                      src={selectedUser.profile_picture}
                      alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xl font-medium text-gray-700">
                        {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                        {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">First Name</label>
                      {isEditing ? (
                        <div>
                          <input
                            type="text"
                            className={`w-full mt-1 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.first_name ? 'border-red-300' : 'border-gray-300'
                            }`}
                            value={editForm.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                          />
                          {errors.first_name && (
                            <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900">{selectedUser.first_name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500">Last Name</label>
                      {isEditing ? (
                        <div>
                          <input
                            type="text"
                            className={`w-full mt-1 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.last_name ? 'border-red-300' : 'border-gray-300'
                            }`}
                            value={editForm.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                          />
                          {errors.last_name && (
                            <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900">{selectedUser.last_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">Email</label>
                      {isEditing ? (
                        <div>
                          <input
                            type="email"
                            className={`w-full mt-1 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.email ? 'border-red-300' : 'border-gray-300'
                            }`}
                            value={editForm.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                          />
                          {errors.email && (
                            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900">{selectedUser.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      {isEditing ? (
                        <div>
                          <input
                            type="tel"
                            className={`w-full mt-1 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.phone ? 'border-red-300' : 'border-gray-300'
                            }`}
                            value={editForm.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Optional"
                          />
                          {errors.phone && (
                            <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500">Organization</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={editForm.organization}
                          onChange={(e) => handleInputChange('organization', e.target.value)}
                          placeholder="Optional"
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{selectedUser.organization || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Account Information</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">User ID</label>
                      <p className="text-sm text-gray-900">{selectedUser.id}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Joined</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Last Updated</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedUser.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-900 mb-2 block">Bio</label>
                {isEditing ? (
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    value={editForm.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Optional bio information..."
                  />
                ) : (
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedUser.bio || 'No bio provided'}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  {!isEditing && selectedUser.id !== currentUser.id && (
                    <>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedUser.role}
                        onChange={(e) => {
                          updateUserRole(selectedUser.id, e.target.value);
                          setSelectedUser({...selectedUser, role: e.target.value});
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="organizer">Organizer</option>
                        <option value="member">Member</option>
                      </select>
                      
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedUser.status}
                        onChange={(e) => {
                          updateUserStatus(selectedUser.id, e.target.value);
                          setSelectedUser({...selectedUser, status: e.target.value});
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  {isEditing ? (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={cancelEditing}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-primary flex items-center"
                        onClick={saveUserDetails}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={() => startEditing(selectedUser)}
                      >
                        Edit Details
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setShowUserModal(false);
                          setIsEditing(false);
                          setEditForm({});
                          setErrors({});
                        }}
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 