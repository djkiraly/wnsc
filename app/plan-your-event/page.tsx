import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Link from 'next/link';
import { CheckCircle, FileText, Download, HelpCircle, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Plan Your Event | Western Nebraska Sports Council',
  description: 'Everything you need to plan and host a successful sporting event in Western Nebraska.',
};

async function getFAQs() {
  return prisma.fAQ.findMany({
    where: { isActive: true, category: 'Event Planning' },
    orderBy: { sortOrder: 'asc' },
    take: 6,
  });
}

async function getResources() {
  return prisma.resource.findMany({
    where: { isPublic: true },
    orderBy: { title: 'asc' },
    take: 6,
  });
}

async function getPartners() {
  return prisma.partner.findMany({
    where: { isActive: true, tier: { in: ['PRESENTING', 'GOLD'] } },
    orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
    take: 8,
  });
}

export default async function PlanYourEventPage() {
  const [faqs, resources, partners] = await Promise.all([
    getFAQs(),
    getResources(),
    getPartners(),
  ]);

  const planningSteps = [
    { title: 'Initial Inquiry', description: 'Reach out to our team with your event details and requirements.' },
    { title: 'Venue Selection', description: 'We help you find the perfect facility for your event.' },
    { title: 'Planning Support', description: 'Work with our team on logistics, accommodations, and promotion.' },
    { title: 'Event Execution', description: 'Host your event with our on-the-ground support.' },
    { title: 'Post-Event Review', description: 'Debrief and plan for future events together.' },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-primary text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Plan Your Sporting Event</h1>
              <p className="text-xl text-white/80 mb-8">
                From small tournaments to major championships, the Western Nebraska Sports Council
                is your partner in creating memorable sporting events.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* Planning Process */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Planning Process</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We make event planning simple with a proven process that ensures your event runs smoothly.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              {planningSteps.map((step, index) => (
                <div key={index} className="flex gap-6 mb-8 last:mb-0">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    {index < planningSteps.length - 1 && (
                      <div className="w-0.5 h-16 bg-primary/20 mx-auto mt-2" />
                    )}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Host Your Event Here?</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'World-Class Facilities', description: 'Modern venues equipped for any sport' },
                { title: 'Dedicated Support', description: 'Our team assists with every detail' },
                { title: 'Affordable Options', description: 'Competitive pricing for all budgets' },
                { title: 'Central Location', description: 'Easy access from major cities' },
              ].map((item, i) => (
                <div key={i} className="text-center p-6">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Resources */}
        {resources.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Planning Resources</h2>
                <p className="text-gray-600">Download helpful guides and documents for your event planning.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                  >
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{resource.title}</h4>
                      <p className="text-sm text-gray-500">{resource.fileType.toUpperCase()}</p>
                    </div>
                    <Download className="h-5 w-5 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              </div>
              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq) => (
                  <details key={faq.id} className="group bg-gray-50 rounded-lg">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                      <span className="font-semibold text-gray-900">{faq.question}</span>
                      <ChevronDown className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-4 text-gray-600">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/contact" className="text-primary font-medium hover:underline inline-flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Have more questions? Contact us
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Partners */}
        {partners.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Partners</h2>
                <p className="text-gray-600">Organizations supporting sporting events in Western Nebraska.</p>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-8">
                {partners.map((partner) => (
                  <div key={partner.id} className="grayscale hover:grayscale-0 transition-all">
                    {partner.logoUrl ? (
                      <img src={partner.logoUrl} alt={partner.name} className="h-16 max-w-[150px] object-contain" />
                    ) : (
                      <span className="text-gray-600 font-semibold">{partner.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-accent text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Contact us today to begin planning your next sporting event in Western Nebraska.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-block bg-white text-accent px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/facilities"
                className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                View Facilities
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
