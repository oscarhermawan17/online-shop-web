'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerTable } from '@/components/admin';
import { LoadingPage, ErrorMessage, EmptyState } from '@/components/shared';
import { useAdminCustomers } from '@/hooks';

export default function AdminCustomersPage() {
  const { customers, isLoading, isError, mutate } = useAdminCustomers();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Pelanggan"
        message="Tidak dapat memuat daftar pelanggan"
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pelanggan</h1>
          <p className="text-muted-foreground">{customers.length} pelanggan</p>
        </div>
        <Button asChild>
          <Link href="/admin/customers/add">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pelanggan
          </Link>
        </Button>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          type="default"
          title="Belum Ada Pelanggan"
          description="Mulai dengan menambahkan pelanggan pertama Anda."
          actionLabel="Tambah Pelanggan"
          actionHref="/admin/customers/add"
        />
      ) : (
        <CustomerTable customers={customers} onStatusChange={() => mutate()} />
      )}
    </div>
  );
}
