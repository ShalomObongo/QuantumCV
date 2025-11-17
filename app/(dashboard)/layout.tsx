'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { NavBar } from '@/components/dashboard/nav-bar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
