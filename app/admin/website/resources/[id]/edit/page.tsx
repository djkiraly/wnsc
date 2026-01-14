import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ResourceForm from '../../ResourceForm';
export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [resource, categories] = await Promise.all([
    prisma.resource.findUnique({ where: { id } }),
    prisma.resource.findMany({ select: { category: true }, distinct: ['category'] }),
  ]);
  if (!resource) notFound();
  return <ResourceForm resource={resource} categories={categories.map((c) => c.category)} />;
}
