'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Loader2, CheckCircle } from 'lucide-react';

interface MigrateLegacyUsersButtonProps {
  legacyCount: number;
}

export default function MigrateLegacyUsersButton({ legacyCount }: MigrateLegacyUsersButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleMigrate = async () => {
    if (!confirm(`This will mark ${legacyCount} existing user(s) as verified and approved. Continue?`)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrate-users', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message });
        router.refresh();
      } else {
        setResult({ success: false, message: data.error || 'Migration failed' });
      }
    } catch (error) {
      setResult({ success: false, message: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  if (result?.success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-green-800">{result.message}</span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-blue-900">Legacy Users Detected</h3>
          <p className="text-sm text-blue-700">
            {legacyCount} user(s) were created before the verification system.
            Click to mark them as verified and approved.
          </p>
        </div>
        <button
          onClick={handleMigrate}
          disabled={loading}
          className="btn btn-primary whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Migrating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Migrate Users
            </>
          )}
        </button>
      </div>
      {result && !result.success && (
        <p className="text-red-600 text-sm mt-2">{result.message}</p>
      )}
    </div>
  );
}
