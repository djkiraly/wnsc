'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ContactStatusSelectProps {
  contactId: string;
  currentStatus: string;
}

const statuses = [
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function ContactStatusSelect({
  contactId,
  currentStatus,
}: ContactStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleChange = async (newStatus: string) => {
    setSaving(true);
    setStatus(newStatus);

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
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
      className="select text-sm"
    >
      {statuses.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
