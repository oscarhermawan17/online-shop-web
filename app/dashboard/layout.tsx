'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCustomerAuthStore } from '@/stores';
import { Loading } from '@/components/shared';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useCustomerAuthStore((state) => state.isAuthenticated);
  const token = useCustomerAuthStore((state) => state.token);
  const [isHydrated, setIsHydrated] = useState(false);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (isLoginPage) {
      if (isAuthenticated()) {
        router.replace('/dashboard');
      }
      return;
    }

    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [isHydrated, isAuthenticated, router, isLoginPage]);

  if (!isHydrated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading size="lg" text="Memuat..." />
      </div>
    );
  }

  return <>{children}</>;
}
