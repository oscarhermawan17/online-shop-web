import { Header, Footer } from '@/components/public';
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
      <main className="flex-1">{children}</main>
      <Footer storeName={storeName} />
    </div>
  );
}
