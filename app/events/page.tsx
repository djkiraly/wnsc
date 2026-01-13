import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Analytics from '@/components/public/Analytics';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, MapPin, Clock, User, Mail, Phone, ArrowRight, Tag } from 'lucide-react';

export const metadata = {
  title: 'Events | Western Nebraska Sports Council',
  description: 'Discover upcoming sporting events in Western Nebraska. Find tournaments, competitions, and athletic events happening in our region.',
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function getPublishedEvents() {
  const now = new Date();

  const events = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      published: true,
    },
    orderBy: {
      startDate: 'asc',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      category: true,
      startDate: true,
      endDate: true,
      location: true,
      venueName: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      featuredImage: true,
      registrationUrl: true,
    },
  });

  // Separate into upcoming and past events
  const upcomingEvents = events.filter(e => new Date(e.endDate) >= now);
  const pastEvents = events.filter(e => new Date(e.endDate) < now).reverse();

  return { upcomingEvents, pastEvents };
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateRange(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${formatDate(start)} | ${formatTime(start)} - ${formatTime(end)}`;
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
}

interface EventCardProps {
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    startDate: Date;
    endDate: Date;
    location: string;
    venueName: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    featuredImage: string | null;
    registrationUrl: string | null;
  };
  isPast?: boolean;
}

function EventCard({ event, isPast = false }: EventCardProps) {
  return (
    <div className={`card overflow-hidden ${isPast ? 'opacity-75' : ''}`}>
      {/* Featured Image */}
      {event.featuredImage && (
        <div className="h-48 bg-gray-200 relative">
          <img
            src={event.featuredImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {isPast && (
            <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
              <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                Past Event
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
            <Tag className="h-3 w-3" />
            {event.category}
          </span>
          {isPast && !event.featuredImage && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              Past Event
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          <Link href={`/events/${event.slug}`} className="hover:text-primary transition-colors">
            {event.title}
          </Link>
        </h3>

        {/* Description - truncated */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{formatDateRange(event.startDate, event.endDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span>
              {event.venueName ? `${event.venueName}, ${event.location}` : event.location}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        {(event.contactName || event.contactEmail || event.contactPhone) && (
          <div className="border-t border-gray-100 pt-4 mb-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Event Contact
            </h4>
            <div className="space-y-1">
              {event.contactName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{event.contactName}</span>
                </div>
              )}
              {event.contactEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${event.contactEmail}`} className="text-primary hover:underline">
                    {event.contactEmail}
                  </a>
                </div>
              )}
              {event.contactPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${event.contactPhone}`} className="text-primary hover:underline">
                    {event.contactPhone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href={`/events/${event.slug}`}
            className="btn btn-primary flex-1 justify-center"
          >
            View Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
          {event.registrationUrl && !isPast && (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              Register
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const { upcomingEvents, pastEvents } = await getPublishedEvents();

  return (
    <>
      <Analytics pageName="Events" />
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-16">
          <div className="container-custom">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
              <p className="text-xl text-primary-100">
                Discover sporting events happening in Western Nebraska. From tournaments to
                competitions, find your next athletic adventure.
              </p>
            </div>
          </div>
        </section>

        {/* Events Section */}
        <section className="py-12">
          <div className="container-custom">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 ? (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Upcoming Events ({upcomingEvents.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 mb-12">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Upcoming Events</h2>
                <p className="text-gray-600 mb-6">
                  Check back soon for new events, or submit your own event for consideration.
                </p>
                <Link href="/submit-event" className="btn btn-primary">
                  Submit an Event
                </Link>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Past Events ({pastEvents.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} isPast />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 bg-primary-50">
          <div className="container-custom text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Want to Host an Event?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              The Western Nebraska Sports Council can help you plan and promote your sporting
              event. Submit your event for consideration or contact us to learn more.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/submit-event" className="btn btn-primary">
                Submit an Event
              </Link>
              <Link href="/contact" className="btn btn-secondary">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
