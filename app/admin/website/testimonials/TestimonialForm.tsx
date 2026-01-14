'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Star } from 'lucide-react';

interface TestimonialFormProps {
  testimonial?: {
    id: string;
    quote: string;
    personName: string;
    personTitle: string | null;
    organization: string | null;
    eventName: string | null;
    rating: number | null;
    photoUrl: string | null;
    isActive: boolean;
    isFeatured: boolean;
    sortOrder: number;
  };
}

export default function TestimonialForm({ testimonial }: TestimonialFormProps) {
  const router = useRouter();
  const isEditing = !!testimonial;

  const [formData, setFormData] = useState({
    quote: testimonial?.quote || '',
    personName: testimonial?.personName || '',
    personTitle: testimonial?.personTitle || '',
    organization: testimonial?.organization || '',
    eventName: testimonial?.eventName || '',
    rating: testimonial?.rating ?? 5,
    photoUrl: testimonial?.photoUrl || '',
    isActive: testimonial?.isActive ?? true,
    isFeatured: testimonial?.isFeatured ?? false,
    sortOrder: testimonial?.sortOrder ?? 0,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = isEditing ? `/api/testimonials/${testimonial.id}` : '/api/testimonials';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save testimonial');
        setSaving(false);
        return;
      }

      router.push('/admin/website/testimonials');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/website/testimonials" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Testimonial' : 'New Testimonial'}
            </h1>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Testimonial'}
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
              <h2 className="text-lg font-semibold">Testimonial Content</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="quote" className="label">Quote *</label>
                <textarea
                  id="quote"
                  name="quote"
                  value={formData.quote}
                  onChange={handleChange}
                  className="textarea"
                  rows={4}
                  required
                  placeholder="What did they say about their experience?"
                />
              </div>

              <div>
                <label className="label">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= formData.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Person Information</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="personName" className="label">Name *</label>
                <input
                  type="text"
                  id="personName"
                  name="personName"
                  value={formData.personName}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="personTitle" className="label">Title/Position</label>
                  <input
                    type="text"
                    id="personTitle"
                    name="personTitle"
                    value={formData.personTitle}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Event Coordinator"
                  />
                </div>
                <div>
                  <label htmlFor="organization" className="label">Organization</label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Youth Sports League"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="eventName" className="label">Related Event</label>
                <input
                  type="text"
                  id="eventName"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., 2024 Regional Basketball Tournament"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Status</h2>
            </div>
            <div className="card-body space-y-4">
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
                  Featured testimonial
                </label>
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
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Photo</h2>
            </div>
            <div className="card-body">
              <div>
                <label htmlFor="photoUrl" className="label">Photo URL</label>
                <input
                  type="url"
                  id="photoUrl"
                  name="photoUrl"
                  value={formData.photoUrl}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://"
                />
              </div>
              {formData.photoUrl && (
                <div className="mt-4">
                  <img
                    src={formData.photoUrl}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-full mx-auto"
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
