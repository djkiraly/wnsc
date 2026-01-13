'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';

interface SettingsFormProps {
  settings: Record<string, string>;
}

export default function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    organization_name: settings.organization_name || '',
    tagline: settings.tagline || '',
    contact_email: settings.contact_email || '',
    contact_phone: settings.contact_phone || '',
    address: settings.address || '',
    meta_title: settings.meta_title || '',
    meta_description: settings.meta_description || '',
    meta_keywords: settings.meta_keywords || '',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Settings saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Organization Info</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="organization_name" className="label">Organization Name</label>
              <input
                type="text"
                id="organization_name"
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="tagline" className="label">Tagline</label>
              <input
                type="text"
                id="tagline"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="contact_email" className="label">Contact Email</label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="label">Contact Phone</label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="address" className="label">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">SEO Settings</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="meta_title" className="label">Meta Title</label>
              <input
                type="text"
                id="meta_title"
                name="meta_title"
                value={formData.meta_title}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="meta_description" className="label">Meta Description</label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description}
                onChange={handleChange}
                className="textarea"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="meta_keywords" className="label">Meta Keywords</label>
              <input
                type="text"
                id="meta_keywords"
                name="meta_keywords"
                value={formData.meta_keywords}
                onChange={handleChange}
                className="input"
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
