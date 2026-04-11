import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { getStoreInfo } from '@/lib/get-store-info';
import './globals.css';
import 'leaflet/dist/leaflet.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export async function generateMetadata(): Promise<Metadata> {
  const { name, description } = await getStoreInfo();
  return {
    title: `${name} - Mitra Grosir UMKM Terpercaya`,
    description: description || 'Mitra terpercaya untuk pemenuhan kebutuhan stok warung, toko kelontong, dan bisnis UMKM Anda di seluruh Indonesia.',
    keywords: ['grosir', 'umkm', 'sembako', 'peralatan rumah', 'toko kelontong'],
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${plusJakartaSans.className} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
