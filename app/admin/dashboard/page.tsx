import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Calendar, MessageSquare, Eye, AlertCircle } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Fetch dashboard stats
  const [activeEvents, pendingContacts, recentPageViews, upcomingTasks] = await Promise.all([
    prisma.event.count({
      where: {
        published: true,
        endDate: { gte: new Date() },
      },
    }),
    prisma.contact.count({
      where: { status: 'NEW' },
    }),
    prisma.pageView.count({
      where: {
        timestamp: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    }),
    prisma.task.count({
      where: {
        status: { not: 'COMPLETED' },
        dueDate: {
          gte: new Date(),
          lte: new Date(new Date().setDate(new Date().getDate() + 7)),
        },
      },
    }),
  ]);

  const stats = [
    {
      name: 'Active Events',
      value: activeEvents,
      icon: Calendar,
      color: 'bg-primary-100 text-primary-600',
    },
    {
      name: 'Pending Contacts',
      value: pendingContacts,
      icon: MessageSquare,
      color: 'bg-secondary-100 text-secondary-600',
    },
    {
      name: 'Monthly Page Views',
      value: recentPageViews.toLocaleString(),
      icon: Eye,
      color: 'bg-accent-100 text-accent-600',
    },
    {
      name: 'Upcoming Deadlines',
      value: upcomingTasks,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
    },
  ];

  // Fetch recent activity
  const recentEvents = await prisma.event.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      status: true,
    },
  });

  const recentContacts = await prisma.contact.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      status: true,
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Recent Events</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge ${
                      event.status === 'PUBLISHED' ? 'badge-accent' :
                      event.status === 'DRAFT' ? 'badge-gray' :
                      'badge-secondary'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No events yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Recent Contact Requests</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentContacts.length > 0 ? (
              recentContacts.map((contact) => (
                <div key={contact.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge ${
                      contact.status === 'NEW' ? 'badge-primary' :
                      contact.status === 'IN_PROGRESS' ? 'badge-secondary' :
                      contact.status === 'RESOLVED' ? 'badge-accent' :
                      'badge-gray'
                    }`}>
                      {contact.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No contacts yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
