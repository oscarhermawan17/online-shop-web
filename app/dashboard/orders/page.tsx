'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';
import { OrderStatusBadge } from '@/components/public/order-status';
import { fetcher } from '@/lib/api';
import type { Order } from '@/types/order';
import useSWR from 'swr';

export default function OrdersPage() {
  const { data: orders, isLoading } = useSWR<Order[]>('/customer/orders', fetcher);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold">Riwayat Pesanan</h1>
        <div className="bg-white rounded-sm shadow-sm p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Riwayat Pesanan</h1>

      <div className="bg-white rounded-sm shadow-sm p-6">
        {!orders || orders.length === 0 ? (
          <EmptyState
            type="orders"
            title="Belum Ada Pesanan"
            description="Anda belum memiliki riwayat pesanan."
            actionLabel="Mulai Belanja"
            actionHref="/"
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="border-gray-200 shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      #{order.publicOrderId}
                    </CardTitle>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {order.items.length} item · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

