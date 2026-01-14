import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, Search, Building2, Eye, Edit, MapPin, Users } from 'lucide-react';
import DeleteButton from './DeleteButton';

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; city?: string }>;
}) {
  const params = await searchParams;
  const search = params.search;
  const city = params.city;

  const facilities = await prisma.facility.findMany({
    where: {
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { sportTypes: { hasSome: [search] } },
        ],
      } : {}),
      ...(city ? { city } : {}),
    },
    include: {
      _count: {
        select: { photos: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const cities = await prisma.facility.findMany({
    select: { city: true },
    distinct: ['city'],
    orderBy: { city: 'asc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facilities</h1>
          <p className="text-gray-600 mt-1">{facilities.length} total facilities</p>
        </div>
        <Link href="/admin/website/facilities/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Facility
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <form className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search facilities..."
                  defaultValue={search}
                  className="input pl-10"
                />
              </div>
            </form>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/admin/website/facilities"
                className={`btn ${!city ? 'btn-primary' : 'btn-outline'}`}
              >
                All Cities
              </Link>
              {cities.map((c) => (
                <Link
                  key={c.city}
                  href={`/admin/website/facilities?city=${encodeURIComponent(c.city)}`}
                  className={`btn ${city === c.city ? 'btn-primary' : 'btn-outline'}`}
                >
                  {c.city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Facilities Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {facilities.length > 0 ? (
                facilities.map((facility) => (
                  <tr key={facility.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {facility.featuredImage ? (
                          <img
                            src={facility.featuredImage}
                            alt={facility.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{facility.name}</div>
                          <div className="text-sm text-gray-500">
                            {facility.sportTypes.slice(0, 2).join(', ')}
                            {facility.sportTypes.length > 2 && ` +${facility.sportTypes.length - 2}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {facility.city}, {facility.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {facility.capacity ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          {facility.capacity.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {facility.isPublic && (
                          <span className="badge badge-accent">Public</span>
                        )}
                        {facility.isFeatured && (
                          <span className="badge badge-secondary">Featured</span>
                        )}
                        {!facility.isPublic && (
                          <span className="badge badge-gray">Draft</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/facilities/${facility.slug}`}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="View"
                          target="_blank"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/website/facilities/${facility.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteButton id={facility.id} name={facility.name} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No facilities found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
