import Link from 'next/link';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import UpcomingEvents from '@/components/public/UpcomingEvents';
import Analytics from '@/components/public/Analytics';
import prisma from '@/lib/prisma';
import { MapPin, Users, Quote, ChevronRight, Star } from 'lucide-react';

async function getSettings() {
  const settings = await prisma.setting.findMany();
  return settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);
}

async function getUpcomingEvents(limit: number) {
  const now = new Date();
  return await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      published: true,
      endDate: { gte: now },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      startDate: true,
      endDate: true,
      location: true,
      category: true,
    },
    orderBy: { startDate: 'asc' },
    take: limit,
  });
}

async function getFeaturedFacilities() {
  return prisma.facility.findMany({
    where: { isPublic: true, isFeatured: true },
    include: { photos: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    orderBy: { name: 'asc' },
    take: 3,
  });
}

async function getFeaturedTestimonials() {
  return prisma.testimonial.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { sortOrder: 'asc' },
    take: 3,
  });
}

async function getPartners() {
  return prisma.partner.findMany({
    where: { isActive: true },
    orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
    take: 8,
  });
}

async function getLatestNews() {
  return prisma.news.findMany({
    where: { isPublished: true, publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });
}

export default async function HomePage() {
  const [settings, facilities, testimonials, partners, news] = await Promise.all([
    getSettings(),
    getFeaturedFacilities(),
    getFeaturedTestimonials(),
    getPartners(),
    getLatestNews(),
  ]);

  // Upcoming Events settings
  const showUpcomingEvents = settings.upcoming_events_enabled !== 'false';
  const upcomingEventsTitle = settings.upcoming_events_title || 'Upcoming Events';
  const upcomingEventsSubtitle = settings.upcoming_events_subtitle || 'Discover exciting sporting events happening in Western Nebraska';
  const upcomingEventsLimit = parseInt(settings.upcoming_events_limit || '6', 10);

  // Fetch upcoming events if enabled
  const upcomingEvents = showUpcomingEvents ? await getUpcomingEvents(upcomingEventsLimit) : [];

  // Hero section settings with defaults
  const heroTitle = settings.hero_title || 'Bringing Sports & Tourism Together in Western Nebraska';
  const heroSubtitle = settings.hero_subtitle || 'The Western Nebraska Sports Council assists local organizations in developing and promoting sporting events to drive tourism and economic growth to our region.';
  const heroPrimaryButtonText = settings.hero_primary_button_text || 'View Events';
  const heroPrimaryButtonLink = settings.hero_primary_button_link || '/events';
  const heroSecondaryButtonText = settings.hero_secondary_button_text || 'Get In Touch';
  const heroSecondaryButtonLink = settings.hero_secondary_button_link || '/contact';
  const heroBackgroundImage = settings.hero_background_image || '';
  const heroBackgroundOverlay = settings.hero_background_overlay || '0.6';

  // About section settings with defaults
  const aboutTitle = settings.about_title || 'About the Council';
  const aboutDescription = settings.about_description || 'We are dedicated to promoting Western Nebraska as a premier destination for sporting events. Our mission is to support local communities, attract visitors, and create memorable experiences through sports.';
  const aboutButtonText = settings.about_button_text || 'Learn More About Us';
  const aboutButtonLink = settings.about_button_link || '/about';

  // Stats section settings with defaults
  const stats1Value = settings.stats_1_value || '150+';
  const stats1Label = settings.stats_1_label || 'Events Hosted';
  const stats2Value = settings.stats_2_value || '50K+';
  const stats2Label = settings.stats_2_label || 'Visitors Attracted';
  const stats3Value = settings.stats_3_value || '$2M+';
  const stats3Label = settings.stats_3_label || 'Economic Impact';

  // CTA section settings with defaults
  const ctaTitle = settings.cta_title || 'Ready to Host an Event?';
  const ctaDescription = settings.cta_description || 'Partner with us to bring your sporting event to life. We provide support, resources, and promotion to make your event a success.';
  const ctaButtonText = settings.cta_button_text || 'Contact Us Today';
  const ctaButtonLink = settings.cta_button_link || '/contact';

  // Hero background styles
  const heroStyle = heroBackgroundImage
    ? {
        backgroundImage: `url(${heroBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};

  return (
    <>
      <Analytics pageName="Home" />
      <Header />
      <main>
        {/* Hero Section */}
        <section
          className={`relative text-white py-24 ${!heroBackgroundImage ? 'bg-gradient-to-r from-primary-700 to-primary-900' : ''}`}
          style={heroStyle}
        >
          {heroBackgroundImage && (
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: parseFloat(heroBackgroundOverlay) }}
            />
          )}
          <div className="container-custom relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold mb-6">{heroTitle}</h1>
              <p className="text-xl mb-8 text-primary-100">{heroSubtitle}</p>
              <div className="flex gap-4">
                <Link href={heroPrimaryButtonLink} className="btn btn-secondary">
                  {heroPrimaryButtonText}
                </Link>
                <Link href={heroSecondaryButtonLink} className="btn btn-outline text-white border-white hover:bg-white/10">
                  {heroSecondaryButtonText}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="mb-6">{aboutTitle}</h2>
              <p className="text-lg text-gray-600 mb-8">{aboutDescription}</p>
              <Link href={aboutButtonLink} className="btn btn-primary">
                {aboutButtonText}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-primary mb-2">{stats1Value}</div>
                <div className="text-xl text-gray-600">{stats1Label}</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-secondary mb-2">{stats2Value}</div>
                <div className="text-xl text-gray-600">{stats2Label}</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-accent mb-2">{stats3Value}</div>
                <div className="text-xl text-gray-600">{stats3Label}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Facilities */}
        {facilities.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Facilities</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  World-class venues ready to host your next sporting event
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {facilities.map((facility) => (
                  <Link
                    key={facility.id}
                    href={`/facilities/${facility.slug}`}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
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
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="text-sm">Capacity: {facility.capacity.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/facilities" className="btn btn-outline inline-flex items-center">
                  View All Facilities
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {showUpcomingEvents && (
          <UpcomingEvents
            events={upcomingEvents}
            title={upcomingEventsTitle}
            subtitle={upcomingEventsSubtitle}
          />
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section className="py-16 bg-primary text-white">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">What People Are Saying</h2>
                <p className="text-white/80">Hear from event organizers and participants</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <Quote className="h-8 w-8 text-white/40 mb-4" />
                    <p className="text-white/90 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      {testimonial.photoUrl && (
                        <img
                          src={testimonial.photoUrl}
                          alt={testimonial.personName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{testimonial.personName}</p>
                        {testimonial.personTitle && (
                          <p className="text-sm text-white/70">{testimonial.personTitle}</p>
                        )}
                        {testimonial.organization && (
                          <p className="text-sm text-white/70">{testimonial.organization}</p>
                        )}
                      </div>
                    </div>
                    {testimonial.rating && (
                      <div className="flex gap-1 mt-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Partners */}
        {partners.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Partners</h2>
                <p className="text-gray-600">Organizations supporting sports in Western Nebraska</p>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                {partners.map((partner) => (
                  <div key={partner.id} className="grayscale hover:grayscale-0 transition-all">
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="h-12 md:h-16 max-w-[150px] object-contain"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">{partner.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest News */}
        {news.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest News</h2>
                <p className="text-gray-600">Stay updated with the latest happenings</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {news.map((article) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    {article.featuredImage && (
                      <div className="aspect-video bg-gray-200 overflow-hidden">
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-sm text-gray-500 mb-2">
                        {article.publishedAt && new Intl.DateTimeFormat('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }).format(new Date(article.publishedAt))}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-2">{article.excerpt}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/news" className="btn btn-outline inline-flex items-center">
                  View All News
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-primary-600 text-white">
          <div className="container-custom text-center">
            <h2 className="mb-4">{ctaTitle}</h2>
            <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">{ctaDescription}</p>
            <Link href={ctaButtonLink} className="btn btn-secondary">
              {ctaButtonText}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
