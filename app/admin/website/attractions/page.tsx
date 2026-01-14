import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, MapPin, ExternalLink, Edit, Trash2 } from 'lucide-react';
import DeleteButton from './DeleteButton';

const categoryLabels: Record<string, string> = {
  outdoor: 'Outdoor Activities',
  museum: 'Museums & Culture',
  dining: 'Dining',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  other: 'Other',
};

export default async function AttractionsPage() {
  const attractions = await prisma.attraction.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attractions</h1>
          <p className="text-gray-600 mt-1">{attractions.length} total attractions</p>
        </div>
        <Link href="/admin/website/attractions/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Attraction
        </Link>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attraction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attractions.map((attraction) => (
                <tr key={attraction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {attraction.imageUrl ? (
                        <img src={attraction.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="font-medium text-gray-900">{attraction.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{categoryLabels[attraction.category] || attraction.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{attraction.city}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {attraction.isActive && <span className="badge badge-accent">Active</span>}
                      {attraction.isFeatured && <span className="badge badge-secondary">Featured</span>}
                      {!attraction.isActive && <span className="badge badge-gray">Inactive</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/website/attractions/${attraction.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <DeleteButton id={attraction.id} name={attraction.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {attractions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No attractions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
