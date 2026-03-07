'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { Loading } from '@/components/shared';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check if we're on the login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Wait for Zustand to hydrate
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Skip auth check for login page
    if (isLoginPage) {
      // If already authenticated on login page, redirect to dashboard
      if (isAuthenticated()) {
        router.replace('/admin');
      }
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      router.replace('/admin/login');
    }
  }, [isHydrated, isAuthenticated, router, isLoginPage]);

  // For login page, render children directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading while checking auth (only for non-login pages)
  if (!isHydrated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading size="lg" text="Memuat..." />
      </div>
    );
  }

  return <>{children}</>;
}
