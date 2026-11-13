import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingState } from '../feedback/LoadingState';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isConfigured } = useAuth();
  if (loading) return <LoadingState fullPage message="Checking authentication…" />;
  if (!isConfigured) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <p className="text-amber-800 font-semibold">Authentication not configured</p>
        <p className="text-sm text-amber-700 mt-2">
          Set <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
          <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> in your{' '}
          <code className="bg-amber-100 px-1 rounded">.env</code> file, then restart the dev server.
        </p>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth/signin" replace />;
  return <>{children}</>;
}
