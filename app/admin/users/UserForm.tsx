'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface UserFormProps {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    memberStatus: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    bio: string | null;
    active: boolean;
  };
  currentUserRole: string;
}

const roles = [
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

const memberStatuses = [
  { value: 'VISITOR', label: 'Visitor' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VOTING_MEMBER', label: 'Voting Member' },
  { value: 'PRESIDENT', label: 'President' },
  { value: 'VICE_PRESIDENT', label: 'Vice President' },
  { value: 'TREASURER', label: 'Treasurer' },
  { value: 'SECRETARY', label: 'Secretary' },
];

export default function UserForm({ user, currentUserRole }: UserFormProps) {
  const router = useRouter();
  const isEditing = !!user;
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    role: user?.role || 'EDITOR',
    memberStatus: user?.memberStatus || 'VISITOR',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip: user?.zip || '',
    bio: user?.bio || '',
    active: user?.active ?? true,
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password for new users
    if (!isEditing && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password && formData.password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        memberStatus: formData.memberStatus,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        bio: formData.bio || null,
        active: formData.active,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const url = isEditing ? `/api/users/${user.id}` : '/api/users';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save user');
        setSaving(false);
        return;
      }

      router.push('/admin/users');
      router.refresh();
    } catch (err) {
      setError('An error occurred');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Account Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="label">
                  System Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input"
                  disabled={!isSuperAdmin}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {!isSuperAdmin && (
                  <p className="text-xs text-gray-500 mt-1">
                    Only Super Admins can change roles
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="memberStatus" className="label">
                  Member Status
                </label>
                <select
                  id="memberStatus"
                  name="memberStatus"
                  value={formData.memberStatus}
                  onChange={handleChange}
                  className="input"
                >
                  {memberStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="active" className="text-sm text-gray-700">
                Account is active
              </label>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">
              {isEditing ? 'Change Password' : 'Set Password'}
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="password" className="label">
                Password {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input pr-10"
                  placeholder={isEditing ? 'Leave blank to keep current' : ''}
                  required={!isEditing ? false : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum 12 characters required
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Contact Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="phone" className="label">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                placeholder="(555) 555-5555"
              />
            </div>

            <div>
              <label htmlFor="address" className="label">
                Street Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="label">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="state" className="label">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="input"
                  placeholder="NE"
                />
              </div>
              <div>
                <label htmlFor="zip" className="label">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Biography</h2>
          </div>
          <div className="card-body">
            <div>
              <label htmlFor="bio" className="label">
                Bio / Notes
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="textarea"
                rows={5}
                placeholder="Brief description or notes about this user..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between">
        <Link
          href="/admin/users"
          className="btn btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
