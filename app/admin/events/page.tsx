import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, Search, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import DeleteEventButton from './DeleteEventButton';

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const status = params.status;
  const search = params.search;

  const events = await prisma.event.findMany({
    where: {
      ...(status && status !== 'all' ? { status: status as any } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  const statusCounts = await prisma.event.groupBy({
    by: ['status'],
    _count: true,
  });

  const totalCount = events.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">{totalCount} total events</p>
        </div>
        <Link href="/admin/events/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
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
                  placeholder="Search events..."
                  defaultValue={search}
                  className="input pl-10"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <Link
                href="/admin/events"
                className={`btn ${!status || status === 'all' ? 'btn-primary' : 'btn-outline'}`}
              >
                All
              </Link>
              <Link
                href="/admin/events?status=PUBLISHED"
                className={`btn ${status === 'PUBLISHED' ? 'btn-primary' : 'btn-outline'}`}
              >
                Published
              </Link>
              <Link
                href="/admin/events?status=DRAFT"
                className={`btn ${status === 'DRAFT' ? 'btn-primary' : 'btn-outline'}`}
              >
                Draft
              </Link>
              <Link
                href="/admin/events?status=COMPLETED"
                className={`btn ${status === 'COMPLETED' ? 'btn-primary' : 'btn-outline'}`}
              >
                Completed
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.length > 0 ? (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">{event.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.startDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {event.location}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        event.status === 'PUBLISHED' ? 'badge-accent' :
                        event.status === 'DRAFT' ? 'badge-gray' :
                        event.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'badge-secondary'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Eye className="h-4 w-4" />
                        {event.views}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/events/${event.slug}`}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="View"
                          target="_blank"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No events found
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
