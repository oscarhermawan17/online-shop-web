'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductTable } from '@/components/admin';
import { LoadingPage, ErrorMessage, EmptyState } from '@/components/shared';
import { useAdminProducts } from '@/hooks';

export default function AdminProductsPage() {
  const { products, isLoading, isError, mutate } = useAdminProducts();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Produk"
        message="Tidak dapat memuat daftar produk"
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produk</h1>
          <p className="text-muted-foreground">{products.length} produk</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          type="products"
          title="Belum Ada Produk"
          description="Mulai dengan menambahkan produk pertama Anda."
          actionLabel="Tambah Produk"
          actionHref="/admin/products/new"
        />
      ) : (
        <ProductTable products={products} onDelete={() => mutate()} />
      )}
    </div>
  );
}
