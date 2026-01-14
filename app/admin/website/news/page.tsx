import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, Newspaper, Eye, Edit, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import DeleteButton from './DeleteButton';

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status;

  const news = await prisma.news.findMany({
    where: {
      ...(status === 'published' ? { isPublished: true } : {}),
      ...(status === 'draft' ? { isPublished: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">News</h1>
          <p className="text-gray-600 mt-1">{news.length} total articles</p>
        </div>
        <Link href="/admin/website/news/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Article
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex gap-2">
            <Link
              href="/admin/website/news"
              className={`btn ${!status ? 'btn-primary' : 'btn-outline'}`}
            >
              All
            </Link>
            <Link
              href="/admin/website/news?status=published"
              className={`btn ${status === 'published' ? 'btn-primary' : 'btn-outline'}`}
            >
              Published
            </Link>
            <Link
              href="/admin/website/news?status=draft"
              className={`btn ${status === 'draft' ? 'btn-primary' : 'btn-outline'}`}
            >
              Drafts
            </Link>
          </div>
        </div>
      </div>

      {/* News Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {news.length > 0 ? (
                news.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {article.featuredImage ? (
                          <img
                            src={article.featuredImage}
                            alt={article.title}
                            className="h-10 w-16 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-16 rounded bg-gray-100 flex items-center justify-center">
                            <Newspaper className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{article.title}</div>
                          {article.excerpt && (
                            <p className="text-sm text-gray-500 line-clamp-1">{article.excerpt}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {article.publishedAt
                          ? formatDate(article.publishedAt)
                          : formatDate(article.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {article.isPublished ? (
                        <span className="badge badge-accent">Published</span>
                      ) : (
                        <span className="badge badge-gray">Draft</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {article.isPublished && (
                          <Link
                            href={`/news/${article.slug}`}
                            className="p-2 text-gray-400 hover:text-gray-600"
                            title="View"
                            target="_blank"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/website/news/${article.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteButton id={article.id} title={article.title} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No news articles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
