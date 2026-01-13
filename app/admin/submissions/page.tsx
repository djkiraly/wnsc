import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import SubmissionsList from './SubmissionsList';

export default async function SubmissionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const submissions = await prisma.eventSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Get counts by status
  const statusCounts = await prisma.eventSubmission.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const counts = {
    all: submissions.length,
    PENDING: 0,
    UNDER_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
  };

  statusCounts.forEach((sc) => {
    counts[sc.status as keyof typeof counts] = sc._count.id;
  });

  // Serialize dates for client
  const serializedSubmissions = submissions.map((s) => ({
    ...s,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    reviewedAt: s.reviewedAt?.toISOString() || null,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Event Submissions</h1>
        <p className="text-gray-600 mt-1">Review and manage event submissions from the public</p>
      </div>

      <SubmissionsList
        submissions={serializedSubmissions}
        counts={counts}
      />
    </div>
  );
}
