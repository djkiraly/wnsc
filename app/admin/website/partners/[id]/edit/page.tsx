import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import PartnerForm from '../../PartnerForm';

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const partner = await prisma.partner.findUnique({
    where: { id },
  });

  if (!partner) {
    notFound();
  }

  return <PartnerForm partner={partner} />;
}
