import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { MapPin, Phone, Mail, Globe, Users, ArrowLeft, Check } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getFacility(slug: string) {
  return prisma.facility.findFirst({
    where: { slug, isPublic: true },
    include: {
      photos: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const facility = await getFacility(slug);
  if (!facility) return { title: 'Facility Not Found' };
  return {
    title: `${facility.name} | Western Nebraska Sports Council`,
    description: facility.shortDescription || facility.description.slice(0, 160),
  };
}

export default async function FacilityDetailPage({ params }: Props) {
  const { slug } = await params;
  const facility = await getFacility(slug);

  if (!facility) {
    notFound();
  }

  const allImages = [
    ...(facility.featuredImage ? [facility.featuredImage] : []),
    ...facility.photos.map((p) => p.url),
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/facilities" className="inline-flex items-center text-primary hover:underline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Facilities
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        {allImages.length > 0 && (
          <section className="bg-gray-900">
            <div className="container mx-auto">
              <div className="aspect-[21/9] max-h-[500px] overflow-hidden">
                <img
                  src={allImages[0]}
                  alt={facility.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{facility.name}</h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{facility.address}, {facility.city}, {facility.state} {facility.zip}</span>
                </div>
                {facility.sportTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {facility.sportTypes.map((sport) => (
                      <span
                        key={sport}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {sport}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Facility</h2>
                <div className="prose max-w-none text-gray-700">
                  {facility.description.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>

              {facility.amenities.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {facility.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Gallery */}
              {allImages.length > 1 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Photo Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {allImages.map((url, i) => (
                      <div key={i} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img src={url} alt={`${facility.name} - Photo ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              {facility.mapEmbedUrl && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={facility.mapEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
                {facility.capacity && (
                  <div className="flex items-center mb-3 pb-3 border-b">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-semibold">{facility.capacity.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start mb-3 pb-3 border-b">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-semibold">{facility.address}</p>
                    <p className="text-gray-600">{facility.city}, {facility.state} {facility.zip}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {(facility.phone || facility.email || facility.website) && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Contact</h3>
                  {facility.phone && (
                    <a href={`tel:${facility.phone}`} className="flex items-center mb-3 text-gray-700 hover:text-primary">
                      <Phone className="h-5 w-5 mr-3" />
                      {facility.phone}
                    </a>
                  )}
                  {facility.email && (
                    <a href={`mailto:${facility.email}`} className="flex items-center mb-3 text-gray-700 hover:text-primary">
                      <Mail className="h-5 w-5 mr-3" />
                      {facility.email}
                    </a>
                  )}
                  {facility.website && (
                    <a href={facility.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-primary">
                      <Globe className="h-5 w-5 mr-3" />
                      Visit Website
                    </a>
                  )}
                </div>
              )}

              {/* CTA */}
              <div className="bg-primary rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Plan Your Event Here</h3>
                <p className="text-white/80 mb-4 text-sm">
                  Interested in hosting your event at this facility? Get in touch with our team.
                </p>
                <Link
                  href="/plan-your-event"
                  className="block w-full bg-white text-primary text-center py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Start Planning
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
