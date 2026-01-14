import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import FAQForm from '../../FAQForm';

export default async function EditFAQPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [faq, categories] = await Promise.all([
    prisma.fAQ.findUnique({ where: { id } }),
    prisma.fAQ.findMany({
      select: { category: true },
      distinct: ['category'],
    }),
  ]);

  if (!faq) {
    notFound();
  }

  return <FAQForm faq={faq} categories={categories.map((c) => c.category)} />;
}
