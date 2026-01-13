import Link from 'next/link';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import UpcomingEvents from '@/components/public/UpcomingEvents';
import Analytics from '@/components/public/Analytics';
import prisma from '@/lib/prisma';

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
      endDate: {
        gte: now,
      },
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
    orderBy: {
      startDate: 'asc',
    },
    take: limit,
  });
}

export default async function HomePage() {
  const settings = await getSettings();

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
              <h1 className="text-5xl font-bold mb-6">
                {heroTitle}
              </h1>
              <p className="text-xl mb-8 text-primary-100">
                {heroSubtitle}
              </p>
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
              <p className="text-lg text-gray-600 mb-8">
                {aboutDescription}
              </p>
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

        {/* Upcoming Events */}
        {showUpcomingEvents && (
          <UpcomingEvents
            events={upcomingEvents}
            title={upcomingEventsTitle}
            subtitle={upcomingEventsSubtitle}
          />
        )}

        {/* CTA Section */}
        <section className="py-16 bg-primary-600 text-white">
          <div className="container-custom text-center">
            <h2 className="mb-4">{ctaTitle}</h2>
            <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
              {ctaDescription}
            </p>
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
