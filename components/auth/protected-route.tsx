'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { Loading } from '@/components/ui/loading-spinner';
import type { Auth } from 'firebase/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!auth) {
    return <Loading text="Initializing..." />;
  }

  return <ProtectedRouteWithAuth auth={auth}>{children}</ProtectedRouteWithAuth>;
}

function ProtectedRouteWithAuth({
  auth,
  children,
}: {
  auth: Auth;
  children: React.ReactNode;
}) {
  const router = useRouter();
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
