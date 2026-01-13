'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Key } from 'lucide-react';

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.newPassword }),
      });

      if (response.ok) {
        setSuccess('Password updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update password');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {(success || error) && (
        <div className="lg:col-span-2">
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {success}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Profile Information</h2>
        </div>
        <form onSubmit={handleProfileSubmit}>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="name" className="label">Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Role</label>
              <input
                type="text"
                value={user.role.replace('_', ' ')}
                className="input bg-gray-50"
                disabled
              />
            </div>
          </div>
          <div className="card-footer">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit}>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="newPassword" className="label">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="input"
                placeholder="Minimum 12 characters"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="input"
                required
              />
            </div>

            <p className="text-xs text-gray-500">
              Password must be at least 12 characters with uppercase, lowercase, and a number.
            </p>
          </div>
          <div className="card-footer">
            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              <Key className="h-4 w-4 mr-2" />
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
