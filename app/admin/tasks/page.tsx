import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import TaskStatusSelect from './TaskStatusSelect';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const params = await searchParams;
  const status = params.status;
  const priority = params.priority;

  const tasks = await prisma.task.findMany({
    where: {
      ...(status && status !== 'all' ? { status: status as any } : {}),
      ...(priority && priority !== 'all' ? { priority: priority as any } : {}),
    },
    include: {
      assignedTo: {
        select: { name: true },
      },
      createdBy: {
        select: { name: true },
      },
      event: {
        select: { title: true },
      },
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { dueDate: 'asc' },
    ],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">{tasks.length} total tasks</p>
        </div>
        <Link href="/admin/tasks/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/admin/tasks"
          className={`btn ${!status || status === 'all' ? 'btn-primary' : 'btn-outline'}`}
        >
          All
        </Link>
        <Link
          href="/admin/tasks?status=TODO"
          className={`btn ${status === 'TODO' ? 'btn-primary' : 'btn-outline'}`}
        >
          To Do
        </Link>
        <Link
          href="/admin/tasks?status=IN_PROGRESS"
          className={`btn ${status === 'IN_PROGRESS' ? 'btn-primary' : 'btn-outline'}`}
        >
          In Progress
        </Link>
        <Link
          href="/admin/tasks?status=COMPLETED"
          className={`btn ${status === 'COMPLETED' ? 'btn-primary' : 'btn-outline'}`}
        >
          Completed
        </Link>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/admin/tasks/${task.id}/edit`}
                        className="text-lg font-semibold text-gray-900 hover:text-primary"
                      >
                        {task.title}
                      </Link>
                      <span className={`badge ${
                        task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        task.priority === 'MEDIUM' ? 'badge-secondary' :
                        'badge-gray'
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {formatDate(task.dueDate)}
                        </div>
                      )}
                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {task.assignedTo.name}
                        </div>
                      )}
                      {task.event && (
                        <span className="text-gray-400">
                          Event: {task.event.title}
                        </span>
                      )}
                    </div>
                  </div>

                  <TaskStatusSelect
                    taskId={task.id}
                    currentStatus={task.status}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <div className="card-body text-center py-12 text-gray-500">
              No tasks found
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
