'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderTable } from '@/components/admin';
import { LoadingPage, ErrorMessage, EmptyState } from '@/components/shared';
import { useAdminOrders } from '@/hooks';
import { orderStatusLabels } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const statusOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending_payment', label: orderStatusLabels.pending_payment },
  { value: 'waiting_confirmation', label: orderStatusLabels.waiting_confirmation },
  { value: 'paid', label: orderStatusLabels.paid },
  { value: 'shipped', label: orderStatusLabels.shipped },
  { value: 'done', label: orderStatusLabels.done },
  { value: 'expired_unpaid', label: orderStatusLabels.expired_unpaid },
  { value: 'cancelled', label: orderStatusLabels.cancelled },
];

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const status = statusFilter === 'all' ? undefined : (statusFilter as OrderStatus);
  
  const { orders, isLoading, isError, mutate } = useAdminOrders(status);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Pesanan"
        message="Tidak dapat memuat daftar pesanan"
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pesanan</h1>
          <p className="text-muted-foreground">{orders.length} pesanan</p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          type="orders"
          title="Belum Ada Pesanan"
          description={
            statusFilter === 'all'
              ? 'Pesanan akan muncul di sini ketika ada pembeli.'
              : `Tidak ada pesanan dengan status "${statusOptions.find((s) => s.value === statusFilter)?.label}"`
          }
        />
      ) : (
        <OrderTable orders={orders} onUpdate={() => mutate()} />
      )}
    </div>
  );
}
