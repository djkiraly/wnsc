import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, FileText, Download, Edit, ExternalLink } from 'lucide-react';
import DeleteButton from './DeleteButton';

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default async function ResourcesPage() {
  const resources = await prisma.resource.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-600 mt-1">{resources.length} total resources</p>
        </div>
        <Link href="/admin/website/resources/new" className="btn btn-primary"><Plus className="h-4 w-4 mr-2" />Add Resource</Link>
      </div>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downloads</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {resources.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center"><FileText className="h-5 w-5 text-gray-400" /></div>
                      <div>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-sm text-gray-500">{r.fileName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(r.fileSize)}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1 text-sm text-gray-600"><Download className="h-4 w-4" />{r.downloads}</div></td>
                  <td className="px-6 py-4">{r.isPublic ? <span className="badge badge-accent">Public</span> : <span className="badge badge-gray">Private</span>}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-gray-600"><ExternalLink className="h-4 w-4" /></a>
                      <Link href={`/admin/website/resources/${r.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600"><Edit className="h-4 w-4" /></Link>
                      <DeleteButton id={r.id} title={r.title} />
                    </div>
                  </td>
                </tr>
              ))}
              {resources.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No resources found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
