import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { MapPin, Users, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sports Facilities | Western Nebraska Sports Council',
  description: 'Explore world-class sports facilities in Western Nebraska. Find venues for basketball, soccer, baseball, and more.',
};

async function getFacilities() {
  return prisma.facility.findMany({
    where: { isPublic: true },
    include: {
      photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
  });
}

async function getSportTypes() {
  const facilities = await prisma.facility.findMany({
    where: { isPublic: true },
    select: { sportTypes: true },
  });
  const types = new Set<string>();
  facilities.forEach((f) => f.sportTypes.forEach((t) => types.add(t)));
  return Array.from(types).sort();
}

async function getCities() {
  const facilities = await prisma.facility.findMany({
    where: { isPublic: true },
    select: { city: true },
    distinct: ['city'],
  });
  return facilities.map((f) => f.city).sort();
}

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; sport?: string }>;
}) {
  const params = await searchParams;
  const [facilities, sportTypes, cities] = await Promise.all([
    getFacilities(),
    getSportTypes(),
    getCities(),
  ]);

  // Filter based on search params
  let filteredFacilities = facilities;
  if (params.city) {
    filteredFacilities = filteredFacilities.filter((f) => f.city === params.city);
  }
  if (params.sport) {
    filteredFacilities = filteredFacilities.filter((f) =>
      f.sportTypes.includes(params.sport!)
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Sports Facilities</h1>
            <p className="text-xl text-white/80 max-w-2xl">
              Discover premier sports venues across Western Nebraska, equipped to host
              events of all sizes.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">City:</label>
                <select
                  className="border rounded-lg px-3 py-2 text-sm"
                  defaultValue={params.city || ''}
                  onChange={(e) => {
                    const url = new URL(window.location.href);
                    if (e.target.value) {
                      url.searchParams.set('city', e.target.value);
                    } else {
                      url.searchParams.delete('city');
                    }
                    window.location.href = url.toString();
                  }}
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sport:</label>
                <select
                  className="border rounded-lg px-3 py-2 text-sm"
                  defaultValue={params.sport || ''}
                  onChange={(e) => {
                    const url = new URL(window.location.href);
                    if (e.target.value) {
                      url.searchParams.set('sport', e.target.value);
                    } else {
                      url.searchParams.delete('sport');
                    }
                    window.location.href = url.toString();
                  }}
                >
                  <option value="">All Sports</option>
                  {sportTypes.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
              {(params.city || params.sport) && (
                <Link href="/facilities" className="text-sm text-primary hover:underline">
                  Clear filters
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Facilities Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {filteredFacilities.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFacilities.map((facility) => (
                  <Link
                    key={facility.id}
                    href={`/facilities/${facility.slug}`}
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
                  >
                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                      {facility.featuredImage || facility.photos[0]?.url ? (
                        <img
                          src={facility.featuredImage || facility.photos[0]?.url}
                          alt={facility.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <MapPin className="h-12 w-12" />
                        </div>
                      )}
                      {facility.isFeatured && (
                        <span className="absolute top-3 left-3 bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                        {facility.name}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{facility.city}, {facility.state}</span>
                      </div>
                      {facility.capacity && (
                        <div className="flex items-center text-gray-600 mb-3">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="text-sm">Capacity: {facility.capacity.toLocaleString()}</span>
                        </div>
                      )}
                      {facility.sportTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {facility.sportTypes.slice(0, 3).map((sport) => (
                            <span
                              key={sport}
                              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                            >
                              {sport}
                            </span>
                          ))}
                          {facility.sportTypes.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{facility.sportTypes.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {facility.shortDescription || facility.description}
                      </p>
                      <div className="mt-4 flex items-center text-primary font-medium">
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No facilities found matching your criteria.</p>
                <Link href="/facilities" className="text-primary hover:underline mt-2 inline-block">
                  View all facilities
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Plan Your Event?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Our team is here to help you find the perfect venue and make your sporting
              event a success.
            </p>
            <Link
              href="/plan-your-event"
              className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Planning
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
