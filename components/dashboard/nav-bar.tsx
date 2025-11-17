'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { signOut } from '@/lib/firebase/auth-utils';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';

export function NavBar() {
  const router = useRouter();
  const [user] = useAuthState(auth!);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">QuantumCV</span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link href="/generate">
            <Button variant="ghost">Generate</Button>
          </Link>
          <Link href="/history">
            <Button variant="ghost">History</Button>
          </Link>
          <ThemeToggle />
          <div className="flex items-center space-x-2 border-l pl-4">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {user?.displayName || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
