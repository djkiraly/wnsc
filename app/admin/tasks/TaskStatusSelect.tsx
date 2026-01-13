'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TaskStatusSelectProps {
  taskId: string;
  currentStatus: string;
}

const statuses = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function TaskStatusSelect({
  taskId,
  currentStatus,
}: TaskStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleChange = async (newStatus: string) => {
    setSaving(true);
    setStatus(newStatus);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        setStatus(currentStatus);
        alert('Failed to update status');
      } else {
        router.refresh();
      }
    } catch (error) {
      setStatus(currentStatus);
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className={`select text-sm ${
        status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
        status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700' :
        ''
      }`}
    >
      {statuses.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
