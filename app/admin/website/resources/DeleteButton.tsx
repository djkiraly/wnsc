'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function DeleteButton({ id, title }: { id: string; title: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const handleDelete = async () => {
    setDeleting(true);
    try { const r = await fetch(`/api/resources/${id}`, { method: 'DELETE' }); if (r.ok) router.refresh(); else alert('Failed'); }
    catch { alert('Error'); } finally { setDeleting(false); setShowConfirm(false); }
  };
  return (
    <>
      <button onClick={() => setShowConfirm(true)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Resource</h3>
            <p className="text-gray-600 mb-6">Delete &quot;{title}&quot;?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn btn-outline" disabled={deleting}>Cancel</button>
              <button onClick={handleDelete} className="btn bg-red-600 text-white" disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
