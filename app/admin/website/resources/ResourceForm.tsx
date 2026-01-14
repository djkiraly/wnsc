'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Upload } from 'lucide-react';

interface Props { resource?: { id: string; title: string; description: string | null; fileUrl: string; fileName: string; fileType: string; fileSize: number | null; category: string; isPublic: boolean; }; categories: string[]; }

const defaultCategories = ['General', 'Event Planning', 'Registration', 'Marketing', 'Policies'];

export default function ResourceForm({ resource, categories = [] }: Props) {
  const router = useRouter();
  const isEditing = !!resource;
  const allCategories = [...new Set([...defaultCategories, ...categories])].sort();
  const [formData, setFormData] = useState({
    title: resource?.title || '', description: resource?.description || '', fileUrl: resource?.fileUrl || '',
    fileName: resource?.fileName || '', fileType: resource?.fileType || '', fileSize: resource?.fileSize || null,
    category: resource?.category || 'General', isPublic: resource?.isPublic ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'resources');
    try {
      const r = await fetch('/api/gcs/upload', { method: 'POST', body: fd });
      const data = await r.json();
      if (data.success) {
        setFormData((p) => ({ ...p, fileUrl: data.url, fileName: data.fileName, fileType: file.type, fileSize: file.size }));
      } else setError(data.error || 'Upload failed');
    } catch { setError('Upload error'); } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    if (!formData.fileUrl) { setError('Please upload a file'); setSaving(false); return; }
    try {
      const url = isEditing ? `/api/resources/${resource.id}` : '/api/resources';
      const r = await fetch(url, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Failed'); setSaving(false); return; }
      router.push('/admin/website/resources'); router.refresh();
    } catch { setError('Error'); setSaving(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/website/resources" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-3xl font-bold">{isEditing ? 'Edit Resource' : 'New Resource'}</h1>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save'}</button>
      </div>
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card"><div className="card-header"><h2 className="text-lg font-semibold">File</h2></div>
            <div className="card-body space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input type="file" onChange={handleUpload} className="hidden" id="file-upload" disabled={uploading} />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <span className="text-primary font-medium">{uploading ? 'Uploading...' : 'Click to upload file'}</span>
                </label>
                {formData.fileName && <p className="mt-2 text-sm text-green-600">Uploaded: {formData.fileName}</p>}
              </div>
              <div><label className="label">Or enter URL directly</label><input name="fileUrl" type="url" value={formData.fileUrl} onChange={handleChange} className="input" placeholder="https://" /></div>
              {!isEditing && formData.fileUrl && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">File Name</label><input name="fileName" value={formData.fileName} onChange={handleChange} className="input" /></div>
                  <div><label className="label">File Type</label><input name="fileType" value={formData.fileType} onChange={handleChange} className="input" placeholder="application/pdf" /></div>
                </div>
              )}
            </div>
          </div>
          <div className="card"><div className="card-header"><h2 className="text-lg font-semibold">Details</h2></div>
            <div className="card-body space-y-4">
              <div><label className="label">Title *</label><input name="title" value={formData.title} onChange={handleChange} className="input" required /></div>
              <div><label className="label">Description</label><textarea name="description" value={formData.description} onChange={handleChange} className="textarea" rows={3} /></div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card"><div className="card-header"><h2 className="text-lg font-semibold">Category</h2></div>
            <div className="card-body"><select name="category" value={formData.category} onChange={handleChange} className="select">{allCategories.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="card"><div className="card-header"><h2 className="text-lg font-semibold">Visibility</h2></div>
            <div className="card-body"><div className="flex items-center gap-2"><input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} className="h-4 w-4" /><label className="text-sm">Public (downloadable)</label></div></div>
          </div>
        </div>
      </div>
    </form>
  );
}
