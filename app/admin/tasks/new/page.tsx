import prisma from '@/lib/prisma';
import TaskForm from '../TaskForm';

export default async function NewTaskPage() {
  const [users, events] = await Promise.all([
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.event.findMany({
      where: { status: { not: 'COMPLETED' } },
      select: { id: true, title: true },
      orderBy: { startDate: 'asc' },
    }),
  ]);

  return <TaskForm users={users} events={events} />;
}
