'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, ToggleLeft, ToggleRight, Trash2, MoreVertical } from 'lucide-react';

interface UserActionsProps {
  user: {
    id: string;
    name: string;
    active: boolean;
    role: string;
    memberStatus: string;
  };
  currentUserId: string;
  isSuperAdmin: boolean;
}

export default function UserActions({ user, currentUserId, isSuperAdmin }: UserActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const isCurrentUser = user.id === currentUserId;
  const canModify = isSuperAdmin || (user.role === 'EDITOR');

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 192, // 192px = w-48
      });
    }
  }, [open]);

  const toggleActive = async () => {
    if (!canModify || isCurrentUser) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const deleteUser = async () => {
    if (!canModify || isCurrentUser) return;
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-gray-100 rounded-lg"
        disabled={loading}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>

            {canModify && !isCurrentUser && (
              <>
                <button
                  onClick={toggleActive}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={loading}
                >
                  {user.active ? (
                    <>
                      <ToggleLeft className="h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="h-4 w-4" />
                      Activate
                    </>
                  )}
                </button>

                <button
                  onClick={deleteUser}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}

            {isCurrentUser && (
              <p className="px-4 py-2 text-xs text-gray-400">
                Cannot modify your own account
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
