import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, Hotel, Edit } from 'lucide-react';
import DeleteButton from './DeleteButton';

const typeLabels: Record<string, string> = { hotel: 'Hotel', motel: 'Motel', campground: 'Campground', bnb: 'B&B', other: 'Other' };

export default async function AccommodationsPage() {
  const accommodations = await prisma.accommodation.findMany({ orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }] });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accommodations</h1>
          <p className="text-gray-600 mt-1">{accommodations.length} total accommodations</p>
        </div>
        <Link href="/admin/website/accommodations/new" className="btn btn-primary"><Plus className="h-4 w-4 mr-2" />Add Accommodation</Link>
      </div>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accommodations.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {a.imageUrl ? <img src={a.imageUrl} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center"><Hotel className="h-5 w-5 text-gray-400" /></div>}
                      <span className="font-medium">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{typeLabels[a.type] || a.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.city}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {a.isActive && <span className="badge badge-accent">Active</span>}
                      {a.isPartner && <span className="badge badge-secondary">Partner</span>}
                      {!a.isActive && <span className="badge badge-gray">Inactive</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/website/accommodations/${a.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600"><Edit className="h-4 w-4" /></Link>
                      <DeleteButton id={a.id} name={a.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {accommodations.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No accommodations found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
