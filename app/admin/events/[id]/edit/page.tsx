import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import EventForm from '../../EventForm';

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) {
    notFound();
  }

  // Convert dates to strings for the form
  const eventData = {
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
  };

  return <EventForm event={eventData} />;
}
