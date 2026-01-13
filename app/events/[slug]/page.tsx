import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Analytics from '@/components/public/Analytics';
import ShareButton from './ShareButton';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Mail,
  Phone,
  ArrowLeft,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { Metadata } from 'next';

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

async function getEvent(slug: string) {
  const event = await prisma.event.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      published: true,
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
      metaDescription: true,
      keywords: true,
      views: true,
    },
  });

  return event;
}

async function incrementViews(eventId: string, request?: Request) {
  // Increment view count
  await prisma.event.update({
    where: { id: eventId },
    data: { views: { increment: 1 } },
  });

  // Log detailed view
  await prisma.eventView.create({
    data: {
      eventId,
      // Server-side we can't easily get these without request object
      ipAddress: null,
      userAgent: null,
      referrer: null,
      sessionId: null,
    },
  });
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    return {
      title: 'Event Not Found | Western Nebraska Sports Council',
    };
  }

  return {
    title: `${event.title} | Western Nebraska Sports Council`,
    description: event.metaDescription || event.description.substring(0, 160),
    keywords: event.keywords || undefined,
    openGraph: {
      title: event.title,
      description: event.metaDescription || event.description.substring(0, 160),
      images: event.featuredImage ? [event.featuredImage] : undefined,
    },
  };
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
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
    return {
      dates: formatDate(start),
      times: `${formatTime(start)} - ${formatTime(end)}`,
    };
  }

  return {
    dates: `${formatDate(start)} - ${formatDate(end)}`,
    times: null,
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  // Increment views (fire and forget)
  incrementViews(event.id).catch(console.error);

  const isPast = new Date(event.endDate) < new Date();
  const dateInfo = formatDateRange(event.startDate, event.endDate);

  return (
    <>
      <Analytics pageName={`Event: ${event.title}`} />
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section with Featured Image */}
        <section className="relative bg-gradient-to-r from-primary-700 to-primary-900 text-white">
          {event.featuredImage && (
            <div className="absolute inset-0">
              <img
                src={event.featuredImage}
                alt={event.title}
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-primary-800/80" />
            </div>
          )}
          <div className="relative container-custom py-16">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-primary-200 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                <Tag className="h-4 w-4" />
                {event.category}
              </span>
              {isPast && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-800/50 backdrop-blur-sm rounded-full text-sm font-medium">
                  Past Event
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.title}</h1>

            <div className="flex flex-wrap items-center gap-6 text-primary-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{dateInfo.dates}</span>
              </div>
              {dateInfo.times && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{dateInfo.times}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>
                  {event.venueName ? `${event.venueName}, ${event.location}` : event.location}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="card p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Event</h2>
                  <div className="prose prose-lg max-w-none text-gray-600">
                    {event.description.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Registration Button for Main Content (Mobile) */}
                  {event.registrationUrl && !isPast && (
                    <div className="mt-8 lg:hidden">
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary w-full justify-center text-lg py-3"
                      >
                        Register Now
                        <ExternalLink className="h-5 w-5 ml-2" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    {event.registrationUrl && !isPast && (
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary w-full justify-center"
                      >
                        Register Now
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    )}
                    <ShareButton title={event.title} />
                  </div>
                </div>

                {/* Event Details */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                        <Calendar className="h-4 w-4" />
                        Date
                      </div>
                      <p className="text-gray-900 ml-6">{dateInfo.dates}</p>
                    </div>

                    {dateInfo.times && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                          <Clock className="h-4 w-4" />
                          Time
                        </div>
                        <p className="text-gray-900 ml-6">{dateInfo.times}</p>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                      <p className="text-gray-900 ml-6">
                        {event.venueName && (
                          <>
                            {event.venueName}
                            <br />
                          </>
                        )}
                        {event.location}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                        <Tag className="h-4 w-4" />
                        Category
                      </div>
                      <p className="text-gray-900 ml-6">{event.category}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                {(event.contactName || event.contactEmail || event.contactPhone) && (
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Event Contact
                    </h3>
                    <div className="space-y-3">
                      {event.contactName && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-50 rounded-lg">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Contact Person</p>
                            <p className="font-medium text-gray-900">{event.contactName}</p>
                          </div>
                        </div>
                      )}

                      {event.contactEmail && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-50 rounded-lg">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <a
                              href={`mailto:${event.contactEmail}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {event.contactEmail}
                            </a>
                          </div>
                        </div>
                      )}

                      {event.contactPhone && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-50 rounded-lg">
                            <Phone className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <a
                              href={`tel:${event.contactPhone}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {event.contactPhone}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Need Help? */}
                <div className="card p-6 bg-primary-50 border-primary-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Questions?
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Contact the Western Nebraska Sports Council for more information about this
                    event or hosting your own.
                  </p>
                  <Link href="/contact" className="btn btn-secondary w-full justify-center">
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Events Section (placeholder for future) */}
        <section className="py-12 bg-gray-100">
          <div className="container-custom text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Discover More Events
            </h2>
            <p className="text-gray-600 mb-6">
              Browse all upcoming sporting events in Western Nebraska.
            </p>
            <Link href="/events" className="btn btn-primary">
              View All Events
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
