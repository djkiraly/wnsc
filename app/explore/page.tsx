import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Link from 'next/link';
import { MapPin, Phone, Globe, ExternalLink, Star, Bed, Utensils, Camera, ShoppingBag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Explore the Region | Western Nebraska Sports Council',
  description: 'Discover attractions, accommodations, dining, and more in Western Nebraska.',
};

async function getAttractions() {
  return prisma.attraction.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
  });
}

async function getAccommodations() {
  return prisma.accommodation.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
  });
}

const categoryIcons: Record<string, React.ElementType> = {
  outdoor: Camera,
  museum: Camera,
  dining: Utensils,
  entertainment: Star,
  shopping: ShoppingBag,
  other: MapPin,
};

export default async function ExplorePage() {
  const [attractions, accommodations] = await Promise.all([
    getAttractions(),
    getAccommodations(),
  ]);

  const attractionCategories = [...new Set(attractions.map((a) => a.category))].sort();
  const accommodationTypes = [...new Set(accommodations.map((a) => a.type))].sort();

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="bg-primary text-white py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore the Region</h1>
            <p className="text-xl text-white/80 max-w-2xl">
              Western Nebraska offers more than great sports venues. Discover attractions,
              dining, and accommodations to make your visit memorable.
            </p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <section className="bg-white border-b sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex gap-8 overflow-x-auto">
              <a href="#attractions" className="py-4 border-b-2 border-primary text-primary font-medium whitespace-nowrap">
                Attractions
              </a>
              <a href="#accommodations" className="py-4 border-b-2 border-transparent hover:border-gray-300 text-gray-600 font-medium whitespace-nowrap">
                Accommodations
              </a>
            </div>
          </div>
        </section>

        {/* Attractions Section */}
        <section id="attractions" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Local Attractions</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Explore outdoor adventures, museums, entertainment, and more in Western Nebraska.
              </p>
            </div>

            {attractionCategories.map((category) => {
              const categoryAttractions = attractions.filter((a) => a.category === category);
              if (categoryAttractions.length === 0) return null;
              const Icon = categoryIcons[category] || MapPin;

              return (
                <div key={category} className="mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center capitalize">
                    <Icon className="h-6 w-6 mr-2 text-primary" />
                    {category}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryAttractions.map((attraction) => (
                      <div key={attraction.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {attraction.imageUrl && (
                          <div className="aspect-video bg-gray-100">
                            <img src={attraction.imageUrl} alt={attraction.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5">
                          <h4 className="text-lg font-bold text-gray-900 mb-2">{attraction.name}</h4>
                          <div className="flex items-center text-gray-600 text-sm mb-3">
                            <MapPin className="h-4 w-4 mr-1" />
                            {attraction.city}
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-3 mb-4">{attraction.description}</p>
                          <div className="flex gap-3">
                            {attraction.website && (
                              <a href={attraction.website} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
                                <Globe className="h-4 w-4 mr-1" />
                                Website
                              </a>
                            )}
                            {attraction.phone && (
                              <a href={`tel:${attraction.phone}`} className="text-primary text-sm font-medium hover:underline inline-flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Accommodations Section */}
        <section id="accommodations" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Where to Stay</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Find comfortable accommodations for your team or family during your visit.
              </p>
            </div>

            {accommodationTypes.map((type) => {
              const typeAccommodations = accommodations.filter((a) => a.type === type);
              if (typeAccommodations.length === 0) return null;

              return (
                <div key={type} className="mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center capitalize">
                    <Bed className="h-6 w-6 mr-2 text-primary" />
                    {type === 'bnb' ? "B&B's" : `${type}s`}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {typeAccommodations.map((acc) => (
                      <div key={acc.id} className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        {acc.imageUrl && (
                          <div className="aspect-video bg-gray-200">
                            <img src={acc.imageUrl} alt={acc.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-lg font-bold text-gray-900">{acc.name}</h4>
                            {acc.priceRange && (
                              <span className="text-primary font-bold">{acc.priceRange}</span>
                            )}
                          </div>
                          <div className="flex items-center text-gray-600 text-sm mb-3">
                            <MapPin className="h-4 w-4 mr-1" />
                            {acc.city}
                          </div>
                          {acc.description && (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">{acc.description}</p>
                          )}
                          {acc.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {acc.amenities.slice(0, 4).map((amenity) => (
                                <span key={amenity} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-3">
                            {acc.bookingUrl && (
                              <a href={acc.bookingUrl} target="_blank" rel="noopener noreferrer" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center">
                                Book Now
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            )}
                            {acc.phone && (
                              <a href={`tel:${acc.phone}`} className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Planning a Visit?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Let us help you plan your trip to Western Nebraska. Our team can recommend the best
              places to stay, eat, and explore during your event.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
