'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ChevronDown, ChevronUp } from 'lucide-react';

interface HomepageSettingsProps {
  settings: Record<string, string>;
}

export default function HomepageSettings({ settings }: HomepageSettingsProps) {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string>('hero');

  // Hero Section Settings
  const [heroSettings, setHeroSettings] = useState({
    hero_title: settings.hero_title || 'Bringing Sports & Tourism Together in Western Nebraska',
    hero_subtitle: settings.hero_subtitle || 'The Western Nebraska Sports Council assists local organizations in developing and promoting sporting events to drive tourism and economic growth to our region.',
    hero_primary_button_text: settings.hero_primary_button_text || 'View Events',
    hero_primary_button_link: settings.hero_primary_button_link || '/events',
    hero_secondary_button_text: settings.hero_secondary_button_text || 'Get In Touch',
    hero_secondary_button_link: settings.hero_secondary_button_link || '/contact',
    hero_background_image: settings.hero_background_image || '',
    hero_background_overlay: settings.hero_background_overlay || '0.6',
  });

  // About Section Settings
  const [aboutSettings, setAboutSettings] = useState({
    about_title: settings.about_title || 'About the Council',
    about_description: settings.about_description || 'We are dedicated to promoting Western Nebraska as a premier destination for sporting events. Our mission is to support local communities, attract visitors, and create memorable experiences through sports.',
    about_button_text: settings.about_button_text || 'Learn More About Us',
    about_button_link: settings.about_button_link || '/about',
  });

  // Stats Section Settings
  const [statsSettings, setStatsSettings] = useState({
    stats_1_value: settings.stats_1_value || '150+',
    stats_1_label: settings.stats_1_label || 'Events Hosted',
    stats_2_value: settings.stats_2_value || '50K+',
    stats_2_label: settings.stats_2_label || 'Visitors Attracted',
    stats_3_value: settings.stats_3_value || '$2M+',
    stats_3_label: settings.stats_3_label || 'Economic Impact',
  });

  // CTA Section Settings
  const [ctaSettings, setCtaSettings] = useState({
    cta_title: settings.cta_title || 'Ready to Host an Event?',
    cta_description: settings.cta_description || 'Partner with us to bring your sporting event to life. We provide support, resources, and promotion to make your event a success.',
    cta_button_text: settings.cta_button_text || 'Contact Us Today',
    cta_button_link: settings.cta_button_link || '/contact',
  });

  // Upcoming Events Section Settings
  const [upcomingEventsSettings, setUpcomingEventsSettings] = useState({
    upcoming_events_enabled: settings.upcoming_events_enabled !== 'false' ? 'true' : 'false',
    upcoming_events_title: settings.upcoming_events_title || 'Upcoming Events',
    upcoming_events_subtitle: settings.upcoming_events_subtitle || 'Discover exciting sporting events happening in Western Nebraska',
    upcoming_events_limit: settings.upcoming_events_limit || '6',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    const allSettings = {
      ...heroSettings,
      ...aboutSettings,
      ...statsSettings,
      ...ctaSettings,
      ...upcomingEventsSettings,
    };

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allSettings),
      });

      if (response.ok) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  return (
    <div>
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Homepage settings saved successfully!
        </div>
      )}

      <div className="space-y-4">
        {/* Hero Section */}
        <div className="card">
          <button
            onClick={() => toggleSection('hero')}
            className="w-full card-header flex items-center justify-between hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">Hero Section</h2>
            {expandedSection === 'hero' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {expandedSection === 'hero' && (
            <div className="card-body space-y-4">
              <div>
                <label className="label">Hero Title</label>
                <input
                  type="text"
                  value={heroSettings.hero_title}
                  onChange={(e) => setHeroSettings({ ...heroSettings, hero_title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Hero Subtitle</label>
                <textarea
                  value={heroSettings.hero_subtitle}
                  onChange={(e) => setHeroSettings({ ...heroSettings, hero_subtitle: e.target.value })}
                  className="textarea"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Primary Button Text</label>
                  <input
                    type="text"
                    value={heroSettings.hero_primary_button_text}
                    onChange={(e) => setHeroSettings({ ...heroSettings, hero_primary_button_text: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Primary Button Link</label>
                  <input
                    type="text"
                    value={heroSettings.hero_primary_button_link}
                    onChange={(e) => setHeroSettings({ ...heroSettings, hero_primary_button_link: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Secondary Button Text</label>
                  <input
                    type="text"
                    value={heroSettings.hero_secondary_button_text}
                    onChange={(e) => setHeroSettings({ ...heroSettings, hero_secondary_button_text: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Secondary Button Link</label>
                  <input
                    type="text"
                    value={heroSettings.hero_secondary_button_link}
                    onChange={(e) => setHeroSettings({ ...heroSettings, hero_secondary_button_link: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Background Image URL (optional)</label>
                <input
                  type="url"
                  value={heroSettings.hero_background_image}
                  onChange={(e) => setHeroSettings({ ...heroSettings, hero_background_image: e.target.value })}
                  className="input"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use the default gradient background
                </p>
              </div>

              {heroSettings.hero_background_image && (
                <div>
                  <label className="label">Background Overlay Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={heroSettings.hero_background_overlay}
                    onChange={(e) => setHeroSettings({ ...heroSettings, hero_background_overlay: e.target.value })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0% (No overlay)</span>
                    <span>{Math.round(parseFloat(heroSettings.hero_background_overlay) * 100)}%</span>
                    <span>100% (Full overlay)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* About Section */}
        <div className="card">
          <button
            onClick={() => toggleSection('about')}
            className="w-full card-header flex items-center justify-between hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">About Section</h2>
            {expandedSection === 'about' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {expandedSection === 'about' && (
            <div className="card-body space-y-4">
              <div>
                <label className="label">Section Title</label>
                <input
                  type="text"
                  value={aboutSettings.about_title}
                  onChange={(e) => setAboutSettings({ ...aboutSettings, about_title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={aboutSettings.about_description}
                  onChange={(e) => setAboutSettings({ ...aboutSettings, about_description: e.target.value })}
                  className="textarea"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Button Text</label>
                  <input
                    type="text"
                    value={aboutSettings.about_button_text}
                    onChange={(e) => setAboutSettings({ ...aboutSettings, about_button_text: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Button Link</label>
                  <input
                    type="text"
                    value={aboutSettings.about_button_link}
                    onChange={(e) => setAboutSettings({ ...aboutSettings, about_button_link: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="card">
          <button
            onClick={() => toggleSection('stats')}
            className="w-full card-header flex items-center justify-between hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">Stats Section</h2>
            {expandedSection === 'stats' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {expandedSection === 'stats' && (
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Stat 1 Value</label>
                  <input
                    type="text"
                    value={statsSettings.stats_1_value}
                    onChange={(e) => setStatsSettings({ ...statsSettings, stats_1_value: e.target.value })}
                    className="input"
                    placeholder="150+"
                  />
                </div>
                <div>
                  <label className="label">Stat 1 Label</label>
                  <input
                    type="text"
                    value={statsSettings.stats_1_label}
                    onChange={(e) => setStatsSettings({ ...statsSettings, stats_1_label: e.target.value })}
                    className="input"
                    placeholder="Events Hosted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Stat 2 Value</label>
                  <input
                    type="text"
                    value={statsSettings.stats_2_value}
                    onChange={(e) => setStatsSettings({ ...statsSettings, stats_2_value: e.target.value })}
                    className="input"
                    placeholder="50K+"
                  />
                </div>
                <div>
                  <label className="label">Stat 2 Label</label>
                  <input
                    type="text"
                    value={statsSettings.stats_2_label}
                    onChange={(e) => setStatsSettings({ ...statsSettings, stats_2_label: e.target.value })}
                    className="input"
                    placeholder="Visitors Attracted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Stat 3 Value</label>
                  <input
                    type="text"
                    value={statsSettings.stats_3_value}
                    onChange={(e) => setStatsSettings({ ...statsSettings, stats_3_value: e.target.value })}
                    className="input"
                    placeholder="$2M+"
                  />
                </div>
                <div>
                  <label className="label">Stat 3 Label</label>
                  <input
                    type="text"
                    value={statsSettings.stats_3_label}
                    onChange={(e) => setStatsSettings({ ...statsSettings, stats_3_label: e.target.value })}
                    className="input"
                    placeholder="Economic Impact"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Events Section */}
        <div className="card">
          <button
            onClick={() => toggleSection('upcoming')}
            className="w-full card-header flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Upcoming Events Section</h2>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  upcomingEventsSettings.upcoming_events_enabled === 'true'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {upcomingEventsSettings.upcoming_events_enabled === 'true' ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {expandedSection === 'upcoming' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {expandedSection === 'upcoming' && (
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Show Upcoming Events</p>
                  <p className="text-sm text-gray-500">
                    Display published events on the homepage
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={upcomingEventsSettings.upcoming_events_enabled === 'true'}
                    onChange={(e) =>
                      setUpcomingEventsSettings({
                        ...upcomingEventsSettings,
                        upcoming_events_enabled: e.target.checked ? 'true' : 'false',
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="label">Section Title</label>
                <input
                  type="text"
                  value={upcomingEventsSettings.upcoming_events_title}
                  onChange={(e) =>
                    setUpcomingEventsSettings({
                      ...upcomingEventsSettings,
                      upcoming_events_title: e.target.value,
                    })
                  }
                  className="input"
                />
              </div>

              <div>
                <label className="label">Section Subtitle</label>
                <textarea
                  value={upcomingEventsSettings.upcoming_events_subtitle}
                  onChange={(e) =>
                    setUpcomingEventsSettings({
                      ...upcomingEventsSettings,
                      upcoming_events_subtitle: e.target.value,
                    })
                  }
                  className="textarea"
                  rows={2}
                />
              </div>

              <div>
                <label className="label">Number of Events to Show</label>
                <select
                  value={upcomingEventsSettings.upcoming_events_limit}
                  onChange={(e) =>
                    setUpcomingEventsSettings({
                      ...upcomingEventsSettings,
                      upcoming_events_limit: e.target.value,
                    })
                  }
                  className="input"
                >
                  <option value="3">3 events</option>
                  <option value="6">6 events</option>
                  <option value="9">9 events</option>
                  <option value="12">12 events</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Only published events with future dates will be displayed
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="card">
          <button
            onClick={() => toggleSection('cta')}
            className="w-full card-header flex items-center justify-between hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">Call to Action Section</h2>
            {expandedSection === 'cta' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {expandedSection === 'cta' && (
            <div className="card-body space-y-4">
              <div>
                <label className="label">CTA Title</label>
                <input
                  type="text"
                  value={ctaSettings.cta_title}
                  onChange={(e) => setCtaSettings({ ...ctaSettings, cta_title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">CTA Description</label>
                <textarea
                  value={ctaSettings.cta_description}
                  onChange={(e) => setCtaSettings({ ...ctaSettings, cta_description: e.target.value })}
                  className="textarea"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Button Text</label>
                  <input
                    type="text"
                    value={ctaSettings.cta_button_text}
                    onChange={(e) => setCtaSettings({ ...ctaSettings, cta_button_text: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Button Link</label>
                  <input
                    type="text"
                    value={ctaSettings.cta_button_link}
                    onChange={(e) => setCtaSettings({ ...ctaSettings, cta_button_link: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Homepage Settings'}
        </button>
      </div>
    </div>
  );
}
