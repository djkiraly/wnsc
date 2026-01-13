import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import CalendarView from './CalendarView';

export default async function CalendarPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      startDate: true,
      endDate: true,
      location: true,
      status: true,
      published: true,
      category: true,
    },
    orderBy: { startDate: 'asc' },
  });

  // Serialize dates for client component
  const serializedEvents = events.map((event) => ({
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Event Calendar</h1>
        <p className="text-gray-600 mt-1">View and manage all events</p>
      </div>

      <CalendarView events={serializedEvents} />
    </div>
  );
}
