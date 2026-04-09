'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState, OrderCard } from '@/components/shared';
import { fetcher } from '@/lib/api';
import { orderStatusLabels } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types/order';
import useSWR from 'swr';

const tabItems: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending_payment', label: 'Menunggu Bayar' },
  { value: 'paid', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'done', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { data: allOrders, isLoading } = useSWR<Order[]>(
    '/customer/orders',
    fetcher
  );

  const orders = allOrders?.filter(
    (o) => activeTab === 'all' || o.status === activeTab
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold">Riwayat Pesanan</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Riwayat Pesanan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lihat semua riwayat pesanan Anda
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          variant="pill"
          className="w-full justify-start overflow-x-auto"
        >
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="min-w-fit"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabItems.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {!orders || orders.length === 0 ? (
              <EmptyState
                type="orders"
                title="Belum Ada Pesanan"
                description={
                  activeTab === 'all'
                    ? 'Anda belum memiliki riwayat pesanan.'
                    : `Tidak ada pesanan dengan status "${orderStatusLabels[activeTab] || activeTab}"`
                }
                actionLabel={activeTab === 'all' ? 'Mulai Belanja' : undefined}
                actionHref={activeTab === 'all' ? '/' : undefined}
              />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {orders.length} pesanan
                </p>
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
