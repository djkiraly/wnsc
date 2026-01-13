import Link from 'next/link';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  category: string;
}

interface UpcomingEventsProps {
  events: Event[];
  title?: string;
  subtitle?: string;
}

function formatEventDate(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return start.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function formatEventTime(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${startTime} - ${endTime}`;
}

export default function UpcomingEvents({
  events,
  title = 'Upcoming Events',
  subtitle = 'Discover exciting sporting events happening in Western Nebraska',
}: UpcomingEventsProps) {
  if (events.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="mb-4">{title}</h2>
            <p className="text-lg text-gray-600">{subtitle}</p>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No upcoming events at this time.</p>
            <Link href="/events" className="btn btn-primary">
              View All Events
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="mb-4">{title}</h2>
          <p className="text-lg text-gray-600">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="card hover:shadow-lg transition-shadow group"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium px-2 py-1 bg-primary-100 text-primary-700 rounded">
                    {event.category}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{formatEventDate(event.startDate, event.endDate)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{formatEventTime(event.startDate, event.endDate)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center text-primary font-medium text-sm group-hover:underline">
                  View Details
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/events" className="btn btn-primary">
            View All Events
          </Link>
        </div>
      </div>
    </section>
  );
}
