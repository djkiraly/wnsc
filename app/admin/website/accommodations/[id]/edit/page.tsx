import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import AccommodationForm from '../../AccommodationForm';
export default async function EditAccommodationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const accommodation = await prisma.accommodation.findUnique({ where: { id } });
  if (!accommodation) notFound();
  return <AccommodationForm accommodation={accommodation} />;
}
