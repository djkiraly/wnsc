import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import TaskForm from '../../TaskForm';

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [task, users, events] = await Promise.all([
    prisma.task.findUnique({ where: { id } }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.event.findMany({
      select: { id: true, title: true },
      orderBy: { startDate: 'desc' },
    }),
  ]);

  if (!task) {
    notFound();
  }

  const taskData = {
    ...task,
    dueDate: task.dueDate?.toISOString() || null,
  };

  return <TaskForm task={taskData} users={users} events={events} />;
}
