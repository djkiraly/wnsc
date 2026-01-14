'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, X, Plus } from 'lucide-react';

interface FacilityFormProps {
  facility?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string | null;
    address: string;
    city: string;
    state: string;
    zip: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    capacity: number | null;
    amenities: string[];
    sportTypes: string[];
    featuredImage: string | null;
    isPublic: boolean;
    isFeatured: boolean;
    mapEmbedUrl: string | null;
  };
}

const sportTypeOptions = [
  'Basketball', 'Soccer', 'Baseball', 'Softball', 'Football',
  'Volleyball', 'Running', 'Swimming', 'Golf', 'Tennis',
  'Wrestling', 'Hockey', 'Lacrosse', 'Track & Field', 'Multi-Purpose',
];

const amenityOptions = [
  'Parking', 'Concessions', 'Restrooms', 'Locker Rooms', 'Bleachers',
  'Scoreboard', 'Lighting', 'Sound System', 'Wi-Fi', 'ADA Accessible',
  'Climate Controlled', 'Outdoor', 'Indoor', 'Turf Field', 'Natural Grass',
];

export default function FacilityForm({ facility }: FacilityFormProps) {
  const router = useRouter();
  const isEditing = !!facility;

  const [formData, setFormData] = useState({
    name: facility?.name || '',
    slug: facility?.slug || '',
    description: facility?.description || '',
    shortDescription: facility?.shortDescription || '',
    address: facility?.address || '',
    city: facility?.city || '',
    state: facility?.state || 'NE',
    zip: facility?.zip || '',
    phone: facility?.phone || '',
    email: facility?.email || '',
    website: facility?.website || '',
    capacity: facility?.capacity?.toString() || '',
    amenities: facility?.amenities || [],
    sportTypes: facility?.sportTypes || [],
    featuredImage: facility?.featuredImage || '',
    isPublic: facility?.isPublic ?? true,
    isFeatured: facility?.isFeatured ?? false,
    mapEmbedUrl: facility?.mapEmbedUrl || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = isEditing ? `/api/facilities/${facility.id}` : '/api/facilities';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save facility');
        setSaving(false);
        return;
      }

      router.push('/admin/website/facilities');
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

  const toggleArrayItem = (field: 'amenities' | 'sportTypes', item: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
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
          <Link href="/admin/website/facilities" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Facility' : 'New Facility'}
            </h1>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Facility'}
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
              <h2 className="text-lg font-semibold">Basic Information</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="name" className="label">Facility Name *</label>
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
                <p className="text-xs text-gray-500 mt-1">
                  Only lowercase letters, numbers, and hyphens
                </p>
              </div>

              <div>
                <label htmlFor="shortDescription" className="label">Short Description</label>
                <input
                  type="text"
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  className="input"
                  maxLength={300}
                  placeholder="Brief description for listings"
                />
              </div>

              <div>
                <label htmlFor="description" className="label">Full Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="textarea"
                  rows={6}
                  required
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Location</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="address" className="label">Street Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="label">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" className="label">State *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="zip" className="label">ZIP Code</label>
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

              <div>
                <label htmlFor="mapEmbedUrl" className="label">Google Maps Embed URL</label>
                <input
                  type="text"
                  id="mapEmbedUrl"
                  name="mapEmbedUrl"
                  value={formData.mapEmbedUrl}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Contact Information</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="label">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
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

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Sport Types</h2>
            </div>
            <div className="card-body">
              <div className="flex flex-wrap gap-2">
                {sportTypeOptions.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleArrayItem('sportTypes', sport)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.sportTypes.includes(sport)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Amenities</h2>
            </div>
            <div className="card-body">
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleArrayItem('amenities', amenity)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.amenities.includes(amenity)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Visibility</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Visible on public site
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isFeatured" className="text-sm text-gray-700">
                  Featured facility
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Capacity</h2>
            </div>
            <div className="card-body">
              <div>
                <label htmlFor="capacity" className="label">Seating Capacity</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="input"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Featured Image</h2>
            </div>
            <div className="card-body">
              <div>
                <label htmlFor="featuredImage" className="label">Image URL</label>
                <input
                  type="url"
                  id="featuredImage"
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://"
                />
              </div>
              {formData.featuredImage && (
                <div className="mt-4">
                  <img
                    src={formData.featuredImage}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
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
