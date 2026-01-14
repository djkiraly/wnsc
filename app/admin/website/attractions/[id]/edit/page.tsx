import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import AttractionForm from '../../AttractionForm';

export default async function EditAttractionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attraction = await prisma.attraction.findUnique({ where: { id } });
  if (!attraction) notFound();
  return <AttractionForm attraction={attraction} />;
}
