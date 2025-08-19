import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserIcon,
  PencilIcon,
  CheckCircleIcon,
  CameraIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/profile', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.user);
        setEditForm({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          phone: data.user.phone || '',
          organization: data.user.organization || '',
          bio: data.user.bio || ''
        });
      } else {
        console.error('Failed to fetch profile:', data.message);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };


  const validateForm = () => {
    const newErrors = {};

    if (!editForm.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!editForm.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
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


  const saveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.user);
        // Profile updated successfully - context will be updated on next status check
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrors({ general: data.message });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };


  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone || '',
      organization: profile.organization || '',
      bio: profile.bio || ''
    });
    setErrors({});
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'organizer': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return ShieldCheckIcon;
      case 'organizer': return UserIcon;
      case 'member': return UserIcon;
      default: return UserIcon;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load your profile information.</p>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(profile.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your personal information and settings</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="w-24 h-24 rounded-full border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-700">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </span>
                </div>
              )}
              <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow">
                <CameraIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">
                {profile.first_name} {profile.last_name}
              </h2>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(profile.role)} bg-opacity-90`}>
                  <RoleIcon className="h-4 w-4 mr-1" />
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
                <span className="text-blue-100">•</span>
                <span className="text-blue-100">{profile.email}</span>
              </div>
              {profile.organization && (
                <p className="text-blue-100 mt-1">{profile.organization}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Account Security
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary flex items-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Error Message */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                      Email Address
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {profile.email}
                      <span className="text-xs text-gray-500 block mt-1">Email cannot be changed</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {profile.first_name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {profile.last_name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <PhoneIcon className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="tel"
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {profile.phone || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Additional Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                      Organization
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editForm.organization}
                        onChange={(e) => handleInputChange('organization', e.target.value)}
                        placeholder="Optional"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {profile.organization || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                      Member Since
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {formatDate(profile.created_at)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    value={editForm.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {profile.bio || 'No bio provided'}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    className="btn-secondary"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary flex items-center"
                    onClick={saveProfile}
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
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Account Security</h3>
                <p className="text-sm text-gray-600">View your account security information and authentication method.</p>
              </div>

              <div className="max-w-2xl space-y-6">
                {/* Authentication Method */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-blue-900">Google OAuth Authentication</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your account is secured using Google's authentication system. You sign in using your Google account, 
                        which provides enhanced security through Google's advanced security features.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                      Email Address
                    </h5>
                    <p className="text-sm text-gray-700">{profile.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Verified through Google</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                      Account Created
                    </h5>
                    <p className="text-sm text-gray-700">{formatDate(profile.created_at)}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      <UserIcon className="h-4 w-4 inline mr-1" />
                      Account Role
                    </h5>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(profile.role)}`}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                      Account Status
                    </h5>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Security Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-yellow-900 mb-2">Security Tips</h5>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Keep your Google account secure with two-factor authentication</li>
                    <li>• Regularly review your Google account security settings</li>
                    <li>• Log out from shared computers after using the application</li>
                    <li>• Contact an administrator if you notice any suspicious activity</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;