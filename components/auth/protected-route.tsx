'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { Loading } from '@/components/ui/loading-spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Always call hooks at the top level
  const [user, loading, error] = auth ? useAuthState(auth) : [null, false, null];

  useEffect(() => {
    // Redirect if auth is not initialized or user is not logged in
    if (!auth || (!loading && !user)) {
      router.push('/login');
    }
  }, [auth, user, loading, router]);

  // Show loading state
  if (!auth || loading) {
    return <Loading text={!auth ? "Initializing..." : "Authenticating..."} />;
  }

  // Wait for auth check to complete
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
