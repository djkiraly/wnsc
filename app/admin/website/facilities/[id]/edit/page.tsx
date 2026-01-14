import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import FacilityForm from '../../FacilityForm';

export default async function EditFacilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const facility = await prisma.facility.findUnique({
    where: { id },
  });

  if (!facility) {
    notFound();
  }

  return <FacilityForm facility={facility} />;
}
