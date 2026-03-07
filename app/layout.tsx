import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TokoKu - Belanja Online Mudah dan Terpercaya',
  description: 'TokoKu adalah toko online UMKM yang menyediakan berbagai produk berkualitas dengan harga terjangkau',
  keywords: ['toko online', 'umkm', 'belanja online', 'produk lokal'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
