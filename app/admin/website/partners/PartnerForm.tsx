'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft } from 'lucide-react';

interface PartnerFormProps {
  partner?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    website: string | null;
    tier: string;
    isActive: boolean;
    sortOrder: number;
  };
}

const tiers = [
  { value: 'PRESENTING', label: 'Presenting Partner' },
  { value: 'GOLD', label: 'Gold Partner' },
  { value: 'SILVER', label: 'Silver Partner' },
  { value: 'BRONZE', label: 'Bronze Partner' },
  { value: 'COMMUNITY', label: 'Community Partner' },
];

export default function PartnerForm({ partner }: PartnerFormProps) {
  const router = useRouter();
  const isEditing = !!partner;

  const [formData, setFormData] = useState({
    name: partner?.name || '',
    slug: partner?.slug || '',
    description: partner?.description || '',
    logoUrl: partner?.logoUrl || '',
    website: partner?.website || '',
    tier: partner?.tier || 'COMMUNITY',
    isActive: partner?.isActive ?? true,
    sortOrder: partner?.sortOrder ?? 0,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = isEditing ? `/api/partners/${partner.id}` : '/api/partners';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save partner');
        setSaving(false);
        return;
      }

      router.push('/admin/website/partners');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData((prev) => ({ ...prev, slug }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/website/partners" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Partner' : 'New Partner'}
            </h1>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Partner'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Partner Information</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="name" className="label">Partner Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => !formData.slug && generateSlug()}
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="slug" className="label">
                  URL Slug *
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="ml-2 text-primary text-sm hover:underline"
                  >
                    Generate
                  </button>
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="input"
                  required
                  pattern="[a-z0-9-]+"
                />
              </div>

              <div>
                <label htmlFor="description" className="label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="textarea"
                  rows={4}
                  placeholder="Brief description of the partner organization"
                />
              </div>

              <div>
                <label htmlFor="website" className="label">Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Partnership Tier</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="tier" className="label">Tier Level *</label>
                <select
                  id="tier"
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className="select"
                  required
                >
                  {tiers.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sortOrder" className="label">Sort Order</label>
                <input
                  type="number"
                  id="sortOrder"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleChange}
                  className="input"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first within tier</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (visible on site)
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Logo</h2>
            </div>
            <div className="card-body">
              <div>
                <label htmlFor="logoUrl" className="label">Logo URL</label>
                <input
                  type="url"
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://"
                />
              </div>
              {formData.logoUrl && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-center">
                  <img
                    src={formData.logoUrl}
                    alt="Logo preview"
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
