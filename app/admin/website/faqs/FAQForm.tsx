'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft } from 'lucide-react';

interface FAQFormProps {
  faq?: {
    id: string;
    question: string;
    answer: string;
    category: string;
    isActive: boolean;
    sortOrder: number;
  };
  categories: string[];
}

const defaultCategories = ['General', 'Events', 'Facilities', 'Registration', 'Accommodations'];

export default function FAQForm({ faq, categories = [] }: FAQFormProps) {
  const router = useRouter();
  const isEditing = !!faq;

  const allCategories = [...new Set([...defaultCategories, ...categories])].sort();

  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || 'General',
    isActive: faq?.isActive ?? true,
    sortOrder: faq?.sortOrder ?? 0,
  });
  const [newCategory, setNewCategory] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = isEditing ? `/api/faqs/${faq.id}` : '/api/faqs';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save FAQ');
        setSaving(false);
        return;
      }

      router.push('/admin/website/faqs');
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

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setFormData((prev) => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/website/faqs" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit FAQ' : 'New FAQ'}
            </h1>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save FAQ'}
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
              <h2 className="text-lg font-semibold">Question & Answer</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="question" className="label">Question *</label>
                <input
                  type="text"
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="What question are you answering?"
                />
              </div>

              <div>
                <label htmlFor="answer" className="label">Answer *</label>
                <textarea
                  id="answer"
                  name="answer"
                  value={formData.answer}
                  onChange={handleChange}
                  className="textarea"
                  rows={6}
                  required
                  placeholder="Provide a clear, helpful answer..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Category</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="category" className="label">Select Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="select"
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t pt-4">
                <label className="label">Or create new category</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="input flex-1"
                    placeholder="New category name"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="btn btn-outline"
                    disabled={!newCategory.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Settings</h2>
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
        </div>
      </div>
    </form>
  );
}
