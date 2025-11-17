'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { Loading } from '@/components/ui/loading-spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Handle case where auth is not initialized
  if (!auth) {
    useEffect(() => {
      router.push('/login');
    }, [router]);
    return <Loading text="Initializing..." />;
  }

  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loading text="Authenticating..." />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
