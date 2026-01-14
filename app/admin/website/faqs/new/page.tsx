import prisma from '@/lib/prisma';
import FAQForm from '../FAQForm';

export default async function NewFAQPage() {
  const categories = await prisma.fAQ.findMany({
    select: { category: true },
    distinct: ['category'],
  });

  return <FAQForm categories={categories.map((c) => c.category)} />;
}
