'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft } from 'lucide-react';

interface AttractionFormProps {
  attraction?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    address: string | null;
    city: string;
    phone: string | null;
    website: string | null;
    imageUrl: string | null;
    isActive: boolean;
    isFeatured: boolean;
    sortOrder: number;
  };
}

const categories = [
  { value: 'outdoor', label: 'Outdoor Activities' },
  { value: 'museum', label: 'Museums & Culture' },
  { value: 'dining', label: 'Dining' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
];

export default function AttractionForm({ attraction }: AttractionFormProps) {
  const router = useRouter();
  const isEditing = !!attraction;

  const [formData, setFormData] = useState({
    name: attraction?.name || '',
    slug: attraction?.slug || '',
    description: attraction?.description || '',
    category: attraction?.category || 'other',
    address: attraction?.address || '',
    city: attraction?.city || '',
    phone: attraction?.phone || '',
    website: attraction?.website || '',
    imageUrl: attraction?.imageUrl || '',
    isActive: attraction?.isActive ?? true,
    isFeatured: attraction?.isFeatured ?? false,
    sortOrder: attraction?.sortOrder ?? 0,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = isEditing ? `/api/attractions/${attraction.id}` : '/api/attractions';
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to save'); setSaving(false); return; }
      router.push('/admin/website/attractions');
      router.refresh();
    } catch { setError('An error occurred'); setSaving(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const generateSlug = () => {
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData((prev) => ({ ...prev, slug }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/website/attractions" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Attraction' : 'New Attraction'}</h1>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save'}</button>
      </div>
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header"><h2 className="text-lg font-semibold">Basic Information</h2></div>
            <div className="card-body space-y-4">
              <div><label className="label">Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={() => !formData.slug && generateSlug()} className="input" required /></div>
              <div><label className="label">URL Slug * <button type="button" onClick={generateSlug} className="text-primary text-sm ml-2">Generate</button></label><input type="text" name="slug" value={formData.slug} onChange={handleChange} className="input" required pattern="[a-z0-9-]+" /></div>
              <div><label className="label">Description *</label><textarea name="description" value={formData.description} onChange={handleChange} className="textarea" rows={4} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Category *</label><select name="category" value={formData.category} onChange={handleChange} className="select">{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div><label className="label">City *</label><input type="text" name="city" value={formData.city} onChange={handleChange} className="input" required /></div>
              </div>
              <div><label className="label">Address</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="input" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input" /></div>
                <div><label className="label">Website</label><input type="url" name="website" value={formData.website} onChange={handleChange} className="input" placeholder="https://" /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card">
            <div className="card-header"><h2 className="text-lg font-semibold">Status</h2></div>
            <div className="card-body space-y-4">
              <div className="flex items-center gap-2"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4" /><label className="text-sm">Active</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="h-4 w-4" /><label className="text-sm">Featured</label></div>
              <div><label className="label">Sort Order</label><input type="number" name="sortOrder" value={formData.sortOrder} onChange={handleChange} className="input" min="0" /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h2 className="text-lg font-semibold">Image</h2></div>
            <div className="card-body">
              <div><label className="label">Image URL</label><input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="input" placeholder="https://" /></div>
              {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-4" />}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
