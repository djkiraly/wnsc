import prisma from '@/lib/prisma';
import ResourceForm from '../ResourceForm';
export default async function NewResourcePage() {
  const categories = await prisma.resource.findMany({ select: { category: true }, distinct: ['category'] });
  return <ResourceForm categories={categories.map((c) => c.category)} />;
}
