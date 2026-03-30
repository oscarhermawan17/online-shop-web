import { Header, Footer, BottomNav } from '@/components/public';

export const dynamic = 'force-dynamic';
import { getStoreInfo } from '@/lib/get-store-info';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name: storeName } = await getStoreInfo();

  return (
    <div className="flex min-h-screen flex-col">
      <Header storeName={storeName} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <div className="hidden md:block">
        <Footer storeName={storeName} />
      </div>
      <BottomNav />
    </div>
  );
}
