'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft } from 'lucide-react';

interface NewsFormProps {
  article?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    featuredImage: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    metaDescription: string | null;
  };
}

export default function NewsForm({ article }: NewsFormProps) {
  const router = useRouter();
  const isEditing = !!article;

  const [formData, setFormData] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    featuredImage: article?.featuredImage || '',
    isPublished: article?.isPublished ?? false,
    publishedAt: article?.publishedAt
      ? new Date(article.publishedAt).toISOString().slice(0, 16)
      : '',
    metaDescription: article?.metaDescription || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = isEditing ? `/api/news/${article.id}` : '/api/news';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save article');
        setSaving(false);
        return;
      }

      router.push('/admin/website/news');
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

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData((prev) => ({ ...prev, slug }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/website/news" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Article' : 'New Article'}
            </h1>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Article'}
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
              <h2 className="text-lg font-semibold">Article Content</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="title" className="label">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
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
                <label htmlFor="excerpt" className="label">Excerpt</label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  className="textarea"
                  rows={2}
                  placeholder="Brief summary for listings..."
                />
              </div>

              <div>
                <label htmlFor="content" className="label">Content *</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className="textarea font-mono text-sm"
                  rows={15}
                  required
                  placeholder="Write your article content here..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports basic HTML formatting
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">SEO Settings</h2>
            </div>
            <div className="card-body">
              <div>
                <label htmlFor="metaDescription" className="label">Meta Description</label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  className="textarea"
                  rows={2}
                  maxLength={160}
                  placeholder="Brief description for search engines..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Publish</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isPublished" className="text-sm text-gray-700">
                  Published
                </label>
              </div>

              {formData.isPublished && (
                <div>
                  <label htmlFor="publishedAt" className="label">Publish Date</label>
                  <input
                    type="datetime-local"
                    id="publishedAt"
                    name="publishedAt"
                    value={formData.publishedAt}
                    onChange={handleChange}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for current time
                  </p>
                </div>
              )}
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
