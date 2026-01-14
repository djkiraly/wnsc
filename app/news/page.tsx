import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'News | Western Nebraska Sports Council',
  description: 'Stay updated with the latest news and announcements from the Western Nebraska Sports Council.',
};

async function getNews() {
  return prisma.news.findMany({
    where: {
      isPublished: true,
      publishedAt: { lte: new Date() },
    },
    orderBy: { publishedAt: 'desc' },
  });
}

function formatDate(date: Date | null) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export default async function NewsPage() {
  const articles = await getNews();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">News & Updates</h1>
            <p className="text-xl text-white/80">
              Stay informed about events, announcements, and stories from Western Nebraska sports.
            </p>
          </div>
        </section>

        {/* News Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {articles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group ${
                      index === 0 ? 'md:col-span-2 lg:col-span-3' : ''
                    }`}
                  >
                    {article.featuredImage && (
                      <div className={`bg-gray-200 overflow-hidden ${index === 0 ? 'aspect-[21/9]' : 'aspect-video'}`}>
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className={`p-6 ${index === 0 ? 'md:p-8' : ''}`}>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(article.publishedAt)}
                      </div>
                      <h2 className={`font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors ${
                        index === 0 ? 'text-2xl md:text-3xl' : 'text-xl'
                      }`}>
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className={`text-gray-600 mb-4 ${index === 0 ? 'text-lg' : 'line-clamp-3'}`}>
                          {article.excerpt}
                        </p>
                      )}
                      <span className="inline-flex items-center text-primary font-medium">
                        Read More
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg">No news articles yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
