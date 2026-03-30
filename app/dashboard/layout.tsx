'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCustomerAuthStore } from '@/stores';
import { Header, Footer, BottomNav } from '@/components/public';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
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
  const [storeName, setStoreName] = useState('Urban Outfit');

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    setIsHydrated(true);
    const fetchStore = async () => {
      const { getStoreInfo } = await import('@/lib/get-store-info');
      const info = await getStoreInfo();
      setStoreName(info.name);
    };
    fetchStore();
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

  // Dashboard usually has a grey background with white content areas
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <div className="hidden md:block">
        <Header storeName={storeName} />
      </div>
      {/* Main Content Area: Full width on mobile, max-width on desktop */}
      <div className="flex-1 w-full max-w-7xl mx-auto md:px-4 md:py-8 flex items-start gap-8">
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      <div className="hidden md:block mt-auto pb-16 md:pb-0">
        <Footer storeName={storeName} />
      </div>
      <BottomNav />
    </div>
  );
}
