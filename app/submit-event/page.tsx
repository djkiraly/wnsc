import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Analytics from '@/components/public/Analytics';
import EventSubmissionForm from './EventSubmissionForm';
import { getRecaptchaSiteKeyAsync } from '@/lib/recaptcha';

export const metadata = {
  title: 'Submit an Event | Western Nebraska Sports Council',
  description: 'Submit your sporting event for consideration by the Western Nebraska Sports Council.',
};

export default async function SubmitEventPage() {
  const recaptchaSiteKey = await getRecaptchaSiteKeyAsync();

  return (
    <>
      <Analytics pageName="Submit Event" />
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-16">
          <div className="container-custom">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4">Submit Your Event</h1>
              <p className="text-xl text-primary-100">
                Have a sporting event you&apos;d like to host in Western Nebraska?
                Submit your event for consideration by our council.
              </p>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-12">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold">Event Details</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Please fill out all required fields. Our team will review your submission
                    and contact you within 5-7 business days.
                  </p>
                </div>
                <div className="card-body">
                  <EventSubmissionForm recaptchaSiteKey={recaptchaSiteKey} />
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1. Our team reviews your submission</li>
                  <li>2. We may reach out for additional information</li>
                  <li>3. If approved, we&apos;ll work with you to promote your event</li>
                  <li>4. Your event will be featured on our website and marketing materials</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
