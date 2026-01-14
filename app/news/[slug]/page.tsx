import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Link from 'next/link';
import { Calendar, ArrowLeft, Share2 } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  return prisma.news.findFirst({
    where: {
      slug,
      isPublished: true,
      publishedAt: { lte: new Date() },
    },
  });
}

async function getRelatedArticles(currentId: string) {
  return prisma.news.findMany({
    where: {
      isPublished: true,
      publishedAt: { lte: new Date() },
      NOT: { id: currentId },
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'Article Not Found' };
  return {
    title: `${article.title} | Western Nebraska Sports Council`,
    description: article.metaDescription || article.excerpt || article.content.slice(0, 160),
  };
}

function formatDate(date: Date | null) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article.id);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/news" className="inline-flex items-center text-primary hover:underline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        {article.featuredImage && (
          <section className="bg-gray-900">
            <div className="container mx-auto">
              <div className="aspect-[21/9] max-h-[500px] overflow-hidden">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        <article className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <header className="mb-8">
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(article.publishedAt)}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {article.title}
                </h1>
                {article.excerpt && (
                  <p className="text-xl text-gray-600">{article.excerpt}</p>
                )}
              </header>

              {/* Content */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <div className="prose prose-lg max-w-none">
                  {article.content.split('\n').map((paragraph, i) => (
                    paragraph.trim() && <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Share */}
              <div className="mt-8 flex items-center gap-4">
                <span className="text-gray-600 font-medium">Share:</span>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: article.title,
                        url: window.location.href,
                      });
                    }
                  }}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="py-12 bg-white border-t">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">More News</h2>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/news/${related.slug}`}
                    className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {related.featuredImage && (
                      <div className="aspect-video bg-gray-200 overflow-hidden">
                        <img
                          src={related.featuredImage}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-sm text-gray-500 mb-2">{formatDate(related.publishedAt)}</p>
                      <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
