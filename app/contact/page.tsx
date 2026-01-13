import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Analytics from '@/components/public/Analytics';
import ContactForm from './ContactForm';
import { getRecaptchaSiteKeyAsync } from '@/lib/recaptcha';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | Western Nebraska Sports Council',
  description: 'Get in touch with the Western Nebraska Sports Council. We are here to help you with your sporting event needs.',
};

export default async function ContactPage() {
  const recaptchaSiteKey = await getRecaptchaSiteKeyAsync();

  return (
    <>
      <Analytics pageName="Contact" />
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-16">
          <div className="container-custom">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
              <p className="text-xl text-primary-100">
                Have questions or want to discuss hosting an event? We&apos;d love to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <div className="lg:col-span-1 space-y-6">
                <div className="card p-6">
                  <h2 className="text-xl font-semibold mb-6">Get in Touch</h2>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Email</h3>
                        <a
                          href="mailto:info@westernnebraskasports.org"
                          className="text-primary hover:underline"
                        >
                          info@westernnebraskasports.org
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Phone</h3>
                        <a
                          href="tel:+13085551234"
                          className="text-primary hover:underline"
                        >
                          (308) 555-1234
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Location</h3>
                        <p className="text-gray-600">
                          Western Nebraska
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Office Hours</h3>
                        <p className="text-gray-600">
                          Monday - Friday<br />
                          9:00 AM - 5:00 PM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
                  <ul className="space-y-2">
                    <li>
                      <a href="/submit-event" className="text-primary hover:underline flex items-center gap-2">
                        Submit an Event
                      </a>
                    </li>
                    <li>
                      <a href="/events" className="text-primary hover:underline flex items-center gap-2">
                        View Upcoming Events
                      </a>
                    </li>
                    <li>
                      <a href="/about" className="text-primary hover:underline flex items-center gap-2">
                        About the Council
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-xl font-semibold">Send Us a Message</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Fill out the form below and we&apos;ll get back to you as soon as possible.
                    </p>
                  </div>
                  <div className="card-body">
                    <ContactForm recaptchaSiteKey={recaptchaSiteKey} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
