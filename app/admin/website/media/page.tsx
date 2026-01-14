'use client';

import { useState, useEffect } from 'react';
import { Image, Upload, Trash2, Copy, Check, Loader2, Search } from 'lucide-react';

interface MediaItem {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  mimeType: string;
  fileSize: number;
  folder: string;
  altText: string | null;
  createdAt: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState('');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, [folder]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (folder) params.append('folder', folder);
      const r = await fetch(`/api/media?${params}`);
      const data = await r.json();
      if (data.success) setMedia(data.data);
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder || 'uploads');
      try {
        await fetch('/api/media', { method: 'POST', body: fd });
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setUploading(false);
    fetchMedia();
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media item?')) return;
    setDeletingId(id);
    try {
      const r = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (r.ok) setMedia((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMedia = media.filter((m) =>
    m.originalName.toLowerCase().includes(search.toLowerCase()) ||
    m.altText?.toLowerCase().includes(search.toLowerCase())
  );

  const folders = [...new Set(media.map((m) => m.folder))].sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600 mt-1">{media.length} total files</p>
        </div>
        <div>
          <input type="file" multiple onChange={handleUpload} className="hidden" id="media-upload" disabled={uploading} accept="image/*,application/pdf" />
          <label htmlFor="media-upload" className="btn btn-primary cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? 'Uploading...' : 'Upload Files'}
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFolder('')} className={`btn ${!folder ? 'btn-primary' : 'btn-outline'}`}>All</button>
              {folders.map((f) => (
                <button key={f} onClick={() => setFolder(f)} className={`btn ${folder === f ? 'btn-primary' : 'btn-outline'}`}>{f}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredMedia.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <div key={item.id} className="card group relative">
              <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                {item.mimeType.startsWith('image/') ? (
                  <img src={item.url} alt={item.altText || item.originalName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate" title={item.originalName}>{item.originalName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(item.fileSize)}</p>
              </div>
              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button
                  onClick={() => copyUrl(item.url, item.id)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                  title="Copy URL"
                >
                  {copiedId === item.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                  title="Delete"
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-600" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body py-12 text-center text-gray-500">
            {search ? 'No files match your search' : 'No files uploaded yet. Upload your first file to get started.'}
          </div>
        </div>
      )}
    </div>
  );
}
