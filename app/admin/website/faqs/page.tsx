import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, HelpCircle, ChevronDown, Edit } from 'lucide-react';
import DeleteButton from './DeleteButton';

export default async function FAQsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const categoryFilter = params.category;

  const faqs = await prisma.fAQ.findMany({
    where: categoryFilter ? { category: categoryFilter } : {},
    orderBy: [
      { category: 'asc' },
      { sortOrder: 'asc' },
    ],
  });

  const categories = await prisma.fAQ.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const cat = faq.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQs</h1>
          <p className="text-gray-600 mt-1">{faqs.length} total questions</p>
        </div>
        <Link href="/admin/website/faqs/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Link>
      </div>

      {/* Category Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/admin/website/faqs"
              className={`btn ${!categoryFilter ? 'btn-primary' : 'btn-outline'}`}
            >
              All Categories
            </Link>
            {categories.map((c) => (
              <Link
                key={c.category}
                href={`/admin/website/faqs?category=${encodeURIComponent(c.category)}`}
                className={`btn ${categoryFilter === c.category ? 'btn-primary' : 'btn-outline'}`}
              >
                {c.category}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* FAQs by Category */}
      <div className="space-y-6">
        {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
          <div key={category} className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {category}
              </h2>
              <span className="text-sm text-gray-500">{categoryFaqs.length} questions</span>
            </div>
            <div className="divide-y divide-gray-100">
              {categoryFaqs.map((faq) => (
                <div key={faq.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <ChevronDown className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{faq.question}</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!faq.isActive && (
                        <span className="badge badge-gray">Inactive</span>
                      )}
                      <span className="text-xs text-gray-400">#{faq.sortOrder}</span>
                      <Link
                        href={`/admin/website/faqs/${faq.id}/edit`}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <DeleteButton id={faq.id} question={faq.question} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {faqs.length === 0 && (
          <div className="card">
            <div className="card-body py-12 text-center text-gray-500">
              No FAQs found. Add your first FAQ to get started.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
