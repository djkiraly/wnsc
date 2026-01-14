import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import NewsForm from '../../NewsForm';

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const article = await prisma.news.findUnique({
    where: { id },
  });

  if (!article) {
    notFound();
  }

  return (
    <NewsForm
      article={{
        ...article,
        publishedAt: article.publishedAt?.toISOString() || null,
      }}
    />
  );
}
